# Laravel Scout

- [简介](#introduction)
- [安装](#installation)
    - [队列](#queueing)
- [驱动前提条件](#driver-prerequisites)
- [配置](#configuration)
    - [配置可搜索数据](#configuring-searchable-data)
- [数据库/集合引擎](#database-and-collection-engines)
    - [数据库引擎](#database-engine)
    - [集合引擎](#collection-engine)
- [第三方引擎配置](#third-party-engine-configuration)
    - [配置模型索引](#configuring-model-indexes)
    - [Algolia](#algolia-configuration)
    - [Meilisearch](#meilisearch-configuration)
    - [Typesense](#typesense-configuration)
- [第三方引擎索引](#indexing)
    - [批量导入](#batch-import)
    - [添加记录](#adding-records)
    - [更新记录](#updating-records)
    - [删除记录](#removing-records)
    - [暂停索引](#pausing-indexing)
    - [条件性可搜索模型实例](#conditionally-searchable-model-instances)
- [搜索](#searching)
    - [Where 子句](#where-clauses)
    - [分页](#pagination)
    - [软删除](#soft-deleting)
    - [自定义引擎搜索](#customizing-engine-searches)
- [自定义引擎](#custom-engines)

<a name="introduction"></a>
## 简介

[Laravel Scout](https://github.com/laravel/scout) 提供了一个简单、基于驱动的解决方案，用于为你的 [Eloquent 模型](/docs/{{version}}/eloquent)添加全文搜索。使用模型观察器，Scout 会自动保持你的搜索索引与 Eloquent 记录同步。

Scout 内置了一个 `database` 引擎，它使用 MySQL/PostgreSQL 全文索引和 `LIKE` 子句来搜索你现有的数据库——无需外部服务。对于大多数应用程序来说，这就是你所需要的。有关 Laravel 中所有可用搜索选项的概述，请查阅[搜索文档](/docs/{{version}}/search)。

当你需要容错、分面过滤或大规模地理搜索等功能时，Scout 还包含适用于 [Algolia](https://www.algolia.com/)、[Meilisearch](https://www.meilisearch.com) 和 [Typesense](https://typesense.org) 的驱动。还提供了一个用于本地开发的"集合"驱动，你也可以自由地编写[自定义引擎](#custom-engines)。

<a name="installation"></a>
## 安装

首先，通过 Composer 包管理器安装 Scout：

```shell
composer require laravel/scout
```

安装 Scout 后，你应该使用 `vendor:publish` Artisan 命令发布 Scout 配置文件。此命令会将 `scout.php` 配置文件发布到应用程序的 `config` 目录：

```shell
php artisan vendor:publish --provider="Laravel\Scout\ScoutServiceProvider"
```

最后，将 `Laravel\Scout\Searchable` trait 添加到你想要使其可搜索的模型中。此 trait 将注册一个模型观察器，自动保持模型与搜索驱动的同步：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Searchable;

class Post extends Model
{
    use Searchable;
}
```

<a name="queueing"></a>
### 队列

当使用非 `database` 或 `collection` 引擎时，你应强烈考虑在使用该库之前配置一个[队列驱动](/docs/{{version}}/queues)。运行队列工作进程将允许 Scout 将所有将模型信息同步到搜索索引的操作排队，从而为应用程序的 Web 界面提供更好的响应时间。

一旦你配置了队列驱动，将 `config/scout.php` 配置文件中的 `queue` 选项的值设置为 `true`：

```php
'queue' => true,
```

即使 `queue` 选项设置为 `false`，重要的是要记住一些 Scout 驱动（如 Algolia 和 Meilisearch）总是异步索引记录。换句话说，即使索引操作已在你的 Laravel 应用程序中完成，搜索引擎本身可能不会立即反映新记录和更新后的记录。

要指定 Scout 作业使用的连接和队列，你可以将 `queue` 配置选项定义为一个数组：

```php
'queue' => [
    'connection' => 'redis',
    'queue' => 'scout'
],
```

当然，如果你自定义了 Scout 作业使用的连接和队列，你应该运行一个队列工作进程来处理该连接和队列上的作业：

```shell
php artisan queue:work redis --queue=scout
```

<a name="unique-jobs"></a>
#### 唯一作业

在写入密集型应用程序中，你可能希望防止 Scout 对同一模型记录排队的重复作业。你可以通过注册 `MakeSearchableUniquely` 和 `RemoveFromSearchUniquely` 作业类来选择使用唯一索引作业，通常在服务提供者的 `boot` 方法中：

```php
use Laravel\Scout\Jobs\MakeSearchableUniquely;
use Laravel\Scout\Jobs\RemoveFromSearchUniquely;
use Laravel\Scout\Scout;

Scout::makeSearchableUsing(MakeSearchableUniquely::class);
Scout::removeFromSearchUsing(RemoveFromSearchUniquely::class);
```

这些作业使用 Laravel 的[唯一作业锁](/docs/{{version}}/queues#unique-jobs)来避免在相同可搜索模型记录的匹配作业已排队时分派重复的排队索引操作。

<a name="driver-prerequisites"></a>
## 驱动前提条件

<a name="algolia"></a>
### Algolia

使用 Algolia 驱动时，你应在 `config/scout.php` 配置文件中配置你的 Algolia `id` 和 `secret` 凭证。配置好凭证后，你还需要通过 Composer 包管理器安装 Algolia PHP SDK：

```shell
composer require algolia/algoliasearch-client-php
```

<a name="meilisearch"></a>
### Meilisearch

[Meilisearch](https://www.meilisearch.com) 是一个快速、开源搜索引擎。如果你不确定如何在本地机器上安装 Meilisearch，可以使用 [Laravel Sail](/docs/{{version}}/sail#meilisearch)，Laravel 官方支持的 Docker 开发环境。

使用 Meilisearch 驱动时，你需要通过 Composer 包管理器安装 Meilisearch PHP SDK：

```shell
composer require meilisearch/meilisearch-php http-interop/http-factory-guzzle
```

然后，在你的应用程序的 `.env` 文件中设置 `SCOUT_DRIVER` 环境变量以及你的 Meilisearch `host` 和 `key` 凭证：

```ini
SCOUT_DRIVER=meilisearch
MEILISEARCH_HOST=http://127.0.0.1:7700
MEILISEARCH_KEY=masterKey
```

有关 Meilisearch 的更多信息，请查阅 [Meilisearch 文档](https://docs.meilisearch.com/learn/getting_started/quick_start.html)。

此外，通过查阅 [Meilisearch 关于二进制兼容性的文档](https://github.com/meilisearch/meilisearch-php#-compatibility-with-meilisearch)，确保你安装的 `meilisearch/meilisearch-php` 版本与你的 Meilisearch 二进制版本兼容。

> [!WARNING]
> 在使用 Meilisearch 的应用程序上升级 Scout 时，你应始终[查看 Meilisearch 服务本身的任何额外破坏性更改](https://github.com/meilisearch/Meilisearch/releases)。

<a name="typesense"></a>
### Typesense

[Typesense](https://typesense.org) 是一个极速、开源搜索引擎，支持关键词搜索、语义搜索、地理搜索和向量搜索。

你可以[自托管](https://typesense.org/docs/guide/install-typesense.html#option-2-local-machine-self-hosting) Typesense 或使用 [Typesense Cloud](https://cloud.typesense.org)。

要开始使用 Scout 的 Typesense，通过 Composer 包管理器安装 Typesense PHP SDK：

```shell
composer require typesense/typesense-php
```

然后，在你的应用程序的 .env 文件中设置 `SCOUT_DRIVER` 环境变量以及你的 Typesense 主机和 API 密钥凭证：

```ini
SCOUT_DRIVER=typesense
TYPESENSE_API_KEY=masterKey
TYPESENSE_HOST=localhost
```

如果你使用 [Laravel Sail](/docs/{{version}}/sail)，你可能需要调整 `TYPESENSE_HOST` 环境变量以匹配 Docker 容器名称。你还可以选择指定安装的端口、路径和协议：

```ini
TYPESENSE_PORT=8108
TYPESENSE_PATH=
TYPESENSE_PROTOCOL=http
```

Typesense 集合的其他设置和模式定义可以在应用程序的 `config/scout.php` 配置文件中找到。有关 Typesense 的更多信息，请查阅 [Typesense 文档](https://typesense.org/docs/guide/#quick-start)。

<a name="configuration"></a>
## 配置

<a name="configuring-searchable-data"></a>
### 配置可搜索数据

默认情况下，给定模型的整个 `toArray` 形式将持久化到其搜索索引。如果你想自定义同步到搜索索引的数据，可以覆盖模型上的 `toSearchableArray` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Searchable;

class Post extends Model
{
    use Searchable;

    /**
     * 获取模型的可索引数据数组。
     *
     * @return array<string, mixed>
     */
    public function toSearchableArray(): array
    {
        $array = $this->toArray();

        // 自定义数据数组...

        return $array;
    }
}
```

<a name="configuring-search-engines-per-model"></a>
#### 配置模型引擎

搜索时，Scout 通常会使用应用程序 `scout` 配置文件中指定的默认搜索引擎。但是，可以通过覆盖模型上的 `searchableUsing` 方法来更改特定模型的搜索引擎：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Engines\Engine;
use Laravel\Scout\Scout;
use Laravel\Scout\Searchable;

class User extends Model
{
    use Searchable;

    /**
     * 获取用于索引模型的引擎。
     */
    public function searchableUsing(): Engine
    {
        return Scout::engine('meilisearch');
    }
}
```

<a name="database-and-collection-engines"></a>
## 数据库/集合引擎

<a name="database-engine"></a>
### 数据库引擎

> [!WARNING]
> 数据库引擎目前支持 MySQL 和 PostgreSQL，两者都支持快速的全文列索引。

`database` 引擎使用 MySQL/PostgreSQL 全文索引和 `LIKE` 子句直接搜索你现有的数据库。对于许多应用程序来说，这是添加搜索最简单、最实用的方式——无需外部服务或额外基础设施。

要使用数据库引擎，将 `SCOUT_DRIVER` 环境变量设置为 `database`：

```ini
SCOUT_DRIVER=database
```

配置完成后，你可以[定义可搜索数据](#configuring-searchable-data)并开始对模型[执行搜索查询](#searching)。与第三方引擎不同，数据库引擎不需要单独的索引步骤——它直接搜索你的数据库表。

#### 自定义数据库搜索策略

默认情况下，数据库引擎会对你[配置为可搜索](#configuring-searchable-data)的每个模型属性执行 `LIKE` 查询。但是，你可以为特定列分配更高效的搜索策略。`SearchUsingFullText` 属性将对该列使用数据库的全文索引，而 `SearchUsingPrefix` 将仅匹配字符串的开头（`example%`），而不是在整个字符串中搜索（`%example%`）。

要定义此行为，将 PHP 属性分配给模型的 `toSearchableArray` 方法。没有属性的列将继续使用默认的 `LIKE` 策略：

```php
use Laravel\Scout\Attributes\SearchUsingFullText;
use Laravel\Scout\Attributes\SearchUsingPrefix;

/**
 * 获取模型的可索引数据数组。
 *
 * @return array<string, mixed>
 */
#[SearchUsingPrefix(['id', 'email'])]
#[SearchUsingFullText(['bio'])]
public function toSearchableArray(): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
        'bio' => $this->bio,
    ];
}
```

> [!WARNING]
> 在指定列应使用全文查询约束之前，确保该列已分配了[全文索引](/docs/{{version}}/migrations#available-index-types)。

<a name="collection-engine"></a>
### 集合引擎

"集合"引擎适用于快速原型设计、极小的数据集（几百条记录）或运行测试。它会从数据库中检索所有可能的记录，并使用 Laravel 的 `Str::is` 助手在 PHP 中进行过滤，因此不需要任何索引或数据库特定功能。对于超出简单用例的情况，你应改用[数据库引擎](#database-engine)。

要使用集合引擎，你可以简单地将 `SCOUT_DRIVER` 环境变量的值设置为 `collection`，或直接在应用程序的 `scout` 配置文件中指定 `collection` 驱动：

```ini
SCOUT_DRIVER=collection
```

一旦你指定了集合驱动作为首选驱动，你就可以开始对模型[执行搜索查询](#searching)。使用集合引擎时，不需要搜索引擎索引，例如填充 Algolia、Meilisearch 或 Typesense 索引所需的索引。

#### 与数据库引擎的区别

数据库引擎使用全文索引和 `LIKE` 子句来高效地查找匹配记录，而集合引擎则拉取所有记录并在 PHP 中进行过滤。集合引擎是最可移植的选项，因为它适用于 Laravel 支持的所有关系数据库（包括 SQLite 和 SQL Server）；但是，它的效率远低于数据库引擎，不应与大型数据集一起使用。

<a name="third-party-engine-configuration"></a>
## 第三方引擎配置

以下配置选项仅在使用第三方搜索引擎（如 Algolia、Meilisearch 或 Typesense）时才相关。如果你使用[数据库引擎](#database-engine)，可以跳过此部分。

<a name="configuring-model-indexes"></a>
### 配置模型索引

使用第三方引擎时，每个 Eloquent 模型都会与一个特定的搜索"索引"同步，该索引包含该模型的所有可搜索记录。默认情况下，每个模型将持久化到一个与模型典型"表"名称匹配的索引。通常，这是模型名称的复数形式；但是，你可以自由地通过覆盖模型上的 `searchableAs` 方法来自定义模型的索引：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Searchable;

class Post extends Model
{
    use Searchable;

    /**
     * 获取与模型关联的索引名称。
     */
    public function searchableAs(): string
    {
        return 'posts_index';
    }
}
```

> [!NOTE]
> `searchableAs` 方法在使用数据库引擎时无效，数据库引擎始终直接搜索模型的数据库表。

<a name="configuring-the-model-id"></a>
#### 配置模型 ID

默认情况下，Scout 将使用模型的主键作为存储在搜索索引中的模型唯一 ID/键。如果使用第三方引擎时需要自定义此行为，可以覆盖模型上的 `getScoutKey` 和 `getScoutKeyName` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Searchable;

class User extends Model
{
    use Searchable;

    /**
     * 获取用于索引模型的值。
     */
    public function getScoutKey(): mixed
    {
        return $this->email;
    }

    /**
     * 获取用于索引模型的键名。
     */
    public function getScoutKeyName(): mixed
    {
        return 'email';
    }
}
```

> [!NOTE]
> `getScoutKey` 和 `getScoutKeyName` 方法在使用数据库引擎时无效，数据库引擎始终使用模型的主键。

<a name="algolia-configuration"></a>
### Algolia

<a name="algolia-index-settings"></a>
#### 索引设置

有时你可能希望配置 Algolia 索引上的额外设置。虽然你可以通过 Algolia UI 管理这些设置，但有时直接从应用程序的 `config/scout.php` 配置文件中管理索引配置的所需状态会更高效。

这种方法允许你通过应用程序的自动化部署管道部署这些设置，避免手动配置并确保跨多个环境的一致性。你可以配置可过滤属性、排名、分面或[任何其他支持的设置](https://www.algolia.com/doc/rest-api/search/#tag/Indices/operation/setSettings)。

要开始使用，为应用程序 `config/scout.php` 配置文件中的每个索引添加设置：

```php
use App\Models\User;
use App\Models\Flight;

'algolia' => [
    'id' => env('ALGOLIA_APP_ID', ''),
    'secret' => env('ALGOLIA_SECRET', ''),
    'index-settings' => [
        User::class => [
            'searchableAttributes' => ['id', 'name', 'email'],
            'attributesForFaceting'=> ['filterOnly(email)'],
            // 其他设置字段...
        ],
        Flight::class => [
            'searchableAttributes'=> ['id', 'destination'],
        ],
    ],
],
```

如果给定索引的基础模型是可软删除的并且包含在 `index-settings` 数组中，Scout 将自动在该索引上包含软删除模型的分面支持。如果你没有其他分面属性需要为可软删除的模型索引定义，可以简单地为该模型在 `index-settings` 数组中添加一个空条目：

```php
'index-settings' => [
    Flight::class => []
],
```

配置好应用程序的索引设置后，必须调用 `scout:sync-index-settings` Artisan 命令。此命令将通知 Algolia 你当前配置的索引设置。为了方便起见，你可能希望将此命令作为部署过程的一部分：

```shell
php artisan scout:sync-index-settings
```

<a name="algolia-identifying-users"></a>
#### 识别用户

Scout 允许你在使用 Algolia 时自动识别用户。将已验证的用户与搜索操作关联起来，在查看 Algolia 仪表盘中的搜索分析时可能很有帮助。你可以通过在应用程序的 `.env` 文件中将 `SCOUT_IDENTIFY` 环境变量定义为 `true` 来启用用户识别：

```ini
SCOUT_IDENTIFY=true
```

启用此功能还会将请求的 IP 地址和已验证用户的主要标识符传递给 Algolia，以便这些数据与用户进行的任何搜索请求关联。

<a name="meilisearch-configuration"></a>
### Meilisearch

<a name="meilisearch-index-settings"></a>
#### 索引设置

Meilisearch 要求你预先定义索引搜索设置，例如可过滤属性、可排序属性和[其他支持的设置字段](https://docs.meilisearch.com/reference/api/settings.html)。

可过滤属性是你计划在调用 Scout 的 `where` 方法时进行过滤的任何属性，而可排序属性是你计划在调用 Scout 的 `orderBy` 方法时进行排序的任何属性。要定义你的索引设置，在应用程序的 `scout` 配置文件中调整 `meilisearch` 配置项的 `index-settings` 部分：

```php
use App\Models\User;
use App\Models\Flight;

'meilisearch' => [
    'host' => env('MEILISEARCH_HOST', 'http://localhost:7700'),
    'key' => env('MEILISEARCH_KEY', null),
    'index-settings' => [
        User::class => [
            'filterableAttributes'=> ['id', 'name', 'email'],
            'sortableAttributes' => ['created_at'],
            // 其他设置字段...
        ],
        Flight::class => [
            'filterableAttributes'=> ['id', 'destination'],
            'sortableAttributes' => ['updated_at'],
        ],
    ],
],
```

如果给定索引的基础模型是可软删除的并且包含在 `index-settings` 数组中，Scout 将自动在该索引上包含软删除模型的过滤支持。如果你没有其他可过滤或可排序属性需要为可软删除的模型索引定义，可以简单地为该模型在 `index-settings` 数组中添加一个空条目：

```php
'index-settings' => [
    Flight::class => []
],
```

配置好应用程序的索引设置后，必须调用 `scout:sync-index-settings` Artisan 命令。此命令将通知 Meilisearch 你当前配置的索引设置。为了方便起见，你可能希望将此命令作为部署过程的一部分：

```shell
php artisan scout:sync-index-settings
```

<a name="meilisearch-data-types"></a>
#### 可搜索数据类型

Meilisearch 只对正确类型的数据执行过滤操作（`>`、`<` 等）。自定义可搜索数据时，应确保数值被转换为正确的类型：

```php
public function toSearchableArray()
{
    return [
        'id' => (int) $this->id,
        'name' => $this->name,
        'price' => (float) $this->price,
    ];
}
```

<a name="typesense-configuration"></a>
### Typesense

<a name="typesense-searchable-data"></a>
#### 准备可搜索数据

使用 Typesense 时，你的可搜索模型必须定义一个 `toSearchableArray` 方法，该方法将模型的主键转换为字符串，并将创建日期转换为 UNIX 时间戳：

```php
/**
 * 获取模型的可索引数据数组。
 *
 * @return array<string, mixed>
 */
public function toSearchableArray(): array
{
    return array_merge($this->toArray(),[
        'id' => (string) $this->id,
        'created_at' => $this->created_at->timestamp,
    ]);
}
```

你还应在应用程序的 `config/scout.php` 文件中定义 Typesense 集合模式。集合模式描述了通过 Typesense 可搜索的每个字段的数据类型。有关所有可用模式选项的更多信息，请查阅 [Typesense 文档](https://typesense.org/docs/latest/api/collections.html#schema-parameters)。

如果你需要在定义后更改 Typesense 集合的模式，可以运行 `scout:flush` 和 `scout:import`，这将删除所有现有索引数据并重新创建模式。或者，你可以使用 Typesense 的 API 修改集合模式，而无需删除任何索引数据。

如果你的可搜索模型是可软删除的，应在应用程序的 `config/scout.php` 配置文件中，在模型对应的 Typesense 模式中定义一个 `__soft_deleted` 字段：

```php
User::class => [
    'collection-schema' => [
        'fields' => [
            // ...
            [
                'name' => '__soft_deleted',
                'type' => 'int32',
                'optional' => true,
            ],
        ],
    ],
],
```

<a name="typesense-dynamic-search-parameters"></a>
#### 动态搜索参数

Typesense 允许你通过 `options` 方法在执行搜索操作时动态修改[搜索参数](https://typesense.org/docs/latest/api/search.html#search-parameters)：

```php
use App\Models\Todo;

Todo::search('Groceries')->options([
    'query_by' => 'title, description'
])->get();
```

<a name="indexing"></a>
## 第三方引擎索引

> [!NOTE]
> 本节描述的索引功能主要适用于使用第三方引擎（Algolia、Meilisearch 或 Typesense）的情况。数据库引擎直接搜索你的数据库表，因此不需要手动索引管理。

<a name="batch-import"></a>
### 批量导入

如果你正在将 Scout 安装到现有项目中，你可能已经有需要导入到索引的数据库记录。Scout 提供了一个 `scout:import` Artisan 命令，你可以使用它将所有现有记录导入到搜索索引中：

```shell
php artisan scout:import "App\Models\Post"
```

`scout:queue-import` 命令可用于使用[队列作业](/docs/{{version}}/queues)导入所有现有记录：

```shell
php artisan scout:queue-import "App\Models\Post" --chunk=500
```

`flush` 命令可用于从搜索索引中删除模型的所有记录：

```shell
php artisan scout:flush "App\Models\Post"
```

<a name="modifying-the-import-query"></a>
#### 修改导入查询

如果你想修改用于检索所有模型进行批量导入的查询，可以在模型上定义一个 `makeAllSearchableUsing` 方法。这是添加在导入模型之前可能需要的任何预加载关系的好地方：

```php
use Illuminate\Database\Eloquent\Builder;

/**
 * 修改用于使所有模型可搜索时检索模型的查询。
 */
protected function makeAllSearchableUsing(Builder $query): Builder
{
    return $query->with('author');
}
```

> [!WARNING]
> `makeAllSearchableUsing` 方法在使用队列批量导入模型时可能不适用。当模型集合由作业处理时，关系[不会被恢复](/docs/{{version}}/queues#handling-relationships)。

<a name="adding-records"></a>
### 添加记录

一旦你向模型添加了 `Laravel\Scout\Searchable` trait，你只需要 `save` 或 `create` 一个模型实例，它就会自动添加到你的搜索索引中。如果你已配置 Scout [使用队列](#queueing)，此操作将由你的队列工作进程在后台执行：

```php
use App\Models\Order;

$order = new Order;

// ...

$order->save();
```

<a name="adding-records-via-query"></a>
#### 通过查询添加记录

如果你想通过 Eloquent 查询将模型集合添加到搜索索引，可以将 `searchable` 方法链式调用到 Eloquent 查询上。`searchable` 方法会将查询结果[分块](/docs/{{version}}/eloquent#chunking-results)并将记录添加到你的搜索索引。同样，如果你已配置 Scout 使用队列，所有分块将由你的队列工作进程在后台导入：

```php
use App\Models\Order;

Order::where('price', '>', 100)->searchable();
```

你也可以在 Eloquent 关系实例上调用 `searchable` 方法：

```php
$user->orders()->searchable();
```

或者，如果你已经在内存中有一个 Eloquent 模型集合，可以在集合实例上调用 `searchable` 方法，将模型实例添加到其对应的索引：

```php
$orders->searchable();
```

> [!NOTE]
> `searchable` 方法可以被视为一个"upsert"操作。换句话说，如果模型记录已存在于索引中，它将被更新。如果它不存在于搜索索引中，它将被添加到索引中。

<a name="updating-records"></a>
### 更新记录

要更新一个可搜索模型，你只需要更新模型实例的属性并将模型 `save` 到数据库。Scout 会自动将更改持久化到你的搜索索引：

```php
use App\Models\Order;

$order = Order::find(1);

// 更新订单...

$order->save();
```

你也可以在 Eloquent 查询实例上调用 `searchable` 方法，以更新模型集合。如果模型不存在于你的搜索索引中，它们将被创建：

```php
Order::where('price', '>', 100)->searchable();
```

如果你想更新关系中所有模型的搜索索引记录，可以在关系实例上调用 `searchable` 方法：

```php
$user->orders()->searchable();
```

或者，如果你已经在内存中有一个 Eloquent 模型集合，可以在集合实例上调用 `searchable` 方法，以更新其对应索引中的模型实例：

```php
$orders->searchable();
```

<a name="modifying-records-before-importing"></a>
#### 在导入前修改记录

有时你可能需要在模型变为可搜索之前准备模型集合。例如，你可能希望预加载一个关系，以便关系数据可以高效地添加到搜索索引中。为此，在相应模型上定义一个 `makeSearchableUsing` 方法：

```php
use Illuminate\Database\Eloquent\Collection;

/**
 * 修改正在变为可搜索的模型集合。
 */
public function makeSearchableUsing(Collection $models): Collection
{
    return $models->load('author');
}
```

<a name="conditionally-updating-the-search-index"></a>
#### 条件性更新搜索索引

默认情况下，Scout 会重新索引更新后的模型，无论修改了哪些属性。如果你想自定义此行为，可以在模型上定义一个 `searchIndexShouldBeUpdated` 方法：

```php
/**
 * 确定搜索索引是否应更新。
 */
public function searchIndexShouldBeUpdated(): bool
{
    return $this->wasRecentlyCreated || $this->wasChanged(['title', 'body']);
}
```

<a name="removing-records"></a>
### 删除记录

要从索引中删除记录，你可以简单地从数据库中 `delete` 模型。即使你使用[软删除](/docs/{{version}}/eloquent#soft-deleting)模型，也可以这样做：

```php
use App\Models\Order;

$order = Order::find(1);

$order->delete();
```

如果你不想在删除记录之前检索模型，可以在 Eloquent 查询实例上使用 `unsearchable` 方法：

```php
Order::where('price', '>', 100)->unsearchable();
```

如果你想删除关系中所有模型的搜索索引记录，可以在关系实例上调用 `unsearchable` 方法：

```php
$user->orders()->unsearchable();
```

或者，如果你已经在内存中有一个 Eloquent 模型集合，可以在集合实例上调用 `unsearchable` 方法，从对应索引中删除模型实例：

```php
$orders->unsearchable();
```

要从对应索引中删除所有模型记录，可以调用 `removeAllFromSearch` 方法：

```php
Order::removeAllFromSearch();
```

<a name="pausing-indexing"></a>
### 暂停索引

有时你可能需要对模型执行批量 Eloquent 操作，而不将模型数据同步到搜索索引。你可以使用 `withoutSyncingToSearch` 方法来实现。此方法接受一个闭包，该闭包会立即执行。在闭包内发生的任何模型操作都不会同步到模型的索引：

```php
use App\Models\Order;

Order::withoutSyncingToSearch(function () {
    // 执行模型操作...
});
```

<a name="conditionally-searchable-model-instances"></a>
### 条件性可搜索模型实例

有时你可能需要仅在特定条件下使模型可搜索。例如，假设你有一个 `App\Models\Post` 模型，它可以处于两种状态之一："草稿"和"已发布"。你可能只想允许"已发布"的文章可搜索。为此，你可以在模型上定义一个 `shouldBeSearchable` 方法：

```php
/**
 * 确定模型是否应可搜索。
 */
public function shouldBeSearchable(): bool
{
    return $this->isPublished();
}
```

`shouldBeSearchable` 方法仅在通过 `save` 和 `create` 方法、查询或关系操作模型时应用。直接使用 `searchable` 方法使模型或集合可搜索将覆盖 `shouldBeSearchable` 方法的结果。

> [!WARNING]
> `shouldBeSearchable` 方法不适用于 Scout 的"database"引擎，因为所有可搜索数据始终存储在数据库中。使用数据库引擎时，要实现类似行为，应改用 [where 子句](#where-clauses)。

<a name="searching"></a>
## 搜索

你可以使用 `search` 方法开始搜索模型。`search` 方法接受一个字符串，用于搜索你的模型。然后，你应将 `get` 方法链式调用到搜索查询上，以检索与给定搜索查询匹配的 Eloquent 模型：

```php
use App\Models\Order;

$orders = Order::search('Star Trek')->get();
```

由于 Scout 搜索返回的是 Eloquent 模型集合，你甚至可以直接从路由或控制器返回结果，它们将自动转换为 JSON：

```php
use App\Models\Order;
use Illuminate\Http\Request;

Route::get('/search', function (Request $request) {
    return Order::search($request->search)->get();
});
```

如果你想在转换为 Eloquent 模型之前获取原始搜索结果，可以使用 `raw` 方法：

```php
$orders = Order::search('Star Trek')->raw();
```

<a name="custom-indexes"></a>
#### 自定义索引

使用第三方引擎搜索时，搜索查询通常会对模型 `searchableAs` 方法指定的索引执行。但是，你可以使用 `within` 方法指定要搜索的自定义索引：

```php
$orders = Order::search('Star Trek')
    ->within('tv_shows_popularity_desc')
    ->get();
```

<a name="where-clauses"></a>
### Where 子句

Scout 允许你向搜索查询添加"where"子句。例如，基本的相等性检查可用于按所有者 ID 限定搜索查询的范围：

```php
use App\Models\Order;

$orders = Order::search('Star Trek')->where('user_id', 1)->get();
```

你也可以使用 `=`、`!=`、`<`、`>`、`>=`、`<=` 比较运算符来构建更高级的查询：

```php
Order::search('Star Trek')
  ->where('status', '=', 'completed')
  ->where('is_refunded', '!=', true)
  ->where('total_price', '>', 100)
  ->where('shipping_cost', '<', 20)
  ->where('discount_percent', '>=', 10)
  ->where('item_count', '<=', 5)
  ->get();
```

此外，`whereIn` 方法可用于验证给定列的值是否包含在给定数组中：

```php
$orders = Order::search('Star Trek')->whereIn(
    'status', ['open', 'paid']
)->get();
```

`whereNotIn` 方法验证给定列的值不包含在给定数组中：

```php
$orders = Order::search('Star Trek')->whereNotIn(
    'status', ['closed']
)->get();
```

> [!WARNING]
> 如果你的应用程序使用 Meilisearch，在使用 Scout 的"where"子句之前，必须配置应用程序的[可过滤属性](#meilisearch-index-settings)。

<a name="customizing-the-eloquent-results-query"></a>
#### 自定义 Eloquent 结果查询

在 Scout 从应用程序的搜索引擎检索到匹配的 Eloquent 模型列表后，Eloquent 被用于按主键检索所有匹配的模型。你可以通过调用 `query` 方法来自定义此查询。`query` 方法接受一个闭包，该闭包将接收 Eloquent 查询构建器实例作为参数：

```php
use App\Models\Order;
use Illuminate\Database\Eloquent\Builder;

$orders = Order::search('Star Trek')
    ->query(fn (Builder $query) => $query->with('invoices'))
    ->get();
```

使用第三方引擎时，此回调在相关模型已从搜索引擎检索后调用，因此不应将其用于"过滤"结果——请改用 [Scout where 子句](#where-clauses)。但是，使用数据库引擎时，`query` 方法的约束直接应用于数据库查询，因此你也可以将其用于过滤。

<a name="pagination"></a>
### 分页

除了检索模型集合，你还可以使用 `paginate` 方法对搜索结果进行分页。此方法将返回一个 `Illuminate\Pagination\LengthAwarePaginator` 实例，就像你对[传统 Eloquent 查询进行分页](/docs/{{version}}/pagination)一样：

```php
use App\Models\Order;

$orders = Order::search('Star Trek')->paginate();
```

你可以通过将数量作为第一个参数传递给 `paginate` 方法来指定每页检索多少个模型：

```php
$orders = Order::search('Star Trek')->paginate(15);
```

使用数据库引擎时，你也可以使用 `simplePaginate` 方法。与检索匹配记录总数以显示页码的 `paginate` 不同，`simplePaginate` 仅确定当前页之外是否还有更多结果——这对于只需要"上一页"和"下一页"链接的大型数据集更高效：

```php
$orders = Order::search('Star Trek')->simplePaginate(15);
```

检索结果后，你可以使用 [Blade](/docs/{{version}}/blade) 显示结果并渲染页面链接，就像对传统 Eloquent 查询进行分页一样：

```html
<div class="container">
    @foreach ($orders as $order)
        {{ $order->price }}
    @endforeach
</div>

{{ $orders->links() }}
```

当然，如果你希望以 JSON 格式检索分页结果，可以直接从路由或控制器返回分页器实例：

```php
use App\Models\Order;
use Illuminate\Http\Request;

Route::get('/orders', function (Request $request) {
    return Order::search($request->input('query'))->paginate(15);
});
```

> [!WARNING]
> 由于搜索引擎不知道你的 Eloquent 模型的全局作用域定义，你不应在使用 Scout 分页的应用程序中使用全局作用域。或者，你应该在通过 Scout 搜索时重新创建全局作用域的约束。

<a name="soft-deleting"></a>
### 软删除

如果你的索引模型是[软删除](/docs/{{version}}/eloquent#soft-deleting)的，并且你需要搜索已软删除的模型，将 `config/scout.php` 配置文件中的 `soft_delete` 选项设置为 `true`：

```php
'soft_delete' => true,
```

当此配置选项为 `true` 时，Scout 不会从搜索索引中删除软删除的模型。相反，它会在索引记录上设置一个隐藏的 `__soft_deleted` 属性。然后，你可以在搜索时使用 `withTrashed` 或 `onlyTrashed` 方法来检索软删除的记录：

```php
use App\Models\Order;

// 检索结果时包含已软删除的记录...
$orders = Order::search('Star Trek')->withTrashed()->get();

// 检索结果时仅包含已软删除的记录...
$orders = Order::search('Star Trek')->onlyTrashed()->get();
```

> [!NOTE]
> 当软删除的模型使用 `forceDelete` 永久删除时，Scout 会自动将其从搜索索引中移除。

<a name="customizing-engine-searches"></a>
### 自定义引擎搜索

如果你需要对引擎的搜索行为进行高级自定义，可以将一个闭包作为第二个参数传递给 `search` 方法。例如，你可以使用此回调在搜索查询传递给 Algolia 之前向搜索选项添加地理位置数据：

```php
use Algolia\AlgoliaSearch\SearchIndex;
use App\Models\Order;

Order::search(
    'Star Trek',
    function (SearchIndex $algolia, string $query, array $options) {
        $options['body']['query']['bool']['filter']['geo_distance'] = [
            'distance' => '1000km',
            'location' => ['lat' => 36, 'lon' => 111],
        ];

        return $algolia->search($query, $options);
    }
)->get();
```

<a name="custom-engines"></a>
## 自定义引擎

<a name="writing-the-engine"></a>
#### 编写引擎

如果内置的 Scout 搜索引擎不符合你的需求，你可以编写自己的自定义引擎并向 Scout 注册。你的引擎应扩展 `Laravel\Scout\Engines\Engine` 抽象类。此抽象类包含你的自定义引擎必须实现的八个方法：

```php
use Laravel\Scout\Builder;

abstract public function update($models);
abstract public function delete($models);
abstract public function search(Builder $builder);
abstract public function paginate(Builder $builder, $perPage, $page);
abstract public function mapIds($results);
abstract public function map(Builder $builder, $results, $model);
abstract public function getTotalCount($results);
abstract public function flush($model);
```

查看 `Laravel\Scout\Engines\AlgoliaEngine` 类中这些方法的实现可能会有所帮助。该类将为你提供一个良好的起点，学习如何在自己的引擎中实现这些方法。

<a name="registering-the-engine"></a>
#### 注册引擎

编写好自定义引擎后，你可以使用 Scout 引擎管理器的 `extend` 方法向 Scout 注册它。Scout 的引擎管理器可以从 Laravel 服务容器中解析。你应该在 `App\Providers\AppServiceProvider` 类的 `boot` 方法或应用程序使用的任何其他服务提供者中调用 `extend` 方法：

```php
use App\ScoutExtensions\MySqlSearchEngine;
use Laravel\Scout\EngineManager;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    resolve(EngineManager::class)->extend('mysql', function () {
        return new MySqlSearchEngine;
    });
}
```

引擎注册后，你可以将其指定为应用程序 `config/scout.php` 配置文件中的默认 Scout `driver`：

```php
'driver' => 'mysql',
```

# Eloquent：入门指南

- [简介](#introduction)
- [生成模型类](#generating-model-classes)
- [Eloquent 模型约定](#eloquent-model-conventions)
    - [表名](#table-names)
    - [主键](#primary-keys)
    - [UUID 和 ULID 键](#uuid-and-ulid-keys)
    - [时间戳](#timestamps)
    - [数据库连接](#database-connections)
    - [默认属性值](#default-attribute-values)
    - [配置 Eloquent 严格模式](#configuring-eloquent-strictness)
- [检索模型](#retrieving-models)
    - [集合](#collections)
    - [分块结果](#chunking-results)
    - [使用惰性集合分块](#chunking-using-lazy-collections)
    - [游标](#cursors)
    - [高级子查询](#advanced-subqueries)
- [检索单个模型 / 聚合](#retrieving-single-models)
    - [检索或创建模型](#retrieving-or-creating-models)
    - [检索聚合](#retrieving-aggregates)
- [插入和更新模型](#inserting-and-updating-models)
    - [插入](#inserts)
    - [更新](#updates)
    - [批量赋值](#mass-assignment)
    - [更新或插入](#upserts)
- [删除模型](#deleting-models)
    - [软删除](#soft-deleting)
    - [查询软删除模型](#querying-soft-deleted-models)
- [修剪模型](#pruning-models)
- [复制模型](#replicating-models)
- [查询作用域](#query-scopes)
    - [全局作用域](#global-scopes)
    - [本地作用域](#local-scopes)
    - [待定属性](#pending-attributes)
- [比较模型](#comparing-models)
- [事件](#events)
    - [使用闭包](#events-using-closures)
    - [观察器](#observers)
    - [静默事件](#muting-events)

<a name="introduction"></a>
## 简介

Laravel 包含了 Eloquent，一个对象关系映射器（ORM），它让你能够愉快地与数据库进行交互。使用 Eloquent 时，每个数据库表都有一个对应的"模型"，用于与该表进行交互。除了从数据库表中检索记录外，Eloquent 模型还允许你插入、更新和删除表中的记录。

> [!NOTE]
> 在开始之前，请确保在应用程序的 `config/database.php` 配置文件中配置了数据库连接。有关配置数据库的更多信息，请查看[数据库配置文档](/docs/{{version}}/database#configuration)。

<a name="generating-model-classes"></a>
## 生成模型类

首先，让我们创建一个 Eloquent 模型。模型通常位于 `app\Models` 目录中，并继承 `Illuminate\Database\Eloquent\Model` 类。你可以使用 `make:model` [Artisan 命令](/docs/{{version}}/artisan)来生成一个新模型：

```shell
php artisan make:model Flight
```

如果你希望在生成模型的同时生成[数据库迁移](/docs/{{version}}/migrations)，可以使用 `--migration` 或 `-m` 选项：

```shell
php artisan make:model Flight --migration
```

你可以在生成模型时生成各种其他类型的类，例如工厂、种子器、策略、控制器和表单请求。此外，这些选项可以组合使用，以一次创建多个类：

```shell
# 生成模型和 FlightFactory 类...
php artisan make:model Flight --factory
php artisan make:model Flight -f

# 生成模型和 FlightSeeder 类...
php artisan make:model Flight --seed
php artisan make:model Flight -s

# 生成模型和 FlightController 类...
php artisan make:model Flight --controller
php artisan make:model Flight -c

# 生成模型、FlightController 资源类和表单请求类...
php artisan make:model Flight --controller --resource --requests
php artisan make:model Flight -crR

# 生成模型和 FlightPolicy 类...
php artisan make:model Flight --policy

# 生成模型以及迁移、工厂、种子器和控制器...
php artisan make:model Flight -mfsc

# 快捷方式：生成模型、迁移、工厂、种子器、策略、控制器和表单请求...
php artisan make:model Flight --all
php artisan make:model Flight -a

# 生成中间模型...
php artisan make:model Member --pivot
php artisan make:model Member -p
```

<a name="inspecting-models"></a>
#### 检查模型

有时仅通过浏览代码很难确定模型的所有可用属性和关系。这时可以尝试 `model:show` Artisan 命令，它提供了模型所有属性和关系的便捷概览：

```shell
php artisan model:show Flight
```

<a name="eloquent-model-conventions"></a>
## Eloquent 模型约定

通过 `make:model` 命令生成的模型将放置在 `app/Models` 目录中。让我们检查一个基本的模型类，并讨论 Eloquent 的一些关键约定：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Flight extends Model
{
    // ...
}
```

<a name="table-names"></a>
### 表名

看完上面的示例，你可能已经注意到我们没有告诉 Eloquent `Flight` 模型对应哪个数据库表。按照约定，除非显式指定其他名称，否则将使用类的"蛇形命名"复数名称作为表名。因此，在这种情况下，Eloquent 将假定 `Flight` 模型将记录存储在 `flights` 表中，而 `AirTrafficController` 模型将把记录存储在 `air_traffic_controllers` 表中。

如果你的模型对应的数据库表不符合此约定，你可以使用 `Table` 属性手动指定模型的表名：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Model;

#[Table('my_flights')]
class Flight extends Model
{
    // ...
}
```

<a name="primary-keys"></a>
### 主键

Eloquent 还会假定每个模型对应的数据库表都有一个名为 `id` 的主键列。如有必要，你可以使用 `Table` 属性的 `key` 参数指定用作模型主键的其他列：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Model;

#[Table(key: 'flight_id')]
class Flight extends Model
{
    // ...
}
```

此外，Eloquent 假定主键是一个递增的整数值，这意味着 Eloquent 会自动将主键转换为整数。如果你希望使用非递增或非数字的主键，应在 `Table` 属性上指定 `keyType` 和 `incrementing` 参数：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Model;

#[Table(key: 'uuid', keyType: 'string', incrementing: false)]
class Flight extends Model
{
    // ...
}
```

如果你只需要禁用自动递增 ID，可以使用 `WithoutIncrementing` 属性：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Model;

#[WithoutIncrementing]
class Flight extends Model
{
    // ...
}
```

<a name="composite-primary-keys"></a>
#### "复合"主键

Eloquent 要求每个模型至少有一个唯一标识的"ID"作为其主键。Eloquent 模型不支持"复合"主键。但是，你可以在数据库表中添加额外的多列唯一索引，以及表的唯一标识主键。

<a name="uuid-and-ulid-keys"></a>
### UUID 和 ULID 键

你可以选择使用 UUID 而不是自增整数作为 Eloquent 模型的主键。UUID 是 36 字符长的通用唯一字母数字标识符。

如果你希望模型使用 UUID 键而不是自增整数键，可以在模型上使用 `Illuminate\Database\Eloquent\Concerns\HasUuids` trait。当然，你应该确保模型有一个[UUID 等效的主键列](/docs/{{version}}/migrations#column-method-uuid)：

```php
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Article extends Model
{
    use HasUuids;

    // ...
}

$article = Article::create(['title' => 'Traveling to Europe']);

$article->id; // "018f2b5c-6a7f-7b12-9d6f-2f8a4e0c9c11"
```

默认情况下，`HasUuids` trait 将为你的模型生成 [UUIDv7](/docs/{{version}}/strings#method-str-uuid7) 标识符。这些 UUID 对于索引数据库存储更高效，因为它们可以按字典顺序排序。

你可以通过定义模型的 `newUniqueId` 方法来覆盖给定模型的 UUID 生成过程。此外，你可以通过定义模型的 `uniqueIds` 方法来指定哪些列应接收 UUID：

```php
use Ramsey\Uuid\Uuid;

/**
 * 为模型生成一个新的 UUID。
 */
public function newUniqueId(): string
{
    return (string) Uuid::uuid4();
}

/**
 * 获取应接收唯一标识符的列。
 *
 * @return array<int, string>
 */
public function uniqueIds(): array
{
    return ['id', 'discount_code'];
}
```

如果你愿意，也可以选择使用"ULID"而不是 UUID。ULID 与 UUID 类似，但只有 26 个字符长。像有序 UUID 一样，ULID 可以按字典顺序排序，以实现高效的数据库索引。要使用 ULID，你应该在模型上使用 `Illuminate\Database\Eloquent\Concerns\HasUlids` trait。你还应该确保模型有一个[ULID 等效的主键列](/docs/{{version}}/migrations#column-method-ulid)：

```php
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class Article extends Model
{
    use HasUlids;

    // ...
}

$article = Article::create(['title' => 'Traveling to Asia']);

$article->id; // "01gd4d3tgrrfqeda94gdbtdk5c"
```

<a name="timestamps"></a>
### 时间戳

默认情况下，Eloquent 期望模型的对应数据库表中存在 `created_at` 和 `updated_at` 列。当模型被创建或更新时，Eloquent 会自动设置这些列的值。如果你不希望 Eloquent 自动管理这些列，可以在模型的 `Table` 属性中将 `timestamps` 设置为 `false`：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Model;

#[Table(timestamps: false)]
class Flight extends Model
{
    // ...
}
```

如果你只需要禁用时间戳，可以使用 `WithoutTimestamps` 属性：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\WithoutTimestamps;
use Illuminate\Database\Eloquent\Model;

#[WithoutTimestamps]
class Flight extends Model
{
    // ...
}
```

如果你需要自定义模型时间戳的格式，可以使用 `Table` 属性的 `dateFormat` 参数。这决定了日期属性在数据库中的存储方式，以及模型序列化为数组或 JSON 时的格式：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Model;

#[Table(dateFormat: 'U')]
class Flight extends Model
{
    // ...
}
```

如果你只需要定义日期格式，可以使用 `DateFormat` 属性：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\DateFormat;
use Illuminate\Database\Eloquent\Model;

#[DateFormat('U')]
class Flight extends Model
{
    // ...
}
```

如果你需要自定义用于存储时间戳的列名，可以在模型上定义 `CREATED_AT` 和 `UPDATED_AT` 常量：

```php
<?php

class Flight extends Model
{
    /**
     * "created at" 列的名称。
     *
     * @var string|null
     */
    public const CREATED_AT = 'creation_date';

    /**
     * "updated at" 列的名称。
     *
     * @var string|null
     */
    public const UPDATED_AT = 'updated_date';
}
```

如果你希望在执行模型操作时不修改模型的 `updated_at` 时间戳，可以在 `withoutTimestamps` 方法提供的闭包内操作模型：

```php
Model::withoutTimestamps(fn () => $post->increment('reads'));
```

<a name="database-connections"></a>
### 数据库连接

默认情况下，所有 Eloquent 模型将使用为应用程序配置的默认数据库连接。如果你希望指定与特定模型交互时应使用的不同连接，可以使用 `Connection` 属性：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Connection;
use Illuminate\Database\Eloquent\Model;

#[Connection('mysql')]
class Flight extends Model
{
    // ...
}
```

<a name="default-attribute-values"></a>
### 默认属性值

默认情况下，新实例化的模型实例不包含任何属性值。如果你希望为模型的某些属性定义默认值，可以在模型上定义 `$attributes` 属性。放置在 `$attributes` 数组中的属性值应为原始的"可存储"格式，就像刚从数据库中读取一样：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Flight extends Model
{
    /**
     * 模型的属性默认值。
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'options' => '[]',
        'delayed' => false,
    ];
}
```

<a name="configuring-eloquent-strictness"></a>
### 配置 Eloquent 严格模式

Laravel 提供了几种方法，允许你在各种情况下配置 Eloquent 的行为和"严格模式"。

首先，`preventLazyLoading` 方法接受一个可选的布尔参数，指示是否应防止惰性加载。例如，你可能希望仅在生产环境之外禁用惰性加载，这样即使生产代码中意外存在惰性加载的关系，你的生产环境也能正常运行。通常，此方法应在应用程序的 `AppServiceProvider` 的 `boot` 方法中调用：

```php
use Illuminate\Database\Eloquent\Model;

/**
 * 启动应用程序服务。
 */
public function boot(): void
{
    Model::preventLazyLoading(! $this->app->isProduction());
}
```

此外，你可以通过调用 `preventSilentlyDiscardingAttributes` 方法，指示 Laravel 在尝试填充不可填充的属性时抛出异常。这有助于在本地开发期间防止尝试设置尚未添加到模型 `fillable` 数组中的属性时出现意外错误：

```php
Model::preventSilentlyDiscardingAttributes(! $this->app->isProduction());
```

<a name="retrieving-models"></a>
## 检索模型

创建模型及其[关联的数据库表](/docs/{{version}}/migrations#generating-migrations)后，你就可以开始从数据库中检索数据了。你可以将每个 Eloquent 模型视为一个强大的[查询构建器](/docs/{{version}}/queries)，允许你流畅地查询与模型关联的数据库表。模型的 `all` 方法将检索模型关联数据库表中的所有记录：

```php
use App\Models\Flight;

foreach (Flight::all() as $flight) {
    echo $flight->name;
}
```

<a name="building-queries"></a>
#### 构建查询

Eloquent 的 `all` 方法将返回模型表中的所有结果。但是，由于每个 Eloquent 模型都充当[查询构建器](/docs/{{version}}/queries)，你可以向查询添加其他约束，然后调用 `get` 方法来检索结果：

```php
$flights = Flight::where('active', 1)
    ->orderBy('name')
    ->limit(10)
    ->get();
```

> [!NOTE]
> 由于 Eloquent 模型是查询构建器，你应该查看 Laravel [查询构建器](/docs/{{version}}/queries)提供的所有方法。在编写 Eloquent 查询时，你可以使用其中任何方法。

<a name="refreshing-models"></a>
#### 刷新模型

如果你已有从数据库检索到的 Eloquent 模型实例，可以使用 `fresh` 和 `refresh` 方法"刷新"模型。`fresh` 方法将从数据库中重新检索模型。现有模型实例不受影响：

```php
$flight = Flight::where('number', 'FR 900')->first();

$freshFlight = $flight->fresh();
```

`refresh` 方法将使用数据库中的新数据重新填充现有模型。此外，其所有已加载的关系也将被刷新：

```php
$flight = Flight::where('number', 'FR 900')->first();

$flight->number = 'FR 456';

$flight->refresh();

$flight->number; // "FR 900"
```

<a name="collections"></a>
### 集合

如我们所见，像 `all` 和 `get` 这样的 Eloquent 方法从数据库中检索多条记录。但是，这些方法不返回普通的 PHP 数组。相反，返回的是 `Illuminate\Database\Eloquent\Collection` 的实例。

Eloquent 的 `Collection` 类扩展了 Laravel 的基础 `Illuminate\Support\Collection` 类，该类提供了[各种有用的方法](/docs/{{version}}/collections#available-methods)用于处理数据集合。例如，`reject` 方法可用于根据调用闭包的结果从集合中移除模型：

```php
$flights = Flight::where('destination', 'Paris')->get();

$flights = $flights->reject(function (Flight $flight) {
    return $flight->cancelled;
});
```

除了 Laravel 基础集合类提供的方法外，Eloquent 集合类还提供了[一些额外的方法](/docs/{{version}}/eloquent-collections#available-methods)，专门用于与 Eloquent 模型集合进行交互。

由于所有 Laravel 集合都实现了 PHP 的可迭代接口，你可以像遍历数组一样遍历集合：

```php
foreach ($flights as $flight) {
    echo $flight->name;
}
```

<a name="chunking-results"></a>
### 分块结果

如果你尝试通过 `all` 或 `get` 方法加载数万条 Eloquent 记录，应用程序可能会耗尽内存。可以使用 `chunk` 方法更高效地处理大量模型，而不是使用这些方法。

`chunk` 方法将检索 Eloquent 模型的子集，并将其传递给闭包进行处理。由于每次只检索当前块的 Eloquent 模型，因此 `chunk` 方法在处理大量模型时将显著减少内存使用：

```php
use App\Models\Flight;
use Illuminate\Database\Eloquent\Collection;

Flight::chunk(200, function (Collection $flights) {
    foreach ($flights as $flight) {
        // ...
    }
});
```

传递给 `chunk` 方法的第一个参数是你希望每个"块"接收的记录数。作为第二个参数传递的闭包将为从数据库检索到的每个块调用。将执行一个数据库查询来检索传递给闭包的每个记录块。

如果你基于一个在遍历结果时也在更新的列来过滤 `chunk` 方法的结果，则应使用 `chunkById` 方法。在这些场景中使用 `chunk` 方法可能导致意外和不一致的结果。在内部，`chunkById` 方法将始终检索 `id` 列大于前一块中最后一个模型的模型：

```php
Flight::where('departed', true)
    ->chunkById(200, function (Collection $flights) {
        $flights->each->update(['departed' => false]);
    }, column: 'id');
```

由于 `chunkById` 和 `lazyById` 方法会向正在执行的查询添加自己的"where"条件，因此你应该通常在闭包内[逻辑分组](/docs/{{version}}/queries#logical-grouping)自己的条件：

```php
Flight::where(function ($query) {
    $query->where('delayed', true)->orWhere('cancelled', true);
})->chunkById(200, function (Collection $flights) {
    $flights->each->update([
        'departed' => false,
        'cancelled' => true
    ]);
}, column: 'id');
```

<a name="chunking-using-lazy-collections"></a>
### 使用惰性集合分块

`lazy` 方法的工作方式类似于[`chunk` 方法](#chunking-results)，因为它在幕后分块执行查询。但是，`lazy` 方法不是将每个块直接传递给回调，而是返回一个扁平的 Eloquent 模型 [LazyCollection](/docs/{{version}}/collections#lazy-collections)，让你可以像处理单个流一样与结果交互：

```php
use App\Models\Flight;

foreach (Flight::lazy() as $flight) {
    // ...
}
```

如果你基于一个在遍历结果时也在更新的列来过滤 `lazy` 方法的结果，则应使用 `lazyById` 方法。在内部，`lazyById` 方法将始终检索 `id` 列大于前一块中最后一个模型的模型：

```php
Flight::where('departed', true)
    ->lazyById(200, column: 'id')
    ->each->update(['departed' => false]);
```

你可以使用 `lazyByIdDesc` 方法基于 `id` 的降序过滤结果。

<a name="cursors"></a>
### 游标

与 `lazy` 方法类似，`cursor` 方法可用于在遍历数万条 Eloquent 模型记录时显著减少应用程序的内存消耗。

`cursor` 方法只会执行单个数据库查询；但是，单个 Eloquent 模型在真正被遍历之前不会被填充。因此，在遍历游标时，任何时候都只有一个 Eloquent 模型保存在内存中。

> [!WARNING]
> 由于 `cursor` 方法一次只在内存中保存一个 Eloquent 模型，因此它无法预加载关系。如果你需要预加载关系，请考虑使用[`lazy` 方法](#chunking-using-lazy-collections)。

在内部，`cursor` 方法使用 PHP [生成器](https://www.php.net/manual/en/language.generators.overview.php)来实现此功能：

```php
use App\Models\Flight;

foreach (Flight::where('destination', 'Zurich')->cursor() as $flight) {
    // ...
}
```

`cursor` 返回一个 `Illuminate\Support\LazyCollection` 实例。[惰性集合](/docs/{{version}}/collections#lazy-collections)允许你使用常规 Laravel 集合上可用的许多集合方法，同时一次只将一个模型加载到内存中：

```php
use App\Models\User;

$users = User::cursor()->filter(function (User $user) {
    return $user->id > 500;
});

foreach ($users as $user) {
    echo $user->id;
}
```

尽管 `cursor` 方法使用的内存比常规查询少得多（一次只在内存中保存一个 Eloquent 模型），但它最终仍会耗尽内存。这是因为 [PHP 的 PDO 驱动程序在内部将所有原始查询结果缓存在其缓冲区中](https://www.php.net/manual/en/mysqlinfo.concepts.buffering.php)。如果你处理非常大量的 Eloquent 记录，请考虑使用 [`lazy` 方法](#chunking-using-lazy-collections)。

<a name="advanced-subqueries"></a>
### 高级子查询

<a name="subquery-selects"></a>
#### 子查询选择

Eloquent 还提供高级子查询支持，允许你在单个查询中从相关表中提取信息。例如，假设我们有一个航班 `destinations` 表和一个指向目的地的 `flights` 表。`flights` 表包含一个 `arrived_at` 列，指示航班到达目的地的时间。

使用查询构建器的 `select` 和 `addSelect` 方法可用的子查询功能，我们可以通过单个查询选择所有 `destinations` 以及最近到达该目的地的航班名称：

```php
use App\Models\Destination;
use App\Models\Flight;

return Destination::addSelect(['last_flight' => Flight::select('name')
    ->whereColumn('destination_id', 'destinations.id')
    ->orderByDesc('arrived_at')
    ->limit(1)
])->get();
```

<a name="subquery-ordering"></a>
#### 子查询排序

此外，查询构建器的 `orderBy` 函数支持子查询。继续使用我们的航班示例，我们可以使用此功能根据最后一班航班到达目的地的时间对所有目的地进行排序。同样，这可以在执行单个数据库查询时完成：

```php
return Destination::orderByDesc(
    Flight::select('arrived_at')
        ->whereColumn('destination_id', 'destinations.id')
        ->orderByDesc('arrived_at')
        ->limit(1)
)->get();
```

<a name="retrieving-single-models"></a>
## 检索单个模型 / 聚合

除了检索匹配给定查询的所有记录外，你还可以使用 `find`、`first` 或 `firstWhere` 方法检索单条记录。这些方法返回单个模型实例，而不是模型集合：

```php
use App\Models\Flight;

// 通过主键检索模型...
$flight = Flight::find(1);

// 检索匹配查询约束的第一个模型...
$flight = Flight::where('active', 1)->first();

// 检索匹配查询约束的第一个模型的替代方法...
$flight = Flight::firstWhere('active', 1);
```

有时你可能希望在找不到结果时执行其他操作。`findOr` 和 `firstOr` 方法将返回单个模型实例，或者如果未找到结果，则执行给定的闭包。闭包返回的值将被视为方法的结果：

```php
$flight = Flight::findOr(1, function () {
    // ...
});

$flight = Flight::where('legs', '>', 3)->firstOr(function () {
    // ...
});
```

<a name="not-found-exceptions"></a>
#### 未找到异常

有时你可能希望在找不到模型时抛出异常。这在路由或控制器中特别有用。`findOrFail` 和 `firstOrFail` 方法将检索查询的第一个结果；但是，如果未找到结果，将抛出 `Illuminate\Database\Eloquent\ModelNotFoundException`：

```php
$flight = Flight::findOrFail(1);

$flight = Flight::where('legs', '>', 3)->firstOrFail();
```

如果 `ModelNotFoundException` 未被捕获，则会自动向客户端发送 404 HTTP 响应：

```php
use App\Models\Flight;

Route::get('/api/flights/{id}', function (string $id) {
    return Flight::findOrFail($id);
});
```

<a name="retrieving-or-creating-models"></a>
### 检索或创建模型

`firstOrCreate` 方法将尝试使用给定的列/值对定位数据库记录。如果在数据库中找不到该模型，则会插入一条记录，其属性由第一个数组参数与可选的第二个数组参数合并而成。

`firstOrNew` 方法类似于 `firstOrCreate`，将尝试在数据库中定位匹配给定属性的记录。但是，如果找不到模型，将返回一个新的模型实例。请注意，`firstOrNew` 返回的模型尚未持久化到数据库。你需要手动调用 `save` 方法来持久化它：

```php
use App\Models\Flight;

// 按名称检索航班，如果不存在则创建...
$flight = Flight::firstOrCreate([
    'name' => 'London to Paris'
]);

// 按名称检索航班，或使用名称、delayed 和 arrival_time 属性创建...
$flight = Flight::firstOrCreate(
    ['name' => 'London to Paris'],
    ['delayed' => 1, 'arrival_time' => '11:30']
);

// 按名称检索航班，或实例化一个新的 Flight 实例...
$flight = Flight::firstOrNew([
    'name' => 'London to Paris'
]);

// 按名称检索航班，或使用名称、delayed 和 arrival_time 属性实例化...
$flight = Flight::firstOrNew(
    ['name' => 'Tokyo to Sydney'],
    ['delayed' => 1, 'arrival_time' => '11:30']
);
```

<a name="retrieving-aggregates"></a>
### 检索聚合

在与 Eloquent 模型交互时，你还可以使用 Laravel [查询构建器](/docs/{{version}}/queries)提供的 `count`、`sum`、`max` 和其他[聚合方法](/docs/{{version}}/queries#aggregates)。正如你所料，这些方法返回标量值而不是 Eloquent 模型实例：

```php
$count = Flight::where('active', 1)->count();

$max = Flight::where('active', 1)->max('price');
```

<a name="inserting-and-updating-models"></a>
## 插入和更新模型

<a name="inserts"></a>
### 插入

当然，使用 Eloquent 时，我们不仅需要从数据库检索模型，还需要插入新记录。幸运的是，Eloquent 使这变得很简单。要向数据库中插入新记录，你应实例化一个新的模型实例并在模型上设置属性。然后，调用模型实例的 `save` 方法：

```php
<?php

namespace App\Http\Controllers;

use App\Models\Flight;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class FlightController extends Controller
{
    /**
     * 在数据库中存储一个新航班。
     */
    public function store(Request $request): RedirectResponse
    {
        // 验证请求...

        $flight = new Flight;

        $flight->name = $request->name;

        $flight->save();

        return redirect('/flights');
    }
}
```

在此示例中，我们将传入 HTTP 请求中的 `name` 字段分配给 `App\Models\Flight` 模型实例的 `name` 属性。当我们调用 `save` 方法时，记录将被插入到数据库中。当调用 `save` 方法时，模型的 `created_at` 和 `updated_at` 时间戳将自动设置，因此无需手动设置。

如果你希望在数据库事务中保存模型，可以使用 `saveOrFail` 方法。如果在保存期间抛出异常，事务将自动回滚：

```php
$flight->saveOrFail();
```

或者，你可以使用 `create` 方法通过单个 PHP 语句"保存"新模型。`create` 方法将返回插入的模型实例：

```php
use App\Models\Flight;

$flight = Flight::create([
    'name' => 'London to Paris',
]);
```

但是，在使用 `create` 方法之前，你需要在模型类上指定 `Fillable` 或 `Guarded` 属性。这些属性是必需的，因为默认情况下所有 Eloquent 模型都受到保护以防止批量赋值漏洞。要了解更多关于批量赋值的信息，请查阅[批量赋值文档](#mass-assignment)。

<a name="updates"></a>
### 更新

`save` 方法也可用于更新数据库中已存在的模型。要更新模型，你应检索它并设置任何要更新的属性。然后，应调用模型的 `save` 方法。同样，`updated_at` 时间戳将自动更新，因此无需手动设置其值：

```php
use App\Models\Flight;

$flight = Flight::find(1);

$flight->name = 'Paris to London';

$flight->save();
```

如果你希望在数据库事务中更新模型，可以使用 `updateOrFail` 方法。如果在更新期间抛出异常，事务将自动回滚：

```php
$flight->updateOrFail(['name' => 'Paris to London']);
```

有时你可能需要更新现有模型，或者如果不存在匹配的模型则创建新模型。与 `firstOrCreate` 方法一样，`updateOrCreate` 方法会持久化模型，因此无需手动调用 `save` 方法。

在下面的示例中，如果存在一个 `departure` 为 `Oakland` 且 `destination` 为 `San Diego` 的航班，其 `price` 和 `discounted` 列将被更新。如果不存在这样的航班，将创建一个新航班，其属性由第一个数组参数与第二个数组参数合并而成：

```php
$flight = Flight::updateOrCreate(
    ['departure' => 'Oakland', 'destination' => 'San Diego'],
    ['price' => 99, 'discounted' => 1]
);
```

当使用 `firstOrCreate` 或 `updateOrCreate` 等方法时，你可能不知道是新创建了模型还是更新了现有模型。`wasRecentlyCreated` 属性指示模型是否在其当前生命周期中被创建：

```php
$flight = Flight::updateOrCreate(
    // ...
);

if ($flight->wasRecentlyCreated) {
    // 新航班记录已插入...
}
```

<a name="mass-updates"></a>
#### 批量更新

更新也可以针对匹配给定查询的模型执行。在此示例中，所有 `active` 且 `destination` 为 `San Diego` 的航班将被标记为延迟：

```php
Flight::where('active', 1)
    ->where('destination', 'San Diego')
    ->update(['delayed' => 1]);
```

`update` 方法期望一个列和值对的数组，表示应更新的列。`update` 方法返回受影响的行数。

> [!WARNING]
> 通过 Eloquent 执行批量更新时，不会为更新的模型触发 `saving`、`saved`、`updating` 和 `updated` 模型事件。这是因为在执行批量更新时，模型实际上从未被检索过。

<a name="examining-attribute-changes"></a>
#### 检查属性更改

Eloquent 提供了 `isDirty`、`isClean` 和 `wasChanged` 方法来检查模型的内部状态，并确定其属性自模型最初被检索以来发生了怎样的变化。

`isDirty` 方法确定模型的任何属性自模型被检索以来是否已被更改。你可以向 `isDirty` 方法传递特定的属性名称或属性数组，以确定是否有任何属性是"脏的"。`isClean` 方法确定属性自模型被检索以来是否保持不变。此方法也接受一个可选的属性参数：

```php
use App\Models\User;

$user = User::create([
    'first_name' => 'Taylor',
    'last_name' => 'Otwell',
    'title' => 'Developer',
]);

$user->title = 'Painter';

$user->isDirty(); // true
$user->isDirty('title'); // true
$user->isDirty('first_name'); // false
$user->isDirty(['first_name', 'title']); // true

$user->isClean(); // false
$user->isClean('title'); // false
$user->isClean('first_name'); // true
$user->isClean(['first_name', 'title']); // false

$user->save();

$user->isDirty(); // false
$user->isClean(); // true
```

`wasChanged` 方法确定在当前请求周期内上次保存模型时是否有任何属性被更改。如果需要，你可以传递属性名称来查看特定属性是否被更改：

```php
$user = User::create([
    'first_name' => 'Taylor',
    'last_name' => 'Otwell',
    'title' => 'Developer',
]);

$user->title = 'Painter';

$user->save();

$user->wasChanged(); // true
$user->wasChanged('title'); // true
$user->wasChanged(['title', 'slug']); // true
$user->wasChanged('first_name'); // false
$user->wasChanged(['first_name', 'title']); // true
```

`getOriginal` 方法返回一个数组，包含模型的原始属性，无论自模型被检索以来发生了什么更改。如果需要，你可以传递一个特定的属性名称来获取特定属性的原始值：

```php
$user = User::find(1);

$user->name; // John
$user->email; // john@example.com

$user->name = 'Jack';
$user->name; // Jack

$user->getOriginal('name'); // John
$user->getOriginal(); // 原始属性数组...
```

`getChanges` 方法返回一个数组，包含上次保存模型时更改的属性，而 `getPrevious` 方法返回一个数组，包含上次保存模型之前的原始属性值：

```php
$user = User::find(1);

$user->name; // John
$user->email; // john@example.com

$user->update([
    'name' => 'Jack',
    'email' => 'jack@example.com',
]);

$user->getChanges();

/*
    [
        'name' => 'Jack',
        'email' => 'jack@example.com',
    ]
*/

$user->getPrevious();

/*
    [
        'name' => 'John',
        'email' => 'john@example.com',
    ]
*/
```

<a name="mass-assignment"></a>
### 批量赋值

你可以使用 `create` 方法通过单个 PHP 语句"保存"新模型。该方法将返回插入的模型实例：

```php
use App\Models\Flight;

$flight = Flight::create([
    'name' => 'London to Paris',
]);
```

但是，在使用 `create` 方法之前，你需要在模型类上指定 `Fillable` 或 `Guarded` 属性。这些属性是必需的，因为默认情况下所有 Eloquent 模型都受到保护以防止批量赋值漏洞。

当用户传递意外的 HTTP 请求字段，且该字段更改了你未预期的数据库列时，就会发生批量赋值漏洞。例如，恶意用户可能通过 HTTP 请求发送 `is_admin` 参数，然后该参数被传递到模型的 `create` 方法，从而允许用户将自己提升为管理员。

因此，首先，你应该定义希望使其可批量赋值的模型属性。你可以使用模型上的 `Fillable` 属性来做到这一点。例如，让我们使 `Flight` 模型的 `name` 属性可批量赋值：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['name'])]
class Flight extends Model
{
    // ...
}
```

指定了哪些属性可批量赋值后，你就可以使用 `create` 方法在数据库中插入新记录了。`create` 方法返回新创建的模型实例：

```php
$flight = Flight::create(['name' => 'London to Paris']);
```

如果你已有模型实例，可以使用 `fill` 方法用属性数组填充它：

```php
$flight->fill(['name' => 'Amsterdam to Frankfurt']);
```

<a name="mass-assignment-json-columns"></a>
#### 批量赋值和 JSON 列

分配 JSON 列时，每个列的可批量赋值键必须在模型的 `Fillable` 属性中指定。出于安全考虑，Laravel 在使用 `Guarded` 属性时不支持更新嵌套的 JSON 属性：

```php
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['options->enabled'])]
class Flight extends Model
{
    // ...
}
```

<a name="allowing-mass-assignment"></a>
#### 允许批量赋值

如果你希望使所有属性都可批量赋值，可以在模型上使用 `Unguarded` 属性。如果你选择不对模型进行保护，应特别注意始终手动构建传递给 Eloquent 的 `fill`、`create` 和 `update` 方法的数组：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Unguarded;
use Illuminate\Database\Eloquent\Model;

#[Unguarded]
class Flight extends Model
{
    // ...
}
```

<a name="mass-assignment-exceptions"></a>
#### 批量赋值异常

默认情况下，执行批量赋值操作时，未包含在 `Fillable` 属性中的属性将被静默丢弃。在生产环境中，这是预期行为；但在本地开发期间，这可能导致对模型更改为何未生效感到困惑。

如果你愿意，可以通过调用 `preventSilentlyDiscardingAttributes` 方法，指示 Laravel 在尝试填充不可填充的属性时抛出异常。通常，此方法应在应用程序的 `AppServiceProvider` 类的 `boot` 方法中调用：

```php
use Illuminate\Database\Eloquent\Model;

/**
 * 启动应用程序服务。
 */
public function boot(): void
{
    Model::preventSilentlyDiscardingAttributes($this->app->isLocal());
}
```

<a name="upserts"></a>
### 更新或插入

Eloquent 的 `upsert` 方法可用于在单个原子操作中更新或创建记录。该方法的第一个参数包含要插入或更新的值，第二个参数列出在关联表中唯一标识记录的列。该方法的第三个也是最后一个参数是一个数组，包含如果数据库中已存在匹配记录时应更新的列。如果模型上启用了时间戳，`upsert` 方法将自动设置 `created_at` 和 `updated_at` 时间戳：

```php
Flight::upsert([
    ['departure' => 'Oakland', 'destination' => 'San Diego', 'price' => 99],
    ['departure' => 'Chicago', 'destination' => 'New York', 'price' => 150]
], uniqueBy: ['departure', 'destination'], update: ['price']);
```

> [!WARNING]
> 除 SQL Server 外的所有数据库都要求 `upsert` 方法第二个参数中的列具有"主"或"唯一"索引。此外，MariaDB 和 MySQL 数据库驱动程序会忽略 `upsert` 方法的第二个参数，并始终使用表的"主"和"唯一"索引来检测现有记录。

<a name="deleting-models"></a>
## 删除模型

要删除模型，你可以在模型实例上调用 `delete` 方法：

```php
use App\Models\Flight;

$flight = Flight::find(1);

$flight->delete();
```

如果你希望在数据库事务中删除模型，可以使用 `deleteOrFail` 方法。如果在删除期间抛出异常，事务将自动回滚：

```php
$flight->deleteOrFail();
```

<a name="deleting-an-existing-model-by-its-primary-key"></a>
#### 通过主键删除现有模型

在上面的示例中，我们在调用 `delete` 方法之前从数据库中检索了模型。但是，如果你知道模型的主键，可以通过调用 `destroy` 方法来删除模型，而无需显式检索它。除了接受单个主键外，`destroy` 方法还接受多个主键、主键数组或主键[集合](/docs/{{version}}/collections)：

```php
Flight::destroy(1);

Flight::destroy(1, 2, 3);

Flight::destroy([1, 2, 3]);

Flight::destroy(collect([1, 2, 3]));
```

如果你正在使用[软删除模型](#soft-deleting)，可以通过 `forceDestroy` 方法永久删除模型：

```php
Flight::forceDestroy(1);
```

> [!WARNING]
> `destroy` 方法会逐个加载每个模型并调用 `delete` 方法，以便为每个模型正确调度 `deleting` 和 `deleted` 事件。

<a name="deleting-models-using-queries"></a>
#### 使用查询删除模型

当然，你可以构建一个 Eloquent 查询来删除所有匹配查询条件的模型。在此示例中，我们将删除所有标记为不活跃的航班。与批量更新一样，批量删除不会为被删除的模型调度模型事件：

```php
$deleted = Flight::where('active', 0)->delete();
```

要删除表中的所有模型，应执行不添加任何条件的查询：

```php
$deleted = Flight::query()->delete();
```

> [!WARNING]
> 通过 Eloquent 执行批量删除语句时，不会为被删除的模型调度 `deleting` 和 `deleted` 模型事件。这是因为在执行删除语句时，模型实际上从未被检索过。

<a name="soft-deleting"></a>
### 软删除

除了实际从数据库中移除记录外，Eloquent 还可以"软删除"模型。当模型被软删除时，它们实际上并未从数据库中移除。相反，模型上会设置一个 `deleted_at` 属性，指示模型被"删除"的日期和时间。要为模型启用软删除，请向模型添加 `Illuminate\Database\Eloquent\SoftDeletes` trait：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Flight extends Model
{
    use SoftDeletes;
}
```

> [!NOTE]
> `SoftDeletes` trait 会自动将 `deleted_at` 属性转换为 `DateTime` / `Carbon` 实例。

你还应将 `deleted_at` 列添加到数据库表中。Laravel [模式构建器](/docs/{{version}}/migrations)包含一个辅助方法来创建此列：

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::table('flights', function (Blueprint $table) {
    $table->softDeletes();
});

Schema::table('flights', function (Blueprint $table) {
    $table->dropSoftDeletes();
});
```

现在，当你在模型上调用 `delete` 方法时，`deleted_at` 列将被设置为当前日期和时间。但是，模型的数据库记录将保留在表中。当查询使用软删除的模型时，软删除的模型将自动从所有查询结果中排除。

要确定给定的模型实例是否已被软删除，可以使用 `trashed` 方法：

```php
if ($flight->trashed()) {
    // ...
}
```

<a name="restoring-soft-deleted-models"></a>
#### 恢复软删除模型

有时你可能希望"取消删除"一个软删除的模型。要恢复软删除的模型，可以在模型实例上调用 `restore` 方法。`restore` 方法会将模型的 `deleted_at` 列设置为 `null`：

```php
$flight->restore();
```

你也可以在查询中使用 `restore` 方法来恢复多个模型。同样，与其他"批量"操作一样，这不会为恢复的模型调度任何模型事件：

```php
Flight::withTrashed()
    ->where('airline_id', 1)
    ->restore();
```

`restore` 方法也可在构建[关系](/docs/{{version}}/eloquent-relationships)查询时使用：

```php
$flight->history()->restore();
```

<a name="permanently-deleting-models"></a>
#### 永久删除模型

有时你可能需要真正从数据库中移除模型。可以使用 `forceDelete` 方法从数据库表中永久删除软删除的模型：

```php
$flight->forceDelete();
```

你也可以在构建 Eloquent 关系查询时使用 `forceDelete` 方法：

```php
$flight->history()->forceDelete();
```

<a name="querying-soft-deleted-models"></a>
### 查询软删除模型

<a name="including-soft-deleted-models"></a>
#### 包含软删除模型

如上所述，软删除的模型将自动从查询结果中排除。但是，你可以通过调用查询的 `withTrashed` 方法强制将软删除的模型包含在查询结果中：

```php
use App\Models\Flight;

$flights = Flight::withTrashed()
    ->where('account_id', 1)
    ->get();
```

`withTrashed` 方法也可在构建[关系](/docs/{{version}}/eloquent-relationships)查询时调用：

```php
$flight->history()->withTrashed()->get();
```

<a name="retrieving-only-soft-deleted-models"></a>
#### 仅检索软删除模型

`onlyTrashed` 方法将检索**仅**软删除的模型：

```php
$flights = Flight::onlyTrashed()
    ->where('airline_id', 1)
    ->get();
```

<a name="pruning-models"></a>
## 修剪模型

有时你可能希望定期删除不再需要的模型。为此，你可以向希望定期修剪的模型添加 `Illuminate\Database\Eloquent\Prunable` 或 `Illuminate\Database\Eloquent\MassPrunable` trait。将其中一个 trait 添加到模型后，实现一个 `prunable` 方法，该方法返回一个解析不再需要的模型的 Eloquent 查询构建器：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;

class Flight extends Model
{
    use Prunable;

    /**
     * 获取可修剪的模型查询。
     */
    public function prunable(): Builder
    {
        return static::where('created_at', '<=', now()->minus(months: 1));
    }
}
```

将模型标记为 `Prunable` 时，你还可以在模型上定义一个 `pruning` 方法。此方法将在模型被删除之前调用。此方法可用于删除与模型相关的任何其他资源，例如在从数据库中永久删除模型之前删除存储的文件：

```php
/**
 * 准备模型以进行修剪。
 */
protected function pruning(): void
{
    // ...
}
```

配置好可修剪模型后，你应在应用程序的 `routes/console.php` 文件中调度 `model:prune` Artisan 命令。你可以自由选择此命令运行的适当间隔：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('model:prune')->daily();
```

在幕后，`model:prune` 命令将自动检测应用程序 `app/Models` 目录中的"Prunable"模型。如果你的模型位于其他位置，可以使用 `--model` 选项指定模型类名：

```php
Schedule::command('model:prune', [
    '--model' => [Address::class, Flight::class],
])->daily();
```

如果你希望在修剪所有其他检测到的模型时排除某些模型，可以使用 `--except` 选项：

```php
Schedule::command('model:prune', [
    '--except' => [Address::class, Flight::class],
])->daily();
```

你可以通过使用 `--pretend` 选项执行 `model:prune` 命令来测试 `prunable` 查询。在模拟模式下，`model:prune` 命令将仅报告如果实际运行该命令将修剪多少条记录：

```shell
php artisan model:prune --pretend
```

> [!WARNING]
> 如果软删除的模型匹配可修剪查询，它们将被永久删除（`forceDelete`）。

<a name="mass-pruning"></a>
#### 批量修剪

当模型被标记为 `Illuminate\Database\Eloquent\MassPrunable` trait 时，模型将使用批量删除查询从数据库中删除。因此，不会调用 `pruning` 方法，也不会调度 `deleting` 和 `deleted` 模型事件。这是因为模型在删除之前实际上从未被检索过，从而使修剪过程更加高效：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\MassPrunable;

class Flight extends Model
{
    use MassPrunable;

    /**
     * 获取可修剪的模型查询。
     */
    public function prunable(): Builder
    {
        return static::where('created_at', '<=', now()->minus(months: 1));
    }
}
```

<a name="replicating-models"></a>
## 复制模型

你可以使用 `replicate` 方法创建现有模型实例的未保存副本。当你拥有许多共享相同属性的模型实例时，此方法特别有用：

```php
use App\Models\Address;

$shipping = Address::create([
    'type' => 'shipping',
    'line_1' => '123 Example Street',
    'city' => 'Victorville',
    'state' => 'CA',
    'postcode' => '90001',
]);

$billing = $shipping->replicate()->fill([
    'type' => 'billing'
]);

$billing->save();
```

要从复制到新模型中排除一个或多个属性，可以向 `replicate` 方法传递一个数组：

```php
$flight = Flight::create([
    'destination' => 'LAX',
    'origin' => 'LHR',
    'last_flown' => '2020-03-04 11:00:00',
    'last_pilot_id' => 747,
]);

$flight = $flight->replicate([
    'last_flown',
    'last_pilot_id'
]);
```

<a name="query-scopes"></a>
## 查询作用域

<a name="global-scopes"></a>
### 全局作用域

全局作用域允许你为给定模型的所有查询添加约束。Laravel 自身的[软删除](#soft-deleting)功能利用全局作用域仅从数据库中检索"未删除的"模型。编写自己的全局作用域可以提供一个方便、简单的方法来确保每个给定模型的查询都收到特定的约束。

<a name="generating-scopes"></a>
#### 生成作用域

要生成新的全局作用域，你可以调用 `make:scope` Artisan 命令，该命令会将生成的作用域放置在应用程序的 `app/Models/Scopes` 目录中：

```shell
php artisan make:scope AncientScope
```

<a name="writing-global-scopes"></a>
#### 编写全局作用域

编写全局作用域很简单。首先，使用 `make:scope` 命令生成一个实现 `Illuminate\Database\Eloquent\Scope` 接口的类。`Scope` 接口要求你实现一个方法：`apply`。`apply` 方法可以根据需要向查询添加 `where` 约束或其他类型的子句：

```php
<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class AncientScope implements Scope
{
    /**
     * 将作用域应用于给定的 Eloquent 查询构建器。
     */
    public function apply(Builder $builder, Model $model): void
    {
        $builder->where('created_at', '<', now()->minus(years: 2000));
    }
}
```

> [!NOTE]
> 如果你的全局作用域向查询的 select 子句添加列，应使用 `addSelect` 方法而不是 `select`。这将防止无意中替换查询的现有 select 子句。

<a name="applying-global-scopes"></a>
#### 应用全局作用域

要将全局作用域分配给模型，你可以简单地将 `ScopedBy` 属性放在模型上：

```php
<?php

namespace App\Models;

use App\Models\Scopes\AncientScope;
use Illuminate\Database\Eloquent\Attributes\ScopedBy;

#[ScopedBy([AncientScope::class])]
class User extends Model
{
    //
}
```

或者，你可以通过覆盖模型的 `booted` 方法并调用模型的 `addGlobalScope` 方法手动注册全局作用域。`addGlobalScope` 方法接受一个作用域实例作为其唯一参数：

```php
<?php

namespace App\Models;

use App\Models\Scopes\AncientScope;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 模型的"booted"方法。
     */
    protected static function booted(): void
    {
        static::addGlobalScope(new AncientScope);
    }
}
```

将上述示例中的作用域添加到 `App\Models\User` 模型后，调用 `User::all()` 方法将执行以下 SQL 查询：

```sql
select * from `users` where `created_at` < 0021-02-18 00:00:00
```

<a name="anonymous-global-scopes"></a>
#### 匿名全局作用域

Eloquent 还允许你使用闭包定义全局作用域，这对于不需要单独类的简单作用域特别有用。使用闭包定义全局作用域时，应将自行选择的作用域名称作为第一个参数传递给 `addGlobalScope` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 模型的"booted"方法。
     */
    protected static function booted(): void
    {
        static::addGlobalScope('ancient', function (Builder $builder) {
            $builder->where('created_at', '<', now()->minus(years: 2000));
        });
    }
}
```

<a name="removing-global-scopes"></a>
#### 移除全局作用域

如果你希望移除给定查询的全局作用域，可以使用 `withoutGlobalScope` 方法。此方法接受全局作用域的类名作为其唯一参数：

```php
User::withoutGlobalScope(AncientScope::class)->get();
```

或者，如果你使用闭包定义了全局作用域，应传递你分配给全局作用域的字符串名称：

```php
User::withoutGlobalScope('ancient')->get();
```

如果你希望移除查询的几个甚至所有全局作用域，可以使用 `withoutGlobalScopes` 和 `withoutGlobalScopesExcept` 方法：

```php
// 移除所有全局作用域...
User::withoutGlobalScopes()->get();

// 移除部分全局作用域...
User::withoutGlobalScopes([
    FirstScope::class, SecondScope::class
])->get();

// 移除所有全局作用域，除了给定的...
User::withoutGlobalScopesExcept([
    SecondScope::class,
])->get();
```

<a name="local-scopes"></a>
### 本地作用域

本地作用域允许你定义常见的查询约束集合，你可以在整个应用程序中轻松重用它们。例如，你可能需要频繁检索所有被视为"受欢迎"的用户。要定义作用域，请为 Eloquent 方法添加 `Scope` 属性。

作用域应始终返回相同的查询构建器实例或 `void`：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 将查询范围限定为仅包含受欢迎的用户。
     */
    #[Scope]
    protected function popular(Builder $query): void
    {
        $query->where('votes', '>', 100);
    }

    /**
     * 将查询范围限定为仅包含活跃的用户。
     */
    #[Scope]
    protected function active(Builder $query): void
    {
        $query->where('active', 1);
    }
}
```

<a name="utilizing-a-local-scope"></a>
#### 使用本地作用域

定义作用域后，你可以在查询模型时调用作用域方法。你甚至可以链式调用各种作用域：

```php
use App\Models\User;

$users = User::popular()->active()->orderBy('created_at')->get();
```

通过 `or` 查询运算符组合多个 Eloquent 模型作用域可能需要使用闭包来实现正确的[逻辑分组](/docs/{{version}}/queries#logical-grouping)：

```php
$users = User::popular()->orWhere(function (Builder $query) {
    $query->active();
})->get();
```

但是，由于这可能很繁琐，Laravel 提供了一个"高阶" `orWhere` 方法，允许你流畅地链式组合作用域，而无需使用闭包：

```php
$users = User::popular()->orWhere->active()->get();
```

<a name="dynamic-scopes"></a>
#### 动态作用域

有时你可能希望定义接受参数的作用域。首先，只需将额外的参数添加到作用域方法签名中。作用域参数应在 `$query` 参数之后定义：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 将查询范围限定为仅包含给定类型的用户。
     */
    #[Scope]
    protected function ofType(Builder $query, string $type): void
    {
        $query->where('type', $type);
    }
}
```

将期望的参数添加到作用域方法签名后，你可以在调用作用域时传递参数：

```php
$users = User::ofType('admin')->get();
```

带属性的作用域方法应为 `protected`。在模型类内部调用带属性的作用域时，应通过查询构建器实例调用作用域，例如 `static::query()->ofType('admin')`，以确保调用通过 Eloquent 的作用域处理进行路由。

<a name="pending-attributes"></a>
### 待定属性

如果你希望使用作用域创建具有与用于约束作用域相同属性的模型，可以在构建作用域查询时使用 `withAttributes` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    /**
     * 将查询范围限定为仅包含草稿。
     */
    #[Scope]
    protected function draft(Builder $query): void
    {
        $query->withAttributes([
            'hidden' => true,
        ]);
    }
}
```

`withAttributes` 方法将使用给定的属性向查询添加 `where` 条件，并且还会将给定的属性添加到通过作用域创建的任何模型中：

```php
$draft = Post::draft()->create(['title' => 'In Progress']);

$draft->hidden; // true
```

要指示 `withAttributes` 方法不向查询添加 `where` 条件，可以将 `asConditions` 参数设置为 `false`：

```php
$query->withAttributes([
    'hidden' => true,
], asConditions: false);
```

<a name="comparing-models"></a>
## 比较模型

有时你可能需要确定两个模型是否"相同"。`is` 和 `isNot` 方法可用于快速验证两个模型是否具有相同的主键、表和数据库连接：

```php
if ($post->is($anotherPost)) {
    // ...
}

if ($post->isNot($anotherPost)) {
    // ...
}
```

`is` 和 `isNot` 方法也可用于 `belongsTo`、`hasOne`、`morphTo` 和 `morphOne` [关系](/docs/{{version}}/eloquent-relationships)。当你希望比较相关模型而无需发出查询来检索该模型时，此方法特别有用：

```php
if ($post->author()->is($user)) {
    // ...
}
```

<a name="events"></a>
## 事件

> [!NOTE]
> 想要将你的 Eloquent 事件直接广播到客户端应用程序吗？请查看 Laravel 的[模型事件广播](/docs/{{version}}/broadcasting#model-broadcasting)。

Eloquent 模型会分发多个事件，允许你介入模型生命周期的以下时刻：`retrieved`、`creating`、`created`、`updating`、`updated`、`saving`、`saved`、`deleting`、`deleted`、`trashed`、`forceDeleting`、`forceDeleted`、`restoring`、`restored` 和 `replicating`。

当现有模型从数据库检索时，将分发 `retrieved` 事件。当新模型首次保存时，将分发 `creating` 和 `created` 事件。当现有模型被修改且调用 `save` 方法时，将分发 `updating` / `updated` 事件。当模型被创建或更新时——即使模型的属性未更改——也将分发 `saving` / `saved` 事件。以 `-ing` 结尾的事件在模型更改持久化之前分发，而以 `-ed` 结尾的事件在模型更改持久化之后分发。

要开始监听模型事件，请在 Eloquent 模型上定义 `$dispatchesEvents` 属性。此属性将 Eloquent 模型生命周期的各个点映射到你自己的[事件类](/docs/{{version}}/events)。每个模型事件类应在其构造函数中接收受影响模型的实例：

```php
<?php

namespace App\Models;

use App\Events\UserDeleted;
use App\Events\UserSaved;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;

    /**
     * 模型的事件映射。
     *
     * @var array<string, string>
     */
    protected $dispatchesEvents = [
        'saved' => UserSaved::class,
        'deleted' => UserDeleted::class,
    ];
}
```

定义并映射 Eloquent 事件后，你可以使用[事件监听器](/docs/{{version}}/events#defining-listeners)来处理事件。

> [!WARNING]
> 通过 Eloquent 执行批量更新或删除查询时，不会为受影响的模型调度 `saved`、`updated`、`deleting` 和 `deleted` 模型事件。这是因为在执行批量更新或删除时，模型实际上从未被检索过。

<a name="events-using-closures"></a>
### 使用闭包

你可以注册在分发各种模型事件时执行的闭包，而不是使用自定义事件类。通常，你应在模型的 `booted` 方法中注册这些闭包：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 模型的"booted"方法。
     */
    protected static function booted(): void
    {
        static::created(function (User $user) {
            // ...
        });
    }
}
```

如果需要，你可以在注册模型事件时使用[可队列的匿名事件监听器](/docs/{{version}}/events#queueable-anonymous-event-listeners)。这将指示 Laravel 使用应用程序的[队列](/docs/{{version}}/queues)在后台执行模型事件监听器：

```php
use function Illuminate\Events\queueable;

static::created(queueable(function (User $user) {
    // ...
}));
```

<a name="observers"></a>
### 观察器

<a name="defining-observers"></a>
#### 定义观察器

如果你正在监听给定模型的许多事件，可以使用观察器将所有监听器分组到单个类中。观察器类具有反映你希望监听的 Eloquent 事件的方法名。这些方法中的每一个都接收受影响的模型作为其唯一参数。`make:observer` Artisan 命令是创建新观察器类的最简单方法：

```shell
php artisan make:observer UserObserver --model=User
```

此命令会将新的观察器放置在 `app/Observers` 目录中。如果此目录不存在，Artisan 会为你创建它。你的新观察器将如下所示：

```php
<?php

namespace App\Observers;

use App\Models\User;

class UserObserver
{
    /**
     * 处理 User "created" 事件。
     */
    public function created(User $user): void
    {
        // ...
    }

    /**
     * 处理 User "updated" 事件。
     */
    public function updated(User $user): void
    {
        // ...
    }

    /**
     * 处理 User "deleted" 事件。
     */
    public function deleted(User $user): void
    {
        // ...
    }

    /**
     * 处理 User "restored" 事件。
     */
    public function restored(User $user): void
    {
        // ...
    }

    /**
     * 处理 User "forceDeleted" 事件。
     */
    public function forceDeleted(User $user): void
    {
        // ...
    }
}
```

要注册观察器，可以将 `ObservedBy` 属性放置在相应的模型上：

```php
use App\Observers\UserObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;

#[ObservedBy([UserObserver::class])]
class User extends Authenticatable
{
    //
}
```

或者，你可以通过在你希望观察的模型上调用 `observe` 方法来手动注册观察器。你可以在应用程序的 `AppServiceProvider` 类的 `boot` 方法中注册观察器：

```php
use App\Models\User;
use App\Observers\UserObserver;

/**
 * 启动应用程序服务。
 */
public function boot(): void
{
    User::observe(UserObserver::class);
}
```

> [!NOTE]
> 观察器还可以监听其他事件，如 `saving` 和 `retrieved`。这些事件在[事件](#events)文档中进行了描述。

<a name="observers-and-database-transactions"></a>
#### 观察器和数据库事务

当模型在数据库事务中被创建时，你可能希望指示观察器仅在数据库事务提交后才执行其事件处理器。你可以通过在观察器上实现 `ShouldHandleEventsAfterCommit` 接口来实现这一点。如果数据库事务未进行中，事件处理器将立即执行：

```php
<?php

namespace App\Observers;

use App\Models\User;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;

class UserObserver implements ShouldHandleEventsAfterCommit
{
    /**
     * 处理 User "created" 事件。
     */
    public function created(User $user): void
    {
        // ...
    }
}
```

<a name="muting-events"></a>
### 静默事件

有时你可能需要暂时"静默"模型触发的所有事件。你可以使用 `withoutEvents` 方法来实现。`withoutEvents` 方法接受一个闭包作为其唯一参数。在此闭包内执行的任何代码都不会调度模型事件，闭包返回的任何值都将由 `withoutEvents` 方法返回：

```php
use App\Models\User;

$user = User::withoutEvents(function () {
    User::findOrFail(1)->delete();

    return User::find(2);
});
```

<a name="saving-a-single-model-without-events"></a>
#### 保存单个模型而不触发事件

有时你可能希望"保存"给定模型而不触发任何事件。你可以使用 `saveQuietly` 方法来实现：

```php
$user = User::findOrFail(1);

$user->name = 'Victoria Faith';

$user->saveQuietly();
```

你还可以在不触发任何事件的情况下"更新"、"删除"、"软删除"、"恢复"和"复制"给定模型：

```php
$user->deleteQuietly();
$user->forceDeleteQuietly();
$user->restoreQuietly();
```

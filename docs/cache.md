# 缓存

- [简介](#introduction)
- [配置](#configuration)
    - [驱动前提条件](#driver-prerequisites)
- [缓存用法](#cache-usage)
    - [获取缓存实例](#obtaining-a-cache-instance)
    - [从缓存中检索项目](#retrieving-items-from-the-cache)
    - [在缓存中存储项目](#storing-items-in-the-cache)
    - [延长项目生命周期](#extending-item-lifetime)
    - [从缓存中移除项目](#removing-items-from-the-cache)
    - [缓存记忆化](#cache-memoization)
    - [缓存辅助函数](#the-cache-helper)
- [缓存标签](#cache-tags)
- [原子锁](#atomic-locks)
    - [管理锁](#managing-locks)
    - [跨进程管理锁](#managing-locks-across-processes)
    - [刷新锁](#refreshing-locks)
    - [并发限制](#concurrency-limiting)
- [缓存故障转移](#cache-failover)
- [添加自定义缓存驱动](#adding-custom-cache-drivers)
    - [编写驱动](#writing-the-driver)
    - [注册驱动](#registering-the-driver)
- [事件](#events)

<a name="introduction"></a>
## 简介

你的应用执行的某些数据检索或处理任务可能是 CPU 密集型的，或者需要几秒钟才能完成。在这种情况下，通常会将检索到的数据缓存一段时间，以便在后续对相同数据的请求中快速检索。缓存的数据通常存储在非常快速的数据存储中，如 [Memcached](https://memcached.org) 或 [Redis](https://redis.io)。

幸运的是，Laravel 为各种缓存后端提供了一个富有表现力且统一的 API，让你可以利用其极速的数据检索能力并加速你的 Web 应用。

<a name="configuration"></a>
## 配置

你的应用的缓存配置文件位于 `config/cache.php`。在此文件中，你可以指定默认情况下在整个应用中使用的缓存存储。Laravel 开箱即用地支持流行的缓存后端，如 [Memcached](https://memcached.org)、[Redis](https://redis.io)、[DynamoDB](https://aws.amazon.com/dynamodb)、关系数据库和文件系统磁盘。此外，还提供了基于文件的缓存驱动，而 `array` 和 `null` 缓存驱动为你的自动化测试提供了便捷的缓存后端。

缓存配置文件还包含许多其他选项供你查看。默认情况下，Laravel 配置为使用 `database` 缓存驱动，它将序列化的缓存对象存储在应用的数据库中。

<a name="driver-prerequisites"></a>
### 驱动前提条件

<a name="prerequisites-database"></a>
#### 数据库

当使用 `database` 缓存驱动时，你需要一个数据库表来包含缓存数据。通常，这包含在 Laravel 默认的 `0001_01_01_000001_create_cache_table.php` [数据库迁移](/docs/{{version}}/migrations)中；但是，如果你的应用不包含此迁移，你可以使用 `make:cache-table` Artisan 命令来创建它：

```shell
php artisan make:cache-table

php artisan migrate
```

<a name="memcached"></a>
#### Memcached

使用 Memcached 驱动需要安装 [Memcached PECL 包](https://pecl.php.net/package/memcached)。你可以在 `config/cache.php` 配置文件中列出你的所有 Memcached 服务器。该文件已包含一个 `memcached.servers` 条目供你入门：

```php
'memcached' => [
    // ...

    'servers' => [
        [
            'host' => env('MEMCACHED_HOST', '127.0.0.1'),
            'port' => env('MEMCACHED_PORT', 11211),
            'weight' => 100,
        ],
    ],
],
```

如果需要，你可以将 `host` 选项设置为 UNIX 套接字路径。如果这样做，`port` 选项应设置为 `0`：

```php
'memcached' => [
    // ...

    'servers' => [
        [
            'host' => '/var/run/memcached/memcached.sock',
            'port' => 0,
            'weight' => 100
        ],
    ],
],
```

<a name="redis"></a>
#### Redis

在使用 Redis 缓存与 Laravel 之前，你需要通过 PECL 安装 PhpRedis PHP 扩展，或通过 Composer 安装 `predis/predis` 包。[Laravel Sail](/docs/{{version}}/sail) 已包含此扩展。此外，官方的 Laravel 应用平台如 [Laravel Cloud](https://cloud.laravel.com) 和 [Laravel Forge](https://forge.laravel.com) 默认安装了 PhpRedis 扩展。

有关配置 Redis 的更多信息，请查阅其 [Laravel 文档页面](/docs/{{version}}/redis#configuration)。

<a name="storage"></a>
#### Storage

`storage` 缓存驱动允许你在应用配置的任何[文件系统磁盘](/docs/{{version}}/filesystem)上存储缓存值。当你想要使用现有磁盘（如 S3 磁盘）作为键/值缓存存储时，这很有用：

```php
'storage' => [
    'driver' => 'storage',
    'disk' => env('CACHE_STORAGE_DISK'),
    'path' => env('CACHE_STORAGE_PATH', 'framework/cache/data'),
],
```

<a name="dynamodb"></a>
#### DynamoDB

在使用 [DynamoDB](https://aws.amazon.com/dynamodb) 缓存驱动之前，你必须创建一个 DynamoDB 表来存储所有缓存数据。通常，此表应命名为 `cache`。但是，你应该根据 `cache` 配置文件中 `stores.dynamodb.table` 配置项的值来命名该表。表名也可以通过 `DYNAMODB_CACHE_TABLE` 环境变量设置。

此表还应有一个字符串分区键，其名称对应于应用 `cache` 配置文件中 `stores.dynamodb.attributes.key` 配置项的值。默认情况下，分区键应命名为 `key`。

通常，DynamoDB 不会主动从表中删除过期项目。因此，你应在表上[启用生存时间（TTL）](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html)。配置表的 TTL 设置时，应将 TTL 属性名称设置为 `expires_at`。

接下来，安装 AWS SDK 以便你的 Laravel 应用可以与 DynamoDB 通信：

```shell
composer require aws/aws-sdk-php
```

此外，你应确保为 DynamoDB 缓存存储配置选项提供值。通常，这些选项（如 `AWS_ACCESS_KEY_ID` 和 `AWS_SECRET_ACCESS_KEY`）应在应用的 `.env` 配置文件中定义：

```php
'dynamodb' => [
    'driver' => 'dynamodb',
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    'table' => env('DYNAMODB_CACHE_TABLE', 'cache'),
    'endpoint' => env('DYNAMODB_ENDPOINT'),
],
```

<a name="mongodb"></a>
#### MongoDB

如果你使用 MongoDB，官方的 `mongodb/laravel-mongodb` 包提供了 `mongodb` 缓存驱动，可以使用 `mongodb` 数据库连接进行配置。MongoDB 支持 TTL 索引，可用于自动清除过期的缓存项目。

有关配置 MongoDB 的更多信息，请参阅 MongoDB 的[缓存和锁文档](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/cache/)。

<a name="cache-usage"></a>
## 缓存用法

<a name="obtaining-a-cache-instance"></a>
### 获取缓存实例

要获取缓存存储实例，你可以使用 `Cache` 门面，我们在本文档中都将使用它。`Cache` 门面对 Laravel 缓存契约的底层实现提供了便捷、简洁的访问：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Cache;

class UserController extends Controller
{
    /**
     * Show a list of all users of the application.
     */
    public function index(): array
    {
        $value = Cache::get('key');

        return [
            // ...
        ];
    }
}
```

<a name="accessing-multiple-cache-stores"></a>
#### 访问多个缓存存储

使用 `Cache` 门面，你可以通过 `store` 方法访问各种缓存存储。传递给 `store` 方法的键应对应于 `cache` 配置文件中 `stores` 配置数组中列出的存储之一：

```php
$value = Cache::store('file')->get('foo');

Cache::store('redis')->put('bar', 'baz', 600); // 10 分钟
```

<a name="retrieving-items-from-the-cache"></a>
### 从缓存中检索项目

`Cache` 门面的 `get` 方法用于从缓存中检索项目。如果缓存中不存在该项目，则返回 `null`。如果愿意，你可以向 `get` 方法传递第二个参数，指定如果项目不存在时返回的默认值：

```php
$value = Cache::get('key');

$value = Cache::get('key', 'default');
```

你甚至可以将闭包作为默认值传递。如果指定的项目在缓存中不存在，则将执行该闭包并返回其结果。传递闭包允许你延迟从数据库或其他外部服务检索默认值：

```php
$value = Cache::get('key', function () {
    return DB::table(/* ... */)->get();
});
```

<a name="determining-item-existence"></a>
#### 判断项目是否存在

`has` 方法可用于判断缓存中是否存在某个项目。如果该项目存在但其值为 `null`，此方法也将返回 `false`：

```php
if (Cache::has('key')) {
    // ...
}
```

<a name="incrementing-decrementing-values"></a>
#### 递增/递减值

`increment` 和 `decrement` 方法可用于调整缓存中整数项目的值。这两个方法都接受一个可选的第二个参数，指示要递增或递减的数量：

```php
// 如果值不存在则初始化...
Cache::add('key', 0, now()->plus(hours: 4));

// 递增或递减值...
Cache::increment('key');
Cache::increment('key', $amount);
Cache::decrement('key');
Cache::decrement('key', $amount);
```

<a name="retrieve-store"></a>
#### 检索并存储

有时你可能希望从缓存中检索项目，但如果请求的项目不存在，则同时存储一个默认值。例如，你可能希望从缓存中检索所有用户，或者如果它们不存在，则从数据库中检索并将其添加到缓存中。你可以使用 `Cache::remember` 方法来实现：

```php
$value = Cache::remember('users', $seconds, function () {
    return DB::table('users')->get();
});
```

如果缓存中不存在该项目，则传递给 `remember` 方法的闭包将被执行，其结果将放入缓存中。

如果你需要知道项目是从缓存中检索的，而不是通过执行给定闭包检索的，你可以使用 `rememberWithWarmth` 方法。此方法返回一个数组，包含缓存值和一个布尔值，指示项目是否是"热"的（即从缓存中检索的，而不是从闭包中解析的）：

```php
[$value, $warm] = Cache::rememberWithWarmth('users', $seconds, function () {
    return DB::table('users')->get();
});
```

你可以使用 `rememberForever` 方法从缓存中检索项目，如果不存在则永久存储：

```php
$value = Cache::rememberForever('users', function () {
    return DB::table('users')->get();
});
```

<a name="swr"></a>
#### 过期时重新验证

当使用 `Cache::remember` 方法时，如果缓存值已过期，某些用户可能会遇到响应缓慢的问题。对于某些类型的数据，允许在后台重新计算缓存值时提供部分过时数据是有用的，这可以防止某些用户在计算缓存值时遇到缓慢的响应时间。这通常被称为"过期时重新验证"模式，`Cache::flexible` 方法提供了此模式的实现。

`flexible` 方法接受一个数组，指定缓存值被视为"新鲜"的时间以及变为"过时"的时间。数组中的第一个值表示缓存被视为新鲜的秒数，而第二个值定义在需要重新计算之前可以作为过时数据提供的时间。

如果在新鲜期内（第一个值之前）发出请求，则立即返回缓存而不重新计算。如果在过期期内（两个值之间）发出请求，则向用户提供过时的值，并在响应发送给用户后注册一个[延迟函数](/docs/{{version}}/helpers#deferred-functions)来刷新缓存值。如果在第二个值之后发出请求，则缓存被视为已过期，并立即重新计算该值，这可能会导致用户响应变慢：

```php
$value = Cache::flexible('users', [5, 10], function () {
    return DB::table('users')->get();
});
```

<a name="retrieve-delete"></a>
#### 检索并删除

如果你需要从缓存中检索项目然后删除该项目，你可以使用 `pull` 方法。与 `get` 方法一样，如果缓存中不存在该项目，则返回 `null`：

```php
$value = Cache::pull('key');

$value = Cache::pull('key', 'default');
```

<a name="storing-items-in-the-cache"></a>
### 在缓存中存储项目

你可以使用 `Cache` 门面的 `put` 方法在缓存中存储项目：

```php
Cache::put('key', 'value', $seconds = 10);
```

如果没有将存储时间传递给 `put` 方法，则项目将无限期存储：

```php
Cache::put('key', 'value');
```

除了将秒数作为整数传递，你也可以传递一个 `DateTime` 实例，表示缓存项目的期望过期时间：

```php
Cache::put('key', 'value', now()->plus(minutes: 10));
```

<a name="store-if-not-present"></a>
#### 如果不存在则存储

`add` 方法仅在缓存存储中尚不存在该项目时才将其添加。如果项目实际添加到缓存中，该方法将返回 `true`。否则，该方法将返回 `false`。`add` 方法是一个原子操作：

```php
Cache::add('key', 'value', $seconds);
```

<a name="extending-item-lifetime"></a>
### 延长项目生命周期

`touch` 方法允许你延长现有缓存项目的生命周期（TTL）。如果缓存项目存在且其过期时间成功延长，`touch` 方法将返回 `true`。如果缓存中不存在该项目，则该方法返回 `false`：

```php
Cache::touch('key', 3600);
```

你可以提供 `DateTimeInterface`、`DateInterval` 或 `Carbon` 实例来指定确切的过期时间：

```php
Cache::touch('key', now()->addHours(2));
```

<a name="storing-items-forever"></a>
#### 永久存储项目

`forever` 方法可用于永久存储缓存中的项目。由于这些项目不会过期，因此必须使用 `forget` 方法手动从缓存中移除它们：

```php
Cache::forever('key', 'value');
```

> [!NOTE]
> 如果你使用 Memcached 驱动，当缓存达到其大小限制时，"永久"存储的项目可能会被移除。

<a name="removing-items-from-the-cache"></a>
### 从缓存中移除项目

你可以使用 `forget` 方法从缓存中移除项目：

```php
Cache::forget('key');
```

你也可以通过提供零或负数的过期秒数来移除项目：

```php
Cache::put('key', 'value', 0);

Cache::put('key', 'value', -5);
```

你可以使用 `flush` 方法清除整个缓存：

```php
Cache::flush();
```

你可以使用 `flushLocks` 方法清除缓存中的所有原子锁：

```php
Cache::flushLocks();
```

> [!WARNING]
> 刷新缓存不尊重你配置的缓存"前缀"，并将从缓存中删除所有条目。在清除被其他应用程序共享的缓存时，请仔细考虑这一点。

<a name="cache-memoization"></a>
### 缓存记忆化

Laravel 的 `memo` 缓存驱动允许你在单个请求或任务执行期间将已解析的缓存值临时存储在内存中。这避免了在同一执行中重复访问缓存，从而显著提高性能。

要使用记忆化缓存，调用 `memo` 方法：

```php
use Illuminate\Support\Facades\Cache;

$value = Cache::memo()->get('key');
```

`memo` 方法可选地接受一个缓存存储的名称，指定记忆化驱动将装饰的基础缓存存储：

```php
// 使用默认缓存存储...
$value = Cache::memo()->get('key');

// 使用 Redis 缓存存储...
$value = Cache::memo('redis')->get('key');
```

给定键的第一次 `get` 调用从缓存存储中检索值，但在同一请求或任务中的后续调用将从内存中检索值：

```php
// 命中缓存...
$value = Cache::memo()->get('key');

// 不命中缓存，返回记忆化值...
$value = Cache::memo()->get('key');
```

在调用修改缓存值的方法（如 `put`、`increment`、`remember` 等）时，记忆化缓存会自动遗忘记忆化值，并将修改方法调用委托给底层缓存存储：

```php
Cache::memo()->put('name', 'Taylor'); // 写入底层缓存...
Cache::memo()->get('name');           // 命中底层缓存...
Cache::memo()->get('name');           // 记忆化，不命中缓存...

Cache::memo()->put('name', 'Tim');    // 遗忘记忆化值，写入新值...
Cache::memo()->get('name');           // 再次命中底层缓存...
```

<a name="the-cache-helper"></a>
### 缓存辅助函数

除了使用 `Cache` 门面，你还可以使用全局的 `cache` 函数通过缓存来检索和存储数据。当 `cache` 函数使用单个字符串参数调用时，它将返回给定键的值：

```php
$value = cache('key');
```

如果你向该函数提供一个键/值对数组和一个过期时间，它将存储值到缓存中指定的持续时间：

```php
cache(['key' => 'value'], $seconds);

cache(['key' => 'value'], now()->plus(minutes: 10));
```

当 `cache` 函数不带任何参数调用时，它返回一个 `Illuminate\Contracts\Cache\Factory` 实现的实例，允许你调用其他缓存方法：

```php
cache()->remember('users', $seconds, function () {
    return DB::table('users')->get();
});
```

> [!NOTE]
> 在测试对全局 `cache` 函数的调用时，你可以像[测试门面](/docs/{{version}}/mocking#mocking-facades)一样使用 `Cache::shouldReceive` 方法。

<a name="cache-tags"></a>
## 缓存标签

> [!WARNING]
> 使用 `file`、`dynamodb`、`database` 或 `storage` 缓存驱动时，缓存标签不受支持。

<a name="storing-tagged-cache-items"></a>
### 存储带标签的缓存项目

缓存标签允许你标记缓存中的相关项目，然后刷新所有被分配了给定标签的缓存值。你可以通过传递一个有序的标签名称数组来访问带标签的缓存。例如，让我们访问一个带标签的缓存并向其中 `put` 一个值：

```php
use Illuminate\Support\Facades\Cache;

Cache::tags(['people', 'artists'])->put('John', $john, $seconds);
Cache::tags(['people', 'authors'])->put('Anne', $anne, $seconds);
```

<a name="accessing-tagged-cache-items"></a>
### 访问带标签的缓存项目

通过标签存储的项目如果不提供用于存储值的标签，则无法访问。要检索带标签的缓存项目，将相同的有序标签列表传递给 `tags` 方法，然后使用要检索的键调用 `get` 方法：

```php
$john = Cache::tags(['people', 'artists'])->get('John');

$anne = Cache::tags(['people', 'authors'])->get('Anne');
```

<a name="removing-tagged-cache-items"></a>
### 移除带标签的缓存项目

你可以刷新所有分配了某个标签或标签列表的项目。例如，以下代码将移除所有标记为 `people`、`authors` 或两者兼有的缓存。因此，`Anne` 和 `John` 都将从缓存中移除：

```php
Cache::tags(['people', 'authors'])->flush();
```

相比之下，以下代码将仅移除标记为 `authors` 的缓存值，因此 `Anne` 将被移除，但 `John` 不会：

```php
Cache::tags('authors')->flush();
```

<a name="atomic-locks"></a>
## 原子锁

> [!WARNING]
> 要使用此功能，你的应用必须使用 `memcached`、`redis`、`dynamodb`、`database`、`file` 或 `array` 缓存驱动作为应用的默认缓存驱动。此外，所有服务器必须与同一个中央缓存服务器通信。

<a name="managing-locks"></a>
### 管理锁

原子锁允许操作分布式锁而无需担心竞态条件。例如，[Laravel Cloud](https://cloud.laravel.com) 使用原子锁来确保一次只有一个远程任务在服务器上执行。你可以使用 `Cache::lock` 方法来创建和管理锁：

```php
use Illuminate\Support\Facades\Cache;

$lock = Cache::lock('foo', 10);

if ($lock->get()) {
    // 锁已获取，持续 10 秒...

    $lock->release();
}
```

`get` 方法也接受一个闭包。闭包执行后，Laravel 将自动释放锁：

```php
Cache::lock('foo', 10)->get(function () {
    // 锁已获取 10 秒并自动释放...
});
```

如果在请求时锁不可用，你可以指示 Laravel 等待指定的秒数。如果在指定的时间限制内无法获取锁，将抛出 `Illuminate\Contracts\Cache\LockTimeoutException`：

```php
use Illuminate\Contracts\Cache\LockTimeoutException;

$lock = Cache::lock('foo', 10);

try {
    $lock->block(5);

    // 最多等待 5 秒后获取锁...
} catch (LockTimeoutException $e) {
    // 无法获取锁...
} finally {
    $lock->release();
}
```

上面的示例可以通过向 `block` 方法传递一个闭包来简化。当向此方法传递闭包时，Laravel 将尝试在指定的秒数内获取锁，并在闭包执行后自动释放锁：

```php
Cache::lock('foo', 10)->block(5, function () {
    // 最多等待 5 秒后获取锁，持续 10 秒...
});
```

<a name="managing-locks-across-processes"></a>
### 跨进程管理锁

有时你可能希望在一个进程中获取锁，并在另一个进程中释放它。例如，你可能在 Web 请求期间获取锁，并希望在该请求触发的队列任务结束时释放锁。在这种情况下，你应该将锁的作用域"所有者令牌"传递给队列任务，以便任务可以使用给定的令牌重新实例化锁。

在下面的示例中，如果成功获取锁，我们将分发一个队列任务。此外，我们将通过锁的 `owner` 方法将锁的所有者令牌传递给队列任务：

```php
$podcast = Podcast::find($id);

$lock = Cache::lock('processing', 120);

if ($lock->get()) {
    ProcessPodcast::dispatch($podcast, $lock->owner());
}
```

在我们的应用 `ProcessPodcast` 任务中，我们可以使用所有者令牌恢复并释放锁：

```php
Cache::restoreLock('processing', $this->owner)->release();
```

如果你想释放锁而不考虑其当前所有者，你可以使用 `forceRelease` 方法：

```php
Cache::lock('processing')->forceRelease();
```

<a name="refreshing-locks"></a>
### 刷新锁

如果你需要延长当前拥有的锁的过期时间，你可以使用 `refresh` 方法。如果没有提供秒数，则使用锁的原始持续时间。这对于长时间运行的操作非常有用，你更倾向于获取短期锁并定期延长它，而不是获取具有很长过期时间的锁：

```php
$lock = Cache::lock('generate-reports', 60);

if ($lock->get()) {
    foreach ($reports as $report) {
        $report->generate();

        // 将锁再延长 60 秒...
        $lock->refresh();
    }

    $lock->release();
}
```

<a name="concurrency-limiting"></a>
### 并发限制

Laravel 的原子锁功能还提供了几种限制闭包并发执行的方法。当你希望只允许整个基础设施中有一个正在运行的实例时，使用 `withoutOverlapping`：

```php
Cache::withoutOverlapping('foo', function () {
    // 最多等待 10 秒后获取锁...
});
```

默认情况下，锁会一直持有到闭包执行完成，并且该方法最多等待 10 秒来获取锁。你可以使用额外的参数自定义这些值：

```php
Cache::withoutOverlapping('foo', function () {
    // 最多等待 5 秒后获取锁，持续 120 秒...
}, lockFor: 120, waitFor: 5);
```

如果在指定的等待时间内无法获取锁，将抛出 `Illuminate\Contracts\Cache\LockTimeoutException`。

如果你想要受控的并行度，使用 `funnel` 方法设置最大并发执行数。`funnel` 方法适用于任何支持锁的缓存驱动：

```php
Cache::funnel('foo')
    ->limit(3)
    ->releaseAfter(60)
    ->block(10)
    ->then(function () {
        // 并发锁已获取...
    }, function () {
        // 无法获取并发锁...
    });
```

`funnel` 键标识正在被限制的资源。`limit` 方法定义最大并发执行数。`releaseAfter` 方法设置在获取的插槽自动释放之前的超时时间（秒）。`block` 方法设置等待可用插槽的秒数。

如果你希望通过异常而不是提供失败闭包来处理超时，你可以省略第二个闭包。如果在指定的等待时间内无法获取锁，将抛出 `Illuminate\Cache\Limiters\LimiterTimeoutException`：

```php
use Illuminate\Cache\Limiters\LimiterTimeoutException;

try {
    Cache::funnel('foo')
        ->limit(3)
        ->releaseAfter(60)
        ->block(10)
        ->then(function () {
            // 并发锁已获取...
        });
} catch (LimiterTimeoutException $e) {
    // 无法获取并发锁...
}
```

如果你想为并发限制器使用特定的缓存存储，你可以在所需的存储上调用 `funnel` 方法：

```php
Cache::store('redis')->funnel('foo')
    ->limit(3)
    ->block(10)
    ->then(function () {
        // 使用"redis"存储获取并发锁...
    });
```

> [!NOTE]
> `funnel` 方法要求缓存存储实现 `Illuminate\Contracts\Cache\LockProvider` 接口。如果你尝试将 `funnel` 用于不支持锁的缓存存储，将抛出 `BadMethodCallException`。

<a name="cache-failover"></a>
## 缓存故障转移

`failover` 缓存驱动在与缓存交互时提供自动故障转移功能。如果 `failover` 存储的主缓存存储因任何原因失败，Laravel 将自动尝试使用列表中下一个配置的存储。这对于在缓存可靠性至关重要的生产环境中确保高可用性特别有用。

要配置故障转移缓存存储，指定 `failover` 驱动并提供一个要按顺序尝试的存储名称数组。默认情况下，Laravel 在你的应用的 `config/cache.php` 配置文件中包含一个示例故障转移配置：

```php
'failover' => [
    'driver' => 'failover',
    'stores' => [
        'database',
        'array',
    ],
],
```

配置了使用 `failover` 驱动的存储后，你需要在应用的 `.env` 文件中将故障转移存储设置为默认缓存存储，以使用故障转移功能：

```ini
CACHE_STORE=failover
```

当缓存存储操作失败并激活故障转移时，Laravel 将分发 `Illuminate\Cache\Events\CacheFailedOver` 事件，允许你报告或记录缓存存储已失败。

<a name="adding-custom-cache-drivers"></a>
## 添加自定义缓存驱动

<a name="writing-the-driver"></a>
### 编写驱动

要创建自定义缓存驱动，我们首先需要实现 `Illuminate\Contracts\Cache\Store` [契约](/docs/{{version}}/contracts)。因此，MongoDB 缓存实现可能如下所示：

```php
<?php

namespace App\Extensions;

use Illuminate\Contracts\Cache\Store;

class MongoStore implements Store
{
    public function get($key) {}
    public function many(array $keys) {}
    public function put($key, $value, $seconds) {}
    public function putMany(array $values, $seconds) {}
    public function increment($key, $value = 1) {}
    public function decrement($key, $value = 1) {}
    public function forever($key, $value) {}
    public function forget($key) {}
    public function flush() {}
    public function getPrefix() {}
}
```

我们只需要使用 MongoDB 连接实现每个方法。要了解如何实现每个方法的示例，请查看 [Laravel 框架源代码](https://github.com/laravel/framework)中的 `Illuminate\Cache\MemcachedStore`。实现完成后，我们可以通过调用 `Cache` 门面的 `extend` 方法来完成自定义驱动的注册：

```php
Cache::extend('mongo', function (Application $app) {
    return Cache::repository(new MongoStore);
});
```

> [!NOTE]
> 如果你想知道将自定义缓存驱动代码放在哪里，你可以在 `app` 目录中创建一个 `Extensions` 命名空间。但请记住，Laravel 没有严格的应用结构，你可以根据自己的偏好自由组织应用。

<a name="registering-the-driver"></a>
### 注册驱动

要使用 Laravel 注册自定义缓存驱动，我们将使用 `Cache` 门面的 `extend` 方法。由于其他服务提供者可能在其 `boot` 方法中尝试读取缓存值，我们将在 `booting` 回调中注册自定义驱动。通过使用 `booting` 回调，我们可以确保自定义驱动恰好在我们应用的服务提供者调用 `boot` 方法之前注册，但在所有服务提供者调用 `register` 方法之后。我们将在应用的 `App\Providers\AppServiceProvider` 类的 `register` 方法中注册 `booting` 回调：

```php
<?php

namespace App\Providers;

use App\Extensions\MongoStore;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->booting(function () {
             Cache::extend('mongo', function (Application $app) {
                 return Cache::repository(new MongoStore);
             });
         });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // ...
    }
}
```

传递给 `extend` 方法的第一个参数是驱动的名称。这将对应于你的 `config/cache.php` 配置文件中的 `driver` 选项。第二个参数是一个闭包，应返回一个 `Illuminate\Cache\Repository` 实例。该闭包将传递一个 `$app` 实例，它是[服务容器](/docs/{{version}}/container)的一个实例。

扩展注册完成后，将你的 `CACHE_STORE` 环境变量或 `config/cache.php` 配置文件中的 `default` 选项更新为扩展的名称。

<a name="events"></a>
## 事件

要在每次缓存操作时执行代码，你可以监听缓存分发的各种[事件](/docs/{{version}}/events)：

<div class="overflow-auto">

| 事件名称                                      |
|-------------------------------------------------|
| `Illuminate\Cache\Events\CacheFlushed`          |
| `Illuminate\Cache\Events\CacheFlushing`         |
| `Illuminate\Cache\Events\CacheFlushFailed`      |
| `Illuminate\Cache\Events\CacheLocksFlushed`     |
| `Illuminate\Cache\Events\CacheLocksFlushing`    |
| `Illuminate\Cache\Events\CacheLocksFlushFailed` |
| `Illuminate\Cache\Events\CacheHit`              |
| `Illuminate\Cache\Events\CacheMissed`           |
| `Illuminate\Cache\Events\ForgettingKey`         |
| `Illuminate\Cache\Events\KeyForgetFailed`       |
| `Illuminate\Cache\Events\KeyForgotten`          |
| `Illuminate\Cache\Events\KeyWriteFailed`        |
| `Illuminate\Cache\Events\KeyWritten`            |
| `Illuminate\Cache\Events\RetrievingKey`         |
| `Illuminate\Cache\Events\RetrievingManyKeys`    |
| `Illuminate\Cache\Events\WritingKey`            |
| `Illuminate\Cache\Events\WritingManyKeys`       |

</div>

为了提高性能，你可以在应用的 `config/cache.php` 配置文件中为给定缓存存储将 `events` 配置选项设置为 `false` 来禁用缓存事件：

```php
'database' => [
    'driver' => 'database',
    // ...
    'events' => false,
],
```

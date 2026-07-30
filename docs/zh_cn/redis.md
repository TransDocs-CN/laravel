# Redis

- [简介](#introduction)
- [配置](#configuration)
    - [集群](#clusters)
    - [Predis](#predis)
    - [PhpRedis](#phpredis)
- [与 Redis 交互](#interacting-with-redis)
    - [事务](#transactions)
    - [管道命令](#pipelining-commands)
- [发布/订阅](#pubsub)

<a name="introduction"></a>
## 简介

[Redis](https://redis.io) 是一个开源的、先进的键值存储系统。它通常被称为数据结构服务器，因为键可以包含[字符串](https://redis.io/docs/latest/develop/data-types/strings/)、[哈希](https://redis.io/docs/latest/develop/data-types/hashes/)、[列表](https://redis.io/docs/latest/develop/data-types/lists/)、[集合](https://redis.io/docs/latest/develop/data-types/sets/)和[有序集合](https://redis.io/docs/latest/develop/data-types/sorted-sets/)。

在使用 Redis 与 Laravel 之前，我们鼓励你通过 PECL 安装并使用 [PhpRedis](https://github.com/phpredis/phpredis) PHP 扩展。与"用户级"PHP 包相比，该扩展的安装更复杂，但可能为大量使用 Redis 的应用带来更好的性能。如果你使用的是 [Laravel Sail](/docs/{{version}}/sail)，该扩展已安装在应用的 Docker 容器中。

如果你无法安装 PhpRedis 扩展，可以通过 Composer 安装 `predis/predis` 包。Predis 是一个完全用 PHP 编写的 Redis 客户端，不需要任何额外扩展：

```shell
composer require predis/predis
```

<a name="configuration"></a>
## 配置

你可以通过 `config/database.php` 配置文件配置应用的 Redis 设置。在此文件中，你会看到一个包含应用使用的 Redis 服务器的 `redis` 数组：

```php
'redis' => [

    'client' => env('REDIS_CLIENT', 'phpredis'),

    'options' => [
        'cluster' => env('REDIS_CLUSTER', 'redis'),
        'prefix' => env('REDIS_PREFIX', Str::slug(env('APP_NAME', 'laravel'), '_').'_database_'),
    ],

    'default' => [
        'url' => env('REDIS_URL'),
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'username' => env('REDIS_USERNAME'),
        'password' => env('REDIS_PASSWORD'),
        'port' => env('REDIS_PORT', '6379'),
        'database' => env('REDIS_DB', '0'),
    ],

    'cache' => [
        'url' => env('REDIS_URL'),
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'username' => env('REDIS_USERNAME'),
        'password' => env('REDIS_PASSWORD'),
        'port' => env('REDIS_PORT', '6379'),
        'database' => env('REDIS_CACHE_DB', '1'),
    ],

],
```

配置文件中定义的每个 Redis 服务器都需要有一个名称、主机和端口，除非你定义一个单一的 URL 来表示 Redis 连接：

```php
'redis' => [

    'client' => env('REDIS_CLIENT', 'phpredis'),

    'options' => [
        'cluster' => env('REDIS_CLUSTER', 'redis'),
        'prefix' => env('REDIS_PREFIX', Str::slug(env('APP_NAME', 'laravel'), '_').'_database_'),
    ],

    'default' => [
        'url' => 'tcp://127.0.0.1:6379?database=0',
    ],

    'cache' => [
        'url' => 'tls://user:password@127.0.0.1:6380?database=1',
    ],

],
```

<a name="configuring-the-connection-scheme"></a>
#### 配置连接方案

默认情况下，Redis 客户端在连接到你的 Redis 服务器时将使用 `tcp` 方案；但是，你可以通过在 Redis 服务器配置数组中指定 `scheme` 配置选项来使用 TLS/SSL 加密：

```php
'default' => [
    'scheme' => 'tls',
    'url' => env('REDIS_URL'),
    'host' => env('REDIS_HOST', '127.0.0.1'),
    'username' => env('REDIS_USERNAME'),
    'password' => env('REDIS_PASSWORD'),
    'port' => env('REDIS_PORT', '6379'),
    'database' => env('REDIS_DB', '0'),
],
```

<a name="clusters"></a>
### 集群

如果你的应用使用 Redis 服务器集群，你应该在 Redis 配置的 `clusters` 键中定义这些集群。此配置键默认不存在，因此你需要在应用的 `config/database.php` 配置文件中创建它：

```php
'redis' => [

    'client' => env('REDIS_CLIENT', 'phpredis'),

    'options' => [
        'cluster' => env('REDIS_CLUSTER', 'redis'),
        'prefix' => env('REDIS_PREFIX', Str::slug(env('APP_NAME', 'laravel'), '_').'_database_'),
    ],

    'clusters' => [
        'default' => [
            [
                'url' => env('REDIS_URL'),
                'host' => env('REDIS_HOST', '127.0.0.1'),
                'username' => env('REDIS_USERNAME'),
                'password' => env('REDIS_PASSWORD'),
                'port' => env('REDIS_PORT', '6379'),
                'database' => env('REDIS_DB', '0'),
            ],
        ],
    ],

    // ...
],
```

默认情况下，Laravel 将使用原生 Redis 集群，因为 `options.cluster` 配置值设置为 `redis`。Redis 集群是一个很好的默认选项，因为它能优雅地处理故障转移。

使用 Predis 时，Laravel 也支持客户端分片。但是，客户端分片不处理故障转移；因此，它主要适用于来自其他主数据存储的临时缓存数据。

如果你希望使用客户端分片而不是原生 Redis 集群，可以移除应用 `config/database.php` 配置文件中的 `options.cluster` 配置值：

```php
'redis' => [

    'client' => env('REDIS_CLIENT', 'phpredis'),

    'clusters' => [
        // ...
    ],

    // ...
],
```

<a name="predis"></a>
### Predis

如果你希望你的应用通过 Predis 包与 Redis 交互，应确保 `REDIS_CLIENT` 环境变量的值为 `predis`：

```php
'redis' => [

    'client' => env('REDIS_CLIENT', 'predis'),

    // ...
],
```

除了默认配置选项，Predis 还支持可为每个 Redis 服务器定义的额外[连接参数](https://github.com/nrk/predis/wiki/Connection-Parameters)。要利用这些额外的配置选项，请将它们添加到应用 `config/database.php` 配置文件中的 Redis 服务器配置中：

```php
'default' => [
    'url' => env('REDIS_URL'),
    'host' => env('REDIS_HOST', '127.0.0.1'),
    'username' => env('REDIS_USERNAME'),
    'password' => env('REDIS_PASSWORD'),
    'port' => env('REDIS_PORT', '6379'),
    'database' => env('REDIS_DB', '0'),
    'read_write_timeout' => 60,
],
```

<a name="phpredis"></a>
### PhpRedis

默认情况下，Laravel 将使用 PhpRedis 扩展与 Redis 通信。Laravel 用于与 Redis 通信的客户端由 `redis.client` 配置选项的值决定，该值通常反映 `REDIS_CLIENT` 环境变量的值：

```php
'redis' => [

    'client' => env('REDIS_CLIENT', 'phpredis'),

    // ...
],
```

除了默认配置选项，PhpRedis 支持以下额外的连接参数：`name`、`persistent`、`persistent_id`、`prefix`、`read_timeout`、`retry_interval`、`max_retries`、`backoff_algorithm`、`backoff_base`、`backoff_cap`、`timeout` 和 `context`。你可以将其中任何选项添加到 `config/database.php` 配置文件中的 Redis 服务器配置中：

```php
'default' => [
    'url' => env('REDIS_URL'),
    'host' => env('REDIS_HOST', '127.0.0.1'),
    'username' => env('REDIS_USERNAME'),
    'password' => env('REDIS_PASSWORD'),
    'port' => env('REDIS_PORT', '6379'),
    'database' => env('REDIS_DB', '0'),
    'read_timeout' => 60,
    'context' => [
        // 'auth' => ['username', 'secret'],
        // 'stream' => ['verify_peer' => false],
    ],
],
```

<a name="retry-and-backoff-configuration"></a>
#### 重试和退避配置

`retry_interval`、`max_retries`、`backoff_algorithm`、`backoff_base` 和 `backoff_cap` 选项可用于配置 PhpRedis 客户端应如何尝试重新连接到 Redis 服务器。支持以下退避算法：`default`、`decorrelated_jitter`、`equal_jitter`、`exponential`、`uniform` 和 `constant`：

```php
'default' => [
    'url' => env('REDIS_URL'),
    'host' => env('REDIS_HOST', '127.0.0.1'),
    'username' => env('REDIS_USERNAME'),
    'password' => env('REDIS_PASSWORD'),
    'port' => env('REDIS_PORT', '6379'),
    'database' => env('REDIS_DB', '0'),
    'max_retries' => env('REDIS_MAX_RETRIES', 3),
    'backoff_algorithm' => env('REDIS_BACKOFF_ALGORITHM', 'decorrelated_jitter'),
    'backoff_base' => env('REDIS_BACKOFF_BASE', 100),
    'backoff_cap' => env('REDIS_BACKOFF_CAP', 1000),
],
```

Predis 3.4.0 及更高版本通过 `Retry` 类支持内置的重试和退避配置。你可以使用 `max_retries` 选项配置重试，并使用 `retry` 选项配置退避策略。`retry` 选项应是一个以以下策略类之一为键的数组：`NoBackoff`、`EqualBackoff` 或 `ExponentialBackoff`：

```php
use Predis\Retry\Strategy\ExponentialBackoff;

'default' => [
    'url' => env('REDIS_URL'),
    // ...
    'retry' => [
        ExponentialBackoff::class => [
            env('REDIS_BACKOFF_BASE', 100),
            env('REDIS_BACKOFF_CAP', 1000),
            true, // Enable jitter...
        ],
    ],
    'max_retries' => env('REDIS_MAX_RETRIES', 3),
],
```

当将 Predis 与 Redis 集群一起使用时，你可以在集群配置的 `parameters` 选项中定义重试配置：

```php
use Predis\Retry\Strategy\NoBackoff;

'clusters' => [
    'default' => [
        // ...
    ],
],

'options' => [
    'cluster' => env('REDIS_CLUSTER', 'redis'),
    'parameters' => [
        'retry' => [
            NoBackoff::class => [],
        ],
        'max_retries' => env('REDIS_MAX_RETRIES', 3),
    ],
],
```

<a name="unix-socket-connections"></a>
#### Unix Socket 连接

Redis 连接也可以配置为使用 Unix socket 而不是 TCP。这可以通过消除与你的应用在同一服务器上的 Redis 实例的 TCP 开销来提供更好的性能。要配置 Redis 使用 Unix socket，请将你的 `REDIS_HOST` 环境变量设置为 Redis socket 的路径，并将 `REDIS_PORT` 环境变量设置为 `0`：

```env
REDIS_HOST=/run/redis/redis.sock
REDIS_PORT=0
```

<a name="phpredis-serialization"></a>
#### PhpRedis 序列化和压缩

PhpRedis 扩展也可以配置为使用各种序列化器和压缩算法。这些算法可以通过 Redis 配置的 `options` 数组进行配置：

```php
'redis' => [

    'client' => env('REDIS_CLIENT', 'phpredis'),

    'options' => [
        'cluster' => env('REDIS_CLUSTER', 'redis'),
        'prefix' => env('REDIS_PREFIX', Str::slug(env('APP_NAME', 'laravel'), '_').'_database_'),
        'serializer' => Redis::SERIALIZER_MSGPACK,
        'compression' => Redis::COMPRESSION_LZ4,
    ],

    // ...
],
```

目前支持的序列化器包括：`Redis::SERIALIZER_NONE`（默认）、`Redis::SERIALIZER_PHP`、`Redis::SERIALIZER_JSON`、`Redis::SERIALIZER_IGBINARY` 和 `Redis::SERIALIZER_MSGPACK`。

支持的压缩算法包括：`Redis::COMPRESSION_NONE`（默认）、`Redis::COMPRESSION_LZF`、`Redis::COMPRESSION_ZSTD` 和 `Redis::COMPRESSION_LZ4`。

<a name="interacting-with-redis"></a>
## 与 Redis 交互

你可以通过调用 `Redis` [门面](/docs/{{version}}/facades)上的各种方法与 Redis 交互。`Redis` 门面支持动态方法，这意味着你可以在门面上调用任何 [Redis 命令](https://redis.io/commands)，并且该命令将直接传递给 Redis。在此示例中，我们将通过调用 `Redis` 门面上的 `get` 方法来调用 Redis 的 `GET` 命令：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Redis;
use Illuminate\View\View;

class UserController extends Controller
{
    /**
     * Show the profile for the given user.
     */
    public function show(string $id): View
    {
        return view('user.profile', [
            'user' => Redis::get('user:profile:'.$id)
        ]);
    }
}
```

如上所述，你可以在 `Redis` 门面上调用任何 Redis 命令。Laravel 使用魔术方法将命令传递给 Redis 服务器。如果 Redis 命令需要参数，你应该将这些参数传递给门面的相应方法：

```php
use Illuminate\Support\Facades\Redis;

Redis::set('name', 'Taylor');

$values = Redis::lrange('names', 5, 10);
```

或者，你可以使用 `Redis` 门面的 `command` 方法将命令传递给服务器，该方法接受命令名称作为其第一个参数，值数组作为其第二个参数：

```php
$values = Redis::command('lrange', ['name', 5, 10]);
```

<a name="using-multiple-redis-connections"></a>
#### 使用多个 Redis 连接

应用的 `config/database.php` 配置文件允许你定义多个 Redis 连接/服务器。你可以使用 `Redis` 门面的 `connection` 方法获取特定 Redis 连接的连接：

```php
$redis = Redis::connection('connection-name');
```

要获取默认 Redis 连接的实例，你可以在不添加任何额外参数的情况下调用 `connection` 方法：

```php
$redis = Redis::connection();
```

<a name="transactions"></a>
### 事务

`Redis` 门面的 `transaction` 方法为 Redis 原生的 `MULTI` 和 `EXEC` 命令提供了方便的包装。`transaction` 方法接受一个闭包作为其唯一参数。此闭包将收到一个 Redis 连接实例，并可以向此实例发出任何命令。在闭包中发出的所有 Redis 命令将在单个原子事务中执行：

```php
use Redis;
use Illuminate\Support\Facades;

Facades\Redis::transaction(function (Redis $redis) {
    $redis->incr('user_visits', 1);
    $redis->incr('total_visits', 1);
});
```

> [!WARNING]
> 定义 Redis 事务时，你不能从 Redis 连接中检索任何值。请记住，你的事务作为单个原子操作执行，并且直到你的整个闭包完成执行其命令后才会执行该操作。

#### Lua 脚本

`eval` 方法提供了在单个原子操作中执行多个 Redis 命令的另一种方法。然而，`eval` 方法的好处是能够在该操作期间与 Redis 键值进行交互和检查。Redis 脚本使用 [Lua 编程语言](https://www.lua.org)编写。

`eval` 方法一开始可能有点吓人，但我们将探讨一个基本示例来打破僵局。`eval` 方法需要几个参数。首先，你应该将 Lua 脚本（作为字符串）传递给该方法。其次，你应该传递脚本与之交互的键的数量（作为整数）。第三，你应该传递这些键的名称。最后，你可以传递任何其他你需要在脚本中访问的额外参数。

在此示例中，我们将递增一个计数器，检查其新值，如果第一个计数器的值大于五，则递增第二个计数器。最后，我们将返回第一个计数器的值：

```php
$value = Redis::eval(<<<'LUA'
    local counter = redis.call("incr", KEYS[1])

    if counter > 5 then
        redis.call("incr", KEYS[2])
    end

    return counter
LUA, 2, 'first-counter', 'second-counter');
```

> [!WARNING]
> 请查阅 [Redis 文档](https://redis.io/commands/eval)以获取有关 Redis 脚本的更多信息。

<a name="pipelining-commands"></a>
### 管道命令

有时你可能需要执行数十个 Redis 命令。与其为每个命令进行一次网络往返到 Redis 服务器，不如使用 `pipeline` 方法。`pipeline` 方法接受一个参数：一个接收 Redis 实例的闭包。你可以向此 Redis 实例发出所有命令，它们将同时发送到 Redis 服务器，以减少网络往返。这些命令仍将按发出的顺序执行：

```php
use Redis;
use Illuminate\Support\Facades;

Facades\Redis::pipeline(function (Redis $pipe) {
    for ($i = 0; $i < 1000; $i++) {
        $pipe->set("key:$i", $i);
    }
});
```

<a name="pubsub"></a>
## 发布/订阅

Laravel 为 Redis 的 `publish` 和 `subscribe` 命令提供了方便的接口。这些 Redis 命令允许你监听给定"channel"上的消息。你可以从另一个应用发布消息到该频道，甚至使用另一种编程语言，从而轻松实现应用和进程之间的通信。

首先，让我们使用 `subscribe` 方法设置一个频道监听器。我们将此方法调用放在 [Artisan 命令](/docs/{{version}}/artisan)中，因为调用 `subscribe` 方法会启动一个长时间运行的进程：

```php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Redis;

class RedisSubscribe extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'redis:subscribe';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Subscribe to a Redis channel';

    /**
     * Execute the console command.
     */
    public function handle(): void
    {
        Redis::subscribe(['test-channel'], function (string $message) {
            echo $message;
        });
    }
}
```

现在我们可以使用 `publish` 方法向频道发布消息：

```php
use Illuminate\Support\Facades\Redis;

Route::get('/publish', function () {
    // ...

    Redis::publish('test-channel', json_encode([
        'name' => 'Adam Wathan'
    ]));
});
```

<a name="wildcard-subscriptions"></a>
#### 通配符订阅

使用 `psubscribe` 方法，你可以订阅一个通配符频道，这对于捕获所有频道上的所有消息非常有用。频道名称将作为第二个参数传递给提供的闭包：

```php
Redis::psubscribe(['*'], function (string $message, string $channel) {
    echo $message;
});

Redis::psubscribe(['users.*'], function (string $message, string $channel) {
    echo $message;
});
```

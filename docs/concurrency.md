# 并发

- [简介](#introduction)
- [运行并发任务](#running-concurrent-tasks)
    - [命名结果](#named-results)
    - [任务超时](#task-timeouts)
- [延迟并发任务](#deferring-concurrent-tasks)

<a name="introduction"></a>
## 简介

有时你可能需要执行几个不相互依赖的慢速任务。在许多情况下，通过并发执行这些任务可以显著提升性能。Laravel 的 `Concurrency` 门面提供了一个简单、方便的 API 来并发执行闭包。

<a name="how-it-works"></a>
#### 工作原理

Laravel 通过序列化给定的闭包并将它们分派到一个隐藏的 Artisan 命令行来实现并发，该命令会反序列化闭包并在其自己的 PHP 进程中调用它。闭包被调用后，结果值会被序列化回父进程。

`Concurrency` 门面支持三种驱动：`process`（默认）、`fork` 和 `sync`。

`fork` 驱动相比默认的 `process` 驱动提供了更好的性能，但它只能在 PHP 的 CLI 上下文中使用，因为 PHP 不支持在 Web 请求期间进行 fork。在使用 `fork` 驱动之前，你需要安装 `spatie/fork` 包：

```shell
composer require spatie/fork
```

`sync` 驱动主要在测试时有用，当你希望禁用所有并发，只是在父进程中按顺序执行给定的闭包时使用。

<a name="running-concurrent-tasks"></a>
## 运行并发任务

要运行并发任务，你可以调用 `Concurrency` 门面的 `run` 方法。`run` 方法接受一个闭包数组，这些闭包将在子 PHP 进程中同时执行：

```php
use Illuminate\Support\Facades\Concurrency;
use Illuminate\Support\Facades\DB;

[$userCount, $orderCount] = Concurrency::run([
    fn () => DB::table('users')->count(),
    fn () => DB::table('orders')->count(),
]);
```

要使用特定的驱动，你可以使用 `driver` 方法：

```php
$results = Concurrency::driver('fork')->run(...);
```

或者，要更改默认的并发驱动，你应该通过 `config:publish` Artisan 命令发布 `concurrency` 配置文件并更新文件中的 `default` 选项：

```shell
php artisan config:publish concurrency
```

<a name="named-results"></a>
### 命名结果

如果你希望按名称而不是按位置访问并发任务的结果，你可以提供一个闭包的关联数组。每个结果将使用与其对应闭包相同的键返回：

```php
use Illuminate\Support\Facades\Concurrency;
use Illuminate\Support\Facades\DB;

$results = Concurrency::run([
    'users' => fn () => DB::table('users')->count(),
    'orders' => fn () => DB::table('orders')->count(),
]);

$userCount = $results['users'];
$orderCount = $results['orders'];
```

<a name="task-timeouts"></a>
### 任务超时

当使用 `process` 驱动（默认）时，你可以通过向 `run` 方法提供超时时间，指定并发任务在终止前允许运行的最大秒数：

```php
use Illuminate\Support\Facades\Concurrency;
use Illuminate\Support\Facades\DB;

[$userCount, $orderCount] = Concurrency::run([
    fn () => DB::table('users')->count(),
    fn () => DB::table('orders')->count(),
], timeout: 30);
```

如果你更喜欢更具表现力的超时定义，也可以提供一个 `CarbonInterval` 实例：

```php
use Illuminate\Support\Facades\Concurrency;

use function Illuminate\Support\seconds;

Concurrency::run([...], timeout: seconds(30));
```

<a name="deferring-concurrent-tasks"></a>
## 延迟并发任务

如果你想并发执行一组闭包，但对其返回的结果不感兴趣，你应该考虑使用 `defer` 方法。当调用 `defer` 方法时，给定的闭包不会立即执行。相反，Laravel 将在 HTTP 响应发送给用户后并发执行这些闭包：

```php
use App\Services\Metrics;
use Illuminate\Support\Facades\Concurrency;

Concurrency::defer([
    fn () => Metrics::report('users'),
    fn () => Metrics::report('orders'),
]);
```

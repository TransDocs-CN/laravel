# Laravel Horizon

- [简介](#introduction)
- [安装](#installation)
    - [配置](#configuration)
    - [仪表板授权](#dashboard-authorization)
    - [最大作业尝试次数](#max-job-attempts)
    - [作业超时](#job-timeout)
    - [作业回退](#job-backoff)
    - [其他工作进程选项](#other-worker-options)
    - [静默作业](#silenced-jobs)
- [平衡策略](#balancing-strategies)
    - [自动平衡](#auto-balancing)
    - [简单平衡](#simple-balancing)
    - [无平衡](#no-balancing)
- [升级 Horizon](#upgrading-horizon)
- [运行 Horizon](#running-horizon)
    - [部署 Horizon](#deploying-horizon)
- [标签](#tags)
- [通知](#notifications)
- [指标](#metrics)
- [删除失败作业](#deleting-failed-jobs)
- [清除队列中的作业](#clearing-jobs-from-queues)

<a name="introduction"></a>
## 简介

> [!NOTE]
> 在深入研究 Laravel Horizon 之前，你应熟悉 Laravel 的基础[队列服务](/docs/{{version}}/queues)。Horizon 增强了 Laravel 的队列，增加了额外功能，如果你还不熟悉 Laravel 提供的基本队列功能，可能会感到困惑。

[Laravel Horizon](https://github.com/laravel/horizon) 为你的 Laravel 驱动的 [Redis 队列](/docs/{{version}}/queues)提供了一个漂亮的仪表板和代码驱动的配置。Horizon 允许你轻松监控队列系统的关键指标，如作业吞吐量、运行时间和作业失败情况。

使用 Horizon 时，所有队列工作进程配置都存储在一个单一的简单配置文件中。通过在版本控制文件中定义应用程序的工作进程配置，你可以在部署应用程序时轻松扩展或修改应用程序的队列工作进程。

<img src="https://laravel.com/img/docs/horizon-example.png">

<a name="installation"></a>
## 安装

> [!WARNING]
> Laravel Horizon 要求你使用 [Redis](https://redis.io) 来驱动队列。因此，你应确保在应用程序的 `config/queue.php` 配置文件中将队列连接设置为 `redis`。Horizon 目前不兼容 Redis 集群。

你可以使用 Composer 包管理器将 Horizon 安装到你的项目中：

```shell
composer require laravel/horizon
```

安装 Horizon 后，使用 `horizon:install` Artisan 命令发布其资源：

```shell
php artisan horizon:install
```

<a name="configuration"></a>
### 配置

发布 Horizon 资源后，其主要配置文件将位于 `config/horizon.php`。此配置文件允许你配置应用程序的队列工作进程选项。每个配置选项都包含其用途的说明，因此请务必彻底浏览此文件。

> [!WARNING]
> Horizon 在内部使用名为 `horizon` 的 Redis 连接。此 Redis 连接名称是保留的，不应在 `database.php` 配置文件中分配给其他 Redis 连接，也不应作为 `horizon.php` 配置文件中 `use` 选项的值。

<a name="content-security-policy-csp-nonce"></a>
#### 内容安全策略（CSP）Nonce

如果你希望作为[内容安全策略](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)的一部分，在 Horizon 视图使用的脚本和样式标签上使用 [nonce 属性](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/nonce)，可以使用 `Horizon::cspNonce` 方法来指定要使用的 nonce。此方法通常应在中间件中调用，以便为每个请求分配新的 nonce：

```php
use Closure;
use Illuminate\Http\Request;
use Laravel\Horizon\Horizon;
use Symfony\Component\HttpFoundation\Response;

public function handle(Request $request, Closure $next): Response
{
    Horizon::cspNonce('csp-nonce');

    return $next($request);
}
```

你可以将此中间件添加到应用程序 `config/horizon.php` 配置文件中的 `middleware` 选项：

```php
'middleware' => [
    'web',
    App\Http\Middleware\AddHorizonCspNonce::class,
],
```

<a name="environments"></a>
#### 环境

安装后，你应熟悉的第一个主要 Horizon 配置选项是 `environments` 配置选项。此配置选项是一个数组，包含应用程序运行的环境，并为每个环境定义工作进程选项。默认情况下，此条目包含 `production` 和 `local` 环境。但是，你可以根据需要添加更多环境：

```php
'environments' => [
    'production' => [
        'supervisor-1' => [
            'maxProcesses' => 10,
            'balanceMaxShift' => 1,
            'balanceCooldown' => 3,
        ],
    ],

    'local' => [
        'supervisor-1' => [
            'maxProcesses' => 3,
        ],
    ],
],
```

你还可以定义通配符环境（`*`），当未找到其他匹配环境时将使用该环境：

```php
'environments' => [
    // ...

    '*' => [
        'supervisor-1' => [
            'maxProcesses' => 3,
        ],
    ],
],
```

当你启动 Horizon 时，它将使用应用程序当前运行环境的工作进程配置选项。通常，环境由 `APP_ENV` [环境变量](/docs/{{version}}/configuration#determining-the-current-environment)的值确定。例如，默认的 `local` Horizon 环境配置为启动三个工作进程并自动平衡分配给每个队列的工作进程数量。默认的 `production` 环境配置为启动最多 10 个工作进程并自动平衡分配给每个队列的工作进程数量。

> [!WARNING]
> 你应确保 `horizon` 配置文件中的 `environments` 部分包含你计划运行 Horizon 的每个[环境](/docs/{{version}}/configuration#environment-configuration)的条目。

<a name="supervisors"></a>
#### 监视器

正如你在 Horizon 的默认配置文件中看到的，每个环境可以包含一个或多个"监视器"。默认情况下，配置文件将此监视器定义为 `supervisor-1`；但是，你可以自由地为你想要的任何名称命名监视器。每个监视器本质上负责"监视"一组工作进程，并负责在工作进程之间平衡队列。

如果希望为给定环境定义一组新的应运行的工作进程，可以向该环境添加其他监视器。如果你希望为应用程序使用的给定队列定义不同的平衡策略或工作进程数量，可以选择这样做。

<a name="maintenance-mode"></a>
#### 维护模式

当你的应用程序处于[维护模式](/docs/{{version}}/configuration#maintenance-mode)时，除非在 Horizon 配置文件中将监视器的 `force` 选项定义为 `true`，否则 Horizon 不会处理队列作业：

```php
'environments' => [
    'production' => [
        'supervisor-1' => [
            // ...
            'force' => true,
        ],
    ],
],
```

<a name="default-values"></a>
#### 默认值

在 Horizon 的默认配置文件中，你会注意到一个 `defaults` 配置选项。此配置选项指定了应用程序[监视器](#supervisors)的默认值。监视器的默认配置值将与每个环境的监视器配置合并，从而允许你在定义监视器时避免不必要的重复。

<a name="dashboard-authorization"></a>
### 仪表板授权

Horizon 仪表板可通过 `/horizon` 路由访问。默认情况下，你只能在 `local` 环境中访问此仪表板。但是，在你的 `app/Providers/HorizonServiceProvider.php` 文件中，有一个[授权网关](/docs/{{version}}/authorization#gates)定义。此授权网关控制对**非 local** 环境中 Horizon 的访问。你可以根据需要修改此网关以限制对 Horizon 安装的访问：

```php
/**
 * Register the Horizon gate.
 *
 * This gate determines who can access Horizon in non-local environments.
 */
protected function gate(): void
{
    Gate::define('viewHorizon', function (User $user) {
        return in_array($user->email, [
            'taylor@laravel.com',
        ]);
    });
}
```

<a name="alternative-authentication-strategies"></a>
#### 替代身份验证策略

记住，Laravel 会自动将已认证用户注入到网关闭包中。如果你的应用程序通过其他方法提供 Horizon 安全性，例如 IP 限制，那么你的 Horizon 用户可能不需要"登录"。因此，你需要将上面的 `function (User $user)` 闭包签名更改为 `function (User $user = null)`，以强制 Laravel 不要求身份验证。

<a name="max-job-attempts"></a>
### 最大作业尝试次数

> [!NOTE]
> 在优化这些选项之前，请确保你熟悉 Laravel 的默认[队列服务](/docs/{{version}}/queues#max-job-attempts-and-timeout)以及"尝试次数"的概念。

你可以在监视器的配置中定义作业可以消耗的最大尝试次数：

```php
'environments' => [
    'production' => [
        'supervisor-1' => [
            // ...
            'tries' => 10,
        ],
    ],
],
```

> [!NOTE]
> 此选项类似于使用 Artisan 命令处理队列时的 `--tries` 选项。

当使用诸如 `WithoutOverlapping` 或 `RateLimited` 之类的中间件时，调整 `tries` 选项至关重要，因为它们会消耗尝试次数。要处理此问题，请在监视器级别调整 `tries` 配置值，或在作业类上定义 `$tries` 属性。

如果你未设置 `tries` 选项，Horizon 默认为单次尝试，除非作业类定义了 `$tries`，后者优先于 Horizon 配置。

将 `tries` 或 `$tries` 设置为 0 允许无限次尝试，这在尝试次数不确定时是理想选择。为防止无休止的失败，你可以通过设置作业类上的 `$maxExceptions` 属性来限制允许的异常数量。

<a name="job-timeout"></a>
### 作业超时

类似地，你可以在监视器级别设置 `timeout` 值，该值指定工作进程在运行作业时可以消耗的秒数，超过该时间将被强制终止。终止后，作业将根据你的队列配置进行重试或标记为失败：

```php
'environments' => [
    'production' => [
        'supervisor-1' => [
            // ...
            'timeout' => 60,
        ],
    ],
],
```

> [!WARNING]
> 使用 `auto` 平衡策略时，Horizon 会将正在运行的工作进程视为"挂起"，并在缩容期间在 Horizon 超时后强制终止它们。始终确保 Horizon 超时大于任何作业级别的超时，否则作业可能会在执行过程中被终止。此外，`timeout` 值应始终至少比 `config/queue.php` 配置文件中定义的 `retry_after` 值短几秒钟。否则，你的作业可能会被处理两次。

<a name="job-backoff"></a>
### 作业回退

你可以在监视器级别定义 `backoff` 值，以指定 Horizon 在重试遇到未处理异常的作业之前应等待的时间：

```php
'environments' => [
    'production' => [
        'supervisor-1' => [
            // ...
            'backoff' => 10,
        ],
    ],
],
```

你也可以通过为 `backoff` 值使用数组来配置"指数"回退。在此示例中，第一次重试的延迟为 1 秒，第二次重试为 5 秒，第三次重试为 10 秒，如果还有更多剩余尝试次数，则每次后续重试均为 10 秒：

```php
'environments' => [
    'production' => [
        'supervisor-1' => [
            // ...
            'backoff' => [1, 5, 10],
        ],
    ],
],
```

<a name="other-worker-options"></a>
### 其他工作进程选项

除了 `tries`、`timeout` 和 `backoff` 之外，每个监视器还接受其他几个选项，这些选项控制其工作进程的行为以及自动重启的时间。定期重启工作进程对于长时间运行的进程来说是一个好习惯，因为它有助于防止内存泄漏：

```php
'environments' => [
    'production' => [
        'supervisor-1' => [
            // ...
            'memory' => 128,
            'maxJobs' => 1000,
            'maxTime' => 3600,
            'sleep' => 3,
            'rest' => 0,
            'nice' => 0,
        ],
    ],
],
```

<div class="content-list" markdown="1">

- `memory` 定义单个工作进程在重启前可以消耗的最大内存量（以 MB 为单位）。默认情况下，此值为 `128`。
- `maxJobs` 定义工作进程在重启前应处理的作业数量。值为 `0` 表示不应基于处理的作业数量重启工作进程。默认情况下，此值为 `0`。
- `maxTime` 定义工作进程在重启前应运行的秒数。值为 `0` 表示不应基于时间重启工作进程。默认情况下，此值为 `0`。
- `sleep` 定义在没有可用作业时，工作进程在再次轮询队列以获取新作业之前应等待的秒数。默认情况下，此值为 `3`。
- `rest` 定义在处理每个作业之间暂停的秒数。默认情况下，此值为 `0`。
- `nice` 定义工作进程的"优先级"（调度优先级）。值越高，进程优先级越低。默认情况下，此值为 `0`。

</div>

<a name="silenced-jobs"></a>
### 静默作业

有时，你可能不希望查看应用程序或第三方包派发的某些作业。与其让这些作业在"已完成作业"列表中占用空间，不如将它们静默。首先，将作业的类名添加到应用程序 `horizon` 配置文件中的 `silenced` 配置选项中：

```php
'silenced' => [
    App\Jobs\ProcessPodcast::class,
],
```

除了静默单个作业类之外，Horizon 还支持基于[标签](#tags)静默作业。如果你希望隐藏共享公共标签的多个作业，这非常有用：

```php
'silenced_tags' => [
    'notifications'
],
```

或者，你希望静默的作业可以实现 `Laravel\Horizon\Contracts\Silenced` 接口。如果作业实现了此接口，它将自动被静默，即使它不在 `silenced` 配置数组中：

```php
use Laravel\Horizon\Contracts\Silenced;

class ProcessPodcast implements ShouldQueue, Silenced
{
    use Queueable;

    // ...
}
```

<a name="balancing-strategies"></a>
## 平衡策略

每个监视器可以处理一个或多个队列，但与 Laravel 的默认队列系统不同，Horizon 允许你从三种工作进程平衡策略中选择：`auto`、`simple` 和 `false`。

<a name="auto-balancing"></a>
### 自动平衡

`auto` 策略是默认策略，它根据队列的当前工作负载调整每个队列的工作进程数量。例如，如果你的 `notifications` 队列有 1000 个待处理作业，而你的 `default` 队列为空，Horizon 将分配更多工作进程给 `notifications` 队列，直到队列为空。

使用 `auto` 策略时，你还可以配置 `minProcesses` 和 `maxProcesses` 配置选项：

<div class="content-list" markdown="1">

- `minProcesses` 定义每个队列的最小工作进程数。此值必须大于或等于 1。
- `maxProcesses` 定义 Horizon 在所有队列中最多可扩展的工作进程总数。此值通常应大于队列数乘以 `minProcesses` 值。要防止监视器生成任何进程，可以将此值设置为 0。

</div>

例如，你可以配置 Horizon 为每个队列至少保持一个进程，并扩展到总共 10 个工作进程：

```php
'environments' => [
    'production' => [
        'supervisor-1' => [
            'connection' => 'redis',
            'queue' => ['default', 'notifications'],
            'balance' => 'auto',
            'autoScalingStrategy' => 'time',
            'minProcesses' => 1,
            'maxProcesses' => 10,
            'balanceMaxShift' => 1,
            'balanceCooldown' => 3,
        ],
    ],
],
```

`autoScalingStrategy` 配置选项决定 Horizon 如何将更多工作进程分配给队列。你可以在两种策略之间选择：

<div class="content-list" markdown="1">

- `time` 策略将根据清除队列所需的总估计时间来分配工作进程。
- `size` 策略将根据队列上的作业总数来分配工作进程。

</div>

`balanceMaxShift` 和 `balanceCooldown` 配置值决定 Horizon 扩展以满足工作进程需求的速度。在上面的示例中，每三秒最多创建或销毁一个新进程。你可以根据应用程序的需要自由调整这些值。

<a name="auto-queue-priorities"></a>
#### 队列优先级和自动平衡

使用 `auto` 平衡策略时，Horizon 不强制队列之间的严格优先级。监视器配置中队列的顺序不影响工作进程的分配方式。相反，Horizon 依赖选择的 `autoScalingStrategy` 来根据队列负载动态分配工作进程。

例如，在以下配置中，high 队列不会优先于 default 队列，尽管它出现在列表中的第一位：

```php
'environments' => [
    'production' => [
        'supervisor-1' => [
            // ...
            'queue' => ['high', 'default'],
            'minProcesses' => 1,
            'maxProcesses' => 10,
        ],
    ],
],
```

如果你需要强制队列之间的相对优先级，可以定义多个监视器并显式分配处理资源：

```php
'environments' => [
    'production' => [
        'supervisor-1' => [
            // ...
            'queue' => ['default'],
            'minProcesses' => 1,
            'maxProcesses' => 10,
        ],
        'supervisor-2' => [
            // ...
            'queue' => ['images'],
            'minProcesses' => 1,
            'maxProcesses' => 1,
        ],
    ],
],
```

在此示例中，默认 `queue` 可以扩展到最多 10 个进程，而 `images` 队列限制为一个进程。此配置确保你的队列可以独立扩展。

> [!NOTE]
> 当派发资源密集型作业时，有时最好将它们分配给具有有限 `maxProcesses` 值的专用队列。否则，这些作业可能会消耗过多的 CPU 资源并使系统过载。

<a name="simple-balancing"></a>
### 简单平衡

`simple` 策略将工作进程均匀地分配到指定的队列。使用此策略时，Horizon 不会自动扩展工作进程的数量。相反，它使用固定数量的进程：

```php
'environments' => [
    'production' => [
        'supervisor-1' => [
            // ...
            'queue' => ['default', 'notifications'],
            'balance' => 'simple',
            'processes' => 10,
        ],
    ],
],
```

在上面的示例中，Horizon 会将总共 10 个进程均匀分配，每个队列 5 个进程。

如果你想单独控制分配给每个队列的工作进程数量，可以定义多个监视器：

```php
'environments' => [
    'production' => [
        'supervisor-1' => [
            // ...
            'queue' => ['default'],
            'balance' => 'simple',
            'processes' => 10,
        ],
        'supervisor-notifications' => [
            // ...
            'queue' => ['notifications'],
            'balance' => 'simple',
            'processes' => 2,
        ],
    ],
],
```

使用此配置，Horizon 将分配 10 个进程给 `default` 队列，2 个进程给 `notifications` 队列。

<a name="no-balancing"></a>
### 无平衡

当 `balance` 选项设置为 `false` 时，Horizon 严格按照队列列出的顺序处理队列，类似于 Laravel 的默认队列系统。但是，如果作业开始累积，它仍然会扩展工作进程的数量：

```php
'environments' => [
    'production' => [
        'supervisor-1' => [
            // ...
            'queue' => ['default', 'notifications'],
            'balance' => false,
            'minProcesses' => 1,
            'maxProcesses' => 10,
        ],
    ],
],
```

在上面的示例中，`default` 队列中的作业始终优先于 `notifications` 队列中的作业。例如，如果 `default` 中有 1000 个作业，而 `notifications` 中只有 10 个，Horizon 将先完全处理所有 `default` 作业，然后再处理 `notifications` 中的任何作业。

你可以使用 `minProcesses` 和 `maxProcesses` 选项控制 Horizon 扩展工作进程的能力：

<div class="content-list" markdown="1">

- `minProcesses` 定义总的最小工作进程数。此值必须大于或等于 1。
- `maxProcesses` 定义 Horizon 最多可扩展的工作进程总数。

</div>

<a name="upgrading-horizon"></a>
## 升级 Horizon

升级到新主要版本的 Horizon 时，仔细阅读[升级指南](https://github.com/laravel/horizon/blob/master/UPGRADE.md)非常重要。

<a name="running-horizon"></a>
## 运行 Horizon

在应用程序的 `config/horizon.php` 配置文件中配置好监视器和工作进程后，可以使用 `horizon` Artisan 命令启动 Horizon。此单个命令将启动当前环境的所有已配置工作进程：

```shell
php artisan horizon
```

你可以使用 `horizon:pause` 和 `horizon:continue` Artisan 命令暂停 Horizon 进程并指示其继续处理作业：

```shell
php artisan horizon:pause

php artisan horizon:continue
```

你还可以使用 `horizon:pause-supervisor` 和 `horizon:continue-supervisor` Artisan 命令暂停和继续特定的 Horizon [监视器](#supervisors)：

```shell
php artisan horizon:pause-supervisor supervisor-1

php artisan horizon:continue-supervisor supervisor-1
```

你可以使用 `horizon:status` Artisan 命令检查 Horizon 进程的当前状态：

```shell
php artisan horizon:status
```

你可以使用 `horizon:supervisor-status` Artisan 命令检查特定 Horizon [监视器](#supervisors)的当前状态：

```shell
php artisan horizon:supervisor-status supervisor-1
```

你可以使用 `horizon:terminate` Artisan 命令优雅地终止 Horizon 进程。当前正在处理的任何作业都将完成，然后 Horizon 将停止执行：

```shell
php artisan horizon:terminate
```

<a name="automatically-restarting-horizon"></a>
#### 自动重启 Horizon

在本地开发期间，你可以运行 `horizon:listen` 命令。使用 `horizon:listen` 命令时，你无需在想要重新加载更新后的代码时手动重启 Horizon。使用此功能之前，应确保[Node](https://nodejs.org)已安装在本地开发环境中。此外，你应在项目中安装 [Chokidar](https://github.com/paulmillr/chokidar) 文件监视库：

```shell
npm install --save-dev chokidar
```

安装 Chokidar 后，你可以使用 `horizon:listen` 命令启动 Horizon：

```shell
php artisan horizon:listen
```

在 Docker 或 Vagrant 内运行时，应使用 `--poll` 选项：

```shell
php artisan horizon:listen --poll
```

你可以使用应用程序 `config/horizon.php` 配置文件中的 `watch` 配置选项配置应监视的目录和文件：

```php
'watch' => [
    'app',
    'bootstrap',
    'config',
    'database',
    'public/**/*.php',
    'resources/**/*.php',
    'routes',
    'composer.lock',
    '.env',
],
```

<a name="deploying-horizon"></a>
### 部署 Horizon

当你准备将 Horizon 部署到应用程序的实际服务器时，应配置一个进程监视器来监视 `php artisan horizon` 命令，并在其意外退出时重新启动它。别担心，我们将在下面讨论如何安装进程监视器。

在应用程序的部署过程中，你应指示 Horizon 进程终止，以便进程监视器重新启动它并接收你的代码更改：

```shell
php artisan horizon:terminate
```

<a name="installing-supervisor"></a>
#### 安装 Supervisor

Supervisor 是 Linux 操作系统的进程监视器，如果 `horizon` 进程停止运行，它将自动重新启动。要在 Ubuntu 上安装 Supervisor，可以使用以下命令。如果你不是使用 Ubuntu，很可能可以通过操作系统的包管理器安装 Supervisor：

```shell
sudo apt-get install supervisor
```

> [!NOTE]
> 如果自行配置 Supervisor 听起来令人生畏，可以考虑使用 [Laravel Cloud](https://cloud.laravel.com)，它可以管理 Laravel 应用程序的后台进程。

<a name="supervisor-configuration"></a>
#### Supervisor 配置

Supervisor 配置文件通常存储在服务器的 `/etc/supervisor/conf.d` 目录中。在此目录中，你可以创建任意数量的配置文件，指示 supervisor 如何监视你的进程。例如，让我们创建一个 `horizon.conf` 文件来启动和监视 `horizon` 进程：

```ini
[program:horizon]
process_name=%(program_name)s
command=php /home/forge/example.com/artisan horizon
autostart=true
autorestart=true
user=forge
redirect_stderr=true
stdout_logfile=/home/forge/example.com/horizon.log
stopwaitsecs=3600
```

在定义 Supervisor 配置时，应确保 `stopwaitsecs` 的值大于最长运行作业消耗的秒数。否则，Supervisor 可能会在作业完成处理之前将其终止。

> [!WARNING]
> 虽然上面的示例适用于基于 Ubuntu 的服务器，但 Supervisor 配置文件的位置和期望的文件扩展名可能因其他服务器操作系统而异。请查阅服务器的文档以获取更多信息。

<a name="starting-supervisor"></a>
#### 启动 Supervisor

创建配置文件后，你可以使用以下命令更新 Supervisor 配置并启动受监视的进程：

```shell
sudo supervisorctl reread

sudo supervisorctl update

sudo supervisorctl start horizon
```

> [!NOTE]
> 有关运行 Supervisor 的更多信息，请查阅 [Supervisor 文档](http://supervisord.org/index.html)。

<a name="tags"></a>
## 标签

Horizon 允许你为作业分配"标签"，包括可邮件、广播事件、通知和队列事件监听器。实际上，Horizon 会根据附加到作业的 Eloquent 模型智能地自动标记大多数作业。例如，看看以下作业：

```php
<?php

namespace App\Jobs;

use App\Models\Video;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class RenderVideo implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Video $video,
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // ...
    }
}
```

如果此作业与具有 `id` 属性为 `1` 的 `App\Models\Video` 实例一起排队，它将自动接收标签 `App\Models\Video:1`。这是因为 Horizon 会搜索作业的属性以查找任何 Eloquent 模型。如果找到 Eloquent 模型，Horizon 将使用模型的类名和主键智能地标记作业：

```php
use App\Jobs\RenderVideo;
use App\Models\Video;

$video = Video::find(1);

RenderVideo::dispatch($video);
```

<a name="manually-tagging-jobs"></a>
#### 手动标记作业

如果你希望手动定义队列对象的标签，可以在类上定义一个 `tags` 方法：

```php
class RenderVideo implements ShouldQueue
{
    /**
     * Get the tags that should be assigned to the job.
     *
     * @return array<int, string>
     */
    public function tags(): array
    {
        return ['render', 'video:'.$this->video->id];
    }
}
```

<a name="manually-tagging-event-listeners"></a>
#### 手动标记事件监听器

在检索队列事件监听器的标签时，Horizon 会自动将事件实例传递给 `tags` 方法，允许你将事件数据添加到标签中：

```php
class SendRenderNotifications implements ShouldQueue
{
    /**
     * Get the tags that should be assigned to the listener.
     *
     * @return array<int, string>
     */
    public function tags(VideoRendered $event): array
    {
        return ['video:'.$event->video->id];
    }
}
```

<a name="notifications"></a>
## 通知

> [!WARNING]
> 在配置 Horizon 发送 Slack 或 SMS 通知时，应查看[相关通知频道的先决条件](/docs/{{version}}/notifications)。

如果你希望在其中某个队列的等待时间过长时收到通知，可以使用 `Horizon::routeMailNotificationsTo`、`Horizon::routeSlackNotificationsTo` 和 `Horizon::routeSmsNotificationsTo` 方法。你可以在应用程序的 `App\Providers\HorizonServiceProvider` 的 `boot` 方法中调用这些方法：

```php
/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    parent::boot();

    Horizon::routeSmsNotificationsTo('15556667777');
    Horizon::routeMailNotificationsTo('example@example.com');
    Horizon::routeSlackNotificationsTo('slack-webhook-url', '#channel');
}
```

<a name="configuring-notification-wait-time-thresholds"></a>
#### 配置通知等待时间阈值

你可以在应用程序的 `config/horizon.php` 配置文件中配置多少秒被视为"长时间等待"。此文件中的 `waits` 配置选项允许你控制每个连接/队列组合的长时间等待阈值。任何未定义的连接/队列组合将默认为 60 秒的长时间等待阈值：

```php
'waits' => [
    'redis:critical' => 30,
    'redis:default' => 60,
    'redis:batch' => 120,
],
```

将队列的阈值设置为 `0` 将禁用该队列的长时间等待通知。

<a name="metrics"></a>
## 指标

Horizon 包含一个指标仪表板，提供有关你的作业和队列等待时间及吞吐量的信息。为了填充此仪表板，你应在应用程序的 `routes/console.php` 文件中配置 Horizon 的 `snapshot` Artisan 命令每五分钟运行一次：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('horizon:snapshot')->everyFiveMinutes();
```

你可以使用应用程序 `config/horizon.php` 配置文件中的 `metrics.trim_snapshots` 选项配置 Horizon 为其指标图保留的快照数量。由于此选项限制的是快照数量而不是其年龄，因此保留期取决于 `horizon:snapshot` 命令的运行频率：

```php
'metrics' => [
    'trim_snapshots' => [
        'job' => 24,
        'queue' => 24,
    ],
],
```

如果你想要删除所有指标数据，可以调用 `horizon:clear-metrics` Artisan 命令：

```shell
php artisan horizon:clear-metrics
```

<a name="deleting-failed-jobs"></a>
## 删除失败作业

如果你要删除失败作业，可以使用 `horizon:forget` 命令。`horizon:forget` 命令接受失败作业的 ID 或 UUID 作为其唯一参数：

```shell
php artisan horizon:forget 5
```

如果你要删除所有失败作业，可以向 `horizon:forget` 命令提供 `--all` 选项：

```shell
php artisan horizon:forget --all
```

<a name="clearing-jobs-from-queues"></a>
## 清除队列中的作业

如果你要删除应用程序默认队列中的所有作业，可以使用 `horizon:clear` Artisan 命令：

```shell
php artisan horizon:clear
```

你可以提供 `queue` 选项以删除特定队列中的作业：

```shell
php artisan horizon:clear --queue=emails
```

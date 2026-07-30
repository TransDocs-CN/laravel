# Laravel Pulse

- [简介](#introduction)
- [安装](#installation)
    - [配置](#configuration)
- [仪表盘](#dashboard)
    - [授权](#dashboard-authorization)
    - [自定义](#dashboard-customization)
    - [解析用户](#dashboard-resolving-users)
    - [卡片](#dashboard-cards)
- [捕获条目](#capturing-entries)
    - [记录器](#recorders)
    - [过滤](#filtering)
- [性能](#performance)
    - [使用不同的数据库](#using-a-different-database)
    - [Redis 摄取](#ingest)
    - [采样](#sampling)
    - [修剪](#trimming)
    - [处理 Pulse 异常](#pulse-exceptions)
- [自定义卡片](#custom-cards)
    - [卡片组件](#custom-card-components)
    - [样式](#custom-card-styling)
    - [数据捕获与聚合](#custom-card-data)

<a name="introduction"></a>
## 简介

[Laravel Pulse](https://github.com/laravel/pulse) 提供了一目了然的应用程序性能和使用情况洞察。通过 Pulse，你可以追踪慢作业和端点等瓶颈，找到最活跃的用户等。

如需深入调试单个事件，请查看 [Laravel Telescope](/docs/{{version}}/telescope)。

<a name="installation"></a>
## 安装

> [!WARNING]
> Pulse 的第一方存储实现目前需要 MySQL、MariaDB 或 PostgreSQL 数据库。如果你使用不同的数据库引擎，则需要一个单独的 MySQL、MariaDB 或 PostgreSQL 数据库来存储 Pulse 数据。

你可以使用 Composer 包管理器安装 Pulse：

```shell
composer require laravel/pulse
```

接下来，你应该使用 `vendor:publish` Artisan 命令发布 Pulse 配置和迁移文件：

```shell
php artisan vendor:publish --provider="Laravel\Pulse\PulseServiceProvider"
```

最后，你应该运行 `migrate` 命令来创建存储 Pulse 数据所需的表：

```shell
php artisan migrate
```

运行完 Pulse 的数据库迁移后，你可以通过 `/pulse` 路由访问 Pulse 仪表盘。

> [!NOTE]
> 如果你不想将 Pulse 数据存储在主应用程序数据库中，可以[指定专用数据库连接](#using-a-different-database)。

<a name="configuration"></a>
### 配置

Pulse 的许多配置选项可以通过环境变量控制。要查看可用选项、注册新记录器或配置高级选项，你可以发布 `config/pulse.php` 配置文件：

```shell
php artisan vendor:publish --tag=pulse-config
```

<a name="dashboard"></a>
## 仪表盘

<a name="dashboard-authorization"></a>
### 授权

Pulse 仪表盘可以通过 `/pulse` 路由访问。默认情况下，你只能在 `local` 环境中访问此仪表盘，因此你需要通过自定义 `'viewPulse'` 授权门来为生产环境配置授权。你可以在应用程序的 `app/Providers/AppServiceProvider.php` 文件中完成此操作：

```php
use App\Models\User;
use Illuminate\Support\Facades\Gate;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Gate::define('viewPulse', function (User $user) {
        return $user->isAdmin();
    });

    // ...
}
```

<a name="dashboard-customization"></a>
### 自定义

Pulse 仪表盘的卡片和布局可以通过发布仪表盘视图来配置。仪表盘视图将发布到 `resources/views/vendor/pulse/dashboard.blade.php`：

```shell
php artisan vendor:publish --tag=pulse-dashboard
```

仪表盘由 [Livewire](https://livewire.laravel.com/) 驱动，允许你在无需重建任何 JavaScript 资源的情况下自定义卡片和布局。

在此文件中，`<x-pulse>` 组件负责渲染仪表盘，并为卡片提供网格布局。如果你希望仪表盘占满屏幕宽度，可以向组件提供 `full-width` 属性：

```blade
<x-pulse full-width>
    ...
</x-pulse>
```

默认情况下，`<x-pulse>` 组件会创建一个 12 列网格，但你可以通过 `cols` 属性自定义：

```blade
<x-pulse cols="16">
    ...
</x-pulse>
```

每张卡片接受 `cols` 和 `rows` 属性来控制空间和定位：

```blade
<livewire:pulse.usage cols="4" rows="2" />
```

大多数卡片也接受 `expand` 属性来显示完整卡片而不是滚动：

```blade
<livewire:pulse.slow-queries expand />
```

<a name="dashboard-resolving-users"></a>
### 解析用户

对于显示用户信息的卡片，如应用使用情况卡片，Pulse 只记录用户的 ID。渲染仪表盘时，Pulse 会从默认的 `Authenticatable` 模型中解析 `name` 和 `email` 字段，并使用 Gravatar 网络服务显示头像。

你可以通过在应用程序的 `App\Providers\AppServiceProvider` 类中调用 `Pulse::user` 方法来自定义字段和头像。

`user` 方法接受一个闭包，该闭包将接收要显示的 `Authenticatable` 模型，并应返回包含用户 `name`、`extra` 和 `avatar` 信息的数组：

```php
use Laravel\Pulse\Facades\Pulse;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Pulse::user(fn ($user) => [
        'name' => $user->name,
        'extra' => $user->email,
        'avatar' => $user->avatar_url,
    ]);

    // ...
}
```

> [!NOTE]
> 你可以通过实现 `Laravel\Pulse\Contracts\ResolvesUsers` 契约并将其绑定到 Laravel 的[服务容器](/docs/{{version}}/container#binding-a-singleton)中来完全自定义已验证用户的捕获和检索方式。

<a name="dashboard-cards"></a>
### 卡片

<a name="servers-card"></a>
#### 服务器

`<livewire:pulse.servers />` 卡片显示所有运行 `pulse:check` 命令的服务器的系统资源使用情况。有关系统资源报告的更多信息，请参阅[服务器记录器](#servers-recorder)的文档。

如果你在基础设施中替换了一台服务器，你可能希望在一定时间后停止在 Pulse 仪表盘中显示不活跃的服务器。你可以通过 `ignore-after` 属性来实现，该属性接受一个秒数，超过该时间后不活跃的服务器将从 Pulse 仪表盘中移除。或者，你也可以提供一个相对时间格式的字符串，如 `1 hour` 或 `3 days and 1 hour`：

```blade
<livewire:pulse.servers ignore-after="3 hours" />
```

<a name="application-usage-card"></a>
#### 应用使用情况

`<livewire:pulse.usage />` 卡片显示向应用程序发出请求、分派作业和遇到慢请求的前 10 名用户。

如果你希望同时查看所有使用情况指标，可以多次包含该卡片并指定 `type` 属性：

```blade
<livewire:pulse.usage type="requests" />
<livewire:pulse.usage type="slow_requests" />
<livewire:pulse.usage type="jobs" />
```

要了解如何自定义 Pulse 检索和显示用户信息的方式，请查阅我们关于[解析用户](#dashboard-resolving-users)的文档。

> [!NOTE]
> 如果你的应用程序收到大量请求或分派大量作业，你可能希望启用[采样](#sampling)。请参阅[用户请求记录器](#user-requests-recorder)、[用户作业记录器](#user-jobs-recorder)和[慢作业记录器](#slow-jobs-recorder)文档以了解更多信息。

<a name="exceptions-card"></a>
#### 异常

`<livewire:pulse.exceptions />` 卡片显示应用程序中发生的异常的频率和最近情况。默认情况下，异常根据异常类和发生位置进行分组。有关更多信息，请参阅[异常记录器](#exceptions-recorder)文档。

<a name="queues-card"></a>
#### 队列

`<livewire:pulse.queues />` 卡片显示应用程序中队列的吞吐量，包括排队、处理中、已处理、释放和失败的作业数量。有关更多信息，请参阅[队列记录器](#queues-recorder)文档。

<a name="slow-requests-card"></a>
#### 慢请求

`<livewire:pulse.slow-requests />` 卡片显示超过配置阈值的应用程序传入请求，默认阈值为 1,000ms。有关更多信息，请参阅[慢请求记录器](#slow-requests-recorder)文档。

<a name="slow-jobs-card"></a>
#### 慢作业

`<livewire:pulse.slow-jobs />` 卡片显示超过配置阈值的应用程序队列作业，默认阈值为 1,000ms。有关更多信息，请参阅[慢作业记录器](#slow-jobs-recorder)文档。

<a name="slow-queries-card"></a>
#### 慢查询

`<livewire:pulse.slow-queries />` 卡片显示超过配置阈值的应用程序数据库查询，默认阈值为 1,000ms。

默认情况下，慢查询根据 SQL 查询（不含绑定）和发生位置进行分组，但你也可以选择不捕获位置，以便仅根据 SQL 查询进行分组。

如果由于极大的 SQL 查询接收语法高亮而导致渲染性能问题，你可以通过添加 `without-highlighting` 属性来禁用高亮：

```blade
<livewire:pulse.slow-queries without-highlighting />
```

有关更多信息，请参阅[慢查询记录器](#slow-queries-recorder)文档。

<a name="slow-outgoing-requests-card"></a>
#### 慢传出请求

`<livewire:pulse.slow-outgoing-requests />` 卡片显示使用 Laravel 的 [HTTP 客户端](/docs/{{version}}/http-client)发出且超过配置阈值的传出请求，默认阈值为 1,000ms。

默认情况下，条目将按完整 URL 分组。但是，你可能希望使用正则表达式来规范化或分组类似的传出请求。有关更多信息，请参阅[慢传出请求记录器](#slow-outgoing-requests-recorder)文档。

<a name="cache-card"></a>
#### 缓存

`<livewire:pulse.cache />` 卡片显示应用程序的缓存命中和未命中统计信息，包括全局和单个键的统计信息。

默认情况下，条目将按键分组。但是，你可能希望使用正则表达式来规范化或分组类似的键。有关更多信息，请参阅[缓存交互记录器](#cache-interactions-recorder)文档。

<a name="capturing-entries"></a>
## 捕获条目

大多数 Pulse 记录器会根据 Laravel 分派的框架事件自动捕获条目。但是，[服务器记录器](#servers-recorder)和一些第三方卡片必须定期轮询信息。要使用这些卡片，你必须在所有单独的应用程序服务器上运行 `pulse:check` 守护进程：

```php
php artisan pulse:check
```

> [!NOTE]
> 要使 `pulse:check` 进程在后台永久运行，你应该使用诸如 Supervisor 之类的进程监视器来确保该命令不会停止运行。

由于 `pulse:check` 命令是一个长期运行的进程，它不会在未重启的情况下看到代码库的更改。你应该在应用程序的部署过程中调用 `pulse:restart` 命令来优雅地重启该命令：

```shell
php artisan pulse:restart
```

> [!NOTE]
> Pulse 使用[缓存](/docs/{{version}}/cache)来存储重启信号，因此在使用此功能之前，你应该验证已为应用程序正确配置了缓存驱动。

<a name="recorders"></a>
### 记录器

记录器负责从应用程序捕获条目以记录到 Pulse 数据库中。记录器在 [Pulse 配置文件](#configuration)的 `recorders` 部分中注册和配置。

<a name="cache-interactions-recorder"></a>
#### 缓存交互

`CacheInteractions` 记录器捕获应用程序中发生的[缓存](/docs/{{version}}/cache)命中和未命中信息，用于在[缓存](#cache-card)卡片上显示。

你可以选择调整[采样率](#sampling)和忽略的键模式。

你还可以配置键分组，以便将类似的键分组为单个条目。例如，你可能希望从缓存相同类型信息的键中删除唯一 ID。分组使用正则表达式来"查找和替换"键的部分。配置文件中包含了一个示例：

```php
Recorders\CacheInteractions::class => [
    // ...
    'groups' => [
        // '/:\d+/' => ':*',
    ],
],
```

第一个匹配的模式将被使用。如果没有模式匹配，键将按原样捕获。

<a name="exceptions-recorder"></a>
#### 异常

`Exceptions` 记录器捕获应用程序中发生的可报告异常的信息，用于在[异常](#exceptions-card)卡片上显示。

你可以选择调整[采样率](#sampling)和忽略的异常模式。你还可以配置是否捕获异常来源的位置。捕获的位置将显示在 Pulse 仪表盘上，有助于追踪异常来源；但是，如果同一异常在多个位置发生，它将为每个唯一位置出现多次。

<a name="queues-recorder"></a>
#### 队列

`Queues` 记录器捕获应用程序队列的信息，用于在[队列](#queues-card)卡片上显示。

你可以选择调整[采样率](#sampling)和忽略的作业模式。

<a name="slow-jobs-recorder"></a>
#### 慢作业

`SlowJobs` 记录器捕获应用程序中发生的慢作业的信息，用于在[慢作业](#slow-jobs-recorder)卡片上显示。

你可以选择调整慢作业阈值、[采样率](#sampling)和忽略的作业模式。

你可能有一些预期比其他作业花费更长时间的作业。在这种情况下，你可以配置每个作业的阈值：

```php
Recorders\SlowJobs::class => [
    // ...
    'threshold' => [
        '#^App\\Jobs\\GenerateYearlyReports$#' => 5000,
        'default' => env('PULSE_SLOW_JOBS_THRESHOLD', 1000),
    ],
],
```

如果没有正则表达式模式匹配到作业的类名，则将使用 `'default'` 值。

<a name="slow-outgoing-requests-recorder"></a>
#### 慢传出请求

`SlowOutgoingRequests` 记录器捕获使用 Laravel 的 [HTTP 客户端](/docs/{{version}}/http-client)发出且超过配置阈值的传出 HTTP 请求的信息，用于在[慢传出请求](#slow-outgoing-requests-card)卡片上显示。

你可以选择调整慢传出请求阈值、[采样率](#sampling)和忽略的 URL 模式。

你可能有一些预期比其他请求花费更长时间的传出请求。在这种情况下，你可以配置每个请求的阈值：

```php
Recorders\SlowOutgoingRequests::class => [
    // ...
    'threshold' => [
        '#backup.zip$#' => 5000,
        'default' => env('PULSE_SLOW_OUTGOING_REQUESTS_THRESHOLD', 1000),
    ],
],
```

如果没有正则表达式模式匹配到请求的 URL，则将使用 `'default'` 值。

你还可以配置 URL 分组，以便将类似的 URL 分组为单个条目。例如，你可能希望从 URL 路径中删除唯一 ID 或仅按域名分组。分组使用正则表达式来"查找和替换"URL 的部分。配置文件中包含了一些示例：

```php
Recorders\SlowOutgoingRequests::class => [
    // ...
    'groups' => [
        // '#^https://api\.github\.com/repos/.*$#' => 'api.github.com/repos/*',
        // '#^https?://([^/]*).*$#' => '\1',
        // '#/\d+#' => '/*',
    ],
],
```

第一个匹配的模式将被使用。如果没有模式匹配，URL 将按原样捕获。

<a name="slow-queries-recorder"></a>
#### 慢查询

`SlowQueries` 记录器捕获应用程序中超过配置阈值的任何数据库查询，用于在[慢查询](#slow-queries-card)卡片上显示。

你可以选择调整慢查询阈值、[采样率](#sampling)和忽略的查询模式。你还可以配置是否捕获查询位置。捕获的位置将显示在 Pulse 仪表盘上，有助于追踪查询来源；但是，如果同一查询在多个位置执行，它将为每个唯一位置出现多次。

你可能有一些预期比其他查询花费更长时间的查询。在这种情况下，你可以配置每个查询的阈值：

```php
Recorders\SlowQueries::class => [
    // ...
    'threshold' => [
        '#^insert into `yearly_reports`#' => 5000,
        'default' => env('PULSE_SLOW_QUERIES_THRESHOLD', 1000),
    ],
],
```

如果没有正则表达式模式匹配到查询的 SQL，则将使用 `'default'` 值。

<a name="slow-requests-recorder"></a>
#### 慢请求

`Requests` 记录器捕获对应用程序发出的请求的信息，用于在[慢请求](#slow-requests-card)和[应用使用情况](#application-usage-card)卡片上显示。

你可以选择调整慢路由阈值、[采样率](#sampling)和忽略的路径。

你可能有一些预期比其他请求花费更长时间的请求。在这种情况下，你可以配置每个请求的阈值：

```php
Recorders\SlowRequests::class => [
    // ...
    'threshold' => [
        '#^/admin/#' => 5000,
        'default' => env('PULSE_SLOW_REQUESTS_THRESHOLD', 1000),
    ],
],
```

如果没有正则表达式模式匹配到请求的 URL，则将使用 `'default'` 值。

<a name="servers-recorder"></a>
#### 服务器

`Servers` 记录器捕获为应用程序提供服务的服务器的 CPU、内存和存储使用情况，用于在[服务器](#servers-card)卡片上显示。此记录器需要在你要监视的每台服务器上运行 [pulse:check 命令](#capturing-entries)。

每台报告服务器必须有一个唯一的名称。默认情况下，Pulse 将使用 PHP 的 `gethostname` 函数返回的值。如果你想自定义此设置，可以设置 `PULSE_SERVER_NAME` 环境变量：

```env
PULSE_SERVER_NAME=load-balancer
```

Pulse 配置文件还允许你自定义受监控的目录。

<a name="user-jobs-recorder"></a>
#### 用户作业

`UserJobs` 记录器捕获在应用程序中分派作业的用户的信息，用于在[应用使用情况](#application-usage-card)卡片上显示。

你可以选择调整[采样率](#sampling)和忽略的作业模式。

<a name="user-requests-recorder"></a>
#### 用户请求

`UserRequests` 记录器捕获向应用程序发出请求的用户的信息，用于在[应用使用情况](#application-usage-card)卡片上显示。

你可以选择调整[采样率](#sampling)和忽略的 URL 模式。

<a name="filtering"></a>
### 过滤

正如我们所看到的，许多[记录器](#recorders)提供了通过配置"忽略"传入条目的能力，例如基于请求的 URL 进行忽略。但是，有时基于其他因素过滤记录可能很有用，例如当前已验证的用户。要过滤这些记录，你可以向 Pulse 的 `filter` 方法传递一个闭包。通常，`filter` 方法应在应用程序的 `AppServiceProvider` 的 `boot` 方法中调用：

```php
use Illuminate\Support\Facades\Auth;
use Laravel\Pulse\Entry;
use Laravel\Pulse\Facades\Pulse;
use Laravel\Pulse\Value;

/**
 * 引导任意应用服务。
 */
public function boot(): void
{
    Pulse::filter(function (Entry|Value $entry) {
        return Auth::user()->isNotAdmin();
    });

    // ...
}
```

<a name="performance"></a>
## 性能

Pulse 旨在直接嵌入现有应用程序，无需任何额外基础设施。但是，对于高流量应用程序，有几种方法可以消除 Pulse 对应用程序性能的任何影响。

<a name="using-a-different-database"></a>
### 使用不同的数据库

对于高流量应用程序，你可能更倾向于使用专用数据库连接来存储 Pulse 数据，以避免影响主应用程序数据库。

你可以通过设置 `PULSE_DB_CONNECTION` 环境变量来自定义 Pulse 使用的[数据库连接](/docs/{{version}}/database#configuration)。

```env
PULSE_DB_CONNECTION=pulse
```

<a name="ingest"></a>
### Redis 摄取

> [!WARNING]
> Redis 摄取需要 Redis 6.2 或更高版本，并且应用程序配置的 Redis 客户端驱动为 `phpredis` 或 `predis`。

默认情况下，Pulse 会在 HTTP 响应发送到客户端或作业处理完成后，直接将条目存储到[配置的数据库连接](#using-a-different-database)；但是，你可以使用 Pulse 的 Redis 摄取驱动将条目发送到 Redis 流中。这可以通过配置 `PULSE_INGEST_DRIVER` 环境变量来启用：

```ini
PULSE_INGEST_DRIVER=redis
```

Pulse 默认会使用你的默认 [Redis 连接](/docs/{{version}}/redis#configuration)，但你可以通过 `PULSE_REDIS_CONNECTION` 环境变量自定义此设置：

```ini
PULSE_REDIS_CONNECTION=pulse
```

> [!WARNING]
> 使用 Redis 摄取驱动时，你的 Pulse 安装应始终使用与 Redis 驱动的队列不同的 Redis 连接（如果适用）。

使用 Redis 摄取时，你需要运行 `pulse:work` 命令来监控流并将条目从 Redis 移动到 Pulse 的数据库表中。

```php
php artisan pulse:work
```

> [!NOTE]
> 要使 `pulse:work` 进程在后台永久运行，你应该使用诸如 Supervisor 之类的进程监视器来确保 Pulse 工作进程不会停止运行。

由于 `pulse:work` 命令是一个长期运行的进程，它不会在未重启的情况下看到代码库的更改。你应该在应用程序的部署过程中调用 `pulse:restart` 命令来优雅地重启该命令：

```shell
php artisan pulse:restart
```

> [!NOTE]
> Pulse 使用[缓存](/docs/{{version}}/cache)来存储重启信号，因此在使用此功能之前，你应该验证已为应用程序正确配置了缓存驱动。

<a name="sampling"></a>
### 采样

默认情况下，Pulse 会捕获应用程序中发生的每个相关事件。对于高流量应用程序，这可能导致需要在仪表盘中聚合数百万条数据库行，尤其是对于较长时间段。

你可以选择在某些 Pulse 数据记录器上启用"采样"。例如，将[用户请求](#user-requests-recorder)记录器的采样率设置为 `0.1` 意味着你只记录大约 10% 的应用程序请求。在仪表盘中，这些值将被放大并加上 `~` 前缀以表示它们是近似值。

一般来说，特定指标的条目越多，你可以在不牺牲太多准确性的情况下安全地设置更低的采样率。

<a name="trimming"></a>
### 修剪

Pulse 将自动修剪超出仪表盘窗口的存储条目。修剪在摄取数据时通过抽奖系统进行，该系统可以在 Pulse [配置文件](#configuration)中自定义。

<a name="pulse-exceptions"></a>
### 处理 Pulse 异常

如果在捕获 Pulse 数据时发生异常（例如无法连接到存储数据库），Pulse 将静默失败以避免影响你的应用程序。

如果你希望自定义这些异常的处理方式，可以向 `handleExceptionsUsing` 方法提供一个闭包：

```php
use Laravel\Pulse\Facades\Pulse;
use Illuminate\Support\Facades\Log;

Pulse::handleExceptionsUsing(function ($e) {
    Log::debug('Pulse 中发生异常', [
        'message' => $e->getMessage(),
        'stack' => $e->getTraceAsString(),
    ]);
});
```

<a name="custom-cards"></a>
## 自定义卡片

Pulse 允许你构建自定义卡片来显示与应用程序特定需求相关的数据。Pulse 使用 [Livewire](https://livewire.laravel.com)，因此在构建第一个自定义卡片之前，你可能需要[查阅其文档](https://livewire.laravel.com/docs)。

<a name="custom-card-components"></a>
### 卡片组件

在 Laravel Pulse 中创建自定义卡片首先需要扩展基础 `Card` Livewire 组件并定义相应的视图：

```php
namespace App\Livewire\Pulse;

use Laravel\Pulse\Livewire\Card;
use Livewire\Attributes\Lazy;

#[Lazy]
class TopSellers extends Card
{
    public function render()
    {
        return view('livewire.pulse.top-sellers');
    }
}
```

使用 Livewire 的[懒加载](https://livewire.laravel.com/docs/lazy)功能时，`Card` 组件会自动提供一个占位符，该占位符会尊重传递给组件的 `cols` 和 `rows` 属性。

编写 Pulse 卡片的相应视图时，你可以利用 Pulse 的 Blade 组件来保持一致的外观和风格：

```blade
<x-pulse::card :cols="$cols" :rows="$rows" :class="$class" wire:poll.5s="">
    <x-pulse::card-header name="Top Sellers">
        <x-slot:icon>
            ...
        </x-slot:icon>
    </x-pulse::card-header>

    <x-pulse::scroll :expand="$expand">
        ...
    </x-pulse::scroll>
</x-pulse::card>
```

`$cols`、`$rows`、`$class` 和 `$expand` 变量应传递给各自的 Blade 组件，以便可以从仪表盘视图自定义卡片布局。你可能还希望在你的视图中包含 `wire:poll.5s=""` 属性以使卡片自动更新。

一旦你定义了 Livewire 组件和模板，就可以在[仪表盘视图](#dashboard-customization)中包含该卡片：

```blade
<x-pulse>
    ...

    <livewire:pulse.top-sellers cols="4" />
</x-pulse>
```

> [!NOTE]
> 如果你的卡片包含在包中，你需要使用 `Livewire::component` 方法向 Livewire 注册该组件。

<a name="custom-card-styling"></a>
### 样式

如果你的卡片需要超出 Pulse 附带的类和组件的额外样式，有几种选项可以为卡片包含自定义 CSS。

<a name="custom-card-styling-vite"></a>
#### Laravel Vite 集成

如果你的自定义卡片位于应用程序代码库中，并且你正在使用 Laravel 的 [Vite 集成](/docs/{{version}}/vite)，你可以更新 `vite.config.js` 文件来为你的卡片包含一个专用的 CSS 入口点：

```js
laravel({
    input: [
        'resources/css/pulse/top-sellers.css',
        // ...
    ],
}),
```

然后你可以在[仪表盘视图](#dashboard-customization)中使用 `@vite` Blade 指令，指定卡片的 CSS 入口点：

```blade
<x-pulse>
    @vite('resources/css/pulse/top-sellers.css')

    ...
</x-pulse>
```

<a name="custom-card-styling-css"></a>
#### CSS 文件

对于其他用例，包括包含在包中的 Pulse 卡片，你可以通过在你的 Livewire 组件上定义一个 `css` 方法来指示 Pulse 加载额外的样式表，该方法返回 CSS 文件的路径：

```php
class TopSellers extends Card
{
    // ...

    protected function css()
    {
        return __DIR__.'/../../dist/top-sellers.css';
    }
}
```

当此卡片包含在仪表盘中时，Pulse 会自动将此文件的内容包含在 `<style>` 标签内，因此无需将其发布到 `public` 目录。

<a name="custom-card-styling-tailwind"></a>
#### Tailwind CSS

使用 Tailwind CSS 时，你应该创建一个专用的 CSS 入口点。以下示例排除了 Pulse 已包含的 Tailwind 的 [Preflight](https://tailwindcss.com/docs/preflight) 基础样式，并使用 CSS 选择器限定 Tailwind 的作用域，以避免与 Pulse 的 Tailwind 类冲突：

```css
@import "tailwindcss/theme.css";

@custom-variant dark (&:where(.dark, .dark *));
@source "./../../views/livewire/pulse/top-sellers.blade.php";

@theme {
  /* ... */
}

#top-sellers {
  @import "tailwindcss/utilities.css" source(none);
}
```

你还需要在卡片的视图中包含一个 `id` 或 `class` 属性，以匹配入口点中的 CSS 选择器：

```blade
<x-pulse::card id="top-sellers" :cols="$cols" :rows="$rows" class="$class">
    ...
</x-pulse::card>
```

<a name="custom-card-data"></a>
### 数据捕获与聚合

自定义卡片可以从任何地方获取和显示数据；但是，你可能希望利用 Pulse 强大而高效的数据记录和聚合系统。

<a name="custom-card-data-capture"></a>
#### 捕获条目

Pulse 允许你使用 `Pulse::record` 方法记录"条目"：

```php
use Laravel\Pulse\Facades\Pulse;

Pulse::record('user_sale', $user->id, $sale->amount)
    ->sum()
    ->count();
```

传递给 `record` 方法的第一个参数是你要记录的条目的 `type`，第二个参数是确定聚合数据应如何分组的 `key`。对于大多数聚合方法，你还需要指定要聚合的 `value`。在上面的示例中，正在聚合的值是 `$sale->amount`。然后，你可以调用一个或多个聚合方法（如 `sum`），以便 Pulse 可以将预聚合的值捕获到"存储桶"中，以便以后高效检索。

可用的聚合方法有：

* `avg`
* `count`
* `max`
* `min`
* `sum`

> [!NOTE]
> 当构建捕获当前已验证用户 ID 的卡片包时，你应该使用 `Pulse::resolveAuthenticatedUserId()` 方法，该方法会尊重对应用程序所做的任何[用户解析器自定义](#dashboard-resolving-users)。

<a name="custom-card-data-retrieval"></a>
#### 检索聚合数据

当扩展 Pulse 的 `Card` Livewire 组件时，你可以使用 `aggregate` 方法检索仪表盘中正在查看的时间段的聚合数据：

```php
class TopSellers extends Card
{
    public function render()
    {
        return view('livewire.pulse.top-sellers', [
            'topSellers' => $this->aggregate('user_sale', ['sum', 'count'])
        ]);
    }
}
```

`aggregate` 方法返回一个 PHP `stdClass` 对象的集合。每个对象将包含之前捕获的 `key` 属性，以及每个请求聚合的键：

```blade
@foreach ($topSellers as $seller)
    {{ $seller->key }}
    {{ $seller->sum }}
    {{ $seller->count }}
@endforeach
```

Pulse 主要从预聚合的存储桶中检索数据；因此，指定的聚合必须事先使用 `Pulse::record` 方法捕获。最旧的存储桶通常会部分超出时间段范围，因此 Pulse 将聚合最旧的条目来填补空白，并为整个时间段提供准确的值，而无需在每次轮询请求时聚合整个时间段。

你还可以使用 `aggregateTotal` 方法检索给定类型的总值。例如，以下方法将检索所有用户销售的总和，而不是按用户分组。

```php
$total = $this->aggregateTotal('user_sale', 'sum');
```

<a name="custom-card-displaying-users"></a>
#### 显示用户

当处理将用户 ID 记录为键的聚合时，你可以使用 `Pulse::resolveUsers` 方法将键解析为用户记录：

```php
$aggregates = $this->aggregate('user_sale', ['sum', 'count']);

$users = Pulse::resolveUsers($aggregates->pluck('key'));

return view('livewire.pulse.top-sellers', [
    'sellers' => $aggregates->map(fn ($aggregate) => (object) [
        'user' => $users->find($aggregate->key),
        'sum' => $aggregate->sum,
        'count' => $aggregate->count,
    ])
]);
```

`find` 方法返回一个包含 `name`、`extra` 和 `avatar` 键的对象，你可以选择直接将其传递给 `<x-pulse::user-card>` Blade 组件：

```blade
<x-pulse::user-card :user="{{ $seller->user }}" :stats="{{ $seller->sum }}" />
```

<a name="custom-recorders"></a>
#### 自定义记录器

包作者可能希望提供记录器类，以允许用户配置数据捕获。

记录器在应用程序的 `config/pulse.php` 配置文件的 `recorders` 部分中注册：

```php
[
    // ...
    'recorders' => [
        Acme\Recorders\Deployments::class => [
            // ...
        ],

        // ...
    ],
]
```

记录器可以通过指定 `$listen` 属性来监听事件。Pulse 将自动注册监听器并调用记录器的 `record` 方法：

```php
<?php

namespace Acme\Recorders;

use Acme\Events\Deployment;
use Illuminate\Support\Facades\Config;
use Laravel\Pulse\Facades\Pulse;

class Deployments
{
    /**
     * 要监听的事件。
     *
     * @var array<int, class-string>
     */
    public array $listen = [
        Deployment::class,
    ];

    /**
     * 记录部署。
     */
    public function record(Deployment $event): void
    {
        $config = Config::get('pulse.recorders.'.static::class);

        Pulse::record(
            // ...
        );
    }
}
```

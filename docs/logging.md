# 日志

- [简介](#introduction)
- [配置](#configuration)
    - [可用通道驱动](#available-channel-drivers)
    - [通道前置条件](#channel-prerequisites)
    - [记录弃用警告](#logging-deprecation-warnings)
- [构建日志堆栈](#building-log-stacks)
- [编写日志消息](#writing-log-messages)
    - [上下文信息](#contextual-information)
    - [写入特定通道](#writing-to-specific-channels)
- [Monolog 通道自定义](#monolog-channel-customization)
    - [为通道自定义 Monolog](#customizing-monolog-for-channels)
    - [创建 Monolog 处理器通道](#creating-monolog-handler-channels)
    - [通过工厂创建自定义通道](#creating-custom-channels-via-factories)
- [使用 Pail 跟踪日志消息](#tailing-log-messages-using-pail)
    - [安装](#pail-installation)
    - [使用](#pail-usage)
    - [过滤日志](#pail-filtering-logs)

<a name="introduction"></a>
## 简介

为了帮助你更多地了解应用程序内部发生的情况，Laravel 提供了强大的日志服务，允许你将消息记录到文件、系统错误日志，甚至可以记录到 Slack 以通知整个团队。

Laravel 的日志基于"通道"。每个通道代表一种特定的日志信息写入方式。例如，`single` 通道将日志文件写入单个日志文件，而 `slack` 通道将日志消息发送到 Slack。日志消息可以根据其严重性写入多个通道。

在底层，Laravel 使用 [Monolog](https://github.com/Seldaek/monolog) 库，该库支持各种强大的日志处理器。Laravel 使配置这些处理器变得非常简单，允许你混合搭配以自定义应用程序的日志处理。

<a name="configuration"></a>
## 配置

控制应用程序日志行为的所有配置选项都位于 `config/logging.php` 配置文件中。此文件允许你配置应用程序的日志通道，因此请务必查看每个可用通道及其选项。下面我们将介绍一些常见选项。

默认情况下，Laravel 在记录消息时将使用 `stack` 通道。`stack` 通道用于将多个日志通道聚合到单个通道中。有关构建堆栈的更多信息，请查看[下面的文档](#building-log-stacks)。

<a name="available-channel-drivers"></a>
### 可用通道驱动

每个日志通道都由一个"驱动"提供支持。驱动决定了日志消息实际记录的方式和位置。以下日志通道驱动在每个 Laravel 应用程序中都可用。你的应用程序的 `config/logging.php` 配置文件中已有大多数这些驱动的条目，因此请务必查看此文件以熟悉其内容：

<div class="overflow-auto">

| 名称         | 描述                                                          |
| ------------ | -------------------------------------------------------------------- |
| `custom`     | 一个调用指定工厂来创建通道的驱动。         |
| `daily`      | 基于 `RotatingFileHandler` 的 Monolog 驱动，每天轮换。    |
| `errorlog`   | 基于 `ErrorLogHandler` 的 Monolog 驱动。                           |
| `monolog`    | 一个 Monolog 工厂驱动，可以使用任何受支持的 Monolog 处理器。 |
| `papertrail` | 基于 `SyslogUdpHandler` 的 Monolog 驱动。                           |
| `single`     | 基于单个文件或路径的日志通道（`StreamHandler`）。        |
| `slack`      | 基于 `SlackWebhookHandler` 的 Monolog 驱动。                        |
| `stack`      | 一个包装器，用于方便创建"多通道"通道。           |
| `syslog`     | 基于 `SyslogHandler` 的 Monolog 驱动。                              |

</div>

> [!NOTE]
> 查看关于[高级通道自定义](#monolog-channel-customization)的文档，了解更多关于 `monolog` 和 `custom` 驱动的信息。

<a name="configuring-the-channel-name"></a>
#### 配置通道名称

默认情况下，Monolog 以与当前环境匹配的"通道名称"实例化，例如 `production` 或 `local`。要更改此值，你可以向通道配置添加一个 `name` 选项：

```php
'stack' => [
    'driver' => 'stack',
    'name' => 'channel-name',
    'channels' => ['single', 'slack'],
],
```

<a name="channel-prerequisites"></a>
### 通道前置条件

<a name="configuring-the-single-and-daily-channels"></a>
#### 配置 Single 和 Daily 通道

`single` 和 `daily` 通道有三个可选配置选项：`bubble`、`permission` 和 `locking`。

<div class="overflow-auto">

| 名称         | 描述                                                                   | 默认值 |
| ------------ | ----------------------------------------------------------------------------- | ------- |
| `bubble`     | 指示消息在被处理后是否应冒泡到其他通道。 | `true`  |
| `locking`    | 尝试在写入前锁定日志文件。                            | `false` |
| `permission` | 日志文件的权限。                                                   | `0644`  |

</div>

此外，`daily` 通道的保留策略可以通过 `LOG_DAILY_DAYS` 环境变量或设置 `days` 配置选项来配置。

<div class="overflow-auto">

| 名称   | 描述                                                 | 默认值 |
| ------ | ----------------------------------------------------------- | ------- |
| `days` | 应保留的日常日志文件的天数。 | `14`    |

</div>

<a name="configuring-the-papertrail-channel"></a>
#### 配置 Papertrail 通道

`papertrail` 通道需要 `host` 和 `port` 配置选项。这些可以通过 `PAPERTRAIL_URL` 和 `PAPERTRAIL_PORT` 环境变量定义。你可以从 [Papertrail](https://help.papertrailapp.com/kb/configuration/configuring-centralized-logging-from-php-apps/#send-events-from-php-app) 获取这些值。

<a name="configuring-the-slack-channel"></a>
#### 配置 Slack 通道

`slack` 通道需要一个 `url` 配置选项。此值可以通过 `LOG_SLACK_WEBHOOK_URL` 环境变量定义。此 URL 应与为你 Slack 团队配置的[传入 Webhook](https://slack.com/apps/A0F7XDUAZ-incoming-webhooks) 的 URL 匹配。

默认情况下，Slack 仅接收 `critical` 级别及以上的日志；但是，你可以使用 `LOG_LEVEL` 环境变量或修改 Slack 日志通道配置数组中的 `level` 配置选项来调整此设置。

<a name="logging-deprecation-warnings"></a>
### 记录弃用警告

PHP、Laravel 和其他库通常会通知用户其某些功能已被弃用，并将在未来版本中移除。如果你想记录这些弃用警告，可以使用 `LOG_DEPRECATIONS_CHANNEL` 环境变量或在应用程序的 `config/logging.php` 配置文件中指定首选的 `deprecations` 日志通道：

```php
'deprecations' => [
    'channel' => env('LOG_DEPRECATIONS_CHANNEL', 'null'),
    'trace' => env('LOG_DEPRECATIONS_TRACE', false),
],

'channels' => [
    // ...
]
```

或者，你可以定义一个名为 `deprecations` 的日志通道。如果存在此名称的日志通道，它将始终用于记录弃用信息：

```php
'channels' => [
    'deprecations' => [
        'driver' => 'single',
        'path' => storage_path('logs/php-deprecation-warnings.log'),
    ],
],
```

<a name="building-log-stacks"></a>
## 构建日志堆栈

如前所述，`stack` 驱动允许你将多个通道组合成一个单一的日志通道以方便使用。为了说明如何使用日志堆栈，让我们看一个在生产应用程序中可能看到的示例配置：

```php
'channels' => [
    'stack' => [
        'driver' => 'stack',
        'channels' => ['syslog', 'slack'], // [tl! add]
        'ignore_exceptions' => false,
    ],

    'syslog' => [
        'driver' => 'syslog',
        'level' => env('LOG_LEVEL', 'debug'),
        'facility' => env('LOG_SYSLOG_FACILITY', LOG_USER),
        'replace_placeholders' => true,
    ],

    'slack' => [
        'driver' => 'slack',
        'url' => env('LOG_SLACK_WEBHOOK_URL'),
        'username' => env('LOG_SLACK_USERNAME', 'Laravel Log'),
        'emoji' => env('LOG_SLACK_EMOJI', ':boom:'),
        'level' => env('LOG_LEVEL', 'critical'),
        'replace_placeholders' => true,
    ],
],
```

让我们分析这个配置。首先，注意我们的 `stack` 通道通过其 `channels` 选项聚合了另外两个通道：`syslog` 和 `slack`。因此，当记录消息时，这两个通道都将有机会记录该消息。但是，如下所述，这些通道是否实际记录消息可能取决于消息的严重性/"级别"。

<a name="log-levels"></a>
#### 日志级别

请注意上面示例中 `syslog` 和 `slack` 通道配置中的 `level` 配置选项。此选项决定了消息要由该通道记录所需的最低"级别"。为 Laravel 日志服务提供支持的 Monolog 提供了 [RFC 5424 规范](https://tools.ietf.org/html/rfc5424) 中定义的所有日志级别。按严重性降序排列，这些日志级别为：**emergency**（紧急）、**alert**（警报）、**critical**（严重）、**error**（错误）、**warning**（警告）、**notice**（通知）、**info**（信息）和 **debug**（调试）。

因此，假设我们使用 `debug` 方法记录一条消息：

```php
Log::debug('一条信息性消息。');
```

根据我们的配置，`syslog` 通道会将消息写入系统日志；但是，由于错误消息不是 `critical` 或更高级别，它不会被发送到 Slack。然而，如果我们记录一条 `emergency` 消息，它将被发送到系统日志和 Slack，因为 `emergency` 级别高于两个通道的最低级别阈值：

```php
Log::emergency('系统宕机了！');
```

<a name="writing-log-messages"></a>
## 编写日志消息

你可以使用 `Log` [外观](/docs/{{version}}/facades)将信息写入日志。如前所述，日志记录器提供了 [RFC 5424 规范](https://tools.ietf.org/html/rfc5424) 中定义的八个日志级别：**emergency**（紧急）、**alert**（警报）、**critical**（严重）、**error**（错误）、**warning**（警告）、**notice**（通知）、**info**（信息）和 **debug**（调试）：

```php
use Illuminate\Support\Facades\Log;

Log::emergency($message);
Log::alert($message);
Log::critical($message);
Log::error($message);
Log::warning($message);
Log::notice($message);
Log::info($message);
Log::debug($message);
```

你可以调用这些方法中的任何一个来记录相应级别的消息。默认情况下，消息将写入由你的 `logging` 配置文件配置的默认日志通道：

```php
<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\View\View;

class UserController extends Controller
{
    /**
     * 显示给定用户的个人资料。
     */
    public function show(string $id): View
    {
        Log::info('显示用户 {id} 的个人资料', ['id' => $id]);

        return view('user.profile', [
            'user' => User::findOrFail($id)
        ]);
    }
}
```

<a name="contextual-information"></a>
### 上下文信息

可以将上下文数据数组传递给日志方法。此上下文数据将与日志消息一起格式化和显示：

```php
use Illuminate\Support\Facades\Log;

Log::info('用户 {id} 登录失败。', ['id' => $user->id]);
```

偶尔，你可能希望指定一些应包含在特定通道的所有后续日志条目中的上下文信息。例如，你可能希望记录与应用程序的每个传入请求关联的请求 ID。为此，你可以调用 `Log` 外观的 `withContext` 方法：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class AssignRequestId
{
    /**
     * 处理传入请求。
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $requestId = (string) Str::uuid();

        Log::withContext([
            'request-id' => $requestId
        ]);

        $response = $next($request);

        $response->headers->set('Request-Id', $requestId);

        return $response;
    }
}
```

如果你希望与**所有**日志通道共享上下文信息，可以调用 `Log::shareContext()` 方法。此方法将向所有已创建的通道以及随后创建的任何通道提供上下文信息：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class AssignRequestId
{
    /**
     * 处理传入请求。
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $requestId = (string) Str::uuid();

        Log::shareContext([
            'request-id' => $requestId
        ]);

        // ...
    }
}
```

> [!NOTE]
> 如果你需要在处理队列任务时共享日志上下文，可以使用[任务中间件](/docs/{{version}}/queues#job-middleware)。

<a name="writing-to-specific-channels"></a>
### 写入特定通道

有时你可能希望将消息记录到应用程序默认通道以外的通道。你可以使用 `Log` 外观的 `channel` 方法来获取并记录到配置文件中定义的任何通道：

```php
use Illuminate\Support\Facades\Log;

Log::channel('slack')->info('发生了某些事情！');
```

如果你想创建一个由多个通道组成的按需日志堆栈，可以使用 `stack` 方法：

```php
Log::stack(['single', 'slack'])->info('发生了某些事情！');
```

<a name="on-demand-channels"></a>
#### 按需通道

还可以通过在没有应用程序 `logging` 配置文件的情况下在运行时提供配置来创建按需通道。为此，可以将配置数组传递给 `Log` 外观的 `build` 方法：

```php
use Illuminate\Support\Facades\Log;

Log::build([
  'driver' => 'single',
  'path' => storage_path('logs/custom.log'),
])->info('发生了某些事情！');
```

你可能还希望将按需通道包含在按需日志堆栈中。这可以通过将按需通道实例包含在传递给 `stack` 方法的数组中来实现：

```php
use Illuminate\Support\Facades\Log;

$channel = Log::build([
  'driver' => 'single',
  'path' => storage_path('logs/custom.log'),
]);

Log::stack(['slack', $channel])->info('发生了某些事情！');
```

<a name="monolog-channel-customization"></a>
## Monolog 通道自定义

<a name="customizing-monolog-for-channels"></a>
### 为通道自定义 Monolog

有时你可能需要完全控制如何为现有通道配置 Monolog。例如，你可能希望为 Laravel 的内置 `single` 通道配置自定义的 Monolog `FormatterInterface` 实现。

首先，在通道的配置上定义一个 `tap` 数组。`tap` 数组应包含一个类列表，这些类有机会在 Monolog 实例创建后进行自定义（或"接入"）。这些类没有约定俗成的位置，因此你可以在应用程序中自由创建目录来包含这些类：

```php
'single' => [
    'driver' => 'single',
    'tap' => [App\Logging\CustomizeFormatter::class],
    'path' => storage_path('logs/laravel.log'),
    'level' => env('LOG_LEVEL', 'debug'),
    'replace_placeholders' => true,
],
```

一旦你在通道上配置了 `tap` 选项，就可以定义自定义 Monolog 实例的类。这个类只需要一个方法：`__invoke`，它接收一个 `Illuminate\Log\Logger` 实例。`Illuminate\Log\Logger` 实例将所有方法调用代理到底层 Monolog 实例：

```php
<?php

namespace App\Logging;

use Illuminate\Log\Logger;
use Monolog\Formatter\LineFormatter;

class CustomizeFormatter
{
    /**
     * 自定义给定的日志记录器实例。
     */
    public function __invoke(Logger $logger): void
    {
        foreach ($logger->getHandlers() as $handler) {
            $handler->setFormatter(new LineFormatter(
                '[%datetime%] %channel%.%level_name%: %message% %context% %extra%'
            ));
        }
    }
}
```

> [!NOTE]
> 你所有的"tap"类都由[服务容器](/docs/{{version}}/container)解析，因此它们所需的任何构造函数依赖都将自动注入。

<a name="creating-monolog-handler-channels"></a>
### 创建 Monolog 处理器通道

Monolog 有各种[可用的处理器](https://github.com/Seldaek/monolog/tree/main/src/Monolog/Handler)，Laravel 并没有为每个处理器都包含一个内置通道。在某些情况下，你可能希望创建一个自定义通道，它仅是特定 Monolog 处理器的一个实例，而该处理器没有对应的 Laravel 日志驱动。这些通道可以使用 `monolog` 驱动轻松创建。

当使用 `monolog` 驱动时，`handler` 配置选项用于指定将实例化哪个处理器。可选地，处理器所需的任何构造函数参数可以使用 `handler_with` 配置选项指定：

```php
'logentries' => [
    'driver'  => 'monolog',
    'handler' => Monolog\Handler\SyslogUdpHandler::class,
    'handler_with' => [
        'host' => 'my.logentries.internal.datahubhost.company.com',
        'port' => '10000',
    ],
],
```

<a name="monolog-formatters"></a>
#### Monolog 格式化器

当使用 `monolog` 驱动时，Monolog `LineFormatter` 将用作默认格式化器。但是，你可以使用 `formatter` 和 `formatter_with` 配置选项自定义传递给处理器的格式化器类型：

```php
'browser' => [
    'driver' => 'monolog',
    'handler' => Monolog\Handler\BrowserConsoleHandler::class,
    'formatter' => Monolog\Formatter\HtmlFormatter::class,
    'formatter_with' => [
        'dateFormat' => 'Y-m-d',
    ],
],
```

如果你使用的是能够提供自己的格式化器的 Monolog 处理器，可以将 `formatter` 配置选项的值设置为 `default`：

```php
'newrelic' => [
    'driver' => 'monolog',
    'handler' => Monolog\Handler\NewRelicHandler::class,
    'formatter' => 'default',
],
```

<a name="monolog-processors"></a>
#### Monolog 处理器

Monolog 还可以在记录消息之前处理消息。你可以创建自己的处理器，或使用 [Monolog 提供的现有处理器](https://github.com/Seldaek/monolog/tree/main/src/Monolog/Processor)。

如果你想自定义 `monolog` 驱动的处理器，请向通道的配置添加一个 `processors` 配置值：

```php
'memory' => [
    'driver' => 'monolog',
    'handler' => Monolog\Handler\StreamHandler::class,
    'handler_with' => [
        'stream' => 'php://stderr',
    ],
    'processors' => [
        // 简单语法...
        Monolog\Processor\MemoryUsageProcessor::class,

        // 带选项...
        [
            'processor' => Monolog\Processor\PsrLogMessageProcessor::class,
            'with' => ['removeUsedContextFields' => true],
        ],
    ],
],
```

<a name="creating-custom-channels-via-factories"></a>
### 通过工厂创建自定义通道

如果你想定义一个完全自定义的通道，完全控制 Monolog 的实例化和配置，你可以在 `config/logging.php` 配置文件中指定一个 `custom` 驱动类型。你的配置应包含一个 `via` 选项，其中包含将被调用以创建 Monolog 实例的工厂类名称：

```php
'channels' => [
    'example-custom-channel' => [
        'driver' => 'custom',
        'via' => App\Logging\CreateCustomLogger::class,
    ],
],
```

一旦你配置了 `custom` 驱动通道，就可以定义创建 Monolog 实例的类。这个类只需要一个 `__invoke` 方法，该方法应返回 Monolog 日志记录器实例。该方法将接收通道配置数组作为其唯一参数：

```php
<?php

namespace App\Logging;

use Monolog\Logger;

class CreateCustomLogger
{
    /**
     * 创建一个自定义 Monolog 实例。
     */
    public function __invoke(array $config): Logger
    {
        return new Logger(/* ... */);
    }
}
```

<a name="tailing-log-messages-using-pail"></a>
## 使用 Pail 跟踪日志消息

通常你可能需要实时跟踪应用程序的日志。例如，在调试问题或监控应用程序日志中特定类型的错误时。

Laravel Pail 是一个包，允许你直接从命令行轻松浏览 Laravel 应用程序的日志文件。与标准 `tail` 命令不同，Pail 设计用于与任何日志驱动一起工作，包括 [Laravel Nightwatch](https://nightwatch.laravel.com)、Sentry 或 Flare。此外，Pail 提供了一组有用的过滤器，帮助你快速找到你要找的内容。

<img src="https://laravel.com/img/docs/pail-example.png">

<a name="pail-installation"></a>
### 安装

> [!WARNING]
> Laravel Pail 需要 [PCNTL](https://www.php.net/manual/en/book.pcntl.php) PHP 扩展。

要开始使用，请使用 Composer 包管理器将 Pail 安装到你的项目中：

```shell
composer require --dev laravel/pail
```

<a name="pail-usage"></a>
### 使用

要开始跟踪日志，运行 `pail` 命令：

```shell
php artisan pail
```

要增加输出的详细程度并避免截断（…），请使用 `-v` 选项：

```shell
php artisan pail -v
```

要获得最大详细程度并显示异常堆栈跟踪，请使用 `-vv` 选项：

```shell
php artisan pail -vv
```

要停止跟踪日志，随时按 `Ctrl+C`。

<a name="pail-filtering-logs"></a>
### 过滤日志

<a name="pail-filtering-logs-filter-option"></a>
#### `--filter`

你可以使用 `--filter` 选项按日志类型、文件、消息和堆栈跟踪内容过滤日志：

```shell
php artisan pail --filter="QueryException"
```

<a name="pail-filtering-logs-message-option"></a>
#### `--message`

要仅按消息内容过滤日志，可以使用 `--message` 选项：

```shell
php artisan pail --message="User created"
```

<a name="pail-filtering-logs-level-option"></a>
#### `--level`

`--level` 选项可用于按[日志级别](#log-levels)过滤日志：

```shell
php artisan pail --level=error
```

<a name="pail-filtering-logs-user-option"></a>
#### `--user`

要仅显示在给定用户已认证时写入的日志，可以将用户 ID 提供给 `--user` 选项：

```shell
php artisan pail --user=1
```

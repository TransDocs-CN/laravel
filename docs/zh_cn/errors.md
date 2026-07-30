# 错误处理

- [简介](#introduction)
- [配置](#configuration)
- [处理异常](#handling-exceptions)
    - [报告异常](#reporting-exceptions)
    - [异常日志级别](#exception-log-levels)
    - [按类型忽略异常](#ignoring-exceptions-by-type)
    - [渲染异常](#rendering-exceptions)
    - [可报告与可渲染异常](#renderable-exceptions)
- [限制报告异常频率](#throttling-reported-exceptions)
- [HTTP 异常](#http-exceptions)
    - [自定义 HTTP 错误页面](#custom-http-error-pages)

<a name="introduction"></a>
## 简介

当你开始一个新的 Laravel 项目时，错误和异常处理已为你配置完毕；但你可以随时使用应用程序的 `bootstrap/app.php` 文件中的 `withExceptions` 方法来管理异常的报告和渲染方式。

提供给 `withExceptions` 闭包的 `$exceptions` 对象是 `Illuminate\Foundation\Configuration\Exceptions` 的一个实例，负责管理应用程序中的异常处理。我们将在本文档中深入探讨这个对象。

<a name="configuration"></a>
## 配置

`config/app.php` 配置文件中的 `debug` 选项决定了错误信息向用户显示的程度。默认情况下，此选项设置为遵循 `.env` 文件中存储的 `APP_DEBUG` 环境变量的值。

在本地开发期间，应将 `APP_DEBUG` 环境变量设置为 `true`。

> [!WARNING]
> 在生产环境中，`APP_DEBUG` 的值应始终为 `false`。如果在生产环境中设置为 `true`，则存在向应用程序的最终用户暴露敏感配置值的风险。

<a name="handling-exceptions"></a>
## 处理异常

<a name="reporting-exceptions"></a>
### 报告异常

在 Laravel 中，异常报告用于记录异常或将异常发送到外部服务，如 [Laravel Nightwatch](https://nightwatch.laravel.com)、[Sentry](https://github.com/getsentry/sentry-laravel) 或 [Flare](https://flareapp.io)。默认情况下，异常将根据你的[日志](/docs/{{version}}/logging)配置进行记录。不过，你可以自由地以任何方式记录异常。

如果你需要以不同方式报告不同类型的异常，你可以在应用程序的 `bootstrap/app.php` 中使用 `report` 异常方法来注册一个闭包，该闭包将在需要报告给定类型的异常时执行。Laravel 将通过检查闭包的类型提示来确定闭包报告哪种类型的异常：

```php
use App\Exceptions\InvalidOrderException;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->report(function (InvalidOrderException $e) {
        // ...
    });
})
```

当你使用 `report` 方法注册自定义异常报告回调时，Laravel 仍会使用应用程序的默认日志配置记录异常。如果你希望阻止异常传播到默认日志堆栈，你可以在定义报告回调时使用 `stop` 方法，或从回调中返回 `false`：

```php
use App\Exceptions\InvalidOrderException;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->report(function (InvalidOrderException $e) {
        // ...
    })->stop();

    $exceptions->report(function (InvalidOrderException $e) {
        return false;
    });
})
```

> [!NOTE]
> 要为给定的异常自定义异常报告，你还可以使用[可报告异常](/docs/{{version}}/errors#renderable-exceptions)。

<a name="global-log-context"></a>
#### 全局日志上下文

如果可用，Laravel 会自动将当前用户的 ID 作为上下文数据添加到每条异常日志消息中。你可以使用应用程序的 `bootstrap/app.php` 文件中的 `context` 异常方法定义自己的全局上下文数据。这些信息将包含在应用程序写入的每条异常日志消息中：

```php
->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->context(fn () => [
        'foo' => 'bar',
    ]);
})
```

<a name="exception-log-context"></a>
#### 异常日志上下文

虽然为每条日志消息添加上下文可能很有用，但有时特定的异常可能具有你希望包含在日志中的独特上下文。通过在你的应用程序的某个异常上定义 `context` 方法，你可以指定与该异常相关的任何数据，这些数据应添加到异常的日志条目中：

```php
<?php

namespace App\Exceptions;

use Exception;

class InvalidOrderException extends Exception
{
    // ...

    /**
     * 获取异常的上下文信息。
     *
     * @return array<string, mixed>
     */
    public function context(): array
    {
        return ['order_id' => $this->orderId];
    }
}
```

<a name="the-report-helper"></a>
#### `report` 辅助函数

有时你可能需要报告异常但继续处理当前请求。`report` 辅助函数允许你快速报告异常，而无需向用户渲染错误页面：

```php
public function isValid(string $value): bool
{
    try {
        // 验证值...
    } catch (Throwable $e) {
        report($e);

        return false;
    }
}
```

<a name="deduplicating-reported-exceptions"></a>
#### 对报告异常进行去重

如果你在应用程序中多处使用 `report` 函数，有时可能会多次报告同一个异常，从而在日志中产生重复条目。

如果你希望确保同一个异常实例只被报告一次，你可以在应用程序的 `bootstrap/app.php` 文件中调用 `dontReportDuplicates` 异常方法：

```php
->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->dontReportDuplicates();
})
```

现在，当使用同一个异常实例调用 `report` 辅助函数时，只有第一次调用会被报告：

```php
$original = new RuntimeException('哎呀！');

report($original); // 已报告

try {
    throw $original;
} catch (Throwable $caught) {
    report($caught); // 已忽略
}

report($original); // 已忽略
report($caught); // 已忽略
```

<a name="exception-log-levels"></a>
### 异常日志级别

当消息写入应用程序的[日志](/docs/{{version}}/logging)时，消息会以指定的[日志级别](/docs/{{version}}/logging#log-levels)写入，该级别表示所记录消息的严重性或重要性。

如上所述，即使你使用 `report` 方法注册了自定义异常报告回调，Laravel 仍会使用应用程序的默认日志配置记录异常；但由于日志级别有时会影响消息记录的通道，你可能希望配置某些异常的记录级别。

为此，你可以在应用程序的 `bootstrap/app.php` 文件中使用 `level` 异常方法。该方法将异常类型作为第一个参数，将日志级别作为第二个参数：

```php
use PDOException;
use Psr\Log\LogLevel;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->level(PDOException::class, LogLevel::CRITICAL);
})
```

<a name="ignoring-exceptions-by-type"></a>
### 按类型忽略异常

在构建应用程序时，有些类型的异常你可能永远不想报告。要忽略这些异常，你可以在应用程序的 `bootstrap/app.php` 文件中使用 `dontReport` 异常方法。提供给此方法的任何类都不会被报告；但它们仍然可以拥有自定义的渲染逻辑：

```php
use App\Exceptions\InvalidOrderException;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->dontReport([
        InvalidOrderException::class,
    ]);
})
```

或者，你可以简单地在异常类上"标记"`Illuminate\Contracts\Debug\ShouldntReport` 接口。当一个异常被标记为此接口时，它将永远不会被 Laravel 的异常处理器报告：

```php
<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Contracts\Debug\ShouldntReport;

class PodcastProcessingException extends Exception implements ShouldntReport
{
    //
}
```

如果你需要对何时忽略特定类型的异常进行更精细的控制，你可以向 `dontReportWhen` 方法提供一个闭包：

```php
use App\Exceptions\InvalidOrderException;
use Throwable;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->dontReportWhen(function (Throwable $e) {
        return $e instanceof PodcastProcessingException &&
               $e->reason() === '订阅已过期';
    });
})
```

在内部，Laravel 已经为你忽略了一些类型的错误，例如由 404 HTTP 错误、由来源不匹配生成的 403 HTTP 响应或由无效 CSRF 令牌生成的 419 HTTP 响应导致的异常。如果你希望指示 Laravel 停止忽略给定类型的异常，你可以在应用程序的 `bootstrap/app.php` 文件中使用 `stopIgnoring` 异常方法：

```php
use Symfony\Component\HttpKernel\Exception\HttpException;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->stopIgnoring(HttpException::class);
})
```

<a name="rendering-exceptions"></a>
### 渲染异常

默认情况下，Laravel 的异常处理器会将异常转换为 HTTP 响应。但你可以自由地为给定类型的异常注册自定义的渲染闭包。你可以通过使用应用程序的 `bootstrap/app.php` 文件中的 `render` 异常方法来实现。

传递给 `render` 方法的闭包应返回 `Illuminate\Http\Response` 的一个实例，可以通过 `response` 辅助函数生成。Laravel 将通过检查闭包的类型提示来确定闭包渲染哪种类型的异常：

```php
use App\Exceptions\InvalidOrderException;
use Illuminate\Http\Request;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->render(function (InvalidOrderException $e, Request $request) {
        return response()->view('errors.invalid-order', status: 500);
    });
})
```

你也可以使用 `render` 方法来覆盖内置 Laravel 或 Symfony 异常的渲染行为，例如 `NotFoundHttpException`。如果提供给 `render` 方法的闭包没有返回值，则将使用 Laravel 的默认异常渲染：

```php
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->render(function (NotFoundHttpException $e, Request $request) {
        if ($request->is('api/*')) {
            return response()->json([
                'message' => '记录未找到。'
            ], 404);
        }
    });
})
```

<a name="rendering-exceptions-as-json"></a>
#### 将异常渲染为 JSON

当渲染异常时，Laravel 会根据请求的 `Accept` 标头自动确定异常应渲染为 HTML 还是 JSON 响应。如果你希望自定义 Laravel 如何确定是渲染 HTML 还是 JSON 异常响应，你可以使用 `shouldRenderJsonWhen` 方法：

```php
use Illuminate\Http\Request;
use Throwable;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->shouldRenderJsonWhen(function (Request $request, Throwable $e) {
        if ($request->is('admin/*')) {
            return true;
        }

        return $request->expectsJson();
    });
})
```

<a name="customizing-the-exception-response"></a>
#### 自定义异常响应

极少数情况下，你可能需要自定义 Laravel 异常处理器渲染的整个 HTTP 响应。为此，你可以使用 `respond` 方法注册一个响应自定义闭包：

```php
use Symfony\Component\HttpFoundation\Response;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->respond(function (Response $response) {
        if ($response->getStatusCode() === 419) {
            return back()->with([
                'message' => '页面已过期，请重试。',
            ]);
        }

        return $response;
    });
})
```

<a name="renderable-exceptions"></a>
### 可报告与可渲染异常

你可以直接在应用程序的异常上定义 `report` 和 `render` 方法，而不是在 `bootstrap/app.php` 文件中定义自定义的报告和渲染行为。当这些方法存在时，框架将自动调用它们：

```php
<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class InvalidOrderException extends Exception
{
    /**
     * 报告异常。
     */
    public function report(): void
    {
        // ...
    }

    /**
     * 将异常渲染为 HTTP 响应。
     */
    public function render(Request $request): Response
    {
        return response(/* ... */);
    }
}
```

如果你的异常继承自一个已经可渲染的异常（例如内置的 Laravel 或 Symfony 异常），你可以从异常的 `render` 方法中返回 `false` 以渲染异常的默认 HTTP 响应：

```php
/**
 * 将异常渲染为 HTTP 响应。
 */
public function render(Request $request): Response|bool
{
    if (/** 确定异常是否需要自定义渲染 */) {

        return response(/* ... */);
    }

    return false;
}
```

如果你的异常包含仅在满足某些条件时才需要的自定义报告逻辑，你可能需要指示 Laravel 有时使用默认异常处理配置来报告异常。为此，你可以从异常的 `report` 方法中返回 `false`：

```php
/**
 * 报告异常。
 */
public function report(): bool
{
    if (/** 确定异常是否需要自定义报告 */) {

        // ...

        return true;
    }

    return false;
}
```

> [!NOTE]
> 你可以对 `report` 方法的任何必需依赖进行类型提示，它们将由 Laravel 的[服务容器](/docs/{{version}}/container)自动注入到方法中。

<a name="throttling-reported-exceptions"></a>
### 限制报告异常频率

如果你的应用程序报告大量异常，你可能希望限制实际记录或发送到应用程序外部错误跟踪服务的异常数量。

要对异常进行随机采样，你可以在应用程序的 `bootstrap/app.php` 文件中使用 `throttle` 异常方法。`throttle` 方法接收一个应返回 `Lottery` 实例的闭包：

```php
use Illuminate\Support\Lottery;
use Throwable;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->throttle(function (Throwable $e) {
        return Lottery::odds(1, 1000);
    });
})
```

还可以根据异常类型进行条件采样。如果你只想对特定异常类的实例进行采样，你可以仅针对该类返回一个 `Lottery` 实例：

```php
use App\Exceptions\ApiMonitoringException;
use Illuminate\Support\Lottery;
use Throwable;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->throttle(function (Throwable $e) {
        if ($e instanceof ApiMonitoringException) {
            return Lottery::odds(1, 1000);
        }
    });
})
```

你还可以通过返回 `Limit` 实例而不是 `Lottery` 来限制记录或发送到外部错误跟踪服务的异常频率。当你希望防止突发的异常洪流淹没日志时（例如，当应用程序使用的第三方服务宕机时），这非常有用：

```php
use Illuminate\Broadcasting\BroadcastException;
use Illuminate\Cache\RateLimiting\Limit;
use Throwable;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->throttle(function (Throwable $e) {
        if ($e instanceof BroadcastException) {
            return Limit::perMinute(300);
        }
    });
})
```

默认情况下，限制将使用异常类作为速率限制键。你可以通过在 `Limit` 上使用 `by` 方法来自定义自己的键：

```php
use Illuminate\Broadcasting\BroadcastException;
use Illuminate\Cache\RateLimiting\Limit;
use Throwable;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->throttle(function (Throwable $e) {
        if ($e instanceof BroadcastException) {
            return Limit::perMinute(300)->by($e->getMessage());
        }
    });
})
```

当然，你可以为不同的异常返回 `Lottery` 和 `Limit` 实例的混合体：

```php
use App\Exceptions\ApiMonitoringException;
use Illuminate\Broadcasting\BroadcastException;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Lottery;
use Throwable;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->throttle(function (Throwable $e) {
        return match (true) {
            $e instanceof BroadcastException => Limit::perMinute(300),
            $e instanceof ApiMonitoringException => Lottery::odds(1, 1000),
            default => Limit::none(),
        };
    });
})
```

<a name="http-exceptions"></a>
## HTTP 异常

一些异常描述了来自服务器的 HTTP 错误代码。例如，这可能是"页面未找到"错误（404）、"未授权错误"（401）甚至是开发人员生成的 500 错误。为了从应用程序的任何位置生成此类响应，你可以使用 `abort` 辅助函数：

```php
abort(404);
```

<a name="custom-http-error-pages"></a>
### 自定义 HTTP 错误页面

Laravel 使得为各种 HTTP 状态码显示自定义错误页面变得很容易。例如，要自定义 404 HTTP 状态码的错误页面，创建一个 `resources/views/errors/404.blade.php` 视图模板。此视图将为你应用程序生成的所有 404 错误进行渲染。此目录中的视图应以其对应的 HTTP 状态码命名。由 `abort` 函数抛出的 `Symfony\Component\HttpKernel\Exception\HttpException` 实例将作为 `$exception` 变量传递给视图：

```blade
<h2>{{ $exception->getMessage() }}</h2>
```

你可以使用 `vendor:publish` Artisan 命令发布 Laravel 的默认错误页面模板。模板发布后，你可以根据自己的喜好进行自定义：

```shell
php artisan vendor:publish --tag=laravel-errors
```

<a name="fallback-http-error-pages"></a>
#### 回退 HTTP 错误页面

你还可以为指定系列的 HTTP 状态码定义一个"回退"错误页面。如果特定 HTTP 状态码没有对应的页面，将渲染此页面。为此，在你的应用程序的 `resources/views/errors` 目录中定义一个 `4xx.blade.php` 模板和一个 `5xx.blade.php` 模板。

在定义回退错误页面时，回退页面不会影响 `404`、`500` 和 `503` 错误响应，因为 Laravel 为这些状态码内置了专门的页面。要为这些状态码自定义渲染的页面，你应为每个状态码单独定义一个自定义错误页面。

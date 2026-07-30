# 中间件

- [简介](#introduction)
- [定义中间件](#defining-middleware)
- [注册中间件](#registering-middleware)
    - [全局中间件](#global-middleware)
    - [将中间件分配给路由](#assigning-middleware-to-routes)
    - [中间件组](#middleware-groups)
    - [中间件别名](#middleware-aliases)
    - [中间件排序](#sorting-middleware)
- [中间件参数](#middleware-parameters)
- [可终止中间件](#terminable-middleware)

<a name="introduction"></a>
## 简介

中间件提供了一种方便的机制来检查和过滤进入应用程序的 HTTP 请求。例如，Laravel 包含一个中间件，用于验证应用程序的用户是否已认证。如果用户未认证，中间件会将用户重定向到应用程序的登录页面。但是，如果用户已认证，中间件将允许请求进一步进入应用程序。

除了认证之外，还可以编写其他中间件来执行各种任务。例如，日志中间件可能会记录所有进入应用程序的请求。Laravel 包含了各种中间件，包括用于认证和 CSRF 保护的中间件；但是，所有用户定义的中间件通常位于应用程序的 `app/Http/Middleware` 目录中。

<a name="defining-middleware"></a>
## 定义中间件

要创建新的中间件，请使用 `make:middleware` Artisan 命令：

```shell
php artisan make:middleware EnsureTokenIsValid
```

此命令将在 `app/Http/Middleware` 目录中放置一个新的 `EnsureTokenIsValid` 类。在此中间件中，仅当提供的 `token` 输入与指定值匹配时，我们才允许访问路由。否则，我们将用户重定向回 `/home` URI：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTokenIsValid
{
    /**
     * 处理传入请求。
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->input('token') !== 'my-secret-token') {
            return redirect('/home');
        }

        return $next($request);
    }
}
```

如你所见，如果给定的 `token` 与我们的密钥不匹配，中间件将向客户端返回 HTTP 重定向；否则，请求将进一步传递到应用程序。要将请求传递到应用程序的更深处（允许中间件"传递"），你应该使用 `$request` 调用 `$next` 回调。

最好将中间件视为 HTTP 请求在到达应用程序之前必须经过的一系列"层"。每一层都可以检查请求，甚至完全拒绝它。

> [!NOTE]
> 所有中间件都通过[服务容器](/docs/{{version}}/container)解析，因此你可以在中间件的构造函数中类型提示所需的任何依赖。

<a name="middleware-and-responses"></a>
#### 中间件和响应

当然，中间件可以在将请求传递到应用程序更深处之前或之后执行任务。例如，以下中间件将在请求由应用程序处理**之前**执行某些任务：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BeforeMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // 执行操作

        return $next($request);
    }
}
```

但是，此中间件将在请求由应用程序处理**之后**执行其任务：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AfterMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // 执行操作

        return $response;
    }
}
```

<a name="registering-middleware"></a>
## 注册中间件

<a name="global-middleware"></a>
### 全局中间件

如果你希望中间件在应用程序的每个 HTTP 请求期间运行，你可以将其追加到应用程序的 `bootstrap/app.php` 文件中的全局中间件堆栈：

```php
use App\Http\Middleware\EnsureTokenIsValid;

->withMiddleware(function (Middleware $middleware): void {
     $middleware->append(EnsureTokenIsValid::class);
})
```

提供给 `withMiddleware` 闭包的 `$middleware` 对象是 `Illuminate\Foundation\Configuration\Middleware` 的实例，负责管理分配给应用程序路由的中间件。`append` 方法将中间件添加到全局中间件列表的末尾。如果你想将中间件添加到列表的开头，应使用 `prepend` 方法。

<a name="manually-managing-laravels-default-global-middleware"></a>
#### 手动管理 Laravel 的默认全局中间件

如果你想手动管理 Laravel 的全局中间件堆栈，你可以将 Laravel 的默认全局中间件堆栈提供给 `use` 方法。然后，你可以根据需要调整默认中间件堆栈：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->use([
        \Illuminate\Foundation\Http\Middleware\InvokeDeferredCallbacks::class,
        // \Illuminate\Http\Middleware\TrustHosts::class,
        \Illuminate\Http\Middleware\TrustProxies::class,
        \Illuminate\Http\Middleware\HandleCors::class,
        \Illuminate\Foundation\Http\Middleware\PreventRequestsDuringMaintenance::class,
        \Illuminate\Http\Middleware\ValidatePostSize::class,
        \Illuminate\Foundation\Http\Middleware\TrimStrings::class,
        \Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull::class,
    ]);
})
```

<a name="assigning-middleware-to-routes"></a>
### 将中间件分配给路由

如果你想将中间件分配给特定路由，你可以在定义路由时调用 `middleware` 方法：

```php
use App\Http\Middleware\EnsureTokenIsValid;

Route::get('/profile', function () {
    // ...
})->middleware(EnsureTokenIsValid::class);
```

你可以通过将中间件名称数组传递给 `middleware` 方法，为路由分配多个中间件：

```php
Route::get('/', function () {
    // ...
})->middleware([First::class, Second::class]);
```

<a name="excluding-middleware"></a>
#### 排除中间件

当将中间件分配给一组路由时，有时你可能需要阻止中间件应用于组内的单个路由。你可以使用 `withoutMiddleware` 方法来实现：

```php
use App\Http\Middleware\EnsureTokenIsValid;

Route::middleware([EnsureTokenIsValid::class])->group(function () {
    Route::get('/', function () {
        // ...
    });

    Route::get('/profile', function () {
        // ...
    })->withoutMiddleware([EnsureTokenIsValid::class]);
});
```

你也可以从整个路由定义[组](/docs/{{version}}/routing#route-groups)中排除给定的中间件集合：

```php
use App\Http\Middleware\EnsureTokenIsValid;

Route::withoutMiddleware([EnsureTokenIsValid::class])->group(function () {
    Route::get('/profile', function () {
        // ...
    });
});
```

`withoutMiddleware` 方法只能移除路由中间件，不适用于[全局中间件](#global-middleware)。

<a name="middleware-groups"></a>
### 中间件组

有时你可能希望将多个中间件分组到单个键下，以便更容易地将它们分配给路由。你可以在应用程序的 `bootstrap/app.php` 文件中使用 `appendToGroup` 方法来实现：

```php
use App\Http\Middleware\First;
use App\Http\Middleware\Second;

->withMiddleware(function (Middleware $middleware): void {
    $middleware->appendToGroup('group-name', [
        First::class,
        Second::class,
    ]);

    $middleware->prependToGroup('group-name', [
        First::class,
        Second::class,
    ]);
})
```

中间件组可以使用与单个中间件相同的语法分配给路由和控制器操作：

```php
Route::get('/', function () {
    // ...
})->middleware('group-name');

Route::middleware(['group-name'])->group(function () {
    // ...
});
```

<a name="laravels-default-middleware-groups"></a>
#### Laravel 的默认中间件组

Laravel 包含预定义的 `web` 和 `api` 中间件组，其中包含你可能希望应用于 Web 和 API 路由的常见中间件。请记住，Laravel 会自动将这些中间件组应用于相应的 `routes/web.php` 和 `routes/api.php` 文件：

<div class="overflow-auto">

| `web` 中间件组                                         |
| ------------------------------------------------------ |
| `Illuminate\Cookie\Middleware\EncryptCookies`             |
| `Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse` |
| `Illuminate\Session\Middleware\StartSession`              |
| `Illuminate\View\Middleware\ShareErrorsFromSession`       |
| `Illuminate\Foundation\Http\Middleware\PreventRequestForgery` |
| `Illuminate\Routing\Middleware\SubstituteBindings`        |

</div>

<div class="overflow-auto">

| `api` 中间件组                                  |
| ----------------------------------------------- |
| `Illuminate\Routing\Middleware\SubstituteBindings` |

</div>

如果你想向这些组追加或前置中间件，你可以在应用程序的 `bootstrap/app.php` 文件中使用 `web` 和 `api` 方法。`web` 和 `api` 方法是 `appendToGroup` 方法的便捷替代方案：

```php
use App\Http\Middleware\EnsureTokenIsValid;
use App\Http\Middleware\EnsureUserIsSubscribed;

->withMiddleware(function (Middleware $middleware): void {
    $middleware->web(append: [
        EnsureUserIsSubscribed::class,
    ]);

    $middleware->api(prepend: [
        EnsureTokenIsValid::class,
    ]);
})
```

你甚至可以用自己的自定义中间件替换 Laravel 的默认中间件组条目之一：

```php
use App\Http\Middleware\StartCustomSession;
use Illuminate\Session\Middleware\StartSession;

$middleware->web(replace: [
    StartSession::class => StartCustomSession::class,
]);
```

或者，你可以完全移除一个中间件：

```php
$middleware->web(remove: [
    StartSession::class,
]);
```

<a name="manually-managing-laravels-default-middleware-groups"></a>
#### 手动管理 Laravel 的默认中间件组

如果你想手动管理 Laravel 的默认 `web` 和 `api` 中间件组中的所有中间件，你可以完全重新定义这些组。下面的示例将使用其默认中间件定义 `web` 和 `api` 中间件组，允许你根据需要自定义它们：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->group('web', [
        \Illuminate\Cookie\Middleware\EncryptCookies::class,
        \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
        \Illuminate\Session\Middleware\StartSession::class,
        \Illuminate\View\Middleware\ShareErrorsFromSession::class,
        \Illuminate\Foundation\Http\Middleware\PreventRequestForgery::class,
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
        // \Illuminate\Session\Middleware\AuthenticateSession::class,
    ]);

    $middleware->group('api', [
        // \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        // 'throttle:api',
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
    ]);
})
```

> [!NOTE]
> 默认情况下，`web` 和 `api` 中间件组由 `bootstrap/app.php` 文件自动应用于应用程序相应的 `routes/web.php` 和 `routes/api.php` 文件。

<a name="middleware-aliases"></a>
### 中间件别名

你可以在应用程序的 `bootstrap/app.php` 文件中为中间件分配别名。中间件别名允许你为给定的中间件类定义一个简短的别名，这对于具有长类名的中间件特别有用：

```php
use App\Http\Middleware\EnsureUserIsSubscribed;

->withMiddleware(function (Middleware $middleware): void {
    $middleware->alias([
        'subscribed' => EnsureUserIsSubscribed::class
    ]);
})
```

一旦在应用程序的 `bootstrap/app.php` 文件中定义了中间件别名，你就可以在将中间件分配给路由时使用该别名：

```php
Route::get('/profile', function () {
    // ...
})->middleware('subscribed');
```

为方便起见，一些 Laravel 内置中间件默认已设置别名。例如，`auth` 中间件是 `Illuminate\Auth\Middleware\Authenticate` 中间件的别名。以下是默认中间件别名的列表：

<div class="overflow-auto">

| 别名               | 中间件                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| `auth`             | `Illuminate\Auth\Middleware\Authenticate`                                                              |
| `auth.basic`       | `Illuminate\Auth\Middleware\AuthenticateWithBasicAuth`                                                 |
| `auth.session`     | `Illuminate\Session\Middleware\AuthenticateSession`                                                    |
| `cache.headers`    | `Illuminate\Http\Middleware\SetCacheHeaders`                                                           |
| `can`              | `Illuminate\Auth\Middleware\Authorize`                                                                 |
| `guest`            | `Illuminate\Auth\Middleware\RedirectIfAuthenticated`                                                   |
| `password.confirm` | `Illuminate\Auth\Middleware\RequirePassword`                                                           |
| `precognitive`     | `Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests`                                     |
| `signed`           | `Illuminate\Routing\Middleware\ValidateSignature`                                                      |
| `subscribed`       | `\Spark\Http\Middleware\VerifyBillableIsSubscribed`                                                    |
| `throttle`         | `Illuminate\Routing\Middleware\ThrottleRequests` 或 `Illuminate\Routing\Middleware\ThrottleRequestsWithRedis` |
| `verified`         | `Illuminate\Auth\Middleware\EnsureEmailIsVerified`                                                     |

</div>

<a name="sorting-middleware"></a>
### 中间件排序

极少数情况下，你可能需要你的中间件以特定顺序执行，但在它们被分配给路由时无法控制其顺序。在这些情况下，你可以在应用程序的 `bootstrap/app.php` 文件中使用 `priority` 方法指定中间件优先级：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->priority([
        \Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests::class,
        \Illuminate\Cookie\Middleware\EncryptCookies::class,
        \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
        \Illuminate\Session\Middleware\StartSession::class,
        \Illuminate\View\Middleware\ShareErrorsFromSession::class,
        \Illuminate\Foundation\Http\Middleware\PreventRequestForgery::class,
        \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        \Illuminate\Routing\Middleware\ThrottleRequests::class,
        \Illuminate\Routing\Middleware\ThrottleRequestsWithRedis::class,
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
        \Illuminate\Contracts\Auth\Middleware\AuthenticatesRequests::class,
        \Illuminate\Auth\Middleware\Authorize::class,
    ]);
})
```

<a name="middleware-parameters"></a>
## 中间件参数

中间件也可以接收额外的参数。例如，如果你的应用程序需要验证认证用户在执行给定操作之前是否具有给定的"角色"，你可以创建一个接收角色名称作为额外参数的 `EnsureUserHasRole` 中间件。

额外的中间件参数将在 `$next` 参数之后传递给中间件：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * 处理传入请求。
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        if (! $request->user()->hasRole($role)) {
            // 重定向...
        }

        return $next($request);
    }
}
```

在定义路由时，可以通过用 `:` 分隔中间件名称和参数来指定中间件参数：

```php
use App\Http\Middleware\EnsureUserHasRole;

Route::put('/post/{id}', function (string $id) {
    // ...
})->middleware(EnsureUserHasRole::class.':editor');
```

多个参数可以用逗号分隔：

```php
Route::put('/post/{id}', function (string $id) {
    // ...
})->middleware(EnsureUserHasRole::class.':editor,publisher');
```

<a name="terminable-middleware"></a>
## 可终止中间件

有时中间件可能需要在 HTTP 响应发送到浏览器后执行一些工作。如果你在中间件上定义了一个 `terminate` 方法，并且你的 Web 服务器使用 [FastCGI](https://www.php.net/manual/en/install.fpm.php)，则 `terminate` 方法将在响应发送到浏览器后自动调用：

```php
<?php

namespace Illuminate\Session\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TerminatingMiddleware
{
    /**
     * 处理传入请求。
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }

    /**
     * 在响应已发送到浏览器后处理任务。
     */
    public function terminate(Request $request, Response $response): void
    {
        // ...
    }
}
```

`terminate` 方法应接收请求和响应。一旦你定义了可终止中间件，你应将其添加到应用程序的 `bootstrap/app.php` 文件中的路由或全局中间件列表。

当在中间件上调用 `terminate` 方法时，Laravel 会从[服务容器](/docs/{{version}}/container)解析一个新的中间件实例。如果你希望在调用 `handle` 和 `terminate` 方法时使用相同的中间件实例，请使用容器的 `singleton` 方法向容器注册中间件。通常这应在你的 `AppServiceProvider` 的 `register` 方法中完成：

```php
use App\Http\Middleware\TerminatingMiddleware;

/**
 * 注册任何应用程序服务。
 */
public function register(): void
{
    $this->app->singleton(TerminatingMiddleware::class);
}
```

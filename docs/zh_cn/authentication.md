# 身份认证

- [简介](#introduction)
    - [启动工具包](#starter-kits)
    - [数据库注意事项](#introduction-database-considerations)
    - [生态系统概览](#ecosystem-overview)
- [身份认证快速入门](#authentication-quickstart)
    - [安装启动工具包](#install-a-starter-kit)
    - [获取已认证用户](#retrieving-the-authenticated-user)
    - [保护路由](#protecting-routes)
    - [登录频率限制](#login-throttling)
- [手动认证用户](#authenticating-users)
    - [记住用户](#remembering-users)
    - [其他认证方法](#other-authentication-methods)
- [HTTP 基本认证](#http-basic-authentication)
    - [无状态 HTTP 基本认证](#stateless-http-basic-authentication)
- [退出登录](#logging-out)
    - [使其他设备上的会话失效](#invalidating-sessions-on-other-devices)
- [密码确认](#password-confirmation)
    - [配置](#password-confirmation-configuration)
    - [路由](#password-confirmation-routing)
    - [保护路由](#password-confirmation-protecting-routes)
- [添加自定义守卫](#adding-custom-guards)
    - [闭包请求守卫](#closure-request-guards)
- [添加自定义用户提供者](#adding-custom-user-providers)
    - [用户提供者契约](#the-user-provider-contract)
    - [可认证契约](#the-authenticatable-contract)
- [自动密码重新哈希](#automatic-password-rehashing)
- [社交认证](/docs/{{version}}/socialite)
- [事件](#events)

<a name="introduction"></a>
## 简介

许多 Web 应用程序都为其用户提供了使用应用程序进行认证和「登录」的方式。在 Web 应用程序中实现此功能可能是一项复杂且有潜在风险的尝试。因此，Laravel 致力于为你提供快速、安全且轻松实现身份认证所需的工具。

Laravel 的认证设施核心由「守卫」和「提供者」组成。守卫定义了如何为每个请求认证用户。例如，Laravel 内置了一个 `session` 守卫，它使用会话存储和 Cookie 来维护状态。

提供者定义了如何从持久化存储中检索用户。Laravel 内置了使用 [Eloquent](/docs/{{version}}/eloquent) 和数据库查询构建器来检索用户的支持。但是，你可以根据应用程序的需要自由定义额外的提供者。

你的应用程序的身份认证配置文件位于 `config/auth.php`。该文件包含几个文档完善的选项，用于调整 Laravel 认证服务的行为。

> [!NOTE]
> 守卫和提供者不应与「角色」和「权限」混淆。要了解有关通过权限授权用户操作的更多信息，请参阅[授权](/docs/{{version}}/authorization)文档。

<a name="starter-kits"></a>
### 启动工具包

想快速开始？在一个全新的 Laravel 应用程序中安装一个 [Laravel 应用启动工具包](/docs/{{version}}/starter-kits)。数据库迁移完成后，在浏览器中访问 `/register` 或分配给应用程序的任何其他 URL。启动工具包将为你搭建整个身份认证系统！

**即使你选择不在最终的 Laravel 应用程序中使用启动工具包，安装一个[启动工具包](/docs/{{version}}/starter-kits)也是学习如何在真实的 Laravel 项目中实现所有 Laravel 认证功能的绝佳机会。** 由于 Laravel 启动工具包为你包含了认证控制器、路由和视图，你可以查看这些文件中的代码，了解 Laravel 的认证功能是如何实现的。

<a name="introduction-database-considerations"></a>
### 数据库注意事项

默认情况下，Laravel 在你的 `app/Models` 目录中包含一个 `App\Models\User` [Eloquent 模型](/docs/{{version}}/eloquent)。该模型可用于默认的 Eloquent 认证驱动。

如果你的应用程序不使用 Eloquent，你可以使用 `database` 认证提供者，它使用 Laravel 查询构建器。如果你的应用程序使用 MongoDB，请查看 MongoDB 的官方 [Laravel 用户认证文档](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/user-authentication/)。

在为 `App\Models\User` 模型构建数据库模式时，请确保密码列至少为 60 个字符。当然，新 Laravel 应用程序中包含的 `users` 表迁移已经创建了一个超过此长度的列。

此外，你应该确认你的 `users`（或等效）表包含一个可空、字符串类型的 `remember_token` 列，长度为 100 个字符。此列将用于为在登录应用程序时选择「记住我」选项的用户存储令牌。同样，新 Laravel 应用程序中包含的默认 `users` 表迁移已经包含此列。

<a name="ecosystem-overview"></a>
### 生态系统概览

Laravel 提供了几个与身份认证相关的包。在继续之前，我们将回顾 Laravel 中认证的整体生态系统，并讨论每个包的预期用途。

首先，考虑认证的工作原理。当使用 Web 浏览器时，用户将通过登录表单提供其用户名和密码。如果这些凭证正确，应用程序会将有关已认证用户的信息存储在该用户的[会话](/docs/{{version}}/session)中。颁发给浏览器的 Cookie 包含会话 ID，以便对应用程序的后续请求可以将用户与正确的会话关联起来。收到会话 Cookie 后，应用程序将根据会话 ID 检索会话数据，注意到认证信息已存储在会话中，并将该用户视为「已认证」。

当远程服务需要通过认证来访问 API 时，通常不使用 Cookie 进行认证，因为没有 Web 浏览器。相反，远程服务在每个请求中向 API 发送一个 API 令牌。应用程序可以针对有效的 API 令牌表验证传入的令牌，并将该请求「认证」为由与该 API 令牌关联的用户执行。

<a name="laravels-built-in-browser-authentication-services"></a>
#### Laravel 内置的浏览器认证服务

Laravel 包含内置的认证和会话服务，通常通过 `Auth` 和 `Session` 门面访问。这些功能为从 Web 浏览器发起的请求提供基于 Cookie 的认证。它们提供了允许你验证用户凭证并认证用户的方法。此外，这些服务会自动将适当的认证数据存储在用户的会话中，并颁发用户的会话 Cookie。本文档包含如何使用这些服务的讨论。

**应用程序启动工具包**

如本文档所述，你可以手动使用这些认证服务来构建你应用程序自己的认证层。但是，为了帮助你更快地上手，我们发布了[免费启动工具包](/docs/{{version}}/starter-kits)，它们提供了强大、现代化的整个认证层的脚手架。

<a name="laravels-api-authentication-services"></a>
#### Laravel 的 API 认证服务

Laravel 提供了两个可选包来帮助你管理 API 令牌和认证使用 API 令牌发出的请求：[Passport](/docs/{{version}}/passport) 和 [Sanctum](/docs/{{version}}/sanctum)。请注意，这些库与 Laravel 内置的基于 Cookie 的认证库并不互斥。这些库主要专注于 API 令牌认证，而内置认证服务则专注于基于 Cookie 的浏览器认证。许多应用程序将同时使用 Laravel 内置的基于 Cookie 的认证服务和其中一个 Laravel 的 API 认证包。

**Passport**

Passport 是一个 OAuth2 认证提供者，提供多种 OAuth2「授权类型」，允许你颁发各种类型的令牌。总体而言，这是一个强大且复杂的 API 认证包。但是，大多数应用程序并不需要 OAuth2 规范所提供的复杂功能，这对用户和开发者来说都可能令人困惑。此外，开发者在历史上一直对如何使用 OAuth2 认证提供者（如 Passport）来认证 SPA 应用程序或移动应用程序感到困惑。

**Sanctum**

针对 OAuth2 的复杂性和开发者的困惑，我们着手构建一个更简单、更精简的认证包，它可以处理来自 Web 浏览器的第一方 Web 请求以及通过令牌的 API 请求。这一目标通过发布 [Laravel Sanctum](/docs/{{version}}/sanctum) 得以实现。对于除 API 之外还提供第一方 Web UI 的应用程序、由独立于后端 Laravel 应用程序存在的单页应用程序（SPA）驱动的应用程序，或提供移动客户端的应用程序，Sanctum 应被视为首选和推荐的认证包。

Laravel Sanctum 是一个混合 Web / API 认证包，可以管理你应用程序的整个认证过程。这是可行的，因为当基于 Sanctum 的应用程序收到请求时，Sanctum 将首先确定请求是否包含引用已认证会话的会话 Cookie。Sanctum 通过调用我们之前讨论过的 Laravel 内置认证服务来实现这一点。如果请求未通过会话 Cookie 认证，Sanctum 将检查请求中是否包含 API 令牌。如果存在 API 令牌，Sanctum 将使用该令牌认证请求。要了解更多关于此过程的信息，请参阅 Sanctum 的[「工作原理」](/docs/{{version}}/sanctum#how-it-works)文档。

<a name="summary-choosing-your-stack"></a>
#### 总结与选择你的技术栈

总而言之，如果你的应用程序将通过浏览器访问，并且你正在构建一个单体 Laravel 应用程序，那么你的应用程序将使用 Laravel 内置的认证服务。

接下来，如果你的应用程序提供将被第三方使用的 API，你将在 [Passport](/docs/{{version}}/passport) 或 [Sanctum](/docs/{{version}}/sanctum) 之间进行选择，为应用程序提供 API 令牌认证。通常，只要可能，应优先选择 Sanctum，因为它是一个简单、完整的 API 认证、SPA 认证和移动认证解决方案，包括对「作用域」或「能力」的支持。

如果你正在构建一个由 Laravel 后端驱动的单页应用程序（SPA），则应使用 [Laravel Sanctum](/docs/{{version}}/sanctum)。使用 Sanctum 时，你需要[手动实现你自己的后端认证路由](#authenticating-users)，或者使用 [Laravel Fortify](/docs/{{version}}/fortify) 作为无头认证后端服务，该服务提供注册、密码重置、电子邮件验证等功能的路线和控制器。

当你的应用程序绝对需要 OAuth2 规范提供的所有功能时，可以选择 Passport。此外，如果你正在构建一个将由 AI 客户端访问的 [MCP 服务器](/docs/{{version}}/mcp)，则应使用 Passport，因为 MCP 客户端通常期望[使用 OAuth 进行认证](/docs/{{version}}/mcp#oauth)。

如果你想快速入门，我们很高兴推荐[我们的应用程序启动工具包](/docs/{{version}}/starter-kits)，作为启动新 Laravel 应用程序的快速方式，该工具包已经使用了我们首选的 Laravel 内置认证服务认证技术栈。

<a name="authentication-quickstart"></a>
## 身份认证快速入门

> [!WARNING]
> 本文档的这一部分讨论如何通过 [Laravel 应用程序启动工具包](/docs/{{version}}/starter-kits) 认证用户，其中包括 UI 脚手架以帮助你快速上手。如果你想直接集成 Laravel 的认证系统，请查看关于[手动认证用户](#authenticating-users)的文档。

<a name="install-a-starter-kit"></a>
### 安装启动工具包

首先，你应该[安装一个 Laravel 应用程序启动工具包](/docs/{{version}}/starter-kits)。我们的启动工具包为将身份认证集成到你的全新 Laravel 应用程序中提供了设计精美的起点。

<a name="retrieving-the-authenticated-user"></a>
### 获取已认证用户

从启动工具包创建应用程序并允许用户注册和认证后，你通常需要与当前已认证用户进行交互。在处理传入请求时，你可以通过 `Auth` 门面的 `user` 方法访问已认证用户：

```php
use Illuminate\Support\Facades\Auth;

// Retrieve the currently authenticated user...
$user = Auth::user();

// Retrieve the currently authenticated user's ID...
$id = Auth::id();
```

或者，一旦用户通过认证，你可以通过 `Illuminate\Http\Request` 实例访问已认证用户。请记住，类型提示的类将自动注入到你的控制器方法中。通过对 `Illuminate\Http\Request` 对象进行类型提示，你可以通过请求的 `user` 方法从应用程序中的任何控制器方法方便地访问已认证用户：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class FlightController extends Controller
{
    /**
     * Update the flight information for an existing flight.
     */
    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();

        // ...

        return redirect('/flights');
    }
}
```

<a name="determining-if-the-current-user-is-authenticated"></a>
#### 判断当前用户是否已认证

要判断发出传入 HTTP 请求的用户是否已认证，你可以使用 `Auth` 门面的 `check` 方法。如果用户已认证，此方法将返回 `true`：

```php
use Illuminate\Support\Facades\Auth;

if (Auth::check()) {
    // The user is logged in...
}
```

> [!NOTE]
> 尽管可以使用 `check` 方法判断用户是否已认证，但你通常会使用中间件来验证用户是否已认证，然后才允许用户访问某些路由/控制器。要了解更多信息，请查看关于[保护路由](/docs/{{version}}/authentication#protecting-routes)的文档。

<a name="protecting-routes"></a>
### 保护路由

[路由中间件](/docs/{{version}}/middleware)可用于仅允许已认证用户访问给定路由。Laravel 内置了一个 `auth` 中间件，它是 `Illuminate\Auth\Middleware\Authenticate` 类的[中间件别名](/docs/{{version}}/middleware#middleware-aliases)。由于此中间件已由 Laravel 在内部注册别名，你只需将中间件附加到路由定义即可：

```php
Route::get('/flights', function () {
    // Only authenticated users may access this route...
})->middleware('auth');
```

<a name="redirecting-unauthenticated-users"></a>
#### 重定向未认证用户

当 `auth` 中间件检测到未认证用户时，它会将用户重定向到 `login` [命名路由](/docs/{{version}}/routing#named-routes)。你可以使用应用程序的 `bootstrap/app.php` 文件中的 `redirectGuestsTo` 方法修改此行为：

```php
use Illuminate\Http\Request;

->withMiddleware(function (Middleware $middleware): void {
    $middleware->redirectGuestsTo('/login');

    // Using a closure...
    $middleware->redirectGuestsTo(fn (Request $request) => route('login'));
})
```

<a name="redirecting-authenticated-users"></a>
#### 重定向已认证用户

当 `guest` 中间件检测到已认证用户时，它会将用户重定向到 `dashboard` 或 `home` 命名路由。你可以使用应用程序的 `bootstrap/app.php` 文件中的 `redirectUsersTo` 方法修改此行为：

```php
use Illuminate\Http\Request;

->withMiddleware(function (Middleware $middleware): void {
    $middleware->redirectUsersTo('/panel');

    // Using a closure...
    $middleware->redirectUsersTo(fn (Request $request) => route('panel'));
})
```

<a name="specifying-a-guard"></a>
#### 指定守卫

在将 `auth` 中间件附加到路由时，你还可以指定应使用哪个「守卫」来认证用户。指定的守卫应对应于 `auth.php` 配置文件中 `guards` 数组中的某个键：

```php
Route::get('/flights', function () {
    // Only authenticated users may access this route...
})->middleware('auth:admin');
```

<a name="login-throttling"></a>
### 登录频率限制

如果你正在使用我们的一个[应用程序启动工具包](/docs/{{version}}/starter-kits)，则频率限制将自动应用于登录尝试。默认情况下，如果用户在多次尝试后未能提供正确的凭证，将在一分钟内无法登录。频率限制对用户的用户名/电子邮件地址及其 IP 地址是唯一的。

> [!NOTE]
> 如果你想对应用程序中的其他路由进行频率限制，请查看[频率限制文档](/docs/{{version}}/routing#rate-limiting)。

<a name="authenticating-users"></a>
## 手动认证用户

你不必使用 Laravel 的[应用程序启动工具包](/docs/{{version}}/starter-kits)中包含的认证脚手架。如果你选择不使用此脚手架，则需要直接使用 Laravel 的认证类来管理用户认证。别担心，这很简单！

我们将通过 `Auth`[门面](/docs/{{version}}/facades)访问 Laravel 的认证服务，因此我们需确保在类顶部导入 `Auth` 门面。接下来，让我们看看 `attempt` 方法。`attempt` 方法通常用于处理来自应用程序「登录」表单的认证尝试。如果认证成功，你应重新生成用户的[会话](/docs/{{version}}/session)以防止[会话固定攻击](https://en.wikipedia.org/wiki/Session_fixation)：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

class LoginController extends Controller
{
    /**
     * Handle an authentication attempt.
     */
    public function authenticate(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();

            return redirect()->intended('dashboard');
        }

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ])->onlyInput('email');
    }
}
```

`attempt` 方法接受一个键/值对数组作为其第一个参数。数组中的值将用于在你的数据库表中查找用户。因此，在上面的例子中，将通过 `email` 列的值来检索用户。如果找到用户，存储在数据库中的哈希密码将与通过数组传递给方法的 `password` 值进行比较。你不应对传入请求的 `password` 值进行哈希，因为框架会在将其与数据库中的哈希密码进行比较之前自动哈希该值。如果两个哈希密码匹配，将为用户启动一个已认证的会话。

请记住，Laravel 的认证服务将根据你的认证守卫的「提供者」配置从数据库中检索用户。在默认的 `config/auth.php` 配置文件中，指定了 Eloquent 用户提供者，并指示其在检索用户时使用 `App\Models\User` 模型。你可以根据应用程序的需求在配置文件中更改这些值。

如果认证成功，`attempt` 方法将返回 `true`。否则，将返回 `false`。

Laravel 重定向器提供的 `intended` 方法会将用户重定向到在被认证中间件拦截之前他们试图访问的 URL。如果目标目的地不可用，可以为此方法提供一个备用 URI。

<a name="specifying-additional-conditions"></a>
#### 指定额外条件

如果需要，除了用户的电子邮件和密码之外，你还可以向认证查询添加额外的查询条件。为此，我们只需将查询条件添加到传递给 `attempt` 方法的数组中即可。例如，我们可以验证用户是否被标记为「active」：

```php
if (Auth::attempt(['email' => $email, 'password' => $password, 'active' => 1])) {
    // Authentication was successful...
}
```

对于复杂的查询条件，你可以在凭证数组中提供一个闭包。此闭包将使用查询实例调用，允许你根据应用程序的需求自定义查询：

```php
use Illuminate\Database\Eloquent\Builder;

if (Auth::attempt([
    'email' => $email,
    'password' => $password,
    fn (Builder $query) => $query->has('activeSubscription'),
])) {
    // Authentication was successful...
}
```

> [!WARNING]
> 在这些示例中，`email` 不是必需的选项，仅作为示例使用。你应该使用与数据库表中「用户名」对应的任何列名。

`attemptWhen` 方法接收一个闭包作为其第二个参数，可用于在实际认证用户之前对潜在用户进行更广泛的检查。该闭包接收潜在用户，并应返回 `true` 或 `false` 以指示该用户是否可以通过认证：

```php
if (Auth::attemptWhen([
    'email' => $email,
    'password' => $password,
], function (User $user) {
    return $user->isNotBanned();
})) {
    // Authentication was successful...
}
```

<a name="accessing-specific-guard-instances"></a>
#### 访问特定的守卫实例

通过 `Auth` 门面的 `guard` 方法，你可以指定在认证用户时想要使用的守卫实例。这允许你使用完全独立的可认证模型或用户表来管理应用程序不同部分的认证。

传递给 `guard` 方法的守卫名称应对应于 `auth.php` 配置文件中配置的某个守卫：

```php
if (Auth::guard('admin')->attempt($credentials)) {
    // ...
}
```

<a name="remembering-users"></a>
### 记住用户

许多 Web 应用程序在其登录表单上提供一个「记住我」复选框。如果你想在你的应用程序中提供「记住我」功能，可以将一个布尔值作为第二个参数传递给 `attempt` 方法。

当此值为 `true` 时，Laravel 将无限期地保持用户认证状态，直到他们手动注销。你的 `users` 表必须包含字符串类型的 `remember_token` 列，用于存储「记住我」令牌。新 Laravel 应用程序中包含的 `users` 表迁移已经包含此列：

```php
use Illuminate\Support\Facades\Auth;

if (Auth::attempt(['email' => $email, 'password' => $password], $remember)) {
    // The user is being remembered...
}
```

如果你的应用程序提供「记住我」功能，你可以使用 `viaRemember` 方法判断当前已认证用户是否是通过「记住我」Cookie 认证的：

```php
use Illuminate\Support\Facades\Auth;

if (Auth::viaRemember()) {
    // ...
}
```

<a name="other-authentication-methods"></a>
### 其他认证方法

<a name="authenticate-a-user-instance"></a>
#### 认证用户实例

如果你需要将一个现有的用户实例设置为当前已认证用户，可以将该用户实例传递给 `Auth` 门面的 `login` 方法。给定的用户实例必须是 `Illuminate\Contracts\Auth\Authenticatable` [契约](/docs/{{version}}/contracts)的实现。Laravel 附带的 `App\Models\User` 模型已经实现了此接口。这种认证方法在你已经有一个有效的用户实例时非常有用，例如在用户注册你的应用程序后直接使用：

```php
use Illuminate\Support\Facades\Auth;

Auth::login($user);
```

你可以将一个布尔值作为第二个参数传递给 `login` 方法。此值指示是否需要对已认证会话使用「记住我」功能。请记住，这意味着会话将无限期地保持认证状态，或者直到用户手动退出应用程序：

```php
Auth::login($user, $remember = true);
```

如果需要，你可以在调用 `login` 方法之前指定一个认证守卫：

```php
Auth::guard('admin')->login($user);
```

<a name="authenticate-a-user-by-id"></a>
#### 通过 ID 认证用户

要使用用户数据库记录的主键来认证用户，你可以使用 `loginUsingId` 方法。此方法接受你想要认证的用户的主键：

```php
Auth::loginUsingId(1);
```

你可以将一个布尔值传递给 `loginUsingId` 方法的 `remember` 参数。此值指示是否需要对已认证会话使用「记住我」功能。请记住，这意味着会话将无限期地保持认证状态，或者直到用户手动退出应用程序：

```php
Auth::loginUsingId(1, remember: true);
```

<a name="authenticate-a-user-once"></a>
#### 一次性认证用户

你可以使用 `once` 方法为单个请求认证用户。调用此方法时不会使用会话或 Cookie，也不会分发 `Login` 事件：

```php
if (Auth::once($credentials)) {
    // ...
}
```

<a name="http-basic-authentication"></a>
## HTTP 基本认证

[HTTP 基本认证](https://en.wikipedia.org/wiki/Basic_access_authentication)提供了一种快速认证应用程序用户的方法，而无需设置专用的「登录」页面。要开始使用，将 `auth.basic` [中间件](/docs/{{version}}/middleware)附加到路由即可。`auth.basic` 中间件包含在 Laravel 框架中，因此你无需定义它：

```php
Route::get('/profile', function () {
    // Only authenticated users may access this route...
})->middleware('auth.basic');
```

一旦中间件被附加到路由，你在浏览器中访问该路由时将自动提示输入凭证。默认情况下，`auth.basic` 中间件会假定你的 `users` 数据库表中的 `email` 列是用户的「用户名」。

<a name="a-note-on-fastcgi"></a>
#### 关于 FastCGI 的说明

如果你使用 [PHP FastCGI](https://www.php.net/manual/en/install.fpm.php) 和 Apache 来运行 Laravel 应用程序，HTTP 基本认证可能无法正常工作。要解决这些问题，可以将以下几行添加到你的应用程序的 `.htaccess` 文件中：

```apache
RewriteCond %{HTTP:Authorization} ^(.+)$
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
```

<a name="stateless-http-basic-authentication"></a>
### 无状态 HTTP 基本认证

你也可以使用 HTTP 基本认证而不在会话中设置用户标识 Cookie。如果你选择使用 HTTP 认证来认证对你的应用程序 API 的请求，这主要会很有帮助。为此，[定义一个中间件](/docs/{{version}}/middleware)，调用 `onceBasic` 方法。如果 `onceBasic` 方法没有返回响应，则请求可以进一步传递到应用程序中：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateOnceWithBasicAuth
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        return Auth::onceBasic() ?: $next($request);
    }

}
```

接下来，将中间件附加到路由：

```php
Route::get('/api/user', function () {
    // Only authenticated users may access this route...
})->middleware(AuthenticateOnceWithBasicAuth::class);
```

<a name="logging-out"></a>
## 退出登录

要手动将用户退出你的应用程序，你可以使用 `Auth` 门面提供的 `logout` 方法。这将从用户的会话中移除认证信息，以便后续请求不被认证。

除了调用 `logout` 方法之外，建议你使会话失效并重新生成他们的 [CSRF 令牌](/docs/{{version}}/csrf)。退出登录后，通常会重定向到应用程序的根目录：

```php
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

/**
 * Log the user out of the application.
 */
public function logout(Request $request): RedirectResponse
{
    Auth::logout();

    $request->session()->invalidate();

    $request->session()->regenerateToken();

    return redirect('/');
}
```

<a name="invalidating-sessions-on-other-devices"></a>
### 使其他设备上的会话失效

Laravel 还提供了一种机制，用于使在其他设备上活跃的用户会话失效并「退出登录」，而不会使当前设备上的会话失效。此功能通常在用户更改或更新密码时使用，你希望在保持当前设备认证的同时，使其他设备上的会话失效。

在开始之前，你应该确保 `Illuminate\Session\Middleware\AuthenticateSession` 中间件已包含在应接收会话认证的路由上。通常，你应该将此中间件放在一个路由组定义上，以便可以将其应用于应用程序的大部分路由。默认情况下，`AuthenticateSession` 中间件可以通过 `auth.session`[中间件别名](/docs/{{version}}/middleware#middleware-aliases)附加到路由：

```php
Route::middleware(['auth', 'auth.session'])->group(function () {
    Route::get('/', function () {
        // ...
    });
});
```

然后，你可以使用 `Auth` 门面提供的 `logoutOtherDevices` 方法。此方法要求用户确认其当前密码，你的应用程序应通过输入表单接受该密码：

```php
use Illuminate\Support\Facades\Auth;

Auth::logoutOtherDevices($currentPassword);
```

当调用 `logoutOtherDevices` 方法时，用户的其他会话将完全失效，意味着他们将从之前认证的所有守卫中「退出登录」。

<a name="password-confirmation"></a>
## 密码确认

在构建应用程序时，有时可能会遇到一些操作需要用户在执行操作之前或重定向到应用程序的敏感区域之前确认其密码。Laravel 包含内置中间件，使这一过程变得轻而易举。实现此功能需要你定义两条路由：一条用于显示要求用户确认密码的视图，另一条用于确认密码有效并重定向用户到其预期目标。

> [!NOTE]
> 以下文档讨论了如何直接集成 Laravel 的密码确认功能；但是，如果你想更快速地开始，[Laravel 应用程序启动工具包](/docs/{{version}}/starter-kits)包含对此功能的支持！

<a name="password-confirmation-configuration"></a>
### 配置

确认密码后，用户在三个小时内不会被再次要求确认密码。但是，你可以通过更改应用程序的 `config/auth.php` 配置文件中的 `password_timeout` 配置值，来配置用户被重新提示输入密码之前的时间长度。

<a name="password-confirmation-routing"></a>
### 路由

<a name="the-password-confirmation-form"></a>
#### 密码确认表单

首先，我们将定义一条路由来显示一个要求用户确认密码的视图：

```php
Route::get('/confirm-password', function () {
    return view('auth.confirm-password');
})->middleware('auth')->name('password.confirm');
```

正如你所预期的，此路由返回的视图应包含一个包含 `password` 字段的表单。此外，请随意在视图中包含一些文本，说明用户正在进入应用程序的受保护区域，必须确认其密码。

<a name="confirming-the-password"></a>
#### 确认密码

接下来，我们将定义一条路由来处理来自「密码确认」视图的表单请求。此路由将负责验证密码并将用户重定向到他们的预期目标：

```php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

Route::post('/confirm-password', function (Request $request) {
    if (! Hash::check($request->password, $request->user()->password)) {
        return back()->withErrors([
            'password' => ['The provided password does not match our records.']
        ]);
    }

    $request->session()->passwordConfirmed();

    return redirect()->intended();
})->middleware(['auth', 'throttle:6,1']);
```

在继续之前，让我们更详细地检查这条路由。首先，请求的 `password` 字段被确定与已认证用户的密码匹配。如果密码有效，我们需要通知 Laravel 的会话用户已经确认了他们的密码。`passwordConfirmed` 方法将在用户会话中设置一个时间戳，Laravel 可以使用该时间戳来确定用户上次确认密码的时间。最后，我们可以将用户重定向到他们的预期目标。

<a name="password-confirmation-protecting-routes"></a>
### 保护路由

你应该确保任何执行需要最近密码确认的操作的路由都分配了 `password.confirm` 中间件。此中间件包含在 Laravel 的默认安装中，并将自动将用户的预期目标存储在会话中，以便用户在确认密码后可以重定向到该位置。在将会话中存储用户的预期目标后，中间件将重定向用户到 `password.confirm`[命名路由](/docs/{{version}}/routing#named-routes)：

```php
Route::get('/settings', function () {
    // ...
})->middleware(['password.confirm']);

Route::post('/settings', function () {
    // ...
})->middleware(['password.confirm']);
```

<a name="adding-custom-guards"></a>
## 添加自定义守卫

你可以使用 `Auth` 门面上的 `extend` 方法定义自己的认证守卫。你应在[服务提供者](/docs/{{version}}/providers)中放置对 `extend` 方法的调用。由于 Laravel 已经附带了 `AppServiceProvider`，我们可以将代码放在该提供者中：

```php
<?php

namespace App\Providers;

use App\Services\Auth\JwtGuard;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    // ...

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Auth::extend('jwt', function (Application $app, string $name, array $config) {
            // Return an instance of Illuminate\Contracts\Auth\Guard...

            return new JwtGuard(Auth::createUserProvider($config['provider']));
        });
    }
}
```

正如你在上面的示例中看到的，传递给 `extend` 方法的回调应返回 `Illuminate\Contracts\Auth\Guard` 的实现。此接口包含几个你需要实现的方法来定义自定义守卫。一旦定义了自定义守卫，你可以在 `auth.php` 配置文件的 `guards` 配置中引用该守卫：

```php
'guards' => [
    'api' => [
        'driver' => 'jwt',
        'provider' => 'users',
    ],
],
```

<a name="closure-request-guards"></a>
### 闭包请求守卫

实现自定义、基于 HTTP 请求的认证系统的最简单方式是使用 `Auth::viaRequest` 方法。此方法允许你使用单个闭包快速定义认证过程。

首先，在你的应用程序的 `AppServiceProvider` 的 `boot` 方法中调用 `Auth::viaRequest` 方法。`viaRequest` 方法接受一个认证驱动名称作为其第一个参数。此名称可以是用来自定义守卫的任何字符串。传递给该方法的第二个参数应是一个闭包，它接收传入的 HTTP 请求并返回一个用户实例，或者如果认证失败，则返回 `null`：

```php
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Auth::viaRequest('custom-token', function (Request $request) {
        return User::where('token', (string) $request->token)->first();
    });
}
```

一旦定义了自定义认证驱动，你可以在 `auth.php` 配置文件的 `guards` 配置中将其配置为驱动：

```php
'guards' => [
    'api' => [
        'driver' => 'custom-token',
    ],
],
```

最后，你可以在将认证中间件分配给路由时引用该守卫：

```php
Route::middleware('auth:api')->group(function () {
    // ...
});
```

<a name="adding-custom-user-providers"></a>
## 添加自定义用户提供者

如果你不使用传统的关系数据库来存储用户，则需要使用自己的认证用户提供者来扩展 Laravel。我们将使用 `Auth` 门面上的 `provider` 方法来定义自定义用户提供者。用户提供者解析器应返回 `Illuminate\Contracts\Auth\UserProvider` 的实现：

```php
<?php

namespace App\Providers;

use App\Extensions\MongoUserProvider;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    // ...

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Auth::provider('mongo', function (Application $app, array $config) {
            // Return an instance of Illuminate\Contracts\Auth\UserProvider...

            return new MongoUserProvider($app->make('mongo.connection'));
        });
    }
}
```

使用 `provider` 方法注册提供者后，你可以在 `auth.php` 配置文件中切换到新的用户提供者。首先，定义一个使用新驱动的 `provider`：

```php
'providers' => [
    'users' => [
        'driver' => 'mongo',
    ],
],
```

最后，你可以在 `guards` 配置中引用此提供者：

```php
'guards' => [
    'web' => [
        'driver' => 'session',
        'provider' => 'users',
    ],
],
```

<a name="the-user-provider-contract"></a>
### 用户提供者契约

`Illuminate\Contracts\Auth\UserProvider` 的实现负责从持久存储系统（如 MySQL、MongoDB 等）中获取 `Illuminate\Contracts\Auth\Authenticatable` 的实现。这两个接口使得 Laravel 认证机制能够继续运行，无论用户数据如何存储或使用什么类型的类来表示已认证用户：

让我们看看 `Illuminate\Contracts\Auth\UserProvider` 契约：

```php
<?php

namespace Illuminate\Contracts\Auth;

interface UserProvider
{
    public function retrieveById($identifier);
    public function retrieveByToken($identifier, $token);
    public function updateRememberToken(Authenticatable $user, $token);
    public function retrieveByCredentials(array $credentials);
    public function validateCredentials(Authenticatable $user, array $credentials);
    public function rehashPasswordIfRequired(Authenticatable $user, array $credentials, bool $force = false);
}
```

`retrieveById` 函数通常接收一个表示用户的键，例如来自 MySQL 数据库的自增 ID。匹配该 ID 的 `Authenticatable` 实现应由该方法检索并返回。

`retrieveByToken` 函数通过用户的唯一 `$identifier` 和「记住我」的 `$token` 检索用户，通常存储在像 `remember_token` 这样的数据库列中。与前面的方法一样，具有匹配令牌值的 `Authenticatable` 实现应由该方法返回。

`updateRememberToken` 方法使用新的 `$token` 更新 `$user` 实例的 `remember_token`。在成功的「记住我」认证尝试或用户退出登录时，会为用户分配一个新的令牌。

`retrieveByCredentials` 方法接收尝试认证应用程序时传递给 `Auth::attempt` 方法的凭证数组。然后，该方法应「查询」底层持久存储以查找匹配这些凭证的用户。通常，此方法将使用「where」条件运行查询，搜索具有匹配 `$credentials['username']` 值的「用户名」的用户记录。该方法应返回 `Authenticatable` 的实现。**此方法不应尝试进行任何密码验证或认证。**

`validateCredentials` 方法应将给定的 `$user` 与 `$credentials` 进行比较以认证用户。例如，此方法通常会使用 `Hash::check` 方法将 `$user->getAuthPassword()` 的值与 `$credentials['password']` 的值进行比较。该方法应返回 `true` 或 `false`，指示密码是否有效。

`rehashPasswordIfRequired` 方法应在需要且支持时重新哈希给定 `$user` 的密码。例如，此方法通常会使用 `Hash::needsRehash` 方法来确定 `$credentials['password']` 值是否需要重新哈希。如果密码需要重新哈希，该方法应使用 `Hash::make` 方法重新哈希密码并更新底层持久存储中的用户记录。

<a name="the-authenticatable-contract"></a>
### 可认证契约

现在我们已经探讨了 `UserProvider` 上的每个方法，让我们看看 `Authenticatable` 契约。请记住，用户提供者应从 `retrieveById`、`retrieveByToken` 和 `retrieveByCredentials` 方法返回此接口的实现：

```php
<?php

namespace Illuminate\Contracts\Auth;

interface Authenticatable
{
    public function getAuthIdentifierName();
    public function getAuthIdentifier();
    public function getAuthPasswordName();
    public function getAuthPassword();
    public function getRememberToken();
    public function setRememberToken($value);
    public function getRememberTokenName();
}
```

这个接口很简单。`getAuthIdentifierName` 方法应返回用户的「主键」列的名称，`getAuthIdentifier` 方法应返回用户的「主键」。当使用 MySQL 后端时，这很可能是分配给用户记录的自增主键。`getAuthPasswordName` 方法应返回用户密码列的名称。`getAuthPassword` 方法应返回用户的哈希密码。

此接口允许认证系统与任何「用户」类一起工作，无论你使用什么 ORM 或存储抽象层。默认情况下，Laravel 在 `app/Models` 目录中包含一个实现了此接口的 `App\Models\User` 类。

<a name="automatic-password-rehashing"></a>
## 自动密码重新哈希

Laravel 的默认密码哈希算法是 bcrypt。bcrypt 哈希的「工作因子」可以通过应用程序的 `config/hashing.php` 配置文件或 `BCRYPT_ROUNDS` 环境变量进行调整。

通常，随着 CPU/GPU 处理能力的提高，bcrypt 工作因子应随时间增加。如果你为应用程序增加了 bcrypt 工作因子，Laravel 将在用户通过 Laravel 的启动工具包认证应用程序或通过 `attempt` 方法[手动认证用户](#authenticating-users)时，优雅地自动重新哈希用户密码。

通常，自动密码重新哈希不应干扰你的应用程序；但是，你可以通过发布 `hashing` 配置文件来禁用此行为：

```shell
php artisan config:publish hashing
```

配置文件发布后，你可以将 `rehash_on_login` 配置值设置为 `false`：

```php
'rehash_on_login' => false,
```

<a name="events"></a>
## 事件

Laravel 在认证过程中会分发各种[事件](/docs/{{version}}/events)。你可以为以下任何事件[定义监听器](/docs/{{version}}/events)：

<div class="overflow-auto">

| 事件名称                                        |
| ---------------------------------------------- |
| `Illuminate\Auth\Events\Registered`            |
| `Illuminate\Auth\Events\Attempting`            |
| `Illuminate\Auth\Events\Authenticated`         |
| `Illuminate\Auth\Events\Login`                 |
| `Illuminate\Auth\Events\Failed`                |
| `Illuminate\Auth\Events\Validated`             |
| `Illuminate\Auth\Events\Verified`              |
| `Illuminate\Auth\Events\Logout`                |
| `Illuminate\Auth\Events\CurrentDeviceLogout`   |
| `Illuminate\Auth\Events\OtherDeviceLogout`     |
| `Illuminate\Auth\Events\Lockout`               |
| `Illuminate\Auth\Events\PasswordReset`         |
| `Illuminate\Auth\Events\PasswordResetLinkSent` |

</div>

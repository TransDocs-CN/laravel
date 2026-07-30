# Laravel Fortify

- [简介](#introduction)
    - [什么是 Fortify？](#what-is-fortify)
    - [何时应该使用 Fortify？](#when-should-i-use-fortify)
- [安装](#installation)
    - [Fortify 功能](#fortify-features)
    - [禁用视图](#disabling-views)
- [身份验证](#authentication)
    - [自定义用户身份验证](#customizing-user-authentication)
    - [自定义身份验证管道](#customizing-the-authentication-pipeline)
    - [自定义重定向](#customizing-authentication-redirects)
- [双因素身份验证](#two-factor-authentication)
    - [启用双因素身份验证](#enabling-two-factor-authentication)
    - [使用双因素身份验证进行身份验证](#authenticating-with-two-factor-authentication)
    - [禁用双因素身份验证](#disabling-two-factor-authentication)
- [通行密钥](#passkeys)
    - [启用通行密钥](#enabling-passkeys)
    - [JavaScript 客户端](#passkeys-javascript-client)
    - [使用通行密钥进行身份验证](#authenticating-with-passkeys)
    - [使用通行密钥确认密码](#confirming-password-with-passkeys)
    - [注册通行密钥](#registering-passkeys)
    - [删除通行密钥](#deleting-passkeys)
- [注册](#registration)
    - [自定义注册](#customizing-registration)
- [密码重置](#password-reset)
    - [请求密码重置链接](#requesting-a-password-reset-link)
    - [重置密码](#resetting-the-password)
    - [自定义密码重置](#customizing-password-resets)
- [邮箱验证](#email-verification)
    - [保护路由](#protecting-routes)
- [密码确认](#password-confirmation)

<a name="introduction"></a>
## 简介

[Laravel Fortify](https://github.com/laravel/fortify) 是一个前端无关的 Laravel 身份验证后端实现。Fortify 注册了实现 Laravel 所有身份验证功能所需的路由和控制器，包括登录、注册、密码重置、邮箱验证等。安装 Fortify 后，你可以运行 `route:list` Artisan 命令来查看 Fortify 已注册的路由。

由于 Fortify 不提供自己的用户界面，因此它旨在与你的用户界面配对使用，该界面将向其注册的路由发出请求。在本文档的其余部分，我们将详细讨论如何向这些路由发出请求。

> [!NOTE]
> 记住，Fortify 是一个旨在帮助你快速实现 Laravel 身份验证功能的软件包。**你并非必须使用它。** 你始终可以通过遵循 [身份验证](/docs/{{version}}/authentication)、[密码重置](/docs/{{version}}/passwords) 和 [邮箱验证](/docs/{{version}}/verification) 文档中的说明，手动与 Laravel 的身份验证服务交互。

<a name="what-is-fortify"></a>
### 什么是 Fortify？

如前所述，Laravel Fortify 是一个前端无关的 Laravel 身份验证后端实现。Fortify 注册了实现 Laravel 所有身份验证功能所需的路由和控制器，包括登录、注册、密码重置、邮箱验证等。

**你并非必须使用 Fortify 来使用 Laravel 的身份验证功能。** 你始终可以通过遵循 [身份验证](/docs/{{version}}/authentication)、[密码重置](/docs/{{version}}/passwords) 和 [邮箱验证](/docs/{{version}}/verification) 文档中的说明，手动与 Laravel 的身份验证服务交互。

如果你刚接触 Laravel，你可能希望探索[我们的应用入门套件](/docs/{{version}}/starter-kits)。Laravel 的应用入门套件在内部使用 Fortify，为你的应用程序提供身份验证脚手架，其中包括使用 [Tailwind CSS](https://tailwindcss.com) 构建的用户界面。这使你能够学习和熟悉 Laravel 的身份验证功能。

Laravel Fortify 本质上采用了我们应用入门套件的路由和控制器，并将其作为不包含用户界面的软件包提供。这使你仍然可以快速搭建应用程序身份验证层的后端实现，而无需受任何特定前端观点的束缚。

<a name="when-should-i-use-fortify"></a>
### 何时应该使用 Fortify？

你可能想知道何时适合使用 Laravel Fortify。首先，如果你正在使用 Laravel 的某个[应用入门套件](/docs/{{version}}/starter-kits)，则无需安装 Laravel Fortify，因为所有 Laravel 应用入门套件都使用 Fortify 并且已经提供了完整的身份验证实现。

如果你没有使用应用入门套件，并且你的应用程序需要身份验证功能，你有两个选择：手动实现应用程序的身份验证功能，或使用 Laravel Fortify 来提供这些功能的后端实现。

如果你选择安装 Fortify，你的用户界面将向本文档中详述的 Fortify 身份验证路由发出请求，以进行用户身份验证和注册。

如果你选择手动与 Laravel 的身份验证服务交互而不是使用 Fortify，可以通过遵循 [身份验证](/docs/{{version}}/authentication)、[密码重置](/docs/{{version}}/passwords) 和 [邮箱验证](/docs/{{version}}/verification) 文档中的说明来实现。

<a name="laravel-fortify-and-laravel-sanctum"></a>
#### Laravel Fortify 和 Laravel Sanctum

一些开发者对 [Laravel Sanctum](/docs/{{version}}/sanctum) 和 Laravel Fortify 之间的区别感到困惑。由于这两个软件包解决的是两个不同但相关的问题，因此 Laravel Fortify 和 Laravel Sanctum 并不是互斥或相互竞争的软件包。

Laravel Sanctum 仅关注管理 API 令牌以及使用会话 Cookie 或令牌对现有用户进行身份验证。Sanctum 不提供任何处理用户注册、密码重置等的路由。

如果你正试图为提供 API 或作为单页应用后端的应用程序手动构建身份验证层，你完全有可能同时使用 Laravel Fortify（用于用户注册、密码重置等）和 Laravel Sanctum（API 令牌管理、会话身份验证）。

<a name="installation"></a>
## 安装

首先，使用 Composer 包管理器安装 Fortify：

```shell
composer require laravel/fortify
```

接下来，使用 `fortify:install` Artisan 命令发布 Fortify 的资源：

```shell
php artisan fortify:install
```

此命令将 Fortify 的 actions 发布到你的 `app/Actions` 目录（如果不存在则会创建）。此外，还将发布 `FortifyServiceProvider`、配置文件和所有必要的数据库迁移。

接下来，运行数据库迁移：

```shell
php artisan migrate
```

<a name="fortify-features"></a>
### Fortify 功能

`fortify` 配置文件包含一个 `features` 配置数组。该数组定义了 Fortify 默认将公开哪些后端路由/功能。我们建议你仅启用以下功能，这些是大多数 Laravel 应用程序提供的基本身份验证功能：

```php
'features' => [
    Features::registration(),
    Features::resetPasswords(),
    Features::emailVerification(),
],
```

<a name="disabling-views"></a>
### 禁用视图

默认情况下，Fortify 定义了旨在返回视图的路由，例如登录屏幕或注册屏幕。但是，如果你正在构建 JavaScript 驱动的单页应用，则可能不需要这些路由。因此，你可以通过将应用程序的 `config/fortify.php` 配置文件中的 `views` 配置值设置为 `false` 来完全禁用这些路由：

```php
'views' => false,
```

<a name="disabling-views-and-password-reset"></a>
#### 禁用视图和密码重置

如果你选择禁用 Fortify 的视图，并且将为应用程序实现密码重置功能，你仍应定义一个名为 `password.reset` 的路由，负责显示应用程序的"重置密码"视图。这是必需的，因为 Laravel 的 `Illuminate\Auth\Notifications\ResetPassword` 通知将通过名为 `password.reset` 的路由生成密码重置 URL。

<a name="authentication"></a>
## 身份验证

首先，我们需要指示 Fortify 如何返回我们的"登录"视图。记住，Fortify 是一个无头身份验证库。如果你想要已经为你完成的 Laravel 身份验证功能的前端实现，应使用[应用入门套件](/docs/{{version}}/starter-kits)。

所有身份验证视图的渲染逻辑都可以通过 `Laravel\Fortify\Fortify` 类提供的相应方法进行自定义。通常，你应在应用程序的 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用此方法。Fortify 将负责定义返回此视图的 `/login` 路由：

```php
use Laravel\Fortify\Fortify;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Fortify::loginView(function () {
        return view('auth.login');
    });

    // ...
}
```

你的登录模板应包含一个向 `/login` 发起 POST 请求的表单。`/login` 端点需要一个字符串 `email`/`username` 和一个 `password`。邮箱/用户名字段的名称应与 `config/fortify.php` 配置文件中的 `username` 值匹配。此外，还可以提供一个布尔型 `remember` 字段，以指示用户希望使用 Laravel 提供的"记住我"功能。

如果登录尝试成功，Fortify 将重定向到应用程序 `fortify` 配置文件中 `home` 配置选项设置的 URI。如果登录请求是 XHR 请求，将返回 200 HTTP 响应。

如果请求未成功，用户将被重定向回登录屏幕，并且验证错误将通过共享的 `$errors` [Blade 模板变量](/docs/{{version}}/validation#quick-displaying-the-validation-errors)提供。或者，对于 XHR 请求，验证错误将随 422 HTTP 响应一起返回。

<a name="customizing-user-authentication"></a>
### 自定义用户身份验证

Fortify 将根据提供的凭据和应用程序配置的身份验证守卫自动检索和验证用户。但是，有时你可能希望完全自定义登录凭据的验证方式和用户的检索方式。幸运的是，Fortify 允许你使用 `Fortify::authenticateUsing` 方法轻松实现这一点。

此方法接受一个闭包，该闭包接收传入的 HTTP 请求。该闭包负责验证请求附带的登录凭据并返回关联的用户实例。如果凭据无效或找不到用户，闭包应返回 `null` 或 `false`。通常，此方法应在 `FortifyServiceProvider` 的 `boot` 方法中调用：

```php
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Laravel\Fortify\Fortify;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Fortify::authenticateUsing(function (Request $request) {
        $user = User::where('email', $request->email)->first();

        if ($user &&
            Hash::check($request->password, $user->password)) {
            return $user;
        }
    });

    // ...
}
```

<a name="authentication-guard"></a>
#### 身份验证守卫

你可以在应用程序的 `fortify` 配置文件中自定义 Fortify 使用的身份验证守卫。但是，应确保配置的守卫是 `Illuminate\Contracts\Auth\StatefulGuard` 的实现。如果你尝试使用 Laravel Fortify 来验证 SPA，则应结合使用 Laravel 的默认 `web` 守卫和 [Laravel Sanctum](https://laravel.com/docs/sanctum)。

<a name="customizing-the-authentication-pipeline"></a>
### 自定义身份验证管道

Laravel Fortify 通过一系列可调用类组成的管道对登录请求进行身份验证。如果你愿意，可以定义一个自定义的类管道来处理登录请求。每个类应有一个 `__invoke` 方法，该方法接收传入的 `Illuminate\Http\Request` 实例，并且像[中间件](/docs/{{version}}/middleware)一样，有一个 `$next` 变量，用于将请求传递给管道中的下一个类。

要定义自定义管道，可以使用 `Fortify::authenticateThrough` 方法。此方法接受一个闭包，该闭包应返回用于处理登录请求的类数组。通常，此方法应在 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用。

以下示例包含默认的管道定义，在进行自己的修改时可以作为起点：

```php
use Laravel\Fortify\Actions\AttemptToAuthenticate;
use Laravel\Fortify\Actions\CanonicalizeUsername;
use Laravel\Fortify\Actions\EnsureLoginIsNotThrottled;
use Laravel\Fortify\Actions\PrepareAuthenticatedSession;
use Laravel\Fortify\Actions\RedirectIfTwoFactorAuthenticatable;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;
use Illuminate\Http\Request;

Fortify::authenticateThrough(function (Request $request) {
    return array_filter([
            config('fortify.limiters.login') ? null : EnsureLoginIsNotThrottled::class,
            config('fortify.lowercase_usernames') ? CanonicalizeUsername::class : null,
            Features::enabled(Features::twoFactorAuthentication()) ? RedirectIfTwoFactorAuthenticatable::class : null,
            AttemptToAuthenticate::class,
            PrepareAuthenticatedSession::class,
    ]);
});
```

#### 身份验证频率限制

默认情况下，Fortify 将使用 `EnsureLoginIsNotThrottled` 中间件对身份验证尝试进行频率限制。此中间件对用户名和 IP 地址组合进行频率限制。

某些应用程序可能需要不同的身份验证尝试频率限制方法，例如仅按 IP 地址进行限制。因此，Fortify 允许你通过 `fortify.limiters.login` 配置选项指定自己的[速率限制器](/docs/{{version}}/routing#rate-limiting)。当然，此配置选项位于应用程序的 `config/fortify.php` 配置文件中。

> [!NOTE]
> 结合使用频率限制、[双因素身份验证](/docs/{{version}}/fortify#two-factor-authentication)和外部 Web 应用防火墙（WAF）将为你的合法应用用户提供最强大的防御。

<a name="customizing-authentication-redirects"></a>
### 自定义重定向

如果登录尝试成功，Fortify 将重定向到应用程序 `fortify` 配置文件中 `home` 配置选项设置的 URI。如果登录请求是 XHR 请求，将返回 200 HTTP 响应。用户退出应用程序后，将被重定向到 `/` URI。

如果你需要对此行为进行高级自定义，可以将 `LoginResponse` 和 `LogoutResponse` 契约的实现绑定到 Laravel [服务容器](/docs/{{version}}/container)中。通常，这应在应用程序的 `App\Providers\FortifyServiceProvider` 类的 `register` 方法中完成：

```php
use Laravel\Fortify\Contracts\LogoutResponse;

/**
 * Register any application services.
 */
public function register(): void
{
    $this->app->instance(LogoutResponse::class, new class implements LogoutResponse {
        public function toResponse($request)
        {
            return redirect('/');
        }
    });
}
```

<a name="two-factor-authentication"></a>
## 双因素身份验证

启用了 Fortify 的双因素身份验证功能后，用户需要在身份验证过程中输入六位数字令牌。此令牌使用基于时间的一次性密码（TOTP）生成，可以从任何兼容 TOTP 的移动身份验证应用程序（如 Google Authenticator）获取。

在开始之前，应首先确保应用程序的 `App\Models\User` 模型使用了 `Laravel\Fortify\TwoFactorAuthenticatable` 这个 trait：

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    use Notifiable, TwoFactorAuthenticatable;
}
```

接下来，你应在应用程序中构建一个屏幕，让用户可以管理其双因素身份验证设置。此屏幕应允许用户启用和禁用双因素身份验证，以及重新生成双因素身份验证恢复代码。

> 默认情况下，`fortify` 配置文件中的 `features` 数组指示 Fortify 的双因素身份验证设置在修改之前需要密码确认。因此，你的应用程序应在继续之前实现 Fortify 的[密码确认](#password-confirmation)功能。

<a name="enabling-two-factor-authentication"></a>
### 启用双因素身份验证

要开始启用双因素身份验证，你的应用程序应向 Fortify 定义的 `/user/two-factor-authentication` 端点发起 POST 请求。如果请求成功，用户将被重定向回之前的 URL，并且 `status` 会话变量将设置为 `two-factor-authentication-enabled`。你可以在模板中检测此 `status` 会话变量以显示适当的成功消息。如果请求是 XHR 请求，将返回 `200` HTTP 响应。

在选择启用双因素身份验证后，用户还必须通过提供有效的双因素身份验证代码来"确认"其双因素身份验证配置。因此，你的"成功"消息应告知用户双因素身份验证确认仍然需要：

```html
@if (session('status') == 'two-factor-authentication-enabled')
    <div class="mb-4 font-medium text-sm">
        Please finish configuring two-factor authentication below.
    </div>
@endif
```

接下来，你应显示双因素身份验证 QR 码供用户扫描到其身份验证器应用中。如果你使用 Blade 来渲染应用程序的前端，可以使用用户实例上的 `twoFactorQrCodeSvg` 方法来获取 QR 码 SVG：

```php
$request->user()->twoFactorQrCodeSvg();
```

如果你正在构建 JavaScript 驱动的前端，可以向 `/user/two-factor-qr-code` 端点发出 XHR GET 请求来获取用户的双因素身份验证 QR 码。此端点将返回包含 `svg` 键的 JSON 对象。

<a name="confirming-two-factor-authentication"></a>
#### 确认双因素身份验证

除了显示用户的双因素身份验证 QR 码外，你还应提供一个文本输入框，让用户可以输入有效的身份验证码来"确认"其双因素身份验证配置。此代码应通过 POST 请求提交到 Fortify 定义的 `/user/confirmed-two-factor-authentication` 端点。

如果请求成功，用户将被重定向回之前的 URL，并且 `status` 会话变量将设置为 `two-factor-authentication-confirmed`：

```html
@if (session('status') == 'two-factor-authentication-confirmed')
    <div class="mb-4 font-medium text-sm">
        Two-factor authentication confirmed and enabled successfully.
    </div>
@endif
```

如果对双因素身份验证确认端点的请求是通过 XHR 请求发出的，将返回 `200` HTTP 响应。

<a name="displaying-the-recovery-codes"></a>
#### 显示恢复代码

你还应显示用户的双因素恢复代码。这些恢复代码允许用户在无法访问其移动设备时进行身份验证。如果你使用 Blade 渲染应用程序的前端，可以通过已认证的用户实例访问恢复代码：

```php
(array) $request->user()->recoveryCodes()
```

如果你正在构建 JavaScript 驱动的前端，可以向 `/user/two-factor-recovery-codes` 端点发出 XHR GET 请求。此端点将返回包含用户恢复代码的 JSON 数组。

要重新生成用户的恢复代码，应用程序应向 `/user/two-factor-recovery-codes` 端点发起 POST 请求。

<a name="authenticating-with-two-factor-authentication"></a>
### 使用双因素身份验证进行身份验证

在身份验证过程中，Fortify 将自动将用户重定向到应用程序的双因素身份验证挑战屏幕。但是，如果应用程序正在发出 XHR 登录请求，成功身份验证尝试后返回的 JSON 响应将包含一个具有 `two_factor` 布尔属性的 JSON 对象。你应检查此值以了解是否应重定向到应用程序的双因素身份验证挑战屏幕。

要开始实现双因素身份验证功能，我们需要指示 Fortify 如何返回我们的双因素身份验证挑战视图。所有 Fortify 身份验证视图的渲染逻辑都可以通过 `Laravel\Fortify\Fortify` 类提供的相应方法进行自定义。通常，你应在应用程序的 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用此方法：

```php
use Laravel\Fortify\Fortify;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Fortify::twoFactorChallengeView(function () {
        return view('auth.two-factor-challenge');
    });

    // ...
}
```

Fortify 将负责定义返回此视图的 `/two-factor-challenge` 路由。你的 `two-factor-challenge` 模板应包含一个向 `/two-factor-challenge` 端点发起 POST 请求的表单。`/two-factor-challenge` 操作需要一个包含有效 TOTP 令牌的 `code` 字段或一个包含用户某个恢复代码的 `recovery_code` 字段。

如果登录尝试成功，Fortify 将把用户重定向到应用程序 `fortify` 配置文件中 `home` 配置选项设置的 URI。如果登录请求是 XHR 请求，将返回 204 HTTP 响应。

如果请求未成功，用户将被重定向回双因素挑战屏幕，并且验证错误将通过共享的 `$errors` [Blade 模板变量](/docs/{{version}}/validation#quick-displaying-the-validation-errors)提供。或者，对于 XHR 请求，验证错误将随 422 HTTP 响应一起返回。

<a name="disabling-two-factor-authentication"></a>
### 禁用双因素身份验证

要禁用双因素身份验证，应用程序应向 `/user/two-factor-authentication` 端点发起 DELETE 请求。记住，Fortify 的双因素身份验证端点在调用之前需要[密码确认](#password-confirmation)。

<a name="passkeys"></a>
## 通行密钥

Fortify 支持使用 WebAuthn 进行通行密钥身份验证。通行密钥允许用户使用平台身份验证器（如 Face ID、Touch ID、Windows Hello 或硬件安全密钥）进行身份验证，而无需密码。

<a name="enabling-passkeys"></a>
### 启用通行密钥

首先，确保在应用程序的 `fortify` 配置文件中启用了 `passkeys` 功能：

```php
use Laravel\Fortify\Features;

'features' => [
    // ...
    Features::passkeys([
        'confirmPassword' => true,
    ]),
],
```

`confirmPassword` 选项决定 Fortify 在注册或删除通行密钥之前是否需要[密码确认](#password-confirmation)。

接下来，确保应用程序的 `App\Models\User` 模型实现了 `Laravel\Fortify\Contracts\PasskeyUser` 并使用 `Laravel\Fortify\PasskeyAuthenticatable` 这个 trait：

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;

class User extends Authenticatable implements PasskeyUser
{
    use Notifiable, PasskeyAuthenticatable;
}
```

Fortify 的通行密钥配置选项可以使用应用程序 `config/fortify.php` 文件中的 `passkeys` 配置数组进行自定义：

```php
'passkeys' => [
    'relying_party_id' => parse_url(config('app.url'), PHP_URL_HOST),
    'allowed_origins' => [config('app.url')],
    'user_handle_secret' => config('app.key'),
    'timeout' => 60000,
],
```

> [!NOTE]
> Fortify 包装了 `laravel/passkeys` Composer 包并为你配置。如果你使用 Fortify 的通行密钥功能，应使用应用程序的 `config/fortify.php` 文件配置通行密钥。你不需要发布 `laravel/passkeys` 配置文件，其中定义的任何值都将被 Fortify 覆盖。

`relying_party_id` 应与应用程序的域名匹配。`allowed_origins` 数组列出了可以完成通行密钥注册和身份验证的浏览器来源。`user_handle_secret` 用于派生不透明的用户标识符，确保同一用户在通行密钥注册之间被识别。`timeout` 选项控制通行密钥注册和身份验证操作可以保持活动状态的时间。

Fortify 对其通行密钥登录、确认和注册路由应用了一个专用的通行密钥速率限制器。如果需要，你可以使用 `fortify.limiters.passkeys` 配置选项和相应的 `RateLimiter::for(...)` 定义来自定义它。

<a name="passkeys-javascript-client"></a>
### JavaScript 客户端

如果你正在构建自定义前端，包括带有浏览器端脚本的 Blade 应用程序，你可以使用官方 [`@laravel/passkeys`](https://www.npmjs.com/package/@laravel/passkeys) 软件包。此软件包处理浏览器 WebAuthn 仪式，并向 Fortify 的通行密钥端点发送请求。

通过 npm 安装该软件包：

```shell
npm install @laravel/passkeys
```

然后，你可以从前端发起通行密钥注册和验证：

```js
import { Passkeys } from "@laravel/passkeys";

await Passkeys.register({ name: "MacBook Pro" });
await Passkeys.verify();
```

如果你的应用程序使用自定义的通行密钥端点 URI，你可以在每次调用时覆盖路由：

```js
await Passkeys.verify({
    routes: {
        options: "/passkeys/confirm/options",
        submit: "/passkeys/confirm",
    },
});

await Passkeys.register({
    name: "MacBook Pro",
    routes: {
        options: "/user/passkeys/options",
        submit: "/user/passkeys",
    },
});
```

此软件包还通过 `@laravel/passkeys/react`、`@laravel/passkeys/vue` 和 `@laravel/passkeys/svelte` 提供 React、Vue 和 Svelte 辅助工具。

<a name="authenticating-with-passkeys"></a>
### 使用通行密钥进行身份验证

要使用通行密钥对用户进行身份验证，你的应用程序应首先向 `/passkeys/login/options` 端点发出 GET 请求。此端点返回 WebAuthn 挑战选项，你的前端应将其传递给 `navigator.credentials.get(...)`。

在浏览器返回凭据后，你的应用程序应使用凭据负载向 `/passkeys/login` 发起 POST 请求。你还可以包含一个布尔型的 `remember` 字段。

如果请求成功，Fortify 将用户登录到配置的守卫并返回：

<div class="content-list" markdown="1">

- 对于标准请求，重定向到你的目标地址。
- 对于 XHR 请求，返回包含带有 `redirect` 键的 JSON 负载的 `200` HTTP 响应。

</div>

<a name="confirming-password-with-passkeys"></a>
### 使用通行密钥确认密码

对于已认证的会话，Fortify 提供了通行密钥确认端点，以满足当前会话的 Laravel 密码确认要求。

要使用通行密钥确认，你的应用程序应首先向 `/passkeys/confirm/options` 端点发出 GET 请求。此端点返回 WebAuthn 挑战选项，你的前端应将其传递给 `navigator.credentials.get(...)`。

在浏览器返回凭据后，你的应用程序应使用凭据负载向 `/passkeys/confirm` 发起 POST 请求。

如果请求成功，Fortify 将当前会话标记为密码已确认并返回：

<div class="content-list" markdown="1">

- 对于标准请求，重定向到你的目标地址。
- 对于 XHR 请求，返回包含带有 `redirect` 键的 JSON 负载的 `200` HTTP 响应。

</div>

<a name="registering-passkeys"></a>
### 注册通行密钥

要为已认证用户注册通行密钥，你的应用程序应首先向 `/user/passkeys/options` 端点发出 GET 请求。此端点返回 WebAuthn 创建选项，你的前端应将其传递给 `navigator.credentials.create(...)`。

在浏览器返回凭据后，你的应用程序应使用 `name` 字段和包含 `navigator.credentials.create(...)` 返回的序列化 [`PublicKeyCredential`](https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredential) 对象的 `credential` 字段，向 `/user/passkeys` 发起 POST 请求。

如果请求成功，Fortify 将返回：

<div class="content-list" markdown="1">

- 对于标准请求，返回带有 `passkey-registered` 状态的重定向响应。
- 对于 XHR 请求，返回包含带有 `status` 键的 JSON 负载的 `200` HTTP 响应，以及新注册通行密钥的 `id` 和 `name`。

</div>

<a name="deleting-passkeys"></a>
### 删除通行密钥

要删除通行密钥，你的应用程序应向 `/user/passkeys/{passkey}` 发起 DELETE 请求。

如果请求成功，Fortify 将返回：

<div class="content-list" markdown="1">

- 对于标准请求，返回带有 `passkey-deleted` 状态的重定向响应。
- 对于 XHR 请求，返回包含带有 `status` 键的 JSON 负载的 `200` HTTP 响应。

</div>

<a name="registration"></a>
## 注册

要开始实现应用程序的注册功能，我们需要指示 Fortify 如何返回我们的"注册"视图。记住，Fortify 是一个无头身份验证库。如果你想要已经为你完成的 Laravel 身份验证功能的前端实现，应使用[应用入门套件](/docs/{{version}}/starter-kits)。

所有 Fortify 的视图渲染逻辑都可以通过 `Laravel\Fortify\Fortify` 类提供的相应方法进行自定义。通常，你应在 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用此方法：

```php
use Laravel\Fortify\Fortify;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Fortify::registerView(function () {
        return view('auth.register');
    });

    // ...
}
```

Fortify 将负责定义返回此视图的 `/register` 路由。你的 `register` 模板应包含一个向 Fortify 定义的 `/register` 端点发起 POST 请求的表单。

`/register` 端点需要一个字符串 `name`、字符串 email 地址/用户名、`password` 和 `password_confirmation` 字段。email/用户名字段的名称应与应用程序 `fortify` 配置文件中定义的 `username` 配置值匹配。

如果注册尝试成功，Fortify 将把用户重定向到应用程序 `fortify` 配置文件中 `home` 配置选项设置的 URI。如果请求是 XHR 请求，将返回 201 HTTP 响应。

如果请求未成功，用户将被重定向回注册屏幕，并且验证错误将通过共享的 `$errors` [Blade 模板变量](/docs/{{version}}/validation#quick-displaying-the-validation-errors)提供。或者，对于 XHR 请求，验证错误将随 422 HTTP 响应一起返回。

<a name="customizing-registration"></a>
### 自定义注册

用户验证和创建过程可以通过修改安装 Laravel Fortify 时生成的 `App\Actions\Fortify\CreateNewUser` 操作来自定义。

<a name="password-reset"></a>
## 密码重置

<a name="requesting-a-password-reset-link"></a>
### 请求密码重置链接

要开始实现应用程序的密码重置功能，我们需要指示 Fortify 如何返回我们的"忘记密码"视图。记住，Fortify 是一个无头身份验证库。如果你想要已经为你完成的 Laravel 身份验证功能的前端实现，应使用[应用入门套件](/docs/{{version}}/starter-kits)。

所有 Fortify 的视图渲染逻辑都可以通过 `Laravel\Fortify\Fortify` 类提供的相应方法进行自定义。通常，你应在应用程序的 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用此方法：

```php
use Laravel\Fortify\Fortify;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Fortify::requestPasswordResetLinkView(function () {
        return view('auth.forgot-password');
    });

    // ...
}
```

Fortify 将负责定义返回此视图的 `/forgot-password` 端点。你的 `forgot-password` 模板应包含一个向 `/forgot-password` 端点发起 POST 请求的表单。

`/forgot-password` 端点需要一个字符串 `email` 字段。此字段/数据库列的名称应与应用程序 `fortify` 配置文件中的 `email` 配置值匹配。

<a name="handling-the-password-reset-link-request-response"></a>
#### 处理密码重置链接请求响应

如果密码重置链接请求成功，Fortify 将把用户重定向回 `/forgot-password` 端点，并向用户发送一封包含安全链接的电子邮件，他们可以使用该链接重置密码。如果请求是 XHR 请求，将返回 200 HTTP 响应。

成功请求后重定向回 `/forgot-password` 端点后，可以使用 `status` 会话变量来显示密码重置链接请求尝试的状态。

`$status` 会话变量的值将与应用程序 `passwords` [语言文件](/docs/{{version}}/localization)中定义的翻译字符串之一匹配。如果你想自定义此值且尚未发布 Laravel 的语言文件，可以通过 `lang:publish` Artisan 命令来实现：

```html
@if (session('status'))
    <div class="mb-4 font-medium text-sm text-green-600">
        {{ session('status') }}
    </div>
@endif
```

如果请求未成功，用户将被重定向回密码重置链接请求屏幕，并且验证错误将通过共享的 `$errors` [Blade 模板变量](/docs/{{version}}/validation#quick-displaying-the-validation-errors)提供。或者，对于 XHR 请求，验证错误将随 422 HTTP 响应一起返回。

<a name="resetting-the-password"></a>
### 重置密码

要完成实现应用程序的密码重置功能，我们需要指示 Fortify 如何返回我们的"重置密码"视图。

所有 Fortify 的视图渲染逻辑都可以通过 `Laravel\Fortify\Fortify` 类提供的相应方法进行自定义。通常，你应在应用程序的 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用此方法：

```php
use Laravel\Fortify\Fortify;
use Illuminate\Http\Request;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Fortify::resetPasswordView(function (Request $request) {
        return view('auth.reset-password', ['request' => $request]);
    });

    // ...
}
```

Fortify 将负责定义显示此视图的路由。你的 `reset-password` 模板应包含一个向 `/reset-password` 发起 POST 请求的表单。

`/reset-password` 端点需要一个字符串 `email` 字段、一个 `password` 字段、一个 `password_confirmation` 字段，以及一个名为 `token` 的隐藏字段，其中包含 `request()->route('token')` 的值。"email"字段/数据库列的名称应与应用程序 `fortify` 配置文件中定义的 `email` 配置值匹配。

<a name="handling-the-password-reset-response"></a>
#### 处理密码重置响应

如果密码重置请求成功，Fortify 将重定向回 `/login` 路由，以便用户可以使用新密码登录。此外，还将设置一个 `status` 会话变量，以便你可以在登录屏幕上显示重置的成功状态：

```blade
@if (session('status'))
    <div class="mb-4 font-medium text-sm text-green-600">
        {{ session('status') }}
    </div>
@endif
```

如果请求是 XHR 请求，将返回 200 HTTP 响应。

如果请求未成功，用户将被重定向回重置密码屏幕，并且验证错误将通过共享的 `$errors` [Blade 模板变量](/docs/{{version}}/validation#quick-displaying-the-validation-errors)提供。或者，对于 XHR 请求，验证错误将随 422 HTTP 响应一起返回。

<a name="customizing-password-resets"></a>
### 自定义密码重置

密码重置过程可以通过修改安装 Laravel Fortify 时生成的 `App\Actions\ResetUserPassword` 操作来自定义。

<a name="email-verification"></a>
## 邮箱验证

注册后，你可能希望用户在继续访问应用程序之前验证其邮箱地址。首先，确保在 `fortify` 配置文件的 `features` 数组中启用了 `emailVerification` 功能。接下来，确保你的 `App\Models\User` 类实现了 `Illuminate\Contracts\Auth\MustVerifyEmail` 接口。

完成这两个设置步骤后，新注册的用户将收到一封提示他们验证邮箱所有权的电子邮件。但是，我们需要告知 Fortify 如何显示邮箱验证屏幕，该屏幕告知用户需要点击邮件中的验证链接。

所有 Fortify 视图的渲染逻辑都可以通过 `Laravel\Fortify\Fortify` 类提供的相应方法进行自定义。通常，你应在应用程序的 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用此方法：

```php
use Laravel\Fortify\Fortify;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Fortify::verifyEmailView(function () {
        return view('auth.verify-email');
    });

    // ...
}
```

Fortify 将负责定义在用户被 Laravel 内置的 `verified` 中间件重定向到 `/email/verify` 端点时显示此视图的路由。

你的 `verify-email` 模板应包含一条信息性消息，指示用户点击发送到其邮箱的邮箱验证链接。

<a name="resending-email-verification-links"></a>
#### 重新发送邮箱验证链接

如果你愿意，可以在应用程序的 `verify-email` 模板中添加一个按钮，该按钮触发对 `/email/verification-notification` 端点的 POST 请求。当此端点收到请求时，将向用户发送一封新的验证邮件链接，如果之前的链接意外删除或丢失，用户可以获取新的验证链接。

如果重新发送验证链接邮件的请求成功，Fortify 将把用户重定向回 `/email/verify` 端点，并带有 `status` 会话变量，允许你显示信息性消息告知用户操作已成功。如果请求是 XHR 请求，将返回 202 HTTP 响应：

```blade
@if (session('status') == 'verification-link-sent')
    <div class="mb-4 font-medium text-sm text-green-600">
        A new email verification link has been emailed to you!
    </div>
@endif
```

<a name="protecting-routes"></a>
### 保护路由

要指定某个路由或路由组要求用户已验证其邮箱地址，你应将 Laravel 内置的 `verified` 中间件附加到路由上。`verified` 中间件别名由 Laravel 自动注册，是 `Illuminate\Auth\Middleware\EnsureEmailIsVerified` 中间件的别名：

```php
Route::get('/dashboard', function () {
    // ...
})->middleware(['verified']);
```

<a name="password-confirmation"></a>
## 密码确认

在构建应用程序时，有时可能会遇到某些操作需要用户在操作执行前确认其密码的情况。通常，这些路由受 Laravel 内置的 `password.confirm` 中间件保护。

要开始实现密码确认功能，我们需要指示 Fortify 如何返回应用程序的"密码确认"视图。记住，Fortify 是一个无头身份验证库。如果你想要已经为你完成的 Laravel 身份验证功能的前端实现，应使用[应用入门套件](/docs/{{version}}/starter-kits)。

所有 Fortify 的视图渲染逻辑都可以通过 `Laravel\Fortify\Fortify` 类提供的相应方法进行自定义。通常，你应在应用程序的 `App\Providers\FortifyServiceProvider` 类的 `boot` 方法中调用此方法：

```php
use Laravel\Fortify\Fortify;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Fortify::confirmPasswordView(function () {
        return view('auth.confirm-password');
    });

    // ...
}
```

Fortify 将负责定义返回此视图的 `/user/confirm-password` 端点。你的 `confirm-password` 模板应包含一个向 `/user/confirm-password` 端点发起 POST 请求的表单。`/user/confirm-password` 端点需要一个包含用户当前密码的 `password` 字段。

如果密码与用户的当前密码匹配，Fortify 将把用户重定向到他们试图访问的路由。如果请求是 XHR 请求，将返回 201 HTTP 响应。

如果请求未成功，用户将被重定向回确认密码屏幕，并且验证错误将通过共享的 `$errors` Blade 模板变量提供。或者，对于 XHR 请求，验证错误将随 422 HTTP 响应一起返回。

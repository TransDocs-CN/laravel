# 重置密码

- [简介](#introduction)
    - [配置](#configuration)
    - [驱动前提条件](#driver-prerequisites)
    - [模型准备](#model-preparation)
    - [配置受信任主机](#configuring-trusted-hosts)
- [路由](#routing)
    - [请求密码重置链接](#requesting-the-password-reset-link)
    - [重置密码](#resetting-the-password)
- [删除过期令牌](#deleting-expired-tokens)
- [自定义](#password-customization)

<a name="introduction"></a>
## 简介

大多数 Web 应用程序都提供了一种让用户重置忘记密码的方法。Laravel 不要求你为你创建的每个应用程序手动重新实现此功能，而是提供了方便的服务，用于发送密码重置链接和安全地重置密码。

> [!NOTE]
> 想快速开始？在一个全新的 Laravel 应用程序中安装一个 Laravel [应用程序启动工具包](/docs/{{version}}/starter-kits)。Laravel 的启动工具包将为你搭建整个身份认证系统，包括重置忘记密码。

<a name="configuration"></a>
### 配置

你的应用程序的密码重置配置文件存储在 `config/auth.php` 中。请务必查看此文件中可供你使用的选项。默认情况下，Laravel 配置为使用 `database` 密码重置驱动。

密码重置 `driver` 配置选项定义了密码重置数据的存储位置。Laravel 包含两个驱动：

<div class="content-list" markdown="1">

- `database` - 密码重置数据存储在关系数据库中。
- `cache` - 密码重置数据存储在你的某个基于缓存的存储中。

</div>

<a name="driver-prerequisites"></a>
### 驱动前提条件

<a name="database"></a>
#### 数据库

当使用默认的 `database` 驱动时，必须创建一个表来存储应用程序的密码重置令牌。通常，这包含在 Laravel 默认的 `0001_01_01_000000_create_users_table.php` 数据库迁移中。

<a name="cache"></a>
#### 缓存

还有一个缓存驱动可用于处理密码重置，它不需要专用的数据库表。条目以用户的电子邮件地址为键，因此请确保你没有在应用程序的其他地方将电子邮件地址用作缓存键：

```php
'passwords' => [
    'users' => [
        'driver' => 'cache',
        'provider' => 'users',
        'store' => 'passwords', // Optional...
        'expire' => 60,
        'throttle' => 60,
    ],
],
```

为防止调用 `artisan cache:clear` 刷新你的密码重置数据，你可以选择使用 `store` 配置键指定一个单独的缓存存储。该值应对应于在 `config/cache.php` 配置值中配置的某个存储。

<a name="model-preparation"></a>
### 模型准备

在使用 Laravel 的密码重置功能之前，你的应用程序的 `App\Models\User` 模型必须使用 `Illuminate\Notifications\Notifiable` trait。通常，此 trait 已经包含在创建新 Laravel 应用程序时附带的默认 `App\Models\User` 模型中。

接下来，验证你的 `App\Models\User` 模型实现了 `Illuminate\Contracts\Auth\CanResetPassword` 契约。框架附带的 `App\Models\User` 模型已经实现了此接口，并使用 `Illuminate\Auth\Passwords\CanResetPassword` trait 来包含实现该接口所需的方法。

<a name="configuring-trusted-hosts"></a>
### 配置受信任主机

默认情况下，Laravel 将响应其接收到的所有请求，无论 HTTP 请求的 `Host` 标头的内容如何。此外，在 Web 请求期间为你的应用程序生成绝对 URL 时，将使用 `Host` 标头的值。

通常，你应该配置你的 Web 服务器（例如 Nginx 或 Apache）以仅将与给定主机名匹配的请求发送到你的应用程序。但是，如果你没有能力直接自定义你的 Web 服务器，并且需要指示 Laravel 仅响应某些主机名，你可以通过在你的应用程序的 `bootstrap/app.php` 文件中使用 `trustHosts` 中间件方法来做到这一点。当你的应用程序提供密码重置功能时，这尤其重要。

要了解有关此中间件方法的更多信息，请查阅 [TrustHosts 中间件文档](/docs/{{version}}/requests#configuring-trusted-hosts)。

<a name="routing"></a>
## 路由

为了正确实现允许用户重置密码的支持，我们需要定义几条路由。首先，我们需要一对路由来处理允许用户通过其电子邮件地址请求密码重置链接。其次，我们需要一对路由来处理当用户访问通过邮件发送给他们的密码重置链接并完成密码重置表单时实际重置密码的操作。

<a name="requesting-the-password-reset-link"></a>
### 请求密码重置链接

<a name="the-password-reset-link-request-form"></a>
#### 密码重置链接请求表单

首先，我们将定义请求密码重置链接所需的路由。开始之前，我们将定义一条返回带有密码重置链接请求表单的视图的路由：

```php
Route::get('/forgot-password', function () {
    return view('auth.forgot-password');
})->middleware('guest')->name('password.request');
```

此路由返回的视图应包含一个包含 `email` 字段的表单，该字段将允许用户为给定的电子邮件地址请求密码重置链接。

<a name="password-reset-link-handling-the-form-submission"></a>
#### 处理表单提交

接下来，我们将定义一条处理来自「忘记密码」视图的表单提交请求的路由。此路由将负责验证电子邮件地址并将密码重置请求发送给相应的用户：

```php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;

Route::post('/forgot-password', function (Request $request) {
    $request->validate(['email' => 'required|email']);

    $status = Password::sendResetLink(
        $request->only('email')
    );

    return $status === Password::ResetLinkSent
        ? back()->with(['status' => __($status)])
        : back()->withErrors(['email' => __($status)]);
})->middleware('guest')->name('password.email');
```

在继续之前，让我们更详细地检查这条路由。首先，验证请求的 `email` 属性。接下来，我们将使用 Laravel 内置的「密码代理」（通过 `Password` 门面）向用户发送密码重置链接。密码代理将负责通过给定字段（本例中为电子邮件地址）检索用户，并通过 Laravel 内置的[通知系统](/docs/{{version}}/notifications)向用户发送密码重置链接。

`sendResetLink` 方法返回一个「状态」标识。可以使用 Laravel 的[本地化](/docs/{{version}}/localization)助手翻译此状态，以便向用户显示关于其请求状态的用户友好消息。密码重置状态的翻译由你的应用程序的 `lang/{lang}/passwords.php` 语言文件确定。状态标识的每个可能值的条目都位于 `passwords` 语言文件中。

> [!NOTE]
> 默认情况下，Laravel 应用程序骨架不包含 `lang` 目录。如果你想自定义 Laravel 的语言文件，可以通过 `lang:publish` Artisan 命令发布它们。

你可能想知道 Laravel 如何在调用 `Password` 门面的 `sendResetLink` 方法时知道如何从应用程序的数据库中检索用户记录。Laravel 密码代理利用你的认证系统的「用户提供者」来检索数据库记录。密码代理使用的用户提供者在 `config/auth.php` 配置文件的 `passwords` 配置数组中配置。要了解有关编写自定义用户提供者的更多信息，请查阅[认证文档](/docs/{{version}}/authentication#adding-custom-user-providers)。

> [!NOTE]
> 当手动实现密码重置时，你需要自己定义视图和路由的内容。如果你想要包含所有必要的认证和验证逻辑的脚手架，请查看 [Laravel 应用程序启动工具包](/docs/{{version}}/starter-kits)。

<a name="resetting-the-password"></a>
### 重置密码

<a name="the-password-reset-form"></a>
#### 密码重置表单

接下来，我们将定义在用户点击通过邮件发送给他们的密码重置链接并提供新密码后，实际重置密码所需的路由。首先，让我们定义显示重置密码表单的路由，该表单在用户点击重置密码链接时显示。此路由将接收一个 `token` 参数，我们稍后将使用它来验证密码重置请求：

```php
Route::get('/reset-password/{token}', function (string $token) {
    return view('auth.reset-password', ['token' => $token]);
})->middleware('guest')->name('password.reset');
```

此路由返回的视图应显示一个包含 `email` 字段、`password` 字段、`password_confirmation` 字段和一个隐藏的 `token` 字段的表单，其中应包含我们的路由接收到的秘密 `$token` 的值。

<a name="password-reset-handling-the-form-submission"></a>
#### 处理表单提交

当然，我们需要定义一条路由来实际处理密码重置表单的提交。此路由将负责验证传入的请求并更新数据库中的用户密码：

```php
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

Route::post('/reset-password', function (Request $request) {
    $request->validate([
        'token' => 'required',
        'email' => 'required|email',
        'password' => 'required|min:8|confirmed',
    ]);

    $status = Password::reset(
        $request->only('email', 'password', 'password_confirmation', 'token'),
        function (User $user, string $password) {
            $user->forceFill([
                'password' => Hash::make($password)
            ])->setRememberToken(Str::random(60));

            $user->save();

            event(new PasswordReset($user));
        }
    );

    return $status === Password::PasswordReset
        ? redirect()->route('login')->with('status', __($status))
        : back()->withErrors(['email' => [__($status)]]);
})->middleware('guest')->name('password.update');
```

在继续之前，让我们更详细地检查这条路由。首先，验证请求的 `token`、`email` 和 `password` 属性。接下来，我们将使用 Laravel 内置的「密码代理」（通过 `Password` 门面）来验证密码重置请求的凭证。

如果提供给密码代理的令牌、电子邮件地址和密码有效，则调用传递给 `reset` 方法的闭包。在此闭包中，它接收用户实例和提供给密码重置表单的纯文本密码，我们可以更新数据库中的用户密码。

`reset` 方法返回一个「状态」标识。可以使用 Laravel 的[本地化](/docs/{{version}}/localization)助手翻译此状态，以便向用户显示关于其请求状态的用户友好消息。密码重置状态的翻译由你的应用程序的 `lang/{lang}/passwords.php` 语言文件确定。状态标识的每个可能值的条目都位于 `passwords` 语言文件中。如果你的应用程序不包含 `lang` 目录，你可以使用 `lang:publish` Artisan 命令创建它。

在继续之前，你可能想知道 Laravel 如何在调用 `Password` 门面的 `reset` 方法时知道如何从应用程序的数据库中检索用户记录。Laravel 密码代理利用你的认证系统的「用户提供者」来检索数据库记录。密码代理使用的用户提供者在 `config/auth.php` 配置文件的 `passwords` 配置数组中配置。要了解有关编写自定义用户提供者的更多信息，请查阅[认证文档](/docs/{{version}}/authentication#adding-custom-user-providers)。

<a name="deleting-expired-tokens"></a>
## 删除过期令牌

如果你正在使用 `database` 驱动，已过期的密码重置令牌仍将存在于你的数据库中。但是，你可以使用 `auth:clear-resets` Artisan 命令轻松删除这些记录：

```shell
php artisan auth:clear-resets
```

如果你想自动化此过程，请考虑将该命令添加到你的应用程序的[调度器](/docs/{{version}}/scheduling)中：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('auth:clear-resets')->everyFifteenMinutes();
```

<a name="password-customization"></a>
## 自定义

<a name="reset-link-customization"></a>
#### 重置链接自定义

你可以使用 `ResetPassword` 通知类提供的 `createUrlUsing` 方法自定义密码重置链接 URL。此方法接受一个闭包，该闭包接收正在接收通知的用户实例以及密码重置链接令牌。通常，你应该在应用程序的 `AppServiceProvider` 的 `boot` 方法中调用此方法：

```php
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    ResetPassword::createUrlUsing(function (User $user, string $token) {
        return 'https://example.com/reset-password?token='.$token;
    });
}
```

<a name="reset-email-customization"></a>
#### 重置邮件自定义

你可以轻松修改用于向用户发送密码重置链接的通知类。首先，在你的 `App\Models\User` 模型上覆盖 `sendPasswordResetNotification` 方法。在此方法中，你可以使用你自己创建的任何[通知类](/docs/{{version}}/notifications)来发送通知。密码重置 `$token` 是该方法接收的第一个参数。你可以使用此 `$token` 构建你选择的密码重置 URL，并将你的通知发送给用户：

```php
use App\Notifications\ResetPasswordNotification;

/**
 * Send a password reset notification to the user.
 *
 * @param  string  $token
 */
public function sendPasswordResetNotification($token): void
{
    $url = 'https://example.com/reset-password?token='.$token;

    $this->notify(new ResetPasswordNotification($url));
}
```

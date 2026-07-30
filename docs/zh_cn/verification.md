# 电子邮件验证

- [简介](#introduction)
    - [模型准备](#model-preparation)
    - [数据库准备](#database-preparation)
- [路由](#verification-routing)
    - [电子邮件验证通知](#the-email-verification-notice)
    - [电子邮件验证处理器](#the-email-verification-handler)
    - [重新发送验证邮件](#resending-the-verification-email)
    - [保护路由](#protecting-routes)
- [自定义](#customization)
- [事件](#events)

<a name="introduction"></a>
## 简介

许多 Web 应用程序要求用户在使用应用程序之前验证其电子邮件地址。Laravel 不要求你为你创建的每个应用程序手动重新实现此功能，而是提供了方便的内置服务，用于发送和验证电子邮件验证请求。

> [!NOTE]
> 想快速开始？在一个全新的 Laravel 应用程序中安装一个 [Laravel 应用程序启动工具包](/docs/{{version}}/starter-kits)。启动工具包将为你搭建整个身份认证系统，包括电子邮件验证支持。

<a name="model-preparation"></a>
### 模型准备

在开始之前，请验证你的 `App\Models\User` 模型实现了 `Illuminate\Contracts\Auth\MustVerifyEmail` 契约：

```php
<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
{
    use Notifiable;

    // ...
}
```

一旦此接口被添加到你的模型中，新注册的用户将自动收到一封包含电子邮件验证链接的邮件。这无缝地发生，因为 Laravel 自动为 `Illuminate\Auth\Events\Registered` 事件注册了 `Illuminate\Auth\Listeners\SendEmailVerificationNotification`[监听器](/docs/{{version}}/events)。

如果你在应用程序中手动实现注册，而不是使用[启动工具包](/docs/{{version}}/starter-kits)，则应确保在用户注册成功后分发 `Illuminate\Auth\Events\Registered` 事件：

```php
use Illuminate\Auth\Events\Registered;

event(new Registered($user));
```

<a name="database-preparation"></a>
### 数据库准备

接下来，你的 `users` 表必须包含一个 `email_verified_at` 列，用于存储用户电子邮件地址被验证的日期和时间。通常，这包含在 Laravel 默认的 `0001_01_01_000000_create_users_table.php` 数据库迁移中。

<a name="verification-routing"></a>
## 路由

为了正确实现电子邮件验证，需要定义三条路由。首先，需要一条路由来向用户显示通知，告知他们应点击 Laravel 在注册后发送的验证邮件中的电子邮件验证链接。

其次，需要一条路由来处理用户点击邮件中的电子邮件验证链接时生成的请求。

第三，需要一条路由来重新发送验证链接，以防用户意外丢失了第一次的验证链接。

<a name="the-email-verification-notice"></a>
### 电子邮件验证通知

如前所述，应定义一条路由，返回一个视图，指示用户点击 Laravel 在注册后通过邮件发送给他们的电子邮件验证链接。当用户在未验证电子邮件地址的情况下试图访问应用程序的其他部分时，将向用户显示此视图。请记住，只要你的 `App\Models\User` 模型实现了 `MustVerifyEmail` 接口，系统就会自动通过邮件将链接发送给用户：

```php
Route::get('/email/verify', function () {
    return view('auth.verify-email');
})->middleware('auth')->name('verification.notice');
```

返回电子邮件验证通知的路由应命名为 `verification.notice`。将此路由分配为这个确切的名称很重要，因为[随 Laravel 提供的](#protecting-routes) `verified` 中间件会在用户尚未验证其电子邮件地址时自动重定向到此路由名称。

> [!NOTE]
> 当手动实现电子邮件验证时，你需要自己定义验证通知视图的内容。如果你想要包含所有必要的认证和验证视图的脚手架，请查看 [Laravel 应用程序启动工具包](/docs/{{version}}/starter-kits)。

<a name="the-email-verification-handler"></a>
### 电子邮件验证处理器

接下来，我们需要定义一条路由来处理用户点击通过邮件发送给他们的电子邮件验证链接时生成的请求。此路由应命名为 `verification.verify`，并分配 `auth` 和 `signed` 中间件：

```php
use Illuminate\Foundation\Auth\EmailVerificationRequest;

Route::get('/email/verify/{id}/{hash}', function (EmailVerificationRequest $request) {
    $request->fulfill();

    return redirect('/home');
})->middleware(['auth', 'signed'])->name('verification.verify');
```

在继续之前，让我们更仔细地看看这条路由。首先，你会注意到我们使用的是 `EmailVerificationRequest` 请求类型，而不是通常的 `Illuminate\Http\Request` 实例。`EmailVerificationRequest` 是 Laravel 附带的一个[表单请求](/docs/{{version}}/validation#form-request-validation)。该请求将自动负责验证请求的 `id` 和 `hash` 参数。

接下来，我们可以直接调用请求上的 `fulfill` 方法。此方法将在已认证用户上调用 `markEmailAsVerified` 方法，并分发 `Illuminate\Auth\Events\Verified` 事件。`markEmailAsVerified` 方法可通过 `Illuminate\Foundation\Auth\User` 基类用于默认的 `App\Models\User` 模型。一旦用户的电子邮件地址被验证，你可以将他们重定向到任何你想要的地方。

<a name="resending-the-verification-email"></a>
### 重新发送验证邮件

有时用户可能会丢失或意外删除电子邮件地址验证邮件。为适应这种情况，你可能希望定义一条路由允许用户请求重新发送验证邮件。然后，你可以通过在[验证通知视图](#the-email-verification-notice)中放置一个简单的表单提交按钮来向此路由发出请求：

```php
use Illuminate\Http\Request;

Route::post('/email/verification-notification', function (Request $request) {
    $request->user()->sendEmailVerificationNotification();

    return back()->with('message', 'Verification link sent!');
})->middleware(['auth', 'throttle:6,1'])->name('verification.send');
```

<a name="protecting-routes"></a>
### 保护路由

[路由中间件](/docs/{{version}}/middleware)可用于仅允许已验证用户访问给定路由。Laravel 包含一个 `verified`[中间件别名](/docs/{{version}}/middleware#middleware-aliases)，它是 `Illuminate\Auth\Middleware\EnsureEmailIsVerified` 中间件类的别名。由于此别名已由 Laravel 自动注册，你只需将 `verified` 中间件附加到路由定义即可。通常，此中间件与 `auth` 中间件配对使用：

```php
Route::get('/profile', function () {
    // Only verified users may access this route...
})->middleware(['auth', 'verified']);
```

如果未验证用户尝试访问已分配此中间件的路由，他们将被自动重定向到 `verification.notice`[命名路由](/docs/{{version}}/routing#named-routes)。

<a name="customization"></a>
## 自定义

<a name="verification-email-customization"></a>
#### 验证邮件自定义

虽然默认的电子邮件验证通知应满足大多数应用程序的要求，但 Laravel 允许你自定义电子邮件验证邮件的构建方式。

首先，将闭包传递给 `Illuminate\Auth\Notifications\VerifyEmail` 通知提供的 `toMailUsing` 方法。该闭包将接收正在接收通知的通知模型实例，以及用户必须访问以验证其电子邮件地址的签名电子邮件验证 URL。该闭包应返回一个 `Illuminate\Notifications\Messages\MailMessage` 实例。通常，你应该在应用程序的 `AppServiceProvider` 类的 `boot` 方法中调用 `toMailUsing` 方法：

```php
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    // ...

    VerifyEmail::toMailUsing(function (object $notifiable, string $url) {
        return (new MailMessage)
            ->subject('Verify Email Address')
            ->line('Click the button below to verify your email address.')
            ->action('Verify Email Address', $url);
    });
}
```

> [!NOTE]
> 要了解有关邮件通知的更多信息，请查阅[邮件通知文档](/docs/{{version}}/notifications#mail-notifications)。

<a name="events"></a>
## 事件

当使用 [Laravel 应用程序启动工具包](/docs/{{version}}/starter-kits)时，Laravel 在电子邮件验证过程中会分发一个 `Illuminate\Auth\Events\Verified`[事件](/docs/{{version}}/events)。如果你正在为应用程序手动处理电子邮件验证，你可能希望在验证完成后手动分发这些事件。

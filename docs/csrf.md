# CSRF 保护

- [简介](#csrf-introduction)
- [预防 CSRF 请求](#preventing-csrf-requests)
    - [来源验证](#origin-verification)
    - [排除 URI](#csrf-excluding-uris)
- [X-CSRF-Token](#csrf-x-csrf-token)
- [X-XSRF-Token](#csrf-x-xsrf-token)

<a name="csrf-introduction"></a>
## 简介

跨站请求伪造是一种恶意利用方式，未经授权的命令以认证用户的名义执行。值得庆幸的是，Laravel 使保护你的应用程序免受[跨站请求伪造](https://en.wikipedia.org/wiki/Cross-site_request_forgery)（CSRF）攻击变得容易。

<a name="csrf-explanation"></a>
#### 漏洞说明

如果你不熟悉跨站请求伪造，让我们讨论一个如何利用此漏洞的示例。假设你的应用程序有一个 `/user/email` 路由，它接受 `POST` 请求来更改已认证用户的电子邮件地址。很可能，此路由期望 `email` 输入字段包含用户想要开始使用的电子邮件地址。

如果没有 CSRF 保护，恶意网站可以创建一个指向你的应用程序的 `/user/email` 路由的 HTML 表单，并提交恶意用户自己的电子邮件地址：

```blade
<form action="https://your-application.com/user/email" method="POST">
    <input type="email" value="malicious-email@example.com">
</form>

<script>
    document.forms[0].submit();
</script>
```

如果恶意网站在页面加载时自动提交表单，恶意用户只需诱骗你的应用程序的不知情用户访问他们的网站，他们的电子邮件地址就会在你的应用程序中被更改。

为了防止此漏洞，我们需要检查每个传入的 `POST`、`PUT`、`PATCH` 或 `DELETE` 请求中的秘密会话值，恶意应用程序无法访问该值。

<a name="preventing-csrf-requests"></a>
## 预防 CSRF 请求

默认包含在 `web` 中间件组中的 `Illuminate\Foundation\Http\Middleware\PreventRequestForgery` [中间件](/docs/{{version}}/middleware)使用两层方法保护你的应用程序免受跨站请求伪造攻击。

首先，中间件检查浏览器的 `Sec-Fetch-Site` 标头。现代浏览器自动在每个请求上设置此标头，指示它是否来自同一来源、同一站点或跨站点源。如果标头指示请求来自同一来源，则立即允许该请求，无需任何令牌验证。

如果来源验证未通过——例如，因为请求来自不发送 `Sec-Fetch-Site` 标头的旧浏览器，或者因为连接不安全——中间件将回退到传统的 CSRF 令牌验证。

Laravel 会自动为应用程序管理的每个活动[用户会话](/docs/{{version}}/session)生成一个 CSRF"令牌"。此令牌用于验证已认证用户是否确实是向应用程序发出请求的人。由于此令牌存储在用户的会话中，并在每次会话重新生成时更改，恶意应用程序无法访问它。

当前会话的 CSRF 令牌可以通过请求的会话或 `csrf_token` 辅助函数访问：

```php
use Illuminate\Http\Request;

Route::get('/token', function (Request $request) {
    $token = $request->session()->token();

    $token = csrf_token();

    // ...
});
```

任何时候在应用程序中定义"POST"、"PUT"、"PATCH"或"DELETE" HTML 表单时，你都应在表单中包含一个隐藏的 CSRF `_token` 字段，以便 CSRF 保护中间件可以验证请求。为方便起见，你可以使用 `@csrf` Blade 指令来生成隐藏的令牌输入字段：

```blade
<form method="POST" action="/profile">
    @csrf

    <!-- 等同于... -->
    <input type="hidden" name="_token" value="{{ csrf_token() }}" />
</form>
```

<a name="csrf-tokens-and-spas"></a>
#### CSRF 令牌和 SPA

如果你正在构建一个使用 Laravel 作为 API 后端的 SPA，应查阅 [Laravel Sanctum 文档](/docs/{{version}}/sanctum)了解有关使用 API 进行认证和防范 CSRF 漏洞的信息。

<a name="origin-verification"></a>
### 来源验证

如上所述，Laravel 的请求伪造中间件首先检查 `Sec-Fetch-Site` 标头以确定请求是否来自同一来源。默认情况下，如果此检查未通过，中间件将回退到 CSRF 令牌验证。

但是，如果你希望仅依赖来源验证并完全禁用 CSRF 令牌回退，你可以在应用程序的 `bootstrap/app.php` 文件中使用 `preventRequestForgery` 方法来实现：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->preventRequestForgery(originOnly: true);
})
```

使用仅来源模式时，来源验证失败的请求将收到 `403` HTTP 响应，而不是通常与 CSRF 令牌不匹配相关的 `419` 响应。

> [!WARNING]
> `Sec-Fetch-Site` 标头仅由浏览器通过安全（HTTPS）连接发送。如果你的应用程序不是通过 HTTPS 提供的，来源验证将不可用，中间件将回退到 CSRF 令牌验证。

如果你的应用程序需要接受来自子域的请求（例如，`dashboard.example.com` 接受来自 `example.com` 的请求），你可以允许同站点请求以及同源请求：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->preventRequestForgery(allowSameSite: true);
})
```

<a name="csrf-excluding-uris"></a>
### 排除 URI 免受 CSRF 保护

有时你可能希望排除一组 URI 免受 CSRF 保护。例如，如果你使用 [Stripe](https://stripe.com) 处理付款并使用他们的 Webhook 系统，你需要将 Stripe Webhook 处理程序路由排除在 CSRF 保护之外，因为 Stripe 不知道要向你的路由发送什么 CSRF 令牌。

通常，你应将此类路由放置在 Laravel 应用于 `routes/web.php` 文件中所有路由的 `web` 中间件组之外。但是，你也可以通过在应用程序的 `bootstrap/app.php` 文件中向 `preventRequestForgery` 方法提供其 URI 来排除特定路由：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->preventRequestForgery(except: [
        'stripe/*',
        'http://example.com/foo/bar',
        'http://example.com/foo/*',
    ]);
})
```

> [!NOTE]
> 为方便起见，在[运行测试](/docs/{{version}}/testing)时，CSRF 中间件会自动为所有路由禁用。

<a name="csrf-x-csrf-token"></a>
## X-CSRF-TOKEN

除了检查作为 POST 参数的 CSRF 令牌外，`PreventRequestForgery` 中间件还会检查 `X-CSRF-TOKEN` 请求标头。例如，你可以将令牌存储在 HTML `meta` 标签中：

```blade
<meta name="csrf-token" content="{{ csrf_token() }}">
```

然后，你可以指示像 jQuery 这样的库自动将令牌添加到所有请求标头。这为使用传统 JavaScript 技术的基于 AJAX 的应用程序提供了简单、方便的 CSRF 保护：

```js
$.ajaxSetup({
    headers: {
        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
    }
});
```

<a name="csrf-x-xsrf-token"></a>
## X-XSRF-TOKEN

Laravel 将当前 CSRF 令牌存储在一个加密的 `XSRF-TOKEN` cookie 中，该 cookie 包含在框架生成的每个响应中。你可以使用 cookie 值设置 `X-XSRF-TOKEN` 请求标头。

此 cookie 主要作为开发便利发送，因为某些 JavaScript 框架和库（如 Angular 和 Axios）会自动将其值放在同源请求的 `X-XSRF-TOKEN` 标头中。

# URL 生成

- [简介](#introduction)
- [基础](#the-basics)
    - [生成 URL](#generating-urls)
    - [访问当前 URL](#accessing-the-current-url)
- [命名路由的 URL](#urls-for-named-routes)
    - [签名 URL](#signed-urls)
- [控制器操作的 URL](#urls-for-controller-actions)
- [流畅的 URI 对象](#fluent-uri-objects)
- [默认值](#default-values)

<a name="introduction"></a>
## 简介

Laravel 提供了几个辅助函数来帮助你为应用程序生成 URL。这些辅助函数主要用于在模板和 API 响应中构建链接，或生成重定向到应用程序其他部分的响应。

<a name="the-basics"></a>
## 基础

<a name="generating-urls"></a>
### 生成 URL

`url` 辅助函数可用于为你的应用程序生成任意 URL。生成的 URL 将自动使用当前请求的方案（HTTP 或 HTTPS）和主机：

```php
$post = App\Models\Post::find(1);

echo url("/posts/{$post->id}");

// http://example.com/posts/1
```

要生成带有查询字符串参数的 URL，你可以使用 `query` 方法：

```php
echo url()->query('/posts', ['search' => 'Laravel']);

// https://example.com/posts?search=Laravel

echo url()->query('/posts?sort=latest', ['search' => 'Laravel']);

// http://example.com/posts?sort=latest&search=Laravel
```

提供路径中已存在的查询字符串参数将覆盖其现有值：

```php
echo url()->query('/posts?sort=latest', ['sort' => 'oldest']);

// http://example.com/posts?sort=oldest
```

值数组也可以作为查询参数传递。这些值将在生成的 URL 中被正确键化和编码：

```php
echo $url = url()->query('/posts', ['columns' => ['title', 'body']]);

// http://example.com/posts?columns%5B0%5D=title&columns%5B1%5D=body

echo urldecode($url);

// http://example.com/posts?columns[0]=title&columns[1]=body
```

<a name="accessing-the-current-url"></a>
### 访问当前 URL

如果没有向 `url` 辅助函数提供路径，则返回一个 `Illuminate\Routing\UrlGenerator` 实例，允许你访问有关当前 URL 的信息：

```php
// 获取不带查询字符串的当前 URL...
echo url()->current();

// 获取包含查询字符串的当前 URL...
echo url()->full();
```

这些方法也可以通过 `URL` [门面](/docs/{{version}}/facades)访问：

```php
use Illuminate\Support\Facades\URL;

echo URL::current();
```

<a name="accessing-the-previous-url"></a>
#### 访问之前的 URL

有时了解用户来自的先前 URL 会很有帮助。你可以通过 `url` 辅助函数的 `previous` 和 `previousPath` 方法访问先前的 URL：

```php
// 获取先前请求的完整 URL...
echo url()->previous();

// 获取先前请求的路径...
echo url()->previousPath();
```

或者，通过[会话](/docs/{{version}}/session)，你可以将先前的 URL 作为[流畅的 URI](#fluent-uri-objects) 实例访问：

```php
use Illuminate\Http\Request;

Route::post('/users', function (Request $request) {
    $previousUri = $request->session()->previousUri();

    // ...
});
```

也可以通过会话检索先前访问过的 URL 的路由名称：

```php
$previousRoute = $request->session()->previousRoute();
```

<a name="urls-for-named-routes"></a>
## 命名路由的 URL

`route` 辅助函数可用于生成到[命名路由](/docs/{{version}}/routing#named-routes)的 URL。命名路由允许你生成 URL，而无需与实际定义在路由上的 URL 耦合。因此，如果路由的 URL 发生更改，则无需修改对 `route` 函数的调用。例如，假设你的应用程序包含一个如下定义的路由：

```php
Route::get('/post/{post}', function (Post $post) {
    // ...
})->name('post.show');
```

要生成到此路由的 URL，你可以像这样使用 `route` 辅助函数：

```php
echo route('post.show', ['post' => 1]);

// http://example.com/post/1
```

当然，`route` 辅助函数也可用于生成具有多个参数的路由的 URL：

```php
Route::get('/post/{post}/comment/{comment}', function (Post $post, Comment $comment) {
    // ...
})->name('comment.show');

echo route('comment.show', ['post' => 1, 'comment' => 3]);

// http://example.com/post/1/comment/3
```

任何与路由定义参数不对应的额外数组元素将被添加到 URL 的查询字符串中：

```php
echo route('post.show', ['post' => 1, 'search' => 'rocket']);

// http://example.com/post/1?search=rocket
```

<a name="eloquent-models"></a>
#### Eloquent 模型

你通常会使用 [Eloquent 模型](/docs/{{version}}/eloquent)的路由键（通常是主键）来生成 URL。因此，你可以将 Eloquent 模型作为参数值传递。`route` 辅助函数将自动提取模型的路由键：

```php
echo route('post.show', ['post' => $post]);
```

<a name="signed-urls"></a>
### 签名 URL

Laravel 允许你轻松创建命名路由的"签名"URL。这些 URL 在查询字符串后追加了一个"签名"哈希，允许 Laravel 验证自创建以来 URL 是否未被修改。签名 URL 对于公开可访问但需要防止 URL 操纵的路由特别有用。

例如，你可能使用签名 URL 来实现通过电子邮件发送给客户的公开"取消订阅"链接。要创建命名路由的签名 URL，请使用 `URL` 门面的 `signedRoute` 方法：

```php
use Illuminate\Support\Facades\URL;

return URL::signedRoute('unsubscribe', ['user' => 1]);
```

你可以通过向 `signedRoute` 方法提供 `absolute` 参数，从签名 URL 哈希中排除域名：

```php
return URL::signedRoute('unsubscribe', ['user' => 1], absolute: false);
```

如果你想生成在指定时间后过期的临时签名路由 URL，可以使用 `temporarySignedRoute` 方法。当 Laravel 验证临时签名路由 URL 时，它将确保编码到签名 URL 中的过期时间戳尚未过去：

```php
use Illuminate\Support\Facades\URL;

return URL::temporarySignedRoute(
    'unsubscribe', now()->plus(minutes: 30), ['user' => 1]
);
```

<a name="validating-signed-route-requests"></a>
#### 验证签名路由请求

要验证传入请求是否具有有效签名，你应在传入的 `Illuminate\Http\Request` 实例上调用 `hasValidSignature` 方法：

```php
use Illuminate\Http\Request;

Route::get('/unsubscribe/{user}', function (Request $request) {
    if (! $request->hasValidSignature()) {
        abort(401);
    }

    // ...
})->name('unsubscribe');
```

有时，你可能需要允许应用程序的前端向签名 URL 追加数据，例如在执行客户端分页时。因此，你可以使用 `hasValidSignatureWhileIgnoring` 方法指定在验证签名 URL 时应忽略的请求查询参数。请记住，忽略参数允许任何人修改请求上的这些参数：

```php
if (! $request->hasValidSignatureWhileIgnoring(['page', 'order'])) {
    abort(401);
}
```

你可以将 `signed`（`Illuminate\Routing\Middleware\ValidateSignature`）[中间件](/docs/{{version}}/middleware)分配给路由，而不是使用传入请求实例来验证签名 URL。如果传入请求没有有效签名，中间件将自动返回 `403` HTTP 响应：

```php
Route::post('/unsubscribe/{user}', function (Request $request) {
    // ...
})->name('unsubscribe')->middleware('signed');
```

如果你的签名 URL 在 URL 哈希中不包含域名，你应向中间件提供 `relative` 参数：

```php
Route::post('/unsubscribe/{user}', function (Request $request) {
    // ...
})->name('unsubscribe')->middleware('signed:relative');
```

<a name="responding-to-invalid-signed-routes"></a>
#### 响应无效签名路由

当有人访问已过期的签名 URL 时，他们将收到一个 `403` HTTP 状态码的通用错误页面。但是，你可以通过在应用程序的 `bootstrap/app.php` 文件中为 `InvalidSignatureException` 异常定义一个自定义"render"闭包来自定义此行为：

```php
use Illuminate\Routing\Exceptions\InvalidSignatureException;

->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->render(function (InvalidSignatureException $e) {
        return response()->view('errors.link-expired', status: 403);
    });
})
```

<a name="urls-for-controller-actions"></a>
## 控制器操作的 URL

`action` 函数为给定的控制器操作生成 URL：

```php
use App\Http\Controllers\HomeController;

$url = action([HomeController::class, 'index']);
```

如果控制器方法接受路由参数，你可以将路由参数的关联数组作为第二个参数传递给该函数：

```php
$url = action([UserController::class, 'profile'], ['id' => 1]);
```

<a name="fluent-uri-objects"></a>
## 流畅的 URI 对象

Laravel 的 `Uri` 类提供了一种通过对象创建和操作 URI 的便捷流畅的接口。该类包装了底层 League URI 包提供的功能，并与 Laravel 的路由系统无缝集成。

你可以使用静态方法轻松创建 `Uri` 实例：

```php
use App\Http\Controllers\UserController;
use App\Http\Controllers\InvokableController;
use Illuminate\Support\Uri;

// 从给定字符串生成 URI 实例...
$uri = Uri::of('https://example.com/path');

// 生成指向路径、命名路由或控制器操作的 URI 实例...
$uri = Uri::to('/dashboard');
$uri = Uri::route('users.show', ['user' => 1]);
$uri = Uri::signedRoute('users.show', ['user' => 1]);
$uri = Uri::temporarySignedRoute('user.index', now()->plus(minutes: 5));
$uri = Uri::action([UserController::class, 'index']);
$uri = Uri::action(InvokableController::class);

// 从当前请求 URL 生成 URI 实例...
$uri = $request->uri();

// 从上一个请求 URL 生成 URI 实例...
$uri = $request->session()->previousUri();
```

一旦你有了 URI 实例，你可以流畅地修改它：

```php
$uri = Uri::of('https://example.com')
    ->withScheme('http')
    ->withHost('test.com')
    ->withPort(8000)
    ->withPath('/users')
    ->withQuery(['page' => 2])
    ->withFragment('section-1');
```

有关使用流畅 URI 对象的更多信息，请查阅 [URI 文档](/docs/{{version}}/helpers#uri)。

<a name="default-values"></a>
## 默认值

对于某些应用程序，你可能希望为某些 URL 参数指定请求范围的默认值。例如，假设你的许多路由定义了一个 `{locale}` 参数：

```php
Route::get('/{locale}/posts', function () {
    // ...
})->name('post.index');
```

每次调用 `route` 辅助函数时都传递 `locale` 是很繁琐的。因此，你可以使用 `URL::defaults` 方法为此参数定义一个默认值，该值将在当前请求期间始终应用。你可能希望从[路由中间件](/docs/{{version}}/middleware#assigning-middleware-to-routes)中调用此方法，以便你可以访问当前请求：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\Response;

class SetDefaultLocaleForUrls
{
    /**
     * 处理传入请求。
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        URL::defaults(['locale' => $request->user()->locale]);

        return $next($request);
    }
}
```

一旦为 `locale` 参数设置了默认值，你在通过 `route` 辅助函数生成 URL 时就不再需要传递其值。

<a name="url-defaults-middleware-priority"></a>
#### URL 默认值和中间件优先级

设置 URL 默认值可能会干扰 Laravel 对隐式模型绑定的处理。因此，你应该[优先设置 URL 默认值的中间件](/docs/{{version}}/middleware#sorting-middleware)，使其在 Laravel 自己的 `SubstituteBindings` 中间件之前执行。你可以通过在应用程序的 `bootstrap/app.php` 文件中使用 `priority` 中间件方法来实现：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->prependToPriorityList(
        before: \Illuminate\Routing\Middleware\SubstituteBindings::class,
        prepend: \App\Http\Middleware\SetDefaultLocaleForUrls::class,
    );
})
```

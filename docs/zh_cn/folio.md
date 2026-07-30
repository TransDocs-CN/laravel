# Laravel Folio

- [简介](#introduction)
- [安装](#installation)
    - [页面路径 / URI](#page-paths-uris)
    - [子域名路由](#subdomain-routing)
- [创建路由](#creating-routes)
    - [嵌套路由](#nested-routes)
    - [索引路由](#index-routes)
- [路由参数](#route-parameters)
- [路由模型绑定](#route-model-binding)
    - [软删除模型](#soft-deleted-models)
- [渲染钩子](#render-hooks)
- [命名路由](#named-routes)
- [中间件](#middleware)
- [路由缓存](#route-caching)

<a name="introduction"></a>
## 简介

[Laravel Folio](https://github.com/laravel/folio) 是一个强大的基于页面的路由器，旨在简化 Laravel 应用程序中的路由。使用 Laravel Folio，生成路由就像在应用程序的 `resources/views/pages` 目录中创建 Blade 模板一样简单。

例如，要创建一个可通过 `/greeting` URL 访问的页面，只需在应用程序的 `resources/views/pages` 目录中创建一个 `greeting.blade.php` 文件：

```php
<div>
    Hello World
</div>
```

<a name="installation"></a>
## 安装

首先，使用 Composer 包管理器将 Folio 安装到你的项目中：

```shell
composer require laravel/folio
```

安装 Folio 后，你可以执行 `folio:install` Artisan 命令，该命令会将 Folio 的服务提供者安装到你的应用程序中。此服务提供者注册了 Folio 将搜索路由/页面的目录：

```shell
php artisan folio:install
```

<a name="page-paths-uris"></a>
### 页面路径 / URI

默认情况下，Folio 从应用程序的 `resources/views/pages` 目录中提供页面，但你可以在 Folio 服务提供者的 `boot` 方法中自定义这些目录。

例如，有时在同一个 Laravel 应用程序中指定多个 Folio 路径可能很方便。你可能希望为应用程序的"admin"区域设置一个单独的 Folio 页面目录，同时为其余应用程序页面使用另一个目录。

你可以使用 `Folio::path` 和 `Folio::uri` 方法来实现这一点。`path` 方法注册 Folio 在对传入 HTTP 请求进行路由时将扫描页面的目录，而 `uri` 方法为该目录的页面指定"基础 URI"：

```php
use Laravel\Folio\Folio;

Folio::path(resource_path('views/pages/guest'))->uri('/');

Folio::path(resource_path('views/pages/admin'))
    ->uri('/admin')
    ->middleware([
        '*' => [
            'auth',
            'verified',

            // ...
        ],
    ]);
```

<a name="subdomain-routing"></a>
### 子域名路由

你也可以根据传入请求的子域名来路由到页面。例如，你可能希望将来自 `admin.example.com` 的请求路由到与其余 Folio 页面不同的页面目录。你可以通过在调用 `Folio::path` 方法后调用 `domain` 方法来实现这一点：

```php
use Laravel\Folio\Folio;

Folio::domain('admin.example.com')
    ->path(resource_path('views/pages/admin'));
```

`domain` 方法还允许你捕获域名或子域名的部分作为参数。这些参数将被注入到你的页面模板中：

```php
use Laravel\Folio\Folio;

Folio::domain('{account}.example.com')
    ->path(resource_path('views/pages/admin'));
```

<a name="creating-routes"></a>
## 创建路由

你可以通过在任何 Folio 挂载的目录中放置一个 Blade 模板来创建 Folio 路由。默认情况下，Folio 挂载 `resources/views/pages` 目录，但你可以在 Folio 服务提供者的 `boot` 方法中自定义这些目录。

一旦 Blade 模板被放置在 Folio 挂载的目录中，你就可以立即通过浏览器访问它。例如，放置在 `pages/schedule.blade.php` 的页面可以在浏览器中通过 `http://example.com/schedule` 访问。

要快速查看所有 Folio 页面/路由的列表，你可以调用 `folio:list` Artisan 命令：

```shell
php artisan folio:list
```

<a name="nested-routes"></a>
### 嵌套路由

你可以通过在 Folio 的某个目录中创建一个或多个子目录来创建嵌套路由。例如，要创建一个可通过 `/user/profile` 访问的页面，请在 `pages/user` 目录中创建一个 `profile.blade.php` 模板：

```shell
php artisan folio:page user/profile

# pages/user/profile.blade.php → /user/profile
```

<a name="index-routes"></a>
### 索引路由

有时，你可能希望将某个页面作为目录的"索引"。通过在 Folio 目录中放置一个 `index.blade.php` 模板，对该目录根路径的任何请求都将路由到该页面：

```shell
php artisan folio:page index
# pages/index.blade.php → /

php artisan folio:page users/index
# pages/users/index.blade.php → /users
```

<a name="route-parameters"></a>
## 路由参数

通常，你需要将传入请求 URL 的某些段注入到页面中，以便与之交互。例如，你可能需要访问正在显示其个人资料的用户的"ID"。为此，你可以将页面文件名中的一段用方括号括起来：

```shell
php artisan folio:page "users/[id]"

# pages/users/[id].blade.php → /users/1
```

捕获的段可以作为变量在 Blade 模板中访问：

```html
<div>
    User {{ $id }}
</div>
```

要捕获多个段，可以在方括号段前加上三个点 `...`：

```shell
php artisan folio:page "users/[...ids]"

# pages/users/[...ids].blade.php → /users/1/2/3
```

当捕获多个段时，捕获的段将作为数组注入到页面中：

```html
<ul>
    @foreach ($ids as $id)
        <li>User {{ $id }}</li>
    @endforeach
</ul>
```

<a name="route-model-binding"></a>
## 路由模型绑定

如果你的页面模板文件名的通配符段对应于应用程序的某个 Eloquent 模型，Folio 将自动利用 Laravel 的路由模型绑定功能，并尝试将解析的模型实例注入到你的页面中：

```shell
php artisan folio:page "users/[User]"

# pages/users/[User].blade.php → /users/1
```

捕获的模型可以作为变量在 Blade 模板中访问。模型变量名将转换为"驼峰式"：

```html
<div>
    User {{ $user->id }}
</div>
```

#### 自定义键

有时你可能希望使用 `id` 以外的列来解析绑定的 Eloquent 模型。为此，你可以在页面文件名中指定该列。例如，文件名为 `[Post:slug].blade.php` 的页面将尝试通过 `slug` 列而不是 `id` 列来解析绑定模型。

在 Windows 上，应使用 `-` 来分隔模型名称和键：`[Post-slug].blade.php`。

#### 模型位置

默认情况下，Folio 将在应用程序的 `app/Models` 目录中搜索你的模型。但是，如果需要，你可以在模板的文件名中指定完全限定的模型类名：

```shell
php artisan folio:page "users/[.App.Models.User]"

# pages/users/[.App.Models.User].blade.php → /users/1
```

<a name="soft-deleted-models"></a>
### 软删除模型

默认情况下，软删除的模型在解析隐式模型绑定时不会被检索。但是，如果你愿意，可以通过在页面模板中调用 `withTrashed` 函数来指示 Folio 检索软删除的模型：

```php
<?php

use function Laravel\Folio\{withTrashed};

withTrashed();

?>

<div>
    User {{ $user->id }}
</div>
```

<a name="render-hooks"></a>
## 渲染钩子

默认情况下，Folio 将页面 Blade 模板的内容作为对传入请求的响应返回。但是，你可以通过在页面模板中调用 `render` 函数来自定义响应。

`render` 函数接受一个闭包，该闭包将接收 Folio 正在渲染的 `View` 实例，允许你向视图添加其他数据或自定义整个响应。除了接收 `View` 实例外，任何其他路由参数或模型绑定也将提供给 `render` 闭包：

```php
<?php

use App\Models\Post;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

use function Laravel\Folio\render;

render(function (View $view, Post $post) {
    if (! Auth::user()->can('view', $post)) {
        return response('Unauthorized', 403);
    }

    return $view->with('photos', $post->author->photos);
}); ?>

<div>
    {{ $post->content }}
</div>

<div>
    This author has also taken {{ count($photos) }} photos.
</div>
```

<a name="named-routes"></a>
## 命名路由

你可以使用 `name` 函数为给定页面的路由指定名称：

```php
<?php

use function Laravel\Folio\name;

name('users.index');
```

就像 Laravel 的命名路由一样，你可以使用 `route` 函数为已分配名称的 Folio 页面生成 URL：

```php
<a href="{{ route('users.index') }}">
    All Users
</a>
```

如果页面有参数，你可以简单地将它们的值传递给 `route` 函数：

```php
route('users.show', ['user' => $user]);
```

<a name="middleware"></a>
## 中间件

你可以通过在页面模板中调用 `middleware` 函数来将中间件应用于特定页面：

```php
<?php

use function Laravel\Folio\{middleware};

middleware(['auth', 'verified']);

?>

<div>
    Dashboard
</div>
```

或者，要将中间件分配给一组页面，你可以在调用 `Folio::path` 方法后链式调用 `middleware` 方法。

要指定中间件应应用于哪些页面，中间件数组可以使用应应用到的页面的相应 URL 模式作为键。`*` 字符可用作通配符：

```php
use Laravel\Folio\Folio;

Folio::path(resource_path('views/pages'))->middleware([
    'admin/*' => [
        'auth',
        'verified',

        // ...
    ],
]);
```

你可以在中间件数组中包含闭包来定义内联的匿名中间件：

```php
use Closure;
use Illuminate\Http\Request;
use Laravel\Folio\Folio;

Folio::path(resource_path('views/pages'))->middleware([
    'admin/*' => [
        'auth',
        'verified',

        function (Request $request, Closure $next) {
            // ...

            return $next($request);
        },
    ],
]);
```

<a name="route-caching"></a>
## 路由缓存

使用 Folio 时，应始终利用 [Laravel 的路由缓存功能](/docs/{{version}}/routing#route-caching)。Folio 监听 `route:cache` Artisan 命令，以确保 Folio 页面定义和路由名称被正确缓存以获得最佳性能。

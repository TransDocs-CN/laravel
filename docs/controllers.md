# 控制器

- [简介](#introduction)
- [编写控制器](#writing-controllers)
    - [基本控制器](#basic-controllers)
    - [单操作控制器](#single-action-controllers)
- [控制器中间件](#controller-middleware)
    - [中间件属性](#middleware-attributes)
    - [授权属性](#authorization-attributes)
- [资源控制器](#resource-controllers)
    - [部分资源路由](#restful-partial-resource-routes)
    - [嵌套资源](#restful-nested-resources)
    - [命名资源路由](#restful-naming-resource-routes)
    - [命名资源路由参数](#restful-naming-resource-route-parameters)
    - [限定资源路由作用域](#restful-scoping-resource-routes)
    - [本地化资源 URI](#restful-localizing-resource-uris)
    - [补充资源控制器](#restful-supplementing-resource-controllers)
    - [单例资源控制器](#singleton-resource-controllers)
    - [中间件和资源控制器](#middleware-and-resource-controllers)
- [依赖注入和控制器](#dependency-injection-and-controllers)

<a name="introduction"></a>
## 简介

与其将所有请求处理逻辑定义为路由文件中的闭包，你可能希望使用"控制器"类来组织此行为。控制器可以将相关的请求处理逻辑分组到单个类中。例如，`UserController` 类可能处理与用户相关的所有传入请求，包括显示、创建、更新和删除用户。默认情况下，控制器存储在 `app/Http/Controllers` 目录中。

<a name="writing-controllers"></a>
## 编写控制器

<a name="basic-controllers"></a>
### 基本控制器

要快速生成新控制器，你可以运行 `make:controller` Artisan 命令。默认情况下，应用程序的所有控制器都存储在 `app/Http/Controllers` 目录中：

```shell
php artisan make:controller UserController
```

让我们看一个基本控制器的示例。控制器可以拥有任意数量的公共方法，这些方法将响应传入的 HTTP 请求：

```php
<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\View\View;

class UserController extends Controller
{
    /**
     * 显示给定用户的个人资料。
     */
    public function show(string $id): View
    {
        return view('user.profile', [
            'user' => User::findOrFail($id)
        ]);
    }
}
```

一旦你编写了控制器类和方法，你可以像这样定义指向控制器方法的路由：

```php
use App\Http\Controllers\UserController;

Route::get('/user/{id}', [UserController::class, 'show']);
```

当传入请求与指定的路由 URI 匹配时，将调用 `App\Http\Controllers\UserController` 类上的 `show` 方法，并且路由参数将传递给该方法。

> [!NOTE]
> 控制器**不要求**扩展基类。但是，有时扩展包含应在所有控制器之间共享的方法的基控制器类会很方便。

<a name="single-action-controllers"></a>
### 单操作控制器

如果控制器操作特别复杂，你可能会发现将整个控制器类专用于该单个操作很方便。为此，你可以在控制器中定义一个单一的 `__invoke` 方法：

```php
<?php

namespace App\Http\Controllers;

class ProvisionServer extends Controller
{
    /**
     * 配置一个新的 Web 服务器。
     */
    public function __invoke()
    {
        // ...
    }
}
```

为单操作控制器注册路由时，你不需要指定控制器方法。相反，你可以简单地将控制器的名称传递给路由器：

```php
use App\Http\Controllers\ProvisionServer;

Route::post('/server', ProvisionServer::class);
```

你可以使用 `make:controller` Artisan 命令的 `--invokable` 选项生成一个可调用的控制器：

```shell
php artisan make:controller ProvisionServer --invokable
```

> [!NOTE]
> 控制器模板可以使用[模板发布](/docs/{{version}}/artisan#stub-customization)进行自定义。

<a name="controller-middleware"></a>
## 控制器中间件

[中间件](/docs/{{version}}/middleware)可以在路由文件中分配给控制器的路由：

```php
Route::get('/profile', [UserController::class, 'show'])->middleware('auth');
```

或者，你可能会发现在控制器类中指定中间件很方便。为此，你的控制器应实现 `HasMiddleware` 接口，该接口规定控制器应具有静态的 `middleware` 方法。从此方法中，你可以返回应应用于控制器操作的中间件数组：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class UserController implements HasMiddleware
{
    /**
     * 获取应分配给控制器的中间件。
     */
    public static function middleware(): array
    {
        return [
            'auth',
            new Middleware('log', only: ['index']),
            new Middleware('subscribed', except: ['store']),
        ];
    }

    // ...
}
```

你也可以将控制器中间件定义为闭包，这提供了一种无需编写整个中间件类即可定义内联中间件的便捷方式：

```php
use Closure;
use Illuminate\Http\Request;

/**
 * 获取应分配给控制器的中间件。
 */
public static function middleware(): array
{
    return [
        function (Request $request, Closure $next) {
            return $next($request);
        },
    ];
}
```

<a name="middleware-attributes"></a>
### 中间件属性

你也可以使用 PHP 属性将中间件分配给控制器：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Routing\Attributes\Controllers\Middleware;

#[Middleware('auth')]
#[Middleware('log', only: ['index'])]
#[Middleware('subscribed', except: ['store'])]
class UserController
{
    // ...
}
```

你也可以将中间件属性放在单个控制器方法上。分配给方法的中间件将与在类级别分配的中间件合并：

```php
<?php

namespace App\Http\Controllers;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Routing\Attributes\Controllers\Middleware;

#[Middleware('auth')]
class UserController
{
    #[Middleware('log')]
    #[Middleware('subscribed')]
    public function index()
    {
        // ...
    }

    #[Middleware(static function (Request $request, Closure $next) {
        // ...

        return $next($request);
    })]
    public function store()
    {
        // ...
    }
}
```

要从控制器或单个控制器方法中排除中间件，请使用 `WithoutMiddleware` 属性。你可以使用 `only` 和 `except` 参数将类级别的属性限制为特定的控制器方法：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Middleware\EnsureTokenIsValid;
use Illuminate\Routing\Attributes\Controllers\WithoutMiddleware;

#[WithoutMiddleware('subscribed', except: ['index'])]
class UserController
{
    #[WithoutMiddleware(EnsureTokenIsValid::class)]
    public function index()
    {
        // ...
    }

    public function show()
    {
        // ...
    }
}
```

类级别的 `WithoutMiddleware` 属性会被子控制器继承。该属性只能移除路由中间件，不适用于[全局中间件](/docs/{{version}}/middleware#global-middleware)。

<a name="authorization-attributes"></a>
### 授权属性

如果你通过策略对控制器操作进行授权，你可以使用 `Authorize` 属性作为 `can` 中间件的便捷快捷方式：

```php
<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Post;
use Illuminate\Routing\Attributes\Controllers\Authorize;

class CommentController
{
    #[Authorize('create', [Comment::class, 'post'])]
    public function store(Post $post)
    {
        // ...
    }

    #[Authorize('delete', 'comment')]
    public function destroy(Comment $comment)
    {
        // ...
    }
}
```

第一个参数是你希望授权的操作。第二个参数是应传递给策略的模型类、路由参数或参数。

<a name="resource-controllers"></a>
## 资源控制器

如果你将应用程序中的每个 Eloquent 模型视为一个"资源"，那么通常会对应用程序中的每个资源执行相同的操作集。例如，假设你的应用程序包含一个 `Photo` 模型和一个 `Movie` 模型。用户很可能可以创建、读取、更新或删除这些资源。

由于这种常见用例，Laravel 资源路由用一行代码将典型的创建、读取、更新和删除（"CRUD"）路由分配给一个控制器。首先，我们可以使用 `make:controller` Artisan 命令的 `--resource` 选项快速创建一个处理这些操作的控制器：

```shell
php artisan make:controller PhotoController --resource
```

此命令将在 `app/Http/Controllers/PhotoController.php` 生成一个控制器。该控制器将包含每个可用资源操作的方法。接下来，你可以注册指向该控制器的资源路由：

```php
use App\Http\Controllers\PhotoController;

Route::resource('photos', PhotoController::class);
```

这个单一的路由声明创建了多个路由来处理资源上的各种操作。生成的控制器已经为每个这些操作存根了方法。请记住，你始终可以通过运行 `route:list` Artisan 命令快速了解应用程序的路由。

你甚至可以通过向 `resources` 方法传递一个数组来一次注册多个资源控制器：

```php
Route::resources([
    'photos' => PhotoController::class,
    'posts' => PostController::class,
]);
```

`softDeletableResources` 方法注册多个资源控制器，所有控制器都使用 `withTrashed` 方法：

```php
Route::softDeletableResources([
    'photos' => PhotoController::class,
    'posts' => PostController::class,
]);
```

<a name="actions-handled-by-resource-controllers"></a>
#### 资源控制器处理的操作

<div class="overflow-auto">

| 动词      | URI                    | 动作    | 路由名称        |
| --------- | ---------------------- | ------- | -------------- |
| GET       | `/photos`              | index   | photos.index   |
| GET       | `/photos/create`       | create  | photos.create  |
| POST      | `/photos`              | store   | photos.store   |
| GET       | `/photos/{photo}`      | show    | photos.show    |
| GET       | `/photos/{photo}/edit` | edit    | photos.edit    |
| PUT/PATCH | `/photos/{photo}`      | update  | photos.update  |
| DELETE    | `/photos/{photo}`      | destroy | photos.destroy |

</div>

<a name="customizing-missing-model-behavior"></a>
#### 自定义缺失模型行为

通常，如果找不到隐式绑定的资源模型，将生成 404 HTTP 响应。但是，你可以通过在定义资源路由时调用 `missing` 方法来自定义此行为。`missing` 方法接受一个闭包，当资源路由的任何路由找不到隐式绑定的模型时将调用该闭包：

```php
use App\Http\Controllers\PhotoController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;

Route::resource('photos', PhotoController::class)
    ->missing(function (Request $request) {
        return Redirect::route('photos.index');
    });
```

<a name="soft-deleted-models"></a>
#### 软删除模型

通常，隐式模型绑定不会检索已被[软删除](/docs/{{version}}/eloquent#soft-deleting)的模型，而是会返回 404 HTTP 响应。但是，你可以通过在定义资源路由时调用 `withTrashed` 方法来指示框架允许软删除模型：

```php
use App\Http\Controllers\PhotoController;

Route::resource('photos', PhotoController::class)->withTrashed();
```

不带参数调用 `withTrashed` 将允许在 `show`、`edit` 和 `update` 资源路由中使用软删除模型。你可以通过向 `withTrashed` 方法传递一个数组来指定这些路由的子集：

```php
Route::resource('photos', PhotoController::class)->withTrashed(['show']);
```

<a name="specifying-the-resource-model"></a>
#### 指定资源模型

如果你正在使用[路由模型绑定](/docs/{{version}}/routing#route-model-binding)并且希望资源控制器的方法类型提示模型实例，你可以在生成控制器时使用 `--model` 选项：

```shell
php artisan make:controller PhotoController --model=Photo --resource
```

<a name="generating-form-requests"></a>
#### 生成表单请求

你可以在生成资源控制器时提供 `--requests` 选项，以指示 Artisan 为控制器的存储和更新方法生成[表单请求类](/docs/{{version}}/validation#form-request-validation)：

```shell
php artisan make:controller PhotoController --model=Photo --resource --requests
```

<a name="restful-partial-resource-routes"></a>
### 部分资源路由

在声明资源路由时，你可以指定控制器应处理的操作子集，而不是完整的默认操作集：

```php
use App\Http\Controllers\PhotoController;

Route::resource('photos', PhotoController::class)->only([
    'index', 'show'
]);

Route::resource('photos', PhotoController::class)->except([
    'create', 'store', 'update', 'destroy'
]);
```

<a name="api-resource-routes"></a>
#### API 资源路由

在声明将由 API 使用的资源路由时，通常希望排除呈现 HTML 模板的路由，如 `create` 和 `edit`。为方便起见，你可以使用 `apiResource` 方法自动排除这两个路由：

```php
use App\Http\Controllers\PhotoController;

Route::apiResource('photos', PhotoController::class);
```

你可以通过向 `apiResources` 方法传递一个数组来一次注册多个 API 资源控制器：

```php
use App\Http\Controllers\PhotoController;
use App\Http\Controllers\PostController;

Route::apiResources([
    'photos' => PhotoController::class,
    'posts' => PostController::class,
]);
```

要快速生成不包含 `create` 或 `edit` 方法的 API 资源控制器，请在执行 `make:controller` 命令时使用 `--api` 开关：

```shell
php artisan make:controller PhotoController --api
```

<a name="restful-nested-resources"></a>
### 嵌套资源

有时你可能需要定义指向嵌套资源的路由。例如，照片资源可能附加了多条评论。要嵌套资源控制器，你可以在路由声明中使用"点"符号：

```php
use App\Http\Controllers\PhotoCommentController;

Route::resource('photos.comments', PhotoCommentController::class);
```

此路由将注册一个嵌套资源，可以通过类似以下的 URI 访问：

```text
/photos/{photo}/comments/{comment}
```

<a name="scoping-nested-resources"></a>
#### 限定嵌套资源作用域

Laravel 的[隐式模型绑定](/docs/{{version}}/routing#implicit-model-binding-scoping)功能可以自动限定嵌套绑定的作用域，从而确认解析的子模型属于父模型。通过在定义嵌套资源时使用 `scoped` 方法，你可以启用自动作用域，并指示 Laravel 应通过哪个字段检索子资源。有关如何实现此目的的更多信息，请参阅[限定资源路由作用域](#restful-scoping-resource-routes)的文档。

<a name="shallow-nesting"></a>
#### 浅层嵌套

通常，在 URI 中同时包含父 ID 和子 ID 并非完全必要，因为子 ID 已经是唯一标识符。当使用唯一标识符（如自动递增主键）在 URI 段中标识模型时，你可以选择使用"浅层嵌套"：

```php
use App\Http\Controllers\CommentController;

Route::resource('photos.comments', CommentController::class)->shallow();
```

此路由定义将定义以下路由：

<div class="overflow-auto">

| 动词      | URI                               | 动作    | 路由名称               |
| --------- | --------------------------------- | ------- | ---------------------- |
| GET       | `/photos/{photo}/comments`        | index   | photos.comments.index  |
| GET       | `/photos/{photo}/comments/create` | create  | photos.comments.create |
| POST      | `/photos/{photo}/comments`        | store   | photos.comments.store  |
| GET       | `/comments/{comment}`             | show    | comments.show          |
| GET       | `/comments/{comment}/edit`        | edit    | comments.edit          |
| PUT/PATCH | `/comments/{comment}`             | update  | comments.update        |
| DELETE    | `/comments/{comment}`             | destroy | comments.destroy       |

</div>

<a name="restful-naming-resource-routes"></a>
### 命名资源路由

默认情况下，所有资源控制器操作都有一个路由名称；但是，你可以通过传递一个包含所需路由名称的 `names` 数组来覆盖这些名称：

```php
use App\Http\Controllers\PhotoController;

Route::resource('photos', PhotoController::class)->names([
    'create' => 'photos.build'
]);
```

<a name="restful-naming-resource-route-parameters"></a>
### 命名资源路由参数

默认情况下，`Route::resource` 将根据资源名称的"单数化"版本为你的资源路由创建路由参数。你可以使用 `parameters` 方法轻松地在每个资源基础上覆盖此设置。传递给 `parameters` 方法的数组应是资源名称和参数名称的关联数组：

```php
use App\Http\Controllers\AdminUserController;

Route::resource('users', AdminUserController::class)->parameters([
    'users' => 'admin_user'
]);
```

上面的示例为资源的 `show` 路由生成以下 URI：

```text
/users/{admin_user}
```

<a name="restful-scoping-resource-routes"></a>
### 限定资源路由作用域

Laravel 的[限定了作用域的隐式模型绑定](/docs/{{version}}/routing#implicit-model-binding-scoping)功能可以自动限定嵌套绑定的作用域，从而确认解析的子模型属于父模型。通过在定义嵌套资源时使用 `scoped` 方法，你可以启用自动作用域，并指示 Laravel 应通过哪个字段检索子资源：

```php
use App\Http\Controllers\PhotoCommentController;

Route::resource('photos.comments', PhotoCommentController::class)->scoped([
    'comment' => 'slug',
]);
```

此路由将注册一个限定了作用域的嵌套资源，可以通过类似以下的 URI 访问：

```text
/photos/{photo}/comments/{comment:slug}
```

当使用自定义键的隐式绑定作为嵌套路由参数时，Laravel 将自动使用约定来猜测父级上的关系名称，从而限定查询以检索嵌套模型。在这种情况下，将假定 `Photo` 模型有一个名为 `comments`（路由参数名称的复数形式）的关系，可用于检索 `Comment` 模型。

<a name="restful-localizing-resource-uris"></a>
### 本地化资源 URI

默认情况下，`Route::resource` 将使用英语动词和复数规则创建资源 URI。如果你需要本地化 `create` 和 `edit` 操作动词，你可以使用 `Route::resourceVerbs` 方法。这可以在应用程序的 `App\Providers\AppServiceProvider` 中的 `boot` 方法开头完成：

```php
/**
 * 引导任何应用程序服务。
 */
public function boot(): void
{
    Route::resourceVerbs([
        'create' => 'crear',
        'edit' => 'editar',
    ]);
}
```

Laravel 的复数化器支持[几种不同的语言，你可以根据需要配置](/docs/{{version}}/localization#pluralization-language)。一旦动词和复数化语言被自定义，资源路由注册（如 `Route::resource('publicacion', PublicacionController::class)`）将产生以下 URI：

```text
/publicacion/crear

/publicacion/{publicaciones}/editar
```

<a name="restful-supplementing-resource-controllers"></a>
### 补充资源控制器

如果你需要在默认资源路由集之外向资源控制器添加额外的路由，你应该在调用 `Route::resource` 方法之前定义这些路由；否则，`resource` 方法定义的路由可能无意中优先于你的补充路由：

```php
use App\Http\Controller\PhotoController;

Route::get('/photos/popular', [PhotoController::class, 'popular']);
Route::resource('photos', PhotoController::class);
```

> [!NOTE]
> 记住保持控制器的专注。如果你发现自己经常需要典型资源操作集之外的方法，考虑将控制器拆分为两个更小的控制器。

<a name="singleton-resource-controllers"></a>
### 单例资源控制器

有时，你的应用程序会有只能有单个实例的资源。例如，用户的"个人资料"可以被编辑或更新，但用户不能有多个"个人资料"。同样，图片可能有单个"缩略图"。这些资源被称为"单例资源"，意味着资源只能有一个且唯一的实例。在这些场景中，你可以注册一个"单例"资源控制器：

```php
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

Route::singleton('profile', ProfileController::class);
```

上面的单例资源定义将注册以下路由。如你所见，单例资源不会注册"创建"路由，并且注册的路由不接受标识符，因为资源只能有一个实例：

<div class="overflow-auto">

| 动词      | URI             | 动作   | 路由名称      |
| --------- | --------------- | ------ | -------------- |
| GET       | `/profile`      | show   | profile.show   |
| GET       | `/profile/edit` | edit   | profile.edit   |
| PUT/PATCH | `/profile`      | update | profile.update |

</div>

单例资源也可以嵌套在标准资源中：

```php
Route::singleton('photos.thumbnail', ThumbnailController::class);
```

在此示例中，`photos` 资源将接收所有[标准资源路由](#actions-handled-by-resource-controllers)；但是，`thumbnail` 资源将是具有以下路由的单例资源：

<div class="overflow-auto">

| 动词      | URI                              | 动作   | 路由名称               |
| --------- | -------------------------------- | ------ | ----------------------- |
| GET       | `/photos/{photo}/thumbnail`      | show   | photos.thumbnail.show   |
| GET       | `/photos/{photo}/thumbnail/edit` | edit   | photos.thumbnail.edit   |
| PUT/PATCH | `/photos/{photo}/thumbnail`      | update | photos.thumbnail.update |

</div>

<a name="creatable-singleton-resources"></a>
#### 可创建的单例资源

有时，你可能希望为单例资源定义创建和存储路由。为此，你可以在注册单例资源路由时调用 `creatable` 方法：

```php
Route::singleton('photos.thumbnail', ThumbnailController::class)->creatable();
```

在此示例中，将注册以下路由。如你所见，还会为可创建的单例资源注册一个 `DELETE` 路由：

<div class="overflow-auto">

| 动词      | URI                                | 动作    | 路由名称                |
| --------- | ---------------------------------- | ------- | ------------------------ |
| GET       | `/photos/{photo}/thumbnail/create` | create  | photos.thumbnail.create  |
| POST      | `/photos/{photo}/thumbnail`        | store   | photos.thumbnail.store   |
| GET       | `/photos/{photo}/thumbnail`        | show    | photos.thumbnail.show    |
| GET       | `/photos/{photo}/thumbnail/edit`   | edit    | photos.thumbnail.edit    |
| PUT/PATCH | `/photos/{photo}/thumbnail`        | update  | photos.thumbnail.update  |
| DELETE    | `/photos/{photo}/thumbnail`        | destroy | photos.thumbnail.destroy |

</div>

如果你希望 Laravel 为单例资源注册 `DELETE` 路由，但不注册创建或存储路由，你可以使用 `destroyable` 方法：

```php
Route::singleton(...)->destroyable();
```

<a name="api-singleton-resources"></a>
#### API 单例资源

`apiSingleton` 方法可用于注册将通过 API 操作的单例资源，从而使得 `create` 和 `edit` 路由变得不必要：

```php
Route::apiSingleton('profile', ProfileController::class);
```

当然，API 单例资源也可以是 `creatable` 的，这将为资源注册 `store` 和 `destroy` 路由：

```php
Route::apiSingleton('photos.thumbnail', ProfileController::class)->creatable();
```

<a name="middleware-and-resource-controllers"></a>
### 中间件和资源控制器

Laravel 允许你使用 `middleware`、`middlewareFor` 和 `withoutMiddlewareFor` 方法将中间件分配给资源路由的全部或特定方法。这些方法提供了对哪些中间件应用于每个资源操作的细粒度控制。

#### 将中间件应用于所有方法

你可以使用 `middleware` 方法将中间件分配给资源或单例资源路由生成的所有路由：

```php
Route::resource('users', UserController::class)
    ->middleware(['auth', 'verified']);

Route::singleton('profile', ProfileController::class)
    ->middleware('auth');
```

#### 将中间件应用于特定方法

你可以使用 `middlewareFor` 方法将中间件分配给给定资源控制器的一个或多个特定方法：

```php
Route::resource('users', UserController::class)
    ->middlewareFor('show', 'auth');

Route::apiResource('users', UserController::class)
    ->middlewareFor(['show', 'update'], 'auth');

Route::resource('users', UserController::class)
    ->middlewareFor('show', 'auth')
    ->middlewareFor('update', 'auth');

Route::apiResource('users', UserController::class)
    ->middlewareFor(['show', 'update'], ['auth', 'verified']);
```

`middlewareFor` 方法也可以与单例和 API 单例资源控制器一起使用：

```php
Route::singleton('profile', ProfileController::class)
    ->middlewareFor('show', 'auth');

Route::apiSingleton('profile', ProfileController::class)
    ->middlewareFor(['show', 'update'], 'auth');
```

#### 从特定方法排除中间件

你可以使用 `withoutMiddlewareFor` 方法从资源控制器的特定方法中排除中间件：

```php
Route::middleware(['auth', 'verified', 'subscribed'])->group(function () {
    Route::resource('users', UserController::class)
        ->withoutMiddlewareFor('index', ['auth', 'verified'])
        ->withoutMiddlewareFor(['create', 'store'], 'verified')
        ->withoutMiddlewareFor('destroy', 'subscribed');
});
```

<a name="dependency-injection-and-controllers"></a>
## 依赖注入和控制器

<a name="constructor-injection"></a>
#### 构造函数注入

Laravel [服务容器](/docs/{{version}}/container)用于解析所有 Laravel 控制器。因此，你可以在其构造函数中类型提示控制器可能需要的任何依赖。声明的依赖将自动解析并注入到控制器实例中：

```php
<?php

namespace App\Http\Controllers;

use App\Repositories\UserRepository;

class UserController extends Controller
{
    /**
     * 创建新的控制器实例。
     */
    public function __construct(
        protected UserRepository $users,
    ) {}
}
```

<a name="method-injection"></a>
#### 方法注入

除了构造函数注入，你还可以在控制器的方法上类型提示依赖。方法注入的一个常见用例是将 `Illuminate\Http\Request` 实例注入到控制器方法中：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * 存储一个新用户。
     */
    public function store(Request $request): RedirectResponse
    {
        $name = $request->name;

        // 存储用户...

        return redirect('/users');
    }
}
```

如果你的控制器方法还期望从路由参数获取输入，请在其他依赖之后列出路由参数。例如，如果你的路由定义如下：

```php
use App\Http\Controllers\UserController;

Route::put('/user/{id}', [UserController::class, 'update']);
```

你仍然可以类型提示 `Illuminate\Http\Request` 并通过如下定义控制器方法来访问 `id` 参数：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * 更新给定的用户。
     */
    public function update(Request $request, string $id): RedirectResponse
    {
        // 更新用户...

        return redirect('/users');
    }
}
```

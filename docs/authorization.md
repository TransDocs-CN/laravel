# 授权

- [简介](#introduction)
- [闸门](#gates)
    - [编写闸门](#writing-gates)
    - [授权操作](#authorizing-actions-via-gates)
    - [闸门响应](#gate-responses)
    - [拦截闸门检查](#intercepting-gate-checks)
    - [内联授权](#inline-authorization)
- [创建策略](#creating-policies)
    - [生成策略](#generating-policies)
    - [注册策略](#registering-policies)
- [编写策略](#writing-policies)
    - [策略方法](#policy-methods)
    - [策略响应](#policy-responses)
    - [无需模型的方法](#methods-without-models)
    - [访客用户](#guest-users)
    - [策略过滤器](#policy-filters)
- [使用策略授权操作](#authorizing-actions-using-policies)
    - [通过用户模型](#via-the-user-model)
    - [通过 Gate 门面](#via-the-gate-facade)
    - [通过中间件](#via-middleware)
    - [通过 Blade 模板](#via-blade-templates)
    - [提供额外的上下文](#supplying-additional-context)
- [授权与 Inertia](#authorization-and-inertia)

<a name="introduction"></a>
## 简介

除了提供内置的[身份认证](/docs/{{version}}/authentication)服务外，Laravel 还提供了一种简单的方法来授权用户对给定资源的操作。例如，即使用户已通过身份认证，他们也可能无权更新或删除由你的应用程序管理的某些 Eloquent 模型或数据库记录。Laravel 的授权功能提供了一种简单、有组织的方式来管理这些类型的授权检查。

Laravel 提供了两种主要的方式来授权操作：[闸门](#gates)和[策略](#creating-policies)。可以将闸门和策略想象成路由和控制器。闸门提供了一种简单的、基于闭包的授权方法，而策略则像控制器一样，围绕特定模型或资源对逻辑进行分组。在本文档中，我们将首先探讨闸门，然后研究策略。

在构建应用程序时，你不需要在专门使用闸门或专门使用策略之间做出选择。大多数应用程序很可能同时包含闸门和策略，这完全没问题！闸门最适用于与任何模型或资源无关的操作，例如查看管理员仪表板。相比之下，当你希望授权针对特定模型或资源的操作时，应使用策略。

<a name="gates"></a>
## 闸门

<a name="writing-gates"></a>
### 编写闸门

> [!WARNING]
> 闸门是学习 Laravel 授权功能基础的好方法；但是，在构建健壮的 Laravel 应用程序时，你应该考虑使用[策略](#creating-policies)来组织你的授权规则。

闸门就是简单的闭包，用于确定用户是否有权执行给定的操作。通常，闸门是在 `App\Providers\AppServiceProvider` 类的 `boot` 方法中使用 `Gate` 门面定义的。闸门总是接收一个用户实例作为其第一个参数，并可能可选地接收其他参数，例如相关的 Eloquent 模型。

在此示例中，我们将定义一个闸门来确定用户是否可以更新给定的 `App\Models\Post` 模型。该闸门将通过比较用户的 `id` 与创建该帖子的用户的 `user_id` 来实现：

```php
use App\Models\Post;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Gate::define('update-post', function (User $user, Post $post) {
        return $user->id === $post->user_id;
    });
}
```

与控制器一样，闸门也可以使用类回调数组来定义：

```php
use App\Policies\PostPolicy;
use Illuminate\Support\Facades\Gate;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Gate::define('update-post', [PostPolicy::class, 'update']);
}
```

<a name="authorizing-actions-via-gates"></a>
### 授权操作

要使用闸门授权操作，你应该使用 `Gate` 门面提供的 `allows` 或 `denies` 方法。请注意，你不需要将当前已认证用户传递给这些方法。Laravel 会自动将用户传递给闸门闭包。通常，在需要授权的操作之前，在你的应用程序的控制器中调用闸门授权方法：

```php
<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class PostController extends Controller
{
    /**
     * Update the given post.
     */
    public function update(Request $request, Post $post): RedirectResponse
    {
        if (! Gate::allows('update-post', $post)) {
            abort(403);
        }

        // Update the post...

        return redirect('/posts');
    }
}
```

如果你想判断当前已认证用户之外的其他用户是否有权执行操作，你可以使用 `Gate` 门面上的 `forUser` 方法：

```php
if (Gate::forUser($user)->allows('update-post', $post)) {
    // The user can update the post...
}

if (Gate::forUser($user)->denies('update-post', $post)) {
    // The user can't update the post...
}
```

你可以使用 `any` 或 `none` 方法同时授权多个操作：

```php
if (Gate::any(['update-post', 'delete-post'], $post)) {
    // The user can update or delete the post...
}

if (Gate::none(['update-post', 'delete-post'], $post)) {
    // The user can't update or delete the post...
}
```

<a name="authorizing-or-throwing-exceptions"></a>
#### 授权或抛出异常

如果你希望尝试授权一个操作，并在用户不被允许执行给定操作时自动抛出 `Illuminate\Auth\Access\AuthorizationException`，你可以使用 `Gate` 门面的 `authorize` 方法。`AuthorizationException` 的实例会被 Laravel 自动转换为 403 HTTP 响应：

```php
Gate::authorize('update-post', $post);

// The action is authorized...
```

<a name="gates-supplying-additional-context"></a>
#### 提供额外的上下文

用于授权能力的闸门方法（`allows`、`denies`、`check`、`any`、`none`、`authorize`、`can`、`cannot`）和授权 [Blade 指令](#via-blade-templates)（`@can`、`@cannot`、`@canany`）可以接收一个数组作为其第二个参数。这些数组元素作为参数传递给闸门闭包，并可在做出授权决策时用作额外的上下文：

```php
use App\Models\Category;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

Gate::define('create-post', function (User $user, Category $category, bool $pinned) {
    if (! $user->canPublishToGroup($category->group)) {
        return false;
    } elseif ($pinned && ! $user->canPinPosts()) {
        return false;
    }

    return true;
});

if (Gate::check('create-post', [$category, $pinned])) {
    // The user can create the post...
}
```

<a name="gate-responses"></a>
### 闸门响应

到目前为止，我们只研究了返回简单布尔值的闸门。但是，有时你可能希望返回更详细的响应，包括错误消息。为此，你可以从你的闸门返回一个 `Illuminate\Auth\Access\Response`：

```php
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Support\Facades\Gate;

Gate::define('edit-settings', function (User $user) {
    return $user->isAdmin
        ? Response::allow()
        : Response::deny('You must be an administrator.');
});
```

即使当你从闸门返回一个授权响应时，`Gate::allows` 方法仍会返回一个简单的布尔值；但是，你可以使用 `Gate::inspect` 方法来获取闸门返回的完整授权响应：

```php
$response = Gate::inspect('edit-settings');

if ($response->allowed()) {
    // The action is authorized...
} else {
    echo $response->message();
}
```

当使用 `Gate::authorize` 方法（如果操作未被授权，它会抛出 `AuthorizationException`）时，授权响应提供的错误消息将传播到 HTTP 响应：

```php
Gate::authorize('edit-settings');

// The action is authorized...
```

<a name="customizing-gate-response-status"></a>
#### 自定义 HTTP 响应状态

当通过闸门拒绝某个操作时，将返回 `403` HTTP 响应；但是，有时返回替代的 HTTP 状态码可能会很有用。你可以使用 `Illuminate\Auth\Access\Response` 类上的 `denyWithStatus` 静态构造器来自定义授权检查失败时返回的 HTTP 状态码：

```php
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Support\Facades\Gate;

Gate::define('edit-settings', function (User $user) {
    return $user->isAdmin
        ? Response::allow()
        : Response::denyWithStatus(404);
});
```

因为通过 `404` 响应隐藏资源是 Web 应用程序中非常常见的模式，所以为了方便起见，提供了 `denyAsNotFound` 方法：

```php
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Support\Facades\Gate;

Gate::define('edit-settings', function (User $user) {
    return $user->isAdmin
        ? Response::allow()
        : Response::denyAsNotFound();
});
```

<a name="intercepting-gate-checks"></a>
### 拦截闸门检查

有时，你可能希望授予特定用户所有能力。你可以使用 `before` 方法来定义一个在所有其他授权检查之前运行的闭包：

```php
use App\Models\User;
use Illuminate\Support\Facades\Gate;

Gate::before(function (User $user, string $ability) {
    if ($user->isAdministrator()) {
        return true;
    }
});
```

如果 `before` 闭包返回非 null 结果，则该结果将被视为授权检查的结果。

你可以使用 `after` 方法来定义一个在所有其他授权检查之后执行的闭包：

```php
use App\Models\User;

Gate::after(function (User $user, string $ability, bool|null $result, mixed $arguments) {
    if ($user->isAdministrator()) {
        return true;
    }
});
```

`after` 闭包返回的值不会覆盖授权检查的结果，除非闸门或策略返回了 `null`。

<a name="inline-authorization"></a>
### 内联授权

有时，你可能希望判断当前已认证用户是否有权执行给定操作，而无需编写与该操作对应的专用闸门。Laravel 允许你通过 `Gate::allowIf` 和 `Gate::denyIf` 方法执行这些类型的「内联」授权检查。内联授权不会执行任何已定义的「before」或「after」授权钩子：

```php
use App\Models\User;
use Illuminate\Support\Facades\Gate;

Gate::allowIf(fn (User $user) => $user->isAdministrator());

Gate::denyIf(fn (User $user) => $user->banned());
```

如果操作未被授权或者当前没有用户通过认证，Laravel 将自动抛出 `Illuminate\Auth\Access\AuthorizationException` 异常。`AuthorizationException` 的实例会被 Laravel 的异常处理程序自动转换为 403 HTTP 响应。

<a name="creating-policies"></a>
## 创建策略

<a name="generating-policies"></a>
### 生成策略

策略是围绕特定模型或资源组织授权逻辑的类。例如，如果你的应用程序是一个博客，你可能有一个 `App\Models\Post` 模型和一个相应的 `App\Policies\PostPolicy` 来授权用户操作，例如创建或更新帖子。

你可以使用 `make:policy` Artisan 命令生成一个策略。生成的策略将放置在 `app/Policies` 目录中。如果此目录在你的应用程序中不存在，Laravel 将为你创建它：

```shell
php artisan make:policy PostPolicy
```

`make:policy` 命令将生成一个空的策略类。如果你希望生成一个包含与查看、创建、更新和删除资源相关的示例策略方法的类，可以在执行命令时提供 `--model` 选项：

```shell
php artisan make:policy PostPolicy --model=Post
```

<a name="registering-policies"></a>
### 注册策略

<a name="policy-discovery"></a>
#### 策略发现

默认情况下，只要模型和策略遵循标准的 Laravel 命名约定，Laravel 会自动发现策略。具体来说，策略必须位于包含模型的目录或其上级目录的 `Policies` 目录中。因此，例如，模型可以放在 `app/Models` 目录中，而策略可以放在 `app/Policies` 目录中。在这种情况下，Laravel 将首先在 `app/Models/Policies` 中检查策略，然后在 `app/Policies` 中检查。此外，策略名称必须与模型名称匹配并具有 `Policy` 后缀。因此，`User` 模型将对应 `UserPolicy` 策略类。

如果你想定义自己的策略发现逻辑，可以使用 `Gate::guessPolicyNamesUsing` 方法注册一个自定义策略发现回调。通常，此方法应从应用程序的 `AppServiceProvider` 的 `boot` 方法中调用：

```php
use Illuminate\Support\Facades\Gate;

Gate::guessPolicyNamesUsing(function (string $modelClass) {
    // Return the name of the policy class for the given model...
});
```

<a name="manually-registering-policies"></a>
#### 手动注册策略

使用 `Gate` 门面，你可以在应用程序的 `AppServiceProvider` 的 `boot` 方法中手动注册策略及其对应的模型：

```php
use App\Models\Order;
use App\Policies\OrderPolicy;
use Illuminate\Support\Facades\Gate;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Gate::policy(Order::class, OrderPolicy::class);
}
```

或者，你可以在模型类上放置 `UsePolicy` 属性，以告知 Laravel 该模型对应的策略：

```php
<?php

namespace App\Models;

use App\Policies\OrderPolicy;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Model;

#[UsePolicy(OrderPolicy::class)]
class Order extends Model
{
    //
}
```

<a name="writing-policies"></a>
## 编写策略

<a name="policy-methods"></a>
### 策略方法

一旦策略类被注册，你可以为其授权的每个操作添加方法。例如，让我们在 `PostPolicy` 上定义一个 `update` 方法，判断给定的 `App\Models\User` 是否可以更新给定的 `App\Models\Post` 实例。

`update` 方法将接收一个 `User` 和一个 `Post` 实例作为其参数，并应返回 `true` 或 `false`，指示用户是否有权更新给定的 `Post`。因此，在此示例中，我们将验证用户的 `id` 是否与帖子上的 `user_id` 匹配：

```php
<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;

class PostPolicy
{
    /**
     * Determine if the given post can be updated by the user.
     */
    public function update(User $user, Post $post): bool
    {
        return $user->id === $post->user_id;
    }
}
```

你可以根据需要继续为策略授权的各种操作定义其他方法。例如，你可以定义 `view` 或 `delete` 方法来授权不同的 `Post` 相关操作，但请记住，你可以自由地为策略方法起任何你喜欢的名称。

如果你在通过 Artisan 控制台生成策略时使用了 `--model` 选项，它将已包含 `viewAny`、`view`、`create`、`update`、`delete`、`restore` 和 `forceDelete` 操作的方法。

> [!NOTE]
> 所有策略都通过 Laravel [服务容器](/docs/{{version}}/container)解析，允许你在策略的构造函数中类型提示任何需要的依赖项，使其自动注入。

<a name="policy-responses"></a>
### 策略响应

到目前为止，我们只研究了返回简单布尔值的策略方法。但是，有时你可能希望返回更详细的响应，包括错误消息。为此，你可以从你的策略方法中返回一个 `Illuminate\Auth\Access\Response` 实例：

```php
use App\Models\Post;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * Determine if the given post can be updated by the user.
 */
public function update(User $user, Post $post): Response
{
    return $user->id === $post->user_id
        ? Response::allow()
        : Response::deny('You do not own this post.');
}
```

当从你的策略返回一个授权响应时，`Gate::allows` 方法仍会返回一个简单的布尔值；但是，你可以使用 `Gate::inspect` 方法来获取闸门返回的完整授权响应：

```php
use Illuminate\Support\Facades\Gate;

$response = Gate::inspect('update', $post);

if ($response->allowed()) {
    // The action is authorized...
} else {
    echo $response->message();
}
```

当使用 `Gate::authorize` 方法（如果操作未被授权，它会抛出 `AuthorizationException`）时，授权响应提供的错误消息将传播到 HTTP 响应：

```php
Gate::authorize('update', $post);

// The action is authorized...
```

<a name="customizing-policy-response-status"></a>
#### 自定义 HTTP 响应状态

当通过策略方法拒绝某个操作时，将返回 `403` HTTP 响应；但是，有时返回替代的 HTTP 状态码可能会很有用。你可以使用 `Illuminate\Auth\Access\Response` 类上的 `denyWithStatus` 静态构造器来自定义授权检查失败时返回的 HTTP 状态码：

```php
use App\Models\Post;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * Determine if the given post can be updated by the user.
 */
public function update(User $user, Post $post): Response
{
    return $user->id === $post->user_id
        ? Response::allow()
        : Response::denyWithStatus(404);
}
```

因为通过 `404` 响应隐藏资源是 Web 应用程序中非常常见的模式，所以为了方便起见，提供了 `denyAsNotFound` 方法：

```php
use App\Models\Post;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * Determine if the given post can be updated by the user.
 */
public function update(User $user, Post $post): Response
{
    return $user->id === $post->user_id
        ? Response::allow()
        : Response::denyAsNotFound();
}
```

<a name="methods-without-models"></a>
### 无需模型的方法

某些策略方法仅接收当前已认证用户的实例。这种情况在授权 `create` 操作时最为常见。例如，如果你正在创建一个博客，你可能希望判断用户是否有权创建任何帖子。在这些情况下，你的策略方法应仅期望接收一个用户实例：

```php
/**
 * Determine if the given user can create posts.
 */
public function create(User $user): bool
{
    return $user->role == 'writer';
}
```

<a name="guest-users"></a>
### 访客用户

默认情况下，如果传入的 HTTP 请求不是由已认证用户发起的，所有闸门和策略都会自动返回 `false`。但是，你可以通过为用户参数声明一个「可选的」类型提示或提供 `null` 默认值，来允许这些授权检查传递到你的闸门和策略：

```php
<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;

class PostPolicy
{
    /**
     * Determine if the given post can be updated by the user.
     */
    public function update(?User $user, Post $post): bool
    {
        return $user?->id === $post->user_id;
    }
}
```

<a name="policy-filters"></a>
### 策略过滤器

对于某些用户，你可能希望授权给定策略中的所有操作。为此，请在策略上定义一个 `before` 方法。`before` 方法将在策略上的任何其他方法之前执行，让你有机会在实际调用预期的策略方法之前授权该操作。此功能最常用于授权应用程序管理员执行任何操作：

```php
use App\Models\User;

/**
 * Perform pre-authorization checks.
 */
public function before(User $user, string $ability): bool|null
{
    if ($user->isAdministrator()) {
        return true;
    }

    return null;
}
```

如果你想拒绝特定类型用户的所有授权检查，则可以从 `before` 方法返回 `false`。如果返回 `null`，则授权检查将回退到策略方法。

> [!WARNING]
> 如果策略类不包含与正在检查的能力名称匹配的方法，则不会调用策略类的 `before` 方法。

<a name="authorizing-actions-using-policies"></a>
## 使用策略授权操作

<a name="via-the-user-model"></a>
### 通过用户模型

你的 Laravel 应用程序附带的 `App\Models\User` 模型包含两个有用的授权操作方法：`can` 和 `cannot`。`can` 和 `cannot` 方法接收你想要授权的操作名称和相关的模型。例如，让我们判断用户是否有权更新给定的 `App\Models\Post` 模型。通常，这将在控制器方法中完成：

```php
<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    /**
     * Update the given post.
     */
    public function update(Request $request, Post $post): RedirectResponse
    {
        if ($request->user()->cannot('update', $post)) {
            abort(403);
        }

        // Update the post...

        return redirect('/posts');
    }
}
```

如果为给定模型[注册了策略](#registering-policies)，则 `can` 方法将自动调用相应的策略并返回布尔结果。如果没有为模型注册策略，则 `can` 方法将尝试调用与给定操作名称匹配的基于闭包的闸门。

<a name="user-model-actions-that-dont-require-models"></a>
#### 不需要模型的操作

请记住，某些操作可能对应于不需要模型实例的策略方法，如 `create`。在这些情况下，你可以将类名传递给 `can` 方法。类名将用于确定在授权操作时使用哪个策略：

```php
<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    /**
     * Create a post.
     */
    public function store(Request $request): RedirectResponse
    {
        if ($request->user()->cannot('create', Post::class)) {
            abort(403);
        }

        // Create the post...

        return redirect('/posts');
    }
}
```

<a name="via-the-gate-facade"></a>
### 通过 `Gate` 门面

除了提供给 `App\Models\User` 模型的有用方法之外，你还可以始终通过 `Gate` 门面的 `authorize` 方法来授权操作。

与 `can` 方法一样，此方法接受你想要授权的操作名称和相关的模型。如果操作未被授权，`authorize` 方法将抛出 `Illuminate\Auth\Access\AuthorizationException` 异常，Laravel 的异常处理程序会自动将其转换为 403 状态码的 HTTP 响应：

```php
<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class PostController extends Controller
{
    /**
     * Update the given blog post.
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function update(Request $request, Post $post): RedirectResponse
    {
        Gate::authorize('update', $post);

        // The current user can update the blog post...

        return redirect('/posts');
    }
}
```

<a name="controller-actions-that-dont-require-models"></a>
#### 不需要模型的操作

如前所述，某些策略方法（如 `create`）不需要模型实例。在这些情况下，你应该将类名传递给 `authorize` 方法。类名将用于确定在授权操作时使用哪个策略：

```php
use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * Create a new blog post.
 *
 * @throws \Illuminate\Auth\Access\AuthorizationException
 */
public function create(Request $request): RedirectResponse
{
    Gate::authorize('create', Post::class);

    // The current user can create blog posts...

    return redirect('/posts');
}
```

<a name="via-middleware"></a>
### 通过中间件

Laravel 包含一个中间件，可以在传入请求到达你的路由或控制器之前授权操作。默认情况下，`Illuminate\Auth\Middleware\Authorize` 中间件可以通过 `can`[中间件别名](/docs/{{version}}/middleware#middleware-aliases)附加到路由，该别名由 Laravel 自动注册。让我们探讨一个使用 `can` 中间件来授权用户能否更新帖子的示例：

```php
use App\Models\Post;

Route::put('/post/{post}', function (Post $post) {
    // The current user may update the post...
})->middleware('can:update,post');
```

在此示例中，我们向 `can` 中间件传递了两个参数。第一个是我们要授权的操作名称，第二个是我们要传递给策略方法的路由参数。在这种情况下，由于我们使用[隐式模型绑定](/docs/{{version}}/routing#implicit-binding)，一个 `App\Models\Post` 模型将被传递给策略方法。如果用户未被授权执行给定操作，中间件将返回一个 403 状态码的 HTTP 响应。

为了方便起见，你也可以使用 `can` 方法将 `can` 中间件附加到路由：

```php
use App\Models\Post;

Route::put('/post/{post}', function (Post $post) {
    // The current user may update the post...
})->can('update', 'post');
```

如果你正在使用[控制器中间件属性](/docs/{{version}}/controllers#middleware-attributes)，你可以通过 `Authorize` 属性应用 `can` 中间件：

```php
use Illuminate\Routing\Attributes\Controllers\Authorize;

#[Authorize('update', 'post')]
public function update(Post $post)
{
    // The current user may update the post...
}
```

<a name="middleware-actions-that-dont-require-models"></a>
#### 不需要模型的操作

同样，某些策略方法（如 `create`）不需要模型实例。在这些情况下，你可以将类名传递给中间件。类名将用于确定在授权操作时使用哪个策略：

```php
Route::post('/post', function () {
    // The current user may create posts...
})->middleware('can:create,App\Models\Post');
```

在字符串中间件定义中指定完整的类名可能会变得很冗长。因此，你可以选择使用 `can` 方法将 `can` 中间件附加到路由：

```php
use App\Models\Post;

Route::post('/post', function () {
    // The current user may create posts...
})->can('create', Post::class);
```

<a name="via-blade-templates"></a>
### 通过 Blade 模板

在编写 Blade 模板时，你可能希望仅在用户有权执行给定操作时才显示页面的一部分。例如，你可能希望仅在用户确实可以更新帖子时才显示博客帖子的更新表单。在这种情况下，你可以使用 `@can` 和 `@cannot` 指令：

```blade
@can('update', $post)
    <!-- The current user can update the post... -->
@elsecan('create', App\Models\Post::class)
    <!-- The current user can create new posts... -->
@else
    <!-- ... -->
@endcan

@cannot('update', $post)
    <!-- The current user cannot update the post... -->
@elsecannot('create', App\Models\Post::class)
    <!-- The current user cannot create new posts... -->
@endcannot
```

这些指令是编写 `@if` 和 `@unless` 语句的便捷快捷方式。上面的 `@can` 和 `@cannot` 语句等价于以下语句：

```blade
@if (Auth::user()->can('update', $post))
    <!-- The current user can update the post... -->
@endif

@unless (Auth::user()->can('update', $post))
    <!-- The current user cannot update the post... -->
@endunless
```

你还可以判断用户是否有权执行给定操作数组中的任何操作。为此，请使用 `@canany` 指令：

```blade
@canany(['update', 'view', 'delete'], $post)
    <!-- The current user can update, view, or delete the post... -->
@elsecanany(['create'], \App\Models\Post::class)
    <!-- The current user can create a post... -->
@endcanany
```

<a name="blade-actions-that-dont-require-models"></a>
#### 不需要模型的操作

与大多数其他授权方法一样，如果操作不需要模型实例，你可以将类名传递给 `@can` 和 `@cannot` 指令：

```blade
@can('create', App\Models\Post::class)
    <!-- The current user can create posts... -->
@endcan

@cannot('create', App\Models\Post::class)
    <!-- The current user can't create posts... -->
@endcannot
```

<a name="supplying-additional-context"></a>
### 提供额外的上下文

在使用策略授权操作时，你可以将一个数组作为第二个参数传递给各种授权函数和助手。数组中的第一个元素将用于确定应调用哪个策略，而数组的其余元素作为参数传递给策略方法，并可在做出授权决策时用作额外的上下文。例如，考虑以下 `PostPolicy` 方法定义，其中包含一个额外的 `$category` 参数：

```php
/**
 * Determine if the given post can be updated by the user.
 */
public function update(User $user, Post $post, int $category): bool
{
    return $user->id === $post->user_id &&
           $user->canUpdateCategory($category);
}
```

当尝试确定已认证用户是否可以更新给定的帖子时，我们可以像这样调用此策略方法：

```php
/**
 * Update the given blog post.
 *
 * @throws \Illuminate\Auth\Access\AuthorizationException
 */
public function update(Request $request, Post $post): RedirectResponse
{
    Gate::authorize('update', [$post, $request->category]);

    // The current user can update the blog post...

    return redirect('/posts');
}
```

<a name="authorization-and-inertia"></a>
## 授权与 Inertia

尽管授权始终必须在服务器端处理，但向你的前端应用程序提供授权数据以便正确渲染应用程序的 UI 通常很方便。Laravel 没有定义向 Inertia 驱动的前端公开授权信息的必需约定。

但是，如果你正在使用 Laravel 的其中一个基于 Inertia 的[启动工具包](/docs/{{version}}/starter-kits)，你的应用程序已经包含一个 `HandleInertiaRequests` 中间件。在此中间件的 `share` 方法中，你可以返回将提供给应用程序中所有 Inertia 页面的共享数据。此共享数据可以作为定义用户授权信息的便捷位置：

```php
<?php

namespace App\Http\Middleware;

use App\Models\Post;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    // ...

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request)
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
                'permissions' => [
                    'post' => [
                        'create' => $request->user()->can('create', Post::class),
                    ],
                ],
            ],
        ];
    }
}
```

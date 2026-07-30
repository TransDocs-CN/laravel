# Laravel Pennant

- [简介](#introduction)
- [安装](#installation)
- [配置](#configuration)
- [定义功能](#defining-features)
    - [基于类的功能](#class-based-features)
- [检查功能](#checking-features)
    - [条件执行](#conditional-execution)
    - [`HasFeatures` Trait](#the-has-features-trait)
    - [Blade 指令](#blade-directive)
    - [中间件](#middleware)
    - [拦截功能检查](#intercepting-feature-checks)
    - [内存缓存](#in-memory-cache)
- [作用域](#scope)
    - [指定作用域](#specifying-the-scope)
    - [默认作用域](#default-scope)
    - [可空作用域](#nullable-scope)
    - [识别作用域](#identifying-scope)
    - [序列化作用域](#serializing-scope)
- [丰富功能值](#rich-feature-values)
- [检索多个功能](#retrieving-multiple-features)
- [预加载](#eager-loading)
- [更新值](#updating-values)
    - [批量更新](#bulk-updates)
    - [清除功能](#purging-features)
- [测试](#testing)
- [添加自定义 Pennant 驱动](#adding-custom-pennant-drivers)
    - [实现驱动](#implementing-the-driver)
    - [注册驱动](#registering-the-driver)
    - [外部定义功能](#defining-features-externally)
- [事件](#events)

<a name="introduction"></a>
## 简介

[Laravel Pennant](https://github.com/laravel/pennant) 是一个简单轻量的功能标志包——没有复杂冗余。功能标志使你能够自信地逐步推出新的应用功能，进行 A/B 测试新界面设计，补充主干开发策略，以及更多用途。

<a name="installation"></a>
## 安装

首先，使用 Composer 包管理器将 Pennant 安装到你的项目中：

```shell
composer require laravel/pennant
```

接下来，使用 `vendor:publish` Artisan 命令发布 Pennant 配置和迁移文件：

```shell
php artisan vendor:publish --provider="Laravel\Pennant\PennantServiceProvider"
```

最后，运行应用程序的数据库迁移。这将创建一个 `features` 表，Pennant 用于驱动其 `database` 驱动：

```shell
php artisan migrate
```

<a name="configuration"></a>
## 配置

发布 Pennant 资源后，其配置文件将位于 `config/pennant.php`。此配置文件允许你指定 Pennant 将使用的默认存储机制，用于存储已解析的功能标志值。

Pennant 支持通过 `array` 驱动将已解析的功能标志值存储在内存数组中。或者，Pennant 可以通过 `database` 驱动将已解析的功能标志值持久化存储在关系数据库中，这是 Pennant 使用的默认存储机制。

<a name="defining-features"></a>
## 定义功能

要定义一个功能，你可以使用 `Feature` 门面提供的 `define` 方法。你需要为功能提供一个名称，以及一个将在解析功能的初始值时调用的闭包。

通常，功能是使用 `Feature` 门面在服务提供者中定义的。闭包将接收功能检查的"作用域"。最常见的是，作用域是当前已认证的用户。在此示例中，我们将定义一个功能，用于逐步向应用程序的用户推出新 API：

```php
<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Lottery;
use Illuminate\Support\ServiceProvider;
use Laravel\Pennant\Feature;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Feature::define('new-api', fn (User $user) => match (true) {
            $user->isInternalTeamMember() => true,
            $user->isHighTrafficCustomer() => false,
            default => Lottery::odds(1 / 100),
        });
    }
}
```

如你所见，我们的功能有以下规则：

- 所有内部团队成员应使用新 API。
- 任何高流量客户不应使用新 API。
- 否则，功能应随机分配给用户，活跃概率为 1/100。

第一次为给定用户检查 `new-api` 功能时，闭包的结果将由存储驱动存储。下次对同一用户检查该功能时，将从存储中检索该值，并且不会调用闭包。

为了方便起见，如果功能定义只返回一个彩票，你可以完全省略闭包：

    Feature::define('site-redesign', Lottery::odds(1, 1000));

<a name="class-based-features"></a>
### 基于类的功能

Pennant 还允许你定义基于类的功能。与基于闭包的功能定义不同，无需在服务提供者中注册基于类的功能。要创建基于类的功能，你可以调用 `pennant:feature` Artisan 命令。默认情况下，功能类将放置在应用程序的 `app/Features` 目录中：

```shell
php artisan pennant:feature NewApi
```

编写功能类时，你只需要定义一个 `resolve` 方法，该方法将被调用来解析给定作用域的功能初始值。同样，作用域通常是当前已认证的用户：

```php
<?php

namespace App\Features;

use App\Models\User;
use Illuminate\Support\Lottery;

class NewApi
{
    /**
     * Resolve the feature's initial value.
     */
    public function resolve(User $user): mixed
    {
        return match (true) {
            $user->isInternalTeamMember() => true,
            $user->isHighTrafficCustomer() => false,
            default => Lottery::odds(1 / 100),
        };
    }
}
```

如果你希望手动解析基于类的功能实例，可以在 `Feature` 门面上调用 `instance` 方法：

```php
use Illuminate\Support\Facades\Feature;

$instance = Feature::instance(NewApi::class);
```

> [!NOTE]
> 功能类通过[容器](/docs/{{version}}/container)解析，因此你可以在需要时将依赖项注入到功能类的构造函数中。

#### 自定义存储的功能名称

默认情况下，Pennant 将存储功能类的完全限定类名。如果你希望将存储的功能名称与应用程序的内部结构解耦，可以在功能类上添加 `Name` 属性。此属性的值将代替类名存储：

```php
<?php

namespace App\Features;

use Laravel\Pennant\Attributes\Name;

#[Name('new-api')]
class NewApi
{
    // ...
}
```

<a name="checking-features"></a>
## 检查功能

要确定功能是否活跃，你可以使用 `Feature` 门面上的 `active` 方法。默认情况下，会针对当前已认证用户检查功能：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Laravel\Pennant\Feature;

class PodcastController
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        return Feature::active('new-api')
            ? $this->resolveNewApiResponse($request)
            : $this->resolveLegacyApiResponse($request);
    }

    // ...
}
```

虽然默认情况下会针对当前已认证用户检查功能，但你可以轻松地针对其他用户或[作用域](#scope)检查功能。为此，请使用 `Feature` 门面提供的 `for` 方法：

```php
return Feature::for($user)->active('new-api')
    ? $this->resolveNewApiResponse($request)
    : $this->resolveLegacyApiResponse($request);
```

Pennant 还提供了一些其他方便的方法，在确定功能是否活跃时可能很有用：

```php
// Determine if all of the given features are active...
Feature::allAreActive(['new-api', 'site-redesign']);

// Determine if any of the given features are active...
Feature::someAreActive(['new-api', 'site-redesign']);

// Determine if a feature is inactive...
Feature::inactive('new-api');

// Determine if all of the given features are inactive...
Feature::allAreInactive(['new-api', 'site-redesign']);

// Determine if any of the given features are inactive...
Feature::someAreInactive(['new-api', 'site-redesign']);
```

> [!NOTE]
> 在 HTTP 上下文之外使用 Pennant 时，例如在 Artisan 命令或队列作业中，你通常应[显式指定功能的作用域](#specifying-the-scope)。或者，你可以定义一个[默认作用域](#default-scope)，同时考虑已认证的 HTTP 上下文和未认证的上下文。

<a name="checking-class-based-features"></a>
#### 检查基于类的功能

对于基于类的功能，你应在检查功能时提供类名：

```php
<?php

namespace App\Http\Controllers;

use App\Features\NewApi;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Laravel\Pennant\Feature;

class PodcastController
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        return Feature::active(NewApi::class)
            ? $this->resolveNewApiResponse($request)
            : $this->resolveLegacyApiResponse($request);
    }

    // ...
}
```

<a name="conditional-execution"></a>
### 条件执行

`when` 方法可用于在功能活跃时流畅地执行给定闭包。此外，可以提供第二个闭包，在功能不活跃时执行：

```php
<?php

namespace App\Http\Controllers;

use App\Features\NewApi;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Laravel\Pennant\Feature;

class PodcastController
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        return Feature::when(NewApi::class,
            fn () => $this->resolveNewApiResponse($request),
            fn () => $this->resolveLegacyApiResponse($request),
        );
    }

    // ...
}
```

`unless` 方法作为 `when` 方法的反义，在功能不活跃时执行第一个闭包：

```php
return Feature::unless(NewApi::class,
    fn () => $this->resolveLegacyApiResponse($request),
    fn () => $this->resolveNewApiResponse($request),
);
```

<a name="the-has-features-trait"></a>
### `HasFeatures` Trait

Pennant 的 `HasFeatures` trait 可以添加到你的应用程序的 `User` 模型（或任何其他具有功能的模型）中，以提供一种流畅、方便的方式直接从模型检查功能：

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Pennant\Concerns\HasFeatures;

class User extends Authenticatable
{
    use HasFeatures;

    // ...
}
```

将 trait 添加到模型后，你可以通过调用 `features` 方法轻松检查功能：

```php
if ($user->features()->active('new-api')) {
    // ...
}
```

当然，`features` 方法提供对许多其他与功能交互的便捷方法的访问：

```php
// Values...
$value = $user->features()->value('purchase-button')
$values = $user->features()->values(['new-api', 'purchase-button']);

// State...
$user->features()->active('new-api');
$user->features()->allAreActive(['new-api', 'server-api']);
$user->features()->someAreActive(['new-api', 'server-api']);

$user->features()->inactive('new-api');
$user->features()->allAreInactive(['new-api', 'server-api']);
$user->features()->someAreInactive(['new-api', 'server-api']);

// Conditional execution...
$user->features()->when('new-api',
    fn () => /* ... */,
    fn () => /* ... */,
);

$user->features()->unless('new-api',
    fn () => /* ... */,
    fn () => /* ... */,
);
```

<a name="blade-directive"></a>
### Blade 指令

为了使在 Blade 中检查功能成为一种无缝体验，Pennant 提供了 `@feature` 和 `@featureany` 指令：

```blade
@feature('site-redesign')
    <!-- 'site-redesign' is active -->
@else
    <!-- 'site-redesign' is inactive -->
@endfeature

@featureany(['site-redesign', 'beta'])
    <!-- 'site-redesign' or `beta` is active -->
@endfeatureany
```

<a name="middleware"></a>
### 中间件

Pennant 还包含一个[中间件](/docs/{{version}}/middleware)，可用于在路由被调用之前验证当前已认证用户是否有权访问某个功能。你可以将中间件分配给一个路由，并指定访问该路由所需的功能。如果当前已认证用户的任何指定功能不活跃，路由将返回 `400 Bad Request` HTTP 响应。多个功能可以传递给静态的 `using` 方法。

```php
use Illuminate\Support\Facades\Route;
use Laravel\Pennant\Middleware\EnsureFeaturesAreActive;

Route::get('/api/servers', function () {
    // ...
})->middleware(EnsureFeaturesAreActive::using('new-api', 'servers-api'));
```

<a name="customizing-the-response"></a>
#### 自定义响应

如果你希望自定义当列出的某个功能不活跃时中间件返回的响应，可以使用 `EnsureFeaturesAreActive` 中间件提供的 `whenInactive` 方法。通常，此方法应在应用程序的某个服务提供者的 `boot` 方法中调用：

```php
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Laravel\Pennant\Middleware\EnsureFeaturesAreActive;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    EnsureFeaturesAreActive::whenInactive(
        function (Request $request, array $features) {
            return new Response(status: 403);
        }
    );

    // ...
}
```

<a name="intercepting-feature-checks"></a>
### 拦截功能检查

有时，在检索给定功能的存储值之前执行一些内存检查可能很有用。想象一下，你正在功能标志后面开发一个新 API，希望能够在不让已解析的功能值丢失的情况下禁用新 API。如果你在新 API 中发现问题，可以轻松地将其禁用（仅限内部团队成员除外），修复错误，然后为之前有权访问该功能的用户重新启用新 API。

你可以通过[基于类的功能](#class-based-features)的 `before` 方法来实现这一点。当存在时，`before` 方法总是在从存储中检索值之前在内存中运行。如果该方法返回非 `null` 值，则在请求期间将使用它来代替功能的存储值：

```php
<?php

namespace App\Features;

use App\Models\User;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Lottery;

class NewApi
{
    /**
     * Run an always-in-memory check before the stored value is retrieved.
     */
    public function before(User $user): mixed
    {
        if (Config::get('features.new-api.disabled')) {
            return $user->isInternalTeamMember();
        }
    }

    /**
     * Resolve the feature's initial value.
     */
    public function resolve(User $user): mixed
    {
        return match (true) {
            $user->isInternalTeamMember() => true,
            $user->isHighTrafficCustomer() => false,
            default => Lottery::odds(1 / 100),
        };
    }
}
```

你还可以使用此功能来安排先前在功能标志后面的功能的全局发布：

```php
<?php

namespace App\Features;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;

class NewApi
{
    /**
     * Run an always-in-memory check before the stored value is retrieved.
     */
    public function before(User $user): mixed
    {
        if (Config::get('features.new-api.disabled')) {
            return $user->isInternalTeamMember();
        }

        if (Carbon::parse(Config::get('features.new-api.rollout-date'))->isPast()) {
            return true;
        }
    }

    // ...
}
```

<a name="in-memory-cache"></a>
### 内存缓存

检查功能时，Pennant 会创建结果的内存缓存。如果你使用的是 `database` 驱动，这意味着在单个请求中重新检查同一个功能标志不会触发额外的数据库查询。这也确保了功能在请求期间具有一致的结果。

如果你需要手动清除内存缓存，可以使用 `Feature` 门面提供的 `flushCache` 方法：

```php
Feature::flushCache();
```

<a name="scope"></a>
## 作用域

<a name="specifying-the-scope"></a>
### 指定作用域

如前所述，功能通常针对当前已认证用户进行检查。但是，这不一定总是适合你的需求。因此，可以通过 `Feature` 门面的 `for` 方法指定要检查功能的作用域：

```php
return Feature::for($user)->active('new-api')
    ? $this->resolveNewApiResponse($request)
    : $this->resolveLegacyApiResponse($request);
```

当然，功能作用域不限于"用户"。想象一下，你构建了一个新的计费体验，希望向整个团队而不是单个用户推出。也许你希望较老的团队比较新的团队推出速度更慢。你的功能解析闭包可能看起来像这样：

```php
use App\Models\Team;
use Illuminate\Support\Carbon;
use Illuminate\Support\Lottery;
use Laravel\Pennant\Feature;

Feature::define('billing-v2', function (Team $team) {
    if ($team->created_at->isAfter(new Carbon('1st Jan, 2023'))) {
        return true;
    }

    if ($team->created_at->isAfter(new Carbon('1st Jan, 2019'))) {
        return Lottery::odds(1 / 100);
    }

    return Lottery::odds(1 / 1000);
});
```

你会注意到我们定义的闭包不期望 `User`，而是期望 `Team` 模型。要确定此功能是否对用户的团队活跃，应将团队传递给 `Feature` 门面提供的 `for` 方法：

```php
if (Feature::for($user->team)->active('billing-v2')) {
    return redirect('/billing/v2');
}

// ...
```

<a name="default-scope"></a>
### 默认作用域

你也可以自定义 Pennant 用于检查功能的默认作用域。例如，也许你的所有功能都是针对当前已认证用户的团队而不是用户进行检查的。与其每次检查功能时都调用 `Feature::for($user->team)`，你可以将团队指定为默认作用域。通常，这应在你的某个服务提供者中完成：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;
use Laravel\Pennant\Feature;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Feature::resolveScopeUsing(fn ($driver) => Auth::user()?->team);

        // ...
    }
}
```

如果未通过 `for` 方法显式提供作用域，功能检查现在将使用当前已认证用户的团队作为默认作用域：

```php
Feature::active('billing-v2');

// Is now equivalent to...

Feature::for($user->team)->active('billing-v2');
```

<a name="nullable-scope"></a>
### 可空作用域

如果你在检查功能时提供的作用域是 `null`，并且功能定义没有通过可空类型或 union 类型中包含 `null` 来支持 `null`，Pennant 将自动返回 `false` 作为功能的结果值。

因此，如果你传递给功能的作用域可能为 `null`，并且你希望调用功能的值解析器，你应在功能定义中考虑到这一点。`null` 作用域可能发生在你在 Artisan 命令、队列作业或未认证路由中检查功能时。由于这些上下文中通常没有已认证的用户，因此默认作用域将为 `null`。

如果你不总是[显式指定功能作用域](#specifying-the-scope)，则应确保作用域的类型是"可空的"并在功能定义逻辑中处理 `null` 作用域值：

```php
use App\Models\User;
use Illuminate\Support\Lottery;
use Laravel\Pennant\Feature;

Feature::define('new-api', fn (User $user) => match (true) {// [tl! remove]
Feature::define('new-api', fn (User|null $user) => match (true) {// [tl! add]
    $user === null => true,// [tl! add]
    $user->isInternalTeamMember() => true,
    $user->isHighTrafficCustomer() => false,
    default => Lottery::odds(1 / 100),
});
```

<a name="identifying-scope"></a>
### 识别作用域

Pennant 的内置 `array` 和 `database` 存储驱动知道如何正确存储所有 PHP 数据类型以及 Eloquent 模型的作用域标识符。但是，如果你的应用程序使用了第三方 Pennant 驱动，该驱动可能不知道如何正确存储 Eloquent 模型或应用程序中其他自定义类型的标识符。

有鉴于此，Pennant 允许你通过在应用程序中用作 Pennant 作用域的对象上实现 `FeatureScopeable` 契约来格式化存储的作用域值。

例如，想象一下你在单个应用程序中使用了两种不同的功能驱动：内置的 `database` 驱动和第三方的"Flag Rocket"驱动。"Flag Rocket"驱动不知道如何正确存储 Eloquent 模型。相反，它需要一个 `FlagRocketUser` 实例。通过实现 `FeatureScopeable` 契约定义的 `toFeatureIdentifier`，我们可以为应用程序使用的每个驱动自定义可存储的作用域值：

```php
<?php

namespace App\Models;

use FlagRocket\FlagRocketUser;
use Illuminate\Database\Eloquent\Model;
use Laravel\Pennant\Contracts\FeatureScopeable;

class User extends Model implements FeatureScopeable
{
    /**
     * Cast the object to a feature scope identifier for the given driver.
     */
    public function toFeatureIdentifier(string $driver): mixed
    {
        return match($driver) {
            'database' => $this,
            'flag-rocket' => FlagRocketUser::fromId($this->flag_rocket_id),
        };
    }
}
```

<a name="serializing-scope"></a>
### 序列化作用域

默认情况下，Pennant 在存储与 Eloquent 模型关联的功能时将使用完全限定的类名。如果你已经在使用 [Eloquent 多态映射](/docs/{{version}}/eloquent-relationships#custom-polymorphic-types)，你可以选择让 Pennant 也使用多态映射来将存储的功能与应用程序结构解耦。

为此，在服务提供者中定义了 Eloquent 多态映射后，你可以调用 `Feature` 门面的 `useMorphMap` 方法：

```php
use Illuminate\Database\Eloquent\Relations\Relation;
use Laravel\Pennant\Feature;

Relation::enforceMorphMap([
    'post' => 'App\Models\Post',
    'video' => 'App\Models\Video',
]);

Feature::useMorphMap();
```

<a name="rich-feature-values"></a>
## 丰富功能值

到目前为止，我们主要展示了功能处于二元状态，即它们是"活跃"或"不活跃"的，但 Pennant 也允许你存储丰富的值。

例如，想象一下你正在为应用程序的"立即购买"按钮测试三种新颜色。你不仅可以从功能定义中返回 `true` 或 `false`，还可以返回一个字符串：

```php
use Illuminate\Support\Arr;
use Laravel\Pennant\Feature;

Feature::define('purchase-button', fn (User $user) => Arr::random([
    'blue-sapphire',
    'seafoam-green',
    'tart-orange',
]));
```

你可以使用 `value` 方法检索 `purchase-button` 功能的值：

```php
$color = Feature::value('purchase-button');
```

Pennant 包含的 Blade 指令还可以根据功能的当前值轻松地有条件地渲染内容：

```blade
@feature('purchase-button', 'blue-sapphire')
    <!-- 'blue-sapphire' is active -->
@elsefeature('purchase-button', 'seafoam-green')
    <!-- 'seafoam-green' is active -->
@elsefeature('purchase-button', 'tart-orange')
    <!-- 'tart-orange' is active -->
@endfeature
```

> [!NOTE]
> 使用丰富值时，重要的是要知道功能的"活跃"条件是它具有除 `false` 以外的任何值。

当调用[条件 `when`](#conditional-execution) 方法时，功能的丰富值将提供给第一个闭包：

```php
Feature::when('purchase-button',
    fn ($color) => /* ... */,
    fn () => /* ... */,
);
```

同样，当调用条件 `unless` 方法时，功能的丰富值将提供给可选的第二个闭包：

```php
Feature::unless('purchase-button',
    fn () => /* ... */,
    fn ($color) => /* ... */,
);
```

<a name="retrieving-multiple-features"></a>
## 检索多个功能

`values` 方法允许检索给定作用域的多个功能：

```php
Feature::values(['billing-v2', 'purchase-button']);

// [
//     'billing-v2' => false,
//     'purchase-button' => 'blue-sapphire',
// ]
```

或者，你可以使用 `all` 方法检索给定作用域的所有已定义功能的值：

```php
Feature::all();

// [
//     'billing-v2' => false,
//     'purchase-button' => 'blue-sapphire',
//     'site-redesign' => true,
// ]
```

但是，基于类的功能是动态注册的，Pennant 在显式检查之前并不知道它们。这意味着如果你的应用程序的基于类的功能在当前请求期间尚未被检查，它们可能不会出现在 `all` 方法返回的结果中。

如果你希望在使用 `all` 方法时始终包含功能类，可以使用 Pennant 的功能发现功能。首先，在应用程序的某个服务提供者中调用 `discover` 方法：

```php
<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Laravel\Pennant\Feature;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Feature::discover();

        // ...
    }
}
```

`discover` 方法将注册应用程序 `app/Features` 目录中的所有功能类。`all` 方法现在将在其结果中包含这些类，无论它们是否在当前请求期间被检查过：

```php
Feature::all();

// [
//     'App\Features\NewApi' => true,
//     'billing-v2' => false,
//     'purchase-button' => 'blue-sapphire',
//     'site-redesign' => true,
// ]
```

<a name="eager-loading"></a>
## 预加载

尽管 Pennant 为单个请求的所有已解析功能维护一个内存缓存，但仍然可能遇到性能问题。为了缓解这个问题，Pennant 提供了预加载功能值的能力。

为了说明这一点，想象一下我们在循环中检查功能是否活跃：

```php
use Laravel\Pennant\Feature;

foreach ($users as $user) {
    if (Feature::for($user)->active('notifications-beta')) {
        $user->notify(new RegistrationSuccess);
    }
}
```

假设我们使用的是数据库驱动，此代码将为循环中的每个用户执行一次数据库查询——可能执行数百次查询。但是，使用 Pennant 的 `load` 方法，我们可以通过为用户或作用域集合预加载功能值来消除这个潜在的性能瓶颈：

```php
Feature::for($users)->load(['notifications-beta']);

foreach ($users as $user) {
    if (Feature::for($user)->active('notifications-beta')) {
        $user->notify(new RegistrationSuccess);
    }
}
```

要仅在其尚未加载时加载功能值，可以使用 `loadMissing` 方法：

```php
Feature::for($users)->loadMissing([
    'new-api',
    'purchase-button',
    'notifications-beta',
]);
```

你可以使用 `loadAll` 方法加载所有已定义的功能：

```php
Feature::for($users)->loadAll();
```

<a name="updating-values"></a>
## 更新值

当功能的值首次被解析时，底层驱动会将结果存储在存储中。这对于确保用户在请求之间获得一致的体验通常是必需的。但是，有时你可能希望手动更新功能的存储值。

为此，你可以使用 `activate` 和 `deactivate` 方法切换功能的"开"或"关"：

```php
use Laravel\Pennant\Feature;

// Activate the feature for the default scope...
Feature::activate('new-api');

// Deactivate the feature for the given scope...
Feature::for($user->team)->deactivate('billing-v2');
```

也可以通过向 `activate` 方法提供第二个参数来手动设置功能的丰富值：

```php
Feature::activate('purchase-button', 'seafoam-green');
```

要指示 Pennant 忘记功能的存储值，可以使用 `forget` 方法。当再次检查该功能时，Pennant 将从其功能定义中解析功能的值：

```php
Feature::forget('purchase-button');
```

<a name="bulk-updates"></a>
### 批量更新

要批量更新存储的功能值，可以使用 `activateForEveryone` 和 `deactivateForEveryone` 方法。

例如，想象一下你现在对 `new-api` 功能的稳定性充满信心，并为结账流程确定了最佳的 `'purchase-button'` 颜色——你可以相应地更新所有用户的存储值：

```php
use Laravel\Pennant\Feature;

Feature::activateForEveryone('new-api');

Feature::activateForEveryone('purchase-button', 'seafoam-green');
```

或者，你可以为所有用户停用该功能：

```php
Feature::deactivateForEveryone('new-api');
```

> [!NOTE]
> 这只会更新 Pennant 存储驱动已存储的已解析功能值。你还需要更新应用程序中的功能定义。

<a name="purging-features"></a>
### 清除功能

有时，从存储中清除整个功能可能很有用。如果你已从应用程序中移除该功能，或者对功能定义进行了调整并希望向所有用户推出，这通常是必要的。

你可以使用 `purge` 方法移除功能的所有存储值：

```php
// Purging a single feature...
Feature::purge('new-api');

// Purging multiple features...
Feature::purge(['new-api', 'purchase-button']);
```

如果你希望从存储中清除_所有_功能，可以不带任何参数调用 `purge` 方法：

```php
Feature::purge();
```

由于在应用程序的部署流水线中清除功能可能很有用，Pennant 包含一个 `pennant:purge` Artisan 命令，它将从存储中清除提供的功能：

```shell
php artisan pennant:purge new-api

php artisan pennant:purge new-api purchase-button
```

也可以清除_除_给定功能列表中的功能之外的所有功能。例如，想象一下你想要清除所有功能，但保留"new-api"和"purchase-button"功能的值在存储中。为此，你可以将这些功能名称传递给 `--except` 选项：

```shell
php artisan pennant:purge --except=new-api --except=purchase-button
```

为了方便起见，`pennant:purge` 命令还支持 `--except-registered` 标志。此标志表示应清除除在服务提供者中显式注册的功能之外的所有功能：

```shell
php artisan pennant:purge --except-registered
```

<a name="testing"></a>
## 测试

在测试与功能标志交互的代码时，在测试中控制功能标志返回值的最简单方法是简单地重新定义该功能。例如，想象一下你在应用程序的某个服务提供者中定义了以下功能：

```php
use Illuminate\Support\Arr;
use Laravel\Pennant\Feature;

Feature::define('purchase-button', fn () => Arr::random([
    'blue-sapphire',
    'seafoam-green',
    'tart-orange',
]));
```

要修改测试中功能的返回值，你可以在测试开始时重新定义该功能。以下测试将始终通过，即使 `Arr::random()` 实现仍然存在于服务提供者中：

```php tab=Pest
use Laravel\Pennant\Feature;

test('it can control feature values', function () {
    Feature::define('purchase-button', 'seafoam-green');

    expect(Feature::value('purchase-button'))->toBe('seafoam-green');
});
```

```php tab=PHPUnit
use Laravel\Pennant\Feature;

public function test_it_can_control_feature_values()
{
    Feature::define('purchase-button', 'seafoam-green');

    $this->assertSame('seafoam-green', Feature::value('purchase-button'));
}
```

相同的方法可以用于基于类的功能：

```php tab=Pest
use Laravel\Pennant\Feature;

test('it can control feature values', function () {
    Feature::define(NewApi::class, true);

    expect(Feature::value(NewApi::class))->toBeTrue();
});
```

```php tab=PHPUnit
use App\Features\NewApi;
use Laravel\Pennant\Feature;

public function test_it_can_control_feature_values()
{
    Feature::define(NewApi::class, true);

    $this->assertTrue(Feature::value(NewApi::class));
}
```

如果你的功能返回 `Lottery` 实例，有几个有用的[测试辅助工具可用](/docs/{{version}}/helpers#testing-lotteries)。

<a name="store-configuration"></a>
#### 存储配置

你可以通过在应用程序的 `phpunit.xml` 文件中定义 `PENNANT_STORE` 环境变量来配置 Pennant 在测试期间使用的存储：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit colors="true">
    <!-- ... -->
    <php>
        <env name="PENNANT_STORE" value="array"/>
        <!-- ... -->
    </php>
</phpunit>
```

<a name="adding-custom-pennant-drivers"></a>
## 添加自定义 Pennant 驱动

<a name="implementing-the-driver"></a>
#### 实现驱动

如果 Pennant 现有的存储驱动都不适合你的应用程序需求，你可以编写自己的存储驱动。你的自定义驱动应实现 `Laravel\Pennant\Contracts\Driver` 接口：

```php
<?php

namespace App\Extensions;

use Laravel\Pennant\Contracts\Driver;

class RedisFeatureDriver implements Driver
{
    public function define(string $feature, callable $resolver): void {}
    public function defined(): array {}
    public function getAll(array $features): array {}
    public function get(string $feature, mixed $scope): mixed {}
    public function set(string $feature, mixed $scope, mixed $value): void {}
    public function setForAllScopes(string $feature, mixed $value): void {}
    public function delete(string $feature, mixed $scope): void {}
    public function purge(array|null $features): void {}
}
```

现在，我们只需要使用 Redis 连接实现这些方法中的每一个。有关如何实现这些方法的示例，请查看 [Pennant 源代码](https://github.com/laravel/pennant/blob/1.x/src/Drivers/DatabaseDriver.php)中的 `Laravel\Pennant\Drivers\DatabaseDriver`。

> [!NOTE]
> Laravel 没有附带用于放置扩展的目录。你可以自由地将它们放在任何你喜欢的地方。在此示例中，我们创建了一个 `Extensions` 目录来存放 `RedisFeatureDriver`。

<a name="registering-the-driver"></a>
#### 注册驱动

实现驱动的后，你就可以将其注册到 Laravel 中。要向 Pennant 添加其他驱动，你可以使用 `Feature` 门面提供的 `extend` 方法。你应在应用程序的某个[服务提供者](/docs/{{version}}/providers)的 `boot` 方法中调用 `extend` 方法：

```php
<?php

namespace App\Providers;

use App\Extensions\RedisFeatureDriver;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\ServiceProvider;
use Laravel\Pennant\Feature;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // ...
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Feature::extend('redis', function (Application $app) {
            return new RedisFeatureDriver($app->make('redis'), $app->make('events'), []);
        });
    }
}
```

注册驱动后，你可以在应用程序的 `config/pennant.php` 配置文件中使用 `redis` 驱动：

```php
'stores' => [

    'redis' => [
        'driver' => 'redis',
        'connection' => null,
    ],

    // ...

],
```

<a name="defining-features-externally"></a>
### 外部定义功能

如果你的驱动是第三方功能标志平台的包装器，你可能会在平台上定义功能，而不是使用 Pennant 的 `Feature::define` 方法。如果是这种情况，你的自定义驱动还应实现 `Laravel\Pennant\Contracts\DefinesFeaturesExternally` 接口：

```php
<?php

namespace App\Extensions;

use Laravel\Pennant\Contracts\Driver;
use Laravel\Pennant\Contracts\DefinesFeaturesExternally;

class FeatureFlagServiceDriver implements Driver, DefinesFeaturesExternally
{
    /**
     * Get the features defined for the given scope.
     */
    public function definedFeaturesForScope(mixed $scope): array {}

    /* ... */
}
```

`definedFeaturesForScope` 方法应为提供的作用域返回已定义的功能名称列表。

<a name="events"></a>
## 事件

Pennant 会派发各种事件，这些事件在跟踪整个应用程序中的功能标志时可能很有用。

### `Laravel\Pennant\Events\FeatureRetrieved`

此事件在每次[检查功能](#checking-features)时派发。此事件可能有助于创建和跟踪整个应用程序中功能标志使用情况的指标。

### `Laravel\Pennant\Events\FeatureResolved`

此事件在功能的值首次为特定作用域解析时派发。

### `Laravel\Pennant\Events\UnknownFeatureResolved`

此事件在未知功能首次为特定作用域解析时派发。如果你原本打算移除功能标志，但意外地在整个应用程序中留下了对该标志的零散引用，监听此事件可能很有用：

```php
<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Laravel\Pennant\Events\UnknownFeatureResolved;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Event::listen(function (UnknownFeatureResolved $event) {
            Log::error("Resolving unknown feature [{$event->feature}].");
        });
    }
}
```

### `Laravel\Pennant\Events\DynamicallyRegisteringFeatureClass`

此事件在[基于类的功能](#class-based-features)在请求期间首次被动态检查时派发。

### `Laravel\Pennant\Events\UnexpectedNullScopeEncountered`

此事件在将 `null` 作用域传递给[不支持 null](#nullable-scope) 的功能定义时派发。

此情况会优雅地处理，功能将返回 `false`。但是，如果你希望退出此功能的默认优雅行为，可以在应用程序的 `AppServiceProvider` 的 `boot` 方法中为此事件注册一个监听器：

```php
use Illuminate\Support\Facades\Log;
use Laravel\Pennant\Events\UnexpectedNullScopeEncountered;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Event::listen(UnexpectedNullScopeEncountered::class, fn () => abort(500));
}
```

### `Laravel\Pennant\Events\FeatureUpdated`

此事件在更新作用域的功能值时派发，通常是通过调用 `activate` 或 `deactivate`。

### `Laravel\Pennant\Events\FeatureUpdatedForAllScopes`

此事件在更新所有作用域的功能值时派发，通常是通过调用 `activateForEveryone` 或 `deactivateForEveryone`。

### `Laravel\Pennant\Events\FeatureDeleted`

此事件在删除作用域的功能值时派发，通常是通过调用 `forget`。

### `Laravel\Pennant\Events\FeaturesPurged`

此事件在清除特定功能时派发。

### `Laravel\Pennant\Events\AllFeaturesPurged`

此事件在清除所有功能时派发。

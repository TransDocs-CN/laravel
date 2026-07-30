# 服务容器

- [简介](#introduction)
    - [零配置解析](#zero-configuration-resolution)
    - [何时使用容器](#when-to-use-the-container)
- [绑定](#binding)
    - [绑定基础](#binding-basics)
    - [将接口绑定到实现](#binding-interfaces-to-implementations)
    - [上下文绑定](#contextual-binding)
    - [上下文属性](#contextual-attributes)
    - [绑定基本值](#binding-primitives)
    - [绑定类型化可变参数](#binding-typed-variadics)
    - [标签](#tagging)
    - [扩展绑定](#extending-bindings)
- [解析](#resolving)
    - [Make 方法](#the-make-method)
    - [自动注入](#automatic-injection)
- [方法调用与注入](#method-invocation-and-injection)
- [容器事件](#container-events)
    - [重新绑定](#rebinding)
- [PSR-11](#psr-11)

<a name="introduction"></a>
## 简介

Laravel 服务容器是一个强大的工具，用于管理类依赖和执行依赖注入。依赖注入是一个花哨的术语，本质上意味着：类的依赖通过构造函数或在某些情况下通过"setter"方法"注入"到类中。

让我们看一个简单的例子：

```php
<?php

namespace App\Http\Controllers;

use App\Services\AppleMusic;
use Illuminate\View\View;

class PodcastController extends Controller
{
    /**
     * Create a new controller instance.
     */
    public function __construct(
        protected AppleMusic $apple,
    ) {}

    /**
     * Show information about the given podcast.
     */
    public function show(string $id): View
    {
        return view('podcasts.show', [
            'podcast' => $this->apple->findPodcast($id)
        ]);
    }
}
```

在这个例子中，`PodcastController` 需要从数据源（如 Apple Music）中获取播客。因此，我们将**注入**一个能够获取播客的服务。由于服务是通过注入的方式提供的，我们在测试应用程序时可以轻松地"模拟"或创建 `AppleMusic` 服务的虚拟实现。

深入理解 Laravel 服务容器对于构建强大、大型的应用程序以及为 Laravel 核心本身做出贡献至关重要。

<a name="zero-configuration-resolution"></a>
### 零配置解析

如果一个类没有依赖，或者只依赖其他具体类（而非接口），则无需指示容器如何解析该类。例如，你可以将以下代码放在 `routes/web.php` 文件中：

```php
<?php

class Service
{
    // ...
}

Route::get('/', function (Service $service) {
    dd($service::class);
});
```

在这个例子中，访问应用程序的 `/` 路由将自动解析 `Service` 类并将其注入路由的处理程序中。这是革命性的。这意味着你可以在开发应用时利用依赖注入，而无需担心臃肿的配置文件。

幸运的是，在构建 Laravel 应用时，你编写的许多类都会通过容器自动接收其依赖，包括[控制器](/docs/{{version}}/controllers)、[事件监听器](/docs/{{version}}/events)、[中间件](/docs/{{version}}/middleware)等。此外，你可以在[队列任务](/docs/{{version}}/queues)的 `handle` 方法中对依赖进行类型提示。一旦你体验到自动化和零配置依赖注入的强大功能，你会觉得没有它将寸步难行。

<a name="when-to-use-the-container"></a>
### 何时使用容器

由于零配置解析的存在，你经常会在路由、控制器、事件监听器和其他地方对依赖进行类型提示，而无需手动与容器交互。例如，你可以在路由定义中对 `Illuminate\Http\Request` 对象进行类型提示，以便轻松访问当前请求。尽管我们无需与容器交互来编写此代码，但容器会在幕后管理这些依赖的注入：

```php
use Illuminate\Http\Request;

Route::get('/', function (Request $request) {
    // ...
});
```

在许多情况下，得益于自动依赖注入和[门面](/docs/{{version}}/facades)，你可以在构建 Laravel 应用时**完全**无需手动绑定或解析容器中的任何内容。**那么，什么时候需要手动与容器交互？**让我们来看两种情况。

首先，如果你编写了一个实现接口的类，并希望在该接口上对路由或类构造函数进行类型提示，则必须[告诉容器如何解析该接口](#binding-interfaces-to-implementations)。其次，如果你正在[编写一个 Laravel 包](/docs/{{version}}/packages)并打算与其他 Laravel 开发者共享，则可能需要将包的绑定到容器中。

<a name="binding"></a>
## 绑定

<a name="binding-basics"></a>
### 绑定基础

<a name="simple-bindings"></a>
#### 简单绑定

几乎所有的服务容器绑定都将在[服务提供者](/docs/{{version}}/providers)中注册，因此大多数示例将演示在此上下文中使用容器。

在服务提供者中，你始终可以通过 `$this->app` 属性访问容器。我们可以使用 `bind` 方法注册绑定，传入要注册的类或接口名称以及一个返回该类实例的闭包：

```php
use App\Services\Transistor;
use App\Services\PodcastParser;
use Illuminate\Contracts\Foundation\Application;

$this->app->bind(Transistor::class, function (Application $app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

注意，我们将容器本身作为参数传递给解析器。然后我们可以使用容器来解析正在构建的对象的子依赖。

如前所述，你通常会在服务提供者中与容器交互；但是，如果你想在服务提供者之外与容器交互，可以通过 `App` [门面](/docs/{{version}}/facades) 实现：

```php
use App\Services\Transistor;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\Facades\App;

App::bind(Transistor::class, function (Application $app) {
    // ...
});
```

你可以使用 `bindIf` 方法仅在尚未为给定类型注册绑定时才注册容器绑定：

```php
$this->app->bindIf(Transistor::class, function (Application $app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

为方便起见，你可以省略要注册的类或接口名称作为单独的参数，而是让 Laravel 从你提供给 `bind` 方法的闭包的返回类型中推断类型：

```php
App::bind(function (Application $app): Transistor {
    return new Transistor($app->make(PodcastParser::class));
});
```

> [!NOTE]
> 如果类不依赖任何接口，则无需将其绑定到容器。容器不需要被告知如何构建这些对象，因为它可以使用反射自动解析这些对象。

<a name="binding-a-singleton"></a>
#### 绑定单例

`singleton` 方法将类或接口绑定到容器中，使其只被解析一次。一旦解析了单例绑定，后续对容器的调用将返回同一个对象实例：

```php
use App\Services\Transistor;
use App\Services\PodcastParser;
use Illuminate\Contracts\Foundation\Application;

$this->app->singleton(Transistor::class, function (Application $app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

你可以使用 `singletonIf` 方法仅在尚未为给定类型注册绑定时才注册单例容器绑定：

```php
$this->app->singletonIf(Transistor::class, function (Application $app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

<a name="singleton-attribute"></a>
#### Singleton 属性

或者，你可以用 `#[Singleton]` 属性标记一个接口或类，以指示容器它应只被解析一次：

```php
<?php

namespace App\Services;

use Illuminate\Container\Attributes\Singleton;

#[Singleton]
class Transistor
{
    // ...
}
```

<a name="binding-scoped"></a>
#### 绑定作用域单例

`scoped` 方法将类或接口绑定到容器中，使其在给定的 Laravel 请求/任务生命周期内只被解析一次。虽然此方法与 `singleton` 方法类似，但使用 `scoped` 方法注册的实例将在 Laravel 应用启动新的"生命周期"时被清除，例如当 [Laravel Octane](/docs/{{version}}/octane) 工作进程处理新请求或 [队列工作进程](/docs/{{version}}/queues) 处理新任务时：

```php
use App\Services\Transistor;
use App\Services\PodcastParser;
use Illuminate\Contracts\Foundation\Application;

$this->app->scoped(Transistor::class, function (Application $app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

你可以使用 `scopedIf` 方法仅在尚未为给定类型注册绑定时才注册作用域容器绑定：

```php
$this->app->scopedIf(Transistor::class, function (Application $app) {
    return new Transistor($app->make(PodcastParser::class));
});
```

<a name="scoped-attribute"></a>
#### Scoped 属性

或者，你可以用 `#[Scoped]` 属性标记一个接口或类，以指示容器它应在给定的 Laravel 请求/任务生命周期内只被解析一次：

```php
<?php

namespace App\Services;

use Illuminate\Container\Attributes\Scoped;

#[Scoped]
class Transistor
{
    // ...
}
```

<a name="binding-instances"></a>
#### 绑定实例

你也可以使用 `instance` 方法将现有对象实例绑定到容器中。后续对容器的调用将始终返回给定的实例：

```php
use App\Services\Transistor;
use App\Services\PodcastParser;

$service = new Transistor(new PodcastParser);

$this->app->instance(Transistor::class, $service);
```

<a name="binding-interfaces-to-implementations"></a>
### 将接口绑定到实现

服务容器的一个非常强大的功能是能够将接口绑定到给定的实现。例如，假设我们有一个 `EventPusher` 接口和一个 `RedisEventPusher` 实现。一旦我们编写了此接口的 `RedisEventPusher` 实现，就可以像这样在服务容器中注册它：

```php
use App\Contracts\EventPusher;
use App\Services\RedisEventPusher;

$this->app->bind(EventPusher::class, RedisEventPusher::class);
```

这个语句告诉容器，当类需要 `EventPusher` 的实现时，它应注入 `RedisEventPusher`。现在我们可以在由容器解析的类的构造函数中对 `EventPusher` 接口进行类型提示。请记住，控制器、事件监听器、中间件以及 Laravel 应用中的各种其他类型的类始终使用容器进行解析：

```php
use App\Contracts\EventPusher;

/**
 * Create a new class instance.
 */
public function __construct(
    protected EventPusher $pusher,
) {}
```

<a name="bind-attribute"></a>
#### Bind 属性

Laravel 还提供了一个 `Bind` 属性以增加便利。你可以将此属性应用于任何接口，告诉 Laravel 当请求该接口时应自动注入哪个实现。使用 `Bind` 属性时，无需在应用程序的服务提供者中执行任何额外的服务注册。

此外，可以在接口上放置多个 `Bind` 属性，以便为给定的环境集合配置不同的注入实现：

```php
<?php

namespace App\Contracts;

use App\Services\FakeEventPusher;
use App\Services\RedisEventPusher;
use Illuminate\Container\Attributes\Bind;

#[Bind(RedisEventPusher::class)]
#[Bind(FakeEventPusher::class, environments: ['local', 'testing'])]
interface EventPusher
{
    // ...
}
```

此外，可以应用 [Singleton](#singleton-attribute) 和 [Scoped](#scoped-attribute) 属性来指示容器绑定是否应解析一次或每次请求/任务生命周期解析一次：

```php
use App\Services\RedisEventPusher;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Container\Attributes\Singleton;

#[Bind(RedisEventPusher::class)]
#[Singleton]
interface EventPusher
{
    // ...
}
```

<a name="contextual-binding"></a>
### 上下文绑定

有时你可能有两个使用相同接口的类，但希望向每个类注入不同的实现。例如，两个控制器可能依赖于 `Illuminate\Contracts\Filesystem\Filesystem` [契约](/docs/{{version}}/contracts) 的不同实现。Laravel 提供了一个简单流畅的接口来定义这种行为：

```php
use App\Http\Controllers\PhotoController;
use App\Http\Controllers\UploadController;
use App\Http\Controllers\VideoController;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Storage;

$this->app->when(PhotoController::class)
    ->needs(Filesystem::class)
    ->give(function () {
        return Storage::disk('local');
    });

$this->app->when([VideoController::class, UploadController::class])
    ->needs(Filesystem::class)
    ->give(function () {
        return Storage::disk('s3');
    });
```

<a name="contextual-attributes"></a>
### 上下文属性

由于上下文绑定通常用于注入驱动程序或配置值的实现，Laravel 提供了各种上下文绑定属性，允许你注入这些类型的值，而无需在服务提供者中手动定义上下文绑定。

例如，`Storage` 属性可用于注入特定的[存储磁盘](/docs/{{version}}/filesystem)：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Container\Attributes\Storage;
use Illuminate\Contracts\Filesystem\Filesystem;

class PhotoController extends Controller
{
    public function __construct(
        #[Storage('local')] protected Filesystem $filesystem
    ) {
        // ...
    }
}
```

除了 `Storage` 属性外，Laravel 还提供了 `Auth`、`Cache`、`Config`、`Context`、`DB`、`Give`、`Log`、`RequestAttribute`、`RouteParameter` 和 [Tag](#tagging) 属性：

```php
<?php

namespace App\Http\Controllers;

use App\Contracts\UserRepository;
use App\Models\Organization;
use App\Models\Photo;
use App\Repositories\DatabaseRepository;
use Illuminate\Container\Attributes\Auth;
use Illuminate\Container\Attributes\Cache;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\Context;
use Illuminate\Container\Attributes\DB;
use Illuminate\Container\Attributes\Give;
use Illuminate\Container\Attributes\Log;
use Illuminate\Container\Attributes\RequestAttribute;
use Illuminate\Container\Attributes\RouteParameter;
use Illuminate\Container\Attributes\Tag;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Database\Connection;
use Psr\Log\LoggerInterface;

class PhotoController extends Controller
{
    public function __construct(
        #[Auth('web')] protected Guard $auth,
        #[Cache('redis')] protected Repository $cache,
        #[Config('app.timezone')] protected string $timezone,
        #[Context('uuid')] protected string $uuid,
        #[Context('ulid', hidden: true)] protected string $ulid,
        #[DB('mysql')] protected Connection $connection,
        #[Give(DatabaseRepository::class)] protected UserRepository $users,
        #[Log('daily')] protected LoggerInterface $log,
        #[RequestAttribute('organization')] protected Organization $organization,
        #[RouteParameter] protected Photo $photo,
        #[Tag('reports')] protected iterable $reports,
    ) {
        // ...
    }
}
```

`RouteParameter` 属性将解析与变量名称匹配的路由参数。如果需要，你可以显式指定路由参数名称：`#[RouteParameter('photo')]`。

`RequestAttribute` 属性将解析当前请求的[属性包](https://symfony.com/doc/current/components/http_foundation.html#accessing-request-data)中指定键下的值：`#[RequestAttribute('organization')]`。

此外，Laravel 提供了一个 `CurrentUser` 属性，用于将当前经过身份验证的用户注入到给定的路由或类中：

```php
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;

Route::get('/user', function (#[CurrentUser] User $user) {
    return $user;
})->middleware('auth');
```

<a name="defining-custom-attributes"></a>
#### 定义自定义属性

你可以通过实现 `Illuminate\Contracts\Container\ContextualAttribute` 契约来创建自己的上下文属性。容器将调用你的属性的 `resolve` 方法，该方法应解析要注入到使用该属性的类中的值。在下面的示例中，我们将重新实现 Laravel 内置的 `Config` 属性：

```php
<?php

namespace App\Attributes;

use Attribute;
use Illuminate\Contracts\Container\Container;
use Illuminate\Contracts\Container\ContextualAttribute;
use ReflectionParameter;

#[Attribute(Attribute::TARGET_PARAMETER)]
class Config implements ContextualAttribute
{
    /**
     * Create a new attribute instance.
     */
    public function __construct(public string $key, public mixed $default = null)
    {
    }

    /**
     * Resolve the configuration value.
     *
     * @param  self  $attribute
     * @param  \Illuminate\Contracts\Container\Container  $container
     * @param  \ReflectionParameter  $parameter
     * @return mixed
     */
    public static function resolve(self $attribute, Container $container, ReflectionParameter $parameter)
    {
        return $container->make('config')->get($attribute->key, $attribute->default);
    }
}
```

<a name="binding-primitives"></a>
### 绑定基本值

有时你可能有一个类接收一些注入的类，但同时需要一个注入的基本值，如整数。你可以轻松地使用上下文绑定来注入你的类可能需要的任何值：

```php
use App\Http\Controllers\UserController;

$this->app->when(UserController::class)
    ->needs('$variableName')
    ->give($value);
```

有时一个类可能依赖一个[标签](#tagging)实例的数组。使用 `giveTagged` 方法，你可以轻松地注入所有具有该标签的容器绑定：

```php
$this->app->when(ReportAggregator::class)
    ->needs('$reports')
    ->giveTagged('reports');
```

如果你需要从应用程序的配置文件中注入一个值，可以使用 `giveConfig` 方法：

```php
$this->app->when(ReportAggregator::class)
    ->needs('$timezone')
    ->giveConfig('app.timezone');
```

<a name="binding-typed-variadics"></a>
### 绑定类型化可变参数

有时，你可能有一个类使用可变构造函数参数接收一个类型化对象数组：

```php
<?php

use App\Models\Filter;
use App\Services\Logger;

class Firewall
{
    /**
     * The filter instances.
     *
     * @var array
     */
    protected $filters;

    /**
     * Create a new class instance.
     */
    public function __construct(
        protected Logger $logger,
        Filter ...$filters,
    ) {
        $this->filters = $filters;
    }
}
```

使用上下文绑定，你可以通过向 `give` 方法提供一个返回已解析 `Filter` 实例数组的闭包来解析此依赖：

```php
$this->app->when(Firewall::class)
    ->needs(Filter::class)
    ->give(function (Application $app) {
          return [
              $app->make(NullFilter::class),
              $app->make(ProfanityFilter::class),
              $app->make(TooLongFilter::class),
          ];
    });
```

为方便起见，你也可以只提供一个类名数组，当 `Firewall` 需要 `Filter` 实例时将自动由容器解析：

```php
$this->app->when(Firewall::class)
    ->needs(Filter::class)
    ->give([
        NullFilter::class,
        ProfanityFilter::class,
        TooLongFilter::class,
    ]);
```

<a name="variadic-tag-dependencies"></a>
#### 可变标签依赖

有时一个类可能有一个可变依赖，其类型提示为给定的类（`Report ...$reports`）。使用 `needs` 和 `giveTagged` 方法，你可以轻松地为给定的依赖注入所有具有该[标签](#tagging)的容器绑定：

```php
$this->app->when(ReportAggregator::class)
    ->needs(Report::class)
    ->giveTagged('reports');
```

<a name="tagging"></a>
### 标签

有时你可能需要解析某个"类别"的所有绑定。例如，你可能正在构建一个报告分析器，它接收许多不同 `Report` 接口实现的数组。注册 `Report` 实现后，你可以使用 `tag` 方法为它们分配一个标签：

```php
$this->app->bind(CpuReport::class, function () {
    // ...
});

$this->app->bind(MemoryReport::class, function () {
    // ...
});

$this->app->tag([CpuReport::class, MemoryReport::class], 'reports');
```

服务被标记后，你可以通过容器的 `tagged` 方法轻松解析它们：

```php
$this->app->bind(ReportAnalyzer::class, function (Application $app) {
    return new ReportAnalyzer($app->tagged('reports'));
});
```

<a name="extending-bindings"></a>
### 扩展绑定

`extend` 方法允许修改已解析的服务。例如，当服务被解析时，你可以运行额外的代码来装饰或配置该服务。`extend` 方法接受两个参数：你要扩展的服务类和一个应返回修改后服务的闭包。该闭包接收正在被解析的服务和容器实例：

```php
$this->app->extend(Service::class, function (Service $service, Application $app) {
    return new DecoratedService($service);
});
```

<a name="resolving"></a>
## 解析

<a name="the-make-method"></a>
### `make` 方法

你可以使用 `make` 方法从容器中解析类实例。`make` 方法接受你要解析的类或接口的名称：

```php
use App\Services\Transistor;

$transistor = $this->app->make(Transistor::class);
```

如果你的类的某些依赖无法通过容器解析，你可以通过将它们作为关联数组传递给 `makeWith` 方法来注入它们。例如，我们可以手动传递 `Transistor` 服务所需的 `$id` 构造函数参数：

```php
use App\Services\Transistor;

$transistor = $this->app->makeWith(Transistor::class, ['id' => 1]);
```

`bound` 方法可用于确定类或接口是否已在容器中显式绑定：

```php
if ($this->app->bound(Transistor::class)) {
    // ...
}
```

如果你在服务提供者之外的代码位置，无法访问 `$app` 变量，你可以使用 `App` [门面](/docs/{{version}}/facades) 或 `app` [辅助函数](/docs/{{version}}/helpers#method-app) 来从容器中解析类实例：

```php
use App\Services\Transistor;
use Illuminate\Support\Facades\App;

$transistor = App::make(Transistor::class);

$transistor = app(Transistor::class);
```

如果你希望将 Laravel 容器实例本身注入到正在被容器解析的类中，你可以在类的构造函数中对 `Illuminate\Container\Container` 类进行类型提示：

```php
use Illuminate\Container\Container;

/**
 * Create a new class instance.
 */
public function __construct(
    protected Container $container,
) {}
```

<a name="automatic-injection"></a>
### 自动注入

另外，也是很重要的一点，你可以在由容器解析的类的构造函数中对依赖进行类型提示，包括[控制器](/docs/{{version}}/controllers)、[事件监听器](/docs/{{version}}/events)、[中间件](/docs/{{version}}/middleware)等。此外，你可以在[队列任务](/docs/{{version}}/queues)的 `handle` 方法中对依赖进行类型提示。实际上，这是大多数对象应该由容器解析的方式。

例如，你可以在控制器的构造函数中对应用程序定义的服务进行类型提示。该服务将自动被解析并注入到类中：

```php
<?php

namespace App\Http\Controllers;

use App\Services\AppleMusic;

class PodcastController extends Controller
{
    /**
     * Create a new controller instance.
     */
    public function __construct(
        protected AppleMusic $apple,
    ) {}

    /**
     * Show information about the given podcast.
     */
    public function show(string $id): Podcast
    {
        return $this->apple->findPodcast($id);
    }
}
```

<a name="method-invocation-and-injection"></a>
## 方法调用与注入

有时你可能希望调用对象实例上的方法，同时让容器自动注入该方法的依赖。例如，给定以下类：

```php
<?php

namespace App;

use App\Services\AppleMusic;

class PodcastStats
{
    /**
     * Generate a new podcast stats report.
     */
    public function generate(AppleMusic $apple): array
    {
        return [
            // ...
        ];
    }
}
```

你可以通过容器调用 `generate` 方法，如下所示：

```php
use App\PodcastStats;
use Illuminate\Support\Facades\App;

$stats = App::call([new PodcastStats, 'generate']);
```

`call` 方法接受任何 PHP 可调用对象。容器的 `call` 方法甚至可用于调用闭包，同时自动注入其依赖：

```php
use App\Services\AppleMusic;
use Illuminate\Support\Facades\App;

$result = App::call(function (AppleMusic $apple) {
    // ...
});
```

<a name="container-events"></a>
## 容器事件

服务容器在每次解析对象时都会触发一个事件。你可以使用 `resolving` 方法监听此事件：

```php
use App\Services\Transistor;
use Illuminate\Contracts\Foundation\Application;

$this->app->resolving(Transistor::class, function (Transistor $transistor, Application $app) {
    // Called when container resolves objects of type "Transistor"...
});

$this->app->resolving(function (mixed $object, Application $app) {
    // Called when container resolves object of any type...
});
```

如你所见，正在被解析的对象将传递给回调，允许你在将其交给使用者之前设置任何额外的属性。

<a name="rebinding"></a>
### 重新绑定

`rebinding` 方法允许你监听服务被重新绑定到容器的情况，即在其初始绑定之后被重新注册或覆盖。当每次特定绑定被更新时你需要更新依赖或修改行为时，这非常有用：

```php
use App\Contracts\PodcastPublisher;
use App\Services\SpotifyPublisher;
use App\Services\TransistorPublisher;
use Illuminate\Contracts\Foundation\Application;

$this->app->bind(PodcastPublisher::class, SpotifyPublisher::class);

$this->app->rebinding(
    PodcastPublisher::class,
    function (Application $app, PodcastPublisher $newInstance) {
        //
    },
);

// New binding will trigger rebinding closure...
$this->app->bind(PodcastPublisher::class, TransistorPublisher::class);
```

<a name="psr-11"></a>
## PSR-11

Laravel 的服务容器实现了 [PSR-11](https://github.com/php-fig/fig-standards/blob/master/accepted/PSR-11-container.md) 接口。因此，你可以对 PSR-11 容器接口进行类型提示来获取 Laravel 容器的实例：

```php
use App\Services\Transistor;
use Psr\Container\ContainerInterface;

Route::get('/', function (ContainerInterface $container) {
    $service = $container->get(Transistor::class);

    // ...
});
```

如果给定的标识符无法解析，将抛出异常。如果标识符从未被绑定，异常将是 `Psr\Container\NotFoundExceptionInterface` 的实例。如果标识符已被绑定但无法解析，将抛出 `Psr\Container\ContainerExceptionInterface` 的实例。

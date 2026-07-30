# 服务提供者

- [简介](#introduction)
- [编写服务提供者](#writing-service-providers)
    - [Register 方法](#the-register-method)
    - [Boot 方法](#the-boot-method)
- [注册提供者](#registering-providers)
- [延迟提供者](#deferred-providers)

<a name="introduction"></a>
## 简介

服务提供者是所有 Laravel 应用程序引导的中心位置。你自己的应用程序以及所有 Laravel 核心服务都是通过服务提供者引导的。

但是，"引导"是什么意思呢？总的来说，我们指的是**注册**事物，包括注册服务容器绑定、事件监听器、中间件甚至路由。服务提供者是配置应用程序的中心位置。

Laravel 内部使用数十个服务提供者来引导其核心服务，例如邮件、队列、缓存等。其中许多提供者是"延迟"提供者，这意味着它们不会在每个请求上加载，而只在实际需要它们提供的服务时才会加载。

所有用户定义的服务提供者都在 `bootstrap/providers.php` 文件中注册。在接下来的文档中，你将学习如何编写自己的服务提供者并在 Laravel 应用程序中注册它们。

> [!NOTE]
> 如果你想了解更多关于 Laravel 如何处理请求以及内部工作方式的信息，请查看我们关于 Laravel [请求生命周期](/docs/{{version}}/lifecycle)的文档。

<a name="writing-service-providers"></a>
## 编写服务提供者

所有服务提供者都扩展了 `Illuminate\Support\ServiceProvider` 类。大多数服务提供者包含 `register` 和 `boot` 方法。在 `register` 方法中，你应该**只将内容绑定到[服务容器](/docs/{{version}}/container)**。你绝不应尝试在 `register` 方法中注册任何事件监听器、路由或任何其他功能。

Artisan CLI 可以通过 `make:provider` 命令生成新的提供者。Laravel 将自动在你的应用程序的 `bootstrap/providers.php` 文件中注册你的新提供者：

```shell
php artisan make:provider RiakServiceProvider
```

<a name="the-register-method"></a>
### Register 方法

如前所述，在 `register` 方法中，你应该只将内容绑定到[服务容器](/docs/{{version}}/container)。你绝不应尝试在 `register` 方法中注册任何事件监听器、路由或任何其他功能。否则，你可能会意外使用一个尚未加载的服务提供者提供的服务。

让我们看一个基本的服务提供者。在你的任何服务提供者方法中，你始终可以访问 `$app` 属性，该属性提供对服务容器的访问：

```php
<?php

namespace App\Providers;

use App\Services\Riak\Connection;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\ServiceProvider;

class RiakServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(Connection::class, function (Application $app) {
            return new Connection(config('riak'));
        });
    }
}
```

这个服务提供者只定义了一个 `register` 方法，并使用该方法在服务容器中定义了 `App\Services\Riak\Connection` 的实现。如果你还不熟悉 Laravel 的服务容器，请查看[其文档](/docs/{{version}}/container)。

<a name="the-bindings-and-singletons-properties"></a>
#### `bindings` 和 `singletons` 属性

如果你的服务提供者注册了许多简单的绑定，你可能希望使用 `bindings` 和 `singletons` 属性，而不是手动注册每个容器绑定。当服务提供者被框架加载时，它将自动检查这些属性并注册它们的绑定：

```php
<?php

namespace App\Providers;

use App\Contracts\DowntimeNotifier;
use App\Contracts\ServerProvider;
use App\Services\DigitalOceanServerProvider;
use App\Services\PingdomDowntimeNotifier;
use App\Services\ServerToolsProvider;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * All of the container bindings that should be registered.
     *
     * @var array
     */
    public $bindings = [
        ServerProvider::class => DigitalOceanServerProvider::class,
    ];

    /**
     * All of the container singletons that should be registered.
     *
     * @var array
     */
    public $singletons = [
        DowntimeNotifier::class => PingdomDowntimeNotifier::class,
        ServerProvider::class => ServerToolsProvider::class,
    ];
}
```

<a name="the-boot-method"></a>
### Boot 方法

那么，如果我们需要在服务提供者中注册一个[视图组合器](/docs/{{version}}/views#view-composers)呢？这应该在 `boot` 方法中完成。**此方法在所有其他服务提供者注册后被调用**，这意味着你可以访问框架已注册的所有其他服务：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class ComposerServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        View::composer('view', function () {
            // ...
        });
    }
}
```

<a name="boot-method-dependency-injection"></a>
#### Boot 方法依赖注入

你可以对服务提供者的 `boot` 方法的依赖进行类型提示。[服务容器](/docs/{{version}}/container)将自动注入你需要的任何依赖：

```php
use Illuminate\Contracts\Routing\ResponseFactory;

/**
 * Bootstrap any application services.
 */
public function boot(ResponseFactory $response): void
{
    $response->macro('serialized', function (mixed $value) {
        // ...
    });
}
```

<a name="registering-providers"></a>
## 注册提供者

所有服务提供者都在 `bootstrap/providers.php` 配置文件中注册。此文件返回一个包含应用程序服务提供者类名的数组：

```php
<?php

return [
    App\Providers\AppServiceProvider::class,
];
```

当你调用 `make:provider` Artisan 命令时，Laravel 将自动将生成的提供者添加到 `bootstrap/providers.php` 文件中。但是，如果你手动创建了提供者类，则应手动将提供者类添加到数组中：

```php
<?php

return [
    App\Providers\AppServiceProvider::class,
    App\Providers\ComposerServiceProvider::class, // [tl! add]
];
```

<a name="deferred-providers"></a>
## 延迟提供者

如果你的提供者**只**在[服务容器](/docs/{{version}}/container)中注册绑定，你可以选择延迟其注册，直到实际需要其中一个注册的绑定。延迟加载此类提供者将提高应用程序的性能，因为它不会在每个请求上都从文件系统加载。

Laravel 编译并存储延迟服务提供者提供的所有服务列表以及其服务提供者类的名称。然后，只有在你尝试解析其中一个服务时，Laravel 才会加载该服务提供者。

要延迟提供者的加载，请实现 `\Illuminate\Contracts\Support\DeferrableProvider` 接口并定义一个 `provides` 方法。`provides` 方法应返回该提供者注册的服务容器绑定：

```php
<?php

namespace App\Providers;

use App\Services\Riak\Connection;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Contracts\Support\DeferrableProvider;
use Illuminate\Support\ServiceProvider;

class RiakServiceProvider extends ServiceProvider implements DeferrableProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(Connection::class, function (Application $app) {
            return new Connection($app['config']['riak']);
        });
    }

    /**
     * Get the services provided by the provider.
     *
     * @return array<int, string>
     */
    public function provides(): array
    {
        return [Connection::class];
    }
}
```

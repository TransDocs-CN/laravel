# 门面

- [简介](#introduction)
- [何时使用门面](#when-to-use-facades)
    - [门面 vs. 依赖注入](#facades-vs-dependency-injection)
    - [门面 vs. 辅助函数](#facades-vs-helper-functions)
- [门面的工作原理](#how-facades-work)
- [实时门面](#real-time-facades)
- [门面类参考](#facade-class-reference)

<a name="introduction"></a>
## 简介

在整个 Laravel 文档中，你将看到通过"门面"与 Laravel 功能交互的代码示例。门面为应用程序[服务容器](/docs/{{version}}/container)中可用的类提供了"静态"接口。Laravel 附带了许多门面，提供对几乎所有 Laravel 功能的访问。

Laravel 门面充当服务容器中底层类的"静态代理"，提供了简洁、富有表现力的语法，同时保持了比传统静态方法更高的可测试性和灵活性。如果你不完全理解门面的工作原理，这完全没问题——只管继续学习 Laravel。

所有 Laravel 门面都定义在 `Illuminate\Support\Facades` 命名空间中。因此，我们可以轻松地访问门面：

```php
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Route;

Route::get('/cache', function () {
    return Cache::get('key');
});
```

在整个 Laravel 文档中，许多示例将使用门面来演示框架的各种功能。

<a name="helper-functions"></a>
#### 辅助函数

为了补充门面，Laravel 提供了各种全局"辅助函数"，使与常见 Laravel 功能的交互更加容易。你可能会接触到的一些常见辅助函数有 `view`、`response`、`url`、`config` 等。Laravel 提供的每个辅助函数都有其相应功能的文档说明；然而，完整的列表可在专门的[辅助函数文档](/docs/{{version}}/helpers)中找到。

例如，我们可以直接使用 `response` 函数，而不是使用 `Illuminate\Support\Facades\Response` 门面来生成 JSON 响应。由于辅助函数是全局可用的，你无需导入任何类即可使用它们：

```php
use Illuminate\Support\Facades\Response;

Route::get('/users', function () {
    return Response::json([
        // ...
    ]);
});

Route::get('/users', function () {
    return response()->json([
        // ...
    ]);
});
```

<a name="when-to-use-facades"></a>
## 何时使用门面

门面有许多好处。它们提供简洁、易记的语法，让你无需记住需要手动注入或配置的长类名即可使用 Laravel 的功能。此外，由于它们独特地使用了 PHP 的动态方法，它们易于测试。

然而，使用门面时需要谨慎。门面的主要危险是类的"范围蔓延"。由于门面非常易用且不需要注入，很容易让你的类不断增长，并在一个类中使用许多门面。使用依赖注入时，大型构造函数的视觉反馈会提醒你类变得过大，从而减轻这种可能性。因此，在使用门面时，要特别注意类的大小，使其职责范围保持狭窄。如果你的类变得过大，考虑将其拆分为多个较小的类。

<a name="facades-vs-dependency-injection"></a>
### 门面 vs. 依赖注入

依赖注入的主要好处之一是能够替换注入类的实现。这在测试时非常有用，因为你可以注入模拟或桩件，并断言在桩件上调用了各种方法。

通常，不可能模拟或桩件一个真正的静态类方法。然而，由于门面使用动态方法将对方法的调用代理到从服务容器解析的对象上，我们实际上可以像测试注入的类实例一样测试门面。例如，给定以下路由：

```php
use Illuminate\Support\Facades\Cache;

Route::get('/cache', function () {
    return Cache::get('key');
});
```

使用 Laravel 的门面测试方法，我们可以编写以下测试来验证 `Cache::get` 方法已按照我们期望的参数被调用：

```php tab=Pest
use Illuminate\Support\Facades\Cache;

test('basic example', function () {
    Cache::shouldReceive('get')
        ->with('key')
        ->andReturn('value');

    $response = $this->get('/cache');

    $response->assertSee('value');
});
```

```php tab=PHPUnit
use Illuminate\Support\Facades\Cache;

/**
 * A basic functional test example.
 */
public function test_basic_example(): void
{
    Cache::shouldReceive('get')
        ->with('key')
        ->andReturn('value');

    $response = $this->get('/cache');

    $response->assertSee('value');
}
```

<a name="facades-vs-helper-functions"></a>
### 门面 vs. 辅助函数

除了门面，Laravel 还包含各种"辅助"函数，可以执行常见任务，如生成视图、触发事件、分派任务或发送 HTTP 响应。这些辅助函数中的许多执行与相应门面相同的功能。例如，这个门面调用和辅助函数调用是等效的：

```php
return Illuminate\Support\Facades\View::make('profile');

return view('profile');
```

门面和辅助函数之间完全没有实际区别。使用辅助函数时，你仍然可以像测试相应的门面一样测试它们。例如，给定以下路由：

```php
Route::get('/cache', function () {
    return cache('key');
});
```

`cache` 辅助函数将调用 `Cache` 门面底层类的 `get` 方法。因此，即使我们使用的是辅助函数，我们也可以编写以下测试来验证该方法已按照我们期望的参数被调用：

```php
use Illuminate\Support\Facades\Cache;

/**
 * A basic functional test example.
 */
public function test_basic_example(): void
{
    Cache::shouldReceive('get')
        ->with('key')
        ->andReturn('value');

    $response = $this->get('/cache');

    $response->assertSee('value');
}
```

<a name="how-facades-work"></a>
## 门面的工作原理

在 Laravel 应用程序中，门面是一个提供对容器中对象访问的类。实现这一机制的底层代码在 `Facade` 类中。Laravel 的门面以及你创建的任何自定义门面都将扩展基础类 `Illuminate\Support\Facades\Facade`。

`Facade` 基类利用 `__callStatic()` 魔术方法将对门面的调用推迟到从容器解析的对象上。在下面的示例中，我们对 Laravel 缓存系统进行了调用。看一眼这段代码，可能会认为静态的 `get` 方法是在 `Cache` 类上调用的：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Cache;
use Illuminate\View\View;

class UserController extends Controller
{
    /**
     * Show the profile for the given user.
     */
    public function showProfile(string $id): View
    {
        $user = Cache::get('user:'.$id);

        return view('profile', ['user' => $user]);
    }
}
```

注意，在文件顶部附近我们"导入"了 `Cache` 门面。这个门面充当访问 `Illuminate\Contracts\Cache\Factory` 接口底层实现的代理。我们使用门面进行的任何调用都将传递给 Laravel 缓存服务的底层实例。

如果我们查看 `Illuminate\Support\Facades\Cache` 类，你会发现没有静态的 `get` 方法：

```php
class Cache extends Facade
{
    /**
     * Get the registered name of the component.
     */
    protected static function getFacadeAccessor(): string
    {
        return 'cache';
    }
}
```

相反，`Cache` 门面扩展了基础 `Facade` 类并定义了 `getFacadeAccessor()` 方法。这个方法的职责是返回服务容器绑定的名称。当用户引用 `Cache` 门面上的任何静态方法时，Laravel 会从[服务容器](/docs/{{version}}/container)中解析 `cache` 绑定，并针对该对象运行请求的方法（在本例中是 `get`）。

<a name="real-time-facades"></a>
## 实时门面

使用实时门面，你可以将应用程序中的任何类当作门面来使用。为了说明如何使用，让我们首先检查一些不使用实时门面的代码。例如，假设我们的 `Podcast` 模型有一个 `publish` 方法。但是，为了发布播客，我们需要注入一个 `Publisher` 实例：

```php
<?php

namespace App\Models;

use App\Contracts\Publisher;
use Illuminate\Database\Eloquent\Model;

class Podcast extends Model
{
    /**
     * Publish the podcast.
     */
    public function publish(Publisher $publisher): void
    {
        $this->update(['publishing' => now()]);

        $publisher->publish($this);
    }
}
```

将发布者实现注入方法允许我们轻松地隔离测试该方法，因为我们可以模拟注入的发布者。然而，它要求我们每次调用 `publish` 方法时都传递一个发布者实例。使用实时门面，我们可以保持相同的可测试性，同时无需显式传递 `Publisher` 实例。要生成实时门面，请在导入的类命名空间前加上 `Facades`：

```php
<?php

namespace App\Models;

use App\Contracts\Publisher; // [tl! remove]
use Facades\App\Contracts\Publisher; // [tl! add]
use Illuminate\Database\Eloquent\Model;

class Podcast extends Model
{
    /**
     * Publish the podcast.
     */
    public function publish(Publisher $publisher): void // [tl! remove]
    public function publish(): void // [tl! add]
    {
        $this->update(['publishing' => now()]);

        $publisher->publish($this); // [tl! remove]
        Publisher::publish($this); // [tl! add]
    }
}
```

当使用实时门面时，发布者实现将使用接口或类名称中出现在 `Facades` 前缀之后的部分从服务容器中解析。测试时，我们可以使用 Laravel 内置的门面测试辅助函数来模拟此方法调用：

```php tab=Pest
<?php

use App\Models\Podcast;
use Facades\App\Contracts\Publisher;
use Illuminate\Foundation\Testing\RefreshDatabase;

pest()->use(RefreshDatabase::class);

test('podcast can be published', function () {
    $podcast = Podcast::factory()->create();

    Publisher::shouldReceive('publish')->once()->with($podcast);

    $podcast->publish();
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use App\Models\Podcast;
use Facades\App\Contracts\Publisher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PodcastTest extends TestCase
{
    use RefreshDatabase;

    /**
     * A test example.
     */
    public function test_podcast_can_be_published(): void
    {
        $podcast = Podcast::factory()->create();

        Publisher::shouldReceive('publish')->once()->with($podcast);

        $podcast->publish();
    }
}
```

<a name="facade-class-reference"></a>
## 门面类参考

下面你将找到每个门面及其底层类。这是一个快速查阅给定门面根部的 API 文档的有用工具。在适用的情况下也包含了[服务容器绑定](/docs/{{version}}/container)键。

<div class="overflow-auto">

| 门面 | 类 | 服务容器绑定 |
| --- | --- | --- |
| App | [Illuminate\Foundation\Application](https://api.laravel.com/docs/{{version}}/Illuminate/Foundation/Application.html) | `app` |
| Artisan | [Illuminate\Contracts\Console\Kernel](https://api.laravel.com/docs/{{version}}/Illuminate/Contracts/Console/Kernel.html) | `artisan` |
| Auth (实例) | [Illuminate\Contracts\Auth\Guard](https://api.laravel.com/docs/{{version}}/Illuminate/Contracts/Auth/Guard.html) | `auth.driver` |
| Auth | [Illuminate\Auth\AuthManager](https://api.laravel.com/docs/{{version}}/Illuminate/Auth/AuthManager.html) | `auth` |
| Blade | [Illuminate\View\Compilers\BladeCompiler](https://api.laravel.com/docs/{{version}}/Illuminate/View/Compilers/BladeCompiler.html) | `blade.compiler` |
| Broadcast (实例) | [Illuminate\Contracts\Broadcasting\Broadcaster](https://api.laravel.com/docs/{{version}}/Illuminate/Contracts/Broadcasting/Broadcaster.html) | &nbsp; |
| Broadcast | [Illuminate\Contracts\Broadcasting\Factory](https://api.laravel.com/docs/{{version}}/Illuminate/Contracts/Broadcasting/Factory.html) | &nbsp; |
| Bus | [Illuminate\Contracts\Bus\Dispatcher](https://api.laravel.com/docs/{{version}}/Illuminate/Contracts/Bus/Dispatcher.html) | &nbsp; |
| Cache (实例) | [Illuminate\Cache\Repository](https://api.laravel.com/docs/{{version}}/Illuminate/Cache/Repository.html) | `cache.store` |
| Cache | [Illuminate\Cache\CacheManager](https://api.laravel.com/docs/{{version}}/Illuminate/Cache/CacheManager.html) | `cache` |
| Config | [Illuminate\Config\Repository](https://api.laravel.com/docs/{{version}}/Illuminate/Config/Repository.html) | `config` |
| Context | [Illuminate\Log\Context\Repository](https://api.laravel.com/docs/{{version}}/Illuminate/Log/Context/Repository.html) | &nbsp; |
| Cookie | [Illuminate\Cookie\CookieJar](https://api.laravel.com/docs/{{version}}/Illuminate/Cookie/CookieJar.html) | `cookie` |
| Crypt | [Illuminate\Encryption\Encrypter](https://api.laravel.com/docs/{{version}}/Illuminate/Encryption/Encrypter.html) | `encrypter` |
| Date | [Illuminate\Support\DateFactory](https://api.laravel.com/docs/{{version}}/Illuminate/Support/DateFactory.html) | `date` |
| DB (实例) | [Illuminate\Database\Connection](https://api.laravel.com/docs/{{version}}/Illuminate/Database/Connection.html) | `db.connection` |
| DB | [Illuminate\Database\DatabaseManager](https://api.laravel.com/docs/{{version}}/Illuminate/Database/DatabaseManager.html) | `db` |
| Event | [Illuminate\Events\Dispatcher](https://api.laravel.com/docs/{{version}}/Illuminate/Events/Dispatcher.html) | `events` |
| Exceptions (实例) | [Illuminate\Contracts\Debug\ExceptionHandler](https://api.laravel.com/docs/{{version}}/Illuminate/Contracts/Debug/ExceptionHandler.html) | &nbsp; |
| Exceptions | [Illuminate\Foundation\Exceptions\Handler](https://api.laravel.com/docs/{{version}}/Illuminate/Foundation/Exceptions/Handler.html) | &nbsp; |
| File | [Illuminate\Filesystem\Filesystem](https://api.laravel.com/docs/{{version}}/Illuminate/Filesystem/Filesystem.html) | `files` |
| Gate | [Illuminate\Contracts\Auth\Access\Gate](https://api.laravel.com/docs/{{version}}/Illuminate/Contracts/Auth/Access/Gate.html) | &nbsp; |
| Hash | [Illuminate\Contracts\Hashing\Hasher](https://api.laravel.com/docs/{{version}}/Illuminate/Contracts/Hashing/Hasher.html) | `hash` |
| Http | [Illuminate\Http\Client\Factory](https://api.laravel.com/docs/{{version}}/Illuminate/Http/Client/Factory.html) | &nbsp; |
| Lang | [Illuminate\Translation\Translator](https://api.laravel.com/docs/{{version}}/Illuminate/Translation/Translator.html) | `translator` |
| Log | [Illuminate\Log\LogManager](https://api.laravel.com/docs/{{version}}/Illuminate/Log/LogManager.html) | `log` |
| Mail | [Illuminate\Mail\Mailer](https://api.laravel.com/docs/{{version}}/Illuminate/Mail/Mailer.html) | `mailer` |
| Notification | [Illuminate\Notifications\ChannelManager](https://api.laravel.com/docs/{{version}}/Illuminate/Notifications/ChannelManager.html) | &nbsp; |
| Password (实例) | [Illuminate\Auth\Passwords\PasswordBroker](https://api.laravel.com/docs/{{version}}/Illuminate/Auth/Passwords/PasswordBroker.html) | `auth.password.broker` |
| Password | [Illuminate\Auth\Passwords\PasswordBrokerManager](https://api.laravel.com/docs/{{version}}/Illuminate/Auth/Passwords/PasswordBrokerManager.html) | `auth.password` |
| Pipeline (实例) | [Illuminate\Pipeline\Pipeline](https://api.laravel.com/docs/{{version}}/Illuminate/Pipeline/Pipeline.html) | &nbsp; |
| Process | [Illuminate\Process\Factory](https://api.laravel.com/docs/{{version}}/Illuminate/Process/Factory.html) | &nbsp; |
| Queue (基类) | [Illuminate\Queue\Queue](https://api.laravel.com/docs/{{version}}/Illuminate/Queue/Queue.html) | &nbsp; |
| Queue (实例) | [Illuminate\Contracts\Queue\Queue](https://api.laravel.com/docs/{{version}}/Illuminate/Contracts/Queue/Queue.html) | `queue.connection` |
| Queue | [Illuminate\Queue\QueueManager](https://api.laravel.com/docs/{{version}}/Illuminate/Queue/QueueManager.html) | `queue` |
| RateLimiter | [Illuminate\Cache\RateLimiter](https://api.laravel.com/docs/{{version}}/Illuminate/Cache/RateLimiter.html) | &nbsp; |
| Redirect | [Illuminate\Routing\Redirector](https://api.laravel.com/docs/{{version}}/Illuminate/Routing/Redirector.html) | `redirect` |
| Redis (实例) | [Illuminate\Redis\Connections\Connection](https://api.laravel.com/docs/{{version}}/Illuminate/Redis/Connections/Connection.html) | `redis.connection` |
| Redis | [Illuminate\Redis\RedisManager](https://api.laravel.com/docs/{{version}}/Illuminate/Redis/RedisManager.html) | `redis` |
| Request | [Illuminate\Http\Request](https://api.laravel.com/docs/{{version}}/Illuminate/Http/Request.html) | `request` |
| Response (实例) | [Illuminate\Http\Response](https://api.laravel.com/docs/{{version}}/Illuminate/Http/Response.html) | &nbsp; |
| Response | [Illuminate\Contracts\Routing\ResponseFactory](https://api.laravel.com/docs/{{version}}/Illuminate/Contracts/Routing/ResponseFactory.html) | &nbsp; |
| Route | [Illuminate\Routing\Router](https://api.laravel.com/docs/{{version}}/Illuminate/Routing/Router.html) | `router` |
| Schedule | [Illuminate\Console\Scheduling\Schedule](https://api.laravel.com/docs/{{version}}/Illuminate/Console/Scheduling/Schedule.html) | &nbsp; |
| Schema | [Illuminate\Database\Schema\Builder](https://api.laravel.com/docs/{{version}}/Illuminate/Database/Schema/Builder.html) | &nbsp; |
| Session (实例) | [Illuminate\Session\Store](https://api.laravel.com/docs/{{version}}/Illuminate/Session/Store.html) | `session.store` |
| Session | [Illuminate\Session\SessionManager](https://api.laravel.com/docs/{{version}}/Illuminate/Session/SessionManager.html) | `session` |
| Storage (实例) | [Illuminate\Contracts\Filesystem\Filesystem](https://api.laravel.com/docs/{{version}}/Illuminate/Contracts/Filesystem/Filesystem.html) | `filesystem.disk` |
| Storage | [Illuminate\Filesystem\FilesystemManager](https://api.laravel.com/docs/{{version}}/Illuminate/Filesystem/FilesystemManager.html) | `filesystem` |
| URL | [Illuminate\Routing\UrlGenerator](https://api.laravel.com/docs/{{version}}/Illuminate/Routing/UrlGenerator.html) | `url` |
| Validator (实例) | [Illuminate\Validation\Validator](https://api.laravel.com/docs/{{version}}/Illuminate/Validation/Validator.html) | &nbsp; |
| Validator | [Illuminate\Validation\Factory](https://api.laravel.com/docs/{{version}}/Illuminate/Validation/Factory.html) | `validator` |
| View (实例) | [Illuminate\View\View](https://api.laravel.com/docs/{{version}}/Illuminate/View/View.html) | &nbsp; |
| View | [Illuminate\View\Factory](https://api.laravel.com/docs/{{version}}/Illuminate/View/Factory.html) | `view` |
| Vite | [Illuminate\Foundation\Vite](https://api.laravel.com/docs/{{version}}/Illuminate/Foundation/Vite.html) | &nbsp; |

</div>

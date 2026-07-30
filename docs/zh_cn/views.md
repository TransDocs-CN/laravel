# 视图

- [简介](#introduction)
    - [使用 React / Svelte / Vue 编写视图](#writing-views-in-react-svelte-or-vue)
- [创建和渲染视图](#creating-and-rendering-views)
    - [嵌套视图目录](#nested-view-directories)
    - [创建第一个可用的视图](#creating-the-first-available-view)
    - [判断视图是否存在](#determining-if-a-view-exists)
- [向视图传递数据](#passing-data-to-views)
    - [与所有视图共享数据](#sharing-data-with-all-views)
- [视图合成器](#view-composers)
    - [视图创建器](#view-creators)
- [优化视图](#optimizing-views)

<a name="introduction"></a>
## 简介

当然，直接从路由和控制器返回完整的 HTML 文档字符串是不切实际的。值得庆幸的是，视图提供了一种方便的方式，将所有 HTML 放在单独的文件中。

视图将你的控制器/应用程序逻辑与表示逻辑分开，并存储在 `resources/views` 目录中。使用 Laravel 时，视图模板通常使用 [Blade 模板语言](/docs/{{version}}/blade)编写。一个简单的视图可能如下所示：

```blade
<!-- 存储在 resources/views/greeting.blade.php 的视图 -->

<html>
    <body>
        <h1>Hello, {{ $name }}</h1>
    </body>
</html>
```

由于此视图存储在 `resources/views/greeting.blade.php`，我们可以使用全局的 `view` 辅助函数返回它，如下所示：

```php
Route::get('/', function () {
    return view('greeting', ['name' => 'James']);
});
```

> [!NOTE]
> 正在寻找有关如何编写 Blade 模板的更多信息？请查看完整的 [Blade 文档](/docs/{{version}}/blade)开始学习。

<a name="writing-views-in-react-svelte-or-vue"></a>
### 使用 React / Svelte / Vue 编写视图

与其通过 Blade 使用 PHP 编写前端模板，许多开发者开始倾向于使用 React、Svelte 或 Vue 编写模板。Laravel 通过 [Inertia](https://inertiajs.com/) 使这一切变得简单，该库可以轻松地将你的 React / Svelte / Vue 前端连接到 Laravel 后端，而无需构建 SPA 的典型复杂性。

我们的 [React、Svelte 和 Vue 应用启动套件](/docs/{{version}}/starter-kits)为你的下一个由 Inertia 驱动的 Laravel 应用程序提供了很好的起点。

<a name="creating-and-rendering-views"></a>
## 创建和渲染视图

你可以通过在应用程序的 `resources/views` 目录中放置一个扩展名为 `.blade.php` 的文件来创建视图，或者使用 `make:view` Artisan 命令：

```shell
php artisan make:view greeting
```

`.blade.php` 扩展名通知框架该文件包含一个 [Blade 模板](/docs/{{version}}/blade)。Blade 模板包含 HTML 以及 Blade 指令，允许你轻松输出值、创建"if"语句、迭代数据等。

创建视图后，你可以使用全局的 `view` 辅助函数从应用程序的路由或控制器之一返回它：

```php
Route::get('/', function () {
    return view('greeting', ['name' => 'James']);
});
```

视图也可以使用 `View` 门面返回：

```php
use Illuminate\Support\Facades\View;

return View::make('greeting', ['name' => 'James']);
```

如你所见，传递给 `view` 辅助函数的第一个参数对应于 `resources/views` 目录中视图文件的名称。第二个参数是一个数据数组，应使其可用于视图。在这种情况下，我们传递了 `name` 变量，它使用 [Blade 语法](/docs/{{version}}/blade)在视图中显示。

<a name="nested-view-directories"></a>
### 嵌套视图目录

视图也可以嵌套在 `resources/views` 目录的子目录中。"点"符号可用于引用嵌套视图。例如，如果你的视图存储在 `resources/views/admin/profile.blade.php`，你可以从应用程序的路由/控制器之一返回它，如下所示：

```php
return view('admin.profile', $data);
```

> [!WARNING]
> 视图目录名称不应包含 `.` 字符。

<a name="creating-the-first-available-view"></a>
### 创建第一个可用的视图

使用 `View` 门面的 `first` 方法，你可以创建给定视图数组中存在的第一个视图。如果你的应用程序或包允许自定义或覆盖视图，这可能很有用：

```php
use Illuminate\Support\Facades\View;

return View::first(['custom.admin', 'admin'], $data);
```

<a name="determining-if-a-view-exists"></a>
### 判断视图是否存在

如果你需要判断视图是否存在，可以使用 `View` 门面。如果视图存在，`exists` 方法将返回 `true`：

```php
use Illuminate\Support\Facades\View;

if (View::exists('admin.profile')) {
    // ...
}
```

<a name="passing-data-to-views"></a>
## 向视图传递数据

正如你在前面的示例中看到的，你可以向视图传递一个数据数组，以使该数据对视图可用：

```php
return view('greetings', ['name' => 'Victoria']);
```

以这种方式传递信息时，数据应是一个包含键/值对的数组。向视图提供数据后，你可以使用数据的键在视图中访问每个值，例如 `<?php echo $name; ?>`。

作为向 `view` 辅助函数传递完整数据数组的替代方法，你可以使用 `with` 方法向视图添加单个数据片段。`with` 方法返回视图对象的一个实例，以便你可以在返回视图之前继续链式调用方法：

```php
return view('greeting')
    ->with('name', 'Victoria')
    ->with('occupation', 'Astronaut');
```

<a name="sharing-data-with-all-views"></a>
### 与所有视图共享数据

有时，你可能需要与应用程序渲染的所有视图共享数据。你可以使用 `View` 门面的 `share` 方法来实现。通常，你应将 `share` 方法的调用放在服务提供者的 `boot` 方法中。你可以自由地将它们添加到 `App\Providers\AppServiceProvider` 类中，或生成一个单独的服务提供者来存放它们：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\View;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 注册任何应用程序服务。
     */
    public function register(): void
    {
        // ...
    }

    /**
     * 引导任何应用程序服务。
     */
    public function boot(): void
    {
        View::share('key', 'value');
    }
}
```

<a name="view-composers"></a>
## 视图合成器

视图合成器是在视图渲染时调用的回调或类方法。如果你有希望在每次渲染视图时绑定到该视图的数据，视图合成器可以帮助你将该逻辑组织到单个位置。如果同一个视图由应用程序中的多个路由或控制器返回，并且总是需要特定的数据片段，那么视图合成器可能特别有用。

通常，视图合成器将在你应用程序的[服务提供者](/docs/{{version}}/providers)之一中注册。在此示例中，我们假设 `App\Providers\AppServiceProvider` 将存放此逻辑。

我们将使用 `View` 门面的 `composer` 方法来注册视图合成器。Laravel 没有为基于类的视图合成器提供默认目录，因此你可以自由地按任何方式组织它们。例如，你可以创建一个 `app/View/Composers` 目录来存放你应用程序的所有视图合成器：

```php
<?php

namespace App\Providers;

use App\View\Composers\ProfileComposer;
use Illuminate\Support\Facades;
use Illuminate\Support\ServiceProvider;
use Illuminate\View\View;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 注册任何应用程序服务。
     */
    public function register(): void
    {
        // ...
    }

    /**
     * 引导任何应用程序服务。
     */
    public function boot(): void
    {
        // 使用基于类的合成器...
        Facades\View::composer('profile', ProfileComposer::class);

        // 使用基于闭包的合成器...
        Facades\View::composer('welcome', function (View $view) {
            // ...
        });

        Facades\View::composer('dashboard', function (View $view) {
            // ...
        });
    }
}
```

现在我们已经注册了合成器，每次渲染 `profile` 视图时将执行 `App\View\Composers\ProfileComposer` 类的 `compose` 方法。让我们看一下合成器类的示例：

```php
<?php

namespace App\View\Composers;

use App\Repositories\UserRepository;
use Illuminate\View\View;

class ProfileComposer
{
    /**
     * 创建新的个人资料合成器。
     */
    public function __construct(
        protected UserRepository $users,
    ) {}

    /**
     * 将数据绑定到视图。
     */
    public function compose(View $view): void
    {
        $view->with('count', $this->users->count());
    }
}
```

如你所见，所有视图合成器都通过[服务容器](/docs/{{version}}/container)解析，因此你可以在合成器的构造函数中类型提示所需的任何依赖。

<a name="attaching-a-composer-to-multiple-views"></a>
#### 将合成器附加到多个视图

你可以通过将视图数组作为第一个参数传递给 `composer` 方法，一次将视图合成器附加到多个视图：

```php
use App\Views\Composers\MultiComposer;
use Illuminate\Support\Facades\View;

View::composer(
    ['profile', 'dashboard'],
    MultiComposer::class
);
```

`composer` 方法也接受 `*` 字符作为通配符，允许你将合成器附加到所有视图：

```php
use Illuminate\Support\Facades;
use Illuminate\View\View;

Facades\View::composer('*', function (View $view) {
    // ...
});
```

<a name="view-creators"></a>
### 视图创建器

视图"创建器"与视图合成器非常相似；但是，它们在视图实例化后立即执行，而不是等待直到视图即将渲染。要注册视图创建器，请使用 `creator` 方法：

```php
use App\View\Creators\ProfileCreator;
use Illuminate\Support\Facades\View;

View::creator('profile', ProfileCreator::class);
```

<a name="optimizing-views"></a>
## 优化视图

默认情况下，Blade 模板视图是按需编译的。当执行渲染视图的请求时，Laravel 将确定是否存在已编译版本的视图。如果文件存在，Laravel 将确定未编译的视图是否比已编译的视图更新。如果编译后的视图不存在，或者未编译的视图已被修改，Laravel 将重新编译视图。

在请求期间编译视图可能对性能产生轻微的负面影响，因此 Laravel 提供了 `view:cache` Artisan 命令来预编译应用程序使用的所有视图。为了提高性能，你可能希望在部署过程中运行此命令：

```shell
php artisan view:cache
```

你可以使用 `view:clear` 命令清除视图缓存：

```shell
php artisan view:clear
```

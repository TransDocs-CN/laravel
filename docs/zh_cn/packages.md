# 包开发

- [简介](#introduction)
    - [创建包](#creating-a-package)
    - [关于门面的说明](#a-note-on-facades)
- [包发现](#package-discovery)
- [服务提供者](#service-providers)
- [资源](#resources)
    - [配置](#configuration)
    - [路由](#routes)
    - [迁移](#migrations)
    - [语言文件](#language-files)
    - [视图](#views)
    - [视图组件](#view-components)
    - ["About" Artisan 命令](#about-artisan-command)
- [命令](#commands)
    - [优化命令](#optimize-commands)
    - [重载命令](#reload-commands)
- [公共资源](#public-assets)
- [发布文件组](#publishing-file-groups)

<a name="introduction"></a>
## 简介

包是为 Laravel 添加功能的主要方式。包可以是像 [Carbon](https://github.com/briannesbitt/Carbon) 这样处理日期的优秀工具，也可以是像 Spatie 的 [Laravel Media Library](https://github.com/spatie/laravel-medialibrary) 这样允许你将文件与 Eloquent 模型关联的包。

有不同类型的包。有些包是独立的，意味着它们可以与任何 PHP 框架一起使用。Carbon 和 Pest 就是独立包的例子。这些包中的任何一个都可以通过在 `composer.json` 文件中引入它们来与 Laravel 一起使用。

另一方面，其他包是专门为与 Laravel 一起使用而设计的。这些包可能具有专门用于增强 Laravel 应用程序的路由、控制器、视图和配置。本指南主要涵盖这些 Laravel 特定包的开发。

<a name="creating-a-package"></a>
### 创建包

开始构建新 Laravel 包的最简单方法是使用官方的 [Laravel 包骨架](https://github.com/laravel/package-skeleton)。该骨架提供了构建 Laravel 包所需的一切，包括服务提供者、通过 Pest 进行测试、通过 Larastan 进行静态分析、通过 Pint 进行代码格式化，以及用于端到端包开发的工作台应用程序。你可以使用 [Laravel 安装器 CLI](/docs/{{version}}/installation#creating-a-laravel-project) 的 `package` 命令创建一个新包：

```shell
laravel package my-package
```

一个交互式配置脚本将为你的包个性化设置骨架，设置你的命名空间、服务提供者，以及你需要的功能，如配置文件、路由、视图、翻译、迁移、资源、命令和门面。

<a name="a-note-on-facades"></a>
### 关于门面的说明

编写 Laravel 应用程序时，使用契约还是门面通常无关紧要，因为两者都提供基本相同的可测试性。但是，在编写包时，你的包通常无法访问所有 Laravel 的测试助手。如果你希望能够像在典型的 Laravel 应用程序中安装包一样编写包测试，可以使用 [Orchestral Testbench](https://github.com/orchestral/testbench) 包。

<a name="package-discovery"></a>
## 包发现

Laravel 应用程序的 `bootstrap/providers.php` 文件包含应由 Laravel 加载的服务提供者列表。但是，你可以不在要求用户手动将你的服务提供者添加到列表，而是在包的 `composer.json` 文件的 `extra` 部分中定义该提供者，以便 Laravel 自动加载它。除了服务提供者，你还可以列出任何你想要注册的[门面](/docs/{{version}}/facades)：

```json
"extra": {
    "laravel": {
        "providers": [
            "Barryvdh\\Debugbar\\ServiceProvider"
        ],
        "aliases": {
            "Debugbar": "Barryvdh\\Debugbar\\Facade"
        }
    }
},
```

一旦你的包配置了自动发现，Laravel 将在其安装时自动注册其服务提供者和门面，为包的用户创建便捷的安装体验。

<a name="opting-out-of-package-discovery"></a>
#### 选择退出包发现

如果你是包的消费者，并且希望禁用某个包的自动发现，可以在应用程序的 `composer.json` 文件的 `extra` 部分中列出该包的名称：

```json
"extra": {
    "laravel": {
        "dont-discover": [
            "barryvdh/laravel-debugbar"
        ]
    }
},
```

你可以使用 `*` 字符在应用程序的 `dont-discover` 指令中禁用所有包的自动发现：

```json
"extra": {
    "laravel": {
        "dont-discover": [
            "*"
        ]
    }
},
```

<a name="service-providers"></a>
## 服务提供者

[服务提供者](/docs/{{version}}/providers)是你的包和 Laravel 之间的连接点。服务提供者负责将内容绑定到 Laravel 的[服务容器](/docs/{{version}}/container)中，并告知 Laravel 在哪里加载包资源，如视图、配置和语言文件。

服务提供者扩展了 `Illuminate\Support\ServiceProvider` 类并包含两个方法：`register` 和 `boot`。基础 `ServiceProvider` 类位于 `illuminate/support` Composer 包中，你应将其添加到自己的包依赖中。要了解服务提供者的结构和用途的更多信息，请查看[它们的文档](/docs/{{version}}/providers)。

<a name="resources"></a>
## 资源

<a name="configuration"></a>
### 配置

通常，你需要将包的配置文件发布到应用程序的 `config` 目录。这将允许包的用户轻松覆盖你的默认配置选项。要允许发布你的配置文件，请在服务提供者的 `boot` 方法中调用 `publishes` 方法：

```php
/**
 * 引导任何包服务。
 */
public function boot(): void
{
    $this->publishes([
        __DIR__.'/../config/courier.php' => config_path('courier.php'),
    ]);
}
```

现在，当包的用户执行 Laravel 的 `vendor:publish` 命令时，你的文件将被复制到指定的发布位置。配置发布后，其值可以像任何其他配置文件一样访问：

```php
$value = config('courier.option');
```

> [!WARNING]
> 你不应在配置文件中定义闭包。当用户执行 `config:cache` Artisan 命令时，它们无法被正确序列化。

<a name="default-package-configuration"></a>
#### 默认包配置

你也可以将自己的包配置文件与应用程序已发布的副本合并。这将允许你的用户仅在已发布的配置文件中定义他们实际想要覆盖的选项。要合并配置文件的值，请在服务提供者的 `register` 方法中使用 `mergeConfigFrom` 方法。

`mergeConfigFrom` 方法接受包配置文件的路径作为其第一个参数，应用程序配置文件副本的名称作为其第二个参数：

```php
/**
 * 注册任何包服务。
 */
public function register(): void
{
    $this->mergeConfigFrom(
        __DIR__.'/../config/courier.php', 'courier'
    );
}
```

> [!WARNING]
> 此方法仅合并配置数组的第一层。如果你的用户部分定义了一个多维配置数组，缺失的选项将不会被合并。

<a name="routes"></a>
### 路由

如果你的包包含路由，你可以使用 `loadRoutesFrom` 方法加载它们。此方法会自动确定应用程序的路由是否已被缓存，如果路由已被缓存，则不会加载你的路由文件：

```php
/**
 * 引导任何包服务。
 */
public function boot(): void
{
    $this->loadRoutesFrom(__DIR__.'/../routes/web.php');
}
```

<a name="migrations"></a>
### 迁移

如果你的包包含[数据库迁移](/docs/{{version}}/migrations)，你可以使用 `publishesMigrations` 方法告知 Laravel 给定目录或文件包含迁移。当 Laravel 发布迁移时，它会自动更新其文件名中的时间戳以反映当前日期和时间：

```php
/**
 * 引导任何包服务。
 */
public function boot(): void
{
    $this->publishesMigrations([
        __DIR__.'/../database/migrations' => database_path('migrations'),
    ]);
}
```

<a name="language-files"></a>
### 语言文件

如果你的包包含[语言文件](/docs/{{version}}/localization)，你可以使用 `loadTranslationsFrom` 方法告知 Laravel 如何加载它们。例如，如果你的包名称为 `courier`，你应在服务提供者的 `boot` 方法中添加以下内容：

```php
/**
 * 引导任何包服务。
 */
public function boot(): void
{
    $this->loadTranslationsFrom(__DIR__.'/../lang', 'courier');
}
```

包翻译行使用 `package::file.line` 语法约定进行引用。因此，你可以像这样从 `messages` 文件中加载 `courier` 包的 `welcome` 行：

```php
echo trans('courier::messages.welcome');
```

你可以使用 `loadJsonTranslationsFrom` 方法为你的包注册 JSON 翻译文件。此方法接受包含包 JSON 翻译文件的目录路径：

```php
/**
 * 引导任何包服务。
 */
public function boot(): void
{
    $this->loadJsonTranslationsFrom(__DIR__.'/../lang');
}
```

<a name="publishing-language-files"></a>
#### 发布语言文件

如果你希望将包的语言文件发布到应用程序的 `lang/vendor` 目录，可以使用服务提供者的 `publishes` 方法。`publishes` 方法接受一个包路径和其期望的发布位置的数组。例如，要发布 `courier` 包的语言文件，你可以这样做：

```php
/**
 * 引导任何包服务。
 */
public function boot(): void
{
    $this->loadTranslationsFrom(__DIR__.'/../lang', 'courier');

    $this->publishes([
        __DIR__.'/../lang' => $this->app->langPath('vendor/courier'),
    ]);
}
```

现在，当包的用户执行 Laravel 的 `vendor:publish` Artisan 命令时，你的包的语言文件将被发布到指定的发布位置。

<a name="views"></a>
### 视图

要向 Laravel 注册包的[视图](/docs/{{version}}/views)，你需要告诉 Laravel 视图的位置。你可以使用服务提供者的 `loadViewsFrom` 方法来实现。`loadViewsFrom` 方法接受两个参数：视图模板的路径和你的包名称。例如，如果你的包名称为 `courier`，你应在服务提供者的 `boot` 方法中添加以下内容：

```php
/**
 * 引导任何包服务。
 */
public function boot(): void
{
    $this->loadViewsFrom(__DIR__.'/../resources/views', 'courier');
}
```

包视图使用 `package::view` 语法约定进行引用。因此，一旦你的视图路径在服务提供者中注册，你就可以像这样从 `courier` 包加载 `dashboard` 视图：

```php
Route::get('/dashboard', function () {
    return view('courier::dashboard');
});
```

<a name="overriding-package-views"></a>
#### 覆盖包视图

当你使用 `loadViewsFrom` 方法时，Laravel 实际上为你的视图注册了两个位置：应用程序的 `resources/views/vendor` 目录和你指定的目录。因此，使用 `courier` 包作为示例，Laravel 将首先检查开发人员是否已将自定义版本的视图放置在 `resources/views/vendor/courier` 目录中。然后，如果视图未被自定义，Laravel 将搜索你在调用 `loadViewsFrom` 时指定的包视图目录。这使得包用户可以轻松自定义/覆盖你的包视图。

<a name="publishing-views"></a>
#### 发布视图

如果你希望使你的视图可供发布到应用程序的 `resources/views/vendor` 目录，你可以使用服务提供者的 `publishes` 方法。`publishes` 方法接受一个包视图路径和其期望的发布位置的数组：

```php
/**
 * 引导包服务。
 */
public function boot(): void
{
    $this->loadViewsFrom(__DIR__.'/../resources/views', 'courier');

    $this->publishes([
        __DIR__.'/../resources/views' => resource_path('views/vendor/courier'),
    ]);
}
```

现在，当包的用户执行 Laravel 的 `vendor:publish` Artisan 命令时，你的包的视图将被复制到指定的发布位置。

<a name="view-components"></a>
### 视图组件

如果你正在构建一个使用 Blade 组件或将组件放在非传统目录中的包，你需要手动注册你的组件类及其 HTML 标签别名，以便 Laravel 知道在哪里找到该组件。通常，你应在包的服务提供者的 `boot` 方法中注册你的组件：

```php
use Illuminate\Support\Facades\Blade;
use VendorPackage\View\Components\AlertComponent;

/**
 * 引导你的包的服务。
 */
public function boot(): void
{
    Blade::component('package-alert', AlertComponent::class);
}
```

一旦你的组件注册完成，就可以使用其标签别名进行渲染：

```blade
<x-package-alert/>
```

<a name="autoloading-package-components"></a>
#### 自动加载包组件

或者，你可以使用 `componentNamespace` 方法按约定自动加载组件类。例如，`Nightshade` 包可能有 `Calendar` 和 `ColorPicker` 组件，它们位于 `Nightshade\Views\Components` 命名空间中：

```php
use Illuminate\Support\Facades\Blade;

/**
 * 引导你的包的服务。
 */
public function boot(): void
{
    Blade::componentNamespace('Nightshade\\Views\\Components', 'nightshade');
}
```

这将允许使用 `package-name::` 语法按供应商命名空间使用包组件：

```blade
<x-nightshade::calendar />
<x-nightshade::color-picker />
```

Blade 将通过将组件名称转换为帕斯卡命名法来自动检测链接到该组件的类。子目录也通过"点"表示法支持。

<a name="anonymous-components"></a>
#### 匿名组件

如果你的包包含匿名组件，它们必须放置在包"视图"目录的 `components` 目录中（由 [loadViewsFrom 方法](#views)指定）。然后，你可以通过在组件名称前加上包的视图命名空间来渲染它们：

```blade
<x-courier::alert />
```

<a name="about-artisan-command"></a>
### "About" Artisan 命令

Laravel 内置的 `about` Artisan 命令提供了应用程序环境和配置的概要信息。包可以通过 `AboutCommand` 类向此命令的输出推送额外信息。通常，此信息可以从包服务提供者的 `boot` 方法中添加：

```php
use Illuminate\Foundation\Console\AboutCommand;

/**
 * 引导任何包服务。
 */
public function boot(): void
{
    AboutCommand::add('My Package', fn () => ['Version' => '1.0.0']);
}
```

<a name="commands"></a>
## 命令

要向 Laravel 注册你的包的 Artisan 命令，你可以使用 `commands` 方法。此方法需要一个命令类名的数组。命令注册后，你可以使用 [Artisan CLI](/docs/{{version}}/artisan) 执行它们：

```php
use Courier\Console\Commands\InstallCommand;
use Courier\Console\Commands\NetworkCommand;

/**
 * 引导任何包服务。
 */
public function boot(): void
{
    if ($this->app->runningInConsole()) {
        $this->commands([
            InstallCommand::class,
            NetworkCommand::class,
        ]);
    }
}
```

<a name="optimize-commands"></a>
### 优化命令

Laravel 的[优化命令](/docs/{{version}}/deployment#optimization)会缓存应用程序的配置、事件、路由和视图。使用 `optimizes` 方法，你可以注册包的自己的 Artisan 命令，这些命令应在执行 `optimize` 和 `optimize:clear` 命令时被调用：

```php
/**
 * 引导任何包服务。
 */
public function boot(): void
{
    if ($this->app->runningInConsole()) {
        $this->optimizes(
            optimize: 'package:optimize',
            clear: 'package:clear-optimizations',
        );
    }
}
```

<a name="reload-commands"></a>
### 重载命令

Laravel 的[重载命令](/docs/{{version}}/deployment#reloading-services)会终止任何正在运行的服务，以便它们可以由系统进程监视器自动重启。使用 `reloads` 方法，你可以注册包的自己的 Artisan 命令，这些命令应在执行 `reload` 命令时被调用：

```php
/**
 * 引导任何包服务。
 */
public function boot(): void
{
    if ($this->app->runningInConsole()) {
        $this->reloads('package:reload');
    }
}
```

<a name="public-assets"></a>
## 公共资源

你的包可能有 JavaScript、CSS 和图像等资源。要将这些资源发布到应用程序的 `public` 目录，请使用服务提供者的 `publishes` 方法。在此示例中，我们还将添加一个 `public` 资源组标签，可用于方便地发布相关资源组：

```php
/**
 * 引导任何包服务。
 */
public function boot(): void
{
    $this->publishes([
        __DIR__.'/../public' => public_path('vendor/courier'),
    ], 'public');
}
```

现在，当包的用户执行 `vendor:publish` 命令时，你的资源将被复制到指定的发布位置。由于用户通常需要在每次更新包时覆盖资源，他们可以使用 `--force` 标志：

```shell
php artisan vendor:publish --tag=public --force
```

<a name="publishing-file-groups"></a>
## 发布文件组

你可能希望分别发布包资源和文件组。例如，你可能希望允许用户发布包的配置文件，而不强制他们发布包的资源。你可以通过从包的服务提供者调用 `publishes` 方法时给它们"打标签"来实现这一点。例如，让我们在包服务提供者的 `boot` 方法中使用标签为 `courier` 包定义两个发布组（`courier-config` 和 `courier-migrations`）：

```php
/**
 * 引导任何包服务。
 */
public function boot(): void
{
    $this->publishes([
        __DIR__.'/../config/package.php' => config_path('package.php')
    ], 'courier-config');

    $this->publishesMigrations([
        __DIR__.'/../database/migrations/' => database_path('migrations')
    ], 'courier-migrations');
}
```

现在，你的用户可以通过在执行 `vendor:publish` 命令时引用其标签来分别发布这些组：

```shell
php artisan vendor:publish --tag=courier-config
```

你的用户也可以使用 `--provider` 标志发布由你的包服务提供者定义的所有可发布文件：

```shell
php artisan vendor:publish --provider="Your\Package\ServiceProvider"
```

# 目录结构

- [简介](#introduction)
- [根目录](#the-root-directory)
    - [`app` 目录](#the-root-app-directory)
    - [`bootstrap` 目录](#the-bootstrap-directory)
    - [`config` 目录](#the-config-directory)
    - [`database` 目录](#the-database-directory)
    - [`public` 目录](#the-public-directory)
    - [`resources` 目录](#the-resources-directory)
    - [`routes` 目录](#the-routes-directory)
    - [`storage` 目录](#the-storage-directory)
    - [`tests` 目录](#the-tests-directory)
    - [`vendor` 目录](#the-vendor-directory)
- [App 目录](#the-app-directory)
    - [`Broadcasting` 目录](#the-broadcasting-directory)
    - [`Console` 目录](#the-console-directory)
    - [`Events` 目录](#the-events-directory)
    - [`Exceptions` 目录](#the-exceptions-directory)
    - [`Http` 目录](#the-http-directory)
    - [`Jobs` 目录](#the-jobs-directory)
    - [`Listeners` 目录](#the-listeners-directory)
    - [`Mail` 目录](#the-mail-directory)
    - [`Models` 目录](#the-models-directory)
    - [`Notifications` 目录](#the-notifications-directory)
    - [`Policies` 目录](#the-policies-directory)
    - [`Providers` 目录](#the-providers-directory)
    - [`Rules` 目录](#the-rules-directory)

<a name="introduction"></a>
## 简介

默认的 Laravel 应用结构旨在为大型和小型应用提供一个良好的起点。但您可以根据自己的喜好自由组织应用。Laravel 对任何给定类的位置几乎没有限制——只要 Composer 能自动加载该类即可。

<a name="the-root-directory"></a>
## 根目录

<a name="the-root-app-directory"></a>
### App 目录

`app` 目录包含应用的核心代码。我们稍后将更详细地探讨这个目录；不过，应用中几乎所有类都将位于此目录中。

<a name="the-bootstrap-directory"></a>
### Bootstrap 目录

`bootstrap` 目录包含引导框架的 `app.php` 文件。该目录还包含一个 `cache` 目录，其中包含框架生成的用于性能优化的文件，如路由和服务缓存文件。

<a name="the-config-directory"></a>
### Config 目录

顾名思义，`config` 目录包含应用的所有配置文件。通读所有这些文件并熟悉所有可用选项是一个好主意。

<a name="the-database-directory"></a>
### Database 目录

`database` 目录包含数据库迁移、模型工厂和数据填充。如果您愿意，也可以使用此目录存放 SQLite 数据库。

<a name="the-public-directory"></a>
### Public 目录

`public` 目录包含 `index.php` 文件，该文件是所有进入应用请求的入口点，并配置自动加载。此目录还存放您的资源文件，如图片、JavaScript 和 CSS。

<a name="the-resources-directory"></a>
### Resources 目录

`resources` 目录包含您的[视图](/docs/{{version}}/views)以及原始未编译的资源，如 CSS 或 JavaScript。

<a name="the-routes-directory"></a>
### Routes 目录

`routes` 目录包含应用的所有路由定义。默认情况下，Laravel 包含两个路由文件：`web.php` 和 `console.php`。

`web.php` 文件包含 Laravel 放置在 `web` 中间件组中的路由，该组提供会话状态、CSRF 保护和 Cookie 加密。如果您的应用不提供无状态的 RESTful API，那么您的所有路由很可能都在 `web.php` 文件中定义。

`console.php` 文件是您定义所有基于闭包的控制台命令的地方。每个闭包都绑定到一个命令实例，提供了一种与每个命令的 IO 方法进行交互的简单方法。尽管此文件不定义 HTTP 路由，但它定义了进入应用的控制台入口点（路由）。您还可以在 `console.php` 文件中[调度](/docs/{{version}}/scheduling)任务。

可选地，您可以通过 `install:api` 和 `install:broadcasting` Artisan 命令为 API 路由（`api.php`）和广播频道（`channels.php`）安装额外的路由文件。

`api.php` 文件包含旨在无状态的路由，因此通过这些路由进入应用的请求旨在通过[令牌](/docs/{{version}}/sanctum)进行身份验证，并且无法访问会话状态。

`channels.php` 文件是您注册应用支持的所有[事件广播](/docs/{{version}}/broadcasting)频道的地方。

<a name="the-storage-directory"></a>
### Storage 目录

`storage` 目录包含您的日志、编译后的 Blade 模板、基于文件的会话、文件缓存以及框架生成的其他文件。该目录分为 `app`、`framework` 和 `logs` 目录。`app` 目录可用于存储应用生成的任何文件。`framework` 目录用于存储框架生成的文件和缓存。最后，`logs` 目录包含应用的日志文件。

`storage/app/public` 目录可用于存储用户生成的文件，例如应公开访问的个人资料头像。您应该在 `public/storage` 处创建一个指向此目录的符号链接。您可以使用 `php artisan storage:link` Artisan 命令创建该链接。

<a name="the-tests-directory"></a>
### Tests 目录

`tests` 目录包含您的自动化测试。系统默认提供 [Pest](https://pestphp.com) 或 [PHPUnit](https://phpunit.de/) 单元测试和功能测试示例。每个测试类应以 `Test` 单词作为后缀。您可以使用 `/vendor/bin/pest` 或 `/vendor/bin/phpunit` 命令运行测试。或者，如果您希望以更详细和美观的方式展示测试结果，可以使用 `php artisan test` Artisan 命令运行测试。

<a name="the-vendor-directory"></a>
### Vendor 目录

`vendor` 目录包含您的 [Composer](https://getcomposer.org) 依赖。

<a name="the-app-directory"></a>
## App 目录

应用的大部分代码都位于 `app` 目录中。默认情况下，此目录的命名空间为 `App`，并由 Composer 使用 [PSR-4 自动加载标准](https://www.php-fig.org/psr/psr-4/)进行自动加载。

默认情况下，`app` 目录包含 `Http`、`Models` 和 `Providers` 目录。但是，随着您使用 Artisan 的 make 命令生成类，随着时间的推移，app 目录中会生成各种其他目录。例如，`app/Console` 目录在您执行 `make:command` Artisan 命令生成命令类之前不会存在。

`Console` 和 `Http` 目录将在下面各自的章节中进一步说明，但可以将 `Console` 和 `Http` 目录视为提供进入应用核心的 API。HTTP 协议和 CLI 都是与应用交互的机制，但实际上并不包含应用逻辑。换句话说，它们是向应用发出命令的两种方式。`Console` 目录包含您的所有 Artisan 命令，而 `Http` 目录包含您的控制器、中间件和请求。

> [!NOTE]
> `app` 目录中的许多类可以通过 Artisan 命令生成。要查看可用的命令，请在终端中运行 `php artisan list make` 命令。

<a name="the-broadcasting-directory"></a>
### Broadcasting 目录

`Broadcasting` 目录包含应用的所有广播频道类。这些类是使用 `make:channel` 命令生成的。默认情况下，此目录不存在，但会在您创建第一个频道时为您创建。要了解更多关于频道的信息，请查看[事件广播](/docs/{{version}}/broadcasting)文档。

<a name="the-console-directory"></a>
### Console 目录

`Console` 目录包含应用的所有自定义 Artisan 命令。这些命令可以使用 `make:command` 命令生成。

<a name="the-events-directory"></a>
### Events 目录

默认情况下，此目录不存在，但会由 `event:generate` 和 `make:event` Artisan 命令为您创建。`Events` 目录存放[事件类](/docs/{{version}}/events)。事件可用于通知应用的其他部分发生了某个操作，提供了极大的灵活性和解耦性。

<a name="the-exceptions-directory"></a>
### Exceptions 目录

`Exceptions` 目录包含应用的所有自定义异常。这些异常可以使用 `make:exception` 命令生成。

<a name="the-http-directory"></a>
### Http 目录

`Http` 目录包含您的控制器、中间件和表单请求。处理进入应用的请求的几乎所有逻辑都将放在此目录中。

<a name="the-jobs-directory"></a>
### Jobs 目录

默认情况下，此目录不存在，但会在您执行 `make:job` Artisan 命令时为您创建。`Jobs` 目录存放应用的[可排队任务](/docs/{{version}}/queues)。任务可以由应用排队，也可以在当前的请求生命周期内同步运行。在当前请求期间同步运行的任务有时被称为"命令"，因为它们是[命令模式](https://en.wikipedia.org/wiki/Command_pattern)的实现。

<a name="the-listeners-directory"></a>
### Listeners 目录

默认情况下，此目录不存在，但会在您执行 `event:generate` 或 `make:listener` Artisan 命令时为您创建。`Listeners` 目录包含处理[事件](/docs/{{version}}/events)的类。事件监听器接收一个事件实例，并执行逻辑以响应事件触发。例如，`UserRegistered` 事件可能由 `SendWelcomeEmail` 监听器处理。

<a name="the-mail-directory"></a>
### Mail 目录

默认情况下，此目录不存在，但会在您执行 `make:mail` Artisan 命令时为您创建。`Mail` 目录包含应用发送的[代表电子邮件的类](/docs/{{version}}/mail)。邮件对象允许您将构建电子邮件的所有逻辑封装在一个简单类中，可以使用 `Mail::send` 方法发送。

<a name="the-models-directory"></a>
### Models 目录

`Models` 目录包含您的所有 [Eloquent 模型类](/docs/{{version}}/eloquent)。Laravel 附带的 Eloquent ORM 提供了一个优美、简单的 ActiveRecord 实现，用于与数据库交互。每个数据库表都有一个对应的"模型"，用于与该表进行交互。模型允许您查询表中的数据，以及向表中插入新记录。

<a name="the-notifications-directory"></a>
### Notifications 目录

默认情况下，此目录不存在，但会在您执行 `make:notification` Artisan 命令时为您创建。`Notifications` 目录包含应用发送的所有"事务性"[通知](/docs/{{version}}/notifications)，例如关于应用中发生事件的简单通知。Laravel 的通知功能抽象了通过多种驱动发送通知的方式，如电子邮件、Slack、SMS 或存储在数据库中。

<a name="the-policies-directory"></a>
### Policies 目录

默认情况下，此目录不存在，但会在您执行 `make:policy` Artisan 命令时为您创建。`Policies` 目录包含应用的[授权策略类](/docs/{{version}}/authorization)。策略用于确定用户是否可以对资源执行给定操作。

<a name="the-providers-directory"></a>
### Providers 目录

`Providers` 目录包含应用的所有[服务提供者](/docs/{{version}}/providers)。服务提供者通过在服务容器中绑定服务、注册事件或执行任何其他任务来引导应用，为传入请求做好准备。

在一个全新的 Laravel 应用中，此目录已包含 `AppServiceProvider`。您可以根据需要向此目录添加自己的提供者。

<a name="the-rules-directory"></a>
### Rules 目录

默认情况下，此目录不存在，但会在您执行 `make:rule` Artisan 命令时为您创建。`Rules` 目录包含应用的自定义验证规则对象。规则用于将复杂的验证逻辑封装在一个简单的对象中。有关更多信息，请查看[验证文档](/docs/{{version}}/validation)。

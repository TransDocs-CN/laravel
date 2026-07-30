# 部署

- [简介](#introduction)
- [服务器要求](#server-requirements)
- [服务器配置](#server-configuration)
    - [Nginx](#nginx)
    - [FrankenPHP](#frankenphp)
    - [目录权限](#directory-permissions)
- [优化](#optimization)
    - [缓存配置](#optimizing-configuration-loading)
    - [缓存事件](#caching-events)
    - [缓存路由](#optimizing-route-loading)
    - [缓存视图](#optimizing-view-loading)
- [重新加载服务](#reloading-services)
- [调试模式](#debug-mode)
- [健康路由](#the-health-route)
- [使用 Laravel Cloud 或 Forge 部署](#deploying-with-cloud-or-forge)

<a name="introduction"></a>
## 简介

当您准备将 Laravel 应用部署到生产环境时，可以采取一些重要措施来确保应用尽可能高效地运行。在本文档中，我们将介绍一些确保 Laravel 应用正确部署的良好起点。

<a name="server-requirements"></a>
## 服务器要求

Laravel 框架有一些系统要求。您应确保您的 Web 服务器具有以下最低 PHP 版本和扩展：

<div class="content-list" markdown="1">

- PHP >= 8.3
- Ctype PHP 扩展
- cURL PHP 扩展
- DOM PHP 扩展
- Fileinfo PHP 扩展
- Filter PHP 扩展
- Hash PHP 扩展
- Mbstring PHP 扩展
- OpenSSL PHP 扩展
- PCRE PHP 扩展
- PDO PHP 扩展
- Session PHP 扩展
- Tokenizer PHP 扩展
- XML PHP 扩展

</div>

<a name="server-configuration"></a>
## 服务器配置

<a name="nginx"></a>
### Nginx

如果您要将应用部署到运行 Nginx 的服务器上，可以使用以下配置文件作为配置 Web 服务器的起点。很可能，此文件需要根据您的服务器配置进行自定义。**如果您需要管理服务器的帮助，请考虑使用完全托管的 Laravel 平台，如 [Laravel Cloud](https://cloud.laravel.com)。**

请确保像下面的配置一样，您的 Web 服务器将所有请求定向到应用的 `public/index.php` 文件。您绝不应尝试将 `index.php` 文件移动到项目根目录，因为从项目根目录提供应用服务会将许多敏感的配置文件暴露给公共互联网：

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name example.com;
    root /srv/example.com/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ ^/index\.php(/|$) {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

<a name="frankenphp"></a>
### FrankenPHP

[FrankenPHP](https://frankenphp.dev/) 也可用于为您的 Laravel 应用提供服务。FrankenPHP 是一个用 Go 编写的现代 PHP 应用服务器。要使用 FrankenPHP 提供 Laravel PHP 应用服务，您只需调用其 `php-server` 命令：

```shell
frankenphp php-server -r public/
```

要利用 FrankenPHP 支持的更强大功能，例如其 [Laravel Octane](/docs/{{version}}/octane) 集成、HTTP/3、现代压缩或将 Laravel 应用打包为独立二进制文件的能力，请查阅 FrankenPHP 的 [Laravel 文档](https://frankenphp.dev/docs/laravel/)。

<a name="directory-permissions"></a>
### 目录权限

Laravel 需要写入 `bootstrap/cache` 和 `storage` 目录，因此您应确保 Web 服务器进程所有者具有写入这些目录的权限。

<a name="optimization"></a>
## 优化

将应用部署到生产环境时，应缓存多种文件，包括配置、事件、路由和视图。Laravel 提供了一个便捷的 `optimize` Artisan 命令，它将缓存所有这些文件。此命令通常应作为应用部署过程的一部分来调用：

```shell
php artisan optimize
```

`optimize:clear` 方法可用于移除 `optimize` 命令生成的所有缓存文件以及默认缓存驱动中的所有键：

```shell
php artisan optimize:clear
```

在以下文档中，我们将讨论由 `optimize` 命令执行的每个细粒度优化命令。

<a name="optimizing-configuration-loading"></a>
### 缓存配置

将应用部署到生产环境时，您应确保在部署过程中运行 `config:cache` Artisan 命令：

```shell
php artisan config:cache
```

此命令会将 Laravel 的所有配置文件合并到一个缓存文件中，大大减少了框架在加载配置值时对文件系统的访问次数。

> [!WARNING]
> 如果您在部署过程中执行 `config:cache` 命令，应确保仅在配置文件中调用 `env` 函数。一旦配置被缓存，`.env` 文件将不再被加载，所有针对 `.env` 变量的 `env` 函数调用将返回 `null`。

<a name="caching-events"></a>
### 缓存事件

您应在部署过程中缓存应用的自动发现的事件到监听器映射。这可以通过在部署期间调用 `event:cache` Artisan 命令来实现：

```shell
php artisan event:cache
```

<a name="optimizing-route-loading"></a>
### 缓存路由

如果您正在构建具有大量路由的大型应用，应确保在部署过程中运行 `route:cache` Artisan 命令：

```shell
php artisan route:cache
```

此命令将所有路由注册缩减为缓存文件中的单个方法调用，从而在注册数百个路由时提高路由注册性能。

<a name="optimizing-view-loading"></a>
### 缓存视图

将应用部署到生产环境时，您应确保在部署过程中运行 `view:cache` Artisan 命令：

```shell
php artisan view:cache
```

此命令预编译所有 Blade 视图，使它们不会按需编译，从而提高每个返回视图的请求的性能。

<a name="reloading-services"></a>
## 重新加载服务

> [!NOTE]
> 部署到 [Laravel Cloud](https://cloud.laravel.com) 时，无需使用 `reload` 命令，因为所有服务的优雅重新加载会自动处理。

部署新版本的应用后，任何长期运行的服务（如队列工作器、Laravel Reverb 或 Laravel Octane）都应重新加载/重启以使用新代码。Laravel 提供了一个 `reload` Artisan 命令来终止这些服务：

```shell
php artisan reload
```

如果您未使用 [Laravel Cloud](https://cloud.laravel.com)，应手动配置进程监视器，以便在可重新加载的进程退出时检测并自动重启它们。

<a name="debug-mode"></a>
## 调试模式

`config/app.php` 配置文件中的调试选项决定了向用户实际显示多少错误信息。默认情况下，此选项设置为遵守 `APP_DEBUG` 环境变量的值，该变量存储在应用的 `.env` 文件中。

> [!WARNING]
> **在生产环境中，此值应始终为 `false`。如果在生产环境中将 `APP_DEBUG` 变量设置为 `true`，您将面临向应用的最终用户暴露敏感配置值的风险。**

<a name="the-health-route"></a>
## 健康路由

Laravel 包含一个内置的健康检查路由，可用于监控应用的状态。在生产环境中，此路由可用于向正常运行时间监视器、负载均衡器或 Kubernetes 等编排系统报告应用状态。

默认情况下，健康检查路由在 `/up` 提供服务，如果应用已启动且没有异常，将返回 200 HTTP 响应。否则，将返回 500 HTTP 响应。您可以在应用的 `bootstrap/app` 文件中配置此路由的 URI：

```php
->withRouting(
    web: __DIR__.'/../routes/web.php',
    commands: __DIR__.'/../routes/console.php',
    health: '/up', // [tl! remove]
    health: '/status', // [tl! add]
)
```

当对此路由发出 HTTP 请求时，Laravel 还会分派一个 `Illuminate\Foundation\Events\DiagnosingHealth` 事件，允许您执行与应用相关的额外健康检查。在此事件的[监听器](/docs/{{version}}/events)中，您可以检查应用的数据库或缓存状态。如果您检测到应用出现问题，只需在监听器中抛出异常即可。

<a name="deploying-with-cloud-or-forge"></a>
## 使用 Laravel Cloud 或 Forge 部署

<a name="laravel-cloud"></a>
#### Laravel Cloud

如果您想要一个为 Laravel 调优的完全托管、自动扩展的部署平台，请查看 [Laravel Cloud](https://cloud.laravel.com)。Laravel Cloud 是一个强大的 Laravel 部署平台，提供托管计算、数据库、缓存和对象存储。

在 Cloud 上启动您的 Laravel 应用，爱上这种可扩展的简洁性。Laravel Cloud 由 Laravel 的创建者精心调优，与框架无缝协作，因此您可以像往常一样继续编写 Laravel 应用。

<a name="laravel-forge"></a>
#### Laravel Forge

如果您更倾向于管理自己的服务器，但不太愿意配置运行健壮的 Laravel 应用所需的各种服务，[Laravel Forge](https://forge.laravel.com) 是一个适用于 Laravel 应用的 VPS 服务器管理平台。

Laravel Forge 可以在各种基础设施提供商（如 DigitalOcean、Linode、AWS 等）上创建服务器。此外，Forge 安装并管理构建健壮 Laravel 应用所需的所有工具，如 Nginx、MySQL、Redis、Memcached、Beanstalk 等。

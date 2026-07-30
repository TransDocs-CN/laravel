# Laravel Reverb

- [简介](#introduction)
- [安装](#installation)
- [配置](#configuration)
    - [应用凭证](#application-credentials)
    - [允许的来源](#allowed-origins)
    - [额外应用](#additional-applications)
    - [SSL](#ssl)
- [运行服务器](#running-server)
    - [调试](#debugging)
    - [重启](#restarting)
- [监控](#monitoring)
- [在生产环境中运行 Reverb](#production)
    - [打开文件](#open-files)
    - [事件循环](#event-loop)
    - [Web 服务器](#web-server)
    - [端口](#ports)
    - [进程管理](#process-management)
    - [扩展](#scaling)
- [事件](#events)

<a name="introduction"></a>
## 简介

[Laravel Reverb](https://github.com/laravel/reverb) 为你的 Laravel 应用带来了快速且可扩展的实时 WebSocket 通信，并与 Laravel 现有的[事件广播工具](/docs/{{version}}/broadcasting)套件无缝集成。

<a name="installation"></a>
## 安装

你可以使用 `install:broadcasting` Artisan 命令安装 Reverb：

```shell
php artisan install:broadcasting
```

<a name="configuration"></a>
## 配置

在幕后，`install:broadcasting` Artisan 命令会运行 `reverb:install` 命令，该命令将使用一组合理的默认配置选项安装 Reverb。如果你想进行任何配置更改，可以通过更新 Reverb 的环境变量或更新 `config/reverb.php` 配置文件来完成。

<a name="application-credentials"></a>
### 应用凭证

为了建立与 Reverb 的连接，必须在客户端和服务器之间交换一组 Reverb "应用"凭证。这些凭证在服务器上配置，用于验证来自客户端的请求。你可以使用以下环境变量来定义这些凭证：

```ini
REVERB_APP_ID=my-app-id
REVERB_APP_KEY=my-app-key
REVERB_APP_SECRET=my-app-secret
```

<a name="allowed-origins"></a>
### 允许的来源

你还可以通过更新 `config/reverb.php` 配置文件中 `apps` 部分的 `allowed_origins` 配置值来定义允许的客户端请求来源。来自未在允许来源列表中列出的来源的请求将被拒绝。你可以使用 `*` 允许所有来源：

```php
'apps' => [
    [
        'app_id' => 'my-app-id',
        'allowed_origins' => ['laravel.com'],
        // ...
    ]
]
```

<a name="additional-applications"></a>
### 额外应用

通常，Reverb 为其安装所在的应用程序提供 WebSocket 服务器。但是，可以使用单个 Reverb 安装来服务多个应用。

例如，你可能希望维护一个单一的 Laravel 应用，通过 Reverb 为多个应用程序提供 WebSocket 连接。这可以通过在应用程序的 `config/reverb.php` 配置文件中定义多个 `apps` 来实现：

```php
'apps' => [
    [
        'app_id' => 'my-app-one',
        // ...
    ],
    [
        'app_id' => 'my-app-two',
        // ...
    ],
],
```

<a name="ssl"></a>
### SSL

在大多数情况下，安全的 WebSocket 连接由上游的 Web 服务器（Nginx 等）在请求代理到你的 Reverb 服务器之前处理。

但是，有时让 Reverb 服务器直接处理安全连接可能很有用，例如在本地开发期间。如果你正在使用 [Laravel Herd](https://herd.laravel.com) 的安全站点功能，或者你正在使用 [Laravel Valet](/docs/{{version}}/valet) 并已对你的应用程序运行了 [secure 命令](/docs/{{version}}/valet#securing-sites)，你可以使用为你的站点生成的 Herd/Valet 证书来保护你的 Reverb 连接。为此，将 `REVERB_HOST` 环境变量设置为你站点的主机名，或者在启动 Reverb 服务器时显式传递主机名选项：

```shell
php artisan reverb:start --host="0.0.0.0" --port=8080 --hostname="laravel.test"
```

由于 Herd 和 Valet 域名解析到 `localhost`，运行上述命令将使你的 Reverb 服务器可通过安全 WebSocket 协议（`wss`）在 `wss://laravel.test:8080` 访问。

你也可以通过在你的应用程序的 `config/reverb.php` 配置文件中定义 `tls` 选项来手动选择证书。在 `tls` 选项数组中，你可以提供 [PHP 的 SSL 上下文选项](https://www.php.net/manual/en/context.ssl.php)支持的任何选项：

```php
'options' => [
    'tls' => [
        'local_cert' => '/path/to/cert.pem'
    ],
],
```

<a name="running-server"></a>
## 运行服务器

Reverb 服务器可以使用 `reverb:start` Artisan 命令启动：

```shell
php artisan reverb:start
```

默认情况下，Reverb 服务器将在 `0.0.0.0:8080` 启动，使其可从所有网络接口访问。

如果你需要指定自定义主机或端口，可以在启动服务器时通过 `--host` 和 `--port` 选项进行设置：

```shell
php artisan reverb:start --host=127.0.0.1 --port=9000
```

或者，你可以在应用程序的 `.env` 配置文件中定义 `REVERB_SERVER_HOST` 和 `REVERB_SERVER_PORT` 环境变量。

`REVERB_SERVER_HOST` 和 `REVERB_SERVER_PORT` 环境变量不应与 `REVERB_HOST` 和 `REVERB_PORT` 混淆。前者指定 Reverb 服务器本身的运行主机和端口，而后者告诉 Laravel 将广播消息发送到哪里。例如，在生产环境中，你可以将来自公共 Reverb 主机名（端口 `443`）的请求路由到运行在 `0.0.0.0:8080` 的 Reverb 服务器。在这种场景下，你的环境变量应定义如下：

```ini
REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=8080

REVERB_HOST=ws.laravel.com
REVERB_PORT=443
```

<a name="debugging"></a>
### 调试

为了提高性能，Reverb 默认不输出任何调试信息。如果你想查看通过 Reverb 服务器的数据流，可以向 `reverb:start` 命令提供 `--debug` 选项：

```shell
php artisan reverb:start --debug
```

<a name="restarting"></a>
### 重启

由于 Reverb 是一个长期运行的进程，代码的更改需要重启服务器才能生效，可以通过 `reverb:restart` Artisan 命令重启：

```shell
php artisan reverb:restart
```

`reverb:restart` 命令确保在停止服务器之前优雅地终止所有连接。如果你使用 Supervisor 等进程管理器运行 Reverb，服务器将在所有连接终止后由进程管理器自动重启：

```shell
php artisan reverb:restart
```

<a name="monitoring"></a>
## 监控

Reverb 可以通过与 [Laravel Pulse](/docs/{{version}}/pulse) 的集成进行监控。通过启用 Reverb 的 Pulse 集成，你可以跟踪服务器的连接数和消息处理量。

要启用集成，你首先应确保已[安装 Pulse](/docs/{{version}}/pulse#installation)。然后，将 Reverb 的任何记录器添加到应用程序的 `config/pulse.php` 配置文件中：

```php
use Laravel\Reverb\Pulse\Recorders\ReverbConnections;
use Laravel\Reverb\Pulse\Recorders\ReverbMessages;

'recorders' => [
    ReverbConnections::class => [
        'sample_rate' => 1,
    ],

    ReverbMessages::class => [
        'sample_rate' => 1,
    ],

    // ...
],
```

接下来，将每个记录器的 Pulse 卡片添加到你的 [Pulse 仪表盘](/docs/{{version}}/pulse#dashboard-customization)中：

```blade
<x-pulse>
    <livewire:reverb.connections cols="full" />
    <livewire:reverb.messages cols="full" />
    ...
</x-pulse>
```

连接活动通过定期轮询新更新来记录。为确保此信息在 Pulse 仪表盘上正确渲染，你必须在 Reverb 服务器上运行 `pulse:check` 守护进程。如果你在[水平扩展](#scaling)配置中运行 Reverb，则应仅在其中一台服务器上运行此守护进程。

<a name="production"></a>
## 在生产环境中运行 Reverb

由于 WebSocket 服务器的长期运行特性，你可能需要对服务器和托管环境进行一些优化，以确保你的 Reverb 服务器能够基于服务器可用资源有效处理最佳数量的连接。

> [!NOTE]
> [Laravel Cloud](https://cloud.laravel.com) 提供由 Laravel Reverb 集群驱动的完全托管的 WebSocket 基础设施，使你无需管理基础设施即可扩展和交付支持 Reverb 的应用程序。

<a name="open-files"></a>
### 打开文件

每个 WebSocket 连接都保存在内存中，直到客户端或服务器断开连接。在 Unix 和类 Unix 环境中，每个连接由一个文件表示。但是，操作系统和应用程序级别通常对允许打开的文件数量有限制。

<a name="operating-system"></a>
#### 操作系统

在基于 Unix 的操作系统上，你可以使用 `ulimit` 命令确定允许的打开文件数：

```shell
ulimit -n
```

此命令将显示不同用户的打开文件限制。你可以通过编辑 `/etc/security/limits.conf` 文件来更新这些值。例如，将 `forge` 用户的最大打开文件数更新为 10,000 如下所示：

```ini
# /etc/security/limits.conf
forge        soft  nofile  10000
forge        hard  nofile  10000
```

<a name="event-loop"></a>
### 事件循环

在底层，Reverb 使用 ReactPHP 事件循环来管理服务器上的 WebSocket 连接。默认情况下，此事件循环由 `stream_select` 驱动，它不需要任何额外的扩展。但是，`stream_select` 通常限制为 1,024 个打开文件。因此，如果你计划处理超过 1,000 个并发连接，你将需要使用不受相同限制的替代事件循环。

Reverb 会在 `ext-uv` 可用时自动切换到由其驱动的事件循环。此 PHP 扩展可通过 PECL 安装：

```shell
pecl install uv
```

<a name="web-server"></a>
### Web 服务器

在大多数情况下，Reverb 运行在服务器的一个非面向 Web 的端口上。因此，为了将流量路由到 Reverb，你应该配置一个反向代理。假设 Reverb 运行在主机 `0.0.0.0` 和端口 `8080` 上，并且你的服务器使用 Nginx Web 服务器，可以使用以下 Nginx 站点配置为你的 Reverb 服务器定义一个反向代理：

```nginx
server {
    ...

    location / {
        proxy_http_version 1.1;
        proxy_set_header Host $http_host;
        proxy_set_header Scheme $scheme;
        proxy_set_header SERVER_PORT $server_port;
        proxy_set_header REMOTE_ADDR $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";

        proxy_pass http://0.0.0.0:8080;
    }

    ...
}
```

> [!WARNING]
> Reverb 在 `/app` 监听 WebSocket 连接，并在 `/apps` 处理 API 请求。你应确保处理 Reverb 请求的 Web 服务器可以服务这两个 URI。如果你使用 [Laravel Forge](https://forge.laravel.com) 管理服务器，你的 Reverb 服务器将默认正确配置。

通常，Web 服务器被配置为限制允许的连接数以防止服务器过载。要增加 Nginx Web 服务器上允许的连接数到 10,000，应更新 `nginx.conf` 文件中的 `worker_rlimit_nofile` 和 `worker_connections` 值：

```nginx
user forge;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;
worker_rlimit_nofile 10000;

events {
  worker_connections 10000;
  multi_accept on;
}
```

上述配置将允许每个进程最多生成 10,000 个 Nginx 工作进程。此外，此配置将 Nginx 的打开文件限制设置为 10,000。

<a name="ports"></a>
### 端口

基于 Unix 的操作系统通常限制服务器上可以打开的端口数量。你可以通过以下命令查看当前允许的范围：

```shell
cat /proc/sys/net/ipv4/ip_local_port_range
# 32768	60999
```

上面的输出显示服务器最多可以处理 28,231 (60,999 - 32,768) 个连接，因为每个连接需要一个空闲端口。虽然我们建议[水平扩展](#scaling)以增加允许的连接数，但你也可以通过更新服务器 `/etc/sysctl.conf` 配置文件中允许的端口范围来增加可用开放端口的数量。

<a name="process-management"></a>
### 进程管理

在大多数情况下，你应该使用 Supervisor 等进程管理器来确保 Reverb 服务器持续运行。如果你使用 Supervisor 运行 Reverb，应更新服务器 `supervisor.conf` 文件中的 `minfds` 设置，以确保 Supervisor 能够打开处理 Reverb 服务器连接所需的文件：

```ini
[supervisord]
...
minfds=10000
```

<a name="scaling"></a>
### 扩展

如果你需要处理超过单台服务器允许的连接数，可以水平扩展你的 Reverb 服务器。利用 Redis 的发布/订阅功能，Reverb 能够管理跨多台服务器的连接。当你的应用 Reverb 服务器之一收到消息时，该服务器将使用 Redis 将传入的消息发布到所有其他服务器。

要启用水平扩展，你应在应用程序的 `.env` 配置文件中将 `REVERB_SCALING_ENABLED` 环境变量设置为 `true`：

```env
REVERB_SCALING_ENABLED=true
```

接下来，你应该有一个专用的中央 Redis 服务器，所有 Reverb 服务器将与之通信。Reverb 将使用[为应用程序配置的默认 Redis 连接](/docs/{{version}}/redis#configuration)将消息发布到所有 Reverb 服务器。

一旦你启用了 Reverb 的扩展选项并配置了 Redis 服务器，你可以简单地在多台能够与 Redis 服务器通信的服务器上调用 `reverb:start` 命令。这些 Reverb 服务器应放置在负载均衡器后面，以在服务器之间均匀分配传入请求。

<a name="events"></a>
## 事件

Reverb 在连接和消息处理的生命周期中分派内部事件。你可以[监听这些事件](/docs/{{version}}/events)以在管理连接或交换消息时执行操作。

Reverb 分派以下事件：

#### `Laravel\Reverb\Events\ChannelCreated`

当创建频道时分派。这通常发生在第一个连接订阅特定频道时。事件接收 `Laravel\Reverb\Protocols\Pusher\Channel` 实例。

#### `Laravel\Reverb\Events\ChannelRemoved`

当移除频道时分派。这通常发生在最后一个连接取消订阅频道时。事件接收 `Laravel\Reverb\Protocols\Pusher\Channel` 实例。

#### `Laravel\Reverb\Events\ConnectionPruned`

当服务器修剪过期连接时分派。事件接收 `Laravel\Reverb\Contracts\Connection` 实例。

#### `Laravel\Reverb\Events\MessageReceived`

当从客户端连接接收到消息时分派。事件接收 `Laravel\Reverb\Contracts\Connection` 实例和原始字符串 `$message`。

#### `Laravel\Reverb\Events\MessageSent`

当向客户端连接发送消息时分派。事件接收 `Laravel\Reverb\Contracts\Connection` 实例和原始字符串 `$message`。

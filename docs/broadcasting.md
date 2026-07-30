# 广播

- [简介](#introduction)
- [快速入门](#quickstart)
- [服务端安装](#server-side-installation)
    - [Reverb](#reverb)
    - [Pusher Channels](#pusher-channels)
    - [Ably](#ably)
- [客户端安装](#client-side-installation)
    - [Reverb](#client-reverb)
    - [Pusher Channels](#client-pusher-channels)
    - [Ably](#client-ably)
- [概念概述](#concept-overview)
    - [使用示例应用](#using-example-application)
- [定义广播事件](#defining-broadcast-events)
    - [广播名称](#broadcast-name)
    - [广播数据](#broadcast-data)
    - [广播队列](#broadcast-queue)
    - [广播条件](#broadcast-conditions)
    - [广播和数据库事务](#broadcasting-and-database-transactions)
- [授权频道](#authorizing-channels)
    - [定义授权回调](#defining-authorization-callbacks)
    - [定义频道类](#defining-channel-classes)
- [广播事件](#broadcasting-events)
    - [仅限其他人](#only-to-others)
    - [自定义连接](#customizing-the-connection)
    - [匿名事件](#anonymous-events)
    - [救援广播](#rescuing-broadcasts)
- [接收广播](#receiving-broadcasts)
    - [监听事件](#listening-for-events)
    - [离开频道](#leaving-a-channel)
    - [命名空间](#namespaces)
    - [使用 React、Vue 或 Svelte](#using-react-or-vue)
- [在线频道](#presence-channels)
    - [授权在线频道](#authorizing-presence-channels)
    - [加入在线频道](#joining-presence-channels)
    - [广播到在线频道](#broadcasting-to-presence-channels)
- [模型广播](#model-broadcasting)
    - [模型广播约定](#model-broadcasting-conventions)
    - [监听模型广播](#listening-for-model-broadcasts)
- [客户端事件](#client-events)
- [通知](#notifications)

<a name="introduction"></a>
## 简介

在许多现代 Web 应用中，WebSocket 用于实现实时、实时更新的用户界面。当服务器上某些数据被更新时，通常会通过 WebSocket 连接发送消息供客户端处理。WebSocket 提供了一种更有效的替代方案，无需持续轮询应用服务器以获取应反映在 UI 中的数据更改。

例如，假设你的应用能够将用户的数据导出为 CSV 文件并通过电子邮件发送给他们。但是，创建此 CSV 文件需要几分钟时间，因此你选择在[队列任务](/docs/{{version}}/queues)中创建并通过邮件发送 CSV。当 CSV 创建完毕并邮寄给用户后，我们可以使用事件广播来分发一个 `App\Events\UserDataExported` 事件，由应用的 JavaScript 接收。一旦接收到事件，我们就可以向用户显示一条消息，告知其 CSV 已通过电子邮件发送给他们，而无需刷新页面。

为了帮助你构建这类功能，Laravel 可以轻松地通过 WebSocket 连接"广播"你的服务端 Laravel [事件](/docs/{{version}}/events)。广播你的 Laravel 事件允许你在服务端 Laravel 应用和客户端 JavaScript 应用之间共享相同的事件名称和数据。

广播背后的核心概念很简单：客户端在前端连接到命名的频道，而你的 Laravel 应用在后端向这些频道广播事件。这些事件可以包含你希望提供给前端的任何额外数据。

<a name="supported-drivers"></a>
#### 支持的驱动

默认情况下，Laravel 包含三个服务端广播驱动供你选择：[Laravel Reverb](https://reverb.laravel.com)、[Pusher Channels](https://pusher.com/channels) 和 [Ably](https://ably.com)。

> [!NOTE]
> 在深入了解事件广播之前，请确保你已经阅读了 Laravel 关于[事件和监听器](/docs/{{version}}/events)的文档。

<a name="quickstart"></a>
## 快速入门

默认情况下，新 Laravel 应用中未启用广播。你可以使用 `install:broadcasting` Artisan 命令启用广播：

```shell
php artisan install:broadcasting
```

`install:broadcasting` 命令将提示你选择要使用的事件广播服务。此外，它将创建 `config/broadcasting.php` 配置文件和 `routes/channels.php` 文件，你可以在其中注册应用的广播授权路由和回调。

Laravel 开箱即用地支持几个广播驱动：[Laravel Reverb](/docs/{{version}}/reverb)、[Pusher Channels](https://pusher.com/channels)、[Ably](https://ably.com) 以及用于本地开发和调试的 `log` 驱动。此外，还包含一个 `null` 驱动，允许你在测试期间禁用广播。在 `config/broadcasting.php` 配置文件中包含了每个驱动的配置示例。

你应用的所有事件广播配置都存储在 `config/broadcasting.php` 配置文件中。如果你的应用中不存在此文件，请不用担心，它将在你运行 `install:broadcasting` Artisan 命令时创建。

<a name="quickstart-next-steps"></a>
#### 下一步

启用事件广播后，你可以进一步了解[定义广播事件](#defining-broadcast-events)和[监听事件](#listening-for-events)。如果你使用 Laravel 的 React、Vue 或 Svelte [入门工具包](/docs/{{version}}/starter-kits)，你可以使用 Echo 的 [useEcho 钩子](#using-react-or-vue)监听事件。

> [!NOTE]
> 在广播任何事件之前，你应首先配置并运行一个[队列工作器](/docs/{{version}}/queues)。所有事件广播都通过队列任务完成，这样应用的响应时间不会受到广播事件的影响。

<a name="server-side-installation"></a>
## 服务端安装

要开始使用 Laravel 的事件广播，我们需要在 Laravel 应用中进行一些配置，并安装一些包。

事件广播由服务端广播驱动完成，它广播你的 Laravel 事件，以便 Laravel Echo（一个 JavaScript 库）可以在浏览器客户端中接收它们。别担心 - 我们将逐步完成安装过程的每个部分。

<a name="reverb"></a>
### Reverb

在使用 Reverb 作为事件广播器时，要快速启用 Laravel 广播功能的支持，使用 `--reverb` 选项调用 `install:broadcasting` Artisan 命令。此 Artisan 命令将安装 Reverb 所需的 Composer 和 NPM 包，并使用适当的变量更新应用的 `.env` 文件：

```shell
php artisan install:broadcasting --reverb
```

<a name="reverb-manual-installation"></a>
#### 手动安装

运行 `install:broadcasting` 命令时，系统将提示你安装 [Laravel Reverb](/docs/{{version}}/reverb)。当然，你也可以使用 Composer 包管理器手动安装 Reverb：

```shell
composer require laravel/reverb
```

安装包后，你可以运行 Reverb 的安装命令来发布配置、添加 Reverb 所需的环境变量并在应用中启用事件广播：

```shell
php artisan reverb:install
```

你可以在 [Reverb 文档](/docs/{{version}}/reverb)中找到详细的 Reverb 安装和使用说明。

<a name="pusher-channels"></a>
### Pusher Channels

在使用 Pusher 作为事件广播器时，要快速启用 Laravel 广播功能的支持，使用 `--pusher` 选项调用 `install:broadcasting` Artisan 命令。此 Artisan 命令将提示你输入 Pusher 凭据，安装 Pusher PHP 和 JavaScript SDK，并使用适当的变量更新应用的 `.env` 文件：

```shell
php artisan install:broadcasting --pusher
```

<a name="pusher-manual-installation"></a>
#### 手动安装

要手动安装 Pusher 支持，你应使用 Composer 包管理器安装 Pusher Channels PHP SDK：

```shell
composer require pusher/pusher-php-server
```

接下来，你应在 `config/broadcasting.php` 配置文件中配置 Pusher Channels 凭据。此文件中已包含一个示例 Pusher Channels 配置，允许你快速指定密钥、秘密和应用程序 ID。通常，你应在应用的 `.env` 文件中配置 Pusher Channels 凭据：

```ini
PUSHER_APP_ID="your-pusher-app-id"
PUSHER_APP_KEY="your-pusher-key"
PUSHER_APP_SECRET="your-pusher-secret"
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME="https"
PUSHER_APP_CLUSTER="mt1"
```

`config/broadcasting.php` 文件的 `pusher` 配置还允许你指定 Channels 支持的其他 `options`，例如集群。

然后，在应用的 `.env` 文件中将 `BROADCAST_CONNECTION` 环境变量设置为 `pusher`：

```ini
BROADCAST_CONNECTION=pusher
```

最后，你已准备好安装和配置 [Laravel Echo](#client-side-installation)，它将接收客户端上的广播事件。

<a name="ably"></a>
### Ably

> [!NOTE]
> 以下文档讨论如何在"Pusher 兼容"模式下使用 Ably。但是，Ably 团队推荐并维护了一个广播器和 Echo 客户端，能够利用 Ably 提供的独特功能。有关使用 Ably 维护的驱动的更多信息，请[查阅 Ably 的 Laravel 广播器文档](https://github.com/ably/laravel-broadcaster)。

在使用 [Ably](https://ably.com) 作为事件广播器时，要快速启用 Laravel 广播功能的支持，使用 `--ably` 选项调用 `install:broadcasting` Artisan 命令。此 Artisan 命令将提示你输入 Ably 凭据，安装 Ably PHP 和 JavaScript SDK，并使用适当的变量更新应用的 `.env` 文件：

```shell
php artisan install:broadcasting --ably
```

**在继续之前，你应在 Ably 应用设置中启用 Pusher 协议支持。你可以在 Ably 应用设置仪表板的"Protocol Adapter Settings"部分启用此功能。**

<a name="ably-manual-installation"></a>
#### 手动安装

要手动安装 Ably 支持，你应使用 Composer 包管理器安装 Ably PHP SDK：

```shell
composer require ably/ably-php
```

接下来，你应在 `config/broadcasting.php` 配置文件中配置 Ably 凭据。此文件中已包含一个示例 Ably 配置，允许你快速指定密钥。通常，此值应通过 `ABLY_KEY` [环境变量](/docs/{{version}}/configuration#environment-configuration)设置：

```ini
ABLY_KEY=your-ably-key
```

然后，在应用的 `.env` 文件中将 `BROADCAST_CONNECTION` 环境变量设置为 `ably`：

```ini
BROADCAST_CONNECTION=ably
```

最后，你已准备好安装和配置 [Laravel Echo](#client-side-installation)，它将接收客户端上的广播事件。

<a name="client-side-installation"></a>
## 客户端安装

<a name="client-reverb"></a>
### Reverb

[Laravel Echo](https://github.com/laravel/echo) 是一个 JavaScript 库，可以轻松订阅频道并监听由服务端广播驱动广播的事件。

当通过 `install:broadcasting` Artisan 命令安装 Laravel Reverb 时，Reverb 和 Echo 的脚手架和配置将自动注入到你的应用中。但是，如果你希望手动配置 Laravel Echo，可以按照以下说明进行操作。

<a name="reverb-client-manual-installation"></a>
#### 手动安装

要为应用的前端手动配置 Laravel Echo，首先安装 `pusher-js` 包，因为 Reverb 利用 Pusher 协议进行 WebSocket 订阅、频道和消息：

```shell
npm install --save-dev laravel-echo pusher-js
```

安装 Echo 后，你可以在应用的 JavaScript 中创建一个新的 Echo 实例。一个很好的地方是在 Laravel 框架自带的 `resources/js/app.js` 文件的底部：

```js tab=JavaScript
import Echo from 'laravel-echo';

import Pusher from 'pusher-js';
window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
});
```

```js tab=React
import { configureEcho } from "@laravel/echo-react";

configureEcho({
    broadcaster: "reverb",
    // key: import.meta.env.VITE_REVERB_APP_KEY,
    // wsHost: import.meta.env.VITE_REVERB_HOST,
    // wsPort: import.meta.env.VITE_REVERB_PORT,
    // wssPort: import.meta.env.VITE_REVERB_PORT,
    // forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    // enabledTransports: ['ws', 'wss'],
});
```

```js tab=Vue
import { configureEcho } from "@laravel/echo-vue";

configureEcho({
    broadcaster: "reverb",
    // key: import.meta.env.VITE_REVERB_APP_KEY,
    // wsHost: import.meta.env.VITE_REVERB_HOST,
    // wsPort: import.meta.env.VITE_REVERB_PORT,
    // wssPort: import.meta.env.VITE_REVERB_PORT,
    // forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    // enabledTransports: ['ws', 'wss'],
});
```

```js tab=Svelte
import { configureEcho } from "@laravel/echo-svelte";

configureEcho({
    broadcaster: "reverb",
    // key: import.meta.env.VITE_REVERB_APP_KEY,
    // wsHost: import.meta.env.VITE_REVERB_HOST,
    // wsPort: import.meta.env.VITE_REVERB_PORT,
    // wssPort: import.meta.env.VITE_REVERB_PORT,
    // forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    // enabledTransports: ['ws', 'wss'],
});
```

接下来，你应编译应用的资源：

```shell
npm run build
```

> [!WARNING]
> Laravel Echo 的 `reverb` 广播器需要 laravel-echo v1.16.0+。

<a name="client-pusher-channels"></a>
### Pusher Channels

[Laravel Echo](https://github.com/laravel/echo) 是一个 JavaScript 库，可以轻松订阅频道并监听由服务端广播驱动广播的事件。

当通过 `install:broadcasting --pusher` Artisan 命令安装广播支持时，Pusher 和 Echo 的脚手架和配置将自动注入到你的应用中。但是，如果你希望手动配置 Laravel Echo，可以按照以下说明进行操作。

<a name="pusher-client-manual-installation"></a>
#### 手动安装

要为应用的前端手动配置 Laravel Echo，首先安装 `laravel-echo` 和 `pusher-js` 包，它们利用 Pusher 协议进行 WebSocket 订阅、频道和消息：

```shell
npm install --save-dev laravel-echo pusher-js
```

安装 Echo 后，你可以在应用的 `resources/js/app.js` 文件中创建一个新的 Echo 实例：

```js tab=JavaScript
import Echo from 'laravel-echo';

import Pusher from 'pusher-js';
window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    forceTLS: true
});
```

```js tab=React
import { configureEcho } from "@laravel/echo-react";

configureEcho({
    broadcaster: "pusher",
    // key: import.meta.env.VITE_PUSHER_APP_KEY,
    // cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    // forceTLS: true,
    // wsHost: import.meta.env.VITE_PUSHER_HOST,
    // wsPort: import.meta.env.VITE_PUSHER_PORT,
    // wssPort: import.meta.env.VITE_PUSHER_PORT,
    // enabledTransports: ["ws", "wss"],
});
```

```js tab=Vue
import { configureEcho } from "@laravel/echo-vue";

configureEcho({
    broadcaster: "pusher",
    // key: import.meta.env.VITE_PUSHER_APP_KEY,
    // cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    // forceTLS: true,
    // wsHost: import.meta.env.VITE_PUSHER_HOST,
    // wsPort: import.meta.env.VITE_PUSHER_PORT,
    // wssPort: import.meta.env.VITE_PUSHER_PORT,
    // enabledTransports: ["ws", "wss"],
});
```

```js tab=Svelte
import { configureEcho } from "@laravel/echo-svelte";

configureEcho({
    broadcaster: "pusher",
    // key: import.meta.env.VITE_PUSHER_APP_KEY,
    // cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    // forceTLS: true,
    // wsHost: import.meta.env.VITE_PUSHER_HOST,
    // wsPort: import.meta.env.VITE_PUSHER_PORT,
    // wssPort: import.meta.env.VITE_PUSHER_PORT,
    // enabledTransports: ["ws", "wss"],
});
```

接下来，你应在应用的 `.env` 文件中为 Pusher 环境变量定义适当的值。如果 `.env` 文件中尚不存在这些变量，你应添加它们：

```ini
PUSHER_APP_ID="your-pusher-app-id"
PUSHER_APP_KEY="your-pusher-key"
PUSHER_APP_SECRET="your-pusher-secret"
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME="https"
PUSHER_APP_CLUSTER="mt1"

VITE_APP_NAME="${APP_NAME}"
VITE_PUSHER_APP_KEY="${PUSHER_APP_KEY}"
VITE_PUSHER_HOST="${PUSHER_HOST}"
VITE_PUSHER_PORT="${PUSHER_PORT}"
VITE_PUSHER_SCHEME="${PUSHER_SCHEME}"
VITE_PUSHER_APP_CLUSTER="${PUSHER_APP_CLUSTER}"
```

根据应用需求调整 Echo 配置后，你可以编译应用的资源：

```shell
npm run build
```

> [!NOTE]
> 要了解有关编译应用 JavaScript 资源的更多信息，请查阅 [Vite](/docs/{{version}}/vite) 文档。

<a name="using-an-existing-client-instance"></a>
#### 使用现有客户端实例

如果你已有预配置的 Pusher Channels 客户端实例并希望 Echo 使用它，你可以通过 `client` 配置选项将其传递给 Echo：

```js
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

const options = {
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY
}

window.Echo = new Echo({
    ...options,
    client: new Pusher(options.key, options)
});
```

<a name="client-ably"></a>
### Ably

> [!NOTE]
> 以下文档讨论如何在"Pusher 兼容"模式下使用 Ably。但是，Ably 团队推荐并维护了一个广播器和 Echo 客户端，能够利用 Ably 提供的独特功能。有关使用 Ably 维护的驱动的更多信息，请[查阅 Ably 的 Laravel 广播器文档](https://github.com/ably/laravel-broadcaster)。

[Laravel Echo](https://github.com/laravel/echo) 是一个 JavaScript 库，可以轻松订阅频道并监听由服务端广播驱动广播的事件。

当通过 `install:broadcasting --ably` Artisan 命令安装广播支持时，Ably 和 Echo 的脚手架和配置将自动注入到你的应用中。但是，如果你希望手动配置 Laravel Echo，可以按照以下说明进行操作。

<a name="ably-client-manual-installation"></a>
#### 手动安装

要为应用的前端手动配置 Laravel Echo，首先安装 `laravel-echo` 和 `pusher-js` 包，它们利用 Pusher 协议进行 WebSocket 订阅、频道和消息：

```shell
npm install --save-dev laravel-echo pusher-js
```

**在继续之前，你应在 Ably 应用设置中启用 Pusher 协议支持。你可以在 Ably 应用设置仪表板的"Protocol Adapter Settings"部分启用此功能。**

安装 Echo 后，你可以在应用的 `resources/js/app.js` 文件中创建一个新的 Echo 实例：

```js tab=JavaScript
import Echo from 'laravel-echo';

import Pusher from 'pusher-js';
window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_ABLY_PUBLIC_KEY,
    wsHost: 'realtime-pusher.ably.io',
    wsPort: 443,
    disableStats: true,
    encrypted: true,
});
```

```js tab=React
import { configureEcho } from "@laravel/echo-react";

configureEcho({
    broadcaster: "ably",
    // key: import.meta.env.VITE_ABLY_PUBLIC_KEY,
    // wsHost: "realtime-pusher.ably.io",
    // wsPort: 443,
    // disableStats: true,
    // encrypted: true,
});
```

```js tab=Vue
import { configureEcho } from "@laravel/echo-vue";

configureEcho({
    broadcaster: "ably",
    // key: import.meta.env.VITE_ABLY_PUBLIC_KEY,
    // wsHost: "realtime-pusher.ably.io",
    // wsPort: 443,
    // disableStats: true,
    // encrypted: true,
});
```

```js tab=Svelte
import { configureEcho } from "@laravel/echo-svelte";

configureEcho({
    broadcaster: "ably",
    // key: import.meta.env.VITE_ABLY_PUBLIC_KEY,
    // wsHost: "realtime-pusher.ably.io",
    // wsPort: 443,
    // disableStats: true,
    // encrypted: true,
});
```

你可能已经注意到我们的 Ably Echo 配置引用了一个 `VITE_ABLY_PUBLIC_KEY` 环境变量。此变量的值应是你的 Ably 公钥。你的公钥是 Ably 密钥中 `:` 字符之前的部分。

根据需求调整 Echo 配置后，你可以编译应用的资源：

```shell
npm run dev
```

> [!NOTE]
> 要了解有关编译应用 JavaScript 资源的更多信息，请查阅 [Vite](/docs/{{version}}/vite) 文档。

<a name="concept-overview"></a>
## 概念概述

Laravel 的事件广播允许你使用基于驱动的方法通过 WebSocket 将服务端 Laravel 事件广播到客户端 JavaScript 应用。目前，Laravel 提供了 [Laravel Reverb](https://reverb.laravel.com)、[Pusher Channels](https://pusher.com/channels) 和 [Ably](https://ably.com) 驱动。这些事件可以使用 [Laravel Echo](#client-side-installation) JavaScript 包在客户端轻松消费。

事件通过"频道"广播，这些频道可以指定为公共或私有。任何访问者都可以在无需任何认证或授权的情况下订阅公共频道；但是，要订阅私有频道，用户必须经过认证并获得在该频道上监听的授权。

<a name="using-example-application"></a>
### 使用示例应用

在深入研究事件广播的每个组件之前，让我们以电子商务商店为例进行高层概述。

在我们的应用中，假设我们有一个页面允许用户查看其订单的发货状态。我们还假设当应用程序处理发货状态更新时，会触发一个 `OrderShipmentStatusUpdated` 事件：

```php
use App\Events\OrderShipmentStatusUpdated;

OrderShipmentStatusUpdated::dispatch($order);
```

<a name="the-shouldbroadcast-interface"></a>
#### `ShouldBroadcast` 接口

当用户查看他们的某个订单时，我们不希望他们必须刷新页面才能查看状态更新。相反，我们希望在状态更新创建时将其广播到应用。因此，我们需要用 `ShouldBroadcast` 接口标记 `OrderShipmentStatusUpdated` 事件。这将指示 Laravel 在事件触发时广播它：

```php
<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class OrderShipmentStatusUpdated implements ShouldBroadcast
{
    /**
     * The order instance.
     *
     * @var \App\Models\Order
     */
    public $order;
}
```

`ShouldBroadcast` 接口要求我们的事件定义 `broadcastOn` 方法。此方法负责返回事件应广播到的频道。在生成的事件类上已经定义了此方法的空存根，因此我们只需要填充其细节。我们只希望订单的创建者能够查看状态更新，因此我们将事件广播到与订单关联的私有频道上：

```php
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;

/**
 * Get the channel the event should broadcast on.
 */
public function broadcastOn(): Channel
{
    return new PrivateChannel('orders.'.$this->order->id);
}
```

如果你希望事件在多个频道上广播，你可以返回一个 `array`：

```php
use Illuminate\Broadcasting\PrivateChannel;

/**
 * Get the channels the event should broadcast on.
 *
 * @return array<int, \Illuminate\Broadcasting\Channel>
 */
public function broadcastOn(): array
{
    return [
        new PrivateChannel('orders.'.$this->order->id),
        // ...
    ];
}
```

<a name="example-application-authorizing-channels"></a>
#### 授权频道

请记住，用户必须获得授权才能在私有频道上监听。我们可以在应用的 `routes/channels.php` 文件中定义频道授权规则。在此示例中，我们需要验证任何试图监听私有 `orders.1` 频道的用户是否确实是该订单的创建者：

```php
use App\Models\Order;
use App\Models\User;

Broadcast::channel('orders.{orderId}', function (User $user, int $orderId) {
    return $user->id === Order::findOrNew($orderId)->user_id;
});
```

`channel` 方法接受两个参数：频道名称和一个回调，该回调返回 `true` 或 `false`，指示用户是否有权监听该频道。

所有授权回调都将当前认证用户作为第一个参数，将任何额外的通配符参数作为后续参数。在此示例中，我们使用 `{orderId}` 占位符来指示频道名称的"ID"部分是一个通配符。

<a name="listening-for-event-broadcasts"></a>
#### 监听事件广播

接下来，剩下的就是在我们的 JavaScript 应用中监听事件。我们可以使用 [Laravel Echo](#client-side-installation) 来实现。Laravel Echo 内置的 React、Vue 和 Svelte 钩子使其易于入门，默认情况下，事件的所有公共属性都将包含在广播事件中：

```js tab=React
import { useEcho } from "@laravel/echo-react";

useEcho(
    `orders.${orderId}`,
    "OrderShipmentStatusUpdated",
    (e) => {
        console.log(e.order);
    },
);
```

```vue tab=Vue
<script setup lang="ts">
import { useEcho } from "@laravel/echo-vue";

useEcho(
    `orders.${orderId}`,
    "OrderShipmentStatusUpdated",
    (e) => {
        console.log(e.order);
    },
);
</script>
```

```svelte tab=Svelte
<script>
import { useEcho } from "@laravel/echo-svelte";

useEcho(
    `orders.${orderId}`,
    "OrderShipmentStatusUpdated",
    (e) => {
        console.log(e.order);
    },
);
</script>
```

<a name="defining-broadcast-events"></a>
## 定义广播事件

要通知 Laravel 给定事件应被广播，你必须在事件类上实现 `Illuminate\Contracts\Broadcasting\ShouldBroadcast` 接口。框架生成的所有事件类都已导入此接口，因此你可以轻松地将其添加到任何事件中。

`ShouldBroadcast` 接口要求你实现一个方法：`broadcastOn`。`broadcastOn` 方法应返回事件应广播到的频道或频道数组。频道应为 `Channel`、`PrivateChannel` 或 `PresenceChannel` 的实例。`Channel` 实例表示任何用户都可以订阅的公共频道，而 `PrivateChannels` 和 `PresenceChannels` 表示需要[频道授权](#authorizing-channels)的私有频道：

```php
<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class ServerCreated implements ShouldBroadcast
{
    use SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public User $user,
    ) {}

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.'.$this->user->id),
        ];
    }
}
```

实现 `ShouldBroadcast` 接口后，你只需像往常一样[触发事件](/docs/{{version}}/events)。事件触发后，[队列任务](/docs/{{version}}/queues)将使用你指定的广播驱动自动广播该事件。

<a name="broadcast-name"></a>
### 广播名称

默认情况下，Laravel 将使用事件的类名进行广播。但是，你可以通过定义 `broadcastAs` 方法来自定义广播名称：

```php
/**
 * The event's broadcast name.
 */
public function broadcastAs(): string
{
    return 'server.created';
}
```

如果你使用 `broadcastAs` 方法自定义了广播名称，请确保在注册监听器时使用前导 `.` 字符。这将指示 Echo 不要将应用的命名空间添加到事件前面：

```javascript
.listen('.server.created', function (e) {
    // ...
});
```

<a name="broadcast-data"></a>
### 广播数据

当事件被广播时，其所有 `public` 属性都会自动序列化并作为事件的负载进行广播，允许你从 JavaScript 应用访问其任何公共数据。例如，如果你的事件具有一个包含 Eloquent 模型的公共 `$user` 属性，则事件的广播负载将是：

```json
{
    "user": {
        "id": 1,
        "name": "Patrick Stewart"
        ...
    }
}
```

但是，如果你希望对广播负载进行更精细的控制，你可以向事件添加一个 `broadcastWith` 方法。此方法应返回你希望作为事件负载广播的数据数组：

```php
/**
 * Get the data to broadcast.
 *
 * @return array<string, mixed>
 */
public function broadcastWith(): array
{
    return ['id' => $this->user->id];
}
```

<a name="broadcast-queue"></a>
### 广播队列

默认情况下，每个广播事件都放置在你的 `queue.php` 配置文件中指定的默认队列连接的默认队列上。你可以通过在事件类上使用 `Connection` 和 `Queue` 属性来自定义广播器使用的队列连接和名称：

```php
use Illuminate\Queue\Attributes\Connection;
use Illuminate\Queue\Attributes\Queue;

#[Connection('redis')]
#[Queue('default')]
class ServerCreated implements ShouldBroadcast
{
    // ...
}
```

或者，你可以通过定义 `broadcastQueue` 方法来自定义队列名称：

```php
/**
 * The name of the queue on which to place the broadcasting job.
 */
public function broadcastQueue(): string
{
    return 'default';
}
```

如果你希望使用 `sync` 队列而不是默认的队列驱动来广播事件，你可以实现 `ShouldBroadcastNow` 接口而不是 `ShouldBroadcast`：

```php
<?php

namespace App\Events;

use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;

class OrderShipmentStatusUpdated implements ShouldBroadcastNow
{
    // ...
}
```

<a name="broadcast-conditions"></a>
### 广播条件

有时你只希望在给定条件为真时广播事件。你可以通过向事件类添加 `broadcastWhen` 方法来定义这些条件：

```php
/**
 * Determine if this event should broadcast.
 */
public function broadcastWhen(): bool
{
    return $this->order->value > 100;
}
```

<a name="broadcasting-and-database-transactions"></a>
#### 广播和数据库事务

当在数据库事务中分发射频事件时，它们可能会在数据库事务提交之前被队列处理。发生这种情况时，你在数据库事务期间对模型或数据库记录所做的任何更新可能尚未反映在数据库中。此外，在事务中创建的任何模型或数据库记录可能不存在于数据库中。如果你的事件依赖这些模型，则处理广播事件的任务时可能会发生意外错误。

如果你的队列连接的 `after_commit` 配置选项设置为 `false`，你仍然可以通过在事件类上实现 `ShouldDispatchAfterCommit` 接口来指示特定的广播事件应在所有打开的数据库事务提交后才被分发：

```php
<?php

namespace App\Events;

use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Queue\SerializesModels;

class ServerCreated implements ShouldBroadcast, ShouldDispatchAfterCommit
{
    use SerializesModels;
}
```

> [!NOTE]
> 要了解有关解决这些问题的更多信息，请查阅有关[队列任务和数据库事务](/docs/{{version}}/queues#jobs-and-database-transactions)的文档。

<a name="authorizing-channels"></a>
## 授权频道

私有频道要求你授权当前认证用户确实可以在该频道上监听。这是通过向你的 Laravel 应用发出带有频道名称的 HTTP 请求来完成的，并允许你的应用确定用户是否可以监听该频道。使用 [Laravel Echo](#client-side-installation) 时，用于授权订阅私有频道的 HTTP 请求将自动发出。

安装广播后，Laravel 会尝试自动注册 `/broadcasting/auth` 路由来处理授权请求。如果 Laravel 无法自动注册这些路由，你可以手动在应用的 `/bootstrap/app.php` 文件中注册它们：

```php
->withRouting(
    web: __DIR__.'/../routes/web.php',
    channels: __DIR__.'/../routes/channels.php',
    health: '/up',
)
```

<a name="defining-authorization-callbacks"></a>
### 定义授权回调

接下来，我们需要定义实际确定当前认证用户是否可以监听给定频道的逻辑。这是在 `routes/channels.php` 文件中完成的，该文件由 `install:broadcasting` Artisan 命令创建。在此文件中，你可以使用 `Broadcast::channel` 方法注册频道授权回调：

```php
use App\Models\User;

Broadcast::channel('orders.{orderId}', function (User $user, int $orderId) {
    return $user->id === Order::findOrNew($orderId)->user_id;
});
```

`channel` 方法接受两个参数：频道名称和一个回调，该回调返回 `true` 或 `false`，指示用户是否有权监听该频道。

所有授权回调都将当前认证用户作为第一个参数，将任何额外的通配符参数作为后续参数。在此示例中，我们使用 `{orderId}` 占位符来指示频道名称的"ID"部分是一个通配符。

你可以使用 `channel:list` Artisan 命令查看应用的广播授权回调列表：

```shell
php artisan channel:list
```

<a name="authorization-callback-model-binding"></a>
#### 授权回调模型绑定

就像 HTTP 路由一样，频道路由也可以利用隐式和显式[路由模型绑定](/docs/{{version}}/routing#route-model-binding)。例如，你可以请求实际的 `Order` 模型实例，而不是接收字符串或数字订单 ID：

```php
use App\Models\Order;
use App\Models\User;

Broadcast::channel('orders.{order}', function (User $user, Order $order) {
    return $user->id === $order->user_id;
});
```

> [!WARNING]
> 与 HTTP 路由模型绑定不同，频道模型绑定不支持自动[隐式模型绑定作用域](/docs/{{version}}/routing#implicit-model-binding-scoping)。但这很少成为问题，因为大多数频道可以基于单个模型的唯一主键来确定作用域。

<a name="authorization-callback-authentication"></a>
#### 授权回调认证

私有和在线广播频道通过应用的默认认证守卫对当前用户进行认证。如果用户未认证，频道授权将自动被拒绝，并且授权回调永远不会执行。但是，如果需要，你可以分配多个自定义守卫来认证传入请求：

```php
Broadcast::channel('channel', function () {
    // ...
}, ['guards' => ['web', 'admin']]);
```

<a name="defining-channel-classes"></a>
### 定义频道类

如果你的应用使用了大量不同的频道，`routes/channels.php` 文件可能会变得庞大。因此，你可以使用频道类而不是闭包来授权频道。要生成频道类，请使用 `make:channel` Artisan 命令。此命令将在 `App/Broadcasting` 目录中放置一个新的频道类。

```shell
php artisan make:channel OrderChannel
```

接下来，在你的 `routes/channels.php` 文件中注册你的频道：

```php
use App\Broadcasting\OrderChannel;

Broadcast::channel('orders.{order}', OrderChannel::class);
```

最后，你可以将频道的授权逻辑放在频道类的 `join` 方法中。此 `join` 方法将包含你通常放置在频道授权闭包中的相同逻辑。你还可以利用频道模型绑定：

```php
<?php

namespace App\Broadcasting;

use App\Models\Order;
use App\Models\User;

class OrderChannel
{
    /**
     * Create a new channel instance.
     */
    public function __construct() {}

    /**
     * Authenticate the user's access to the channel.
     */
    public function join(User $user, Order $order): array|bool
    {
        return $user->id === $order->user_id;
    }
}
```

> [!NOTE]
> 与 Laravel 中的许多其他类一样，频道类将自动由[服务容器](/docs/{{version}}/container)解析。因此，你可以在其构造函数中类型提示频道所需的任何依赖项。

<a name="broadcasting-events"></a>
## 广播事件

定义事件并使用 `ShouldBroadcast` 接口标记后，你只需使用事件的 dispatch 方法触发事件即可。事件分发器会注意到事件已标记了 `ShouldBroadcast` 接口，并将该事件排队以进行广播：

```php
use App\Events\OrderShipmentStatusUpdated;

OrderShipmentStatusUpdated::dispatch($order);
```

<a name="only-to-others"></a>
### 仅限其他人

在构建利用事件广播的应用时，有时你可能需要将事件广播到给定频道的所有订阅者，但当前用户除外。你可以使用 `broadcast` 辅助函数和 `toOthers` 方法来实现：

```php
use App\Events\OrderShipmentStatusUpdated;

broadcast(new OrderShipmentStatusUpdated($update))->toOthers();
```

为了更好地理解何时需要使用 `toOthers` 方法，让我们想象一个任务列表应用，用户可以通过输入任务名称来创建新任务。要创建任务，你的应用可能会向 `/task` URL 发出请求，该 URL 会广播任务的创建并返回新任务的 JSON 表示。当你的 JavaScript 应用收到来自端点的响应时，它可能会直接将新任务插入到任务列表中，如下所示：

```js
axios.post('/task', task)
    .then((response) => {
        this.tasks.push(response.data);
    });
```

但是，请记住我们也广播了任务的创建。如果你的 JavaScript 应用也在监听此事件以将任务添加到任务列表，你的列表中将会出现重复的任务：一个来自端点，一个来自广播。你可以通过使用 `toOthers` 方法指示广播器不向当前用户广播事件来解决此问题。

> [!WARNING]
> 你的事件必须使用 `Illuminate\Broadcasting\InteractsWithSockets` trait 才能调用 `toOthers` 方法。

<a name="only-to-others-configuration"></a>
#### 配置

当你初始化 Laravel Echo 实例时，一个套接字 ID 被分配给该连接。如果你使用全局 [Axios](https://github.com/axios/axios) 实例从 JavaScript 应用发出 HTTP 请求，套接字 ID 将自动作为 `X-Socket-ID` 标头附加到每个出站请求。然后，当你调用 `toOthers` 方法时，Laravel 将从标头中提取套接字 ID，并指示广播器不向具有该套接字 ID 的任何连接进行广播。

如果你不使用全局 Axios 实例，你将需要手动配置 JavaScript 应用以在所有出站请求中发送 `X-Socket-ID` 标头。你可以使用 `Echo.socketId` 方法检索套接字 ID：

```js
var socketId = Echo.socketId();
```

<a name="customizing-the-connection"></a>
### 自定义连接

如果你的应用与多个广播连接交互，并且你希望使用默认广播器以外的广播器来广播事件，你可以使用 `via` 方法指定将事件推送到的连接：

```php
use App\Events\OrderShipmentStatusUpdated;

broadcast(new OrderShipmentStatusUpdated($update))->via('pusher');
```

或者，你可以在事件的构造函数中调用 `broadcastVia` 方法来指定事件的广播连接。但在此之前，请确保事件类使用了 `InteractsWithBroadcasting` trait：

```php
<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithBroadcasting;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class OrderShipmentStatusUpdated implements ShouldBroadcast
{
    use InteractsWithBroadcasting;

    /**
     * Create a new event instance.
     */
    public function __construct()
    {
        $this->broadcastVia('pusher');
    }
}
```

<a name="anonymous-events"></a>
### 匿名事件

有时，你可能希望向应用的前端广播一个简单的事件，而无需创建专门的事件类。为此，`Broadcast` 门面允许你广播"匿名事件"：

```php
Broadcast::on('orders.'.$order->id)->send();
```

上面的示例将广播以下事件：

```json
{
    "event": "AnonymousEvent",
    "data": "[]",
    "channel": "orders.1"
}
```

使用 `as` 和 `with` 方法，你可以自定义事件的名称和数据：

```php
Broadcast::on('orders.'.$order->id)
    ->as('OrderPlaced')
    ->with($order)
    ->send();
```

上面的示例将广播如下所示的事件：

```json
{
    "event": "OrderPlaced",
    "data": "{ id: 1, total: 100 }",
    "channel": "orders.1"
}
```

如果你希望在私有或在线频道上广播匿名事件，你可以使用 `private` 和 `presence` 方法：

```php
Broadcast::private('orders.'.$order->id)->send();
Broadcast::presence('channels.'.$channel->id)->send();
```

使用 `send` 方法广播匿名事件会将事件分派到应用的[队列](/docs/{{version}}/queues)进行处理。但是，如果你希望立即广播事件，可以使用 `sendNow` 方法：

```php
Broadcast::on('orders.'.$order->id)->sendNow();
```

要将事件广播给除当前认证用户之外的所有频道订阅者，你可以调用 `toOthers` 方法：

```php
Broadcast::on('orders.'.$order->id)
    ->toOthers()
    ->send();
```

<a name="rescuing-broadcasts"></a>
### 救援广播

当应用的队列服务器不可用或 Laravel 在广播事件时遇到错误时，会抛出异常，通常导致最终用户看到应用错误。由于事件广播通常是应用核心功能的补充，你可以通过在事件上实现 `ShouldRescue` 接口来防止这些异常中断用户体验。

实现 `ShouldRescue` 接口的事件在广播尝试期间会自动利用 Laravel 的[救援辅助函数](/docs/{{version}}/helpers#method-rescue)。此辅助函数会捕获任何异常，将其报告给应用的异常处理程序进行记录，并允许应用正常继续执行而不会中断用户的工作流程：

```php
<?php

namespace App\Events;

use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldRescue;

class ServerCreated implements ShouldBroadcast, ShouldRescue
{
    // ...
}
```

<a name="receiving-broadcasts"></a>
## 接收广播

<a name="listening-for-events"></a>
### 监听事件

[安装并实例化 Laravel Echo](#client-side-installation) 后，你就可以开始监听从 Laravel 应用中广播的事件了。首先，使用 `channel` 方法获取频道实例，然后调用 `listen` 方法监听指定事件：

```js
Echo.channel(`orders.${this.order.id}`)
    .listen('OrderShipmentStatusUpdated', (e) => {
        console.log(e.order.name);
    });
```

如果你想监听私有频道上的事件，请改用 `private` 方法。你可以继续链式调用 `listen` 方法以在单个频道上监听多个事件：

```js
Echo.private(`orders.${this.order.id}`)
    .listen(/* ... */)
    .listen(/* ... */)
    .listen(/* ... */);
```

<a name="stop-listening-for-events"></a>
#### 停止监听事件

如果你想在[不离开频道](#leaving-a-channel)的情况下停止监听给定事件，你可以使用 `stopListening` 方法：

```js
Echo.private(`orders.${this.order.id}`)
    .stopListening('OrderShipmentStatusUpdated');
```

<a name="leaving-a-channel"></a>
### 离开频道

要离开频道，你可以在 Echo 实例上调用 `leaveChannel` 方法：

```js
Echo.leaveChannel(`orders.${this.order.id}`);
```

如果你想离开一个频道及其关联的私有和在线频道，你可以调用 `leave` 方法：

```js
Echo.leave(`orders.${this.order.id}`);
```

<a name="namespaces"></a>
### 命名空间

在上面的示例中，你可能已经注意到我们没有指定事件类的完整 `App\Events` 命名空间。这是因为 Echo 会自动假设事件位于 `App\Events` 命名空间中。但是，你可以在实例化 Echo 时通过传递 `namespace` 配置选项来配置根命名空间：

```js
window.Echo = new Echo({
    broadcaster: 'pusher',
    // ...
    namespace: 'App.Other.Namespace'
});
```

或者，你可以使用 Echo 订阅事件时在事件类前添加 `.` 前缀。这将允许你始终指定完全限定的类名：

```js
Echo.channel('orders')
    .listen('.Namespace\\Event\\Class', (e) => {
        // ...
    });
```

<a name="using-react-or-vue"></a>
### 使用 React、Vue 或 Svelte

Laravel Echo 包含 React、Vue 和 Svelte 钩子，使得监听事件变得轻松。首先，调用 `useEcho` 钩子，它用于监听私有事件。`useEcho` 钩子会在消费组件卸载时自动离开频道：

```js tab=React
import { useEcho } from "@laravel/echo-react";

useEcho(
    `orders.${orderId}`,
    "OrderShipmentStatusUpdated",
    (e) => {
        console.log(e.order);
    },
);
```

```vue tab=Vue
<script setup lang="ts">
import { useEcho } from "@laravel/echo-vue";

useEcho(
    `orders.${orderId}`,
    "OrderShipmentStatusUpdated",
    (e) => {
        console.log(e.order);
    },
);
</script>
```

```svelte tab=Svelte
<script>
import { useEcho } from "@laravel/echo-svelte";

useEcho(
    `orders.${orderId}`,
    "OrderShipmentStatusUpdated",
    (e) => {
        console.log(e.order);
    },
);
</script>
```

你可以通过向 `useEcho` 提供事件数组来监听多个事件：

```js
useEcho(
    `orders.${orderId}`,
    ["OrderShipmentStatusUpdated", "OrderShipped"],
    (e) => {
        console.log(e.order);
    },
);
```

你还可以指定广播事件负载数据的形状，提供更强的类型安全性和编辑便利性：

```ts
type OrderData = {
    order: {
        id: number;
        user: {
            id: number;
            name: string;
        };
        created_at: string;
    };
};

useEcho<OrderData>(`orders.${orderId}`, "OrderShipmentStatusUpdated", (e) => {
    console.log(e.order.id);
    console.log(e.order.user.id);
});
```

`useEcho` 钩子会在消费组件卸载时自动离开频道；但是，你可以利用返回的函数在必要时手动停止/开始监听频道：

```js tab=React
import { useEcho } from "@laravel/echo-react";

const { leaveChannel, leave, stopListening, listen } = useEcho(
    `orders.${orderId}`,
    "OrderShipmentStatusUpdated",
    (e) => {
        console.log(e.order);
    },
);

// 停止监听但不离开频道...
stopListening();

// 再次开始监听...
listen();

// 离开频道...
leaveChannel();

// 离开频道及其关联的私有和在线频道...
leave();
```

```vue tab=Vue
<script setup lang="ts">
import { useEcho } from "@laravel/echo-vue";

const { leaveChannel, leave, stopListening, listen } = useEcho(
    `orders.${orderId}`,
    "OrderShipmentStatusUpdated",
    (e) => {
        console.log(e.order);
    },
);

// 停止监听但不离开频道...
stopListening();

// 再次开始监听...
listen();

// 离开频道...
leaveChannel();

// 离开频道及其关联的私有和在线频道...
leave();
</script>
```

```svelte tab=Svelte
<script>
import { useEcho } from "@laravel/echo-svelte";

const { leaveChannel, leave, stopListening, listen } = useEcho(
    `orders.${orderId}`,
    "OrderShipmentStatusUpdated",
    (e) => {
        console.log(e.order);
    },
);

// 停止监听但不离开频道...
stopListening();

// 再次开始监听...
listen();

// 离开频道...
leaveChannel();

// 离开频道及其关联的私有和在线频道...
leave();
</script>
```

<a name="react-vue-connecting-to-public-channels"></a>
#### 连接到公共频道

要连接到公共频道，你可以使用 `useEchoPublic` 钩子：

```js tab=React
import { useEchoPublic } from "@laravel/echo-react";

useEchoPublic("posts", "PostPublished", (e) => {
    console.log(e.post);
});
```

```vue tab=Vue
<script setup lang="ts">
import { useEchoPublic } from "@laravel/echo-vue";

useEchoPublic("posts", "PostPublished", (e) => {
    console.log(e.post);
});
</script>
```

```svelte tab=Svelte
<script>
import { useEchoPublic } from "@laravel/echo-svelte";

useEchoPublic("posts", "PostPublished", (e) => {
    console.log(e.post);
});
</script>
```

<a name="react-vue-connecting-to-presence-channels"></a>
#### 连接到在线频道

要连接到在线频道，你可以使用 `useEchoPresence` 钩子：

```js tab=React
import { useEchoPresence } from "@laravel/echo-react";

useEchoPresence("posts", "PostPublished", (e) => {
    console.log(e.post);
});
```

```vue tab=Vue
<script setup lang="ts">
import { useEchoPresence } from "@laravel/echo-vue";

useEchoPresence("posts", "PostPublished", (e) => {
    console.log(e.post);
});
</script>
```

```svelte tab=Svelte
<script>
import { useEchoPresence } from "@laravel/echo-svelte";

useEchoPresence("posts", "PostPublished", (e) => {
    console.log(e.post);
});
</script>
```

<a name="react-vue-connection-status"></a>
#### 连接状态

你可以使用 `useConnectionStatus` 钩子检索当前的 WebSocket 连接状态，它提供了在连接状态更改时自动更新的反应式状态：

```js tab=React
import { useConnectionStatus } from "@laravel/echo-react";

function ConnectionIndicator() {
    const status = useConnectionStatus();

    return <div>连接状态: {status}</div>;
}
```

```vue tab=Vue
<script setup lang="ts">
import { useConnectionStatus } from "@laravel/echo-vue";

const status = useConnectionStatus();
</script>

<template>
    <div>连接状态: {{ status }}</div>
</template>
```

```svelte tab=Svelte
<script>
import { useConnectionStatus } from "@laravel/echo-svelte";

const status = useConnectionStatus();
</script>

<div>连接状态: {status()}</div>
```

可能的连接状态值包括：

<div class="content-list" markdown="1">

- `connected` - 已成功连接到 WebSocket 服务器。
- `connecting` - 正在进行初始连接尝试。
- `reconnecting` - 在断开连接后尝试重新连接。
- `disconnected` - 未连接且未尝试重新连接。
- `failed` - 连接失败且不会重试。

</div>

<a name="react-vue-socket-id"></a>
#### 套接字 ID

你可以使用 `useSocketId` 钩子检索当前的 WebSocket 套接字 ID，它提供了一个在连接以新套接字 ID 重新连接时自动更新的反应式值：

```js tab=React
import { useSocketId } from "@laravel/echo-react";

function SocketIndicator() {
    const socketId = useSocketId();

    return <div>套接字 ID: {socketId}</div>;
}
```

```vue tab=Vue
<script setup lang="ts">
import { useSocketId } from "@laravel/echo-vue";

const socketId = useSocketId();
</script>

<template>
    <div>套接字 ID: {{ socketId }}</div>
</template>
```

```svelte tab=Svelte
<script>
import { useSocketId } from "@laravel/echo-svelte";

const socketId = useSocketId();
</script>

<div>套接字 ID: {socketId()}</div>
```

<a name="presence-channels"></a>
## 在线频道

在线频道建立在私有频道的安全性之上，同时公开了了解谁订阅了该频道的额外功能。这使得构建强大的协作应用功能变得容易，例如在另一个用户查看同一页面时通知用户，或列出聊天室的成员。

<a name="authorizing-presence-channels"></a>
### 授权在线频道

所有在线频道也是私有频道；因此，用户必须[获得授权才能访问它们](#authorizing-channels)。但是，在为在线频道定义授权回调时，如果用户被授权加入频道，你不会返回 `true`。相反，你应返回一个关于用户的数据数组。

授权回调返回的数据将在你的 JavaScript 应用中提供给在线频道事件监听器。如果用户未被授权加入在线频道，你应返回 `false` 或 `null`：

```php
use App\Models\User;

Broadcast::channel('chat.{roomId}', function (User $user, int $roomId) {
    if ($user->canJoinRoom($roomId)) {
        return ['id' => $user->id, 'name' => $user->name];
    }
});
```

<a name="joining-presence-channels"></a>
### 加入在线频道

要加入在线频道，你可以使用 Echo 的 `join` 方法。`join` 方法将返回一个 `PresenceChannel` 实现，除了暴露 `listen` 方法外，它还允许你订阅 `here`、`joining` 和 `leaving` 事件。

```js
Echo.join(`chat.${roomId}`)
    .here((users) => {
        // ...
    })
    .joining((user) => {
        console.log(user.name);
    })
    .leaving((user) => {
        console.log(user.name);
    })
    .error((error) => {
        console.error(error);
    });
```

`here` 回调将在频道成功加入后立即执行，并将接收一个数组，其中包含当前订阅到该频道的所有其他用户的用户信息。`joining` 方法将在新用户加入频道时执行，而 `leaving` 方法将在用户离开频道时执行。`error` 方法将在认证端点返回 200 以外的 HTTP 状态码或解析返回的 JSON 时出现问题时执行。

<a name="broadcasting-to-presence-channels"></a>
### 广播到在线频道

在线频道可以像公共或私有频道一样接收事件。以聊天室为例，我们可能希望将 `NewMessage` 事件广播到房间的在线频道。为此，我们将从事件的 `broadcastOn` 方法返回 `PresenceChannel` 实例：

```php
/**
 * Get the channels the event should broadcast on.
 *
 * @return array<int, \Illuminate\Broadcasting\Channel>
 */
public function broadcastOn(): array
{
    return [
        new PresenceChannel('chat.'.$this->message->room_id),
    ];
}
```

与其他事件一样，你可以使用 `broadcast` 辅助函数和 `toOthers` 方法将当前用户排除在接收广播之外：

```php
broadcast(new NewMessage($message));

broadcast(new NewMessage($message))->toOthers();
```

与其他类型的事件一样，你可以使用 Echo 的 `listen` 方法监听发送到在线频道的事件：

```js
Echo.join(`chat.${roomId}`)
    .here(/* ... */)
    .joining(/* ... */)
    .leaving(/* ... */)
    .listen('NewMessage', (e) => {
        // ...
    });
```

<a name="model-broadcasting"></a>
## 模型广播

> [!WARNING]
> 在阅读以下关于模型广播的文档之前，我们建议你熟悉 Laravel 模型广播服务的一般概念，以及如何手动创建和监听广播事件。

当应用的 [Eloquent 模型](/docs/{{version}}/eloquent)被创建、更新或删除时，通常需要广播事件。当然，这可以通过手动[为 Eloquent 模型状态更改定义自定义事件](/docs/{{version}}/eloquent#events)并用 `ShouldBroadcast` 接口标记这些事件来轻松实现。

但是，如果你不在应用中将这些事件用于其他任何目的，那么仅为了广播它们而创建事件类可能很繁琐。为了解决这个问题，Laravel 允许你指示 Eloquent 模型应自动广播其状态更改。

首先，你的 Eloquent 模型应使用 `Illuminate\Database\Eloquent\BroadcastsEvents` trait。此外，模型应定义一个 `broadcastOn` 方法，该方法将返回模型事件应广播到的频道数组：

```php
<?php

namespace App\Models;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Database\Eloquent\BroadcastsEvents;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Post extends Model
{
    use BroadcastsEvents, HasFactory;

    /**
     * Get the user that the post belongs to.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the channels that model events should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel|\Illuminate\Database\Eloquent\Model>
     */
    public function broadcastOn(string $event): array
    {
        return [$this, $this->user];
    }
}
```

一旦你的模型包含此 trait 并定义了其广播频道，它将在模型实例被创建、更新、删除、软删除或恢复时自动开始广播事件。

此外，你可能已经注意到 `broadcastOn` 方法接收一个字符串 `$event` 参数。此参数包含模型上发生的事件类型，其值为 `created`、`updated`、`deleted`、`trashed` 或 `restored`。通过检查此变量的值，你可以确定模型应为特定事件广播到哪些频道（如果有）：

```php
/**
 * Get the channels that model events should broadcast on.
 *
 * @return array<string, array<int, \Illuminate\Broadcasting\Channel|\Illuminate\Database\Eloquent\Model>>
 */
public function broadcastOn(string $event): array
{
    return match ($event) {
        'deleted' => [],
        default => [$this, $this->user],
    };
}
```

<a name="customizing-model-broadcasting-event-creation"></a>
#### 自定义模型广播事件创建

有时，你可能希望自定义 Laravel 如何创建底层的模型广播事件。你可以通过在 Eloquent 模型上定义 `newBroadcastableEvent` 方法来实现。此方法应返回一个 `Illuminate\Database\Eloquent\BroadcastableModelEventOccurred` 实例：

```php
use Illuminate\Database\Eloquent\BroadcastableModelEventOccurred;

/**
 * Create a new broadcastable model event for the model.
 */
protected function newBroadcastableEvent(string $event): BroadcastableModelEventOccurred
{
    return (new BroadcastableModelEventOccurred(
        $this, $event
    ))->dontBroadcastToCurrentUser();
}
```

<a name="model-broadcasting-conventions"></a>
### 模型广播约定

<a name="model-broadcasting-channel-conventions"></a>
#### 频道约定

你可能已经注意到，上面模型示例中的 `broadcastOn` 方法没有返回 `Channel` 实例。相反，直接返回了 Eloquent 模型。如果模型的 `broadcastOn` 方法返回了 Eloquent 模型实例（或包含在方法返回的数组中），Laravel 将自动使用模型的类名和主键标识符作为频道名称为该模型实例化一个私有频道实例。

因此，`id` 为 `1` 的 `App\Models\User` 模型将被转换为 `Illuminate\Broadcasting\PrivateChannel` 实例，名称为 `App.Models.User.1`。当然，除了从模型的 `broadcastOn` 方法返回 Eloquent 模型实例外，你还可以返回完整的 `Channel` 实例以完全控制模型的频道名称：

```php
use Illuminate\Broadcasting\PrivateChannel;

/**
 * Get the channels that model events should broadcast on.
 *
 * @return array<int, \Illuminate\Broadcasting\Channel>
 */
public function broadcastOn(string $event): array
{
    return [
        new PrivateChannel('user.'.$this->id)
    ];
}
```

如果你计划从模型的 `broadcastOn` 方法显式返回一个频道实例，你可以向频道的构造函数传递一个 Eloquent 模型实例。这样做时，Laravel 将使用上面讨论的模型频道约定将 Eloquent 模型转换为频道名称字符串：

```php
return [new Channel($this->user)];
```

如果你需要确定模型的频道名称，你可以在任何模型实例上调用 `broadcastChannel` 方法。例如，对于 `id` 为 `1` 的 `App\Models\User` 模型，此方法返回字符串 `App.Models.User.1`：

```php
$user->broadcastChannel();
```

<a name="model-broadcasting-event-conventions"></a>
#### 事件约定

由于模型广播事件不与应用 `App\Events` 目录中的"实际"事件关联，它们根据约定分配名称和负载。Laravel 的约定是使用模型的类名（不包括命名空间）和触发广播的模型事件名称来广播事件。

因此，例如，对 `App\Models\Post` 模型的更新将作为 `PostUpdated` 事件广播到客户端应用，并包含以下负载：

```json
{
    "model": {
        "id": 1,
        "title": "My first post"
        ...
    },
    ...
    "socket": "someSocketId"
}
```

删除 `App\Models\User` 模型将广播一个名为 `UserDeleted` 的事件。

如果愿意，你可以通过向模型添加 `broadcastAs` 和 `broadcastWith` 方法来定义自定义广播名称和负载。这些方法接收正在发生的模型事件/操作的名称，允许你为每个模型操作自定义事件的名称和负载。如果 `broadcastAs` 方法返回 `null`，Laravel 将在广播事件时使用上面讨论的模型广播事件名称约定：

```php
/**
 * The model event's broadcast name.
 */
public function broadcastAs(string $event): string|null
{
    return match ($event) {
        'created' => 'post.created',
        default => null,
    };
}

/**
 * Get the data to broadcast for the model.
 *
 * @return array<string, mixed>
 */
public function broadcastWith(string $event): array
{
    return match ($event) {
        'created' => ['title' => $this->title],
        default => ['model' => $this],
    };
}
```

<a name="listening-for-model-broadcasts"></a>
### 监听模型广播

一旦你向模型添加了 `BroadcastsEvents` trait 并定义了模型的 `broadcastOn` 方法，你就可以开始在客户端应用中监听广播的模型事件了。在开始之前，你可能希望查阅完整的[监听事件文档](#listening-for-events)。

首先，使用 `private` 方法获取频道实例，然后调用 `listen` 方法监听指定事件。通常，传递给 `private` 方法的频道名称应对应于 Laravel 的[模型广播约定](#model-broadcasting-conventions)。

获取频道实例后，你可以使用 `listen` 方法监听特定事件。由于模型广播事件不与应用的 `App\Events` 目录中的"实际"事件关联，[事件名称](#model-broadcasting-event-conventions)必须以 `.` 为前缀，以指示它不属于特定的命名空间。每个模型广播事件都有一个 `model` 属性，其中包含模型的所有可广播属性：

```js
Echo.private(`App.Models.User.${this.user.id}`)
    .listen('.UserUpdated', (e) => {
        console.log(e.model);
    });
```

<a name="model-broadcasts-with-react-or-vue"></a>
#### 使用 React、Vue 或 Svelte

如果你使用 React、Vue 或 Svelte，你可以使用 Laravel Echo 附带的 `useEchoModel` 钩子轻松监听模型广播：

```js tab=React
import { useEchoModel } from "@laravel/echo-react";

useEchoModel("App.Models.User", userId, ["UserUpdated"], (e) => {
    console.log(e.model);
});
```

```vue tab=Vue
<script setup lang="ts">
import { useEchoModel } from "@laravel/echo-vue";

useEchoModel("App.Models.User", userId, ["UserUpdated"], (e) => {
    console.log(e.model);
});
</script>
```

```svelte tab=Svelte
<script>
import { useEchoModel } from "@laravel/echo-svelte";

useEchoModel("App.Models.User", userId, ["UserUpdated"], (e) => {
    console.log(e.model);
});
</script>
```

你还可以指定模型事件负载数据的形状，提供更强的类型安全性和编辑便利性：

```ts
type User = {
    id: number;
    name: string;
    email: string;
};

useEchoModel<User, "App.Models.User">("App.Models.User", userId, ["UserUpdated"], (e) => {
    console.log(e.model.id);
    console.log(e.model.name);
});
```

<a name="client-events"></a>
## 客户端事件

> [!NOTE]
> 使用 [Pusher Channels](https://pusher.com/channels) 时，你必须在[应用仪表板](https://dashboard.pusher.com/)的"App Settings"部分启用"Client Events"选项才能发送客户端事件。

有时你可能希望向其他已连接的客户端广播事件，而完全不需要访问你的 Laravel 应用。这对于"正在输入"通知等功能特别有用，你希望通知你的应用用户另一个用户正在给定屏幕上输入消息。

要广播客户端事件，你可以使用 Echo 的 `whisper` 方法：

```js tab=JavaScript
Echo.private(`chat.${roomId}`)
    .whisper('typing', {
        name: this.user.name
    });
```

```js tab=React
import { useEcho } from "@laravel/echo-react";

const { channel } = useEcho(`chat.${roomId}`, ['update'], (e) => {
    console.log('Chat event received:', e);
});

channel().whisper('typing', { name: user.name });
```

```vue tab=Vue
<script setup lang="ts">
import { useEcho } from "@laravel/echo-vue";

const { channel } = useEcho(`chat.${roomId}`, ['update'], (e) => {
    console.log('Chat event received:', e);
});

channel().whisper('typing', { name: user.name });
</script>
```

```svelte tab=Svelte
<script>
import { useEcho } from "@laravel/echo-svelte";

const { channel } = useEcho(`chat.${roomId}`, ['update'], (e) => {
    console.log('Chat event received:', e);
});

channel().whisper('typing', { name: user.name });
</script>
```

要监听客户端事件，你可以使用 `listenForWhisper` 方法：

```js tab=JavaScript
Echo.private(`chat.${roomId}`)
    .listenForWhisper('typing', (e) => {
        console.log(e.name);
    });
```

```js tab=React
import { useEcho } from "@laravel/echo-react";

const { channel } = useEcho(`chat.${roomId}`, ['update'], (e) => {
    console.log('Chat event received:', e);
});

channel().listenForWhisper('typing', (e) => {
    console.log(e.name);
});
```

```vue tab=Vue
<script setup lang="ts">
import { useEcho } from "@laravel/echo-vue";

const { channel } = useEcho(`chat.${roomId}`, ['update'], (e) => {
    console.log('Chat event received:', e);
});

channel().listenForWhisper('typing', (e) => {
    console.log(e.name);
});
</script>
```

```svelte tab=Svelte
<script>
import { useEcho } from "@laravel/echo-svelte";

const { channel } = useEcho(`chat.${roomId}`, ['update'], (e) => {
    console.log('Chat event received:', e);
});

channel().listenForWhisper('typing', (e) => {
    console.log(e.name);
});
</script>
```

<a name="notifications"></a>
## 通知

通过将事件广播与[通知](/docs/{{version}}/notifications)配对，你的 JavaScript 应用可以在新通知发生时接收它们，而无需刷新页面。在开始之前，请务必阅读使用[广播通知通道](/docs/{{version}}/notifications#broadcast-notifications)的文档。

配置通知使用广播通道后，你可以使用 Echo 的 `notification` 方法监听广播事件。请记住，频道名称应与接收通知的实体的类名相匹配：

```js tab=JavaScript
Echo.private(`App.Models.User.${userId}`)
    .notification((notification) => {
        console.log(notification.type);
    });
```

```js tab=React
import { useEchoModel } from "@laravel/echo-react";

const { channel } = useEchoModel('App.Models.User', userId);

channel().notification((notification) => {
    console.log(notification.type);
});
```

```vue tab=Vue
<script setup lang="ts">
import { useEchoModel } from "@laravel/echo-vue";

const { channel } = useEchoModel('App.Models.User', userId);

channel().notification((notification) => {
    console.log(notification.type);
});
</script>
```

```svelte tab=Svelte
<script>
import { useEchoModel } from "@laravel/echo-svelte";

const { channel } = useEchoModel('App.Models.User', userId);

channel().notification((notification) => {
    console.log(notification.type);
});
</script>
```

在此示例中，通过 `broadcast` 通道发送给 `App\Models\User` 实例的所有通知都将被回调接收。你的应用 `routes/channels.php` 文件中包含 `App.Models.User.{id}` 频道的频道授权回调。

<a name="stop-listening-for-notifications"></a>
#### 停止监听通知

如果你想在[不离开频道](#leaving-a-channel)的情况下停止监听通知，你可以使用 `stopListeningForNotification` 方法：

```js
const callback = (notification) => {
    console.log(notification.type);
}

// 开始监听...
Echo.private(`App.Models.User.${userId}`)
    .notification(callback);

// 停止监听（回调必须相同）...
Echo.private(`App.Models.User.${userId}`)
    .stopListeningForNotification(callback);
```

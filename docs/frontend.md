# 前端

- [简介](#introduction)
- [使用 PHP](#using-php)
    - [PHP 和 Blade](#php-and-blade)
    - [Livewire](#livewire)
    - [入门套件](#php-starter-kits)
- [使用 React、Svelte 或 Vue](#using-react-svelte-or-vue)
    - [Inertia](#inertia)
    - [入门套件](#inertia-starter-kits)
- [打包资源](#bundling-assets)

<a name="introduction"></a>
## 简介

Laravel 是一个后端框架，提供构建现代 Web 应用所需的所有功能，例如[路由](/docs/{{version}}/routing)、[验证](/docs/{{version}}/validation)、[缓存](/docs/{{version}}/cache)、[队列](/docs/{{version}}/queues)、[文件存储](/docs/{{version}}/filesystem)等。然而，我们认为为开发者提供优美的全栈体验也很重要，包括构建应用前端的强大方法。

在使用 Laravel 构建应用时，有两种主要方法可以处理前端开发，您选择哪种方法取决于您是希望使用 PHP 还是使用 React、Svelte 和 Vue 等 JavaScript 框架来构建前端。下面我们将讨论这两种选项，以便您能为应用选择最佳的前端开发方法。

<a name="using-php"></a>
## 使用 PHP

<a name="php-and-blade"></a>
### PHP 和 Blade

在过去，大多数 PHP 应用使用简单的 HTML 模板，其中穿插 PHP `echo` 语句来渲染在请求期间从数据库检索的数据，从而向浏览器渲染 HTML：

```blade
<div>
    <?php foreach ($users as $user): ?>
        Hello, <?php echo $user->name; ?> <br />
    <?php endforeach; ?>
</div>
```

在 Laravel 中，仍然可以使用[视图](/docs/{{version}}/views)和 [Blade](/docs/{{version}}/blade) 来实现这种渲染 HTML 的方法。Blade 是一个极其轻量级的模板语言，为显示数据、遍历数据等提供了便捷的短语法：

```blade
<div>
    @foreach ($users as $user)
        Hello, {{ $user->name }} <br />
    @endforeach
</div>
```

以这种方式构建应用时，表单提交和其他页面交互通常会从服务器接收一个全新的 HTML 文档，整个页面由浏览器重新渲染。即使在今天，许多应用仍然非常适合以这种方式使用简单的 Blade 模板构建前端。

<a name="growing-expectations"></a>
#### 不断增长的期望

然而，随着用户对 Web 应用的期望不断提高，许多开发者发现需要构建更动态的前端，提供更流畅的交互体验。有鉴于此，一些开发者选择使用 React、Svelte 和 Vue 等 JavaScript 框架开始构建应用的前端。

另一些开发者则倾向于坚持使用他们熟悉的后端语言，开发出允许构建现代 Web 应用 UI 的同时仍主要使用后端语言的解决方案。例如，在 [Rails](https://rubyonrails.org/) 生态系统中，这催生了诸如 [Turbo](https://turbo.hotwired.dev/) [Hotwire](https://hotwired.dev/) 和 [Stimulus](https://stimulus.hotwired.dev/) 等库。

在 Laravel 生态系统中，主要通过 PHP 创建现代动态前端的需求催生了 [Laravel Livewire](https://livewire.laravel.com) 和 [Alpine.js](https://alpinejs.dev/)。

<a name="livewire"></a>
### Livewire

[Laravel Livewire](https://livewire.laravel.com) 是一个用于构建 Laravel 驱动的前端的框架，它提供的动态、现代、生动的体验就像使用 React、Svelte 和 Vue 等现代 JavaScript 框架构建的前端一样。

使用 Livewire 时，您将创建 Livewire"组件"，这些组件渲染 UI 的一个独立部分，并公开可从应用前端调用和交互的方法和数据。例如，一个简单的"Counter"组件可能如下所示：

```php
<?php

use Livewire\Component;

new class extends Component
{
    public $count = 0;

    public function increment()
    {
        $this->count++;
    }
};
?>

<div>
    <button wire:click="increment">+</button>
    <h1>{{ $count }}</h1>
</div>

```

如您所见，Livewire 使您能够编写新的 HTML 属性（如 `wire:click`），将 Laravel 应用的前端和后端连接起来。此外，您可以使用简单的 Blade 表达式渲染组件的当前状态。

对许多人来说，Livewire 彻底改变了 Laravel 的前端开发方式，使他们能够在构建现代动态 Web 应用的同时，仍然停留在舒适的 Laravel 环境中。通常，使用 Livewire 的开发者也会利用 [Alpine.js](https://alpinejs.dev/) 在需要的地方向前端"点缀"JavaScript，例如渲染对话框窗口。

如果您是 Laravel 新手，我们建议您先熟悉[视图](/docs/{{version}}/views)和 [Blade](/docs/{{version}}/blade) 的基本用法。然后，查阅官方 [Laravel Livewire 文档](https://livewire.laravel.com/docs)，了解如何使用交互式 Livewire 组件将您的应用提升到新的水平。

<a name="php-starter-kits"></a>
### 入门套件

如果您想使用 PHP 和 Livewire 构建前端，可以利用我们的 [Livewire 入门套件](/docs/{{version}}/starter-kits)来快速启动应用开发。

<a name="using-react-svelte-or-vue"></a>
## 使用 React、Svelte 或 Vue

虽然可以使用 Laravel 和 Livewire 构建现代前端，但许多开发者仍然倾向于利用 React、Svelte 或 Vue 等 JavaScript 框架的强大功能。这使开发者能够利用通过 NPM 提供的丰富 JavaScript 包和工具生态系统。

然而，如果没有额外的工具，将 Laravel 与 React、Svelte 或 Vue 配对将需要解决各种复杂问题，如客户端路由、数据水化和身份验证。客户端路由通常通过使用 [Next](https://nextjs.org/) 和 [Nuxt](https://nuxt.com/) 等约定优先的 React/Svelte/Vue 框架来简化；然而，将 Laravel 等后端框架与这些前端框架配对时，数据水化和身份验证仍然是复杂且繁琐的问题。

此外，开发者需要维护两个独立的代码仓库，通常需要协调两个仓库的维护、发布和部署。虽然这些问题并非不可克服，但我们认为这不是一种高效或愉快的应用开发方式。

<a name="inertia"></a>
### Inertia

幸运的是，Laravel 提供了两全其美的方案。[Inertia](https://inertiajs.com) 弥合了您的 Laravel 应用与现代 React、Svelte 或 Vue 前端之间的差距，允许您使用 React、Svelte 或 Vue 构建完整的现代前端，同时利用 Laravel 路由和控制器进行路由、数据水化和身份验证——所有这些都在一个代码仓库中。通过这种方法，您可以同时享受 Laravel 和 React/Svelte/Vue 的全部功能，而不会削弱任何一个工具的能力。

在 Laravel 应用中安装 Inertia 后，您可以像往常一样编写路由和控制器。但是，您不必从控制器返回 Blade 模板，而是返回一个 Inertia 页面：

```php
<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * 显示指定用户的个人资料。
     */
    public function show(string $id): Response
    {
        return Inertia::render('users/show', [
            'user' => User::findOrFail($id)
        ]);
    }
}
```

Inertia 页面对应于一个 React、Svelte 或 Vue 组件，通常存储在应用的 `resources/js/pages` 目录中。通过 `Inertia::render` 方法传递给页面的数据将用于水化页面组件的"props"：

```jsx
import Layout from '@/layouts/authenticated';
import { Head } from '@inertiajs/react';

export default function Show({ user }) {
    return (
        <Layout>
            <Head title="Welcome" />
            <h1>Welcome</h1>
            <p>Hello {user.name}, welcome to Inertia.</p>
        </Layout>
    )
}
```

如您所见，Inertia 允许您在构建前端时充分利用 React、Svelte 或 Vue 的全部功能，同时在 Laravel 驱动的后端和 JavaScript 驱动的前端之间提供一个轻量级桥梁。

#### 服务器端渲染

如果您因为应用需要服务器端渲染而担心深入使用 Inertia，请不要担心。Inertia 提供[服务器端渲染支持](https://inertiajs.com/server-side-rendering)。而且，在通过 [Laravel Cloud](https://cloud.laravel.com) 或 [Laravel Forge](https://forge.laravel.com) 部署应用时，确保 Inertia 的服务器端渲染进程始终运行是非常简单的。

<a name="inertia-starter-kits"></a>
### 入门套件

如果您想使用 Inertia 和 React/Svelte/Vue 构建前端，可以利用我们的 [React、Svelte 或 Vue 应用入门套件](/docs/{{version}}/starter-kits)来快速启动应用开发。所有这些入门套件都使用 Inertia、React/Svelte/Vue、[Tailwind](https://tailwindcss.com) 和 [Vite](https://vitejs.dev) 搭建了应用的后端和前端身份验证流程，以便您可以开始构建下一个重要想法。

<a name="bundling-assets"></a>
## 打包资源

无论您选择使用 Blade 和 Livewire 还是 React/Svelte/Vue 和 Inertia 开发前端，您都可能需要将应用的 CSS 打包为可用于生产的资源。当然，如果您选择使用 React、Svelte 或 Vue 构建应用前端，您还需要将组件打包为浏览器可用的 JavaScript 资源。

默认情况下，Laravel 使用 [Vite](https://vitejs.dev) 打包您的资源。Vite 提供极快的构建速度和近乎即时的热模块替换（HMR）。在所有新的 Laravel 应用中，包括使用我们的[入门套件](/docs/{{version}}/starter-kits)的应用，您都会找到一个 `vite.config.js` 文件，它加载了我们轻量级的 Laravel Vite 插件，使 Vite 与 Laravel 应用的使用变得愉悦。

开始使用 Laravel 和 Vite 的最快方法是使用[我们的应用入门套件](/docs/{{version}}/starter-kits)开始应用开发，这些套件通过提供前端和后端身份验证脚手架来快速启动您的应用。

> [!NOTE]
> 有关在 Laravel 中使用 Vite 的更详细文档，请查看我们关于[打包和编译资源](/docs/{{version}}/vite)的专门文档。

# Laravel Mix

- [简介](#introduction)

<a name="introduction"></a>
## 简介

> [!WARNING]
> Laravel Mix 是一个已不再积极维护的旧版软件包。[Vite](/docs/{{version}}/vite) 可作为现代替代方案。

[Laravel Mix](https://github.com/laravel-mix/laravel-mix) 是由 [Laracasts](https://laracasts.com) 创始人 Jeffrey Way 开发的软件包，它提供了一种流畅的 API，用于使用几种常见的 CSS 和 JavaScript 预处理器来定义 [webpack](https://webpack.js.org) 构建步骤。

换句话说，Mix 使得编译和压缩应用程序的 CSS 和 JavaScript 文件变得轻而易举。通过简单的方法链，你可以流畅地定义资产管道。例如：

```js
mix.js('resources/js/app.js', 'public/js')
    .postCss('resources/css/app.css', 'public/css');
```

如果你曾经对 webpack 和资产编译感到困惑和不知所措，那么你会喜欢 Laravel Mix。但是，在开发应用程序时并不强制使用它；你可以自由使用任何资产管道工具，甚至完全不使用。

> [!NOTE]
> Vite 已在新 Laravel 安装中取代了 Laravel Mix。有关 Mix 的文档，请访问[官方 Laravel Mix](https://laravel-mix.com/) 网站。如果你想切换到 Vite，请参阅我们的 [Vite 迁移指南](https://github.com/laravel/vite-plugin/blob/main/UPGRADE.md#migrating-from-laravel-mix-to-vite)。

# 安装

- [认识 Laravel](#meet-laravel)
    - [为什么选择 Laravel？](#why-laravel)
- [创建 Laravel 应用](#creating-a-laravel-project)
    - [使用 AI 入门](#getting-started-using-ai)
    - [安装 PHP 和 Laravel 安装器](#installing-php)
    - [创建应用](#creating-an-application)
- [初始配置](#initial-configuration)
    - [基于环境的配置](#environment-based-configuration)
    - [数据库与迁移](#databases-and-migrations)
    - [目录配置](#directory-configuration)
- [使用 Herd 安装](#installation-using-herd)
    - [macOS 上的 Herd](#herd-on-macos)
    - [Windows 上的 Herd](#herd-on-windows)
- [IDE 支持](#ide-support)
- [Laravel 与 AI](#laravel-and-ai)
    - [安装 Laravel Boost](#installing-laravel-boost)
- [下一步](#next-steps)
    - [Laravel 全栈框架](#laravel-the-fullstack-framework)
    - [Laravel API 后端](#laravel-the-api-backend)

<a name="meet-laravel"></a>
## 认识 Laravel

Laravel 是一个具有表达力强且优雅语法的 Web 应用框架。Web 框架为创建应用提供了结构和起点，让您可以专注于创造精彩的内容，而我们将为您处理细节。

Laravel 致力于提供出色的开发者体验，同时提供强大的功能，如完善的依赖注入、表达力强的数据库抽象层、队列和定时任务、单元测试和集成测试等。

无论您是 PHP Web 框架的新手，还是拥有多年经验，Laravel 都能与您一起成长。我们将帮助您迈出作为 Web 开发者的第一步，或者帮助您将专业知识提升到新的水平。我们迫不及待地想看到您构建的作品。

<a name="why-laravel"></a>
### 为什么选择 Laravel？

在构建 Web 应用时，您可以使用多种工具和框架。但我们相信 Laravel 是构建现代全栈 Web 应用的最佳选择。

#### 渐进式框架

我们喜欢称 Laravel 为"渐进式"框架。这意味着 Laravel 会随着您的成长而成长。如果您刚刚踏入 Web 开发领域，Laravel 丰富的文档、指南和[视频教程](https://laracasts.com)将帮助您轻松上手，不会让您感到不知所措。

如果您是高级开发者，Laravel 为您提供了强大的工具，如[依赖注入](/docs/{{version}}/container)、[单元测试](/docs/{{version}}/testing)、[队列](/docs/{{version}}/queues)、[实时事件](/docs/{{version}}/broadcasting)等。Laravel 专为构建专业 Web 应用而优化，并能够处理企业级工作负载。

#### 可扩展框架

Laravel 具有极强的可扩展性。得益于 PHP 的扩展友好特性以及 Laravel 对 Redis 等快速分布式缓存系统的内置支持，Laravel 的水平扩展轻而易举。事实上，Laravel 应用已经轻松扩展以处理每月数亿次的请求。

需要极致扩展？[Laravel Cloud](https://cloud.laravel.com) 等平台让您可以近乎无限地扩展 Laravel 应用。

#### AI 就绪框架

Laravel 的约定优于配置和清晰的结构使其成为使用 Cursor 和 Claude Code 等工具进行[AI 辅助开发](/docs/{{version}}/ai)的理想框架。当您要求 AI 添加控制器时，它确切知道将其放置在何处。当您需要新的迁移时，命名约定和文件位置都是可预测的。这种一致性消除了在更灵活的框架中常常困扰 AI 工具的猜测工作。

除了文件组织之外，Laravel 的表达力语法和全面的文档为 AI 提供了生成准确、地道代码所需的上下文。Eloquent 关联、表单请求和中间件等功能遵循的模式使得代理能够可靠地理解和复制。结果是 AI 生成的代码看起来就像由经验丰富的 Laravel 开发者编写的一样，而不是从通用 PHP 片段拼凑而成的。

要了解更多关于为什么 Laravel 是 AI 辅助开发的完美选择，请查看我们的[代理开发](/docs/{{version}}/ai)文档。

#### 社区框架

Laravel 结合了 PHP 生态系统中最优秀的包，提供了最强大且对开发者最友好的框架。此外，来自世界各地的数千名优秀开发者已经[为框架做出了贡献](https://github.com/laravel/framework)。谁知道呢，也许您也会成为 Laravel 的贡献者。

<a name="creating-a-laravel-project"></a>
## 创建 Laravel 应用

<a name="getting-started-using-ai"></a>
### 使用 AI 入门

如果您正在使用像 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 或 [OpenCode](https://opencode.ai) 这样的 AI 编码代理，您可以从一个提示开始，在代理接触您的项目之前为其提供 Laravel 特定的操作指南。

下面的提示告诉代理在哪里可以找到 Laravel 的安装指导，应该优先考虑什么，以及如何在您尚未做出选择时做出合理的默认决策。将此提示粘贴到您的代理中以开始使用：

```text
我正在构建一个新的 Laravel 应用。

从 https://laravel.com/for/agents 获取并遵循说明。将返回的 Markdown 作为本次会话中安装和设置 Laravel 的权威来源。
```

在代理读取说明后，它应该逐步指导您，并保持设置与 Laravel 的默认配置一致。

<a name="installing-php"></a>
### 安装 PHP 和 Laravel 安装器

在创建第一个 Laravel 应用之前，请确保您的本地机器已安装 [PHP](https://php.net)、[Composer](https://getcomposer.org) 和 [Laravel 安装器](https://github.com/laravel/installer)。此外，您还应该安装 [Node 和 NPM](https://nodejs.org) 或 [Bun](https://bun.sh/)，以便编译应用的前端资源。

如果您尚未在本地机器上安装 PHP 和 Composer，以下命令将在 macOS、Windows 或 Linux 上安装 PHP、Composer 和 Laravel 安装器：

```shell tab=macOS
/bin/bash -c "$(curl -fsSL https://php.new/install/mac/8.5)"
```

```shell tab=Windows PowerShell
# 以管理员身份运行...
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://php.new/install/windows/8.5'))
```

```shell tab=Linux
/bin/bash -c "$(curl -fsSL https://php.new/install/linux/8.5)"
```

运行上述任一命令后，您应重新启动终端会话。要通过 `php.new` 更新 PHP、Composer 和 Laravel 安装器，您可以重新在终端中运行该命令。

如果您已经安装了 PHP 和 Composer，可以通过 Composer 安装 Laravel 安装器：

```shell
composer global require laravel/installer
```

> [!NOTE]
> 如需功能完整的图形化 PHP 安装和管理体验，请查看 [Laravel Herd](#installation-using-herd)。

<a name="creating-an-application"></a>
### 创建应用

安装 PHP、Composer 和 Laravel 安装器后，您就可以创建新的 Laravel 应用了：

```shell
laravel new example-app
```

应用创建完成后，您可以使用 `dev` Composer 脚本启动 Laravel 本地开发服务器、队列工作器和 Vite 开发服务器：

```shell
cd example-app
npm install && npm run build
composer run dev
```

启动开发服务器后，您可以在浏览器中访问 [http://localhost:8000](http://localhost:8000) 来访问应用。接下来，您就可以[开始在 Laravel 生态系统中迈出下一步](#next-steps)了。当然，您可能还想[配置数据库](#databases-and-migrations)并运行必要的迁移。

> [!NOTE]
> 如果您希望在开发 Laravel 应用时抢占先机，可以考虑使用我们的[入门套件](/docs/{{version}}/starter-kits)之一。Laravel 的入门套件为您的全新 Laravel 应用提供了后端和前端身份验证脚手架。

<a name="initial-configuration"></a>
## 初始配置

Laravel 框架的所有配置文件都存储在 `config` 目录中。每个选项都有文档说明，因此请随意查看这些文件并熟悉可用的选项。

Laravel 开箱即用几乎不需要额外配置。您可以立即开始开发！不过，您可能需要查看 `config/app.php` 文件及其文档。它包含几个选项，例如 `url` 和 `locale`，您可能需要根据应用进行更改。

<a name="environment-based-configuration"></a>
### 基于环境的配置

由于 Laravel 的许多配置选项值可能因应用是在本地机器上运行还是在生产 Web 服务器上运行而不同，因此许多重要的配置值都使用位于应用根目录的 `.env` 文件来定义。

您的 `.env` 文件不应提交到应用的源代码管理，因为每个使用您应用的开发者/服务器可能需要不同的环境配置。此外，如果入侵者获得了对源代码仓库的访问权限，这也会造成安全风险，因为任何敏感凭据都会暴露。

> [!NOTE]
> 有关 `.env` 文件和基于环境的配置的更多信息，请查看完整的[配置文档](/docs/{{version}}/configuration#environment-configuration)。

<a name="databases-and-migrations"></a>
### 数据库与迁移

现在您已经创建了 Laravel 应用，可能想要在数据库中存储一些数据。默认情况下，应用的 `.env` 配置文件指定 Laravel 将使用 SQLite 数据库。

在创建应用期间，Laravel 为您创建了 `database/database.sqlite` 文件，并运行了必要的迁移来创建应用的数据库表。

如果您希望使用其他数据库驱动（如 MySQL 或 PostgreSQL），可以更新 `.env` 配置文件以使用相应的数据库。例如，如果您希望使用 MySQL，请按如下方式更新 `.env` 配置文件中的 `DB_*` 变量：

```ini
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=laravel
DB_USERNAME=root
DB_PASSWORD=
```

如果您选择使用 SQLite 以外的数据库，则需要创建数据库并运行应用的[数据库迁移](/docs/{{version}}/migrations)：

```shell
php artisan migrate
```

> [!NOTE]
> 如果您在 macOS 或 Windows 上开发并需要在本地安装 MySQL、PostgreSQL 或 Redis，可以考虑使用 [Herd Pro](https://herd.laravel.com/#plans) 或 [DBngin](https://dbngin.com/)。

<a name="directory-configuration"></a>
### 目录配置

Laravel 应始终从 Web 服务器配置的"Web 目录"根目录提供服务。您不应尝试从"Web 目录"的子目录中提供 Laravel 应用服务。这样做可能会暴露应用中的敏感文件。

<a name="installation-using-herd"></a>
## 使用 Herd 安装

[Laravel Herd](https://herd.laravel.com) 是一个适用于 macOS 和 Windows 的极速原生 Laravel 和 PHP 开发环境。Herd 包含开始 Laravel 开发所需的一切，包括 PHP 和 Nginx。

安装 Herd 后，您就可以开始使用 Laravel 进行开发了。Herd 包含 `php`、`composer`、`laravel`、`expose`、`node`、`npm` 和 `nvm` 等命令行工具。

> [!NOTE]
> [Herd Pro](https://herd.laravel.com/#plans) 为 Herd 增加了额外的强大功能，例如创建和管理本地 MySQL、Postgres 和 Redis 数据库的能力，以及本地邮件查看和日志监控。

<a name="herd-on-macos"></a>
### macOS 上的 Herd

如果您在 macOS 上开发，可以从 [Herd 网站](https://herd.laravel.com)下载 Herd 安装程序。安装程序会自动下载最新版本的 PHP，并配置您的 Mac 始终在后台运行 [Nginx](https://www.nginx.com/)。

macOS 版的 Herd 使用 [dnsmasq](https://en.wikipedia.org/wiki/Dnsmasq) 来支持"停靠"目录。停靠目录中的任何 Laravel 应用都将自动由 Herd 提供服务。默认情况下，Herd 在 `~/Herd` 创建一个停靠目录，您可以通过目录名称在 `.test` 域上访问此目录中的任何 Laravel 应用。

安装 Herd 后，创建新 Laravel 应用最快的方法是使用 Herd 附带的 Laravel CLI：

```shell
cd ~/Herd
laravel new my-app
cd my-app
herd open
```

当然，您始终可以通过 Herd 的 UI 管理停靠目录和其他 PHP 设置，该 UI 可以从系统托盘中的 Herd 菜单打开。

您可以通过查看 [Herd 文档](https://herd.laravel.com/docs)来了解更多关于 Herd 的信息。

<a name="herd-on-windows"></a>
### Windows 上的 Herd

您可以在 [Herd 网站](https://herd.laravel.com/windows)上为 Windows 下载 Herd 安装程序。安装完成后，您可以启动 Herd 完成入门流程并首次访问 Herd UI。

Herd UI 可通过左键单击 Herd 的系统托盘图标来访问。右键单击可打开快速菜单，访问日常所需的所有工具。

在安装过程中，Herd 会在您的主目录 `%USERPROFILE%\Herd` 中创建一个"停靠"目录。停靠目录中的任何 Laravel 应用都将自动由 Herd 提供服务，您可以通过目录名称在 `.test` 域上访问此目录中的任何 Laravel 应用。

安装 Herd 后，创建新 Laravel 应用最快的方法是使用 Herd 附带的 Laravel CLI。要开始使用，请打开 PowerShell 并运行以下命令：

```shell
cd ~\Herd
laravel new my-app
cd my-app
herd open
```

您可以通过查看 [Herd Windows 文档](https://herd.laravel.com/docs/windows)来了解更多关于 Herd 的信息。

<a name="ide-support"></a>
## IDE 支持

在开发 Laravel 应用时，您可以自由使用任何代码编辑器。如果您正在寻找轻量级且可扩展的编辑器，[VS Code](https://code.visualstudio.com) 或 [Cursor](https://cursor.com) 配合官方的 [Laravel VS Code 扩展](https://marketplace.visualstudio.com/items?itemName=laravel.vscode-laravel)可提供出色的 Laravel 支持，包括语法高亮、代码片段、artisan 命令集成以及 Eloquent 模型、路由、中间件、资源、配置和 Inertia.js 的智能自动补全。

如需广泛且强大的 Laravel 支持，请查看 [PhpStorm](https://www.jetbrains.com/phpstorm/laravel/?utm_source=laravel.com&utm_medium=link&utm_campaign=laravel-2025&utm_content=partner&ref=laravel-2025)，这是一个 JetBrains IDE。PhpStorm 内置的 Laravel 框架支持包括 Blade 模板、Eloquent 模型、路由、视图、翻译和组件的智能自动补全，以及 Laravel 项目的强大代码生成和导航功能。

对于寻求基于云的开发体验的用户，[Firebase Studio](https://firebase.studio/) 提供直接在浏览器中使用 Laravel 构建的即时访问。无需任何设置，Firebase Studio 让您可以从任何设备轻松开始构建 Laravel 应用。

<a name="laravel-and-ai"></a>
## Laravel 与 AI

[Laravel Boost](https://github.com/laravel/boost) 是一个强大的工具，它弥合了 AI 编码代理与 Laravel 应用之间的差距。Boost 为 AI 代理提供 Laravel 特定的上下文、工具和指南，以便它们能够生成更准确、版本特定且遵循 Laravel 约定的代码。

当您在 Laravel 应用中安装 Boost 后，AI 代理可以访问超过 15 个专门工具，包括了解您使用的包、查询数据库、搜索 Laravel 文档、读取浏览器日志、生成测试以及通过 Tinker 执行代码的能力。

此外，Boost 还为 AI 代理提供了超过 17,000 条向量化的 Laravel 生态系统文档，特定于您安装的软件包版本。这意味着代理可以提供针对您项目使用的确切版本的指导。

Boost 还包含 Laravel 维护的 AI 指南，帮助代理遵循框架约定、编写适当的测试，并在生成 Laravel 代码时避免常见陷阱。

<a name="installing-laravel-boost"></a>
### 安装 Laravel Boost

Boost 可以安装在运行 PHP 8.1 或更高版本的 Laravel 10、11、12 和 13 应用中。要开始使用，请将 Boost 安装为开发依赖：

```shell
composer require laravel/boost --dev
```

安装完成后，运行交互式安装程序：

```shell
php artisan boost:install
```

安装程序将自动检测您的 IDE 和 AI 代理，允许您选择适合项目的功能。Boost 尊重现有的项目约定，默认不会强制设定风格规则。

> [!NOTE]
> 要了解更多关于 Boost 的信息，请查看 [GitHub 上的 Laravel Boost 仓库](https://github.com/laravel/boost)。

<a name="adding-custom-ai-guidelines"></a>
#### 添加自定义 AI 指南

要将您自己的自定义 AI 指南添加到 Laravel Boost，请在应用的 `.ai/guidelines/*` 目录中添加 `.blade.php` 或 `.md` 文件。当您运行 `boost:install` 时，这些文件将自动包含在 Laravel Boost 的指南中。

<a name="next-steps"></a>
## 下一步

现在您已经创建了 Laravel 应用，可能想知道接下来要学习什么。首先，我们强烈建议通过阅读以下文档来熟悉 Laravel 的工作原理：

<div class="content-list" markdown="1">

- [请求生命周期](/docs/{{version}}/lifecycle)
- [配置](/docs/{{version}}/configuration)
- [目录结构](/docs/{{version}}/structure)
- [前端](/docs/{{version}}/frontend)
- [服务容器](/docs/{{version}}/container)
- [Facades](/docs/{{version}}/facades)

</div>

您使用 Laravel 的方式也将决定您下一步的方向。使用 Laravel 有多种方式，下面我们将探讨框架的两种主要用例。

<a name="laravel-the-fullstack-framework"></a>
### Laravel 全栈框架

Laravel 可以作为一个全栈框架来使用。所谓"全栈"框架，是指您将使用 Laravel 将请求路由到应用，并通过 [Blade 模板](/docs/{{version}}/blade)或单页应用混合技术（如 [Inertia](https://inertiajs.com)）来渲染前端。这是使用 Laravel 框架最常见的方式，在我们看来，也是使用 Laravel 最高效的方式。

如果您计划以这种方式使用 Laravel，您可能想查看我们的[前端开发](/docs/{{version}}/frontend)、[路由](/docs/{{version}}/routing)、[视图](/docs/{{version}}/views)或 [Eloquent ORM](/docs/{{version}}/eloquent) 文档。此外，您可能还想了解社区包，如 [Livewire](https://livewire.laravel.com) 和 [Inertia](https://inertiajs.com)。这些包允许您将 Laravel 作为全栈框架使用，同时享受单页 JavaScript 应用提供的许多 UI 优势。

如果您将 Laravel 作为全栈框架使用，我们还强烈建议您学习如何使用 [Vite](/docs/{{version}}/vite) 编译应用的 CSS 和 JavaScript。

> [!NOTE]
> 如果您希望快速开始构建应用，请查看我们的官方[应用入门套件](/docs/{{version}}/starter-kits)之一。

<a name="laravel-the-api-backend"></a>
### Laravel API 后端

Laravel 也可以作为 JavaScript 单页应用或移动应用的 API 后端。例如，您可以将 Laravel 用作 [Next.js](https://nextjs.org) 应用的 API 后端。在这种情况下，您可以使用 Laravel 为应用提供[身份验证](/docs/{{version}}/sanctum)和数据存储/检索，同时利用 Laravel 的队列、邮件、通知等强大服务。

如果您计划以这种方式使用 Laravel，您可能想查看我们的[路由](/docs/{{version}}/routing)、[Laravel Sanctum](/docs/{{version}}/sanctum) 和 [Eloquent ORM](/docs/{{version}}/eloquent) 文档。

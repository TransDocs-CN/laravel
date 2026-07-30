# AI 辅助开发

 - [简介](#introduction)
     - [为什么选择 Laravel 进行 AI 开发？](#why-laravel-for-ai-development)
 - [Laravel Boost](#laravel-boost)
     - [安装](#installation)
     - [可用工具](#available-tools)
     - [AI 指南](#ai-guidelines)
     - [代理技能](#agent-skills)
     - [文档搜索](#documentation-search)
     - [代理集成](#agents-integration)

<a name="introduction"></a>
## 简介

Laravel 具有独特的优势，是 AI 辅助和代理开发的最佳框架。AI 编码代理（如 [Claude Code](https://docs.anthropic.com/en/docs/claude-code)、[OpenCode](https://opencode.ai)、[Cursor](https://cursor.com) 和 [GitHub Copilot](https://github.com/features/copilot)）的兴起已经改变了开发人员编写代码的方式。这些工具可以以前所未有的速度生成完整功能、调试复杂问题以及重构代码——但它们的有效性很大程度上取决于它们对你代码库的理解程度。

<a name="why-laravel-for-ai-development"></a>
### 为什么选择 Laravel 进行 AI 开发？

Laravel 的规约性约定和定义良好的结构使其成为 AI 辅助开发的理想框架。当你要求 AI 代理添加一个控制器时，它确切地知道将其放在哪里。当你需要一个新的迁移时，命名约定和文件位置是可预测的。这种一致性消除了常常使 AI 工具在更灵活的框架中出现问题的猜测。

除了文件组织，Laravel 富有表现力的语法和全面的文档为 AI 代理提供了生成准确、符合习惯的代码所需的上下文。Eloquent 关系、表单请求和中间件等功能遵循代理可以可靠理解和复制的模式。结果是 AI 生成的代码看起来像由经验丰富的 Laravel 开发人员编写，而不是由通用的 PHP 片段拼凑而成。

<a name="laravel-boost"></a>
## Laravel Boost

[Laravel Boost](https://github.com/laravel/boost) 弥合了 AI 编码代理与你的 Laravel 应用程序之间的差距。Boost 是一个 MCP（模型上下文协议）服务器，配备了超过 15 个专门工具，为 AI 代理提供对你应用程序结构、数据库、路由等的深入洞察。安装 Boost 后，你的 AI 代理将从通用代码助手转变为理解你特定应用程序的 Laravel 专家。

Boost 提供了三大能力：一套用于检查和与应用程序交互的 MCP 工具、专门为 Laravel 生态系统制作的可组合 AI 指南，以及包含超过 17,000 条 Laravel 特定知识片段的功能强大的文档 API。

<a name="installation"></a>
### 安装

Boost 可以安装在运行 PHP 8.1 或更高版本的 Laravel 10、11、12 和 13 应用程序中。首先，将 Boost 安装为开发依赖：

```shell
composer require laravel/boost --dev
```

安装后，运行交互式安装程序：

```shell
php artisan boost:install
```

安装程序将自动检测你的 IDE 和 AI 代理，允许你选择对项目有意义的集成。Boost 将生成必要的配置文件，例如用于兼容 MCP 的编辑器的 `.mcp.json` 文件和用于 AI 上下文的指南文件。

> [!NOTE]
> 生成的配置文件如 `.mcp.json`、`CLAUDE.md` 和 `boost.json` 可以安全地添加到你的 `.gitignore` 中，如果你希望每个开发者配置自己的环境。

<a name="available-tools"></a>
### 可用工具

Boost 通过模型上下文协议向 AI 代理暴露了一套全面的工具。这些工具允许代理深入理解和与你的 Laravel 应用程序进行交互：

<div class="content-list" markdown="1">

- **应用程序自检** - 查询你的 PHP 和 Laravel 版本，列出已安装的包，并检查应用程序的配置和环境变量。
- **数据库工具** - 检查数据库模式，执行只读查询，无需离开对话即可了解数据结构。
- **路由检查** - 列出所有已注册的路由及其中间件、控制器和参数。
- **Artisan 命令** - 发现可用的 Artisan 命令及其参数，使代理能够为你的任务建议并执行正确的命令。
- **日志分析** - 读取和分析应用程序的日志文件以帮助调试问题。
- **浏览器日志** - 在使用 Laravel 的前端工具开发时访问浏览器控制台日志和错误。
- **Tinker 集成** - 通过 Laravel Tinker 在应用程序上下文中执行 PHP 代码，允许代理测试假设并验证行为。
- **文档搜索** - 搜索 Laravel 生态系统的文档，结果根据你安装的包版本进行定制。

</div>

<a name="ai-guidelines"></a>
### AI 指南

Boost 包含一套专门为 Laravel 生态系统制作的全面 AI 指南。这些指南教导 AI 代理如何编写符合习惯的 Laravel 代码、遵循框架约定以及避免常见陷阱。指南是可组合且版本感知的，意味着代理接收适合你确切包版本的指令。

指南适用于 Laravel 本身以及 Laravel 生态系统中的超过 16 个包，包括：

<div class="content-list" markdown="1">

- Livewire（2.x、3.x 和 4.x）
- Inertia.js（React、Svelte 和 Vue 变体）
- Tailwind CSS（3.x 和 4.x）
- Filament（3.x 和 4.x）
- PHPUnit
- Pest PHP
- Laravel Pint
- 以及更多

</div>

当你运行 `boost:install` 时，Boost 会自动检测你的应用程序使用了哪些包，并将相关指南组装到项目的 AI 上下文文件中。

<a name="agent-skills"></a>
### 代理技能

[代理技能](https://agentskills.io/home)是轻量级、有针对性的知识模块，代理可以在处理特定领域时按需激活。与预先加载的指南不同，技能允许仅在相关时加载详细的模式和最佳实践，从而减少上下文膨胀并提高 AI 生成代码的相关性。

技能适用于流行的 Laravel 包，如 Livewire、Inertia、Tailwind CSS、Pest 等。当你运行 `boost:install` 并选择技能作为功能时，技能会根据在 `composer.json` 中检测到的包自动安装。

<a name="documentation-search"></a>
### 文档搜索

Boost 包含一个功能强大的文档 API，为 AI 代理提供超过 17,000 条 Laravel 生态系统文档的访问权限。与通用的 Web 搜索不同，这些文档经过索引、向量化处理，并过滤以匹配你的确切包版本。

当代理需要了解某个功能的工作原理时，它可以搜索 Boost 的文档 API 并接收准确的、版本特定的信息。这消除了 AI 代理建议来自较旧框架版本的已弃用方法或语法的常见问题。

<a name="agents-integration"></a>
### 代理集成

Boost 与支持模型上下文协议的流行 IDE 和 AI 工具集成。有关 Cursor、Claude Code、Codex、Gemini CLI、GitHub Copilot 和 Junie 的详细设置说明，请参阅 Boost 文档的[设置你的代理](/docs/{{version}}/boost#set-up-your-agents)部分。

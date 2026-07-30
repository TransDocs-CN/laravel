# Laravel Boost

- [简介](#introduction)
- [安装](#installation)
    - [设置你的代理](#set-up-your-agents)
    - [保持 Boost 资源更新](#keeping-boost-resources-updated)
- [MCP 服务器](#mcp-server)
    - [可用的 MCP 工具](#available-mcp-tools)
    - [手动注册 MCP 服务器](#manually-registering-the-mcp-server)
- [AI 指南](#ai-guidelines)
    - [可用的 AI 指南](#available-ai-guidelines)
    - [添加自定义 AI 指南](#adding-custom-ai-guidelines)
    - [覆盖 Boost AI 指南](#overriding-boost-ai-guidelines)
    - [第三方包 AI 指南](#third-party-package-ai-guidelines)
- [代理技能](#agent-skills)
    - [可用技能](#available-skills)
    - [自定义技能](#custom-skills)
    - [覆盖技能](#overriding-skills)
    - [第三方包技能](#third-party-package-skills)
- [指南 vs. 技能](#guidelines-vs-skills)
- [文档 API](#documentation-api)
- [扩展 Boost](#extending-boost)
    - [为其他 IDE/AI 代理添加支持](#adding-support-for-other-ides-ai-agents)

<a name="introduction"></a>
## 简介

Laravel Boost 通过提供必要指南和代理技能来加速 AI 辅助开发，帮助 AI 代理编写符合 Laravel 最佳实践的高质量 Laravel 应用程序。

Boost 还提供了一个功能强大的 Laravel 生态系统文档 API，它结合了内置的 MCP 工具和包含超过 17,000 条 Laravel 特定信息的广泛知识库，所有内容都通过使用嵌入的语义搜索功能增强，以提供精确、上下文感知的结果。Boost 指导 Claude Code 和 Cursor 等 AI 代理使用此 API 了解最新的 Laravel 功能和最佳实践。

<a name="installation"></a>
## 安装

Laravel Boost 可以通过 Composer 安装：

```shell
composer require laravel/boost --dev
```

接下来，安装 MCP 服务器和编码指南：

```shell
php artisan boost:install
```

`boost:install` 命令将为你在安装过程中选择的编码代理生成相关的代理指南和技能文件。

安装 Laravel Boost 后，你就可以开始使用 Cursor、Claude Code 或你选择的 AI 代理进行编码了。

> [!NOTE]
> 可以随意将生成的 MCP 配置文件（`.mcp.json`）、指南文件（`CLAUDE.md`、`AGENTS.md`、`junie/` 等）和 `boost.json` 配置文件添加到应用程序的 `.gitignore` 中，因为这些文件在运行 `boost:install` 和 `boost:update` 时会自动重新生成。

<a name="set-up-your-agents"></a>
### 设置你的代理

```text tab=Cursor
1. 打开命令面板（`Cmd+Shift+P` 或 `Ctrl+Shift+P`）
2. 按 `enter` 选择 "/open MCP Settings"
3. 打开 `laravel-boost` 的开关
```

```text tab=Claude Code
Claude Code 支持通常会自动启用。如果你发现没有启用，请在项目目录中打开 shell 并运行以下命令：

claude mcp add -s local -t stdio laravel-boost php artisan boost:mcp
```

```text tab=Codex
Codex 支持通常会自动启用。如果你发现没有启用，请在项目目录中打开 shell 并运行以下命令：

codex mcp add laravel-boost -- php "artisan" "boost:mcp"
```

```text tab=Gemini CLI
Gemini CLI 支持通常会自动启用。如果你发现没有启用，请在项目目录中打开 shell 并运行以下命令：

gemini mcp add -s project -t stdio laravel-boost php artisan boost:mcp
```

```text tab=GitHub Copilot (VS Code)
1. 打开命令面板（`Cmd+Shift+P` 或 `Ctrl+Shift+P`）
2. 按 `enter` 选择 "MCP: List Servers"
3. 导航到 `laravel-boost` 并按 `enter`
4. 选择 "Start server"
```

```text tab=Junie
1. 按两次 `shift` 打开命令面板
2. 搜索 "MCP Settings" 并按 `enter`
3. 选中 `laravel-boost` 旁边的复选框
4. 点击右下角的 "Apply"
```

<a name="keeping-boost-resources-updated"></a>
### 保持 Boost 资源更新

你可能希望定期更新本地的 Boost 资源（AI 指南和技能），以确保它们反映已安装的 Laravel 生态系统包的最新版本。为此，你可以使用 `boost:update` Artisan 命令。

```shell
php artisan boost:update
```

你也可以通过将其添加到 Composer 的 "post-update-cmd" 脚本来自动化此过程：

```json
{
  "scripts": {
    "post-update-cmd": [
      "@php artisan boost:update --ansi"
    ]
  }
}
```

默认情况下，`boost:update` 命令只会更新应用程序中已存在的 Boost 资源。如果你希望 Boost 扫描你的应用程序以查找任何新安装的包，并提供发布其相应指南和技能的选项，可以使用 `--discover` 选项：

```shell
php artisan boost:update --discover
```

<a name="mcp-server"></a>
## MCP 服务器

Laravel Boost 提供了一个 MCP（模型上下文协议）服务器，它暴露了 AI 代理用于与你的 Laravel 应用程序交互的工具。这些工具使代理能够检查应用程序的结构、查询数据库、执行代码等。

<a name="available-mcp-tools"></a>
### 可用的 MCP 工具

<div class="overflow-auto">

| 名称 | 说明 |
| --- | --- |
| 应用信息 | 读取 PHP 和 Laravel 版本、数据库引擎、生态包列表（含版本）和 Eloquent 模型 |
| 浏览器日志 | 从浏览器读取日志和错误 |
| 数据库连接 | 检查可用的数据库连接，包括默认连接 |
| 数据库查询 | 对数据库执行查询 |
| 数据库模式 | 读取数据库模式 |
| 获取绝对 URL | 将相对路径 URI 转换为绝对路径，以便代理生成有效的 URL |
| 最后错误 | 从应用程序的日志文件中读取最后一个错误 |
| 读取日志条目 | 读取最后 N 条日志条目 |
| 搜索文档 | 查询 Laravel 托管的文档 API 服务，以根据已安装的包检索文档 |

</div>

<a name="manually-registering-the-mcp-server"></a>
### 手动注册 MCP 服务器

有时你可能需要手动向选择的编辑器注册 Laravel Boost MCP 服务器。你应该使用以下详细信息注册 MCP 服务器：

<table>
<tr><td><strong>命令</strong></td><td><code>php</code></td></tr>
<tr><td><strong>参数</strong></td><td><code>artisan boost:mcp</code></td></tr>
</table>

JSON 示例：

```json
{
    "mcpServers": {
        "laravel-boost": {
            "command": "php",
            "args": ["artisan", "boost:mcp"]
        }
    }
}
```

<a name="ai-guidelines"></a>
## AI 指南

AI 指南是可组合的指令文件，预先加载以为 AI 代理提供关于 Laravel 生态系统包的必要上下文。这些指南包含核心约定、最佳实践和框架特定模式，帮助代理生成一致、高质量的代码。

<a name="available-ai-guidelines"></a>
### 可用的 AI 指南

Laravel Boost 包含以下包和框架的 AI 指南。`core` 指南为给定包向 AI 提供通用的、一般性的建议，适用于所有版本。

<div class="overflow-auto">

| 包 | 支持的版本 |
| --- | --- |
| Core & Boost | core |
| Laravel Framework | core, 10.x, 11.x, 12.x, 13.x |
| Livewire | core, 2.x, 3.x, 4.x |
| Flux UI | core, free, pro |
| Folio | core |
| Herd | core |
| Inertia Laravel | core, 1.x, 2.x, 3.x |
| Inertia React | core, 1.x, 2.x, 3.x |
| Inertia Vue | core, 1.x, 2.x, 3.x |
| Inertia Svelte | core, 1.x, 2.x, 3.x |
| MCP | core |
| Pennant | core |
| Pest | core, 3.x, 4.x |
| PHPUnit | core |
| Pint | core |
| Sail | core |
| Tailwind CSS | core, 3.x, 4.x |
| Livewire Volt | core |
| Wayfinder | core |
| Enforce Tests | conditional |

</div>

> **注意：** 要保持你的 AI 指南是最新的，请参阅[保持 Boost 资源更新](#keeping-boost-resources-updated)部分。

<a name="adding-custom-ai-guidelines"></a>
### 添加自定义 AI 指南

要使用自己的自定义 AI 指南增强 Laravel Boost，在你的应用程序的 `.ai/guidelines/*` 目录中添加 `.blade.php` 或 `.md` 文件。当你运行 `boost:install` 时，这些文件将自动包含在 Laravel Boost 的指南中。

<a name="overriding-boost-ai-guidelines"></a>
### 覆盖 Boost AI 指南

你可以通过创建具有匹配文件路径的自定义指南来覆盖 Boost 内置的 AI 指南。当你创建的自定义指南匹配现有的 Boost 指南路径时，Boost 将使用你的自定义版本而不是内置版本。

例如，要覆盖 Boost 的 "Inertia React v2 Form Guidance" 指南，创建一个文件 `.ai/guidelines/inertia-react/2/forms.blade.php`。当你运行 `boost:install` 时，Boost 将包含你的自定义指南而不是默认指南。

<a name="third-party-package-ai-guidelines"></a>
### 第三方包 AI 指南

如果你维护第三方包并希望 Boost 为其包含 AI 指南，你可以通过在包中添加一个 `resources/boost/guidelines/core.blade.php` 文件来实现。当你的包的用户运行 `php artisan boost:install` 时，Boost 将自动加载你的指南。

AI 指南应提供包的简要概述，概述任何必需的文件结构或约定，并解释如何创建或使用其主要功能（附带有示例命令或代码片段）。保持简洁、可操作，并专注于最佳实践，以便 AI 能为你的用户生成正确的代码。以下是一个示例：

```php
## 包名称

此包提供[功能的简要描述]。

### 功能

- 功能 1：[清晰简短的描述]。
- 功能 2：[清晰简短的描述]。示例用法：

@verbatim
<code-snippet name="如何使用功能 2" lang="php">
$result = PackageName::featureTwo($param1, $param2);
</code-snippet>
@endverbatim
```

<a name="agent-skills"></a>
## 代理技能

[代理技能](https://agentskills.io/home)是轻量级、有针对性的知识模块，代理可以在处理特定领域时按需激活。与预先加载的指南不同，技能允许仅在相关时加载详细的模式和最佳实践，从而减少上下文膨胀并提高 AI 生成代码的相关性。

当你运行 `boost:install` 并选择技能作为功能时，技能会根据在 `composer.json` 中检测到的包自动安装。例如，如果你的项目包含 `livewire/livewire`，`livewire-development` 技能将自动安装。

<a name="available-skills"></a>
### 可用技能

<div class="overflow-auto">

| 技能 | 包 |
| --- | --- |
| fluxui-development | Flux UI |
| folio-routing | Folio |
| inertia-react-development | Inertia React |
| inertia-svelte-development | Inertia Svelte |
| inertia-vue-development | Inertia Vue |
| livewire-development | Livewire |
| mcp-development | MCP |
| pennant-development | Pennant |
| pest-testing | Pest |
| tailwindcss-development | Tailwind CSS |
| volt-development | Volt |
| wayfinder-development | Wayfinder |

</div>

> **注意：** 要保持你的技能是最新的，请参阅[保持 Boost 资源更新](#keeping-boost-resources-updated)部分。

<a name="custom-skills"></a>
### 自定义技能

要创建自己的自定义技能，在你的应用程序的 `.ai/skills/{skill-name}/` 目录中添加一个 `SKILL.md` 文件。当你运行 `boost:update` 时，你的自定义技能将与 Boost 的内置技能一起安装。

例如，要为你的应用程序的领域逻辑创建一个自定义技能：

```
.ai/skills/creating-invoices/SKILL.md
```

<a name="overriding-skills"></a>
### 覆盖技能

你可以通过创建具有匹配名称的自定义技能来覆盖 Boost 的内置技能。当你创建的自定义技能匹配现有的 Boost 技能名称时，Boost 将使用你的自定义版本而不是内置版本。

例如，要覆盖 Boost 的 `livewire-development` 技能，创建一个文件 `.ai/skills/livewire-development/SKILL.md`。当你运行 `boost:update` 时，Boost 将包含你的自定义技能而不是默认技能。

<a name="third-party-package-skills"></a>
### 第三方包技能

如果你维护第三方包并希望 Boost 为其包含技能，你可以通过在包中添加一个 `resources/boost/skills/{skill-name}/SKILL.md` 文件来实现。当你的包的用户运行 `php artisan boost:install` 时，Boost 将根据用户偏好自动安装你的技能。

Boost 技能支持[代理技能格式](https://agentskills.io/what-are-skills)，应结构化为包含一个带有 YAML 前置数据和 Markdown 指令的 `SKILL.md` 文件的文件夹。`SKILL.md` 文件必须包含必需的前置数据（`name` 和 `description`），并可以选择包含脚本、模板和参考资料。

技能应概述任何必需的文件结构或约定，并解释如何创建或使用其主要功能（附带有示例命令或代码片段）。保持简洁、可操作，并专注于最佳实践，以便 AI 能为你的用户生成正确的代码：

```markdown
---
name: package-name-development
description: 构建和使用 PackageName 功能，包括组件和工作流程。
---

# 包名称开发

## 何时使用此技能
在处理 PackageName 功能时使用此技能...

## 功能

- 功能 1：[清晰简短的描述]。
- 功能 2：[清晰简短的描述]。示例用法：

$result = PackageName::featureTwo($param1, $param2);
```

<a name="guidelines-vs-skills"></a>
## 指南 vs. 技能

Laravel Boost 提供了两种不同的方式为 AI 代理提供关于应用程序的上下文：**指南**和**技能**。

**指南**在 AI 代理启动时预先加载，提供关于广泛适用于代码库的 Laravel 约定和最佳实践的必要上下文。

**技能**在处理特定任务时按需激活，包含特定领域（如 Livewire 组件或 Pest 测试）的详细模式。仅在相关时加载技能可减少上下文膨胀并提高代码质量。

<div class="overflow-auto">

| 方面 | 指南 | 技能 |
| --- | --- | --- |
| **加载方式** | 预先加载，始终存在 | 按需加载，相关时 |
| **范围** | 广泛，基础性 | 集中，任务特定 |
| **目的** | 核心约定与最佳实践 | 详细的实现模式 |

</div>

<a name="documentation-api"></a>
## 文档 API

Laravel Boost 包含一个文档 API，为 AI 代理提供包含超过 17,000 条 Laravel 特定信息的广泛知识库的访问权限。该 API 使用带有嵌入的语义搜索来提供精确、上下文感知的结果。

`Search Docs` MCP 工具允许代理查询 Laravel 托管的文档 API 服务，以根据你已安装的包检索文档。Boost 的 AI 指南和技能将自动指示你的编码代理使用此 API。

<div class="overflow-auto">

| 包 | 支持的版本 |
| --- | --- |
| Laravel Framework | 10.x, 11.x, 12.x, 13.x |
| Filament | 2.x, 3.x, 4.x, 5.x |
| Flux UI | 2.x Free, 2.x Pro |
| Inertia | 1.x, 2.x |
| Livewire | 1.x, 2.x, 3.x, 4.x |
| Nova | 4.x, 5.x |
| Pest | 3.x, 4.x |
| Tailwind CSS | 3.x, 4.x |

</div>

<a name="extending-boost"></a>
## 扩展 Boost

Boost 开箱即用即可与许多流行的 IDE 和 AI 代理配合使用。如果你使用的编码工具尚未受支持，你可以创建自己的代理并与 Boost 集成。

<a name="adding-support-for-other-ides-ai-agents"></a>
### 为其他 IDE/AI 代理添加支持

要为新的 IDE 或 AI 代理添加支持，创建一个扩展 `Laravel\Boost\Install\Agents\Agent` 的类，并根据需要实现以下一个或多个契约：

- `Laravel\Boost\Contracts\SupportsGuidelines` - 添加 AI 指南支持。
- `Laravel\Boost\Contracts\SupportsMcp` - 添加 MCP 支持。
- `Laravel\Boost\Contracts\SupportsSkills` - 添加代理技能支持。

<a name="writing-the-agent"></a>
#### 编写代理

```php
<?php

declare(strict_types=1);

namespace App;

use Laravel\Boost\Contracts\SupportsGuidelines;
use Laravel\Boost\Contracts\SupportsMcp;
use Laravel\Boost\Contracts\SupportsSkills;
use Laravel\Boost\Install\Agents\Agent;

class CustomAgent extends Agent implements SupportsGuidelines, SupportsMcp, SupportsSkills
{
    // 你的实现...
}
```

有关示例实现，请参阅 [ClaudeCode.php](https://github.com/laravel/boost/blob/main/src/Install/Agents/ClaudeCode.php)。

<a name="registering-the-agent"></a>
#### 注册代理

在你的应用程序的 `App\Providers\AppServiceProvider` 的 `boot` 方法中注册你的自定义代理：

```php
use Laravel\Boost\Boost;

public function boot(): void
{
    Boost::registerAgent('customagent', CustomAgent::class);
}
```

注册后，当你运行 `php artisan boost:install` 时，你的代理将可供选择。

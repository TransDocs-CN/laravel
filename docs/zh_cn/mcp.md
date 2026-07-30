# Laravel MCP

- [简介](#introduction)
- [安装](#installation)
    - [发布路由](#publishing-routes)
- [创建服务器](#creating-servers)
    - [服务器注册](#server-registration)
    - [Web 服务器](#web-servers)
    - [本地服务器](#local-servers)
- [工具](#tools)
    - [创建工具](#creating-tools)
    - [工具输入模式](#tool-input-schemas)
    - [工具输出模式](#tool-output-schemas)
    - [验证工具参数](#validating-tool-arguments)
    - [工具依赖注入](#tool-dependency-injection)
    - [工具注解](#tool-annotations)
    - [条件性工具注册](#conditional-tool-registration)
    - [工具响应](#tool-responses)
- [提示](#prompts)
    - [创建提示](#creating-prompts)
    - [提示参数](#prompt-arguments)
    - [验证提示参数](#validating-prompt-arguments)
    - [提示依赖注入](#prompt-dependency-injection)
    - [条件性提示注册](#conditional-prompt-registration)
    - [提示响应](#prompt-responses)
- [资源](#resources)
    - [创建资源](#creating-resources)
    - [资源模板](#resource-templates)
    - [资源 URI 和 MIME 类型](#resource-uri-and-mime-type)
    - [资源请求](#resource-request)
    - [资源依赖注入](#resource-dependency-injection)
    - [资源注解](#resource-annotations)
    - [条件性资源注册](#conditional-resource-registration)
    - [资源响应](#resource-responses)
- [应用](#apps)
    - [创建应用资源](#creating-app-resources)
    - [从工具渲染应用](#rendering-apps-from-tools)
    - [应用工具可见性](#app-tool-visibility)
    - [应用配置](#app-configuration)
    - [使用 Boost 构建应用](#building-apps-with-boost)
- [元数据](#metadata)
- [图标](#icons)
- [认证](#authentication)
    - [OAuth 2.1](#oauth)
    - [Sanctum](#sanctum)
- [授权](#authorization)
- [MCP 客户端](#client)
    - [连接到服务器](#client-connecting)
    - [命名客户端](#named-clients)
    - [客户端认证](#client-authentication)
    - [工具](#client-tools)
    - [提示](#client-prompts)
    - [资源](#client-resources)
- [测试服务器](#testing-servers)
    - [MCP 检查器](#mcp-inspector)
    - [单元测试](#unit-tests)

<a name="introduction"></a>
## 简介

[Laravel MCP](https://github.com/laravel/mcp) 为 AI 客户端提供了一种简单而优雅的方式，通过[模型上下文协议](https://modelcontextprotocol.io/docs/getting-started/intro)与你的 Laravel 应用程序进行交互。它提供了一个富有表现力、流畅的接口来定义服务器、工具、资源和提示，从而支持 AI 驱动的与应用程序的交互。

<a name="installation"></a>
## 安装

首先，使用 Composer 包管理器将 Laravel MCP 安装到你的项目中：

```shell
composer require laravel/mcp
```

<a name="publishing-routes"></a>
### 发布路由

安装 Laravel MCP 后，执行 `vendor:publish` Artisan 命令以发布 `routes/ai.php` 文件，你将在其中定义你的 MCP 服务器：

```shell
php artisan vendor:publish --tag=ai-routes
```

此命令在应用程序的 `routes` 目录中创建 `routes/ai.php` 文件，你将使用它来注册你的 MCP 服务器。

<a name="creating-servers"></a>
## 创建服务器

你可以使用 `make:mcp-server` Artisan 命令创建 MCP 服务器。服务器充当中心通信点，向 AI 客户端暴露 MCP 功能，如工具、资源和提示：

```shell
php artisan make:mcp-server WeatherServer
```

此命令将在 `app/Mcp/Servers` 目录中创建一个新的服务器类。生成的服务器类扩展了 Laravel MCP 的基础 `Laravel\Mcp\Server` 类，并提供了用于配置服务器以及注册工具、资源和提示的属性和特性：

```php
<?php

namespace App\Mcp\Servers;

use Laravel\Mcp\Server\Attributes\Instructions;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Attributes\Version;
use Laravel\Mcp\Server;

#[Name('Weather Server')]
#[Version('1.0.0')]
#[Instructions('此服务器提供天气信息和预报。')]
class WeatherServer extends Server
{
    /**
     * 此 MCP 服务器注册的工具。
     *
     * @var array<int, class-string<\Laravel\Mcp\Server\Tool>>
     */
    protected array $tools = [
        // GetCurrentWeatherTool::class,
    ];

    /**
     * 此 MCP 服务器注册的资源。
     *
     * @var array<int, class-string<\Laravel\Mcp\Server\Resource>>
     */
    protected array $resources = [
        // WeatherGuidelinesResource::class,
    ];

    /**
     * 此 MCP 服务器注册的提示。
     *
     * @var array<int, class-string<\Laravel\Mcp\Server\Prompt>>
     */
    protected array $prompts = [
        // DescribeWeatherPrompt::class,
    ];
}
```

<a name="server-registration"></a>
### 服务器注册

创建服务器后，必须在 `routes/ai.php` 文件中注册它，使其可访问。Laravel MCP 提供了两种注册服务器的方法：`web` 用于 HTTP 可访问的服务器，`local` 用于命令行服务器。

<a name="web-servers"></a>
### Web 服务器

Web 服务器是最常见的服务器类型，可通过 HTTP POST 请求访问，使其适用于远程 AI 客户端或基于 Web 的集成。使用 `web` 方法注册 Web 服务器：

```php
use App\Mcp\Servers\WeatherServer;
use Laravel\Mcp\Facades\Mcp;

Mcp::web('/mcp/weather', WeatherServer::class);
```

与普通路由一样，你可以应用中间件来保护你的 Web 服务器：

```php
Mcp::web('/mcp/weather', WeatherServer::class)
    ->middleware(['throttle:mcp']);
```

<a name="local-servers"></a>
### 本地服务器

本地服务器作为 Artisan 命令运行，非常适合构建本地 AI 助手集成，如 [Laravel Boost](/docs/{{version}}/installation#installing-laravel-boost)。使用 `local` 方法注册本地服务器：

```php
use App\Mcp\Servers\WeatherServer;
use Laravel\Mcp\Facades\Mcp;

Mcp::local('weather', WeatherServer::class);
```

注册后，通常不需要手动运行 `mcp:start` Artisan 命令。相反，配置你的 MCP 客户端（AI 代理）来启动服务器，或使用 [MCP 检查器](#mcp-inspector)。

<a name="tools"></a>
## 工具

工具使你的服务器能够暴露 AI 客户端可以调用的功能。它们允许语言模型执行操作、运行代码或与外部系统交互：

```php
<?php

namespace App\Mcp\Tools;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('获取指定位置的当前天气预报。')]
class CurrentWeatherTool extends Tool
{
    /**
     * 处理工具请求。
     */
    public function handle(Request $request): Response
    {
        $location = $request->get('location');

        // 获取天气...

        return Response::text('天气是...');
    }

    /**
     * 获取工具的输入模式。
     *
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'location' => $schema->string()
                ->description('要获取天气的位置。')
                ->required(),
        ];
    }
}
```

<a name="creating-tools"></a>
### 创建工具

要创建工具，运行 `make:mcp-tool` Artisan 命令：

```shell
php artisan make:mcp-tool CurrentWeatherTool
```

创建工具后，将其注册到服务器的 `$tools` 属性中：

```php
<?php

namespace App\Mcp\Servers;

use App\Mcp\Tools\CurrentWeatherTool;
use Laravel\Mcp\Server;

class WeatherServer extends Server
{
    /**
     * 此 MCP 服务器注册的工具。
     *
     * @var array<int, class-string<\Laravel\Mcp\Server\Tool>>
     */
    protected array $tools = [
        CurrentWeatherTool::class,
    ];
}
```

<a name="tool-name-title-description"></a>
#### 工具名称、标题和描述

默认情况下，工具的名称和标题从类名派生。例如，`CurrentWeatherTool` 的名称将为 `current-weather`，标题为 `Current Weather Tool`。你可以使用 `Name` 和 `Title` 属性自定义这些值：

```php
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Attributes\Title;

#[Name('get-optimistic-weather')]
#[Title('获取乐观天气预报')]
class CurrentWeatherTool extends Tool
{
    // ...
}
```

工具描述不会自动生成。你应始终使用 `Description` 属性提供有意义的描述：

```php
use Laravel\Mcp\Server\Attributes\Description;

#[Description('获取指定位置的当前天气预报。')]
class CurrentWeatherTool extends Tool
{
    //
}
```

> [!NOTE]
> 描述是工具元数据的关键部分，因为它帮助 AI 模型理解何时以及如何有效地使用该工具。

<a name="tool-input-schemas"></a>
### 工具输入模式

工具可以定义输入模式，以指定它们从 AI 客户端接受哪些参数。使用 Laravel 的 `Illuminate\Contracts\JsonSchema\JsonSchema` 构建器来定义工具输入要求：

```php
<?php

namespace App\Mcp\Tools;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Server\Tool;

class CurrentWeatherTool extends Tool
{
    /**
     * 获取工具的输入模式。
     *
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'location' => $schema->string()
                ->description('要获取天气的位置。')
                ->required(),

            'units' => $schema->string()
                ->enum(['celsius', 'fahrenheit'])
                ->description('要使用的温度单位。')
                ->default('celsius'),
        ];
    }
}
```

<a name="tool-output-schemas"></a>
### 工具输出模式

工具可以定义[输出模式](https://modelcontextprotocol.io/specification/2025-06-18/server/tools#output-schema)，以指定其响应的结构。这使得需要可解析工具结果的 AI 客户端能够更好地集成。使用 `outputSchema` 方法定义工具的输出结构：

```php
<?php

namespace App\Mcp\Tools;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Server\Tool;

class CurrentWeatherTool extends Tool
{
    /**
     * 获取工具的输出模式。
     *
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function outputSchema(JsonSchema $schema): array
    {
        return [
            'temperature' => $schema->number()
                ->description('摄氏温度')
                ->required(),

            'conditions' => $schema->string()
                ->description('天气状况')
                ->required(),

            'humidity' => $schema->integer()
                ->description('湿度百分比')
                ->required(),
        ];
    }
}
```

<a name="validating-tool-arguments"></a>
### 验证工具参数

JSON Schema 定义为工具参数提供了基本结构，但你可能还想实施更复杂的验证规则。

Laravel MCP 与 Laravel 的[验证功能](/docs/{{version}}/validation)无缝集成。你可以在工具的 `handle` 方法中验证传入的工具参数：

```php
<?php

namespace App\Mcp\Tools;

use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class CurrentWeatherTool extends Tool
{
    /**
     * 处理工具请求。
     */
    public function handle(Request $request): Response
    {
        $validated = $request->validate([
            'location' => 'required|string|max:100',
            'units' => 'in:celsius,fahrenheit',
        ]);

        // 使用验证后的参数获取天气数据...
    }
}
```

验证失败时，AI 客户端将根据你提供的错误消息采取行动。因此，提供清晰且可操作的错误消息至关重要：

```php
$validated = $request->validate([
    'location' => ['required','string','max:100'],
    'units' => 'in:celsius,fahrenheit',
],[
    'location.required' => '你必须指定一个位置来获取天气。例如，"纽约市"或"东京"。',
    'units.in' => '你必须指定 "celsius" 或 "fahrenheit" 作为单位。',
]);
```

<a name="tool-dependency-injection"></a>
#### 工具依赖注入

Laravel [服务容器](/docs/{{version}}/container)用于解析所有工具。因此，你可以在构造函数中类型提示工具可能需要的任何依赖项。声明的依赖项将自动解析并注入到工具实例中：

```php
<?php

namespace App\Mcp\Tools;

use App\Repositories\WeatherRepository;
use Laravel\Mcp\Server\Tool;

class CurrentWeatherTool extends Tool
{
    /**
     * 创建一个新的工具实例。
     */
    public function __construct(
        protected WeatherRepository $weather,
    ) {}

    // ...
}
```

除了构造函数注入，你还可以在工具的 `handle()` 方法中类型提示依赖项。当调用该方法时，服务容器将自动解析并注入依赖项：

```php
<?php

namespace App\Mcp\Tools;

use App\Repositories\WeatherRepository;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class CurrentWeatherTool extends Tool
{
    /**
     * 处理工具请求。
     */
    public function handle(Request $request, WeatherRepository $weather): Response
    {
        $location = $request->get('location');

        $forecast = $weather->getForecastFor($location);

        // ...
    }
}
```

<a name="tool-annotations"></a>
### 工具注解

你可以使用[注解](https://modelcontextprotocol.io/specification/2025-06-18/schema#toolannotations)来增强工具，为 AI 客户端提供额外的元数据。这些注解帮助 AI 模型理解工具的行为和能力。注解通过属性添加到工具上：

```php
<?php

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Tools\Annotations\IsIdempotent;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;
use Laravel\Mcp\Server\Tool;

#[IsIdempotent]
#[IsReadOnly]
class CurrentWeatherTool extends Tool
{
    //
}
```

可用注解包括：

<div class="overflow-auto">

| 注解 | 类型 | 描述 |
| --- | --- | --- |
| `#[IsReadOnly]` | 布尔 | 表示工具不会修改其环境。 |
| `#[IsDestructive]` | 布尔 | 表示工具可能执行破坏性更新（仅当非只读时才有意义）。 |
| `#[IsIdempotent]` | 布尔 | 表示使用相同参数的重复调用没有额外效果（非只读时）。 |
| `#[IsOpenWorld]` | 布尔 | 表示工具可能与外部实体交互。 |

</div>

注解值可以使用布尔参数显式设置：

```php
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;
use Laravel\Mcp\Server\Tools\Annotations\IsDestructive;
use Laravel\Mcp\Server\Tools\Annotations\IsOpenWorld;
use Laravel\Mcp\Server\Tools\Annotations\IsIdempotent;
use Laravel\Mcp\Server\Tool;

#[IsReadOnly(true)]
#[IsDestructive(false)]
#[IsOpenWorld(false)]
#[IsIdempotent(true)]
class CurrentWeatherTool extends Tool
{
    //
}
```

<a name="conditional-tool-registration"></a>
### 条件性工具注册

你可以通过在工具类中实现 `shouldRegister` 方法在运行时条件性地注册工具。此方法允许你根据应用程序状态、配置或请求参数确定工具是否应可用：

```php
<?php

namespace App\Mcp\Tools;

use Laravel\Mcp\Request;
use Laravel\Mcp\Server\Tool;

class CurrentWeatherTool extends Tool
{
    /**
     * 确定工具是否应注册。
     */
    public function shouldRegister(Request $request): bool
    {
        return $request?->user()?->subscribed() ?? false;
    }
}
```

当工具的 `shouldRegister` 方法返回 `false` 时，它将不会出现在可用工具列表中，并且 AI 客户端无法调用它。

<a name="tool-responses"></a>
### 工具响应

工具必须返回一个 `Laravel\Mcp\Response` 实例。Response 类提供了几种便捷的方法来创建不同类型的响应：

对于简单的文本响应，使用 `text` 方法：

```php
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;

/**
 * 处理工具请求。
 */
public function handle(Request $request): Response
{
    // ...

    return Response::text('天气摘要：晴朗，72°F');
}
```

要指示工具执行期间发生错误，使用 `error` 方法：

```php
return Response::error('无法获取天气数据。请重试。');
```

要返回图像或音频内容，使用 `image` 和 `audio` 方法：

```php
return Response::image(file_get_contents(storage_path('weather/radar.png')), 'image/png');

return Response::audio(file_get_contents(storage_path('weather/alert.mp3')), 'audio/mp3');
```

你也可以使用 `fromStorage` 方法直接从 Laravel 文件系统磁盘加载图像和音频内容。MIME 类型将自动从文件中检测：

```php
return Response::fromStorage('weather/radar.png');
```

如果需要，你可以指定特定磁盘或覆盖 MIME 类型：

```php
return Response::fromStorage('weather/radar.png', disk: 's3');

return Response::fromStorage('weather/radar.png', mimeType: 'image/webp');
```

<a name="multiple-content-responses"></a>
#### 多内容响应

工具可以通过返回一个 `Response` 实例数组来返回多个内容片段：

```php
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;

/**
 * 处理工具请求。
 *
 * @return array<int, \Laravel\Mcp\Response>
 */
public function handle(Request $request): array
{
    // ...

    return [
        Response::text('天气摘要：晴朗，72°F'),
        Response::text("**详细预报**\n- 上午：65°F\n- 下午：78°F\n- 晚上：70°F")
    ];
}
```

<a name="structured-responses"></a>
#### 结构化响应

工具可以使用 `structured` 方法返回[结构化内容](https://modelcontextprotocol.io/specification/2025-06-18/server/tools#structured-content)。这为 AI 客户端提供了可解析的数据，同时保持与 JSON 编码文本表示的向后兼容性：

```php
return Response::structured([
    'temperature' => 22.5,
    'conditions' => '局部多云',
    'humidity' => 65,
]);
```

如果你需要为结构化内容提供自定义文本，使用响应工厂的 `withStructuredContent` 方法：

```php
return Response::make(
    Response::text('天气为 22.5°C，晴朗')
)->withStructuredContent([
    'temperature' => 22.5,
    'conditions' => '晴朗',
]);
```

<a name="streaming-responses"></a>
#### 流式响应

对于长时间运行的操作或实时数据流，工具可以从其 `handle` 方法返回一个[生成器](https://www.php.net/manual/en/language.generators.overview.php)。这使得在最终响应之前可以向客户端发送中间更新：

```php
<?php

namespace App\Mcp\Tools;

use Generator;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class CurrentWeatherTool extends Tool
{
    /**
     * 处理工具请求。
     *
     * @return \Generator<int, \Laravel\Mcp\Response>
     */
    public function handle(Request $request): Generator
    {
        $locations = $request->array('locations');

        foreach ($locations as $index => $location) {
            yield Response::notification('processing/progress', [
                'current' => $index + 1,
                'total' => count($locations),
                'location' => $location,
            ]);

            yield Response::text($this->forecastFor($location));
        }
    }
}
```

使用基于 Web 的服务器时，流式响应会自动打开一个 SSE（服务器发送事件）流，将每个 yield 的消息作为事件发送给客户端。

<a name="prompts"></a>
## 提示

[提示](https://modelcontextprotocol.io/specification/2025-06-18/server/prompts)使你的服务器能够共享可重用的提示模板，AI 客户端可以使用这些模板与语言模型交互。它们提供了一种标准化的方式来构建常见的查询和交互。

<a name="creating-prompts"></a>
### 创建提示

要创建提示，运行 `make:mcp-prompt` Artisan 命令：

```shell
php artisan make:mcp-prompt DescribeWeatherPrompt
```

创建提示后，将其注册到服务器的 `$prompts` 属性中：

```php
<?php

namespace App\Mcp\Servers;

use App\Mcp\Prompts\DescribeWeatherPrompt;
use Laravel\Mcp\Server;

class WeatherServer extends Server
{
    /**
     * 此 MCP 服务器注册的提示。
     *
     * @var array<int, class-string<\Laravel\Mcp\Server\Prompt>>
     */
    protected array $prompts = [
        DescribeWeatherPrompt::class,
    ];
}
```

<a name="prompt-name-title-and-description"></a>
#### 提示名称、标题和描述

默认情况下，提示的名称和标题从类名派生。例如，`DescribeWeatherPrompt` 的名称将为 `describe-weather`，标题为 `Describe Weather Prompt`。你可以使用 `Name` 和 `Title` 属性自定义这些值：

```php
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Attributes\Title;

#[Name('weather-assistant')]
#[Title('天气助手提示')]
class DescribeWeatherPrompt extends Prompt
{
    // ...
}
```

提示描述不会自动生成。你应始终使用 `Description` 属性提供有意义的描述：

```php
use Laravel\Mcp\Server\Attributes\Description;

#[Description('为给定位置生成自然语言的天气解释。')]
class DescribeWeatherPrompt extends Prompt
{
    //
}
```

> [!NOTE]
> 描述是提示元数据的关键部分，因为它帮助 AI 模型理解何时以及如何最好地使用该提示。

<a name="prompt-arguments"></a>
### 提示参数

提示可以定义参数，允许 AI 客户端使用特定值自定义提示模板。使用 `arguments` 方法定义提示接受的参数：

```php
<?php

namespace App\Mcp\Prompts;

use Laravel\Mcp\Server\Prompt;
use Laravel\Mcp\Server\Prompts\Argument;

class DescribeWeatherPrompt extends Prompt
{
    /**
     * 获取提示的参数。
     *
     * @return array<int, \Laravel\Mcp\Server\Prompts\Argument>
     */
    public function arguments(): array
    {
        return [
            new Argument(
                name: 'tone',
                description: '天气描述中使用的情感基调（例如，正式、随意、幽默）。',
                required: true,
            ),
        ];
    }
}
```

<a name="validating-prompt-arguments"></a>
### 验证提示参数

提示参数会根据定义自动验证，但你可能还想实施更复杂的验证规则。

Laravel MCP 与 Laravel 的[验证功能](/docs/{{version}}/validation)无缝集成。你可以在提示的 `handle` 方法中验证传入的提示参数：

```php
<?php

namespace App\Mcp\Prompts;

use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Prompt;

class DescribeWeatherPrompt extends Prompt
{
    /**
     * 处理提示请求。
     */
    public function handle(Request $request): Response
    {
        $validated = $request->validate([
            'tone' => 'required|string|max:50',
        ]);

        $tone = $validated['tone'];

        // 使用给定的情感基调生成提示响应...
    }
}
```

验证失败时，AI 客户端将根据你提供的错误消息采取行动。因此，提供清晰且可操作的错误消息至关重要：

```php
$validated = $request->validate([
    'tone' => ['required','string','max:50'],
],[
    'tone.*' => '你必须为天气描述指定一个情感基调。例如 "正式"、"随意"或"幽默"。',
]);
```

<a name="prompt-dependency-injection"></a>
### 提示依赖注入

Laravel [服务容器](/docs/{{version}}/container)用于解析所有提示。因此，你可以在构造函数中类型提示提示可能需要的任何依赖项。声明的依赖项将自动解析并注入到提示实例中：

```php
<?php

namespace App\Mcp\Prompts;

use App\Repositories\WeatherRepository;
use Laravel\Mcp\Server\Prompt;

class DescribeWeatherPrompt extends Prompt
{
    /**
     * 创建一个新的提示实例。
     */
    public function __construct(
        protected WeatherRepository $weather,
    ) {}

    //
}
```

除了构造函数注入，你还可以在提示的 `handle` 方法中类型提示依赖项。当调用该方法时，服务容器将自动解析并注入依赖项：

```php
<?php

namespace App\Mcp\Prompts;

use App\Repositories\WeatherRepository;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Prompt;

class DescribeWeatherPrompt extends Prompt
{
    /**
     * 处理提示请求。
     */
    public function handle(Request $request, WeatherRepository $weather): Response
    {
        $isAvailable = $weather->isServiceAvailable();

        // ...
    }
}
```

<a name="conditional-prompt-registration"></a>
### 条件性提示注册

你可以通过在提示类中实现 `shouldRegister` 方法在运行时条件性地注册提示。此方法允许你根据应用程序状态、配置或请求参数确定提示是否应可用：

```php
<?php

namespace App\Mcp\Prompts;

use Laravel\Mcp\Request;
use Laravel\Mcp\Server\Prompt;

class CurrentWeatherPrompt extends Prompt
{
    /**
     * 确定提示是否应注册。
     */
    public function shouldRegister(Request $request): bool
    {
        return $request?->user()?->subscribed() ?? false;
    }
}
```

当提示的 `shouldRegister` 方法返回 `false` 时，它将不会出现在可用提示列表中，并且 AI 客户端无法调用它。

<a name="prompt-responses"></a>
### 提示响应

提示可以返回单个 `Laravel\Mcp\Response` 或 `Laravel\Mcp\Response` 实例的可迭代对象。这些响应封装了将发送给 AI 客户端的内容：

```php
<?php

namespace App\Mcp\Prompts;

use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Prompt;

class DescribeWeatherPrompt extends Prompt
{
    /**
     * 处理提示请求。
     *
     * @return array<int, \Laravel\Mcp\Response>
     */
    public function handle(Request $request): array
    {
        $tone = $request->string('tone');

        $systemMessage = "你是一个有用的天气助手。请用{$tone}的情感基调提供天气描述。";

        $userMessage = "纽约市现在的天气怎么样？";

        return [
            Response::text($systemMessage)->asAssistant(),
            Response::text($userMessage),
        ];
    }
}
```

你可以使用 `asAssistant()` 方法指示响应消息应被视为来自 AI 助手，而普通消息则被视为用户输入。

<a name="resources"></a>
## 资源

[资源](https://modelcontextprotocol.io/specification/2025-06-18/server/resources)使你的服务器能够暴露 AI 客户端可以读取并用作与语言模型交互时的上下文的数据和内容。它们提供了一种共享静态或动态信息的方式，如文档、配置或任何有助于告知 AI 响应的数据。

<a name="creating-resources"></a>
## 创建资源

要创建资源，运行 `make:mcp-resource` Artisan 命令：

```shell
php artisan make:mcp-resource WeatherGuidelinesResource
```

创建资源后，将其注册到服务器的 `$resources` 属性中：

```php
<?php

namespace App\Mcp\Servers;

use App\Mcp\Resources\WeatherGuidelinesResource;
use Laravel\Mcp\Server;

class WeatherServer extends Server
{
    /**
     * 此 MCP 服务器注册的资源。
     *
     * @var array<int, class-string<\Laravel\Mcp\Server\Resource>>
     */
    protected array $resources = [
        WeatherGuidelinesResource::class,
    ];
}
```

<a name="resource-name-title-and-description"></a>
#### 资源名称、标题和描述

默认情况下，资源的名称和标题从类名派生。例如，`WeatherGuidelinesResource` 的名称将为 `weather-guidelines`，标题为 `Weather Guidelines Resource`。你可以使用 `Name` 和 `Title` 属性自定义这些值：

```php
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Attributes\Title;

#[Name('weather-api-docs')]
#[Title('天气 API 文档')]
class WeatherGuidelinesResource extends Resource
{
    // ...
}
```

资源描述不会自动生成。你应始终使用 `Description` 属性提供有意义的描述：

```php
use Laravel\Mcp\Server\Attributes\Description;

#[Description('使用天气 API 的综合指南。')]
class WeatherGuidelinesResource extends Resource
{
    //
}
```

> [!NOTE]
> 描述是资源元数据的关键部分，因为它帮助 AI 模型理解何时以及如何有效地使用该资源。

<a name="resource-templates"></a>
### 资源模板

[资源模板](https://modelcontextprotocol.io/specification/2025-06-18/server/resources#resource-templates)使你的服务器能够暴露与带变量的 URI 模式匹配的动态资源。你可以创建一个处理多个 URI 的单一资源，而不是为每个资源定义静态 URI。

<a name="creating-resource-templates"></a>
#### 创建资源模板

要创建资源模板，在你的资源类上实现 `HasUriTemplate` 接口，并定义一个返回 `UriTemplate` 实例的 `uriTemplate` 方法：

```php
<?php

namespace App\Mcp\Resources;

use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\MimeType;
use Laravel\Mcp\Server\Contracts\HasUriTemplate;
use Laravel\Mcp\Server\Resource;
use Laravel\Mcp\Support\UriTemplate;

#[Description('按 ID 访问用户文件')]
#[MimeType('text/plain')]
class UserFileResource extends Resource implements HasUriTemplate
{
    /**
     * 获取此资源的 URI 模板。
     */
    public function uriTemplate(): UriTemplate
    {
        return new UriTemplate('file://users/{userId}/files/{fileId}');
    }

    /**
     * 处理资源请求。
     */
    public function handle(Request $request): Response
    {
        $userId = $request->get('userId');
        $fileId = $request->get('fileId');

        // 获取并返回文件内容...

        return Response::text($content);
    }
}
```

当资源实现了 `HasUriTemplate` 接口时，它将被注册为资源模板而不是静态资源。AI 客户端随后可以使用与模板模式匹配的 URI 请求资源，URI 中的变量将自动提取并在资源的 `handle` 方法中可用。

<a name="uri-template-syntax"></a>
#### URI 模板语法

URI 模板使用大括号括起来的占位符来定义 URI 中的变量段：

```php
new UriTemplate('file://users/{userId}');
new UriTemplate('file://users/{userId}/files/{fileId}');
new UriTemplate('https://api.example.com/{version}/{resource}/{id}');
```

<a name="accessing-template-variables"></a>
#### 访问模板变量

当 URI 匹配你的资源模板时，提取的变量会自动合并到请求中，并可以通过 `get` 方法访问：

```php
<?php

namespace App\Mcp\Resources;

use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Contracts\HasUriTemplate;
use Laravel\Mcp\Server\Resource;
use Laravel\Mcp\Support\UriTemplate;

class UserProfileResource extends Resource implements HasUriTemplate
{
    public function uriTemplate(): UriTemplate
    {
        return new UriTemplate('file://users/{userId}/profile');
    }

    public function handle(Request $request): Response
    {
        // 访问提取的变量
        $userId = $request->get('userId');

        // 如果需要，访问完整 URI
        $uri = $request->uri();

        // 获取用户资料...

        return Response::text("用户 {$userId} 的资料");
    }
}
```

`Request` 对象提供了提取的变量和请求的原始 URI，为你处理资源请求提供了完整的上下文。

<a name="resource-uri-and-mime-type"></a>
### 资源 URI 和 MIME 类型

每个资源由一个唯一的 URI 标识，并有一个关联的 MIME 类型，帮助 AI 客户端理解资源的格式。

默认情况下，资源的 URI 基于资源名称生成，因此 `WeatherGuidelinesResource` 的 URI 将为 `weather://resources/weather-guidelines`。默认的 MIME 类型是 `text/plain`。

你可以使用 `Uri` 和 `MimeType` 属性自定义这些值：

```php
<?php

namespace App\Mcp\Resources;

use Laravel\Mcp\Server\Attributes\MimeType;
use Laravel\Mcp\Server\Attributes\Uri;
use Laravel\Mcp\Server\Resource;

#[Uri('weather://resources/guidelines')]
#[MimeType('application/pdf')]
class WeatherGuidelinesResource extends Resource
{
}
```

URI 和 MIME 类型帮助 AI 客户端确定如何适当地处理和解释资源内容。

<a name="resource-request"></a>
### 资源请求

与工具和提示不同，资源无法定义输入模式或参数。但是，你仍然可以在资源的 `handle` 方法中与请求对象进行交互：

```php
<?php

namespace App\Mcp\Resources;

use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Resource;

class WeatherGuidelinesResource extends Resource
{
    /**
     * 处理资源请求。
     */
    public function handle(Request $request): Response
    {
        // ...
    }
}
```

<a name="resource-dependency-injection"></a>
### 资源依赖注入

Laravel [服务容器](/docs/{{version}}/container)用于解析所有资源。因此，你可以在构造函数中类型提示资源可能需要的任何依赖项。声明的依赖项将自动解析并注入到资源实例中：

```php
<?php

namespace App\Mcp\Resources;

use App\Repositories\WeatherRepository;
use Laravel\Mcp\Server\Resource;

class WeatherGuidelinesResource extends Resource
{
    /**
     * 创建一个新的资源实例。
     */
    public function __construct(
        protected WeatherRepository $weather,
    ) {}

    // ...
}
```

除了构造函数注入，你还可以在资源的 `handle` 方法中类型提示依赖项。当调用该方法时，服务容器将自动解析并注入依赖项：

```php
<?php

namespace App\Mcp\Resources;

use App\Repositories\WeatherRepository;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Resource;

class WeatherGuidelinesResource extends Resource
{
    /**
     * 处理资源请求。
     */
    public function handle(WeatherRepository $weather): Response
    {
        $guidelines = $weather->guidelines();

        return Response::text($guidelines);
    }
}
```

<a name="resource-annotations"></a>
### 资源注解

你可以使用[注解](https://modelcontextprotocol.io/specification/2025-06-18/schema#resourceannotations)来增强资源，为 AI 客户端提供额外的元数据。注解通过属性添加到资源上：

```php
<?php

namespace App\Mcp\Resources;

use Laravel\Mcp\Enums\Role;
use Laravel\Mcp\Server\Annotations\Audience;
use Laravel\Mcp\Server\Annotations\LastModified;
use Laravel\Mcp\Server\Annotations\Priority;
use Laravel\Mcp\Server\Resource;

#[Audience(Role::User)]
#[LastModified('2025-01-12T15:00:58Z')]
#[Priority(0.9)]
class UserDashboardResource extends Resource
{
    //
}
```

可用注解包括：

<div class="overflow-auto">

| 注解 | 类型 | 描述 |
| --- | --- | --- |
| `#[Audience]` | Role 或数组 | 指定目标受众（`Role::User`、`Role::Assistant` 或两者）。 |
| `#[Priority]` | 浮点数 | 介于 0.0 和 1.0 之间的数值评分，表示资源重要性。 |
| `#[LastModified]` | 字符串 | ISO 8601 时间戳，显示资源的最后更新时间。 |

</div>

<a name="conditional-resource-registration"></a>
### 条件性资源注册

你可以通过在资源类中实现 `shouldRegister` 方法在运行时条件性地注册资源。此方法允许你根据应用程序状态、配置或请求参数确定资源是否应可用：

```php
<?php

namespace App\Mcp\Resources;

use Laravel\Mcp\Request;
use Laravel\Mcp\Server\Resource;

class WeatherGuidelinesResource extends Resource
{
    /**
     * 确定资源是否应注册。
     */
    public function shouldRegister(Request $request): bool
    {
        return $request?->user()?->subscribed() ?? false;
    }
}
```

当资源的 `shouldRegister` 方法返回 `false` 时，它将不会出现在可用资源列表中，并且 AI 客户端无法访问它。

<a name="resource-responses"></a>
### 资源响应

资源必须返回一个 `Laravel\Mcp\Response` 实例。Response 类提供了几种便捷的方法来创建不同类型的响应：

对于简单的文本内容，使用 `text` 方法：

```php
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;

/**
 * 处理资源请求。
 */
public function handle(Request $request): Response
{
    // ...

    return Response::text($weatherData);
}
```

<a name="resource-link-responses"></a>
#### 资源链接响应

要返回资源链接，使用 `resourceLink` 方法，提供 URI 和名称。与内嵌资源不同，资源链接返回一个 AI 客户端独立获取的 URI 指针：

```php
return Response::resourceLink(
    uri: 'file:///data/report.json',
    name: 'monthly-report',
    mimeType: 'application/json',
);
```

你也可以传递一个注册的资源类或实例，它将自动继承资源的 URI、名称、标题、描述和 MIME 类型：

```php
return Response::resourceLink(new WeatherForecastResource);
```

<a name="resource-blob-responses"></a>
#### Blob 响应

要返回 blob 内容，使用 `blob` 方法，提供 blob 内容：

```php
return Response::blob(file_get_contents(storage_path('weather/radar.png')));
```

返回 blob 内容时，MIME 类型将由资源配置的 MIME 类型确定：

```php
<?php

namespace App\Mcp\Resources;

use Laravel\Mcp\Server\Attributes\MimeType;
use Laravel\Mcp\Server\Resource;

#[MimeType('image/png')]
class WeatherGuidelinesResource extends Resource
{
    //
}
```

<a name="resource-error-responses"></a>
#### 错误响应

要指示资源检索期间发生错误，使用 `error()` 方法：

```php
return Response::error('无法获取指定位置的天气数据。');
```

<a name="apps"></a>
## 应用

Laravel MCP 支持 [MCP 应用](https://modelcontextprotocol.io/extensions/apps/overview)，这是模型上下文协议的一种扩展，允许工具在受支持主机的沙盒 iframe 中渲染交互式 HTML 应用程序。这使你能够构建仪表盘、表单、可视化和其他超越纯文本响应的丰富体验。

一个 MCP 应用由两个协同工作的部分组成：

- 一个**应用资源**，返回应用程序的自包含 HTML。
- 一个**工具**，使用 `#[RendersApp]` 属性链接到应用资源。当调用该工具时，主机获取并渲染链接的资源。

<a name="creating-app-resources"></a>
### 创建应用资源

你可以使用 `make:mcp-app-resource` Artisan 命令创建应用资源：

```shell
php artisan make:mcp-app-resource WeatherDashboardApp
```

此命令创建两个文件：`app/Mcp/Resources` 中的 PHP 类和 `resources/views/mcp` 中的 Blade 视图。视图名称从类名自动推断。例如，`WeatherDashboardApp` 映射到 `mcp.weather-dashboard-app`：

```php
<?php

namespace App\Mcp\Resources;

use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\AppMeta;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\AppResource;

#[Description('一个交互式天气仪表盘。')]
#[AppMeta]
class WeatherDashboardApp extends AppResource
{
    /**
     * 处理应用资源请求。
     */
    public function handle(Request $request): Response
    {
        return Response::view('mcp.weather-dashboard-app', [
            'title' => $this->title(),
        ]);
    }
}
```

`AppResource` 扩展了基础 `Resource` 类，并自动配置 MCP 应用规范所需的 `ui://` URI 方案和 `text/html;profile=mcp-app` MIME 类型。与任何其他资源一样，你必须将其注册到服务器的 `$resources` 数组中。

生成的 Blade 视图使用 `<x-mcp::app>` 组件，该组件渲染一个包含客户端的 MCP SDK 并立即可用的完整 HTML 文档：

```blade
<x-mcp::app :title="$title">
    <x-slot:head>
        <script type="module">
        createMcpApp(async (app) => {
            document.getElementById('run-btn').addEventListener('click', async () => {
                const result = await app.callServerTool('get-weather-data', {});
                document.getElementById('output').textContent = result.content[0]?.text ?? '';
            });
        });
        </script>
    </x-slot:head>

    <div id="app">
        <button id="run-btn">刷新</button>
        <p id="output"></p>
    </div>
</x-mcp::app>
```

`createMcpApp` 全局函数由捆绑的 SDK 提供，负责将 iframe 连接到服务器、应用主机主题设置，并暴露 `callServerTool`、`sendMessage`、`openLink` 和事件回调等辅助方法。有关完整的客户端 API，请参考 [MCP 应用规范](https://modelcontextprotocol.io/extensions/apps/overview)。

<a name="rendering-apps-from-tools"></a>
### 从工具渲染应用

要显示应用资源，使用 `#[RendersApp]` 属性将工具链接到它。当调用该工具时，Laravel MCP 将资源的 URI 包含在工具元数据中，以便主机可以在沙盒 iframe 中渲染应用：

```php
<?php

namespace App\Mcp\Tools;

use App\Mcp\Resources\WeatherDashboardApp;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\RendersApp;
use Laravel\Mcp\Server\Tool;

#[RendersApp(resource: WeatherDashboardApp::class)]
class ShowWeatherDashboard extends Tool
{
    /**
     * 处理工具请求。
     */
    public function handle(Request $request): Response
    {
        return Response::text('天气仪表盘已加载。');
    }
}
```

只要注册了任何 `AppResource`，Laravel MCP 会自动通告 `io.modelcontextprotocol/ui` 能力，因此无需额外的服务器配置。

<a name="app-tool-visibility"></a>
### 应用工具可见性

每个 `#[RendersApp]` 工具可以通过 `visibility` 参数限制谁可以调用它。这对于暴露 UI 调用的私有、仅应用工具很有用，可以在不向模型暴露这些工具的情况下加载或刷新数据：

```php
use Laravel\Mcp\Server\Attributes\RendersApp;
use Laravel\Mcp\Server\Ui\Enums\Visibility;

#[RendersApp(resource: WeatherDashboardApp::class, visibility: [Visibility::App])]
class GetWeatherData extends Tool
{
    // ...
}
```

`Visibility` 枚举有两个取值：`Model` 和 `App`，默认为两者。使用 `[Visibility::App]` 用于 UI 直接调用的后端操作，使用 `[Visibility::Model]` 使工具对 UI 不可用。

<a name="app-configuration"></a>
### 应用配置

应用资源上的 `#[AppMeta]` 属性配置 iframe 的内容安全策略、浏览器权限以及应包含在视图 `<head>` 中的任何库脚本：

```php
use Laravel\Mcp\Server\Attributes\AppMeta;
use Laravel\Mcp\Server\Ui\Enums\Library;
use Laravel\Mcp\Server\Ui\Enums\Permission;

#[AppMeta(
    connectDomains: ['https://api.weather.com'],
    permissions: [Permission::Geolocation],
    libraries: [Library::Tailwind, Library::Alpine],
)]
class WeatherDashboardApp extends AppResource
{
    // ...
}
```

`Library` 枚举包括常用前端库的预配置 CDN 脚本，如 `Library::Tailwind` 和 `Library::Alpine`，其 CDN 来源会自动合并到 CSP 中。`Permission` 枚举涵盖浏览器权限，如 `Camera`、`Microphone`、`Geolocation` 和 `ClipboardWrite`。

对于计算或动态配置，使用 `Laravel\Mcp\Server\Ui` 命名空间中的流畅构建器 `AppMeta`、`Csp` 和 `Permissions` 覆盖资源上的 `appMeta` 方法。

<a name="building-apps-with-boost"></a>
### 使用 Boost 构建应用

Laravel MCP 包含一个专用的 [Boost](/docs/{{version}}/boost) 技能参考，用于构建 MCP 应用。如果你已安装 [Laravel Boost](/docs/{{version}}/boost)，你的 AI 编码代理可以调用 `mcp-development` 技能，并请求它为你搭建应用资源、Blade 视图和链接工具。

有关完整的协议参考，包括完整的客户端 API 和模式详情，请参阅官方的 [MCP 应用文档](https://modelcontextprotocol.io/extensions/apps/overview)。

<a name="metadata"></a>
## 元数据

Laravel MCP 还支持 [MCP 规范](https://modelcontextprotocol.io/specification/2025-06-18/basic#meta)中定义的 `_meta` 字段，某些 MCP 客户端或集成需要该字段。元数据可以应用于所有 MCP 原语，包括工具、资源和提示，以及它们的响应。

你可以使用 `withMeta` 方法将元数据附加到单个响应内容：

```php
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;

/**
 * 处理工具请求。
 */
public function handle(Request $request): Response
{
    return Response::text('天气晴朗。')
        ->withMeta(['source' => 'weather-api', 'cached' => true]);
}
```

对于适用于整个响应信封的结果级元数据，使用 `Response::make` 包装响应，并在返回的响应工厂实例上调用 `withMeta`：

```php
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;

/**
 * 处理工具请求。
 */
public function handle(Request $request): ResponseFactory
{
    return Response::make(
        Response::text('天气晴朗。')
    )->withMeta(['request_id' => '12345']);
}
```

要将元数据附加到工具、资源或提示本身，在类上定义一个 `$meta` 属性：

```php
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('获取当前天气预报。')]
class CurrentWeatherTool extends Tool
{
    protected ?array $meta = [
        'version' => '2.0',
        'author' => '天气团队',
    ];

    // ...
}
```

<a name="icons"></a>
## 图标

MCP 客户端可以为你的服务器及其原语显示图标。你可以使用 `Icon` 属性在服务器、工具、资源或提示上声明图标：

```php
use Laravel\Mcp\Enums\IconTheme;
use Laravel\Mcp\Server\Attributes\Icon;

#[Icon('mcp/server.png', mimeType: 'image/png', sizes: ['48x48'])]
#[Icon('mcp/server-dark.svg', theme: IconTheme::Dark)]
class WeatherServer extends Server
{
    // ...
}
```

`Icon` 属性是可重复的，因此你可以声明多个图标以提供不同大小或亮/暗主题变体。

或者，你可以通过覆盖 `icons` 方法以编程方式定义图标，这在图标依赖于运行时条件时很有用：

```php
use Laravel\Mcp\Schema\Icon;

class CurrentWeatherTool extends Tool
{
    /**
     * 获取工具的图标。
     *
     * @return array<int, Icon>
     */
    public function icons(): array
    {
        return [
            Icon::from('mcp/tool.png', mimeType: 'image/png'),
        ];
    }
}
```

通过属性和 `icons` 方法定义的图标会自动组合。图标路径的解析方式如下：

<div class="content-list" markdown="1">

- 具有 URI 方案的路径，如 `https:` 或 `data:`，将按原样使用。
- 相对路径将使用 Laravel 的 `asset` 助手解析为 URL。

</div>

<a name="authentication"></a>
## 认证

与路由一样，你可以使用中间件来认证 Web MCP 服务器。为 MCP 服务器添加认证将要求用户在使用服务器的任何功能之前进行认证。

有两种方法可以认证对 MCP 服务器的访问：通过 [Laravel Sanctum](/docs/{{version}}/sanctum) 的简单基于令牌的认证，或任何通过 `Authorization` HTTP 标头传递的令牌。或者，你可以通过 [Laravel Passport](/docs/{{version}}/passport) 使用 OAuth 进行认证。

<a name="oauth"></a>
### OAuth 2.1

保护基于 Web 的 MCP 服务器的最可靠方法是使用 [Laravel Passport](/docs/{{version}}/passport) 通过 OAuth 进行。

通过 OAuth 认证你的 MCP 服务器时，在 `routes/ai.php` 文件中调用 `Mcp::oauthRoutes` 方法来注册所需的 OAuth2 发现和客户端注册路由。然后，在 `routes/ai.php` 文件中将 Passport 的 `auth:api` 中间件应用于你的 `Mcp::web` 路由：

```php
use App\Mcp\Servers\WeatherExample;
use Laravel\Mcp\Facades\Mcp;

Mcp::oauthRoutes();
```

# Laravel AI SDK

- [简介](#introduction)
- [安装](#installation)
    - [配置](#configuration)
    - [自定义基础 URL](#custom-base-urls)
    - [兼容 OpenAI 的提供者](#openai-compatible-providers)
    - [提供者支持](#provider-support)
- [代理](#agents)
    - [提示](#prompting)
    - [对话上下文](#conversation-context)
    - [结构化输出](#structured-output)
    - [附件](#attachments)
    - [流式输出](#streaming)
    - [广播](#broadcasting)
    - [队列](#queueing)
    - [工具](#tools)
    - [文件存储工具](#file-storage-tools)
    - [MCP 工具](#mcp-tools)
    - [提供者工具](#provider-tools)
    - [子代理](#sub-agents)
    - [中间件](#middleware)
    - [匿名代理](#anonymous-agents)
    - [代理配置](#agent-configuration)
    - [提供者选项](#provider-options)
- [人类工具审批](#human-tool-approval)
    - [完整审批流程](#complete-approval-flow)
- [图像](#images)
- [音频（TTS）](#audio)
- [转录（STT）](#transcription)
- [文本摘要](#text-summarization)
- [嵌入](#embeddings)
    - [多模态嵌入](#multimodal-embeddings)
    - [查询嵌入](#querying-embeddings)
    - [缓存嵌入](#caching-embeddings)
- [重排序](#reranking)
- [文件](#files)
- [向量存储](#vector-stores)
    - [向存储添加文件](#adding-files-to-stores)
- [故障转移](#failover)
- [测试](#testing)
    - [代理](#testing-agents)
    - [图像](#testing-images)
    - [音频](#testing-audio)
    - [转录](#testing-transcriptions)
    - [嵌入](#testing-embeddings)
    - [重排序](#testing-reranking)
    - [文件](#testing-files)
    - [向量存储](#testing-vector-stores)
- [事件](#events)

<a name="introduction"></a>
## 简介

[Laravel AI SDK](https://github.com/laravel/ai) 提供了一个统一的、富有表现力的 API，用于与 OpenAI、Anthropic、Gemini 等 AI 提供者进行交互。使用 AI SDK，你可以构建具有工具和结构化输出的智能代理、生成图像、合成和转录音频、创建向量嵌入以及更多——全部使用一致的、Laravel 友好的接口。

<a name="installation"></a>
## 安装

你可以通过 Composer 安装 Laravel AI SDK：

```shell
composer require laravel/ai
```

接下来，你应该使用 `vendor:publish` Artisan 命令发布 AI SDK 配置和迁移文件：

```shell
php artisan vendor:publish --provider="Laravel\Ai\AiServiceProvider"
```

最后，你应该运行应用程序的数据库迁移。这将创建 AI SDK 用于支持对话存储的 `agent_conversations` 和 `agent_conversation_messages` 表：

```shell
php artisan migrate
```

<a name="configuration"></a>
### 配置

你可以在应用程序的 `config/ai.php` 配置文件或应用程序 `.env` 文件中定义 AI 提供者凭证：

```ini
ANTHROPIC_API_KEY=
AZURE_OPENAI_API_KEY=
COHERE_API_KEY=
DEEPSEEK_API_KEY=
ELEVENLABS_API_KEY=
GEMINI_API_KEY=
GROQ_API_KEY=
MISTRAL_API_KEY=
OLLAMA_API_KEY=
OPENAI_API_KEY=
OPENAI_COMPATIBLE_API_KEY=
OPENAI_COMPATIBLE_URL=
OPENROUTER_API_KEY=
JINA_API_KEY=
VOYAGEAI_API_KEY=
XAI_API_KEY=
```

用于文本、图像、音频、转录和嵌入的默认模型也可以在应用程序的 `config/ai.php` 配置文件中配置。

<a name="custom-base-urls"></a>
### 自定义基础 URL

默认情况下，Laravel AI SDK 直接连接到每个提供者的公共 API 端点。但是，你可能需要将请求路由到不同的端点——例如，使用代理服务来集中管理 API 密钥、实施频率限制或将流量路由通过企业网关。

你可以通过向提供者配置添加 `url` 参数来配置自定义基础 URL：

```php
'providers' => [
    'openai' => [
        'driver' => 'openai',
        'key' => env('OPENAI_API_KEY'),
        'url' => env('OPENAI_URL'),
    ],

    'anthropic' => [
        'driver' => 'anthropic',
        'key' => env('ANTHROPIC_API_KEY'),
        'url' => env('ANTHROPIC_BASE_URL'),
    ],
],
```

这在通过代理服务（如 LiteLLM 或 Azure OpenAI Gateway）路由请求或使用替代端点时很有用。

以下提供者支持自定义基础 URL：OpenAI、Anthropic、Gemini、Groq、Cohere、DeepSeek、xAI 和 OpenRouter。

<a name="openai-compatible-providers"></a>
### 兼容 OpenAI 的提供者

如果你使用的是兼容 OpenAI 的 API，例如 LM Studio、vLLM、Together、Fireworks 或本地网关，你可以配置一个 `openai-compatible` 提供者。`url` 选项是必需的，而 `key` 选项是可选的，如果存在，将作为 bearer 令牌发送：

```php
'providers' => [
    'local' => [
        'driver' => 'openai-compatible',
        'url' => env('LOCAL_AI_URL'),
        'key' => env('LOCAL_AI_API_KEY'),
    ],
],
```

配置完成后，你可以像使用任何其他提供者一样使用命名提供者：

```php
agent()->prompt('什么是 Laravel？', provider: 'local', model: 'local-model');
```

你也可以为提供者配置默认文本模型，这样就不需要显式传递模型：

```php
'local' => [
    'driver' => 'openai-compatible',
    'url' => env('LOCAL_AI_URL'),
    'key' => env('LOCAL_AI_API_KEY'),
    'models' => [
        'text' => [
            'default' => env('LOCAL_AI_MODEL'),
        ],
    ],
],
```

兼容 OpenAI 的提供者支持文本生成、流式输出、工具、结构化输出和图像附件。如果你的端点需要额外的请求体字段，请使用[提供者选项](#provider-options)提供它们。

<a name="provider-support"></a>
### 提供者支持

AI SDK 在其功能中支持多种提供者。下表总结了每个功能可用的提供者：

<div class="overflow-auto">

| 功能 | 提供者 |
|---|---|
| 文本 | OpenAI、OpenAI Compatible、Anthropic、Gemini、Azure、Bedrock、Groq、xAI、DeepSeek、Mistral、Ollama、OpenRouter |
| 图像 | OpenAI、Gemini、xAI、Azure、Bedrock、OpenRouter |
| TTS | OpenAI、ElevenLabs、Gemini |
| STT | OpenAI、ElevenLabs、Mistral、Gemini |
| 嵌入 | OpenAI、Gemini、Azure、Bedrock、Cohere、Mistral、Jina、VoyageAI、Ollama、OpenRouter |
| 重排序 | Cohere、Jina、VoyageAI |
| 文件 | OpenAI、Anthropic、Gemini、Azure |

</div>

`Laravel\Ai\Enums\Lab` 枚举可用于在代码中引用提供者，而不是使用普通字符串：

```php
use Laravel\Ai\Enums\Lab;

Lab::Anthropic;
Lab::OpenAI;
Lab::OpenAiCompatible;
Lab::Gemini;
// ...
```

<a name="agents"></a>
## 代理

代理是与 Laravel AI SDK 中的 AI 提供者交互的基本构建块。每个代理都是一个专用的 PHP 类，封装了与大型语言模型交互所需的指令、对话上下文、工具和输出模式。将代理视为一个专门的助手——一个销售教练、文档分析器、支持机器人——你配置一次，然后在应用程序中按需提示。

你可以通过 `make:agent` Artisan 命令创建代理：

```shell
php artisan make:agent SalesCoach

php artisan make:agent SalesCoach --structured
```

在生成的代理类中，你可以定义系统提示/指令、消息上下文、可用工具和输出模式（如果适用）：

```php
<?php

namespace App\Ai\Agents;

use App\Ai\Tools\RetrievePreviousTranscripts;
use App\Models\History;
use App\Models\User;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Messages\Message;
use Laravel\Ai\Promptable;
use Stringable;

class SalesCoach implements Agent, Conversational, HasTools, HasStructuredOutput
{
    use Promptable;

    public function __construct(public User $user) {}

    /**
     * 获取代理应遵循的指令。
     */
    public function instructions(): Stringable|string
    {
        return '你是一名销售教练，分析通话记录并提供反馈和整体销售能力评分。';
    }

    /**
     * 获取到目前为止组成对话的消息列表。
     */
    public function messages(): iterable
    {
        return History::where('user_id', $this->user->id)
            ->latest()
            ->limit(50)
            ->get()
            ->reverse()
            ->map(function ($message) {
                return new Message($message->role, $message->content);
            })->all();
    }

    /**
     * 获取代理可用的工具。
     *
     * @return Tool[]
     */
    public function tools(): iterable
    {
        return [
            new RetrievePreviousTranscripts,
        ];
    }

    /**
     * 获取代理的结构化输出模式定义。
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'feedback' => $schema->string()->required(),
            'score' => $schema->integer()->min(1)->max(10)->required(),
        ];
    }
}
```

<a name="prompting"></a>
### 提示

要提示代理，首先使用 `make` 方法或标准实例化创建一个实例，然后调用 `prompt`：

```php
$response = (new SalesCoach)
    ->prompt('分析这段销售通话记录...');

return (string) $response;
```

`make` 方法从容器中解析你的代理，允许自动依赖注入。你也可以向代理的构造函数传递参数：

```php
$agent = SalesCoach::make(user: $user);
```

通过向 `prompt` 方法传递额外参数，你可以在提示时覆盖默认的提供者、模型或 HTTP 超时：

```php
$response = (new SalesCoach)->prompt(
    '分析这段销售通话记录...',
    provider: Lab::Anthropic,
    model: 'claude-sonnet-5',
    timeout: 120,
);
```

<a name="conversation-context"></a>
### 对话上下文

如果你的代理实现了 `Conversational` 接口，你可以使用 `messages` 方法返回之前的对话上下文（如果适用）：

```php
use App\Models\History;
use Laravel\Ai\Messages\Message;

/**
 * 获取到目前为止组成对话的消息列表。
 */
public function messages(): iterable
{
    return History::where('user_id', $this->user->id)
        ->latest()
        ->limit(50)
        ->get()
        ->reverse()
        ->map(function ($message) {
            return new Message($message->role, $message->content);
        })->all();
}
```

<a name="remembering-conversations"></a>
#### 记住对话

> **警告：** 在使用 `RemembersConversations` trait 之前，应使用 `vendor:publish` Artisan 命令发布并运行 AI SDK 的迁移。这些迁移将创建存储对话所需的数据库表。

如果你希望 Laravel 自动存储和检索代理的对话历史，可以使用 `RemembersConversations` trait。该 trait 提供了一种简单的方式将对话消息持久化到数据库，而无需手动实现 `Conversational` 接口：

```php
<?php

namespace App\Ai\Agents;

use Laravel\Ai\Concerns\RemembersConversations;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Promptable;

class SalesCoach implements Agent, Conversational
{
    use Promptable, RemembersConversations;

    /**
     * 获取代理应遵循的指令。
     */
    public function instructions(): string
    {
        return '你是一名销售教练...';
    }
}
```

使用 `RemembersConversations` trait 时，不要在代理类中手动定义 `messages` 方法。如果存在 `messages` 方法，它将优先于 trait 的实现，并且对话历史将不会从数据库加载。

要开始一个新的用户对话，在提示之前调用 `forUser` 方法：

```php
$response = (new SalesCoach)->forUser($user)->prompt('你好！');

$conversationId = $response->conversationId;
```

对话 ID 在响应中返回，可以存储以供将来参考。如果你想使用 Eloquent 检索用户的所有对话，可以将 `HasConversations` trait 添加到用户模型：

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Ai\Concerns\HasConversations;

class User extends Authenticatable
{
    use HasConversations;
}
```

将 trait 添加到模型后，你可以通过 `conversations` 关系检索和查询用户的对话：

```php
$conversations = $user->conversations()
    ->latest('updated_at')
    ->paginate(20);
```

要继续现有对话，使用 `continue` 方法：

```php
$response = (new SalesCoach)
    ->continue($conversationId, as: $user)
    ->prompt('告诉我更多相关信息。');
```

使用 `RemembersConversations` trait 时，之前的消息会在提示时自动加载并包含在对话上下文中。新消息（用户和助手的）会在每次交互后自动存储。

<a name="conversation-participants"></a>
#### 对话参与者

虽然用户是最常见的对话参与者，但对话可以属于任何 Eloquent 模型。使用 `forParticipant` 方法为其他类型的模型开始对话：

```php
$response = (new SalesCoach)
    ->forParticipant($team)
    ->prompt('回顾我们最新的销售业绩。');
```

参与者的多态类和主键与对话一起存储。因此，具有相同主键的不同类型模型，例如 `User` ID `1` 和 `Team` ID `1`，有独立的对话历史。`forUser` 方法是 `forParticipant` 的别名。

你可以使用 `continueLastConversation` 方法继续参与者的最新对话：

```php
$response = (new SalesCoach)
    ->continueLastConversation($team)
    ->prompt('告诉我更多相关信息。');
```

当继续特定对话时，将参与者传递给 `continue` 方法：

```php
$response = (new SalesCoach)
    ->continue($conversationId, as: $team)
    ->prompt('告诉我更多相关信息。');
```

`HasConversations` trait 可以添加到参与对话的任何 Eloquent 模型上。生成的 `conversations` 关系是一个多态关系，限定在该模型的类型和主键范围内。你也可以通过其逆关系访问拥有对话的参与者：

```php
$conversations = $team->conversations;

$participant = $conversation->participant;
```

如果你的应用程序使用多种参与者模型类型，应考虑定义一个 [Eloquent 多态映射](/docs/{{version}}/eloquent-relationships#custom-polymorphic-types)，以便存储的参与者类型不耦合到你的模型类名。

> [!WARNING]
> `continue` 方法不会验证给定的参与者是否拥有该对话。你的应用程序应在继续对话之前授权对该对话的访问。

<a name="structured-output"></a>
### 结构化输出

如果你希望代理返回结构化输出，实现 `HasStructuredOutput` 接口，该接口要求你的代理定义一个 `schema` 方法：

```php
<?php

namespace App\Ai\Agents;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Promptable;

class SalesCoach implements Agent, HasStructuredOutput
{
    use Promptable;

    // ...

    /**
     * 获取代理的结构化输出模式定义。
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'score' => $schema->integer()->required(),
        ];
    }
}
```

当提示返回结构化输出的代理时，你可以像访问数组一样访问返回的 `StructuredAgentResponse`：

```php
$response = (new SalesCoach)->prompt('分析这段销售通话记录...');

return $response['score'];
```

<a name="structured-output-nested-objects"></a>
#### 嵌套对象

要定义嵌套的结构化输出，使用带闭包的 `object` 方法：

```php
<?php

namespace App\Ai\Agents;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Promptable;

class SalesCoach implements Agent, HasStructuredOutput
{
    use Promptable;

    // ...

    /**
     * 获取代理的结构化输出模式定义。
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'score' => $schema->integer()->required(),
            'metadata' => $schema->object(fn ($schema) => [
                'confidence' => $schema->string()->enum(['low', 'medium', 'high'])->required(),
                'language' => $schema->string()->required(),
            ])->required(),
        ];
    }
}
```

<a name="structured-output-arrays-of-objects"></a>
#### 对象数组

如果你的代理应返回一个结构化项目列表，结合 `array` 和 `object` 方法：

```php
public function schema(JsonSchema $schema): array
{
    return [
        'feedback' => $schema->array()
            ->items(
                $schema->object(fn ($schema) => [
                    'comment' => $schema->string()->required(),
                    'score' => $schema->integer()->required(),
                ])
            )
            ->required(),
    ];
}
```

如果值可能匹配多个模式之一，使用 `anyOf` 方法：

```php
public function schema(JsonSchema $schema): array
{
    return [
        'content' => $schema->anyOf([
            $schema->object(fn ($schema) => [
                'type' => $schema->string()->enum(['article'])->required(),
                'title' => $schema->string()->required(),
            ]),
            $schema->object(fn ($schema) => [
                'type' => $schema->string()->enum(['image'])->required(),
                'url' => $schema->string()->required(),
            ]),
        ])->required(),
    ];
}
```

<a name="attachments"></a>
### 附件

提示时，你还可以传递附件与提示一起，允许模型检查图像和文档：

```php
use App\Ai\Agents\SalesCoach;
use Laravel\Ai\Files;

$response = (new SalesCoach)->prompt(
    '分析附件的销售通话记录...',
    attachments: [
        Files\Document::fromStorage('transcript.pdf') // 从文件系统磁盘附加文档...
        Files\Document::fromPath('/home/laravel/transcript.md') // 从本地路径附加文档...
        $request->file('transcript'), // 附加上传的文件...
    ]
);
```

同样，`Laravel\Ai\Files\Image` 类可用于向提示附加图像：

```php
use App\Ai\Agents\ImageAnalyzer;
use Laravel\Ai\Files;

$response = (new ImageAnalyzer)->prompt(
    '这张图片里有什么？',
    attachments: [
        Files\Image::fromStorage('photo.jpg') // 从文件系统磁盘附加图像...
        Files\Image::fromPath('/home/laravel/photo.jpg') // 从本地路径附加图像...
        $request->file('photo'), // 附加上传的文件...
    ]
);
```

<a name="streaming"></a>
### 流式输出

你可以通过调用 `stream` 方法来流式输出代理的响应。返回的 `StreamableAgentResponse` 可以从路由返回，以自动向客户端发送流式响应（SSE）：

```php
use App\Ai\Agents\SalesCoach;

Route::get('/coach', function () {
    return (new SalesCoach)->stream('分析这段销售通话记录...');
});
```

`then` 方法可用于提供一个闭包，该闭包将在整个响应已流式传输到客户端后被调用：

```php
use App\Ai\Agents\SalesCoach;
use Laravel\Ai\Responses\StreamedAgentResponse;

Route::get('/coach', function () {
    return (new SalesCoach)
        ->stream('分析这段销售通话记录...')
        ->then(function (StreamedAgentResponse $response) {
            // $response->text, $response->events, $response->usage...
        });
});
```

或者，你可以手动遍历流式事件：

```php
$stream = (new SalesCoach)->stream('分析这段销售通话记录...');

foreach ($stream as $event) {
    // ...
}
```

<a name="streaming-using-the-vercel-ai-sdk-protocol"></a>
#### 使用 Vercel AI SDK 协议进行流式输出

你可以通过调用可流式响应上的 `usingVercelDataProtocol` 方法来使用 [Vercel AI SDK 流协议](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol)流式传输事件：

```php
use App\Ai\Agents\SalesCoach;

Route::get('/coach', function () {
    return (new SalesCoach)
        ->stream('分析这段销售通话记录...')
        ->usingVercelDataProtocol();
});
```

<a name="broadcasting"></a>
### 广播

你可以通过几种不同的方式广播流式事件。首先，你可以简单地调用流式事件上的 `broadcast` 或 `broadcastNow` 方法：

```php
use App\Ai\Agents\SalesCoach;
use Illuminate\Broadcasting\Channel;

$stream = (new SalesCoach)->stream('分析这段销售通话记录...');

foreach ($stream as $event) {
    $event->broadcast(new Channel('channel-name'));
}
```

或者，你可以调用代理的 `broadcastOnQueue` 方法，将代理操作加入队列并在事件可用时广播流式事件：

```php
(new SalesCoach)->broadcastOnQueue(
    '分析这段销售通话记录...'
    new Channel('channel-name'),
);
```

<a name="skipping-oversized-events"></a>
#### 跳过过大事件

某些广播平台将 WebSocket 消息限制在大约 10KB。数据量大的流事件，如大型工具结果，可能超过此限制并导致广播失败。你可以使用 `WithoutBroadcasting` 属性排除特定事件类型不被广播：

```php
<?php

namespace App\Ai\Agents;

use Laravel\Ai\Attributes\WithoutBroadcasting;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Promptable;
use Laravel\Ai\Streaming\Events\ToolCall;
use Laravel\Ai\Streaming\Events\ToolResult;

#[WithoutBroadcasting(ToolCall::class, ToolResult::class)]
class SearchAgent implements Agent, HasTools
{
    use Promptable;

    // ...
}
```

被排除的事件永远不会被广播，但它们仍然会持久化到 `agent_conversation_messages` 表中，因此你的前端可以在流完成后加载完整的工具数据。这同时适用于队列（`broadcastOnQueue`）和同步（`broadcast` / `broadcastNow`）广播。

<a name="queueing"></a>
### 队列

使用代理的 `queue` 方法，你可以提示代理但允许它在后台处理响应，保持应用程序的快速和响应性。`then` 和 `catch` 方法可用于注册闭包，这些闭包将在响应可用或发生异常时被调用：

```php
use Illuminate\Http\Request;
use Laravel\Ai\Responses\AgentResponse;
use Throwable;

Route::post('/coach', function (Request $request) {
    (new SalesCoach)
        ->queue($request->input('transcript'))
        ->then(function (AgentResponse $response) {
            // ...
        })
        ->catch(function (Throwable $e) {
            // ...
        });

    return back();
});
```

<a name="tools"></a>
### 工具

工具可用于为代理提供额外的功能，它们可以在响应提示时使用。工具可以使用 `make:tool` Artisan 命令创建：

```shell
php artisan make:tool RandomNumberGenerator
```

生成的工具将放置在应用程序的 `app/Ai/Tools` 目录中。每个工具包含一个 `handle` 方法，当代理需要使用该工具时将调用该方法：

```php
<?php

namespace App\Ai\Tools;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class RandomNumberGenerator implements Tool
{
    /**
     * 获取工具用途的描述。
     */
    public function description(): Stringable|string
    {
        return '此工具可用于生成加密安全的随机数。';
    }

    /**
     * 执行工具。
     */
    public function handle(Request $request): Stringable|string
    {
        return (string) random_int($request['min'], $request['max']);
    }

    /**
     * 获取工具的模式定义。
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'min' => $schema->integer()->min(0)->required(),
            'max' => $schema->integer()->required(),
        ];
    }
}
```

定义好工具后，你可以从任何代理的 `tools` 方法中返回它：

```php
use App\Ai\Tools\RandomNumberGenerator;

/**
 * 获取代理可用的工具。
 *
 * @return Tool[]
 */
public function tools(): iterable
{
    return [
        new RandomNumberGenerator,
    ];
}
```

<a name="similarity-search"></a>
#### 相似度搜索

`SimilaritySearch` 工具允许代理使用存储在数据库中的向量嵌入搜索与给定查询相似的文档。这对于检索增强生成（RAG）非常有用，当你希望让代理访问搜索应用程序的数据时。

创建相似度搜索工具的最简单方法是使用带有向量嵌入的 Eloquent 模型的 `usingModel` 方法：

```php
use App\Models\Document;
use Laravel\Ai\Tools\SimilaritySearch;

public function tools(): iterable
{
    return [
        SimilaritySearch::usingModel(Document::class, 'embedding'),
    ];
}
```

第一个参数是 Eloquent 模型类，第二个参数是包含向量嵌入的列。

你还可以提供介于 `0.0` 和 `1.0` 之间的最小相似度阈值以及一个用于自定义查询的闭包：

```php
SimilaritySearch::usingModel(
    model: Document::class,
    column: 'embedding',
    minSimilarity: 0.7,
    limit: 10,
    query: fn ($query) => $query->where('published', true),
),
```

对于更多控制，你可以使用返回搜索结果的闭包创建相似度搜索工具：

```php
use App\Models\Document;
use Laravel\Ai\Tools\SimilaritySearch;

public function tools(): iterable
{
    return [
        new SimilaritySearch(using: function (string $query) {
            return Document::query()
                ->where('user_id', $this->user->id)
                ->whereVectorSimilarTo('embedding', $query)
                ->limit(10)
                ->get();
        }),
    ];
}
```

你可以使用 `withDescription` 方法自定义工具的描述：

```php
SimilaritySearch::usingModel(Document::class, 'embedding')
    ->withDescription('搜索知识库以查找相关文章。'),
```

<a name="file-storage-tools"></a>
### 文件存储工具

`FileStorage` 工具工厂允许你让代理访问 Laravel [文件系统磁盘](/docs/{{version}}/filesystem)。`all` 方法返回允许代理列出、读取、检查、生成 URL、写入、删除和复制给定磁盘上文件的工具：

```php
use Laravel\Ai\Tools\FileStorage;

public function tools(): iterable
{
    return FileStorage::all('local');
}
```

如果你的代理应该只能检查文件，使用 `readOnly` 方法：

```php
return FileStorage::readOnly('local');
```

这些方法返回 `Illuminate\Support\Collection`，允许你进一步过滤提供给代理的工具：

```php
use Laravel\Ai\Tools\Filesystem\DeleteFile;

return FileStorage::all('s3')
    ->reject(fn ($tool) => $tool instanceof DeleteFile);
```

<a name="mcp-tools"></a>
### MCP 工具

如果你的应用程序使用 [Laravel MCP](/docs/{{version}}/mcp)，你可以让代理使用由[模型上下文协议](https://modelcontextprotocol.io)服务器暴露的工具。使用 [Laravel MCP 客户端](/docs/{{version}}/mcp#client)，你可以连接到远程或本地 MCP 服务器，并将其工具直接传递给代理。

> [!NOTE]
> MCP 工具需要 [Laravel MCP](/docs/{{version}}/mcp) 包安装在你的应用程序中。

由于 MCP 客户端的 `tools` 方法返回一个集合，使用 `...` 运算符将其展开到代理的 `tools` 数组中：

```php
use App\Ai\Tools\RandomNumberGenerator;
use Laravel\Mcp\Client;

/**
 * 获取代理可用的工具。
 *
 * @return Tool[]
 */
public function tools(): iterable
{
    return [
        ...Client::web('https://mcp.example.com')
            ->withToken($token)
            ->tools(),

        new RandomNumberGenerator,
    ];
}
```

AI SDK 会自动包装每个 MCP 工具，使代理可以像调用其他工具一样调用它。你也可以使用[命名 MCP 客户端](/docs/{{version}}/mcp#named-clients)：

```php
use Laravel\Mcp\Facades\Mcp;

public function tools(): iterable
{
    return [
        ...Mcp::client('github')->tools(),
    ];
}
```

或者连接到[本地 MCP 服务器](/docs/{{version}}/mcp#client-connecting)：

```php
use Laravel\Mcp\Client;

public function tools(): iterable
{
    return [
        ...Client::local('php', ['artisan', 'mcp:start'])->tools(),
    ];
}
```

有关创建和认证 MCP 客户端的更多信息，包括 bearer 令牌和 OAuth，请查阅 [MCP 客户端文档](/docs/{{version}}/mcp#client)。

<a name="provider-tools"></a>
### 提供者工具

提供者工具是由 AI 提供者原生实现的特殊工具，提供诸如网页搜索、URL 获取和文件搜索等功能。与常规工具不同，提供者工具由提供者本身执行，而不是你的应用程序。

提供者工具可以从代理的 `tools` 方法返回。

<a name="web-search"></a>
#### 网页搜索

`WebSearch` 提供者工具允许代理搜索网页以获取实时信息。这对于回答关于当前事件、最新数据或可能已超出模型训练截止日期的问题非常有用。

**支持的提供者：** Anthropic、OpenAI、Gemini、OpenRouter

```php
use Laravel\Ai\Providers\Tools\WebSearch;

public function tools(): iterable
{
    return [
        new WebSearch,
    ];
}
```

你可以配置网页搜索工具以限制搜索次数或将结果限制到特定域名：

```php
(new WebSearch)->max(5)->allow(['laravel.com', 'php.net']),
```

要根据用户位置优化搜索结果，使用 `location` 方法：

```php
(new WebSearch)->location(
    city: 'New York',
    region: 'NY',
    country: 'US'
);
```

<a name="web-fetch"></a>
#### 网页获取

`WebFetch` 提供者工具允许代理获取和读取网页内容。当你需要代理分析特定 URL 或从已知网页检索详细信息时，这很有用。

**支持的提供者：** Anthropic、Gemini

```php
use Laravel\Ai\Providers\Tools\WebFetch;

public function tools(): iterable
{
    return [
        new WebFetch,
    ];
}
```

你可以配置网页获取工具以限制获取次数或限制到特定域名：

```php
(new WebFetch)->max(3)->allow(['docs.laravel.com']),
```

<a name="file-search"></a>
#### 文件搜索

`FileSearch` 提供者工具允许代理搜索存储在[向量存储](#vector-stores)中的[文件](#files)。这使得检索增强生成（RAG）成为可能，允许代理在你的上传文档中搜索相关信息。

**支持的提供者：** OpenAI、Gemini

```php
use Laravel\Ai\Providers\Tools\FileSearch;

public function tools(): iterable
{
    return [
        new FileSearch(stores: ['store_id']),
    ];
}
```

你可以提供多个向量存储 ID 以跨多个存储搜索：

```php
new FileSearch(stores: ['store_1', 'store_2']);
```

如果你的文件有[元数据](#adding-files-to-stores)，你可以通过提供 `where` 参数来过滤搜索结果。对于简单的相等性过滤，传递一个数组：

```php
new FileSearch(stores: ['store_id'], where: [
    'author' => 'Taylor Otwell',
    'year' => 2026,
]);
```

对于更复杂的过滤，你可以传递一个接收 `FileSearchQuery` 实例的闭包：

```php
use Laravel\Ai\Providers\Tools\FileSearchQuery;

new FileSearch(stores: ['store_id'], where: fn (FileSearchQuery $query) =>
    $query->where('author', 'Taylor Otwell')
        ->whereNot('status', 'draft')
        ->whereIn('category', ['news', 'updates'])
);
```

<a name="sub-agents"></a>
### 子代理

代理也可以从另一个代理的 `tools` 方法返回。当一个代理作为工具返回时，父代理可以将特定任务委托给子代理，并在回答原始提示时使用子代理的响应。当通用代理需要访问具有自己的指令、工具、模型配置或提供者偏好的专用代理时，这很有用。

例如，客户支持代理可以将退款资格问题委托给专门的退款代理：

```php
<?php

namespace App\Ai\Agents;

use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Promptable;

class CustomerSupportAgent implements Agent, HasTools
{
    use Promptable;

    /**
     * 获取代理应遵循的指令。
     */
    public function instructions(): string
    {
        return '你帮助客户解决账户、订单和账单问题。将退款政策问题委托给退款专员。';
    }

    /**
     * 获取代理可用的工具。
     *
     * @return Tool[]
     */
    public function tools(): iterable
    {
        return [
            new RefundsAgent,
        ];
    }
}
```

要自定义子代理对父代理的暴露方式，在子代理上实现 `CanActAsTool` 接口，并定义面向工具的名称和描述：

```php
<?php

namespace App\Ai\Agents;

use App\Ai\Tools\LookupOrder;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\CanActAsTool;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;

#[Provider(Lab::Anthropic)]
class RefundsAgent implements Agent, CanActAsTool, HasTools
{
    use Promptable;

    /**
     * 获取代理应遵循的指令。
     */
    public function instructions(): string
    {
        return '你是一名退款专员。使用订单详情和退款政策提供简洁的资格指导。';
    }

    /**
     * 获取代理的工具名称。
     */
    public function name(): string
    {
        return 'refunds_specialist';
    }

    /**
     * 获取代理的工具描述。
     */
    public function description(): string
    {
        return '确定订单是否有资格退款并解释下一步。';
    }

    /**
     * 获取代理可用的工具。
     *
     * @return Tool[]
     */
    public function tools(): iterable
    {
        return [
            new LookupOrder,
        ];
    }
}
```

如果子代理未实现 `CanActAsTool`，Laravel 将使用代理的类基名作为工具名称，并使用通用的描述，要求父代理传递清晰、自包含的任务描述。每个子代理调用独立运行，不接收父代理的对话历史。

<a name="middleware"></a>
### 中间件

代理支持中间件，允许你在提示发送到提供者之前拦截和修改提示。中间件可以使用 `make:agent-middleware` Artisan 命令创建：

```shell
php artisan make:agent-middleware LogPrompts
```

生成的中间件将放置在应用程序的 `app/Ai/Middleware` 目录中。要向代理添加中间件，实现 `HasMiddleware` 接口并定义一个返回中间件类数组的 `middleware` 方法：

```php
<?php

namespace App\Ai\Agents;

use App\Ai\Middleware\LogPrompts;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasMiddleware;
use Laravel\Ai\Promptable;

class SalesCoach implements Agent, HasMiddleware
{
    use Promptable;

    // ...

    /**
     * 获取代理的中间件。
     */
    public function middleware(): array
    {
        return [
            new LogPrompts,
        ];
    }
}
```

每个中间件类应定义一个 `handle` 方法，接收 `AgentPrompt` 和一个 `Closure` 以将提示传递给下一个中间件：

```php
<?php

namespace App\Ai\Middleware;

use Closure;
use Laravel\Ai\Prompts\AgentPrompt;

class LogPrompts
{
    /**
     * 处理传入的提示。
     */
    public function handle(AgentPrompt $prompt, Closure $next)
    {
        Log::info('正在提示代理', ['prompt' => $prompt->prompt]);

        return $next($prompt);
    }
}
```

你可以使用响应上的 `then` 方法在代理处理完成后执行代码。这同时适用于同步和流式响应：

```php
public function handle(AgentPrompt $prompt, Closure $next)
{
    return $next($prompt)->then(function (AgentResponse $response) {
        Log::info('代理已响应', ['text' => $response->text]);
    });
}
```

<a name="anonymous-agents"></a>
### 匿名代理

有时你可能希望快速与模型交互，而无需创建专门的代理类。你可以使用 `agent` 函数创建一个临时的匿名代理：

```php
use function Laravel\Ai\{agent};

$response = agent(
    instructions: '你是一名软件开发专家。',
    messages: [],
    tools: [],
)->prompt('告诉我关于 Laravel')
```

匿名代理也可以产生结构化输出：

```php
use Illuminate\Contracts\JsonSchema\JsonSchema;

use function Laravel\Ai\{agent};

$response = agent(
    schema: fn (JsonSchema $schema) => [
        'number' => $schema->integer()->required(),
    ],
)->prompt('生成一个小于 100 的随机数')
```

<a name="agent-configuration"></a>
### 代理配置

你可以使用 PHP 属性为代理配置文本生成选项。以下属性可用：

- `MaxSteps`：代理在使用工具时可以执行的最大步骤数。
- `MaxTokens`：模型可以生成的最大令牌数。
- `Model`：代理应使用的模型。
- `Provider`：用于代理的 AI 提供者（或用于故障转移的多个提供者）。
- `Temperature`：用于生成的采样温度（0.0 到 1.0）。
- `Timeout`：代理请求的 HTTP 超时秒数（默认：60）。
- `TopP`：用于生成的核心采样概率（0.0 到 1.0）。
- `UseCheapestModel`：使用提供者的最便宜文本模型以优化成本。
- `UseSmartestModel`：使用提供者的最强大文本模型以处理复杂任务。

```php
<?php

namespace App\Ai\Agents;

use Laravel\Ai\Attributes\MaxSteps;
use Laravel\Ai\Attributes\MaxTokens;
use Laravel\Ai\Attributes\Model;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Attributes\Temperature;
use Laravel\Ai\Attributes\Timeout;
use Laravel\Ai\Attributes\TopP;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;

#[Provider(Lab::Anthropic)]
#[Model('claude-sonnet-5')]
#[MaxSteps(10)]
#[MaxTokens(4096)]
#[Temperature(0.7)]
#[Timeout(120)]
#[TopP(0.9)]
class SalesCoach implements Agent
{
    use Promptable;

    // ...
}
```

`UseCheapestModel` 和 `UseSmartestModel` 属性允许你自动为给定提供者选择最具成本效益或最强大的模型，而无需指定模型名称。当你想在不同提供者之间优化成本或能力时，这很有用：

```php
use Laravel\Ai\Attributes\UseCheapestModel;
use Laravel\Ai\Attributes\UseSmartestModel;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Promptable;

#[UseCheapestModel]
class SimpleSummarizer implements Agent
{
    use Promptable;

    // 将使用最便宜的模型（例如 Haiku）...
}

#[UseSmartestModel]
class ComplexReasoner implements Agent
{
    use Promptable;

    // 将使用最强大的模型（例如 Opus）...
}
```

> [!NOTE]
> `UseCheapestModel` 和 `UseSmartestModel` 选择的底层模型可能会在 Laravel AI SDK 的发布版本之间发生变化，因为提供者会发布新模型。切换模型可能会引入行为变化、弃用的参数和显著的成本差异。如果你需要稳定、可预测的模型和定价，请使用 `Model` 属性显式指定模型。

<a name="provider-options"></a>
### 提供者选项

如果你的代理需要传递特定于提供者的选项（例如 OpenAI 的推理努力或惩罚设置），实现 `HasProviderOptions` 契约并定义一个 `providerOptions` 方法：

```php
<?php

namespace App\Ai\Agents;

use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasProviderOptions;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;

class SalesCoach implements Agent, HasProviderOptions
{
    use Promptable;

    // ...

    /**
     * 获取特定于提供者的生成选项。
     */
    public function providerOptions(Lab|string $provider): array
    {
        return match ($provider) {
            Lab::OpenAI => [
                'reasoning' => ['effort' => 'low'],
                'frequency_penalty' => 0.5,
                'presence_penalty' => 0.3,
            ],
            Lab::Anthropic => [
                'thinking' => ['budget_tokens' => 1024],
                'cache_control' => ['type' => 'ephemeral'],
            ],
            default => [],
        };
    }
}
```

`providerOptions` 方法接收当前使用的提供者（`Lab` 枚举或字符串），允许你为每个提供者返回不同的选项。当使用[故障转移](#failover)时，这尤其有用，因为每个回退提供者都可以接收其自己的配置。

上面的 Anthropic 示例还通过 `cache_control` 启用了[提示缓存](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)。

<a name="human-tool-approval"></a>
## 人类工具审批

> [!WARNING]
> 工具审批需要一个 `Conversational` 代理，其对话历史被持久化，以便暂停的调用可以恢复。`RemembersConversations` trait 提供了必要的持久化能力。

执行敏感或不可逆操作的工具可能需要在执行之前获得人类审批。要使工具可审批，实现 `Approvable` 契约并使用 `InteractsWithApprovals` trait。可审批工具默认需要审批：

```php
<?php

namespace App\Ai\Tools;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Storage;
use Laravel\Ai\Concerns\InteractsWithApprovals;
use Laravel\Ai\Contracts\Approvable;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class DeleteFile implements Approvable, Tool
{
    use InteractsWithApprovals;

    /**
     * 获取工具用途的描述。
     */
    public function description(): Stringable|string
    {
        return '从存储中删除文件。';
    }

    /**
     * 执行工具。
     */
    public function handle(Request $request): Stringable|string
    {
        Storage::delete($request['path']);

        return "已删除 [{$request['path']}]。";
    }

    /**
     * 获取工具的模式定义。
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'path' => $schema->string()->required(),
        ];
    }
}
```

要基于工具调用的参数确定是否需要审批，在工具上定义一个 `needsApproval` 方法。此方法可以返回布尔值或包含审批请求原因的 `Approval` 实例：

```php
use Laravel\Ai\Approvals\Approval;

/**
 * 确定工具是否需要为给定请求进行审批。
 */
protected function needsApproval(Request $request): Approval|bool
{
    return str_starts_with($request['path'], 'temporary/')
        ? false
        : Approval::required('这将永久删除一个文件。');
}
```

你可以从代理的 `tools` 方法返回工具时覆盖工具的审批要求：

```php
public function tools(): iterable
{
    return [
        (new SendNotification)->withoutApproval(),
        (new DeleteFile)->requireApproval('需要删除审查。'),
    ];
}
```

当调用可审批工具时，代理会在执行之前暂停。你可以检查响应的待处理审批，其中包含每个工具调用的 ID、工具名称、参数和审批原因：

```php
$response = (new FileAssistant)
    ->forUser($user)
    ->prompt('删除旧的发票。');

if ($response->hasPendingApprovals()) {
    foreach ($response->pendingApprovals as $approval) {
        // $approval->id
        // $approval->tool
        // $approval->arguments
        // $approval->reason
    }
}
```

要恢复代理，继续对话并提供一个包含每个待处理工具调用决策的 `Decisions` 实例。决策可以批准调用、拒绝调用或在执行前编辑其参数：

```php
use Laravel\Ai\Approvals\Decision;
use Laravel\Ai\Approvals\Decisions;

$response = (new FileAssistant)
    ->continue($conversationId, as: $user)
    ->prompt(Decisions::from([
        'call_abc' => Decision::approve(),
        'call_ghi' => Decision::reject('发票必须保留。'),
    ]));
```

布尔值 `true` 和 `false` 可用作批准和拒绝的简写。每个待处理的工具调用都必须收到一个决策。未知、缺失或先前已解析的工具调用 ID 将导致抛出 `ApprovalMismatchException`。你可以使用 `approveRemaining` 或 `rejectRemaining` 方法为没有显式决策的调用提供默认值：

```php
$decisions = Decisions::from([
    'call_abc' => true,
])->rejectRemaining('未批准。');

$response = (new FileAssistant)
    ->continue($conversationId, as: $user)
    ->prompt($decisions);
```

带结果的拒绝（例如 `Decision::reject('未批准。')`）会返回给模型，以便它继续响应。不带结果的拒绝会在记录拒绝后停止生成循环。

工具审批由 `prompt`、`stream`、`queue`、`broadcast`、`broadcastNow` 和 `broadcastOnQueue` 方法支持。

在流式传输和广播期间，暂停由 `tool_approval_request` 事件表示。使用 [Vercel AI SDK 流协议](#streaming-using-the-vercel-ai-sdk-protocol)时，审批请求和结果使用协议的原生工具审批部分发出。

对于队列中的代理，结果响应传递给 `then` 回调，并且 Laravel 还会分派一个 `ToolApprovalRequested` 事件。

Laravel 在要求模型继续之前存储已批准工具的结果。如果后续生成失败，审批已解决。继续对话时使用正常的文本提示，而不是再次提交相同的审批决策。

<a name="complete-approval-flow"></a>
### 完整审批流程

以下路由演示了完整的审批流程。`GET` 路由返回聊天屏幕，而 `POST` 路由接受来自聊天屏幕的新文本提示或审批决策。此示例假设应用程序的 `User` 模型使用 `HasConversations` trait：

```php
use App\Ai\Agents\FileAssistant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\Rule;
use Laravel\Ai\Approvals\Decision;
use Laravel\Ai\Approvals\Decisions;
use Laravel\Ai\Models\Conversation;

Route::get('/chat/{conversation}', function (Request $request, Conversation $conversation) {
    Gate::authorize('view', $conversation);

    return view('chat', [
        'conversation' => $conversation,
    ]);
})->middleware('auth');

Route::post('/chat/{conversation}', function (Request $request, Conversation $conversation) {
    Gate::authorize('view', $conversation);

    $validated = $request->validate([
        'message' => ['nullable', 'string', 'required_without:decisions', 'prohibited_with:decisions'],
        'decisions' => ['nullable', 'array', 'required_without:message', 'prohibited_with:message'],
        'decisions.*.action' => ['required_with:decisions', Rule::in(['approve', 'reject'])],
        'decisions.*.result' => ['nullable', 'string'],
    ]);

    $prompt = isset($validated['decisions'])
        ? Decisions::from($validated->collect('decisions')->map(
            fn (array $decision) => match ($decision['action']) {
                'approve' => Decision::approve(),
                'reject' => Decision::reject($decision['result'] ?? null),
            }
        )->all())
        : $validated['message'];

    $response = (new FileAssistant)
        ->continue($conversation->id, as: $request->user())
        ->prompt($prompt);

    return [
        'conversation_id' => $response->conversationId,
        'status' => $response->hasPendingApprovals() ? 'awaiting_approval' : 'complete',
        'message' => $response->text,
        'approvals' => $response->pendingApprovals,
    ];
})->middleware('auth');
```

当响应状态为 `awaiting_approval` 时，聊天屏幕应渲染待处理的审批，并使用工具调用 ID 作为每个决策的键将用户的选择提交到同一端点：

```json
{
    "decisions": {
        "call_abc": {
            "action": "approve"
        },
        "call_def": {
            "action": "reject",
            "result": "发票必须保留。"
        }
    }
}
```

对于正常的聊天消息，屏幕可以转而提交一个 `message` 值：

```json
{
    "message": "删除旧的发票。"
}
```

<a name="images"></a>
## 图像

`Laravel\Ai\Image` 类可用于使用 `openai`、`gemini` 或 `xai` 提供者生成图像：

```php
use Laravel\Ai\Image;

$image = Image::of('一个放在厨房台面上的甜甜圈')->generate();

$rawContent = (string) $image;
```

`square`、`portrait` 和 `landscape` 方法可用于控制图像的宽高比，而 `quality` 方法可用于指导模型最终的图像质量（`high`、`medium`、`low`）。`timeout` 方法可用于指定 HTTP 超时秒数：

```php
use Laravel\Ai\Image;

$image = Image::of('一个放在厨房台面上的甜甜圈')
    ->quality('high')
    ->landscape()
    ->timeout(120)
    ->generate();
```

你可以使用 `attachments` 方法附加参考图像：

```php
use Laravel\Ai\Files;
use Laravel\Ai\Image;

$image = Image::of('将这张我的照片更新为印象派绘画风格。')
    ->attachments([
        Files\Image::fromStorage('photo.jpg'),
        // Files\Image::fromPath('/home/laravel/photo.jpg'),
        // Files\Image::fromUrl('https://example.com/photo.jpg'),
    ])
    ->generate();
```

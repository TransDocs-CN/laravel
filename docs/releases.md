# 版本发布说明

- [版本控制方案](#versioning-scheme)
- [支持政策](#support-policy)
- [Laravel 13](#laravel-13)

<a name="versioning-scheme"></a>
## 版本控制方案

Laravel 及其其他第一方包遵循[语义化版本控制](https://semver.org)。主要框架版本每年发布一次（~Q1），而次要版本和补丁版本可能每周发布一次。次要版本和补丁版本**绝不**应包含破坏性变更。

在从应用或包中引用 Laravel 框架或其组件时，您应始终使用版本约束（如 `^13.0`），因为 Laravel 的主要版本确实包含破坏性变更。但是，我们努力确保您始终可以在一天或更短的时间内更新到新的主要版本。

<a name="named-arguments"></a>
#### 命名参数

[命名参数](https://www.php.net/manual/en/functions.arguments.php#functions.named-arguments)不受 Laravel 向后兼容性指南的约束。我们可能会在必要时重命名函数参数以改进 Laravel 代码库。因此，在调用 Laravel 方法时使用命名参数应谨慎，并理解参数名称将来可能会更改。

<a name="support-policy"></a>
## 支持政策

对于所有 Laravel 版本，错误修复提供 18 个月，安全修复提供 2 年。对于所有其他库，只有最新的主要版本获得错误修复。此外，请查看 Laravel [支持的数据库版本](/docs/{{version}}/database#introduction)。

<div class="overflow-auto">

| 版本 | PHP (*)   | 发布             | 错误修复截止       | 安全修复截止       |
| ------- |-----------| ------------------- | ------------------- | -------------------- |
| 10      | 8.1 - 8.3 | 2023年2月14日       | 2024年8月6日        | 2025年2月4日         |
| 11      | 8.2 - 8.4 | 2024年3月12日       | 2025年9月3日        | 2026年3月12日        |
| 12      | 8.2 - 8.5 | 2025年2月24日       | 2026年8月13日       | 2027年2月24日        |
| 13      | 8.3 - 8.5 | 2026年3月17日       | 2027年Q3            | 2028年3月17日        |

</div>

<div class="version-colors">
    <div class="end-of-life">
        <div class="color-box"></div>
        <div>生命周期结束</div>
    </div>
    <div class="security-fixes">
        <div class="color-box"></div>
        <div>仅安全修复</div>
    </div>
</div>

(*) 受支持的 PHP 版本

<a name="laravel-13"></a>
## Laravel 13

Laravel 13 延续了 Laravel 年度发布的节奏，重点关注 AI 原生工作流、更强的默认值和更具表达力的开发者 API。此版本包括第一方 AI 原语、JSON:API 资源、语义/向量搜索能力，以及队列、缓存和安全方面的增量改进。

<a name="minimal-breaking-changes"></a>
### 最小化破坏性变更

在此发布周期中，我们的主要重点是尽量减少破坏性变更。取而代之的是，我们致力于全年持续交付不会破坏现有应用的生活质量改进。

因此，Laravel 13 版本在升级工作量方面相对较小，同时仍然提供了重要的新功能。鉴于此，大多数 Laravel 应用可以在不更改太多应用代码的情况下升级到 Laravel 13。

<a name="php-8"></a>
### PHP 8.3

Laravel 13.x 需要最低 PHP 8.3 版本。

<a name="ai-sdk"></a>
### Laravel AI SDK

Laravel 13 引入了第一方 [Laravel AI SDK](https://laravel.com/ai)，为文本生成、工具调用代理、嵌入、音频、图像和向量存储集成提供了统一的 API。

使用 AI SDK，您可以构建与提供商无关的 AI 功能，同时保持一致的 Laravel 原生开发者体验。

例如，一个基本代理可以通过单次调用来提示：

```php
use App\Ai\Agents\SalesCoach;

$response = SalesCoach::make()->prompt('Analyze this sales transcript...');

return (string) $response;
```

Laravel AI SDK 还可以生成图像、音频和嵌入：

对于视觉生成用例，SDK 提供了一个简洁的 API，用于从自然语言提示创建图像：

```php
use Laravel\Ai\Image;

$image = Image::of('A donut sitting on the kitchen counter')->generate();

$rawContent = (string) $image;
```

对于语音体验，您可以从文本合成为助手、叙述和辅助功能提供自然语音的音频：

```php
use Laravel\Ai\Audio;

$audio = Audio::of('I love coding with Laravel.')->generate();

$rawContent = (string) $audio;
```

对于语义搜索和检索工作流，您可以直接从字符串生成嵌入：

```php
use Illuminate\Support\Str;

$embeddings = Str::of('Napa Valley has great wine.')->toEmbeddings();
```

<a name="json-api"></a>
### JSON:API 资源

Laravel 现在包含第一方 [JSON:API 资源](/docs/{{version}}/eloquent-resources#jsonapi-resources)，使返回符合 JSON:API 规范的响应变得简单直接。

JSON:API 资源处理资源对象序列化、关系包含、稀疏字段集、链接和符合 JSON:API 的响应头。

<a name="request-forgery-protection"></a>
### 请求伪造防护

出于安全考虑，Laravel 的[请求伪造防护](/docs/{{version}}/csrf#preventing-csrf-requests)中间件已增强并正式化为 `PreventRequestForgery`，增加了基于请求来源的验证，同时保持与基于令牌的 CSRF 保护的兼容性。

<a name="queue-routing"></a>
### 队列路由

Laravel 13 通过 `Queue::route(...)` 添加了[按类的队列路由](/docs/{{version}}/queues#queue-routing)，允许您在一个中心位置为特定任务定义默认队列/连接路由规则：

```php
Queue::route(ProcessPodcast::class, connection: 'redis', queue: 'podcasts');
```

<a name="php-attributes"></a>
### 扩展的 PHP 属性

Laravel 13 继续在整个框架中扩展第一方 PHP 属性支持，使常见的配置和行为关注点更具声明性，并与您的类和方法共存。

值得注意的新增内容包括控制器和授权属性，如 [`#[Middleware]`](/docs/{{version}}/controllers#controller-middleware) 和 [`#[Authorize]`](/docs/{{version}}/controllers#authorization-attributes)，以及面向队列的任务控制，如 [`#[Tries]`](/docs/{{version}}/queues#max-job-attempts-and-timeout)、[`#[Backoff]`](/docs/{{version}}/queues#dealing-with-failed-jobs)、[`#[Timeout]`](/docs/{{version}}/queues#max-job-attempts-and-timeout) 和 [`#[FailOnTimeout]`](/docs/{{version}}/queues#failing-on-timeout)。

例如，控制器中间件和策略检查现在可以直接在类和方法上声明：

```php
<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Post;
use Illuminate\Routing\Attributes\Controllers\Authorize;
use Illuminate\Routing\Attributes\Controllers\Middleware;

#[Middleware('auth')]
class CommentController
{
    #[Middleware('subscribed')]
    #[Authorize('create', [Comment::class, 'post'])]
    public function store(Post $post)
    {
        // ...
    }
}
```

在 Eloquent、事件、通知、验证、测试和资源序列化 API 中也引入了额外的属性，在框架的更多领域为您提供一致的属性优先选项。

<a name="cache-touch"></a>
### 缓存 TTL 扩展

Laravel 现在包含 [`Cache::touch(...)`](/docs/{{version}}/cache)，允许您扩展现有缓存项的 TTL，而无需检索和重新存储其值。

<a name="semantic-search"></a>
### 语义/向量搜索

Laravel 13 通过原生向量查询支持、嵌入工作流和相关的 API（在[搜索](/docs/{{version}}/search#semantic-vector-search)、[查询](/docs/{{version}}/queries#vector-similarity-clauses)和 [AI SDK](/docs/{{version}}/ai-sdk#embeddings) 文档中进行了说明）深化了其语义搜索能力。

这些功能使得使用 PostgreSQL + `pgvector` 构建 AI 驱动的搜索体验变得简单直接，包括对直接从字符串生成的嵌入进行相似性搜索。

例如，您可以直接从查询构建器运行语义相似性搜索：

```php
$documents = DB::table('documents')
    ->whereVectorSimilarTo('embedding', 'Best wineries in Napa Valley')
    ->limit(10)
    ->get();
```

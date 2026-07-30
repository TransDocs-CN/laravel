# 搜索

- [简介](#introduction)
    - [全文搜索](#introduction-full-text-search)
    - [语义/向量搜索](#introduction-semantic-vector-search)
    - [重排序](#introduction-reranking)
    - [Scout 搜索引擎](#introduction-scout-search-engines)
- [全文搜索](#full-text-search)
    - [添加全文索引](#adding-full-text-indexes)
    - [执行全文查询](#running-full-text-queries)
- [语义/向量搜索](#semantic-vector-search)
    - [生成嵌入](#generating-embeddings)
    - [存储和索引向量](#storing-and-indexing-vectors)
    - [按相似度查询](#querying-by-similarity)
- [重排序结果](#reranking-results)
- [Laravel Scout](#laravel-scout)
    - [数据库引擎](#database-engine)
    - [第三方引擎](#third-party-engines)
- [组合技术](#combining-techniques)

<a name="introduction"></a>
## 简介

几乎每个应用程序都需要搜索。无论你的用户是在知识库中搜索相关文章、浏览产品目录，还是对文档集合提出自然语言问题，Laravel 都提供了内置工具来处理这些场景——而且你通常不需要任何外部服务。

大多数应用程序会发现，Laravel 提供的内置数据库驱动选项已经足够——只有在需要容错、分面过滤或大规模地理搜索等功能时才需要外部搜索服务。

<a name="introduction-full-text-search"></a>
#### 全文搜索

当你需要关键词相关性排名——数据库根据搜索结果与搜索词的匹配程度进行评分和排序时——Laravel 的 `whereFullText` 查询构建器方法利用了 MariaDB、MySQL 和 PostgreSQL 的原生全文索引。全文搜索能理解单词边界和词干提取，因此搜索"running"可以匹配包含"run"的记录。无需外部服务。

<a name="introduction-semantic-vector-search"></a>
#### 语义/向量搜索

对于由 AI 驱动的语义搜索（按*含义*而非精确关键词匹配结果），`whereVectorSimilarTo` 查询构建器方法使用存储在 PostgreSQL 中的向量嵌入，配合 `pgvector` 扩展。例如，搜索"纳帕谷最佳酒庄"可以显示一篇题为"值得参观的顶级葡萄园"的文章——即使这些词语并不重叠。向量搜索需要 PostgreSQL 配合 `pgvector` 扩展和 [Laravel AI SDK](/docs/{{version}}/ai-sdk)。

<a name="introduction-reranking"></a>
#### 重排序

Laravel 的 [AI SDK](/docs/{{version}}/ai-sdk) 提供了重排序能力，使用 AI 模型根据与查询的语义相关性对任何结果集进行重新排序。重排序作为快速初始检索步骤（如全文搜索）之后的第二阶段尤其强大——既能提供速度，又能提供语义准确性。

<a name="introduction-scout-search-engines"></a>
#### Laravel Scout 搜索

对于希望使用 `Searchable` trait 自动保持搜索索引与 Eloquent 模型同步的应用程序，[Laravel Scout](/docs/{{version}}/scout) 提供了内置的数据库引擎以及适用于 Algolia、Meilisearch 和 Typesense 等第三方服务的驱动。

<a name="full-text-search"></a>
## 全文搜索

虽然 `LIKE` 查询适用于简单的子串匹配，但它们不理解语言。搜索"running"的 `LIKE` 查询找不到包含"run"的记录，结果也不是按相关性排序的——它们只是按数据库找到的顺序返回。全文搜索通过使用理解单词边界、词干提取和相关性评分的专门索引解决了这两个问题，使数据库能够先返回最相关的结果。

快速的全文搜索内置于 MariaDB、MySQL 和 PostgreSQL——无需外部搜索服务。你只需向要搜索的列添加全文索引，然后使用 `whereFullText` 查询构建器方法进行搜索。

> [!WARNING]
> 全文搜索目前由 MariaDB、MySQL 和 PostgreSQL 支持。

<a name="adding-full-text-indexes"></a>
### 添加全文索引

要使用全文搜索，首先向要搜索的列添加全文索引。你可以向单个列添加索引，或传递一个列数组来创建复合索引，一次搜索多个字段：

```php
Schema::create('articles', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    $table->text('body');
    $table->timestamps();

    $table->fullText(['title', 'body']);
});
```

在 PostgreSQL 上，你可以为索引指定语言配置，这控制单词如何进行词干提取：

```php
$table->fullText('body')->language('english');
```

有关创建索引的更多信息，请查阅[迁移文档](/docs/{{version}}/migrations#available-index-types)。

<a name="running-full-text-queries"></a>
### 执行全文查询

索引就位后，使用 `whereFullText` 查询构建器方法进行搜索。Laravel 将为你的数据库驱动生成适当的 SQL——例如，在 MariaDB 和 MySQL 上为 `MATCH(...) AGAINST(...)`，在 PostgreSQL 上为 `to_tsvector(...) @@ plainto_tsquery(...)`：

```php
$articles = Article::whereFullText('body', 'web developer')->get();
```

使用 MariaDB 和 MySQL 时，结果会自动按相关性分数排序。在 PostgreSQL 上，`whereFullText` 过滤匹配记录但不会按相关性排序——如果你需要 PostgreSQL 上的自动相关性排序，可以考虑使用 [Scout 的数据库引擎](#database-engine)，它会为你处理这个问题。

如果你创建了跨多个列的复合全文索引，可以通过向 `whereFullText` 传递相同的列数组来搜索所有列：

```php
$articles = Article::whereFullText(
    ['title', 'body'], 'web developer'
)->get();
```

`orWhereFullText` 方法可用于添加全文搜索子句作为"or"条件。有关完整详情，请查阅[查询构建器文档](/docs/{{version}}/queries#full-text-where-clauses)。

<a name="semantic-vector-search"></a>
## 语义/向量搜索

全文搜索依赖于匹配关键词——查询中的词语必须以某种形式出现在数据中。语义搜索采用了一种根本不同的方法：它使用 AI 生成的向量嵌入来表示文本的*含义*（以数字数组的形式），然后找到与查询含义最相似的结果。例如，搜索"纳帕谷最佳酒庄"可以显示一篇题为"值得参观的顶级葡萄园"的文章——即使这些词语完全不重叠。

向量搜索的基本工作流程是：为每段内容生成一个嵌入（数字数组）并将其与数据一起存储，然后在搜索时，为用户查询生成一个嵌入，并找到在向量空间中距离最近的存储嵌入。

> [!NOTE]
> 向量搜索需要 [Laravel AI SDK](/docs/{{version}}/ai-sdk)，并由 PostgreSQL（需要 `pgvector` 扩展）和 MongoDB（需要 [Laravel MongoDB 包](https://laravel.com/docs/13.x/mongodb)）支持。[Laravel Cloud](https://laravel.com/cloud) 上的所有 Postgres 数据库都已安装 `pgvector`。

<a name="generating-embeddings"></a>
### 生成嵌入

嵌入是一个高维数字数组（通常包含数百或数千个数字），表示一段文本的语义含义。你可以使用 Laravel 的 `Stringable` 类上可用的 `toEmbeddings` 方法为字符串生成嵌入：

```php
use Illuminate\Support\Str;

$embedding = Str::of('纳帕谷有很棒的葡萄酒。')->toEmbeddings();
```

要一次性为多个输入生成嵌入——这比逐个生成更高效，因为它只需要向嵌入提供者发出一个 API 请求——请使用 `Embeddings` 类：

```php
use Laravel\Ai\Embeddings;

$response = Embeddings::for([
    '纳帕谷有很棒的葡萄酒。',
    'Laravel 是一个 PHP 框架。',
])->generate();

$response->embeddings; // [[0.123, 0.456, ...], [0.789, 0.012, ...]]
```

有关配置嵌入提供者、自定义维度和缓存的更多详情，请查阅 [AI SDK 文档](/docs/{{version}}/ai-sdk#embeddings)。

<a name="storing-and-indexing-vectors"></a>
### 存储和索引向量

要存储向量嵌入，在你的迁移中定义一个 `vector` 列，指定与嵌入提供者输出匹配的维度数（例如，OpenAI 的 `text-embedding-3-small` 模型为 1536）。你还应在该列上调用 `index` 来创建 HNSW（分层可导航小世界）索引，这可以显著加速大型数据集上的相似度搜索：

```php
Schema::ensureVectorExtensionExists();

Schema::create('documents', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    $table->text('content');
    $table->vector('embedding', dimensions: 1536)->index();
    $table->timestamps();
});
```

`Schema::ensureVectorExtensionExists` 方法确保在创建表之前已在 PostgreSQL 数据库上启用 `pgvector` 扩展。

在你的 Eloquent 模型上，将向量列转换为 `array`，以便 Laravel 自动处理 PHP 数组与数据库向量格式之间的转换：

```php
protected function casts(): array
{
    return [
        'embedding' => 'array',
    ];
}
```

有关向量列和索引的更多详情，请查阅[迁移文档](/docs/{{version}}/migrations#available-column-types)。

<a name="querying-by-similarity"></a>
### 按相似度查询

一旦你为内容存储了嵌入，就可以使用 `whereVectorSimilarTo` 方法搜索相似的记录。该方法使用余弦相似度将给定嵌入与存储向量进行比较，过滤掉低于 `minSimilarity` 阈值的结果，并自动按相关性排序——最相似的记录排在前面。阈值应为 `0.0` 到 `1.0` 之间的值，其中 `1.0` 表示向量完全相同：

```php
$documents = Document::query()
    ->whereVectorSimilarTo('embedding', $queryEmbedding, minSimilarity: 0.4)
    ->limit(10)
    ->get();
```

为了方便，当提供普通字符串而不是嵌入数组时，Laravel 会自动使用你配置的嵌入提供者为你生成嵌入。这意味着你可以直接传递用户的搜索查询，而无需手动将其转换为嵌入：

```php
$documents = Document::query()
    ->whereVectorSimilarTo('embedding', '纳帕谷最佳酒庄')
    ->limit(10)
    ->get();
```

对于更底层的向量查询控制，还可以使用 `whereVectorDistanceLessThan`、`selectVectorDistance` 和 `orderByVectorDistance` 方法。这些方法让你可以直接处理距离值而不是相似度分数，将计算出的距离作为结果中的列选择，或手动控制排序。有关完整详情，请查阅[查询构建器文档](/docs/{{version}}/queries#vector-similarity-clauses)和 [AI SDK 文档](/docs/{{version}}/ai-sdk#querying-embeddings)。

<a name="reranking-results"></a>
## 重排序结果

重排序是一种技术，AI 模型根据每个结果与给定查询的语义相关程度对一组结果进行重新排序。与向量搜索不同（需要预先计算和存储嵌入），重排序适用于任何文本集合——它接受原始内容和查询作为输入，并返回按相关性排序的项目。

重排序作为快速初始检索步骤之后的第二阶段尤其强大。例如，你可以使用全文搜索快速将数千条记录缩小到前 50 个候选，然后使用重排序将最相关的结果放在顶部。这种"检索后重排序"模式既能提供速度，又能提供语义准确性。

你可以使用 `Reranking` 类对一个字符串数组进行重排序：

```php
use Laravel\Ai\Reranking;

$response = Reranking::of([
    'Django 是一个 Python Web 框架。',
    'Laravel 是一个 PHP Web 应用框架。',
    'React 是一个用于构建用户界面的 JavaScript 库。',
])->rerank('PHP 框架');

$response->first()->document; // "Laravel 是一个 PHP Web 应用框架。"
```

Laravel 集合也有一个 `rerank` 宏，它接受一个字段名（或闭包）和一个查询，使得重排序 Eloquent 结果变得容易：

```php
$articles = Article::all()
    ->rerank('body', 'Laravel 教程');
```

有关配置重排序提供者和可用选项的完整详情，请查阅 [AI SDK 文档](/docs/{{version}}/ai-sdk#reranking)。

<a name="laravel-scout"></a>
## Laravel Scout

上述搜索技术都是你直接在代码中调用的查询构建器方法。[Laravel Scout](/docs/{{version}}/scout) 采用了一种不同的方法：它提供了一个添加到 Eloquent 模型的 `Searchable` trait，Scout 会在记录创建、更新和删除时自动保持搜索索引同步。当你希望模型始终可搜索而无需手动管理索引更新时，这尤其方便。

<a name="database-engine"></a>
### 数据库引擎

Scout 的内置数据库引擎针对你现有的数据库执行全文和 `LIKE` 搜索——无需外部服务或额外基础设施。只需向模型添加 `Searchable` trait，并定义一个返回要搜索的列的 `toSearchableArray` 方法。

你可以使用 PHP 属性来控制每个列的搜索策略。`SearchUsingFullText` 将使用数据库的全文索引，`SearchUsingPrefix` 将仅从字符串开头匹配（`example%`），而没有属性的列将使用默认的 `LIKE` 策略（两侧带通配符 `%example%`）：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Attributes\SearchUsingFullText;
use Laravel\Scout\Attributes\SearchUsingPrefix;
use Laravel\Scout\Searchable;

class Article extends Model
{
    use Searchable;

    #[SearchUsingPrefix(['id'])]
    #[SearchUsingFullText(['title', 'body'])]
    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'body' => $this->body,
        ];
    }
}
```

> [!WARNING]
> 在指定列应使用全文查询约束之前，确保该列已分配了[全文索引](/docs/{{version}}/migrations#available-index-types)。

添加 trait 后，你可以使用 Scout 的 `search` 方法搜索模型。Scout 的数据库引擎会自动按相关性对结果排序，即使在 PostgreSQL 上也是如此：

```php
$articles = Article::search('Laravel')->get();
```

当你的搜索需求适中，并且你希望在不部署外部服务的情况下享受 Scout 自动索引同步的便利性时，数据库引擎是一个很好的选择。它能很好地处理最常见的搜索用例，包括过滤、分页和软删除记录的处理。有关完整详情，请查阅 [Scout 文档](/docs/{{version}}/scout#database-engine)。

<a name="third-party-engines"></a>
### 第三方引擎

Scout 还支持诸如 [Algolia](https://www.algolia.com/)、[Meilisearch](https://www.meilisearch.com) 和 [Typesense](https://typesense.org) 等第三方搜索引擎。这些专用搜索服务提供了高级功能，如容错、分面过滤、地理搜索和自定义排名规则——这些功能在非常大规模或需要高度精炼的即搜即得体验时变得重要。

由于 Scout 在其所有驱动中提供了统一的 API，稍后从数据库引擎切换到第三方引擎只需最少的代码更改。你可以从数据库引擎开始，只有当应用程序的需求超出数据库所能提供的范围时才迁移到第三方服务。

有关配置第三方引擎的完整详情，请查阅 [Scout 文档](/docs/{{version}}/scout)。

> [!NOTE]
> 许多应用程序永远不需要外部搜索引擎。本页描述的内置技术涵盖了绝大多数用例。

<a name="combining-techniques"></a>
## 组合技术

本页描述的搜索技术并不是互斥的——将它们结合起来通常能产生最佳结果。以下是两个常见模式，展示了这些工具如何协同工作。

**全文检索 + 重排序**

使用全文搜索快速将大型数据集缩小到候选集，然后应用重排序按语义相关性对这些候选进行排序。这为你提供了数据库原生全文搜索的速度和 AI 驱动的相关性评分的准确性：

```php
$articles = Article::query()
    ->whereFullText('body', $request->input('query'))
    ->limit(50)
    ->get()
    ->rerank('body', $request->input('query'), limit: 10);
```

**向量搜索 + 传统过滤**

将向量相似度与标准 `where` 子句结合，将语义搜索限定到记录子集。当你想要基于含义的搜索但需要按所有权、类别或任何其他属性限制结果时，这非常有用：

```php
$documents = Document::query()
    ->where('team_id', $user->team_id)
    ->whereVectorSimilarTo('embedding', $request->input('query'))
    ->limit(10)
    ->get();
```

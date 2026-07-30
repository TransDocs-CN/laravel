# Eloquent：关联关系

- [简介](#introduction)
- [定义关联关系](#defining-relationships)
    - [一对一 / Has One](#one-to-one)
    - [一对多 / Has Many](#one-to-many)
    - [一对多（反向）/ Belongs To](#one-to-many-inverse)
    - [Has One of Many](#has-one-of-many)
    - [远层一对一](#has-one-through)
    - [远层一对多](#has-many-through)
- [作用域关联关系](#scoped-relationships)
- [多对多关联关系](#many-to-many)
    - [检索中间表列](#retrieving-intermediate-table-columns)
    - [通过中间表列过滤查询](#filtering-queries-via-intermediate-table-columns)
    - [通过中间表列排序查询](#ordering-queries-via-intermediate-table-columns)
    - [定义自定义中间表模型](#defining-custom-intermediate-table-models)
- [多态关联关系](#polymorphic-relationships)
    - [一对一](#one-to-one-polymorphic-relations)
    - [一对多](#one-to-many-polymorphic-relations)
    - [One of Many](#one-of-many-polymorphic-relations)
    - [多对多](#many-to-many-polymorphic-relations)
    - [自定义多态类型](#custom-polymorphic-types)
- [动态关联关系](#dynamic-relationships)
- [查询关联关系](#querying-relations)
    - [关联关系方法 vs. 动态属性](#relationship-methods-vs-dynamic-properties)
    - [查询关联关系存在性](#querying-relationship-existence)
    - [查询关联关系不存在](#querying-relationship-absence)
    - [查询 Morph To 关联关系](#querying-morph-to-relationships)
- [聚合相关模型](#aggregating-related-models)
    - [统计相关模型](#counting-related-models)
    - [其他聚合函数](#other-aggregate-functions)
    - [统计 Morph To 关联关系上的相关模型](#counting-related-models-on-morph-to-relationships)
- [渴求式加载](#eager-loading)
    - [约束渴求式加载](#constraining-eager-loads)
    - [惰性渴求式加载](#lazy-eager-loading)
    - [自动渴求式加载](#automatic-eager-loading)
    - [防止惰性加载](#preventing-lazy-loading)
- [插入和更新相关模型](#inserting-and-updating-related-models)
    - [`save` 方法](#the-save-method)
    - [`create` 方法](#the-create-method)
    - [Belongs To 关联关系](#updating-belongs-to-relationships)
    - [多对多关联关系](#updating-many-to-many-relationships)
- [更新父模型时间戳](#touching-parent-timestamps)

<a name="introduction"></a>
## 简介

数据库表之间经常相互关联。例如，一篇博客文章可能有多条评论，或者一个订单可能与下订单的用户相关联。Eloquent 使得管理和使用这些关联变得简单，并支持多种常见的关联类型：

<div class="content-list" markdown="1">

- [一对一](#one-to-one)
- [一对多](#one-to-many)
- [多对多](#many-to-many)
- [远层一对一](#has-one-through)
- [远层一对多](#has-many-through)
- [一对一（多态）](#one-to-one-polymorphic-relations)
- [一对多（多态）](#one-to-many-polymorphic-relations)
- [多对多（多态）](#many-to-many-polymorphic-relations)

</div>

<a name="defining-relationships"></a>
## 定义关联关系

Eloquent 关联关系被定义为 Eloquent 模型类上的方法。由于关联关系也充当强大的[查询构建器](/docs/{{version}}/queries)，将关联关系定义为方法提供了强大的方法链和查询能力。例如，我们可以在 `posts` 关系上链式添加其他查询约束：

```php
$user->posts()->where('active', 1)->get();
```

但是，在深入了解如何使用关联关系之前，让我们先了解如何定义 Eloquent 支持的每种关联类型。

<a name="one-to-one"></a>
### 一对一 / Has One

一对一关系是一种非常基本的数据库关系类型。例如，`User` 模型可能与一个 `Phone` 模型关联。要定义此关系，我们将在 `User` 模型上放置一个 `phone` 方法。`phone` 方法应调用 `hasOne` 方法并返回其结果。`hasOne` 方法通过模型的 `Illuminate\Database\Eloquent\Model` 基类可用于你的模型：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class User extends Model
{
    /**
     * 获取与用户关联的电话。
     */
    public function phone(): HasOne
    {
        return $this->hasOne(Phone::class);
    }
}
```

传递给 `hasOne` 方法的第一个参数是相关模型类的名称。定义关联后，我们可以使用 Eloquent 的动态属性检索相关记录。动态属性允许你像访问模型上定义的属性一样访问关系方法：

```php
$phone = User::find(1)->phone;
```

Eloquent 根据父模型名称确定关系的外键。在这种情况下，`Phone` 模型自动被假定有一个 `user_id` 外键。如果你希望覆盖此约定，可以向 `hasOne` 方法传递第二个参数：

```php
return $this->hasOne(Phone::class, 'foreign_key');
```

此外，Eloquent 假定外键的值应与父模型的主键列匹配。换句话说，Eloquent 将在 `Phone` 记录的 `user_id` 列中查找用户的 `id` 列的值。如果你希望关联使用除 `id` 或模型主键之外的主键值，可以向 `hasOne` 方法传递第三个参数：

```php
return $this->hasOne(Phone::class, 'foreign_key', 'local_key');
```

<a name="one-to-one-defining-the-inverse-of-the-relationship"></a>
#### 定义关联关系的反向

因此，我们可以从 `User` 模型访问 `Phone` 模型。接下来，让我们在 `Phone` 模型上定义一个关联，以允许我们访问拥有该电话的用户。我们可以使用 `belongsTo` 方法定义 `hasOne` 关系的反向：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Phone extends Model
{
    /**
     * 获取拥有此电话的用户。
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```

当调用 `user` 方法时，Eloquent 将尝试找到一个 `id` 与 `Phone` 模型上的 `user_id` 列匹配的 `User` 模型。

Eloquent 通过检查关系方法的名称并在方法名后附加 `_id` 来确定外键名称。因此，在这种情况下，Eloquent 假定 `Phone` 模型有一个 `user_id` 列。但是，如果 `Phone` 模型上的外键不是 `user_id`，你可以向 `belongsTo` 方法传递自定义键名作为第二个参数：

```php
/**
 * 获取拥有此电话的用户。
 */
public function user(): BelongsTo
{
    return $this->belongsTo(User::class, 'foreign_key');
}
```

如果父模型不使用 `id` 作为其主键，或者你希望使用其他列查找关联模型，你可以向 `belongsTo` 方法传递第三个参数，指定父表自定义键：

```php
/**
 * 获取拥有此电话的用户。
 */
public function user(): BelongsTo
{
    return $this->belongsTo(User::class, 'foreign_key', 'owner_key');
}
```

<a name="one-to-many"></a>
### 一对多 / Has Many

一对多关系用于定义单个模型是一个或多个子模型的父模型的关系。例如，一篇博客文章可能有无限数量的评论。与所有其他 Eloquent 关系一样，一对多关系通过在 Eloquent 模型上定义方法来定义：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Post extends Model
{
    /**
     * 获取博客文章的评论。
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }
}
```

记住，Eloquent 会自动确定 `Comment` 模型的正确外键列。按照约定，Eloquent 将采用父模型的"蛇形命名"名称并附加 `_id`。因此，在此示例中，Eloquent 将假定 `Comment` 模型上的外键列为 `post_id`。

定义关系方法后，我们可以通过访问 `comments` 属性来获取相关评论的[集合](/docs/{{version}}/eloquent-collections)。记住，由于 Eloquent 提供"动态关系属性"，我们可以像访问模型上定义的属性一样访问关系方法：

```php
use App\Models\Post;

$comments = Post::find(1)->comments;

foreach ($comments as $comment) {
    // ...
}
```

由于所有关系也充当查询构建器，你可以通过调用 `comments` 方法并继续在查询上链式添加条件来向关系查询添加更多约束：

```php
$comment = Post::find(1)->comments()
    ->where('title', 'foo')
    ->first();
```

与 `hasOne` 方法一样，你也可以通过向 `hasMany` 方法传递额外参数来覆盖外键和本地键：

```php
return $this->hasMany(Comment::class, 'foreign_key');

return $this->hasMany(Comment::class, 'foreign_key', 'local_key');
```

<a name="automatically-hydrating-parent-models-on-children"></a>
#### 在子模型上自动填充父模型

即使使用 Eloquent 渴求式加载，如果在遍历子模型时尝试从子模型访问父模型，也可能会出现"N + 1"查询问题：

```php
$posts = Post::with('comments')->get();

foreach ($posts as $post) {
    foreach ($post->comments as $comment) {
        echo $comment->post->title;
    }
}
```

在上面示例中，引入了"N + 1"查询问题，因为即使为每个 `Post` 模型渴求式加载了评论，Eloquent 也不会自动在每个子 `Comment` 模型上填充父 `Post` 模型。

如果你希望 Eloquent 自动将父模型填充到其子模型上，可以在定义 `hasMany` 关系时调用 `chaperone` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Post extends Model
{
    /**
     * 获取博客文章的评论。
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class)->chaperone();
    }
}
```

或者，如果你希望在运行时选择启用自动父模型填充，可以在渴求式加载关系时调用 `chaperone` 模型：

```php
use App\Models\Post;

$posts = Post::with([
    'comments' => fn ($comments) => $comments->chaperone(),
])->get();
```

<a name="one-to-many-inverse"></a>
### 一对多（反向）/ Belongs To

现在我们可以访问一篇文章的所有评论，让我们定义一个关联以允许评论访问其父文章。要定义 `hasMany` 关系的反向，请在子模型上定义调用 `belongsTo` 方法的关系方法：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Comment extends Model
{
    /**
     * 获取拥有此评论的文章。
     */
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
}
```

定义关系后，我们可以通过访问 `post`"动态关系属性"来获取评论的父文章：

```php
use App\Models\Comment;

$comment = Comment::find(1);

return $comment->post->title;
```

在上面的示例中，Eloquent 将尝试找到一个 `id` 与 `Comment` 模型上的 `post_id` 列匹配的 `Post` 模型。

Eloquent 通过检查关系方法的名称并在方法名后附加 `_` 和父模型的主键列名来确定默认外键名称。因此，在此示例中，Eloquent 将假定 `comments` 表上的 `Post` 模型外键是 `post_id`。

但是，如果你的关系的外键不符合这些约定，你可以向 `belongsTo` 方法传递自定义外键名称作为第二个参数：

```php
/**
 * 获取拥有此评论的文章。
 */
public function post(): BelongsTo
{
    return $this->belongsTo(Post::class, 'foreign_key');
}
```

如果你的父模型不使用 `id` 作为其主键，或者你希望使用其他列查找关联模型，你可以向 `belongsTo` 方法传递第三个参数，指定父表自定义键：

```php
/**
 * 获取拥有此评论的文章。
 */
public function post(): BelongsTo
{
    return $this->belongsTo(Post::class, 'foreign_key', 'owner_key');
}
```

<a name="default-models"></a>
#### 默认模型

`belongsTo`、`hasOne`、`hasOneThrough` 和 `morphOne` 关系允许你定义一个默认模型，当给定关系为 `null` 时将返回该模型。这种模式通常称为[空对象模式](https://en.wikipedia.org/wiki/Null_Object_pattern)，可以帮助减少代码中的条件检查。在以下示例中，如果没有用户附加到 `Post` 模型，`user` 关系将返回一个空的 `App\Models\User` 模型：

```php
/**
 * 获取文章的作者。
 */
public function user(): BelongsTo
{
    return $this->belongsTo(User::class)->withDefault();
}
```

要使用属性填充默认模型，你可以向 `withDefault` 方法传递一个数组或闭包：

```php
/**
 * 获取文章的作者。
 */
public function user(): BelongsTo
{
    return $this->belongsTo(User::class)->withDefault([
        'name' => 'Guest Author',
    ]);
}

/**
 * 获取文章的作者。
 */
public function user(): BelongsTo
{
    return $this->belongsTo(User::class)->withDefault(function (User $user, Post $post) {
        $user->name = 'Guest Author';
    });
}
```

<a name="querying-belongs-to-relationships"></a>
#### 查询 Belongs To 关联关系

查询"belongs to"关系的子模型时，你可以手动构建 `where` 子句来检索相应的 Eloquent 模型：

```php
use App\Models\Post;

$posts = Post::where('user_id', $user->id)->get();
```

但是，你可能会发现使用 `whereBelongsTo` 方法更方便，它会自动确定给定模型的正确关系和外键：

```php
$posts = Post::whereBelongsTo($user)->get();
```

你还可以向 `whereBelongsTo` 方法提供一个[集合](/docs/{{version}}/eloquent-collections)实例。这样做时，Laravel 将检索属于集合中任何父模型的模型：

```php
$users = User::where('vip', true)->get();

$posts = Post::whereBelongsTo($users)->get();
```

默认情况下，Laravel 将根据模型的类名确定与给定模型关联的关系名称；但是，你可以通过将其作为第二个参数提供给 `whereBelongsTo` 方法手动指定关系名称：

```php
$posts = Post::whereBelongsTo($user, 'author')->get();
```

<a name="has-one-of-many"></a>
### Has One of Many

有时一个模型可能有许多相关模型，但你希望轻松检索关系中的"最新"或"最旧"相关模型。例如，`User` 模型可能与许多 `Order` 模型相关，但你希望定义一种方便的方式与用户最近下的订单进行交互。你可以使用 `hasOne` 关系类型结合 `ofMany` 方法来实现：

```php
/**
 * 获取用户最近的订单。
 */
public function latestOrder(): HasOne
{
    return $this->hasOne(Order::class)->latestOfMany();
}
```

同样，你可以定义检索关系中"最旧"或第一个相关模型的方法：

```php
/**
 * 获取用户最早的订单。
 */
public function oldestOrder(): HasOne
{
    return $this->hasOne(Order::class)->oldestOfMany();
}
```

默认情况下，`latestOfMany` 和 `oldestOfMany` 方法将根据模型的主键（必须可排序）检索最新或最旧的相关模型。但是，有时你可能希望使用不同的排序标准从较大关系中检索单个模型。

例如，使用 `ofMany` 方法，你可以检索用户最贵的订单。`ofMany` 方法接受可排序列作为其第一个参数，以及在查询相关模型时要应用的聚合函数（`min` 或 `max`）：

```php
/**
 * 获取用户最大的订单。
 */
public function largestOrder(): HasOne
{
    return $this->hasOne(Order::class)->ofMany('price', 'max');
}
```

> [!WARNING]
> 由于 PostgreSQL 不支持对 UUID 列执行 `MAX` 函数，当前无法将"has one of many"关系与 PostgreSQL UUID 列结合使用。

<a name="converting-many-relationships-to-has-one-relationships"></a>
#### 将"Many"关系转换为 Has One 关系

通常，当使用 `latestOfMany`、`oldestOfMany` 或 `ofMany` 方法检索单个模型时，你已为同一模型定义了"has many"关系。为方便起见，Laravel 允许你通过在关系上调用 `one` 方法轻松将此关系转换为"has one"关系：

```php
/**
 * 获取用户的订单。
 */
public function orders(): HasMany
{
    return $this->hasMany(Order::class);
}

/**
 * 获取用户最大的订单。
 */
public function largestOrder(): HasOne
{
    return $this->orders()->one()->ofMany('price', 'max');
}
```

你也可以使用 `one` 方法将 `HasManyThrough` 关系转换为 `HasOneThrough` 关系：

```php
public function latestDeployment(): HasOneThrough
{
    return $this->deployments()->one()->latestOfMany();
}
```

<a name="advanced-has-one-of-many-relationships"></a>
#### 高级 Has One of Many 关系

可以构建更高级的"has one of many"关系。例如，`Product` 模型可能有许多关联的 `Price` 模型，即使在发布新定价后这些模型也会保留在系统中。此外，产品的新定价数据可以提前发布，通过 `published_at` 列在将来某个日期生效。

因此，总结一下，我们需要检索已发布的最新定价，其中发布日期不在将来。此外，如果两个价格具有相同的发布日期，我们将选择 ID 最大的价格。要实现这一点，我们必须向 `ofMany` 方法传递一个包含确定最新价格的可排序列的数组。此外，将提供一个闭包作为 `ofMany` 方法的第二个参数。此闭包将负责向关系查询添加额外的发布日期约束：

```php
/**
 * 获取产品的当前定价。
 */
public function currentPricing(): HasOne
{
    return $this->hasOne(Price::class)->ofMany([
        'published_at' => 'max',
        'id' => 'max',
    ], function (Builder $query) {
        $query->where('published_at', '<', now());
    });
}
```

<a name="has-one-through"></a>
### 远层一对一

"has-one-through"关系定义了与另一个模型的一对一关系。但是，此关系指示声明模型可以通过第三个模型与另一个模型的单个实例匹配。

例如，在汽车修理厂应用程序中，每个 `Mechanic` 模型可能与一个 `Car` 模型关联，而每个 `Car` 模型可能与一个 `Owner` 模型关联。虽然机械师和车主在数据库中没有直接关系，但机械师可以通过 `Car` 模型访问车主。让我们看一下定义此关系所需的表：

```text
mechanics
    id - integer
    name - string

cars
    id - integer
    model - string
    mechanic_id - integer

owners
    id - integer
    name - string
    car_id - integer
```

现在我们已经检查了关系的表结构，让我们在 `Mechanic` 模型上定义关系：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;

class Mechanic extends Model
{
    /**
     * 获取车主的拥有者。
     */
    public function carOwner(): HasOneThrough
    {
        return $this->hasOneThrough(Owner::class, Car::class);
    }
}
```

传递给 `hasOneThrough` 方法的第一个参数是我们希望访问的最终模型的名称，第二个参数是中间模型的名称。

或者，如果相关关系已在关系中涉及的所有模型上定义，你可以通过调用 `through` 方法并提供这些关系的名称来流畅地定义"has-one-through"关系。例如，如果 `Mechanic` 模型有一个 `cars` 关系且 `Car` 模型有一个 `owner` 关系，你可以像这样定义连接机械师和车主的"has-one-through"关系：

```php
// 基于字符串的语法...
return $this->through('cars')->has('owner');

// 动态语法...
return $this->throughCars()->hasOwner();
```

<a name="has-one-through-key-conventions"></a>
#### 键约定

执行关系查询时将使用典型的 Eloquent 外键约定。如果你希望自定义关系的键，可以将它们作为第三个和第四个参数传递给 `hasOneThrough` 方法。第三个参数是中间模型上的外键名称。第四个参数是最终模型上的外键名称。第五个参数是本地键，而第六个参数是中间模型的本地键：

```php
class Mechanic extends Model
{
    /**
     * 获取车主的拥有者。
     */
    public function carOwner(): HasOneThrough
    {
        return $this->hasOneThrough(
            Owner::class,
            Car::class,
            'mechanic_id', // 车辆表上的外键...
            'car_id', // 车主表上的外键...
            'id', // 机械师表上的本地键...
            'id' // 车辆表上的本地键...
        );
    }
}
```

或者，如前所述，如果相关关系已在关系中涉及的所有模型上定义，你可以通过调用 `through` 方法并提供这些关系的名称来流畅地定义"has-one-through"关系。此方法的优点是可以重用现有关系上已定义的键约定：

```php
// 基于字符串的语法...
return $this->through('cars')->has('owner');

// 动态语法...
return $this->throughCars()->hasOwner();
```

<a name="has-many-through"></a>
### 远层一对多

"has-many-through"关系提供了一种通过中间关系访问远层关系的便捷方式。例如，假设我们正在构建一个像 [Laravel Cloud](https://cloud.laravel.com) 这样的部署平台。`Application` 模型可以通过中间 `Environment` 模型访问许多 `Deployment` 模型。使用此示例，你可以轻松收集给定应用程序的所有部署。让我们看一下定义此关系所需的表：

```text
applications
    id - integer
    name - string

environments
    id - integer
    application_id - integer
    name - string

deployments
    id - integer
    environment_id - integer
    commit_hash - string
```

现在我们已经检查了关系的表结构，让我们在 `Application` 模型上定义关系：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Application extends Model
{
    /**
     * 获取应用程序的所有部署。
     */
    public function deployments(): HasManyThrough
    {
        return $this->hasManyThrough(Deployment::class, Environment::class);
    }
}
```

传递给 `hasManyThrough` 方法的第一个参数是我们希望访问的最终模型的名称，第二个参数是中间模型的名称。

或者，如果相关关系已在关系中涉及的所有模型上定义，你可以通过调用 `through` 方法并提供这些关系的名称来流畅地定义"has-many-through"关系。例如，如果 `Application` 模型有一个 `environments` 关系且 `Environment` 模型有一个 `deployments` 关系，你可以像这样定义连接应用程序和部署的"has-many-through"关系：

```php
// 基于字符串的语法...
return $this->through('environments')->has('deployments');

// 动态语法...
return $this->throughEnvironments()->hasDeployments();
```

尽管 `Deployment` 模型的表中不包含 `application_id` 列，但 `hasManyThrough` 关系通过 `$application->deployments` 提供了对应用程序部署的访问。要检索这些模型，Eloquent 会检查中间 `Environment` 模型表上的 `application_id` 列。找到相关环境 ID 后，它们将用于查询 `Deployment` 模型的表。

<a name="has-many-through-key-conventions"></a>
#### 键约定

执行关系查询时将使用典型的 Eloquent 外键约定。如果你希望自定义关系的键，可以将它们作为第三个和第四个参数传递给 `hasManyThrough` 方法。第三个参数是中间模型上的外键名称。第四个参数是最终模型上的外键名称。第五个参数是本地键，而第六个参数是中间模型的本地键：

```php
class Application extends Model
{
    public function deployments(): HasManyThrough
    {
        return $this->hasManyThrough(
            Deployment::class,
            Environment::class,
            'application_id', // 环境表上的外键...
            'environment_id', // 部署表上的外键...
            'id', // 应用程序表上的本地键...
            'id' // 环境表上的本地键...
        );
    }
}
```

或者，如前所述，如果相关关系已在关系中涉及的所有模型上定义，你可以通过调用 `through` 方法并提供这些关系的名称来流畅地定义"has-many-through"关系。此方法的优点是可以重用现有关系上已定义的键约定：

```php
// 基于字符串的语法...
return $this->through('environments')->has('deployments');

// 动态语法...
return $this->throughEnvironments()->hasDeployments();
```

<a name="scoped-relationships"></a>
### 作用域关联关系

向模型添加约束关系的方法是很常见的。例如，你可以向 `User` 模型添加一个 `featuredPosts` 方法，该方法用额外的 `where` 约束来约束更广泛的 `posts` 关系：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Model
{
    /**
     * 获取用户的文章。
     */
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class)->latest();
    }

    /**
     * 获取用户的精选文章。
     */
    public function featuredPosts(): HasMany
    {
        return $this->posts()->where('featured', true);
    }
}
```

但是，如果你尝试通过 `featuredPosts` 方法创建模型，其 `featured` 属性将不会设置为 `true`。如果你希望通过关系方法创建模型，并指定应添加到通过该关系创建的所有模型的属性，可以在构建关系查询时使用 `withAttributes` 方法：

```php
/**
 * 获取用户的精选文章。
 */
public function featuredPosts(): HasMany
{
    return $this->posts()->withAttributes(['featured' => true]);
}
```

`withAttributes` 方法将使用给定的属性向查询添加 `where` 条件，并且还会将给定的属性添加到通过关系方法创建的任何模型中：

```php
$post = $user->featuredPosts()->create(['title' => 'Featured Post']);

$post->featured; // true
```

要指示 `withAttributes` 方法不向查询添加 `where` 条件，可以将 `asConditions` 参数设置为 `false`：

```php
return $this->posts()->withAttributes(['featured' => true], asConditions: false);
```

<a name="many-to-many"></a>
## 多对多关联关系

多对多关系比 `hasOne` 和 `hasMany` 关系稍微复杂一些。多对多关系的一个示例是用户拥有多个角色，而这些角色也由应用程序中的其他用户共享。例如，用户可能被分配"作者"和"编辑"角色；但是，这些角色也可能被分配给其他用户。因此，一个用户拥有多个角色，一个角色拥有多个用户。

<a name="many-to-many-table-structure"></a>
#### 表结构

要定义此关系，需要三个数据库表：`users`、`roles` 和 `role_user`。`role_user` 表是根据相关模型名称的字母顺序派生的，包含 `user_id` 和 `role_id` 列。此表用作连接用户和角色的中间表。

记住，由于一个角色可以属于多个用户，我们不能简单地在 `roles` 表上放置 `user_id` 列。这意味着一个角色只能属于一个用户。为了支持将角色分配给多个用户，需要 `role_user` 表。我们可以总结关系表结构如下：

```text
users
    id - integer
    name - string

roles
    id - integer
    name - string

role_user
    user_id - integer
    role_id - integer
```

<a name="many-to-many-model-structure"></a>
#### 模型结构

多对多关系通过编写一个返回 `belongsToMany` 方法结果的方法来定义。`belongsToMany` 方法由你应用程序中所有 Eloquent 模型使用的 `Illuminate\Database\Eloquent\Model` 基类提供。例如，让我们在 `User` 模型上定义一个 `roles` 方法。传递给此方法的第一个参数是相关模型类的名称：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Model
{
    /**
     * 属于用户的角色。
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);
    }
}
```

定义关系后，你可以使用 `roles` 动态关系属性访问用户的角色：

```php
use App\Models\User;

$user = User::find(1);

foreach ($user->roles as $role) {
    // ...
}
```

由于所有关系也充当查询构建器，你可以通过调用 `roles` 方法并继续在查询上链式添加条件来向关系查询添加更多约束：

```php
$roles = User::find(1)->roles()->orderBy('name')->get();
```

要确定关系中间表的名称，Eloquent 将按字母顺序连接两个相关模型的名称。但是，你可以自由覆盖此约定。可以通过向 `belongsToMany` 方法传递第二个参数来实现：

```php
return $this->belongsToMany(Role::class, 'role_user');
```

除了自定义中间表的名称外，你还可以通过向 `belongsToMany` 方法传递额外参数来自定义表上键的列名。第三个参数是你正在定义关系的模型的外键名称，第四个参数是你连接到的模型的外键名称：

```php
return $this->belongsToMany(Role::class, 'role_user', 'user_id', 'role_id');
```

<a name="many-to-many-defining-the-inverse-of-the-relationship"></a>
#### 定义关联关系的反向

要定义多对多关系的"反向"，你应该在相关模型上定义一个也返回 `belongsToMany` 方法结果的方法。为了完成我们的用户/角色示例，让我们在 `Role` 模型上定义 `users` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    /**
     * 属于角色的用户。
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class);
    }
}
```

如你所见，关系的定义与其 `User` 模型对应项完全相同，只是引用了 `App\Models\User` 模型。由于我们重用了 `belongsToMany` 方法，在定义多对多关系的"反向"时，所有常用的表和键自定义选项都可用。

<a name="retrieving-intermediate-table-columns"></a>
### 检索中间表列

你已经了解到，处理多对多关系需要存在中间表。Eloquent 提供了一些非常有用的方式与此表交互。例如，假设我们的 `User` 模型有许多与之相关的 `Role` 模型。访问此关系后，我们可以使用模型上的 `pivot` 属性访问中间表：

```php
use App\Models\User;

$user = User::find(1);

foreach ($user->roles as $role) {
    echo $role->pivot->created_at;
}
```

请注意，我们检索的每个 `Role` 模型都会自动分配一个 `pivot` 属性。此属性包含一个表示中间表的模型。

默认情况下，只有模型键会出现在 `pivot` 模型上。如果你的中间表包含额外的属性，你必须在定义关系时指定它们：

```php
return $this->belongsToMany(Role::class)->withPivot('active', 'created_by');
```

如果你希望中间表具有由 Eloquent 自动维护的 `created_at` 和 `updated_at` 时间戳，请在定义关系时调用 `withTimestamps` 方法：

```php
return $this->belongsToMany(Role::class)->withTimestamps();
```

> [!WARNING]
> 使用 Eloquent 自动维护时间戳的中间表必须同时具有 `created_at` 和 `updated_at` 时间戳列。

<a name="customizing-the-pivot-attribute-name"></a>
#### 自定义 `pivot` 属性名称

如前所述，中间表的属性可以通过 `pivot` 属性在模型上访问。但是，你可以自由自定义此属性的名称，以更好地反映其在应用程序中的用途。

例如，如果你的应用程序包含可以订阅播客的用户，则用户和播客之间可能有多对多关系。如果是这种情况，你可能希望将中间表属性重命名为 `subscription` 而不是 `pivot`。这可以在定义关系时使用 `as` 方法完成：

```php
return $this->belongsToMany(Podcast::class)
    ->as('subscription')
    ->withTimestamps();
```

指定自定义中间表属性后，你可以使用自定义名称访问中间表数据：

```php
$users = User::with('podcasts')->get();

foreach ($users->flatMap->podcasts as $podcast) {
    echo $podcast->subscription->created_at;
}
```

<a name="filtering-queries-via-intermediate-table-columns"></a>
### 通过中间表列过滤查询

你还可以使用 `wherePivot`、`wherePivotIn`、`wherePivotNotIn`、`wherePivotBetween`、`wherePivotNotBetween`、`wherePivotNull` 和 `wherePivotNotNull` 方法在定义关系时过滤 `belongsToMany` 关系查询返回的结果：

```php
return $this->belongsToMany(Role::class)
    ->wherePivot('approved', 1);

return $this->belongsToMany(Role::class)
    ->wherePivotIn('priority', [1, 2]);

return $this->belongsToMany(Role::class)
    ->wherePivotNotIn('priority', [1, 2]);

return $this->belongsToMany(Podcast::class)
    ->as('subscriptions')
    ->wherePivotBetween('created_at', ['2020-01-01 00:00:00', '2020-12-31 00:00:00']);

return $this->belongsToMany(Podcast::class)
    ->as('subscriptions')
    ->wherePivotNotBetween('created_at', ['2020-01-01 00:00:00', '2020-12-31 00:00:00']);

return $this->belongsToMany(Podcast::class)
    ->as('subscriptions')
    ->wherePivotNull('expired_at');

return $this->belongsToMany(Podcast::class)
    ->as('subscriptions')
    ->wherePivotNotNull('expired_at');
```

`wherePivot` 向查询添加 where 子句约束，但在通过定义的关系创建新模型时不会添加指定的值。如果你需要使用特定的中间值进行查询和创建关系，可以使用 `withPivotValue` 方法：

```php
return $this->belongsToMany(Role::class)
    ->withPivotValue('approved', 1);
```

<a name="ordering-queries-via-intermediate-table-columns"></a>
### 通过中间表列排序查询

你可以使用 `orderByPivot` 和 `orderByPivotDesc` 方法对 `belongsToMany` 关系查询返回的结果进行排序。在以下示例中，我们将检索用户的所有最新徽章：

```php
return $this->belongsToMany(Badge::class)
    ->where('rank', 'gold')
    ->orderByPivotDesc('created_at');
```

<a name="defining-custom-intermediate-table-models"></a>
### 定义自定义中间表模型

如果你希望定义自定义模型来表示多对多关系的中间表，可以在定义关系时调用 `using` 方法。自定义中间模型使你有机会在中间模型上定义额外的行为，例如方法和类型转换。

自定义多对多中间模型应扩展 `Illuminate\Database\Eloquent\Relations\Pivot` 类，而自定义多态多对多中间模型应扩展 `Illuminate\Database\Eloquent\Relations\MorphPivot` 类。例如，我们可以定义一个使用自定义 `RoleUser` 中间模型的 `Role` 模型：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    /**
     * 属于角色的用户。
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->using(RoleUser::class);
    }
}
```

定义 `RoleUser` 模型时，应扩展 `Illuminate\Database\Eloquent\Relations\Pivot` 类：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class RoleUser extends Pivot
{
    // ...
}
```

> [!WARNING]
> 中间模型不能使用 `SoftDeletes` trait。如果你需要软删除中间记录，请考虑将中间模型转换为实际的 Eloquent 模型。

<a name="custom-pivot-models-and-incrementing-ids"></a>
#### 自定义中间模型和自增 ID

如果你定义了使用自定义中间模型的多对多关系，并且该中间模型具有自增主键，则应确保自定义中间模型类使用 `incrementing` 设置为 `true` 的 `Table` 属性：

```php
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Relations\Pivot;

#[Table(incrementing: true)]
class RoleUser extends Pivot
{
    // ...
}
```

<a name="polymorphic-relationships"></a>
## 多态关联关系

多态关系允许子模型使用单个关联属于多种类型的模型。例如，假设你正在构建一个允许用户共享博客文章和视频的应用程序。在这样的应用程序中，`Comment` 模型可能同时属于 `Post` 和 `Video` 模型。

<a name="one-to-one-polymorphic-relations"></a>
### 一对一（多态）

<a name="one-to-one-polymorphic-table-structure"></a>
#### 表结构

一对一多态关系类似于典型的一对一关系；但是，子模型可以使用单个关联属于多种类型的模型。例如，博客 `Post` 和 `User` 可以与 `Image` 模型共享多态关系。使用一对一多态关系，你可以拥有一个包含可与文章和用户关联的唯一图像的单一表。首先，让我们检查表结构：

```text
posts
    id - integer
    name - string

users
    id - integer
    name - string

images
    id - integer
    url - string
    imageable_type - string
    imageable_id - integer
```

注意 `images` 表上的 `imageable_id` 和 `imageable_type` 列。`imageable_id` 列将包含文章或用户的 ID 值，而 `imageable_type` 列将包含父模型的类名。`imageable_type` 列由 Eloquent 用于在访问 `imageable` 关系时确定返回哪种"类型"的父模型。在这种情况下，该列将包含 `App\Models\Post` 或 `App\Models\User`。

<a name="one-to-one-polymorphic-model-structure"></a>
#### 模型结构

接下来，让我们检查构建此关系所需的模型定义：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Image extends Model
{
    /**
     * 获取父级 imageable 模型（用户或文章）。
     */
    public function imageable(): MorphTo
    {
        return $this->morphTo();
    }
}

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class Post extends Model
{
    /**
     * 获取文章的图片。
     */
    public function image(): MorphOne
    {
        return $this->morphOne(Image::class, 'imageable');
    }
}

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class User extends Model
{
    /**
     * 获取用户的图片。
     */
    public function image(): MorphOne
    {
        return $this->morphOne(Image::class, 'imageable');
    }
}
```

<a name="one-to-one-polymorphic-retrieving-the-relationship"></a>
#### 检索关系

定义好数据库表和模型后，你可以通过模型访问关系。例如，要检索文章的图片，我们可以访问 `image` 动态关系属性：

```php
use App\Models\Post;

$post = Post::find(1);

$image = $post->image;
```

你可以通过访问执行 `morphTo` 调用的方法名称来检索多态模型的父模型。在这种情况下，那是 `Image` 模型上的 `imageable` 方法。因此，我们将该方法作为动态关系属性访问：

```php
use App\Models\Image;

$image = Image::find(1);

$imageable = $image->imageable;
```

`Image` 模型上的 `imageable` 关系将返回 `Post` 或 `User` 实例，具体取决于哪种类型的模型拥有该图片。

<a name="morph-one-to-one-key-conventions"></a>
#### 键约定

如有必要，你可以指定多态子模型使用的"id"和"type"列的名称。如果这样做，请确保始终将关系名称作为第一个参数传递给 `morphTo` 方法。通常，此值应与方法名称匹配，因此你可以使用 PHP 的 `__FUNCTION__` 常量：

```php
/**
 * 获取图片所属的模型。
 */
public function imageable(): MorphTo
{
    return $this->morphTo(__FUNCTION__, 'imageable_type', 'imageable_id');
}
```

<a name="one-to-many-polymorphic-relations"></a>
### 一对多（多态）

<a name="one-to-many-polymorphic-table-structure"></a>
#### 表结构

一对多多态关系类似于典型的一对多关系；但是，子模型可以使用单个关联属于多种类型的模型。例如，假设你的应用程序的用户可以在文章和视频上"评论"。使用多态关系，你可以使用单个 `comments` 表来包含文章和视频的评论。首先，让我们检查构建此关系所需的表结构：

```text
posts
    id - integer
    title - string
    body - text

videos
    id - integer
    title - string
    url - string

comments
    id - integer
    body - text
    commentable_type - string
    commentable_id - integer
```

<a name="one-to-many-polymorphic-model-structure"></a>
#### 模型结构

接下来，让我们检查构建此关系所需的模型定义：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Comment extends Model
{
    /**
     * 获取父级 commentable 模型（文章或视频）。
     */
    public function commentable(): MorphTo
    {
        return $this->morphTo();
    }
}

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Post extends Model
{
    /**
     * 获取文章的所有评论。
     */
    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable');
    }
}

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Video extends Model
{
    /**
     * 获取视频的所有评论。
     */
    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable');
    }
}
```

<a name="one-to-many-polymorphic-retrieving-the-relationship"></a>
#### 检索关系

定义好数据库表和模型后，你可以通过模型的动态关系属性访问关系。例如，要访问文章的所有评论，我们可以使用 `comments` 动态属性：

```php
use App\Models\Post;

$post = Post::find(1);

foreach ($post->comments as $comment) {
    // ...
}
```

你还可以通过访问执行 `morphTo` 调用的方法名称来检索多态子模型的父模型。在这种情况下，那是 `Comment` 模型上的 `commentable` 方法。因此，我们将该方法作为动态关系属性访问，以获取评论的父模型：

```php
use App\Models\Comment;

$comment = Comment::find(1);

$commentable = $comment->commentable;
```

`Comment` 模型上的 `commentable` 关系将返回 `Post` 或 `Video` 实例，具体取决于哪种类型的模型是评论的父模型。

<a name="polymorphic-automatically-hydrating-parent-models-on-children"></a>
#### 在子模型上自动填充父模型

即使使用 Eloquent 渴求式加载，如果在遍历子模型时尝试从子模型访问父模型，也可能会出现"N + 1"查询问题：

```php
$posts = Post::with('comments')->get();

foreach ($posts as $post) {
    foreach ($post->comments as $comment) {
        echo $comment->commentable->title;
    }
}
```

在上面示例中，引入了"N + 1"查询问题，因为即使为每个 `Post` 模型渴求式加载了评论，Eloquent 也不会自动在每个子 `Comment` 模型上填充父 `Post` 模型。

如果你希望 Eloquent 自动将父模型填充到其子模型上，可以在定义 `morphMany` 关系时调用 `chaperone` 方法：

```php
class Post extends Model
{
    /**
     * 获取文章的所有评论。
     */
    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable')->chaperone();
    }
}
```

或者，如果你希望在运行时选择启用自动父模型填充，可以在渴求式加载关系时调用 `chaperone` 方法：

```php
use App\Models\Post;

$posts = Post::with([
    'comments' => fn ($comments) => $comments->chaperone(),
])->get();
```

<a name="one-of-many-polymorphic-relations"></a>
### One of Many（多态）

有时一个模型可能有许多相关模型，但你希望轻松检索关系中的"最新"或"最旧"相关模型。例如，`User` 模型可能与许多 `Image` 模型相关，但你希望定义一种方便的方式与用户最近上传的图片进行交互。你可以使用 `morphOne` 关系类型结合 `ofMany` 方法来实现：

```php
/**
 * 获取用户最近的图片。
 */
public function latestImage(): MorphOne
{
    return $this->morphOne(Image::class, 'imageable')->latestOfMany();
}
```

同样，你可以定义检索关系中"最旧"或第一个相关模型的方法：

```php
/**
 * 获取用户最早的图片。
 */
public function oldestImage(): MorphOne
{
    return $this->morphOne(Image::class, 'imageable')->oldestOfMany();
}
```

默认情况下，`latestOfMany` 和 `oldestOfMany` 方法将根据模型的主键（必须可排序）检索最新或最旧的相关模型。但是，有时你可能希望使用不同的排序标准从较大关系中检索单个模型。

例如，使用 `ofMany` 方法，你可以检索用户最"受欢迎"的图片。`ofMany` 方法接受可排序列作为其第一个参数，以及在查询相关模型时要应用的聚合函数（`min` 或 `max`）：

```php
/**
 * 获取用户最受欢迎的图片。
 */
public function bestImage(): MorphOne
{
    return $this->morphOne(Image::class, 'imageable')->ofMany('likes', 'max');
}
```

> [!NOTE]
> 可以构建更高级的"one of many"关系。有关更多信息，请查阅[has one of many 文档](#advanced-has-one-of-many-relationships)。

<a name="many-to-many-polymorphic-relations"></a>
### 多对多（多态）

<a name="many-to-many-polymorphic-table-structure"></a>
#### 表结构

多对多多态关系比"morph one"和"morph many"关系稍微复杂一些。例如，`Post` 模型和 `Video` 模型可以与 `Tag` 模型共享多态关系。在这种情况下使用多对多多态关系，你的应用程序可以拥有一个包含可与文章或视频关联的唯一标签的单一表。首先，让我们检查构建此关系所需的表结构：

```text
posts
    id - integer
    name - string

videos
    id - integer
    name - string

tags
    id - integer
    name - string

taggables
    tag_id - integer
    taggable_type - string
    taggable_id - integer
```

> [!NOTE]
> 在深入了解多对多多态关系之前，你可能需要先阅读典型[多对多关系](#many-to-many)的文档。

<a name="many-to-many-polymorphic-model-structure"></a>
#### 模型结构

接下来，我们准备在模型上定义关系。`Post` 和 `Video` 模型都将包含一个调用 `morphToMany` 方法的 `tags` 方法。

`morphToMany` 方法接受相关模型的名称以及"关系名称"。根据我们分配给中间表名称及其包含的键，我们将关系称为"taggable"：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

class Post extends Model
{
    /**
     * 获取文章的所有标签。
     */
    public function tags(): MorphToMany
    {
        return $this->morphToMany(Tag::class, 'taggable');
    }
}
```

<a name="many-to-many-polymorphic-defining-the-inverse-of-the-relationship"></a>
#### 定义关联关系的反向

接下来，在 `Tag` 模型上，你应该为其每个可能的父模型定义一个方法。因此，在此示例中，我们将定义一个 `posts` 方法和一个 `videos` 方法。这两个方法都应返回 `morphedByMany` 方法的结果。

`morphedByMany` 方法接受相关模型的名称以及"关系名称"。根据我们分配给中间表名称及其包含的键，我们将关系称为"taggable"：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

class Tag extends Model
{
    /**
     * 获取分配了此标签的所有文章。
     */
    public function posts(): MorphToMany
    {
        return $this->morphedByMany(Post::class, 'taggable');
    }

    /**
     * 获取分配了此标签的所有视频。
     */
    public function videos(): MorphToMany
    {
        return $this->morphedByMany(Video::class, 'taggable');
    }
}
```

<a name="many-to-many-polymorphic-retrieving-the-relationship"></a>
#### 检索关系

定义好数据库表和模型后，你可以通过模型访问关系。例如，要访问文章的所有标签，你可以使用 `tags` 动态关系属性：

```php
use App\Models\Post;

$post = Post::find(1);

foreach ($post->tags as $tag) {
    // ...
}
```

你可以通过访问执行 `morphedByMany` 调用的方法名称来检索多态关系的父模型。在这种情况下，那是 `Tag` 模型上的 `posts` 或 `videos` 方法：

```php
use App\Models\Tag;

$tag = Tag::find(1);

foreach ($tag->posts as $post) {
    // ...
}

foreach ($tag->videos as $video) {
    // ...
}
```

<a name="custom-polymorphic-types"></a>
### 自定义多态类型

默认情况下，Laravel 将使用完全限定的类名来存储相关模型的"类型"。例如，给定上面的一对多关系示例，其中 `Comment` 模型可能属于 `Post` 或 `Video` 模型，默认的 `commentable_type` 将分别是 `App\Models\Post` 或 `App\Models\Video`。但是，你可能希望将这些值与应用程序的内部结构解耦。

例如，我们可以使用简单的字符串如 `post` 和 `video`，而不是使用模型名称作为"类型"。通过这样做，即使模型被重命名，数据库中多态"type"列的值仍将保持有效：

```php
use Illuminate\Database\Eloquent\Relations\Relation;

Relation::enforceMorphMap([
    'post' => 'App\Models\Post',
    'video' => 'App\Models\Video',
]);
```

你可以在 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用 `enforceMorphMap` 方法，或者如果你愿意，可以创建一个单独的服务提供者。

你可以在运行时使用模型的 `getMorphClass` 方法确定给定模型的多态别名。相反，你可以使用 `Relation::getMorphedModel` 方法确定与多态别名关联的完全限定类名：

```php
use Illuminate\Database\Eloquent\Relations\Relation;

$alias = $post->getMorphClass();

$class = Relation::getMorphedModel($alias);
```

> [!WARNING]
> 将"morph map"添加到现有应用程序时，数据库中仍包含完全限定类的每个可变形 `*_type` 列值都需要转换为其"映射"名称。

<a name="dynamic-relationships"></a>
### 动态关联关系

你可以使用 `resolveRelationUsing` 方法在运行时在 Eloquent 模型之间定义关系。虽然通常不建议用于正常应用程序开发，但在开发 Laravel 包时这偶尔会很有用。

`resolveRelationUsing` 方法接受所需的关系名称作为其第一个参数。传递给该方法的第二个参数应是一个闭包，该闭包接受模型实例并返回有效的 Eloquent 关系定义。通常，你应该在[服务提供者](/docs/{{version}}/providers)的 boot 方法中配置动态关系：

```php
use App\Models\Order;
use App\Models\Customer;

Order::resolveRelationUsing('customer', function (Order $orderModel) {
    return $orderModel->belongsTo(Customer::class, 'customer_id');
});
```

> [!WARNING]
> 定义动态关系时，始终向 Eloquent 关系方法提供显式的键名参数。

<a name="querying-relations"></a>
## 查询关联关系

由于所有 Eloquent 关系都是通过方法定义的，你可以调用这些方法来获取关系实例，而无需实际执行查询来加载相关模型。此外，所有类型的 Eloquent 关系也充当[查询构建器](/docs/{{version}}/queries)，允许你继续在关系查询上链式添加约束，然后最终针对数据库执行 SQL 查询。

例如，假设一个博客应用程序中 `User` 模型有许多关联的 `Post` 模型：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Model
{
    /**
     * 获取用户的所有文章。
     */
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }
}
```

你可以像这样查询 `posts` 关系并向关系添加额外约束：

```php
use App\Models\User;

$user = User::find(1);

$user->posts()->where('active', 1)->get();
```

你可以在关系上使用任何 Laravel [查询构建器](/docs/{{version}}/queries)的方法，因此请务必探索查询构建器文档以了解所有可用的方法。

<a name="chaining-orwhere-clauses-after-relationships"></a>
#### 在关系后链式添加 `orWhere` 子句

如上面示例所示，你可以在查询关系时自由添加额外约束。但是，在关系上链式添加 `orWhere` 子句时要小心，因为 `orWhere` 子句将在逻辑上与关系约束处于同一级别：

```php
$user->posts()
    ->where('active', 1)
    ->orWhere('votes', '>=', 100)
    ->get();
```

上面的示例将生成以下 SQL。如你所见，`or` 子句指示查询返回_任何_投票数大于 100 的文章。查询不再局限于特定用户：

```sql
select *
from posts
where user_id = ? and active = 1 or votes >= 100
```

在大多数情况下，你应该使用[逻辑分组](/docs/{{version}}/queries#logical-grouping)将条件检查分组在括号之间：

```php
use Illuminate\Database\Eloquent\Builder;

$user->posts()
    ->where(function (Builder $query) {
        return $query->where('active', 1)
            ->orWhere('votes', '>=', 100);
    })
    ->get();
```

上面的示例将生成以下 SQL。注意逻辑分组已正确分组约束，并且查询仍限于特定用户：

```sql
select *
from posts
where user_id = ? and (active = 1 or votes >= 100)
```

<a name="relationship-methods-vs-dynamic-properties"></a>
### 关联关系方法 vs. 动态属性

如果你不需要向 Eloquent 关系查询添加额外约束，可以将关系作为属性访问。例如，继续使用我们的 `User` 和 `Post` 示例模型，我们可以像这样访问用户的所有文章：

```php
use App\Models\User;

$user = User::find(1);

foreach ($user->posts as $post) {
    // ...
}
```

动态关系属性执行"惰性加载"，意味着它们只会在你实际访问时加载关系数据。因此，开发人员通常使用[渴求式加载](#eager-loading)来预加载他们知道在加载模型后将被访问的关系。渴求式加载可以显著减少为加载模型关系而必须执行的 SQL 查询数量。

<a name="querying-relationship-existence"></a>
### 查询关联关系存在性

检索模型记录时，你可能希望根据关系的存在性来限制结果。例如，假设你要检索至少有一条评论的所有博客文章。为此，你可以将关系名称传递给 `has` 和 `orHas` 方法：

```php
use App\Models\Post;

// 检索至少有一条评论的所有文章...
$posts = Post::has('comments')->get();
```

你还可以指定运算符和计数值以进一步自定义查询：

```php
// 检索有三条或更多评论的所有文章...
$posts = Post::has('comments', '>=', 3)->get();
```

嵌套的 `has` 语句可以使用"点"符号构建。例如，你可以检索至少有一条评论且该评论至少有一张图片的所有文章：

```php
// 检索至少有一条评论且评论包含图片的文章...
$posts = Post::has('comments.images')->get();
```

如果你需要更强大的功能，可以使用 `whereHas` 和 `orWhereHas` 方法在 `has` 查询上定义额外的查询约束，例如检查评论的内容：

```php
use Illuminate\Database\Eloquent\Builder;

// 检索至少有一条评论包含 words like code% 的文章...
$posts = Post::whereHas('comments', function (Builder $query) {
    $query->where('content', 'like', 'code%');
})->get();

// 检索至少有十条评论包含 words like code% 的文章...
$posts = Post::whereHas('comments', function (Builder $query) {
    $query->where('content', 'like', 'code%');
}, '>=', 10)->get();
```

> [!WARNING]
> Eloquent 目前不支持跨数据库查询关系存在性。关系必须存在于同一数据库中。

<a name="many-to-many-relationship-existence-queries"></a>
#### 多对多关系存在性查询

`whereAttachedTo` 方法可用于查询具有与模型或模型集合的多对多关联的模型：

```php
$users = User::whereAttachedTo($role)->get();
```

你还可以向 `whereAttachedTo` 方法提供一个[集合](/docs/{{version}}/eloquent-collections)实例。这样做时，Laravel 将检索与集合中任何模型相关联的模型：

```php
$tags = Tag::whereLike('name', '%laravel%')->get();

$posts = Post::whereAttachedTo($tags)->get();
```

<a name="inline-relationship-existence-queries"></a>
#### 内联关系存在性查询

如果你希望使用附加到关系查询的单个简单 where 条件查询关系的存在性，你可能会发现使用 `whereRelation`、`orWhereRelation`、`whereMorphRelation` 和 `orWhereMorphRelation` 方法更方便。例如，我们可以查询所有包含未批准评论的文章：

```php
use App\Models\Post;

$posts = Post::whereRelation('comments', 'is_approved', false)->get();
```

当然，像调用查询构建器的 `where` 方法一样，你也可以指定运算符：

```php
$posts = Post::whereRelation(
    'comments', 'created_at', '>=', now()->minus(hours: 1)
)->get();
```

<a name="querying-relationship-absence"></a>
### 查询关联关系不存在

检索模型记录时，你可能希望根据关系的不存在性来限制结果。例如，假设你要检索**没有**任何评论的所有博客文章。为此，你可以将关系名称传递给 `doesntHave` 和 `orDoesntHave` 方法：

```php
use App\Models\Post;

$posts = Post::doesntHave('comments')->get();
```

如果你需要更强大的功能，可以使用 `whereDoesntHave` 和 `orWhereDoesntHave` 方法向 `doesntHave` 查询添加额外的查询约束，例如检查评论的内容：

```php
use Illuminate\Database\Eloquent\Builder;

$posts = Post::whereDoesntHave('comments', function (Builder $query) {
    $query->where('content', 'like', 'code%');
})->get();
```

你可以使用"点"符号对嵌套关系执行查询。例如，以下查询将检索没有评论的所有文章，以及评论中所有评论都来自未被禁用的用户的文章：

```php
use Illuminate\Database\Eloquent\Builder;

$posts = Post::whereDoesntHave('comments.author', function (Builder $query) {
    $query->where('banned', 1);
})->get();
```

<a name="querying-morph-to-relationships"></a>
### 查询 Morph To 关联关系

要查询"morph to"关系的存在性，你可以使用 `whereHasMorph` 和 `whereDoesntHaveMorph` 方法。这些方法接受关系名称作为其第一个参数。接下来，这些方法接受你希望包含在查询中的相关模型的名称。最后，你可以提供一个闭包来自定义关系查询：

```php
use App\Models\Comment;
use App\Models\Post;
use App\Models\Video;
use Illuminate\Database\Eloquent\Builder;

// 检索与标题包含 code% 的文章或视频相关联的评论...
$comments = Comment::whereHasMorph(
    'commentable',
    [Post::class, Video::class],
    function (Builder $query) {
        $query->where('title', 'like', 'code%');
    }
)->get();

// 检索与标题不包含 code% 的文章相关联的评论...
$comments = Comment::whereDoesntHaveMorph(
    'commentable',
    Post::class,
    function (Builder $query) {
        $query->where('title', 'like', 'code%');
    }
)->get();
```

有时你可能需要根据相关多态模型的"类型"添加查询约束。传递给 `whereHasMorph` 方法的闭包可能会接收一个 `$type` 值作为其第二个参数。此参数允许你检查正在构建的查询的"类型"：

```php
use Illuminate\Database\Eloquent\Builder;

$comments = Comment::whereHasMorph(
    'commentable',
    [Post::class, Video::class],
    function (Builder $query, string $type) {
        $column = $type === Post::class ? 'content' : 'title';

        $query->where($column, 'like', 'code%');
    }
)->get();
```

有时你可能想要查询"morph to"关系父模型的子模型。你可以使用 `whereMorphedTo` 和 `whereNotMorphedTo` 方法来实现，它们会自动确定给定模型的正确多态类型映射。这些方法接受 `morphTo` 关系的名称作为其第一个参数，相关父模型作为其第二个参数：

```php
$comments = Comment::whereMorphedTo('commentable', $post)
    ->orWhereMorphedTo('commentable', $video)
    ->get();
```

<a name="querying-all-morph-to-related-models"></a>
#### 查询所有相关模型

你可以提供 `*` 作为通配符值，而不是传递可能的多态模型数组。这将指示 Laravel 从数据库中检索所有可能的多态类型。Laravel 将执行额外的查询来执行此操作：

```php
use Illuminate\Database\Eloquent\Builder;

$comments = Comment::whereHasMorph('commentable', '*', function (Builder $query) {
    $query->where('title', 'like', 'foo%');
})->get();
```

<a name="aggregating-related-models"></a>
## 聚合相关模型

<a name="counting-related-models"></a>
### 统计相关模型

有时你可能希望计算给定关系的相关模型数量，而无需实际加载模型。为此，你可以使用 `withCount` 方法。`withCount` 方法将在结果模型上放置一个 `{relation}_count` 属性：

```php
use App\Models\Post;

$posts = Post::withCount('comments')->get();

foreach ($posts as $post) {
    echo $post->comments_count;
}
```

通过向 `withCount` 方法传递数组，你可以添加多个关系的"计数"以及向查询添加额外的约束：

```php
use Illuminate\Database\Eloquent\Builder;

$posts = Post::withCount(['votes', 'comments' => function (Builder $query) {
    $query->where('content', 'like', 'code%');
}])->get();

echo $posts[0]->votes_count;
echo $posts[0]->comments_count;
```

你还可以为关系计数结果设置别名，从而允许在同一关系上进行多个计数：

```php
use Illuminate\Database\Eloquent\Builder;

$posts = Post::withCount([
    'comments',
    'comments as pending_comments_count' => function (Builder $query) {
        $query->where('approved', false);
    },
])->get();

echo $posts[0]->comments_count;
echo $posts[0]->pending_comments_count;
```

<a name="deferred-count-loading"></a>
#### 延迟计数加载

使用 `loadCount` 方法，你可以在父模型已被检索后加载关系计数：

```php
$book = Book::first();

$book->loadCount('genres');
```

如果你需要为计数查询设置额外的查询约束，可以传递一个以你希望计数的关系为键的数组。数组值应是接收查询构建器实例的闭包：

```php
$book->loadCount(['reviews' => function (Builder $query) {
    $query->where('rating', 5);
}])
```

<a name="relationship-counting-and-custom-select-statements"></a>
#### 关系计数和自定义 Select 语句

如果你将 `withCount` 与 `select` 语句结合使用，请确保在 `select` 方法之后调用 `withCount`：

```php
$posts = Post::select(['title', 'body'])
    ->withCount('comments')
    ->get();
```

<a name="other-aggregate-functions"></a>
### 其他聚合函数

除了 `withCount` 方法外，Eloquent 还提供 `withMin`、`withMax`、`withAvg`、`withSum` 和 `withExists` 方法。这些方法将在你的结果模型上放置一个 `{relation}_{function}_{column}` 属性：

```php
use App\Models\Post;

$posts = Post::withSum('comments', 'votes')->get();

foreach ($posts as $post) {
    echo $post->comments_sum_votes;
}
```

如果你希望使用其他名称访问聚合函数的结果，可以指定自己的别名：

```php
$posts = Post::withSum('comments as total_comments', 'votes')->get();

foreach ($posts as $post) {
    echo $post->total_comments;
}
```

与 `loadCount` 方法一样，这些方法的延迟版本也可用。这些额外的聚合操作可以在已被检索的 Eloquent 模型上执行：

```php
$post = Post::first();

$post->loadSum('comments', 'votes');
```

如果你将这些聚合方法与 `select` 语句结合使用，请确保在 `select` 方法之后调用聚合方法：

```php
$posts = Post::select(['title', 'body'])
    ->withExists('comments')
    ->get();
```

<a name="counting-related-models-on-morph-to-relationships"></a>
### 统计 Morph To 关联关系上的相关模型

如果你希望渴求式加载一个"morph to"关系，以及该关系可能返回的各种实体的相关模型计数，你可以结合使用 `with` 方法和 `morphTo` 关系的 `morphWithCount` 方法。

在此示例中，假设 `Photo` 和 `Post` 模型可以创建 `ActivityFeed` 模型。我们将假定 `ActivityFeed` 模型定义了一个名为 `parentable` 的"morph to"关系，允许我们检索给定 `ActivityFeed` 实例的父 `Photo` 或 `Post` 模型。另外，假设 `Photo` 模型"拥有多个"`Tag` 模型，`Post` 模型"拥有多个"`Comment` 模型。

现在，假设我们要检索 `ActivityFeed` 实例，并为每个 `ActivityFeed` 实例渴求式加载 `parentable` 父模型。此外，我们希望检索与每个父照片关联的标签数量以及与每个父文章关联的评论数量：

```php
use Illuminate\Database\Eloquent\Relations\MorphTo;

$activities = ActivityFeed::with([
    'parentable' => function (MorphTo $morphTo) {
        $morphTo->morphWithCount([
            Photo::class => ['tags'],
            Post::class => ['comments'],
        ]);
    }])->get();
```

<a name="morph-to-deferred-count-loading"></a>
#### 延迟计数加载

假设我们已经检索了一组 `ActivityFeed` 模型，现在我们希望加载与活动推送相关联的各种 `parentable` 模型的嵌套关系计数。你可以使用 `loadMorphCount` 方法来实现：

```php
$activities = ActivityFeed::with('parentable')->get();

$activities->loadMorphCount('parentable', [
    Photo::class => ['tags'],
    Post::class => ['comments'],
]);
```

<a name="eager-loading"></a>
## 渴求式加载

将 Eloquent 关系作为属性访问时，相关模型是"惰性加载"的。这意味着在首次访问属性之前，关系数据实际上并未加载。但是，Eloquent 可以在查询父模型时"渴求式加载"关系。渴求式加载缓解了"N + 1"查询问题。为说明 N + 1 查询问题，考虑一个"属于"`Author` 模型的 `Book` 模型：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Book extends Model
{
    /**
     * 获取编写该书的作者。
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(Author::class);
    }
}
```

现在，让我们检索所有书籍及其作者：

```php
use App\Models\Book;

$books = Book::all();

foreach ($books as $book) {
    echo $book->author->name;
}
```

此循环将执行一个查询来检索数据库表中的所有书籍，然后为每本书再执行一个查询来检索书的作者。因此，如果我们有 25 本书，上面的代码将运行 26 个查询：一个用于原始书籍，25 个额外查询用于检索每本书的作者。

幸运的是，我们可以使用渴求式加载将此操作减少到仅两个查询。构建查询时，你可以使用 `with` 方法指定应渴求式加载哪些关系：

```php
$books = Book::with('author')->get();

foreach ($books as $book) {
    echo $book->author->name;
}
```

对于此操作，将仅执行两个查询——一个查询检索所有书籍，一个查询检索所有书籍的所有作者：

```sql
select * from books

select * from authors where id in (1, 2, 3, 4, 5, ...)
```

<a name="eager-loading-multiple-relationships"></a>
#### 渴求式加载多个关系

有时你可能需要渴求式加载几个不同的关系。为此，只需向 `with` 方法传递一个关系数组：

```php
$books = Book::with(['author', 'publisher'])->get();
```

<a name="nested-eager-loading"></a>
#### 嵌套渴求式加载

要渴求式加载关系的关系，你可以使用"点"语法。例如，让我们渴求式加载所有书籍的作者以及所有作者的个人联系人：

```php
$books = Book::with('author.contacts')->get();
```

或者，你可以通过向 `with` 方法提供一个嵌套数组来指定嵌套的渴求式加载关系，这在渴求式加载多个嵌套关系时很方便：

```php
$books = Book::with([
    'author' => [
        'contacts',
        'publisher',
    ],
])->get();
```

<a name="nested-eager-loading-morphto-relationships"></a>
#### 嵌套渴求式加载 `morphTo` 关系

如果你希望渴求式加载一个 `morphTo` 关系，以及该关系可能返回的各种实体上的嵌套关系，你可以结合使用 `with` 方法和 `morphTo` 关系的 `morphWith` 方法。为帮助说明此方法，让我们考虑以下模型：

```php
<?php

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ActivityFeed extends Model
{
    /**
     * 获取活动推送记录的父级。
     */
    public function parentable(): MorphTo
    {
        return $this->morphTo();
    }
}
```

在此示例中，假设 `Event`、`Photo` 和 `Post` 模型可以创建 `ActivityFeed` 模型。另外，假设 `Event` 模型属于 `Calendar` 模型，`Photo` 模型与 `Tag` 模型关联，`Post` 模型属于 `Author` 模型。

使用这些模型定义和关系，我们可以检索 `ActivityFeed` 模型实例并渴求式加载所有 `parentable` 模型及其各自的嵌套关系：

```php
use Illuminate\Database\Eloquent\Relations\MorphTo;

$activities = ActivityFeed::query()
    ->with(['parentable' => function (MorphTo $morphTo) {
        $morphTo->morphWith([
            Event::class => ['calendar'],
            Photo::class => ['tags'],
            Post::class => ['author'],
        ]);
    }])->get();
```

<a name="eager-loading-specific-columns"></a>
#### 渴求式加载特定列

你可能并不总是需要所检索关系的每一列。因此，Eloquent 允许你指定希望检索的关系的列：

```php
$books = Book::with('author:id,name,book_id')->get();
```

> [!WARNING]
> 使用此功能时，你应始终在你希望检索的列列表中包含 `id` 列和任何相关的外键列。

<a name="eager-loading-by-default"></a>
#### 默认渴求式加载

有时你可能希望在检索模型时始终加载某些关系。为此，你可以在模型上定义 `$with` 属性：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Book extends Model
{
    /**
     * 应始终加载的关系。
     *
     * @var array
     */
    protected $with = ['author'];

    /**
     * 获取编写该书的作者。
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(Author::class);
    }

    /**
     * 获取书籍的体裁。
     */
    public function genre(): BelongsTo
    {
        return $this->belongsTo(Genre::class);
    }
}
```

如果你希望为单个查询从 `$with` 属性中移除某个项目，可以使用 `without` 方法：

```php
$books = Book::without('author')->get();
```

如果你希望为单个查询覆盖 `$with` 属性中的所有项目，可以使用 `withOnly` 方法：

```php
$books = Book::withOnly('genre')->get();
```

<a name="constraining-eager-loads"></a>
### 约束渴求式加载

有时你可能希望渴求式加载一个关系，但同时也为渴求式加载查询指定额外的查询条件。你可以通过向 `with` 方法传递一个数组来实现，其中数组键是关系名称，数组值是向渴求式加载查询添加额外约束的闭包：

```php
use App\Models\User;

$users = User::with(['posts' => function ($query) {
    $query->where('title', 'like', '%code%');
}])->get();
```

在此示例中，Eloquent 将仅渴求式加载其 `title` 列包含单词 `code` 的文章。你可以调用其他[查询构建器](/docs/{{version}}/queries)方法进一步自定义渴求式加载操作：

```php
$users = User::with(['posts' => function ($query) {
    $query->orderBy('created_at', 'desc');
}])->get();
```

<a name="constraining-eager-loading-of-morph-to-relationships"></a>
#### 约束 `morphTo` 关系的渴求式加载

如果你正在渴求式加载一个 `morphTo` 关系，Eloquent 将运行多个查询来获取每种类型的相关模型。你可以使用 `MorphTo` 关系的 `constrain` 方法向这些查询中的每一个添加额外的约束：

```php
use Illuminate\Database\Eloquent\Relations\MorphTo;

$comments = Comment::with(['commentable' => function (MorphTo $morphTo) {
    $morphTo->constrain([
        Post::class => function ($query) {
            $query->whereNull('hidden_at');
        },
        Video::class => function ($query) {
            $query->where('type', 'educational');
        },
    ]);
}])->get();
```

在此示例中，Eloquent 将仅渴求式加载未被隐藏的文章和 `type` 值为"educational"的视频。

<a name="constraining-eager-loads-with-relationship-existence"></a>
#### 使用关系存在性约束渴求式加载

有时你可能发现自己需要检查关系的存在性，同时基于相同条件加载关系。例如，你可能希望仅检索具有匹配给定查询条件的子 `Post` 模型的 `User` 模型，同时渴求式加载匹配的文章。你可以使用 `withWhereHas` 方法来实现：

```php
use App\Models\User;

$users = User::withWhereHas('posts', function ($query) {
    $query->where('featured', true);
})->get();
```

<a name="lazy-eager-loading"></a>
### 惰性渴求式加载

有时你可能需要在父模型已被检索后渴求式加载关系。例如，如果你需要动态决定是否加载相关模型，这可能很有用：

```php
use App\Models\Book;

$books = Book::all();

if ($condition) {
    $books->load('author', 'publisher');
}
```

如果你需要为渴求式加载查询设置额外的查询约束，可以传递一个以你希望加载的关系为键的数组。数组值应是接收查询实例的闭包实例：

```php
$author->load(['books' => function ($query) {
    $query->orderBy('published_date', 'asc');
}]);
```

要仅当关系尚未加载时才加载它，请使用 `loadMissing` 方法：

```php
$book->loadMissing('author');
```

<a name="nested-lazy-eager-loading-morphto"></a>
#### 嵌套惰性渴求式加载和 `morphTo`

如果你希望渴求式加载一个 `morphTo` 关系，以及该关系可能返回的各种实体上的嵌套关系，你可以使用 `loadMorph` 方法。

此方法接受 `morphTo` 关系的名称作为其第一个参数，以及一个模型/关系对数组作为其第二个参数。为帮助说明此方法，让我们考虑以下模型：

```php
<?php

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ActivityFeed extends Model
{
    /**
     * 获取活动推送记录的父级。
     */
    public function parentable(): MorphTo
    {
        return $this->morphTo();
    }
}
```

在此示例中，假设 `Event`、`Photo` 和 `Post` 模型可以创建 `ActivityFeed` 模型。另外，假设 `Event` 模型属于 `Calendar` 模型，`Photo` 模型与 `Tag` 模型关联，`Post` 模型属于 `Author` 模型。

使用这些模型定义和关系，我们可以检索 `ActivityFeed` 模型实例并渴求式加载所有 `parentable` 模型及其各自的嵌套关系：

```php
$activities = ActivityFeed::with('parentable')
    ->get()
    ->loadMorph('parentable', [
        Event::class => ['calendar'],
        Photo::class => ['tags'],
        Post::class => ['author'],
    ]);
```

<a name="automatic-eager-loading"></a>
### 自动渴求式加载

> [!WARNING]
> 此功能目前处于测试阶段，旨在收集社区反馈。此功能的行为和功能甚至在补丁版本中也可能会改变。

在许多情况下，Laravel 可以自动渴求式加载你访问的关系。要启用自动渴求式加载，你应在应用程序的 `AppServiceProvider` 的 `boot` 方法中调用 `Model::automaticallyEagerLoadRelationships` 方法：

```php
use Illuminate\Database\Eloquent\Model;

/**
 * 启动应用程序服务。
 */
public function boot(): void
{
    Model::automaticallyEagerLoadRelationships();
}
```

启用此功能后，Laravel 将尝试自动加载你访问的任何先前未加载的关系。例如，考虑以下场景：

```php
use App\Models\User;

$users = User::all();

foreach ($users as $user) {
    foreach ($user->posts as $post) {
        foreach ($post->comments as $comment) {
            echo $comment->content;
        }
    }
}
```

通常，上面的代码会为每个用户执行一个查询来检索其文章，以及为每篇文章执行一个查询来检索其评论。但是，当启用了 `automaticallyEagerLoadRelationships` 功能后，当你尝试访问任何已检索用户的文章时，Laravel 将自动为所有用户[惰性渴求式加载](#lazy-eager-loading)文章。同样，当你尝试访问任何已检索文章的评论时，将惰性渴求式加载所有最初检索的文章的所有评论。

如果你不希望全局启用自动渴求式加载，你仍然可以通过在集合上调用 `withRelationshipAutoloading` 方法为单个 Eloquent 集合实例启用此功能：

```php
$users = User::where('vip', true)->get();

return $users->withRelationshipAutoloading();
```

<a name="preventing-lazy-loading"></a>
### 防止惰性加载

如前所述，渴求式加载关系通常可以为你的应用程序带来显著的性能提升。因此，如果你愿意，可以指示 Laravel 始终防止关系的惰性加载。为此，你可以调用基础 Eloquent 模型类提供的 `preventLazyLoading` 方法。通常，你应在应用程序的 `AppServiceProvider` 类的 `boot` 方法中调用此方法。

`preventLazyLoading` 方法接受一个可选的布尔参数，指示是否应防止惰性加载。例如，你可能希望仅在生产环境之外禁用惰性加载，这样即使生产代码中意外存在惰性加载的关系，你的生产环境也能正常运行：

```php
use Illuminate\Database\Eloquent\Model;

/**
 * 启动应用程序服务。
 */
public function boot(): void
{
    Model::preventLazyLoading(! $this->app->isProduction());
}
```

在防止惰性加载后，当你的应用程序尝试惰性加载任何 Eloquent 关系时，Eloquent 将抛出 `Illuminate\Database\LazyLoadingViolationException` 异常。

你可以使用 `handleLazyLoadingViolationsUsing` 方法自定义惰性加载违规的行为。例如，使用此方法，你可以指示仅记录惰性加载违规，而不是用异常中断应用程序的执行：

```php
Model::handleLazyLoadingViolationUsing(function (Model $model, string $relation) {
    $class = $model::class;

    info("Attempted to lazy load [{$relation}] on model [{$class}].");
});
```

<a name="inserting-and-updating-related-models"></a>
## 插入和更新相关模型

<a name="the-save-method"></a>
### `save` 方法

Eloquent 提供了向关系添加新模型的便捷方法。例如，也许你需要向文章添加新评论。你可以使用关系的 `save` 方法插入评论，而不是在 `Comment` 模型上手动设置 `post_id` 属性：

```php
use App\Models\Comment;
use App\Models\Post;

$comment = new Comment(['message' => 'A new comment.']);

$post = Post::find(1);

$post->comments()->save($comment);
```

注意，我们并没有将 `comments` 关系作为动态属性访问。相反，我们调用了 `comments` 方法以获取关系实例。`save` 方法将自动向新 `Comment` 模型添加适当的 `post_id` 值。

如果你需要保存多个相关模型，可以使用 `saveMany` 方法：

```php
$post = Post::find(1);

$post->comments()->saveMany([
    new Comment(['message' => 'A new comment.']),
    new Comment(['message' => 'Another new comment.']),
]);
```

`save` 和 `saveMany` 方法将持久化给定的模型实例，但不会将新持久化的模型添加到已加载到父模型上的任何内存中关系。如果你计划在使用 `save` 或 `saveMany` 方法后访问该关系，你可能希望使用 `refresh` 方法重新加载模型及其关系：

```php
$post->comments()->save($comment);

$post->refresh();

// 所有评论，包括新保存的评论...
$post->comments;
```

<a name="the-push-method"></a>
#### 递归保存模型和关系

如果你希望 `save` 你的模型及其所有关联关系，可以使用 `push` 方法。在此示例中，将保存 `Post` 模型及其评论和评论的作者：

```php
$post = Post::find(1);

$post->comments[0]->message = 'Message';
$post->comments[0]->author->name = 'Author Name';

$post->push();
```

`pushQuietly` 方法可用于保存模型及其关联关系而不触发任何事件：

```php
$post->pushQuietly();
```

<a name="the-create-method"></a>
### `create` 方法

除了 `save` 和 `saveMany` 方法外，你还可以使用 `create` 方法，它接受一个属性数组，创建模型，并将其插入数据库。`save` 和 `create` 之间的区别在于，`save` 接受一个完整的 Eloquent 模型实例，而 `create` 接受一个普通的 PHP `array`。`create` 方法将返回新创建的模型：

```php
use App\Models\Post;

$post = Post::find(1);

$comment = $post->comments()->create([
    'message' => 'A new comment.',
]);
```

你可以使用 `createMany` 方法创建多个相关模型：

```php
$post = Post::find(1);

$post->comments()->createMany([
    ['message' => 'A new comment.'],
    ['message' => 'Another new comment.'],
]);
```

`createQuietly` 和 `createManyQuietly` 方法可用于创建模型而不触发任何事件：

```php
$user = User::find(1);

$user->posts()->createQuietly([
    'title' => 'Post title.',
]);

$user->posts()->createManyQuietly([
    ['title' => 'First post.'],
    ['title' => 'Second post.'],
]);
```

你还可以使用 `findOrNew`、`firstOrNew`、`firstOrCreate` 和 `updateOrCreate` 方法[在关系上创建和更新模型](/docs/{{version}}/eloquent#upserts)。

> [!NOTE]
> 在使用 `create` 方法之前，请务必查看[批量赋值](/docs/{{version}}/eloquent#mass-assignment)文档。

<a name="updating-belongs-to-relationships"></a>
### Belongs To 关联关系

如果你希望将子模型分配给新的父模型，可以使用 `associate` 方法。在此示例中，`User` 模型定义了与 `Account` 模型的 `belongsTo` 关系。此 `associate` 方法将设置子模型上的外键：

```php
use App\Models\Account;

$account = Account::find(10);

$user->account()->associate($account);

$user->save();
```

要从子模型中移除父模型，你可以使用 `dissociate` 方法。此方法将关系的外键设置为 `null`：

```php
$user->account()->dissociate();

$user->save();
```

<a name="updating-many-to-many-relationships"></a>
### 多对多关联关系

<a name="attaching-detaching"></a>
#### 附加 / 分离

Eloquent 还提供了使处理多对多关系更方便的方法。例如，假设一个用户可以拥有多个角色，一个角色可以拥有多个用户。你可以使用 `attach` 方法通过向关系中间表插入记录来将角色附加到用户：

```php
use App\Models\User;

$user = User::find(1);

$user->roles()->attach($roleId);
```

向模型附加关系时，你还可以传递一个要插入到中间表的额外数据数组：

```php
$user->roles()->attach($roleId, ['expires' => $expires]);
```

有时可能需要从用户中移除一个角色。要移除多对多关系记录，请使用 `detach` 方法。`detach` 方法将从中间表中删除相应的记录；但是，两个模型都将保留在数据库中：

```php
// 从用户中分离单个角色...
$user->roles()->detach($roleId);

// 从用户中分离所有角色...
$user->roles()->detach();
```

为方便起见，`attach` 和 `detach` 也接受 ID 数组作为输入：

```php
$user = User::find(1);

$user->roles()->detach([1, 2, 3]);

$user->roles()->attach([
    1 => ['expires' => $expires],
    2 => ['expires' => $expires],
]);
```

<a name="syncing-associations"></a>
#### 同步关联

你也可以使用 `sync` 方法构建多对多关联。`sync` 方法接受一个 ID 数组放在中间表上。不在给定数组中的任何 ID 都将从中间表中移除。因此，此操作完成后，只有给定数组中的 ID 才会存在于中间表中：

```php
$user->roles()->sync([1, 2, 3]);
```

你还可以传递额外的中间表值与 ID 一起：

```php
$user->roles()->sync([1 => ['expires' => true], 2, 3]);
```

如果你希望用每个同步的模型 ID 插入相同的中间表值，可以使用 `syncWithPivotValues` 方法：

```php
$user->roles()->syncWithPivotValues([1, 2, 3], ['active' => true]);
```

如果你不希望分离给定数组中缺失的现有 ID，可以使用 `syncWithoutDetaching` 方法：

```php
$user->roles()->syncWithoutDetaching([1, 2, 3]);
```

<a name="toggling-associations"></a>
#### 切换关联

多对多关系还提供了一个 `toggle` 方法，用于"切换"给定相关模型 ID 的附加状态。如果给定 ID 当前已附加，则将其分离。同样，如果当前已分离，则将其附加：

```php
$user->roles()->toggle([1, 2, 3]);
```

你还可以传递额外的中间表值与 ID 一起：

```php
$user->roles()->toggle([
    1 => ['expires' => true],
    2 => ['expires' => true],
]);
```

<a name="transactional-pivot-operations"></a>
#### 事务性中间表操作

上述每个中间表操作都有一个 `OrFail` 变体（`attachOrFail`、`detachOrFail`、`syncOrFail`、`syncWithoutDetachingOrFail` 和 `toggleOrFail`），它们在数据库事务中包装操作，以便在抛出异常时所有更改自动回滚：

```php
$user->roles()->attachOrFail([1, 2, 3]);

$user->roles()->syncOrFail([1, 2, 3]);
```

<a name="updating-a-record-on-the-intermediate-table"></a>
#### 更新中间表上的记录

如果你需要更新关系中间表中的现有行，可以使用 `updateExistingPivot` 方法。此方法接受中间记录的外键和要更新的属性数组：

```php
$user = User::find(1);

$user->roles()->updateExistingPivot($roleId, [
    'active' => false,
]);
```

<a name="touching-parent-timestamps"></a>
## 更新父模型时间戳

当一个模型定义了与另一个模型的 `belongsTo` 或 `belongsToMany` 关系时，例如属于 `Post` 的 `Comment`，有时在更新子模型时更新父模型的时间戳会很有帮助。

例如，当 `Comment` 模型被更新时，你可能希望自动"更新"所属 `Post` 的 `updated_at` 时间戳，以便将其设置为当前日期和时间。为此，你可以在子模型上使用 `Touches` 属性，其中包含在更新子模型时应更新其 `updated_at` 时间戳的关系名称：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Touches;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Touches(['post'])]
class Comment extends Model
{
    /**
     * 获取评论所属的文章。
     */
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
}
```

> [!WARNING]
> 仅当使用 Eloquent 的 `save` 方法更新子模型时，才会更新父模型的时间戳。

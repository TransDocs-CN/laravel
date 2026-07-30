# Eloquent：API 资源

- [简介](#introduction)
- [生成资源](#generating-resources)
- [概念概览](#concept-overview)
    - [资源集合](#resource-collections)
- [编写资源](#writing-resources)
    - [数据包装](#data-wrapping)
    - [分页](#pagination)
    - [条件属性](#conditional-attributes)
    - [条件关系](#conditional-relationships)
    - [添加元数据](#adding-meta-data)
- [JSON:API 资源](#jsonapi-resources)
    - [生成 JSON:API 资源](#generating-jsonapi-resources)
    - [定义属性](#defining-jsonapi-attributes)
    - [定义关系](#defining-jsonapi-relationships)
    - [资源类型和 ID](#jsonapi-resource-type-and-id)
    - [稀疏字段集和包含](#jsonapi-sparse-fieldsets-and-includes)
    - [链接和元数据](#jsonapi-links-and-meta)
- [资源响应](#resource-responses)

<a name="introduction"></a>
## 简介

在构建 API 时，您可能需要一个转换层，位于您的 Eloquent 模型和实际返回给应用程序用户的 JSON 响应之间。例如，您可能希望为一组用户显示某些属性，而不为其他用户显示，或者您可能希望始终在模型的 JSON 表示中包含某些关系。Eloquent 的资源类允许您富有表现力且轻松地将模型和模型集合转换为 JSON。

当然，您始终可以使用模型的 `toJson` 方法将 Eloquent 模型或集合转换为 JSON；但是，Eloquent 资源提供了更精细和更强大的控制，用于控制模型及其关系的 JSON 序列化。

<a name="generating-resources"></a>
## 生成资源

要生成资源类，您可以使用 `make:resource` Artisan 命令。默认情况下，资源将放置在应用程序的 `app/Http/Resources` 目录中。资源扩展了 `Illuminate\Http\Resources\Json\JsonResource` 类：

```shell
php artisan make:resource UserResource
```

<a name="generating-resource-collections"></a>
#### 资源集合

除了生成转换单个模型的资源外，您还可以生成负责转换模型集合的资源。这允许您的 JSON 响应包含与整个给定资源集合相关的链接和其他元信息。

要创建资源集合，您应在创建资源时使用 `--collection` 标志。或者，在资源名称中包含 `Collection` 一词将向 Laravel 指示应创建集合资源。集合资源扩展了 `Illuminate\Http\Resources\Json\ResourceCollection` 类：

```shell
php artisan make:resource User --collection

php artisan make:resource UserCollection
```

<a name="concept-overview"></a>
## 概念概览

> [!NOTE]
> 这是对资源和资源集合的高级概述。强烈建议您阅读本文档的其他部分，以深入了解资源为您提供的自定义能力和强大功能。

在深入探讨编写资源时可用的所有选项之前，让我们先高层次地了解资源在 Laravel 中的使用方式。资源类表示需要转换为 JSON 结构的单个模型。例如，这里是一个简单的 `UserResource` 资源类：

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * 将资源转换为数组。
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
```

每个资源类定义一个 `toArray` 方法，该方法返回在资源作为路由或控制器方法的响应返回时应转换为 JSON 的属性数组。

请注意，我们可以直接从 `$this` 变量访问模型属性。这是因为资源类会自动将对属性和方法的访问代理到底层模型，以方便访问。定义资源后，可以从路由或控制器返回它。资源通过其构造函数接受底层模型实例：

```php
use App\Http\Resources\UserResource;
use App\Models\User;

Route::get('/user/{id}', function (string $id) {
    return new UserResource(User::findOrFail($id));
});
```

为方便起见，您可以使用模型的 `toResource` 方法，该方法将使用框架约定自动发现模型的基础资源：

```php
return User::findOrFail($id)->toResource();
```

当调用 `toResource` 方法时，Laravel 将尝试在离模型命名空间最近的 `Http\Resources` 命名空间中定位与模型名称匹配并可选择以 `Resource` 后缀结尾的资源。

如果您的资源类不遵循此命名约定或位于不同的命名空间中，您可以使用 `UseResource` 属性为模型指定默认资源：

```php
<?php

namespace App\Models;

use App\Http\Resources\CustomUserResource;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\UseResource;

#[UseResource(CustomUserResource::class)]
class User extends Model
{
    // ...
}
```

或者，您可以通过将资源类传递给 `toResource` 方法来指定资源类：

```php
return User::findOrFail($id)->toResource(CustomUserResource::class);
```

<a name="resource-collections"></a>
### 资源集合

如果您要返回资源集合或分页响应，应在路由或控制器中创建资源实例时使用资源类提供的 `collection` 方法：

```php
use App\Http\Resources\UserResource;
use App\Models\User;

Route::get('/users', function () {
    return UserResource::collection(User::all());
});
```

或者，为方便起见，您可以使用 Eloquent 集合的 `toResourceCollection` 方法，该方法将使用框架约定自动发现模型的基础资源集合：

```php
return User::all()->toResourceCollection();
```

当调用 `toResourceCollection` 方法时，Laravel 将尝试在离模型命名空间最近的 `Http\Resources` 命名空间中定位与模型名称匹配并以 `Collection` 后缀结尾的资源集合。

如果您的资源集合类不遵循此命名约定或位于不同的命名空间中，您可以使用 `UseResourceCollection` 属性为模型指定默认资源集合：

```php
<?php

namespace App\Models;

use App\Http\Resources\CustomUserCollection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\UseResourceCollection;

#[UseResourceCollection(CustomUserCollection::class)]
class User extends Model
{
    // ...
}
```

或者，您可以通过将资源集合类传递给 `toResourceCollection` 方法来指定资源集合类：

```php
return User::all()->toResourceCollection(CustomUserCollection::class);
```

<a name="custom-resource-collections"></a>
#### 自定义资源集合

默认情况下，资源集合不允许添加可能需要在集合中返回的任何自定义元数据。如果您希望自定义资源集合响应，您可以创建一个专用资源来表示集合：

```shell
php artisan make:resource UserCollection
```

生成资源集合类后，您可以轻松定义应包含在响应中的任何元数据：

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class UserCollection extends ResourceCollection
{
    /**
     * 将资源集合转换为数组。
     *
     * @return array<int|string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
            'links' => [
                'self' => 'link-value',
            ],
        ];
    }
}
```

定义资源集合后，可以从路由或控制器返回它：

```php
use App\Http\Resources\UserCollection;
use App\Models\User;

Route::get('/users', function () {
    return new UserCollection(User::all());
});
```

或者，为方便起见，您可以使用 Eloquent 集合的 `toResourceCollection` 方法，该方法将使用框架约定自动发现模型的基础资源集合：

```php
return User::all()->toResourceCollection();
```

当调用 `toResourceCollection` 方法时，Laravel 将尝试在离模型命名空间最近的 `Http\Resources` 命名空间中定位与模型名称匹配并以 `Collection` 后缀结尾的资源集合。

<a name="preserving-collection-keys"></a>
#### 保留集合键

当从路由返回资源集合时，Laravel 会重置集合的键，使其按数字顺序排列。但是，您可以在资源类上使用 `PreserveKeys` 属性来指示是否应保留集合的原始键：

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Attributes\PreserveKeys;
use Illuminate\Http\Resources\Json\JsonResource;

#[PreserveKeys]
class UserResource extends JsonResource
{
    // ...
}
```

当 `preserveKeys` 属性设置为 `true` 时，从路由或控制器返回集合时将保留集合键：

```php
use App\Http\Resources\UserResource;
use App\Models\User;

Route::get('/users', function () {
    return UserResource::collection(User::all()->keyBy->id);
});
```

<a name="customizing-the-underlying-resource-class"></a>
#### 自定义底层资源类

通常，资源集合的 `$this->collection` 属性会自动填充，方法是将集合中每个项目映射到其单个资源类。单个资源类假定为集合的类名（去掉类名末尾的 `Collection` 部分）。此外，根据您的个人偏好，单个资源类可以以 `Resource` 后缀结尾，也可以不以此结尾。

例如，`UserCollection` 将尝试将给定的用户实例映射到 `UserResource` 资源。要自定义此行为，您可以在资源集合上使用 `Collects` 属性：

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Attributes\Collects;
use Illuminate\Http\Resources\Json\ResourceCollection;

#[Collects(Member::class)]
class UserCollection extends ResourceCollection
{
    // ...
}
```

<a name="writing-resources"></a>
## 编写资源

> [!NOTE]
> 如果您尚未阅读[概念概览](#concept-overview)，强烈建议您在继续阅读本文档之前先阅读它。

资源只需要将给定模型转换为数组。因此，每个资源都包含一个 `toArray` 方法，该方法将模型的属性转换为可以从应用程序的路由或控制器返回的 API 友好数组：

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * 将资源转换为数组。
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
```

定义资源后，可以直接从路由或控制器返回它：

```php
use App\Models\User;

Route::get('/user/{id}', function (string $id) {
    return User::findOrFail($id)->toUserResource();
});
```

<a name="relationships"></a>
#### 关系

如果您希望在响应中包含相关资源，可以将它们添加到资源的 `toArray` 方法返回的数组中。在此示例中，我们将使用 `PostResource` 资源的 `collection` 方法将用户的博客文章添加到资源响应中：

```php
use App\Http\Resources\PostResource;
use Illuminate\Http\Request;

/**
 * 将资源转换为数组。
 *
 * @return array<string, mixed>
 */
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
        'posts' => PostResource::collection($this->posts),
        'created_at' => $this->created_at,
        'updated_at' => $this->updated_at,
    ];
}
```

> [!NOTE]
> 如果您只想在关系已加载时才包含它们，请查看关于[条件关系](#conditional-relationships)的文档。

<a name="writing-resource-collections"></a>
#### 资源集合

虽然资源将单个模型转换为数组，但资源集合将模型集合转换为数组。但是，并不绝对需要为每个模型定义资源集合类，因为所有 Eloquent 模型集合都提供一个 `toResourceCollection` 方法来动态生成"临时的"资源集合：

```php
use App\Models\User;

Route::get('/users', function () {
    return User::all()->toResourceCollection();
});
```

但是，如果您需要自定义与集合一起返回的元数据，则有必要定义自己的资源集合：

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class UserCollection extends ResourceCollection
{
    /**
     * 将资源集合转换为数组。
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
            'links' => [
                'self' => 'link-value',
            ],
        ];
    }
}
```

与单个资源一样，资源集合可以直接从路由或控制器返回：

```php
use App\Http\Resources\UserCollection;
use App\Models\User;

Route::get('/users', function () {
    return new UserCollection(User::all());
});
```

或者，为方便起见，您可以使用 Eloquent 集合的 `toResourceCollection` 方法，该方法将使用框架约定自动发现模型的基础资源集合：

```php
return User::all()->toResourceCollection();
```

当调用 `toResourceCollection` 方法时，Laravel 将尝试在离模型命名空间最近的 `Http\Resources` 命名空间中定位与模型名称匹配并以 `Collection` 后缀结尾的资源集合。

<a name="data-wrapping"></a>
### 数据包装

默认情况下，当资源响应转换为 JSON 时，最外层的资源会被包装在 `data` 键中。因此，例如，一个典型的资源集合响应如下所示：

```json
{
    "data": [
        {
            "id": 1,
            "name": "Eladio Schroeder Sr.",
            "email": "therese28@example.com"
        },
        {
            "id": 2,
            "name": "Liliana Mayert",
            "email": "evandervort@example.com"
        }
    ]
}
```

如果您希望禁用最外层资源的包装，应在基础 `Illuminate\Http\Resources\Json\JsonResource` 类上调用 `withoutWrapping` 方法。通常，您应在 `AppServiceProvider` 或应用程序的每个请求都会加载的其他[服务提供者](/docs/{{version}}/providers)中调用此方法：

```php
<?php

namespace App\Providers;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 注册任何应用程序服务。
     */
    public function register(): void
    {
        // ...
    }

    /**
     * 启动任何应用程序服务。
     */
    public function boot(): void
    {
        JsonResource::withoutWrapping();
    }
}
```

> [!WARNING]
> `withoutWrapping` 方法仅影响最外层的响应，不会移除您手动添加到资源集合中的 `data` 键。

<a name="wrapping-nested-resources"></a>
#### 包装嵌套资源

您可以完全自由地决定如何包装资源的关系。如果您希望所有资源集合都被包装在 `data` 键中，无论其嵌套如何，您应为每个资源定义一个资源集合类，并在 `data` 键中返回集合。

您可能想知道这是否会导致最外层资源被包装在两个 `data` 键中。不用担心，Laravel 永远不会让您的资源被意外地双重包装，因此您不必担心正在转换的资源集合的嵌套级别：

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;

class CommentsCollection extends ResourceCollection
{
    /**
     * 将资源集合转换为数组。
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return ['data' => $this->collection];
    }
}
```

<a name="data-wrapping-and-pagination"></a>
#### 数据包装和分页

当通过资源响应返回分页集合时，即使调用了 `withoutWrapping` 方法，Laravel 也会将资源数据包装在 `data` 键中。这是因为分页响应始终包含包含分页器状态信息的 `meta` 和 `links` 键：

```json
{
    "data": [
        {
            "id": 1,
            "name": "Eladio Schroeder Sr.",
            "email": "therese28@example.com"
        },
        {
            "id": 2,
            "name": "Liliana Mayert",
            "email": "evandervort@example.com"
        }
    ],
    "links":{
        "first": "http://example.com/users?page=1",
        "last": "http://example.com/users?page=1",
        "prev": null,
        "next": null
    },
    "meta":{
        "current_page": 1,
        "from": 1,
        "last_page": 1,
        "path": "http://example.com/users",
        "per_page": 15,
        "to": 10,
        "total": 10
    }
}
```

<a name="pagination"></a>
### 分页

您可以将 Laravel 分页器实例传递给资源的 `collection` 方法或自定义资源集合：

```php
use App\Http\Resources\UserCollection;
use App\Models\User;

Route::get('/users', function () {
    return new UserCollection(User::paginate());
});
```

或者，为方便起见，您可以使用分页器的 `toResourceCollection` 方法，该方法将使用框架约定自动发现分页模型的基础资源集合：

```php
return User::paginate()->toResourceCollection();
```

分页响应始终包含包含分页器状态信息的 `meta` 和 `links` 键：

```json
{
    "data": [
        {
            "id": 1,
            "name": "Eladio Schroeder Sr.",
            "email": "therese28@example.com"
        },
        {
            "id": 2,
            "name": "Liliana Mayert",
            "email": "evandervort@example.com"
        }
    ],
    "links":{
        "first": "http://example.com/users?page=1",
        "last": "http://example.com/users?page=1",
        "prev": null,
        "next": null
    },
    "meta":{
        "current_page": 1,
        "from": 1,
        "last_page": 1,
        "path": "http://example.com/users",
        "per_page": 15,
        "to": 10,
        "total": 10
    }
}
```

<a name="customizing-the-pagination-information"></a>
#### 自定义分页信息

如果您希望自定义分页响应的 `links` 或 `meta` 键中包含的信息，可以在资源上定义一个 `paginationInformation` 方法。此方法将接收 `$paginated` 数据和 `$default` 信息数组，该数组是一个包含 `links` 和 `meta` 键的数组：

```php
/**
 * 自定义资源的分页信息。
 *
 * @param  \Illuminate\Http\Request  $request
 * @param  array  $paginated
 * @param  array  $default
 * @return array
 */
public function paginationInformation($request, $paginated, $default)
{
    $default['links']['custom'] = 'https://example.com';

    return $default;
}
```

<a name="conditional-attributes"></a>
### 条件属性

有时您可能希望仅在满足给定条件时才在资源响应中包含属性。例如，您可能希望仅在当前用户是"管理员"时才包含某个值。Laravel 提供了多种辅助方法来帮助您处理这种情况。`when` 方法可用于有条件地向资源响应添加属性：

```php
/**
 * 将资源转换为数组。
 *
 * @return array<string, mixed>
 */
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
        'secret' => $this->when($request->user()->isAdmin(), 'secret-value'),
        'created_at' => $this->created_at,
        'updated_at' => $this->updated_at,
    ];
}
```

在此示例中，仅当经过身份验证的用户的 `isAdmin` 方法返回 `true` 时，`secret` 键才会出现在最终的资源响应中。如果该方法返回 `false`，则在将资源响应发送到客户端之前，`secret` 键将被移除。`when` 方法允许您富有表现力地定义资源，而无需在构建数组时使用条件语句。

`when` 方法也接受闭包作为其第二个参数，允许您仅在给定条件为 `true` 时计算结果值：

```php
'secret' => $this->when($request->user()->isAdmin(), function () {
    return 'secret-value';
}),
```

`whenHas` 方法可用于在属性实际存在于底层模型上时包含该属性：

```php
'name' => $this->whenHas('name'),
```

此外，`whenNotNull` 方法可用于在属性不为 null 时在资源响应中包含该属性：

```php
'name' => $this->whenNotNull($this->name),
```

<a name="merging-conditional-attributes"></a>
#### 合并条件属性

有时您可能有几个属性应仅基于相同条件包含在资源响应中。在这种情况下，您可以使用 `mergeWhen` 方法仅在给定条件为 `true` 时在响应中包含这些属性：

```php
/**
 * 将资源转换为数组。
 *
 * @return array<string, mixed>
 */
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
        $this->mergeWhen($request->user()->isAdmin(), [
            'first-secret' => 'value',
            'second-secret' => 'value',
        ]),
        'created_at' => $this->created_at,
        'updated_at' => $this->updated_at,
    ];
}
```

同样，如果给定条件为 `false`，这些属性将在资源响应发送到客户端之前被移除。

> [!WARNING]
> `mergeWhen` 方法不应用于混合字符串和数字键的数组中。此外，它不应与未按顺序排序的数字键数组一起使用。

<a name="conditional-relationships"></a>
### 条件关系

除了有条件地加载属性外，您还可以根据关系是否已在模型上加载，有条件地在资源响应中包含关系。这允许您的控制器决定应在模型上加载哪些关系，并且您的资源可以仅在它们实际被加载时轻松包含它们。最终，这使得在资源中更容易避免"N+1"查询问题。

`whenLoaded` 方法可用于有条件地加载关系。为了避免不必要地加载关系，此方法接受关系的名称而不是关系本身：

```php
use App\Http\Resources\PostResource;

/**
 * 将资源转换为数组。
 *
 * @return array<string, mixed>
 */
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
        'posts' => PostResource::collection($this->whenLoaded('posts')),
        'created_at' => $this->created_at,
        'updated_at' => $this->updated_at,
    ];
}
```

在此示例中，如果关系尚未加载，`posts` 键将在资源响应发送到客户端之前被移除。

<a name="conditional-relationship-counts"></a>
#### 条件关系计数

除了有条件地包含关系外，您还可以根据关系的计数是否已在模型上加载，有条件地在资源响应中包含关系"计数"：

```php
new UserResource($user->loadCount('posts'));
```

`whenCounted` 方法可用于有条件地在资源响应中包含关系计数。如果关系的计数不存在，此方法避免不必要地包含该属性：

```php
/**
 * 将资源转换为数组。
 *
 * @return array<string, mixed>
 */
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
        'posts_count' => $this->whenCounted('posts'),
        'created_at' => $this->created_at,
        'updated_at' => $this->updated_at,
    ];
}
```

在此示例中，如果 `posts` 关系的计数尚未加载，`posts_count` 键将在资源响应发送到客户端之前被移除。

其他类型的聚合，如 `avg`、`sum`、`min` 和 `max`，也可以使用 `whenAggregated` 方法有条件地加载：

```php
'words_avg' => $this->whenAggregated('posts', 'words', 'avg'),
'words_sum' => $this->whenAggregated('posts', 'words', 'sum'),
'words_min' => $this->whenAggregated('posts', 'words', 'min'),
'words_max' => $this->whenAggregated('posts', 'words', 'max'),
```

<a name="conditional-pivot-information"></a>
#### 条件中间表信息

除了有条件地在资源响应中包含关系信息外，您还可以使用 `whenPivotLoaded` 方法有条件地包含多对多关系的中间表数据。`whenPivotLoaded` 方法接受中间表名称作为其第一个参数。第二个参数应是一个闭包，返回如果中间表信息在模型上可用时要返回的值：

```php
/**
 * 将资源转换为数组。
 *
 * @return array<string, mixed>
 */
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'expires_at' => $this->whenPivotLoaded('role_user', function () {
            return $this->pivot->expires_at;
        }),
    ];
}
```

如果您的关系使用[自定义中间表模型](/docs/{{version}}/eloquent-relationships#defining-custom-intermediate-table-models)，您可以将中间表模型的实例作为第一个参数传递给 `whenPivotLoaded` 方法：

```php
'expires_at' => $this->whenPivotLoaded(new Membership, function () {
    return $this->pivot->expires_at;
}),
```

如果您的中间表使用了除 `pivot` 之外的访问器，您可以使用 `whenPivotLoadedAs` 方法：

```php
/**
 * 将资源转换为数组。
 *
 * @return array<string, mixed>
 */
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'expires_at' => $this->whenPivotLoadedAs('subscription', 'role_user', function () {
            return $this->subscription->expires_at;
        }),
    ];
}
```

<a name="adding-meta-data"></a>
### 添加元数据

某些 JSON API 标准要求在资源和资源集合响应中添加元数据。这通常包括像指向资源或相关资源的 `links`，或关于资源本身的元数据。如果您需要返回有关资源的额外元数据，请将其包含在您的 `toArray` 方法中。例如，在转换资源集合时，您可能包含 `links` 信息：

```php
/**
 * 将资源转换为数组。
 *
 * @return array<string, mixed>
 */
public function toArray(Request $request): array
{
    return [
        'data' => $this->collection,
        'links' => [
            'self' => 'link-value',
        ],
    ];
}
```

从资源返回额外元数据时，您永远不必担心意外覆盖由 Laravel 在返回分页响应时自动添加的 `links` 或 `meta` 键。您定义的任何额外 `links` 都将与分页器提供的链接合并。

<a name="top-level-meta-data"></a>
#### 顶级元数据

有时您可能希望仅在资源是正在返回的最外层资源时，才在资源响应中包含某些元数据。通常，这包括关于整个响应的元信息。要定义此元数据，向您的资源类添加一个 `with` 方法。此方法应返回一个元数据数组，仅当资源是正在转换的最外层资源时才将其包含在资源响应中：

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;

class UserCollection extends ResourceCollection
{
    /**
     * 将资源集合转换为数组。
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return parent::toArray($request);
    }

    /**
     * 获取应随资源数组返回的额外数据。
     *
     * @return array<string, mixed>
     */
    public function with(Request $request): array
    {
        return [
            'meta' => [
                'key' => 'value',
            ],
        ];
    }
}
```

<a name="adding-meta-data-when-constructing-resources"></a>
#### 构建资源时添加元数据

您也可以在路由或控制器中构建资源实例时添加顶级数据。所有资源上可用的 `additional` 方法接受一个应添加到资源响应的数据数组：

```php
return User::all()
    ->load('roles')
    ->toResourceCollection()
    ->additional(['meta' => [
        'key' => 'value',
    ]]);
```

<a name="jsonapi-resources"></a>
## JSON:API 资源

Laravel 附带了 `JsonApiResource`，一个生成符合 [JSON:API 规范](https://jsonapi.org/)响应的资源类。它扩展了标准的 `JsonResource` 类，并自动处理资源对象结构、关系、稀疏字段集、包含、惰性属性评估，并将 `Content-Type` 标头设置为 `application/vnd.api+json`。

> [!NOTE]
> Laravel 的 JSON:API 资源处理响应的序列化。如果您还需要解析传入的 JSON:API 查询参数（如过滤和排序），[Spatie 的 Laravel Query Builder](https://spatie.be/docs/laravel-query-builder) 是一个很好的配套包。

<a name="generating-jsonapi-resources"></a>
### 生成 JSON:API 资源

要生成 JSON:API 资源，请使用带有 `--json-api` 标志的 `make:resource` Artisan 命令：

```shell
php artisan make:resource PostResource --json-api
```

生成的类将扩展 `Illuminate\Http\Resources\JsonApi\JsonApiResource`，并包含供您定义的 `$attributes` 和 `$relationships` 属性：

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\JsonApi\JsonApiResource;

class PostResource extends JsonApiResource
{
    /**
     * 资源的属性。
     */
    public $attributes = [
        // ...
    ];

    /**
     * 资源的关系。
     */
    public $relationships = [
        // ...
    ];
}
```

JSON:API 资源可以像标准资源一样从路由和控制器返回：

```php
use App\Http\Resources\PostResource;
use App\Models\Post;

Route::get('/api/posts/{post}', function (Post $post) {
    return new PostResource($post);
});
```

或者，为方便起见，您可以使用模型的 `toResource` 方法：

```php
Route::get('/api/posts/{post}', function (Post $post) {
    return $post->toResource();
});
```

这将生成一个符合 JSON:API 的响应：

```json
{
    "data": {
        "id": "1",
        "type": "posts",
        "attributes": {
            "title": "Hello World",
            "body": "This is my first post."
        }
    }
}
```

要返回 JSON:API 资源的集合，请使用 `collection` 方法或 `toResourceCollection` 便捷方法：

```php
return PostResource::collection(Post::all());

return Post::all()->toResourceCollection();
```

<a name="defining-jsonapi-attributes"></a>
### 定义属性

有两种方式可以定义在 JSON:API 资源中包含哪些属性。

最简单的方法是在资源上定义一个 `$attributes` 属性。您可以将属性名称列为值，这些值将直接从底层模型读取：

```php
public $attributes = [
    'title',
    'body',
    'created_at',
];
```

如果某个属性计算成本很高，您可以将其作为闭包从 `toAttributes` 返回，以便仅在响应中实际需要该属性时才对其进行计算。

或者，要完全控制资源的属性，您可以覆盖资源上的 `toAttributes` 方法：

```php
/**
 * 获取资源的属性。
 *
 * @return array<string, mixed>
 */
public function toAttributes(Request $request): array
{
    return [
        'title' => $this->title,
        'body' => $this->body,
        'is_published' => fn () => $this->published_at !== null,
        'created_at' => $this->created_at,
        'updated_at' => $this->updated_at,
    ];
}
```

<a name="defining-jsonapi-relationships"></a>
### 定义关系

JSON:API 资源支持定义遵循 JSON:API 规范的关系。仅当客户端通过 `include` 查询参数请求时，关系才被序列化。

#### `$relationships` 属性

您可以通过资源上的 `$relationships` 属性定义资源的可包含关系：

```php
public $relationships = [
    'author',
    'comments',
];
```

当将关系名称列为值时，Laravel 将解析相应的 Eloquent 关系并自动发现适当的资源类。如果您需要显式指定资源类，您可以将关系定义为键/类对：

```php
use App\Http\Resources\UserResource;

public $relationships = [
    'author' => UserResource::class,
    'comments',
];
```

或者，您可以覆盖资源上的 `toRelationships` 方法：

```php
/**
 * 获取资源的关系。
 */
public function toRelationships(Request $request): array
{
    return [
        'author' => UserResource::class,
        'comments' => fn () => CommentResource::collection(
            $request->user()->is($this->resource)
                ? $this->comments
                : $this->comments->where('is_public', true),
        ),
    ];
}
```

使用闭包可以让您更好地控制关系负载，同时仍然仅在客户端请求时才解析关系。

#### 包含关系

客户端可以使用 `include` 查询参数请求相关资源：

```
GET /api/posts/1?include=author,comments
```

这将生成一个在 `relationships` 键中包含资源标识符对象，在顶级 `included` 数组中包含完整资源对象的响应：

```json
{
    "data": {
        "id": "1",
        "type": "posts",
        "attributes": {
            "title": "Hello World"
        },
        "relationships": {
            "author": {
                "data": {
                    "id": "1",
                    "type": "users"
                }
            },
            "comments": {
                "data": [
                    {
                        "id": "1",
                        "type": "comments"
                    }
                ]
            }
        }
    },
    "included": [
        {
            "id": "1",
            "type": "users",
            "attributes": {
                "name": "Taylor Otwell"
            }
        },
        {
            "id": "1",
            "type": "comments",
            "attributes": {
                "body": "Great post!"
            }
        }
    ]
}
```

嵌套关系可以使用点表示法包含：

```
GET /api/posts/1?include=comments.author
```

<a name="jsonapi-relationship-depth"></a>
#### 关系深度

默认情况下，嵌套关系包含被限制为最大深度。您可以使用 `maxRelationshipDepth` 方法自定义此限制，通常在应用程序的服务提供者中：

```php
use Illuminate\Http\Resources\JsonApi\JsonApiResource;

JsonApiResource::maxRelationshipDepth(3);
```

<a name="jsonapi-resource-type-and-id"></a>
### 资源类型和 ID

默认情况下，资源的 `type` 是从资源类名派生而来的。例如，`PostResource` 生成类型 `posts`，`BlogPostResource` 生成 `blog-posts`。资源的 `id` 从模型的主键解析。

如果您需要自定义这些值，可以覆盖资源上的 `toType` 和 `toId` 方法：

```php
/**
 * 获取资源的类型。
 */
public function toType(Request $request): string
{
    return 'articles';
}

/**
 * 获取资源的 ID。
 */
public function toId(Request $request): string
{
    return (string) $this->uuid;
}
```

当资源的类型应与其类名不同时，这特别有用，例如当 `AuthorResource` 包装了 `User` 模型并应输出类型 `authors` 时。

<a name="jsonapi-sparse-fieldsets-and-includes"></a>
### 稀疏字段集和包含

JSON:API 资源支持[稀疏字段集](https://jsonapi.org/format/#fetching-sparse-fieldsets)，允许客户端使用 `fields` 查询参数仅请求每种资源类型的特定属性：

```
GET /api/posts?fields[posts]=title,created_at&fields[users]=name
```

这将仅包含 `posts` 资源的 `title` 和 `created_at` 属性，以及 `users` 资源的 `name` 属性。

<a name="jsonapi-ignoring-query-string"></a>
#### 忽略查询字符串

如果您希望禁用给定资源响应的稀疏字段集过滤，可以调用 `ignoreFieldsAndIncludesInQueryString` 方法：

```php
return $post->toResource()
    ->ignoreFieldsAndIncludesInQueryString();
```

<a name="jsonapi-including-previously-loaded-relationships"></a>
#### 包含先前加载的关系

默认情况下，仅当客户端通过 `include` 查询参数请求时，关系才会包含在响应中。如果您希望包含所有先前渴求式加载的关系，无论查询字符串如何，可以调用 `includePreviouslyLoadedRelationships` 方法：

```php
return $post->load('author', 'comments')
    ->toResource()
    ->includePreviouslyLoadedRelationships();
```

<a name="jsonapi-links-and-meta"></a>
### 链接和元数据

您可以通过覆盖资源上的 `toLinks` 和 `toMeta` 方法，向 JSON:API 资源对象添加链接和元信息：

```php
/**
 * 获取资源的链接。
 */
public function toLinks(Request $request): array
{
    return [
        'self' => route('api.posts.show', $this->resource),
    ];
}

/**
 * 获取资源的元信息。
 */
public function toMeta(Request $request): array
{
    return [
        'readable_created_at' => $this->created_at->diffForHumans(),
    ];
}
```

这将在响应中的资源对象中添加 `links` 和 `meta` 键：

```json
{
    "data": {
        "id": "1",
        "type": "posts",
        "attributes": {
            "title": "Hello World"
        },
        "links": {
            "self": "https://example.com/api/posts/1"
        },
        "meta": {
            "readable_created_at": "2 hours ago"
        }
    }
}
```

<a name="resource-responses"></a>
## 资源响应

如您已经阅读过的，资源可以直接从路由和控制器返回：

```php
use App\Models\User;

Route::get('/user/{id}', function (string $id) {
    return User::findOrFail($id)->toResource();
});
```

但是，有时您可能需要在将传出 HTTP 响应发送到客户端之前对其进行自定义。有两种方法可以实现这一点。首先，您可以将 `response` 方法链式添加到资源上。此方法将返回一个 `Illuminate\Http\JsonResponse` 实例，让您完全控制响应的标头：

```php
use App\Http\Resources\UserResource;
use App\Models\User;

Route::get('/user', function () {
    return User::find(1)
        ->toResource()
        ->response()
        ->header('X-Value', 'True');
});
```

或者，您可以在资源本身内部定义一个 `withResponse` 方法。当资源作为响应中的最外层资源返回时，将调用此方法：

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * 将资源转换为数组。
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
        ];
    }

    /**
     * 自定义资源的传出响应。
     */
    public function withResponse(Request $request, JsonResponse $response): void
    {
        $response->header('X-Value', 'True');
    }
}
```

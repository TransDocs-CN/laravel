# Eloquent：集合

- [简介](#introduction)
- [可用方法](#available-methods)
- [自定义集合](#custom-collections)

<a name="introduction"></a>
## 简介

所有返回多个模型结果的 Eloquent 方法都将返回 `Illuminate\Database\Eloquent\Collection` 类的实例，包括通过 `get` 方法检索的结果或通过关系访问的结果。Eloquent 集合对象扩展了 Laravel 的[基础集合](/docs/{{version}}/collections)，因此它自然继承了数十种用于流畅处理底层 Eloquent 模型数组的方法。请务必查看 Laravel 集合文档，全面了解这些有用的方法！

所有集合也充当迭代器，允许你像对待简单的 PHP 数组一样遍历它们：

```php
use App\Models\User;

$users = User::where('active', 1)->get();

foreach ($users as $user) {
    echo $user->name;
}
```

然而，如前所述，集合比数组强大得多，并公开了各种可以使用直观界面链式调用的 map/reduce 操作。例如，我们可以移除所有非活跃模型，然后收集每个剩余用户的名称：

```php
$names = User::all()->reject(function (User $user) {
    return $user->active === false;
})->map(function (User $user) {
    return $user->name;
});
```

<a name="eloquent-collection-conversion"></a>
#### Eloquent 集合转换

虽然大多数 Eloquent 集合方法返回 Eloquent 集合的新实例，但 `collapse`、`flatten`、`flip`、`keys`、`pluck` 和 `zip` 方法返回一个[基础集合](/docs/{{version}}/collections)实例。同样，如果 `map` 操作返回的集合不包含任何 Eloquent 模型，它将被转换为基础集合实例。

<a name="available-methods"></a>
## 可用方法

所有 Eloquent 集合都扩展了基础 [Laravel 集合](/docs/{{version}}/collections#available-methods)对象；因此，它们继承了基础集合类提供的所有强大方法。

此外，`Illuminate\Database\Eloquent\Collection` 类提供了更多方法来帮助管理模型集合。大多数方法返回 `Illuminate\Database\Eloquent\Collection` 实例；但是，某些方法（如 `modelKeys`）返回 `Illuminate\Support\Collection` 实例。

<style>
    .collection-method-list > p {
        columns: 14.4em 1; -moz-columns: 14.4em 1; -webkit-columns: 14.4em 1;
    }

    .collection-method-list a {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .collection-method code {
        font-size: 14px;
    }

    .collection-method:not(.first-collection-method) {
        margin-top: 50px;
    }
</style>

<div class="collection-method-list" markdown="1">

[append](#method-append)
[contains](#method-contains)
[diff](#method-diff)
[except](#method-except)
[find](#method-find)
[findOrFail](#method-find-or-fail)
[fresh](#method-fresh)
[intersect](#method-intersect)
[load](#method-load)
[loadMissing](#method-loadMissing)
[modelKeys](#method-modelKeys)
[makeVisible](#method-makeVisible)
[makeHidden](#method-makeHidden)
[mergeVisible](#method-mergeVisible)
[mergeHidden](#method-mergeHidden)
[only](#method-only)
[partition](#method-partition)
[setAppends](#method-setAppends)
[setVisible](#method-setVisible)
[setHidden](#method-setHidden)
[toQuery](#method-toquery)
[unique](#method-unique)
[withoutAppends](#method-withoutAppends)

</div>

<a name="method-append"></a>
#### `append($attributes)` {.collection-method .first-collection-method}

`append` 方法可用于指示应为集合中的每个模型[追加](/docs/{{version}}/eloquent-serialization#appending-values-to-json)一个属性。此方法接受属性数组或单个属性：

```php
$users->append('team');

$users->append(['team', 'is_admin']);
```

<a name="method-contains"></a>
#### `contains($key, $operator = null, $value = null)` {.collection-method}

`contains` 方法可用于确定集合中是否包含给定的模型实例。此方法接受主键或模型实例：

```php
$users->contains(1);

$users->contains(User::find(1));
```

<a name="method-diff"></a>
#### `diff($items)` {.collection-method}

`diff` 方法返回给定集合中不存在的所有模型：

```php
use App\Models\User;

$users = $users->diff(User::whereIn('id', [1, 2, 3])->get());
```

<a name="method-except"></a>
#### `except($keys)` {.collection-method}

`except` 方法返回不具有给定主键的所有模型：

```php
$users = $users->except([1, 2, 3]);
```

<a name="method-find"></a>
#### `find($key)` {.collection-method}

`find` 方法返回具有匹配给定键的主键的模型。如果 `$key` 是模型实例，`find` 将尝试返回与主键匹配的模型。如果 `$key` 是键数组，`find` 将返回所有主键在给定数组中的模型：

```php
$users = User::all();

$user = $users->find(1);
```

<a name="method-find-or-fail"></a>
#### `findOrFail($key)` {.collection-method}

`findOrFail` 方法返回具有匹配给定键的主键的模型，如果在集合中找不到匹配的模型，则抛出 `Illuminate\Database\Eloquent\ModelNotFoundException` 异常：

```php
$users = User::all();

$user = $users->findOrFail(1);
```

<a name="method-fresh"></a>
#### `fresh($with = [])` {.collection-method}

`fresh` 方法从数据库中检索集合中每个模型的新实例。此外，将渴求式加载任何指定的关系：

```php
$users = $users->fresh();

$users = $users->fresh('comments');
```

<a name="method-intersect"></a>
#### `intersect($items)` {.collection-method}

`intersect` 方法返回也存在于给定集合中的所有模型：

```php
use App\Models\User;

$users = $users->intersect(User::whereIn('id', [1, 2, 3])->get());
```

<a name="method-load"></a>
#### `load($relations)` {.collection-method}

`load` 方法为集合中的所有模型渴求式加载给定的关系：

```php
$users->load(['comments', 'posts']);

$users->load('comments.author');

$users->load(['comments', 'posts' => fn ($query) => $query->where('active', 1)]);
```

<a name="method-loadMissing"></a>
#### `loadMissing($relations)` {.collection-method}

`loadMissing` 方法为集合中所有尚未加载关系的模型渴求式加载给定的关系：

```php
$users->loadMissing(['comments', 'posts']);

$users->loadMissing('comments.author');

$users->loadMissing(['comments', 'posts' => fn ($query) => $query->where('active', 1)]);
```

<a name="method-modelKeys"></a>
#### `modelKeys()` {.collection-method}

`modelKeys` 方法返回集合中所有模型的主键：

```php
$users->modelKeys();

// [1, 2, 3, 4, 5]
```

<a name="method-makeVisible"></a>
#### `makeVisible($attributes)` {.collection-method}

`makeVisible` 方法[使通常在集合中每个模型上"隐藏"的属性可见](/docs/{{version}}/eloquent-serialization#hiding-attributes-from-json)：

```php
$users = $users->makeVisible(['address', 'phone_number']);
```

<a name="method-makeHidden"></a>
#### `makeHidden($attributes)` {.collection-method}

`makeHidden` 方法[隐藏通常在集合中每个模型上"可见"的属性](/docs/{{version}}/eloquent-serialization#hiding-attributes-from-json)：

```php
$users = $users->makeHidden(['address', 'phone_number']);
```

<a name="method-mergeVisible"></a>
#### `mergeVisible($attributes)` {.collection-method}

`mergeVisible` 方法[使额外的属性可见](/docs/{{version}}/eloquent-serialization#hiding-attributes-from-json)，同时保留现有的可见属性：

```php
$users = $users->mergeVisible(['middle_name']);
```

<a name="method-mergeHidden"></a>
#### `mergeHidden($attributes)` {.collection-method}

`mergeHidden` 方法[隐藏额外的属性](/docs/{{version}}/eloquent-serialization#hiding-attributes-from-json)，同时保留现有的隐藏属性：

```php
$users = $users->mergeHidden(['last_login_at']);
```

<a name="method-only"></a>
#### `only($keys)` {.collection-method}

`only` 方法返回具有给定主键的所有模型：

```php
$users = $users->only([1, 2, 3]);
```

<a name="method-partition"></a>
#### `partition` {.collection-method}

`partition` 方法返回一个包含 `Illuminate\Database\Eloquent\Collection` 集合实例的 `Illuminate\Support\Collection` 实例：

```php
$partition = $users->partition(fn ($user) => $user->age > 18);

dump($partition::class);    // Illuminate\Support\Collection
dump($partition[0]::class); // Illuminate\Database\Eloquent\Collection
dump($partition[1]::class); // Illuminate\Database\Eloquent\Collection
```

<a name="method-setAppends"></a>
#### `setAppends($attributes)` {.collection-method}

`setAppends` 方法临时覆盖集合中每个模型上的所有[追加属性](/docs/{{version}}/eloquent-serialization#appending-values-to-json)：

```php
$users = $users->setAppends(['is_admin']);
```

<a name="method-setVisible"></a>
#### `setVisible($attributes)` {.collection-method}

`setVisible` 方法[临时覆盖](/docs/{{version}}/eloquent-serialization#temporarily-modifying-attribute-visibility)集合中每个模型上的所有可见属性：

```php
$users = $users->setVisible(['id', 'name']);
```

<a name="method-setHidden"></a>
#### `setHidden($attributes)` {.collection-method}

`setHidden` 方法[临时覆盖](/docs/{{version}}/eloquent-serialization#temporarily-modifying-attribute-visibility)集合中每个模型上的所有隐藏属性：

```php
$users = $users->setHidden(['email', 'password', 'remember_token']);
```

<a name="method-toquery"></a>
#### `toQuery()` {.collection-method}

`toQuery` 方法返回一个 Eloquent 查询构建器实例，该实例包含对集合模型主键的 `whereIn` 约束：

```php
use App\Models\User;

$users = User::where('status', 'VIP')->get();

$users->toQuery()->update([
    'status' => 'Administrator',
]);
```

<a name="method-unique"></a>
#### `unique($key = null, $strict = false)` {.collection-method}

`unique` 方法返回集合中所有唯一的模型。任何具有与集合中另一个模型相同主键的模型都将被移除：

```php
$users = $users->unique();
```

<a name="method-withoutAppends"></a>
#### `withoutAppends()` {.collection-method}

`withoutAppends` 方法临时移除集合中每个模型上的所有[追加属性](/docs/{{version}}/eloquent-serialization#appending-values-to-json)：

```php
$users = $users->withoutAppends();
```

<a name="custom-collections"></a>
## 自定义集合

如果你希望在与给定模型交互时使用自定义的 `Collection` 对象，可以向模型添加 `CollectedBy` 属性：

```php
<?php

namespace App\Models;

use App\Support\UserCollection;
use Illuminate\Database\Eloquent\Attributes\CollectedBy;
use Illuminate\Database\Eloquent\Model;

#[CollectedBy(UserCollection::class)]
class User extends Model
{
    // ...
}
```

或者，你可以在模型上定义一个 `newCollection` 方法：

```php
<?php

namespace App\Models;

use App\Support\UserCollection;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 创建一个新的 Eloquent 集合实例。
     *
     * @param  array<int, \Illuminate\Database\Eloquent\Model>  $models
     * @return \Illuminate\Database\Eloquent\Collection<int, \Illuminate\Database\Eloquent\Model>
     */
    public function newCollection(array $models = []): Collection
    {
        $collection = new UserCollection($models);

        if (Model::isAutomaticallyEagerLoadingRelationships()) {
            $collection->withRelationshipAutoloading();
        }

        return $collection;
    }
}
```

一旦你定义了 `newCollection` 方法或向模型添加了 `CollectedBy` 属性，每当 Eloquent 通常返回 `Illuminate\Database\Eloquent\Collection` 实例时，你将收到自定义集合的实例。

如果你希望为应用程序中的每个模型使用自定义集合，应在被应用程序中所有模型扩展的基模型类上定义 `newCollection` 方法。

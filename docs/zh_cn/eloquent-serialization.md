# Eloquent：序列化

- [简介](#introduction)
- [序列化模型和集合](#serializing-models-and-collections)
    - [序列化为数组](#serializing-to-arrays)
    - [序列化为 JSON](#serializing-to-json)
- [从 JSON 中隐藏属性](#hiding-attributes-from-json)
- [向 JSON 追加值](#appending-values-to-json)
- [日期序列化](#date-serialization)

<a name="introduction"></a>
## 简介

当使用 Laravel 构建 API 时，您经常需要将模型和关系转换为数组或 JSON。Eloquent 包含了便捷的方法来进行这些转换，以及控制哪些属性包含在模型的序列化表示中。

> [!NOTE]
> 要获得更强大的 Eloquent 模型和集合 JSON 序列化处理方式，请查看 [Eloquent API 资源](/docs/{{version}}/eloquent-resources)的文档。

<a name="serializing-models-and-collections"></a>
## 序列化模型和集合

<a name="serializing-to-arrays"></a>
### 序列化为数组

要将模型及其已加载的[关系](/docs/{{version}}/eloquent-relationships)转换为数组，应使用 `toArray` 方法。此方法是递归的，因此所有属性和所有关系（包括关系的关系）都将被转换为数组：

```php
use App\Models\User;

$user = User::with('roles')->first();

return $user->toArray();
```

`attributesToArray` 方法可用于将模型的属性转换为数组，但不包括其关系：

```php
$user = User::first();

return $user->attributesToArray();
```

您还可以通过在集合实例上调用 `toArray` 方法将整个模型[集合](/docs/{{version}}/eloquent-collections)转换为数组：

```php
$users = User::all();

return $users->toArray();
```

<a name="serializing-to-json"></a>
### 序列化为 JSON

要将模型转换为 JSON，应使用 `toJson` 方法。与 `toArray` 一样，`toJson` 方法是递归的，因此所有属性和关系都将被转换为 JSON。您还可以指定任何 [PHP 支持的](https://secure.php.net/manual/en/function.json-encode.php) JSON 编码选项：

```php
use App\Models\User;

$user = User::find(1);

return $user->toJson();

return $user->toJson(JSON_PRETTY_PRINT);
```

或者，您可以将模型或集合转换为字符串，这将自动在模型或集合上调用 `toJson` 方法：

```php
return (string) User::find(1);
```

由于模型和集合在转换为字符串时会转换为 JSON，您可以直接从应用程序的路由或控制器返回 Eloquent 对象。当从路由或控制器返回时，Laravel 会自动将 Eloquent 模型和集合序列化为 JSON：

```php
Route::get('/users', function () {
    return User::all();
});
```

<a name="relationships"></a>
#### 关系

当 Eloquent 模型转换为 JSON 时，其已加载的关系将自动作为属性包含在 JSON 对象中。此外，尽管 Eloquent 关系方法是使用"驼峰式"方法名定义的，但关系的 JSON 属性将是"蛇形命名"。

<a name="hiding-attributes-from-json"></a>
## 从 JSON 中隐藏属性

有时您可能希望限制包含在模型数组或 JSON 表示中的属性，例如密码。为此，您可以在模型上使用 `Hidden` 属性。列在 `Hidden` 属性中的属性将不会包含在模型的序列化表示中：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;

#[Hidden(['password'])]
class User extends Model
{
    // ...
}
```

> [!NOTE]
> 要隐藏关系，请将关系的方法名称添加到 Eloquent 模型的 `Hidden` 属性中。

或者，您可以使用 `Visible` 属性定义一个"允许列表"，列出应包含在模型数组和 JSON 表示中的属性。所有不在 `Visible` 属性中的属性在模型转换为数组或 JSON 时将被隐藏：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Visible;
use Illuminate\Database\Eloquent\Model;

#[Visible(['first_name', 'last_name'])]
class User extends Model
{
    // ...
}
```

<a name="temporarily-modifying-attribute-visibility"></a>
#### 临时修改属性可见性

如果您希望使某些通常隐藏的属性在给定的模型实例上可见，可以使用 `makeVisible` 或 `mergeVisible` 方法。`makeVisible` 方法返回模型实例：

```php
return $user->makeVisible('attribute')->toArray();

return $user->mergeVisible(['name', 'email'])->toArray();
```

同样，如果您希望隐藏某些通常可见的属性，可以使用 `makeHidden` 或 `mergeHidden` 方法：

```php
return $user->makeHidden('attribute')->toArray();

return $user->mergeHidden(['name', 'email'])->toArray();
```

如果您希望临时覆盖所有可见或隐藏的属性，可以分别使用 `setVisible` 和 `setHidden` 方法：

```php
return $user->setVisible(['id', 'name'])->toArray();

return $user->setHidden(['email', 'password', 'remember_token'])->toArray();
```

<a name="appending-values-to-json"></a>
## 向 JSON 追加值

有时，在将模型转换为数组或 JSON 时，您可能希望添加在数据库中没有对应列的属性。为此，首先为值定义一个[访问器](/docs/{{version}}/eloquent-mutators)：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 确定用户是否为管理员。
     */
    protected function isAdmin(): Attribute
    {
        return new Attribute(
            get: fn () => 'yes',
        );
    }
}
```

如果您希望访问器始终追加到模型的数组和 JSON 表示中，可以在模型上使用 `Appends` 属性。请注意，属性名称通常使用其"蛇形命名"序列化表示形式引用，即使访问器的 PHP 方法是使用"驼峰式"定义的：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Appends;
use Illuminate\Database\Eloquent\Model;

#[Appends(['is_admin'])]
class User extends Model
{
    // ...
}
```

将属性添加到 `appends` 列表后，它将包含在模型的数组和 JSON 表示中。`appends` 数组中的属性也将遵守模型上配置的 `visible` 和 `hidden` 设置。

<a name="appending-at-run-time"></a>
#### 运行时追加

在运行时，您可以使用 `append` 或 `mergeAppends` 方法指示模型实例追加额外的属性。或者，您可以使用 `setAppends` 方法覆盖给定模型实例的整个追加属性数组：

```php
return $user->append('is_admin')->toArray();

return $user->mergeAppends(['is_admin', 'status'])->toArray();

return $user->setAppends(['is_admin'])->toArray();
```

同样，如果您希望从模型中移除所有追加属性，可以使用 `withoutAppends` 方法：

```php
return $user->withoutAppends()->toArray();
```

<a name="date-serialization"></a>
## 日期序列化

<a name="customizing-the-default-date-format"></a>
#### 自定义默认日期格式

您可以通过覆盖 `serializeDate` 方法来自定义默认序列化格式。此方法不会影响日期在数据库中的存储格式：

```php
/**
 * 准备一个日期以进行数组 / JSON 序列化。
 */
protected function serializeDate(DateTimeInterface $date): string
{
    return $date->format('Y-m-d');
}
```

<a name="customizing-the-date-format-per-attribute"></a>
#### 自定义每个属性的日期格式

您可以通过在模型的[类型转换声明](/docs/{{version}}/eloquent-mutators#attribute-casting)中指定日期格式，来自定义单个 Eloquent 日期属性的序列化格式：

```php
protected function casts(): array
{
    return [
        'birthday' => 'date:Y-m-d',
        'joined_at' => 'datetime:Y-m-d H:00',
    ];
}
```

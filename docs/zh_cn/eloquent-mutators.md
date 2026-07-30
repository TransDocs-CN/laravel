# Eloquent：修改器 & 类型转换

- [简介](#introduction)
- [访问器和修改器](#accessors-and-mutators)
    - [定义访问器](#defining-an-accessor)
    - [定义修改器](#defining-a-mutator)
- [属性类型转换](#attribute-casting)
    - [数组和 JSON 转换](#array-and-json-casting)
    - [二进制转换](#binary-casting)
    - [日期转换](#date-casting)
    - [枚举转换](#enum-casting)
    - [加密转换](#encrypted-casting)
    - [查询时转换](#query-time-casting)
- [自定义类型转换](#custom-casts)
    - [值对象转换](#value-object-casting)
    - [数组 / JSON 序列化](#array-json-serialization)
    - [入站转换](#inbound-casting)
    - [转换参数](#cast-parameters)
    - [比较转换值](#comparing-cast-values)
    - [可转换类](#castables)

<a name="introduction"></a>
## 简介

访问器、修改器和属性类型转换允许你在检索或设置模型实例上的 Eloquent 属性值时对其进行转换。例如，你可能希望使用 [Laravel 加密器](/docs/{{version}}/encryption)在值存储到数据库时对其进行加密，然后在访问 Eloquent 模型上的属性时自动解密。或者，你可能希望将存储在数据库中的 JSON 字符串在通过 Eloquent 模型访问时转换为数组。

<a name="accessors-and-mutators"></a>
## 访问器和修改器

<a name="defining-an-accessor"></a>
### 定义访问器

访问器在访问 Eloquent 属性值时对其进行转换。要定义访问器，请在模型上创建一个受保护的方法来表示可访问的属性。此方法名称应对应于真实底层模型属性/数据库列的"驼峰式"表示（如适用）。

在此示例中，我们将为 `first_name` 属性定义一个访问器。当尝试检索 `first_name` 属性的值时，Eloquent 将自动调用该访问器。所有属性访问器/修改器方法必须声明返回类型提示 `Illuminate\Database\Eloquent\Casts\Attribute`：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 获取用户的名字。
     */
    protected function firstName(): Attribute
    {
        return Attribute::make(
            get: fn (string $value) => ucfirst($value),
        );
    }
}
```

所有访问器方法返回一个 `Attribute` 实例，该实例定义了属性将如何被访问以及可选地被修改。在此示例中，我们只定义了属性将如何被访问。为此，我们向 `Attribute` 类构造函数提供 `get` 参数。

如你所见，列的原始值被传递给访问器，允许你操作并返回该值。要访问访问器的值，你可以简单地访问模型实例上的 `first_name` 属性：

```php
use App\Models\User;

$user = User::find(1);

$firstName = $user->first_name;
```

> [!NOTE]
> 如果你希望将这些计算值添加到模型的数组/JSON 表示中，[你需要将其追加](/docs/{{version}}/eloquent-serialization#appending-values-to-json)。

<a name="building-value-objects-from-multiple-attributes"></a>
#### 从多个属性构建值对象

有时你的访问器可能需要将多个模型属性转换为单个"值对象"。为此，你的 `get` 闭包可以接受第二个参数 `$attributes`，该参数将自动提供给闭包，并包含模型所有当前属性的数组：

```php
use App\Support\Address;
use Illuminate\Database\Eloquent\Casts\Attribute;

/**
 * 与用户的地址交互。
 */
protected function address(): Attribute
{
    return Attribute::make(
        get: fn (mixed $value, array $attributes) => new Address(
            $attributes['address_line_one'],
            $attributes['address_line_two'],
        ),
    );
}
```

<a name="accessor-caching"></a>
#### 访问器缓存

从访问器返回值对象时，对值对象所做的任何更改都会在模型保存前自动同步回模型。这是因为 Eloquent 会保留访问器返回的实例，以便每次调用访问器时都可以返回相同的实例：

```php
use App\Models\User;

$user = User::find(1);

$user->address->lineOne = 'Updated Address Line 1 Value';
$user->address->lineTwo = 'Updated Address Line 2 Value';

$user->save();
```

然而，有时你可能希望为原始值（如字符串和布尔值）启用缓存，特别是当它们计算密集时。为此，你可以在定义访问器时调用 `shouldCache` 方法：

```php
protected function hash(): Attribute
{
    return Attribute::make(
        get: fn (string $value) => bcrypt(gzuncompress($value)),
    )->shouldCache();
}
```

如果你希望禁用属性的对象缓存行为，可以在定义属性时调用 `withoutObjectCaching` 方法：

```php
/**
 * 与用户的地址交互。
 */
protected function address(): Attribute
{
    return Attribute::make(
        get: fn (mixed $value, array $attributes) => new Address(
            $attributes['address_line_one'],
            $attributes['address_line_two'],
        ),
    )->withoutObjectCaching();
}
```

<a name="defining-a-mutator"></a>
### 定义修改器

修改器在设置 Eloquent 属性值时对其进行转换。要定义修改器，你可以在定义属性时提供 `set` 参数。让我们为 `first_name` 属性定义一个修改器。当我们尝试在模型上设置 `first_name` 属性的值时，将自动调用此修改器：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 与用户的名字交互。
     */
    protected function firstName(): Attribute
    {
        return Attribute::make(
            get: fn (string $value) => ucfirst($value),
            set: fn (string $value) => strtolower($value),
        );
    }
}
```

修改器闭包将接收在属性上设置的值，允许你操作该值并返回操作后的值。要使用我们的修改器，我们只需在 Eloquent 模型上设置 `first_name` 属性：

```php
use App\Models\User;

$user = User::find(1);

$user->first_name = 'Sally';
```

在此示例中，`set` 回调将使用值 `Sally` 调用。然后修改器将 `strtolower` 函数应用于名称，并将其结果值设置在模型的内部 `$attributes` 数组中。

<a name="mutating-multiple-attributes"></a>
#### 修改多个属性

有时你的修改器可能需要设置底层模型上的多个属性。为此，你可以从 `set` 闭包返回一个数组。数组中的每个键应对应于与模型关联的底层属性/数据库列：

```php
use App\Support\Address;
use Illuminate\Database\Eloquent\Casts\Attribute;

/**
 * 与用户的地址交互。
 */
protected function address(): Attribute
{
    return Attribute::make(
        get: fn (mixed $value, array $attributes) => new Address(
            $attributes['address_line_one'],
            $attributes['address_line_two'],
        ),
        set: fn (Address $value) => [
            'address_line_one' => $value->lineOne,
            'address_line_two' => $value->lineTwo,
        ],
    );
}
```

<a name="attribute-casting"></a>
## 属性类型转换

属性类型转换提供了类似于访问器和修改器的功能，而无需在模型上定义任何额外的方法。相反，模型的 `casts` 方法提供了一种将属性转换为常见数据类型的便捷方式。

`casts` 方法应返回一个数组，其中键是被转换的属性的名称，值是你要将列转换为的类型。支持的类型转换有：

<div class="content-list" markdown="1">

- `array`
- `AsFluent::class`
- `AsStringable::class`
- `AsUri::class`
- `boolean`
- `collection`
- `date`
- `datetime`
- `immutable_date`
- `immutable_datetime`
- <code>decimal:&lt;precision&gt;</code>
- `double`
- `encrypted`
- `encrypted:array`
- `encrypted:collection`
- `encrypted:object`
- `float`
- `hashed`
- `integer`
- `object`
- `real`
- `string`
- `timestamp`

</div>

为了演示属性类型转换，让我们将数据库中存储为整数（`0` 或 `1`）的 `is_admin` 属性转换为布尔值：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 获取应进行类型转换的属性。
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_admin' => 'boolean',
        ];
    }
}
```

定义类型转换后，无论底层值在数据库中存储为整数，`is_admin` 属性在访问时始终会被转换为布尔值：

```php
$user = App\Models\User::find(1);

if ($user->is_admin) {
    // ...
}
```

如果你需要在运行时添加新的临时类型转换，可以使用 `mergeCasts` 方法。这些类型转换定义将添加到模型上已定义的任何类型转换中：

```php
$user->mergeCasts([
    'is_admin' => 'integer',
    'options' => 'object',
]);
```

> [!WARNING]
> 值为 `null` 的属性不会进行类型转换。此外，你绝不应定义与关系同名或为主键分配类型转换的类型转换（或属性）。

<a name="stringable-casting"></a>
#### Stringable 类型转换

你可以使用 `Illuminate\Database\Eloquent\Casts\AsStringable` 转换类将模型属性转换为[流畅的 Illuminate\Support\Stringable 对象](/docs/{{version}}/strings#fluent-strings-method-list)：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\AsStringable;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 获取应进行类型转换的属性。
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'directory' => AsStringable::class,
        ];
    }
}
```

<a name="array-and-json-casting"></a>
### 数组和 JSON 转换

`array` 转换在处理存储为序列化 JSON 的列时特别有用。例如，如果您的数据库包含序列化 JSON 的 `JSON` 或 `TEXT` 字段类型，则为该属性添加 `array` 转换将在您在 Eloquent 模型上访问它时自动将属性反序列化为 PHP 数组：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 获取应进行类型转换的属性。
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'options' => 'array',
        ];
    }
}
```

定义类型转换后，您可以访问 `options` 属性，它将自动从 JSON 反序列化为 PHP 数组。当您设置 `options` 属性的值时，给定的数组将自动序列化回 JSON 以进行存储：

```php
use App\Models\User;

$user = User::find(1);

$options = $user->options;

$options['key'] = 'value';

$user->options = $options;

$user->save();
```

要使用更简洁的语法更新 JSON 属性的单个字段，您可以[使该属性可批量赋值](/docs/{{version}}/eloquent#mass-assignment-json-columns)并在调用 `update` 方法时使用 `->` 运算符：

```php
$user = User::find(1);

$user->update(['options->key' => 'value']);
```

<a name="json-and-unicode"></a>
#### JSON 和 Unicode

如果您希望将数组属性存储为带有未转义 Unicode 字符的 JSON，可以使用 `json:unicode` 转换：

```php
/**
 * 获取应进行类型转换的属性。
 *
 * @return array<string, string>
 */
protected function casts(): array
{
    return [
        'options' => 'json:unicode',
    ];
}
```

<a name="array-object-and-collection-casting"></a>
#### 数组对象和集合类型转换

尽管标准的 `array` 转换对于许多应用程序来说已经足够，但它确实有一些缺点。由于 `array` 转换返回原始类型，因此无法直接修改数组的偏移量。例如，以下代码将触发 PHP 错误：

```php
$user = User::find(1);

$user->options['key'] = $value;
```

为了解决这个问题，Laravel 提供了 `AsArrayObject` 转换，它将您的 JSON 属性转换为 [ArrayObject](https://www.php.net/manual/en/class.arrayobject.php) 类。此功能是使用 Laravel 的[自定义转换](#custom-casts)实现来实现的，它允许 Laravel 智能地缓存和转换修改后的对象，以便可以修改单个偏移量而不会触发 PHP 错误。要使用 `AsArrayObject` 转换，只需将其分配给一个属性：

```php
use Illuminate\Database\Eloquent\Casts\AsArrayObject;

/**
 * 获取应进行类型转换的属性。
 *
 * @return array<string, string>
 */
protected function casts(): array
{
    return [
        'options' => AsArrayObject::class,
    ];
}
```

类似地，Laravel 提供了 `AsCollection` 转换，将您的 JSON 属性转换为 Laravel [Collection](/docs/{{version}}/collections) 实例：

```php
use Illuminate\Database\Eloquent\Casts\AsCollection;

/**
 * 获取应进行类型转换的属性。
 *
 * @return array<string, string>
 */
protected function casts(): array
{
    return [
        'options' => AsCollection::class,
    ];
}
```

如果您希望 `AsCollection` 转换实例化一个自定义集合类而不是 Laravel 的基础集合类，您可以提供集合类名作为转换参数：

```php
use App\Collections\OptionCollection;
use Illuminate\Database\Eloquent\Casts\AsCollection;

/**
 * 获取应进行类型转换的属性。
 *
 * @return array<string, string>
 */
protected function casts(): array
{
    return [
        'options' => AsCollection::using(OptionCollection::class),
    ];
}
```

`of` 方法可用于指示应通过集合的 [mapInto 方法](/docs/{{version}}/collections#method-mapinto)将集合项映射到给定类：

```php
use App\ValueObjects\Option;
use Illuminate\Database\Eloquent\Casts\AsCollection;

/**
 * 获取应进行类型转换的属性。
 *
 * @return array<string, string>
 */
protected function casts(): array
{
    return [
        'options' => AsCollection::of(Option::class)
    ];
}
```

将集合映射到对象时，对象应实现 `Illuminate\Contracts\Support\Arrayable` 和 `JsonSerializable` 接口，以定义其实例应如何序列化为 JSON 并存储到数据库中：

```php
<?php

namespace App\ValueObjects;

use Illuminate\Contracts\Support\Arrayable;
use JsonSerializable;

class Option implements Arrayable, JsonSerializable
{
    public string $name;
    public mixed $value;
    public bool $isLocked;

    /**
     * 创建一个新的 Option 实例。
     */
    public function __construct(array $data)
    {
        $this->name = $data['name'];
        $this->value = $data['value'];
        $this->isLocked = $data['is_locked'];
    }

    /**
     * 将实例作为数组获取。
     *
     * @return array{name: string, data: string, is_locked: bool}
     */
    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'value' => $this->value,
            'is_locked' => $this->isLocked,
        ];
    }

    /**
     * 指定应序列化为 JSON 的数据。
     *
     * @return array{name: string, data: string, is_locked: bool}
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
```

<a name="binary-casting"></a>
### 二进制类型转换

如果您的 Eloquent 模型除了模型的自增 ID 列外，还有一个[二进制类型](/docs/{{version}}/migrations#column-method-binary)的 `uuid` 或 `ulid` 列，您可以使用 `AsBinary` 转换自动将值转换为其二进制表示形式：

```php
use Illuminate\Database\Eloquent\Casts\AsBinary;

/**
 * 获取应进行类型转换的属性。
 *
 * @return array<string, string>
 */
protected function casts(): array
{
    return [
        'uuid' => AsBinary::uuid(),
        'ulid' => AsBinary::ulid(),
    ];
}
```

一旦在模型上定义了转换，您可以将 UUID / ULID 属性值设置为对象实例或字符串。Eloquent 将自动将该值转换为其二进制表示形式。当检索属性值时，您将始终收到纯文本字符串值：

```php
use Illuminate\Support\Str;

$user->uuid = Str::uuid();

return $user->uuid;

// "6e8cdeed-2f32-40bd-b109-1e4405be2140"
```

<a name="date-casting"></a>
### 日期类型转换

默认情况下，Eloquent 会将 `created_at` 和 `updated_at` 列转换为 [Carbon](https://github.com/briannesbitt/Carbon) 实例，它扩展了 PHP 的 `DateTime` 类并提供了一系列有用的方法。您可以通过在模型的 `casts` 方法中定义额外的日期转换来转换其他日期属性。通常，应使用 `datetime` 或 `immutable_datetime` 转换类型来转换日期。

定义 `date` 或 `datetime` 转换时，您还可以指定日期格式。当[模型序列化为数组或 JSON](/docs/{{version}}/eloquent-serialization) 时将使用此格式：

```php
/**
 * 获取应进行类型转换的属性。
 *
 * @return array<string, string>
 */
protected function casts(): array
{
    return [
        'created_at' => 'datetime:Y-m-d',
    ];
}
```

当列被转换为日期时，您可以将相应的模型属性值设置为 UNIX 时间戳、日期字符串（`Y-m-d`）、日期时间字符串或 `DateTime` / `Carbon` 实例。日期的值将被正确转换并存储在您的数据库中。

您可以通过在模型上定义 `serializeDate` 方法来自定义所有模型日期的默认序列化格式。此方法不会影响日期在数据库中的存储格式：

```php
/**
 * 准备一个日期以进行数组 / JSON 序列化。
 */
protected function serializeDate(DateTimeInterface $date): string
{
    return $date->format('Y-m-d');
}
```

要指定在实际存储模型日期到数据库时应使用的格式，您应使用模型 `Table` 属性上的 `dateFormat` 参数：

```php
use Illuminate\Database\Eloquent\Attributes\Table;

#[Table(dateFormat: 'U')]
class Flight extends Model
{
    // ...
}
```

<a name="date-casting-and-timezones"></a>
#### 日期转换、序列化和时区

默认情况下，`date` 和 `datetime` 转换会将日期序列化为 UTC ISO-8601 日期字符串（`YYYY-MM-DDTHH:MM:SS.uuuuuuZ`），无论应用程序的 `timezone` 配置选项中指定了哪个时区。强烈建议您始终使用此序列化格式，并通过不更改应用程序的 `timezone` 配置选项的默认 `UTC` 值，将应用程序的日期存储在 UTC 时区中。在整个应用程序中一致地使用 UTC 时区将提供与 PHP 和 JavaScript 中编写的其他日期操作库的最大互操作性。

如果对 `date` 或 `datetime` 转换应用了自定义格式，例如 `datetime:Y-m-d H:i:s`，则在日期序列化时将使用 Carbon 实例的内部时区。通常，这将是应用程序的 `timezone` 配置选项中指定的时区。但是，重要的是要注意，像 `created_at` 和 `updated_at` 这样的 `timestamp` 列不受此行为影响，并且始终以 UTC 格式进行格式化，无论应用程序的时区设置如何。

<a name="enum-casting"></a>
### 枚举类型转换

Eloquent 还允许您将属性值转换为 PHP [枚举](https://www.php.net/manual/en/language.enumerations.backed.php)。为此，您可以在模型的 `casts` 方法中指定要转换的属性和枚举：

```php
use App\Enums\ServerStatus;

/**
 * 获取应进行类型转换的属性。
 *
 * @return array<string, string>
 */
protected function casts(): array
{
    return [
        'status' => ServerStatus::class,
    ];
}
```

一旦您在模型上定义了转换，指定的属性在与属性交互时将自动在枚举之间进行转换：

```php
if ($server->status == ServerStatus::Provisioned) {
    $server->status = ServerStatus::Ready;

    $server->save();
}
```

<a name="casting-arrays-of-enums"></a>
#### 转换枚举数组

有时您可能希望您的模型在单个列中存储一组枚举值。为此，您可以使用 Laravel 提供的 `AsEnumArrayObject` 或 `AsEnumCollection` 转换：

```php
use App\Enums\ServerStatus;
use Illuminate\Database\Eloquent\Casts\AsEnumCollection;

/**
 * 获取应进行类型转换的属性。
 *
 * @return array<string, string>
 */
protected function casts(): array
{
    return [
        'statuses' => AsEnumCollection::of(ServerStatus::class),
    ];
}
```

<a name="encrypted-casting"></a>
### 加密类型转换

`encrypted` 转换将使用 Laravel 的内置[加密](/docs/{{version}}/encryption)功能加密模型属性的值。此外，`encrypted:array`、`encrypted:collection`、`encrypted:object`、`AsEncryptedArrayObject` 和 `AsEncryptedCollection` 转换的工作方式与其未加密的对应项类似；但是，正如您所料，底层值在存储到数据库时会被加密。

由于加密文本的最终长度不可预测且比其纯文本对应项长，请确保关联的数据库列是 `TEXT` 类型或更大。此外，由于值在数据库中被加密，您将无法查询或搜索加密的属性值。

<a name="key-rotation"></a>
#### 密钥轮换

如您所知，Laravel 使用应用程序的 `app` 配置文件中指定的 `key` 配置值来加密字符串。通常，此值对应于 `APP_KEY` 环境变量的值。如果您需要轮换应用程序的加密密钥，您可以[优雅地这样做](/docs/{{version}}/encryption#gracefully-rotating-encryption-keys)。

<a name="query-time-casting"></a>
### 查询时类型转换

有时您可能需要在执行查询时应用类型转换，例如从表中选择原始值时。例如，考虑以下查询：

```php
use App\Models\Post;
use App\Models\User;

$users = User::select([
    'users.*',
    'last_posted_at' => Post::selectRaw('MAX(created_at)')
        ->whereColumn('user_id', 'users.id')
])->get();
```

此查询结果中的 `last_posted_at` 属性将是一个简单的字符串。如果能在执行查询时对此属性应用 `datetime` 转换就好了。幸运的是，我们可以使用 `withCasts` 方法来实现：

```php
$users = User::select([
    'users.*',
    'last_posted_at' => Post::selectRaw('MAX(created_at)')
        ->whereColumn('user_id', 'users.id')
])->withCasts([
    'last_posted_at' => 'datetime'
])->get();
```

<a name="custom-casts"></a>
## 自定义类型转换

Laravel 有多种内置的有用类型转换类型；但是，有时您可能需要定义自己的类型转换类型。要创建类型转换，请执行 `make:cast` Artisan 命令。新的转换类将放置在您的 `app/Casts` 目录中：

```shell
php artisan make:cast AsJson
```

所有自定义转换类都实现 `CastsAttributes` 接口。实现此接口的类必须定义 `get` 和 `set` 方法。`get` 方法负责将数据库中的原始值转换为转换后的值，而 `set` 方法应将转换后的值转换为可以存储在数据库中的原始值。作为示例，我们将重新实现内置的 `json` 转换类型作为自定义转换类型：

```php
<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

class AsJson implements CastsAttributes
{
    /**
     * 转换给定的值。
     *
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    public function get(
        Model $model,
        string $key,
        mixed $value,
        array $attributes,
    ): array {
        return json_decode($value, true);
    }

    /**
     * 准备给定值以供存储。
     *
     * @param  array<string, mixed>  $attributes
     */
    public function set(
        Model $model,
        string $key,
        mixed $value,
        array $attributes,
    ): string {
        return json_encode($value);
    }
}
```

一旦您定义了自定义转换类型，您可以使用其类名将其附加到模型属性：

```php
<?php

namespace App\Models;

use App\Casts\AsJson;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    /**
     * 获取应进行类型转换的属性。
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'options' => AsJson::class,
        ];
    }
}
```

<a name="value-object-casting"></a>
### 值对象转换

您不限于将值转换为原始类型。您也可以将值转换为对象。定义将值转换为对象的自定义转换与转换为原始类型非常相似；但是，如果您的值对象包含多个数据库列，则 `set` 方法必须返回一个键/值对数组，这些键/值对将用于在模型上设置原始的可存储值。如果您的值对象仅影响单个列，您只需返回可存储值。

作为示例，我们将定义一个自定义转换类，将多个模型值转换为单个 `Address` 值对象。我们将假设 `Address` 值对象有两个公共属性：`lineOne` 和 `lineTwo`：

```php
<?php

namespace App\Casts;

use App\ValueObjects\Address;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;
use InvalidArgumentException;

class AsAddress implements CastsAttributes
{
    /**
     * 转换给定的值。
     *
     * @param  array<string, mixed>  $attributes
     */
    public function get(
        Model $model,
        string $key,
        mixed $value,
        array $attributes,
    ): Address {
        return new Address(
            $attributes['address_line_one'],
            $attributes['address_line_two']
        );
    }

    /**
     * 准备给定值以供存储。
     *
     * @param  array<string, mixed>  $attributes
     * @return array<string, string>
     */
    public function set(
        Model $model,
        string $key,
        mixed $value,
        array $attributes,
    ): array {
        if (! $value instanceof Address) {
            throw new InvalidArgumentException('The given value is not an Address instance.');
        }

        return [
            'address_line_one' => $value->lineOne,
            'address_line_two' => $value->lineTwo,
        ];
    }
}
```

当转换为值对象时，对值对象所做的任何更改都会在模型保存前自动同步回模型：

```php
use App\Models\User;

$user = User::find(1);

$user->address->lineOne = 'Updated Address Value';

$user->save();
```

> [!NOTE]
> 如果您计划将包含值对象的 Eloquent 模型序列化为 JSON 或数组，您应在值对象上实现 `Illuminate\Contracts\Support\Arrayable` 和 `JsonSerializable` 接口。

<a name="value-object-caching"></a>
#### 值对象缓存

当转换为值对象的属性被解析时，它们会被 Eloquent 缓存。因此，如果再次访问该属性，将返回相同的对象实例。

如果您希望禁用自定义转换类的对象缓存行为，您可以在自定义转换类上声明一个公共的 `withoutObjectCaching` 属性：

```php
class AsAddress implements CastsAttributes
{
    public bool $withoutObjectCaching = true;

    // ...
}
```

<a name="array-json-serialization"></a>
### 数组 / JSON 序列化

当使用 `toArray` 和 `toJson` 方法将 Eloquent 模型转换为数组或 JSON 时，只要您的自定义转换值对象实现了 `Illuminate\Contracts\Support\Arrayable` 和 `JsonSerializable` 接口，它们通常也会被序列化。但是，当使用第三方库提供的值对象时，您可能无法向对象添加这些接口。

因此，您可以指定您的自定义转换类将负责序列化值对象。为此，您的自定义转换类应实现 `Illuminate\Contracts\Database\Eloquent\SerializesCastableAttributes` 接口。此接口说明您的类应包含一个 `serialize` 方法，该方法应返回您的值对象的序列化形式：

```php
/**
 * 获取值的序列化表示。
 *
 * @param  array<string, mixed>  $attributes
 */
public function serialize(
    Model $model,
    string $key,
    mixed $value,
    array $attributes,
): string {
    return (string) $value;
}
```

<a name="inbound-casting"></a>
### 入站转换

有时您可能需要编写一个自定义转换类，该类仅转换在模型上设置的值，并且在从模型检索属性时不执行任何操作。

仅入站的自定义转换应实现 `CastsInboundAttributes` 接口，该接口仅需要定义 `set` 方法。可以使用 `--inbound` 选项调用 `make:cast` Artisan 命令来生成仅入站的转换类：

```shell
php artisan make:cast AsHash --inbound
```

一个典型的仅入站转换示例是"哈希"转换。例如，我们可以定义一个使用给定算法对入站值进行哈希处理的转换：

```php
<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsInboundAttributes;
use Illuminate\Database\Eloquent\Model;

class AsHash implements CastsInboundAttributes
{
    /**
     * 创建一个新的转换类实例。
     */
    public function __construct(
        protected string|null $algorithm = null,
    ) {}

    /**
     * 准备给定值以供存储。
     *
     * @param  array<string, mixed>  $attributes
     */
    public function set(
        Model $model,
        string $key,
        mixed $value,
        array $attributes,
    ): string {
        return is_null($this->algorithm)
            ? bcrypt($value)
            : hash($this->algorithm, $value);
    }
}
```

<a name="cast-parameters"></a>
### 转换参数

将自定义转换附加到模型时，可以使用 `:` 字符将转换参数与类名分隔，并使用逗号分隔多个参数。这些参数将传递给转换类的构造函数：

```php
/**
 * 获取应进行类型转换的属性。
 *
 * @return array<string, string>
 */
protected function casts(): array
{
    return [
        'secret' => AsHash::class.':sha256',
    ];
}
```

<a name="comparing-cast-values"></a>
### 比较转换值

如果您想定义如何比较两个给定的转换值以确定它们是否已更改，您的自定义转换类可以实现 `Illuminate\Contracts\Database\Eloquent\ComparesCastableAttributes` 接口。这使您可以精细控制 Eloquent 认为哪些值已更改，从而在模型更新时保存到数据库。

此接口说明您的类应包含一个 `compare` 方法，如果给定的值被视为相等，则该方法应返回 `true`：

```php
/**
 * 确定给定的值是否相等。
 *
 * @param  \Illuminate\Database\Eloquent\Model  $model
 * @param  string  $key
 * @param  mixed  $firstValue
 * @param  mixed  $secondValue
 * @return bool
 */
public function compare(
    Model $model,
    string $key,
    mixed $firstValue,
    mixed $secondValue
): bool {
    return $firstValue === $secondValue;
}
```

<a name="castables"></a>
### 可转换类

您可能希望允许应用程序的值对象定义它们自己的自定义转换类。您可以将实现 `Illuminate\Contracts\Database\Eloquent\Castable` 接口的值对象类附加到模型，而不是将自定义转换类附加到模型：

```php
use App\ValueObjects\Address;

protected function casts(): array
{
    return [
        'address' => Address::class,
    ];
}
```

实现 `Castable` 接口的对象必须定义一个 `castUsing` 方法，该方法返回负责转换 `Castable` 类的自定义转换器类的类名：

```php
<?php

namespace App\ValueObjects;

use Illuminate\Contracts\Database\Eloquent\Castable;
use App\Casts\AsAddress;

class Address implements Castable
{
    /**
     * 获取在从此转换目标进行转换时要使用的转换器类的名称。
     *
     * @param  array<string, mixed>  $arguments
     */
    public static function castUsing(array $arguments): string
    {
        return AsAddress::class;
    }
}
```

使用 `Castable` 类时，您仍然可以在 `casts` 方法定义中提供参数。这些参数将传递给 `castUsing` 方法：

```php
use App\ValueObjects\Address;

protected function casts(): array
{
    return [
        'address' => Address::class.':argument',
    ];
}
```

<a name="anonymous-cast-classes"></a>
#### 可转换类和匿名转换类

通过将"可转换类"与 PHP 的[匿名类](https://www.php.net/manual/en/language.oop5.anonymous.php)结合，您可以将值对象及其转换逻辑定义为单个可转换对象。为此，请从值对象的 `castUsing` 方法返回一个匿名类。该匿名类应实现 `CastsAttributes` 接口：

```php
<?php

namespace App\ValueObjects;

use Illuminate\Contracts\Database\Eloquent\Castable;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;

class Address implements Castable
{
    // ...

    /**
     * 获取在从此转换目标进行转换时要使用的转换器类。
     *
     * @param  array<string, mixed>  $arguments
     */
    public static function castUsing(array $arguments): CastsAttributes
    {
        return new class implements CastsAttributes
        {
            public function get(
                Model $model,
                string $key,
                mixed $value,
                array $attributes,
            ): Address {
                return new Address(
                    $attributes['address_line_one'],
                    $attributes['address_line_two']
                );
            }

            public function set(
                Model $model,
                string $key,
                mixed $value,
                array $attributes,
            ): array {
                return [
                    'address_line_one' => $value->lineOne,
                    'address_line_two' => $value->lineTwo,
                ];
            }
        };
    }
}
```

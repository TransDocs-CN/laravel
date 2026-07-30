# Eloquent：工厂

- [简介](#introduction)
- [定义模型工厂](#defining-model-factories)
    - [生成工厂](#generating-factories)
    - [工厂状态](#factory-states)
    - [工厂回调](#factory-callbacks)
- [使用工厂创建模型](#creating-models-using-factories)
    - [实例化模型](#instantiating-models)
    - [持久化模型](#persisting-models)
    - [序列](#sequences)
- [工厂关联关系](#factory-relationships)
    - [Has Many 关联关系](#has-many-relationships)
    - [Belongs To 关联关系](#belongs-to-relationships)
    - [多对多关联关系](#many-to-many-relationships)
    - [多态关联关系](#polymorphic-relationships)
    - [在工厂内定义关联关系](#defining-relationships-within-factories)
    - [为关联关系重用现有模型](#recycling-an-existing-model-for-relationships)

<a name="introduction"></a>
## 简介

在测试应用程序或填充数据库时，您可能需要向数据库中插入一些记录。Laravel 允许您使用模型工厂为每个 [Eloquent 模型](/docs/{{version}}/eloquent)定义一组默认属性，而不是手动指定每个列的值。

要查看如何编写工厂的示例，请查看应用程序中的 `database/factories/UserFactory.php` 文件。此工厂包含在所有新的 Laravel 应用程序中，并包含以下工厂定义：

```php
namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * 工厂当前使用的密码。
     */
    protected static ?string $password;

    /**
     * 定义模型的默认状态。
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * 指示模型的电子邮件地址应为未验证。
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
```

如您所见，在最基本的形式中，工厂是扩展 Laravel 基础工厂类并定义 `definition` 方法的类。`definition` 方法返回在使用工厂创建模型时应应用的默认属性值集。

通过 `fake` 辅助函数，工厂可以访问 [Faker](https://github.com/FakerPHP/Faker) PHP 库，它允许您方便地生成各种随机数据用于测试和填充。

> [!NOTE]
> 您可以通过更新 `config/app.php` 配置文件中的 `faker_locale` 选项来更改应用程序的 Faker 区域设置。

<a name="defining-model-factories"></a>
## 定义模型工厂

<a name="generating-factories"></a>
### 生成工厂

要创建工厂，请执行 `make:factory` [Artisan 命令](/docs/{{version}}/artisan)：

```shell
php artisan make:factory PostFactory
```

新的工厂类将放置在您的 `database/factories` 目录中。

<a name="factory-and-model-discovery-conventions"></a>
#### 模型和工厂发现约定

定义工厂后，您可以使用 `Illuminate\Database\Eloquent\Factories\HasFactory` trait 为模型提供的静态 `factory` 方法来实例化该模型的工厂实例。

`HasFactory` trait 的 `factory` 方法将使用约定来确定分配给该 trait 的模型的正确工厂。具体来说，该方法将在 `Database\Factories` 命名空间中查找类名与模型名称匹配并以 `Factory` 后缀结尾的工厂。如果这些约定不适用于您的特定应用程序或工厂，您可以向模型添加 `UseFactory` 属性来手动指定模型的工厂：

```php
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Database\Factories\Administration\FlightFactory;

#[UseFactory(FlightFactory::class)]
class Flight extends Model
{
    // ...
}
```

或者，您可以覆盖模型上的 `newFactory` 方法，直接返回模型对应工厂的实例：

```php
use Database\Factories\Administration\FlightFactory;

/**
 * 为模型创建一个新的工厂实例。
 */
protected static function newFactory()
{
    return FlightFactory::new();
}
```

然后，在相应的工厂上使用 `UseModel` 属性来指定模型：

```php
use App\Administration\Flight;
use Illuminate\Database\Eloquent\Factories\Attributes\UseModel;
use Illuminate\Database\Eloquent\Factories\Factory;

#[UseModel(Flight::class)]
class FlightFactory extends Factory
{
    // ...
}
```

<a name="factory-states"></a>
### 工厂状态

状态操作方法允许您定义可以以任何组合应用于模型工厂的离散修改。例如，您的 `Database\Factories\UserFactory` 工厂可能包含一个 `suspended` 状态方法，用于修改其默认属性值之一。

状态转换方法通常调用 Laravel 基础工厂类提供的 `state` 方法。`state` 方法接受一个闭包，该闭包将接收为工厂定义的原始属性数组，并应返回要修改的属性数组：

```php
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * 指示用户已被暂停。
 */
public function suspended(): Factory
{
    return $this->state(function (array $attributes) {
        return [
            'account_status' => 'suspended',
        ];
    });
}
```

<a name="trashed-state"></a>
#### "已删除"状态

如果您的 Eloquent 模型可以[软删除](/docs/{{version}}/eloquent#soft-deleting)，您可以调用内置的 `trashed` 状态方法，指示创建的模型应该已被"软删除"。您不需要手动定义 `trashed` 状态，因为它对所有工厂自动可用：

```php
use App\Models\User;

$user = User::factory()->trashed()->create();
```

<a name="factory-callbacks"></a>
### 工厂回调

工厂回调使用 `afterMaking` 和 `afterCreating` 方法注册，并允许您在创建或制作模型后执行其他任务。您应该通过在工厂类上定义 `configure` 方法来注册这些回调。当工厂被实例化时，Laravel 将自动调用此方法：

```php
namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class UserFactory extends Factory
{
    /**
     * 配置模型工厂。
     */
    public function configure(): static
    {
        return $this->afterMaking(function (User $user) {
            // ...
        })->afterCreating(function (User $user) {
            // ...
        });
    }

    // ...
}
```

您还可以在状态方法中注册工厂回调，以执行特定于给定状态的其他任务：

```php
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * 指示用户已被暂停。
 */
public function suspended(): Factory
{
    return $this->state(function (array $attributes) {
        return [
            'account_status' => 'suspended',
        ];
    })->afterMaking(function (User $user) {
        // ...
    })->afterCreating(function (User $user) {
        // ...
    });
}
```

<a name="creating-models-using-factories"></a>
## 使用工厂创建模型

<a name="instantiating-models"></a>
### 实例化模型

定义工厂后，您可以使用 `Illuminate\Database\Eloquent\Factories\HasFactory` trait 为模型提供的静态 `factory` 方法来实例化该模型的工厂实例。让我们看一下创建模型的几个示例。首先，我们将使用 `make` 方法创建模型，而不将其持久化到数据库：

```php
use App\Models\User;

$user = User::factory()->make();
```

您可以使用 `count` 方法创建多个模型的集合：

```php
$users = User::factory()->count(3)->make();
```

<a name="applying-states"></a>
#### 应用状态

您还可以将任何[状态](#factory-states)应用于模型。如果您希望将多个状态转换应用于模型，可以直接调用状态转换方法：

```php
$users = User::factory()->count(5)->suspended()->make();
```

<a name="overriding-attributes"></a>
#### 覆盖属性

如果您希望覆盖模型的某些默认值，可以向 `make` 方法传递一个值数组。只有指定的属性会被替换，其余属性将保留为工厂指定的默认值：

```php
$user = User::factory()->make([
    'name' => 'Abigail Otwell',
]);
```

或者，可以直接在工厂实例上调用 `state` 方法来执行内联状态转换：

```php
$user = User::factory()->state([
    'name' => 'Abigail Otwell',
])->make();
```

> [!NOTE]
> 使用工厂创建模型时，[批量赋值保护](/docs/{{version}}/eloquent#mass-assignment)会自动禁用。

<a name="persisting-models"></a>
### 持久化模型

`create` 方法实例化模型实例并使用 Eloquent 的 `save` 方法将其持久化到数据库：

```php
use App\Models\User;

// 创建单个 App\Models\User 实例...
$user = User::factory()->create();

// 创建三个 App\Models\User 实例...
$users = User::factory()->count(3)->create();
```

您可以通过向 `create` 方法传递属性数组来覆盖工厂的默认模型属性：

```php
$user = User::factory()->create([
    'name' => 'Abigail',
]);
```

<a name="sequences"></a>
### 序列

有时您可能希望为每个创建的模型交替使用给定模型属性的值。您可以通过将状态转换定义为序列来实现这一点。例如，您可能希望为每个创建的用户交替使用 `admin` 列的 `Y` 和 `N` 值：

```php
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Sequence;

$users = User::factory()
    ->count(10)
    ->state(new Sequence(
        ['admin' => 'Y'],
        ['admin' => 'N'],
    ))
    ->create();
```

在此示例中，将创建五个 `admin` 值为 `Y` 的用户和五个 `admin` 值为 `N` 的用户。

如有必要，您可以包含一个闭包作为序列值。该闭包将在序列需要新值时被调用：

```php
use Illuminate\Database\Eloquent\Factories\Sequence;

$users = User::factory()
    ->count(10)
    ->state(new Sequence(
        fn (Sequence $sequence) => ['role' => UserRoles::all()->random()],
    ))
    ->create();
```

在序列闭包中，您可以访问注入到闭包中的序列实例上的 `$index` 属性。`$index` 属性包含到目前为止已发生的序列迭代次数：

```php
$users = User::factory()
    ->count(10)
    ->state(new Sequence(
        fn (Sequence $sequence) => ['name' => 'Name '.$sequence->index],
    ))
    ->create();
```

为方便起见，也可以使用 `sequence` 方法应用序列，该方法内部只是调用了 `state` 方法。`sequence` 方法接受闭包或序列化属性数组：

```php
$users = User::factory()
    ->count(2)
    ->sequence(
        ['name' => 'First User'],
        ['name' => 'Second User'],
    )
    ->create();
```

<a name="factory-relationships"></a>
## 工厂关联关系

<a name="has-many-relationships"></a>
### Has Many 关联关系

接下来，让我们探索如何使用 Laravel 流畅的工厂方法构建 Eloquent 模型关系。首先，假设我们的应用程序有一个 `App\Models\User` 模型和一个 `App\Models\Post` 模型。同时，假设 `User` 模型定义了与 `Post` 的 `hasMany` 关系。我们可以使用 Laravel 工厂提供的 `has` 方法创建一个拥有三篇文章的用户。`has` 方法接受一个工厂实例：

```php
use App\Models\Post;
use App\Models\User;

$user = User::factory()
    ->has(Post::factory()->count(3))
    ->create();
```

按照约定，当将 `Post` 模型传递给 `has` 方法时，Laravel 将假定 `User` 模型必须有一个定义关系的 `posts` 方法。如有必要，您可以显式指定要操作的关系名称：

```php
$user = User::factory()
    ->has(Post::factory()->count(3), 'posts')
    ->create();
```

当然，您可以对相关模型执行状态操作。此外，如果您的状态更改需要访问父模型，您可以传递一个基于闭包的状态转换：

```php
$user = User::factory()
    ->has(
        Post::factory()
            ->count(3)
            ->state(function (array $attributes, User $user) {
                return ['user_type' => $user->type];
            })
    )
    ->create();
```

<a name="has-many-relationships-using-magic-methods"></a>
#### 使用魔术方法

为方便起见，您可以使用 Laravel 的魔术工厂关系方法来构建关系。例如，以下示例将使用约定确定相关模型应通过 `User` 模型上的 `posts` 关系方法创建：

```php
$user = User::factory()
    ->hasPosts(3)
    ->create();
```

当使用魔术方法创建工厂关系时，您可以传递一个属性数组来覆盖相关模型：

```php
$user = User::factory()
    ->hasPosts(3, [
        'published' => false,
    ])
    ->create();
```

您还可以传递多个属性数组来创建具有逐模型状态的相关模型。Laravel 将按顺序应用每个数组：

```php
$user = User::factory()
    ->hasPosts(
        ['title' => 'First Post'],
        ['title' => 'Second Post'],
        ['title' => 'Third Post'],
    )
    ->create();
```

如果您的状态更改需要访问父模型，您可以提供基于闭包的状态转换：

```php
$user = User::factory()
    ->hasPosts(3, function (array $attributes, User $user) {
        return ['user_type' => $user->type];
    })
    ->create();
```

<a name="belongs-to-relationships"></a>
### Belongs To 关联关系

现在我们已经探索了如何使用工厂构建"has many"关系，让我们探索关系的反方向。`for` 方法可用于定义工厂创建的模型所属的父模型。例如，我们可以创建三个属于单个用户的 `App\Models\Post` 模型实例：

```php
use App\Models\Post;
use App\Models\User;

$posts = Post::factory()
    ->count(3)
    ->for(User::factory()->state([
        'name' => 'Jessica Archer',
    ]))
    ->create();
```

如果您已经有一个父模型实例应与您正在创建的模型关联，您可以将该模型实例传递给 `for` 方法：

```php
$user = User::factory()->create();

$posts = Post::factory()
    ->count(3)
    ->for($user)
    ->create();
```

<a name="belongs-to-relationships-using-magic-methods"></a>
#### 使用魔术方法

为方便起见，您可以使用 Laravel 的魔术工厂关系方法来定义"belongs to"关系。例如，以下示例将使用约定确定三篇文章应属于 `Post` 模型上的 `user` 关系：

```php
$posts = Post::factory()
    ->count(3)
    ->forUser([
        'name' => 'Jessica Archer',
    ])
    ->create();
```

<a name="many-to-many-relationships"></a>
### 多对多关联关系

与 [has many 关系](#has-many-relationships)一样，"多对多"关系也可以使用 `has` 方法创建：

```php
use App\Models\Role;
use App\Models\User;

$user = User::factory()
    ->has(Role::factory()->count(3))
    ->create();
```

<a name="pivot-table-attributes"></a>
#### 中间表属性

如果您需要定义应设置在连接模型的中间表上的属性，可以使用 `hasAttached` 方法。此方法接受中间表属性名称和值数组作为其第二个参数：

```php
use App\Models\Role;
use App\Models\User;

$user = User::factory()
    ->hasAttached(
        Role::factory()->count(3),
        ['active' => true]
    )
    ->create();
```

如果您的状态更改需要访问相关模型，您可以提供基于闭包的状态转换：

```php
$user = User::factory()
    ->hasAttached(
        Role::factory()
            ->count(3)
            ->state(function (array $attributes, User $user) {
                return ['name' => $user->name.' Role'];
            }),
        ['active' => true]
    )
    ->create();
```

您还可以传递一个中间表数组来为每个相关模型提供唯一的中间表数据：

```php
$user = User::factory()
    ->hasAttached(
        Role::factory(),
        [
            ['active' => true],
            ['active' => false],
        ]
    )
    ->create();
```

如果您已有希望附加到您正在创建的模型的模型实例，可以将模型实例传递给 `hasAttached` 方法。在此示例中，相同的三个角色将附加到所有三个用户：

```php
$roles = Role::factory()->count(3)->create();

$users = User::factory()
    ->count(3)
    ->hasAttached($roles, ['active' => true])
    ->create();
```

<a name="many-to-many-relationships-using-magic-methods"></a>
#### 使用魔术方法

为方便起见，您可以使用 Laravel 的魔术工厂关系方法来定义多对多关系。例如，以下示例将使用约定确定相关模型应通过 `User` 模型上的 `roles` 关系方法创建：

```php
$user = User::factory()
    ->hasRoles(1, [
        'name' => 'Editor'
    ])
    ->create();
```

<a name="polymorphic-relationships"></a>
### 多态关联关系

[多态关系](/docs/{{version}}/eloquent-relationships#polymorphic-relationships)也可以使用工厂创建。多态"morph many"关系的创建方式与典型的"has many"关系相同。例如，如果 `App\Models\Post` 模型与 `App\Models\Comment` 模型有 `morphMany` 关系：

```php
use App\Models\Post;

$post = Post::factory()->hasComments(3)->create();
```

<a name="morph-to-relationships"></a>
#### Morph To 关联关系

魔术方法不能用于创建 `morphTo` 关系。相反，必须直接使用 `for` 方法，并且必须显式提供关系名称。例如，假设 `Comment` 模型有一个定义 `morphTo` 关系的 `commentable` 方法。在这种情况下，我们可以使用 `for` 方法直接创建属于单个文章的三条评论：

```php
$comments = Comment::factory()->count(3)->for(
    Post::factory(), 'commentable'
)->create();
```

<a name="polymorphic-many-to-many-relationships"></a>
#### 多态多对多关联关系

多态"多对多"（`morphToMany` / `morphedByMany`）关系的创建方式与非多态"多对多"关系相同：

```php
use App\Models\Tag;
use App\Models\Video;

$video = Video::factory()
    ->hasAttached(
        Tag::factory()->count(3),
        ['public' => true]
    )
    ->create();
```

当然，魔术方法 `has` 也可以用于创建多态"多对多"关系：

```php
$video = Video::factory()
    ->hasTags(3, ['public' => true])
    ->create();
```

<a name="defining-relationships-within-factories"></a>
### 在工厂内定义关联关系

要在模型工厂内定义关系，您通常会将新的工厂实例分配给关系的外键。这通常针对"反向"关系（如 `belongsTo` 和 `morphTo` 关系）执行。例如，如果您希望在创建文章时创建新用户，您可以这样做：

```php
use App\Models\User;

/**
 * 定义模型的默认状态。
 *
 * @return array<string, mixed>
 */
public function definition(): array
{
    return [
        'user_id' => User::factory(),
        'title' => fake()->title(),
        'content' => fake()->paragraph(),
    ];
}
```

如果关系的列依赖于定义它的工厂，您可以将闭包分配给属性。该闭包将接收工厂评估后的属性数组：

```php
/**
 * 定义模型的默认状态。
 *
 * @return array<string, mixed>
 */
public function definition(): array
{
    return [
        'user_id' => User::factory(),
        'user_type' => function (array $attributes) {
            return User::find($attributes['user_id'])->type;
        },
        'title' => fake()->title(),
        'content' => fake()->paragraph(),
    ];
}
```

<a name="recycling-an-existing-model-for-relationships"></a>
### 为关联关系重用现有模型

如果您有多个模型共享与另一个模型的共同关系，您可以使用 `recycle` 方法确保相关模型的单个实例被工厂创建的所有关系重用。

例如，假设您有 `Airline`、`Flight` 和 `Ticket` 模型，其中机票属于航空公司和航班，而航班也属于航空公司。在创建机票时，您可能希望机票和航班使用相同的航空公司，因此您可以将航空公司实例传递给 `recycle` 方法：

```php
Ticket::factory()
    ->recycle(Airline::factory()->create())
    ->create();
```

如果您有属于共同用户或团队的模型，您可能会发现 `recycle` 方法特别有用。

`recycle` 方法也接受现有模型的集合。当向 `recycle` 方法提供集合时，当工厂需要该类型的模型时，将从集合中选择一个随机模型：

```php
Ticket::factory()
    ->recycle($airlines)
    ->create();
```

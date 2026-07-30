# 数据库：数据填充

- [简介](#introduction)
- [编写填充器](#writing-seeders)
    - [使用模型工厂](#using-model-factories)
    - [调用其他填充器](#calling-additional-seeders)
    - [静默模型事件](#muting-model-events)
- [运行填充器](#running-seeders)

<a name="introduction"></a>
## 简介

Laravel 包含使用填充类向数据库填充数据的能力。所有填充类都存储在 `database/seeders` 目录中。默认情况下，为你定义了一个 `DatabaseSeeder` 类。从此类中，你可以使用 `call` 方法运行其他填充类，从而控制填充顺序。

> [!NOTE]
> 在数据库填充期间，[批量赋值保护](/docs/{{version}}/eloquent#mass-assignment)会自动禁用。

<a name="writing-seeders"></a>
## 编写填充器

要生成填充器，请执行 `make:seeder` [Artisan 命令](/docs/{{version}}/artisan)。框架生成的所有填充器都将放置在 `database/seeders` 目录中：

```shell
php artisan make:seeder UserSeeder
```

填充器类默认只包含一个方法：`run`。当执行 `db:seed` [Artisan 命令](/docs/{{version}}/artisan)时，会调用此方法。在 `run` 方法中，你可以按任何方式向数据库插入数据。你可以使用[查询构建器](/docs/{{version}}/queries)手动插入数据，也可以使用 [Eloquent 模型工厂](/docs/{{version}}/eloquent-factories)。

作为示例，让我们修改默认的 `DatabaseSeeder` 类，并在 `run` 方法中添加数据库插入语句：

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Run the database seeders.
     */
    public function run(): void
    {
        DB::table('users')->insert([
            'name' => Str::random(10),
            'email' => Str::random(10).'@example.com',
            'password' => Hash::make('password'),
        ]);
    }
}
```

> [!NOTE]
> 你可以在 `run` 方法的签名中类型提示你需要的任何依赖。它们将通过 Laravel [服务容器](/docs/{{version}}/container)自动解析。

<a name="using-model-factories"></a>
### 使用模型工厂

当然，为每个模型填充手动指定属性是很繁琐的。相反，你可以使用[模型工厂](/docs/{{version}}/eloquent-factories)来方便地生成大量数据库记录。首先，查看[模型工厂文档](/docs/{{version}}/eloquent-factories)以了解如何定义你的工厂。

例如，让我们创建 50 个用户，每个用户都有一篇相关文章：

```php
use App\Models\User;

/**
 * Run the database seeders.
 */
public function run(): void
{
    User::factory()
        ->count(50)
        ->hasPosts(1)
        ->create();
}
```

<a name="calling-additional-seeders"></a>
### 调用其他填充器

在 `DatabaseSeeder` 类中，你可以使用 `call` 方法执行其他填充类。使用 `call` 方法允许你将数据库填充分解为多个文件，这样单个填充器类就不会变得太大。`call` 方法接受一个应执行的填充器类数组：

```php
/**
 * Run the database seeders.
 */
public function run(): void
{
    $this->call([
        UserSeeder::class,
        PostSeeder::class,
        CommentSeeder::class,
    ]);
}
```

<a name="muting-model-events"></a>
### 静默模型事件

在运行填充时，你可能希望阻止模型分派事件。你可以使用 `WithoutModelEvents` trait 来实现这一点。使用时，`WithoutModelEvents` trait 确保没有模型事件被分派，即使通过 `call` 方法执行了其他填充类：

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeders.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
        ]);
    }
}
```

<a name="running-seeders"></a>
## 运行填充器

你可以执行 `db:seed` Artisan 命令来填充你的数据库。默认情况下，`db:seed` 命令运行 `Database\Seeders\DatabaseSeeder` 类，该类可能进而调用其他填充类。但是，你可以使用 `--class` 选项指定要单独运行的特定填充器类：

```shell
php artisan db:seed

php artisan db:seed --class=UserSeeder
```

你还可以使用 `migrate:fresh` 命令结合 `--seed` 选项来填充你的数据库，这将删除所有表并重新运行所有迁移。此命令对于完全重建你的数据库非常有用。`--seeder` 选项可用于指定要运行的特定填充器：

```shell
php artisan migrate:fresh --seed

php artisan migrate:fresh --seed --seeder=UserSeeder
```

<a name="forcing-seeding-production"></a>
#### 强制在生产环境中运行填充器

某些填充操作可能导致你更改或丢失数据。为了保护你不在生产数据库上运行填充命令，在执行填充器之前，会在 `production` 环境中提示你进行确认。要强制填充器运行而不提示，请使用 `--force` 标志：

```shell
php artisan db:seed --force
```

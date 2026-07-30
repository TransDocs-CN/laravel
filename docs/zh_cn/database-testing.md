# 数据库测试

- [简介](#introduction)
    - [每次测试后重置数据库](#resetting-the-database-after-each-test)
- [模型工厂](#model-factories)
- [运行种子器](#running-seeders)
- [可用的断言方法](#available-assertions)

<a name="introduction"></a>
## 简介

Laravel 提供了各种有用的工具和断言，使测试数据库驱动的应用变得更加容易。此外，Laravel 模型工厂和种子器使你能够使用应用的 Eloquent 模型和关系轻松创建测试数据库记录。我们将在以下文档中讨论所有这些强大的功能。

<a name="resetting-the-database-after-each-test"></a>
### 每次测试后重置数据库

在进一步深入之前，让我们讨论如何在每次测试后重置数据库，以便前一个测试的数据不会干扰后续测试。Laravel 自带的 `Illuminate\Foundation\Testing\RefreshDatabase` trait 将为你处理这个问题。只需在你的测试类上使用该 trait：

```php tab=Pest
<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

pest()->use(RefreshDatabase::class);

test('basic example', function () {
    $response = $this->get('/');

    // ...
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    /**
     * 一个基本的函数式测试示例。
     */
    public function test_basic_example(): void
    {
        $response = $this->get('/');

        // ...
    }
}
```

如果你的模式是最新的，`Illuminate\Foundation\Testing\RefreshDatabase` trait 不会迁移你的数据库。相反，它只会在数据库事务中执行测试。因此，未使用此 trait 的测试用例添加到数据库中的任何记录可能仍然存在于数据库中。

如果你想完全重置数据库，可以改用 `Illuminate\Foundation\Testing\DatabaseMigrations` 或 `Illuminate\Foundation\Testing\DatabaseTruncation` trait。但是，这两个选项都比 `RefreshDatabase` trait 慢得多。

<a name="model-factories"></a>
## 模型工厂

测试时，你可能需要在执行测试之前向数据库插入一些记录。不必在创建测试数据时手动指定每个列的值，Laravel 允许你使用[模型工厂](/docs/{{version}}/eloquent-factories)为每个 [Eloquent 模型](/docs/{{version}}/eloquent)定义一组默认属性。

要了解更多关于创建和使用模型工厂来创建模型的信息，请查阅完整的[模型工厂文档](/docs/{{version}}/eloquent-factories)。定义模型工厂后，你可以在测试中使用工厂来创建模型：

```php tab=Pest
use App\Models\User;

test('models can be instantiated', function () {
    $user = User::factory()->create();

    // ...
});
```

```php tab=PHPUnit
use App\Models\User;

public function test_models_can_be_instantiated(): void
{
    $user = User::factory()->create();

    // ...
}
```

<a name="running-seeders"></a>
## 运行种子器

如果你想在功能测试期间使用[数据库种子器](/docs/{{version}}/seeding)来填充数据库，可以调用 `seed` 方法。默认情况下，`seed` 方法将执行 `DatabaseSeeder`，它应该执行你所有其他的种子器。或者，你可以向 `seed` 方法传递一个特定的种子器类名：

```php tab=Pest
<?php

use Database\Seeders\OrderStatusSeeder;
use Database\Seeders\TransactionStatusSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

pest()->use(RefreshDatabase::class);

test('orders can be created', function () {
    // 运行 DatabaseSeeder...
    $this->seed();

    // 运行特定的种子器...
    $this->seed(OrderStatusSeeder::class);

    // ...

    // 运行一组特定的种子器...
    $this->seed([
        OrderStatusSeeder::class,
        TransactionStatusSeeder::class,
        // ...
    ]);
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Database\Seeders\OrderStatusSeeder;
use Database\Seeders\TransactionStatusSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    /**
     * 测试创建新订单。
     */
    public function test_orders_can_be_created(): void
    {
        // 运行 DatabaseSeeder...
        $this->seed();

        // 运行特定的种子器...
        $this->seed(OrderStatusSeeder::class);

        // ...

        // 运行一组特定的种子器...
        $this->seed([
            OrderStatusSeeder::class,
            TransactionStatusSeeder::class,
            // ...
        ]);
    }
}
```

或者，你可以指示 Laravel 在使用 `RefreshDatabase` trait 的每个测试之前自动填充数据库。你可以通过将 `Seed` 属性添加到你的基础测试类来实现这一点：

```php
<?php

namespace Tests;

use Illuminate\Foundation\Testing\Attributes\Seed;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

#[Seed]
abstract class TestCase extends BaseTestCase
{
}
```

当存在 `Seed` 属性时，测试将在每个使用 `RefreshDatabase` trait 的测试之前运行 `Database\Seeders\DatabaseSeeder` 类。但是，你可以通过在你的测试类上使用 `Seeder` 属性来指定应执行的特定种子器：

```php
<?php

namespace Tests\Feature;

use Database\Seeders\OrderStatusSeeder;
use Illuminate\Foundation\Testing\Attributes\Seeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

#[Seeder(OrderStatusSeeder::class)]
class OrderTest extends TestCase
{
    use RefreshDatabase;

    // ...
}
```

<a name="available-assertions"></a>
## 可用的断言方法

Laravel 为你的 [Pest](https://pestphp.com) 或 [PHPUnit](https://phpunit.de) 功能测试提供了几个数据库断言。我们将在下面讨论每个断言。

<a name="assert-database-count"></a>
#### assertDatabaseCount

断言数据库中的表包含给定数量的记录：

```php
$this->assertDatabaseCount('users', 5);
```

<a name="assert-database-empty"></a>
#### assertDatabaseEmpty

断言数据库中的表不包含任何记录：

```php
$this->assertDatabaseEmpty('users');
```

<a name="assert-database-has"></a>
#### assertDatabaseHas

断言数据库中的表包含匹配给定键/值查询约束的记录：

```php
$this->assertDatabaseHas('users', [
    'email' => 'sally@example.com',
]);
```

<a name="assert-database-missing"></a>
#### assertDatabaseMissing

断言数据库中的表不包含匹配给定键/值查询约束的记录：

```php
$this->assertDatabaseMissing('users', [
    'email' => 'sally@example.com',
]);
```

<a name="assert-deleted"></a>
#### assertSoftDeleted

`assertSoftDeleted` 方法可用于断言给定的 Eloquent 模型已被"软删除"：

```php
$this->assertSoftDeleted($user);
```

<a name="assert-not-deleted"></a>
#### assertNotSoftDeleted

`assertNotSoftDeleted` 方法可用于断言给定的 Eloquent 模型未被"软删除"：

```php
$this->assertNotSoftDeleted($user);
```

<a name="assert-model-exists"></a>
#### assertModelExists

断言给定的模型或模型集合存在于数据库中：

```php
use App\Models\User;

$user = User::factory()->create();

$this->assertModelExists($user);
```

<a name="assert-model-missing"></a>
#### assertModelMissing

断言给定的模型或模型集合不存在于数据库中：

```php
use App\Models\User;

$user = User::factory()->create();

$user->delete();

$this->assertModelMissing($user);
```

<a name="expects-database-query-count"></a>
#### expectsDatabaseQueryCount

`expectsDatabaseQueryCount` 方法可以在测试开始时调用，以指定你期望在测试期间运行的总数据库查询数。如果实际执行的查询数与此预期不完全匹配，则测试将失败：

```php
$this->expectsDatabaseQueryCount(5);

// 测试...
```

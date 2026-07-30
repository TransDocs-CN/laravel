# 测试：入门指南

- [简介](#introduction)
- [环境](#environment)
- [创建测试](#creating-tests)
- [运行测试](#running-tests)
    - [并行运行测试](#running-tests-in-parallel)
    - [报告测试覆盖率](#reporting-test-coverage)
    - [分析测试性能](#profiling-tests)
- [配置缓存](#configuration-caching)

<a name="introduction"></a>
## 简介

Laravel 在设计时就充分考虑了测试。事实上，对 [Pest](https://pestphp.com) 和 [PHPUnit](https://phpunit.de) 的开箱即用支持已经包含在内，并且你的应用已经设置好了 `phpunit.xml` 文件。框架还附带了一些便捷的辅助方法，让你可以更具表现力地测试你的应用。

默认情况下，你的应用 `tests` 目录包含两个子目录：`Feature` 和 `Unit`。单元测试专注于测试代码中非常小且独立的部分。实际上，大多数单元测试可能只关注单个方法。"Unit" 测试目录中的测试不会启动 Laravel 应用，因此无法访问应用的数据库或其他框架服务。

功能测试可以测试更大范围的代码，包括多个对象如何相互交互，甚至是对 JSON 接口的完整 HTTP 请求。**通常，你的大多数测试都应该是功能测试。这类测试能最大程度地确保你的系统整体按预期运行。**

在 `Feature` 和 `Unit` 测试目录中都提供了一个 `ExampleTest.php` 文件。安装新的 Laravel 应用后，执行 `vendor/bin/pest`、`vendor/bin/phpunit` 或 `php artisan test` 命令来运行你的测试。

<a name="environment"></a>
## 环境

运行测试时，由于 `phpunit.xml` 文件中定义的环境变量，Laravel 会自动将[配置环境](/docs/{{version}}/configuration#environment-configuration)设置为 `testing`。Laravel 还会自动将会话和缓存配置为 `array` 驱动，以便在测试期间不会持久化任何会话或缓存数据。

你可以根据需要自由定义其他测试环境配置值。`testing` 环境变量可以在应用的 `phpunit.xml` 文件中配置，但运行测试前请确保使用 `config:clear` Artisan 命令清除配置缓存！

<a name="the-env-testing-environment-file"></a>
#### `.env.testing` 环境文件

此外，你可以在项目根目录创建一个 `.env.testing` 文件。当运行 Pest 和 PHPUnit 测试或使用 `--env=testing` 选项执行 Artisan 命令时，将使用此文件代替 `.env` 文件。

<a name="creating-tests"></a>
## 创建测试

要创建新的测试用例，请使用 `make:test` Artisan 命令。默认情况下，测试将放置在 `tests/Feature` 目录中：

```shell
php artisan make:test UserTest
```

如果你想在 `tests/Unit` 目录中创建测试，可以在执行 `make:test` 命令时使用 `--unit` 选项：

```shell
php artisan make:test UserTest --unit
```

如果你的测试类主要依赖 Laravel 的测试功能，但某个特定的测试方法不需要启动框架，你可以对该方法应用 `#[UnitTest]` 属性，以便仅为该测试跳过启动应用。

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\Attributes\UnitTest;
use Tests\TestCase;

class LocationServiceTest extends TestCase
{
    public function test_get_coordinates_resolves_address(): void
    {
        // 此测试使用 Laravel 的测试功能...
    }

    #[UnitTest]
    public function test_get_state_returns_state_from_abbreviation(): void
    {
        // 此测试在不启动应用的情况下运行...
    }
}
```

> [!NOTE]
> 测试模板可以通过[模板发布](/docs/{{version}}/artisan#stub-customization)进行自定义。

生成测试后，你可以像往常一样使用 Pest 或 PHPUnit 定义测试。要运行测试，请从终端执行 `vendor/bin/pest`、`vendor/bin/phpunit` 或 `php artisan test` 命令：

```php tab=Pest
<?php

test('basic', function () {
    expect(true)->toBeTrue();
});
```

```php tab=PHPUnit
<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class ExampleTest extends TestCase
{
    /**
     * 一个基本的测试示例。
     */
    public function test_basic_test(): void
    {
        $this->assertTrue(true);
    }
}
```

> [!WARNING]
> 如果在测试类中定义了自己的 `setUp` / `tearDown` 方法，请确保在父类上调用相应的 `parent::setUp()` / `parent::tearDown()` 方法。通常，你应该在自己的 `setUp` 方法开头调用 `parent::setUp()`，并在 `tearDown` 方法末尾调用 `parent::tearDown()`。

<a name="running-tests"></a>
## 运行测试

如前所述，编写测试后，你可以使用 `pest` 或 `phpunit` 运行它们：

```shell tab=Pest
./vendor/bin/pest
```

```shell tab=PHPUnit
./vendor/bin/phpunit
```

除了 `pest` 或 `phpunit` 命令外，你还可以使用 `test` Artisan 命令来运行测试。Artisan 测试运行器提供详细的测试报告，以便于开发和调试：

```shell
php artisan test
```

任何可以传递给 `pest` 或 `phpunit` 命令的参数也可以传递给 Artisan `test` 命令：

```shell
php artisan test --testsuite=Feature --stop-on-failure
```

<a name="running-tests-in-parallel"></a>
### 并行运行测试

默认情况下，Laravel 和 Pest / PHPUnit 在单个进程中按顺序执行测试。但是，你可以通过在多个进程上同时运行测试来大大减少运行测试所需的时间。首先，你应该将 `brianium/paratest` Composer 包作为"dev"依赖项安装。然后，在执行 `test` Artisan 命令时包含 `--parallel` 选项：

```shell
composer require brianium/paratest --dev

php artisan test --parallel
```

默认情况下，Laravel 将创建与你机器上可用 CPU 核心数相同的进程数。但是，你可以使用 `--processes` 选项调整进程数：

```shell
php artisan test --parallel --processes=4
```

> [!WARNING]
> 当并行运行测试时，某些 Pest / PHPUnit 选项（如 `--do-not-cache-result`）可能不可用。

<a name="parallel-testing-and-databases"></a>
#### 并行测试与数据库

只要你配置了主数据库连接，Laravel 会自动为每个运行测试的并行进程创建和迁移测试数据库。测试数据库将附加一个每个进程唯一的进程令牌后缀。例如，如果你有两个并行测试进程，Laravel 将创建并使用 `your_db_test_1` 和 `your_db_test_2` 测试数据库。

默认情况下，测试数据库在 `test` Artisan 命令调用之间保持持久化，以便它们可以被后续的 `test` 调用再次使用。但是，你可以使用 `--recreate-databases` 选项重新创建它们：

```shell
php artisan test --parallel --recreate-databases
```

<a name="parallel-testing-hooks"></a>
#### 并行测试钩子

有时，你可能需要准备应用测试使用的某些资源，以便它们可以被多个测试进程安全地使用。

使用 `ParallelTesting` 门面，你可以指定要在进程或测试用例的 `setUp` 和 `tearDown` 时执行的代码。给定的闭包接收 `$token` 和 `$testCase` 变量，分别包含进程令牌和当前的测试用例：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\ParallelTesting;
use Illuminate\Support\ServiceProvider;
use PHPUnit\Framework\TestCase;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 启动任意应用服务。
     */
    public function boot(): void
    {
        ParallelTesting::setUpProcess(function (int $token) {
            // ...
        });

        ParallelTesting::setUpTestCase(function (int $token, TestCase $testCase) {
            // ...
        });

        // 当创建测试数据库时执行...
        ParallelTesting::setUpTestDatabase(function (string $database, int $token) {
            Artisan::call('db:seed');
        });

        ParallelTesting::tearDownTestCase(function (int $token, TestCase $testCase) {
            // ...
        });

        ParallelTesting::tearDownProcess(function (int $token) {
            // ...
        });
    }
}
```

<a name="accessing-the-parallel-testing-token"></a>
#### 访问并行测试令牌

如果你想从应用测试代码中的任何其他位置访问当前并行进程的"令牌"，可以使用 `token` 方法。此令牌是单个测试进程的唯一字符串标识符，可用于在并行测试进程之间划分资源。例如，Laravel 会自动将此令牌附加到每个并行测试进程创建的测试数据库的末尾：

    $token = ParallelTesting::token();

<a name="reporting-test-coverage"></a>
### 报告测试覆盖率

> [!WARNING]
> 此功能需要 [Xdebug](https://xdebug.org) 或 [PCOV](https://pecl.php.net/package/pcov)。

在运行应用测试时，你可能希望确定你的测试用例是否实际覆盖了应用代码，以及运行测试时使用了多少应用代码。为此，你可以在调用 `test` 命令时提供 `--coverage` 选项：

```shell
php artisan test --coverage
```

<a name="enforcing-a-minimum-coverage-threshold"></a>
#### 强制执行最低覆盖率阈值

你可以使用 `--min` 选项为你的应用定义最低测试覆盖率阈值。如果未达到此阈值，测试套件将失败：

```shell
php artisan test --coverage --min=80.3
```

<a name="profiling-tests"></a>
### 分析测试性能

Artisan 测试运行器还包含一个方便的机制，用于列出应用中运行最慢的测试。使用 `--profile` 选项调用 `test` 命令，即可看到十个最慢测试的列表，让你可以轻松调查哪些测试需要改进以加速测试套件：

```shell
php artisan test --profile
```

<a name="configuration-caching"></a>
## 配置缓存

运行测试时，Laravel 会为每个单独的测试方法启动应用。如果没有缓存的配置文件，应用中的每个配置文件都必须在测试开始时加载。要构建一次配置并在单次运行中对所有测试重复使用，你可以使用 `Illuminate\Foundation\Testing\WithCachedConfig` trait：

```php tab=Pest
<?php

use Illuminate\Foundation\Testing\WithCachedConfig;

pest()->use(WithCachedConfig::class);

// ...
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\WithCachedConfig;
use Tests\TestCase;

class ConfigTest extends TestCase
{
    use WithCachedConfig;

    // ...
}
```

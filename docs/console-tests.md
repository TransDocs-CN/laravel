# 控制台测试

- [简介](#introduction)
- [成功 / 失败预期](#success-failure-expectations)
- [输入 / 输出预期](#input-output-expectations)
- [控制台事件](#console-events)

<a name="introduction"></a>
## 简介

除了简化 HTTP 测试，Laravel 还提供了用于测试应用[自定义控制台命令](/docs/{{version}}/artisan)的简单 API。

<a name="success-failure-expectations"></a>
## 成功 / 失败预期

首先，让我们探讨如何对 Artisan 命令的退出码进行断言。为此，我们将使用 `artisan` 方法从我们的测试中调用 Artisan 命令。然后，我们将使用 `assertExitCode` 方法来断言命令以给定的退出码完成：

```php tab=Pest
test('console command', function () {
    $this->artisan('inspire')->assertExitCode(0);
});
```

```php tab=PHPUnit
/**
 * 测试控制台命令。
 */
public function test_console_command(): void
{
    $this->artisan('inspire')->assertExitCode(0);
}
```

你可以使用 `assertNotExitCode` 方法来断言命令未以给定的退出码退出：

```php
$this->artisan('inspire')->assertNotExitCode(1);
```

当然，所有终端命令通常在成功时以状态码 `0` 退出，不成功时以非零退出码退出。因此，为了方便，你可以使用 `assertSuccessful` 和 `assertFailed` 断言来断言给定命令是否以成功的退出码退出：

```php
$this->artisan('inspire')->assertSuccessful();

$this->artisan('inspire')->assertFailed();
```

<a name="input-output-expectations"></a>
## 输入 / 输出预期

Laravel 允许你使用 `expectsQuestion` 方法轻松地为控制台命令"模拟"用户输入。此外，你可以使用 `assertExitCode` 和 `expectsOutput` 方法指定控制台命令应输出的退出码和文本。例如，考虑以下控制台命令：

```php
Artisan::command('question', function () {
    $name = $this->ask('What is your name?');

    $language = $this->choice('Which language do you prefer?', [
        'PHP',
        'Ruby',
        'Python',
    ]);

    $this->line('Your name is '.$name.' and you prefer '.$language.'.');
});
```

你可以使用以下测试来测试此命令：

```php tab=Pest
test('console command', function () {
    $this->artisan('question')
        ->expectsQuestion('What is your name?', 'Taylor Otwell')
        ->expectsQuestion('Which language do you prefer?', 'PHP')
        ->expectsOutput('Your name is Taylor Otwell and you prefer PHP.')
        ->doesntExpectOutput('Your name is Taylor Otwell and you prefer Ruby.')
        ->assertExitCode(0);
});
```

```php tab=PHPUnit
/**
 * 测试控制台命令。
 */
public function test_console_command(): void
{
    $this->artisan('question')
        ->expectsQuestion('What is your name?', 'Taylor Otwell')
        ->expectsQuestion('Which language do you prefer?', 'PHP')
        ->expectsOutput('Your name is Taylor Otwell and you prefer PHP.')
        ->doesntExpectOutput('Your name is Taylor Otwell and you prefer Ruby.')
        ->assertExitCode(0);
}
```

如果你使用了 [Laravel Prompts](/docs/{{version}}/prompts) 提供的 `search` 或 `multisearch` 功能，你可以使用 `expectsSearch` 断言来模拟用户输入、搜索结果和选择：

```php tab=Pest
test('console command', function () {
    $this->artisan('example')
        ->expectsSearch('What is your name?', search: 'Tay', answers: [
            'Taylor Otwell',
            'Taylor Swift',
            'Darian Taylor'
        ], answer: 'Taylor Otwell')
        ->assertExitCode(0);
});
```

```php tab=PHPUnit
/**
 * 测试控制台命令。
 */
public function test_console_command(): void
{
    $this->artisan('example')
        ->expectsSearch('What is your name?', search: 'Tay', answers: [
            'Taylor Otwell',
            'Taylor Swift',
            'Darian Taylor'
        ], answer: 'Taylor Otwell')
        ->assertExitCode(0);
}
```

你也可以使用 `doesntExpectOutput` 方法断言控制台命令不产生任何输出：

```php tab=Pest
test('console command', function () {
    $this->artisan('example')
        ->doesntExpectOutput()
        ->assertExitCode(0);
});
```

```php tab=PHPUnit
/**
 * 测试控制台命令。
 */
public function test_console_command(): void
{
    $this->artisan('example')
        ->doesntExpectOutput()
        ->assertExitCode(0);
}
```

`expectsOutputToContain` 和 `doesntExpectOutputToContain` 方法可用于对输出的部分内容进行断言：

```php tab=Pest
test('console command', function () {
    $this->artisan('example')
        ->expectsOutputToContain('Taylor')
        ->assertExitCode(0);
});
```

```php tab=PHPUnit
/**
 * 测试控制台命令。
 */
public function test_console_command(): void
{
    $this->artisan('example')
        ->expectsOutputToContain('Taylor')
        ->assertExitCode(0);
}
```

<a name="confirmation-expectations"></a>
#### 确认预期

当编写需要以"是"或"否"答案形式进行确认的命令时，你可以使用 `expectsConfirmation` 方法：

```php
$this->artisan('module:import')
    ->expectsConfirmation('Do you really wish to run this command?', 'no')
    ->assertExitCode(1);
```

<a name="table-expectations"></a>
#### 表格预期

如果你的命令使用 Artisan 的 `table` 方法显示信息表格，为整个表格编写输出预期会比较繁琐。相反，你可以使用 `expectsTable` 方法。此方法接受表格的头作为第一个参数，表格的数据作为第二个参数：

```php
$this->artisan('users:all')
    ->expectsTable([
        'ID',
        'Email',
    ], [
        [1, 'taylor@example.com'],
        [2, 'abigail@example.com'],
    ]);
```

<a name="console-events"></a>
## 控制台事件

默认情况下，`Illuminate\Console\Events\CommandStarting` 和 `Illuminate\Console\Events\CommandFinished` 事件在运行应用测试时不会被分发。但是，你可以通过将 `Illuminate\Foundation\Testing\WithConsoleEvents` trait 添加到类来为给定的测试类启用这些事件：

```php tab=Pest
<?php

use Illuminate\Foundation\Testing\WithConsoleEvents;

pest()->use(WithConsoleEvents::class);

// ...
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\WithConsoleEvents;
use Tests\TestCase;

class ConsoleEventTest extends TestCase
{
    use WithConsoleEvents;

    // ...
}
```

# 模拟

- [简介](#introduction)
- [模拟对象](#mocking-objects)
- [模拟门面](#mocking-facades)
    - [门面间谍](#facade-spies)
- [与时间交互](#interacting-with-time)

<a name="introduction"></a>
## 简介

在测试 Laravel 应用时，你可能希望"模拟"应用的某些方面，以便它们在给定的测试中不会实际执行。例如，当测试一个分发事件的控制器时，你可能希望模拟事件监听器，以便它们在测试期间不会实际执行。这允许你只测试控制器的 HTTP 响应，而不必担心事件监听器的执行，因为事件监听器可以在它们自己的测试用例中进行测试。

Laravel 提供了开箱即用的有用方法来模拟事件、作业和其他门面。这些辅助方法主要是在 Mockery 之上提供了一个便利层，因此你不必手动进行复杂的 Mockery 方法调用。

<a name="mocking-objects"></a>
## 模拟对象

当模拟一个将经由 Laravel 的[服务容器](/docs/{{version}}/container)注入到应用中的对象时，你需要将你的模拟实例作为 `instance` 绑定绑定到容器中。这将指示容器使用你的对象模拟实例，而不是构造对象本身：

```php tab=Pest
use App\Service;
use Mockery;
use Mockery\MockInterface;

test('something can be mocked', function () {
    $this->instance(
        Service::class,
        Mockery::mock(Service::class, function (MockInterface $mock) {
            $mock->expects('process');
        })
    );
});
```

```php tab=PHPUnit
use App\Service;
use Mockery;
use Mockery\MockInterface;

public function test_something_can_be_mocked(): void
{
    $this->instance(
        Service::class,
        Mockery::mock(Service::class, function (MockInterface $mock) {
            $mock->expects('process');
        })
    );
}
```

为了更方便，你可以使用 Laravel 基础测试用例类提供的 `mock` 方法。例如，以下示例与上面的示例等效：

```php
use App\Service;
use Mockery\MockInterface;

$mock = $this->mock(Service::class, function (MockInterface $mock) {
    $mock->expects('process');
});
```

当你只需要模拟对象的几个方法时，可以使用 `partialMock` 方法。未被模拟的方法在被调用时将正常执行：

```php
use App\Service;
use Mockery\MockInterface;

$mock = $this->partialMock(Service::class, function (MockInterface $mock) {
    $mock->expects('process');
});
```

类似地，如果你想[监视](http://docs.mockery.io/en/latest/reference/spies.html)一个对象，Laravel 的基础测试用例类提供了一个 `spy` 方法作为 `Mockery::spy` 方法的便捷包装。间谍类似于模拟；但是，间谍会记录间谍与被测试代码之间的任何交互，允许你在代码执行后做出断言：

```php
use App\Service;

$spy = $this->spy(Service::class);

// ...

$spy->shouldHaveReceived('process');
```

<a name="mocking-facades"></a>
## 模拟门面

与传统的静态方法调用不同，[门面](/docs/{{version}}/facades)（包括[实时门面](/docs/{{version}}/facades#real-time-facades)）可以被模拟。这比传统的静态方法具有很大的优势，并为你提供了与使用传统依赖注入相同的可测试性。在测试时，你可能经常希望模拟在你的一个控制器中对 Laravel 门面的调用。例如，考虑以下控制器操作：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Cache;

class UserController extends Controller
{
    /**
     * 获取应用的所有用户列表。
     */
    public function index(): array
    {
        $value = Cache::get('key');

        return [
            // ...
        ];
    }
}
```

我们可以使用 `expects` 方法模拟对 `Cache` 门面的调用，该方法将返回一个 [Mockery](https://github.com/padraic/mockery) 模拟实例。由于门面实际上是由 Laravel [服务容器](/docs/{{version}}/container)解析和管理的，因此它们比典型的静态类具有更强的可测试性。例如，让我们模拟对 `Cache` 门面的 `get` 方法的调用：

```php tab=Pest
<?php

use Illuminate\Support\Facades\Cache;

test('get index', function () {
    Cache::expects('get')
        ->with('key')
        ->andReturn('value');

    $response = $this->get('/users');

    // ...
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class UserControllerTest extends TestCase
{
    public function test_get_index(): void
    {
        Cache::expects('get')
            ->with('key')
            ->andReturn('value');

        $response = $this->get('/users');

        // ...
    }
}
```

> [!WARNING]
> 你不应模拟 `Request` 门面。相反，将你期望的输入传递给运行测试时的 [HTTP 测试方法](/docs/{{version}}/http-tests)，如 `get` 和 `post`。同样，不要模拟 `Config` 门面，而应在测试中调用 `Config::set` 方法。

<a name="facade-spies"></a>
### 门面间谍

如果你想[监视](http://docs.mockery.io/en/latest/reference/spies.html)一个门面，你可以在相应的门面上调用 `spy` 方法。间谍类似于模拟；但是，间谍会记录间谍与被测试代码之间的任何交互，允许你在代码执行后做出断言：

```php tab=Pest
<?php

use Illuminate\Support\Facades\Cache;

test('values are stored in cache', function () {
    Cache::spy();

    $response = $this->get('/');

    $response->assertStatus(200);

    Cache::shouldHaveReceived('put')->with('name', 'Taylor', 10);
});
```

```php tab=PHPUnit
use Illuminate\Support\Facades\Cache;

public function test_values_are_stored_in_cache(): void
{
    Cache::spy();

    $response = $this->get('/');

    $response->assertStatus(200);

    Cache::shouldHaveReceived('put')->with('name', 'Taylor', 10);
}
```

<a name="interacting-with-time"></a>
## 与时间交互

测试时，有时你可能需要修改 `now` 或 `Illuminate\Support\Carbon::now()` 等辅助函数返回的时间。幸运的是，Laravel 的基础功能测试类包含了允许你操作当前时间的辅助方法：

```php tab=Pest
test('time can be manipulated', function () {
    // 穿越到未来...
    $this->travel(5)->milliseconds();
    $this->travel(5)->seconds();
    $this->travel(5)->minutes();
    $this->travel(5)->hours();
    $this->travel(5)->days();
    $this->travel(5)->weeks();
    $this->travel(5)->years();

    // 穿越到过去...
    $this->travel(-5)->hours();

    // 穿越到明确的时间...
    $this->travelTo(now()->minus(hours: 6));

    // 返回当前时间...
    $this->travelBack();
});
```

```php tab=PHPUnit
public function test_time_can_be_manipulated(): void
{
    // 穿越到未来...
    $this->travel(5)->milliseconds();
    $this->travel(5)->seconds();
    $this->travel(5)->minutes();
    $this->travel(5)->hours();
    $this->travel(5)->days();
    $this->travel(5)->weeks();
    $this->travel(5)->years();

    // 穿越到过去...
    $this->travel(-5)->hours();

    // 穿越到明确的时间...
    $this->travelTo(now()->minus(hours: 6));

    // 返回当前时间...
    $this->travelBack();
}
```

你也可以向各种时间旅行方法提供一个闭包。闭包将在指定时间冻结的情况下被调用。闭包执行完成后，时间将恢复正常：

```php
$this->travel(5)->days(function () {
    // 测试未来五天的情况...
});

$this->travelTo(now()->mins(days: 10), function () {
    // 测试给定时刻的情况...
});
```

`freezeTime` 方法可用于冻结当前时间。类似地，`freezeSecond` 方法将冻结当前时间，但在当前秒的开始时刻：

```php
use Illuminate\Support\Carbon;

// 冻结时间，执行闭包后恢复正常时间...
$this->freezeTime(function (Carbon $time) {
    // ...
});

// 在当前秒冻结时间，执行闭包后恢复正常时间...
$this->freezeSecond(function (Carbon $time) {
    // ...
})
```

如你所料，上面讨论的所有方法主要用于测试时间敏感的应用行为，例如锁定讨论论坛上的非活跃帖子：

```php tab=Pest
use App\Models\Thread;

test('forum threads lock after one week of inactivity', function () {
    $thread = Thread::factory()->create();

    $this->travel(1)->week();

    expect($thread->isLockedByInactivity())->toBeTrue();
});
```

```php tab=PHPUnit
use App\Models\Thread;

public function test_forum_threads_lock_after_one_week_of_inactivity()
{
    $thread = Thread::factory()->create();

    $this->travel(1)->week();

    $this->assertTrue($thread->isLockedByInactivity());
}
```

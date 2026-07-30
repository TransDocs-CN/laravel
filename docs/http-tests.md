# HTTP 测试

- [简介](#introduction)
- [发起请求](#making-requests)
    - [自定义请求头](#customizing-request-headers)
    - [Cookie](#cookies)
    - [会话 / 认证](#session-and-authentication)
    - [调试响应](#debugging-responses)
    - [异常处理](#exception-handling)
- [测试 JSON API](#testing-json-apis)
    - [流畅的 JSON 测试](#fluent-json-testing)
- [测试文件上传](#testing-file-uploads)
- [测试视图](#testing-views)
    - [渲染 Blade 和组件](#rendering-blade-and-components)
- [缓存路由](#caching-routes)
- [可用的断言方法](#available-assertions)
    - [响应断言](#response-assertions)
    - [认证断言](#authentication-assertions)
    - [验证断言](#validation-assertions)

<a name="introduction"></a>
## 简介

Laravel 提供了一个非常流畅的 API 用于向你的应用发起 HTTP 请求并检查响应。例如，请看下面定义的功能测试：

```php tab=Pest
<?php

test('the application returns a successful response', function () {
    $response = $this->get('/');

    $response->assertStatus(200);
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * 一个基本的测试示例。
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }
}
```

`get` 方法向应用发起 `GET` 请求，而 `assertStatus` 方法断言返回的响应应具有给定的 HTTP 状态码。除了这个简单的断言之外，Laravel 还包含各种用于检查响应头、内容、JSON 结构等的断言。

<a name="making-requests"></a>
## 发起请求

要向你的应用发起请求，你可以在测试中调用 `get`、`post`、`put`、`patch` 或 `delete` 方法。这些方法不会真正向你的应用发起"真实"的 HTTP 请求。相反，整个网络请求是在内部模拟的。

测试请求方法返回的不是 `Illuminate\Http\Response` 实例，而是 `Illuminate\Testing\TestResponse` 实例，它提供了[各种有用的断言方法](#available-assertions)，让你可以检查应用的响应：

```php tab=Pest
<?php

test('basic request', function () {
    $response = $this->get('/');

    $response->assertStatus(200);
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * 一个基本的请求测试示例。
     */
    public function test_a_basic_request(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }
}
```

一般来说，你的每个测试只应向你的应用发起一次请求。如果在单个测试方法中执行多个请求，可能会出现意外行为。

> [!NOTE]
> 为了方便，运行测试时 CSRF 中间件会自动禁用。

<a name="customizing-request-headers"></a>
### 自定义请求头

你可以使用 `withHeaders` 方法在请求发送到应用之前自定义请求头。此方法允许你向请求添加任何自定义头：

```php tab=Pest
<?php

test('interacting with headers', function () {
    $response = $this->withHeaders([
        'X-Header' => 'Value',
    ])->post('/user', ['name' => 'Sally']);

    $response->assertStatus(201);
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * 一个基本的函数式测试示例。
     */
    public function test_interacting_with_headers(): void
    {
        $response = $this->withHeaders([
            'X-Header' => 'Value',
        ])->post('/user', ['name' => 'Sally']);

        $response->assertStatus(201);
    }
}
```

<a name="cookies"></a>
### Cookie

你可以使用 `withCookie` 或 `withCookies` 方法在发起请求前设置 cookie 值。`withCookie` 方法接受 cookie 名称和值作为两个参数，而 `withCookies` 方法接受一个名称/值对数组：

```php tab=Pest
<?php

test('interacting with cookies', function () {
    $response = $this->withCookie('color', 'blue')->get('/');

    $response = $this->withCookies([
        'color' => 'blue',
        'name' => 'Taylor',
    ])->get('/');

    //
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_interacting_with_cookies(): void
    {
        $response = $this->withCookie('color', 'blue')->get('/');

        $response = $this->withCookies([
            'color' => 'blue',
            'name' => 'Taylor',
        ])->get('/');

        //
    }
}
```

<a name="session-and-authentication"></a>
### 会话 / 认证

Laravel 提供了几个用于在 HTTP 测试期间与会话交互的辅助方法。首先，你可以使用 `withSession` 方法将会话数据设置为给定的数组。这对于在向应用发起请求之前将会话加载数据非常有用：

```php tab=Pest
<?php

test('interacting with the session', function () {
    $response = $this->withSession(['banned' => false])->get('/');

    //
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_interacting_with_the_session(): void
    {
        $response = $this->withSession(['banned' => false])->get('/');

        //
    }
}
```

Laravel 的会话通常用于维护当前认证用户的状态。因此，`actingAs` 辅助方法提供了一种简单的方法来将给定用户认证为当前用户。例如，我们可以使用[模型工厂](/docs/{{version}}/eloquent-factories)来生成并认证一个用户：

```php tab=Pest
<?php

use App\Models\User;

test('an action that requires authentication', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->withSession(['banned' => false])
        ->get('/');

    //
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_an_action_that_requires_authentication(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->withSession(['banned' => false])
            ->get('/');

        //
    }
}
```

你也可以通过将守卫名称作为第二个参数传递给 `actingAs` 方法来指定应使用哪个守卫来认证给定用户。传递给 `actingAs` 方法的守卫在测试期间也将成为默认守卫：

```php
$this->actingAs($user, 'web');
```

如果你想确保请求是未认证的，可以使用 `actingAsGuest` 方法：

```php
$this->actingAsGuest();
```

<a name="debugging-responses"></a>
### 调试响应

向应用发起测试请求后，可以使用 `dump`、`dumpHeaders` 和 `dumpSession` 方法来检查和调试响应内容：

```php tab=Pest
<?php

test('basic test', function () {
    $response = $this->get('/');

    $response->dump();
    $response->dumpHeaders();
    $response->dumpSession();
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * 一个基本的测试示例。
     */
    public function test_basic_test(): void
    {
        $response = $this->get('/');

        $response->dump();
        $response->dumpHeaders();
        $response->dumpSession();
    }
}
```

或者，你可以使用 `dd`、`ddHeaders`、`ddBody`、`ddJson` 和 `ddSession` 方法来转储响应信息然后停止执行：

```php tab=Pest
<?php

test('basic test', function () {
    $response = $this->get('/');

    $response->dd();
    $response->ddHeaders();
    $response->ddBody();
    $response->ddJson();
    $response->ddSession();
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * 一个基本的测试示例。
     */
    public function test_basic_test(): void
    {
        $response = $this->get('/');

        $response->dd();
        $response->ddHeaders();
        $response->ddBody();
        $response->ddJson();
        $response->ddSession();
    }
}
```

<a name="exception-handling"></a>
### 异常处理

有时你可能需要测试你的应用是否抛出了特定的异常。为此，你可以通过 `Exceptions` 门面"伪造"异常处理器。一旦异常处理器被伪造，你就可以使用 `assertReported` 和 `assertNotReported` 方法对请求期间抛出的异常进行断言：

```php tab=Pest
<?php

use App\Exceptions\InvalidOrderException;
use Illuminate\Support\Facades\Exceptions;

test('exception is thrown', function () {
    Exceptions::fake();

    $response = $this->get('/order/1');

    // 断言抛出了异常...
    Exceptions::assertReported(InvalidOrderException::class);

    // 对异常进行断言...
    Exceptions::assertReported(function (InvalidOrderException $e) {
        return $e->getMessage() === 'The order was invalid.';
    });
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use App\Exceptions\InvalidOrderException;
use Illuminate\Support\Facades\Exceptions;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * 一个基本的测试示例。
     */
    public function test_exception_is_thrown(): void
    {
        Exceptions::fake();

        $response = $this->get('/');

        // 断言抛出了异常...
        Exceptions::assertReported(InvalidOrderException::class);

        // 对异常进行断言...
        Exceptions::assertReported(function (InvalidOrderException $e) {
            return $e->getMessage() === 'The order was invalid.';
        });
    }
}
```

`assertNotReported` 和 `assertNothingReported` 方法可用于断言请求期间未抛出给定的异常或未抛出任何异常：

```php
Exceptions::assertNotReported(InvalidOrderException::class);

Exceptions::assertNothingReported();
```

你可以在发起请求之前调用 `withoutExceptionHandling` 方法来完全禁用给定请求的异常处理：

```php
$response = $this->withoutExceptionHandling()->get('/');
```

此外，如果你希望确保你的应用没有使用 PHP 语言或应用使用的库已弃用的功能，你可以在发起请求之前调用 `withoutDeprecationHandling` 方法。当禁用弃用处理时，弃用警告将被转换为异常，从而导致测试失败：

```php
$response = $this->withoutDeprecationHandling()->get('/');
```

`assertThrows` 方法可用于断言给定闭包内的代码抛出了指定类型的异常：

```php
$this->assertThrows(
    fn () => (new ProcessOrder)->execute(),
    OrderInvalid::class
);
```

如果你想检查并对抛出的异常进行断言，你可以向 `assertThrows` 方法提供一个闭包作为第二个参数：

```php
$this->assertThrows(
    fn () => (new ProcessOrder)->execute(),
    fn (OrderInvalid $e) => $e->orderId() === 123;
);
```

`assertDoesntThrow` 方法可用于断言给定闭包内的代码没有抛出任何异常：

```php
$this->assertDoesntThrow(fn () => (new ProcessOrder)->execute());
```

<a name="testing-json-apis"></a>
## 测试 JSON API

Laravel 还提供了几个用于测试 JSON API 及其响应的辅助方法。例如，`json`、`getJson`、`postJson`、`putJson`、`patchJson`、`deleteJson` 和 `optionsJson` 方法可用于使用各种 HTTP 动词发起 JSON 请求。你还可以轻松地将数据和头传递给这些方法。让我们先编写一个测试，向 `/api/user` 发起 `POST` 请求，并断言返回了预期的 JSON 数据：

```php tab=Pest
<?php

test('making an api request', function () {
    $response = $this->postJson('/api/user', ['name' => 'Sally']);

    $response
        ->assertStatus(201)
        ->assertJson([
            'created' => true,
        ]);
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * 一个基本的函数式测试示例。
     */
    public function test_making_an_api_request(): void
    {
        $response = $this->postJson('/api/user', ['name' => 'Sally']);

        $response
            ->assertStatus(201)
            ->assertJson([
                'created' => true,
            ]);
    }
}
```

此外，JSON 响应数据可以作为响应上的数组变量访问，方便你检查 JSON 响应中返回的单个值：

```php tab=Pest
expect($response['created'])->toBeTrue();
```

```php tab=PHPUnit
$this->assertTrue($response['created']);
```

> [!NOTE]
> `assertJson` 方法将响应转换为数组，以验证给定的数组是否存在于应用返回的 JSON 响应中。因此，如果 JSON 响应中还有其他属性，只要给定的片段存在，此测试仍然会通过。

<a name="verifying-exact-match"></a>
#### 断言精确 JSON 匹配

如前所述，`assertJson` 方法可用于断言 JSON 片段存在于 JSON 响应中。如果你想验证给定的数组与应用返回的 JSON **完全匹配**，则应使用 `assertExactJson` 方法：

```php tab=Pest
<?php

test('asserting an exact json match', function () {
    $response = $this->postJson('/user', ['name' => 'Sally']);

    $response
        ->assertStatus(201)
        ->assertExactJson([
            'created' => true,
        ]);
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * 一个基本的函数式测试示例。
     */
    public function test_asserting_an_exact_json_match(): void
    {
        $response = $this->postJson('/user', ['name' => 'Sally']);

        $response
            ->assertStatus(201)
            ->assertExactJson([
                'created' => true,
            ]);
    }
}
```

<a name="verifying-json-paths"></a>
#### 断言 JSON 路径

如果你希望验证 JSON 响应在指定路径包含给定数据，应使用 `assertJsonPath` 方法：

```php tab=Pest
<?php

test('asserting a json path value', function () {
    $response = $this->postJson('/user', ['name' => 'Sally']);

    $response
        ->assertStatus(201)
        ->assertJsonPath('team.owner.name', 'Darian');
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * 一个基本的函数式测试示例。
     */
    public function test_asserting_a_json_paths_value(): void
    {
        $response = $this->postJson('/user', ['name' => 'Sally']);

        $response
            ->assertStatus(201)
            ->assertJsonPath('team.owner.name', 'Darian');
    }
}
```

`assertJsonPath` 方法也接受一个闭包，可用于动态判断断言是否应通过：

```php
$response->assertJsonPath('team.owner.name', fn (string $name) => strlen($name) >= 3);
```

如果你需要同时断言多个 JSON 路径，可以使用 `assertJsonPaths` 方法。每个路径的预期值也可以是一个闭包：

```php
$response->assertJsonPaths([
    'team.owner.name' => 'Darian',
    'team.owner.email' => fn (string $email) => str($email)->is('*@laravel.com'),
    'team.members.0.name' => 'Sally',
]);
```

你可以使用 `assertJsonMissingPaths` 方法来断言响应中缺少多个 JSON 路径：

```php
$response->assertJsonMissingPaths([
    'team.owner.password',
    'team.members.0.api_token',
]);
```

<a name="fluent-json-testing"></a>
### 流畅的 JSON 测试

Laravel 还提供了一种优雅的方式来流畅地测试你的应用 JSON 响应。首先，向 `assertJson` 方法传递一个闭包。此闭包将接收一个 `Illuminate\Testing\Fluent\AssertableJson` 实例，可用于对你应用返回的 JSON 进行断言。`where` 方法可用于对 JSON 的特定属性进行断言，而 `missing` 方法可用于断言特定属性在 JSON 中不存在：

```php tab=Pest
use Illuminate\Testing\Fluent\AssertableJson;

test('fluent json', function () {
    $response = $this->getJson('/users/1');

    $response
        ->assertJson(fn (AssertableJson $json) =>
            $json->where('id', 1)
                ->where('name', 'Victoria Faith')
                ->where('email', fn (string $email) => str($email)->is('victoria@gmail.com'))
                ->whereNot('status', 'pending')
                ->missing('password')
                ->etc()
        );
});
```

```php tab=PHPUnit
use Illuminate\Testing\Fluent\AssertableJson;

/**
 * 一个基本的函数式测试示例。
 */
public function test_fluent_json(): void
{
    $response = $this->getJson('/users/1');

    $response
        ->assertJson(fn (AssertableJson $json) =>
            $json->where('id', 1)
                ->where('name', 'Victoria Faith')
                ->where('email', fn (string $email) => str($email)->is('victoria@gmail.com'))
                ->whereNot('status', 'pending')
                ->missing('password')
                ->etc()
        );
}
```

#### 理解 `etc` 方法

在上面的例子中，你可能注意到我们在断言链的末尾调用了 `etc` 方法。此方法通知 Laravel JSON 对象上可能还有其他属性。如果未使用 `etc` 方法，则 JSON 对象上存在你未对其做过断言的任何其他属性时，测试将失败。

此行为背后的目的是通过强制你显式对属性进行断言或通过 `etc` 方法显式允许额外的属性，来保护你不会在 JSON 响应中意外暴露敏感信息。

但是，你应注意，在断言链中不包含 `etc` 方法并不能确保额外的属性不会添加到嵌套在 JSON 对象中的数组中。`etc` 方法仅确保在调用 `etc` 方法的嵌套级别上没有额外的属性。

<a name="asserting-json-attribute-presence-and-absence"></a>
#### 断言属性存在 / 不存在

要断言属性存在或不存在，你可以使用 `has` 和 `missing` 方法：

```php
$response->assertJson(fn (AssertableJson $json) =>
    $json->has('data')
        ->missing('message')
);
```

此外，`hasAll` 和 `missingAll` 方法允许同时断言多个属性的存在或不存在：

```php
$response->assertJson(fn (AssertableJson $json) =>
    $json->hasAll(['status', 'data'])
        ->missingAll(['message', 'code'])
);
```

你可以使用 `hasAny` 方法来确定给定属性列表中至少有一个存在：

```php
$response->assertJson(fn (AssertableJson $json) =>
    $json->has('status')
        ->hasAny('data', 'message', 'code')
);
```

<a name="asserting-against-json-collections"></a>
#### 断言 JSON 集合

通常，你的路由将返回包含多个项目的 JSON 响应，例如多个用户：

```php
Route::get('/users', function () {
    return User::all();
});
```

在这些情况下，我们可以使用流畅的 JSON 对象的 `has` 方法对响应中包含的用户进行断言。例如，让我们断言 JSON 响应包含三个用户。接下来，我们将使用 `first` 方法对集合中的第一个用户进行一些断言。`first` 方法接受一个闭包，该闭包接收另一个可断言的 JSON 字符串，我们可以用它来对 JSON 集合中的第一个对象进行断言：

```php
$response
    ->assertJson(fn (AssertableJson $json) =>
        $json->has(3)
            ->first(fn (AssertableJson $json) =>
                $json->where('id', 1)
                    ->where('name', 'Victoria Faith')
                    ->where('email', fn (string $email) => str($email)->is('victoria@gmail.com'))
                    ->missing('password')
                    ->etc()
            )
    );
```

如果你想对 JSON 集合中的每个项目进行相同的断言，可以使用 `each` 方法：

```php
$response
  ->assertJson(fn (AssertableJson $json) =>
      $json->has(3)
          ->each(fn (AssertableJson $json) =>
              $json->whereType('id', 'integer')
                  ->whereType('name', 'string')
                  ->whereType('email', 'string')
                  ->missing('password')
                  ->etc()
          )
  );
```

<a name="scoping-json-collection-assertions"></a>
#### 限定 JSON 集合断言范围

有时，你的应用路由将返回分配了命名键的 JSON 集合：

```php
Route::get('/users', function () {
    return [
        'meta' => [...],
        'users' => User::all(),
    ];
})
```

在测试这些路由时，你可以使用 `has` 方法对集合中的项目数进行断言。此外，你可以使用 `has` 方法来限定一系列断言的范围：

```php
$response
    ->assertJson(fn (AssertableJson $json) =>
        $json->has('meta')
            ->has('users', 3)
            ->has('users.0', fn (AssertableJson $json) =>
                $json->where('id', 1)
                    ->where('name', 'Victoria Faith')
                    ->where('email', fn (string $email) => str($email)->is('victoria@gmail.com'))
                    ->missing('password')
                    ->etc()
            )
    );
```

但是，与其进行两次单独的 `has` 方法调用来断言 `users` 集合，不如进行一次调用，将闭包作为其第三个参数。这样做时，闭包将自动被调用并限定到集合中的第一个项目：

```php
$response
    ->assertJson(fn (AssertableJson $json) =>
        $json->has('meta')
            ->has('users', 3, fn (AssertableJson $json) =>
                $json->where('id', 1)
                    ->where('name', 'Victoria Faith')
                    ->where('email', fn (string $email) => str($email)->is('victoria@gmail.com'))
                    ->missing('password')
                    ->etc()
            )
    );
```

<a name="asserting-json-types"></a>
#### 断言 JSON 类型

你可能只想断言 JSON 响应中的属性是某种类型。`Illuminate\Testing\Fluent\AssertableJson` 类提供了 `whereType` 和 `whereAllType` 方法来实现这一点：

```php
$response->assertJson(fn (AssertableJson $json) =>
    $json->whereType('id', 'integer')
        ->whereAllType([
            'users.0.name' => 'string',
            'meta' => 'array'
        ])
);
```

你可以使用 `|` 字符指定多种类型，或者向 `whereType` 方法传递一个类型数组作为第二个参数。如果响应值是指定类型中的任何一种，则断言将成功：

```php
$response->assertJson(fn (AssertableJson $json) =>
    $json->whereType('name', 'string|null')
        ->whereType('id', ['string', 'integer'])
);
```

`whereType` 和 `whereAllType` 方法识别以下类型：`string`、`integer`、`double`、`boolean`、`array` 和 `null`。

<a name="testing-file-uploads"></a>
## 测试文件上传

`Illuminate\Http\UploadedFile` 类提供了一个 `fake` 方法，可用于生成用于测试的虚拟文件或图像。这与 `Storage` 门面的 `fake` 方法相结合，大大简化了文件上传的测试。例如，你可以结合这两个功能来轻松测试头像上传表单：

```php tab=Pest
<?php

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('avatars can be uploaded', function () {
    Storage::fake('avatars');

    $file = UploadedFile::fake()->image('avatar.jpg');

    $response = $this->post('/avatar', [
        'avatar' => $file,
    ]);

    Storage::disk('avatars')->assertExists($file->hashName());
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_avatars_can_be_uploaded(): void
    {
        Storage::fake('avatars');

        $file = UploadedFile::fake()->image('avatar.jpg');

        $response = $this->post('/avatar', [
            'avatar' => $file,
        ]);

        Storage::disk('avatars')->assertExists($file->hashName());
    }
}
```

如果你希望断言给定文件不存在，可以使用 `Storage` 门面提供的 `assertMissing` 方法：

```php
Storage::fake('avatars');

// ...

Storage::disk('avatars')->assertMissing('missing.jpg');
```

<a name="fake-file-customization"></a>
#### 虚拟文件自定义

使用 `UploadedFile` 类提供的 `fake` 方法创建文件时，你可以指定图像的宽度、高度和大小（以千字节为单位），以便更好地测试应用的验证规则：

```php
UploadedFile::fake()->image('avatar.jpg', $width, $height)->size(100);
```

除了创建图像，你还可以使用 `create` 方法创建任何其他类型的文件：

```php
UploadedFile::fake()->create('document.pdf', $sizeInKilobytes);
```

如果需要，你可以向该方法传递一个 `$mimeType` 参数，以显式定义文件应返回的 MIME 类型：

```php
UploadedFile::fake()->create(
    'document.pdf', $sizeInKilobytes, 'application/pdf'
);
```

<a name="testing-views"></a>
## 测试视图

Laravel 还允许你在不向应用发起模拟 HTTP 请求的情况下渲染视图。为此，你可以在测试中调用 `view` 方法。`view` 方法接受视图名称和一个可选的数据数组。该方法返回 `Illuminate\Testing\TestView` 的实例，它提供了几种方便的方法来对视图内容进行断言：

```php tab=Pest
<?php

test('a welcome view can be rendered', function () {
    $view = $this->view('welcome', ['name' => 'Taylor']);

    $view->assertSee('Taylor');
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_a_welcome_view_can_be_rendered(): void
    {
        $view = $this->view('welcome', ['name' => 'Taylor']);

        $view->assertSee('Taylor');
    }
}
```

`TestView` 类提供以下断言方法：`assertSee`、`assertSeeInOrder`、`assertSeeText`、`assertSeeTextInOrder`、`assertDontSee` 和 `assertDontSeeText`。

如果需要，你可以通过将 `TestView` 实例转换为字符串来获取原始的渲染视图内容：

```php
$contents = (string) $this->view('welcome');
```

<a name="sharing-errors"></a>
#### 共享错误

某些视图可能依赖于[Laravel 提供的全局错误包](/docs/{{version}}/validation#quick-displaying-the-validation-errors)中共享的错误。要使用错误消息填充错误包，你可以使用 `withViewErrors` 方法：

```php
$view = $this->withViewErrors([
    'name' => ['Please provide a valid name.']
])->view('form');

$view->assertSee('Please provide a valid name.');
```

<a name="rendering-blade-and-components"></a>
### 渲染 Blade 和组件

如有必要，你可以使用 `blade` 方法来评估和渲染原始的 [Blade](/docs/{{version}}/blade) 字符串。与 `view` 方法一样，`blade` 方法返回 `Illuminate\Testing\TestView` 的实例：

```php
$view = $this->blade(
    '<x-component :name="$name" />',
    ['name' => 'Taylor']
);

$view->assertSee('Taylor');
```

你可以使用 `component` 方法来评估和渲染 [Blade 组件](/docs/{{version}}/blade#components)。`component` 方法返回 `Illuminate\Testing\TestComponent` 的实例：

```php
$view = $this->component(Profile::class, ['name' => 'Taylor']);

$view->assertSee('Taylor');
```

<a name="caching-routes"></a>
## 缓存路由

在测试运行之前，Laravel 会启动一个新的应用实例，包括收集所有定义的路由。如果你的应用有很多路由文件，你可能希望将 `Illuminate\Foundation\Testing\WithCachedRoutes` trait 添加到你的测试用例中。在使用此 trait 的测试中，路由会被构建一次并存储在内存中，这意味着路由收集过程仅对所有测试运行一次：

```php tab=Pest
<?php

use App\Http\Controllers\UserController;
use Illuminate\Foundation\Testing\WithCachedRoutes;

pest()->use(WithCachedRoutes::class);

test('basic example', function () {
    $this->get(action([UserController::class, 'index']));

    // ...
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use App\Http\Controllers\UserController;
use Illuminate\Foundation\Testing\WithCachedRoutes;
use Tests\TestCase;

class BasicTest extends TestCase
{
    use WithCachedRoutes;

    /**
     * 一个基本的函数式测试示例。
     */
    public function test_basic_example(): void
    {
        $response = $this->get(action([UserController::class, 'index']));

        // ...
    }
}
```

<a name="available-assertions"></a>
## 可用的断言方法

<a name="response-assertions"></a>
### 响应断言

Laravel 的 `Illuminate\Testing\TestResponse` 类提供了各种自定义断言方法，你可以在测试应用时使用。这些断言可以在 `json`、`get`、`post`、`put` 和 `delete` 测试方法返回的响应上访问：

<style>
    .collection-method-list > p {
        columns: 14.4em 2; -moz-columns: 14.4em 2; -webkit-columns: 14.4em 2;
    }

    .collection-method-list a {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
</style>

<div class="collection-method-list" markdown="1">

[assertAccepted](#assert-accepted)
[assertBadRequest](#assert-bad-request)
[assertClientError](#assert-client-error)
[assertConflict](#assert-conflict)
[assertCookie](#assert-cookie)
[assertCookieExpired](#assert-cookie-expired)
[assertCookieNotExpired](#assert-cookie-not-expired)
[assertCookieMissing](#assert-cookie-missing)
[assertCreated](#assert-created)
[assertDontSee](#assert-dont-see)
[assertDontSeeText](#assert-dont-see-text)
[assertDownload](#assert-download)
[assertExactJson](#assert-exact-json)
[assertExactJsonStructure](#assert-exact-json-structure)
[assertFailedDependency](#assert-failed-dependency)
[assertForbidden](#assert-forbidden)
[assertFound](#assert-found)
[assertGone](#assert-gone)
[assertHeader](#assert-header)
[assertHeaderContains](#assert-header-contains)
[assertHeaderMissing](#assert-header-missing)
[assertInternalServerError](#assert-internal-server-error)
[assertJson](#assert-json)
[assertJsonCount](#assert-json-count)
[assertJsonFragment](#assert-json-fragment)
[assertJsonIsArray](#assert-json-is-array)
[assertJsonIsObject](#assert-json-is-object)
[assertJsonMissing](#assert-json-missing)
[assertJsonMissingExact](#assert-json-missing-exact)
[assertJsonMissingValidationErrors](#assert-json-missing-validation-errors)
[assertJsonPath](#assert-json-path)
[assertJsonPaths](#assert-json-paths)
[assertJsonMissingPath](#assert-json-missing-path)
[assertJsonMissingPaths](#assert-json-missing-paths)
[assertJsonStructure](#assert-json-structure)
[assertJsonValidationErrors](#assert-json-validation-errors)
[assertJsonValidationErrorFor](#assert-json-validation-error-for)
[assertLocation](#assert-location)
[assertMethodNotAllowed](#assert-method-not-allowed)
[assertMovedPermanently](#assert-moved-permanently)
[assertContent](#assert-content)
[assertNoContent](#assert-no-content)
[assertStreamed](#assert-streamed)
[assertStreamedContent](#assert-streamed-content)
[assertNotFound](#assert-not-found)
[assertOk](#assert-ok)
[assertPaymentRequired](#assert-payment-required)
[assertPlainCookie](#assert-plain-cookie)
[assertRedirect](#assert-redirect)
[assertRedirectBack](#assert-redirect-back)
[assertRedirectBackWithErrors](#assert-redirect-back-with-errors)
[assertRedirectBackWithoutErrors](#assert-redirect-back-without-errors)
[assertRedirectContains](#assert-redirect-contains)
[assertRedirectToRoute](#assert-redirect-to-route)
[assertRedirectToSignedRoute](#assert-redirect-to-signed-route)
[assertRequestTimeout](#assert-request-timeout)
[assertSee](#assert-see)
[assertSeeInOrder](#assert-see-in-order)
[assertSeeText](#assert-see-text)
[assertSeeTextInOrder](#assert-see-text-in-order)
[assertServerError](#assert-server-error)
[assertServiceUnavailable](#assert-service-unavailable)
[assertSessionHas](#assert-session-has)
[assertSessionHasInput](#assert-session-has-input)
[assertSessionHasAll](#assert-session-has-all)
[assertSessionHasErrors](#assert-session-has-errors)
[assertSessionHasErrorsIn](#assert-session-has-errors-in)
[assertSessionHasNoErrors](#assert-session-has-no-errors)
[assertSessionDoesntHaveErrors](#assert-session-doesnt-have-errors)
[assertSessionMissing](#assert-session-missing)
[assertSessionMissingInput](#assert-session-missing-input)
[assertStatus](#assert-status)
[assertSuccessful](#assert-successful)
[assertTooManyRequests](#assert-too-many-requests)
[assertUnauthorized](#assert-unauthorized)
[assertUnprocessable](#assert-unprocessable)
[assertUnsupportedMediaType](#assert-unsupported-media-type)
[assertValid](#assert-valid)
[assertInvalid](#assert-invalid)
[assertViewHas](#assert-view-has)
[assertViewHasAll](#assert-view-has-all)
[assertViewIs](#assert-view-is)
[assertViewMissing](#assert-view-missing)

</div>

<a name="assert-accepted"></a>
#### assertAccepted

断言响应具有 accepted（202）HTTP 状态码：

```php
$response->assertAccepted();
```

<a name="assert-bad-request"></a>
#### assertBadRequest

断言响应具有 bad request（400）HTTP 状态码：

```php
$response->assertBadRequest();
```

<a name="assert-client-error"></a>
#### assertClientError

断言响应具有客户端错误（>= 400, < 500）HTTP 状态码：

```php
$response->assertClientError();
```

<a name="assert-conflict"></a>
#### assertConflict

断言响应具有 conflict（409）HTTP 状态码：

```php
$response->assertConflict();
```

<a name="assert-cookie"></a>
#### assertCookie

断言响应包含给定的 cookie：

```php
$response->assertCookie($cookieName, $value = null);
```

<a name="assert-cookie-expired"></a>
#### assertCookieExpired

断言响应包含给定的 cookie 且已过期：

```php
$response->assertCookieExpired($cookieName);
```

<a name="assert-cookie-not-expired"></a>
#### assertCookieNotExpired

断言响应包含给定的 cookie 且未过期：

```php
$response->assertCookieNotExpired($cookieName);
```

<a name="assert-cookie-missing"></a>
#### assertCookieMissing

断言响应不包含给定的 cookie：

```php
$response->assertCookieMissing($cookieName);
```

<a name="assert-created"></a>
#### assertCreated

断言响应具有 201 HTTP 状态码：

```php
$response->assertCreated();
```

<a name="assert-dont-see"></a>
#### assertDontSee

断言给定字符串不包含在应用返回的响应中。除非传递 `false` 作为第二个参数，否则此断言会自动转义给定的字符串：

```php
$response->assertDontSee($value, $escape = true);
```

<a name="assert-dont-see-text"></a>
#### assertDontSeeText

断言给定字符串不包含在响应文本中。除非传递 `false` 作为第二个参数，否则此断言会自动转义给定的字符串。在做出断言之前，此方法会将响应内容传递给 `strip_tags` PHP 函数：

```php
$response->assertDontSeeText($value, $escape = true);
```

<a name="assert-download"></a>
#### assertDownload

断言响应是一个"下载"。通常，这意味着返回响应的调用路由返回了 `Response::download` 响应、`BinaryFileResponse` 或 `Storage::download` 响应：

```php
$response->assertDownload();
```

如果你愿意，可以断言可下载文件被分配了给定的文件名：

```php
$response->assertDownload('image.jpg');
```

<a name="assert-exact-json"></a>
#### assertExactJson

断言响应包含给定 JSON 数据的精确匹配：

```php
$response->assertExactJson(array $data);
```

<a name="assert-exact-json-structure"></a>
#### assertExactJsonStructure

断言响应包含给定 JSON 结构的精确匹配：

```php
$response->assertExactJsonStructure(array $data);
```

此方法是 [assertJsonStructure](#assert-json-structure) 的更严格变体。与 `assertJsonStructure` 相比，如果响应包含未在预期 JSON 结构中显式包含的任何键，此方法将失败。

<a name="assert-failed-dependency"></a>
#### assertFailedDependency

断言响应具有 failed dependency（424）HTTP 状态码：

```php
$response->assertFailedDependency();
```

<a name="assert-forbidden"></a>
#### assertForbidden

断言响应具有 forbidden（403）HTTP 状态码：

```php
$response->assertForbidden();
```

<a name="assert-found"></a>
#### assertFound

断言响应具有 found（302）HTTP 状态码：

```php
$response->assertFound();
```

<a name="assert-gone"></a>
#### assertGone

断言响应具有 gone（410）HTTP 状态码：

```php
$response->assertGone();
```

<a name="assert-header"></a>
#### assertHeader

断言给定的头和值存在于响应中：

```php
$response->assertHeader($headerName, $value = null);
```

<a name="assert-header-contains"></a>
#### assertHeaderContains

断言给定的头包含给定的子字符串值：

```php
$response->assertHeaderContains($headerName, $value);
```

<a name="assert-header-missing"></a>
#### assertHeaderMissing

断言给定的头不存在于响应中：

```php
$response->assertHeaderMissing($headerName);
```

<a name="assert-internal-server-error"></a>
#### assertInternalServerError

断言响应具有"Internal Server Error"（500）HTTP 状态码：

```php
$response->assertInternalServerError();
```

<a name="assert-json"></a>
#### assertJson

断言响应包含给定的 JSON 数据：

```php
$response->assertJson(array $data, $strict = false);
```

`assertJson` 方法将响应转换为数组，以验证给定的数组是否存在于应用返回的 JSON 响应中。因此，如果 JSON 响应中还有其他属性，只要给定的片段存在，此测试仍然会通过。

<a name="assert-json-count"></a>
#### assertJsonCount

断言响应 JSON 在给定键处具有预期数量的项目的数组：

```php
$response->assertJsonCount($count, $key = null);
```

<a name="assert-json-fragment"></a>
#### assertJsonFragment

断言响应在响应中的任何位置包含给定的 JSON 数据：

```php
Route::get('/users', function () {
    return [
        'users' => [
            [
                'name' => 'Taylor Otwell',
            ],
        ],
    ];
});

$response->assertJsonFragment(['name' => 'Taylor Otwell']);
```

<a name="assert-json-is-array"></a>
#### assertJsonIsArray

断言响应 JSON 是一个数组：

```php
$response->assertJsonIsArray();
```

<a name="assert-json-is-object"></a>
#### assertJsonIsObject

断言响应 JSON 是一个对象：

```php
$response->assertJsonIsObject();
```

<a name="assert-json-missing"></a>
#### assertJsonMissing

断言响应不包含给定的 JSON 数据：

```php
$response->assertJsonMissing(array $data);
```

<a name="assert-json-missing-exact"></a>
#### assertJsonMissingExact

断言响应不包含精确的 JSON 数据：

```php
$response->assertJsonMissingExact(array $data);
```

<a name="assert-json-missing-validation-errors"></a>
#### assertJsonMissingValidationErrors

断言响应在给定键上没有 JSON 验证错误：

```php
$response->assertJsonMissingValidationErrors($keys);
```

> [!NOTE]
> 更通用的 [assertValid](#assert-valid) 方法可用于断言响应没有以 JSON 形式返回的验证错误，**并且**没有错误被闪存到会话存储中。

<a name="assert-json-path"></a>
#### assertJsonPath

断言响应在指定路径包含给定的数据：

```php
$response->assertJsonPath($path, $expectedValue);
```

例如，如果你的应用返回以下 JSON 响应：

```json
{
    "user": {
        "name": "Steve Schoger"
    }
}
```

你可以断言 `user` 对象的 `name` 属性与给定值匹配，如下所示：

```php
$response->assertJsonPath('user.name', 'Steve Schoger');
```

<a name="assert-json-paths"></a>
#### assertJsonPaths

断言响应在指定路径包含给定的数据：

```php
$response->assertJsonPaths(array $paths);
```

例如，你可以一次断言响应中的多个值：

```php
$response->assertJsonPaths([
    'user.name' => 'Steve Schoger',
    'user.email' => fn (string $email) => str($email)->endsWith('@laravel.com'),
]);
```

<a name="assert-json-missing-path"></a>
#### assertJsonMissingPath

断言响应不包含给定的路径：

```php
$response->assertJsonMissingPath($path);
```

例如，如果你的应用返回以下 JSON 响应：

```json
{
    "user": {
        "name": "Steve Schoger"
    }
}
```

你可以断言它不包含 `user` 对象的 `email` 属性：

```php
$response->assertJsonMissingPath('user.email');
```

<a name="assert-json-missing-paths"></a>
#### assertJsonMissingPaths

断言响应不包含给定的路径：

```php
$response->assertJsonMissingPaths($paths);
```

例如，你可以断言响应中缺少多个路径：

```php
$response->assertJsonMissingPaths([
    'user.email',
    'user.password',
]);
```

<a name="assert-json-structure"></a>
#### assertJsonStructure

断言响应具有给定的 JSON 结构：

```php
$response->assertJsonStructure(array $structure);
```

例如，如果你的应用返回的 JSON 响应包含以下数据：

```json
{
    "user": {
        "name": "Steve Schoger"
    }
}
```

你可以断言 JSON 结构符合你的期望，如下所示：

```php
$response->assertJsonStructure([
    'user' => [
        'name',
    ]
]);
```

有时，你的应用返回的 JSON 响应可能包含对象数组：

```json
{
    "user": [
        {
            "name": "Steve Schoger",
            "age": 55,
            "location": "Earth"
        },
        {
            "name": "Mary Schoger",
            "age": 60,
            "location": "Earth"
        }
    ]
}
```

在这种情况下，你可以使用 `*` 字符来断言数组中所有对象的结构：

```php
$response->assertJsonStructure([
    'user' => [
        '*' => [
             'name',
             'age',
             'location'
        ]
    ]
]);
```

<a name="assert-json-validation-errors"></a>
#### assertJsonValidationErrors

断言响应在给定键上具有给定的 JSON 验证错误。当验证错误以 JSON 结构返回而不是闪存到会话中时，应使用此方法：

```php
$response->assertJsonValidationErrors(array $data, $responseKey = 'errors');
```

> [!NOTE]
> 更通用的 [assertInvalid](#assert-invalid) 方法可用于断言响应具有以 JSON 形式返回的验证错误，**或者**错误被闪存到会话存储中。

<a name="assert-json-validation-error-for"></a>
#### assertJsonValidationErrorFor

断言响应在给定键上具有任何 JSON 验证错误：

```php
$response->assertJsonValidationErrorFor(string $key, $responseKey = 'errors');
```

<a name="assert-method-not-allowed"></a>
#### assertMethodNotAllowed

断言响应具有 method not allowed（405）HTTP 状态码：

```php
$response->assertMethodNotAllowed();
```

<a name="assert-moved-permanently"></a>
#### assertMovedPermanently

断言响应具有 moved permanently（301）HTTP 状态码：

```php
$response->assertMovedPermanently();
```

<a name="assert-location"></a>
#### assertLocation

断言响应在 `Location` 头中具有给定的 URI 值：

```php
$response->assertLocation($uri);
```

<a name="assert-content"></a>
#### assertContent

断言给定字符串与响应内容匹配：

```php
$response->assertContent($value);
```

<a name="assert-no-content"></a>
#### assertNoContent

断言响应具有给定的 HTTP 状态码且没有内容：

```php
$response->assertNoContent($status = 204);
```

<a name="assert-streamed"></a>
#### assertStreamed

断言响应是一个流式响应：

    $response->assertStreamed();

<a name="assert-streamed-content"></a>
#### assertStreamedContent

断言给定字符串与流式响应内容匹配：

```php
$response->assertStreamedContent($value);
```

<a name="assert-not-found"></a>
#### assertNotFound

断言响应具有 not found（404）HTTP 状态码：

```php
$response->assertNotFound();
```

<a name="assert-ok"></a>
#### assertOk

断言响应具有 200 HTTP 状态码：

```php
$response->assertOk();
```

<a name="assert-payment-required"></a>
#### assertPaymentRequired

断言响应具有 payment required（402）HTTP 状态码：

```php
$response->assertPaymentRequired();
```

<a name="assert-plain-cookie"></a>
#### assertPlainCookie

断言响应包含给定的未加密 cookie：

```php
$response->assertPlainCookie($cookieName, $value = null);
```

<a name="assert-redirect"></a>
#### assertRedirect

断言响应是重定向到给定的 URI：

```php
$response->assertRedirect($uri = null);
```

<a name="assert-redirect-back"></a>
#### assertRedirectBack

断言响应是否重定向回上一页：

```php
$response->assertRedirectBack();
```

<a name="assert-redirect-back-with-errors"></a>
#### assertRedirectBackWithErrors

断言响应是否重定向回上一页并且[会话具有给定的错误](#assert-session-has-errors)：

```php
$response->assertRedirectBackWithErrors(
    array $keys = [], $format = null, $errorBag = 'default'
);
```

<a name="assert-redirect-back-without-errors"></a>
#### assertRedirectBackWithoutErrors

断言响应是否重定向回上一页并且会话不包含任何错误消息：

```php
$response->assertRedirectBackWithoutErrors();
```

<a name="assert-redirect-contains"></a>
#### assertRedirectContains

断言响应是否重定向到包含给定字符串的 URI：

```php
$response->assertRedirectContains($string);
```

<a name="assert-redirect-to-route"></a>
#### assertRedirectToRoute

断言响应是重定向到给定的[命名路由](/docs/{{version}}/routing#named-routes)：

```php
$response->assertRedirectToRoute($name, $parameters = []);
```

<a name="assert-redirect-to-signed-route"></a>
#### assertRedirectToSignedRoute

断言响应是重定向到给定的[签名路由](/docs/{{version}}/urls#signed-urls)：

```php
$response->assertRedirectToSignedRoute($name = null, $parameters = []);
```

<a name="assert-request-timeout"></a>
#### assertRequestTimeout

断言响应具有 request timeout（408）HTTP 状态码：

```php
$response->assertRequestTimeout();
```

<a name="assert-see"></a>
#### assertSee

断言给定字符串包含在响应中。除非传递 `false` 作为第二个参数，否则此断言会自动转义给定的字符串：

```php
$response->assertSee($value, $escape = true);
```

<a name="assert-see-in-order"></a>
#### assertSeeInOrder

断言给定的字符串按顺序包含在响应中。除非传递 `false` 作为第二个参数，否则此断言会自动转义给定的字符串：

```php
$response->assertSeeInOrder(array $values, $escape = true);
```

<a name="assert-see-text"></a>
#### assertSeeText

断言给定字符串包含在响应文本中。除非传递 `false` 作为第二个参数，否则此断言会自动转义给定的字符串。在做出断言之前，响应内容将传递给 `strip_tags` PHP 函数：

```php
$response->assertSeeText($value, $escape = true);
```

<a name="assert-see-text-in-order"></a>
#### assertSeeTextInOrder

断言给定的字符串按顺序包含在响应文本中。除非传递 `false` 作为第二个参数，否则此断言会自动转义给定的字符串。在做出断言之前，响应内容将传递给 `strip_tags` PHP 函数：

```php
$response->assertSeeTextInOrder(array $values, $escape = true);
```

<a name="assert-server-error"></a>
#### assertServerError

断言响应具有服务器错误（>= 500, < 600）HTTP 状态码：

```php
$response->assertServerError();
```

<a name="assert-service-unavailable"></a>
#### assertServiceUnavailable

断言响应具有"Service Unavailable"（503）HTTP 状态码：

```php
$response->assertServiceUnavailable();
```

<a name="assert-session-has"></a>
#### assertSessionHas

断言会话包含给定的数据片段：

```php
$response->assertSessionHas($key, $value = null);
```

如果需要，可以向 `assertSessionHas` 方法提供一个闭包作为第二个参数。如果闭包返回 `true`，则断言通过：

```php
$response->assertSessionHas($key, function (User $value) {
    return $value->name === 'Taylor Otwell';
});
```

<a name="assert-session-has-input"></a>
#### assertSessionHasInput

断言会话在[闪存输入数组](/docs/{{version}}/responses#redirecting-with-flashed-session-data)中具有给定值：

```php
$response->assertSessionHasInput($key, $value = null);
```

如果需要，可以向 `assertSessionHasInput` 方法提供一个闭包作为第二个参数。如果闭包返回 `true`，则断言通过：

```php
use Illuminate\Support\Facades\Crypt;

$response->assertSessionHasInput($key, function (string $value) {
    return Crypt::decryptString($value) === 'secret';
});
```

<a name="assert-session-has-all"></a>
#### assertSessionHasAll

断言会话包含给定的键/值对数组：

```php
$response->assertSessionHasAll(array $data);
```

例如，如果你的应用会话包含 `name` 和 `status` 键，你可以断言两者都存在并具有指定的值，如下所示：

```php
$response->assertSessionHasAll([
    'name' => 'Taylor Otwell',
    'status' => 'active',
]);
```

<a name="assert-session-has-errors"></a>
#### assertSessionHasErrors

断言会话包含给定 `$keys` 的错误。如果 `$keys` 是关联数组，则断言会话包含每个字段（键）的特定错误消息（值）。当测试将验证错误闪存到会话而不是以 JSON 结构返回的路由时，应使用此方法：

```php
$response->assertSessionHasErrors(
    array $keys = [], $format = null, $errorBag = 'default'
);
```

例如，要断言 `name` 和 `email` 字段具有闪存到会话中的验证错误消息，你可以像这样调用 `assertSessionHasErrors` 方法：

```php
$response->assertSessionHasErrors(['name', 'email']);
```

或者，你可以断言给定字段具有特定的验证错误消息：

```php
$response->assertSessionHasErrors([
    'name' => 'The given name was invalid.'
]);
```

> [!NOTE]
> 更通用的 [assertInvalid](#assert-invalid) 方法可用于断言响应具有以 JSON 形式返回的验证错误，**或者**错误被闪存到会话存储中。

<a name="assert-session-has-errors-in"></a>
#### assertSessionHasErrorsIn

断言会话在特定的[错误包](/docs/{{version}}/validation#named-error-bags)内包含给定 `$keys` 的错误。如果 `$keys` 是关联数组，则断言会话在错误包中包含每个字段（键）的特定错误消息（值）：

```php
$response->assertSessionHasErrorsIn($errorBag, $keys = [], $format = null);
```

<a name="assert-session-has-no-errors"></a>
#### assertSessionHasNoErrors

断言会话没有验证错误：

```php
$response->assertSessionHasNoErrors();
```

<a name="assert-session-doesnt-have-errors"></a>
#### assertSessionDoesntHaveErrors

断言会话在给定键上没有验证错误：

```php
$response->assertSessionDoesntHaveErrors($keys = [], $format = null, $errorBag = 'default');
```

> [!NOTE]
> 更通用的 [assertValid](#assert-valid) 方法可用于断言响应没有以 JSON 形式返回的验证错误，**并且**没有错误被闪存到会话存储中。

<a name="assert-session-missing"></a>
#### assertSessionMissing

断言会话不包含给定的键：

```php
$response->assertSessionMissing($key);
```

<a name="assert-session-missing-input"></a>
#### assertSessionMissingInput

断言会话在闪存输入数组中缺少给定的输入键：

```php
$response->assertSessionMissingInput($key);
```

<a name="assert-status"></a>
#### assertStatus

断言响应具有给定的 HTTP 状态码：

```php
$response->assertStatus($code);
```

<a name="assert-successful"></a>
#### assertSuccessful

断言响应具有成功的（>= 200 且 < 300）HTTP 状态码：

```php
$response->assertSuccessful();
```

<a name="assert-too-many-requests"></a>
#### assertTooManyRequests

断言响应具有 too many requests（429）HTTP 状态码：

```php
$response->assertTooManyRequests();
```

<a name="assert-unauthorized"></a>
#### assertUnauthorized

断言响应具有 unauthorized（401）HTTP 状态码：

```php
$response->assertUnauthorized();
```

<a name="assert-unprocessable"></a>
#### assertUnprocessable

断言响应具有 unprocessable entity（422）HTTP 状态码：

```php
$response->assertUnprocessable();
```

<a name="assert-unsupported-media-type"></a>
#### assertUnsupportedMediaType

断言响应具有 unsupported media type（415）HTTP 状态码：

```php
$response->assertUnsupportedMediaType();
```

<a name="assert-valid"></a>
#### assertValid

断言响应在给定键上没有验证错误。此方法可用于断言响应，其中验证错误以 JSON 结构返回，或者验证错误已闪存到会话中：

```php
// 断言没有验证错误...
$response->assertValid();

// 断言给定键没有验证错误...
$response->assertValid(['name', 'email']);
```

<a name="assert-invalid"></a>
#### assertInvalid

断言响应在给定键上有验证错误。此方法可用于断言响应，其中验证错误以 JSON 结构返回，或者验证错误已闪存到会话中：

```php
$response->assertInvalid(['name', 'email']);
```

你还可以断言给定键具有特定的验证错误消息。这样做时，你可以提供整个消息或消息的一小部分：

```php
$response->assertInvalid([
    'name' => 'The name field is required.',
    'email' => 'valid email address',
]);
```

如果你希望断言给定字段是唯一具有验证错误的字段，可以使用 `assertOnlyInvalid` 方法：

```php
$response->assertOnlyInvalid(['name', 'email']);
```

<a name="assert-view-has"></a>
#### assertViewHas

断言响应视图包含给定的数据片段：

```php
$response->assertViewHas($key, $value = null);
```

向 `assertViewHas` 方法传递一个闭包作为第二个参数，将允许你检查并对特定的视图数据进行断言：

```php
$response->assertViewHas('user', function (User $user) {
    return $user->name === 'Taylor';
});
```

此外，视图数据可以作为响应上的数组变量访问，方便你进行检查：

```php tab=Pest
expect($response['name'])->toBe('Taylor');
```

```php tab=PHPUnit
$this->assertEquals('Taylor', $response['name']);
```

<a name="assert-view-has-all"></a>
#### assertViewHasAll

断言响应视图具有给定的数据列表：

```php
$response->assertViewHasAll(array $data);
```

此方法可用于断言视图仅包含匹配给定键的数据：

```php
$response->assertViewHasAll([
    'name',
    'email',
]);
```

或者，你可以断言视图数据存在并具有特定值：

```php
$response->assertViewHasAll([
    'name' => 'Taylor Otwell',
    'email' => 'taylor@example.com,',
]);
```

<a name="assert-view-is"></a>
#### assertViewIs

断言给定的视图是由路由返回的：

```php
$response->assertViewIs($value);
```

<a name="assert-view-missing"></a>
#### assertViewMissing

断言给定的数据键在应用响应中返回的视图上不可用：

```php
$response->assertViewMissing($key);
```

<a name="authentication-assertions"></a>
### 认证断言

Laravel 还提供了各种认证相关的断言，你可以在应用的功能测试中使用。请注意，这些方法是在测试类本身上调用的，而不是在 `get` 和 `post` 等方法返回的 `Illuminate\Testing\TestResponse` 实例上。

<a name="assert-authenticated"></a>
#### assertAuthenticated

断言用户已认证：

```php
$this->assertAuthenticated($guard = null);
```

<a name="assert-guest"></a>
#### assertGuest

断言用户未认证：

```php
$this->assertGuest($guard = null);
```

<a name="assert-authenticated-as"></a>
#### assertAuthenticatedAs

断言特定用户已认证：

```php
$this->assertAuthenticatedAs($user, $guard = null);
```

<a name="validation-assertions"></a>
## 验证断言

Laravel 提供了两个主要的验证相关断言，你可以用于确保请求中提供的数据有效或无效。

<a name="validation-assert-valid"></a>
#### assertValid

断言响应在给定键上没有验证错误。此方法可用于断言响应，其中验证错误以 JSON 结构返回，或者验证错误已闪存到会话中：

```php
// 断言没有验证错误...
$response->assertValid();

// 断言给定键没有验证错误...
$response->assertValid(['name', 'email']);
```

<a name="validation-assert-invalid"></a>
#### assertInvalid

断言响应在给定键上有验证错误。此方法可用于断言响应，其中验证错误以 JSON 结构返回，或者验证错误已闪存到会话中：

```php
$response->assertInvalid(['name', 'email']);
```

你还可以断言给定键具有特定的验证错误消息。这样做时，你可以提供整个消息或消息的一小部分：

```php
$response->assertInvalid([
    'name' => 'The name field is required.',
    'email' => 'valid email address',
]);
```

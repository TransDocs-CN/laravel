# HTTP 响应

- [创建响应](#creating-responses)
    - [向响应附加标头](#attaching-headers-to-responses)
    - [向响应附加 Cookie](#attaching-cookies-to-responses)
    - [Cookie 和加密](#cookies-and-encryption)
- [重定向](#redirects)
    - [重定向到命名路由](#redirecting-named-routes)
    - [重定向到控制器操作](#redirecting-controller-actions)
    - [重定向到外部域名](#redirecting-external-domains)
    - [使用闪存会话数据重定向](#redirecting-with-flashed-session-data)
- [其他响应类型](#other-response-types)
    - [视图响应](#view-responses)
    - [JSON 响应](#json-responses)
    - [文件下载](#file-downloads)
    - [文件响应](#file-responses)
- [流式响应](#streamed-responses)
    - [消费流式响应](#consuming-streamed-responses)
    - [流式 JSON 响应](#streamed-json-responses)
    - [事件流 (SSE)](#event-streams)
    - [流式下载](#streamed-downloads)
- [响应宏](#response-macros)

<a name="creating-responses"></a>
## 创建响应

<a name="strings-arrays"></a>
#### 字符串和数组

所有路由和控制器都应返回一个响应以发送回用户的浏览器。Laravel 提供了几种不同的方式来返回响应。最基本的响应是从路由或控制器返回一个字符串。框架会自动将字符串转换为完整的 HTTP 响应：

```php
Route::get('/', function () {
    return 'Hello World';
});
```

除了从路由和控制器返回字符串外，你还可以返回数组。框架会自动将数组转换为 JSON 响应：

```php
Route::get('/', function () {
    return [1, 2, 3];
});
```

> [!NOTE]
> 你知道吗，你也可以从路由或控制器返回 [Eloquent 集合](/docs/{{version}}/eloquent-collections)？它们会自动转换为 JSON。试试看！

<a name="response-objects"></a>
#### 响应对象

通常，你不会只从路由操作返回简单的字符串或数组。相反，你将返回完整的 `Illuminate\Http\Response` 实例或[视图](/docs/{{version}}/views)。

返回完整的 `Response` 实例允许你自定义响应的 HTTP 状态码和标头。`Response` 实例继承自 `Symfony\Component\HttpFoundation\Response` 类，该类提供了各种构建 HTTP 响应的方法：

```php
Route::get('/home', function () {
    return response('Hello World', 200)
        ->header('Content-Type', 'text/plain');
});
```

<a name="eloquent-models-and-collections"></a>
#### Eloquent 模型和集合

你也可以直接从路由和控制器返回 [Eloquent ORM](/docs/{{version}}/eloquent) 模型和集合。当你这样做时，Laravel 会自动将模型和集合转换为 JSON 响应，同时尊重模型的[隐藏属性](/docs/{{version}}/eloquent-serialization#hiding-attributes-from-json)：

```php
use App\Models\User;

Route::get('/user/{user}', function (User $user) {
    return $user;
});
```

<a name="attaching-headers-to-responses"></a>
### 向响应附加标头

请记住，大多数响应方法都是可链式调用的，允许流畅地构建响应实例。例如，你可以使用 `header` 方法在将响应发送回用户之前向响应添加一系列标头：

```php
return response($content)
    ->header('Content-Type', $type)
    ->header('X-Header-One', 'Header Value')
    ->header('X-Header-Two', 'Header Value');
```

或者，你可以使用 `withHeaders` 方法指定要添加到响应的标头数组：

```php
return response($content)
    ->withHeaders([
        'Content-Type' => $type,
        'X-Header-One' => 'Header Value',
        'X-Header-Two' => 'Header Value',
    ]);
```

你可以使用 `withoutHeader` 方法从传出响应中移除特定标头：

```php
return response($content)->withoutHeader('X-Debug');

return response($content)->withoutHeader(['X-Debug', 'X-Powered-By']);
```

<a name="cache-control-middleware"></a>
#### 缓存控制中间件

Laravel 包含一个 `cache.headers` 中间件，可用于快速为一组路由设置 `Cache-Control` 标头。指令应使用相应缓存控制指令的"蛇形命名法"等效形式提供，并用分号分隔。如果在指令列表中指定了 `etag`，响应内容的 MD5 哈希将自动设置为 ETag 标识符：

```php
Route::middleware('cache.headers:public;max_age=30;s_maxage=300;stale_while_revalidate=600;etag')->group(function () {
    Route::get('/privacy', function () {
        // ...
    });

    Route::get('/terms', function () {
        // ...
    });
});
```

<a name="attaching-cookies-to-responses"></a>
### 向响应附加 Cookie

你可以使用 `cookie` 方法向传出的 `Illuminate\Http\Response` 实例附加一个 cookie。你应该将名称、值和 cookie 应视为有效的分钟数传递给此方法：

```php
return response('Hello World')->cookie(
    'name', 'value', $minutes
);
```

`cookie` 方法还接受一些不太常用的参数。通常，这些参数具有与 PHP 原生 [setcookie](https://secure.php.net/manual/en/function.setcookie.php) 方法相同的用途和含义：

```php
return response('Hello World')->cookie(
    'name', 'value', $minutes, $path, $domain, $secure, $httpOnly
);
```

如果你希望确保 cookie 随传出响应一起发送，但尚未获得该响应的实例，你可以使用 `Cookie` 门面将 cookie"排队"以在发送时附加到响应。`queue` 方法接受创建 cookie 实例所需的参数。这些 cookie 将在发送到浏览器之前附加到传出响应：

```php
use Illuminate\Support\Facades\Cookie;

Cookie::queue('name', 'value', $minutes);
```

<a name="generating-cookie-instances"></a>
#### 生成 Cookie 实例

如果你想生成一个 `Symfony\Component\HttpFoundation\Cookie` 实例，以便稍后附加到响应实例，你可以使用全局的 `cookie` 辅助函数。此 cookie 不会发送回客户端，除非它被附加到响应实例：

```php
$cookie = cookie('name', 'value', $minutes);

return response('Hello World')->cookie($cookie);
```

<a name="expiring-cookies-early"></a>
#### 提前使 Cookie 过期

你可以通过传出响应的 `withoutCookie` 方法使 cookie 过期来移除它：

```php
return response('Hello World')->withoutCookie('name');
```

如果你还没有传出响应的实例，你可以使用 `Cookie` 门面的 `expire` 方法使 cookie 过期：

```php
Cookie::expire('name');
```

<a name="cookies-and-encryption"></a>
### Cookie 和加密

默认情况下，由于 `Illuminate\Cookie\Middleware\EncryptCookies` 中间件的存在，Laravel 生成的所有 cookie 都经过加密和签名，因此客户端无法修改或读取。如果你希望为应用程序生成的 cookie 子集禁用加密，可以在应用程序的 `bootstrap/app.php` 文件中使用 `encryptCookies` 方法：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->encryptCookies(except: [
        'cookie_name',
    ]);
})
```

> [!NOTE]
> 一般来说，不应禁用 cookie 加密，因为这会使你的 cookie 暴露于潜在的客户端数据暴露和篡改风险。

<a name="redirects"></a>
## 重定向

重定向响应是 `Illuminate\Http\RedirectResponse` 类的实例，包含将用户重定向到另一个 URL 所需的适当标头。有几种方法可以生成 `RedirectResponse` 实例。最简单的方法是使用全局的 `redirect` 辅助函数：

```php
Route::get('/dashboard', function () {
    return redirect('/home/dashboard');
});
```

有时你可能希望将用户重定向到他们之前的位置，例如当提交的表单无效时。你可以使用全局的 `back` 辅助函数来实现。由于此功能利用[会话](/docs/{{version}}/session)，请确保调用 `back` 函数的路由使用 `web` 中间件组：

```php
Route::post('/user/profile', function () {
    // 验证请求...

    return back()->withInput();
});
```

<a name="redirecting-named-routes"></a>
### 重定向到命名路由

当你调用不带参数的 `redirect` 辅助函数时，将返回 `Illuminate\Routing\Redirector` 的一个实例，允许你调用 `Redirector` 实例上的任何方法。例如，要生成到命名路由的 `RedirectResponse`，你可以使用 `route` 方法：

```php
return redirect()->route('login');
```

如果你的路由有参数，你可以将它们作为第二个参数传递给 `route` 方法：

```php
// 对于具有以下 URI 的路由：/profile/{id}

return redirect()->route('profile', ['id' => 1]);
```

<a name="populating-parameters-via-eloquent-models"></a>
#### 通过 Eloquent 模型填充参数

如果你要重定向到具有从 Eloquent 模型填充的"ID"参数的路由，你可以传递模型本身。ID 将被自动提取：

```php
// 对于具有以下 URI 的路由：/profile/{id}

return redirect()->route('profile', [$user]);
```

如果你想自定义放在路由参数中的值，可以在路由参数定义中指定列（`/profile/{id:slug}`），或者覆盖 Eloquent 模型上的 `getRouteKey` 方法：

```php
/**
 * 获取模型路由键的值。
 */
public function getRouteKey(): mixed
{
    return $this->slug;
}
```

<a name="redirecting-controller-actions"></a>
### 重定向到控制器操作

你也可以生成到[控制器操作](/docs/{{version}}/controllers)的重定向。为此，将控制器和操作名称传递给 `action` 方法：

```php
use App\Http\Controllers\UserController;

return redirect()->action([UserController::class, 'index']);
```

如果你的控制器路由需要参数，你可以将它们作为第二个参数传递给 `action` 方法：

```php
return redirect()->action(
    [UserController::class, 'profile'], ['id' => 1]
);
```

<a name="redirecting-external-domains"></a>
### 重定向到外部域名

有时你可能需要重定向到应用程序之外的域名。你可以通过调用 `away` 方法来实现，该方法创建一个没有任何额外 URL 编码、验证或检查的 `RedirectResponse`：

```php
return redirect()->away('https://www.google.com');
```

<a name="redirecting-with-flashed-session-data"></a>
### 使用闪存会话数据重定向

重定向到新 URL 和[将会话数据闪存](/docs/{{version}}/session#flash-data)通常同时进行。通常，这是在成功执行操作后完成的，此时你将成功消息闪存到会话。为方便起见，你可以在一个流畅的方法链中创建 `RedirectResponse` 实例并将数据闪存到会话：

```php
Route::post('/user/profile', function () {
    // ...

    return redirect('/dashboard')->with('status', 'Profile updated!');
});
```

用户被重定向后，你可以从[会话](/docs/{{version}}/session)显示闪存消息。例如，使用 [Blade 语法](/docs/{{version}}/blade)：

```blade
@if (session('status'))
    <div class="alert alert-success">
        {{ session('status') }}
    </div>
@endif
```

<a name="redirecting-with-input"></a>
#### 使用输入重定向

你可以使用 `RedirectResponse` 实例提供的 `withInput` 方法在将用户重定向到新位置之前将当前请求的输入数据闪存到会话。这通常是在用户遇到验证错误时完成的。一旦输入被闪存到会话，你就可以在下一个请求期间轻松[检索它](/docs/{{version}}/requests#retrieving-old-input)以重新填充表单：

```php
return back()->withInput();
```

<a name="other-response-types"></a>
## 其他响应类型

`response` 辅助函数可用于生成其他类型的响应实例。当不带参数调用 `response` 辅助函数时，将返回 `Illuminate\Contracts\Routing\ResponseFactory` [契约](/docs/{{version}}/contracts)的一个实现。此契约提供了几种生成响应的有用方法。

<a name="view-responses"></a>
### 视图响应

如果你需要控制响应的状态和标头，但同时需要返回一个[视图](/docs/{{version}}/views)作为响应的内容，应使用 `view` 方法：

```php
return response()
    ->view('hello', $data, 200)
    ->header('Content-Type', $type);
```

当然，如果你不需要传递自定义 HTTP 状态码或自定义标头，可以使用全局的 `view` 辅助函数。

<a name="json-responses"></a>
### JSON 响应

`json` 方法会自动将 `Content-Type` 标头设置为 `application/json`，并使用 PHP 的 `json_encode` 函数将给定的数组转换为 JSON：

```php
return response()->json([
    'name' => 'Abigail',
    'state' => 'CA',
]);
```

如果你想创建 JSONP 响应，可以将 `json` 方法与 `withCallback` 方法结合使用：

```php
return response()
    ->json(['name' => 'Abigail', 'state' => 'CA'])
    ->withCallback($request->input('callback'));
```

<a name="file-downloads"></a>
### 文件下载

`download` 方法可用于生成强制用户浏览器下载给定路径文件的响应。`download` 方法接受一个文件名作为第二个参数，该参数决定下载文件的用户看到的文件名。最后，你可以将 HTTP 标头数组作为第三个参数传递给该方法：

```php
return response()->download($pathToFile);

return response()->download($pathToFile, $name, $headers);
```

> [!WARNING]
> 管理文件下载的 Symfony HttpFoundation 要求被下载的文件具有 ASCII 文件名。

<a name="file-responses"></a>
### 文件响应

`file` 方法可用于直接在用户的浏览器中显示文件（如图像或 PDF），而不是启动下载。此方法接受文件的绝对路径作为第一个参数，标头数组作为第二个参数：

```php
return response()->file($pathToFile);

return response()->file($pathToFile, $headers);
```

<a name="streamed-responses"></a>
## 流式响应

通过将数据流式传输到客户端，你可以显著减少内存使用并提高性能，特别是对于非常大的响应。流式响应允许客户端在服务器完成发送数据之前开始处理数据：

```php
Route::get('/stream', function () {
    return response()->stream(function (): void {
        foreach (['developer', 'admin'] as $string) {
            echo $string;
            ob_flush();
            flush();
            sleep(2); // 模拟块之间的延迟...
        }
    }, 200, ['X-Accel-Buffering' => 'no']);
});
```

为方便起见，如果你提供给 `stream` 方法的闭包返回一个[生成器](https://www.php.net/manual/en/language.generators.overview.php)，Laravel 将自动在生成器返回的字符串之间刷新输出缓冲区，以及禁用 Nginx 输出缓冲：

```php
Route::post('/chat', function () {
    return response()->stream(function (): Generator {
        $stream = OpenAI::client()->chat()->createStreamed(...);

        foreach ($stream as $response) {
            yield $response->choices[0];
        }
    });
});
```

<a name="consuming-streamed-responses"></a>
### 消费流式响应

流式响应可以使用 Laravel 的 `stream` npm 包来消费，该包提供了与 Laravel 响应和事件流交互的便捷 API。首先，安装 `@laravel/stream-react`、`@laravel/stream-vue` 或 `@laravel/stream-svelte` 包：

```shell tab=React
npm install @laravel/stream-react
```

```shell tab=Vue
npm install @laravel/stream-vue
```

```shell tab=Svelte
npm install @laravel/stream-svelte
```

然后，可以使用 `useStream` 来消费事件流。提供流 URL 后，当内容从 Laravel 应用返回时，该 hook 将自动使用拼接的响应更新 `data`：

```tsx tab=React
import { useStream } from "@laravel/stream-react";

function App() {
    const { data, isFetching, isStreaming, send } = useStream("chat");

    const sendMessage = () => {
        send({
            message: `Current timestamp: ${Date.now()}`,
        });
    };

    return (
        <div>
            <div>{data}</div>
            {isFetching && <div>Connecting...</div>}
            {isStreaming && <div>Generating...</div>}
            <button onClick={sendMessage}>Send Message</button>
        </div>
    );
}
```

```vue tab=Vue
<script setup lang="ts">
import { useStream } from "@laravel/stream-vue";

const { data, isFetching, isStreaming, send } = useStream("chat");

const sendMessage = () => {
    send({
        message: `Current timestamp: ${Date.now()}`,
    });
};
</script>

<template>
    <div>
        <div>{{ data }}</div>
        <div v-if="isFetching">Connecting...</div>
        <div v-if="isStreaming">Generating...</div>
        <button @click="sendMessage">Send Message</button>
    </div>
</template>
```

```svelte tab=Svelte
<script>
import { useStream } from "@laravel/stream-svelte";

const stream = useStream("chat");

const sendMessage = () => {
    stream.send({
        message: `Current timestamp: ${Date.now()}`,
    });
};
</script>

<div>
    <div>{$stream.data}</div>
    {#if $stream.isFetching}
        <div>Connecting...</div>
    {/if}
    {#if $stream.isStreaming}
        <div>Generating...</div>
    {/if}
    <button onclick={sendMessage}>Send Message</button>
</div>
```

当通过 `send` 向流发送数据时，与流的活动连接将在发送新数据之前被取消。所有请求以 JSON `POST` 请求发送。

> [!WARNING]
> 由于 `useStream` hook 向你的应用程序发出 `POST` 请求，因此需要有效的 CSRF 令牌。提供 CSRF 令牌的最简单方法是[通过应用程序布局 `<head>` 中的 meta 标签包含它](/docs/{{version}}/csrf#csrf-x-csrf-token)。

传递给 `useStream` 的第二个参数是一个选项对象，你可以使用它来自定义流消费行为。此对象的默认值如下所示：

```tsx tab=React
import { useStream } from "@laravel/stream-react";

function App() {
    const { data } = useStream("chat", {
        id: undefined,
        initialInput: undefined,
        headers: undefined,
        csrfToken: undefined,
        onResponse: (response: Response) => void,
        onData: (data: string) => void,
        onCancel: () => void,
        onFinish: () => void,
        onError: (error: Error) => void,
    });

    return <div>{data}</div>;
}
```

```vue tab=Vue
<script setup lang="ts">
import { useStream } from "@laravel/stream-vue";

const { data } = useStream("chat", {
    id: undefined,
    initialInput: undefined,
    headers: undefined,
    csrfToken: undefined,
    onResponse: (response: Response) => void,
    onData: (data: string) => void,
    onCancel: () => void,
    onFinish: () => void,
    onError: (error: Error) => void,
});
</script>

<template>
    <div>{{ data }}</div>
</template>
```

```svelte tab=Svelte
<script>
import { useStream } from "@laravel/stream-svelte";

const stream = useStream("chat", {
    id: undefined,
    initialInput: undefined,
    headers: undefined,
    csrfToken: undefined,
    onResponse: (response) => {},
    onData: (data) => {},
    onCancel: () => {},
    onFinish: () => {},
    onError: (error) => {},
});
</script>

<div>{$stream.data}</div>
```

`onResponse` 在从流成功获得初始响应后触发，原始 [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) 被传递给回调。`onData` 在接收到每个数据块时被调用——当前数据块被传递给回调。`onFinish` 在流完成时以及在 fetch/read 循环期间抛出错误时被调用。

默认情况下，初始化时不会向流发出请求。你可以通过使用 `initialInput` 选项向流传递初始负载：

```tsx tab=React
import { useStream } from "@laravel/stream-react";

function App() {
    const { data } = useStream("chat", {
        initialInput: {
            message: "Introduce yourself.",
        },
    });

    return <div>{data}</div>;
}
```

```vue tab=Vue
<script setup lang="ts">
import { useStream } from "@laravel/stream-vue";

const { data } = useStream("chat", {
    initialInput: {
        message: "Introduce yourself.",
    },
});
</script>

<template>
    <div>{{ data }}</div>
</template>
```

```svelte tab=Svelte
<script>
import { useStream } from "@laravel/stream-svelte";

const stream = useStream("chat", {
    initialInput: {
        message: "Introduce yourself.",
    },
});
</script>

<div>{$stream.data}</div>
```

要手动取消流，你可以使用从 hook 返回的 `cancel` 方法：

```tsx tab=React
import { useStream } from "@laravel/stream-react";

function App() {
    const { data, cancel } = useStream("chat");

    return (
        <div>
            <div>{data}</div>
            <button onClick={cancel}>Cancel</button>
        </div>
    );
}
```

```vue tab=Vue
<script setup lang="ts">
import { useStream } from "@laravel/stream-vue";

const { data, cancel } = useStream("chat");
</script>

<template>
    <div>
        <div>{{ data }}</div>
        <button @click="cancel">Cancel</button>
    </div>
</template>
```

```svelte tab=Svelte
<script>
import { useStream } from "@laravel/stream-svelte";

const stream = useStream("chat");
</script>

<div>
    <div>{$stream.data}</div>
    <button onclick={() => stream.cancel()}>Cancel</button>
</div>
```

每次使用 `useStream` hook 时，都会生成一个随机的 `id` 来标识流。这在每次请求的 `X-STREAM-ID` 标头中发送回服务器。当从多个组件消费同一个流时，你可以通过提供你自己的 `id` 来读写流：

```tsx tab=React
// App.tsx
import { useStream } from "@laravel/stream-react";

function App() {
    const { data, id } = useStream("chat");

    return (
        <div>
            <div>{data}</div>
            <StreamStatus id={id} />
        </div>
    );
}

// StreamStatus.tsx
import { useStream } from "@laravel/stream-react";

function StreamStatus({ id }) {
    const { isFetching, isStreaming } = useStream("chat", { id });

    return (
        <div>
            {isFetching && <div>Connecting...</div>}
            {isStreaming && <div>Generating...</div>}
        </div>
    );
}
```

```vue tab=Vue
<!-- App.vue -->
<script setup lang="ts">
import { useStream } from "@laravel/stream-vue";
import StreamStatus from "./StreamStatus.vue";

const { data, id } = useStream("chat");
</script>

<template>
    <div>
        <div>{{ data }}</div>
        <StreamStatus :id="id" />
    </div>
</template>

<!-- StreamStatus.vue -->
<script setup lang="ts">
import { useStream } from "@laravel/stream-vue";

const props = defineProps<{
    id: string;
}>();

const { isFetching, isStreaming } = useStream("chat", { id: props.id });
</script>

<template>
    <div>
        <div v-if="isFetching">Connecting...</div>
        <div v-if="isStreaming">Generating...</div>
    </div>
</template>
```

```svelte tab=Svelte
<!-- App.svelte -->
<script>
import { useStream } from "@laravel/stream-svelte";
import StreamStatus from "./StreamStatus.svelte";

const stream = useStream("chat");
</script>

<div>
    <div>{$stream.data}</div>
    <StreamStatus id={stream.id} />
</div>

<!-- StreamStatus.svelte -->
<script>
import { useStream } from "@laravel/stream-svelte";

let { id } = $props();

const stream = useStream("chat", { id });
</script>

<div>
    {#if $stream.isFetching}
        <div>Connecting...</div>
    {/if}
    {#if $stream.isStreaming}
        <div>Generating...</div>
    {/if}
</div>
```

<a name="streamed-json-responses"></a>
### 流式 JSON 响应

如果你需要增量流式传输 JSON 数据，可以使用 `streamJson` 方法。此方法对于需要以 JS 可解析格式逐步发送到浏览器的大型数据集特别有用：

```php
use App\Models\User;

Route::get('/users.json', function () {
    return response()->streamJson([
        'users' => User::cursor(),
    ]);
});
```

`useJsonStream` hook 与 [useStream hook](#consuming-streamed-responses) 相同，只是它会在流式传输完成后尝试将数据解析为 JSON：

```tsx tab=React
import { useJsonStream } from "@laravel/stream-react";

type User = {
    id: number;
    name: string;
    email: string;
};

function App() {
    const { data, send } = useJsonStream<{ users: User[] }>("users");

    const loadUsers = () => {
        send({
            query: "taylor",
        });
    };

    return (
        <div>
            <ul>
                {data?.users.map((user) => (
                    <li>
                        {user.id}: {user.name}
                    </li>
                ))}
            </ul>
            <button onClick={loadUsers}>Load Users</button>
        </div>
    );
}
```

```vue tab=Vue
<script setup lang="ts">
import { useJsonStream } from "@laravel/stream-vue";

type User = {
    id: number;
    name: string;
    email: string;
};

const { data, send } = useJsonStream<{ users: User[] }>("users");

const loadUsers = () => {
    send({
        query: "taylor",
    });
};
</script>

<template>
    <div>
        <ul>
            <li v-for="user in data?.users" :key="user.id">
                {{ user.id }}: {{ user.name }}
            </li>
        </ul>
        <button @click="loadUsers">Load Users</button>
    </div>
</template>
```

```svelte tab=Svelte
<script>
import { useJsonStream } from "@laravel/stream-svelte";

const stream = useJsonStream("users");

const loadUsers = () => {
    stream.send({
        query: "taylor",
    });
};
</script>

<div>
    <ul>
        {#if $stream.data?.users}
            {#each $stream.data.users as user (user.id)}
                <li>{user.id}: {user.name}</li>
            {/each}
        {/if}
    </ul>
    <button onclick={loadUsers}>Load Users</button>
</div>
```

<a name="event-streams"></a>
### 事件流 (SSE)

`eventStream` 方法可用于使用 `text/event-stream` 内容类型返回服务器发送事件 (SSE) 流式响应。`eventStream` 方法接受一个闭包，该闭包应在响应可用时[生成](https://www.php.net/manual/en/language.generators.overview.php)对流的响应：

```php
Route::get('/chat', function () {
    return response()->eventStream(function () {
        $stream = OpenAI::client()->chat()->createStreamed(...);

        foreach ($stream as $response) {
            yield $response->choices[0];
        }
    });
});
```

如果你想自定义事件的名称，可以生成 `StreamedEvent` 类的实例：

```php
use Illuminate\Http\StreamedEvent;

yield new StreamedEvent(
    event: 'update',
    data: $response->choices[0],
);
```

<a name="consuming-event-streams"></a>
#### 消费事件流

事件流可以使用 Laravel 的 `stream` npm 包来消费，该包提供了与 Laravel 事件流交互的便捷 API。首先，安装 `@laravel/stream-react`、`@laravel/stream-vue` 或 `@laravel/stream-svelte` 包：

```shell tab=React
npm install @laravel/stream-react
```

```shell tab=Vue
npm install @laravel/stream-vue
```

```shell tab=Svelte
npm install @laravel/stream-svelte
```

然后，可以使用 `useEventStream` 来消费事件流。提供流 URL 后，当消息从 Laravel 应用返回时，该 hook 将自动使用拼接的响应更新 `message`：

```jsx tab=React
import { useEventStream } from "@laravel/stream-react";

function App() {
  const { message } = useEventStream("/chat");

  return <div>{message}</div>;
}
```

```vue tab=Vue
<script setup lang="ts">
import { useEventStream } from "@laravel/stream-vue";

const { message } = useEventStream("/chat");
</script>

<template>
  <div>{{ message }}</div>
</template>
```

```svelte tab=Svelte
<script>
import { useEventStream } from "@laravel/stream-svelte";

const eventStream = useEventStream("/chat");
</script>

<div>{$eventStream.message}</div>
```

传递给 `useEventStream` 的第二个参数是一个选项对象，你可以使用它来自定义流消费行为。此对象的默认值如下所示：

```jsx tab=React
import { useEventStream } from "@laravel/stream-react";

function App() {
  const { message } = useEventStream("/stream", {
    eventName: "update",
    onMessage: (message) => {
      //
    },
    onError: (error) => {
      //
    },
    onComplete: () => {
      //
    },
    endSignal: "</stream>",
    glue: " ",
  });

  return <div>{message}</div>;
}
```

```vue tab=Vue
<script setup lang="ts">
import { useEventStream } from "@laravel/stream-vue";

const { message } = useEventStream("/chat", {
  eventName: "update",
  onMessage: (message) => {
    // ...
  },
  onError: (error) => {
    // ...
  },
  onComplete: () => {
    // ...
  },
  endSignal: "</stream>",
  glue: " ",
});
</script>
```

```svelte tab=Svelte
<script>
import { useEventStream } from "@laravel/stream-svelte";

const eventStream = useEventStream("/chat", {
    eventName: "update",
    onMessage: (event) => {
        //
    },
    onError: (error) => {
        //
    },
    onComplete: () => {
        //
    },
    endSignal: "</stream>",
    glue: " ",
    replace: false,
});
</script>
```

事件流也可以通过应用程序前端的 [EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource) 对象手动消费。`eventStream` 方法会在流完成时自动向事件流发送 `</stream>` 更新：

```js
const source = new EventSource('/chat');

source.addEventListener('update', (event) => {
    if (event.data === '</stream>') {
        source.close();

        return;
    }

    console.log(event.data);
});
```

要自定义发送到事件流的最终事件，你可以向 `eventStream` 方法的 `endStreamWith` 参数提供一个 `StreamedEvent` 实例：

```php
return response()->eventStream(function () {
    // ...
}, endStreamWith: new StreamedEvent(event: 'update', data: '</stream>'));
```

<a name="streamed-downloads"></a>
### 流式下载

有时你可能希望将给定操作的字符串响应转换为可下载的响应，而无需将操作内容写入磁盘。你可以在此场景中使用 `streamDownload` 方法。此方法接受一个回调、文件名和可选的标头数组作为参数：

```php
use App\Services\GitHub;

return response()->streamDownload(function () {
    echo GitHub::api('repo')
        ->contents()
        ->readme('laravel', 'laravel')['contents'];
}, 'laravel-readme.md');
```

<a name="response-macros"></a>
## 响应宏

如果你想定义一个可在各种路由和控制器中重复使用的自定义响应，可以在 `Response` 门面上使用 `macro` 方法。通常，你应从应用程序的[服务提供者](/docs/{{version}}/providers)之一的 `boot` 方法中调用此方法，例如 `App\Providers\AppServiceProvider` 服务提供者：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Response;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 引导任何应用程序服务。
     */
    public function boot(): void
    {
        Response::macro('caps', function (string $value) {
            return Response::make(strtoupper($value));
        });
    }
}
```

`macro` 函数接受一个名称作为其第一个参数，一个闭包作为其第二个参数。当从 `ResponseFactory` 实现或 `response` 辅助函数调用宏名称时，将执行宏的闭包：

```php
return response()->caps('foo');
```

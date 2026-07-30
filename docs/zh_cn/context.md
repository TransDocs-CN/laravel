# 上下文

- [简介](#introduction)
    - [工作原理](#how-it-works)
- [捕获上下文](#capturing-context)
    - [堆栈](#stacks)
- [检索上下文](#retrieving-context)
    - [判断条目是否存在](#determining-item-existence)
- [移除上下文](#removing-context)
- [隐藏上下文](#hidden-context)
- [事件](#events)
    - [脱水](#dehydrating)
    - [水化](#hydrated)

<a name="introduction"></a>
## 简介

Laravel 的"上下文"功能使你能够在应用程序执行的请求、任务和命令中捕获、检索和共享信息。这些捕获的信息也会包含在应用程序写入的日志中，让你深入了解日志条目写入之前的代码执行历史，并允许你在分布式系统中跟踪执行流程。

<a name="how-it-works"></a>
### 工作原理

理解 Laravel 上下文功能的最佳方式是通过内置的日志功能来实际体验。首先，你可以使用 `Context` 门面[添加上下文信息](#capturing-context)。在本例中，我们将使用一个[中间件](/docs/{{version}}/middleware)在每个传入请求的上下文中添加请求 URL 和唯一的跟踪 ID：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class AddContext
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        Context::add('url', $request->url());
        Context::add('trace_id', Str::uuid()->toString());

        return $next($request);
    }
}
```

添加到上下文的信息会自动作为元数据附加到整个请求中写入的任何[日志条目](/docs/{{version}}/logging)。将上下文作为元数据附加，可以区分传递给单个日志条目的信息和通过 `Context` 共享的信息。例如，假设我们写入以下日志条目：

```php
Log::info('User authenticated.', ['auth_id' => Auth::id()]);
```

写入的日志将包含传递给日志条目的 `auth_id`，但也会包含上下文的 `url` 和 `trace_id` 作为元数据：

```text
User authenticated. {"auth_id":27} {"url":"https://example.com/login","trace_id":"e04e1a11-e75c-4db3-b5b5-cfef4ef56697"}
```

添加到上下文的信息也可用于分派到队列的任务。例如，假设我们在向上下文添加一些信息后，将一个 `ProcessPodcast` 任务分派到队列：

```php
// In our middleware...
Context::add('url', $request->url());
Context::add('trace_id', Str::uuid()->toString());

// In our controller...
ProcessPodcast::dispatch($podcast);
```

当任务被分派时，当前存储在上下文中的任何信息都会被捕获并与任务共享。然后，在任务执行期间，这些捕获的信息会被重新水化回当前上下文。因此，如果我们的任务的 handle 方法写入日志：

```php
class ProcessPodcast implements ShouldQueue
{
    use Queueable;

    // ...

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info('Processing podcast.', [
            'podcast_id' => $this->podcast->id,
        ]);

        // ...
    }
}
```

生成的日志条目将包含在原始分派任务的请求期间添加到上下文的信息：

```text
Processing podcast. {"podcast_id":95} {"url":"https://example.com/login","trace_id":"e04e1a11-e75c-4db3-b5b5-cfef4ef56697"}
```

虽然我们主要关注了 Laravel 上下文的内置日志相关功能，但以下文档将说明上下文如何让你在 HTTP 请求/队列任务边界之间共享信息，甚至如何添加不会写入日志条目的[隐藏上下文数据](#hidden-context)。

<a name="capturing-context"></a>
## 捕获上下文

你可以使用 `Context` 门面的 `add` 方法在当前上下文中存储信息：

```php
use Illuminate\Support\Facades\Context;

Context::add('key', 'value');
```

要一次添加多个条目，你可以向 `add` 方法传递一个关联数组：

```php
Context::add([
    'first_key' => 'value',
    'second_key' => 'value',
]);
```

`add` 方法将覆盖任何具有相同键的现有值。如果你只想在键不存在的情况下才向上下文添加信息，可以使用 `addIf` 方法：

```php
Context::add('key', 'first');

Context::get('key');
// "first"

Context::addIf('key', 'second');

Context::get('key');
// "first"
```

上下文还提供了方便的方法来递增或递减给定键。这两个方法都至少接受一个参数：要跟踪的键。可以提供第二个参数来指定键应递增或递减的量：

```php
Context::increment('records_added');
Context::increment('records_added', 5);

Context::decrement('records_added');
Context::decrement('records_added', 5);
```

<a name="conditional-context"></a>
#### 条件上下文

`when` 方法可用于根据给定条件向上下文添加数据。提供给 `when` 方法的第一个闭包将在给定条件评估为 `true` 时被调用，而第二个闭包将在条件评估为 `false` 时被调用：

```php
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Context;

Context::when(
    Auth::user()->isAdmin(),
    fn ($context) => $context->add('permissions', Auth::user()->permissions),
    fn ($context) => $context->add('permissions', []),
);
```

<a name="scoped-context"></a>
#### 作用域上下文

`scope` 方法提供了一种在给定回调执行期间临时修改上下文的方法，并在回调执行完成后将上下文恢复为其原始状态。此外，你可以在闭包执行期间传递额外的数据（作为第二和第三个参数）以合并到上下文中。

```php
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Facades\Log;

Context::add('trace_id', 'abc-999');
Context::addHidden('user_id', 123);

Context::scope(
    function () {
        Context::add('action', 'adding_friend');

        $userId = Context::getHidden('user_id');

        Log::debug("Adding user [{$userId}] to friends list.");
        // Adding user [987] to friends list.  {"trace_id":"abc-999","user_name":"taylor_otwell","action":"adding_friend"}
    },
    data: ['user_name' => 'taylor_otwell'],
    hidden: ['user_id' => 987],
);

Context::all();
// [
//     'trace_id' => 'abc-999',
// ]

Context::allHidden();
// [
//     'user_id' => 123,
// ]
```

> [!WARNING]
> 如果上下文中的对象在作用域闭包内被修改，该变更将反映到作用域之外。

<a name="stacks"></a>
### 堆栈

上下文提供了创建"堆栈"的能力，这些堆栈是按添加顺序存储的数据列表。你可以通过调用 `push` 方法向堆栈添加信息：

```php
use Illuminate\Support\Facades\Context;

Context::push('breadcrumbs', 'first_value');

Context::push('breadcrumbs', 'second_value', 'third_value');

Context::get('breadcrumbs');
// [
//     'first_value',
//     'second_value',
//     'third_value',
// ]
```

堆栈对于捕获请求的历史信息非常有用，例如应用程序中正在发生的事件。例如，你可以创建一个事件监听器，在每次执行查询时向堆栈推送信息，将查询 SQL 和持续时间作为元组捕获：

```php
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Facades\DB;

// In AppServiceProvider.php...
DB::listen(function ($event) {
    Context::push('queries', [$event->time, $event->sql]);
});
```

你可以使用 `stackContains` 和 `hiddenStackContains` 方法确定堆栈中是否包含某个值：

```php
if (Context::stackContains('breadcrumbs', 'first_value')) {
    //
}

if (Context::hiddenStackContains('secrets', 'first_value')) {
    //
}
```

`stackContains` 和 `hiddenStackContains` 方法也接受一个闭包作为第二个参数，允许更灵活地控制值的比较操作：

```php
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Str;

return Context::stackContains('breadcrumbs', function ($value) {
    return Str::startsWith($value, 'query_');
});
```

<a name="retrieving-context"></a>
## 检索上下文

你可以使用 `Context` 门面的 `get` 方法从上下文中检索信息：

```php
use Illuminate\Support\Facades\Context;

$value = Context::get('key');
```

`only` 和 `except` 方法可用于检索上下文中的部分信息：

```php
$data = Context::only(['first_key', 'second_key']);

$data = Context::except(['first_key']);
```

`pull` 方法可用于从上下文中检索信息并立即将其从上下文中移除：

```php
$value = Context::pull('key');
```

如果上下文数据存储在[堆栈](#stacks)中，你可以使用 `pop` 方法从堆栈中弹出条目：

```php
Context::push('breadcrumbs', 'first_value', 'second_value');

Context::pop('breadcrumbs');
// second_value

Context::get('breadcrumbs');
// ['first_value']
```

`remember` 和 `rememberHidden` 方法可用于从上下文中检索信息，同时如果请求的信息不存在，则将上下文值设置为给定闭包返回的值：

```php
$permissions = Context::remember(
    'user-permissions',
    fn () => $user->permissions,
);
```

如果你希望检索上下文中存储的所有信息，可以调用 `all` 方法：

```php
$data = Context::all();
```

<a name="determining-item-existence"></a>
### 判断条目是否存在

你可以使用 `has` 和 `missing` 方法判断上下文是否为给定键存储了任何值：

```php
use Illuminate\Support\Facades\Context;

if (Context::has('key')) {
    // ...
}

if (Context::missing('key')) {
    // ...
}
```

无论存储的值是什么，`has` 方法都将返回 `true`。因此，例如，值为 `null` 的键将被视为存在：

```php
Context::add('key', null);

Context::has('key');
// true
```

<a name="removing-context"></a>
## 移除上下文

`forget` 方法可用于从当前上下文中移除键及其值：

```php
use Illuminate\Support\Facades\Context;

Context::add(['first_key' => 1, 'second_key' => 2]);

Context::forget('first_key');

Context::all();

// ['second_key' => 2]
```

你可以通过向 `forget` 方法提供一个数组来一次忘记多个键：

```php
Context::forget(['first_key', 'second_key']);
```

<a name="hidden-context"></a>
## 隐藏上下文

上下文提供了存储"隐藏"数据的能力。这些隐藏信息不会附加到日志中，也无法通过上述的数据检索方法访问。上下文提供了一组不同的方法与隐藏的上下文信息交互：

```php
use Illuminate\Support\Facades\Context;

Context::addHidden('key', 'value');

Context::getHidden('key');
// 'value'

Context::get('key');
// null
```

"隐藏"方法镜像了上述非隐藏方法的功能：

```php
Context::addHidden(/* ... */);
Context::addHiddenIf(/* ... */);
Context::pushHidden(/* ... */);
Context::getHidden(/* ... */);
Context::pullHidden(/* ... */);
Context::popHidden(/* ... */);
Context::onlyHidden(/* ... */);
Context::exceptHidden(/* ... */);
Context::allHidden(/* ... */);
Context::hasHidden(/* ... */);
Context::missingHidden(/* ... */);
Context::forgetHidden(/* ... */);
```

<a name="events"></a>
## 事件

上下文会分派两个事件，允许你介入上下文的脱水和补水过程。

为了说明如何使用这些事件，假设在应用程序的中间件中，你根据传入的 HTTP 请求的 `Accept-Language` 标头设置了 `app.locale` 配置值。上下文的事件允许你在请求期间捕获此值并在队列中恢复它，确保队列上发送的通知具有正确的 `app.locale` 值。我们可以使用上下文的事件和[隐藏](#hidden-context)数据来实现这一点，以下文档将对此进行说明。

<a name="dehydrating"></a>
### 脱水

每当任务被分派到队列时，上下文中的数据就会被"脱水"并捕获到任务的负载中。`Context::dehydrating` 方法允许你注册一个将在脱水过程中调用的闭包。在此闭包中，你可以对将与队列任务共享的数据进行更改。

通常，你应该在应用程序的 `AppServiceProvider` 类的 `boot` 方法中注册 `dehydrating` 回调：

```php
use Illuminate\Log\Context\Repository;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Context;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Context::dehydrating(function (Repository $context) {
        $context->addHidden('locale', Config::get('app.locale'));
    });
}
```

> [!NOTE]
> 你不应在 `dehydrating` 回调中使用 `Context` 门面，因为这会改变当前进程的上下文。确保你只对传递给回调的仓库进行更改。

<a name="hydrated"></a>
### 水化

每当队列上的任务开始执行时，与该任务共享的任何上下文都将被"水化"回当前上下文。`Context::hydrated` 方法允许你注册一个将在水化过程中调用的闭包。

通常，你应该在应用程序的 `AppServiceProvider` 类的 `boot` 方法中注册 `hydrated` 回调：

```php
use Illuminate\Log\Context\Repository;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Context;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Context::hydrated(function (Repository $context) {
        if ($context->hasHidden('locale')) {
            Config::set('app.locale', $context->getHidden('locale'));
        }
    });
}
```

> [!NOTE]
> 你不应在 `hydrated` 回调中使用 `Context` 门面，而应确保只对传递给回调的仓库进行更改。

# 频率限制

- [简介](#introduction)
    - [缓存配置](#cache-configuration)
- [基本用法](#basic-usage)
    - [手动递增尝试次数](#manually-incrementing-attempts)
    - [清除尝试次数](#clearing-attempts)

<a name="introduction"></a>
## 简介

Laravel 包含一个易于使用的频率限制抽象层，它与应用程序的[缓存](cache)结合使用，提供了一种在指定时间窗口内限制任何操作的简单方法。

> [!NOTE]
> 如果你对限制传入 HTTP 请求的频率感兴趣，请查阅[频率限制中间件文档](/docs/{{version}}/routing#rate-limiting)。

<a name="cache-configuration"></a>
### 缓存配置

通常，频率限制器使用应用程序 `cache` 配置文件中由 `default` 键定义的默认应用程序缓存。但是，你可以通过在应用程序的 `cache` 配置文件中定义一个 `limiter` 键来指定频率限制器应使用的缓存驱动：

```php
'default' => env('CACHE_STORE', 'database'),

'limiter' => 'redis', // [tl! add]
```

<a name="basic-usage"></a>
## 基本用法

`Illuminate\Support\Facades\RateLimiter` 门面可用于与频率限制器交互。频率限制器提供的最简单方法是 `attempt` 方法，它在给定的秒数内限制给定回调的频率。

当回调没有剩余可用尝试次数时，`attempt` 方法返回 `false`；否则，`attempt` 方法将返回回调的结果或 `true`。`attempt` 方法接受的第一个参数是频率限制器"键"，它可以是任何代表被限制频率的操作的字符串：

```php
use Illuminate\Support\Facades\RateLimiter;

$executed = RateLimiter::attempt(
    'send-message:'.$user->id,
    $perMinute = 5,
    function() {
        // 发送消息...
    }
);

if (! $executed) {
    return '发送消息过于频繁！';
}
```

如果需要，你可以为 `attempt` 方法提供第四个参数，即"衰减率"，或可用尝试次数重置的秒数。例如，我们可以修改上面的示例，允许每两分钟尝试五次：

```php
$executed = RateLimiter::attempt(
    'send-message:'.$user->id,
    $perTwoMinutes = 5,
    function() {
        // 发送消息...
    },
    $decayRate = 120,
);
```

<a name="manually-incrementing-attempts"></a>
### 手动递增尝试次数

如果你想手动与频率限制器交互，还有多种其他方法可用。例如，你可以调用 `tooManyAttempts` 方法来确定给定的频率限制器键是否已超过每分钟允许的最大尝试次数：

```php
use Illuminate\Support\Facades\RateLimiter;

if (RateLimiter::tooManyAttempts('send-message:'.$user->id, $perMinute = 5)) {
    return '尝试次数过多！';
}

RateLimiter::increment('send-message:'.$user->id);

// 发送消息...
```

在限制可能接收许多并发请求的端点时，你可能希望检查 `increment` 方法返回的值，而不是将 `tooManyAttempts` 和 `increment` 作为单独的操作使用。使用 `redis`、`memcached` 或 `database` 缓存存储时，此值会自动递增，确保每个并发请求获得唯一的计数：

```php
use Illuminate\Support\Facades\RateLimiter;

$perMinute = 5;

if (RateLimiter::increment('send-message:'.$user->id) > $perMinute) {
    return '尝试次数过多！';
}

// 发送消息...
```

或者，你可以使用 `remaining` 方法来检索给定键的剩余尝试次数。如果给定键还有剩余尝试次数，你可以调用 `increment` 方法来增加总尝试次数：

```php
use Illuminate\Support\Facades\RateLimiter;

if (RateLimiter::remaining('send-message:'.$user->id, $perMinute = 5)) {
    RateLimiter::increment('send-message:'.$user->id);

    // 发送消息...
}
```

如果你想将给定频率限制器键的值递增超过一，可以向 `increment` 方法提供所需的数量：

```php
RateLimiter::increment('send-message:'.$user->id, amount: 5);
```

<a name="determining-limiter-availability"></a>
#### 确定限制器可用性

当某个键没有剩余尝试次数时，`availableIn` 方法会返回直到有更多尝试次数可用的剩余秒数：

```php
use Illuminate\Support\Facades\RateLimiter;

if (RateLimiter::tooManyAttempts('send-message:'.$user->id, $perMinute = 5)) {
    $seconds = RateLimiter::availableIn('send-message:'.$user->id);

    return '你可以在 '.$seconds.' 秒后重试。';
}

RateLimiter::increment('send-message:'.$user->id);

// 发送消息...
```

<a name="clearing-attempts"></a>
### 清除尝试次数

你可以使用 `clear` 方法重置给定频率限制器键的尝试次数。例如，当给定消息被接收者阅读时，你可以重置尝试次数：

```php
use App\Models\Message;
use Illuminate\Support\Facades\RateLimiter;

/**
 * 将消息标记为已读。
 */
public function read(Message $message): Message
{
    $message->markAsRead();

    RateLimiter::clear('send-message:'.$message->user_id);

    return $message;
}
```

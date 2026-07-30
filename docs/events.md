# 事件

- [简介](#introduction)
- [生成事件和监听器](#generating-events-and-listeners)
- [注册事件和监听器](#registering-events-and-listeners)
    - [事件发现](#event-discovery)
    - [手动注册事件](#manually-registering-events)
    - [闭包监听器](#closure-listeners)
- [定义事件](#defining-events)
- [定义监听器](#defining-listeners)
- [队列事件监听器](#queued-event-listeners)
    - [手动与队列交互](#manually-interacting-with-the-queue)
    - [队列事件监听器和数据库事务](#queued-event-listeners-and-database-transactions)
    - [队列监听器中间件](#queued-listener-middleware)
    - [加密的队列监听器](#encrypted-queued-listeners)
    - [唯一事件监听器](#unique-event-listeners)
        - [保持监听器唯一直到处理开始](#keeping-listeners-unique-until-processing-begins)
        - [唯一监听器锁](#unique-listener-locks)
    - [处理失败的任务](#handling-failed-jobs)
- [分发事件](#dispatching-events)
    - [在数据库事务后分发事件](#dispatching-events-after-database-transactions)
    - [延迟事件](#deferring-events)
- [事件订阅者](#event-subscribers)
    - [编写事件订阅者](#writing-event-subscribers)
    - [注册事件订阅者](#registering-event-subscribers)
- [测试](#testing)
    - [伪造事件子集](#faking-a-subset-of-events)
    - [作用域事件伪造](#scoped-event-fakes)

<a name="introduction"></a>
## 简介

Laravel 的事件提供了一个简单的观察者模式实现，允许你订阅和监听应用中发生的各种事件。事件类通常存储在 `app/Events` 目录中，而它们的监听器存储在 `app/Listeners` 中。如果你在应用中看不到这些目录，不用担心，当你在使用 Artisan 控制台命令生成事件和监听器时，它们会被自动创建。

事件是解耦应用各个方面的绝佳方式，因为单个事件可以有多个不相互依赖的监听器。例如，每次订单发货时，你可能希望向用户发送 Slack 通知。你可以触发一个 `App\Events\OrderShipped` 事件，监听器接收该事件并使用它来发送 Slack 通知，而无需将订单处理代码与 Slack 通知代码耦合在一起。

<a name="generating-events-and-listeners"></a>
## 生成事件和监听器

要快速生成事件和监听器，你可以使用 `make:event` 和 `make:listener` Artisan 命令：

```shell
php artisan make:event PodcastProcessed

php artisan make:listener SendPodcastNotification --event=PodcastProcessed
```

为方便起见，你也可以在没有额外参数的情况下调用 `make:event` 和 `make:listener` Artisan 命令。这样做时，Laravel 会自动提示你输入类名，并在创建监听器时提示它要监听的事件：

```shell
php artisan make:event

php artisan make:listener
```

<a name="registering-events-and-listeners"></a>
## 注册事件和监听器

<a name="event-discovery"></a>
### 事件发现

默认情况下，Laravel 会通过扫描应用的 `Listeners` 目录来自动查找和注册你的事件监听器。当 Laravel 找到任何以 `handle` 或 `__invoke` 开头的监听器类方法时，Laravel 会将这些方法注册为方法签名中类型提示的事件的监听器：

```php
use App\Events\PodcastProcessed;

class SendPodcastNotification
{
    /**
     * Handle the event.
     */
    public function handle(PodcastProcessed $event): void
    {
        // ...
    }
}
```

你可以使用 PHP 的联合类型来监听多个事件：

```php
/**
 * Handle the event.
 */
public function handle(PodcastProcessed|PodcastPublished $event): void
{
    // ...
}
```

如果你计划将监听器存储在不同的目录或多个目录中，你可以使用应用 `bootstrap/app.php` 文件中的 `withEvents` 方法指示 Laravel 扫描这些目录：

```php
->withEvents(discover: [
    __DIR__.'/../app/Domain/Orders/Listeners',
])
```

你可以使用 `*` 字符作为通配符来扫描多个类似的目录中的监听器：

```php
->withEvents(discover: [
    __DIR__.'/../app/Domain/*/Listeners',
])
```

`event:list` 命令可用于列出应用中注册的所有监听器：

```shell
php artisan event:list
```

<a name="event-discovery-in-production"></a>
#### 生产环境中的事件发现

为了提升应用速度，你应该使用 `optimize` 或 `event:cache` Artisan 命令缓存应用中所有监听器的清单。通常，此命令应作为应用[部署流程](/docs/{{version}}/deployment#optimization)的一部分运行。该清单将被框架用于加速事件注册过程。`event:clear` 命令可用于销毁事件缓存。

<a name="dynamic-event-discovery"></a>
#### 动态事件发现

要动态控制是否发现给定的监听器，你可以在监听器类上实现 `ShouldBeDiscovered` 接口并定义一个返回布尔值的 `shouldBeDiscovered` 方法。如果该方法返回 `false`，则该监听器不会在事件发现过程中被注册：

```php
use Illuminate\Contracts\Events\ShouldBeDiscovered;

class SendPodcastNotification implements ShouldBeDiscovered
{
    /**
     * Handle the event.
     */
    public function handle(PodcastProcessed $event): void
    {
        // ...
    }

    /**
     * Determine if the listener should be discovered.
     */
    public static function shouldBeDiscovered(): bool
    {
        return app()->environment('production');
    }
}
```

<a name="manually-registering-events"></a>
### 手动注册事件

使用 `Event` 门面，你可以在应用的 `AppServiceProvider` 的 `boot` 方法中手动注册事件及其对应的监听器：

```php
use App\Domain\Orders\Events\PodcastProcessed;
use App\Domain\Orders\Listeners\SendPodcastNotification;
use Illuminate\Support\Facades\Event;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Event::listen(
        PodcastProcessed::class,
        SendPodcastNotification::class,
    );
}
```

`event:list` 命令可用于列出应用中注册的所有监听器：

```shell
php artisan event:list
```

<a name="closure-listeners"></a>
### 闭包监听器

通常，监听器被定义为类；但是，你也可以在应用的 `AppServiceProvider` 的 `boot` 方法中手动注册基于闭包的事件监听器：

```php
use App\Events\PodcastProcessed;
use Illuminate\Support\Facades\Event;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Event::listen(function (PodcastProcessed $event) {
        // ...
    });
}
```

<a name="queueable-anonymous-event-listeners"></a>
#### 可队列的匿名事件监听器

在注册基于闭包的事件监听器时，你可以将监听器闭包包装在 `Illuminate\Events\queueable` 函数中，以指示 Laravel 使用[队列](/docs/{{version}}/queues)执行该监听器：

```php
use App\Events\PodcastProcessed;
use function Illuminate\Events\queueable;
use Illuminate\Support\Facades\Event;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Event::listen(queueable(function (PodcastProcessed $event) {
        // ...
    }));
}
```

像队列任务一样，你可以使用 `onConnection`、`onQueue` 和 `delay` 方法来自定义队列监听器的执行：

```php
Event::listen(queueable(function (PodcastProcessed $event) {
    // ...
})->onConnection('redis')->onQueue('podcasts')->delay(now()->plus(seconds: 10)));
```

如果你想处理匿名队列监听器失败的情况，你可以在定义 `queueable` 监听器时向 `catch` 方法提供一个闭包。该闭包将接收事件实例和导致监听器失败的 `Throwable` 实例：

```php
use App\Events\PodcastProcessed;
use function Illuminate\Events\queueable;
use Illuminate\Support\Facades\Event;
use Throwable;

Event::listen(queueable(function (PodcastProcessed $event) {
    // ...
})->catch(function (PodcastProcessed $event, Throwable $e) {
    // 队列监听器失败...
}));
```

<a name="wildcard-event-listeners"></a>
#### 通配符事件监听器

你也可以使用 `*` 字符作为通配符参数注册监听器，允许你在同一个监听器上捕获多个事件。通配符监听器接收事件名称作为第一个参数，完整的事件数据数组作为第二个参数：

```php
Event::listen('event.*', function (string $eventName, array $data) {
    // ...
});
```

<a name="defining-events"></a>
## 定义事件

事件类本质上是一个数据容器，用于保存与事件相关的信息。例如，假设一个 `App\Events\OrderShipped` 事件接收一个 [Eloquent ORM](/docs/{{version}}/eloquent) 对象：

```php
<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderShipped
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public Order $order,
    ) {}
}
```

正如你所看到的，这个事件类不包含任何逻辑。它是已购买的 `App\Models\Order` 实例的容器。事件使用的 `SerializesModels` trait 会在事件对象使用 PHP 的 `serialize` 函数进行序列化时（例如使用[队列监听器](#queued-event-listeners)时），优雅地序列化任何 Eloquent 模型。

<a name="defining-listeners"></a>
## 定义监听器

接下来，让我们看看示例事件的监听器。事件监听器在其 `handle` 方法中接收事件实例。使用 `--event` 选项调用 `make:listener` Artisan 命令时，会自动导入正确的事件类并在 `handle` 方法中类型提示该事件。在 `handle` 方法中，你可以执行响应事件所需的任何操作：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;

class SendShipmentNotification
{
    /**
     * Create the event listener.
     */
    public function __construct() {}

    /**
     * Handle the event.
     */
    public function handle(OrderShipped $event): void
    {
        // 使用 $event->order 访问订单...
    }
}
```

> [!NOTE]
> 你的事件监听器也可以在其构造函数中类型提示所需的任何依赖项。所有事件监听器都通过 Laravel [服务容器](/docs/{{version}}/container)解析，因此依赖项将自动注入。

<a name="stopping-the-propagation-of-an-event"></a>
#### 停止事件的传播

有时，你可能希望停止事件向其他监听器的传播。你可以通过从监听器的 `handle` 方法返回 `false` 来实现。

<a name="queued-event-listeners"></a>
## 队列事件监听器

如果你的监听器将要执行发送电子邮件或发出 HTTP 请求等耗时任务，队列化监听器会非常有用。在使用队列监听器之前，请确保[配置你的队列](/docs/{{version}}/queues)并在服务器或本地开发环境中启动队列工作器。

要指定监听器应被队列化，请在监听器类上添加 `ShouldQueue` 接口。由 `make:listener` Artisan 命令生成的监听器已将此接口导入到当前命名空间中，因此你可以立即使用它：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendShipmentNotification implements ShouldQueue
{
    // ...
}
```

就是这样！现在，当此监听器处理的事件被分发时，监听器将自动由事件分发器使用 Laravel 的[队列系统](/docs/{{version}}/queues)进行队列化。如果在队列执行监听器时没有抛出异常，队列任务将在处理完成后自动删除。

<a name="customizing-the-queue-connection-queue-name"></a>
#### 自定义队列连接、名称和延迟

如果你想自定义事件监听器的队列连接、队列名称或队列延迟时间，你可以在监听器类上使用 `Connection`、`Queue` 和 `Delay` 属性：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\Attributes\Connection;
use Illuminate\Queue\Attributes\Delay;
use Illuminate\Queue\Attributes\Queue;

#[Connection('sqs')]
#[Queue('listeners')]
#[Delay(60)]
class SendShipmentNotification implements ShouldQueue
{
    // ...
}
```

如果你想在运行时定义监听器的队列连接、队列名称或延迟，你可以在监听器上定义 `viaConnection`、`viaQueue` 或 `withDelay` 方法：

```php
/**
 * Get the name of the listener's queue connection.
 */
public function viaConnection(): string
{
    return 'sqs';
}

/**
 * Get the name of the listener's queue.
 */
public function viaQueue(): string
{
    return 'listeners';
}

/**
 * Get the number of seconds before the job should be processed.
 */
public function withDelay(OrderShipped $event): int
{
    return $event->highPriority ? 0 : 60;
}
```

<a name="conditionally-queueing-listeners"></a>
#### 条件性队列化监听器

有时，你可能需要根据仅在运行时可用的数据来确定是否应将监听器队列化。为此，可以在监听器中添加 `shouldQueue` 方法来确定是否应将监听器队列化。如果 `shouldQueue` 方法返回 `false`，则监听器不会被队列化：

```php
<?php

namespace App\Listeners;

use App\Events\OrderCreated;
use Illuminate\Contracts\Queue\ShouldQueue;

class RewardGiftCard implements ShouldQueue
{
    /**
     * Reward a gift card to the customer.
     */
    public function handle(OrderCreated $event): void
    {
        // ...
    }

    /**
     * Determine whether the listener should be queued.
     */
    public function shouldQueue(OrderCreated $event): bool
    {
        return $event->order->subtotal >= 5000;
    }
}
```

<a name="manually-interacting-with-the-queue"></a>
### 手动与队列交互

如果你需要手动访问监听器底层队列任务的 `delete` 和 `release` 方法，你可以使用 `Illuminate\Queue\InteractsWithQueue` trait。生成的监听器默认导入此 trait，并提供对这些方法的访问：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendShipmentNotification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     */
    public function handle(OrderShipped $event): void
    {
        if ($condition) {
            $this->release(30);
        }
    }
}
```

<a name="queued-event-listeners-and-database-transactions"></a>
### 队列事件监听器和数据库事务

当在数据库事务中分发队列监听器时，它们可能会在数据库事务提交之前被队列处理。发生这种情况时，你在数据库事务期间对模型或数据库记录所做的任何更新可能尚未反映在数据库中。此外，在事务中创建的任何模型或数据库记录可能不存在于数据库中。如果你的监听器依赖这些模型，则处理分发队列监听器的任务时可能会发生意外错误。

如果你的队列连接的 `after_commit` 配置选项设置为 `false`，你仍然可以通过在监听器类上实现 `ShouldQueueAfterCommit` 接口来指示特定的队列监听器应在所有打开的数据库事务提交后才被分发：

```php
<?php

namespace App\Listeners;

use Illuminate\Contracts\Queue\ShouldQueueAfterCommit;
use Illuminate\Queue\InteractsWithQueue;

class SendShipmentNotification implements ShouldQueueAfterCommit
{
    use InteractsWithQueue;
}
```

> [!NOTE]
> 要了解有关解决这些问题的更多信息，请查阅有关[队列任务和数据库事务](/docs/{{version}}/queues#jobs-and-database-transactions)的文档。

<a name="queued-listener-middleware"></a>
### 队列监听器中间件

队列监听器也可以使用[任务中间件](/docs/{{version}}/queues#job-middleware)。任务中间件允许你围绕队列监听器的执行包装自定义逻辑，从而减少监听器本身的样板代码。创建任务中间件后，可以通过从监听器的 `middleware` 方法返回它们来将其附加到监听器：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;
use App\Jobs\Middleware\RateLimited;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendShipmentNotification implements ShouldQueue
{
    /**
     * Handle the event.
     */
    public function handle(OrderShipped $event): void
    {
        // 处理事件...
    }

    /**
     * Get the middleware the listener should pass through.
     *
     * @return array<int, object>
     */
    public function middleware(OrderShipped $event): array
    {
        return [new RateLimited];
    }
}
```

<a name="encrypted-queued-listeners"></a>
#### 加密的队列监听器

Laravel 允许你通过[加密](/docs/{{version}}/encryption)确保队列监听器数据的隐私和完整性。首先，只需在监听器类上添加 `ShouldBeEncrypted` 接口。一旦此接口添加到类中，Laravel 将在将监听器推送到队列之前自动加密它：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;
use Illuminate\Contracts\Queue\ShouldBeEncrypted;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendShipmentNotification implements ShouldQueue, ShouldBeEncrypted
{
    // ...
}
```

<a name="unique-event-listeners"></a>
### 唯一事件监听器

> [!WARNING]
> 唯一监听器需要支持[锁](/docs/{{version}}/cache#atomic-locks)的缓存驱动。目前，`memcached`、`redis`、`dynamodb`、`database`、`file` 和 `array` 缓存驱动支持原子锁。

有时，你可能希望确保在任何时间点上队列中只有一个特定监听器的实例。你可以通过在监听器类上实现 `ShouldBeUnique` 接口来实现：

```php
<?php

namespace App\Listeners;

use App\Events\LicenseSaved;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;

class AcquireProductKey implements ShouldQueue, ShouldBeUnique
{
    public function __invoke(LicenseSaved $event): void
    {
        // ...
    }
}
```

在上面的示例中，`AcquireProductKey` 监听器是唯一的。因此，如果另一个监听器实例已经在队列中且尚未完成处理，则该监听器不会被队列化。这确保了即使许可证被快速连续保存多次，每个许可证也只会获取一个产品密钥。

在某些情况下，你可能想定义一个使监听器唯一的特定"键"，或者你可能想指定一个超时时间，超过该时间后监听器不再保持唯一。为此，你可以在监听器类上定义 `uniqueId` 和 `uniqueFor` 属性或方法。这些方法接收事件实例，允许你使用事件数据来构造返回值：

```php
<?php

namespace App\Listeners;

use App\Events\LicenseSaved;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;

class AcquireProductKey implements ShouldQueue, ShouldBeUnique
{
    /**
     * The number of seconds after which the listener's unique lock will be released.
     *
     * @var int
     */
    public $uniqueFor = 3600;

    public function __invoke(LicenseSaved $event): void
    {
        // ...
    }

    /**
     * Get the unique ID for the listener.
     */
    public function uniqueId(LicenseSaved $event): string
    {
        return 'listener:'.$event->license->id;
    }
}
```

在上面的示例中，`AcquireProductKey` 监听器按许可证 ID 唯一。因此，针对同一许可证的任何新监听器分发都将被忽略，直到现有监听器完成处理。这防止了为同一许可证获取重复的产品密钥。此外，如果现有监听器在一小时内未处理完成，唯一锁将被释放，具有相同唯一键的另一个监听器可以被队列化。

> [!WARNING]
> 如果你的应用从多个 Web 服务器或容器分发事件，你应确保所有服务器都与同一个中央缓存服务器通信，以便 Laravel 可以准确判断监听器是否唯一。

<a name="keeping-listeners-unique-until-processing-begins"></a>
#### 保持监听器唯一直到处理开始

默认情况下，唯一监听器在监听器完成处理或所有重试尝试失败后"解锁"。但是，可能存在你希望监听器在处理之前立即解锁的情况。为此，你的监听器应实现 `ShouldBeUniqueUntilProcessing` 契约而不是 `ShouldBeUnique` 契约：

```php
<?php

namespace App\Listeners;

use App\Events\LicenseSaved;
use Illuminate\Contracts\Queue\ShouldBeUniqueUntilProcessing;
use Illuminate\Contracts\Queue\ShouldQueue;

class AcquireProductKey implements ShouldQueue, ShouldBeUniqueUntilProcessing
{
    // ...
}
```

<a name="unique-listener-locks"></a>
#### 唯一监听器锁

在幕后，当 `ShouldBeUnique` 监听器被分发时，Laravel 尝试使用 `uniqueId` 键获取一个[锁](/docs/{{version}}/cache#atomic-locks)。如果该锁已被持有，则监听器不会被分发。当监听器完成处理或所有重试尝试失败时，此锁将被释放。默认情况下，Laravel 将使用默认缓存驱动来获取此锁。但是，如果你希望使用另一个驱动来获取锁，你可以定义一个 `uniqueVia` 方法，返回应使用的缓存驱动：

```php
<?php

namespace App\Listeners;

use App\Events\LicenseSaved;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Support\Facades\Cache;

class AcquireProductKey implements ShouldQueue, ShouldBeUnique
{
    // ...

    /**
     * Get the cache driver for the unique listener lock.
     */
    public function uniqueVia(LicenseSaved $event): Repository
    {
        return Cache::driver('redis');
    }
}
```

> [!NOTE]
> 如果你只需要限制监听器的并发处理，请改用 [WithoutOverlapping](/docs/{{version}}/queues#preventing-job-overlaps) 任务中间件。

<a name="handling-failed-jobs"></a>
### 处理失败的任务

有时你的队列事件监听器可能会失败。如果队列监听器超过了队列工作器定义的最大尝试次数，将在你的监听器上调用 `failed` 方法。`failed` 方法接收事件实例和导致失败的 `Throwable`：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Throwable;

class SendShipmentNotification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     */
    public function handle(OrderShipped $event): void
    {
        // ...
    }

    /**
     * Handle a job failure.
     */
    public function failed(OrderShipped $event, Throwable $exception): void
    {
        // ...
    }
}
```

<a name="specifying-queued-listener-maximum-attempts"></a>
#### 指定队列监听器最大尝试次数

如果你的某个队列监听器遇到错误，你可能不希望它无限重试。因此，Laravel 提供了多种方式来指定监听器可以被尝试的次数或持续时间。

你可以在监听器类上使用 `Tries` 属性来指定监听器在被视为失败之前可以尝试的次数：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;

#[Tries(5)]
class SendShipmentNotification implements ShouldQueue
{
    use InteractsWithQueue;

    // ...
}
```

作为定义监听器在失败前可尝试次数的替代方案，你可以定义监听器不应再被尝试的时间。这允许监听器在给定的时间范围内尝试任意次数。要定义监听器不应再被尝试的时间，请在你的监听器类中添加一个 `retryUntil` 方法。此方法应返回一个 `DateTimeInterface` 实例：

```php
use DateTimeInterface;

/**
 * Determine the time at which the listener should timeout.
 */
public function retryUntil(): DateTimeInterface
{
    return now()->plus(minutes: 5);
}
```

如果同时定义了 `retryUntil` 和 `tries`，Laravel 优先使用 `retryUntil` 方法。

<a name="specifying-queued-listener-backoff"></a>
#### 指定队列监听器回退时间

如果你想配置 Laravel 在重试遇到异常的监听器之前应等待的秒数，你可以在监听器类上使用 `Backoff` 属性：

```php
<?php

namespace App\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\Attributes\Backoff;

#[Backoff(3)]
class SendShipmentNotification implements ShouldQueue
{
    // ...
}
```

如果你需要更复杂的逻辑来确定监听器的回退时间，你可以在监听器类上定义一个 `backoff` 方法：

```php
/**
 * Calculate the number of seconds to wait before retrying the queued listener.
 */
public function backoff(OrderShipped $event): int
{
    return 3;
}
```

你可以通过从 `backoff` 方法返回一个回退值数组来轻松配置"指数"回退。在此示例中，第一次重试的延迟为 1 秒，第二次重试为 5 秒，第三次重试为 10 秒，如果还有更多尝试，则每次后续重试均为 10 秒：

```php
/**
 * Calculate the number of seconds to wait before retrying the queued listener.
 *
 * @return list<int>
 */
public function backoff(OrderShipped $event): array
{
    return [1, 5, 10];
}
```

<a name="specifying-queued-listener-max-exceptions"></a>
#### 指定队列监听器最大异常次数

有时你可能希望指定队列监听器可以尝试多次，但如果重试是由给定数量的未处理异常触发的（而不是直接通过 `release` 方法释放），则应使其失败。为此，你可以在监听器类上使用 `Tries` 和 `MaxExceptions` 属性：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\Attributes\MaxExceptions;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;

#[Tries(25)]
#[MaxExceptions(3)]
class SendShipmentNotification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     */
    public function handle(OrderShipped $event): void
    {
        // 处理事件...
    }
}
```

在此示例中，监听器将最多重试 25 次。但是，如果监听器抛出了三个未处理的异常，则监听器将失败。

<a name="specifying-queued-listener-timeout"></a>
#### 指定队列监听器超时

通常情况下，你大致知道队列监听器需要多长时间。因此，Laravel 允许你指定一个"超时"值。如果监听器的处理时间超过了超时值指定的秒数，处理该监听器的工作器将以错误退出。你可以通过在监听器类上使用 `Timeout` 属性来定义监听器允许运行的最大秒数：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\Attributes\Timeout;

#[Timeout(120)]
class SendShipmentNotification implements ShouldQueue
{
    // ...
}
```

如果你想指示监听器应在超时时标记为失败，你可以在监听器类上使用 `FailOnTimeout` 属性：

```php
<?php

namespace App\Listeners;

use App\Events\OrderShipped;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\Attributes\FailOnTimeout;

#[FailOnTimeout]
class SendShipmentNotification implements ShouldQueue
{
    // ...
}
```

<a name="dispatching-events"></a>
## 分发事件

要分发事件，你可以在事件上调用静态 `dispatch` 方法。此方法由 `Illuminate\Foundation\Events\Dispatchable` trait 提供。传递给 `dispatch` 方法的任何参数都将传递给事件的构造函数：

```php
<?php

namespace App\Http\Controllers;

use App\Events\OrderShipped;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class OrderShipmentController extends Controller
{
    /**
     * Ship the given order.
     */
    public function store(Request $request): RedirectResponse
    {
        $order = Order::findOrFail($request->order_id);

        // 订单发货逻辑...

        OrderShipped::dispatch($order);

        return redirect('/orders');
    }
}
```

如果你想有条件地分发事件，你可以使用 `dispatchIf` 和 `dispatchUnless` 方法：

```php
OrderShipped::dispatchIf($condition, $order);

OrderShipped::dispatchUnless($condition, $order);
```

> [!NOTE]
> 在测试时，断言某些事件已被分发而不实际触发其监听器会很有帮助。Laravel 的[内置测试辅助函数](#testing)使其变得非常简单。

<a name="dispatching-events-after-database-transactions"></a>
### 在数据库事务后分发事件

有时，你可能希望指示 Laravel 仅在活动的数据库事务提交后才分发事件。为此，你可以在事件类上实现 `ShouldDispatchAfterCommit` 接口。

此接口指示 Laravel 在当前数据库事务提交之前不分发事件。如果事务失败，事件将被丢弃。如果分发事件时没有数据库事务在进行，则事件将立即被分发：

```php
<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderShipped implements ShouldDispatchAfterCommit
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public Order $order,
    ) {}
}
```

<a name="deferring-events"></a>
### 延迟事件

延迟事件允许你将模型事件的分发和事件监听器的执行延迟到特定代码块完成之后。当你需要确保在触发事件监听器之前所有相关记录都已创建时，这尤其有用。

要延迟事件，向 `Event::defer()` 方法提供一个闭包：

```php
use App\Models\User;
use Illuminate\Support\Facades\Event;

Event::defer(function () {
    $user = User::create(['name' => 'Victoria Otwell']);

    $user->posts()->create(['title' => 'My first post!']);
});
```

在闭包中触发的所有事件将在闭包执行后被分发。这确保了事件监听器可以访问在延迟执行期间创建的所有相关记录。如果闭包内发生异常，则延迟的事件将不会被分发。

要仅延迟特定事件，将事件数组作为第二个参数传递给 `defer` 方法：

```php
use App\Models\User;
use Illuminate\Support\Facades\Event;

Event::defer(function () {
    $user = User::create(['name' => 'Victoria Otwell']);

    $user->posts()->create(['title' => 'My first post!']);
}, ['eloquent.created: '.User::class]);
```

<a name="event-subscribers"></a>
## 事件订阅者

<a name="writing-event-subscribers"></a>
### 编写事件订阅者

事件订阅者是可以在订阅者类本身内部订阅多个事件的类，允许你在单个类中定义多个事件处理器。订阅者应定义一个 `subscribe` 方法，该方法接收一个事件分发器实例。你可以在给定分发器上调用 `listen` 方法来注册事件监听器：

```php
<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Events\Dispatcher;

class UserEventSubscriber
{
    /**
     * Handle user login events.
     */
    public function handleUserLogin(Login $event): void {}

    /**
     * Handle user logout events.
     */
    public function handleUserLogout(Logout $event): void {}

    /**
     * Register the listeners for the subscriber.
     */
    public function subscribe(Dispatcher $events): void
    {
        $events->listen(
            Login::class,
            [UserEventSubscriber::class, 'handleUserLogin']
        );

        $events->listen(
            Logout::class,
            [UserEventSubscriber::class, 'handleUserLogout']
        );
    }
}
```

如果你的事件监听器方法在订阅者本身内部定义，你可能会发现从订阅者的 `subscribe` 方法返回事件和方法名称的数组更方便。Laravel 将在注册事件监听器时自动确定订阅者的类名：

```php
<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Events\Dispatcher;

class UserEventSubscriber
{
    /**
     * Handle user login events.
     */
    public function handleUserLogin(Login $event): void {}

    /**
     * Handle user logout events.
     */
    public function handleUserLogout(Logout $event): void {}

    /**
     * Register the listeners for the subscriber.
     *
     * @return array<string, string>
     */
    public function subscribe(Dispatcher $events): array
    {
        return [
            Login::class => 'handleUserLogin',
            Logout::class => 'handleUserLogout',
        ];
    }
}
```

<a name="registering-event-subscribers"></a>
### 注册事件订阅者

编写订阅者后，如果它们遵循 Laravel 的[事件发现约定](#event-discovery)，Laravel 将自动注册订阅者中的处理器方法。否则，你可以使用 `Event` 门面的 `subscribe` 方法手动注册你的订阅者。通常，这应该在应用的 `AppServiceProvider` 的 `boot` 方法中完成：

```php
<?php

namespace App\Providers;

use App\Listeners\UserEventSubscriber;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Event::subscribe(UserEventSubscriber::class);
    }
}
```

<a name="testing"></a>
## 测试

在测试分发事件的代码时，你可能希望指示 Laravel 不要实际执行事件的监听器，因为监听器的代码可以与分发相应事件的代码分开直接测试。当然，要测试监听器本身，你可以实例化一个监听器实例并在测试中直接调用 `handle` 方法。

使用 `Event` 门面的 `fake` 方法，你可以阻止监听器执行，执行被测试的代码，然后使用 `assertDispatched`、`assertNotDispatched` 和 `assertNothingDispatched` 方法断言你的应用分发的事件：

```php tab=Pest
<?php

use App\Events\OrderFailedToShip;
use App\Events\OrderShipped;
use Illuminate\Support\Facades\Event;

test('orders can be shipped', function () {
    Event::fake();

    // 执行订单发货...

    // 断言事件已被分发...
    Event::assertDispatched(OrderShipped::class);

    // 断言事件被分发两次...
    Event::assertDispatched(OrderShipped::class, 2);

    // 断言事件被分发一次...
    Event::assertDispatchedOnce(OrderShipped::class);

    // 断言事件未被分发...
    Event::assertNotDispatched(OrderFailedToShip::class);

    // 断言没有事件被分发...
    Event::assertNothingDispatched();
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use App\Events\OrderFailedToShip;
use App\Events\OrderShipped;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * Test order shipping.
     */
    public function test_orders_can_be_shipped(): void
    {
        Event::fake();

        // 执行订单发货...

        // 断言事件已被分发...
        Event::assertDispatched(OrderShipped::class);

        // 断言事件被分发两次...
        Event::assertDispatched(OrderShipped::class, 2);

        // 断言事件被分发一次...
        Event::assertDispatchedOnce(OrderShipped::class);

        // 断言事件未被分发...
        Event::assertNotDispatched(OrderFailedToShip::class);

        // 断言没有事件被分发...
        Event::assertNothingDispatched();
    }
}
```

你可以向 `assertDispatched` 或 `assertNotDispatched` 方法传递一个闭包，以断言通过给定"真值测试"的事件已被分发。如果至少有一个事件通过了给定的真值测试，则断言将成功：

```php
Event::assertDispatched(function (OrderShipped $event) use ($order) {
    return $event->order->id === $order->id;
});
```

如果你只是想断言事件监听器正在监听给定事件，你可以使用 `assertListening` 方法：

```php
Event::assertListening(
    OrderShipped::class,
    SendShipmentNotification::class
);
```

> [!WARNING]
> 调用 `Event::fake()` 后，将不会执行任何事件监听器。因此，如果你的测试使用依赖事件的模型工厂（例如在模型的 `creating` 事件期间创建 UUID），你应在使用工厂**之后**调用 `Event::fake()`。

<a name="faking-a-subset-of-events"></a>
### 伪造事件子集

如果你只想伪造特定一组事件的事件监听器，你可以将它们传递给 `fake` 或 `fakeFor` 方法：

```php tab=Pest
test('orders can be processed', function () {
    Event::fake([
        OrderCreated::class,
    ]);

    $order = Order::factory()->create();

    Event::assertDispatched(OrderCreated::class);

    // 其他事件正常分发...
    $order->update([
        // ...
    ]);
});
```

```php tab=PHPUnit
/**
 * Test order process.
 */
public function test_orders_can_be_processed(): void
{
    Event::fake([
        OrderCreated::class,
    ]);

    $order = Order::factory()->create();

    Event::assertDispatched(OrderCreated::class);

    // 其他事件正常分发...
    $order->update([
        // ...
    ]);
}
```

你可以使用 `except` 方法伪造除一组指定事件之外的所有事件：

```php
Event::fake()->except([
    OrderCreated::class,
]);
```

<a name="scoped-event-fakes"></a>
### 作用域事件伪造

如果你只想在测试的一部分中伪造事件监听器，你可以使用 `fakeFor` 方法：

```php tab=Pest
<?php

use App\Events\OrderCreated;
use App\Models\Order;
use Illuminate\Support\Facades\Event;

test('orders can be processed', function () {
    $order = Event::fakeFor(function () {
        $order = Order::factory()->create();

        Event::assertDispatched(OrderCreated::class);

        return $order;
    });

    // 事件正常分发，观察者将运行...
    $order->update([
        // ...
    ]);
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use App\Events\OrderCreated;
use App\Models\Order;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * Test order process.
     */
    public function test_orders_can_be_processed(): void
    {
        $order = Event::fakeFor(function () {
            $order = Order::factory()->create();

            Event::assertDispatched(OrderCreated::class);

            return $order;
        });

        // 事件正常分发，观察者将运行...
        $order->update([
            // ...
        ]);
    }
}
```

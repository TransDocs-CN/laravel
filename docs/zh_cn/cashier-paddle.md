# Laravel Cashier (Paddle)

- [简介](#introduction)
- [升级 Cashier](#upgrading-cashier)
- [安装](#installation)
    - [Paddle 沙盒](#paddle-sandbox)
- [配置](#configuration)
    - [Billable 模型](#billable-model)
    - [API 密钥](#api-keys)
    - [Paddle JS](#paddle-js)
    - [货币配置](#currency-configuration)
    - [覆盖默认模型](#overriding-default-models)
- [快速开始](#quickstart)
    - [销售产品](#quickstart-selling-products)
    - [销售订阅](#quickstart-selling-subscriptions)
- [结账会话](#checkout-sessions)
    - [覆盖式结账](#overlay-checkout)
    - [内联结账](#inline-checkout)
    - [访客结账](#guest-checkouts)
- [价格预览](#price-previews)
    - [客户价格预览](#customer-price-previews)
    - [折扣](#price-discounts)
- [客户](#customers)
    - [客户默认值](#customer-defaults)
    - [检索客户](#retrieving-customers)
    - [创建客户](#creating-customers)
- [订阅](#subscriptions)
    - [创建订阅](#creating-subscriptions)
    - [检查订阅状态](#checking-subscription-status)
    - [订阅单次收费](#subscription-single-charges)
    - [更新付款信息](#updating-payment-information)
    - [更改计划](#changing-plans)
    - [订阅数量](#subscription-quantity)
    - [多产品订阅](#subscriptions-with-multiple-products)
    - [多订阅](#multiple-subscriptions)
    - [暂停订阅](#pausing-subscriptions)
    - [取消订阅](#canceling-subscriptions)
- [订阅试用](#subscription-trials)
    - [预先提供付款方式](#with-payment-method-up-front)
    - [不预先提供付款方式](#without-payment-method-up-front)
    - [延长或激活试用](#extend-or-activate-a-trial)
- [处理 Paddle Webhooks](#handling-paddle-webhooks)
    - [定义 Webhook 事件处理器](#defining-webhook-event-handlers)
    - [验证 Webhook 签名](#verifying-webhook-signatures)
- [单次收费](#single-charges)
    - [产品收费](#charging-for-products)
    - [退款交易](#refunding-transactions)
    - [贷记交易](#crediting-transactions)
- [交易](#transactions)
    - [过去和即将到来的付款](#past-and-upcoming-payments)
- [测试](#testing)

<a name="introduction"></a>
## 简介

> [!WARNING]
> 本文档适用于 Cashier Paddle 2.x 与 Paddle Billing 的集成。如果你仍在使用 Paddle Classic，应使用 [Cashier Paddle 1.x](https://github.com/laravel/cashier-paddle/tree/1.x)。

[Laravel Cashier Paddle](https://github.com/laravel/cashier-paddle) 为 [Paddle's](https://paddle.com) 订阅计费服务提供了富有表现力、流畅的接口。它处理了几乎所有你害怕编写的样板订阅计费代码。除了基本的订阅管理外，Cashier 还可以处理：切换订阅、订阅"数量"、暂停订阅、取消宽限期等等。

在深入研究 Cashier Paddle 之前，我们建议你同时查看 Paddle 的[概念指南](https://developer.paddle.com/concepts/overview)和 [API 文档](https://developer.paddle.com/api-reference/overview)。

<a name="upgrading-cashier"></a>
## 升级 Cashier

升级到新版本的 Cashier 时，仔细阅读[升级指南](https://github.com/laravel/cashier-paddle/blob/master/UPGRADE.md)非常重要。

<a name="installation"></a>
## 安装

首先，使用 Composer 包管理器安装适用于 Paddle 的 Cashier 包：

```shell
composer require laravel/cashier-paddle
```

接下来，使用 `vendor:publish` Artisan 命令发布 Cashier 迁移文件：

```shell
php artisan vendor:publish --tag="cashier-migrations"
```

然后，应运行应用程序的数据库迁移。Cashier 迁移将创建一个新的 `customers` 表。此外，还将创建新的 `subscriptions` 和 `subscription_items` 表来存储所有客户的订阅。最后，将创建一个新的 `transactions` 表来存储与客户关联的所有 Paddle 交易：

```shell
php artisan migrate
```

> [!WARNING]
> 为了确保 Cashier 正确处理所有 Paddle 事件，请记住[设置 Cashier 的 webhook 处理](#handling-paddle-webhooks)。

<a name="paddle-sandbox"></a>
### Paddle 沙盒

在本地和预发布开发期间，你应[注册一个 Paddle 沙盒账户](https://sandbox-login.paddle.com/signup)。此账户将为你提供一个沙盒环境来测试和开发应用程序，而无需进行实际付款。你可以使用 Paddle 的[测试卡号](https://developer.paddle.com/concepts/payment-methods/credit-debit-card#test-payment-method)来模拟各种付款场景。

使用 Paddle 沙盒环境时，应将应用程序 `.env` 文件中的 `PADDLE_SANDBOX` 环境变量设置为 `true`：

```ini
PADDLE_SANDBOX=true
```

完成应用程序的开发后，你可以[申请 Paddle 供应商账户](https://paddle.com)。在应用程序投入生产之前，Paddle 需要批准你的应用程序域名。

<a name="configuration"></a>
## 配置

<a name="billable-model"></a>
### Billable 模型

在使用 Cashier 之前，必须将 `Billable` trait 添加到你的用户模型定义中。此 trait 提供了各种方法，允许你执行常见的计费任务，例如创建订阅和更新付款方式信息：

```php
use Laravel\Paddle\Billable;

class User extends Authenticatable
{
    use Billable;
}
```

如果你有不是用户的 Billable 实体，也可以将 trait 添加到这些类中：

```php
use Illuminate\Database\Eloquent\Model;
use Laravel\Paddle\Billable;

class Team extends Model
{
    use Billable;
}
```

<a name="api-keys"></a>
### API 密钥

接下来，在应用程序的 `.env` 文件中配置你的 Paddle 密钥。你可以从 Paddle 控制面板获取 Paddle API 密钥：

```ini
PADDLE_CLIENT_SIDE_TOKEN=your-paddle-client-side-token
PADDLE_API_KEY=your-paddle-api-key
PADDLE_RETAIN_KEY=your-paddle-retain-key
PADDLE_WEBHOOK_SECRET="your-paddle-webhook-secret"
PADDLE_SANDBOX=true
```

当你使用 [Paddle 的沙盒环境](#paddle-sandbox)时，`PADDLE_SANDBOX` 环境变量应设置为 `true`。如果你将应用程序部署到生产环境并使用 Paddle 的实时供应商环境，`PADDLE_SANDBOX` 变量应设置为 `false`。

`PADDLE_RETAIN_KEY` 是可选的，仅当你在 Paddle 中使用 [Retain](https://developer.paddle.com/concepts/retain/overview) 时才应设置。

<a name="paddle-js"></a>
### Paddle JS

Paddle 依赖其自己的 JavaScript 库来启动 Paddle 结账小部件。你可以通过将 `@paddleJS` Blade 指令放在应用程序布局的闭合 `</head>` 标签之前来加载 JavaScript 库：

```blade
<head>
    ...

    @paddleJS
</head>
```

<a name="currency-configuration"></a>
### 货币配置

你可以指定一个区域设置，用于在发票上显示货币值格式化。在内部，Cashier 使用 [PHP 的 `NumberFormatter` 类](https://www.php.net/manual/en/class.numberformatter.php)来设置货币区域：

```ini
CASHIER_CURRENCY_LOCALE=nl_BE
```

> [!WARNING]
> 为了使用 `en` 以外的区域设置，请确保在服务器上安装并配置了 `ext-intl` PHP 扩展。

<a name="overriding-default-models"></a>
### 覆盖默认模型

你可以自由扩展 Cashier 内部使用的模型，方法是定义自己的模型并扩展相应的 Cashier 模型：

```php
use Laravel\Paddle\Subscription as CashierSubscription;

class Subscription extends CashierSubscription
{
    // ...
}
```

定义模型后，你可以通过 `Laravel\Paddle\Cashier` 类指示 Cashier 使用你的自定义模型。通常，你应在应用程序的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中告知 Cashier 你的自定义模型：

```php
use App\Models\Cashier\Subscription;
use App\Models\Cashier\Transaction;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Cashier::useSubscriptionModel(Subscription::class);
    Cashier::useTransactionModel(Transaction::class);
}
```

<a name="quickstart"></a>
## 快速开始

<a name="quickstart-selling-products"></a>
### 销售产品

> [!NOTE]
> 在使用 Paddle Checkout 之前，应在 Paddle 控制面板中定义具有固定价格的产品。此外，还应[配置 Paddle 的 webhook 处理](#handling-paddle-webhooks)。

通过应用程序提供产品和订阅计费可能令人生畏。但是，得益于 Cashier 和 [Paddle 的 Checkout Overlay](https://developer.paddle.com/concepts/sell/overlay-checkout)，你可以轻松构建现代、强大的付款集成。

要向客户收取非循环的单次产品费用，我们将使用 Cashier 通过 Paddle 的 Checkout Overlay 向客户收费，客户将在其中提供付款详情并确认购买。一旦通过 Checkout Overlay 完成付款，客户将重定向到你应用程序中你选择的一个成功 URL：

```php
use Illuminate\Http\Request;

Route::get('/buy', function (Request $request) {
    $checkout = $request->user()->checkout('pri_deluxe_album')
        ->returnTo(route('dashboard'));

    return view('buy', ['checkout' => $checkout]);
})->name('checkout');
```

如上述示例所示，我们将利用 Cashier 提供的 `checkout` 方法创建一个结账对象，以向客户展示给定"价格标识符"的 Paddle Checkout Overlay。使用 Paddle 时，"价格"指的是[特定产品的定义价格](https://developer.paddle.com/build/products/create-products-prices)。

如果需要，`checkout` 方法会自动在 Paddle 中创建客户，并将该 Paddle 客户记录连接到应用程序数据库中的相应用户。完成结账会话后，客户将被重定向到一个专门的成功页面，你可以在其中向客户显示信息性消息。

在 `buy` 视图中，我们将包含一个按钮来显示 Checkout Overlay。`paddle-button` Blade 组件已包含在 Cashier Paddle 中；但是，你也可以[手动渲染覆盖式结账](#manually-rendering-an-overlay-checkout)：

```html
<x-paddle-button :checkout="$checkout" class="px-8 py-4">
    Buy Product
</x-paddle-button>
```

<a name="providing-meta-data-to-paddle-checkout"></a>
#### 向 Paddle Checkout 提供元数据

销售产品时，通常通过应用程序自己定义的 `Cart` 和 `Order` 模型来跟踪已完成的订单和已购买的产品。当将客户重定向到 Paddle 的 Checkout Overlay 以完成购买时，你可能需要提供现有订单标识符，以便在客户重定向回你的应用程序时，可以将已完成的购买与相应的订单关联起来。

为此，你可以向 `checkout` 方法提供一个自定义数据数组。让我们想象一下，当用户开始结账流程时，在我们的应用程序中创建了一个待处理的 `Order`。记住，此示例中的 `Cart` 和 `Order` 模型仅用于说明，并非由 Cashier 提供。你可以根据自己的应用需求自由实现这些概念：

```php
use App\Models\Cart;
use App\Models\Order;
use Illuminate\Http\Request;

Route::get('/cart/{cart}/checkout', function (Request $request, Cart $cart) {
    $order = Order::create([
        'cart_id' => $cart->id,
        'price_ids' => $cart->price_ids,
        'status' => 'incomplete',
    ]);

    $checkout = $request->user()->checkout($order->price_ids)
        ->customData(['order_id' => $order->id]);

    return view('billing', ['checkout' => $checkout]);
})->name('checkout');
```

如上述示例所示，当用户开始结账流程时，我们将向 `checkout` 方法提供购物车/订单关联的所有 Paddle 价格标识符。当然，当客户添加这些项目时，你的应用程序负责将这些项目与"购物车"或订单关联起来。我们还通过 `customData` 方法向 Paddle Checkout Overlay 提供了订单的 ID。

当然，你可能希望在客户完成结账流程后将订单标记为"已完成"。为此，你可以监听由 Paddle 派发并通过 Cashier 以事件形式引发的 webhook，以将订单信息存储在你的数据库中。

首先，监听 Cashier 派发的 `TransactionCompleted` 事件。通常，你应在应用程序 `AppServiceProvider` 的 `boot` 方法中注册事件监听器：

```php
use App\Listeners\CompleteOrder;
use Illuminate\Support\Facades\Event;
use Laravel\Paddle\Events\TransactionCompleted;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Event::listen(TransactionCompleted::class, CompleteOrder::class);
}
```

在此示例中，`CompleteOrder` 监听器可能如下所示：

```php
namespace App\Listeners;

use App\Models\Order;
use Laravel\Paddle\Cashier;
use Laravel\Paddle\Events\TransactionCompleted;

class CompleteOrder
{
    /**
     * Handle the incoming Cashier webhook event.
     */
    public function handle(TransactionCompleted $event): void
    {
        $orderId = $event->payload['data']['custom_data']['order_id'] ?? null;

        $order = Order::findOrFail($orderId);

        $order->update(['status' => 'completed']);
    }
}
```

请参考 Paddle 的文档以获取更多关于 [`transaction.completed` 事件包含的数据](https://developer.paddle.com/webhooks/transactions/transaction-completed)的信息。

<a name="quickstart-selling-subscriptions"></a>
### 销售订阅

> [!NOTE]
> 在使用 Paddle Checkout 之前，应在 Paddle 控制面板中定义具有固定价格的产品。此外，还应[配置 Paddle 的 webhook 处理](#handling-paddle-webhooks)。

通过应用程序提供产品和订阅计费可能令人生畏。但是，得益于 Cashier 和 [Paddle 的 Checkout Overlay](https://developer.paddle.com/concepts/sell/overlay-checkout)，你可以轻松构建现代、强大的付款集成。

要了解如何使用 Cashier 和 Paddle 的 Checkout Overlay 销售订阅，让我们考虑一个简单的订阅服务场景，该服务提供月度（`price_basic_monthly`）和年度（`price_basic_yearly`）计划。这两个价格可以在我们的 Paddle 控制面板中归入"Basic"产品（`pro_basic`）下。此外，我们的订阅服务可能提供 `pro_expert` 作为"Expert"计划。

首先，让我们了解客户如何订阅我们的服务。当然，你可以想象客户可能会在我们应用程序的定价页面上点击 Basic 计划的"订阅"按钮。此按钮将为其选择的计划调用 Paddle Checkout Overlay。首先，让我们通过 `checkout` 方法启动一个结账会话：

```php
use Illuminate\Http\Request;

Route::get('/subscribe', function (Request $request) {
    $checkout = $request->user()->checkout('price_basic_monthly')
        ->returnTo(route('dashboard'));

    return view('subscribe', ['checkout' => $checkout]);
})->name('subscribe');
```

在 `subscribe` 视图中，我们将包含一个按钮来显示 Checkout Overlay。`paddle-button` Blade 组件已包含在 Cashier Paddle 中；但是，你也可以[手动渲染覆盖式结账](#manually-rendering-an-overlay-checkout)：

```html
<x-paddle-button :checkout="$checkout" class="px-8 py-4">
    Subscribe
</x-paddle-button>
```

现在，当单击 Subscribe 按钮时，客户将能够输入其付款详情并启动订阅。要知道他们的订阅何时实际开始（因为某些付款方式需要几秒钟处理），你还应[配置 Cashier 的 webhook 处理](#handling-paddle-webhooks)。

既然客户可以开始订阅，我们需要限制应用程序的某些部分，以便只有已订阅的用户才能访问。当然，我们始终可以通过 Cashier 的 `Billable` trait 提供的 `subscribed` 方法来确定用户的当前订阅状态：

```blade
@if ($user->subscribed())
    <p>You are subscribed.</p>
@endif
```

我们甚至可以轻松确定用户是否订阅了特定产品或价格：

```blade
@if ($user->subscribedToProduct('pro_basic'))
    <p>You are subscribed to our Basic product.</p>
@endif

@if ($user->subscribedToPrice('price_basic_monthly'))
    <p>You are subscribed to our monthly Basic plan.</p>
@endif
```

<a name="quickstart-building-a-subscribed-middleware"></a>
#### 构建已订阅中间件

为了方便起见，你可能希望创建一个[中间件](/docs/{{version}}/middleware)，用于确定传入请求是否来自已订阅的用户。定义此中间件后，你可以轻松地将其分配给路由，以防止未订阅的用户访问该路由：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class Subscribed
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->subscribed()) {
            // Redirect user to billing page and ask them to subscribe...
            return redirect('/subscribe');
        }

        return $next($request);
    }
}
```

定义中间件后，你可以将其分配给路由：

```php
use App\Http\Middleware\Subscribed;

Route::get('/dashboard', function () {
    // ...
})->middleware([Subscribed::class]);
```

<a name="quickstart-allowing-customers-to-manage-their-billing-plan"></a>
#### 允许客户管理其计费计划

当然，客户可能希望将其订阅计划更改为其他产品或"层级"。从上面的示例中，我们希望允许客户将其计划从月度订阅更改为年度订阅。为此，你需要实现类似按钮的功能，指向以下路由：

```php
use Illuminate\Http\Request;

Route::put('/subscription/{price}/swap', function (Request $request, $price) {
    $user->subscription()->swap($price); // With "$price" being "price_basic_yearly" for this example.

    return redirect()->route('dashboard');
})->name('subscription.swap');
```

除了切换计划外，你还需要允许客户取消其订阅。与切换计划类似，提供一个指向以下路由的按钮：

```php
use Illuminate\Http\Request;

Route::put('/subscription/cancel', function (Request $request, $price) {
    $user->subscription()->cancel();

    return redirect()->route('dashboard');
})->name('subscription.cancel');
```

现在，你的订阅将在其计费周期结束时取消。

> [!NOTE]
> 只要你已配置 Cashier 的 webhook 处理，Cashier 将通过检查来自 Paddle 的传入 webhook，自动保持应用程序中与 Cashier 相关的数据库表同步。因此，例如，当你通过 Paddle 控制面板取消客户的订阅时，Cashier 将收到相应的 webhook 并在应用程序数据库中将订阅标记为"已取消"。

<a name="checkout-sessions"></a>
## 结账会话

大多数对客户进行计费的操作都是通过 Paddle 的 [Checkout Overlay 小部件](https://developer.paddle.com/build/checkout/build-overlay-checkout)或利用[内联结账](https://developer.paddle.com/build/checkout/build-branded-inline-checkout)来执行的"结账"。

在使用 Paddle 处理结账付款之前，应在 Paddle 结账设置控制面板中定义应用程序的[默认付款链接](https://developer.paddle.com/build/transactions/default-payment-link#set-default-link)。

<a name="overlay-checkout"></a>
### 覆盖式结账

在显示 Checkout Overlay 小部件之前，必须使用 Cashier 生成一个结账会话。结账会话将告知结账小部件应执行的计费操作：

```php
use Illuminate\Http\Request;

Route::get('/buy', function (Request $request) {
    $checkout = $user->checkout('pri_34567')
        ->returnTo(route('dashboard'));

    return view('billing', ['checkout' => $checkout]);
});
```

Cashier 包含一个 `paddle-button` [Blade 组件](/docs/{{version}}/blade#components)。你可以将结账会话作为"prop"传递给此组件。然后，当单击此按钮时，将显示 Paddle 的结账小部件：

```html
<x-paddle-button :checkout="$checkout" class="px-8 py-4">
    Subscribe
</x-paddle-button>
```

默认情况下，这将使用 Paddle 的默认样式显示小部件。你可以通过向组件添加 [Paddle 支持的属性](https://developer.paddle.com/paddlejs/html-data-attributes)（如 `data-theme='light'` 属性）来自定义小部件：

```html
<x-paddle-button :checkout="$checkout" class="px-8 py-4" data-theme="light">
    Subscribe
</x-paddle-button>
```

Paddle 结账小部件是异步的。当用户在小部件中创建订阅后，Paddle 将向你的应用程序发送一个 webhook，以便你可以正确更新应用程序数据库中的订阅状态。因此，正确[设置 webhook](#handling-paddle-webhooks)以处理来自 Paddle 的状态更改非常重要。

> [!WARNING]
> 在订阅状态更改后，接收相应 webhook 的延迟通常很小，但你应在应用程序中考虑到这一点，因为用户的订阅在完成结账后可能不会立即可用。

<a name="manually-rendering-an-overlay-checkout"></a>
#### 手动渲染覆盖式结账

你也可以在不使用 Laravel 内置 Blade 组件的情况下手动渲染覆盖式结账。首先，[按照前面示例所示](#overlay-checkout)生成结账会话：

```php
use Illuminate\Http\Request;

Route::get('/buy', function (Request $request) {
    $checkout = $user->checkout('pri_34567')
        ->returnTo(route('dashboard'));

    return view('billing', ['checkout' => $checkout]);
});
```

接下来，你可以使用 Paddle.js 初始化结账。在此示例中，我们将创建一个分配了 `paddle_button` 类的链接。Paddle.js 将检测到此类，并在单击链接时显示覆盖式结账：

```blade
<?php
$items = $checkout->getItems();
$customer = $checkout->getCustomer();
$custom = $checkout->getCustomData();
?>

<a
    href='#!'
    class='paddle_button'
    data-items='{!! json_encode($items) !!}'
    @if ($customer) data-customer-id='{{ $customer->paddle_id }}' @endif
    @if ($custom) data-custom-data='{{ json_encode($custom) }}' @endif
    @if ($returnUrl = $checkout->getReturnUrl()) data-success-url='{{ $returnUrl }}' @endif
>
    Buy Product
</a>
```

<a name="inline-checkout"></a>
### 内联结账

如果你不想使用 Paddle 的"覆盖式"风格的结账小部件，Paddle 还提供了在小部件内联显示选项。虽然这种方法不允许你调整结账的任何 HTML 字段，但它允许你将小部件嵌入到你的应用程序中。

为方便你开始使用内联结账，Cashier 包含一个 `paddle-checkout` Blade 组件。首先，你应[生成一个结账会话](#overlay-checkout)：

```php
use Illuminate\Http\Request;

Route::get('/buy', function (Request $request) {
    $checkout = $user->checkout('pri_34567')
        ->returnTo(route('dashboard'));

    return view('billing', ['checkout' => $checkout]);
});
```

然后，你可以将结账会话传递给组件的 `checkout` 属性：

```blade
<x-paddle-checkout :checkout="$checkout" class="w-full" />
```

要调整内联结账组件的高度，你可以向 Blade 组件传递 `height` 属性：

```blade
<x-paddle-checkout :checkout="$checkout" class="w-full" height="500" />
```

请查阅 Paddle 的[内联结账指南](https://developer.paddle.com/build/checkout/build-branded-inline-checkout)和[可用的结账设置](https://developer.paddle.com/build/checkout/set-up-checkout-default-settings)以获取有关内联结账自定义选项的更多详细信息。

<a name="manually-rendering-an-inline-checkout"></a>
#### 手动渲染内联结账

你也可以在不使用 Laravel 内置 Blade 组件的情况下手动渲染内联结账。首先，[按照前面示例所示](#inline-checkout)生成结账会话：

```php
use Illuminate\Http\Request;

Route::get('/buy', function (Request $request) {
    $checkout = $user->checkout('pri_34567')
        ->returnTo(route('dashboard'));

    return view('billing', ['checkout' => $checkout]);
});
```

接下来，你可以使用 Paddle.js 初始化结账。在此示例中，我们将使用 [Alpine.js](https://github.com/alpinejs/alpine) 进行演示；但是，你可以根据自己的前端堆栈修改此示例：

```blade
<?php
$options = $checkout->options();

$options['settings']['frameTarget'] = 'paddle-checkout';
$options['settings']['frameInitialHeight'] = 366;
?>

<div class="paddle-checkout" x-data="{}" x-init="
    Paddle.Checkout.open(@json($options));
">
</div>
```

<a name="guest-checkouts"></a>
### 访客结账

有时，你可能需要为不需要在你的应用程序中拥有账户的用户创建结账会话。为此，你可以使用 `guest` 方法：

```php
use Illuminate\Http\Request;
use Laravel\Paddle\Checkout;

Route::get('/buy', function (Request $request) {
    $checkout = Checkout::guest(['pri_34567'])
        ->returnTo(route('home'));

    return view('billing', ['checkout' => $checkout]);
});
```

然后，你可以将结账会话提供给 [Paddle 按钮](#overlay-checkout)或[内联结账](#inline-checkout) Blade 组件。

<a name="price-previews"></a>
## 价格预览

Paddle 允许你按货币自定义价格，本质上允许你为不同国家配置不同的价格。Cashier Paddle 允许你使用 `previewPrices` 方法检索所有这些价格。此方法接受你希望检索其价格的价格 ID：

```php
use Laravel\Paddle\Cashier;

$prices = Cashier::previewPrices(['pri_123', 'pri_456']);
```

货币将根据请求的 IP 地址确定；但是，你可以选择提供特定的国家来检索价格：

```php
use Laravel\Paddle\Cashier;

$prices = Cashier::previewPrices(['pri_123', 'pri_456'], ['address' => [
    'country_code' => 'BE',
    'postal_code' => '1234',
]]);
```

检索价格后，你可以按自己的方式显示它们：

```blade
<ul>
    @foreach ($prices as $price)
        <li>{{ $price->product['name'] }} - {{ $price->total() }}</li>
    @endforeach
</ul>
```

你也可以分别显示小计价格和税额：

```blade
<ul>
    @foreach ($prices as $price)
        <li>{{ $price->product['name'] }} - {{ $price->subtotal() }} (+ {{ $price->tax() }} tax)</li>
    @endforeach
</ul>
```

有关更多信息，[请查看 Paddle 关于价格预览的 API 文档](https://developer.paddle.com/api-reference/pricing-preview/preview-prices)。

<a name="customer-price-previews"></a>
### 客户价格预览

如果用户已经是客户，并且你想显示适用于该客户的价格，你可以通过直接从客户实例检索价格来实现：

```php
use App\Models\User;

$prices = User::find(1)->previewPrices(['pri_123', 'pri_456']);
```

在内部，Cashier 将使用用户的客户 ID 以他们的货币检索价格。因此，例如，居住在美国的用户将以美元看到价格，而比利时用户将以欧元看到价格。如果找不到匹配的货币，将使用产品的默认货币。你可以在 Paddle 控制面板中自定义产品或订阅计划的所有价格。

<a name="price-discounts"></a>
### 折扣

你也可以选择在折扣后显示价格。在调用 `previewPrices` 方法时，通过 `discount_id` 选项提供折扣 ID：

```php
use Laravel\Paddle\Cashier;

$prices = Cashier::previewPrices(['pri_123', 'pri_456'], [
    'discount_id' => 'dsc_123'
]);
```

然后，显示计算后的价格：

```blade
<ul>
    @foreach ($prices as $price)
        <li>{{ $price->product['name'] }} - {{ $price->total() }}</li>
    @endforeach
</ul>
```

<a name="customers"></a>
## 客户

<a name="customer-defaults"></a>
### 客户默认值

Cashier 允许你在创建结账会话时为客户定义一些有用的默认值。设置这些默认值允许你预填充客户的电子邮件地址和姓名，以便他们可以立即进入结账小部件的付款部分。你可以通过在 billable 模型上覆盖以下方法来设置这些默认值：

```php
/**
 * Get the customer's name to associate with Paddle.
 */
public function paddleName(): string|null
{
    return $this->name;
}

/**
 * Get the customer's email address to associate with Paddle.
 */
public function paddleEmail(): string|null
{
    return $this->email;
}
```

这些默认值将用于 Cashier 中生成[结账会话](#checkout-sessions)的每个操作。

<a name="retrieving-customers"></a>
### 检索客户

你可以使用 `Cashier::findBillable` 方法通过 Paddle 客户 ID 检索客户。此方法将返回 billable 模型的实例：

```php
use Laravel\Paddle\Cashier;

$user = Cashier::findBillable($customerId);
```

<a name="creating-customers"></a>
### 创建客户

有时，你可能希望在不开始订阅的情况下创建 Paddle 客户。你可以使用 `createAsCustomer` 方法来实现：

```php
$customer = $user->createAsCustomer();
```

返回 `Laravel\Paddle\Customer` 的实例。一旦在 Paddle 中创建了客户，你可以在以后开始订阅。你可以提供一个可选的 `$options` 数组来传递 [Paddle API 支持的任何其他客户创建参数](https://developer.paddle.com/api-reference/customers/create-customer)：

```php
$customer = $user->createAsCustomer($options);
```

<a name="subscriptions"></a>
## 订阅

<a name="creating-subscriptions"></a>
### 创建订阅

要创建订阅，首先从数据库中检索 billable 模型的实例，通常是 `App\Models\User` 的实例。检索到模型实例后，你可以使用 `subscribe` 方法创建模型的结账会话：

```php
use Illuminate\Http\Request;

Route::get('/user/subscribe', function (Request $request) {
    $checkout = $request->user()->subscribe($premium = 'pri_123', 'default')
        ->returnTo(route('home'));

    return view('billing', ['checkout' => $checkout]);
});
```

传递给 `subscribe` 方法的第一个参数是用户订阅的特定价格。此值应与 Paddle 中的价格标识符对应。`returnTo` 方法接受一个 URL，用户成功完成结账后将重定向到该 URL。传递给 `subscribe` 方法的第二个参数应是订阅的内部"类型"。如果你的应用程序只提供一个订阅，你可以称之为 `default` 或 `primary`。此订阅类型仅供内部应用程序使用，不打算向用户显示。此外，它不应包含空格，并且在创建订阅后不应更改。

你还可以使用 `customData` 方法提供关于订阅的自定义元数据数组：

```php
$checkout = $request->user()->subscribe($premium = 'pri_123', 'default')
    ->customData(['key' => 'value'])
    ->returnTo(route('home'));
```

创建订阅结账会话后，可以将结账会话提供给 Cashier Paddle 附带的 `paddle-button` [Blade 组件](#overlay-checkout)：

```blade
<x-paddle-button :checkout="$checkout" class="px-8 py-4">
    Subscribe
</x-paddle-button>
```

用户完成结账后，Paddle 将派发一个 `subscription_created` webhook。Cashier 将接收此 webhook 并为你的客户设置订阅。为确保所有 webhook 都能被你的应用程序正确接收和处理，请确保已正确[设置 webhook 处理](#handling-paddle-webhooks)。

<a name="checking-subscription-status"></a>
### 检查订阅状态

一旦用户订阅了你的应用程序，你可以使用各种方便的方法检查他们的订阅状态。首先，`subscribed` 方法在用户拥有有效订阅时返回 `true`，即使订阅当前处于试用期：

```php
if ($user->subscribed()) {
    // ...
}
```

如果你的应用程序提供多个订阅，你可以在调用 `subscribed` 方法时指定订阅：

```php
if ($user->subscribed('default')) {
    // ...
}
```

`subscribed` 方法也非常适合用作[路由中间件](/docs/{{version}}/middleware)，允许你根据用户的订阅状态过滤对路由和控制器的访问：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsSubscribed
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && ! $request->user()->subscribed()) {
            // This user is not a paying customer...
            return redirect('/billing');
        }

        return $next($request);
    }
}
```

如果你想确定用户是否仍在试用期内，可以使用 `onTrial` 方法。此方法对于确定是否应在用户仍在试用期时显示警告非常有用：

```php
if ($user->subscription()->onTrial()) {
    // ...
}
```

`subscribedToPrice` 方法可用于根据给定的 Paddle 价格 ID 确定用户是否已订阅给定计划。在此示例中，我们将确定用户的 `default` 订阅是否活跃订阅了月度价格：

```php
if ($user->subscribedToPrice($monthly = 'pri_123', 'default')) {
    // ...
}
```

`recurring` 方法可用于确定用户当前是否处于活跃订阅状态，且不再处于试用期或宽限期：

```php
if ($user->subscription()->recurring()) {
    // ...
}
```

<a name="canceled-subscription-status"></a>
#### 已取消订阅状态

要确定用户是否曾是活跃订阅者但已取消订阅，可以使用 `canceled` 方法：

```php
if ($user->subscription()->canceled()) {
    // ...
}
```

你也可以确定用户是否已取消订阅，但仍在订阅完全过期之前的"宽限期"内。例如，如果用户在 3 月 5 日取消了一个原定于 3 月 10 日到期的订阅，则该用户处于"宽限期"直到 3 月 10 日。此外，在此期间 `subscribed` 方法仍将返回 `true`：

```php
if ($user->subscription()->onGracePeriod()) {
    // ...
}
```

<a name="past-due-status"></a>
#### 逾期状态

如果订阅的付款失败，它将被标记为 `past_due`。当你的订阅处于此状态时，它将不会处于活跃状态，直到客户更新其付款信息。你可以使用订阅实例上的 `pastDue` 方法确定订阅是否逾期：

```php
if ($user->subscription()->pastDue()) {
    // ...
}
```

当订阅逾期时，你应指示用户[更新其付款信息](#updating-payment-information)。

如果你希望订阅在 `past_due` 时仍被视为有效，可以使用 Cashier 提供的 `keepPastDueSubscriptionsActive` 方法。通常，此方法应在 `AppServiceProvider` 的 `register` 方法中调用：

```php
use Laravel\Paddle\Cashier;

/**
 * Register any application services.
 */
public function register(): void
{
    Cashier::keepPastDueSubscriptionsActive();
}
```

> [!WARNING]
> 当订阅处于 `past_due` 状态时，在更新付款信息之前无法更改。因此，当订阅处于 `past_due` 状态时，`swap` 和 `updateQuantity` 方法将抛出异常。

<a name="subscription-scopes"></a>
#### 订阅作用域

大多数订阅状态也可以作为查询作用域使用，以便你可以轻松查询数据库中处于给定状态的订阅：

```php
// Get all valid subscriptions...
$subscriptions = Subscription::query()->valid()->get();

// Get all of the canceled subscriptions for a user...
$subscriptions = $user->subscriptions()->canceled()->get();
```

以下是可用作用域的完整列表：

```php
Subscription::query()->valid();
Subscription::query()->onTrial();
Subscription::query()->expiredTrial();
Subscription::query()->notOnTrial();
Subscription::query()->active();
Subscription::query()->recurring();
Subscription::query()->pastDue();
Subscription::query()->paused();
Subscription::query()->notPaused();
Subscription::query()->onPausedGracePeriod();
Subscription::query()->notOnPausedGracePeriod();
Subscription::query()->canceled();
Subscription::query()->notCanceled();
Subscription::query()->onGracePeriod();
Subscription::query()->notOnGracePeriod();
```

<a name="subscription-single-charges"></a>
### 订阅单次收费

订阅单次收费允许你在订阅的基础上向订阅者收取一次性费用。在调用 `charge` 方法时，你必须提供一个或多个价格 ID：

```php
// Charge a single price...
$response = $user->subscription()->charge('pri_123');

// Charge multiple prices at once...
$response = $user->subscription()->charge(['pri_123', 'pri_456']);
```

`charge` 方法实际上不会向客户收费，直到他们的下一个计费周期。如果你想立即向客户收费，可以使用 `chargeAndInvoice` 方法：

```php
$response = $user->subscription()->chargeAndInvoice('pri_123');
```

<a name="updating-payment-information"></a>
### 更新付款信息

Paddle 始终为每个订阅保存一种付款方式。如果你想更新订阅的默认付款方式，应使用订阅模型上的 `redirectToUpdatePaymentMethod` 方法将客户重定向到 Paddle 托管的付款方式更新页面：

```php
use Illuminate\Http\Request;

Route::get('/update-payment-method', function (Request $request) {
    $user = $request->user();

    return $user->subscription()->redirectToUpdatePaymentMethod();
});
```

当用户完成信息更新后，Paddle 将派发一个 `subscription_updated` webhook，并且应用程序数据库中的订阅详情将随之更新。

<a name="changing-plans"></a>
### 更改计划

用户订阅你的应用程序后，他们有时可能想要切换到新的订阅计划。要更新用户的订阅计划，应将 Paddle 价格标识符传递给订阅的 `swap` 方法：

```php
use App\Models\User;

$user = User::find(1);

$user->subscription()->swap($premium = 'pri_456');
```

如果你想切换计划并立即向用户开具发票，而不是等待其下一个计费周期，可以使用 `swapAndInvoice` 方法：

```php
$user = User::find(1);

$user->subscription()->swapAndInvoice($premium = 'pri_456');
```

<a name="prorations"></a>
#### 按比例调整

默认情况下，Paddle 在切换计划时会按比例调整费用。`noProrate` 方法可用于更新订阅而不按比例调整费用：

```php
$user->subscription('default')->noProrate()->swap($premium = 'pri_456');
```

如果你想禁用按比例调整并立即向客户开具发票，可以将 `swapAndInvoice` 方法与 `noProrate` 结合使用：

```php
$user->subscription('default')->noProrate()->swapAndInvoice($premium = 'pri_456');
```

或者，要不向客户收取订阅更改费用，你可以使用 `doNotBill` 方法：

```php
$user->subscription('default')->doNotBill()->swap($premium = 'pri_456');
```

有关 Paddle 按比例调整策略的更多信息，请查阅 Paddle 的[按比例调整文档](https://developer.paddle.com/concepts/subscriptions/proration)。

<a name="subscription-quantity"></a>
### 订阅数量

有时订阅会受到"数量"的影响。例如，项目管理应用程序可能每个项目每月收费 10 美元。要轻松增加或减少订阅数量，请使用 `incrementQuantity` 和 `decrementQuantity` 方法：

```php
$user = User::find(1);

$user->subscription()->incrementQuantity();

// Add five to the subscription's current quantity...
$user->subscription()->incrementQuantity(5);

$user->subscription()->decrementQuantity();

// Subtract five from the subscription's current quantity...
$user->subscription()->decrementQuantity(5);
```

或者，你可以使用 `updateQuantity` 方法设置特定的数量：

```php
$user->subscription()->updateQuantity(10);
```

`noProrate` 方法可用于更新订阅数量而不按比例调整费用：

```php
$user->subscription()->noProrate()->updateQuantity(10);
```

<a name="quantities-for-subscription-with-multiple-products"></a>
#### 多产品订阅的数量

如果你的订阅是[多产品订阅](#subscriptions-with-multiple-products)，你应在增加/减少方法中将价格 ID 作为第二个参数传递：

```php
$user->subscription()->incrementQuantity(1, 'price_chat');
```

<a name="subscriptions-with-multiple-products"></a>
### 多产品订阅

[多产品订阅](https://developer.paddle.com/build/subscriptions/add-remove-products-prices-addons)允许你将多个计费产品分配给单个订阅。例如，想象你正在构建一个客户服务"帮助台"应用程序，其基础订阅价格为每月 10 美元，但提供每月额外 15 美元的实时聊天附加产品。

创建订阅结账会话时，你可以通过向 `subscribe` 方法传递一个价格数组作为第一个参数来为给定订阅指定多个产品：

```php
use Illuminate\Http\Request;

Route::post('/user/subscribe', function (Request $request) {
    $checkout = $request->user()->subscribe([
        'price_monthly',
        'price_chat',
    ]);

    return view('billing', ['checkout' => $checkout]);
});
```

在上面的示例中，客户将有两个价格附加到他们的 `default` 订阅上。这两个价格将在各自对应的计费周期内收取。如有必要，你可以传递一个关联数组（键/值对）来指示每个价格的特定数量：

```php
$user = User::find(1);

$checkout = $user->subscribe('default', ['price_monthly', 'price_chat' => 5]);
```

如果你想为现有订阅添加另一个价格，必须使用订阅的 `swap` 方法。在调用 `swap` 方法时，还应包括订阅的当前价格和数量：

```php
$user = User::find(1);

$user->subscription()->swap(['price_chat', 'price_original' => 2]);
```

上面的示例将添加新价格，但在下一个计费周期之前不会向客户收取费用。如果你想立即向客户收费，可以使用 `swapAndInvoice` 方法：

```php
$user->subscription()->swapAndInvoice(['price_chat', 'price_original' => 2]);
```

你可以通过使用 `swap` 方法并省略要移除的价格来从订阅中移除价格：

```php
$user->subscription()->swap(['price_original' => 2]);
```

> [!WARNING]
> 你不能移除订阅的最后一个价格。相反，应直接取消订阅。

<a name="multiple-subscriptions"></a>
### 多订阅

Paddle 允许你的客户同时拥有多个订阅。例如，你可能经营一家健身房，提供游泳订阅和举重订阅，每个订阅可能有不同的定价。当然，客户应该能够订阅其中一种或两种计划。

当你的应用程序创建订阅时，你可以将订阅的类型作为第二个参数传递给 `subscribe` 方法。该类型可以是代表用户发起的订阅类型的任何字符串：

```php
use Illuminate\Http\Request;

Route::post('/swimming/subscribe', function (Request $request) {
    $checkout = $request->user()->subscribe($swimmingMonthly = 'pri_123', 'swimming');

    return view('billing', ['checkout' => $checkout]);
});
```

在此示例中，我们为客户启动了一个月度游泳订阅。但是，他们以后可能希望切换到年度订阅。在调整客户订阅时，我们可以简单地切换 `swimming` 订阅的价格：

```php
$user->subscription('swimming')->swap($swimmingYearly = 'pri_456');
```

当然，你也可以完全取消订阅：

```php
$user->subscription('swimming')->cancel();
```

<a name="pausing-subscriptions"></a>
### 暂停订阅

要暂停订阅，请在用户的订阅上调用 `pause` 方法：

```php
$user->subscription()->pause();
```

当订阅暂停时，Cashier 会自动在数据库中设置 `paused_at` 列。此列用于确定 `paused` 方法何时应开始返回 `true`。例如，如果客户在 3 月 1 日暂停订阅，但订阅原定于 3 月 5 日才续费，则 `paused` 方法将持续返回 `false` 直到 3 月 5 日。这是因为用户通常被允许在计费周期结束前继续使用应用程序。

默认情况下，暂停发生在下一个计费周期，以便客户可以使用他们已支付的剩余时间段。如果你想立即暂停订阅，可以使用 `pauseNow` 方法：

```php
$user->subscription()->pauseNow();
```

使用 `pauseUntil` 方法，你可以将订阅暂停到特定时间点：

```php
$user->subscription()->pauseUntil(now()->plus(months: 1));
```

或者，你可以使用 `pauseNowUntil` 方法立即将订阅暂停到指定时间点：

```php
$user->subscription()->pauseNowUntil(now()->plus(months: 1));
```

你可以使用 `onPausedGracePeriod` 方法确定用户是否已暂停订阅但仍在"宽限期"内：

```php
if ($user->subscription()->onPausedGracePeriod()) {
    // ...
}
```

要恢复暂停的订阅，你可以调用订阅上的 `resume` 方法：

```php
$user->subscription()->resume();
```

> [!WARNING]
> 订阅暂停期间无法修改。如果你想切换到不同的计划或更新数量，必须先恢复订阅。

<a name="canceling-subscriptions"></a>
### 取消订阅

要取消订阅，请在用户的订阅上调用 `cancel` 方法：

```php
$user->subscription()->cancel();
```

当订阅取消时，Cashier 会自动在数据库中设置 `ends_at` 列。此列用于确定 `subscribed` 方法何时应开始返回 `false`。例如，如果客户在 3 月 1 日取消订阅，但订阅原定于 3 月 5 日才结束，则 `subscribed` 方法将持续返回 `true` 直到 3 月 5 日。这是因为用户通常被允许在计费周期结束前继续使用应用程序。

你可以使用 `onGracePeriod` 方法确定用户是否已取消订阅但仍在"宽限期"内：

```php
if ($user->subscription()->onGracePeriod()) {
    // ...
}
```

如果你想立即取消订阅，可以在订阅上调用 `cancelNow` 方法：

```php
$user->subscription()->cancelNow();
```

要阻止处于宽限期的订阅被取消，你可以调用 `stopCancelation` 方法：

```php
$user->subscription()->stopCancelation();
```

> [!WARNING]
> Paddle 的订阅在取消后无法恢复。如果你的客户希望恢复其订阅，他们将必须创建新的订阅。

<a name="subscription-trials"></a>
## 订阅试用

<a name="with-payment-method-up-front"></a>
### 预先提供付款方式

如果你想为客户提供试用期，同时仍预先收集付款方式信息，应在 Paddle 控制面板中为客户订阅的价格设置试用时间。然后，正常启动结账会话：

```php
use Illuminate\Http\Request;

Route::get('/user/subscribe', function (Request $request) {
    $checkout = $request->user()
        ->subscribe('pri_monthly')
        ->returnTo(route('home'));

    return view('billing', ['checkout' => $checkout]);
});
```

当你的应用程序收到 `subscription_created` 事件时，Cashier 将在应用程序数据库中的订阅记录上设置试用期结束日期，并指示 Paddle 在此日期之前不要开始向客户收费。

> [!WARNING]
> 如果在试用结束日期之前没有取消客户的订阅，他们将在试用期满后立即被收费，因此你应确保通知用户试用结束日期。

你可以使用用户实例上的 `onTrial` 方法来确定用户是否在试用期内：

```php
if ($user->onTrial()) {
    // ...
}
```

要确定现有试用是否已过期，你可以使用 `hasExpiredTrial` 方法：

```php
if ($user->hasExpiredTrial()) {
    // ...
}
```

要确定用户是否处于特定订阅类型的试用期，你可以将类型提供给 `onTrial` 或 `hasExpiredTrial` 方法：

```php
if ($user->onTrial('default')) {
    // ...
}

if ($user->hasExpiredTrial('default')) {
    // ...
}
```

<a name="without-payment-method-up-front"></a>
### 不预先提供付款方式

如果你想提供试用期而不预先收集用户的付款方式信息，可以将附加到用户的客户记录上的 `trial_ends_at` 列设置为你想要的试用结束日期。这通常在用户注册时完成：

```php
use App\Models\User;

$user = User::create([
    // ...
]);

$user->createAsCustomer([
    'trial_ends_at' => now()->plus(days: 10)
]);
```

Cashier 将这种试用称为"通用试用"，因为它不附加到任何现有订阅。`User` 实例上的 `onTrial` 方法将在当前日期未超过 `trial_ends_at` 值时返回 `true`：

```php
if ($user->onTrial()) {
    // User is within their trial period...
}
```

一旦你准备好为用户创建实际订阅，可以像往常一样使用 `subscribe` 方法：

```php
use Illuminate\Http\Request;

Route::get('/user/subscribe', function (Request $request) {
    $checkout = $request->user()
        ->subscribe('pri_monthly')
        ->returnTo(route('home'));

    return view('billing', ['checkout' => $checkout]);
});
```

要检索用户的试用结束日期，可以使用 `trialEndsAt` 方法。如果用户在试用期，此方法将返回一个 Carbon 日期实例；否则返回 `null`。如果你想获取特定订阅（非默认订阅）的试用结束日期，也可以传递一个可选的订阅类型参数：

```php
if ($user->onTrial('default')) {
    $trialEndsAt = $user->trialEndsAt();
}
```

如果你想知道用户是否正处于"通用"试用期且尚未创建实际订阅，可以使用 `onGenericTrial` 方法：

```php
if ($user->onGenericTrial()) {
    // User is within their "generic" trial period...
}
```

<a name="extend-or-activate-a-trial"></a>
### 延长或激活试用

你可以通过在订阅上调用 `extendTrial` 方法并指定试用期应结束的时间点来延长订阅的现有试用期：

```php
$user->subscription()->extendTrial(now()->plus(days: 5));
```

或者，你可以通过调用订阅上的 `activate` 方法来立即激活订阅并结束其试用期：

```php
$user->subscription()->activate();
```

<a name="handling-paddle-webhooks"></a>
## 处理 Paddle Webhooks

Paddle 可以通过 webhook 通知你的应用程序各种事件。默认情况下，Cashier 服务提供者会注册一个指向 Cashier webhook 控制器的路由。此控制器将处理所有传入的 webhook 请求。

默认情况下，此控制器将自动处理因失败次数过多而取消订阅、订阅更新和付款方式更改；但是，我们稍后将看到，你可以扩展此控制器以处理你喜欢的任何 Paddle webhook 事件。

为了确保你的应用程序可以处理 Paddle webhook，请务必在 Paddle 控制面板中[配置 webhook URL](https://vendors.paddle.com/notifications-v2)。默认情况下，Cashier 的 webhook 控制器响应 `/paddle/webhook` URL 路径。你应在 Paddle 控制面板中启用的所有 webhook 的完整列表如下：

- Customer Updated
- Transaction Completed
- Transaction Updated
- Subscription Created
- Subscription Updated
- Subscription Paused
- Subscription Canceled

> [!WARNING]
> 请确保使用 Cashier 包含的 [webhook 签名验证](/docs/{{version}}/cashier-paddle#verifying-webhook-signatures)中间件保护传入请求。

<a name="webhooks-csrf-protection"></a>
#### Webhooks 和 CSRF 保护

由于 Paddle webhook 需要绕过 Laravel 的 [CSRF 保护](/docs/{{version}}/csrf)，你应确保 Laravel 不会尝试验证传入 Paddle webhook 的 CSRF 令牌。为此，你应在应用程序的 `bootstrap/app.php` 文件中将 `paddle/*` 从 CSRF 保护中排除：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->preventRequestForgery(except: [
        'paddle/*',
    ]);
})
```

<a name="webhooks-local-development"></a>
#### Webhooks 和本地开发

为了让 Paddle 在本地开发期间能够向你的应用程序发送 webhook，你需要通过诸如 [Ngrok](https://ngrok.com/) 或 [Expose](https://expose.dev/docs/introduction) 之类的站点共享服务来暴露你的应用程序。如果你正在使用 [Laravel Sail](/docs/{{version}}/sail) 在本地开发应用程序，可以使用 Sail 的[站点共享命令](/docs/{{version}}/sail#sharing-your-site)。

<a name="defining-webhook-event-handlers"></a>
### 定义 Webhook 事件处理器

Cashier 自动处理因失败收费而取消订阅以及其他常见的 Paddle webhook 事件。但是，如果你希望处理其他 webhook 事件，可以通过监听 Cashier 派发的以下事件来实现：

- `Laravel\Paddle\Events\WebhookReceived`
- `Laravel\Paddle\Events\WebhookHandled`

这两个事件都包含 Paddle webhook 的完整负载。例如，如果你希望处理 `transaction.billed` webhook，可以注册一个[监听器](/docs/{{version}}/events#defining-listeners)来处理该事件：

```php
<?php

namespace App\Listeners;

use Laravel\Paddle\Events\WebhookReceived;

class PaddleEventListener
{
    /**
     * Handle received Paddle webhooks.
     */
    public function handle(WebhookReceived $event): void
    {
        if ($event->payload['event_type'] === 'transaction.billed') {
            // Handle the incoming event...
        }
    }
}
```

Cashier 还会发出专门针对接收到的 webhook 类型的事件。除了来自 Paddle 的完整负载外，它们还包含用于处理 webhook 的相关模型，例如 billable 模型、订阅或收据：

<div class="content-list" markdown="1">

- `Laravel\Paddle\Events\CustomerUpdated`
- `Laravel\Paddle\Events\TransactionCompleted`
- `Laravel\Paddle\Events\TransactionUpdated`
- `Laravel\Paddle\Events\SubscriptionCreated`
- `Laravel\Paddle\Events\SubscriptionUpdated`
- `Laravel\Paddle\Events\SubscriptionPaused`
- `Laravel\Paddle\Events\SubscriptionCanceled`

</div>

你也可以通过在应用程序的 `.env` 文件中定义 `CASHIER_WEBHOOK` 环境变量来覆盖默认的内置 webhook 路由。此值应为 webhook 路由的完整 URL，并且需要与在 Paddle 控制面板中设置的 URL 匹配：

```ini
CASHIER_WEBHOOK=https://example.com/my-paddle-webhook-url
```

<a name="verifying-webhook-signatures"></a>
### 验证 Webhook 签名

为了保护你的 webhook 安全，你可以使用 [Paddle 的 webhook 签名](https://developer.paddle.com/webhooks/signature-verification)。为了方便起见，Cashier 自动包含一个中间件，用于验证传入的 Paddle webhook 请求是否有效。

要启用 webhook 验证，请确保在应用程序的 `.env` 文件中定义了 `PADDLE_WEBHOOK_SECRET` 环境变量。webhook 密钥可以从你的 Paddle 账户控制面板中获取。

<a name="single-charges"></a>
## 单次收费

<a name="charging-for-products"></a>
### 产品收费

如果你想为客户发起产品购买，可以使用 billable 模型实例上的 `checkout` 方法生成购买结账会话。`checkout` 方法接受一个或多个价格 ID。如有必要，可以使用关联数组来提供所购产品的数量：

```php
use Illuminate\Http\Request;

Route::get('/buy', function (Request $request) {
    $checkout = $request->user()->checkout(['pri_tshirt', 'pri_socks' => 5]);

    return view('buy', ['checkout' => $checkout]);
});
```

生成结账会话后，你可以使用 Cashier 提供的 `paddle-button` [Blade 组件](#overlay-checkout)让用户查看 Paddle 结账小部件并完成购买：

```blade
<x-paddle-button :checkout="$checkout" class="px-8 py-4">
    Buy
</x-paddle-button>
```

结账会话有一个 `customData` 方法，允许你向底层交易创建传递任何自定义数据。请查阅 [Paddle 文档](https://developer.paddle.com/build/transactions/custom-data)以了解有关传递自定义数据时可用的选项的更多信息：

```php
$checkout = $user->checkout('pri_tshirt')
    ->customData([
        'custom_option' => $value,
    ]);
```

<a name="refunding-transactions"></a>
### 退款交易

退款交易会将退款金额退回到客户购买时使用的付款方式。如果你需要退款 Paddle 购买，可以在 `Cashier\Paddle\Transaction` 模型上使用 `refund` 方法。此方法接受一个原因作为第一个参数，以及一个或多个要退款的价格 ID（带有可选金额）作为关联数组。你可以使用 `transactions` 方法检索给定 billable 模型的交易。

例如，假设我们要退款一笔包含 `pri_123` 和 `pri_456` 价格的特定交易。我们希望全额退款 `pri_123`，但仅退款 `pri_456` 的两美元：

```php
use App\Models\User;

$user = User::find(1);

$transaction = $user->transactions()->first();

$response = $transaction->refund('Accidental charge', [
    'pri_123', // Fully refund this price...
    'pri_456' => 200, // Only partially refund this price...
]);
```

上面的示例退款了交易中的特定行项目。如果你想退还整个交易，只需提供一个原因：

```php
$response = $transaction->refund('Accidental charge');
```

有关退款的更多信息，请查阅 [Paddle 的退款文档](https://developer.paddle.com/build/transactions/create-transaction-adjustments)。

> [!WARNING]
> 退款在完全处理之前必须始终获得 Paddle 的批准。

<a name="crediting-transactions"></a>
### 贷记交易

与退款类似，你也可以贷记交易。贷记交易会将资金添加到客户的余额中，以便用于未来购买。贷记交易只能用于手动收取的交易，而不能用于自动收取的交易（如订阅），因为 Paddle 会自动处理订阅贷记：

```php
$transaction = $user->transactions()->first();

// Credit a specific line item fully...
$response = $transaction->credit('Compensation', 'pri_123');
```

有关更多信息，[请参阅 Paddle 关于贷记的文档](https://developer.paddle.com/build/transactions/create-transaction-adjustments)。

> [!WARNING]
> 贷记只能应用于手动收取的交易。自动收取的交易由 Paddle 自己进行贷记。

<a name="transactions"></a>
## 交易

你可以通过 `transactions` 属性轻松检索 billable 模型的交易数组：

```php
use App\Models\User;

$user = User::find(1);

$transactions = $user->transactions;
```

交易代表你的产品和购买的付款，并附有发票。只有已完成的交易才会存储在应用程序的数据库中。

在列出客户的交易时，你可以使用交易实例的方法来显示相关的付款信息。例如，你可能希望在一个表格中列出每笔交易，使用户能够轻松下载任何发票：

```html
<table>
    @foreach ($transactions as $transaction)
        <tr>
            <td>{{ $transaction->billed_at->toFormattedDateString() }}</td>
            <td>{{ $transaction->total() }}</td>
            <td>{{ $transaction->tax() }}</td>
            <td><a href="{{ route('download-invoice', $transaction->id) }}" target="_blank">Download</a></td>
        </tr>
    @endforeach
</table>
```

`download-invoice` 路由可能如下所示：

```php
use Illuminate\Http\Request;
use Laravel\Paddle\Transaction;

Route::get('/download-invoice/{transaction}', function (Request $request, Transaction $transaction) {
    return $transaction->redirectToInvoicePdf();
})->name('download-invoice');
```

<a name="past-and-upcoming-payments"></a>
### 过去和即将到来的付款

你可以使用 `lastPayment` 和 `nextPayment` 方法来检索和显示客户定期订阅的过去或即将到来的付款：

```php
use App\Models\User;

$user = User::find(1);

$subscription = $user->subscription();

$lastPayment = $subscription->lastPayment();
$nextPayment = $subscription->nextPayment();
```

这两个方法都将返回 `Laravel\Paddle\Payment` 的实例；但是，当交易尚未通过 webhook 同步时，`lastPayment` 将返回 `null`，而当计费周期已结束时（例如订阅已取消），`nextPayment` 将返回 `null`：

```blade
Next payment: {{ $nextPayment->amount() }} due on {{ $nextPayment->date()->format('d/m/Y') }}
```

<a name="testing"></a>
## 测试

在测试时，你应手动测试计费流程，以确保你的集成按预期工作。

对于自动化测试，包括在 CI 环境中执行的测试，你可以使用 [Laravel 的 HTTP 客户端](/docs/{{version}}/http-client#testing)来伪造向 Paddle 发出的 HTTP 调用。虽然这不能测试来自 Paddle 的实际响应，但它确实提供了一种在不实际调用 Paddle API 的情况下测试应用程序的方法。

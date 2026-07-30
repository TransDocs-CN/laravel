# Laravel Cashier (Stripe)

- [简介](#introduction)
- [升级 Cashier](#upgrading-cashier)
- [安装](#installation)
- [配置](#configuration)
    - [Billable 模型](#billable-model)
    - [API 密钥](#api-keys)
    - [货币配置](#currency-configuration)
    - [税务配置](#tax-configuration)
    - [日志](#logging)
    - [使用自定义模型](#using-custom-models)
- [快速开始](#quickstart)
    - [销售产品](#quickstart-selling-products)
    - [销售订阅](#quickstart-selling-subscriptions)
- [客户](#customers)
    - [检索客户](#retrieving-customers)
    - [创建客户](#creating-customers)
    - [更新客户](#updating-customers)
    - [余额](#balances)
    - [税号](#tax-ids)
    - [与 Stripe 同步客户数据](#syncing-customer-data-with-stripe)
    - [计费门户](#billing-portal)
- [付款方式](#payment-methods)
    - [存储付款方式](#storing-payment-methods)
    - [检索付款方式](#retrieving-payment-methods)
    - [付款方式存在性](#payment-method-presence)
    - [更新默认付款方式](#updating-the-default-payment-method)
    - [添加付款方式](#adding-payment-methods)
    - [删除付款方式](#deleting-payment-methods)
- [订阅](#subscriptions)
    - [创建订阅](#creating-subscriptions)
    - [检查订阅状态](#checking-subscription-status)
    - [更改价格](#changing-prices)
    - [订阅数量](#subscription-quantity)
    - [多产品订阅](#subscriptions-with-multiple-products)
    - [多订阅](#multiple-subscriptions)
    - [基于用量的计费](#usage-based-billing)
    - [订阅税费](#subscription-taxes)
    - [订阅锚定日期](#subscription-anchor-date)
    - [取消订阅](#cancelling-subscriptions)
    - [恢复订阅](#resuming-subscriptions)
- [订阅试用](#subscription-trials)
    - [预先提供付款方式](#with-payment-method-up-front)
    - [不预先提供付款方式](#without-payment-method-up-front)
    - [延长试用](#extending-trials)
- [处理 Stripe Webhooks](#handling-stripe-webhooks)
    - [定义 Webhook 事件处理器](#defining-webhook-event-handlers)
    - [验证 Webhook 签名](#verifying-webhook-signatures)
- [单次收费](#single-charges)
    - [简单收费](#simple-charge)
    - [带发票的收费](#charge-with-invoice)
    - [创建付款意向](#creating-payment-intents)
    - [退款](#refunding-charges)
- [发票](#invoices)
    - [检索发票](#retrieving-invoices)
    - [即将到来的发票](#upcoming-invoices)
    - [预览订阅发票](#previewing-subscription-invoices)
    - [生成发票 PDF](#generating-invoice-pdfs)
- [结账](#checkout)
    - [产品结账](#product-checkouts)
    - [单次收费结账](#single-charge-checkouts)
    - [订阅结账](#subscription-checkouts)
    - [收集税号](#collecting-tax-ids)
    - [访客结账](#guest-checkouts)
- [处理失败付款](#handling-failed-payments)
    - [确认付款](#confirming-payments)
- [强客户身份验证（SCA）](#strong-customer-authentication)
    - [需要额外确认的付款](#payments-requiring-additional-confirmation)
    - [离线会话付款通知](#off-session-payment-notifications)
- [Stripe SDK](#stripe-sdk)
- [测试](#testing)

<a name="introduction"></a>
## 简介

[Laravel Cashier Stripe](https://github.com/laravel/cashier-stripe) 为 [Stripe 的](https://stripe.com)订阅计费服务提供了富有表现力、流畅的接口。它处理了几乎所有你害怕编写的样板订阅计费代码。除了基本的订阅管理外，Cashier 还可以处理优惠券、切换订阅、订阅"数量"、取消宽限期，甚至生成发票 PDF。

<a name="upgrading-cashier"></a>
## 升级 Cashier

升级到新版本的 Cashier 时，仔细阅读[升级指南](https://github.com/laravel/cashier-stripe/blob/16.x/UPGRADE.md)非常重要。

> [!WARNING]
> 为了防止破坏性变更，Cashier 使用固定的 Stripe API 版本。Cashier 16 使用 Stripe API 版本 `2025-06-30.basil`。Stripe API 版本将在次要版本中更新，以便利用新的 Stripe 功能和改进。

<a name="installation"></a>
## 安装

首先，使用 Composer 包管理器安装适用于 Stripe 的 Cashier 包：

```shell
composer require laravel/cashier
```

安装包后，使用 `vendor:publish` Artisan 命令发布 Cashier 的迁移文件：

```shell
php artisan vendor:publish --tag="cashier-migrations"
```

然后，运行数据库迁移：

```shell
php artisan migrate
```

Cashier 的迁移将在你的 `users` 表中添加几个列。它们还将创建一个新的 `subscriptions` 表来保存所有客户的订阅，以及一个 `subscription_items` 表用于多价格订阅。

如果你愿意，也可以使用 `vendor:publish` Artisan 命令发布 Cashier 的配置文件：

```shell
php artisan vendor:publish --tag="cashier-config"
```

最后，为确保 Cashier 正确处理所有 Stripe 事件，请记住[配置 Cashier 的 webhook 处理](#handling-stripe-webhooks)。

> [!WARNING]
> Stripe 建议任何用于存储 Stripe 标识符的列都应区分大小写。因此，在使用 MySQL 时，应确保 `stripe_id` 列的排序规则设置为 `utf8_bin`。有关此问题的更多信息，请参阅 [Stripe 文档](https://stripe.com/docs/upgrades#what-changes-does-stripe-consider-to-be-backwards-compatible)。

<a name="configuration"></a>
## 配置

<a name="billable-model"></a>
### Billable 模型

在使用 Cashier 之前，请将 `Billable` trait 添加到你的 billable 模型定义中。通常，这将是 `App\Models\User` 模型。此 trait 提供了各种方法，允许你执行常见的计费任务，例如创建订阅、应用优惠券和更新付款方式信息：

```php
use Laravel\Cashier\Billable;

class User extends Authenticatable
{
    use Billable;
}
```

Cashier 假定你的 billable 模型将是 Laravel 附带的 `App\Models\User` 类。如果你希望更改此设置，可以通过 `useCustomerModel` 方法指定不同的模型。通常，此方法应在 `AppServiceProvider` 类的 `boot` 方法中调用：

```php
use App\Models\Cashier\User;
use Laravel\Cashier\Cashier;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Cashier::useCustomerModel(User::class);
}
```

> [!WARNING]
> 如果你使用的不是 Laravel 提供的 `App\Models\User` 模型，则需要发布并修改提供的 [Cashier 迁移](#installation)，以匹配你替代模型的表名。

<a name="api-keys"></a>
### API 密钥

接下来，在应用程序的 `.env` 文件中配置你的 Stripe API 密钥。你可以从 Stripe 控制面板获取 Stripe API 密钥：

```ini
STRIPE_KEY=your-stripe-key
STRIPE_SECRET=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
```

> [!WARNING]
> 你应确保在应用程序的 `.env` 文件中定义了 `STRIPE_WEBHOOK_SECRET` 环境变量，因为此变量用于确保传入的 webhook 确实来自 Stripe。

<a name="currency-configuration"></a>
### 货币配置

默认的 Cashier 货币是美元（USD）。你可以通过在应用程序的 `.env` 文件中设置 `CASHIER_CURRENCY` 环境变量来更改默认货币：

```ini
CASHIER_CURRENCY=eur
```

除了配置 Cashier 的货币外，你还可以指定一个区域设置，用于在发票上格式化显示货币值。在内部，Cashier 使用 [PHP 的 `NumberFormatter` 类](https://www.php.net/manual/en/class.numberformatter.php)来设置货币区域：

```ini
CASHIER_CURRENCY_LOCALE=nl_BE
```

> [!WARNING]
> 为了使用 `en` 以外的区域设置，请确保在服务器上安装并配置了 `ext-intl` PHP 扩展。

<a name="tax-configuration"></a>
### 税务配置

借助 [Stripe Tax](https://stripe.com/tax)，可以自动计算 Stripe 生成的所有发票的税费。你可以通过在应用程序 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用 `calculateTaxes` 方法来启用自动税费计算：

```php
use Laravel\Cashier\Cashier;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Cashier::calculateTaxes();
}
```

启用税费计算后，任何新订阅和生成的一次性发票都将自动计算税费。

为了使此功能正常工作，客户的计费详情（如客户姓名、地址和税号）需要同步到 Stripe。你可以使用 Cashier 提供的[客户数据同步](#syncing-customer-data-with-stripe)和[税号](#tax-ids)方法来实现。

<a name="logging"></a>
### 日志

Cashier 允许你指定在记录致命的 Stripe 错误时要使用的日志通道。你可以通过在应用程序的 `.env` 文件中定义 `CASHIER_LOGGER` 环境变量来指定日志通道：

```ini
CASHIER_LOGGER=stack
```

由 API 调用 Stripe 生成的异常将通过应用程序的默认日志通道记录。

<a name="using-custom-models"></a>
### 使用自定义模型

你可以自由扩展 Cashier 内部使用的模型，方法是定义自己的模型并扩展相应的 Cashier 模型：

```php
use Laravel\Cashier\Subscription as CashierSubscription;

class Subscription extends CashierSubscription
{
    // ...
}
```

定义模型后，你可以通过 `Laravel\Cashier\Cashier` 类指示 Cashier 使用你的自定义模型。通常，你应在应用程序的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中告知 Cashier 你的自定义模型：

```php
use App\Models\Cashier\Subscription;
use App\Models\Cashier\SubscriptionItem;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Cashier::useSubscriptionModel(Subscription::class);
    Cashier::useSubscriptionItemModel(SubscriptionItem::class);
}
```

<a name="quickstart"></a>
## 快速开始

<a name="quickstart-selling-products"></a>
### 销售产品

> [!NOTE]
> 在使用 Stripe Checkout 之前，应在 Stripe 控制面板中定义具有固定价格的产品。此外，还应[配置 Cashier 的 webhook 处理](#handling-stripe-webhooks)。

通过应用程序提供产品和订阅计费可能令人生畏。但是，得益于 Cashier 和 [Stripe Checkout](https://stripe.com/payments/checkout)，你可以轻松构建现代、强大的付款集成。

要向客户收取非循环的单次产品费用，我们将使用 Cashier 将客户引导到 Stripe Checkout，他们将在其中提供付款详情并确认购买。一旦通过 Checkout 完成付款，客户将重定向到你应用程序中你选择的一个成功 URL：

```php
use Illuminate\Http\Request;

Route::get('/checkout', function (Request $request) {
    $stripePriceId = 'price_deluxe_album';

    $quantity = 1;

    return $request->user()->checkout([$stripePriceId => $quantity], [
        'success_url' => route('checkout-success'),
        'cancel_url' => route('checkout-cancel'),
    ]);
})->name('checkout');

Route::view('/checkout/success', 'checkout.success')->name('checkout-success');
Route::view('/checkout/cancel', 'checkout.cancel')->name('checkout-cancel');
```

如上述示例所示，我们将使用 Cashier 提供的 `checkout` 方法将客户重定向到给定"价格标识符"的 Stripe Checkout。使用 Stripe 时，"价格"指的是[特定产品的定义价格](https://stripe.com/docs/products-prices/how-products-and-prices-work)。

如果需要，`checkout` 方法会自动在 Stripe 中创建客户，并将该 Stripe 客户记录连接到应用程序数据库中的相应用户。完成结账会话后，客户将被重定向到专门的成功或取消页面，你可以在其中向客户显示信息性消息。

<a name="providing-meta-data-to-stripe-checkout"></a>
#### 向 Stripe Checkout 提供元数据

销售产品时，通常通过应用程序自己定义的 `Cart` 和 `Order` 模型来跟踪已完成的订单和已购买的产品。当将客户重定向到 Stripe Checkout 以完成购买时，你可能需要提供现有订单标识符，以便在客户重定向回你的应用程序时，可以将已完成的购买与相应的订单关联起来。

为此，你可以向 `checkout` 方法提供一个 `metadata` 数组。让我们想象一下，当用户开始结账流程时，在我们的应用程序中创建了一个待处理的 `Order`。记住，此示例中的 `Cart` 和 `Order` 模型仅用于说明，并非由 Cashier 提供。你可以根据自己的应用需求自由实现这些概念：

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

    return $request->user()->checkout($order->price_ids, [
        'success_url' => route('checkout-success').'?session_id={CHECKOUT_SESSION_ID}',
        'cancel_url' => route('checkout-cancel'),
        'metadata' => ['order_id' => $order->id],
    ]);
})->name('checkout');
```

如上述示例所示，当用户开始结账流程时，我们将向 `checkout` 方法提供购物车/订单关联的所有 Stripe 价格标识符。当然，当客户添加这些项目时，你的应用程序负责将这些项目与"购物车"或订单关联起来。我们还通过 `metadata` 数组向 Stripe Checkout 会话提供了订单的 ID。最后，我们在结账成功路由中添加了 `CHECKOUT_SESSION_ID` 模板变量。当 Stripe 将客户重定向回你的应用程序时，此模板变量将自动填充为 Checkout 会话 ID。

接下来，让我们构建 Checkout 成功路由。这是用户通过 Stripe Checkout 完成购买后将重定向到的路由。在此路由中，我们可以检索 Stripe Checkout 会话 ID 和关联的 Stripe Checkout 实例，以访问我们提供的元数据并相应地更新客户的订单：

```php
use App\Models\Order;
use Illuminate\Http\Request;
use Laravel\Cashier\Cashier;

Route::get('/checkout/success', function (Request $request) {
    $sessionId = $request->get('session_id');

    if ($sessionId === null) {
        return;
    }

    $session = Cashier::stripe()->checkout->sessions->retrieve($sessionId);

    if ($session->payment_status !== 'paid') {
        return;
    }

    $orderId = $session['metadata']['order_id'] ?? null;

    $order = Order::findOrFail($orderId);

    $order->update(['status' => 'completed']);

    return view('checkout-success', ['order' => $order]);
})->name('checkout-success');
```

请参考 Stripe 的文档以获取更多关于 [Checkout 会话对象包含的数据](https://stripe.com/docs/api/checkout/sessions/object)的信息。

<a name="quickstart-selling-subscriptions"></a>
### 销售订阅

> [!NOTE]
> 在使用 Stripe Checkout 之前，应在 Stripe 控制面板中定义具有固定价格的产品。此外，还应[配置 Cashier 的 webhook 处理](#handling-stripe-webhooks)。

通过应用程序提供产品和订阅计费可能令人生畏。但是，得益于 Cashier 和 [Stripe Checkout](https://stripe.com/payments/checkout)，你可以轻松构建现代、强大的付款集成。

要了解如何使用 Cashier 和 Stripe Checkout 销售订阅，让我们考虑一个简单的订阅服务场景，该服务提供月度（`price_basic_monthly`）和年度（`price_basic_yearly`）计划。这两个价格可以在我们的 Stripe 控制面板中归入"Basic"产品（`pro_basic`）下。此外，我们的订阅服务可能提供 `pro_expert` 作为 Expert 计划。

首先，让我们了解客户如何订阅我们的服务。当然，你可以想象客户可能会在我们应用程序的定价页面上点击 Basic 计划的"订阅"按钮。此按钮或链接应将用户引导至一个 Laravel 路由，该路由为其选择的计划创建 Stripe Checkout 会话：

```php
use Illuminate\Http\Request;

Route::get('/subscription-checkout', function (Request $request) {
    return $request->user()
        ->newSubscription('default', 'price_basic_monthly')
        ->trialDays(5)
        ->allowPromotionCodes()
        ->checkout([
            'success_url' => route('your-success-route'),
            'cancel_url' => route('your-cancel-route'),
        ]);
});
```

如上述示例所示，我们将客户重定向到一个 Stripe Checkout 会话，该会话允许他们订阅我们的 Basic 计划。成功结账或取消后，客户将被重定向回我们提供给 `checkout` 方法的 URL。要知道他们的订阅何时实际开始（因为某些付款方式需要几秒钟处理），我们还需要[配置 Cashier 的 webhook 处理](#handling-stripe-webhooks)。

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
            return redirect('/billing');
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

当然，客户可能希望将其订阅计划更改为其他产品或"层级"。最简单的方法是引导客户到 Stripe 的[客户计费门户](https://stripe.com/docs/no-code/customer-portal)，该门户提供了一个托管的用户界面，允许客户下载发票、更新付款方式和更改订阅计划。

首先，在应用程序中定义一个链接或按钮，将用户引导至一个 Laravel 路由，我们将使用该路由启动计费门户会话：

```blade
<a href="{{ route('billing') }}">
    Billing
</a>
```

接下来，让我们定义启动 Stripe 客户计费门户会话并将用户重定向到门户的路由。`redirectToBillingPortal` 方法接受用户退出门户时应返回的 URL：

```php
use Illuminate\Http\Request;

Route::get('/billing', function (Request $request) {
    return $request->user()->redirectToBillingPortal(route('dashboard'));
})->middleware(['auth'])->name('billing');
```

> [!NOTE]
> 只要你已配置 Cashier 的 webhook 处理，Cashier 将通过检查来自 Stripe 的传入 webhook，自动保持应用程序中与 Cashier 相关的数据库表同步。因此，例如，当用户通过 Stripe 的客户计费门户取消订阅时，Cashier 将收到相应的 webhook 并在应用程序数据库中将订阅标记为"已取消"。

<a name="customers"></a>
## 客户

<a name="retrieving-customers"></a>
### 检索客户

你可以使用 `Cashier::findBillable` 方法通过 Stripe ID 检索客户。此方法将返回 billable 模型的实例：

```php
use Laravel\Cashier\Cashier;

$user = Cashier::findBillable($stripeId);
```

<a name="creating-customers"></a>
### 创建客户

有时，你可能希望在不开始订阅的情况下创建 Stripe 客户。你可以使用 `createAsStripeCustomer` 方法来实现：

```php
$stripeCustomer = $user->createAsStripeCustomer();
```

一旦在 Stripe 中创建了客户，你可以在以后开始订阅。你可以提供一个可选的 `$options` 数组来传递 [Stripe API 支持的任何其他客户创建参数](https://stripe.com/docs/api/customers/create)：

```php
$stripeCustomer = $user->createAsStripeCustomer($options);
```

如果你希望返回 billable 模型的 Stripe 客户对象，可以使用 `asStripeCustomer` 方法：

```php
$stripeCustomer = $user->asStripeCustomer();
```

如果你想检索给定 billable 模型的 Stripe 客户对象但不确定 billable 模型是否已经是 Stripe 中的客户，可以使用 `createOrGetStripeCustomer` 方法。如果 Stripe 中尚不存在客户，此方法将创建一个新客户：

```php
$stripeCustomer = $user->createOrGetStripeCustomer();
```

<a name="updating-customers"></a>
### 更新客户

有时，你可能希望直接使用其他信息更新 Stripe 客户。你可以使用 `updateStripeCustomer` 方法来实现。此方法接受一个 [Stripe API 支持的客户更新选项](https://stripe.com/docs/api/customers/update)数组：

```php
$stripeCustomer = $user->updateStripeCustomer($options);
```

<a name="balances"></a>
### 余额

Stripe 允许你增加或减少客户的"余额"。之后，此余额将在新发票上计入或扣除。要检查客户的总余额，你可以使用 billable 模型上可用的 `balance` 方法。`balance` 方法将返回余额在客户货币中的格式化字符串表示：

```php
$balance = $user->balance();
```

要增加客户余额，你可以向 `creditBalance` 方法提供一个值。如果你愿意，还可以提供描述：

```php
$user->creditBalance(500, 'Premium customer top-up.');
```

向 `debitBalance` 方法提供一个值将减少客户的余额：

```php
$user->debitBalance(300, 'Bad usage penalty.');
```

`applyBalance` 方法将为客户创建新的客户余额交易。你可以使用 `balanceTransactions` 方法检索这些交易记录，这对于向客户提供贷项和借项日志供其查看可能很有用：

```php
// Retrieve all transactions...
$transactions = $user->balanceTransactions();

foreach ($transactions as $transaction) {
    // Transaction amount...
    $amount = $transaction->amount(); // $2.31

    // Retrieve the related invoice when available...
    $invoice = $transaction->invoice();
}
```

<a name="tax-ids"></a>
### 税号

Cashier 提供了一种简单的方法来管理客户的税号。例如，`taxIds` 方法可用于检索分配给客户的所有[税号](https://stripe.com/docs/api/customer_tax_ids/object)作为集合：

```php
$taxIds = $user->taxIds();
```

你也可以通过标识符检索客户的特定税号：

```php
$taxId = $user->findTaxId('txi_belgium');
```

你可以通过提供有效的[类型](https://stripe.com/docs/api/customer_tax_ids/object#tax_id_object-type)和值给 `createTaxId` 方法来创建新税号：

```php
$taxId = $user->createTaxId('eu_vat', 'BE0123456789');
```

`createTaxId` 方法将立即将 VAT ID 添加到客户的账户中。[VAT ID 的验证也由 Stripe 完成](https://stripe.com/docs/invoicing/customer/tax-ids#validation)；但是，这是一个异步过程。你可以通过订阅 `customer.tax_id.updated` webhook 事件并检查 [VAT ID 的 `verification` 参数](https://stripe.com/docs/api/customer_tax_ids/object#tax_id_object-verification)来接收验证更新的通知。有关处理 webhook 的更多信息，请查阅[定义 webhook 处理器的文档](#handling-stripe-webhooks)。

你可以使用 `deleteTaxId` 方法删除税号：

```php
$user->deleteTaxId('txi_belgium');
```

<a name="syncing-customer-data-with-stripe"></a>
### 与 Stripe 同步客户数据

通常，当应用程序的用户更新其姓名、电子邮件地址或 Stripe 也存储的其他信息时，你应通知 Stripe 进行更新。这样做将使 Stripe 的信息副本与你的应用程序保持同步。

要实现自动化，你可以在 billable 模型上定义一个事件监听器，响应模型的 `updated` 事件。然后，在事件监听器中，你可以在模型上调用 `syncStripeCustomerDetails` 方法：

```php
use App\Models\User;
use function Illuminate\Events\queueable;

/**
 * The "booted" method of the model.
 */
protected static function booted(): void
{
    static::updated(queueable(function (User $customer) {
        if ($customer->hasStripeId()) {
            $customer->syncStripeCustomerDetails();
        }
    }));
}
```

现在，每次更新客户模型时，其信息将与 Stripe 同步。为了方便起见，Cashier 会在首次创建客户时自动将客户信息与 Stripe 同步。

你可以通过覆盖 Cashier 提供的多种方法来自定义用于同步客户信息到 Stripe 的列。例如，你可以覆盖 `stripeName` 方法来自定义当 Cashier 将客户信息同步到 Stripe 时应被视为客户"名称"的属性：

```php
/**
 * Get the customer name that should be synced to Stripe.
 */
public function stripeName(): string|null
{
    return $this->company_name;
}
```

类似地，你可以覆盖 `stripeEmail`、`stripePhone`（最多 20 个字符）、`stripeAddress` 和 `stripePreferredLocales` 方法。这些方法将在[更新 Stripe 客户对象](https://stripe.com/docs/api/customers/update)时将其信息同步到相应的客户参数。如果你希望完全控制客户信息同步过程，可以覆盖 `syncStripeCustomerDetails` 方法。

<a name="billing-portal"></a>
### 计费门户

Stripe 提供了[一种设置计费门户的简单方法](https://stripe.com/docs/billing/subscriptions/customer-portal)，以便你的客户可以管理其订阅、付款方式并查看其计费历史记录。你可以通过在控制器或路由中调用 billable 模型上的 `redirectToBillingPortal` 方法将用户重定向到计费门户：

```php
use Illuminate\Http\Request;

Route::get('/billing-portal', function (Request $request) {
    return $request->user()->redirectToBillingPortal();
});
```

默认情况下，当用户完成管理订阅后，他们将能够通过 Stripe 计费门户中的链接返回应用程序的 `home` 路由。你可以通过将自定义 URL 作为参数传递给 `redirectToBillingPortal` 方法来提供用户应返回的自定义 URL：

```php
use Illuminate\Http\Request;

Route::get('/billing-portal', function (Request $request) {
    return $request->user()->redirectToBillingPortal(route('billing'));
});
```

如果你希望生成计费门户的 URL 而不生成 HTTP 重定向响应，可以调用 `billingPortalUrl` 方法：

```php
$url = $request->user()->billingPortalUrl(route('billing'));
```

<a name="payment-methods"></a>
## 付款方式

<a name="storing-payment-methods"></a>
### 存储付款方式

为了使用 Stripe 创建订阅或执行"一次性"收费，你的应用程序需要安全地收集客户的付款详情。用于实现此目的的方法取决于你是计划存储付款方式以供将来订阅使用，还是立即处理单次收费，因此我们将在下面讨论这两种情况。

Stripe 的 [Payment Element](https://stripe.com/docs/payments/payment-element) 可用于支持多种付款方式，如卡、Apple Pay、Google Pay 和 iDEAL。

<a name="payment-element-for-subscriptions"></a>
#### 用于订阅的 Payment Element

首先，创建一个 Setup Intent 并将其传递给你的视图：

```php
return view('subscribe', [
    'intent' => $user->createSetupIntent()
]);
```

使用 Setup Intent 的 `client_secret` 挂载 Payment Element：

```html
<div id="payment-element"></div>
<button id="submit">Subscribe</button>

<script src="https://js.stripe.com/v3/"></script>
<script>
    const stripe = Stripe('stripe-public-key');

    const elements = stripe.elements({
        clientSecret: '{{ $intent->client_secret }}'
    });

    const paymentElement = elements.create('payment');

    paymentElement.mount('#payment-element');

    document.getElementById('submit').addEventListener('click', async () => {
        const { error } = await stripe.confirmSetup({
            elements,
            confirmParams: {
                return_url: '{{ route("subscription.complete") }}',
            },
        });

        if (error) {
            // Display "error.message" to the user...
        }
    });
</script>
```

Stripe 重定向到你的 `return_url` 后，`setup_intent` ID 将作为查询字符串参数可用。你可以使用此值检索付款方式并创建订阅：

```php
use Illuminate\Http\Request;

Route::get('/subscription/complete', function (Request $request) {
    $setupIntent = $request->user()->findSetupIntent(
        $request->setup_intent
    );

    $paymentMethod = $setupIntent->payment_method;

    $request->user()
        ->newSubscription('default', 'price_xxx')
        ->create($paymentMethod);

    return redirect('/dashboard');
})->name('subscription.complete');
```

如果你使用 Payment Element 来更新客户的默认付款方式而不是创建订阅，可以将付款方式标识符传递给 [`updateDefaultPaymentMethod`](#updating-the-default-payment-method) 方法。

<a name="payment-element-for-single-charges"></a>
#### 用于单次收费的 Payment Element

对于一次性付款，使用 Cashier 的 `pay` 方法创建一个 Payment Intent。通常，你应将 Payment Intent ID 存储在应用程序的相应订单上，以便在 Stripe 将客户重定向回你的应用程序后可以检索该订单。以下示例假定你的应用程序有一个包含 `user_id`、`amount`、`status` 和 `stripe_payment_intent_id` 列的 `Order` 模型：

```php
use App\Models\Order;
use Illuminate\Http\Request;

Route::post('/pay', function (Request $request) {
    $amount = 1000;

    $payment = $request->user()->pay($amount);

    $order = Order::create([
        'user_id' => $request->user()->id,
        'amount' => $amount,
        'status' => 'pending',
        'stripe_payment_intent_id' => $payment->id,
    ]);

    return view('checkout', [
        'clientSecret' => $payment->client_secret,
        'order' => $order,
    ]);
});
```

然后，挂载 Payment Element 并确认付款：

```html
<div id="payment-element"></div>
<button id="submit">Pay Now</button>

<script src="https://js.stripe.com/v3/"></script>
<script>
    const stripe = Stripe('stripe-public-key');

    const elements = stripe.elements({
        clientSecret: '{{ $clientSecret }}'
    });

    const paymentElement = elements.create('payment');

    paymentElement.mount('#payment-element');

    document.getElementById('submit').addEventListener('click', async () => {
        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: '{{ route("payment.complete") }}',
            },
        });

        if (error) {
            // Display "error.message" to the user...
        }
    });
</script>
```

重定向后，你可以使用 `payment_intent` 查询字符串参数检索相应的订单和 Payment Intent。在完成订单之前，你应验证订单属于已认证客户，且 Payment Intent 属于已认证客户并已成功：

```php
use App\Models\Order;
use Illuminate\Http\Request;

Route::get('/payment/complete', function (Request $request) {
    $order = Order::where('user_id', $request->user()->id)
        ->where('stripe_payment_intent_id', $request->payment_intent)
        ->firstOrFail();

    $paymentIntent = $request->user()
        ->stripe()
        ->paymentIntents
        ->retrieve($request->payment_intent);

    if ($paymentIntent->customer === $request->user()->stripe_id &&
        $paymentIntent->status === 'succeeded') {
        $order->update(['status' => 'paid']);

        // Fulfill the order...
    }

    return redirect('/dashboard');
})->name('payment.complete');
```

<a name="retrieving-payment-methods"></a>
### 检索付款方式

billable 模型实例上的 `paymentMethods` 方法返回 `Laravel\Cashier\PaymentMethod` 实例的集合：

```php
$paymentMethods = $user->paymentMethods();
```

默认情况下，此方法将返回所有类型的付款方式。要检索特定类型的付款方式，可以将 `type` 作为参数传递给方法：

```php
$paymentMethods = $user->paymentMethods('sepa_debit');
```

要检索客户的默认付款方式，可以使用 `defaultPaymentMethod` 方法：

```php
$paymentMethod = $user->defaultPaymentMethod();
```

你可以使用 `findPaymentMethod` 方法检索附加到 billable 模型的特定付款方式：

```php
$paymentMethod = $user->findPaymentMethod($paymentMethodId);
```

<a name="payment-method-presence"></a>
### 付款方式存在性

要确定 billable 模型的账户是否附加了默认付款方式，请调用 `hasDefaultPaymentMethod` 方法：

```php
if ($user->hasDefaultPaymentMethod()) {
    // ...
}
```

你可以使用 `hasPaymentMethod` 方法确定 billable 模型的账户是否至少附加了一种付款方式：

```php
if ($user->hasPaymentMethod()) {
    // ...
}
```

此方法将确定 billable 模型是否有任何付款方式。要确定模型是否存在特定类型的付款方式，可以将 `type` 作为参数传递给该方法：

```php
if ($user->hasPaymentMethod('sepa_debit')) {
    // ...
}
```

<a name="updating-the-default-payment-method"></a>
### 更新默认付款方式

`updateDefaultPaymentMethod` 方法可用于更新客户的默认付款方式信息。此方法接受一个 Stripe 付款方式标识符，并将新的付款方式设置为默认计费付款方式：

```php
$user->updateDefaultPaymentMethod($paymentMethod);
```

要将你的默认付款方式信息与 Stripe 中的客户默认付款方式信息同步，可以使用 `updateDefaultPaymentMethodFromStripe` 方法：

```php
$user->updateDefaultPaymentMethodFromStripe();
```

> [!WARNING]
> 客户的默认付款方式只能用于开票和创建新订阅。由于 Stripe 的限制，它不能用于单次收费。

<a name="adding-payment-methods"></a>
### 添加付款方式

要添加新的付款方式，你可以在 billable 模型上调用 `addPaymentMethod` 方法，传递付款方式标识符：

```php
$user->addPaymentMethod($paymentMethod);
```

> [!NOTE]
> 要了解如何检索付款方式标识符，请查看[付款方式存储文档](#storing-payment-methods)。

<a name="deleting-payment-methods"></a>
### 删除付款方式

要删除付款方式，你可以在要删除的 `Laravel\Cashier\PaymentMethod` 实例上调用 `delete` 方法：

```php
$paymentMethod->delete();
```

`deletePaymentMethod` 方法将删除 billable 模型的特定付款方式：

```php
$user->deletePaymentMethod('pm_visa');
```

`deletePaymentMethods` 方法将删除 billable 模型的所有付款方式信息：

```php
$user->deletePaymentMethods();
```

默认情况下，此方法将删除所有类型的付款方式。要删除特定类型的付款方式，可以将 `type` 作为参数传递给方法：

```php
$user->deletePaymentMethods('sepa_debit');
```

> [!WARNING]
> 如果用户有活跃订阅，你的应用程序不应允许他们删除默认付款方式。

<a name="subscriptions"></a>
## 订阅

订阅提供了一种为你的客户设置定期付款的方式。Cashier 管理的 Stripe 订阅支持多个订阅价格、订阅数量、试用期等。

<a name="creating-subscriptions"></a>
### 创建订阅

要创建订阅，首先检索 billable 模型的实例，通常是 `App\Models\User` 的实例。检索到模型实例后，你可以使用 `newSubscription` 方法创建模型的订阅：

```php
use Illuminate\Http\Request;

Route::post('/user/subscribe', function (Request $request) {
    $request->user()->newSubscription(
        'default', 'price_monthly'
    )->create($request->paymentMethodId);

    // ...
});
```

传递给 `newSubscription` 方法的第一个参数应是订阅的内部类型。如果你的应用程序只提供一个订阅，你可以称之为 `default` 或 `primary`。此订阅类型仅供内部应用程序使用，不打算向用户显示。此外，它不应包含空格，并且在创建订阅后不应更改。第二个参数是用户订阅的特定价格。此值应与 Stripe 中价格的标识符对应。

`create` 方法接受[一个 Stripe 付款方式标识符](#storing-payment-methods)或 Stripe `PaymentMethod` 对象，将开始订阅，并更新数据库中 billable 模型的 Stripe 客户 ID 和其他相关计费信息。

> [!WARNING]
> 直接将付款方式标识符传递给 `create` 订阅方法也会自动将其添加到用户的已存储付款方式中。

<a name="collecting-recurring-payments-via-invoice-emails"></a>
#### 通过发票邮件收集定期付款

除了自动收集客户的定期付款外，你还可以指示 Stripe 在每次定期付款到期时通过电子邮件向客户发送发票。然后，客户在收到发票后可以手动支付。在通过发票收集定期付款时，客户无需预先提供付款方式：

```php
$user->newSubscription('default', 'price_monthly')->createAndSendInvoice();
```

客户在订阅取消前支付发票的时间由 `days_until_due` 选项决定。默认情况下，这是 30 天；但是，如果你愿意，可以为这个选项提供一个特定的值：

```php
$user->newSubscription('default', 'price_monthly')->createAndSendInvoice([], [
    'days_until_due' => 30
]);
```

<a name="subscription-quantities"></a>
#### 数量

如果你希望在创建订阅时设置特定的[数量](https://stripe.com/docs/billing/subscriptions/quantities)，应在创建订阅之前在订阅构建器上调用 `quantity` 方法：

```php
$user->newSubscription('default', 'price_monthly')
    ->quantity(5)
    ->create($paymentMethod);
```

<a name="additional-details"></a>
#### 其他详情

如果你希望指定 Stripe 支持的其他[客户](https://stripe.com/docs/api/customers/create)或[订阅](https://stripe.com/docs/api/subscriptions/create)选项，可以将它们作为第二和第三个参数传递给 `create` 方法：

```php
$user->newSubscription('default', 'price_monthly')->create($paymentMethod, [
    'email' => $email,
], [
    'metadata' => ['note' => 'Some extra information.'],
]);
```

<a name="coupons"></a>
#### 优惠券

如果你希望在创建订阅时应用优惠券，可以使用 `withCoupon` 方法：

```php
$user->newSubscription('default', 'price_monthly')
    ->withCoupon('code')
    ->create($paymentMethod);
```

或者，如果你想应用 [Stripe 促销代码](https://stripe.com/docs/billing/subscriptions/discounts/codes)，可以使用 `withPromotionCode` 方法：

```php
$user->newSubscription('default', 'price_monthly')
    ->withPromotionCode('promo_code_id')
    ->create($paymentMethod);
```

给定的促销代码 ID 应为分配给促销代码的 Stripe API ID，而不是面向客户的促销代码。如果你需要根据给定的面向客户的促销代码查找促销代码 ID，可以使用 `findPromotionCode` 方法：

```php
// Find a promotion code ID by its customer facing code...
$promotionCode = $user->findPromotionCode('SUMMERSALE');

// Find an active promotion code ID by its customer facing code...
$promotionCode = $user->findActivePromotionCode('SUMMERSALE');
```

在上面的示例中，返回的 `$promotionCode` 对象是 `Laravel\Cashier\PromotionCode` 的实例。此类装饰了底层的 `Stripe\PromotionCode` 对象。你可以通过调用 `coupon` 方法检索与促销代码关联的优惠券：

```php
$coupon = $user->findPromotionCode('SUMMERSALE')->coupon();
```

优惠券实例允许你确定折扣金额以及优惠券代表的是固定折扣还是基于百分比的折扣：

```php
if ($coupon->isPercentage()) {
    return $coupon->percentOff().'%'; // 21.5%
} else {
    return $coupon->amountOff(); // $5.99
}
```

你也可以检索当前应用于客户或订阅的折扣：

```php
$discount = $billable->discount();

$discount = $subscription->discount();
```

返回的 `Laravel\Cashier\Discount` 实例装饰了底层的 `Stripe\Discount` 对象实例。你可以通过调用 `coupon` 方法检索与此折扣关联的优惠券：

```php
$coupon = $subscription->discount()->coupon();
```

如果你想将新的优惠券或促销代码应用于客户或订阅，可以通过 `applyCoupon` 或 `applyPromotionCode` 方法来实现：

```php
$billable->applyCoupon('coupon_id');
$billable->applyPromotionCode('promotion_code_id');

$subscription->applyCoupon('coupon_id');
$subscription->applyPromotionCode('promotion_code_id');
```

记住，你应使用分配给促销代码的 Stripe API ID，而不是面向客户的促销代码。在给定时间，只能将一个优惠券或促销代码应用于客户或订阅。

有关此主题的更多信息，请查阅 Stripe 关于[优惠券](https://stripe.com/docs/billing/subscriptions/coupons)和[促销代码](https://stripe.com/docs/billing/subscriptions/coupons/codes)的文档。

<a name="adding-subscriptions"></a>
#### 添加订阅

如果你想为已有默认付款方式的客户添加订阅，可以在订阅构建器上调用 `add` 方法：

```php
use App\Models\User;

$user = User::find(1);

$user->newSubscription('default', 'price_monthly')->add();
```

<a name="creating-subscriptions-from-the-stripe-dashboard"></a>
#### 从 Stripe 控制面板创建订阅

你也可以直接从 Stripe 控制面板创建订阅。这样做时，Cashier 将同步新添加的订阅并将其类型分配为 `default`。要自定义分配给控制面板创建的订阅的订阅类型，请[定义 webhook 事件处理器](#defining-webhook-event-handlers)。

此外，你只能通过 Stripe 控制面板创建一种类型的订阅。如果你的应用程序提供使用不同类型的多个订阅，则只能通过 Stripe 控制面板添加一种类型的订阅。

最后，你应始终确保仅为你应用程序提供的每种订阅类型添加一个活跃订阅。如果客户有两个 `default` 订阅，Cashier 将仅使用最近添加的订阅，即使两者都将与应用程序数据库同步。

<a name="checking-subscription-status"></a>
### 检查订阅状态

一旦客户订阅了你的应用程序，你可以使用各种方便的方法轻松检查其订阅状态。首先，`subscribed` 方法在客户拥有活跃订阅时返回 `true`，即使订阅当前处于试用期。`subscribed` 方法接受订阅类型作为其第一个参数：

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
        if ($request->user() && ! $request->user()->subscribed('default')) {
            // This user is not a paying customer...
            return redirect('/billing');
        }

        return $next($request);
    }
}
```

如果你想确定用户是否仍在试用期内，可以使用 `onTrial` 方法。此方法对于确定是否应在用户仍在试用期时显示警告非常有用：

```php
if ($user->subscription('default')->onTrial()) {
    // ...
}
```

`subscribedToProduct` 方法可用于根据给定的 Stripe 产品标识符确定用户是否已订阅给定产品。在 Stripe 中，产品是价格的集合。在此示例中，我们将确定用户的 `default` 订阅是否活跃订阅了应用程序的"premium"产品。给定的 Stripe 产品标识符应与 Stripe 控制面板中某个产品的标识符对应：

```php
if ($user->subscribedToProduct('prod_premium', 'default')) {
    // ...
}
```

通过向 `subscribedToProduct` 方法传递一个数组，你可以确定用户的 `default` 订阅是否活跃订阅了应用程序的"basic"或"premium"产品：

```php
if ($user->subscribedToProduct(['prod_basic', 'prod_premium'], 'default')) {
    // ...
}
```

`subscribedToPrice` 方法可用于确定客户的订阅是否对应于给定的价格 ID：

```php
if ($user->subscribedToPrice('price_basic_monthly', 'default')) {
    // ...
}
```

`recurring` 方法可用于确定用户当前是否处于活跃订阅状态，且不再处于试用期：

```php
if ($user->subscription('default')->recurring()) {
    // ...
}
```

> [!WARNING]
> 如果用户有两个相同类型的订阅，`subscription` 方法将始终返回最近的订阅。例如，一个用户可能有两个类型为 `default` 的订阅记录；但是，其中一个可能是旧的过期订阅，而另一个是当前的活跃订阅。将始终返回最近的订阅，而较旧的订阅保留在数据库中用于历史审查。

<a name="cancelled-subscription-status"></a>
#### 已取消订阅状态

要确定用户是否曾是活跃订阅者但已取消订阅，可以使用 `canceled` 方法：

```php
if ($user->subscription('default')->canceled()) {
    // ...
}
```

你也可以确定用户是否已取消订阅但仍处于"宽限期"，直到订阅完全过期。例如，如果用户在 3 月 5 日取消了一个原定于 3 月 10 日到期的订阅，则该用户处于"宽限期"直到 3 月 10 日。注意，在此期间 `subscribed` 方法仍返回 `true`：

```php
if ($user->subscription('default')->onGracePeriod()) {
    // ...
}
```

要确定用户是否已取消订阅且不再处于"宽限期"，可以使用 `ended` 方法：

```php
if ($user->subscription('default')->ended()) {
    // ...
}
```

<a name="incomplete-and-past-due-status"></a>
#### 不完整和逾期状态

如果订阅在创建后需要二次付款操作，订阅将被标记为 `incomplete`。订阅状态存储在 Cashier 的 `subscriptions` 数据库表的 `stripe_status` 列中。

类似地，如果在切换价格时需要二次付款操作，订阅将被标记为 `past_due`。当你的订阅处于这些状态中的任何一个时，它都不会处于活跃状态，直到客户确认付款。确定订阅是否有不完整的付款可以使用 billable 模型或订阅实例上的 `hasIncompletePayment` 方法完成：

```php
if ($user->hasIncompletePayment('default')) {
    // ...
}

if ($user->subscription('default')->hasIncompletePayment()) {
    // ...
}
```

当订阅有不完整的付款时，你应将用户引导至 Cashier 的付款确认页面，并传递 `latestPayment` 标识符。你可以使用订阅实例上可用的 `latestPayment` 方法检索此标识符：

```html
<a href="{{ route('cashier.payment', $subscription->latestPayment()->id) }}">
    Please confirm your payment.
</a>
```

如果你希望订阅在 `past_due` 或 `incomplete` 状态时仍被视为活跃，可以使用 Cashier 提供的 `keepPastDueSubscriptionsActive` 和 `keepIncompleteSubscriptionsActive` 方法。通常，这些方法应在 `App\Providers\AppServiceProvider` 的 `register` 方法中调用：

```php
use Laravel\Cashier\Cashier;

/**
 * Register any application services.
 */
public function register(): void
{
    Cashier::keepPastDueSubscriptionsActive();
    Cashier::keepIncompleteSubscriptionsActive();
}
```

> [!WARNING]
> 当订阅处于 `incomplete` 状态时，在付款确认之前无法更改。因此，当订阅处于 `incomplete` 状态时，`swap` 和 `updateQuantity` 方法将抛出异常。

<a name="subscription-scopes"></a>
#### 订阅作用域

大多数订阅状态也可以作为查询作用域使用，以便你可以轻松查询数据库中处于给定状态的订阅：

```php
// Get all active subscriptions...
$subscriptions = Subscription::query()->active()->get();

// Get all of the canceled subscriptions for a user...
$subscriptions = $user->subscriptions()->canceled()->get();
```

以下是可用作用域的完整列表：

```php
Subscription::query()->active();
Subscription::query()->canceled();
Subscription::query()->ended();
Subscription::query()->incomplete();
Subscription::query()->notCanceled();
Subscription::query()->notOnGracePeriod();
Subscription::query()->notOnTrial();
Subscription::query()->onGracePeriod();
Subscription::query()->onTrial();
Subscription::query()->pastDue();
Subscription::query()->recurring();
```

<a name="changing-prices"></a>
### 更改价格

客户订阅你的应用程序后，他们有时可能想要切换到新的订阅价格。要切换客户到新价格，请将 Stripe 价格标识符传递给 `swap` 方法。切换价格时，如果订阅以前被取消，假定用户希望重新激活其订阅。给定的价格标识符应与 Stripe 控制面板中可用的 Stripe 价格标识符对应：

```php
use App\Models\User;

$user = App\Models\User::find(1);

$user->subscription('default')->swap('price_yearly');
```

如果客户在试用期，试用期将保持不变。此外，如果订阅存在"数量"，该数量也将保持不变。

如果你想切换价格并取消客户当前正在进行的任何试用期，可以调用 `skipTrial` 方法：

```php
$user->subscription('default')
    ->skipTrial()
    ->swap('price_yearly');
```

如果你想切换价格并立即向客户开具发票，而不是等待其下一个计费周期，可以使用 `swapAndInvoice` 方法：

```php
$user = User::find(1);

$user->subscription('default')->swapAndInvoice('price_yearly');
```

<a name="prorations"></a>
#### 按比例调整

默认情况下，Stripe 在切换价格时会按比例调整费用。`noProrate` 方法可用于更新订阅价格而不按比例调整费用：

```php
$user->subscription('default')->noProrate()->swap('price_yearly');
```

有关订阅按比例调整的更多信息，请查阅 [Stripe 文档](https://stripe.com/docs/billing/subscriptions/prorations)。

> [!WARNING]
> 在 `swapAndInvoice` 方法之前执行 `noProrate` 方法不会对按比例调整产生影响。发票始终会发出。

<a name="subscription-quantity"></a>
### 订阅数量

有时订阅会受到"数量"的影响。例如，项目管理应用程序可能每个项目每月收费 10 美元。你可以使用 `incrementQuantity` 和 `decrementQuantity` 方法轻松增加或减少订阅数量：

```php
use App\Models\User;

$user = User::find(1);

$user->subscription('default')->incrementQuantity();

// Add five to the subscription's current quantity...
$user->subscription('default')->incrementQuantity(5);

$user->subscription('default')->decrementQuantity();

// Subtract five from the subscription's current quantity...
$user->subscription('default')->decrementQuantity(5);
```

或者，你可以使用 `updateQuantity` 方法设置特定的数量：

```php
$user->subscription('default')->updateQuantity(10);
```

`noProrate` 方法可用于更新订阅数量而不按比例调整费用：

```php
$user->subscription('default')->noProrate()->updateQuantity(10);
```

有关订阅数量的更多信息，请查阅 [Stripe 文档](https://stripe.com/docs/subscriptions/quantities)。

<a name="quantities-for-subscription-with-multiple-products"></a>
#### 多产品订阅的数量

如果你的订阅是[多产品订阅](#subscriptions-with-multiple-products)，你应在增加/减少方法中将价格 ID 作为第二个参数传递：

```php
$user->subscription('default')->incrementQuantity(1, 'price_chat');
```

<a name="subscriptions-with-multiple-products"></a>
### 多产品订阅

[多产品订阅](https://stripe.com/docs/billing/subscriptions/multiple-products)允许你将多个计费产品分配给单个订阅。例如，想象你正在构建一个客户服务"帮助台"应用程序，其基础订阅价格为每月 10 美元，但提供每月额外 15 美元的实时聊天附加产品。多产品订阅的信息存储在 Cashier 的 `subscription_items` 数据库表中。

你可以通过将价格数组作为第二个参数传递给 `newSubscription` 方法来为给定订阅指定多个产品：

```php
use Illuminate\Http\Request;

Route::post('/user/subscribe', function (Request $request) {
    $request->user()->newSubscription('default', [
        'price_monthly',
        'price_chat',
    ])->create($request->paymentMethodId);

    // ...
});
```

在上面的示例中，客户将有两个价格附加到他们的 `default` 订阅上。这两个价格将在各自对应的计费周期内收取。如有必要，你可以使用 `quantity` 方法来指示每个价格的特定数量：

```php
$user = User::find(1);

$user->newSubscription('default', ['price_monthly', 'price_chat'])
    ->quantity(5, 'price_chat')
    ->create($paymentMethod);
```

如果你想为现有订阅添加另一个价格，可以调用订阅的 `addPrice` 方法：

```php
$user = User::find(1);

$user->subscription('default')->addPrice('price_chat');
```

上面的示例将添加新价格，客户将在下一个计费周期被收费。如果你想立即向客户收费，可以使用 `addPriceAndInvoice` 方法：

```php
$user->subscription('default')->addPriceAndInvoice('price_chat');
```

如果你想添加具有特定数量的价格，可以将数量作为 `addPrice` 或 `addPriceAndInvoice` 方法的第二个参数传递：

```php
$user = User::find(1);

$user->subscription('default')->addPrice('price_chat', 5);
```

你可以使用 `removePrice` 方法从订阅中移除价格：

```php
$user->subscription('default')->removePrice('price_chat');
```

> [!WARNING]
> 你不能移除订阅的最后一个价格。相反，应直接取消订阅。

<a name="swapping-prices"></a>
#### 切换价格

你也可以更改附加到多产品订阅的价格。例如，想象一个客户有一个附带 `price_chat` 附加产品的 `price_basic` 订阅，你想将客户从 `price_basic` 升级到 `price_pro` 价格：

```php
use App\Models\User;

$user = User::find(1);

$user->subscription('default')->swap(['price_pro', 'price_chat']);
```

执行上述示例时，具有 `price_basic` 的底层订阅项被删除，具有 `price_chat` 的订阅项被保留。此外，为 `price_pro` 创建了新的订阅项。

你也可以通过向 `swap` 方法传递键/值对数组来指定订阅项选项。例如，你可能需要指定订阅价格数量：

```php
$user = User::find(1);

$user->subscription('default')->swap([
    'price_pro' => ['quantity' => 5],
    'price_chat'
]);
```

如果你想在订阅上切换单个价格，可以在订阅项本身上使用 `swap` 方法。如果你希望保留订阅其他价格上的所有现有元数据，这种方法特别有用：

```php
$user = User::find(1);

$user->subscription('default')
    ->findItemOrFail('price_basic')
    ->swap('price_pro');
```

<a name="proration"></a>
#### 按比例调整

默认情况下，Stripe 在向多产品订阅添加或移除价格时会按比例调整费用。如果你希望在不按比例调整的情况下进行价格调整，应将 `noProrate` 方法链式调用到你的价格操作上：

```php
$user->subscription('default')->noProrate()->removePrice('price_chat');
```

<a name="swapping-quantities"></a>
#### 数量

如果你想更新单个订阅价格的数量，可以通过将价格 ID 作为附加参数传递给方法，使用[现有的数量方法](#subscription-quantity)来实现：

```php
$user = User::find(1);

$user->subscription('default')->incrementQuantity(5, 'price_chat');

$user->subscription('default')->decrementQuantity(3, 'price_chat');

$user->subscription('default')->updateQuantity(10, 'price_chat');
```

> [!WARNING]
> 当订阅有多个价格时，`Subscription` 模型上的 `stripe_price` 和 `quantity` 属性将为 `null`。要访问个别价格属性，应使用 `Subscription` 模型上可用的 `items` 关系。

<a name="subscription-items"></a>
#### 订阅项

当订阅有多个价格时，它将有多个订阅"项"存储在数据库的 `subscription_items` 表中。你可以通过订阅上的 `items` 关系访问这些项：

```php
use App\Models\User;

$user = User::find(1);

$subscriptionItem = $user->subscription('default')->items->first();

// Retrieve the Stripe price and quantity for a specific item...
$stripePrice = $subscriptionItem->stripe_price;
$quantity = $subscriptionItem->quantity;
```

你也可以使用 `findItemOrFail` 方法检索特定价格：

```php
$user = User::find(1);

$subscriptionItem = $user->subscription('default')->findItemOrFail('price_chat');
```

<a name="multiple-subscriptions"></a>
### 多订阅

Stripe 允许你的客户同时拥有多个订阅。例如，你可能经营一家健身房，提供游泳订阅和举重订阅，每个订阅可能有不同的定价。当然，客户应该能够订阅其中一种或两种计划。

当你的应用程序创建订阅时，你可以将订阅的类型传递给 `newSubscription` 方法。该类型可以是代表用户发起的订阅类型的任何字符串：

```php
use Illuminate\Http\Request;

Route::post('/swimming/subscribe', function (Request $request) {
    $request->user()->newSubscription('swimming')
        ->price('price_swimming_monthly')
        ->create($request->paymentMethodId);

    // ...
});
```

在此示例中，我们为客户启动了一个月度游泳订阅。但是，他们以后可能希望切换到年度订阅。在调整客户订阅时，我们可以简单地切换 `swimming` 订阅的价格：

```php
$user->subscription('swimming')->swap('price_swimming_yearly');
```

当然，你也可以完全取消订阅：

```php
$user->subscription('swimming')->cancel();
```

<a name="usage-based-billing"></a>
### 基于用量的计费

[基于用量的计费](https://stripe.com/docs/billing/subscriptions/metered-billing)允许你根据客户在计费周期内的产品用量来收费。例如，你可以根据客户每月发送的短信或电子邮件数量来收费。

要开始使用按用量计费，你需要先在 Stripe 控制面板中创建一个具有[基于用量的计费模型](https://docs.stripe.com/billing/subscriptions/usage-based/implementation-guide)的新产品和一个[计量器](https://docs.stripe.com/billing/subscriptions/usage-based/recording-usage#configure-meter)。创建计量器后，存储关联的事件名称和计量器 ID，你将需要这些来报告和检索用量。然后，使用 `meteredPrice` 方法将计量价格 ID 添加到客户订阅：

```php
use Illuminate\Http\Request;

Route::post('/user/subscribe', function (Request $request) {
    $request->user()->newSubscription('default')
        ->meteredPrice('price_metered')
        ->create($request->paymentMethodId);

    // ...
});
```

你也可以通过 [Stripe Checkout](#checkout) 启动按用量计费的订阅：

```php
$checkout = Auth::user()
    ->newSubscription('default', [])
    ->meteredPrice('price_metered')
    ->checkout();

return view('your-checkout-view', [
    'checkout' => $checkout,
]);
```

<a name="reporting-usage"></a>
#### 报告用量

当你的客户使用你的应用程序时，你需要向 Stripe 报告其用量，以便他们可以被准确计费。要报告计量事件的使用量，你可以在 `Billable` 模型上使用 `reportMeterEvent` 方法：

```php
$user = User::find(1);

$user->reportMeterEvent('emails-sent');
```

默认情况下，计费周期会添加"用量数量"1。或者，你可以传递要添加到客户计费周期用量的特定"用量"量：

```php
$user = User::find(1);

$user->reportMeterEvent('emails-sent', quantity: 15);
```

要检索客户的计量器事件摘要，你可以使用 `Billable` 实例的 `meterEventSummaries` 方法：

```php
$user = User::find(1);

$meterUsage = $user->meterEventSummaries($meterId);

$meterUsage->first()->aggregated_value // 10
```

请参阅 Stripe 的 [Meter Event Summary 对象文档](https://docs.stripe.com/api/billing/meter-event_summary/object)以获取有关计量事件摘要的更多信息。

要[列出所有计量器](https://docs.stripe.com/api/billing/meter/list)，你可以使用 `Billable` 实例的 `meters` 方法：

```php
$user = User::find(1);

$user->meters();
```

<a name="subscription-taxes"></a>
### 订阅税费

> [!WARNING]
> 与其手动计算税率，你可以[使用 Stripe Tax 自动计算税费](#tax-configuration)

要指定用户为订阅支付的税率，你应在 billable 模型上实现 `taxRates` 方法并返回一个包含 Stripe 税率 ID 的数组。你可以在 [Stripe 控制面板](https://dashboard.stripe.com/test/tax-rates)中定义这些税率：

```php
/**
 * The tax rates that should apply to the customer's subscriptions.
 *
 * @return array<int, string>
 */
public function taxRates(): array
{
    return ['txr_id'];
}
```

`taxRates` 方法允许你在每个客户的基础上应用税率，这对于跨越多个国家和税率的用户群可能很有帮助。

如果你提供多产品订阅，可以通过在 billable 模型上实现 `priceTaxRates` 方法为每个价格定义不同的税率：

```php
/**
 * The tax rates that should apply to the customer's subscriptions.
 *
 * @return array<string, array<int, string>>
 */
public function priceTaxRates(): array
{
    return [
        'price_monthly' => ['txr_id'],
    ];
}
```

> [!WARNING]
> `taxRates` 方法仅适用于订阅收费。如果你使用 Cashier 进行"一次性"收费，则需要当时手动指定税率。

<a name="syncing-tax-rates"></a>
#### 同步税率

当更改由 `taxRates` 方法返回的硬编码税率 ID 时，用户任何现有订阅的税务设置将保持不变。如果你希望使用新的 `taxRates` 值更新现有订阅的税务值，应在用户的订阅实例上调用 `syncTaxRates` 方法：

```php
$user->subscription('default')->syncTaxRates();
```

这也会同步多产品订阅的任何项目税率。如果你的应用程序提供多产品订阅，应确保 billable 模型实现了[上面讨论的](#subscription-taxes)`priceTaxRates` 方法。

<a name="tax-exemption"></a>
#### 免税

Cashier 还提供了 `isNotTaxExempt`、`isTaxExempt` 和 `reverseChargeApplies` 方法来确定客户是否免税。这些方法将调用 Stripe API 来确定的客户的免税状态：

```php
use App\Models\User;

$user = User::find(1);

$user->isTaxExempt();
$user->isNotTaxExempt();
$user->reverseChargeApplies();
```

> [!WARNING]
> 这些方法也可用于任何 `Laravel\Cashier\Invoice` 对象。但是，当在 `Invoice` 对象上调用时，这些方法将确定创建发票时的免税状态。

<a name="subscription-anchor-date"></a>
### 订阅锚定日期

默认情况下，计费周期锚点是订阅创建的日期，或者如果使用了试用期，则是试用期结束的日期。如果你希望修改计费锚点日期，可以使用 `anchorBillingCycleOn` 方法：

```php
use Illuminate\Http\Request;

Route::post('/user/subscribe', function (Request $request) {
    $anchor = Carbon::parse('first day of next month');

    $request->user()->newSubscription('default', 'price_monthly')
        ->anchorBillingCycleOn($anchor->startOfDay())
        ->create($request->paymentMethodId);

    // ...
});
```

有关管理订阅计费周期的更多信息，请查阅 [Stripe 计费周期文档](https://stripe.com/docs/billing/subscriptions/billing-cycle)。

<a name="cancelling-subscriptions"></a>
### 取消订阅

要取消订阅，请在用户的订阅上调用 `cancel` 方法：

```php
$user->subscription('default')->cancel();
```

当订阅取消时，Cashier 会自动在 `subscriptions` 数据库表中设置 `ends_at` 列。此列用于知道 `subscribed` 方法何时应开始返回 `false`。

例如，如果客户在 3 月 1 日取消订阅，但订阅原定于 3 月 5 日才结束，则 `subscribed` 方法将持续返回 `true` 直到 3 月 5 日。这是因为用户通常被允许在计费周期结束前继续使用应用程序。

你可以使用 `onGracePeriod` 方法确定用户是否已取消订阅但仍在"宽限期"内：

```php
if ($user->subscription('default')->onGracePeriod()) {
    // ...
}
```

如果你想立即取消订阅，请在用户的订阅上调用 `cancelNow` 方法：

```php
$user->subscription('default')->cancelNow();
```

如果你想立即取消订阅并对任何剩余的未开票计量用量或新的/待处理的按比例调整发票项进行开票，请在用户的订阅上调用 `cancelNowAndInvoice` 方法：

```php
$user->subscription('default')->cancelNowAndInvoice();
```

你也可以选择在特定时间点取消订阅：

```php
$user->subscription('default')->cancelAt(
    now()->plus(days: 10)
);
```

最后，在删除关联的用户模型之前，你应始终取消用户订阅：

```php
$user->subscription('default')->cancelNow();

$user->delete();
```

<a name="resuming-subscriptions"></a>
### 恢复订阅

如果客户已取消订阅并且你希望恢复，可以在订阅上调用 `resume` 方法。客户必须仍在"宽限期"内才能恢复订阅：

```php
$user->subscription('default')->resume();
```

如果客户取消订阅然后在订阅完全过期之前恢复该订阅，客户将不会被立即收费。相反，他们的订阅将被重新激活，他们将在原始计费周期被收费。

<a name="subscription-trials"></a>
## 订阅试用

<a name="with-payment-method-up-front"></a>
### 预先提供付款方式

如果你想为客户提供试用期，同时仍预先收集付款方式信息，应在创建订阅时使用 `trialDays` 方法：

```php
use Illuminate\Http\Request;

Route::post('/user/subscribe', function (Request $request) {
    $request->user()->newSubscription('default', 'price_monthly')
        ->trialDays(10)
        ->create($request->paymentMethodId);

    // ...
});
```

此方法将在数据库中的订阅记录上设置试用期结束日期，并指示 Stripe 在此日期之前不要开始向客户收费。使用 `trialDays` 方法时，Cashier 将覆盖 Stripe 中为价格配置的任何默认试用期。

> [!WARNING]
> 如果在试用结束日期之前没有取消客户的订阅，他们将在试用期满后立即被收费，因此你应确保通知用户试用结束日期。

`trialUntil` 方法允许你提供一个 `DateTime` 实例来指定试用期应结束的时间：

```php
use Illuminate\Support\Carbon;

$user->newSubscription('default', 'price_monthly')
    ->trialUntil(Carbon::now()->plus(days: 10))
    ->create($paymentMethod);
```

你可以使用用户实例的 `onTrial` 方法或订阅实例的 `onTrial` 方法来确定用户是否在试用期内。以下两个示例是等效的：

```php
if ($user->onTrial('default')) {
    // ...
}

if ($user->subscription('default')->onTrial()) {
    // ...
}
```

你可以使用 `endTrial` 方法立即结束订阅试用：

```php
$user->subscription('default')->endTrial();
```

要确定现有试用是否已过期，可以使用 `hasExpiredTrial` 方法：

```php
if ($user->hasExpiredTrial('default')) {
    // ...
}

if ($user->subscription('default')->hasExpiredTrial()) {
    // ...
}
```

<a name="defining-trial-days-in-stripe-cashier"></a>
#### 在 Stripe / Cashier 中定义试用天数

你可以选择在 Stripe 控制面板中定义价格的试用天数，或者始终使用 Cashier 显式传递它们。如果你选择在 Stripe 中定义价格的试用天数，应了解新订阅（包括过去有过订阅的客户的新订阅）将始终获得试用期，除非你显式调用 `skipTrial()` 方法。

<a name="without-payment-method-up-front"></a>
### 不预先提供付款方式

如果你想提供试用期而不预先收集用户的付款方式信息，可以将用户记录上的 `trial_ends_at` 列设置为你想要的试用结束日期。这通常在用户注册时完成：

```php
use App\Models\User;

$user = User::create([
    // ...
    'trial_ends_at' => now()->plus(days: 10),
]);
```

> [!WARNING]
> 请确保在 billable 模型的类定义中为 `trial_ends_at` 属性添加[日期转换](/docs/{{version}}/eloquent-mutators#date-casting)。

Cashier 将这种试用称为"通用试用"，因为它不附加到任何现有订阅。billable 模型实例上的 `onTrial` 方法将在当前日期未超过 `trial_ends_at` 值时返回 `true`：

```php
if ($user->onTrial()) {
    // User is within their trial period...
}
```

一旦你准备好为用户创建实际订阅，可以像往常一样使用 `newSubscription` 方法：

```php
$user = User::find(1);

$user->newSubscription('default', 'price_monthly')->create($paymentMethod);
```

要检索用户的试用结束日期，可以使用 `trialEndsAt` 方法。如果用户在试用期，此方法将返回一个 Carbon 日期实例；否则返回 `null`。如果你想获取特定订阅（非默认订阅）的试用结束日期，也可以传递一个可选的订阅类型参数：

```php
if ($user->onTrial()) {
    $trialEndsAt = $user->trialEndsAt('main');
}
```

如果你想知道用户是否正处于"通用"试用期且尚未创建实际订阅，可以使用 `onGenericTrial` 方法：

```php
if ($user->onGenericTrial()) {
    // User is within their "generic" trial period...
}
```

<a name="extending-trials"></a>
### 延长试用

`extendTrial` 方法允许你在订阅创建后延长其试用期。如果试用期已过期且客户已经在为订阅付费，你仍然可以提供延长的试用期。在试用期内花费的时间将从客户的下一次发票中扣除：

```php
use App\Models\User;

$subscription = User::find(1)->subscription('default');

// End the trial 7 days from now...
$subscription->extendTrial(
    now()->plus(days: 7)
);

// Add an additional 5 days to the trial...
$subscription->extendTrial(
    $subscription->trial_ends_at->plus(days: 5)
);
```

<a name="handling-stripe-webhooks"></a>
## 处理 Stripe Webhooks

> [!NOTE]
> 你可以使用 [Stripe CLI](https://stripe.com/docs/stripe-cli) 来帮助在本地开发期间测试 webhook。

Stripe 可以通过 webhook 通知你的应用程序各种事件。默认情况下，Cashier 服务提供者会注册一个指向 Cashier webhook 控制器的路由。此控制器将处理所有传入的 webhook 请求。

默认情况下，Cashier webhook 控制器将自动处理因失败次数过多而取消订阅（根据你的 Stripe 设置）、客户更新、客户删除、订阅更新和付款方式更改；但是，我们稍后将看到，你可以扩展此控制器以处理你喜欢的任何 Stripe webhook 事件。

为了确保你的应用程序可以处理 Stripe webhook，请务必在 Stripe 控制面板中配置 webhook URL。默认情况下，Cashier 的 webhook 控制器响应 `/stripe/webhook` URL 路径。你应在 Stripe 控制面板中启用的所有 webhook 的完整列表如下：

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.updated`
- `customer.deleted`
- `payment_method.automatically_updated`
- `invoice.payment_action_required`
- `invoice.payment_succeeded`

为了方便起见，Cashier 包含一个 `cashier:webhook` Artisan 命令。此命令将在 Stripe 中创建一个监听 Cashier 所需的所有事件的 webhook：

```shell
php artisan cashier:webhook
```

默认情况下，创建的 webhook 将指向由 `APP_URL` 环境变量和 Cashier 包含的 `cashier.webhook` 路由定义的 URL。如果你想使用不同的 URL，可以在调用命令时提供 `--url` 选项：

```shell
php artisan cashier:webhook --url "https://example.com/stripe/webhook"
```

创建的 webhook 将使用与你的 Cashier 版本兼容的 Stripe API 版本。如果你想使用不同的 Stripe 版本，可以提供 `--api-version` 选项：

```shell
php artisan cashier:webhook --api-version="2019-12-03"
```

创建后，webhook 将立即激活。如果你想创建 webhook 但在准备好之前禁用它，可以在调用命令时提供 `--disabled` 选项：

```shell
php artisan cashier:webhook --disabled
```

> [!WARNING]
> 请确保使用 Cashier 包含的 [webhook 签名验证](#verifying-webhook-signatures)中间件保护传入的 Stripe webhook 请求。

<a name="webhooks-csrf-protection"></a>
#### Webhooks 和 CSRF 保护

由于 Stripe webhook 需要绕过 Laravel 的 [CSRF 保护](/docs/{{version}}/csrf)，你应确保 Laravel 不会尝试验证传入 Stripe webhook 的 CSRF 令牌。为此，你应在应用程序的 `bootstrap/app.php` 文件中将 `stripe/*` 从 CSRF 保护中排除：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->preventRequestForgery(except: [
        'stripe/*',
    ]);
})
```

<a name="defining-webhook-event-handlers"></a>
### 定义 Webhook 事件处理器

Cashier 自动处理因失败收费而取消订阅以及其他常见的 Stripe webhook 事件。但是，如果你希望处理其他 webhook 事件，可以通过监听 Cashier 派发的以下事件来实现：

- `Laravel\Cashier\Events\WebhookReceived`
- `Laravel\Cashier\Events\WebhookHandled`

这两个事件都包含 Stripe webhook 的完整负载。例如，如果你希望处理 `invoice.payment_succeeded` webhook，可以注册一个[监听器](/docs/{{version}}/events#defining-listeners)来处理该事件：

```php
<?php

namespace App\Listeners;

use Laravel\Cashier\Events\WebhookReceived;

class StripeEventListener
{
    /**
     * Handle received Stripe webhooks.
     */
    public function handle(WebhookReceived $event): void
    {
        if ($event->payload['type'] === 'invoice.payment_succeeded') {
            // Handle the incoming event...
        }
    }
}
```

<a name="verifying-webhook-signatures"></a>
### 验证 Webhook 签名

为了保护你的 webhook 安全，你可以使用 [Stripe 的 webhook 签名](https://stripe.com/docs/webhooks/signatures)。为了方便起见，Cashier 自动包含一个中间件，用于验证传入的 Stripe webhook 请求是否有效。

要启用 webhook 验证，请确保在应用程序的 `.env` 文件中设置了 `STRIPE_WEBHOOK_SECRET` 环境变量。webhook `secret` 可以从你的 Stripe 账户控制面板中获取。

<a name="single-charges"></a>
## 单次收费

<a name="simple-charge"></a>
### 简单收费

如果你想使用付款方式标识符对客户进行一次性收费，可以在 billable 模型实例上使用 `charge` 方法。如果你需要在处理一次性收费之前从客户收集付款详情，请参阅[用于单次收费的 Payment Element](#payment-element-for-single-charges) 文档：

```php
use Illuminate\Http\Request;

Route::post('/purchase', function (Request $request) {
    $payment = $request->user()->charge(
        100, $request->paymentMethodId
    );

    // ...
});
```

`charge` 方法接受一个数组作为其第三个参数，允许你传递任何你希望传递给底层 Stripe Payment Intent 创建的选项。有关创建 Payment Intent 时可用选项的更多信息，请参阅 [Stripe 文档](https://stripe.com/docs/api/payment_intents/create)：

```php
$user->charge(100, $paymentMethod, [
    'custom_option' => $value,
]);
```

你也可以在没有底层客户或用户的情况下使用 `charge` 方法。为此，请在应用程序 billable 模型的新实例上调用 `charge` 方法：

```php
use App\Models\User;

$payment = (new User)->charge(100, $paymentMethod);
```

如果收费失败，`charge` 方法将抛出异常。如果收费成功，将从方法返回 `Laravel\Cashier\Payment` 的实例：

```php
try {
    $payment = $user->charge(100, $paymentMethod);
} catch (Exception $e) {
    // ...
}
```

> [!WARNING]
> `charge` 方法接受以应用程序所用货币最低单位表示的付款金额。例如，如果客户以美元支付，金额应以美分为单位指定。

<a name="charge-with-invoice"></a>
### 带发票的收费

有时你可能需要进行一次性收费并向客户提供 PDF 发票。`invoicePrice` 方法允许你执行此操作。例如，让我们向客户开具五件新衬衫的发票：

```php
$user->invoicePrice('price_tshirt', 5);
```

发票将立即针对用户的默认付款方式收费。`invoicePrice` 方法也接受一个数组作为其第三个参数。此数组包含发票项的计费选项。该方法接受的第四个参数也是一个数组，应包含发票本身的计费选项：

```php
$user->invoicePrice('price_tshirt', 5, [
    'discounts' => [
        ['coupon' => 'SUMMER21SALE']
    ],
], [
    'default_tax_rates' => ['txr_id'],
]);
```

与 `invoicePrice` 类似，你可以使用 `tabPrice` 方法通过将多个项目（每张发票最多 250 个项目）添加到客户的"标签"然后向客户开票来创建一次性收费。例如，我们可以向客户开具五件衬衫和两个杯子的发票：

```php
$user->tabPrice('price_tshirt', 5);
$user->tabPrice('price_mug', 2);
$user->invoice();
```

或者，你可以使用 `invoiceFor` 方法对客户的默认付款方式进行"一次性"收费：

```php
$user->invoiceFor('One Time Fee', 500);
```

虽然 `invoiceFor` 方法可供你使用，但建议你使用带有预定义价格的 `invoicePrice` 和 `tabPrice` 方法。这样做将使你能够在 Stripe 控制面板中按产品获得更好的分析和销售数据。

> [!WARNING]
> `invoice`、`invoicePrice` 和 `invoiceFor` 方法将创建一个 Stripe 发票，该发票会重试失败的计费尝试。如果你不希望发票重试失败的收费，则需要在第一次收费失败后使用 Stripe API 关闭它们。

<a name="creating-payment-intents"></a>
### 创建付款意向

你可以通过调用 billable 模型实例上的 `pay` 方法创建新的 Stripe 付款意向。调用此方法将创建一个包装在 `Laravel\Cashier\Payment` 实例中的付款意向：

```php
use Illuminate\Http\Request;

Route::post('/pay', function (Request $request) {
    $payment = $request->user()->pay(
        $request->get('amount')
    );

    return $payment->client_secret;
});
```

创建付款意向后，你可以将客户端密钥返回给应用程序的前端，以便用户可以在浏览器中完成付款。要了解有关使用 Stripe 付款意向构建完整付款流程的更多信息，请查阅 [Stripe 文档](https://stripe.com/docs/payments/accept-a-payment?platform=web)。

使用 `pay` 方法时，客户将可以使用 Stripe 控制面板中启用的默认付款方式。或者，如果你只想允许使用某些特定的付款方式，可以使用 `payWith` 方法：

```php
use Illuminate\Http\Request;

Route::post('/pay', function (Request $request) {
    $payment = $request->user()->payWith(
        $request->get('amount'), ['card', 'bancontact']
    );

    return $payment->client_secret;
});
```

> [!WARNING]
> `pay` 和 `payWith` 方法接受以应用程序所用货币最低单位表示的付款金额。例如，如果客户以美元支付，金额应以美分为单位指定。

<a name="refunding-charges"></a>
### 退款

如果你需要退款 Stripe 付款，可以使用 `refund` 方法。此方法接受 Stripe Payment Intent ID 作为其第一个参数：

```php
$payment = $user->charge(100, $paymentMethodId);

$user->refund($payment->id);
```

<a name="invoices"></a>
## 发票

<a name="retrieving-invoices"></a>
### 检索发票

你可以使用 `invoices` 方法轻松检索 billable 模型的发票数组。`invoices` 方法返回 `Laravel\Cashier\Invoice` 实例的集合：

```php
$invoices = $user->invoices();
```

如果你希望将待处理发票包含在结果中，可以使用 `invoicesIncludingPending` 方法：

```php
$invoices = $user->invoicesIncludingPending();
```

你可以使用 `findInvoice` 方法通过 ID 检索特定发票：

```php
$invoice = $user->findInvoice($invoiceId);
```

<a name="displaying-invoice-information"></a>
#### 显示发票信息

在列出客户的发票时，你可以使用发票的方法来显示相关的发票信息。例如，你可能希望在一个表格中列出每张发票，使用户能够轻松下载其中任何一张：

```blade
<table>
    @foreach ($invoices as $invoice)
        <tr>
            <td>{{ $invoice->date()->toFormattedDateString() }}</td>
            <td>{{ $invoice->total() }}</td>
            <td><a href="/user/invoice/{{ $invoice->id }}">Download</a></td>
        </tr>
    @endforeach
</table>
```

<a name="upcoming-invoices"></a>
### 即将到来的发票

要检索客户的即将到来的发票，可以使用 `upcomingInvoice` 方法：

```php
$invoice = $user->upcomingInvoice();
```

类似地，如果客户有多个订阅，你也可以检索特定订阅的即将到来的发票：

```php
$invoice = $user->subscription('default')->upcomingInvoice();
```

<a name="previewing-subscription-invoices"></a>
### 预览订阅发票

使用 `previewInvoice` 方法，你可以在做出价格更改之前预览发票。这将允许你确定在进行给定价格更改时客户发票将是什么样子：

```php
$invoice = $user->subscription('default')->previewInvoice('price_yearly');
```

你可以向 `previewInvoice` 方法传递一个价格数组以预览包含多个新价格的发票：

```php
$invoice = $user->subscription('default')->previewInvoice(['price_yearly', 'price_metered']);
```

<a name="generating-invoice-pdfs"></a>
### 生成发票 PDF

在生成发票 PDF 之前，应使用 Composer 安装 Dompdf 库，这是 Cashier 的默认发票渲染器：

```shell
composer require dompdf/dompdf
```

从路由或控制器中，你可以使用 `downloadInvoice` 方法生成给定发票的 PDF 下载。此方法将自动生成下载发票所需的 HTTP 响应：

```php
use Illuminate\Http\Request;

Route::get('/user/invoice/{invoice}', function (Request $request, string $invoiceId) {
    return $request->user()->downloadInvoice($invoiceId);
});
```

默认情况下，发票上的所有数据都来自 Stripe 中存储的客户和发票数据。文件名基于你的 `app.name` 配置值。但是，你可以通过向 `downloadInvoice` 方法提供数组作为第二个参数来自定义其中一些数据。此数组允许你自定义诸如公司和产品详情等信息：

```php
return $request->user()->downloadInvoice($invoiceId, [
    'vendor' => 'Your Company',
    'product' => 'Your Product',
    'street' => 'Main Str. 1',
    'location' => '2000 Antwerp, Belgium',
    'phone' => '+32 499 00 00 00',
    'email' => 'info@example.com',
    'url' => 'https://example.com',
    'vendorVat' => 'BE123456789',
]);
```

`downloadInvoice` 方法还允许通过其第三个参数自定义文件名。此文件名将自动以 `.pdf` 为后缀：

```php
return $request->user()->downloadInvoice($invoiceId, [], 'my-invoice');
```

<a name="custom-invoice-render"></a>
#### 自定义发票渲染器

Cashier 还允许使用自定义发票渲染器。默认情况下，Cashier 使用 `DompdfInvoiceRenderer` 实现，它利用 [dompdf](https://github.com/dompdf/dompdf) PHP 库来生成 Cashier 的发票。但是，你可以通过实现 `Laravel\Cashier\Contracts\InvoiceRenderer` 接口来使用你想要的任何渲染器。例如，你可能希望使用对第三方 PDF 渲染服务的 API 调用来渲染发票 PDF：

```php
use Illuminate\Support\Facades\Http;
use Laravel\Cashier\Contracts\InvoiceRenderer;
use Laravel\Cashier\Invoice;

class ApiInvoiceRenderer implements InvoiceRenderer
{
    /**
     * Render the given invoice and return the raw PDF bytes.
     */
    public function render(Invoice $invoice, array $data = [], array $options = []): string
    {
        $html = $invoice->view($data)->render();

        return Http::get('https://example.com/html-to-pdf', ['html' => $html])->get()->body();
    }
}
```

实现发票渲染器契约后，应更新应用程序 `config/cashier.php` 配置文件中的 `cashier.invoices.renderer` 配置值。此配置值应设置为自定义渲染器实现的类名。

<a name="checkout"></a>
## 结账

Cashier Stripe 还提供对 [Stripe Checkout](https://stripe.com/payments/checkout) 的支持。Stripe Checkout 通过提供预构建的托管付款页面，消除了实现自定义付款页面的痛苦。

以下文档包含有关如何开始将 Stripe Checkout 与 Cashier 一起使用的信息。要了解有关 Stripe Checkout 的更多信息，还应考虑查看 [Stripe 自己的 Checkout 文档](https://stripe.com/docs/payments/checkout)。

<a name="product-checkouts"></a>
### 产品结账

你可以使用 billable 模型上的 `checkout` 方法为已在 Stripe 控制面板中创建的现有产品执行结账。`checkout` 方法将启动一个新的 Stripe Checkout 会话。默认情况下，你需要传递一个 Stripe 价格 ID：

```php
use Illuminate\Http\Request;

Route::get('/product-checkout', function (Request $request) {
    return $request->user()->checkout('price_tshirt');
});
```

如果需要，你还可以指定产品数量：

```php
use Illuminate\Http\Request;

Route::get('/product-checkout', function (Request $request) {
    return $request->user()->checkout(['price_tshirt' => 15]);
});
```

当客户访问此路由时，他们将被重定向到 Stripe 的 Checkout 页面。默认情况下，当用户成功完成或取消购买时，他们将被重定向到你的 `home` 路由位置，但你可以使用 `success_url` 和 `cancel_url` 选项指定自定义回调 URL：

```php
use Illuminate\Http\Request;

Route::get('/product-checkout', function (Request $request) {
    return $request->user()->checkout(['price_tshirt' => 1], [
        'success_url' => route('your-success-route'),
        'cancel_url' => route('your-cancel-route'),
    ]);
});
```

在定义 `success_url` 结账选项时，你可以指示 Stripe 在调用你的 URL 时将结账会话 ID 添加为查询字符串参数。为此，请将字面字符串 `{CHECKOUT_SESSION_ID}` 添加到你的 `success_url` 查询字符串中。Stripe 将用实际的结账会话 ID 替换此占位符：

```php
use Illuminate\Http\Request;
use Stripe\Checkout\Session;
use Stripe\Customer;

Route::get('/product-checkout', function (Request $request) {
    return $request->user()->checkout(['price_tshirt' => 1], [
        'success_url' => route('checkout-success').'?session_id={CHECKOUT_SESSION_ID}',
        'cancel_url' => route('checkout-cancel'),
    ]);
});

Route::get('/checkout-success', function (Request $request) {
    $checkoutSession = $request->user()->stripe()->checkout->sessions->retrieve($request->get('session_id'));

    return view('checkout.success', ['checkoutSession' => $checkoutSession]);
})->name('checkout-success');
```

<a name="checkout-promotion-codes"></a>
#### 促销代码

默认情况下，Stripe Checkout 不允许[用户可兑换的促销代码](https://stripe.com/docs/billing/subscriptions/discounts/codes)。幸运的是，有一种简单的方法可以为你的 Checkout 页面启用这些功能。为此，你可以调用 `allowPromotionCodes` 方法：

```php
use Illuminate\Http\Request;

Route::get('/product-checkout', function (Request $request) {
    return $request->user()
        ->allowPromotionCodes()
        ->checkout('price_tshirt');
});
```

<a name="single-charge-checkouts"></a>
### 单次收费结账

你也可以对尚未在 Stripe 控制面板中创建的临时产品进行简单收费。为此，你可以在 billable 模型上使用 `checkoutCharge` 方法，并传递收费金额、产品名称和可选的数量。当客户访问此路由时，他们将被重定向到 Stripe 的 Checkout 页面：

```php
use Illuminate\Http\Request;

Route::get('/charge-checkout', function (Request $request) {
    return $request->user()->checkoutCharge(1200, 'T-Shirt', 5);
});
```

> [!WARNING]
> 使用 `checkoutCharge` 方法时，Stripe 将始终在 Stripe 控制面板中创建新产品和价格。因此，我们建议你预先在 Stripe 控制面板中创建产品，并使用 `checkout` 方法。

<a name="subscription-checkouts"></a>
### 订阅结账

> [!WARNING]
> 使用 Stripe Checkout 进行订阅需要你在 Stripe 控制面板中启用 `customer.subscription.created` webhook。此 webhook 将在你的数据库中创建订阅记录并存储所有相关的订阅项。

你也可以使用 Stripe Checkout 启动订阅。在使用 Cashier 的订阅构建器方法定义订阅后，你可以调用 `checkout` 方法。当客户访问此路由时，他们将被重定向到 Stripe 的 Checkout 页面：

```php
use Illuminate\Http\Request;

Route::get('/subscription-checkout', function (Request $request) {
    return $request->user()
        ->newSubscription('default', 'price_monthly')
        ->checkout();
});
```

就像产品结账一样，你可以自定义成功和取消 URL：

```php
use Illuminate\Http\Request;

Route::get('/subscription-checkout', function (Request $request) {
    return $request->user()
        ->newSubscription('default', 'price_monthly')
        ->checkout([
            'success_url' => route('your-success-route'),
            'cancel_url' => route('your-cancel-route'),
        ]);
});
```

当然，你也可以为订阅结账启用促销代码：

```php
use Illuminate\Http\Request;

Route::get('/subscription-checkout', function (Request $request) {
    return $request->user()
        ->newSubscription('default', 'price_monthly')
        ->allowPromotionCodes()
        ->checkout();
});
```

> [!WARNING]
> 不幸的是，Stripe Checkout 在启动订阅时不支持所有订阅计费选项。在订阅构建器上使用 `anchorBillingCycleOn` 方法、设置按比例调整行为或设置付款行为在 Stripe Checkout 会话期间不会生效。请查阅 [Stripe Checkout 会话 API 文档](https://stripe.com/docs/api/checkout/sessions/create)以查看哪些参数可用。

<a name="stripe-checkout-trial-periods"></a>
#### Stripe Checkout 和试用期

当然，你可以在构建将使用 Stripe Checkout 完成的订阅时定义试用期：

```php
$checkout = Auth::user()->newSubscription('default', 'price_monthly')
    ->trialDays(3)
    ->checkout();
```

但是，试用期必须至少为 48 小时，这是 Stripe Checkout 支持的最短试用时间。

<a name="stripe-checkout-subscriptions-and-webhooks"></a>
#### 订阅和 Webhooks

记住，Stripe 和 Cashier 通过 webhook 更新订阅状态，因此当客户在输入付款信息后返回应用程序时，订阅可能尚未激活。要处理这种情况，你可能希望显示一条消息，告知用户其付款或订阅正在处理中。

<a name="collecting-tax-ids"></a>
### 收集税号

结账还支持收集客户的税号。要在结账会话中启用此功能，请在创建会话时调用 `collectTaxIds` 方法：

```php
$checkout = $user->collectTaxIds()->checkout('price_tshirt');
```

调用此方法时，客户将看到一个允许他们指示是否作为公司购买的新复选框。如果是，他们将有机会提供税号。

> [!WARNING]
> 如果你已经在应用程序的服务提供者中配置了[自动税务收集](#tax-configuration)，则此功能将自动启用，无需调用 `collectTaxIds` 方法。

<a name="guest-checkouts"></a>
### 访客结账

使用 `Checkout::guest` 方法，你可以为没有"账户"的应用程序访客发起结账会话：

```php
use Illuminate\Http\Request;
use Laravel\Cashier\Checkout;

Route::get('/product-checkout', function (Request $request) {
    return Checkout::guest()->create('price_tshirt', [
        'success_url' => route('your-success-route'),
        'cancel_url' => route('your-cancel-route'),
    ]);
});
```

与为现有用户创建结账会话类似，你可以利用 `Laravel\Cashier\CheckoutBuilder` 实例上的其他方法来自定义访客结账会话：

```php
use Illuminate\Http\Request;
use Laravel\Cashier\Checkout;

Route::get('/product-checkout', function (Request $request) {
    return Checkout::guest()
        ->withPromotionCode('promo-code')
        ->create('price_tshirt', [
            'success_url' => route('your-success-route'),
            'cancel_url' => route('your-cancel-route'),
        ]);
});
```

访客结账完成后，Stripe 可以派发 `checkout.session.completed` webhook 事件，因此请确保[配置你的 Stripe webhook](https://dashboard.stripe.com/webhooks) 以实际将此事件发送到你的应用程序。在 Stripe 控制面板中启用 webhook 后，你可以[使用 Cashier 处理 webhook](#handling-stripe-webhooks)。webhook 负载中包含的对象是一个[结账对象](https://stripe.com/docs/api/checkout/sessions/object)，你可以检查它以完成客户的订单。

<a name="handling-failed-payments"></a>
## 处理失败付款

有时，订阅或单次收费的付款可能会失败。发生这种情况时，Cashier 会抛出 `Laravel\Cashier\Exceptions\IncompletePayment` 异常，通知你发生了此情况。捕获此异常后，你有两种选择来处理。

首先，你可以将客户重定向到 Cashier 附带的专用付款确认页面。此页面已有一个由 Cashier 服务提供者注册的关联命名路由。因此，你可以捕获 `IncompletePayment` 异常并将用户重定向到付款确认页面：

```php
use Laravel\Cashier\Exceptions\IncompletePayment;

try {
    $subscription = $user->newSubscription('default', 'price_monthly')
        ->create($paymentMethod);
} catch (IncompletePayment $exception) {
    return redirect()->route(
        'cashier.payment',
        [$exception->payment->id, 'redirect' => route('home')]
    );
}
```

在付款确认页面上，将提示客户再次输入信用卡信息并执行 Stripe 所需的任何其他操作，例如"3D Secure"确认。确认付款后，用户将被重定向到上面由 `redirect` 参数提供的 URL。重定向时，`message`（字符串）和 `success`（整数）查询字符串变量将添加到 URL。付款页面目前支持以下付款方式类型：

<div class="content-list" markdown="1">

- 信用卡
- Alipay
- Bancontact
- BECS Direct Debit
- EPS
- Giropay
- iDEAL
- SEPA Direct Debit

</div>

或者，你可以让 Stripe 为你处理付款确认。在这种情况下，不要重定向到付款确认页面，而是在 Stripe 控制面板中[设置 Stripe 的自动计费邮件](https://dashboard.stripe.com/account/billing/automatic)。但是，如果捕获到 `IncompletePayment` 异常，你仍应告知用户他们将收到一封包含进一步付款确认说明的电子邮件。

以下方法可能会抛出付款异常：使用 `Billable` trait 的模型上的 `charge`、`invoiceFor` 和 `invoice` 方法。在与订阅交互时，`SubscriptionBuilder` 上的 `create` 方法，以及 `Subscription` 和 `SubscriptionItem` 模型上的 `incrementAndInvoice` 和 `swapAndInvoice` 方法可能会抛出付款不完整异常。

确定现有订阅是否有不完整的付款可以使用 billable 模型或订阅实例上的 `hasIncompletePayment` 方法完成：

```php
if ($user->hasIncompletePayment('default')) {
    // ...
}

if ($user->subscription('default')->hasIncompletePayment()) {
    // ...
}
```

你可以通过检查异常实例上的 `payment` 属性来获取不完整付款的特定状态：

```php
use Laravel\Cashier\Exceptions\IncompletePayment;

try {
    $user->charge(1000, 'pm_card_threeDSecure2Required');
} catch (IncompletePayment $exception) {
    // Get the payment intent status...
    $exception->payment->status;

    // Check specific conditions...
    if ($exception->payment->requiresPaymentMethod()) {
        // ...
    } elseif ($exception->payment->requiresConfirmation()) {
        // ...
    }
}
```

<a name="confirming-payments"></a>
### 确认付款

某些付款方式需要额外数据才能确认付款。例如，SEPA 付款方式在付款过程中需要额外的"授权"数据。你可以使用 `withPaymentConfirmationOptions` 方法将这些数据提供给 Cashier：

```php
$subscription->withPaymentConfirmationOptions([
    'mandate_data' => '...',
])->swap('price_xxx');
```

你可以查阅 [Stripe API 文档](https://stripe.com/docs/api/payment_intents/confirm)以查看确认付款时接受的所有选项。

<a name="strong-customer-authentication"></a>
## 强客户身份验证（SCA）

如果你的企业或你的某个客户位于欧洲，你将需要遵守欧盟的强客户身份验证（SCA）法规。这些法规由欧盟于 2019 年 9 月实施，以防止支付欺诈。幸运的是，Stripe 和 Cashier 已准备好构建符合 SCA 的应用程序。

> [!WARNING]
> 在开始之前，请查看 [Stripe 关于 PSD2 和 SCA 的指南](https://stripe.com/guides/strong-customer-authentication)以及他们关于[新 SCA API 的文档](https://stripe.com/docs/strong-customer-authentication)。

<a name="payments-requiring-additional-confirmation"></a>
### 需要额外确认的付款

SCA 法规通常需要额外验证才能确认和处理付款。发生这种情况时，Cashier 会抛出 `Laravel\Cashier\Exceptions\IncompletePayment` 异常，通知你需要额外验证。有关如何处理这些异常的更多信息，请参阅[处理失败付款](#handling-failed-payments)文档中的说明。

Stripe 或 Cashier 呈现的付款确认屏幕可能针对特定银行或卡发行方的付款流程量身定制，可能包括额外的卡确认、临时小额收费、单独设备身份验证或其他形式的验证。

<a name="incomplete-and-past-due-state"></a>
#### 不完整和逾期状态

当付款需要额外确认时，订阅将保持在 `incomplete` 或 `past_due` 状态，如其 `stripe_status` 数据库列所示。一旦付款确认完成，并且 Stripe 通过 webhook 通知你的应用程序，Cashier 将自动激活客户的订阅。

有关 `incomplete` 和 `past_due` 状态的更多信息，请参考[我们关于这些状态的额外文档](#incomplete-and-past-due-status)。

<a name="off-session-payment-notifications"></a>
### 离线会话付款通知

由于 SCA 法规要求客户即使在订阅活跃期间也偶尔验证其付款详情，因此 Cashier 可以在需要离线会话付款确认时向客户发送通知。例如，当订阅续期时可能会发生这种情况。Cashier 的付款通知可以通过将 `CASHIER_PAYMENT_NOTIFICATION` 环境变量设置为通知类来启用。默认情况下，此通知是禁用的。当然，Cashier 包含了一个你可以用于此目的的通知类，但如果你愿意，也可以自由提供自己的通知类：

```ini
CASHIER_PAYMENT_NOTIFICATION=Laravel\Cashier\Notifications\ConfirmPayment
```

为了确保离线会话付款确认通知能够送达，请验证已为你的应用程序[配置了 Stripe webhook](#handling-stripe-webhooks)，并且已在 Stripe 控制面板中启用 `invoice.payment_action_required` webhook。此外，你的 `Billable` 模型还应使用 Laravel 的 `Illuminate\Notifications\Notifiable` trait。

> [!WARNING]
> 即使客户正在手动进行需要额外确认的付款，也会发送通知。不幸的是，Stripe 无法知道付款是手动还是"离线会话"进行的。但是，如果客户在已确认付款后访问付款页面，他们只会看到"付款成功"消息。客户不会被允许意外地确认同一笔付款两次而导致意外第二次收费。

<a name="stripe-sdk"></a>
## Stripe SDK

Cashier 的许多对象都是 Stripe SDK 对象的包装器。如果你想直接与 Stripe 对象交互，可以使用 `asStripe` 方法方便地检索它们：

```php
$stripeSubscription = $subscription->asStripeSubscription();

$stripeSubscription->application_fee_percent = 5;

$stripeSubscription->save();
```

你也可以使用 `updateStripeSubscription` 方法直接更新 Stripe 订阅：

```php
$subscription->updateStripeSubscription(['application_fee_percent' => 5]);
```

如果你想直接使用 `Stripe\StripeClient` 客户端，可以在 `Cashier` 类上调用 `stripe` 方法。例如，你可以使用此方法访问 `StripeClient` 实例并从你的 Stripe 账户检索价格列表：

```php
use Laravel\Cashier\Cashier;

$prices = Cashier::stripe()->prices->all();
```

<a name="testing"></a>
## 测试

在测试使用 Cashier 的应用程序时，你可以模拟对 Stripe API 的实际 HTTP 请求；但是，这需要你部分地重新实现 Cashier 自己的行为。因此，我们建议让你的测试访问实际的 Stripe API。虽然这较慢，但它提供了更大的信心，确保你的应用程序按预期工作，并且任何慢速测试都可以放在它们自己的 Pest / PHPUnit 测试组中。

在测试时，记住 Cashier 本身已经有一个出色的测试套件，因此你应只关注测试自己的应用程序的订阅和付款流程，而不是每个底层 Cashier 行为。

首先，将 Stripe 密钥的**测试**版本添加到你的 `phpunit.xml` 文件中：

```xml
<env name="STRIPE_SECRET" value="sk_test_<your-key>"/>
```

现在，每当你在测试中与 Cashier 交互时，它将向你的 Stripe 测试环境发送实际的 API 请求。为了方便起见，你应预先在 Stripe 测试账户中填充订阅/价格，以便在测试期间使用。

> [!NOTE]
> 为了测试各种计费场景，例如信用卡拒绝和失败，你可以使用 Stripe 提供的大量[测试卡号和令牌](https://stripe.com/docs/testing)。

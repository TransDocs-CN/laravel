# 邮件

- [简介](#introduction)
    - [配置](#configuration)
    - [驱动前提条件](#driver-prerequisites)
    - [故障转移配置](#failover-configuration)
    - [轮询配置](#round-robin-configuration)
- [生成可邮寄类](#generating-mailables)
- [编写可邮寄类](#writing-mailables)
    - [配置发件人](#configuring-the-sender)
    - [配置视图](#configuring-the-view)
    - [视图数据](#view-data)
    - [附件](#attachments)
    - [内联附件](#inline-attachments)
    - [可附加对象](#attachable-objects)
    - [标头](#headers)
    - [标签和元数据](#tags-and-metadata)
    - [自定义 Symfony 消息](#customizing-the-symfony-message)
- [Markdown 可邮寄类](#markdown-mailables)
    - [生成 Markdown 可邮寄类](#generating-markdown-mailables)
    - [编写 Markdown 消息](#writing-markdown-messages)
    - [自定义组件](#customizing-the-components)
- [发送邮件](#sending-mail)
    - [队列化邮件](#queueing-mail)
- [渲染可邮寄类](#rendering-mailables)
    - [在浏览器中预览可邮寄类](#previewing-mailables-in-the-browser)
- [本地化可邮寄类](#localizing-mailables)
- [测试](#testing-mailables)
    - [测试可邮寄内容](#testing-mailable-content)
    - [测试可邮寄发送](#testing-mailable-sending)
- [邮件和本地开发](#mail-and-local-development)
- [事件](#events)
- [自定义传输](#custom-transports)
    - [额外的 Symfony 传输](#additional-symfony-transports)

<a name="introduction"></a>
## 简介

发送电子邮件不一定是复杂的。Laravel 提供了一个干净、简单的电子邮件 API，由流行的 [Symfony Mailer](https://symfony.com/doc/current/mailer.html) 组件提供支持。Laravel 和 Symfony Mailer 提供了通过 SMTP、Cloudflare、Mailgun、Postmark、Resend、Amazon SES 和 `sendmail` 发送电子邮件的驱动，让你可以快速开始通过本地或基于云的服务发送邮件。

<a name="configuration"></a>
### 配置

Laravel 的电子邮件服务可以通过应用的 `config/mail.php` 配置文件进行配置。此文件中配置的每个邮件程序都可以有自己独特的配置，甚至有自己的独特"传输"，允许你的应用使用不同的电子邮件服务来发送某些邮件消息。例如，你的应用可能使用 Postmark 发送事务性电子邮件，同时使用 Amazon SES 发送批量电子邮件。

在你的 `mail` 配置文件中，你会找到一个 `mailers` 配置数组。此数组包含 Laravel 支持的每个主要邮件驱动/传输的示例配置条目，而 `default` 配置值决定了应用需要发送邮件消息时默认使用哪个邮件程序。

<a name="driver-prerequisites"></a>
### 驱动/传输前提条件

基于 API 的驱动（如 Mailgun、Postmark 和 Resend）通常比通过 SMTP 服务器发送邮件更简单、更快。只要可能，我们建议你使用这些驱动之一。

<a name="cloudflare-driver"></a>
#### Cloudflare 驱动

要使用 Cloudflare 驱动，通过 Composer 安装 Symfony 的 HTTP 客户端：

```shell
composer require symfony/http-client
```

接下来，你需要在应用的 `config/mail.php` 配置文件中进行两项更改。首先，将默认邮件程序设置为 `cloudflare`：

```php
'default' => env('MAIL_MAILER', 'cloudflare'),
```

其次，将以下配置数组添加到你的 `mailers` 数组中：

```php
'cloudflare' => [
    'transport' => 'cloudflare',
],
```

配置应用默认邮件程序后，将以下选项添加到 `config/services.php` 配置文件中：

```php
'cloudflare' => [
    'account_id' => env('CLOUDFLARE_ACCOUNT_ID'),
    'key' => env('CLOUDFLARE_KEY'),
],
```

<a name="mailgun-driver"></a>
#### Mailgun 驱动

要使用 Mailgun 驱动，通过 Composer 安装 Symfony 的 Mailgun Mailer 传输：

```shell
composer require symfony/mailgun-mailer symfony/http-client
```

接下来，你需要在应用的 `config/mail.php` 配置文件中进行两项更改。首先，将默认邮件程序设置为 `mailgun`：

```php
'default' => env('MAIL_MAILER', 'mailgun'),
```

其次，将以下配置数组添加到你的 `mailers` 数组中：

```php
'mailgun' => [
    'transport' => 'mailgun',
    // 'client' => [
    //     'timeout' => 5,
    // ],
],
```

配置应用默认邮件程序后，将以下选项添加到 `config/services.php` 配置文件中：

```php
'mailgun' => [
    'domain' => env('MAILGUN_DOMAIN'),
    'secret' => env('MAILGUN_SECRET'),
    'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
    'scheme' => 'https',
],
```

如果你不使用美国 [Mailgun 区域](https://documentation.mailgun.com/docs/mailgun/api-reference/api-overview#mailgun-regions)，你可以在 `services` 配置文件中定义区域的端点：

```php
'mailgun' => [
    'domain' => env('MAILGUN_DOMAIN'),
    'secret' => env('MAILGUN_SECRET'),
    'endpoint' => env('MAILGUN_ENDPOINT', 'api.eu.mailgun.net'),
    'scheme' => 'https',
],
```

<a name="postmark-driver"></a>
#### Postmark 驱动

要使用 [Postmark](https://postmarkapp.com/) 驱动，通过 Composer 安装 Symfony 的 Postmark Mailer 传输：

```shell
composer require symfony/postmark-mailer symfony/http-client
```

接下来，将应用的 `config/mail.php` 配置文件中的 `default` 选项设置为 `postmark`。配置应用默认邮件程序后，确保你的 `config/services.php` 配置文件包含以下选项：

```php
'postmark' => [
    'key' => env('POSTMARK_API_KEY'),
],
```

如果你想指定给定邮件程序应使用的 Postmark 消息流，你可以将 `message_stream_id` 配置选项添加到邮件程序的配置数组中。此配置数组可以在应用的 `config/mail.php` 配置文件中找到：

```php
'postmark' => [
    'transport' => 'postmark',
    'message_stream_id' => env('POSTMARK_MESSAGE_STREAM_ID'),
    // 'client' => [
    //     'timeout' => 5,
    // ],
],
```

这样，你还可以设置具有不同消息流的多个 Postmark 邮件程序。

<a name="resend-driver"></a>
#### Resend 驱动

要使用 [Resend](https://resend.com/) 驱动，通过 Composer 安装 Resend 的 PHP SDK：

```shell
composer require resend/resend-php
```

接下来，将应用的 `config/mail.php` 配置文件中的 `default` 选项设置为 `resend`。配置应用默认邮件程序后，确保你的 `config/services.php` 配置文件包含以下选项：

```php
'resend' => [
    'key' => env('RESEND_API_KEY'),
],
```

<a name="ses-driver"></a>
#### SES 驱动

要使用 Amazon SES 驱动，你必须首先安装 Amazon AWS SDK for PHP。你可以通过 Composer 包管理器安装此库：

```shell
composer require aws/aws-sdk-php
```

接下来，将 `config/mail.php` 配置文件中的 `default` 选项设置为 `ses`，并验证你的 `config/services.php` 配置文件包含以下选项：

```php
'ses' => [
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
],
```

要通过会话令牌使用 AWS [临时凭据](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_use-resources.html)，你可以向应用的 SES 配置添加 `token` 键：

```php
'ses' => [
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    'token' => env('AWS_SESSION_TOKEN'),
],
```

要与 SES 的[订阅管理功能](https://docs.aws.amazon.com/ses/latest/dg/sending-email-subscription-management.html)交互，你可以在邮件消息的 [headers](#headers) 方法返回的数组中返回 `X-Ses-List-Management-Options` 标头：

```php
/**
 * Get the message headers.
 */
public function headers(): Headers
{
    return new Headers(
        text: [
            'X-Ses-List-Management-Options' => 'contactListName=MyContactList;topicName=MyTopic',
        ],
    );
}
```

如果你想定义 Laravel 在发送电子邮件时应传递给 AWS SDK 的 `SendEmail` 方法的[附加选项](https://docs.aws.amazon.com/aws-sdk-php/v3/api/api-sesv2-2019-09-27.html#sendemail)，你可以在 `ses` 配置中定义一个 `options` 数组：

```php
'ses' => [
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    'options' => [
        'ConfigurationSetName' => 'MyConfigurationSet',
        'EmailTags' => [
            ['Name' => 'foo', 'Value' => 'bar'],
        ],
    ],
],
```

<a name="failover-configuration"></a>
### 故障转移配置

有时，你配置的用于发送应用邮件的外部服务可能发生故障。在这种情况下，定义在你主要发送驱动不可用时使用的一个或多个备用邮件发送配置会很有用。

为此，你应在应用的 `mail` 配置文件中定义一个使用 `failover` 传输的邮件程序。应用的 `failover` 邮件程序的配置数组应包含一个 `mailers` 数组，该数组引用配置的邮件程序应被选中进行发送的顺序：

```php
'mailers' => [
    'failover' => [
        'transport' => 'failover',
        'mailers' => [
            'postmark',
            'mailgun',
            'sendmail',
        ],
        'retry_after' => 60,
    ],

    // ...
],
```

配置了使用 `failover` 传输的邮件程序后，你需要在应用的 `.env` 文件中将故障转移邮件程序设置为默认邮件程序，以使用故障转移功能：

```ini
MAIL_MAILER=failover
```

<a name="round-robin-configuration"></a>
### 轮询配置

`roundrobin` 传输允许你将邮件工作负载分配到多个邮件程序。首先，在应用的 `mail` 配置文件中定义一个使用 `roundrobin` 传输的邮件程序。应用的 `roundrobin` 邮件程序的配置数组应包含一个 `mailers` 数组，该数组引用哪些配置的邮件程序应用于发送：

```php
'mailers' => [
    'roundrobin' => [
        'transport' => 'roundrobin',
        'mailers' => [
            'ses',
            'postmark',
        ],
        'retry_after' => 60,
    ],

    // ...
],
```

定义了轮询邮件程序后，你应通过在其名称指定为应用 `mail` 配置文件中 `default` 配置键的值，将此邮件程序设置为应用的默认邮件程序：

```php
'default' => env('MAIL_MAILER', 'roundrobin'),
```

轮询传输从配置的邮件程序列表中随机选择一个邮件程序，然后为每封后续电子邮件切换到下一个可用的邮件程序。与实现*[高可用性](https://en.wikipedia.org/wiki/High_availability)*的 `failover` 传输相比，`roundrobin` 传输提供*[负载均衡](https://en.wikipedia.org/wiki/Load_balancing_(computing))*。

<a name="generating-mailables"></a>
## 生成可邮寄类

在构建 Laravel 应用时，应用发送的每种类型的电子邮件都表示为一个"mailable"类。这些类存储在 `app/Mail` 目录中。如果你在应用中看不到此目录，请不要担心，因为它会在你使用 `make:mail` Artisan 命令创建第一个 mailable 类时生成：

```shell
php artisan make:mail OrderShipped
```

<a name="writing-mailables"></a>
## 编写可邮寄类

生成 mailable 类后，打开它以便我们探索其内容。Mailable 类配置通过几种方法完成，包括 `envelope`、`content` 和 `attachments` 方法。

`envelope` 方法返回一个 `Illuminate\Mail\Mailables\Envelope` 对象，该对象定义主题，有时还定义消息的收件人。`content` 方法返回一个 `Illuminate\Mail\Mailables\Content` 对象，该定义将用于生成消息内容的 [Blade 模板](/docs/{{version}}/blade)。

<a name="configuring-the-sender"></a>
### 配置发件人

<a name="using-the-envelope"></a>
#### 使用 Envelope

首先，让我们探索配置电子邮件的发件人。或者换句话说，邮件"来自"谁。有两种方法可以配置发件人。首先，你可以在消息的 envelope 上指定"from"地址：

```php
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Envelope;

/**
 * Get the message envelope.
 */
public function envelope(): Envelope
{
    return new Envelope(
        from: new Address('jeffrey@example.com', 'Jeffrey Way'),
        subject: 'Order Shipped',
    );
}
```

如果愿意，你也可以指定一个 `replyTo` 地址：

```php
return new Envelope(
    from: new Address('jeffrey@example.com', 'Jeffrey Way'),
    replyTo: [
        new Address('taylor@example.com', 'Taylor Otwell'),
    ],
    subject: 'Order Shipped',
);
```

<a name="using-a-global-from-address"></a>
#### 使用全局 `from` 地址

但是，如果你的应用为其所有电子邮件使用相同的"from"地址，将其添加到每个生成的 mailable 类中可能会变得繁琐。相反，你可以在 `config/mail.php` 配置文件中指定一个全局"from"地址。如果在 mailable 类中没有指定其他"from"地址，将使用此地址：

```php
'from' => [
    'address' => env('MAIL_FROM_ADDRESS', 'hello@example.com'),
    'name' => env('MAIL_FROM_NAME', 'Example'),
],
```

此外，你可以在 `config/mail.php` 配置文件中定义一个全局"reply_to"地址：

```php
'reply_to' => [
    'address' => 'example@example.com',
    'name' => 'App Name',
],
```

<a name="configuring-the-view"></a>
### 配置视图

在 mailable 类的 `content` 方法中，你可以定义 `view`，即用于渲染电子邮件内容的模板。由于每封电子邮件通常使用 [Blade 模板](/docs/{{version}}/blade) 来渲染其内容，你在构建电子邮件的 HTML 时拥有 Blade 模板引擎的全部功能和便利性：

```php
/**
 * Get the message content definition.
 */
public function content(): Content
{
    return new Content(
        view: 'mail.orders.shipped',
    );
}
```

> [!NOTE]
> 你可能希望创建一个 `resources/views/mail` 目录来存放所有电子邮件模板；但是，你可以自由地将它们放置在 `resources/views` 目录中的任何位置。

<a name="plain-text-emails"></a>
#### 纯文本邮件

如果你想定义电子邮件的纯文本版本，你可以在创建消息的 `Content` 定义时指定纯文本模板。与 `view` 参数一样，`text` 参数应是一个模板名称，用于渲染电子邮件的内容。你可以自由定义消息的 HTML 和纯文本版本：

```php
/**
 * Get the message content definition.
 */
public function content(): Content
{
    return new Content(
        view: 'mail.orders.shipped',
        text: 'mail.orders.shipped-text'
    );
}
```

为清晰起见，`html` 参数可以用作 `view` 参数的别名：

```php
return new Content(
    html: 'mail.orders.shipped',
    text: 'mail.orders.shipped-text'
);
```

<a name="view-data"></a>
### 视图数据

<a name="via-public-properties"></a>
#### 通过公共属性

通常，你会希望向视图传递一些数据，以便在渲染电子邮件的 HTML 时使用。有两种方法可以使数据对你的视图可用。首先，mailable 类上定义的任何公共属性将自动对视图可用。因此，例如，你可以将数据传递到 mailable 类的构造函数中，并将该数据设置为类上定义的公共属性：

```php
<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Queue\SerializesModels;

class OrderShipped extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public Order $order,
    ) {}

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'mail.orders.shipped',
        );
    }
}
```

将数据设置为公共属性后，它将自动在你的视图中可用，因此你可以像访问 Blade 模板中的任何其他数据一样访问它：

```blade
<div>
    价格: {{ $order->price }}
</div>
```

<a name="via-the-with-parameter"></a>
#### 通过 `with` 参数

如果你希望在数据发送到模板之前自定义电子邮件数据的格式，你可以通过 `Content` 定义的 `with` 参数手动将数据传递给视图。通常，你仍然通过 mailable 类的构造函数传递数据；但是，你应将这些数据设置为 `protected` 或 `private` 属性，这样数据就不会自动对模板可用：

```php
<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Queue\SerializesModels;

class OrderShipped extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        protected Order $order,
    ) {}

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'mail.orders.shipped',
            with: [
                'orderName' => $this->order->name,
                'orderPrice' => $this->order->price,
            ],
        );
    }
}
```

通过 `with` 参数传递数据后，它将自动在你的视图中可用，因此你可以像访问 Blade 模板中的任何其他数据一样访问它：

```blade
<div>
    价格: {{ $orderPrice }}
</div>
```

<a name="attachments"></a>
### 附件

要向电子邮件添加附件，你将在消息的 `attachments` 方法返回的数组中添加附件。首先，你可以通过向 `Attachment` 类提供的 `fromPath` 方法提供文件路径来添加附件：

```php
use Illuminate\Mail\Mailables\Attachment;

/**
 * Get the attachments for the message.
 *
 * @return array<int, \Illuminate\Mail\Mailables\Attachment>
 */
public function attachments(): array
{
    return [
        Attachment::fromPath('/path/to/file'),
    ];
}
```

在向消息添加附件时，你还可以使用 `as` 和 `withMime` 方法指定附件的显示名称和/或 MIME 类型：

```php
/**
 * Get the attachments for the message.
 *
 * @return array<int, \Illuminate\Mail\Mailables\Attachment>
 */
public function attachments(): array
{
    return [
        Attachment::fromPath('/path/to/file')
            ->as('name.pdf')
            ->withMime('application/pdf'),
    ];
}
```

<a name="attaching-files-from-disk"></a>
#### 从磁盘附加文件

如果你已将文件存储在你的某个[文件系统磁盘](/docs/{{version}}/filesystem)上，你可以使用 `fromStorage` 附件方法将其附加到电子邮件：

```php
/**
 * Get the attachments for the message.
 *
 * @return array<int, \Illuminate\Mail\Mailables\Attachment>
 */
public function attachments(): array
{
    return [
        Attachment::fromStorage('/path/to/file'),
    ];
}
```

当然，你也可以指定附件的名称和 MIME 类型：

```php
/**
 * Get the attachments for the message.
 *
 * @return array<int, \Illuminate\Mail\Mailables\Attachment>
 */
public function attachments(): array
{
    return [
        Attachment::fromStorage('/path/to/file')
            ->as('name.pdf')
            ->withMime('application/pdf'),
    ];
}
```

如果你需要指定默认磁盘以外的存储磁盘，可以使用 `fromStorageDisk` 方法：

```php
/**
 * Get the attachments for the message.
 *
 * @return array<int, \Illuminate\Mail\Mailables\Attachment>
 */
public function attachments(): array
{
    return [
        Attachment::fromStorageDisk('s3', '/path/to/file')
            ->as('name.pdf')
            ->withMime('application/pdf'),
    ];
}
```

<a name="raw-data-attachments"></a>
#### 原始数据附件

`fromData` 附件方法可用于附加原始字节字符串作为附件。例如，如果你在内存中生成了 PDF 并希望将其附加到电子邮件而无需写入磁盘，则可以使用此方法。`fromData` 方法接受一个解析原始数据字节的闭包以及附件应分配的名称：

```php
/**
 * Get the attachments for the message.
 *
 * @return array<int, \Illuminate\Mail\Mailables\Attachment>
 */
public function attachments(): array
{
    return [
        Attachment::fromData(fn () => $this->pdf, 'Report.pdf')
            ->withMime('application/pdf'),
    ];
}
```

<a name="inline-attachments"></a>
### 内联附件

将内联图像嵌入到电子邮件中通常很繁琐；但是，Laravel 提供了一种方便的方法来将图像附加到电子邮件中。要嵌入内联图像，请在电子邮件模板中的 `$message` 变量上使用 `embed` 方法。Laravel 自动使 `$message` 变量对你的所有电子邮件模板可用，因此你无需担心手动传递它：

```blade
<body>
    这是一张图片：

    <img src="{{ $message->embed($pathToImage) }}">
</body>
```

> [!WARNING]
> `$message` 变量在纯文本消息模板中不可用，因为纯文本消息不使用内联附件。

<a name="embedding-raw-data-attachments"></a>
#### 嵌入原始数据附件

如果你已有希望嵌入到电子邮件模板中的原始图像数据字符串，你可以在 `$message` 变量上调用 `embedData` 方法。在调用 `embedData` 方法时，你需要提供应分配给嵌入图像的 filename：

```blade
<body>
    这是一张来自原始数据的图片：

    <img src="{{ $message->embedData($data, 'example-image.jpg') }}">
</body>
```

<a name="attachable-objects"></a>
### 可附加对象

虽然通过简单的字符串路径将文件附加到消息通常就足够了，但在许多情况下，应用中可附加的实体由类表示。例如，如果你的应用正在将照片附加到消息，你的应用可能还有一个表示该照片的 `Photo` 模型。在这种情况下，只需将 `Photo` 模型传递给 `attach` 方法不是很好吗？可附加对象允许你做到这一点。

首先，在将可附加到消息的对象上实现 `Illuminate\Contracts\Mail\Attachable` 接口。此接口规定你的类定义了一个 `toMailAttachment` 方法，该方法返回一个 `Illuminate\Mail\Attachment` 实例：

```php
<?php

namespace App\Models;

use Illuminate\Contracts\Mail\Attachable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Mail\Attachment;

class Photo extends Model implements Attachable
{
    /**
     * Get the attachable representation of the model.
     */
    public function toMailAttachment(): Attachment
    {
        return Attachment::fromPath('/path/to/file');
    }
}
```

定义了可附加对象后，你可以在构建电子邮件消息时从 `attachments` 方法返回该对象的实例：

```php
/**
 * Get the attachments for the message.
 *
 * @return array<int, \Illuminate\Mail\Mailables\Attachment>
 */
public function attachments(): array
{
    return [$this->photo];
}
```

当然，附件数据可能存储在远程文件存储服务（如 Amazon S3）上。因此，Laravel 还允许你从存储在应用的[文件系统磁盘](/docs/{{version}}/filesystem)之一上的数据生成附件实例：

```php
// 从默认磁盘上的文件创建附件...
return Attachment::fromStorage($this->path);

// 从特定磁盘上的文件创建附件...
return Attachment::fromStorageDisk('backblaze', $this->path);
```

此外，你可以通过内存中的数据创建附件实例。为此，向 `fromData` 方法提供一个闭包。该闭包应返回表示附件的原始数据：

```php
return Attachment::fromData(fn () => $this->content, 'Photo Name');
```

Laravel 还提供了可用于自定义附件的其他方法。例如，你可以使用 `as` 和 `withMime` 方法自定义文件的名称和 MIME 类型：

```php
return Attachment::fromPath('/path/to/file')
    ->as('Photo Name')
    ->withMime('image/jpeg');
```

<a name="headers"></a>
### 标头

有时你可能需要向出站消息附加额外的标头。例如，你可能需要设置自定义的 `Message-Id` 或其他任意文本标头。

为此，在你的 mailable 上定义一个 `headers` 方法。`headers` 方法应返回一个 `Illuminate\Mail\Mailables\Headers` 实例。此类接受 `messageId`、`references` 和 `text` 参数。当然，你可以只为你特定消息需要的参数提供值：

```php
use Illuminate\Mail\Mailables\Headers;

/**
 * Get the message headers.
 */
public function headers(): Headers
{
    return new Headers(
        messageId: 'custom-message-id@example.com',
        references: ['previous-message@example.com'],
        text: [
            'X-Custom-Header' => 'Custom Value',
        ],
    );
}
```

<a name="tags-and-metadata"></a>
### 标签和元数据

某些第三方电子邮件提供商（如 Mailgun 和 Postmark）支持消息"标签"和"元数据"，可用于对应用发送的电子邮件进行分组和跟踪。你可以通过 `Envelope` 定义向电子邮件消息添加标签和元数据：

```php
use Illuminate\Mail\Mailables\Envelope;

/**
 * Get the message envelope.
 *
 * @return \Illuminate\Mail\Mailables\Envelope
 */
public function envelope(): Envelope
{
    return new Envelope(
        subject: 'Order Shipped',
        tags: ['shipment'],
        metadata: [
            'order_id' => $this->order->id,
        ],
    );
}
```

如果你的应用使用 Mailgun 驱动，你可以查阅 Mailgun 的文档以获取有关[标签](https://documentation.mailgun.com/docs/mailgun/user-manual/tracking-messages/#tags)和[元数据](https://documentation.mailgun.com/docs/mailgun/user-manual/sending-messages/#attaching-metadata-to-messages)的更多信息。同样，Postmark 文档也可用于获取有关其支持[标签](https://postmarkapp.com/blog/tags-support-for-smtp)和[元数据](https://postmarkapp.com/support/article/1125-custom-metadata-faq)的更多信息。

如果你的应用使用 Amazon SES 发送电子邮件，你应使用 `metadata` 方法将 [SES"标签"](https://docs.aws.amazon.com/ses/latest/APIReference/API_MessageTag.html) 附加到消息。

<a name="customizing-the-symfony-message"></a>
### 自定义 Symfony 消息

Laravel 的邮件功能由 Symfony Mailer 提供支持。Laravel 允许你注册自定义回调，这些回调将在发送消息之前使用 Symfony Message 实例调用。这让你有机会在消息发送之前深度自定义它。为此，你需要在 `Envelope` 定义上定义一个 `using` 参数：

```php
use Illuminate\Mail\Mailables\Envelope;
use Symfony\Component\Mime\Email;

/**
 * Get the message envelope.
 */
public function envelope(): Envelope
{
    return new Envelope(
        subject: 'Order Shipped',
        using: [
            function (Email $message) {
                // ...
            },
        ]
    );
}
```

<a name="markdown-mailables"></a>
## Markdown 可邮寄类

Markdown mailable 消息允许你利用[邮件通知](/docs/{{version}}/notifications#mail-notifications)中预构建的模板和组件。由于消息是用 Markdown 编写的，Laravel 能够为消息渲染漂亮、响应式的 HTML 模板，同时自动生成纯文本对应物。

<a name="generating-markdown-mailables"></a>
### 生成 Markdown 可邮寄类

要生成带有相应 Markdown 模板的 mailable，你可以使用 `make:mail` Artisan 命令的 `--markdown` 选项：

```shell
php artisan make:mail OrderShipped --markdown=mail.orders.shipped
```

然后，在其 `content` 方法中配置 mailable `Content` 定义时，使用 `markdown` 参数而不是 `view` 参数：

```php
use Illuminate\Mail\Mailables\Content;

/**
 * Get the message content definition.
 */
public function content(): Content
{
    return new Content(
        markdown: 'mail.orders.shipped',
        with: [
            'url' => $this->orderUrl,
        ],
    );
}
```

<a name="writing-markdown-messages"></a>
### 编写 Markdown 消息

Markdown mailable 使用 Blade 组件和 Markdown 语法的组合，允许你利用 Laravel 预构建的电子邮件 UI 组件轻松构建邮件消息：

```blade
<x-mail::message>
# 订单已发货

您的订单已发货！

<x-mail::button :url="$url">
查看订单
</x-mail::button>

谢谢,<br>
{{ config('app.name') }}
</x-mail::message>
```

> [!NOTE]
> 在编写 Markdown 电子邮件时，不要使用过多的缩进。根据 Markdown 标准，Markdown 解析器会将缩进的内容渲染为代码块。

<a name="button-component"></a>
#### 按钮组件

按钮组件渲染一个居中按钮链接。该组件接受两个参数，`url` 和可选的 `color`。支持的颜色有 `primary`、`success` 和 `error`。你可以根据需要在消息中添加任意数量的按钮组件：

```blade
<x-mail::button :url="$url" color="success">
查看订单
</x-mail::button>
```

<a name="panel-component"></a>
#### 面板组件

面板组件在具有与消息其余部分略微不同背景颜色的面板中渲染给定的文本块。这使你能够吸引对给定文本块的注意力：

```blade
<x-mail::panel>
这是面板内容。
</x-mail::panel>
```

<a name="table-component"></a>
#### 表格组件

表格组件允许你将 Markdown 表格转换为 HTML 表格。该组件接受 Markdown 表格作为其内容。支持使用默认的 Markdown 表格对齐语法进行表格列对齐：

```blade
<x-mail::table>
| Laravel       | Table         | Example       |
| ------------- | :-----------: | ------------: |
| Col 2 is      | Centered      | $10           |
| Col 3 is      | Right-Aligned | $20           |
</x-mail::table>
```

<a name="customizing-the-components"></a>
### 自定义组件

你可以将所有 Markdown 邮件组件导出到你自己的应用中进行自定义。要导出组件，请使用 `vendor:publish` Artisan 命令发布 `laravel-mail` 资源标签：

```shell
php artisan vendor:publish --tag=laravel-mail
```

此命令将 Markdown 邮件组件发布到 `resources/views/vendor/mail` 目录。`mail` 目录将包含一个 `html` 和一个 `text` 目录，每个目录包含每个可用组件的相应表示。你可以自由地按自己的喜好自定义这些组件。

<a name="customizing-the-css"></a>
#### 自定义 CSS

导出组件后，`resources/views/vendor/mail/html/themes` 目录将包含一个 `default.css` 文件。你可以自定义此文件中的 CSS，你的样式将自动转换为 Markdown 邮件消息 HTML 表示中的内联 CSS 样式。

如果你想为 Laravel 的 Markdown 组件构建一个全新的主题，你可以将 CSS 文件放在 `html/themes` 目录中。命名并保存 CSS 文件后，更新应用 `config/mail.php` 配置文件中的 `theme` 选项以匹配新主题的名称。

要为单个 mailable 自定义主题，你可以将 mailable 类的 `$theme` 属性设置为发送该 mailable 时应使用的主题名称。

<a name="sending-mail"></a>
## 发送邮件

要发送消息，请在 `Mail` [门面](/docs/{{version}}/facades)上使用 `to` 方法。`to` 方法接受一个电子邮件地址、一个用户实例或一组用户。如果你传递一个对象或对象集合，邮件程序在确定电子邮件收件人时会自动使用它们的 `email` 和 `name` 属性，因此请确保这些属性在你的对象上可用。指定收件人后，你可以将 mailable 类的实例传递给 `send` 方法：

```php
<?php

namespace App\Http\Controllers;

use App\Mail\OrderShipped;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class OrderShipmentController extends Controller
{
    /**
     * Ship the given order.
     */
    public function store(Request $request): RedirectResponse
    {
        $order = Order::findOrFail($request->order_id);

        // 发货...

        Mail::to($request->user())->send(new OrderShipped($order));

        return redirect('/orders');
    }
}
```

你不限于仅指定"to"收件人。你可以通过链接各自的方法来自由设置"to"、"cc"和"bcc"收件人：

```php
Mail::to($request->user())
    ->cc($moreUsers)
    ->bcc($evenMoreUsers)
    ->send(new OrderShipped($order));
```

<a name="looping-over-recipients"></a>
#### 遍历收件人

有时，你可能需要通过遍历收件人/电子邮件地址数组来向收件人列表发送 mailable。但是，由于 `to` 方法将电子邮件地址附加到 mailable 的收件人列表中，每次遍历循环都会向每个以前的收件人再发送一封电子邮件。因此，你应该始终为每个收件人重新创建 mailable 实例：

```php
foreach (['taylor@example.com', 'dries@example.com'] as $recipient) {
    Mail::to($recipient)->send(new OrderShipped($order));
}
```

<a name="sending-mail-via-a-specific-mailer"></a>
#### 通过特定邮件程序发送邮件

默认情况下，Laravel 将使用应用 `mail` 配置文件中配置为 `default` 邮件程序的邮件程序发送电子邮件。但是，你可以使用 `mailer` 方法通过特定的邮件程序配置发送消息：

```php
Mail::mailer('postmark')
    ->to($request->user())
    ->send(new OrderShipped($order));
```

<a name="queueing-mail"></a>
### 队列化邮件

<a name="queueing-a-mail-message"></a>
#### 队列化邮件消息

由于发送电子邮件消息可能对应用的响应时间产生负面影响，许多开发人员选择将电子邮件消息排队以便在后台发送。Laravel 使用其内置的[统一队列 API](/docs/{{version}}/queues) 使之变得容易。要排队发送邮件消息，在指定消息收件人后使用 `Mail` 门面的 `queue` 方法：

```php
Mail::to($request->user())
    ->cc($moreUsers)
    ->bcc($evenMoreUsers)
    ->queue(new OrderShipped($order));
```

此方法将自动处理将任务推送到队列中，以便在后台发送消息。在使用此功能之前，你需要[配置你的队列](/docs/{{version}}/queues)。

<a name="delayed-message-queueing"></a>
#### 延迟消息队列化

如果你希望延迟排队的电子邮件消息的投递，你可以使用 `later` 方法。作为其第一个参数，`later` 方法接受一个 `DateTime` 实例，指示何时应发送消息：

```php
Mail::to($request->user())
    ->cc($moreUsers)
    ->bcc($evenMoreUsers)
    ->later(now()->plus(minutes: 10), new OrderShipped($order));
```

<a name="pushing-to-specific-queues"></a>
#### 推送到特定队列

由于使用 `make:mail` 命令生成的所有 mailable 类都使用了 `Illuminate\Bus\Queueable` trait，你可以在任何 mailable 类实例上调用 `onQueue` 和 `onConnection` 方法，允许你指定消息的连接和队列名称：

```php
$message = (new OrderShipped($order))
    ->onConnection('sqs')
    ->onQueue('emails');

Mail::to($request->user())
    ->cc($moreUsers)
    ->bcc($evenMoreUsers)
    ->queue($message);
```

或者，你可以使用 mailable 类上的 `Connection` 和 `Queue` 属性指定连接和队列：

```php
use Illuminate\Queue\Attributes\Connection;
use Illuminate\Queue\Attributes\Queue;

#[Connection('sqs')]
#[Queue('emails')]
class OrderShipped extends Mailable
{
    // ...
}
```

<a name="queueing-by-default"></a>
#### 默认队列化

如果你有希望始终队列化的 mailable 类，你可以在类上实现 `ShouldQueue` 契约。现在，即使在邮寄时调用 `send` 方法，由于实现了该契约，mailable 仍将被队列化：

```php
use Illuminate\Contracts\Queue\ShouldQueue;

class OrderShipped extends Mailable implements ShouldQueue
{
    // ...
}
```

<a name="queued-mailables-and-database-transactions"></a>
#### 队列化 Mailable 和数据库事务

当在数据库事务中分队列化的 mailable 时，它们可能会在数据库事务提交之前被队列处理。发生这种情况时，你在数据库事务期间对模型或数据库记录所做的任何更新可能尚未反映在数据库中。此外，在事务中创建的任何模型或数据库记录可能不存在于数据库中。如果你的 mailable 依赖这些模型，则处理发送队列化 mailable 的任务时可能会发生意外错误。

如果你的队列连接的 `after_commit` 配置选项设置为 `false`，你仍然可以通过在发送邮件消息时调用 `afterCommit` 方法来指示特定的队列化 mailable 应在所有打开的数据库事务提交后才被分发：

```php
Mail::to($request->user())->send(
    (new OrderShipped($order))->afterCommit()
);
```

或者，你可以在 mailable 的构造函数中调用 `afterCommit` 方法：

```php
<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OrderShipped extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct()
    {
        $this->afterCommit();
    }
}
```

> [!NOTE]
> 要了解有关解决这些问题的更多信息，请查阅有关[队列任务和数据库事务](/docs/{{version}}/queues#jobs-and-database-transactions)的文档。

<a name="queued-email-failures"></a>
#### 队列化电子邮件失败

当队列化电子邮件失败时，如果已定义，将调用队列化 mailable 类上的 `failed` 方法。导致队列化电子邮件失败的 `Throwable` 实例将传递给 `failed` 方法：

```php
<?php

namespace App\Mail;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Throwable;

class OrderDelayed extends Mailable implements ShouldQueue
{
    use SerializesModels;

    /**
     * Handle a queued email's failure.
     */
    public function failed(Throwable $exception): void
    {
        // ...
    }
}
```

<a name="rendering-mailables"></a>
## 渲染可邮寄类

有时你可能希望捕获 mailable 的 HTML 内容而不发送它。为此，你可以调用 mailable 的 `render` 方法。此方法将以字符串形式返回 mailable 的评估后 HTML 内容：

```php
use App\Mail\InvoicePaid;
use App\Models\Invoice;

$invoice = Invoice::find(1);

return (new InvoicePaid($invoice))->render();
```

<a name="previewing-mailables-in-the-browser"></a>
### 在浏览器中预览可邮寄类

在设计 mailable 模板时，像典型的 Blade 模板一样在浏览器中快速预览渲染的 mailable 非常方便。因此，Laravel 允许你直接从路由闭包或控制器返回任何 mailable。当返回 mailable 时，它将被渲染并显示在浏览器中，让你可以快速预览其设计，而无需将其发送到实际的电子邮件地址：

```php
Route::get('/mailable', function () {
    $invoice = App\Models\Invoice::find(1);

    return new App\Mail\InvoicePaid($invoice);
});
```

<a name="localizing-mailables"></a>
## 本地化可邮寄类

Laravel 允许你使用请求当前区域设置以外的语言环境发送 mailable，并且如果邮件是队列化的，它甚至会记住此区域设置。

为此，`Mail` 门面提供了一个 `locale` 方法来设置所需的语言。应用将在评估 mailable 模板时切换到该区域设置，并在评估完成时恢复到先前的区域设置：

```php
Mail::to($request->user())->locale('es')->send(
    new OrderShipped($order)
);
```

<a name="user-preferred-locales"></a>
#### 用户首选区域设置

有时，应用会存储每个用户的首选区域设置。通过在一个或多个模型上实现 `HasLocalePreference` 契约，你可以指示 Laravel 在发送邮件时使用此存储的区域设置：

```php
use Illuminate\Contracts\Translation\HasLocalePreference;

class User extends Model implements HasLocalePreference
{
    /**
     * Get the user's preferred locale.
     */
    public function preferredLocale(): string
    {
        return $this->locale;
    }
}
```

实现接口后，Laravel 将在向模型发送 mailable 和通知时自动使用首选区域设置。因此，使用此接口时无需调用 `locale` 方法：

```php
Mail::to($request->user())->send(new OrderShipped($order));
```

<a name="testing-mailables"></a>
## 测试

<a name="testing-mailable-content"></a>
### 测试可邮寄内容

Laravel 提供了多种用于检查 mailable 结构的方法。此外，Laravel 还提供了一些便捷方法，用于测试你的 mailable 是否包含你期望的内容：

```php tab=Pest
use App\Mail\InvoicePaid;
use App\Models\User;

test('mailable content', function () {
    $user = User::factory()->create();

    $mailable = new InvoicePaid($user);

    $mailable->assertFrom('jeffrey@example.com');
    $mailable->assertTo('taylor@example.com');
    $mailable->assertHasCc('abigail@example.com');
    $mailable->assertHasBcc('victoria@example.com');
    $mailable->assertHasReplyTo('tyler@example.com');
    $mailable->assertHasSubject('Invoice Paid');
    $mailable->assertHasTag('example-tag');
    $mailable->assertHasMetadata('key', 'value');

    $mailable->assertSeeInHtml($user->email);
    $mailable->assertDontSeeInHtml('Invoice Not Paid');
    $mailable->assertSeeInOrderInHtml(['Invoice Paid', 'Thanks']);

    $mailable->assertSeeInText($user->email);
    $mailable->assertDontSeeInText('Invoice Not Paid');
    $mailable->assertSeeInOrderInText(['Invoice Paid', 'Thanks']);

    $mailable->assertHasAttachment('/path/to/file');
    $mailable->assertHasAttachment(Attachment::fromPath('/path/to/file'));
    $mailable->assertHasAttachedData($pdfData, 'name.pdf', ['mime' => 'application/pdf']);
    $mailable->assertHasAttachmentFromStorage('/path/to/file', 'name.pdf', ['mime' => 'application/pdf']);
    $mailable->assertHasAttachmentFromStorageDisk('s3', '/path/to/file', 'name.pdf', ['mime' => 'application/pdf']);
});
```

```php tab=PHPUnit
use App\Mail\InvoicePaid;
use App\Models\User;

public function test_mailable_content(): void
{
    $user = User::factory()->create();

    $mailable = new InvoicePaid($user);

    $mailable->assertFrom('jeffrey@example.com');
    $mailable->assertTo('taylor@example.com');
    $mailable->assertHasCc('abigail@example.com');
    $mailable->assertHasBcc('victoria@example.com');
    $mailable->assertHasReplyTo('tyler@example.com');
    $mailable->assertHasSubject('Invoice Paid');
    $mailable->assertHasTag('example-tag');
    $mailable->assertHasMetadata('key', 'value');

    $mailable->assertSeeInHtml($user->email);
    $mailable->assertDontSeeInHtml('Invoice Not Paid');
    $mailable->assertSeeInOrderInHtml(['Invoice Paid', 'Thanks']);

    $mailable->assertSeeInText($user->email);
    $mailable->assertDontSeeInText('Invoice Not Paid');
    $mailable->assertSeeInOrderInText(['Invoice Paid', 'Thanks']);

    $mailable->assertHasAttachment('/path/to/file');
    $mailable->assertHasAttachment(Attachment::fromPath('/path/to/file'));
    $mailable->assertHasAttachedData($pdfData, 'name.pdf', ['mime' => 'application/pdf']);
    $mailable->assertHasAttachmentFromStorage('/path/to/file', 'name.pdf', ['mime' => 'application/pdf']);
    $mailable->assertHasAttachmentFromStorageDisk('s3', '/path/to/file', 'name.pdf', ['mime' => 'application/pdf']);
}
```

正如你所期望的，"HTML"断言断言你的 mailable 的 HTML 版本包含给定字符串，而"text"断言断言你的 mailable 的纯文本版本包含给定字符串。

<a name="testing-mailable-sending"></a>
### 测试可邮寄发送

我们建议将 mailable 内容的测试与断言给定 mailable 已"发送"给特定用户的测试分开进行。通常，mailable 的内容与你测试的代码无关，只需断言 Laravel 被指示发送给定的 mailable 就足够了。

你可以使用 `Mail` 门面的 `fake` 方法来阻止邮件发送。调用 `Mail` 门面的 `fake` 方法后，你可以断言 mailable 被指示发送给用户，甚至可以检查 mailable 接收到的数据：

```php tab=Pest
<?php

use App\Mail\OrderShipped;
use Illuminate\Support\Facades\Mail;

test('orders can be shipped', function () {
    Mail::fake();

    // 执行订单发货...

    // 断言没有发送任何 mailable...
    Mail::assertNothingSent();

    // 断言已发送 mailable...
    Mail::assertSent(OrderShipped::class);

    // 断言 mailable 已发送两次...
    Mail::assertSent(OrderShipped::class, 2);

    // 断言 mailable 已发送到电子邮件地址...
    Mail::assertSent(OrderShipped::class, 'example@laravel.com');

    // 断言 mailable 已发送到多个电子邮件地址...
    Mail::assertSent(OrderShipped::class, ['example@laravel.com', '...']);

    // 断言未发送 mailable...
    Mail::assertNotSent(AnotherMailable::class);

    // 断言 mailable 已发送两次...
    Mail::assertSentTimes(OrderShipped::class, 2);

    // 断言总共发送了 3 个 mailable...
    Mail::assertSentCount(3);
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use App\Mail\OrderShipped;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_orders_can_be_shipped(): void
    {
        Mail::fake();

        // 执行订单发货...

        // 断言没有发送任何 mailable...
        Mail::assertNothingSent();

        // 断言已发送 mailable...
        Mail::assertSent(OrderShipped::class);

        // 断言 mailable 已发送两次...
        Mail::assertSent(OrderShipped::class, 2);

        // 断言 mailable 已发送到电子邮件地址...
        Mail::assertSent(OrderShipped::class, 'example@laravel.com');

        // 断言 mailable 已发送到多个电子邮件地址...
        Mail::assertSent(OrderShipped::class, ['example@laravel.com', '...']);

        // 断言未发送 mailable...
        Mail::assertNotSent(AnotherMailable::class);

        // 断言 mailable 已发送两次...
        Mail::assertSentTimes(OrderShipped::class, 2);

        // 断言总共发送了 3 个 mailable...
        Mail::assertSentCount(3);
    }
}
```

如果你正在将 mailable 排队以便在后台投递，你应使用 `assertQueued` 方法而不是 `assertSent`：

```php
Mail::assertQueued(OrderShipped::class);
Mail::assertNotQueued(OrderShipped::class);
Mail::assertNothingQueued();
Mail::assertQueuedCount(3);
```

你还可以使用 `assertOutgoingCount` 方法断言已发送或已队列化的 mailable 总数：

```php
Mail::assertOutgoingCount(3);
```

你可以向 `assertSent`、`assertNotSent`、`assertQueued` 或 `assertNotQueued` 方法传递一个闭包，以断言通过给定"真值测试"的 mailable 已被发送。如果至少有一个 mailable 通过了给定的真值测试，则断言将成功：

```php
Mail::assertSent(function (OrderShipped $mail) use ($order) {
    return $mail->order->id === $order->id;
});
```

在调用 `Mail` 门面的断言方法时，提供的闭包接受的 mailable 实例公开了用于检查 mailable 的有帮助方法：

```php
Mail::assertSent(OrderShipped::class, function (OrderShipped $mail) use ($user) {
    return $mail->hasTo($user->email) &&
           $mail->hasCc('...') &&
           $mail->hasBcc('...') &&
           $mail->hasReplyTo('...') &&
           $mail->hasFrom('...') &&
           $mail->hasSubject('...') &&
           $mail->hasMetadata('order_id', $mail->order->id);
           $mail->usesMailer('ses');
});
```

mailable 实例还包括几个用于检查 mailable 上附件的有帮助方法：

```php
use Illuminate\Mail\Mailables\Attachment;

Mail::assertSent(OrderShipped::class, function (OrderShipped $mail) {
    return $mail->hasAttachment(
        Attachment::fromPath('/path/to/file')
            ->as('name.pdf')
            ->withMime('application/pdf')
    );
});

Mail::assertSent(OrderShipped::class, function (OrderShipped $mail) {
    return $mail->hasAttachment(
        Attachment::fromStorageDisk('s3', '/path/to/file')
    );
});

Mail::assertSent(OrderShipped::class, function (OrderShipped $mail) use ($pdfData) {
    return $mail->hasAttachment(
        Attachment::fromData(fn () => $pdfData, 'name.pdf')
    );
});
```

你可能已经注意到有两种方法可以断言邮件未发送：`assertNotSent` 和 `assertNotQueued`。有时你可能希望断言没有邮件**已发送**或**已队列化**。为此，你可以使用 `assertNothingOutgoing` 和 `assertNotOutgoing` 方法：

```php
Mail::assertNothingOutgoing();

Mail::assertNotOutgoing(function (OrderShipped $mail) use ($order) {
    return $mail->order->id === $order->id;
});
```

<a name="mail-and-local-development"></a>
## 邮件和本地开发

在开发发送电子邮件的应用时，你可能不希望实际发送电子邮件到真实的电子邮件地址。Laravel 提供了几种方法可以在本地开发期间"禁用"实际发送电子邮件。

<a name="log-driver"></a>
#### 日志驱动

`log` 邮件驱动不会发送电子邮件，而是将所有电子邮件消息写入日志文件供检查。通常，此驱动仅应在本地开发期间使用。有关按环境配置应用的更多信息，请查看[配置文档](/docs/{{version}}/configuration#environment-configuration)。

<a name="mailtrap"></a>
#### HELO / Mailtrap / Mailpit

或者，你也可以使用像 [HELO](https://usehelo.com) 或 [Mailtrap](https://mailtrap.io) 这样的服务以及 `smtp` 驱动将电子邮件消息发送到一个"虚拟"邮箱，在那里你可以在真正的电子邮件客户端中查看它们。这种方法的好处是允许你在 Mailtrap 的消息查看器中实际检查最终的电子邮件。

如果你使用 [Laravel Sail](/docs/{{version}}/sail)，你可以使用 [Mailpit](https://github.com/axllent/mailpit) 预览消息。当 Sail 运行时，你可以在以下地址访问 Mailpit 界面：`http://localhost:8025`。

<a name="using-a-global-to-address"></a>
#### 使用全局 `to` 地址

最后，你可以通过调用 `Mail` 门面提供的 `alwaysTo` 方法指定一个全局"to"地址。通常，此方法应从应用服务提供者之一的 `boot` 方法中调用：

```php
use Illuminate\Support\Facades\Mail;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    if ($this->app->environment('local')) {
        Mail::alwaysTo('taylor@example.com');
    }
}
```

使用 `alwaysTo` 方法时，邮件消息上的任何额外"cc"或"bcc"地址将被移除。

<a name="events"></a>
## 事件

Laravel 在发送邮件消息时会分派两个事件。`MessageSending` 事件在消息发送之前分派，而 `MessageSent` 事件在消息发送之后分派。请记住，这些事件是在邮件*发送*时分派的，而不是在队列化时分派的。你可以在应用中创建这些事件的[事件监听器](/docs/{{version}}/events)：

```php
use Illuminate\Mail\Events\MessageSending;
// use Illuminate\Mail\Events\MessageSent;

class LogMessage
{
    /**
     * Handle the event.
     */
    public function handle(MessageSending $event): void
    {
        // ...
    }
}
```

<a name="custom-transports"></a>
## 自定义传输

Laravel 包含多种邮件传输；但是，你可能希望编写自己的传输，以通过 Laravel 不直接支持的其他服务发送电子邮件。首先，定义一个扩展 `Symfony\Component\Mailer\Transport\AbstractTransport` 类的类。然后，在你的传输上实现 `doSend` 和 `__toString` 方法：

```php
<?php

namespace App\Mail;

use MailchimpTransactional\ApiClient;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\MessageConverter;

class MailchimpTransport extends AbstractTransport
{
    /**
     * Create a new Mailchimp transport instance.
     */
    public function __construct(
        protected ApiClient $client,
    ) {
        parent::__construct();
    }

    /**
     * {@inheritDoc}
     */
    protected function doSend(SentMessage $message): void
    {
        $email = MessageConverter::toEmail($message->getOriginalMessage());

        $this->client->messages->send(['message' => [
            'from_email' => $email->getFrom(),
            'to' => collect($email->getTo())->map(function (Address $email) {
                return ['email' => $email->getAddress(), 'type' => 'to'];
            })->all(),
            'subject' => $email->getSubject(),
            'text' => $email->getTextBody(),
        ]]);
    }

    /**
     * Get the string representation of the transport.
     */
    public function __toString(): string
    {
        return 'mailchimp';
    }
}
```

定义了自定义传输后，你可以通过 `Mail` 门面提供的 `extend` 方法注册它。通常，这应在应用的 `AppServiceProvider` 的 `boot` 方法中完成。一个 `$config` 参数将传递给提供给 `extend` 方法的闭包。此参数将包含在应用的 `config/mail.php` 配置文件中为邮件程序定义的配置数组：

```php
use App\Mail\MailchimpTransport;
use Illuminate\Support\Facades\Mail;
use MailchimpTransactional\ApiClient;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Mail::extend('mailchimp', function (array $config = []) {
        $client = new ApiClient;

        $client->setApiKey($config['key']);

        return new MailchimpTransport($client);
    });
}
```

自定义传输定义并注册后，你可以在应用的 `config/mail.php` 配置文件中创建一个利用新传输的邮件程序定义：

```php
'mailchimp' => [
    'transport' => 'mailchimp',
    'key' => env('MAILCHIMP_API_KEY'),
    // ...
],
```

<a name="additional-symfony-transports"></a>
### 额外的 Symfony 传输

Laravel 包含对某些现有的 Symfony 维护的邮件传输（如 Mailgun 和 Postmark）的支持。但是，你可能希望扩展 Laravel 以支持额外的 Symfony 维护的传输。你可以通过 Composer 安装所需的 Symfony 邮件程序并使用 Laravel 注册该传输来实现。例如，你可以安装和注册"Brevo"（原名"Sendinblue"）Symfony 邮件程序：

```shell
composer require symfony/brevo-mailer symfony/http-client
```

安装 Brevo 邮件程序包后，你可以向应用的 `services` 配置文件添加 Brevo API 凭据的条目：

```php
'brevo' => [
    'key' => env('BREVO_API_KEY'),
],
```

接下来，你可以使用 `Mail` 门面的 `extend` 方法向 Laravel 注册该传输。通常，这应在服务提供者的 `boot` 方法中完成：

```php
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Mailer\Bridge\Brevo\Transport\BrevoTransportFactory;
use Symfony\Component\Mailer\Transport\Dsn;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Mail::extend('brevo', function () {
        return (new BrevoTransportFactory)->create(
            new Dsn(
                'brevo+api',
                'default',
                config('services.brevo.key')
            )
        );
    });
}
```

传输注册后，你可以在应用的 `config/mail.php` 配置文件中创建一个利用新传输的邮件程序定义：

```php
'brevo' => [
    'transport' => 'brevo',
    // ...
],
```

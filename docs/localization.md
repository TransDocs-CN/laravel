# 本地化

- [简介](#introduction)
    - [发布语言文件](#publishing-the-language-files)
    - [配置语言区域](#configuring-the-locale)
    - [复数化语言](#pluralization-language)
- [定义翻译字符串](#defining-translation-strings)
    - [使用短键](#using-short-keys)
    - [使用翻译字符串作为键](#using-translation-strings-as-keys)
- [获取翻译字符串](#retrieving-translation-strings)
    - [替换翻译字符串中的参数](#replacing-parameters-in-translation-strings)
    - [复数化](#pluralization)
- [覆盖包语言文件](#overriding-package-language-files)

<a name="introduction"></a>
## 简介

> [!NOTE]
> 默认情况下，Laravel 应用程序骨架不包含 `lang` 目录。如果你想自定义 Laravel 的语言文件，可以通过 `lang:publish` Artisan 命令发布它们。

Laravel 的本地化功能提供了一种方便的方式来获取各种语言的字符串，使你能够轻松地在应用程序中支持多种语言。

Laravel 提供了两种管理翻译字符串的方式。首先，语言字符串可以存储在应用程序的 `lang` 目录中的文件中。在此目录中，可以为应用程序支持的每种语言创建子目录。这是 Laravel 用于管理内置功能（如验证错误消息）的翻译字符串的方法：

```text
/lang
    /en
        messages.php
    /es
        messages.php
```

或者，翻译字符串可以定义在 `lang` 目录中的 JSON 文件中。采用这种方法时，应用程序支持的每种语言都应在该目录中有一个对应的 JSON 文件。对于具有大量可翻译字符串的应用程序，推荐使用此方法：

```text
/lang
    en.json
    es.json
```

我们将在本文档中讨论每种管理翻译字符串的方法。

<a name="publishing-the-language-files"></a>
### 发布语言文件

默认情况下，Laravel 应用程序骨架不包含 `lang` 目录。如果你想自定义 Laravel 的语言文件或创建自己的语言文件，应通过 `lang:publish` Artisan 命令搭建 `lang` 目录。`lang:publish` 命令将在你的应用程序中创建 `lang` 目录并发布 Laravel 使用的默认语言文件集：

```shell
php artisan lang:publish
```

<a name="configuring-the-locale"></a>
### 配置语言区域

应用程序的默认语言存储在 `config/app.php` 配置文件的 `locale` 配置选项中，通常使用 `APP_LOCALE` 环境变量设置。你可以自由修改此值以满足应用程序的需求。

你还可以配置一个"备用语言"，当默认语言不包含给定的翻译字符串时将使用该语言。与默认语言一样，备用语言也在 `config/app.php` 配置文件中配置，其值通常使用 `APP_FALLBACK_LOCALE` 环境变量设置。

你可以使用 `App` 外观提供的 `setLocale` 方法在运行时修改单个 HTTP 请求的默认语言：

```php
use Illuminate\Support\Facades\App;

Route::get('/greeting/{locale}', function (string $locale) {
    if (! in_array($locale, ['en', 'es', 'fr'])) {
        abort(400);
    }

    App::setLocale($locale);

    // ...
});
```

<a name="determining-the-current-locale"></a>
#### 确定当前语言区域

你可以使用 `App` 外观上的 `currentLocale` 和 `isLocale` 方法来确定当前语言区域或检查语言区域是否为给定值：

```php
use Illuminate\Support\Facades\App;

$locale = App::currentLocale();

if (App::isLocale('en')) {
    // ...
}
```

<a name="pluralization-language"></a>
### 复数化语言

<style>
.code-list-no-flex-break code {
    display: contents !important;
}
</style>

<div class="code-list-no-flex-break">

你可以指示 Laravel 的"复数化器"（被 Eloquent 和框架的其他部分用于将单数字符串转换为复数形式）使用英语以外的语言。这可以通过在应用程序服务提供者的 `boot` 方法中调用 `useLanguage` 方法来实现。复数化器当前支持的语言有：`french`（法语）、`norwegian-bokmal`（挪威博克马尔语）、`portuguese`（葡萄牙语）、`spanish`（西班牙语）和 `turkish`（土耳其语）：

</div>

```php
use Illuminate\Support\Pluralizer;

/**
 * 引导应用程序服务。
 */
public function boot(): void
{
    Pluralizer::useLanguage('spanish');

    // ...
}
```

> [!WARNING]
> 如果你自定义了复数化器的语言，应显式定义你的 Eloquent 模型的[表名](/docs/{{version}}/eloquent#table-names)。

<a name="defining-translation-strings"></a>
## 定义翻译字符串

<a name="using-short-keys"></a>
### 使用短键

通常，翻译字符串存储在 `lang` 目录中的文件中。在此目录中，应用程序支持的每种语言应有一个子目录。这是 Laravel 用于管理内置功能（如验证错误消息）的翻译字符串的方法：

```text
/lang
    /en
        messages.php
    /es
        messages.php
```

所有语言文件返回一个键控字符串数组。例如：

```php
<?php

// lang/en/messages.php

return [
    'welcome' => '欢迎使用我们的应用程序！',
];
```

> [!WARNING]
> 对于因地区而异的语言，应根据 ISO 15897 命名语言目录。例如，英式英语应使用 "en_GB" 而不是 "en-gb"。

<a name="using-translation-strings-as-keys"></a>
### 使用翻译字符串作为键

对于具有大量可翻译字符串的应用程序，在视图中引用键时，使用"短键"定义每个字符串可能会变得混乱，并且为应用程序支持的每个翻译字符串不断发明新键也很繁琐。

因此，Laravel 还支持使用字符串的"默认"翻译作为键来定义翻译字符串。使用翻译字符串作为键的语言文件作为 JSON 文件存储在 `lang` 目录中。例如，如果你的应用程序有西班牙语翻译，你应该创建一个 `lang/es.json` 文件：

```json
{
    "I love programming.": "Me encanta programar."
}
```

#### 键/文件冲突

你不应定义与其他翻译文件名冲突的翻译字符串键。例如，为"NL"语言区域翻译 `__('Action')`，同时存在 `nl/action.php` 文件但不存在 `nl.json` 文件，将导致翻译器返回 `nl/action.php` 的整个内容。

<a name="retrieving-translation-strings"></a>
## 获取翻译字符串

你可以使用 `__` 辅助函数从语言文件中获取翻译字符串。如果你使用"短键"来定义翻译字符串，应使用"点"语法将包含键的文件和键本身传递给 `__` 函数。例如，让我们从 `lang/en/messages.php` 语言文件中获取 `welcome` 翻译字符串：

```php
echo __('messages.welcome');
```

如果指定的翻译字符串不存在，`__` 函数将返回翻译字符串键。因此，使用上面的示例，如果翻译字符串不存在，`__` 函数将返回 `messages.welcome`。

如果你使用[默认翻译字符串作为翻译键](#using-translation-strings-as-keys)，应将字符串的默认翻译传递给 `__` 函数：

```php
echo __('I love programming.');
```

同样，如果翻译字符串不存在，`__` 函数将返回给定的翻译字符串键。

如果你使用 [Blade 模板引擎](/docs/{{version}}/blade)，可以使用 `{{ }}` 回显语法来显示翻译字符串：

```blade
{{ __('messages.welcome') }}
```

<a name="replacing-parameters-in-translation-strings"></a>
### 替换翻译字符串中的参数

如果你愿意，可以在翻译字符串中定义占位符。所有占位符都以 `:` 为前缀。例如，你可以定义一个带有名称占位符的欢迎消息：

```php
'welcome' => '欢迎，:name',
```

要在获取翻译字符串时替换占位符，可以将替换数组作为第二个参数传递给 `__` 函数：

```php
echo __('messages.welcome', ['name' => 'dayle']);
```

如果你的占位符全部大写，或仅首字母大写，翻译后的值将相应地进行大写转换：

```php
'welcome' => '欢迎，:NAME', // 欢迎，DAYLE
'goodbye' => '再见，:Name', // 再见，Dayle
```

<a name="object-replacement-formatting"></a>
#### 对象替换格式

如果你尝试将对象作为翻译占位符提供，将调用该对象的 `__toString` 方法。[__toString](https://www.php.net/manual/en/language.oop5.magic.php#object.tostring) 方法是 PHP 的内置"魔术方法"之一。但是，有时你可能无法控制给定类的 `__toString` 方法，例如当你交互的类属于第三方库时。

在这种情况下，Laravel 允许你为特定类型的对象注册自定义格式化处理器。为此，应调用翻译器的 `stringable` 方法。`stringable` 方法接受一个闭包，该闭包应对其负责格式化的对象类型进行类型提示。通常，`stringable` 方法应在应用程序的 `AppServiceProvider` 类的 `boot` 方法中调用：

```php
use Illuminate\Support\Facades\Lang;
use Money\Money;

/**
 * 引导应用程序服务。
 */
public function boot(): void
{
    Lang::stringable(function (Money $money) {
        return $money->formatTo('en_GB');
    });
}
```

<a name="pluralization"></a>
### 复数化

复数化是一个复杂的问题，因为不同的语言有各种不同的复数化规则；但 Laravel 可以帮助你根据定义的复数化规则以不同方式翻译字符串。使用 `|` 字符，你可以区分字符串的单数和复数形式：

```php
'apples' => '有一个苹果|有很多苹果',
```

当然，当使用[翻译字符串作为键](#using-translation-strings-as-keys)时，也支持复数化：

```json
{
    "There is one apple|There are many apples": "Hay una manzana|Hay muchas manzanas"
}
```

你甚至可以创建更复杂的复数化规则，为多个值范围指定翻译字符串：

```php
'apples' => '{0} 没有|[1,19] 有一些|[20,*] 有很多',
```

在定义了具有复数化选项的翻译字符串后，你可以使用 `trans_choice` 函数来获取给定"数量"的行。在此示例中，由于数量大于一，因此返回翻译字符串的复数形式：

```php
echo trans_choice('messages.apples', 10);
```

你还可以在复数化字符串中定义占位符属性。这些占位符可以通过将数组作为第三个参数传递给 `trans_choice` 函数来替换：

```php
'minutes_ago' => '{1} :value 分钟前|[2,*] :value 分钟前',

echo trans_choice('time.minutes_ago', 5, ['value' => 5]);
```

如果你想显示传递给 `trans_choice` 函数的整数值，可以使用内置的 `:count` 占位符：

```php
'apples' => '{0} 没有|{1} 有一个|[2,*] 有 :count 个',
```

<a name="overriding-package-language-files"></a>
## 覆盖包语言文件

某些包可能随附自己的语言文件。你可以通过将文件放置在 `lang/vendor/{package}/{locale}` 目录中来覆盖这些行，而无需更改包的核心文件。

因此，例如，如果你需要覆盖名为 `skyrim/hearthfire` 的包中 `messages.php` 的英文字符串，应在 `lang/vendor/hearthfire/en/messages.php` 放置一个语言文件。在此文件中，你应该只定义要覆盖的翻译字符串。任何你未覆盖的翻译字符串仍将从包的原始语言文件中加载。

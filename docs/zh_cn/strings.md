# 字符串

- [简介](#introduction)
- [可用方法](#available-methods)

<a name="introduction"></a>
## 简介

Laravel 包含多种用于操作字符串值的函数。其中许多函数被框架本身使用；不过，如果你觉得方便，也可以在自有应用程序中自由使用它们。

<a name="available-methods"></a>
## 可用方法

<style>
    .collection-method-list > p {
        columns: 10.8em 3; -moz-columns: 10.8em 3; -webkit-columns: 10.8em 3;
    }

    .collection-method-list a {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
</style>

<a name="strings-method-list"></a>
### 字符串

<div class="collection-method-list" markdown="1">

[\__](#method-__)
[class_basename](#method-class-basename)
[e](#method-e)
[preg_replace_array](#method-preg-replace-array)
[Str::after](#method-str-after)
[Str::afterLast](#method-str-after-last)
[Str::apa](#method-str-apa)
[Str::ascii](#method-str-ascii)
[Str::before](#method-str-before)
[Str::beforeLast](#method-str-before-last)
[Str::between](#method-str-between)
[Str::betweenFirst](#method-str-between-first)
[Str::camel](#method-camel-case)
[Str::charAt](#method-char-at)
[Str::chopStart](#method-str-chop-start)
[Str::chopEnd](#method-str-chop-end)
[Str::contains](#method-str-contains)
[Str::containsAll](#method-str-contains-all)
[Str::counted](#method-str-counted)
[Str::doesntContain](#method-str-doesnt-contain)
[Str::doesntEndWith](#method-str-doesnt-end-with)
[Str::doesntStartWith](#method-str-doesnt-start-with)
[Str::deduplicate](#method-deduplicate)
[Str::endsWith](#method-ends-with)
[Str::excerpt](#method-excerpt)
[Str::finish](#method-str-finish)
[Str::fromBase64](#method-str-from-base64)
[Str::headline](#method-str-headline)
[Str::initials](#method-str-initials)
[Str::inlineMarkdown](#method-str-inline-markdown)
[Str::is](#method-str-is)
[Str::isAscii](#method-str-is-ascii)
[Str::isJson](#method-str-is-json)
[Str::isUlid](#method-str-is-ulid)
[Str::isUrl](#method-str-is-url)
[Str::isUuid](#method-str-is-uuid)
[Str::kebab](#method-kebab-case)
[Str::lcfirst](#method-str-lcfirst)
[Str::length](#method-str-length)
[Str::limit](#method-str-limit)
[Str::lower](#method-str-lower)
[Str::markdown](#method-str-markdown)
[Str::mask](#method-str-mask)
[Str::match](#method-str-match)
[Str::matchAll](#method-str-match-all)
[Str::isMatch](#method-str-is-match)
[Str::orderedUuid](#method-str-ordered-uuid)
[Str::padBoth](#method-str-padboth)
[Str::padLeft](#method-str-padleft)
[Str::padRight](#method-str-padright)
[Str::password](#method-str-password)
[Str::plural](#method-str-plural)
[Str::pluralStudly](#method-str-plural-studly)
[Str::position](#method-str-position)
[Str::random](#method-str-random)
[Str::remove](#method-str-remove)
[Str::repeat](#method-str-repeat)
[Str::replace](#method-str-replace)
[Str::replaceArray](#method-str-replace-array)
[Str::replaceFirst](#method-str-replace-first)
[Str::replaceLast](#method-str-replace-last)
[Str::replaceMatches](#method-str-replace-matches)
[Str::replaceStart](#method-str-replace-start)
[Str::replaceEnd](#method-str-replace-end)
[Str::reverse](#method-str-reverse)
[Str::singular](#method-str-singular)
[Str::slug](#method-str-slug)
[Str::snake](#method-snake-case)
[Str::squish](#method-str-squish)
[Str::start](#method-str-start)
[Str::startsWith](#method-starts-with)
[Str::studly](#method-studly-case)
[Str::substr](#method-str-substr)
[Str::substrCount](#method-str-substrcount)
[Str::substrReplace](#method-str-substrreplace)
[Str::swap](#method-str-swap)
[Str::take](#method-take)
[Str::title](#method-title-case)
[Str::toBase64](#method-str-to-base64)
[Str::transliterate](#method-str-transliterate)
[Str::trim](#method-str-trim)
[Str::ltrim](#method-str-ltrim)
[Str::rtrim](#method-str-rtrim)
[Str::ucfirst](#method-str-ucfirst)
[Str::ucsplit](#method-str-ucsplit)
[Str::ucwords](#method-str-ucwords)
[Str::upper](#method-str-upper)
[Str::ulid](#method-str-ulid)
[Str::unwrap](#method-str-unwrap)
[Str::uuid](#method-str-uuid)
[Str::uuid7](#method-str-uuid7)
[Str::wordCount](#method-str-word-count)
[Str::wordWrap](#method-str-word-wrap)
[Str::words](#method-str-words)
[Str::wrap](#method-str-wrap)
[str](#method-str)
[trans](#method-trans)
[trans_choice](#method-trans-choice)

</div>

<a name="fluent-strings-method-list"></a>
### 流式字符串

<div class="collection-method-list" markdown="1">

[after](#method-fluent-str-after)
[afterLast](#method-fluent-str-after-last)
[apa](#method-fluent-str-apa)
[append](#method-fluent-str-append)
[ascii](#method-fluent-str-ascii)
[basename](#method-fluent-str-basename)
[before](#method-fluent-str-before)
[beforeLast](#method-fluent-str-before-last)
[between](#method-fluent-str-between)
[betweenFirst](#method-fluent-str-between-first)
[camel](#method-fluent-str-camel)
[charAt](#method-fluent-str-char-at)
[classBasename](#method-fluent-str-class-basename)
[chopStart](#method-fluent-str-chop-start)
[chopEnd](#method-fluent-str-chop-end)
[contains](#method-fluent-str-contains)
[containsAll](#method-fluent-str-contains-all)
[counted](#method-fluent-str-counted)
[decrypt](#method-fluent-str-decrypt)
[deduplicate](#method-fluent-str-deduplicate)
[dirname](#method-fluent-str-dirname)
[doesntContain](#method-fluent-str-doesnt-contain)
[doesntEndWith](#method-fluent-str-doesnt-end-with)
[doesntStartWith](#method-fluent-str-doesnt-start-with)
[encrypt](#method-fluent-str-encrypt)
[endsWith](#method-fluent-str-ends-with)
[exactly](#method-fluent-str-exactly)
[excerpt](#method-fluent-str-excerpt)
[explode](#method-fluent-str-explode)
[finish](#method-fluent-str-finish)
[fromBase64](#method-fluent-str-from-base64)
[hash](#method-fluent-str-hash)
[headline](#method-fluent-str-headline)
[initials](#method-fluent-str-initials)
[inlineMarkdown](#method-fluent-str-inline-markdown)
[is](#method-fluent-str-is)
[isAscii](#method-fluent-str-is-ascii)
[isEmpty](#method-fluent-str-is-empty)
[isNotEmpty](#method-fluent-str-is-not-empty)
[isJson](#method-fluent-str-is-json)
[isUlid](#method-fluent-str-is-ulid)
[isUrl](#method-fluent-str-is-url)
[isUuid](#method-fluent-str-is-uuid)
[kebab](#method-fluent-str-kebab)
[lcfirst](#method-fluent-str-lcfirst)
[length](#method-fluent-str-length)
[limit](#method-fluent-str-limit)
[lower](#method-fluent-str-lower)
[markdown](#method-fluent-str-markdown)
[mask](#method-fluent-str-mask)
[match](#method-fluent-str-match)
[matchAll](#method-fluent-str-match-all)
[isMatch](#method-fluent-str-is-match)
[newLine](#method-fluent-str-new-line)
[padBoth](#method-fluent-str-padboth)
[padLeft](#method-fluent-str-padleft)
[padRight](#method-fluent-str-padright)
[pipe](#method-fluent-str-pipe)
[plural](#method-fluent-str-plural)
[position](#method-fluent-str-position)
[prepend](#method-fluent-str-prepend)
[remove](#method-fluent-str-remove)
[repeat](#method-fluent-str-repeat)
[replace](#method-fluent-str-replace)
[replaceArray](#method-fluent-str-replace-array)
[replaceFirst](#method-fluent-str-replace-first)
[replaceLast](#method-fluent-str-replace-last)
[replaceMatches](#method-fluent-str-replace-matches)
[replaceStart](#method-fluent-str-replace-start)
[replaceEnd](#method-fluent-str-replace-end)
[scan](#method-fluent-str-scan)
[singular](#method-fluent-str-singular)
[slug](#method-fluent-str-slug)
[snake](#method-fluent-str-snake)
[split](#method-fluent-str-split)
[squish](#method-fluent-str-squish)
[start](#method-fluent-str-start)
[startsWith](#method-fluent-str-starts-with)
[stripTags](#method-fluent-str-strip-tags)
[studly](#method-fluent-str-studly)
[substr](#method-fluent-str-substr)
[substrReplace](#method-fluent-str-substrreplace)
[swap](#method-fluent-str-swap)
[take](#method-fluent-str-take)
[tap](#method-fluent-str-tap)
[test](#method-fluent-str-test)
[title](#method-fluent-str-title)
[toBase64](#method-fluent-str-to-base64)
[toHtmlString](#method-fluent-str-to-html-string)
[toUri](#method-fluent-str-to-uri)
[transliterate](#method-fluent-str-transliterate)
[trim](#method-fluent-str-trim)
[ltrim](#method-fluent-str-ltrim)
[rtrim](#method-fluent-str-rtrim)
[ucfirst](#method-fluent-str-ucfirst)
[ucsplit](#method-fluent-str-ucsplit)
[ucwords](#method-fluent-str-ucwords)
[unwrap](#method-fluent-str-unwrap)
[upper](#method-fluent-str-upper)
[when](#method-fluent-str-when)
[whenContains](#method-fluent-str-when-contains)
[whenContainsAll](#method-fluent-str-when-contains-all)
[whenDoesntEndWith](#method-fluent-str-when-doesnt-end-with)
[whenDoesntStartWith](#method-fluent-str-when-doesnt-start-with)
[whenEmpty](#method-fluent-str-when-empty)
[whenNotEmpty](#method-fluent-str-when-not-empty)
[whenStartsWith](#method-fluent-str-when-starts-with)
[whenEndsWith](#method-fluent-str-when-ends-with)
[whenExactly](#method-fluent-str-when-exactly)
[whenNotExactly](#method-fluent-str-when-not-exactly)
[whenIs](#method-fluent-str-when-is)
[whenIsAscii](#method-fluent-str-when-is-ascii)
[whenIsUlid](#method-fluent-str-when-is-ulid)
[whenIsUuid](#method-fluent-str-when-is-uuid)
[whenTest](#method-fluent-str-when-test)
[wordCount](#method-fluent-str-word-count)
[words](#method-fluent-str-words)
[wrap](#method-fluent-str-wrap)

</div>

<a name="strings"></a>
## 字符串

<a name="method-__"></a>
#### `__()` {.collection-method}

`__` 函数使用你的[语言文件](/docs/{{version}}/localization)翻译给定的翻译字符串或翻译键：

```php
echo __('欢迎使用我们的应用程序');

echo __('messages.welcome');
```

如果指定的翻译字符串或键不存在，`__` 函数将返回给定的值。因此，使用上面的示例，如果翻译键不存在，`__` 函数将返回 `messages.welcome`。

<a name="method-class-basename"></a>
#### `class_basename()` {.collection-method}

`class_basename` 函数返回给定类的类名，并移除类的命名空间：

```php
$class = class_basename('Foo\Bar\Baz');

// Baz
```

<a name="method-e"></a>
#### `e()` {.collection-method}

`e` 函数运行 PHP 的 `htmlspecialchars` 函数，其中 `double_encode` 选项默认设置为 `true`：

```php
echo e('<html>foo</html>');

// &lt;html&gt;foo&lt;/html&gt;
```

<a name="method-preg-replace-array"></a>
#### `preg_replace_array()` {.collection-method}

`preg_replace_array` 函数使用数组顺序替换字符串中给定的模式：

```php
$string = '活动将在 :start 和 :end 之间举行';

$replaced = preg_replace_array('/:[a-z_]+/', ['8:30', '9:00'], $string);

// 活动将在 8:30 和 9:00 之间举行
```

<a name="method-str-after"></a>
#### `Str::after()` {.collection-method}

`Str::after` 方法返回字符串中给定值之后的所有内容。如果值不存在于字符串中，将返回整个字符串：

```php
use Illuminate\Support\Str;

$slice = Str::after('这是我的名字', '这是');

// ' 我的名字'
```

<a name="method-str-after-last"></a>
#### `Str::afterLast()` {.collection-method}

`Str::afterLast` 方法返回字符串中给定值的最后一次出现之后的所有内容。如果值不存在于字符串中，将返回整个字符串：

```php
use Illuminate\Support\Str;

$slice = Str::afterLast('App\Http\Controllers\Controller', '\\');

// 'Controller'
```

<a name="method-str-apa"></a>
#### `Str::apa()` {.collection-method}

`Str::apa` 方法根据 [APA 指南](https://apastyle.apa.org/style-grammar-guidelines/capitalization/title-case)将给定字符串转换为标题大小写：

```php
use Illuminate\Support\Str;

$title = Str::apa('Creating A Project');

// 'Creating a Project'
```

<a name="method-str-ascii"></a>
#### `Str::ascii()` {.collection-method}

`Str::ascii` 方法将尝试将字符串音译为 ASCII 值：

```php
use Illuminate\Support\Str;

$slice = Str::ascii('û');

// 'u'
```

<a name="method-str-before"></a>
#### `Str::before()` {.collection-method}

`Str::before` 方法返回字符串中给定值之前的所有内容：

```php
use Illuminate\Support\Str;

$slice = Str::before('这是我的名字', '我的名字');

// '这是'
```

<a name="method-str-before-last"></a>
#### `Str::beforeLast()` {.collection-method}

`Str::beforeLast` 方法返回字符串中给定值的最后一次出现之前的所有内容：

```php
use Illuminate\Support\Str;

$slice = Str::beforeLast('这是我的名字', '是');

// '这'
```

<a name="method-str-between"></a>
#### `Str::between()` {.collection-method}

`Str::between` 方法返回字符串中两个值之间的部分：

```php
use Illuminate\Support\Str;

$slice = Str::between('这是我的名字', '这', '名字');

// '是我的'
```

<a name="method-str-between-first"></a>
#### `Str::betweenFirst()` {.collection-method}

`Str::betweenFirst` 方法返回字符串中两个值之间尽可能小的部分：

```php
use Illuminate\Support\Str;

$slice = Str::betweenFirst('[a] bc [d]', '[', ']');

// 'a'
```

<a name="method-camel-case"></a>
#### `Str::camel()` {.collection-method}

`Str::camel` 方法将给定字符串转换为 `camelCase`：

```php
use Illuminate\Support\Str;

$converted = Str::camel('foo_bar');

// 'fooBar'
```

<a name="method-char-at"></a>
#### `Str::charAt()` {.collection-method}

`Str::charAt` 方法返回指定索引处的字符。如果索引超出范围，则返回 `false`：

```php
use Illuminate\Support\Str;

$character = Str::charAt('这是我的名字。', 6);

// 's'
```

<a name="method-str-chop-start"></a>
#### `Str::chopStart()` {.collection-method}

`Str::chopStart` 方法仅在给定值出现在字符串开头时移除该值的第一次出现：

```php
use Illuminate\Support\Str;

$url = Str::chopStart('https://laravel.com', 'https://');

// 'laravel.com'
```

你也可以传递一个数组作为第二个参数。如果字符串以数组中的任何值开头，则该值将从字符串中移除：

```php
use Illuminate\Support\Str;

$url = Str::chopStart('http://laravel.com', ['https://', 'http://']);

// 'laravel.com'
```

<a name="method-str-chop-end"></a>
#### `Str::chopEnd()` {.collection-method}

`Str::chopEnd` 方法仅在给定值出现在字符串末尾时移除该值的最后一次出现：

```php
use Illuminate\Support\Str;

$url = Str::chopEnd('app/Models/Photograph.php', '.php');

// 'app/Models/Photograph'
```

你也可以传递一个数组作为第二个参数。如果字符串以数组中的任何值结尾，则该值将从字符串中移除：

```php
use Illuminate\Support\Str;

$url = Str::chopEnd('laravel.com/index.php', ['/index.html', '/index.php']);

// 'laravel.com'
```

<a name="method-str-contains"></a>
#### `Str::contains()` {.collection-method}

`Str::contains` 方法确定给定的字符串是否包含给定的值。默认情况下，此方法区分大小写：

```php
use Illuminate\Support\Str;

$contains = Str::contains('这是我的名字', '我的');

// true
```

你也可以传递一个值数组来确定给定的字符串是否包含数组中的任何值：

```php
use Illuminate\Support\Str;

$contains = Str::contains('这是我的名字', ['我的', 'foo']);

// true
```

你可以通过将 `ignoreCase` 参数设置为 `true` 来禁用大小写敏感：

```php
use Illuminate\Support\Str;

$contains = Str::contains('这是我的名字', '我的', ignoreCase: true);

// true
```

<a name="method-str-contains-all"></a>
#### `Str::containsAll()` {.collection-method}

`Str::containsAll` 方法确定给定的字符串是否包含给定数组中的所有值：

```php
use Illuminate\Support\Str;

$containsAll = Str::containsAll('这是我的名字', ['我的', '名字']);

// true
```

你可以通过将 `ignoreCase` 参数设置为 `true` 来禁用大小写敏感：

```php
use Illuminate\Support\Str;

$containsAll = Str::containsAll('这是我的名字', ['我的', '名字'], ignoreCase: true);

// true
```

<a name="method-str-doesnt-contain"></a>
#### `Str::doesntContain()` {.collection-method}

`Str::doesntContain` 方法确定给定的字符串是否不包含给定的值。默认情况下，此方法区分大小写：

```php
use Illuminate\Support\Str;

$doesntContain = Str::doesntContain('这是名字', '我的');

// true
```

你也可以传递一个值数组来确定给定的字符串是否不包含数组中的任何值：

```php
use Illuminate\Support\Str;

$doesntContain = Str::doesntContain('这是名字', ['我的', '框架']);

// true
```

你可以通过将 `ignoreCase` 参数设置为 `true` 来禁用大小写敏感：

```php
use Illuminate\Support\Str;

$doesntContain = Str::doesntContain('这是名字', '我的', ignoreCase: true);

// true
```

<a name="method-deduplicate"></a>
#### `Str::deduplicate()` {.collection-method}

`Str::deduplicate` 方法将字符串中连续出现的字符替换为该字符的单个实例。默认情况下，该方法对空格进行去重：

```php
use Illuminate\Support\Str;

$result = Str::deduplicate('The   Laravel   Framework');

// The Laravel Framework
```

你可以通过将不同字符作为第二个参数传递给该方法来指定要去重的字符：

```php
use Illuminate\Support\Str;

$result = Str::deduplicate('The---Laravel---Framework', '-');

// The-Laravel-Framework
```

<a name="method-str-doesnt-end-with"></a>
#### `Str::doesntEndWith()` {.collection-method}

`Str::doesntEndWith` 方法确定给定的字符串是否不以给定的值结尾：

```php
use Illuminate\Support\Str;

$result = Str::doesntEndWith('这是我的名字', 'dog');

// true
```

你也可以传递一个值数组来确定给定的字符串是否不以数组中的任何值结尾：

```php
use Illuminate\Support\Str;

$result = Str::doesntEndWith('这是我的名字', ['this', 'foo']);

// true

$result = Str::doesntEndWith('这是我的名字', ['name', 'foo']);

// false
```

<a name="method-str-doesnt-start-with"></a>
#### `Str::doesntStartWith()` {.collection-method}

`Str::doesntStartWith` 方法确定给定的字符串是否不以给定的值开头：

```php
use Illuminate\Support\Str;

$result = Str::doesntStartWith('这是我的名字', 'That');

// true
```

如果传递了一个可能值的数组，`doesntStartWith` 方法将在字符串不以任何给定值开头时返回 `true`：

```php
$result = Str::doesntStartWith('这是我的名字', ['What', 'That', 'There']);

// true
```

<a name="method-ends-with"></a>
#### `Str::endsWith()` {.collection-method}

`Str::endsWith` 方法确定给定的字符串是否以给定的值结尾：

```php
use Illuminate\Support\Str;

$result = Str::endsWith('这是我的名字', 'name');

// true
```

你也可以传递一个值数组来确定给定的字符串是否以数组中的任何值结尾：

```php
use Illuminate\Support\Str;

$result = Str::endsWith('这是我的名字', ['name', 'foo']);

// true

$result = Str::endsWith('这是我的名字', ['this', 'foo']);

// false
```

<a name="method-excerpt"></a>
#### `Str::excerpt()` {.collection-method}

`Str::excerpt` 方法从给定字符串中提取与短语的第一次实例匹配的摘录：

```php
use Illuminate\Support\Str;

$excerpt = Str::excerpt('这是我的名字', '我的', [
    'radius' => 3
]);

// '...是我的名...'
```

`radius` 选项默认为 `100`，允许你定义在截断字符串的每一侧应出现的字符数。

此外，你可以使用 `omission` 选项定义将前置和附加到截断字符串的字符串：

```php
use Illuminate\Support\Str;

$excerpt = Str::excerpt('这是我的名字', '名字', [
    'radius' => 3,
    'omission' => '(...) '
]);

// '(...) 我的名字'
```

<a name="method-str-finish"></a>
#### `Str::finish()` {.collection-method}

`Str::finish` 方法在字符串末尾添加给定值的单个实例（如果字符串尚未以该值结尾）：

```php
use Illuminate\Support\Str;

$adjusted = Str::finish('this/string', '/');

// this/string/

$adjusted = Str::finish('this/string/', '/');

// this/string/
```

<a name="method-str-from-base64"></a>
#### `Str::fromBase64()` {.collection-method}

`Str::fromBase64` 方法解码给定的 Base64 字符串：

```php
use Illuminate\Support\Str;

$decoded = Str::fromBase64('TGFyYXZlbA==');

// Laravel
```

<a name="method-str-headline"></a>
#### `Str::headline()` {.collection-method}

`Str::headline` 方法将使用大小写、连字符或下划线分隔的字符串转换为空格分隔的字符串，每个单词的首字母大写：

```php
use Illuminate\Support\Str;

$headline = Str::headline('steve_jobs');

// Steve Jobs

$headline = Str::headline('EmailNotificationSent');

// Email Notification Sent
```

<a name="method-str-initials"></a>
#### `Str::initials()` {.collection-method}

`Str::initials` 方法将返回给定字符串的首字母，可选地将其大写：

```php
use Illuminate\Support\Str;

$initials = Str::initials('taylor otwell');

// to

$initials = Str::initials('taylor otwell', capitalize: true);

// TO
```

<a name="method-str-inline-markdown"></a>
#### `Str::inlineMarkdown()` {.collection-method}

`Str::inlineMarkdown` 方法使用 [CommonMark](https://commonmark.thephpleague.com/) 将 GitHub 风格的 Markdown 转换为内联 HTML。但是，与 `markdown` 方法不同，它不会将所有生成的 HTML 包装在块级元素中：

```php
use Illuminate\Support\Str;

$html = Str::inlineMarkdown('**Laravel**');

// <strong>Laravel</strong>
```

#### Markdown 安全性

默认情况下，Markdown 支持原始 HTML，当与原始用户输入一起使用时，这将暴露跨站脚本（XSS）漏洞。根据 [CommonMark 安全文档](https://commonmark.thephpleague.com/security/)，你可以使用 `html_input` 选项来转义或剥离原始 HTML，并使用 `allow_unsafe_links` 选项来指定是否允许不安全的链接。如果你需要允许某些原始 HTML，应将编译后的 Markdown 传递给 HTML 净化器：

```php
use Illuminate\Support\Str;

Str::inlineMarkdown('注入: <script>alert("Hello XSS!");</script>', [
    'html_input' => 'strip',
    'allow_unsafe_links' => false,
]);

// 注入: alert(&quot;Hello XSS!&quot;);
```

<a name="method-str-is"></a>
#### `Str::is()` {.collection-method}

`Str::is` 方法确定给定的字符串是否与给定的模式匹配。星号可用作通配符值：

```php
use Illuminate\Support\Str;

$matches = Str::is('foo*', 'foobar');

// true

$matches = Str::is('baz*', 'foobar');

// false
```

你可以通过将 `ignoreCase` 参数设置为 `true` 来禁用大小写敏感：

```php
use Illuminate\Support\Str;

$matches = Str::is('*.jpg', 'photo.JPG', ignoreCase: true);

// true
```

<a name="method-str-is-ascii"></a>
#### `Str::isAscii()` {.collection-method}

`Str::isAscii` 方法确定给定的字符串是否为 7 位 ASCII：

```php
use Illuminate\Support\Str;

$isAscii = Str::isAscii('Taylor');

// true

$isAscii = Str::isAscii('ü');

// false
```

<a name="method-str-is-json"></a>
#### `Str::isJson()` {.collection-method}

`Str::isJson` 方法确定给定的字符串是否为有效的 JSON：

```php
use Illuminate\Support\Str;

$result = Str::isJson('[1,2,3]');

// true

$result = Str::isJson('{"first": "John", "last": "Doe"}');

// true

$result = Str::isJson('{first: "John", last: "Doe"}');

// false
```

<a name="method-str-is-url"></a>
#### `Str::isUrl()` {.collection-method}

`Str::isUrl` 方法确定给定的字符串是否为有效的 URL：

```php
use Illuminate\Support\Str;

$isUrl = Str::isUrl('http://example.com');

// true

$isUrl = Str::isUrl('laravel');

// false
```

`isUrl` 方法将广泛的协议视为有效。但是，你可以通过向 `isUrl` 方法提供协议来指定哪些协议应被视为有效：

```php
$isUrl = Str::isUrl('http://example.com', ['http', 'https']);
```

<a name="method-str-is-ulid"></a>
#### `Str::isUlid()` {.collection-method}

`Str::isUlid` 方法确定给定的字符串是否为有效的 ULID：

```php
use Illuminate\Support\Str;

$isUlid = Str::isUlid('01gd6r360bp37zj17nxb55yv40');

// true

$isUlid = Str::isUlid('laravel');

// false
```

<a name="method-str-is-uuid"></a>
#### `Str::isUuid()` {.collection-method}

`Str::isUuid` 方法确定给定的字符串是否为有效的 UUID：

```php
use Illuminate\Support\Str;

$isUuid = Str::isUuid('a0a2a2d2-0b87-4a18-83f2-2529882be2de');

// true

$isUuid = Str::isUuid('laravel');

// false
```

你还可以验证给定的 UUID 是否按版本（1、3、4、5、6、7 或 8）匹配 UUID 规范：

```php
use Illuminate\Support\Str;

$isUuid = Str::isUuid('a0a2a2d2-0b87-4a18-83f2-2529882be2de', version: 4);

// true

$isUuid = Str::isUuid('a0a2a2d2-0b87-4a18-83f2-2529882be2de', version: 1);

// false
```

<a name="method-kebab-case"></a>
#### `Str::kebab()` {.collection-method}

`Str::kebab` 方法将给定的字符串转换为 `kebab-case`：

```php
use Illuminate\Support\Str;

$converted = Str::kebab('fooBar');

// foo-bar
```

<a name="method-str-lcfirst"></a>
#### `Str::lcfirst()` {.collection-method}

`Str::lcfirst` 方法返回给定字符串，并将第一个字符转换为小写：

```php
use Illuminate\Support\Str;

$string = Str::lcfirst('Foo Bar');

// foo Bar
```

<a name="method-str-length"></a>
#### `Str::length()` {.collection-method}

`Str::length` 方法返回给定字符串的长度：

```php
use Illuminate\Support\Str;

$length = Str::length('Laravel');

// 7
```

<a name="method-str-limit"></a>
#### `Str::limit()` {.collection-method}

`Str::limit` 方法将给定的字符串截断到指定的长度：

```php
use Illuminate\Support\Str;

$truncated = Str::limit('敏捷的棕色狐狸跳过了懒狗', 20);

// 敏捷的棕色狐狸跳过了懒...
```

你可以传递第三个参数来更改将附加到截断字符串末尾的字符串：

```php
$truncated = Str::limit('敏捷的棕色狐狸跳过了懒狗', 20, ' (...)');

// 敏捷的棕色狐狸跳过了懒 (...)
```

如果你希望在截断字符串时保留完整的单词，可以使用 `preserveWords` 参数。当此参数为 `true` 时，字符串将被截断到最近的完整单词边界：

```php
$truncated = Str::limit('敏捷的棕色狐狸', 12, preserveWords: true);

// 敏捷的棕色...
```

<a name="method-str-lower"></a>
#### `Str::lower()` {.collection-method}

`Str::lower` 方法将给定的字符串转换为小写：

```php
use Illuminate\Support\Str;

$converted = Str::lower('LARAVEL');

// laravel
```

<a name="method-str-markdown"></a>
#### `Str::markdown()` {.collection-method}

`Str::markdown` 方法使用 [CommonMark](https://commonmark.thephpleague.com/) 将 GitHub 风格的 Markdown 转换为 HTML：

```php
use Illuminate\Support\Str;

$html = Str::markdown('# Laravel');

// <h1>Laravel</h1>

$html = Str::markdown('# Taylor <b>Otwell</b>', [
    'html_input' => 'strip',
]);

// <h1>Taylor Otwell</h1>
```

#### Markdown 安全性

默认情况下，Markdown 支持原始 HTML，当与原始用户输入一起使用时，这将暴露跨站脚本（XSS）漏洞。根据 [CommonMark 安全文档](https://commonmark.thephpleague.com/security/)，你可以使用 `html_input` 选项来转义或剥离原始 HTML，并使用 `allow_unsafe_links` 选项来指定是否允许不安全的链接。如果你需要允许某些原始 HTML，应将编译后的 Markdown 传递给 HTML 净化器：

```php
use Illuminate\Support\Str;

Str::markdown('注入: <script>alert("Hello XSS!");</script>', [
    'html_input' => 'strip',
    'allow_unsafe_links' => false,
]);

// <p>注入: alert(&quot;Hello XSS!&quot;);</p>
```

<a name="method-str-mask"></a>
#### `Str::mask()` {.collection-method}

`Str::mask` 方法使用重复字符掩码字符串的一部分，可用于混淆字符串的片段，如电子邮件地址和电话号码：

```php
use Illuminate\Support\Str;

$string = Str::mask('taylor@example.com', '*', 3);

// tay***************
```

如果需要，你可以为 `mask` 方法提供负数作为第三个参数，这将指示方法从距字符串末尾的给定距离开始掩码：

```php
$string = Str::mask('taylor@example.com', '*', -15, 3);

// tay***@example.com
```

<a name="method-str-match"></a>
#### `Str::match()` {.collection-method}

`Str::match` 方法将返回与给定正则表达式模式匹配的字符串部分：

```php
use Illuminate\Support\Str;

$result = Str::match('/bar/', 'foo bar');

// 'bar'

$result = Str::match('/foo (.*)/', 'foo bar');

// 'bar'
```

<a name="method-str-match-all"></a>
#### `Str::matchAll()` {.collection-method}

`Str::matchAll` 方法将返回一个集合，其中包含与给定正则表达式模式匹配的字符串部分：

```php
use Illuminate\Support\Str;

$result = Str::matchAll('/bar/', 'bar foo bar');

// collect(['bar', 'bar'])
```

如果你在表达式中指定了一个匹配组，Laravel 将返回第一个匹配组的匹配集合：

```php
use Illuminate\Support\Str;

$result = Str::matchAll('/f(\w*)/', 'bar fun bar fly');

// collect(['un', 'ly']);
```

如果未找到匹配项，将返回一个空集合。

<a name="method-str-is-match"></a>
#### `Str::isMatch()` {.collection-method}

`Str::isMatch` 方法将在字符串匹配给定的正则表达式时返回 `true`：

```php
use Illuminate\Support\Str;

$result = Str::isMatch('/foo (.*)/', 'foo bar');

// true

$result = Str::isMatch('/foo (.*)/', 'laravel');

// false
```

<a name="method-str-ordered-uuid"></a>
#### `Str::orderedUuid()` {.collection-method}

`Str::orderedUuid` 方法生成一个"时间戳优先"的 UUID，可以有效地存储在索引数据库列中。使用此方法生成的每个 UUID 都将排在使用该方法先前生成的 UUID 之后：

```php
use Illuminate\Support\Str;

return (string) Str::orderedUuid();
```

<a name="method-str-padboth"></a>
#### `Str::padBoth()` {.collection-method}

`Str::padBoth` 方法包装了 PHP 的 `str_pad` 函数，用另一个字符串填充字符串的两侧，直到最终字符串达到所需长度：

```php
use Illuminate\Support\Str;

$padded = Str::padBoth('James', 10, '_');

// '__James___'

$padded = Str::padBoth('James', 10);

// '  James   '
```

<a name="method-str-padleft"></a>
#### `Str::padLeft()` {.collection-method}

`Str::padLeft` 方法包装了 PHP 的 `str_pad` 函数，用另一个字符串填充字符串的左侧，直到最终字符串达到所需长度：

```php
use Illuminate\Support\Str;

$padded = Str::padLeft('James', 10, '-=');

// '-=-=-James'

$padded = Str::padLeft('James', 10);

// '     James'
```

<a name="method-str-padright"></a>
#### `Str::padRight()` {.collection-method}

`Str::padRight` 方法包装了 PHP 的 `str_pad` 函数，用另一个字符串填充字符串的右侧，直到最终字符串达到所需长度：

```php
use Illuminate\Support\Str;

$padded = Str::padRight('James', 10, '-');

// 'James-----'

$padded = Str::padRight('James', 10);

// 'James     '
```

<a name="method-str-password"></a>
#### `Str::password()` {.collection-method}

`Str::password` 方法可用于生成给定长度的安全随机密码。密码将由字母、数字、符号和空格的组合组成。默认情况下，密码长度为 32 个字符：

```php
use Illuminate\Support\Str;

$password = Str::password();

// 'EbJo2vE-AS:U,$%_gkrV4n,q~1xy/-_4'

$password = Str::password(12);

// 'qwuar>#V|i]N'
```

<a name="method-str-counted"></a>
#### `Str::counted()` {.collection-method}

`Str::counted` 方法根据给定的计数将单数字符串转换为其单数或复数形式，并将结果前缀格式化的计数：

```php
use Illuminate\Support\Str;

$label = Str::counted('order', 1);

// 1 order

$label = Str::counted('order', 1000);

// 1,000 orders
```

<a name="method-str-plural"></a>
#### `Str::plural()` {.collection-method}

`Str::plural` 方法将单数字符串转换为其复数形式。此函数支持 [Laravel 复数化器支持的任何语言](/docs/{{version}}/localization#pluralization-language)：

```php
use Illuminate\Support\Str;

$plural = Str::plural('car');

// cars

$plural = Str::plural('child');

// children
```

你可以向函数提供整数作为第二个参数来获取字符串的单数或复数形式：

```php
use Illuminate\Support\Str;

$plural = Str::plural('child', 2);

// children

$singular = Str::plural('child', 1);

// child
```

可以提供 `prependCount` 参数以将格式化的 `$count` 前缀到复数化字符串：

```php
use Illuminate\Support\Str;

$label = Str::plural('car', 1000, prependCount: true);

// 1,000 cars
```

<a name="method-str-plural-studly"></a>
#### `Str::pluralStudly()` {.collection-method}

`Str::pluralStudly` 方法将以驼峰大小写格式化的单数字符串转换为其复数形式。此函数支持 [Laravel 复数化器支持的任何语言](/docs/{{version}}/localization#pluralization-language)：

```php
use Illuminate\Support\Str;

$plural = Str::pluralStudly('VerifiedHuman');

// VerifiedHumans

$plural = Str::pluralStudly('UserFeedback');

// UserFeedback
```

你可以向函数提供整数作为第二个参数来获取字符串的单数或复数形式：

```php
use Illuminate\Support\Str;

$plural = Str::pluralStudly('VerifiedHuman', 2);

// VerifiedHumans

$singular = Str::pluralStudly('VerifiedHuman', 1);

// VerifiedHuman
```

<a name="method-str-position"></a>
#### `Str::position()` {.collection-method}

`Str::position` 方法返回子字符串在字符串中第一次出现的位置。如果子字符串不存在于给定字符串中，则返回 `false`：

```php
use Illuminate\Support\Str;

$position = Str::position('Hello, World!', 'Hello');

// 0

$position = Str::position('Hello, World!', 'W');

// 7
```

<a name="method-str-random"></a>
#### `Str::random()` {.collection-method}

`Str::random` 方法生成指定长度的随机字符串。此函数使用 PHP 的 `random_bytes` 函数：

```php
use Illuminate\Support\Str;

$random = Str::random(40);
```

在测试期间，"伪造"`Str::random` 方法返回的值可能很有用。为此，你可以使用 `createRandomStringsUsing` 方法：

```php
Str::createRandomStringsUsing(function () {
    return 'fake-random-string';
});
```

要指示 `random` 方法恢复正常生成随机字符串，你可以调用 `createRandomStringsNormally` 方法：

```php
Str::createRandomStringsNormally();
```

<a name="method-str-remove"></a>
#### `Str::remove()` {.collection-method}

`Str::remove` 方法从字符串中移除给定的值或值数组：

```php
use Illuminate\Support\Str;

$string = 'Peter Piper picked a peck of pickled peppers.';

$removed = Str::remove('e', $string);

// Ptr Pipr pickd a pck of pickld ppprs.
```

你也可以向 `remove` 方法传递 `false` 作为第三个参数，以在移除字符串时忽略大小写。

<a name="method-str-repeat"></a>
#### `Str::repeat()` {.collection-method}

`Str::repeat` 方法重复给定的字符串：

```php
use Illuminate\Support\Str;

$string = 'a';

$repeat = Str::repeat($string, 5);

// aaaaa
```

<a name="method-str-replace"></a>
#### `Str::replace()` {.collection-method}

`Str::replace` 方法在字符串中替换给定的字符串：

```php
use Illuminate\Support\Str;

$string = 'Laravel 11.x';

$replaced = Str::replace('11.x', '12.x', $string);

// Laravel 12.x
```

`replace` 方法也接受一个 `caseSensitive` 参数。默认情况下，`replace` 方法区分大小写：

```php
$replaced = Str::replace(
    'php',
    'Laravel',
    'PHP Framework for Web Artisans',
    caseSensitive: false
);

// Laravel Framework for Web Artisans
```

<a name="method-str-replace-array"></a>
#### `Str::replaceArray()` {.collection-method}

`Str::replaceArray` 方法使用数组顺序替换字符串中的给定值：

```php
use Illuminate\Support\Str;

$string = '活动将在 ? 和 ? 之间举行';

$replaced = Str::replaceArray('?', ['8:30', '9:00'], $string);

// 活动将在 8:30 和 9:00 之间举行
```

<a name="method-str-replace-first"></a>
#### `Str::replaceFirst()` {.collection-method}

`Str::replaceFirst` 方法替换字符串中给定值的第一次出现：

```php
use Illuminate\Support\Str;

$replaced = Str::replaceFirst('the', 'a', 'the quick brown fox jumps over the lazy dog');

// a quick brown fox jumps over the lazy dog
```

<a name="method-str-replace-last"></a>
#### `Str::replaceLast()` {.collection-method}

`Str::replaceLast` 方法替换字符串中给定值的最后一次出现：

```php
use Illuminate\Support\Str;

$replaced = Str::replaceLast('the', 'a', 'the quick brown fox jumps over the lazy dog');

// the quick brown fox jumps over a lazy dog
```

<a name="method-str-replace-matches"></a>
#### `Str::replaceMatches()` {.collection-method}

`Str::replaceMatches` 方法使用给定的替换字符串替换字符串中匹配模式的所有部分：

```php
use Illuminate\Support\Str;

$replaced = Str::replaceMatches(
    pattern: '/[^A-Za-z0-9]++/',
    replace: '',
    subject: '(+1) 501-555-1000'
)

// '15015551000'
```

`replaceMatches` 方法也接受一个闭包，该闭包将使用字符串中匹配给定模式的每个部分调用，允许你在闭包内执行替换逻辑并返回替换后的值：

```php
use Illuminate\Support\Str;

$replaced = Str::replaceMatches('/\d/', function (array $matches) {
    return '['.$matches[0].']';
}, '123');

// '[1][2][3]'
```

<a name="method-str-replace-start"></a>
#### `Str::replaceStart()` {.collection-method}

`Str::replaceStart` 方法仅在给定值出现在字符串开头时才替换该值的第一次出现：

```php
use Illuminate\Support\Str;

$replaced = Str::replaceStart('Hello', 'Laravel', 'Hello World');

// Laravel World

$replaced = Str::replaceStart('World', 'Laravel', 'Hello World');

// Hello World
```

<a name="method-str-replace-end"></a>
#### `Str::replaceEnd()` {.collection-method}

`Str::replaceEnd` 方法仅在给定值出现在字符串末尾时才替换该值的最后一次出现：

```php
use Illuminate\Support\Str;

$replaced = Str::replaceEnd('World', 'Laravel', 'Hello World');

// Hello Laravel

$replaced = Str::replaceEnd('Hello', 'Laravel', 'Hello World');

// Hello World
```

<a name="method-str-reverse"></a>
#### `Str::reverse()` {.collection-method}

`Str::reverse` 方法反转给定的字符串：

```php
use Illuminate\Support\Str;

$reversed = Str::reverse('Hello World');

// dlroW olleH
```

<a name="method-str-singular"></a>
#### `Str::singular()` {.collection-method}

`Str::singular` 方法将字符串转换为其单数形式。此函数支持 [Laravel 复数化器支持的任何语言](/docs/{{version}}/localization#pluralization-language)：

```php
use Illuminate\Support\Str;

$singular = Str::singular('cars');

// car

$singular = Str::singular('children');

// child
```

<a name="method-str-slug"></a>
#### `Str::slug()` {.collection-method}

`Str::slug` 方法从给定的字符串生成一个 URL 友好的"别名"：

```php
use Illuminate\Support\Str;

$slug = Str::slug('Laravel 5 Framework', '-');

// laravel-5-framework
```

<a name="method-snake-case"></a>
#### `Str::snake()` {.collection-method}

`Str::snake` 方法将给定的字符串转换为 `snake_case`：

```php
use Illuminate\Support\Str;

$converted = Str::snake('fooBar');

// foo_bar

$converted = Str::snake('fooBar', '-');

// foo-bar
```

<a name="method-str-squish"></a>
#### `Str::squish()` {.collection-method}

`Str::squish` 方法移除字符串中所有多余的空白，包括单词之间多余的空白：

```php
use Illuminate\Support\Str;

$string = Str::squish('    laravel    framework    ');

// laravel framework
```

<a name="method-str-start"></a>
#### `Str::start()` {.collection-method}

`Str::start` 方法在字符串开头添加给定值的单个实例（如果字符串尚未以该值开头）：

```php
use Illuminate\Support\Str;

$adjusted = Str::start('this/string', '/');

// /this/string

$adjusted = Str::start('/this/string', '/');

// /this/string
```

<a name="method-starts-with"></a>
#### `Str::startsWith()` {.collection-method}

`Str::startsWith` 方法确定给定的字符串是否以给定的值开头：

```php
use Illuminate\Support\Str;

$result = Str::startsWith('这是我的名字', '这是');

// true
```

如果传递了一个可能值的数组，`startsWith` 方法将在字符串以任何给定值开头时返回 `true`：

```php
$result = Str::startsWith('这是我的名字', ['这是', 'That', 'There']);

// true
```

<a name="method-studly-case"></a>
#### `Str::studly()` {.collection-method}

`Str::studly` 方法将给定的字符串转换为 `StudlyCase`：

```php
use Illuminate\Support\Str;

$converted = Str::studly('foo_bar');

// FooBar
```

<a name="method-str-substr"></a>
#### `Str::substr()` {.collection-method}

`Str::substr` 方法返回由 start 和 length 参数指定的字符串部分：

```php
use Illuminate\Support\Str;

$converted = Str::substr('The Laravel Framework', 4, 7);

// Laravel
```

<a name="method-str-substrcount"></a>
#### `Str::substrCount()` {.collection-method}

`Str::substrCount` 方法返回给定值在给定字符串中出现的次数：

```php
use Illuminate\Support\Str;

$count = Str::substrCount('如果你喜欢冰淇淋，你会喜欢雪糕。', '喜欢');

// 2
```

<a name="method-str-substrreplace"></a>
#### `Str::substrReplace()` {.collection-method}

`Str::substrReplace` 方法替换字符串部分内的文本，从第三个参数指定的位置开始，替换第四个参数指定的字符数。向方法的第四个参数传递 `0` 将在指定位置插入字符串而不替换字符串中的任何现有字符：

```php
use Illuminate\Support\Str;

$result = Str::substrReplace('1300', ':', 2);
// 13:

$result = Str::substrReplace('1300', ':', 2, 0);
// 13:00
```

<a name="method-str-swap"></a>
#### `Str::swap()` {.collection-method}

`Str::swap` 方法使用 PHP 的 `strtr` 函数替换给定字符串中的多个值：

```php
use Illuminate\Support\Str;

$string = Str::swap([
    'Tacos' => 'Burritos',
    'great' => 'fantastic',
], 'Tacos are great!');

// Burritos are fantastic!
```

<a name="method-take"></a>
#### `Str::take()` {.collection-method}

`Str::take` 方法返回字符串开头指定数量的字符：

```php
use Illuminate\Support\Str;

$taken = Str::take('Build something amazing!', 5);

// Build
```

<a name="method-title-case"></a>
#### `Str::title()` {.collection-method}

`Str::title` 方法将给定的字符串转换为 `Title Case`（标题大小写）：

```php
use Illuminate\Support\Str;

$converted = Str::title('a nice title uses the correct case');

// A Nice Title Uses The Correct Case
```

<a name="method-str-to-base64"></a>
#### `Str::toBase64()` {.collection-method}

`Str::toBase64` 方法将给定的字符串转换为 Base64：

```php
use Illuminate\Support\Str;

$base64 = Str::toBase64('Laravel');

// TGFyYXZlbA==
```

<a name="method-str-transliterate"></a>
#### `Str::transliterate()` {.collection-method}

`Str::transliterate` 方法将尝试将给定的字符串转换为其最接近的 ASCII 表示形式：

```php
use Illuminate\Support\Str;

$email = Str::transliterate('ⓣⓔⓢⓣ@ⓛⓐⓡⓐⓥⓔⓛ.ⓒⓞⓜ');

// 'test@laravel.com'
```

<a name="method-str-trim"></a>
#### `Str::trim()` {.collection-method}

`Str::trim` 方法从给定字符串的开头和结尾去除空白（或其他字符）。与 PHP 的原生 `trim` 函数不同，`Str::trim` 方法也会删除 Unicode 空白字符：

```php
use Illuminate\Support\Str;

$string = Str::trim(' foo bar ');

// 'foo bar'
```

<a name="method-str-ltrim"></a>
#### `Str::ltrim()` {.collection-method}

`Str::ltrim` 方法从给定字符串的开头去除空白（或其他字符）。与 PHP 的原生 `ltrim` 函数不同，`Str::ltrim` 方法也会删除 Unicode 空白字符：

```php
use Illuminate\Support\Str;

$string = Str::ltrim('  foo bar  ');

// 'foo bar  '
```

<a name="method-str-rtrim"></a>
#### `Str::rtrim()` {.collection-method}

`Str::rtrim` 方法从给定字符串的结尾去除空白（或其他字符）。与 PHP 的原生 `rtrim` 函数不同，`Str::rtrim` 方法也会删除 Unicode 空白字符：

```php
use Illuminate\Support\Str;

$string = Str::rtrim('  foo bar  ');

// '  foo bar'
```

<a name="method-str-ucfirst"></a>
#### `Str::ucfirst()` {.collection-method}

`Str::ucfirst` 方法返回给定字符串，并将第一个字符大写：

```php
use Illuminate\Support\Str;

$string = Str::ucfirst('foo bar');

// Foo bar
```

<a name="method-str-ucsplit"></a>
#### `Str::ucsplit()` {.collection-method}

`Str::ucsplit` 方法通过大写字符将给定的字符串拆分为数组：

```php
use Illuminate\Support\Str;

$segments = Str::ucsplit('FooBar');

// [0 => 'Foo', 1 => 'Bar']
```

<a name="method-str-ucwords"></a>
#### `Str::ucwords()` {.collection-method}

`Str::ucwords` 方法将给定字符串中每个单词的第一个字符转换为大写：

```php
use Illuminate\Support\Str;

$string = Str::ucwords('laravel framework');

// Laravel Framework
```

<a name="method-str-upper"></a>
#### `Str::upper()` {.collection-method}

`Str::upper` 方法将给定的字符串转换为大写：

```php
use Illuminate\Support\Str;

$string = Str::upper('laravel');

// LARAVEL
```

<a name="method-str-ulid"></a>
#### `Str::ulid()` {.collection-method}

`Str::ulid` 方法生成一个 ULID，它是一个紧凑的、按时间排序的唯一标识符：

```php
use Illuminate\Support\Str;

return (string) Str::ulid();

// 01gd6r360bp37zj17nxb55yv40
```

如果你希望获取表示给定 ULID 创建日期和时间的 `Illuminate\Support\Carbon` 日期实例，可以使用 Laravel 的 Carbon 集成提供的 `createFromId` 方法：

```php
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

$date = Carbon::createFromId((string) Str::ulid());
```

在测试期间，"伪造"`Str::ulid` 方法返回的值可能很有用。为此，你可以使用 `createUlidsUsing` 方法：

```php
use Symfony\Component\Uid\Ulid;

Str::createUlidsUsing(function () {
    return new Ulid('01HRDBNHHCKNW2AK4Z29SN82T9');
});
```

要指示 `ulid` 方法恢复正常生成 ULID，你可以调用 `createUlidsNormally` 方法：

```php
Str::createUlidsNormally();
```

<a name="method-str-unwrap"></a>
#### `Str::unwrap()` {.collection-method}

`Str::unwrap` 方法从给定字符串的开头和结尾移除指定的字符串：

```php
use Illuminate\Support\Str;

Str::unwrap('-Laravel-', '-');

// Laravel

Str::unwrap('{framework: "Laravel"}', '{', '}');

// framework: "Laravel"
```

<a name="method-str-uuid"></a>
#### `Str::uuid()` {.collection-method}

`Str::uuid` 方法生成一个 UUID（版本 4）：

```php
use Illuminate\Support\Str;

return (string) Str::uuid();
```

在测试期间，"伪造"`Str::uuid` 方法返回的值可能很有用。为此，你可以使用 `createUuidsUsing` 方法：

```php
use Ramsey\Uuid\Uuid;

Str::createUuidsUsing(function () {
    return Uuid::fromString('eadbfeac-5258-45c2-bab7-ccb9b5ef74f9');
});
```

要指示 `uuid` 方法恢复正常生成 UUID，你可以调用 `createUuidsNormally` 方法：

```php
Str::createUuidsNormally();
```

<a name="method-str-uuid7"></a>
#### `Str::uuid7()` {.collection-method}

`Str::uuid7` 方法生成一个 UUID（版本 7）：

```php
use Illuminate\Support\Str;

return (string) Str::uuid7();
```

可以传递一个 `DateTimeInterface` 作为可选参数，用于生成有序 UUID：

```php
return (string) Str::uuid7(time: now());
```

<a name="method-str-word-count"></a>
#### `Str::wordCount()` {.collection-method}

`Str::wordCount` 方法返回字符串中包含的单词数：

```php
use Illuminate\Support\Str;

Str::wordCount('Hello, world!'); // 2
```

<a name="method-str-word-wrap"></a>
#### `Str::wordWrap()` {.collection-method}

`Str::wordWrap` 方法将字符串换行到给定数量的字符：

```php
use Illuminate\Support\Str;

$text = "The quick brown fox jumped over the lazy dog."

Str::wordWrap($text, characters: 20, break: "<br />\n");

/*
The quick brown fox<br />
jumped over the lazy<br />
dog.
*/
```

<a name="method-str-words"></a>
#### `Str::words()` {.collection-method}

`Str::words` 方法限制字符串中的单词数。可以通过其第三个参数向此方法传递一个额外的字符串，以指定应附加到截断字符串末尾的字符串：

```php
use Illuminate\Support\Str;

return Str::words('Perfectly balanced, as all things should be.', 3, ' >>>');

// Perfectly balanced, as >>>
```

<a name="method-str-wrap"></a>
#### `Str::wrap()` {.collection-method}

`Str::wrap` 方法使用额外的字符串或字符串对包装给定的字符串：

```php
use Illuminate\Support\Str;

Str::wrap('Laravel', '"');

// "Laravel"

Str::wrap('is', before: 'This ', after: ' Laravel!');

// This is Laravel!
```

<a name="method-str"></a>
#### `str()` {.collection-method}

`str` 函数返回给定字符串的新 `Illuminate\Support\Stringable` 实例。此函数等同于 `Str::of` 方法：

```php
$string = str('Taylor')->append(' Otwell');

// 'Taylor Otwell'
```

如果未向 `str` 函数提供参数，则该函数返回 `Illuminate\Support\Str` 的一个实例：

```php
$snake = str()->snake('FooBar');
```

<a name="method-trans"></a>
#### `trans()` {.collection-method}

`trans` 函数使用你的[语言文件](/docs/{{version}}/localization)翻译给定的翻译键：

```php
echo trans('messages.welcome');
```

如果指定的翻译键不存在，`trans` 函数将返回给定的键。因此，使用上面的示例，如果翻译键不存在，`trans` 函数将返回 `messages.welcome`。

<a name="method-trans-choice"></a>
#### `trans_choice()` {.collection-method}

`trans_choice` 函数翻译给定的翻译键并带屈折变化：

```php
echo trans_choice('messages.notifications', $unreadCount);
```

如果指定的翻译键不存在，`trans_choice` 函数将返回给定的键。因此，使用上面的示例，如果翻译键不存在，`trans_choice` 函数将返回 `messages.notifications`。

<a name="fluent-strings"></a>
## 流式字符串

流式字符串提供了更流畅的面向对象接口来处理字符串值，允许你使用比传统字符串操作更易读的语法将多个字符串操作链接在一起。

<a name="method-fluent-str-after"></a>
#### `after` {.collection-method}

`after` 方法返回字符串中给定值之后的所有内容。如果值不存在于字符串中，将返回整个字符串：

```php
use Illuminate\Support\Str;

$slice = Str::of('这是我的名字')->after('这是');

// ' 我的名字'
```

<a name="method-fluent-str-after-last"></a>
#### `afterLast` {.collection-method}

`afterLast` 方法返回字符串中给定值的最后一次出现之后的所有内容。如果值不存在于字符串中，将返回整个字符串：

```php
use Illuminate\Support\Str;

$slice = Str::of('App\Http\Controllers\Controller')->afterLast('\\');

// 'Controller'
```

<a name="method-fluent-str-apa"></a>
#### `apa` {.collection-method}

`apa` 方法根据 [APA 指南](https://apastyle.apa.org/style-grammar-guidelines/capitalization/title-case)将给定的字符串转换为标题大小写：

```php
use Illuminate\Support\Str;

$converted = Str::of('a nice title uses the correct case')->apa();

// A Nice Title Uses the Correct Case
```

<a name="method-fluent-str-append"></a>
#### `append` {.collection-method}

`append` 方法将给定的值附加到字符串：

```php
use Illuminate\Support\Str;

$string = Str::of('Taylor')->append(' Otwell');

// 'Taylor Otwell'
```

<a name="method-fluent-str-ascii"></a>
#### `ascii` {.collection-method}

`ascii` 方法将尝试将字符串音译为 ASCII 值：

```php
use Illuminate\Support\Str;

$string = Str::of('ü')->ascii();

// 'u'
```

<a name="method-fluent-str-basename"></a>
#### `basename` {.collection-method}

`basename` 方法将返回给定字符串的尾部名称组件：

```php
use Illuminate\Support\Str;

$string = Str::of('/foo/bar/baz')->basename();

// 'baz'
```

如果需要，你可以提供一个将从尾部组件中移除的"扩展名"：

```php
use Illuminate\Support\Str;

$string = Str::of('/foo/bar/baz.jpg')->basename('.jpg');

// 'baz'
```

<a name="method-fluent-str-before"></a>
#### `before` {.collection-method}

`before` 方法返回字符串中给定值之前的所有内容：

```php
use Illuminate\Support\Str;

$slice = Str::of('这是我的名字')->before('我的名字');

// '这是'
```

<a name="method-fluent-str-before-last"></a>
#### `beforeLast` {.collection-method}

`beforeLast` 方法返回字符串中给定值的最后一次出现之前的所有内容：

```php
use Illuminate\Support\Str;

$slice = Str::of('这是我的名字')->beforeLast('是');

// '这'
```

<a name="method-fluent-str-between"></a>
#### `between` {.collection-method}

`between` 方法返回字符串中两个值之间的部分：

```php
use Illuminate\Support\Str;

$converted = Str::of('这是我的名字')->between('这', '名字');

// '是我的'
```

<a name="method-fluent-str-between-first"></a>
#### `betweenFirst` {.collection-method}

`betweenFirst` 方法返回字符串中两个值之间尽可能小的部分：

```php
use Illuminate\Support\Str;

$converted = Str::of('[a] bc [d]')->betweenFirst('[', ']');

// 'a'
```

<a name="method-fluent-str-camel"></a>
#### `camel` {.collection-method}

`camel` 方法将给定的字符串转换为 `camelCase`：

```php
use Illuminate\Support\Str;

$converted = Str::of('foo_bar')->camel();

// 'fooBar'
```

<a name="method-fluent-str-char-at"></a>
#### `charAt` {.collection-method}

`charAt` 方法返回指定索引处的字符。如果索引超出范围，则返回 `false`：

```php
use Illuminate\Support\Str;

$character = Str::of('这是我的名字。')->charAt(6);

// 's'
```

<a name="method-fluent-str-class-basename"></a>
#### `classBasename` {.collection-method}

`classBasename` 方法返回给定类的类名，并移除类的命名空间：

```php
use Illuminate\Support\Str;

$class = Str::of('Foo\Bar\Baz')->classBasename();

// 'Baz'
```

<a name="method-fluent-str-chop-start"></a>
#### `chopStart` {.collection-method}

`chopStart` 方法仅在给定值出现在字符串开头时移除该值的第一次出现：

```php
use Illuminate\Support\Str;

$url = Str::of('https://laravel.com')->chopStart('https://');

// 'laravel.com'
```

你也可以传递一个数组。如果字符串以数组中的任何值开头，则该值将从字符串中移除：

```php
use Illuminate\Support\Str;

$url = Str::of('http://laravel.com')->chopStart(['https://', 'http://']);

// 'laravel.com'
```

<a name="method-fluent-str-chop-end"></a>
#### `chopEnd` {.collection-method}

`chopEnd` 方法仅在给定值出现在字符串末尾时移除该值的最后一次出现：

```php
use Illuminate\Support\Str;

$url = Str::of('https://laravel.com')->chopEnd('.com');

// 'https://laravel'
```

你也可以传递一个数组。如果字符串以数组中的任何值结尾，则该值将从字符串中移除：

```php
use Illuminate\Support\Str;

$url = Str::of('http://laravel.com')->chopEnd(['.com', '.io']);

// 'http://laravel'
```

<a name="method-fluent-str-contains"></a>
#### `contains` {.collection-method}

`contains` 方法确定给定的字符串是否包含给定的值。默认情况下，此方法区分大小写：

```php
use Illuminate\Support\Str;

$contains = Str::of('这是我的名字')->contains('我的');

// true
```

你也可以传递一个值数组来确定给定的字符串是否包含数组中的任何值：

```php
use Illuminate\Support\Str;

$contains = Str::of('这是我的名字')->contains(['我的', 'foo']);

// true
```

你可以通过将 `ignoreCase` 参数设置为 `true` 来禁用大小写敏感：

```php
use Illuminate\Support\Str;

$contains = Str::of('这是我的名字')->contains('我的', ignoreCase: true);

// true
```

<a name="method-fluent-str-contains-all"></a>
#### `containsAll` {.collection-method}

`containsAll` 方法确定给定的字符串是否包含给定数组中的所有值：

```php
use Illuminate\Support\Str;

$containsAll = Str::of('这是我的名字')->containsAll(['我的', '名字']);

// true
```

你可以通过将 `ignoreCase` 参数设置为 `true` 来禁用大小写敏感：

```php
use Illuminate\Support\Str;

$containsAll = Str::of('这是我的名字')->containsAll(['我的', '名字'], ignoreCase: true);

// true
```

<a name="method-fluent-str-decrypt"></a>
#### `decrypt` {.collection-method}

`decrypt` 方法[解密](/docs/{{version}}/encryption)加密的字符串：

```php
use Illuminate\Support\Str;

$decrypted = $encrypted->decrypt();

// 'secret'
```

关于 `decrypt` 的反操作，请参见 [encrypt](#method-fluent-str-encrypt) 方法。

<a name="method-fluent-str-deduplicate"></a>
#### `deduplicate` {.collection-method}

`deduplicate` 方法将字符串中连续出现的字符替换为该字符的单个实例。默认情况下，该方法对空格进行去重：

```php
use Illuminate\Support\Str;

$result = Str::of('The   Laravel   Framework')->deduplicate();

// The Laravel Framework
```

你可以通过将不同字符作为第二个参数传递给该方法来指定要去重的字符：

```php
use Illuminate\Support\Str;

$result = Str::of('The---Laravel---Framework')->deduplicate('-');

// The-Laravel-Framework
```

<a name="method-fluent-str-dirname"></a>
#### `dirname` {.collection-method}

`dirname` 方法返回给定字符串的父目录部分：

```php
use Illuminate\Support\Str;

$string = Str::of('/foo/bar/baz')->dirname();

// '/foo/bar'
```

如果需要，你可以指定要从字符串中修剪的目录级别数：

```php
use Illuminate\Support\Str;

$string = Str::of('/foo/bar/baz')->dirname(2);

// '/foo'
```

<a name="method-fluent-str-doesnt-contain"></a>
#### `doesntContain()` {.collection-method}

`doesntContain` 方法确定给定的字符串是否不包含给定的值。此方法是 [contains](#method-fluent-str-contains) 方法的反操作。默认情况下，此方法区分大小写：

```php
use Illuminate\Support\Str;

$doesntContain = Str::of('这是名字')->doesntContain('我的');

// true
```

你也可以传递一个值数组来确定给定的字符串是否不包含数组中的任何值：

```php
use Illuminate\Support\Str;

$doesntContain = Str::of('这是名字')->doesntContain(['我的', '框架']);

// true
```

你可以通过将 `ignoreCase` 参数设置为 `true` 来禁用大小写敏感：

```php
use Illuminate\Support\Str;

$doesntContain = Str::of('这是我的名字')->doesntContain('我的', ignoreCase: true);

// false
```

<a name="method-fluent-str-doesnt-end-with"></a>
#### `doesntEndWith` {.collection-method}

`doesntEndWith` 方法确定给定的字符串是否不以给定的值结尾：

```php
use Illuminate\Support\Str;

$result = Str::of('这是我的名字')->doesntEndWith('dog');

// true
```

你也可以传递一个值数组来确定给定的字符串是否不以数组中的任何值结尾：

```php
use Illuminate\Support\Str;

$result = Str::of('这是我的名字')->doesntEndWith(['this', 'foo']);

// true

$result = Str::of('这是我的名字')->doesntEndWith(['name', 'foo']);

// false
```

<a name="method-fluent-str-doesnt-start-with"></a>
#### `doesntStartWith` {.collection-method}

`doesntStartWith` 方法确定给定的字符串是否不以给定的值开头：

```php
use Illuminate\Support\Str;

$result = Str::of('这是我的名字')->doesntStartWith('That');

// true
```

你也可以传递一个值数组来确定给定的字符串是否不以数组中的任何值开头：

```php
use Illuminate\Support\Str;

$result = Str::of('这是我的名字')->doesntStartWith(['What', 'That', 'There']);

// true
```

<a name="method-fluent-str-encrypt"></a>
#### `encrypt` {.collection-method}

`encrypt` 方法[加密](/docs/{{version}}/encryption)字符串：

```php
use Illuminate\Support\Str;

$encrypted = Str::of('secret')->encrypt();
```

关于 `encrypt` 的反操作，请参见 [decrypt](#method-fluent-str-decrypt) 方法。

<a name="method-fluent-str-ends-with"></a>
#### `endsWith` {.collection-method}

`endsWith` 方法确定给定的字符串是否以给定的值结尾：

```php
use Illuminate\Support\Str;

$result = Str::of('这是我的名字')->endsWith('name');

// true
```

你也可以传递一个值数组来确定给定的字符串是否以数组中的任何值结尾：

```php
use Illuminate\Support\Str;

$result = Str::of('这是我的名字')->endsWith(['name', 'foo']);

// true

$result = Str::of('这是我的名字')->endsWith(['this', 'foo']);

// false
```

<a name="method-fluent-str-exactly"></a>
#### `exactly` {.collection-method}

`exactly` 方法确定给定的字符串是否与另一个字符串完全匹配：

```php
use Illuminate\Support\Str;

$result = Str::of('Laravel')->exactly('Laravel');

// true
```

<a name="method-fluent-str-excerpt"></a>
#### `excerpt` {.collection-method}

`excerpt` 方法从字符串中提取与短语的第一次实例匹配的摘录：

```php
use Illuminate\Support\Str;

$excerpt = Str::of('这是我的名字')->excerpt('我的', [
    'radius' => 3
]);

// '...是我的名...'
```

`radius` 选项默认为 `100`，允许你定义在截断字符串的每一侧应出现的字符数。

此外，你可以使用 `omission` 选项来更改将前置和附加到截断字符串的字符串：

```php
use Illuminate\Support\Str;

$excerpt = Str::of('这是我的名字')->excerpt('名字', [
    'radius' => 3,
    'omission' => '(...) '
]);

// '(...) 我的名字'
```

<a name="method-fluent-str-explode"></a>
#### `explode` {.collection-method}

`explode` 方法按给定的分隔符拆分字符串，并返回包含拆分字符串的每个部分的集合：

```php
use Illuminate\Support\Str;

$collection = Str::of('foo bar baz')->explode(' ');

// collect(['foo', 'bar', 'baz'])
```

<a name="method-fluent-str-finish"></a>
#### `finish` {.collection-method}

`finish` 方法在字符串末尾添加给定值的单个实例（如果字符串尚未以该值结尾）：

```php
use Illuminate\Support\Str;

$adjusted = Str::of('this/string')->finish('/');

// this/string/

$adjusted = Str::of('this/string/')->finish('/');

// this/string/
```

<a name="method-fluent-str-from-base64"></a>
#### `fromBase64` {.collection-method}

`fromBase64` 方法解码给定的 Base64 字符串：

```php
use Illuminate\Support\Str;

$decoded = Str::of('TGFyYXZlbA==')->fromBase64();

// Laravel
```

<a name="method-fluent-str-hash"></a>
#### `hash` {.collection-method}

`hash` 方法使用给定的[算法](https://www.php.net/manual/en/function.hash-algos.php)对字符串进行哈希处理：

```php
use Illuminate\Support\Str;

$hashed = Str::of('secret')->hash(algorithm: 'sha256');

// '2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b'
```

<a name="method-fluent-str-headline"></a>
#### `headline` {.collection-method}

`headline` 方法将使用大小写、连字符或下划线分隔的字符串转换为空格分隔的字符串，每个单词的首字母大写：

```php
use Illuminate\Support\Str;

$headline = Str::of('taylor_otwell')->headline();

// Taylor Otwell

$headline = Str::of('EmailNotificationSent')->headline();

// Email Notification Sent
```

<a name="method-fluent-str-initials"></a>
#### `initials` {.collection-method}

`initials` 方法将字符串转换为其首字母：

```php
use Illuminate\Support\Str;

$initials = Str::of('Taylor Otwell')->initials()->upper();

// TO
```

<a name="method-fluent-str-inline-markdown"></a>
#### `inlineMarkdown` {.collection-method}

`inlineMarkdown` 方法使用 [CommonMark](https://commonmark.thephpleague.com/) 将 GitHub 风格的 Markdown 转换为内联 HTML。但是，与 `markdown` 方法不同，它不会将所有生成的 HTML 包装在块级元素中：

```php
use Illuminate\Support\Str;

$html = Str::of('**Laravel**')->inlineMarkdown();

// <strong>Laravel</strong>
```

#### Markdown 安全性

默认情况下，Markdown 支持原始 HTML，当与原始用户输入一起使用时，这将暴露跨站脚本（XSS）漏洞。根据 [CommonMark 安全文档](https://commonmark.thephpleague.com/security/)，你可以使用 `html_input` 选项来转义或剥离原始 HTML，并使用 `allow_unsafe_links` 选项来指定是否允许不安全的链接。如果你需要允许某些原始 HTML，应将编译后的 Markdown 传递给 HTML 净化器：

```php
use Illuminate\Support\Str;

Str::of('注入: <script>alert("Hello XSS!");</script>')->inlineMarkdown([
    'html_input' => 'strip',
    'allow_unsafe_links' => false,
]);

// 注入: alert(&quot;Hello XSS!&quot;);
```

<a name="method-fluent-str-is"></a>
#### `is` {.collection-method}

`is` 方法确定给定的字符串是否与给定的模式匹配。星号可用作通配符值：

```php
use Illuminate\Support\Str;

$matches = Str::of('foobar')->is('foo*');

// true

$matches = Str::of('foobar')->is('baz*');

// false
```

<a name="method-fluent-str-is-ascii"></a>
#### `isAscii` {.collection-method}

`isAscii` 方法确定给定的字符串是否为 ASCII 字符串：

```php
use Illuminate\Support\Str;

$result = Str::of('Taylor')->isAscii();

// true

$result = Str::of('ü')->isAscii();

// false
```

<a name="method-fluent-str-is-empty"></a>
#### `isEmpty` {.collection-method}

`isEmpty` 方法确定给定的字符串是否为空：

```php
use Illuminate\Support\Str;

$result = Str::of('  ')->trim()->isEmpty();

// true

$result = Str::of('Laravel')->trim()->isEmpty();

// false
```

<a name="method-fluent-str-is-not-empty"></a>
#### `isNotEmpty` {.collection-method}

`isNotEmpty` 方法确定给定的字符串是否不为空：

```php
use Illuminate\Support\Str;

$result = Str::of('  ')->trim()->isNotEmpty();

// false

$result = Str::of('Laravel')->trim()->isNotEmpty();

// true
```

<a name="method-fluent-str-is-json"></a>
#### `isJson` {.collection-method}

`isJson` 方法确定给定的字符串是否为有效的 JSON：

```php
use Illuminate\Support\Str;

$result = Str::of('[1,2,3]')->isJson();

// true

$result = Str::of('{"first": "John", "last": "Doe"}')->isJson();

// true

$result = Str::of('{first: "John", last: "Doe"}')->isJson();

// false
```

<a name="method-fluent-str-is-ulid"></a>
#### `isUlid` {.collection-method}

`isUlid` 方法确定给定的字符串是否为 ULID：

```php
use Illuminate\Support\Str;

$result = Str::of('01gd6r360bp37zj17nxb55yv40')->isUlid();

// true

$result = Str::of('Taylor')->isUlid();

// false
```

<a name="method-fluent-str-is-url"></a>
#### `isUrl` {.collection-method}

`isUrl` 方法确定给定的字符串是否为 URL：

```php
use Illuminate\Support\Str;

$result = Str::of('http://example.com')->isUrl();

// true

$result = Str::of('Taylor')->isUrl();

// false
```

`isUrl` 方法将广泛的协议视为有效。但是，你可以通过向 `isUrl` 方法提供协议来指定哪些协议应被视为有效：

```php
$result = Str::of('http://example.com')->isUrl(['http', 'https']);
```

<a name="method-fluent-str-is-uuid"></a>
#### `isUuid` {.collection-method}

`isUuid` 方法确定给定的字符串是否为 UUID：

```php
use Illuminate\Support\Str;

$result = Str::of('5ace9ab9-e9cf-4ec6-a19d-5881212a452c')->isUuid();

// true

$result = Str::of('Taylor')->isUuid();

// false
```

你还可以验证给定的 UUID 是否按版本（1、3、4、5、6、7 或 8）匹配 UUID 规范：

```php
use Illuminate\Support\Str;

$isUuid = Str::of('a0a2a2d2-0b87-4a18-83f2-2529882be2de')->isUuid(version: 4);

// true

$isUuid = Str::of('a0a2a2d2-0b87-4a18-83f2-2529882be2de')->isUuid(version: 1);

// false
```

<a name="method-fluent-str-kebab"></a>
#### `kebab` {.collection-method}

`kebab` 方法将给定的字符串转换为 `kebab-case`：

```php
use Illuminate\Support\Str;

$converted = Str::of('fooBar')->kebab();

// foo-bar
```

<a name="method-fluent-str-lcfirst"></a>
#### `lcfirst` {.collection-method}

`lcfirst` 方法返回给定字符串，并将第一个字符转换为小写：

```php
use Illuminate\Support\Str;

$string = Str::of('Foo Bar')->lcfirst();

// foo Bar
```

<a name="method-fluent-str-length"></a>
#### `length` {.collection-method}

`length` 方法返回给定字符串的长度：

```php
use Illuminate\Support\Str;

$length = Str::of('Laravel')->length();

// 7
```

<a name="method-fluent-str-limit"></a>
#### `limit` {.collection-method}

`limit` 方法将给定的字符串截断到指定的长度：

```php
use Illuminate\Support\Str;

$truncated = Str::of('敏捷的棕色狐狸跳过了懒狗')->limit(20);

// 敏捷的棕色狐狸跳过了懒...
```

你也可以传递第二个参数来更改将附加到截断字符串末尾的字符串：

```php
$truncated = Str::of('敏捷的棕色狐狸跳过了懒狗')->limit(20, ' (...)');

// 敏捷的棕色狐狸跳过了懒 (...)
```

如果你希望在截断字符串时保留完整的单词，可以使用 `preserveWords` 参数。当此参数为 `true` 时，字符串将被截断到最近的完整单词边界：

```php
$truncated = Str::of('敏捷的棕色狐狸')->limit(12, preserveWords: true);

// 敏捷的棕...
```

<a name="method-fluent-str-lower"></a>
#### `lower` {.collection-method}

`lower` 方法将给定的字符串转换为小写：

```php
use Illuminate\Support\Str;

$result = Str::of('LARAVEL')->lower();

// 'laravel'
```

<a name="method-fluent-str-markdown"></a>
#### `markdown` {.collection-method}

`markdown` 方法将 GitHub 风格的 Markdown 转换为 HTML：

```php
use Illuminate\Support\Str;

$html = Str::of('# Laravel')->markdown();

// <h1>Laravel</h1>

$html = Str::of('# Taylor <b>Otwell</b>')->markdown([
    'html_input' => 'strip',
]);

// <h1>Taylor Otwell</h1>
```

#### Markdown 安全性

默认情况下，Markdown 支持原始 HTML，当与原始用户输入一起使用时，这将暴露跨站脚本（XSS）漏洞。根据 [CommonMark 安全文档](https://commonmark.thephpleague.com/security/)，你可以使用 `html_input` 选项来转义或剥离原始 HTML，并使用 `allow_unsafe_links` 选项来指定是否允许不安全的链接。如果你需要允许某些原始 HTML，应将编译后的 Markdown 传递给 HTML 净化器：

```php
use Illuminate\Support\Str;

Str::of('注入: <script>alert("Hello XSS!");</script>')->markdown([
    'html_input' => 'strip',
    'allow_unsafe_links' => false,
]);

// <p>注入: alert(&quot;Hello XSS!&quot;);</p>
```

<a name="method-fluent-str-mask"></a>
#### `mask` {.collection-method}

`mask` 方法使用重复字符掩码字符串的一部分，可用于混淆字符串的片段，如电子邮件地址和电话号码：

```php
use Illuminate\Support\Str;

$string = Str::of('taylor@example.com')->mask('*', 3);

// tay***************
```

如果需要，你可以为 `mask` 方法提供负数作为第三个或第四个参数，这将指示方法从距字符串末尾的给定距离开始掩码：

```php
$string = Str::of('taylor@example.com')->mask('*', -15, 3);

// tay***@example.com

$string = Str::of('taylor@example.com')->mask('*', 4, -4);

// tayl**********.com
```

<a name="method-fluent-str-match"></a>
#### `match` {.collection-method}

`match` 方法将返回与给定正则表达式模式匹配的字符串部分：

```php
use Illuminate\Support\Str;

$result = Str::of('foo bar')->match('/bar/');

// 'bar'

$result = Str::of('foo bar')->match('/foo (.*)/');

// 'bar'
```

<a name="method-fluent-str-match-all"></a>
#### `matchAll` {.collection-method}

`matchAll` 方法将返回一个集合，其中包含与给定正则表达式模式匹配的字符串部分：

```php
use Illuminate\Support\Str;

$result = Str::of('bar foo bar')->matchAll('/bar/');

// collect(['bar', 'bar'])
```

如果你在表达式中指定了一个匹配组，Laravel 将返回第一个匹配组的匹配集合：

```php
use Illuminate\Support\Str;

$result = Str::of('bar fun bar fly')->matchAll('/f(\w*)/');

// collect(['un', 'ly']);
```

如果未找到匹配项，将返回一个空集合。

<a name="method-fluent-str-is-match"></a>
#### `isMatch` {.collection-method}

`isMatch` 方法将在字符串匹配给定的正则表达式时返回 `true`：

```php
use Illuminate\Support\Str;

$result = Str::of('foo bar')->isMatch('/foo (.*)/');

// true

$result = Str::of('laravel')->isMatch('/foo (.*)/');

// false
```

<a name="method-fluent-str-new-line"></a>
#### `newLine` {.collection-method}

`newLine` 方法向字符串追加一个"行尾"字符：

```php
use Illuminate\Support\Str;

$padded = Str::of('Laravel')->newLine()->append('Framework');

// 'Laravel
//  Framework'
```

<a name="method-fluent-str-padboth"></a>
#### `padBoth` {.collection-method}

`padBoth` 方法包装了 PHP 的 `str_pad` 函数，用另一个字符串填充字符串的两侧，直到最终字符串达到所需长度：

```php
use Illuminate\Support\Str;

$padded = Str::of('James')->padBoth(10, '_');

// '__James___'

$padded = Str::of('James')->padBoth(10);

// '  James   '
```

<a name="method-fluent-str-padleft"></a>
#### `padLeft` {.collection-method}

`padLeft` 方法包装了 PHP 的 `str_pad` 函数，用另一个字符串填充字符串的左侧，直到最终字符串达到所需长度：

```php
use Illuminate\Support\Str;

$padded = Str::of('James')->padLeft(10, '-=');

// '-=-=-James'

$padded = Str::of('James')->padLeft(10);

// '     James'
```

<a name="method-fluent-str-padright"></a>
#### `padRight` {.collection-method}

`padRight` 方法包装了 PHP 的 `str_pad` 函数，用另一个字符串填充字符串的右侧，直到最终字符串达到所需长度：

```php
use Illuminate\Support\Str;

$padded = Str::of('James')->padRight(10, '-');

// 'James-----'

$padded = Str::of('James')->padRight(10);

// 'James     '
```

<a name="method-fluent-str-pipe"></a>
#### `pipe` {.collection-method}

`pipe` 方法允许你通过将字符串的当前值传递给给定的可调用对象来转换字符串：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$hash = Str::of('Laravel')->pipe('md5')->prepend('校验和: ');

// '校验和: a5c95b86291ea299fcbe64458ed12702'

$closure = Str::of('foo')->pipe(function (Stringable $str) {
    return 'bar';
});

// 'bar'
```

<a name="method-fluent-str-counted"></a>
#### `counted` {.collection-method}

`counted` 方法根据给定的计数将单数字符串转换为其单数或复数形式，并将结果前缀格式化的计数：

```php
use Illuminate\Support\Str;

$label = Str::of('order')->counted(1);

// 1 order

$label = Str::of('order')->counted(1000);

// 1,000 orders
```

<a name="method-fluent-str-plural"></a>
#### `plural` {.collection-method}

`plural` 方法将单数字符串转换为其复数形式。此函数支持 [Laravel 复数化器支持的任何语言](/docs/{{version}}/localization#pluralization-language)：

```php
use Illuminate\Support\Str;

$plural = Str::of('car')->plural();

// cars

$plural = Str::of('child')->plural();

// children
```

你可以向函数提供整数参数来获取字符串的单数或复数形式：

```php
use Illuminate\Support\Str;

$plural = Str::of('child')->plural(2);

// children

$plural = Str::of('child')->plural(1);

// child
```

你可以提供 `prependCount` 参数以将格式化的 `$count` 前缀到复数化字符串：

```php
use Illuminate\Support\Str;

$label = Str::of('car')->plural(1000, prependCount: true);

// 1,000 cars
```

<a name="method-fluent-str-position"></a>
#### `position` {.collection-method}

`position` 方法返回子字符串在字符串中第一次出现的位置。如果子字符串不存在于字符串中，则返回 `false`：

```php
use Illuminate\Support\Str;

$position = Str::of('Hello, World!')->position('Hello');

// 0

$position = Str::of('Hello, World!')->position('W');

// 7
```

<a name="method-fluent-str-prepend"></a>
#### `prepend` {.collection-method}

`prepend` 方法将给定的值前置到字符串：

```php
use Illuminate\Support\Str;

$string = Str::of('Framework')->prepend('Laravel ');

// Laravel Framework
```

<a name="method-fluent-str-remove"></a>
#### `remove` {.collection-method}

`remove` 方法从字符串中移除给定的值或值数组：

```php
use Illuminate\Support\Str;

$string = Str::of('Arkansas is quite beautiful!')->remove('quite ');

// Arkansas is beautiful!
```

你也可以传递 `false` 作为第二个参数，以在移除字符串时忽略大小写。

<a name="method-fluent-str-repeat"></a>
#### `repeat` {.collection-method}

`repeat` 方法重复给定的字符串：

```php
use Illuminate\Support\Str;

$repeated = Str::of('a')->repeat(5);

// aaaaa
```

<a name="method-fluent-str-replace"></a>
#### `replace` {.collection-method}

`replace` 方法在字符串中替换给定的字符串：

```php
use Illuminate\Support\Str;

$replaced = Str::of('Laravel 6.x')->replace('6.x', '7.x');

// Laravel 7.x
```

`replace` 方法也接受一个 `caseSensitive` 参数。默认情况下，`replace` 方法区分大小写：

```php
$replaced = Str::of('macOS 13.x')->replace(
    'macOS', 'iOS', caseSensitive: false
);
```

<a name="method-fluent-str-replace-array"></a>
#### `replaceArray` {.collection-method}

`replaceArray` 方法使用数组顺序替换字符串中的给定值：

```php
use Illuminate\Support\Str;

$string = '活动将在 ? 和 ? 之间举行';

$replaced = Str::of($string)->replaceArray('?', ['8:30', '9:00']);

// 活动将在 8:30 和 9:00 之间举行
```

<a name="method-fluent-str-replace-first"></a>
#### `replaceFirst` {.collection-method}

`replaceFirst` 方法替换字符串中给定值的第一次出现：

```php
use Illuminate\Support\Str;

$replaced = Str::of('the quick brown fox jumps over the lazy dog')->replaceFirst('the', 'a');

// a quick brown fox jumps over the lazy dog
```

<a name="method-fluent-str-replace-last"></a>
#### `replaceLast` {.collection-method}

`replaceLast` 方法替换字符串中给定值的最后一次出现：

```php
use Illuminate\Support\Str;

$replaced = Str::of('the quick brown fox jumps over the lazy dog')->replaceLast('the', 'a');

// the quick brown fox jumps over a lazy dog
```

<a name="method-fluent-str-replace-matches"></a>
#### `replaceMatches` {.collection-method}

`replaceMatches` 方法使用给定的替换字符串替换字符串中匹配模式的所有部分：

```php
use Illuminate\Support\Str;

$replaced = Str::of('(+1) 501-555-1000')->replaceMatches('/[^A-Za-z0-9]++/', '')

// '15015551000'
```

`replaceMatches` 方法也接受一个闭包，该闭包将使用字符串中匹配给定模式的每个部分调用，允许你在闭包内执行替换逻辑并返回替换后的值：

```php
use Illuminate\Support\Str;

$replaced = Str::of('123')->replaceMatches('/\d/', function (array $matches) {
    return '['.$matches[0].']';
});

// '[1][2][3]'
```

<a name="method-fluent-str-replace-start"></a>
#### `replaceStart` {.collection-method}

`replaceStart` 方法仅在给定值出现在字符串开头时才替换该值的第一次出现：

```php
use Illuminate\Support\Str;

$replaced = Str::of('Hello World')->replaceStart('Hello', 'Laravel');

// Laravel World

$replaced = Str::of('Hello World')->replaceStart('World', 'Laravel');

// Hello World
```

<a name="method-fluent-str-replace-end"></a>
#### `replaceEnd` {.collection-method}

`replaceEnd` 方法仅在给定值出现在字符串末尾时才替换该值的最后一次出现：

```php
use Illuminate\Support\Str;

$replaced = Str::of('Hello World')->replaceEnd('World', 'Laravel');

// Hello Laravel

$replaced = Str::of('Hello World')->replaceEnd('Hello', 'Laravel');

// Hello World
```

<a name="method-fluent-str-scan"></a>
#### `scan` {.collection-method}

`scan` 方法根据 [`sscanf` PHP 函数](https://www.php.net/manual/en/function.sscanf.php)支持的格式将字符串输入解析为集合：

```php
use Illuminate\Support\Str;

$collection = Str::of('filename.jpg')->scan('%[^.].%s');

// collect(['filename', 'jpg'])
```

<a name="method-fluent-str-singular"></a>
#### `singular` {.collection-method}

`singular` 方法将字符串转换为其单数形式。此函数支持 [Laravel 复数化器支持的任何语言](/docs/{{version}}/localization#pluralization-language)：

```php
use Illuminate\Support\Str;

$singular = Str::of('cars')->singular();

// car

$singular = Str::of('children')->singular();

// child
```

<a name="method-fluent-str-slug"></a>
#### `slug` {.collection-method}

`slug` 方法从给定的字符串生成一个 URL 友好的"别名"：

```php
use Illuminate\Support\Str;

$slug = Str::of('Laravel Framework')->slug('-');

// laravel-framework
```

<a name="method-fluent-str-snake"></a>
#### `snake` {.collection-method}

`snake` 方法将给定的字符串转换为 `snake_case`：

```php
use Illuminate\Support\Str;

$converted = Str::of('fooBar')->snake();

// foo_bar
```

<a name="method-fluent-str-split"></a>
#### `split` {.collection-method}

`split` 方法使用正则表达式将字符串拆分为集合：

```php
use Illuminate\Support\Str;

$segments = Str::of('one, two, three')->split('/[\s,]+/');

// collect(["one", "two", "three"])
```

<a name="method-fluent-str-squish"></a>
#### `squish` {.collection-method}

`squish` 方法移除字符串中所有多余的空白，包括单词之间多余的空白：

```php
use Illuminate\Support\Str;

$string = Str::of('    laravel    framework    ')->squish();

// laravel framework
```

<a name="method-fluent-str-start"></a>
#### `start` {.collection-method}

`start` 方法在字符串开头添加给定值的单个实例（如果字符串尚未以该值开头）：

```php
use Illuminate\Support\Str;

$adjusted = Str::of('this/string')->start('/');

// /this/string

$adjusted = Str::of('/this/string')->start('/');

// /this/string
```

<a name="method-fluent-str-starts-with"></a>
#### `startsWith` {.collection-method}

`startsWith` 方法确定给定的字符串是否以给定的值开头：

```php
use Illuminate\Support\Str;

$result = Str::of('这是我的名字')->startsWith('这是');

// true
```

你也可以传递一个值数组来确定给定的字符串是否以数组中的任何值开头：

```php
use Illuminate\Support\Str;

$result = Str::of('这是我的名字')->startsWith(['这是', 'That']);

// true
```

<a name="method-fluent-str-strip-tags"></a>
#### `stripTags` {.collection-method}

`stripTags` 方法从字符串中移除所有 HTML 和 PHP 标签：

```php
use Illuminate\Support\Str;

$result = Str::of('<a href="https://laravel.com">Taylor <b>Otwell</b></a>')->stripTags();

// Taylor Otwell

$result = Str::of('<a href="https://laravel.com">Taylor <b>Otwell</b></a>')->stripTags('<b>');

// Taylor <b>Otwell</b>
```

<a name="method-fluent-str-studly"></a>
#### `studly` {.collection-method}

`studly` 方法将给定的字符串转换为 `StudlyCase`：

```php
use Illuminate\Support\Str;

$converted = Str::of('foo_bar')->studly();

// FooBar
```

<a name="method-fluent-str-substr"></a>
#### `substr` {.collection-method}

`substr` 方法返回由给定的 start 和 length 参数指定的字符串部分：

```php
use Illuminate\Support\Str;

$string = Str::of('Laravel Framework')->substr(8);

// Framework

$string = Str::of('Laravel Framework')->substr(8, 5);

// Frame
```

<a name="method-fluent-str-substrreplace"></a>
#### `substrReplace` {.collection-method}

`substrReplace` 方法替换字符串部分内的文本，从第二个参数指定的位置开始，替换第三个参数指定的字符数。向方法的第三个参数传递 `0` 将在指定位置插入字符串而不替换字符串中的任何现有字符：

```php
use Illuminate\Support\Str;

$string = Str::of('1300')->substrReplace(':', 2);

// 13:

$string = Str::of('The Framework')->substrReplace(' Laravel', 3, 0);

// The Laravel Framework
```

<a name="method-fluent-str-swap"></a>
#### `swap` {.collection-method}

`swap` 方法使用 PHP 的 `strtr` 函数替换字符串中的多个值：

```php
use Illuminate\Support\Str;

$string = Str::of('Tacos are great!')
    ->swap([
        'Tacos' => 'Burritos',
        'great' => 'fantastic',
    ]);

// Burritos are fantastic!
```

<a name="method-fluent-str-take"></a>
#### `take` {.collection-method}

`take` 方法返回字符串开头指定数量的字符：

```php
use Illuminate\Support\Str;

$taken = Str::of('Build something amazing!')->take(5);

// Build
```

<a name="method-fluent-str-tap"></a>
#### `tap` {.collection-method}

`tap` 方法将字符串传递给给定的闭包，允许你检查和操作字符串而不影响字符串本身。无论闭包返回什么，`tap` 方法都将返回原始字符串：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('Laravel')
    ->append(' Framework')
    ->tap(function (Stringable $string) {
        dump('附加后的字符串: '.$string);
    })
    ->upper();

// LARAVEL FRAMEWORK
```

<a name="method-fluent-str-test"></a>
#### `test` {.collection-method}

`test` 方法确定字符串是否与给定的正则表达式模式匹配：

```php
use Illuminate\Support\Str;

$result = Str::of('Laravel Framework')->test('/Laravel/');

// true
```

<a name="method-fluent-str-title"></a>
#### `title` {.collection-method}

`title` 方法将给定的字符串转换为 `Title Case`（标题大小写）：

```php
use Illuminate\Support\Str;

$converted = Str::of('a nice title uses the correct case')->title();

// A Nice Title Uses The Correct Case
```

<a name="method-fluent-str-to-base64"></a>
#### `toBase64` {.collection-method}

`toBase64` 方法将给定的字符串转换为 Base64：

```php
use Illuminate\Support\Str;

$base64 = Str::of('Laravel')->toBase64();

// TGFyYXZlbA==
```

<a name="method-fluent-str-to-html-string"></a>
#### `toHtmlString` {.collection-method}

`toHtmlString` 方法将给定的字符串转换为 `Illuminate\Support\HtmlString` 实例，该实例在 Blade 模板中渲染时不会被转义：

```php
use Illuminate\Support\Str;

$htmlString = Str::of('Nuno Maduro')->toHtmlString();
```

<a name="method-fluent-str-to-uri"></a>
#### `toUri` {.collection-method}

`toUri` 方法将给定的字符串转换为 [Illuminate\Support\Uri](/docs/{{version}}/helpers#uri) 的实例：

```php
use Illuminate\Support\Str;

$uri = Str::of('https://example.com')->toUri();
```

<a name="method-fluent-str-transliterate"></a>
#### `transliterate` {.collection-method}

`transliterate` 方法将尝试将给定的字符串转换为其最接近的 ASCII 表示形式：

```php
use Illuminate\Support\Str;

$email = Str::of('ⓣⓔⓢⓣ@ⓛⓐⓡⓐⓥⓔⓛ.ⓒⓞⓜ')->transliterate()

// 'test@laravel.com'
```

<a name="method-fluent-str-trim"></a>
#### `trim` {.collection-method}

`trim` 方法修剪给定的字符串。与 PHP 的原生 `trim` 函数不同，Laravel 的 `trim` 方法也会删除 Unicode 空白字符：

```php
use Illuminate\Support\Str;

$string = Str::of('  Laravel  ')->trim();

// 'Laravel'

$string = Str::of('/Laravel/')->trim('/');

// 'Laravel'
```

<a name="method-fluent-str-ltrim"></a>
#### `ltrim` {.collection-method}

`ltrim` 方法修剪字符串的左侧。与 PHP 的原生 `ltrim` 函数不同，Laravel 的 `ltrim` 方法也会删除 Unicode 空白字符：

```php
use Illuminate\Support\Str;

$string = Str::of('  Laravel  ')->ltrim();

// 'Laravel  '

$string = Str::of('/Laravel/')->ltrim('/');

// 'Laravel/'
```

<a name="method-fluent-str-rtrim"></a>
#### `rtrim` {.collection-method}

`rtrim` 方法修剪给定字符串的右侧。与 PHP 的原生 `rtrim` 函数不同，Laravel 的 `rtrim` 方法也会删除 Unicode 空白字符：

```php
use Illuminate\Support\Str;

$string = Str::of('  Laravel  ')->rtrim();

// '  Laravel'

$string = Str::of('/Laravel/')->rtrim('/');

// '/Laravel'
```

<a name="method-fluent-str-ucfirst"></a>
#### `ucfirst` {.collection-method}

`ucfirst` 方法返回给定字符串，并将第一个字符大写：

```php
use Illuminate\Support\Str;

$string = Str::of('foo bar')->ucfirst();

// Foo bar
```

<a name="method-fluent-str-ucsplit"></a>
#### `ucsplit` {.collection-method}

`ucsplit` 方法通过大写字符将给定的字符串拆分为集合：

```php
use Illuminate\Support\Str;

$string = Str::of('Foo Bar')->ucsplit();

// collect(['Foo ', 'Bar'])
```

<a name="method-fluent-str-ucwords"></a>
#### `ucwords` {.collection-method}

`ucwords` 方法将给定字符串中每个单词的第一个字符转换为大写：

```php
use Illuminate\Support\Str;

$string = Str::of('laravel framework')->ucwords();

// Laravel Framework
```

<a name="method-fluent-str-unwrap"></a>
#### `unwrap` {.collection-method}

`unwrap` 方法从给定字符串的开头和结尾移除指定的字符串：

```php
use Illuminate\Support\Str;

Str::of('-Laravel-')->unwrap('-');

// Laravel

Str::of('{framework: "Laravel"}')->unwrap('{', '}');

// framework: "Laravel"
```

<a name="method-fluent-str-upper"></a>
#### `upper` {.collection-method}

`upper` 方法将给定的字符串转换为大写：

```php
use Illuminate\Support\Str;

$adjusted = Str::of('laravel')->upper();

// LARAVEL
```

<a name="method-fluent-str-when"></a>
#### `when` {.collection-method}

`when` 方法在给定条件为 `true` 时调用给定的闭包。闭包将接收流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('Taylor')
    ->when(true, function (Stringable $string) {
        return $string->append(' Otwell');
    });

// 'Taylor Otwell'
```

如有必要，你可以向 `when` 方法传递另一个闭包作为第三个参数。如果条件参数评估为 `false`，将执行此闭包。

<a name="method-fluent-str-when-contains"></a>
#### `whenContains` {.collection-method}

`whenContains` 方法在字符串包含给定值时调用给定的闭包。闭包将接收流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('tony stark')
    ->whenContains('tony', function (Stringable $string) {
        return $string->title();
    });

// 'Tony Stark'
```

如有必要，你可以传递另一个闭包作为第三个参数。如果字符串不包含给定值，将调用该闭包。

你也可以传递一个值数组来确定给定的字符串是否包含数组中的任何值：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('tony stark')
    ->whenContains(['tony', 'hulk'], function (Stringable $string) {
        return $string->title();
    });

// Tony Stark
```

<a name="method-fluent-str-when-contains-all"></a>
#### `whenContainsAll` {.collection-method}

`whenContainsAll` 方法在字符串包含所有给定的子字符串时调用给定的闭包。闭包将接收流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('tony stark')
    ->whenContainsAll(['tony', 'stark'], function (Stringable $string) {
        return $string->title();
    });

// 'Tony Stark'
```

如有必要，你可以传递另一个闭包作为第三个参数。如果条件参数评估为 `false`，将执行该闭包。

<a name="method-fluent-str-when-doesnt-end-with"></a>
#### `whenDoesntEndWith` {.collection-method}

`whenDoesntEndWith` 方法在字符串不以给定的子字符串结尾时调用给定的闭包。闭包将接收流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('disney world')->whenDoesntEndWith('land', function (Stringable $string) {
    return $string->title();
});

// 'Disney World'
```

<a name="method-fluent-str-when-doesnt-start-with"></a>
#### `whenDoesntStartWith` {.collection-method}

`whenDoesntStartWith` 方法在字符串不以给定的子字符串开头时调用给定的闭包。闭包将接收流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('disney world')->whenDoesntStartWith('sea', function (Stringable $string) {
    return $string->title();
});

// 'Disney World'
```

<a name="method-fluent-str-when-empty"></a>
#### `whenEmpty` {.collection-method}

`whenEmpty` 方法在字符串为空时调用给定的闭包。如果闭包返回一个值，该值也将在 `whenEmpty` 方法中返回。如果闭包没有返回值，将返回流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('  ')->trim()->whenEmpty(function (Stringable $string) {
    return $string->prepend('Laravel');
});

// 'Laravel'
```

<a name="method-fluent-str-when-not-empty"></a>
#### `whenNotEmpty` {.collection-method}

`whenNotEmpty` 方法在字符串不为空时调用给定的闭包。如果闭包返回一个值，该值也将在 `whenNotEmpty` 方法中返回。如果闭包没有返回值，将返回流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('Framework')->whenNotEmpty(function (Stringable $string) {
    return $string->prepend('Laravel ');
});

// 'Laravel Framework'
```

<a name="method-fluent-str-when-starts-with"></a>
#### `whenStartsWith` {.collection-method}

`whenStartsWith` 方法在字符串以给定的子字符串开头时调用给定的闭包。闭包将接收流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('disney world')->whenStartsWith('disney', function (Stringable $string) {
    return $string->title();
});

// 'Disney World'
```

<a name="method-fluent-str-when-ends-with"></a>
#### `whenEndsWith` {.collection-method}

`whenEndsWith` 方法在字符串以给定的子字符串结尾时调用给定的闭包。闭包将接收流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('disney world')->whenEndsWith('world', function (Stringable $string) {
    return $string->title();
});

// 'Disney World'
```

<a name="method-fluent-str-when-exactly"></a>
#### `whenExactly` {.collection-method}

`whenExactly` 方法在字符串与给定的字符串完全匹配时调用给定的闭包。闭包将接收流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('laravel')->whenExactly('laravel', function (Stringable $string) {
    return $string->title();
});

// 'Laravel'
```

<a name="method-fluent-str-when-not-exactly"></a>
#### `whenNotExactly` {.collection-method}

`whenNotExactly` 方法在字符串不与给定的字符串完全匹配时调用给定的闭包。闭包将接收流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('framework')->whenNotExactly('laravel', function (Stringable $string) {
    return $string->title();
});

// 'Framework'
```

<a name="method-fluent-str-when-is"></a>
#### `whenIs` {.collection-method}

`whenIs` 方法在字符串匹配给定的模式时调用给定的闭包。星号可用作通配符值。闭包将接收流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('foo/bar')->whenIs('foo/*', function (Stringable $string) {
    return $string->append('/baz');
});

// 'foo/bar/baz'
```

<a name="method-fluent-str-when-is-ascii"></a>
#### `whenIsAscii` {.collection-method}

`whenIsAscii` 方法在字符串为 7 位 ASCII 时调用给定的闭包。闭包将接收流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('laravel')->whenIsAscii(function (Stringable $string) {
    return $string->title();
});

// 'Laravel'
```

<a name="method-fluent-str-when-is-ulid"></a>
#### `whenIsUlid` {.collection-method}

`whenIsUlid` 方法在字符串为有效的 ULID 时调用给定的闭包。闭包将接收流式字符串实例：

```php
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

$string = Str::of('01gd6r360bp37zj17nxb55yv40')->whenIsUlid(function (Stringable $string) {
    return $string->append(' is a ULID');
});

// '01gd6r360bp37zj17nxb55yv40 is a ULID'
```

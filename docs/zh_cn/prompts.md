# Prompts（提示）

- [简介](#introduction)
- [安装](#installation)
- [可用提示](#available-prompts)
    - [文本](#text)
    - [多行文本](#textarea)
    - [数字](#number)
    - [密码](#password)
    - [确认](#confirm)
    - [选择](#select)
    - [多选](#multiselect)
    - [建议](#suggest)
    - [搜索](#search)
    - [多搜索](#multisearch)
    - [暂停](#pause)
    - [自动完成](#autocomplete)
- [验证前转换输入](#transforming-input-before-validation)
- [表单](#forms)
- [信息消息](#informational-messages)
- [标注框](#callouts)
- [表格](#tables)
- [旋转器](#spin)
- [进度条](#progress)
- [任务](#task)
- [流式输出](#stream)
- [终端标题](#terminal-title)
- [清除终端](#clear)
- [终端注意事项](#terminal-considerations)
- [不支持的环境与回退](#fallbacks)
- [测试](#testing)

<a name="introduction"></a>
## 简介

[Laravel Prompts](https://github.com/laravel/prompts) 是一个 PHP 包，用于为命令行应用程序添加美观且用户友好的表单，具有占位符文本和验证等类似浏览器的功能。

<img src="https://laravel.com/img/docs/prompts-example.png">

Laravel Prompts 非常适合在你的 [Artisan 控制台命令](/docs/{{version}}/artisan#writing-commands)中接受用户输入，但也可用于任何命令行 PHP 项目。

> [!NOTE]
> Laravel Prompts 支持 macOS、Linux 和带 WSL 的 Windows。更多信息，请参阅我们的[不支持的环境与回退](#fallbacks)文档。

<a name="installation"></a>
## 安装

Laravel Prompts 已包含在最新版本的 Laravel 中。

你也可以通过 Composer 包管理器将其安装到其他 PHP 项目中：

```shell
composer require laravel/prompts
```

<a name="available-prompts"></a>
## 可用提示

<a name="text"></a>
### 文本

`text` 函数将向用户显示给定的问题，接受他们的输入，然后返回该输入：

```php
use function Laravel\Prompts\text;

$name = text('你叫什么名字？');
```

你还可以包含占位符文本、默认值和信息提示：

```php
$name = text(
    label: '你叫什么名字？',
    placeholder: '例如：张三',
    default: $user?->name,
    hint: '这将显示在你的个人资料上。'
);
```

<a name="text-required"></a>
#### 必填值

如果你需要输入值，可以传递 `required` 参数：

```php
$name = text(
    label: '你叫什么名字？',
    required: true
);
```

如果你想自定义验证消息，也可以传递一个字符串：

```php
$name = text(
    label: '你叫什么名字？',
    required: '姓名是必填项。'
);
```

<a name="text-validation"></a>
#### 附加验证

最后，如果你想执行额外的验证逻辑，可以传递一个闭包给 `validate` 参数：

```php
$name = text(
    label: '你叫什么名字？',
    validate: fn (string $value) => match (true) {
        strlen($value) < 3 => '姓名必须至少 3 个字符。',
        strlen($value) > 255 => '姓名不能超过 255 个字符。',
        default => null
    }
);
```

闭包将接收已输入的值，并可以返回错误消息，如果验证通过则返回 `null`。

或者，你可以利用 Laravel [验证器](/docs/{{version}}/validation)的强大功能。为此，向 `validate` 参数提供一个包含属性名称和所需验证规则的数组：

```php
$name = text(
    label: '你叫什么名字？',
    validate: ['name' => 'required|max:255|unique:users']
);
```

<a name="textarea"></a>
### 多行文本

`textarea` 函数将向用户显示给定的问题，通过多行文本区域接受他们的输入，然后返回该输入：

```php
use function Laravel\Prompts\textarea;

$story = textarea('给我讲个故事。');
```

你还可以包含占位符文本、默认值和信息提示：

```php
$story = textarea(
    label: '给我讲个故事。',
    placeholder: '这是一个关于...的故事',
    hint: '这将显示在你的个人资料上。'
);
```

<a name="textarea-required"></a>
#### 必填值

如果你需要输入值，可以传递 `required` 参数：

```php
$story = textarea(
    label: '给我讲个故事。',
    required: true
);
```

如果你想自定义验证消息，也可以传递一个字符串：

```php
$story = textarea(
    label: '给我讲个故事。',
    required: '故事是必填项。'
);
```

<a name="textarea-validation"></a>
#### 附加验证

最后，如果你想执行额外的验证逻辑，可以传递一个闭包给 `validate` 参数：

```php
$story = textarea(
    label: '给我讲个故事。',
    validate: fn (string $value) => match (true) {
        strlen($value) < 250 => '故事必须至少 250 个字符。',
        strlen($value) > 10000 => '故事不能超过 10,000 个字符。',
        default => null
    }
);
```

闭包将接收已输入的值，并可以返回错误消息，如果验证通过则返回 `null`。

或者，你可以利用 Laravel [验证器](/docs/{{version}}/validation)的强大功能。为此，向 `validate` 参数提供一个包含属性名称和所需验证规则的数组：

```php
$story = textarea(
    label: '给我讲个故事。',
    validate: ['story' => 'required|max:10000']
);
```

<a name="number"></a>
### 数字

`number` 函数将向用户显示给定的问题，接受他们的数字输入，然后返回该输入。`number` 函数允许用户使用上下箭头键来操作数字：

```php
use function Laravel\Prompts\number;

$number = number('你想要多少份？');
```

你还可以包含占位符文本、默认值和信息提示：

```php
$name = number(
    label: '你想要多少份？',
    placeholder: '5',
    default: 1,
    hint: '这将决定要创建多少份。'
);
```

<a name="number-required"></a>
#### 必填值

如果你需要输入值，可以传递 `required` 参数：

```php
$copies = number(
    label: '你想要多少份？',
    required: true
);
```

如果你想自定义验证消息，也可以传递一个字符串：

```php
$copies = number(
    label: '你想要多少份？',
    required: '份数是必填项。'
);
```

<a name="number-validation"></a>
#### 附加验证

最后，如果你想执行额外的验证逻辑，可以传递一个闭包给 `validate` 参数：

```php
$copies = number(
    label: '你想要多少份？',
    validate: fn (?int $value) => match (true) {
        $value < 1 => '至少需要一份。',
        $value > 100 => '你不能创建超过 100 份。',
        default => null
    }
);
```

闭包将接收已输入的值，并可以返回错误消息，如果验证通过则返回 `null`。

或者，你可以利用 Laravel [验证器](/docs/{{version}}/validation)的强大功能。为此，向 `validate` 参数提供一个包含属性名称和所需验证规则的数组：

```php
$copies = number(
    label: '你想要多少份？',
    validate: ['copies' => 'required|integer|min:1|max:100']
);
```

<a name="password"></a>
### 密码

`password` 函数与 `text` 函数类似，但用户的输入在控制台中输入时会被掩码隐藏。这在询问密码等敏感信息时非常有用：

```php
use function Laravel\Prompts\password;

$password = password('你的密码是什么？');
```

你还可以包含占位符文本和信息提示：

```php
$password = password(
    label: '你的密码是什么？',
    placeholder: '密码',
    hint: '最少 8 个字符。'
);
```

<a name="password-required"></a>
#### 必填值

如果你需要输入值，可以传递 `required` 参数：

```php
$password = password(
    label: '你的密码是什么？',
    required: true
);
```

如果你想自定义验证消息，也可以传递一个字符串：

```php
$password = password(
    label: '你的密码是什么？',
    required: '密码是必填项。'
);
```

<a name="password-validation"></a>
#### 附加验证

最后，如果你想执行额外的验证逻辑，可以传递一个闭包给 `validate` 参数：

```php
$password = password(
    label: '你的密码是什么？',
    validate: fn (string $value) => match (true) {
        strlen($value) < 8 => '密码必须至少 8 个字符。',
        default => null
    }
);
```

闭包将接收已输入的值，并可以返回错误消息，如果验证通过则返回 `null`。

或者，你可以利用 Laravel [验证器](/docs/{{version}}/validation)的强大功能。为此，向 `validate` 参数提供一个包含属性名称和所需验证规则的数组：

```php
$password = password(
    label: '你的密码是什么？',
    validate: ['password' => 'min:8']
);
```

<a name="confirm"></a>
### 确认

如果你需要向用户确认"是或否"，可以使用 `confirm` 函数。用户可以使用箭头键或按 `y` 或 `n` 来选择他们的响应。此函数将返回 `true` 或 `false`。

```php
use function Laravel\Prompts\confirm;

$confirmed = confirm('你接受这些条款吗？');
```

你还可以包含默认值、自定义的"是"和"否"标签文本以及信息提示：

```php
$confirmed = confirm(
    label: '你接受这些条款吗？',
    default: false,
    yes: '我接受',
    no: '我拒绝',
    hint: '必须接受条款才能继续。'
);
```

<a name="confirm-required"></a>
#### 要求选择"是"

如有必要，你可以通过传递 `required` 参数要求用户选择"是"：

```php
$confirmed = confirm(
    label: '你接受这些条款吗？',
    required: true
);
```

如果你想自定义验证消息，也可以传递一个字符串：

```php
$confirmed = confirm(
    label: '你接受这些条款吗？',
    required: '你必须接受条款才能继续。'
);
```

<a name="select"></a>
### 选择

如果你需要用户从预定义的选项集中进行选择，可以使用 `select` 函数：

```php
use function Laravel\Prompts\select;

$role = select(
    label: '用户应该拥有什么角色？',
    options: ['成员', '贡献者', '所有者']
);
```

你还可以指定默认选项和信息提示：

```php
$role = select(
    label: '用户应该拥有什么角色？',
    options: ['成员', '贡献者', '所有者'],
    default: '所有者',
    hint: '角色可以随时更改。'
);
```

你也可以向 `options` 参数传递关联数组，以返回选中的键而不是其值：

```php
$role = select(
    label: '用户应该拥有什么角色？',
    options: [
        'member' => '成员',
        'contributor' => '贡献者',
        'owner' => '所有者',
    ],
    default: 'owner'
);
```

列表开始滚动前最多显示五个选项。你可以通过传递 `scroll` 参数来自定义此行为：

```php
$role = select(
    label: '你想分配哪个类别？',
    options: Category::pluck('name', 'id'),
    scroll: 10
);
```

<a name="select-info"></a>
#### 辅助信息

`info` 参数可用于显示关于当前高亮选项的附加信息。当提供闭包时，它将接收当前高亮选项的值，并应返回一个字符串或 `null`：

```php
$role = select(
    label: '用户应该拥有什么角色？',
    options: [
        'member' => '成员',
        'contributor' => '贡献者',
        'owner' => '所有者',
    ],
    info: fn (string $value) => match ($value) {
        'member' => '可以查看和评论。',
        'contributor' => '可以查看、评论和编辑。',
        'owner' => '完全访问所有资源。',
        default => null,
    }
);
```

如果信息不依赖于高亮选项，你也可以向 `info` 参数传递静态字符串：

```php
$role = select(
    label: '用户应该拥有什么角色？',
    options: ['成员', '贡献者', '所有者'],
    info: '角色可以随时更改。'
);
```

<a name="select-validation"></a>
#### 附加验证

与其他提示函数不同，`select` 函数不接受 `required` 参数，因为不可能什么都不选。但是，如果你需要显示一个选项但阻止其被选中，可以向 `validate` 参数传递一个闭包：

```php
$role = select(
    label: '用户应该拥有什么角色？',
    options: [
        'member' => '成员',
        'contributor' => '贡献者',
        'owner' => '所有者',
    ],
    validate: fn (string $value) =>
        $value === 'owner' && User::where('role', 'owner')->exists()
            ? '所有者已存在。'
            : null
);
```

如果 `options` 参数是关联数组，则闭包将接收选中的键，否则将接收选中的值。闭包可以返回错误消息，如果验证通过则返回 `null`。

<a name="multiselect"></a>
### 多选

如果你需要用户能够选择多个选项，可以使用 `multiselect` 函数：

```php
use function Laravel\Prompts\multiselect;

$permissions = multiselect(
    label: '应该分配哪些权限？',
    options: ['读取', '创建', '更新', '删除']
);
```

你还可以指定默认选项和信息提示：

```php
use function Laravel\Prompts\multiselect;

$permissions = multiselect(
    label: '应该分配哪些权限？',
    options: ['读取', '创建', '更新', '删除'],
    default: ['读取', '创建'],
    hint: '权限可以随时更新。'
);
```

你也可以向 `options` 参数传递关联数组，以返回选中的选项的键而不是其值：

```php
$permissions = multiselect(
    label: '应该分配哪些权限？',
    options: [
        'read' => '读取',
        'create' => '创建',
        'update' => '更新',
        'delete' => '删除',
    ],
    default: ['read', 'create']
);
```

列表开始滚动前最多显示五个选项。你可以通过传递 `scroll` 参数来自定义此行为：

```php
$categories = multiselect(
    label: '应该分配哪些类别？',
    options: Category::pluck('name', 'id'),
    scroll: 10
);
```

<a name="multiselect-info"></a>
#### 辅助信息

`info` 参数可用于显示关于当前高亮选项的附加信息。当提供闭包时，它将接收当前高亮选项的值，并应返回一个字符串或 `null`：

```php
$permissions = multiselect(
    label: '应该分配哪些权限？',
    options: [
        'read' => '读取',
        'create' => '创建',
        'update' => '更新',
        'delete' => '删除',
    ],
    info: fn (string $value) => match ($value) {
        'read' => '查看资源及其属性。',
        'create' => '创建新资源。',
        'update' => '修改现有资源。',
        'delete' => '永久删除资源。',
        default => null,
    }
);
```

<a name="multiselect-required"></a>
#### 要求选择值

默认情况下，用户可以选择零个或多个选项。你可以传递 `required` 参数来强制选择一个或多个选项：

```php
$categories = multiselect(
    label: '应该分配哪些类别？',
    options: Category::pluck('name', 'id'),
    required: true
);
```

如果你想自定义验证消息，可以向 `required` 参数提供一个字符串：

```php
$categories = multiselect(
    label: '应该分配哪些类别？',
    options: Category::pluck('name', 'id'),
    required: '你必须至少选择一个类别'
);
```

<a name="multiselect-validation"></a>
#### 附加验证

如果你需要显示一个选项但阻止其被选中，可以向 `validate` 参数传递一个闭包：

```php
$permissions = multiselect(
    label: '用户应拥有哪些权限？',
    options: [
        'read' => '读取',
        'create' => '创建',
        'update' => '更新',
        'delete' => '删除',
    ],
    validate: fn (array $values) => ! in_array('read', $values)
        ? '所有用户都需要读取权限。'
        : null
);
```

如果 `options` 参数是关联数组，则闭包将接收选中的键，否则将接收选中的值。闭包可以返回错误消息，如果验证通过则返回 `null`。

<a name="suggest"></a>
### 建议

`suggest` 函数可用于为可能的选择提供自动补全。用户仍然可以提供任何答案，无论自动补全提示如何：

```php
use function Laravel\Prompts\suggest;

$name = suggest('你叫什么名字？', ['张三', '李四']);
```

或者，你可以向 `suggest` 函数传递一个闭包作为第二个参数。每次用户输入一个字符时都会调用该闭包。闭包应接受一个包含用户当前输入的字符串参数，并返回一个用于自动补全的选项数组：

```php
$name = suggest(
    label: '你叫什么名字？',
    options: fn ($value) => collect(['张三', '李四'])
        ->filter(fn ($name) => Str::contains($name, $value, ignoreCase: true))
)
```

你还可以包含占位符文本、默认值和信息提示：

```php
$name = suggest(
    label: '你叫什么名字？',
    options: ['张三', '李四'],
    placeholder: '例如：张三',
    default: $user?->name,
    hint: '这将显示在你的个人资料上。'
);
```

<a name="suggest-info"></a>
#### 辅助信息

`info` 参数可用于显示关于当前高亮选项的附加信息。当提供闭包时，它将接收当前高亮选项的值，并应返回一个字符串或 `null`：

```php
$name = suggest(
    label: '你叫什么名字？',
    options: ['张三', '李四'],
    info: fn (string $value) => match ($value) {
        '张三' => '管理员',
        '李四' => '贡献者',
        default => null,
    }
);
```

<a name="suggest-required"></a>
#### 必填值

如果你需要输入值，可以传递 `required` 参数：

```php
$name = suggest(
    label: '你叫什么名字？',
    options: ['张三', '李四'],
    required: true
);
```

如果你想自定义验证消息，也可以传递一个字符串：

```php
$name = suggest(
    label: '你叫什么名字？',
    options: ['张三', '李四'],
    required: '姓名是必填项。'
);
```

<a name="suggest-validation"></a>
#### 附加验证

最后，如果你想执行额外的验证逻辑，可以传递一个闭包给 `validate` 参数：

```php
$name = suggest(
    label: '你叫什么名字？',
    options: ['张三', '李四'],
    validate: fn (string $value) => match (true) {
        strlen($value) < 3 => '姓名必须至少 3 个字符。',
        strlen($value) > 255 => '姓名不能超过 255 个字符。',
        default => null
    }
);
```

闭包将接收已输入的值，并可以返回错误消息，如果验证通过则返回 `null`。

或者，你可以利用 Laravel [验证器](/docs/{{version}}/validation)的强大功能。为此，向 `validate` 参数提供一个包含属性名称和所需验证规则的数组：

```php
$name = suggest(
    label: '你叫什么名字？',
    options: ['张三', '李四'],
    validate: ['name' => 'required|min:3|max:255']
);
```

<a name="search"></a>
### 搜索

如果你有大量选项供用户选择，`search` 函数允许用户输入搜索查询来过滤结果，然后使用箭头键选择选项：

```php
use function Laravel\Prompts\search;

$id = search(
    label: '搜索应接收邮件的用户',
    options: fn (string $value) => strlen($value) > 0
        ? User::whereLike('name', "%{$value}%")->pluck('name', 'id')->all()
        : []
);
```

闭包将接收用户已输入的文本，并且必须返回一个选项数组。如果你返回一个关联数组，则将返回所选选项的键，否则将返回其值。

在过滤数组时，如果你打算返回值，应使用 `array_values` 函数或 `values` Collection 方法，以确保数组不会变为关联数组：

```php
$names = collect(['张三', '李四']);

$selected = search(
    label: '搜索应接收邮件的用户',
    options: fn (string $value) => $names
        ->filter(fn ($name) => Str::contains($name, $value, ignoreCase: true))
        ->values()
        ->all(),
);
```

你还可以包含占位符文本和信息提示：

```php
$id = search(
    label: '搜索应接收邮件的用户',
    placeholder: '例如：张三',
    options: fn (string $value) => strlen($value) > 0
        ? User::whereLike('name', "%{$value}%")->pluck('name', 'id')->all()
        : [],
    hint: '用户将立即收到邮件。'
);
```

列表开始滚动前最多显示五个选项。你可以通过传递 `scroll` 参数来自定义此行为：

```php
$id = search(
    label: '搜索应接收邮件的用户',
    options: fn (string $value) => strlen($value) > 0
        ? User::whereLike('name', "%{$value}%")->pluck('name', 'id')->all()
        : [],
    scroll: 10
);
```

<a name="search-info"></a>
#### 辅助信息

`info` 参数可用于显示关于当前高亮选项的附加信息。当提供闭包时，它将接收当前高亮选项的值，并应返回一个字符串或 `null`：

```php
$id = search(
    label: '搜索应接收邮件的用户',
    options: fn (string $value) => strlen($value) > 0
        ? User::whereLike('name', "%{$value}%")->pluck('name', 'id')->all()
        : [],
    info: fn (int $userId) => User::find($userId)?->email
);
```

<a name="search-validation"></a>
#### 附加验证

如果你想执行额外的验证逻辑，可以向 `validate` 参数传递一个闭包：

```php
$id = search(
    label: '搜索应接收邮件的用户',
    options: fn (string $value) => strlen($value) > 0
        ? User::whereLike('name', "%{$value}%")->pluck('name', 'id')->all()
        : [],
    validate: function (int|string $value) {
        $user = User::findOrFail($value);

        if ($user->opted_out) {
            return '该用户已选择不接收邮件。';
        }
    }
);
```

如果 `options` 闭包返回关联数组，则闭包将接收选中的键，否则将接收选中的值。闭包可以返回错误消息，如果验证通过则返回 `null`。

<a name="multisearch"></a>
### 多搜索

如果你有大量可搜索的选项，并且需要用户能够选择多个项目，`multisearch` 函数允许用户输入搜索查询来过滤结果，然后使用箭头键和空格键选择选项：

```php
use function Laravel\Prompts\multisearch;

$ids = multisearch(
    '搜索应接收邮件的用户',
    fn (string $value) => strlen($value) > 0
        ? User::whereLike('name', "%{$value}%")->pluck('name', 'id')->all()
        : []
);
```

闭包将接收用户已输入的文本，并且必须返回一个选项数组。如果你返回一个关联数组，则将返回所选选项的键；否则，将返回它们的值。

在过滤数组时，如果你打算返回值，应使用 `array_values` 函数或 `values` Collection 方法，以确保数组不会变为关联数组：

```php
$names = collect(['张三', '李四']);

$selected = multisearch(
    label: '搜索应接收邮件的用户',
    options: fn (string $value) => $names
        ->filter(fn ($name) => Str::contains($name, $value, ignoreCase: true))
        ->values()
        ->all(),
);
```

你还可以包含占位符文本和信息提示：

```php
$ids = multisearch(
    label: '搜索应接收邮件的用户',
    placeholder: '例如：张三',
    options: fn (string $value) => strlen($value) > 0
        ? User::whereLike('name', "%{$value}%")->pluck('name', 'id')->all()
        : [],
    hint: '用户将立即收到邮件。'
);
```

列表开始滚动前最多显示五个选项。你可以通过提供 `scroll` 参数来自定义此行为：

```php
$ids = multisearch(
    label: '搜索应接收邮件的用户',
    options: fn (string $value) => strlen($value) > 0
        ? User::whereLike('name', "%{$value}%")->pluck('name', 'id')->all()
        : [],
    scroll: 10
);
```

<a name="multisearch-info"></a>
#### 辅助信息

`info` 参数可用于显示关于当前高亮选项的附加信息。当提供闭包时，它将接收当前高亮选项的值，并应返回一个字符串或 `null`：

```php
$ids = multisearch(
    label: '搜索应接收邮件的用户',
    options: fn (string $value) => strlen($value) > 0
        ? User::whereLike('name', "%{$value}%")->pluck('name', 'id')->all()
        : [],
    info: fn (int $userId) => User::find($userId)?->email
);
```

<a name="multisearch-required"></a>
#### 要求选择值

默认情况下，用户可以选择零个或多个选项。你可以传递 `required` 参数来强制选择一个或多个选项：

```php
$ids = multisearch(
    label: '搜索应接收邮件的用户',
    options: fn (string $value) => strlen($value) > 0
        ? User::whereLike('name', "%{$value}%")->pluck('name', 'id')->all()
        : [],
    required: true
);
```

如果你想自定义验证消息，也可以向 `required` 参数提供一个字符串：

```php
$ids = multisearch(
    label: '搜索应接收邮件的用户',
    options: fn (string $value) => strlen($value) > 0
        ? User::whereLike('name', "%{$value}%")->pluck('name', 'id')->all()
        : [],
    required: '你必须至少选择一个用户。'
);
```

<a name="multisearch-validation"></a>
#### 附加验证

如果你想执行额外的验证逻辑，可以向 `validate` 参数传递一个闭包：

```php
$ids = multisearch(
    label: '搜索应接收邮件的用户',
    options: fn (string $value) => strlen($value) > 0
        ? User::whereLike('name', "%{$value}%")->pluck('name', 'id')->all()
        : [],
    validate: function (array $values) {
        $optedOut = User::whereLike('name', '%a%')->findMany($values);

        if ($optedOut->isNotEmpty()) {
            return $optedOut->pluck('name')->join(', ', ' 和 ').' 已选择退出。';
        }
    }
);
```

如果 `options` 闭包返回关联数组，则闭包将接收选中的键；否则，将接收选中的值。闭包可以返回错误消息，如果验证通过则返回 `null`。

<a name="pause"></a>
### 暂停

`pause` 函数可用于向用户显示信息文本，并等待他们按回车键确认继续：

```php
use function Laravel\Prompts\pause;

pause('按回车键继续。');
```

<a name="autocomplete"></a>
### 自动完成

`autocomplete` 函数可用于为可能的选择提供内联自动补全。在用户输入时，匹配输入的提示将作为虚影文本出现，可以通过按 `Tab` 或右箭头键接受：

```php
use function Laravel\Prompts\autocomplete;

$name = autocomplete(
    label: '你叫什么名字？',
    options: ['张三', '李四', '王五', '赵六', '钱七']
);
```

你还可以包含占位符文本、默认值和信息提示：

```php
$name = autocomplete(
    label: '你叫什么名字？',
    options: ['张三', '李四', '王五', '赵六', '钱七'],
    placeholder: '例如：张三',
    default: $user?->name,
    hint: '使用 Tab 接受，上下键循环。'
);
```

<a name="autocomplete-closure"></a>
#### 动态选项

你也可以传递一个闭包来根据用户输入动态生成选项。每次用户输入一个字符时都会调用该闭包，并应返回一个用于自动补全的选项数组：

```php
$file = autocomplete(
    label: '哪个文件？',
    options: fn (string $value) => collect($files)
        ->filter(fn ($file) => str_starts_with(strtolower($file), strtolower($value)))
        ->values()
        ->all(),
);
```

<a name="autocomplete-required"></a>
#### 必填值

如果你需要输入值，可以传递 `required` 参数：

```php
$name = autocomplete(
    label: '你叫什么名字？',
    options: ['张三', '李四', '王五', '赵六', '钱七'],
    required: true
);
```

如果你想自定义验证消息，也可以传递一个字符串：

```php
$name = autocomplete(
    label: '你叫什么名字？',
    options: ['张三', '李四', '王五', '赵六', '钱七'],
    required: '姓名是必填项。'
);
```

<a name="autocomplete-validation"></a>
#### 附加验证

最后，如果你想执行额外的验证逻辑，可以传递一个闭包给 `validate` 参数：

```php
$name = autocomplete(
    label: '你叫什么名字？',
    options: ['张三', '李四', '王五', '赵六', '钱七'],
    validate: fn (string $value) => match (true) {
        strlen($value) < 3 => '姓名必须至少 3 个字符。',
        strlen($value) > 255 => '姓名不能超过 255 个字符。',
        default => null
    }
);
```

闭包将接收已输入的值，并可以返回错误消息，如果验证通过则返回 `null`。

<a name="transforming-input-before-validation"></a>
## 验证前转换输入

有时你可能希望在验证发生之前转换提示输入。例如，你可能希望去除提供的任何字符串中的空白字符。为此，许多提示函数提供了一个 `transform` 参数，它接受一个闭包：

```php
$name = text(
    label: '你叫什么名字？',
    transform: fn (string $value) => trim($value),
    validate: fn (string $value) => match (true) {
        strlen($value) < 3 => '姓名必须至少 3 个字符。',
        strlen($value) > 255 => '姓名不能超过 255 个字符。',
        default => null
    }
);
```

<a name="forms"></a>
## 表单

通常，在执行其他操作之前，你会按顺序显示多个提示来收集信息。你可以使用 `form` 函数创建一组分组的提示供用户完成：

```php
use function Laravel\Prompts\form;

$responses = form()
    ->text('你叫什么名字？', required: true)
    ->password('你的密码是什么？', validate: ['password' => 'min:8'])
    ->confirm('你接受这些条款吗？')
    ->submit();
```

`submit` 方法将返回一个包含表单中所有提示响应的数字索引数组。但是，你可以通过 `name` 参数为每个提示提供一个名称。当提供了名称时，可以通过该名称访问已命名提示的响应：

```php
use App\Models\User;
use function Laravel\Prompts\form;

$responses = form()
    ->text('你叫什么名字？', required: true, name: 'name')
    ->password(
        label: '你的密码是什么？',
        validate: ['password' => 'min:8'],
        name: 'password'
    )
    ->confirm('你接受这些条款吗？')
    ->submit();

User::create([
    'name' => $responses['name'],
    'password' => $responses['password'],
]);
```

使用 `form` 函数的主要好处是用户可以使用 `CTRL + U` 返回表单中的上一个提示。这允许用户修复错误或更改选择，而无需取消并重新启动整个表单。

如果你需要对表单中的提示进行更细粒度的控制，可以调用 `add` 方法而不是直接调用提示函数之一。`add` 方法会传递用户提供的所有先前响应：

```php
use function Laravel\Prompts\form;
use function Laravel\Prompts\outro;
use function Laravel\Prompts\text;

$responses = form()
    ->text('你叫什么名字？', required: true, name: 'name')
    ->add(function ($responses) {
        return text("{$responses['name']}，你多大了？", name: 'age');
    })
    ->submit();

outro("你的名字是 {$responses['name']}，你 {$responses['age']} 岁了。");
```

<a name="informational-messages"></a>
## 信息消息

`note`、`info`、`warning`、`error` 和 `alert` 函数可用于显示信息消息：

```php
use function Laravel\Prompts\info;

info('包安装成功。');
```

<a name="callouts"></a>
## 标注框

`callout` 函数显示一个带有标签和内容的框式消息。标注框适用于显示需要突出的重要信息，例如部署摘要、错误详情或状态更新：

```php
use function Laravel\Prompts\callout;

callout(
    label: '环境已配置',
    content: '你的应用程序正在生产环境中运行，有 4 个工作进程。',
);
```

你可以传递 `warning` 或 `error` 作为 `type` 参数来更改标注框的视觉样式：

```php
callout(
    label: '弃用通知',
    content: '`--prefer-stable` 标志将在 v4.0 中移除。请改用 `--stability=stable`。',
    type: 'warning',
);

callout(
    label: '数据库连接失败',
    content: '无法连接到 127.0.0.1:3306 上的 MySQL。',
    type: 'error',
);
```

`info` 参数为标注框添加一个页脚行，适用于显示 ID 或时间戳等元数据：

```php
callout(
    label: '部署摘要',
    content: '你的应用程序已部署到生产环境。',
    info: 'deploy-id: d4f8a2c',
);
```

<a name="callout-rich-content"></a>
#### 富内容

除了传递字符串，你还可以传递字符串和元素的数组来构建丰富的结构化标注框。`Element` 类提供了用于创建标题、项目符号列表、编号列表、键值对列表和链接的工厂方法：

```php
use Laravel\Prompts\Elements\Element;

use function Laravel\Prompts\callout;

callout('部署摘要', [
    '你的应用程序已于 2024-03-15 14:32 UTC 部署到生产环境。',
    Element::heading('变更内容'),
    Element::bulletedList([
        '迁移了 3 个待处理的数据库迁移',
        '清除并重建了路由缓存',
        '重启了 4 个队列工作进程',
    ]),
    Element::heading('后续步骤'),
    Element::numberedList([
        '在 /up 验证健康检查端点',
        '监控未来 15 分钟的错误率',
        '确认后台任务正在处理',
    ]),
]);
```

你也可以使用 `Element::keyValueList` 来显示带标签的数据：

```php
callout('数据库连接失败', [
    '无法连接到数据库服务器。',
    Element::keyValueList([
        '主机' => '127.0.0.1',
        '端口' => '3306',
        '数据库' => 'forge',
        '状态' => '连接被拒绝',
    ]),
], type: 'error');
```

`Element::link` 方法在支持 [OSC 8](https://gist.github.com/egmontkob/eb114294efbcd5adb1944c9f3cb5feda) 的终端中创建可点击的超链接。你可以只提供 URL，或提供 URL 和自定义标签：

```php
callout('服务器健康检查', [
    '多个服务报告性能下降。',
    Element::heading('受影响的服务'),
    '查看这里：'.Element::link('https://example.com/health', '健康面板'),
    Element::link('https://example.com/health'),
]);
```

如果未提供标签，URL 本身将显示为链接文本。

<a name="tables"></a>
## 表格

`table` 函数使显示多行多列数据变得容易。你只需要提供列名和表格数据：

```php
use function Laravel\Prompts\table;

table(
    headers: ['姓名', '邮箱'],
    rows: User::all(['name', 'email'])->toArray()
);
```

<a name="spin"></a>
## 旋转器

`spin` 函数在执行指定的回调时显示一个旋转器及可选消息。它用于指示正在进行的进程，并在完成后返回回调的结果：

```php
use function Laravel\Prompts\spin;

$response = spin(
    callback: fn () => Http::get('http://example.com'),
    message: '正在获取响应...'
);
```

> [!WARNING]
> `spin` 函数需要 [PCNTL](https://www.php.net/manual/en/book.pcntl.php) PHP 扩展来动画显示旋转器。当此扩展不可用时，将显示静态版本的旋转器。

<a name="progress"></a>
## 进度条

对于长时间运行的任务，显示进度条来告知用户任务完成进度会很有帮助。使用 `progress` 函数，Laravel 将显示进度条，并在对给定可迭代值的每次迭代中推进进度：

```php
use function Laravel\Prompts\progress;

$users = progress(
    label: '正在更新用户',
    steps: User::all(),
    callback: fn ($user) => $this->performTask($user)
);
```

`progress` 函数类似于 map 函数，将返回一个包含每个回调迭代返回值的数组。

回调也可以接受 `Laravel\Prompts\Progress` 实例，允许你在每次迭代中修改标签和提示：

```php
$users = progress(
    label: '正在更新用户',
    steps: User::all(),
    callback: function ($user, $progress) {
        $progress
            ->label("正在更新 {$user->name}")
            ->hint("创建于 {$user->created_at}");

        return $this->performTask($user);
    },
    hint: '这可能需要一些时间。'
);
```

有时，你可能需要对进度条的推进方式进行更多手动控制。首先，定义进程将迭代的总步数。然后，在处理每个项目后通过 `advance` 方法推进进度条：

```php
$progress = progress(label: '正在更新用户', steps: 10);

$users = User::all();

$progress->start();

foreach ($users as $user) {
    $this->performTask($user);

    $progress->advance();
}

$progress->finish();
```

<a name="task"></a>
## 任务

`task` 函数在给定回调执行时显示一个带标签的任务，包含旋转器和滚动的实时输出区域。它非常适合包装长时间运行的进程，如依赖安装或部署脚本，提供实时的可见性：

```php
use function Laravel\Prompts\task;

task(
    label: '正在安装依赖',
    callback: function ($logger) {
        // 长时间运行的进程...
    }
);
```

回调接收一个 `Logger` 实例，你可以使用它在任务的输出区域中显示日志行、状态消息和流式文本。

> [!WARNING]
> `task` 函数需要 [PCNTL](https://www.php.net/manual/en/book.pcntl.php) PHP 扩展来动画显示旋转器。当此扩展不可用时，将显示静态版本的任务。

<a name="task-logging"></a>
#### 日志行

`line` 方法将单行日志写入任务的滚动输出区域：

```php
task(
    label: '正在安装依赖',
    callback: function ($logger) {
        $logger->line('正在解析包...');
        // ...
        $logger->line('正在下载 laravel/framework');
        // ...
    }
);
```

<a name="task-status-messages"></a>
#### 状态消息

你可以使用 `success`、`warning` 和 `error` 方法来显示状态消息。这些消息显示为滚动日志区域上方稳定的高亮消息：

```php
task(
    label: '正在部署应用程序',
    callback: function ($logger) {
        $logger->line('正在拉取最新更改...');
        // ...
        $logger->success('更改已拉取！');

        $logger->line('正在运行迁移...');
        // ...
        $logger->warning('没有要运行的新迁移。');

        $logger->line('正在清除缓存...');
        // ...
        $logger->success('缓存已清除！');
    }
);
```

<a name="task-label"></a>
#### 更新标签

`label` 方法允许你在任务运行时更新其标签：

```php
task(
    label: '正在启动部署...',
    callback: function ($logger) {
        $logger->label('正在拉取最新更改...');
        // ...
        $logger->label('正在运行迁移...');
        // ...
        $logger->label('正在清除缓存...');
        // ...
    }
);
```

<a name="task-sub-label"></a>
#### 显示子标签

`subLabel` 方法在任务的主标签下方显示一行暗淡文本，用于传达临时状态，如当前正在进行的步骤。传递空字符串以清除子标签：

```php
task(
    label: '正在部署',
    callback: function ($logger) {
        $logger->subLabel('正在构建资源...');
        // ...
        $logger->subLabel('正在运行迁移...');
        // ...
        $logger->subLabel('');
    }
);
```

你也可以通过 `subLabel` 参数提供初始子标签：

```php
task(
    label: '正在部署',
    callback: function ($logger) {
        // ...
    },
    subLabel: '正在准备...'
);
```

<a name="task-streaming"></a>
#### 流式文本

对于逐步产生输出的进程，如 AI 生成的响应，`partial` 方法允许你逐词或逐块地流式输出文本。流式完成后，调用 `commitPartial` 来完成输出：

```php
task(
    label: '正在生成响应...',
    callback: function ($logger) {
        foreach ($words as $word) {
            $logger->partial($word . ' ');
        }

        $logger->commitPartial();
    }
);
```

<a name="task-limit"></a>
#### 自定义输出限制

默认情况下，任务显示最多 10 行滚动输出。你可以通过 `limit` 参数自定义此行为：

```php
task(
    label: '正在安装依赖',
    callback: function ($logger) {
        // ...
    },
    limit: 20
);
```

<a name="task-keep-summary"></a>
#### 保留摘要

默认情况下，任务回调完成后输出会被清除。如果你希望在任务完成后将状态消息保留在屏幕上，可以传递 `keepSummary` 参数：

```php
task(
    label: '正在部署',
    callback: function ($logger) {
        $logger->success('资源已构建');
        // ...
        $logger->success('迁移完成');
    },
    keepSummary: true,
);
```

<a name="stream"></a>
## 流式输出

`stream` 函数显示流式输出到终端的文本，非常适合显示 AI 生成的内容或任何逐步到达的文本：

```php
use function Laravel\Prompts\stream;

$stream = stream();

foreach ($words as $word) {
    $stream->append($word . ' ');
    usleep(25_000); // 模拟块之间的延迟...
}

$stream->close();
```

`append` 方法向流中添加文本，并带有渐入效果。当所有内容已流式完成后，调用 `close` 方法完成输出并恢复光标。

<a name="terminal-title"></a>
## 终端标题

`title` 函数更新用户终端窗口或标签页的标题：

```php
use function Laravel\Prompts\title;

title('正在安装依赖');
```

要将终端标题重置为默认值，传递空字符串：

```php
title('');
```

<a name="clear"></a>
## 清除终端

`clear` 函数可用于清除用户的终端：

```php
use function Laravel\Prompts\clear;

clear();
```

<a name="terminal-considerations"></a>
## 终端注意事项

<a name="terminal-width"></a>
#### 终端宽度

如果任何标签、选项或验证消息的长度超过用户终端中的"列"数，它将自动被截断以适应。如果你的用户可能使用较窄的终端，请考虑尽量减少这些字符串的长度。通常安全的长度最大为 74 个字符，以支持 80 个字符的终端。

<a name="terminal-height"></a>
#### 终端高度

对于任何接受 `scroll` 参数的提示，配置的值将自动减少以适应终端的高度，包括验证消息的空间。

<a name="fallbacks"></a>
## 不支持的环境与回退

Laravel Prompts 支持 macOS、Linux 和带 WSL 的 Windows。由于 Windows 版 PHP 的限制，目前无法在 WSL 之外的 Windows 上使用 Laravel Prompts。

因此，Laravel Prompts 支持回退到替代实现，例如 [Symfony Console Question Helper](https://symfony.com/doc/current/components/console/helpers/questionhelper.html)。

> [!NOTE]
> 当在 Laravel 框架中使用 Laravel Prompts 时，已为你配置了每个提示的回退方案，并将在不支持的环境中自动启用。

<a name="fallback-conditions"></a>
#### 回退条件

如果你不使用 Laravel 或需要自定义何时使用回退行为，可以向 `Prompt` 类的 `fallbackWhen` 静态方法传递一个布尔值：

```php
use Laravel\Prompts\Prompt;

Prompt::fallbackWhen(
    ! $input->isInteractive() || windows_os() || app()->runningUnitTests()
);
```

<a name="fallback-behavior"></a>
#### 回退行为

如果你不使用 Laravel 或需要自定义回退行为，可以向每个提示类的 `fallbackUsing` 静态方法传递一个闭包：

```php
use Laravel\Prompts\TextPrompt;
use Symfony\Component\Console\Question\Question;
use Symfony\Component\Console\Style\SymfonyStyle;

TextPrompt::fallbackUsing(function (TextPrompt $prompt) use ($input, $output) {
    $question = (new Question($prompt->label, $prompt->default ?: null))
        ->setValidator(function ($answer) use ($prompt) {
            if ($prompt->required && $answer === null) {
                throw new \RuntimeException(
                    is_string($prompt->required) ? $prompt->required : '必填。'
                );
            }

            if ($prompt->validate) {
                $error = ($prompt->validate)($answer ?? '');

                if ($error) {
                    throw new \RuntimeException($error);
                }
            }

            return $answer;
        });

    return (new SymfonyStyle($input, $output))
        ->askQuestion($question);
});
```

必须为每个提示类单独配置回退方案。闭包将接收一个提示类的实例，并且必须返回适合该提示的类型。

<a name="testing"></a>
## 测试

Laravel 提供了多种方法来测试你的命令是否显示预期的提示消息：

```php tab=Pest
test('报告生成', function () {
    $this->artisan('report:generate')
        ->expectsPromptsInfo('欢迎使用应用程序！')
        ->expectsPromptsWarning('此操作无法撤销')
        ->expectsPromptsError('出现了一些问题')
        ->expectsPromptsAlert('重要通知！')
        ->expectsPromptsIntro('正在启动进程...')
        ->expectsPromptsOutro('进程已完成！')
        ->expectsPromptsTable(
            headers: ['姓名', '邮箱'],
            rows: [
                ['张三', 'zhangsan@example.com'],
                ['李四', 'lisi@example.com'],
            ]
        )
        ->assertExitCode(0);
});
```

```php tab=PHPUnit
public function test_report_generation(): void
{
    $this->artisan('report:generate')
        ->expectsPromptsInfo('欢迎使用应用程序！')
        ->expectsPromptsWarning('此操作无法撤销')
        ->expectsPromptsError('出现了一些问题')
        ->expectsPromptsAlert('重要通知！')
        ->expectsPromptsIntro('正在启动进程...')
        ->expectsPromptsOutro('进程已完成！')
        ->expectsPromptsTable(
            headers: ['姓名', '邮箱'],
            rows: [
                ['张三', 'zhangsan@example.com'],
                ['李四', 'lisi@example.com'],
            ]
        )
        ->assertExitCode(0);
}
```

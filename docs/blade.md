# Blade 模板

- [简介](#introduction)
    - [使用 Livewire 增强 Blade](#supercharging-blade-with-livewire)
- [显示数据](#displaying-data)
    - [HTML 实体编码](#html-entity-encoding)
    - [Blade 和 JavaScript 框架](#blade-and-javascript-frameworks)
- [Blade 指令](#blade-directives)
    - [If 语句](#if-statements)
    - [Switch 语句](#switch-statements)
    - [循环](#loops)
    - [循环变量](#the-loop-variable)
    - [条件类名](#conditional-classes)
    - [额外属性](#additional-attributes)
    - [包含子视图](#including-subviews)
    - [`@once` 指令](#the-once-directive)
    - [原始 PHP](#raw-php)
    - [字体](#fonts)
    - [注释](#comments)
- [组件](#components)
    - [渲染组件](#rendering-components)
    - [索引组件](#index-components)
    - [向组件传递数据](#passing-data-to-components)
    - [组件属性](#component-attributes)
    - [保留关键字](#reserved-keywords)
    - [插槽](#slots)
    - [内联组件视图](#inline-component-views)
    - [动态组件](#dynamic-components)
    - [手动注册组件](#manually-registering-components)
- [匿名组件](#anonymous-components)
    - [匿名索引组件](#anonymous-index-components)
    - [数据属性 / 属性](#data-properties-attributes)
    - [访问父级数据](#accessing-parent-data)
    - [匿名组件路径](#anonymous-component-paths)
- [构建布局](#building-layouts)
    - [使用组件构建布局](#layouts-using-components)
    - [使用模板继承构建布局](#layouts-using-template-inheritance)
- [表单](#forms)
    - [CSRF 字段](#csrf-field)
    - [方法字段](#method-field)
    - [验证错误](#validation-errors)
- [堆栈](#stacks)
- [服务注入](#service-injection)
- [渲染内联 Blade 模板](#rendering-inline-blade-templates)
- [渲染 Blade 片段](#rendering-blade-fragments)
- [扩展 Blade](#extending-blade)
    - [自定义输出处理器](#custom-echo-handlers)
    - [自定义 If 语句](#custom-if-statements)

<a name="introduction"></a>
## 简介

Blade 是 Laravel 附带的简单但功能强大的模板引擎。与某些 PHP 模板引擎不同，Blade 不限制你在模板中使用纯 PHP 代码。事实上，所有 Blade 模板都会被编译成纯 PHP 代码并缓存，直到它们被修改，这意味着 Blade 为你的应用程序增加了基本为零的开销。Blade 模板文件使用 `.blade.php` 文件扩展名，通常存储在 `resources/views` 目录中。

Blade 视图可以使用全局的 `view` 辅助函数从路由或控制器返回。当然，正如在[视图](/docs/{{version}}/views)文档中提到的，可以使用 `view` 辅助函数的第二个参数将数据传递给 Blade 视图：

```php
Route::get('/', function () {
    return view('greeting', ['name' => 'Finn']);
});
```

<a name="supercharging-blade-with-livewire"></a>
### 使用 Livewire 增强 Blade

想要将你的 Blade 模板提升到一个新的水平并轻松构建动态界面？请查看 [Laravel Livewire](https://livewire.laravel.com)。Livewire 允许你编写 Blade 组件，这些组件具有通常只能通过 React、Svelte 或 Vue 等前端框架实现的动态功能，为构建现代、响应式前端提供了一种很好的方法，而无需许多 JavaScript 框架的复杂性、客户端渲染或构建步骤。

<a name="displaying-data"></a>
## 显示数据

你可以通过将变量用花括号括起来来显示传递给 Blade 视图的数据。例如，给定以下路由：

```php
Route::get('/', function () {
    return view('welcome', ['name' => 'Samantha']);
});
```

你可以像这样显示 `name` 变量的内容：

```blade
Hello, {{ $name }}.
```

> [!NOTE]
> Blade 的 `{{ }}` 输出语句会自动通过 PHP 的 `htmlspecialchars` 函数处理，以防止 XSS 攻击。

你不限于显示传递给视图的变量的内容。你也可以输出任何 PHP 函数的结果。事实上，你可以在 Blade 输出语句中放入任何你想要的 PHP 代码：

```blade
The current UNIX timestamp is {{ time() }}.
```

<a name="html-entity-encoding"></a>
### HTML 实体编码

默认情况下，Blade（以及 Laravel 的 `e` 函数）会对 HTML 实体进行双重编码。如果你希望禁用双重编码，请从 `AppServiceProvider` 的 `boot` 方法中调用 `Blade::withoutDoubleEncoding` 方法：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 引导任何应用程序服务。
     */
    public function boot(): void
    {
        Blade::withoutDoubleEncoding();
    }
}
```

<a name="displaying-unescaped-data"></a>
#### 显示未转义的数据

默认情况下，Blade `{{ }}` 语句会自动通过 PHP 的 `htmlspecialchars` 函数处理，以防止 XSS 攻击。如果你不希望数据被转义，可以使用以下语法：

```blade
Hello, {!! $name !!}.
```

> [!WARNING]
> 在输出由应用程序用户提供的内容时要非常小心。在显示用户提供的数据时，通常应使用转义的双花括号语法以防止 XSS 攻击。

<a name="blade-and-javascript-frameworks"></a>
### Blade 和 JavaScript 框架

由于许多 JavaScript 框架也使用"花括号"来表示给定表达式应在浏览器中显示，你可以使用 `@` 符号通知 Blade 渲染引擎表达式应保持不变。例如：

```blade
<h1>Laravel</h1>

Hello, @{{ name }}.
```

在此示例中，`@` 符号将被 Blade 移除；但是，`{{ name }}` 表达式将保持不变，从而允许由你的 JavaScript 框架渲染。

`@` 符号也可用于转义 Blade 指令：

```blade
{{-- Blade 模板 --}}
@@if()

<!-- HTML 输出 -->
@if()
```

<a name="rendering-json"></a>
#### 渲染 JSON

有时你可能将数组传递给视图，目的是将其渲染为 JSON 以初始化 JavaScript 变量。例如：

```php
<script>
    var app = <?php echo json_encode($array); ?>;
</script>
```

但是，与其手动调用 `json_encode`，你可以使用 `Illuminate\Support\Js::from` 方法。`from` 方法接受与 PHP 的 `json_encode` 函数相同的参数；但是，它将确保生成的 JSON 已正确转义以包含在 HTML 引号中。`from` 方法将返回一个字符串 `JSON.parse` JavaScript 语句，该语句将给定的对象或数组转换为有效的 JavaScript 对象：

```blade
<script>
    var app = {{ Illuminate\Support\Js::from($array) }};
</script>
```

最新版本的 Laravel 应用程序骨架包含一个 `Js` 门面，可以在你的 Blade 模板中方便地访问此功能：

```blade
<script>
    var app = {{ Js::from($array) }};
</script>
```

> [!WARNING]
> 你应仅使用 `Js::from` 方法将现有变量渲染为 JSON。Blade 模板基于正则表达式，尝试向指令传递复杂表达式可能会导致意外失败。

<a name="the-at-verbatim-directive"></a>
#### `@verbatim` 指令

如果你在模板的大部分区域显示 JavaScript 变量，可以将 HTML 包裹在 `@verbatim` 指令中，这样你就不必在每个 Blade 输出语句前加上 `@` 符号：

```blade
@verbatim
    <div class="container">
        Hello, {{ name }}.
    </div>
@endverbatim
```

<a name="blade-directives"></a>
## Blade 指令

除了模板继承和显示数据，Blade 还为常见的 PHP 控制结构（如条件语句和循环）提供了方便的快捷方式。这些快捷方式提供了一种非常简洁、精炼的方式来处理 PHP 控制结构，同时保持对 PHP 对应部分的熟悉感。

<a name="if-statements"></a>
### If 语句

你可以使用 `@if`、`@elseif`、`@else` 和 `@endif` 指令构建 `if` 语句。这些指令的功能与它们对应的 PHP 语句完全相同：

```blade
@if (count($records) === 1)
    I have one record!
@elseif (count($records) > 1)
    I have multiple records!
@else
    I don't have any records!
@endif
```

为了方便起见，Blade 还提供了一个 `@unless` 指令：

```blade
@unless (Auth::check())
    You are not signed in.
@endif
```

除了已经讨论过的条件指令外，`@isset` 和 `@empty` 指令可以用作各自 PHP 函数的便捷快捷方式：

```blade
@isset($records)
    // $records 已定义且不为 null...
@endisset

@empty($records)
    // $records 为"空"...
@endempty
```

<a name="authentication-directives"></a>
#### 认证指令

`@auth` 和 `@guest` 指令可用于快速确定当前用户是否已[认证](/docs/{{version}}/authentication)或是访客：

```blade
@auth
    // 用户已认证...
@endauth

@guest
    // 用户未认证...
@endguest
```

如果需要，你可以指定在使用 `@auth` 和 `@guest` 指令时应检查的认证守卫：

```blade
@auth('admin')
    // 用户已认证...
@endauth

@guest('admin')
    // 用户未认证...
@endguest
```

<a name="environment-directives"></a>
#### 环境指令

你可以使用 `@production` 指令检查应用程序是否在生产环境中运行：

```blade
@production
    // 生产环境特定内容...
@endproduction
```

或者，你可以使用 `@env` 指令确定应用程序是否在特定环境中运行：

```blade
@env('staging')
    // 应用程序在 "staging" 环境中运行...
@endenv

@env(['staging', 'production'])
    // 应用程序在 "staging" 或 "production" 环境中运行...
@endenv
```

<a name="section-directives"></a>
#### 节指令

你可以使用 `@hasSection` 指令确定模板继承节是否有内容：

```blade
@hasSection('navigation')
    <div class="pull-right">
        @yield('navigation')
    </div>

    <div class="clearfix"></div>
@endif
```

你可以使用 `sectionMissing` 指令确定节没有内容：

```blade
@sectionMissing('navigation')
    <div class="pull-right">
        @include('default-navigation')
    </div>
@endif
```

<a name="session-directives"></a>
#### 会话指令

`@session` 指令可用于确定[会话](/docs/{{version}}/session)值是否存在。如果会话值存在，将执行 `@session` 和 `@endsession` 指令内的模板内容。在 `@session` 指令的内容中，你可以输出 `$value` 变量来显示会话值：

```blade
@session('status')
    <div class="p-4 bg-green-100">
        {{ $value }}
    </div>
@endsession
```

<a name="context-directives"></a>
#### 上下文指令

`@context` 指令可用于确定[上下文](/docs/{{version}}/context)值是否存在。如果上下文值存在，将执行 `@context` 和 `@endcontext` 指令内的模板内容。在 `@context` 指令的内容中，你可以输出 `$value` 变量来显示上下文值：

```blade
@context('canonical')
    <link href="{{ $value }}" rel="canonical">
@endcontext
```

<a name="switch-statements"></a>
### Switch 语句

Switch 语句可以使用 `@switch`、`@case`、`@break`、`@default` 和 `@endswitch` 指令构建：

```blade
@switch($i)
    @case(1)
        First case...
        @break

    @case(2)
        Second case...
        @break

    @default
        Default case...
@endswitch
```

<a name="loops"></a>
### 循环

除了条件语句，Blade 还提供了用于处理 PHP 循环结构的简单指令。同样，这些指令的功能与它们对应的 PHP 语句完全相同：

```blade
@for ($i = 0; $i < 10; $i++)
    The current value is {{ $i }}
@endfor

@foreach ($users as $user)
    <p>This is user {{ $user->id }}</p>
@endforeach

@forelse ($users as $user)
    <li>{{ $user->name }}</li>
@empty
    <p>No users</p>
@endforelse

@while (true)
    <p>I'm looping forever.</p>
@endwhile
```

> [!NOTE]
> 在遍历 `foreach` 循环时，你可以使用[循环变量](#the-loop-variable)来获取有关循环的有用信息，例如你是在循环的第一次还是最后一次迭代。

使用循环时，你也可以使用 `@continue` 和 `@break` 指令跳过当前迭代或结束循环：

```blade
@foreach ($users as $user)
    @if ($user->type == 1)
        @continue
    @endif

    <li>{{ $user->name }}</li>

    @if ($user->number == 5)
        @break
    @endif
@endforeach
```

你也可以在指令声明中包含继续或中断条件：

```blade
@foreach ($users as $user)
    @continue($user->type == 1)

    <li>{{ $user->name }}</li>

    @break($user->number == 5)
@endforeach
```

<a name="the-loop-variable"></a>
### 循环变量

在遍历 `foreach` 循环时，一个 `$loop` 变量将在循环内可用。此变量提供对一些有用信息的访问，例如当前循环索引以及这是循环的第一次还是最后一次迭代：

```blade
@foreach ($users as $user)
    @if ($loop->first)
        This is the first iteration.
    @endif

    @if ($loop->last)
        This is the last iteration.
    @endif

    <p>This is user {{ $user->id }}</p>
@endforeach
```

如果你在嵌套循环中，可以通过 `parent` 属性访问父循环的 `$loop` 变量：

```blade
@foreach ($users as $user)
    @foreach ($user->posts as $post)
        @if ($loop->parent->first)
            This is the first iteration of the parent loop.
        @endif
    @endforeach
@endforeach
```

`$loop` 变量还包含各种其他有用的属性：

<div class="overflow-auto">

| 属性               | 描述                                     |
| ------------------ | ---------------------------------------- |
| `$loop->index`     | 当前循环迭代的索引（从 0 开始）。          |
| `$loop->iteration` | 当前循环迭代（从 1 开始）。                |
| `$loop->remaining` | 循环中剩余的迭代次数。                     |
| `$loop->count`     | 正在迭代的数组中的项目总数。               |
| `$loop->first`     | 是否为循环的第一次迭代。                    |
| `$loop->last`      | 是否为循环的最后一次迭代。                  |
| `$loop->even`      | 是否为循环的偶数次迭代。                    |
| `$loop->odd`       | 是否为循环的奇数次迭代。                    |
| `$loop->depth`     | 当前循环的嵌套级别。                        |
| `$loop->parent`    | 在嵌套循环中，父循环的循环变量。            |

</div>

<a name="conditional-classes"></a>
### 条件类名和样式

`@class` 指令有条件地编译 CSS 类名字符串。该指令接受一个类名数组，其中数组键包含你想要添加的类名，而值是一个布尔表达式。如果数组元素具有数字键，它将始终包含在渲染的类名列表中：

```blade
@php
    $isActive = false;
    $hasError = true;
@endphp

<span @class([
    'p-4',
    'font-bold' => $isActive,
    'text-gray-500' => ! $isActive,
    'bg-red' => $hasError,
])></span>

<span class="p-4 text-gray-500 bg-red"></span>
```

同样，`@style` 指令可用于有条件地向 HTML 元素添加内联 CSS 样式：

```blade
@php
    $isActive = true;
@endphp

<span @style([
    'background-color: red',
    'font-weight: bold' => $isActive,
])></span>

<span style="background-color: red; font-weight: bold;"></span>
```

<a name="additional-attributes"></a>
### 额外属性

为方便起见，你可以使用 `@checked` 指令轻松指示给定的 HTML 复选框输入是否为"checked"。如果提供的条件评估为 `true`，此指令将输出 `checked`：

```blade
<input
    type="checkbox"
    name="active"
    value="active"
    @checked(old('active', $user->active))
/>
```

同样，`@selected` 指令可用于指示给定的选择选项是否应为"selected"：

```blade
<select name="version">
    @foreach ($product->versions as $version)
        <option value="{{ $version }}" @selected(old('version') == $version)>
            {{ $version }}
        </option>
    @endforeach
</select>
```

此外，`@disabled` 指令可用于指示给定的元素是否应为"disabled"：

```blade
<button type="submit" @disabled($errors->isNotEmpty())>Submit</button>
```

此外，`@readonly` 指令可用于指示给定的元素是否应为"readonly"：

```blade
<input
    type="email"
    name="email"
    value="email@laravel.com"
    @readonly($user->isNotAdmin())
/>
```

此外，`@required` 指令可用于指示给定的元素是否应为"required"：

```blade
<input
    type="text"
    name="title"
    value="title"
    @required($user->isAdmin())
/>
```

<a name="including-subviews"></a>
### 包含子视图

> [!NOTE]
> 虽然你可以自由使用 `@include` 指令，但 Blade [组件](#components)提供了类似的功能，并且在数据属性和属性绑定方面比 `@include` 指令提供了几个优势。

Blade 的 `@include` 指令允许你从一个视图中包含另一个 Blade 视图。所有父视图可用的变量都将对包含的视图可用：

```blade
<div>
    @include('shared.errors')

    <form>
        <!-- 表单内容 -->
    </form>
</div>
```

尽管包含的视图将继承父视图中所有可用的数据，但你也可以传递一个额外数据的数组，这些数据应对包含的视图可用：

```blade
@include('view.name', ['status' => 'complete'])
```

如果你尝试 `@include` 一个不存在的视图，Laravel 将抛出错误。如果你希望包含一个可能存在也可能不存在的视图，应使用 `@includeIf` 指令：

```blade
@includeIf('view.name', ['status' => 'complete'])
```

如果你希望在给定的布尔表达式评估为 `true` 或 `false` 时 `@include` 一个视图，可以使用 `@includeWhen` 和 `@includeUnless` 指令：

```blade
@includeWhen($boolean, 'view.name', ['status' => 'complete'])

@includeUnless($boolean, 'view.name', ['status' => 'complete'])
```

要包含给定视图数组中存在的第一个视图，可以使用 `includeFirst` 指令：

```blade
@includeFirst(['custom.admin', 'admin'], ['status' => 'complete'])
```

如果你希望包含一个视图而不继承父视图中的任何变量，可以使用 `@includeIsolated` 指令。包含的视图将只能访问你显式传递的变量：

```blade
@includeIsolated('view.name', ['user' => $user])
```

> [!WARNING]
> 你应避免在 Blade 视图中使用 `__DIR__` 和 `__FILE__` 常量，因为它们将引用缓存的、已编译视图的位置。

<a name="rendering-views-for-collections"></a>
#### 为集合渲染视图

你可以使用 Blade 的 `@each` 指令将循环和包含合并为一行：

```blade
@each('view.name', $jobs, 'job')
```

`@each` 指令的第一个参数是为数组或集合中的每个元素渲染的视图。第二个参数是你希望遍历的数组或集合，而第三个参数是在视图中分配给当前迭代的变量名称。例如，如果你正在遍历一个 `jobs` 数组，通常你会希望将每个作业作为视图中的 `job` 变量来访问。当前迭代的数组键将作为视图中的 `key` 变量可用。

你也可以向 `@each` 指令传递第四个参数。此参数确定在给定数组为空时将渲染的视图。

```blade
@each('view.name', $jobs, 'job', 'view.empty')
```

> [!WARNING]
> 通过 `@each` 渲染的视图不会继承父视图中的变量。如果子视图需要这些变量，应改用 `@foreach` 和 `@include` 指令。

<a name="the-once-directive"></a>
### `@once` 指令

`@once` 指令允许你定义模板的一部分，该部分在每个渲染周期中只会被评估一次。这对于使用[堆栈](#stacks)将给定的 JavaScript 片段推送到页面头部可能很有用。例如，如果你在循环中渲染给定的[组件](#components)，你可能希望仅在第一次渲染组件时将 JavaScript 推送到头部：

```blade
@once
    @push('scripts')
        <script>
            // 你的自定义 JavaScript...
        </script>
    @endpush
@endonce
```

由于 `@once` 指令通常与 `@push` 或 `@prepend` 指令结合使用，因此 `@pushOnce` 和 `@prependOnce` 指令可供你方便使用：

```blade
@pushOnce('scripts')
    <script>
        // 你的自定义 JavaScript...
    </script>
@endPushOnce
```

如果你从两个独立的 Blade 模板推送重复内容，应为 `@pushOnce` 指令提供唯一标识符作为第二个参数，以确保内容只渲染一次：

```blade
<!-- pie-chart.blade.php -->
@pushOnce('scripts', 'chart.js')
    <script src="/chart.js"></script>
@endPushOnce

<!-- line-chart.blade.php -->
@pushOnce('scripts', 'chart.js')
    <script src="/chart.js"></script>
@endPushOnce
```

<a name="raw-php"></a>
### 原始 PHP

在某些情况下，将 PHP 代码嵌入到视图中是很有用的。你可以使用 Blade 的 `@php` 指令在模板中执行一段纯 PHP 代码：

```blade
@php
    $counter = 1;
@endphp
```

或者，如果你只需要使用 PHP 导入一个类，可以使用 `@use` 指令：

```blade
@use('App\Models\Flight')
```

可以向 `@use` 指令提供第二个参数来为导入的类设置别名：

```blade
@use('App\Models\Flight', 'FlightModel')
```

如果你有多个位于同一命名空间下的类，可以对这些类的导入进行分组：

```blade
@use('App\Models\{Flight, Airport}')
```

`@use` 指令还支持通过给导入路径添加 `function` 或 `const` 修饰符来导入 PHP 函数和常量：

```blade
@use(function App\Helpers\format_currency)
@use(const App\Constants\MAX_ATTEMPTS)
```

就像类导入一样，函数和常量也支持别名：

```blade
@use(function App\Helpers\format_currency, 'formatMoney')
@use(const App\Constants\MAX_ATTEMPTS, 'MAX_TRIES')
```

分组导入也支持函数和常量修饰符，允许你在单个指令中从同一命名空间导入多个符号：

```blade
@use(function App\Helpers\{format_currency, format_date})
@use(const App\Constants\{MAX_ATTEMPTS, DEFAULT_TIMEOUT})
```

<a name="fonts"></a>
### 字体

当使用 [Laravel 的 Vite 字体优化](/docs/{{version}}/vite#working-with-fonts)时，你可以使用 `@fonts` 指令在应用程序的布局中渲染你配置的字体预加载链接和内联字体 CSS：

```blade
<!doctype html>
<head>
    {{-- ... --}}

    @fonts
    @vite('resources/js/app.js')
</head>
```

`@fonts` 指令渲染在 `vite.config.js` 文件中配置的所有字体族。该指令通常应放在应用程序根布局的 `<head>` 中，位于任何使用这些字体的内容之前。

如果页面只需要你配置的部分字体，你可以向指令传递一个或多个字体别名：

```blade
{{-- 加载单个字体别名... --}}
@fonts('sans')

{{-- 加载多个字体别名... --}}
@fonts(['sans', 'mono'])
```

字体别名在使用 `alias` 选项定义 Vite 配置中的字体时配置。`@fonts` 指令调用 `Vite` 门面提供的 `fonts` 方法，也可以直接调用：

```blade
{{ Vite::fonts(['sans', 'mono']) }}
```

<a name="comments"></a>
### 注释

Blade 还允许你在视图中定义注释。然而，与 HTML 注释不同，Blade 注释不会包含在应用程序返回的 HTML 中：

```blade
{{-- 此注释不会出现在渲染的 HTML 中 --}}
```

<a name="components"></a>
## 组件

组件和插槽提供了类似于节、布局和包含的好处；然而，有些人可能觉得组件和插槽的心智模型更容易理解。编写组件有两种方法：基于类的组件和匿名组件。

要创建基于类的组件，你可以使用 `make:component` Artisan 命令。为了说明如何使用组件，我们将创建一个简单的 `Alert` 组件。`make:component` 命令将把组件放在 `app/View/Components` 目录中：

```shell
php artisan make:component Alert
```

`make:component` 命令还将为组件创建一个视图模板。该视图将放在 `resources/views/components` 目录中。为你的应用程序编写组件时，组件会在 `app/View/Components` 目录和 `resources/views/components` 目录中自动发现，因此通常不需要进一步的组件注册。

你也可以在子目录中创建组件：

```shell
php artisan make:component Forms/Input
```

上面的命令将在 `app/View/Components/Forms` 目录中创建一个 `Input` 组件，视图将放在 `resources/views/components/forms` 目录中。

<a name="manually-registering-package-components"></a>
#### 手动注册包组件

为你的应用程序编写组件时，组件会在 `app/View/Components` 目录和 `resources/views/components` 目录中自动发现。

但是，如果你正在构建一个使用 Blade 组件的包，你需要手动注册你的组件类及其 HTML 标签别名。通常，你应在包的 service provider 的 `boot` 方法中注册你的组件：

```php
use Illuminate\Support\Facades\Blade;

/**
 * 引导你的包的服务。
 */
public function boot(): void
{
    Blade::component('package-alert', Alert::class);
}
```

一旦你的组件被注册，就可以使用其标签别名进行渲染：

```blade
<x-package-alert/>
```

或者，你可以使用 `componentNamespace` 方法按约定自动加载组件类。例如，一个 `Nightshade` 包可能具有位于 `Package\Views\Components` 命名空间中的 `Calendar` 和 `ColorPicker` 组件：

```php
use Illuminate\Support\Facades\Blade;

/**
 * 引导你的包的服务。
 */
public function boot(): void
{
    Blade::componentNamespace('Nightshade\\Views\\Components', 'nightshade');
}
```

这将允许通过使用 `package-name::` 语法来使用供应商命名空间的包组件：

```blade
<x-nightshade::calendar />
<x-nightshade::color-picker />
```

Blade 将通过使用大驼峰命名法命名组件名称来自动检测链接到此组件的类。也支持使用"点"符号的子目录。

<a name="rendering-components"></a>
### 渲染组件

要显示组件，你可以在 Blade 模板中使用 Blade 组件标签。Blade 组件标签以字符串 `x-` 开头，后跟组件类名的短横线命名法：

```blade
<x-alert/>

<x-user-profile/>
```

如果组件类嵌套在 `app/View/Components` 目录中更深的位置，你可以使用 `.` 字符来表示目录嵌套。例如，如果我们假设一个组件位于 `app/View/Components/Inputs/Button.php`，我们可以像这样渲染它：

```blade
<x-inputs.button/>
```

如果你希望有条件地渲染组件，可以在组件类上定义一个 `shouldRender` 方法。如果 `shouldRender` 方法返回 `false`，则组件不会被渲染：

```php
use Illuminate\Support\Str;

/**
 * 是否应渲染组件
 */
public function shouldRender(): bool
{
    return Str::length($this->message) > 0;
}
```

<a name="index-components"></a>
### 索引组件

有时组件是组件组的一部分，你可能希望将相关组件分组在单个目录中。例如，想象一个具有以下类结构的"card"组件：

```text
App\Views\Components\Card\Card
App\Views\Components\Card\Header
App\Views\Components\Card\Body
```

由于根 `Card` 组件嵌套在 `Card` 目录中，你可能会认为需要通过 `<x-card.card>` 来渲染该组件。但是，当组件的文件名与组件目录的名称匹配时，Laravel 会自动假定该组件是"根"组件，并允许你在不重复目录名的情况下渲染该组件：

```blade
<x-card>
    <x-card.header>...</x-card.header>
    <x-card.body>...</x-card.body>
</x-card>
```

<a name="passing-data-to-components"></a>
### 向组件传递数据

你可以使用 HTML 属性向 Blade 组件传递数据。硬编码的原始值可以使用简单的 HTML 属性字符串传递给组件。PHP 表达式和变量应通过使用 `:` 字符作为前缀的属性传递给组件：

```blade
<x-alert type="error" :message="$message"/>
```

你应在组件的类构造函数中定义组件的所有数据属性。组件上的所有公共属性将自动对组件的视图可用。无需从组件的 `render` 方法将数据传递到视图：

```php
<?php

namespace App\View\Components;

use Illuminate\View\Component;
use Illuminate\View\View;

class Alert extends Component
{
    /**
     * 创建组件实例。
     */
    public function __construct(
        public string $type,
        public string $message,
    ) {}

    /**
     * 获取表示组件的视图/内容。
     */
    public function render(): View
    {
        return view('components.alert');
    }
}
```

当你的组件被渲染时，你可以通过按名称输出变量来显示组件的公共变量的内容：

```blade
<div class="alert alert-{{ $type }}">
    {{ $message }}
</div>
```

<a name="casing"></a>
#### 命名规范

组件构造函数参数应使用 `camelCase`（小驼峰命名法）指定，而在 HTML 属性中引用参数名称时应使用 `kebab-case`（短横线命名法）。例如，给定以下组件构造函数：

```php
/**
 * 创建组件实例。
 */
public function __construct(
    public string $alertType,
) {}
```

`$alertType` 参数可以像这样提供给组件：

```blade
<x-alert alert-type="danger" />
```

<a name="short-attribute-syntax"></a>
#### 简短属性语法

向组件传递属性时，你也可以使用"简短属性"语法。这通常很方便，因为属性名称通常与它们对应的变量名称相匹配：

```blade
{{-- 简短属性语法... --}}
<x-profile :$userId :$name />

{{-- 等同于... --}}
<x-profile :user-id="$userId" :name="$name" />
```

<a name="escaping-attribute-rendering"></a>
#### 转义属性渲染

由于某些 JavaScript 框架（如 Alpine.js）也使用冒号前缀的属性，你可以使用双冒号（`::`）前缀来通知 Blade 该属性不是 PHP 表达式。例如，给定以下组件：

```blade
<x-button ::class="{ danger: isDeleting }">
    Submit
</x-button>
```

Blade 将渲染以下 HTML：

```blade
<button :class="{ danger: isDeleting }">
    Submit
</button>
```

<a name="component-methods"></a>
#### 组件方法

除了公共变量对组件模板可用外，组件上的任何公共方法都可以被调用。例如，想象一个具有 `isSelected` 方法的组件：

```php
/**
 * 确定给定的选项是否是当前选中的选项。
 */
public function isSelected(string $option): bool
{
    return $option === $this->selected;
}
```

你可以通过调用与方法名称匹配的变量从组件模板执行此方法：

```blade
<option {{ $isSelected($value) ? 'selected' : '' }} value="{{ $value }}">
    {{ $label }}
</option>
```

<a name="using-attributes-slots-within-component-class"></a>
#### 在组件类中访问属性和插槽

Blade 组件还允许你在类的 render 方法中访问组件名称、属性和插槽。但是，为了访问这些数据，你应从组件的 `render` 方法返回一个闭包：

```php
use Closure;

/**
 * 获取表示组件的视图/内容。
 */
public function render(): Closure
{
    return function () {
        return '<div {{ $attributes }}>Components content</div>';
    };
}
```

组件 `render` 方法返回的闭包还可以接收一个 `$data` 数组作为其唯一参数。此数组将包含提供组件信息的几个元素：

```php
return function (array $data) {
    // $data['componentName'];
    // $data['attributes'];
    // $data['slot'];

    return '<div {{ $attributes }}>Components content</div>';
}
```

> [!WARNING]
> `$data` 数组中的元素绝不应直接嵌入到 `render` 方法返回的 Blade 字符串中，因为这样做可能允许通过恶意属性内容执行远程代码。

`componentName` 等于 HTML 标签中 `x-` 前缀后使用的名称。因此 `<x-alert />` 的 `componentName` 将是 `alert`。`attributes` 元素将包含 HTML 标签上存在的所有属性。`slot` 元素是一个 `Illuminate\Support\HtmlString` 实例，包含组件插槽的内容。

闭包应返回一个字符串。如果返回的字符串对应现有的视图，则该视图将被渲染；否则，返回的字符串将被评估为内联 Blade 视图。

<a name="additional-dependencies"></a>
#### 额外的依赖

如果你的组件需要来自 Laravel [服务容器](/docs/{{version}}/container)的依赖，你可以在任何组件的数据属性之前列出它们，它们将由容器自动注入：

```php
use App\Services\AlertCreator;

/**
 * 创建组件实例。
 */
public function __construct(
    public AlertCreator $creator,
    public string $type,
    public string $message,
) {}
```

<a name="hiding-attributes-and-methods"></a>
#### 隐藏属性/方法

如果你希望防止某些公共方法或属性作为变量暴露给组件模板，你可以将它们添加到组件上的 `$except` 数组属性中：

```php
<?php

namespace App\View\Components;

use Illuminate\View\Component;

class Alert extends Component
{
    /**
     * 不应暴露给组件模板的属性/方法。
     *
     * @var array
     */
    protected $except = ['type'];

    /**
     * 创建组件实例。
     */
    public function __construct(
        public string $type,
    ) {}
}
```

<a name="component-attributes"></a>
### 组件属性

我们已经检查了如何向组件传递数据属性；但是，有时你可能需要指定额外的 HTML 属性，如 `class`，这些属性不是组件运行所需数据的一部分。通常，你想将这些额外的属性传递给组件模板的根元素。例如，想象我们想像这样渲染一个 `alert` 组件：

```blade
<x-alert type="error" :message="$message" class="mt-4"/>
```

所有不属于组件构造函数的属性将自动添加到组件的"属性包"中。此属性包通过 `$attributes` 变量自动对组件可用。所有属性可以通过输出此变量在组件内渲染：

```blade
<div {{ $attributes }}>
    <!-- 组件内容 -->
</div>
```

> [!WARNING]
> 目前在组件标签中使用 `@env` 等指令不受支持。例如，`<x-alert :live="@env('production')"/>` 将不会被编译。

<a name="default-merged-attributes"></a>
#### 默认/合并属性

有时你可能需要为属性指定默认值或将额外的值合并到组件的某些属性中。为此，你可以使用属性包的 `merge` 方法。此方法对于定义一组应始终应用于组件的默认 CSS 类特别有用：

```blade
<div {{ $attributes->merge(['class' => 'alert alert-'.$type]) }}>
    {{ $message }}
</div>
```

如果我们假设此组件像这样被使用：

```blade
<x-alert type="error" :message="$message" class="mb-4"/>
```

组件的最终渲染 HTML 将如下所示：

```blade
<div class="alert alert-error mb-4">
    <!-- $message 变量的内容 -->
</div>
```

<a name="conditionally-merge-classes"></a>
#### 条件合并类

有时你可能希望仅在给定条件为 `true` 时合并类。你可以通过 `class` 方法实现，该方法接受一个类名数组，其中数组键包含你想要添加的类名，而值是一个布尔表达式。如果数组元素具有数字键，它将始终包含在渲染的类名列表中：

```blade
<div {{ $attributes->class(['p-4', 'bg-red' => $hasError]) }}>
    {{ $message }}
</div>
```

如果你需要将其他属性合并到组件中，可以将 `merge` 方法链式调用到 `class` 方法上：

```blade
<button {{ $attributes->class(['p-4'])->merge(['type' => 'button']) }}>
    {{ $slot }}
</button>
```

> [!NOTE]
> 如果你需要在不应接收合并属性的其他 HTML 元素上有条件地编译类，可以使用 [@class 指令](#conditional-classes)。

<a name="non-class-attribute-merging"></a>
#### 非类属性合并

合并不是 `class` 的属性时，提供给 `merge` 方法的值将被视为属性的"默认"值。但是，与 `class` 属性不同，这些属性不会与注入的属性值合并。相反，它们将被覆盖。例如，一个 `button` 组件的实现可能如下所示：

```blade
<button {{ $attributes->merge(['type' => 'button']) }}>
    {{ $slot }}
</button>
```

要使用自定义 `type` 渲染按钮组件，可以在使用组件时指定。如果未指定类型，将使用 `button` 类型：

```blade
<x-button type="submit">
    Submit
</x-button>
```

此示例中 `button` 组件的渲染 HTML 将是：

```blade
<button type="submit">
    Submit
</button>
```

如果你希望 `class` 之外的某个属性的默认值和注入值连接在一起，可以使用 `prepends` 方法。在此示例中，`data-controller` 属性将始终以 `profile-controller` 开头，任何额外的注入 `data-controller` 值将放置在此默认值之后：

```blade
<div {{ $attributes->merge(['data-controller' => $attributes->prepends('profile-controller')]) }}>
    {{ $slot }}
</div>
```

<a name="filtering-attributes"></a>
#### 检索和过滤属性

你可以使用 `filter` 方法过滤属性。此方法接受一个闭包，如果希望保留属性包中的属性，应返回 `true`：

```blade
{{ $attributes->filter(fn (string $value, string $key) => $key == 'foo') }}
```

为方便起见，你可以使用 `whereStartsWith` 方法检索其键以给定字符串开头的所有属性：

```blade
{{ $attributes->whereStartsWith('wire:model') }}
```

相反，`whereDoesntStartWith` 方法可用于排除其键以给定字符串开头的所有属性：

```blade
{{ $attributes->whereDoesntStartWith('wire:model') }}
```

使用 `first` 方法，你可以渲染给定属性包中的第一个属性：

```blade
{{ $attributes->whereStartsWith('wire:model')->first() }}
```

如果你希望检查属性是否存在于组件上，可以使用 `has` 方法。此方法接受属性名称作为其唯一参数，并返回一个布尔值，指示该属性是否存在：

```blade
@if ($attributes->has('class'))
    <div>Class attribute is present</div>
@endif
```

如果向 `has` 方法传递一个数组，该方法将确定所有给定的属性是否都存在于组件上：

```blade
@if ($attributes->has(['name', 'class']))
    <div>All of the attributes are present</div>
@endif
```

`hasAny` 方法可用于确定任何给定的属性是否存在于组件上：

```blade
@if ($attributes->hasAny(['href', ':href', 'v-bind:href']))
    <div>One of the attributes is present</div>
@endif
```

你可以使用 `get` 方法检索特定属性的值：

```blade
{{ $attributes->get('class') }}
```

`only` 方法可用于仅检索具有给定键的属性：

```blade
{{ $attributes->only(['class']) }}
```

`except` 方法可用于检索除具有给定键的属性之外的所有属性：

```blade
{{ $attributes->except(['class']) }}
```

<a name="reserved-keywords"></a>
### 保留关键字

默认情况下，一些关键字是为 Blade 内部使用而保留的，用于渲染组件。以下关键字不能定义为组件中的公共属性或方法名：

<div class="content-list" markdown="1">

- `data`
- `render`
- `resolve`
- `resolveView`
- `shouldRender`
- `view`
- `withAttributes`
- `withName`

</div>

<a name="slots"></a>
### 插槽

你通常需要通过"插槽"向组件传递额外内容。组件插槽通过输出 `$slot` 变量来渲染。为了探索这个概念，让我们想象一个 `alert` 组件具有以下标记：

```blade
<!-- /resources/views/components/alert.blade.php -->

<div class="alert alert-danger">
    {{ $slot }}
</div>
```

我们可以通过向组件注入内容来将内容传递给 `slot`：

```blade
<x-alert>
    <strong>Whoops!</strong> Something went wrong!
</x-alert>
```

有时一个组件可能需要在组件中的不同位置渲染多个不同的插槽。让我们修改 alert 组件以允许注入"title"插槽：

```blade
<!-- /resources/views/components/alert.blade.php -->

<span class="alert-title">{{ $title }}</span>

<div class="alert alert-danger">
    {{ $slot }}
</div>
```

你可以使用 `x-slot` 标签定义命名插槽的内容。任何不在显式 `x-slot` 标签内的内容都将通过 `$slot` 变量传递给组件：

```xml
<x-alert>
    <x-slot:title>
        Server Error
    </x-slot>

    <strong>Whoops!</strong> Something went wrong!
</x-alert>
```

你可以调用插槽的 `isEmpty` 方法来确定插槽是否包含内容：

```blade
<span class="alert-title">{{ $title }}</span>

<div class="alert alert-danger">
    @if ($slot->isEmpty())
        This is default content if the slot is empty.
    @else
        {{ $slot }}
    @endif
</div>
```

此外，`hasActualContent` 方法可用于确定插槽是否包含不是 HTML 注释的"实际"内容：

```blade
@if ($slot->hasActualContent())
    The scope has non-comment content.
@endif
```

<a name="scoped-slots"></a>
#### 作用域插槽

如果你使用过 Vue 等 JavaScript 框架，你可能熟悉"作用域插槽"，它允许你在插槽内访问组件中的数据或方法。你可以在 Laravel 中通过在组件上定义公共方法或属性，并通过 `$component` 变量在插槽内访问组件来实现类似的行为。在此示例中，我们假设 `x-alert` 组件在其组件类上定义了一个公共的 `formatAlert` 方法：

```blade
<x-alert>
    <x-slot:title>
        {{ $component->formatAlert('Server Error') }}
    </x-slot>

    <strong>Whoops!</strong> Something went wrong!
</x-alert>
```

<a name="slot-attributes"></a>
#### 插槽属性

与 Blade 组件一样，你可以为插槽分配额外的[属性](#component-attributes)，例如 CSS 类名：

```xml
<x-card class="shadow-sm">
    <x-slot:heading class="font-bold">
        Heading
    </x-slot>

    Content

    <x-slot:footer class="text-sm">
        Footer
    </x-slot>
</x-card>
```

要与插槽属性交互，你可以访问插槽变量的 `attributes` 属性。有关如何与属性交互的更多信息，请查阅[组件属性](#component-attributes)的文档：

```blade
@props([
    'heading',
    'footer',
])

<div {{ $attributes->class(['border']) }}>
    <h1 {{ $heading->attributes->class(['text-lg']) }}>
        {{ $heading }}
    </h1>

    {{ $slot }}

    <footer {{ $footer->attributes->class(['text-gray-700']) }}>
        {{ $footer }}
    </footer>
</div>
```

<a name="inline-component-views"></a>
### 内联组件视图

对于非常小的组件，同时管理组件类和组件的视图模板可能会感觉繁琐。因此，你可以直接从 `render` 方法返回组件的标记：

```php
/**
 * 获取表示组件的视图/内容。
 */
public function render(): string
{
    return <<<'blade'
        <div class="alert alert-danger">
            {{ $slot }}
        </div>
    blade;
}
```

<a name="generating-inline-view-components"></a>
#### 生成内联视图组件

要创建渲染内联视图的组件，你可以在执行 `make:component` 命令时使用 `inline` 选项：

```shell
php artisan make:component Alert --inline
```

<a name="dynamic-components"></a>
### 动态组件

有时你可能需要渲染一个组件，但在运行时才知道应该渲染哪个组件。在这种情况下，你可以使用 Laravel 内置的 `dynamic-component` 组件根据运行时值或变量来渲染组件：

```blade
// $componentName = "secondary-button";

<x-dynamic-component :component="$componentName" class="mt-4" />
```

<a name="manually-registering-components"></a>
### 手动注册组件

> [!WARNING]
> 以下关于手动注册组件的文档主要适用于那些编写包含视图组件的 Laravel 包的人。如果你不是在编写包，组件的这一部分可能与你无关。

为你的应用程序编写组件时，组件会在 `app/View/Components` 目录和 `resources/views/components` 目录中自动发现。

但是，如果你正在构建一个使用 Blade 组件的包，或者将组件放在非传统目录中，你需要手动注册你的组件类及其 HTML 标签别名，以便 Laravel 知道在哪里找到该组件。通常，你应在包的 service provider 的 `boot` 方法中注册你的组件：

```php
use Illuminate\Support\Facades\Blade;
use VendorPackage\View\Components\AlertComponent;

/**
 * 引导你的包的服务。
 */
public function boot(): void
{
    Blade::component('package-alert', AlertComponent::class);
}
```

一旦你的组件被注册，就可以使用其标签别名进行渲染：

```blade
<x-package-alert/>
```

#### 自动加载包组件

或者，你可以使用 `componentNamespace` 方法按约定自动加载组件类。例如，一个 `Nightshade` 包可能具有位于 `Package\Views\Components` 命名空间中的 `Calendar` 和 `ColorPicker` 组件：

```php
use Illuminate\Support\Facades\Blade;

/**
 * 引导你的包的服务。
 */
public function boot(): void
{
    Blade::componentNamespace('Nightshade\\Views\\Components', 'nightshade');
}
```

这将允许通过使用 `package-name::` 语法来使用供应商命名空间的包组件：

```blade
<x-nightshade::calendar />
<x-nightshade::color-picker />
```

Blade 将通过使用大驼峰命名法命名组件名称来自动检测链接到此组件的类。也支持使用"点"符号的子目录。

<a name="anonymous-components"></a>
## 匿名组件

与内联组件类似，匿名组件提供了一种通过单个文件管理组件的机制。但是，匿名组件使用单个视图文件，并且没有关联的类。要定义匿名组件，你只需将 Blade 模板放在 `resources/views/components` 目录中。例如，假设你已在 `resources/views/components/alert.blade.php` 定义了一个组件，你可以像这样简单地渲染它：

```blade
<x-alert/>
```

你可以使用 `.` 字符来指示组件是否嵌套在 `components` 目录中更深的位置。例如，假设组件定义在 `resources/views/components/inputs/button.blade.php`，你可以像这样渲染它：

```blade
<x-inputs.button/>
```

要通过 Artisan 创建匿名组件，你可以在调用 `make:component` 命令时使用 `--view` 标志：

```shell
php artisan make:component forms.input --view
```

上面的命令将在 `resources/views/components/forms/input.blade.php` 创建一个 Blade 文件，该文件可以通过 `<x-forms.input />` 作为组件渲染。

<a name="anonymous-index-components"></a>
### 匿名索引组件

有时，当一个组件由许多 Blade 模板组成时，你可能希望将给定组件的模板分组在单个目录中。例如，想象一个具有以下目录结构的"accordion"组件：

```text
/resources/views/components/accordion.blade.php
/resources/views/components/accordion/item.blade.php
```

这种目录结构允许你像这样渲染 accordion 组件及其项目：

```blade
<x-accordion>
    <x-accordion.item>
        ...
    </x-accordion.item>
</x-accordion>
```

但是，为了通过 `x-accordion` 渲染 accordion 组件，我们被迫将"索引"accordion 组件模板放在 `resources/views/components` 目录中，而不是与其他 accordion 相关模板一起嵌套在 `accordion` 目录中。

值得庆幸的是，Blade 允许你在组件目录中放置一个与组件目录名称匹配的文件。当此模板存在时，即使它嵌套在目录中，它也可以作为组件的"根"元素渲染。因此，我们可以继续使用上面示例中给出的相同 Blade 语法；但是，我们将调整目录结构如下：

```text
/resources/views/components/accordion/accordion.blade.php
/resources/views/components/accordion/item.blade.php
```

<a name="data-properties-attributes"></a>
### 数据属性 / 属性

由于匿名组件没有任何关联的类，你可能想知道如何区分哪些数据应作为变量传递给组件，以及哪些属性应放在组件的[属性包](#component-attributes)中。

你可以使用组件 Blade 模板顶部的 `@props` 指令指定哪些属性应被视为数据变量。组件上的所有其他属性将通过组件的属性包可用。如果你希望给数据变量一个默认值，可以将变量名称指定为数组键，将默认值指定为数组值：

```blade
<!-- /resources/views/components/alert.blade.php -->

@props(['type' => 'info', 'message'])

<div {{ $attributes->merge(['class' => 'alert alert-'.$type]) }}>
    {{ $message }}
</div>
```

给定上面的组件定义，我们可以像这样渲染组件：

```blade
<x-alert type="error" :message="$message" class="mb-4"/>
```

<a name="accessing-parent-data"></a>
### 访问父级数据

有时你可能希望在子组件内访问父组件的数据。在这些情况下，你可以使用 `@aware` 指令。例如，想象我们正在构建一个由父级 `<x-menu>` 和子级 `<x-menu.item>` 组成的复杂菜单组件：

```blade
<x-menu color="purple">
    <x-menu.item>...</x-menu.item>
    <x-menu.item>...</x-menu.item>
</x-menu>
```

`<x-menu>` 组件可能具有如下实现：

```blade
<!-- /resources/views/components/menu/index.blade.php -->

@props(['color' => 'gray'])

<ul {{ $attributes->merge(['class' => 'bg-'.$color.'-200']) }}>
    {{ $slot }}
</ul>
```

由于 `color` 属性只传递给了父组件（`<x-menu>`），它在 `<x-menu.item>` 内不可用。但是，如果我们使用 `@aware` 指令，我们可以使其在 `<x-menu.item>` 内部也可用：

```blade
<!-- /resources/views/components/menu/item.blade.php -->

@aware(['color' => 'gray'])

<li {{ $attributes->merge(['class' => 'text-'.$color.'-800']) }}>
    {{ $slot }}
</li>
```

> [!WARNING]
> `@aware` 指令无法访问未通过 HTML 属性显式传递给父组件的父级数据。未显式传递给父组件的默认 `@props` 值无法被 `@aware` 指令访问。

<a name="anonymous-component-paths"></a>
### 匿名组件路径

如前所述，匿名组件通常通过在 `resources/views/components` 目录中放置 Blade 模板来定义。但是，有时你可能希望在默认路径之外向 Laravel 注册其他匿名组件路径。

`anonymousComponentPath` 方法接受匿名组件位置的"路径"作为其第一个参数，以及一个可选的"命名空间"作为其第二个参数，组件应放置在该命名空间下。通常，此方法应从应用程序的[服务提供者](/docs/{{version}}/providers)之一的 `boot` 方法中调用：

```php
/**
 * 引导任何应用程序服务。
 */
public function boot(): void
{
    Blade::anonymousComponentPath(__DIR__.'/../components');
}
```

如果在没有指定前缀的情况下注册组件路径，如上例所示，它们也可以在没有相应前缀的情况下在你的 Blade 组件中渲染。例如，如果 `panel.blade.php` 组件存在于上面注册的路径中，它可以像这样渲染：

```blade
<x-panel />
```

前缀"命名空间"可以作为第二个参数提供给 `anonymousComponentPath` 方法：

```php
Blade::anonymousComponentPath(__DIR__.'/../components', 'dashboard');
```

当提供了前缀时，该"命名空间"内的组件可以通过在渲染组件时将组件的命名空间前缀添加到组件名称来渲染：

```blade
<x-dashboard::panel />
```

<a name="building-layouts"></a>
## 构建布局

<a name="layouts-using-components"></a>
### 使用组件构建布局

大多数 Web 应用程序在不同的页面上保持相同的总体布局。如果我们不得不在我们创建的每个视图中重复整个布局 HTML，那将是非常繁琐且难以维护的。值得庆幸的是，将这种布局定义为单个 [Blade 组件](#components)然后在整个应用程序中使用它是很方便的。

<a name="defining-the-layout-component"></a>
#### 定义布局组件

例如，想象我们正在构建一个"待办事项"列表应用程序。我们可能会定义一个如下所示的 `layout` 组件：

```blade
<!-- resources/views/components/layout.blade.php -->

<html>
    <head>
        <title>{{ $title ?? 'Todo Manager' }}</title>
    </head>
    <body>
        <h1>Todos</h1>
        <hr/>
        {{ $slot }}
    </body>
</html>
```

<a name="applying-the-layout-component"></a>
#### 应用布局组件

一旦定义了 `layout` 组件，我们就可以创建一个利用该组件的 Blade 视图。在此示例中，我们将定义一个显示任务列表的简单视图：

```blade
<!-- resources/views/tasks.blade.php -->

<x-layout>
    @foreach ($tasks as $task)
        <div>{{ $task }}</div>
    @endforeach
</x-layout>
```

请记住，注入到组件中的内容将提供给我们的 `layout` 组件中的默认 `$slot` 变量。你可能已经注意到，如果提供了 `$title` 插槽，我们的 `layout` 也会使用它；否则，将显示默认标题。我们可以使用[组件文档](#components)中讨论的标准插槽语法从任务列表视图中注入自定义标题：

```blade
<!-- resources/views/tasks.blade.php -->

<x-layout>
    <x-slot:title>
        Custom Title
    </x-slot>

    @foreach ($tasks as $task)
        <div>{{ $task }}</div>
    @endforeach
</x-layout>
```

现在我们已经定义了布局和任务列表视图，我们只需要从路由返回 `task` 视图：

```php
use App\Models\Task;

Route::get('/tasks', function () {
    return view('tasks', ['tasks' => Task::all()]);
});
```

<a name="layouts-using-template-inheritance"></a>
### 使用模板继承构建布局

<a name="defining-a-layout"></a>
#### 定义布局

布局也可以通过"模板继承"来创建。这是在[组件](#components)引入之前构建应用程序的主要方式。

首先，让我们看一个简单的例子。首先，我们将检查一个页面布局。由于大多数 Web 应用程序在不同的页面上保持相同的总体布局，因此将此布局定义为单个 Blade 视图很方便：

```blade
<!-- resources/views/layouts/app.blade.php -->

<html>
    <head>
        <title>App Name - @yield('title')</title>
    </head>
    <body>
        @section('sidebar')
            This is the master sidebar.
        @show

        <div class="container">
            @yield('content')
        </div>
    </body>
</html>
```

如你所见，此文件包含典型的 HTML 标记。但是，请注意 `@section` 和 `@yield` 指令。顾名思义，`@section` 指令定义了一个内容节，而 `@yield` 指令用于显示给定节的内容。

现在我们已经为应用程序定义了一个布局，让我们定义一个继承该布局的子页面。

<a name="extending-a-layout"></a>
#### 扩展布局

在定义子视图时，使用 `@extends` Blade 指令指定子视图应"继承"哪个布局。扩展 Blade 布局的视图可以使用 `@section` 指令将内容注入到布局的节中。请记住，如上面的示例所示，这些节的内容将使用 `@yield` 在布局中显示：

```blade
<!-- resources/views/child.blade.php -->

@extends('layouts.app')

@section('title', 'Page Title')

@section('sidebar')
    @@parent

    <p>This is appended to the master sidebar.</p>
@endsection

@section('content')
    <p>This is my body content.</p>
@endsection
```

在此示例中，`sidebar` 节使用 `@@parent` 指令将内容追加到布局的侧边栏（而不是覆盖）。渲染视图时，`@@parent` 指令将被布局的内容替换。

> [!NOTE]
> 与前面的示例相反，此 `sidebar` 节以 `@endsection` 而不是 `@show` 结束。`@endsection` 指令仅定义一节，而 `@show` 会定义并**立即 yield** 该节。

`@yield` 指令还接受一个默认值作为其第二个参数。如果要 yield 的节未定义，将渲染此值：

```blade
@yield('content', 'Default content')
```

<a name="forms"></a>
## 表单

<a name="csrf-field"></a>
### CSRF 字段

任何时候在应用程序中定义 HTML 表单，你都应在表单中包含一个隐藏的 CSRF 令牌字段，以便 [CSRF 保护](/docs/{{version}}/csrf)中间件可以验证请求。你可以使用 `@csrf` Blade 指令生成令牌字段：

```blade
<form method="POST" action="/profile">
    @csrf

    ...
</form>
```

<a name="method-field"></a>
### 方法字段

由于 HTML 表单无法发出 `PUT`、`PATCH` 或 `DELETE` 请求，你需要添加一个隐藏的 `_method` 字段来伪造这些 HTTP 动词。`@method` Blade 指令可以为你创建此字段：

```blade
<form action="/foo/bar" method="POST">
    @method('PUT')

    ...
</form>
```

<a name="validation-errors"></a>
### 验证错误

`@error` 指令可用于快速检查给定属性是否存在[验证错误消息](/docs/{{version}}/validation#quick-displaying-the-validation-errors)。在 `@error` 指令内，你可以输出 `$message` 变量来显示错误消息：

```blade
<!-- /resources/views/post/create.blade.php -->

<label for="title">Post Title</label>

<input
    id="title"
    type="text"
    class="@error('title') is-invalid @enderror"
/>

@error('title')
    <div class="alert alert-danger">{{ $message }}</div>
@enderror
```

由于 `@error` 指令编译为"if"语句，你可以使用 `@else` 指令在属性没有错误时渲染内容：

```blade
<!-- /resources/views/auth.blade.php -->

<label for="email">Email address</label>

<input
    id="email"
    type="email"
    class="@error('email') is-invalid @else is-valid @enderror"
/>
```

你可以将[特定错误包的名称](/docs/{{version}}/validation#named-error-bags)作为第二个参数传递给 `@error` 指令，以在包含多个表单的页面上检索验证错误消息：

```blade
<!-- /resources/views/auth.blade.php -->

<label for="email">Email address</label>

<input
    id="email"
    type="email"
    class="@error('email', 'login') is-invalid @enderror"
/>

@error('email', 'login')
    <div class="alert alert-danger">{{ $message }}</div>
@enderror
```

<a name="stacks"></a>
## 堆栈

Blade 允许你推送到命名堆栈，然后可以在另一个视图或布局的其他位置渲染。这对于指定子视图所需的任何 JavaScript 库特别有用：

```blade
@push('scripts')
    <script src="/example.js"></script>
@endpush
```

如果你希望在给定的布尔表达式评估为 `true` 时 `@push` 内容，可以使用 `@pushIf` 指令：

```blade
@pushIf($shouldPush, 'scripts')
    <script src="/example.js"></script>
@endPushIf
```

你可以根据需要多次推送到堆栈。要渲染完整的堆栈内容，将堆栈的名称传递给 `@stack` 指令：

```blade
<head>
    <!-- 头部内容 -->

    @stack('scripts')
</head>
```

如果你希望将内容前置到堆栈的开头，应使用 `@prepend` 指令：

```blade
@push('scripts')
    This will be second...
@endpush

// 稍后...

@prepend('scripts')
    This will be first...
@endprepend
```

`@hasstack` 指令可用于确定堆栈是否为空：

```blade
@hasstack('list')
    <ul>
        @stack('list')
    </ul>
@endif
```

<a name="service-injection"></a>
## 服务注入

`@inject` 指令可用于从 Laravel [服务容器](/docs/{{version}}/container)中检索服务。传递给 `@inject` 的第一个参数是服务将被放置到的变量名称，而第二个参数是你希望解析的服务的类或接口名称：

```blade
@inject('metrics', 'App\Services\MetricsService')

<div>
    Monthly Revenue: {{ $metrics->monthlyRevenue() }}.
</div>
```

<a name="rendering-inline-blade-templates"></a>
## 渲染内联 Blade 模板

有时你可能需要将原始的 Blade 模板字符串转换为有效的 HTML。你可以使用 `Blade` 门面提供的 `render` 方法来实现。`render` 方法接受 Blade 模板字符串和一个可选的数据数组提供给模板：

```php
use Illuminate\Support\Facades\Blade;

return Blade::render('Hello, {{ $name }}', ['name' => 'Julian Bashir']);
```

Laravel 通过将内联 Blade 模板写入 `storage/framework/views` 目录来渲染它们。如果你希望 Laravel 在渲染 Blade 模板后删除这些临时文件，你可以向该方法提供 `deleteCachedView` 参数：

```php
return Blade::render(
    'Hello, {{ $name }}',
    ['name' => 'Julian Bashir'],
    deleteCachedView: true
);
```

<a name="rendering-blade-fragments"></a>
## 渲染 Blade 片段

当使用 [Turbo](https://turbo.hotwired.dev/) 和 [htmx](https://htmx.org/) 等前端框架时，有时你可能只需要在 HTTP 响应中返回 Blade 模板的一部分。Blade"片段"允许你做到这一点。首先，将 Blade 模板的一部分放在 `@fragment` 和 `@endfragment` 指令中：

```blade
@fragment('user-list')
    <ul>
        @foreach ($users as $user)
            <li>{{ $user->name }}</li>
        @endforeach
    </ul>
@endfragment
```

然后，在渲染使用此模板的视图时，你可以调用 `fragment` 方法来指定只有指定的片段应包含在传出的 HTTP 响应中：

```php
return view('dashboard', ['users' => $users])->fragment('user-list');
```

`fragmentIf` 方法允许你根据给定条件有条件地返回视图的片段。否则，将返回整个视图：

```php
return view('dashboard', ['users' => $users])
    ->fragmentIf($request->hasHeader('HX-Request'), 'user-list');
```

`fragments` 和 `fragmentsIf` 方法允许你在响应中返回多个视图片段。这些片段将连接在一起：

```php
view('dashboard', ['users' => $users])
    ->fragments(['user-list', 'comment-list']);

view('dashboard', ['users' => $users])
    ->fragmentsIf(
        $request->hasHeader('HX-Request'),
        ['user-list', 'comment-list']
    );
```

<a name="extending-blade"></a>
## 扩展 Blade

Blade 允许你使用 `directive` 方法定义自己的自定义指令。当 Blade 编译器遇到自定义指令时，它将使用该指令包含的表达式调用提供的回调。

以下示例创建一个 `@datetime($var)` 指令，该指令格式化给定的 `$var`（应为 `DateTime` 的实例）：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 注册任何应用程序服务。
     */
    public function register(): void
    {
        // ...
    }

    /**
     * 引导任何应用程序服务。
     */
    public function boot(): void
    {
        Blade::directive('datetime', function (string $expression) {
            return "<?php echo ($expression)->format('m/d/Y H:i'); ?>";
        });
    }
}
```

如你所见，我们将 `format` 方法链式调用到传递给指令的任何表达式上。因此，在此示例中，此指令生成的最终 PHP 将是：

```php
<?php echo ($var)->format('m/d/Y H:i'); ?>
```

> [!WARNING]
> 更新 Blade 指令的逻辑后，你需要删除所有缓存的 Blade 视图。可以使用 `view:clear` Artisan 命令移除缓存的 Blade 视图。

<a name="custom-echo-handlers"></a>
### 自定义输出处理器

如果你尝试使用 Blade"输出"一个对象，将调用该对象的 `__toString` 方法。[__toString](https://www.php.net/manual/en/language.oop5.magic.php#object.tostring) 方法是 PHP 的内置"魔术方法"之一。但是，有时你可能无法控制给定类的 `__toString` 方法，例如当你正在交互的类属于第三方库时。

在这些情况下，Blade 允许你为该特定类型的对象注册自定义输出处理器。为此，你应调用 Blade 的 `stringable` 方法。`stringable` 方法接受一个闭包。此闭包应类型提示它负责渲染的对象类型。通常，`stringable` 方法应在应用程序的 `AppServiceProvider` 类的 `boot` 方法中调用：

```php
use Illuminate\Support\Facades\Blade;
use Money\Money;

/**
 * 引导任何应用程序服务。
 */
public function boot(): void
{
    Blade::stringable(function (Money $money) {
        return $money->formatTo('en_GB');
    });
}
```

一旦定义了自定义输出处理器，你就可以在 Blade 模板中简单地输出该对象：

```blade
Cost: {{ $money }}
```

<a name="custom-if-statements"></a>
### 自定义 If 语句

在定义简单的自定义条件语句时，编写自定义指令有时比必要的更复杂。因此，Blade 提供了一个 `Blade::if` 方法，允许你使用闭包快速定义自定义条件指令。例如，让我们定义一个检查应用程序配置的默认"磁盘"的自定义条件。我们可以在 `AppServiceProvider` 的 `boot` 方法中实现：

```php
use Illuminate\Support\Facades\Blade;

/**
 * 引导任何应用程序服务。
 */
public function boot(): void
{
    Blade::if('disk', function (string $value) {
        return config('filesystems.default') === $value;
    });
}
```

一旦定义了自定义条件，你就可以在模板中使用它：

```blade
@disk('local')
    <!-- 应用程序正在使用 local 磁盘... -->
@elsedisk('s3')
    <!-- 应用程序正在使用 s3 磁盘... -->
@else
    <!-- 应用程序正在使用其他磁盘... -->
@enddisk

@unlessdisk('local')
    <!-- 应用程序未使用 local 磁盘... -->
@enddisk
```

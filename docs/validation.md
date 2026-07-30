# 验证

- [简介](#introduction)
- [验证快速入门](#validation-quickstart)
    - [定义路由](#quick-defining-the-routes)
    - [创建控制器](#quick-creating-the-controller)
    - [编写验证逻辑](#quick-writing-the-validation-logic)
    - [显示验证错误](#quick-displaying-the-validation-errors)
    - [重新填充表单](#repopulating-forms)
    - [关于可选字段的说明](#a-note-on-optional-fields)
    - [验证错误响应格式](#validation-error-response-format)
- [表单请求验证](#form-request-validation)
    - [创建表单请求](#creating-form-requests)
    - [授权表单请求](#authorizing-form-requests)
    - [自定义错误消息](#customizing-the-error-messages)
    - [准备验证输入](#preparing-input-for-validation)
- [手动创建验证器](#manually-creating-validators)
    - [自动重定向](#automatic-redirection)
    - [命名错误包](#named-error-bags)
    - [自定义错误消息](#manual-customizing-the-error-messages)
    - [执行附加验证](#performing-additional-validation)
- [使用已验证输入](#working-with-validated-input)
- [使用错误消息](#working-with-error-messages)
    - [在语言文件中指定自定义消息](#specifying-custom-messages-in-language-files)
    - [在语言文件中指定属性](#specifying-attribute-in-language-files)
    - [在语言文件中指定值](#specifying-values-in-language-files)
- [可用验证规则](#available-validation-rules)
- [条件添加规则](#conditionally-adding-rules)
- [验证数组](#validating-arrays)
    - [验证嵌套数组输入](#validating-nested-array-input)
    - [错误消息索引和位置](#error-message-indexes-and-positions)
- [验证文件](#validating-files)
- [验证密码](#validating-passwords)
- [自定义验证规则](#custom-validation-rules)
    - [使用规则对象](#using-rule-objects)
    - [使用闭包](#using-closures)
    - [隐式规则](#implicit-rules)

<a name="introduction"></a>
## 简介

Laravel 提供了几种不同的方法来验证应用程序的传入数据。最常见的方式是使用所有传入 HTTP 请求上可用的 `validate` 方法。但我们也会讨论其他验证方法。

Laravel 包含多种方便的验证规则，你可以应用于数据，甚至可以验证值在给定数据库表中是否唯一。我们将详细介绍每种验证规则，以便你熟悉 Laravel 的所有验证功能。

<a name="validation-quickstart"></a>
## 验证快速入门

为了了解 Laravel 强大的验证功能，让我们看一个完整的示例，验证表单并将错误消息显示给用户。通过阅读这个高级概述，你将能够很好地理解如何使用 Laravel 验证传入的请求数据：

<a name="quick-defining-the-routes"></a>
### 定义路由

首先，假设我们在 `routes/web.php` 文件中定义了以下路由：

```php
use App\Http\Controllers\PostController;

Route::get('/post/create', [PostController::class, 'create']);
Route::post('/post', [PostController::class, 'store']);
```

`GET` 路由将显示一个表单供用户创建新的博客文章，而 `POST` 路由将把新的博客文章存储到数据库中。

<a name="quick-creating-the-controller"></a>
### 创建控制器

接下来，让我们看一个处理这些路由传入请求的简单控制器。我们暂时将 `store` 方法留空：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class PostController extends Controller
{
    /**
     * 显示创建新博客文章的表单。
     */
    public function create(): View
    {
        return view('post.create');
    }

    /**
     * 存储新的博客文章。
     */
    public function store(Request $request): RedirectResponse
    {
        // 验证并存储博客文章...

        $post = /** ... */

        return to_route('post.show', ['post' => $post->id]);
    }
}
```

<a name="quick-writing-the-validation-logic"></a>
### 编写验证逻辑

现在我们准备用验证新博客文章的逻辑来填充 `store` 方法。为此，我们将使用 `Illuminate\Http\Request` 对象提供的 `validate` 方法。如果验证规则通过，你的代码将正常继续执行；但如果验证失败，将抛出 `Illuminate\Validation\ValidationException` 异常，并自动将适当的错误响应发送回用户。

如果在传统的 HTTP 请求期间验证失败，将生成到先前 URL 的重定向响应。如果传入请求是 XHR 请求，将返回一个[JSON 响应，其中包含验证错误消息](#validation-error-response-format)。

为了更好地理解 `validate` 方法，让我们回到 `store` 方法：

```php
/**
 * 存储新的博客文章。
 */
public function store(Request $request): RedirectResponse
{
    $validated = $request->validate([
        'title' => ['required', 'unique:posts', 'max:255'],
        'body' => ['required'],
    ]);

    // 博客文章验证通过...

    return redirect('/posts');
}
```

如你所见，验证规则被传递到 `validate` 方法。别担心 - 所有可用的验证规则都在[文档](#available-validation-rules)中。同样，如果验证失败，将自动生成适当的响应。如果验证通过，我们的控制器将继续正常执行。

此外，你可以使用 `validateWithBag` 方法验证请求并将任何错误消息存储在[命名错误包](#named-error-bags)中：

```php
$validated = $request->validateWithBag('post', [
    'title' => ['required', 'unique:posts', 'max:255'],
    'body' => ['required'],
]);
```

<a name="stopping-on-first-validation-failure"></a>
#### 在首次验证失败时停止

有时你可能希望在第一次验证失败后停止对属性运行验证规则。为此，请将 `bail` 规则分配给该属性：

```php
$request->validate([
    'title' => ['bail', 'required', 'unique:posts', 'max:255'],
    'body' => ['required'],
]);
```

在此示例中，如果 `title` 属性的 `unique` 规则失败，则不会检查 `max` 规则。规则将按照它们被分配的顺序进行验证。

<a name="a-note-on-nested-attributes"></a>
#### 关于嵌套属性的说明

如果传入的 HTTP 请求包含"嵌套"字段数据，你可以使用"点"语法在验证规则中指定这些字段：

```php
$request->validate([
    'title' => ['required', 'unique:posts', 'max:255'],
    'author.name' => ['required'],
    'author.description' => ['required'],
]);
```

另一方面，如果你的字段名包含字面句点，你可以通过使用反斜杠转义句点来明确防止其被解释为"点"语法：

```php
$request->validate([
    'title' => ['required', 'unique:posts', 'max:255'],
    'v1\.0' => ['required'],
]);
```

<a name="quick-displaying-the-validation-errors"></a>
### 显示验证错误

那么，如果传入的请求字段未通过给定的验证规则怎么办？如前所述，Laravel 会自动将用户重定向回之前的位置。此外，所有验证错误和[请求输入](/docs/{{version}}/requests#retrieving-old-input)将自动[闪存到会话](/docs/{{version}}/session#flash-data)中。

`$errors` 变量由 `Illuminate\View\Middleware\ShareErrorsFromSession` 中间件与应用程序的所有视图共享，该中间件由 `web` 中间件组提供。当应用此中间件时，`$errors` 变量将始终在你的视图中可用，使你可以方便地假设 `$errors` 变量始终已定义并可安全使用。`$errors` 变量将是 `Illuminate\Support\MessageBag` 的一个实例。有关使用此对象的更多信息，请[查看其文档](#working-with-error-messages)。

因此，在我们的示例中，当验证失败时，用户将被重定向到我们控制器的 `create` 方法，允许我们在视图中显示错误消息：

```blade
<!-- /resources/views/post/create.blade.php -->

<h1>创建文章</h1>

@if ($errors->any())
    <div class="alert alert-danger">
        <ul>
            @foreach ($errors->all() as $error)
                <li>{{ $error }}</li>
            @endforeach
        </ul>
    </div>
@endif

<!-- 创建文章表单 -->
```

<a name="quick-customizing-the-error-messages"></a>
#### 自定义错误消息

Laravel 的内置验证规则都有位于应用程序 `lang/en/validation.php` 文件中的错误消息。如果你的应用程序没有 `lang` 目录，你可以使用 `lang:publish` Artisan 命令指示 Laravel 创建它。

在 `lang/en/validation.php` 文件中，你可以找到每个验证规则的翻译条目。你可以根据应用程序的需求自由更改或修改这些消息。

此外，你可以将此文件复制到另一个语言目录，以将消息翻译为应用程序的语言。要了解有关 Laravel 本地化的更多信息，请查看完整的[本地化文档](/docs/{{version}}/localization)。

> [!WARNING]
> 默认情况下，Laravel 应用程序骨架不包含 `lang` 目录。如果你想自定义 Laravel 的语言文件，可以通过 `lang:publish` Artisan 命令发布它们。

<a name="quick-xhr-requests-and-validation"></a>
#### XHR 请求与验证

在此示例中，我们使用传统表单将数据发送到应用程序。然而，许多应用程序接收来自 JavaScript 前端驱动的 XHR 请求。在 XHR 请求期间使用 `validate` 方法时，Laravel 不会生成重定向响应。相反，Laravel 生成一个[JSON 响应，其中包含所有验证错误](#validation-error-response-format)。此 JSON 响应将使用 422 HTTP 状态码发送。

<a name="the-at-error-directive"></a>
#### `@error` 指令

你可以使用 `@error` [Blade](/docs/{{version}}/blade) 指令快速确定给定属性是否存在验证错误消息。在 `@error` 指令内，你可以回显 `$message` 变量以显示错误消息：

```blade
<!-- /resources/views/post/create.blade.php -->

<label for="title">文章标题</label>

<input
    id="title"
    type="text"
    name="title"
    class="@error('title') is-invalid @enderror"
/>

@error('title')
    <div class="alert alert-danger">{{ $message }}</div>
@enderror
```

如果你使用[命名错误包](#named-error-bags)，可以将错误包的名称作为第二个参数传递给 `@error` 指令：

```blade
<input ... class="@error('title', 'post') is-invalid @enderror">
```

<a name="repopulating-forms"></a>
### 重新填充表单

当 Laravel 因验证错误生成重定向响应时，框架将自动[将请求的所有输入闪存到会话](/docs/{{version}}/session#flash-data)中。这样做是为了让你可以在下一个请求期间方便地访问输入，并重新填充用户尝试提交的表单。

要从上一个请求检索闪存的输入，请在 `Illuminate\Http\Request` 实例上调用 `old` 方法。`old` 方法将从[会话](/docs/{{version}}/session)中提取先前闪存的输入数据：

```php
$title = $request->old('title');
```

Laravel 还提供了一个全局的 `old` 辅助函数。如果你在 [Blade 模板](/docs/{{version}}/blade)中显示旧输入，使用 `old` 辅助函数重新填充表单更方便。如果给定字段不存在旧输入，将返回 `null`：

```blade
<input type="text" name="title" value="{{ old('title') }}">
```

<a name="a-note-on-optional-fields"></a>
### 关于可选字段的说明

默认情况下，Laravel 在应用程序的全局中间件栈中包含 `TrimStrings` 和 `ConvertEmptyStringsToNull` 中间件。因此，如果你不希望验证器将 `null` 值视为无效，通常需要将"可选"请求字段标记为 `nullable`。例如：

```php
$request->validate([
    'title' => ['required', 'unique:posts', 'max:255'],
    'body' => ['required'],
    'publish_at' => ['nullable', 'date'],
]);
```

在此示例中，我们指定 `publish_at` 字段可以是 `null` 或有效的日期表示。如果未在规则定义中添加 `nullable` 修饰符，则验证器会将 `null` 视为无效日期。

<a name="validation-error-response-format"></a>
### 验证错误响应格式

当你的应用程序抛出 `Illuminate\Validation\ValidationException` 异常且传入的 HTTP 请求期望 JSON 响应时，Laravel 将自动为你格式化错误消息并返回 `422 Unprocessable Entity` HTTP 响应。

下面，你可以查看验证错误 JSON 响应格式的示例。请注意，嵌套的错误键被展平为"点"表示法格式：

```json
{
    "message": "团队名称必须是字符串。（以及另外 4 个错误）",
    "errors": {
        "team_name": [
            "团队名称必须是字符串。",
            "团队名称必须至少为 1 个字符。"
        ],
        "authorization.role": [
            "所选 authorization.role 无效。"
        ],
        "users.0.email": [
            "users.0.email 字段是必填项。"
        ],
        "users.2.email": [
            "users.2.email 必须是有效的电子邮件地址。"
        ]
    }
}
```

<a name="form-request-validation"></a>
## 表单请求验证

<a name="creating-form-requests"></a>
### 创建表单请求

对于更复杂的验证场景，你可能希望创建一个"表单请求"。表单请求是自定义请求类，封装了它们自己的验证和授权逻辑。要创建一个表单请求类，你可以使用 `make:request` Artisan CLI 命令：

```shell
php artisan make:request StorePostRequest
```

生成的表单请求类将放置在 `app/Http/Requests` 目录中。如果此目录不存在，将在你运行 `make:request` 命令时创建。Laravel 生成的每个表单请求都有两个方法：`authorize` 和 `rules`。

正如你可能猜到的，`authorize` 方法负责确定当前认证用户是否可以执行该请求所表示的操作，而 `rules` 方法返回应应用于请求数据的验证规则：

```php
/**
 * 获取应用于请求的验证规则。
 *
 * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
 */
public function rules(): array
{
    return [
        'title' => ['required', 'unique:posts', 'max:255'],
        'body' => ['required'],
    ];
}
```

> [!NOTE]
> 你可以对 `rules` 方法签名中所需的任何依赖进行类型提示。它们将通过 Laravel 的[服务容器](/docs/{{version}}/container)自动解析。

那么，验证规则是如何评估的呢？你只需要在控制器方法中对请求进行类型提示。传入的表单请求在控制器方法被调用之前进行验证，这意味着你不需要用任何验证逻辑来混乱你的控制器：

```php
/**
 * 存储新的博客文章。
 */
public function store(StorePostRequest $request): RedirectResponse
{
    // 传入请求是有效的...

    // 获取已验证的输入数据...
    $validated = $request->validated();

    // 获取部分已验证的输入数据...
    $validated = $request->safe()->only(['name', 'email']);
    $validated = $request->safe()->except(['name', 'email']);

    // 存储博客文章...

    return redirect('/posts');
}
```

如果验证失败，将生成重定向响应，将用户发送回之前的位置。错误也将被闪存到会话中，以便它们可用于显示。如果请求是 XHR 请求，将返回包含 422 状态码的 HTTP 响应，其中包含[验证错误的 JSON 表示](#validation-error-response-format)。

> [!NOTE]
> 需要为你的 Inertia 驱动的 Laravel 前端添加实时表单请求验证？请查看 [Laravel Precognition](/docs/{{version}}/precognition)。

<a name="performing-additional-validation-on-form-requests"></a>
#### 执行附加验证

有时你需要在初始验证完成后执行附加验证。你可以使用表单请求的 `after` 方法来实现。

`after` 方法应返回一个可调用对象或闭包的数组，这些将在验证完成后被调用。给定的可调用对象将接收一个 `Illuminate\Validation\Validator` 实例，允许你在必要时引发额外的错误消息：

```php
use Illuminate\Validation\Validator;

/**
 * 获取请求的"后"验证可调用对象。
 */
public function after(): array
{
    return [
        function (Validator $validator) {
            if ($this->somethingElseIsInvalid()) {
                $validator->errors()->add(
                    'field',
                    '此字段有问题！'
                );
            }
        }
    ];
}
```

如前所述，`after` 方法返回的数组也可以包含可调用的类。这些类的 `__invoke` 方法将接收一个 `Illuminate\Validation\Validator` 实例：

```php
use App\Validation\ValidateShippingTime;
use App\Validation\ValidateUserStatus;
use Illuminate\Validation\Validator;

/**
 * 获取请求的"后"验证可调用对象。
 */
public function after(): array
{
    return [
        new ValidateUserStatus,
        new ValidateShippingTime,
        function (Validator $validator) {
            //
        }
    ];
}
```

<a name="request-stopping-on-first-validation-rule-failure"></a>
#### 在首次验证规则失败时停止

通过在请求类中添加 `StopOnFirstFailure` 属性，你可以通知验证器一旦发生单一验证失败，应停止验证所有属性：

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\Attributes\StopOnFirstFailure;
use Illuminate\Foundation\Http\FormRequest;

#[StopOnFirstFailure]
class StorePostRequest extends FormRequest
{
    // ...
}
```

<a name="request-failing-on-unknown-fields"></a>
#### 未知字段导致失败

通过在请求类中添加 `FailOnUnknownFields` 属性，你可以指示 Laravel 拒绝任何未由请求的验证规则定义的传入字段：

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\Attributes\FailOnUnknownFields;
use Illuminate\Foundation\Http\FormRequest;

#[FailOnUnknownFields]
class StorePostRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string'],
            'body' => ['required', 'string'],
        ];
    }
}
```

你也可以从 `AppServiceProvider` 中全局为所有表单请求启用此行为：

```php
use Illuminate\Foundation\Http\FormRequest;

/**
 * 引导应用程序服务。
 */
public function boot(): void
{
    FormRequest::failOnUnknownFields();
}
```

如果需要，你可以通过向属性传递 `false` 来为特定请求禁用此行为：

```php
#[FailOnUnknownFields(false)]
class PublicWebhookRequest extends FormRequest
{
    // ...
}
```

拒绝未知字段可以通过防止意外的输入键深入应用程序，为批量赋值风格的问题提供额外的保护。但是，你仍然应配置模型的 `$fillable` / `$guarded` 属性，并仅持久化受信任的、已验证的输入。

<a name="customizing-the-redirect-location"></a>
#### 自定义重定向位置

当表单请求验证失败时，将生成重定向响应，将用户发送回之前的位置。但是，你可以自由自定义此行为。为此，你可以在表单请求上使用 `RedirectTo` 属性：

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\Attributes\RedirectTo;
use Illuminate\Foundation\Http\FormRequest;

#[RedirectTo('/dashboard')]
class StorePostRequest extends FormRequest
{
    // ...
}
```

或者，如果你希望将用户重定向到命名路由，可以使用 `RedirectToRoute` 属性：

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\Attributes\RedirectToRoute;
use Illuminate\Foundation\Http\FormRequest;

#[RedirectToRoute('dashboard')]
class StorePostRequest extends FormRequest
{
    // ...
}
```

<a name="customizing-the-error-bag"></a>
#### 自定义错误包

当表单请求验证失败时，错误会被闪存到 `default` 错误包中。如果你需要将错误存储在不同的[命名错误包](#named-error-bags)中，可以在表单请求上使用 `ErrorBag` 属性：

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\Attributes\ErrorBag;
use Illuminate\Foundation\Http\FormRequest;

#[ErrorBag('login')]
class LoginRequest extends FormRequest
{
    // ...
}
```

<a name="authorizing-form-requests"></a>
### 授权表单请求

表单请求类还包含一个 `authorize` 方法。在此方法中，你可以确定已认证用户是否实际有权更新给定资源。例如，你可以确定用户是否拥有他们试图更新的博客评论。大多数情况下，你将在此方法中与你的[授权门卫和策略](/docs/{{version}}/authorization)交互：

```php
use App\Models\Comment;

/**
 * 确定用户是否有权发出此请求。
 */
public function authorize(): bool
{
    $comment = Comment::find($this->route('comment'));

    return $comment && $this->user()->can('update', $comment);
}
```

由于所有表单请求都扩展了基础的 Laravel 请求类，我们可以使用 `user` 方法来访问当前认证的用户。另外，注意上面示例中对 `route` 方法的调用。此方法使你可以访问正在调用的路由上定义的 URI 参数，例如下面示例中的 `{comment}` 参数：

```php
Route::post('/comment/{comment}');
```

因此，如果你的应用程序利用了[路由模型绑定](/docs/{{version}}/routing#route-model-binding)，你可以通过将解析后的模型作为请求的属性来访问，从而使代码更加简洁：

```php
return $this->user()->can('update', $this->comment);
```

如果 `authorize` 方法返回 `false`，将自动返回一个带有 403 状态码的 HTTP 响应，并且你的控制器方法将不会执行。

如果你计划在应用程序的其他部分处理请求的授权逻辑，你可以完全删除 `authorize` 方法，或简单地返回 `true`：

```php
/**
 * 确定用户是否有权发出此请求。
 */
public function authorize(): bool
{
    return true;
}
```

> [!NOTE]
> 你可以对 `authorize` 方法签名中所需的任何依赖进行类型提示。它们将通过 Laravel 的[服务容器](/docs/{{version}}/container)自动解析。

<a name="customizing-the-error-messages"></a>
### 自定义错误消息

你可以通过覆盖 `messages` 方法来自定义表单请求使用的错误消息。此方法应返回属性/规则对及其对应错误消息的数组：

```php
/**
 * 获取已定义验证规则的错误消息。
 *
 * @return array<string, string>
 */
public function messages(): array
{
    return [
        'title.required' => '标题是必填项',
        'body.required' => '消息是必填项',
    ];
}
```

<a name="customizing-the-validation-attributes"></a>
#### 自定义验证属性

Laravel 的许多内置验证规则错误消息包含一个 `:attribute` 占位符。如果你希望验证消息的 `:attribute` 占位符被自定义属性名称替换，你可以通过覆盖 `attributes` 方法来指定自定义名称。此方法应返回属性/名称对的数组：

```php
/**
 * 获取验证器错误的自定义属性。
 *
 * @return array<string, string>
 */
public function attributes(): array
{
    return [
        'email' => '电子邮件地址',
    ];
}
```

<a name="preparing-input-for-validation"></a>
### 准备验证输入

如果你需要在应用验证规则之前准备或清理请求中的任何数据，可以使用 `prepareForValidation` 方法：

```php
use Illuminate\Support\Str;

/**
 * 准备验证数据。
 */
protected function prepareForValidation(): void
{
    $this->merge([
        'slug' => Str::slug($this->slug),
    ]);
}
```

同样，如果你需要在验证完成后规范化任何请求数据，可以使用 `passedValidation` 方法：

```php
/**
 * 处理已通过的验证尝试。
 */
protected function passedValidation(): void
{
    $this->replace(['name' => 'Taylor']);
}
```

<a name="manually-creating-validators"></a>
## 手动创建验证器

如果你不想在请求上使用 `validate` 方法，可以使用 `Validator` [外观](/docs/{{version}}/facades)手动创建验证器实例。外观上的 `make` 方法生成一个新的验证器实例：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PostController extends Controller
{
    /**
     * 存储新的博客文章。
     */
    public function store(Request $request): RedirectResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => ['required', 'unique:posts', 'max:255'],
            'body' => ['required'],
        ]);

        if ($validator->fails()) {
            return redirect('/post/create')
                ->withErrors($validator)
                ->withInput();
        }

        // 获取已验证的输入...
        $validated = $validator->validated();

        // 获取部分已验证的输入...
        $validated = $validator->safe()->only(['name', 'email']);
        $validated = $validator->safe()->except(['name', 'email']);

        // 存储博客文章...

        return redirect('/posts');
    }
}
```

传递给 `make` 方法的第一个参数是被验证的数据。第二个参数是应应用于数据的验证规则数组。

在确定请求验证是否失败后，你可以使用 `withErrors` 方法将错误消息闪存到会话。使用此方法时，`$errors` 变量将在重定向后自动与你的视图共享，使你能够轻松地将它们显示回用户。`withErrors` 方法接受一个验证器、一个 `MessageBag` 或一个 PHP `array`。

#### 在首次验证失败时停止

`stopOnFirstFailure` 方法将通知验证器一旦发生单一验证失败，应停止验证所有属性：

```php
if ($validator->stopOnFirstFailure()->fails()) {
    // ...
}
```

<a name="automatic-redirection"></a>
### 自动重定向

如果你希望手动创建验证器实例但仍然利用 HTTP 请求的 `validate` 方法提供的自动重定向，你可以在现有验证器实例上调用 `validate` 方法。如果验证失败，用户将自动被重定向，或者对于 XHR 请求，将返回一个[JSON 响应](#validation-error-response-format)：

```php
Validator::make($request->all(), [
    'title' => ['required', 'unique:posts', 'max:255'],
    'body' => ['required'],
])->validate();
```

你可以使用 `validateWithBag` 方法在验证失败时将错误消息存储在[命名错误包](#named-error-bags)中：

```php
Validator::make($request->all(), [
    'title' => ['required', 'unique:posts', 'max:255'],
    'body' => ['required'],
])->validateWithBag('post');
```

<a name="named-error-bags"></a>
### 命名错误包

如果单个页面上有多个表单，你可能希望命名包含验证错误的 `MessageBag`，从而允许你检索特定表单的错误消息。为此，将名称作为第二个参数传递给 `withErrors`：

```php
return redirect('/register')->withErrors($validator, 'login');
```

然后，你可以从 `$errors` 变量访问命名后的 `MessageBag` 实例：

```blade
{{ $errors->login->first('email') }}
```

<a name="manual-customizing-the-error-messages"></a>
### 自定义错误消息

如果需要，你可以提供验证器实例应使用的自定义错误消息，而不是 Laravel 提供的默认错误消息。有几种方法可以指定自定义消息。首先，你可以将自定义消息作为第三个参数传递给 `Validator::make` 方法：

```php
$validator = Validator::make($input, $rules, $messages = [
    'required' => ':attribute 字段是必填项。',
]);
```

在此示例中，`:attribute` 占位符将被实际验证的字段名称替换。你还可以在验证消息中使用其他占位符。例如：

```php
$messages = [
    'same' => ':attribute 和 :other 必须匹配。',
    'size' => ':attribute 必须恰好为 :size。',
    'between' => ':attribute 的值 :input 不在 :min 到 :max 之间。',
    'in' => ':attribute 必须是以下类型之一：:values',
];
```

<a name="specifying-a-custom-message-for-a-given-attribute"></a>
#### 为给定属性指定自定义消息

有时你可能希望仅为特定属性指定自定义错误消息。你可以使用"点"表示法来实现。首先指定属性名称，后跟规则：

```php
$messages = [
    'email.required' => '我们需要知道您的电子邮件地址！',
];
```

<a name="specifying-custom-attribute-values"></a>
#### 指定自定义属性值

Laravel 的许多内置错误消息包含一个 `:attribute` 占位符，该占位符被替换为正在验证的字段或属性的名称。要自定义用于替换这些占位符的值，你可以将自定义属性数组作为第四个参数传递给 `Validator::make` 方法：

```php
$validator = Validator::make($input, $rules, $messages, [
    'email' => '电子邮件地址',
]);
```

<a name="performing-additional-validation"></a>
### 执行附加验证

有时你需要在初始验证完成后执行附加验证。你可以使用验证器的 `after` 方法来实现。`after` 方法接受一个闭包或可调用对象数组，这些将在验证完成后被调用。给定的可调用对象将接收一个 `Illuminate\Validation\Validator` 实例，允许你在必要时引发额外的错误消息：

```php
use Illuminate\Support\Facades\Validator;

$validator = Validator::make(/* ... */);

$validator->after(function ($validator) {
    if ($this->somethingElseIsInvalid()) {
        $validator->errors()->add(
            'field', '此字段有问题！'
        );
    }
});

if ($validator->fails()) {
    // ...
}
```

如前所述，`after` 方法也接受可调用对象数组，如果您的"后验证"逻辑封装在可调用类中，这特别方便，这些类将通过其 `__invoke` 方法接收一个 `Illuminate\Validation\Validator` 实例：

```php
use App\Validation\ValidateShippingTime;
use App\Validation\ValidateUserStatus;

$validator->after([
    new ValidateUserStatus,
    new ValidateShippingTime,
    function ($validator) {
        // ...
    },
]);
```

<a name="working-with-validated-input"></a>
## 使用已验证输入

在使用表单请求或手动创建的验证器实例验证传入的请求数据后，你可能希望检索实际经过验证的传入请求数据。这可以通过几种方式实现。首先，你可以在表单请求或验证器实例上调用 `validated` 方法。此方法返回已验证数据的数组：

```php
$validated = $request->validated();

$validated = $validator->validated();
```

或者，你可以在表单请求或验证器实例上调用 `safe` 方法。此方法返回一个 `Illuminate\Support\ValidatedInput` 实例。此对象公开了 `only`、`except` 和 `all` 方法，用于检索已验证数据的子集或整个已验证数据数组：

```php
$validated = $request->safe()->only(['name', 'email']);

$validated = $request->safe()->except(['name', 'email']);

$validated = $request->safe()->all();
```

此外，`Illuminate\Support\ValidatedInput` 实例可以像数组一样迭代和访问：

```php
// 已验证数据可以迭代...
foreach ($request->safe() as $key => $value) {
    // ...
}

// 已验证数据可以作为数组访问...
$validated = $request->safe();

$email = $validated['email'];
```

如果你希望向已验证数据添加额外字段，可以调用 `merge` 方法：

```php
$validated = $request->safe()->merge(['name' => 'Taylor Otwell']);
```

如果你希望将已验证的数据作为[集合](/docs/{{version}}/collections)实例检索，可以调用 `collect` 方法：

```php
$collection = $request->safe()->collect();
```

<a name="working-with-error-messages"></a>
## 使用错误消息

在 `Validator` 实例上调用 `errors` 方法后，你将收到一个 `Illuminate\Support\MessageBag` 实例，该实例具有多种方便的方法来处理错误消息。自动提供给所有视图的 `$errors` 变量也是 `MessageBag` 类的一个实例。

<a name="retrieving-the-first-error-message-for-a-field"></a>
#### 检索字段的第一条错误消息

要检索给定字段的第一条错误消息，请使用 `first` 方法：

```php
$errors = $validator->errors();

echo $errors->first('email');
```

<a name="retrieving-all-error-messages-for-a-field"></a>
#### 检索字段的所有错误消息

如果你需要检索给定字段的所有消息数组，请使用 `get` 方法：

```php
foreach ($errors->get('email') as $message) {
    // ...
}
```

如果你正在验证数组表单字段，可以使用 `*` 字符检索每个数组元素的所有消息：

```php
foreach ($errors->get('attachments.*') as $message) {
    // ...
}
```

<a name="retrieving-all-error-messages-for-all-fields"></a>
#### 检索所有字段的所有错误消息

要检索所有字段的所有消息数组，请使用 `all` 方法：

```php
foreach ($errors->all() as $message) {
    // ...
}
```

<a name="determining-if-messages-exist-for-a-field"></a>
#### 确定字段是否存在消息

`has` 方法可用于确定给定字段是否存在任何错误消息：

```php
if ($errors->has('email')) {
    // ...
}
```

<a name="specifying-custom-messages-in-language-files"></a>
### 在语言文件中指定自定义消息

Laravel 的内置验证规则都有位于应用程序 `lang/en/validation.php` 文件中的错误消息。如果你的应用程序没有 `lang` 目录，你可以使用 `lang:publish` Artisan 命令指示 Laravel 创建它。

在 `lang/en/validation.php` 文件中，你可以找到每个验证规则的翻译条目。你可以根据应用程序的需求自由更改或修改这些消息。

此外，你可以将此文件复制到另一个语言目录，以将消息翻译为应用程序的语言。要了解有关 Laravel 本地化的更多信息，请查看完整的[本地化文档](/docs/{{version}}/localization)。

> [!WARNING]
> 默认情况下，Laravel 应用程序骨架不包含 `lang` 目录。如果你想自定义 Laravel 的语言文件，可以通过 `lang:publish` Artisan 命令发布它们。

<a name="custom-messages-for-specific-attributes"></a>
#### 特定属性的自定义消息

你可以在应用程序的验证语言文件中自定义用于指定属性和规则组合的错误消息。为此，请将你的消息自定义添加到应用程序 `lang/xx/validation.php` 语言文件的 `custom` 数组中：

```php
'custom' => [
    'email' => [
        'required' => '我们需要知道您的电子邮件地址！',
        'max' => '您的电子邮件地址太长了！'
    ],
],
```

<a name="specifying-attribute-in-language-files"></a>
### 在语言文件中指定属性

Laravel 的许多内置错误消息包含一个 `:attribute` 占位符，该占位符被替换为正在验证的字段或属性的名称。如果你希望验证消息的 `:attribute` 部分被自定义值替换，你可以在 `lang/xx/validation.php` 语言文件的 `attributes` 数组中指定自定义属性名称：

```php
'attributes' => [
    'email' => '电子邮件地址',
],
```

> [!WARNING]
> 默认情况下，Laravel 应用程序骨架不包含 `lang` 目录。如果你想自定义 Laravel 的语言文件，可以通过 `lang:publish` Artisan 命令发布它们。

<a name="specifying-values-in-language-files"></a>
### 在语言文件中指定值

Laravel 的一些内置验证规则错误消息包含一个 `:value` 占位符，该占位符被替换为请求属性的当前值。但是，有时你可能需要验证消息的 `:value` 部分被值的自定义表示替换。例如，考虑以下规则，指定如果 `payment_type` 的值为 `cc`，则信用卡号是必填的：

```php
Validator::make($request->all(), [
    'credit_card_number' => ['required_if:payment_type,cc']
]);
```

如果此验证规则失败，将产生以下错误消息：

```text
当支付方式为 cc 时，信用卡号字段是必填项。
```

你可以在 `lang/xx/validation.php` 语言文件中通过定义 `values` 数组来指定更用户友好的值表示，而不是将 `cc` 显示为支付方式的值：

```php
'values' => [
    'payment_type' => [
        'cc' => '信用卡'
    ],
],
```

> [!WARNING]
> 默认情况下，Laravel 应用程序骨架不包含 `lang` 目录。如果你想自定义 Laravel 的语言文件，可以通过 `lang:publish` Artisan 命令发布它们。

在定义此值后，验证规则将产生以下错误消息：

```text
当支付方式为信用卡时，信用卡号字段是必填项。
```

<a name="available-validation-rules"></a>
## 可用验证规则

以下是所有可用验证规则及其功能的列表：

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

#### 布尔值

<div class="collection-method-list" markdown="1">

[Accepted](#rule-accepted)
[Accepted If](#rule-accepted-if)
[Boolean](#rule-boolean)
[Declined](#rule-declined)
[Declined If](#rule-declined-if)

</div>

#### 字符串

<div class="collection-method-list" markdown="1">

[Active URL](#rule-active-url)
[Alpha](#rule-alpha)
[Alpha Dash](#rule-alpha-dash)
[Alpha Numeric](#rule-alpha-num)
[Ascii](#rule-ascii)
[Confirmed](#rule-confirmed)
[Current Password](#rule-current-password)
[Different](#rule-different)
[Doesnt Start With](#rule-doesnt-start-with)
[Doesnt End With](#rule-doesnt-end-with)
[Email](#rule-email)
[Ends With](#rule-ends-with)
[Enum](#rule-enum)
[Hex Color](#rule-hex-color)
[In](#rule-in)
[IP Address](#rule-ip)
[JSON](#rule-json)
[Lowercase](#rule-lowercase)
[MAC Address](#rule-mac)
[Max](#rule-max)
[Min](#rule-min)
[Not In](#rule-not-in)
[Regular Expression](#rule-regex)
[Not Regular Expression](#rule-not-regex)
[Same](#rule-same)
[Size](#rule-size)
[Starts With](#rule-starts-with)
[String](#rule-string)
[Uppercase](#rule-uppercase)
[URL](#rule-url)
[ULID](#rule-ulid)
[UUID](#rule-uuid)

</div>

#### 数字

<div class="collection-method-list" markdown="1">

[Between](#rule-between)
[Decimal](#rule-decimal)
[Different](#rule-different)
[Digits](#rule-digits)
[Digits Between](#rule-digits-between)
[Greater Than](#rule-gt)
[Greater Than Or Equal](#rule-gte)
[Integer](#rule-integer)
[Less Than](#rule-lt)
[Less Than Or Equal](#rule-lte)
[Max](#rule-max)
[Max Digits](#rule-max-digits)
[Min](#rule-min)
[Min Digits](#rule-min-digits)
[Multiple Of](#rule-multiple-of)
[Numeric](#rule-numeric)
[Same](#rule-same)
[Size](#rule-size)

</div>

#### 数组

<div class="collection-method-list" markdown="1">

[Array](#rule-array)
[Between](#rule-between)
[Contains](#rule-contains)
[Doesnt Contain](#rule-doesnt-contain)
[Distinct](#rule-distinct)
[In Array](#rule-in-array)
[In Array Keys](#rule-in-array-keys)
[List](#rule-list)
[Max](#rule-max)
[Min](#rule-min)
[Size](#rule-size)

</div>

#### 日期

<div class="collection-method-list" markdown="1">

[After](#rule-after)
[After Or Equal](#rule-after-or-equal)
[Before](#rule-before)
[Before Or Equal](#rule-before-or-equal)
[Date](#rule-date)
[Date Equals](#rule-date-equals)
[Date Format](#rule-date-format)
[Different](#rule-different)
[Timezone](#rule-timezone)

</div>

#### 文件

<div class="collection-method-list" markdown="1">

[Between](#rule-between)
[Dimensions](#rule-dimensions)
[Encoding](#rule-encoding)
[Extensions](#rule-extensions)
[File](#rule-file)
[Image](#rule-image)
[Max](#rule-max)
[Min](#rule-min)
[MIME Types](#rule-mimetypes)
[MIME Type By File Extension](#rule-mimes)
[Size](#rule-size)

</div>

#### 数据库

<div class="collection-method-list" markdown="1">

[Exists](#rule-exists)
[Unique](#rule-unique)

</div>

#### 实用工具

<div class="collection-method-list" markdown="1">

[Any Of](#rule-anyof)
[Bail](#rule-bail)
[Exclude](#rule-exclude)
[Exclude If](#rule-exclude-if)
[Exclude Unless](#rule-exclude-unless)
[Exclude With](#rule-exclude-with)
[Exclude Without](#rule-exclude-without)
[Filled](#rule-filled)
[Missing](#rule-missing)
[Missing If](#rule-missing-if)
[Missing Unless](#rule-missing-unless)
[Missing With](#rule-missing-with)
[Missing With All](#rule-missing-with-all)
[Nullable](#rule-nullable)
[Present](#rule-present)
[Present If](#rule-present-if)
[Present Unless](#rule-present-unless)
[Present With](#rule-present-with)
[Present With All](#rule-present-with-all)
[Prohibited](#rule-prohibited)
[Prohibited If](#rule-prohibited-if)
[Prohibited If Accepted](#rule-prohibited-if-accepted)
[Prohibited If Declined](#rule-prohibited-if-declined)
[Prohibited Unless](#rule-prohibited-unless)
[Prohibits](#rule-prohibits)
[Required](#rule-required)
[Required If](#rule-required-if)
[Required If Accepted](#rule-required-if-accepted)
[Required If Declined](#rule-required-if-declined)
[Required Unless](#rule-required-unless)
[Required With](#rule-required-with)
[Required With All](#rule-required-with-all)
[Required Without](#rule-required-without)
[Required Without All](#rule-required-without-all)
[Required Array Keys](#rule-required-array-keys)
[Sometimes](#validating-when-present)

</div>

<a name="rule-accepted"></a>
#### accepted

验证中的字段必须为 `"yes"`、`"on"`、`1`、`"1"`、`true` 或 `"true"`。这对于验证"服务条款"接受或类似字段非常有用。

<a name="rule-accepted-if"></a>
#### accepted_if:anotherfield,value,...

如果另一个验证中的字段等于指定值，则验证中的字段必须为 `"yes"`、`"on"`、`1`、`"1"`、`true` 或 `"true"`。这对于验证"服务条款"接受或类似字段非常有用。

<a name="rule-active-url"></a>
#### active_url

验证中的字段必须根据 `dns_get_record` PHP 函数具有有效的 A 或 AAAA 记录。提供的 URL 的主机名使用 `parse_url` PHP 函数提取，然后传递给 `dns_get_record`。

<a name="rule-after"></a>
#### after:_date_

验证中的字段必须是给定日期之后的值。日期将被传递给 `strtotime` PHP 函数，以便转换为有效的 `DateTime` 实例：

```php
'start_date' => ['required', 'date', 'after:tomorrow']
```

你还可以指定另一个字段与日期进行比较，而不是传递要由 `strtotime` 评估的日期字符串：

```php
'finish_date' => ['required', 'date', 'after:start_date']
```

为方便起见，基于日期的规则可以使用流式 `date` 规则构建器构建：

```php
use Illuminate\Validation\Rule;

'start_date' => [
    'required',
    Rule::date()->after(today()->addDays(7)),
],
```

`afterToday` 和 `todayOrAfter` 方法可用于流式表达日期必须晚于今天、或今天及之后：

```php
'start_date' => [
    'required',
    Rule::date()->afterToday(),
],
```

<a name="rule-after-or-equal"></a>
#### after\_or\_equal:_date_

验证中的字段必须是给定日期之后或等于给定日期的值。更多信息请参见 [after](#rule-after) 规则。

为方便起见，基于日期的规则可以使用流式 `date` 规则构建器构建：

```php
use Illuminate\Validation\Rule;

'start_date' => [
    'required',
    Rule::date()->afterOrEqual(today()->addDays(7)),
],
```

<a name="rule-anyof"></a>
#### anyOf

`Rule::anyOf` 验证规则允许你指定验证中的字段必须满足任何给定的验证规则集。例如，以下规则将验证 `username` 字段是电子邮件地址或至少 6 个字符的字母数字字符串（包括破折号）：

```php
use Illuminate\Validation\Rule;

'username' => [
    'required',
    Rule::anyOf([
        ['string', 'email'],
        ['string', 'alpha_dash', 'min:6'],
    ]),
],
```

<a name="rule-alpha"></a>
#### alpha

验证中的字段必须完全由包含在 [\p{L}](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AL%3A%5D&g=&i=) 和 [\p{M}](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AM%3A%5D&g=&i=) 中的 Unicode 字母字符组成。

要将此验证规则限制为 ASCII 范围内的字符（`a-z` 和 `A-Z`），你可以为验证规则提供 `ascii` 选项：

```php
'username' => ['alpha:ascii'],
```

<a name="rule-alpha-dash"></a>
#### alpha_dash

验证中的字段必须完全由 Unicode 字母数字字符（包含在 [\p{L}](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AL%3A%5D&g=&i=)、[\p{M}](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AM%3A%5D&g=&i=)、[\p{N}](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AN%3A%5D&g=&i=) 中）以及 ASCII 破折号（`-`）和 ASCII 下划线（`_`）组成。

要将此验证规则限制为 ASCII 范围内的字符（`a-z`、`A-Z` 和 `0-9`），你可以为验证规则提供 `ascii` 选项：

```php
'username' => ['alpha_dash:ascii'],
```

<a name="rule-alpha-num"></a>
#### alpha_num

验证中的字段必须完全由 Unicode 字母数字字符组成，包含在 [\p{L}](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AL%3A%5D&g=&i=)、[\p{M}](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AM%3A%5D&g=&i=) 和 [\p{N}](https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AN%3A%5D&g=&i=) 中。

要将此验证规则限制为 ASCII 范围内的字符（`a-z`、`A-Z` 和 `0-9`），你可以为验证规则提供 `ascii` 选项：

```php
'username' => ['alpha_num:ascii'],
```

<a name="rule-array"></a>
#### array

验证中的字段必须是 PHP `array`。

当向 `array` 规则提供额外值时，输入数组中的每个键必须出现在提供给该规则的值列表中。在以下示例中，输入数组中的 `admin` 键无效，因为它不包含在提供给 `array` 规则的值列表中：

```php
use Illuminate\Support\Facades\Validator;

$input = [
    'user' => [
        'name' => 'Taylor Otwell',
        'username' => 'taylorotwell',
        'admin' => true,
    ],
];

Validator::make($input, [
    'user' => ['array:name,username'],
]);
```

一般来说，你应该始终指定允许出现在数组中的数组键。

<a name="rule-ascii"></a>
#### ascii

验证中的字段必须完全是 7 位 ASCII 字符。

<a name="rule-bail"></a>
#### bail

在首次验证失败后停止对该字段运行验证规则。

虽然 `bail` 规则只会在遇到验证失败时停止验证特定字段，但 `stopOnFirstFailure` 方法将通知验证器一旦发生单一验证失败，应停止验证所有属性：

```php
if ($validator->stopOnFirstFailure()->fails()) {
    // ...
}
```

<a name="rule-before"></a>
#### before:_date_

验证中的字段必须是给定日期之前的值。日期将被传递给 PHP `strtotime` 函数，以便转换为有效的 `DateTime` 实例。此外，与 [after](#rule-after) 规则一样，另一个验证中的字段的名称可以作为 `date` 的值提供。

为方便起见，基于日期的规则也可以使用流式 `date` 规则构建器构建：

```php
use Illuminate\Validation\Rule;

'start_date' => [
    'required',
    Rule::date()->before(today()->subDays(7)),
],
```

`beforeToday` 和 `todayOrBefore` 方法可用于流式表达日期必须早于今天、或今天及之前：

```php
'start_date' => [
    'required',
    Rule::date()->beforeToday(),
],
```

<a name="rule-before-or-equal"></a>
#### before\_or\_equal:_date_

验证中的字段必须是给定日期之前或等于给定日期的值。日期将被传递给 PHP `strtotime` 函数，以便转换为有效的 `DateTime` 实例。此外，与 [after](#rule-after) 规则一样，另一个验证中的字段的名称可以作为 `date` 的值提供。

为方便起见，基于日期的规则也可以使用流式 `date` 规则构建器构建：

```php
use Illuminate\Validation\Rule;

'start_date' => [
    'required',
    Rule::date()->beforeOrEqual(today()->subDays(7)),
],
```

<a name="rule-between"></a>
#### between:_min_,_max_

验证中的字段的大小必须在给定的 _min_ 和 _max_ 之间（包含边界）。字符串、数字、数组和文件的评估方式与 [size](#rule-size) 规则相同。

<a name="rule-boolean"></a>
#### boolean

验证中的字段必须能够转换为布尔值。接受的输入为 `true`、`false`、`1`、`0`、`"1"` 和 `"0"`。

你可以使用 `strict` 参数，仅在值为 `true` 或 `false` 时才将字段视为有效：

```php
'foo' => ['boolean:strict']
```

<a name="rule-confirmed"></a>
#### confirmed

验证中的字段必须有一个匹配的 `{field}_confirmation` 字段。例如，如果验证中的字段是 `password`，则输入中必须存在一个匹配的 `password_confirmation` 字段。

你还可以传递自定义确认字段名称。例如，`confirmed:repeat_username` 将期望 `repeat_username` 字段与验证中的字段匹配。

<a name="rule-contains"></a>
#### contains:_foo_,_bar_,...

验证中的字段必须是一个包含所有给定参数值的数组。由于此规则通常需要你 `implode` 一个数组，因此可以使用 `Rule::contains` 方法流畅地构建规则：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

Validator::make($data, [
    'roles' => [
        'required',
        'array',
        Rule::contains(['admin', 'editor']),
    ],
]);
```

<a name="rule-doesnt-contain"></a>
#### doesnt_contain:_foo_,_bar_,...

验证中的字段必须是一个不包含任何给定参数值的数组。由于此规则通常需要你 `implode` 一个数组，因此可以使用 `Rule::doesntContain` 方法流畅地构建规则：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

Validator::make($data, [
    'roles' => [
        'required',
        'array',
        Rule::doesntContain(['admin', 'editor']),
    ],
]);
```

<a name="rule-current-password"></a>
#### current_password

验证中的字段必须与认证用户的密码匹配。你可以使用规则的第一个参数指定[认证守卫](/docs/{{version}}/authentication)：

```php
'password' => ['current_password:api']
```

<a name="rule-date"></a>
#### date

验证中的字段必须是根据 `strtotime` PHP 函数有效的非相对日期。

<a name="rule-date-equals"></a>
#### date_equals:_date_

验证中的字段必须等于给定的日期。日期将被传递给 PHP `strtotime` 函数，以便转换为有效的 `DateTime` 实例。

<a name="rule-date-format"></a>
#### date_format:_format_,...

验证中的字段必须匹配给定的 _formats_ 之一。在验证字段时应使用 **either** `date` 或 `date_format`，而不是两者兼用。此验证规则支持 PHP [DateTime](https://www.php.net/manual/en/class.datetime.php) 类支持的所有格式。

为方便起见，基于日期的规则可以使用流式 `date` 规则构建器构建：

```php
use Illuminate\Validation\Rule;

'start_date' => [
    'required',
    Rule::date()->format('Y-m-d'),
],
```

<a name="rule-decimal"></a>
#### decimal:_min_,_max_

验证中的字段必须是数字，并且必须包含指定数量的小数位数：

```php
// 必须恰好有两个小数位（9.99）...
'price' => ['decimal:2']

// 必须有 2 到 4 个小数位...
'price' => ['decimal:2,4']
```

<a name="rule-declined"></a>
#### declined

验证中的字段必须为 `"no"`、`"off"`、`0`、`"0"`、`false` 或 `"false"`。

<a name="rule-declined-if"></a>
#### declined_if:anotherfield,value,...

如果另一个验证中的字段等于指定值，则验证中的字段必须为 `"no"`、`"off"`、`0`、`"0"`、`false` 或 `"false"`。

<a name="rule-different"></a>
#### different:_field_

验证中的字段必须具有与 _field_ 不同的值。

<a name="rule-digits"></a>
#### digits:_value_

验证中的整数必须具有精确的 _value_ 长度。

<a name="rule-digits-between"></a>
#### digits_between:_min_,_max_

验证中的整数的长度必须在给定的 _min_ 和 _max_ 之间。

<a name="rule-dimensions"></a>
#### dimensions

验证中的文件必须是满足规则参数指定的尺寸约束的图像：

```php
'avatar' => ['dimensions:min_width=100,min_height=200']
```

可用的约束有：_min\_width_、_max\_width_、_min\_height_、_max\_height_、_width_、_height_、_ratio_、_min\_ratio_、_max\_ratio_。

_ratio_ 约束应表示为宽度除以高度。可以通过分数如 `3/2` 或浮点数如 `1.5` 来指定：

```php
'avatar' => ['dimensions:ratio=3/2']
```

_min\_ratio_ 和 _max\_ratio_ 约束可用于定义可接受的宽高比范围：

```php
'avatar' => ['dimensions:min_ratio=1/2,max_ratio=3/2']
```

由于此规则需要多个参数，通常更方便的是使用 `Rule::dimensions` 方法流畅地构建规则：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

Validator::make($data, [
    'avatar' => [
        'required',
        Rule::dimensions()
            ->maxWidth(1000)
            ->maxHeight(500)
            ->ratio(3 / 2),
    ],
]);
```

你还可以使用 `minRatio`、`maxRatio` 和 `ratioBetween` 方法流畅地定义比例约束：

```php
Rule::dimensions()->ratioBetween(min: 1 / 2, max: 3 / 2)
```

<a name="rule-distinct"></a>
#### distinct

验证数组时，验证中的字段不能有任何重复值：

```php
'foo.*.id' => ['distinct']
```

Distinct 默认使用松散变量比较。要使用严格比较，你可以在验证规则定义中添加 `strict` 参数：

```php
'foo.*.id' => ['distinct:strict']
```

你可以向验证规则的参数添加 `ignore_case`，使规则忽略大小写差异：

```php
'foo.*.id' => ['distinct:ignore_case']
```

<a name="rule-doesnt-start-with"></a>
#### doesnt_start_with:_foo_,_bar_,...

验证中的字段不能以给定值之一开头。

<a name="rule-doesnt-end-with"></a>
#### doesnt_end_with:_foo_,_bar_,...

验证中的字段不能以给定值之一结尾。

<a name="rule-email"></a>
#### email

验证中的字段必须格式化为电子邮件地址。此验证规则使用 [egulias/email-validator](https://github.com/egulias/EmailValidator) 包来验证电子邮件地址。默认情况下，应用 `RFCValidation` 验证器，但你也可以应用其他验证样式：

```php
'email' => ['email:rfc,dns']
```

上面的示例将应用 `RFCValidation` 和 `DNSCheckValidation` 验证。以下是你可应用的所有验证样式的完整列表：

<div class="content-list" markdown="1">

- `rfc`：`RFCValidation` - 根据[支持的 RFC](https://github.com/egulias/EmailValidator?tab=readme-ov-file#supported-rfcs) 验证电子邮件地址。
- `strict`：`NoRFCWarningsValidation` - 根据[支持的 RFC](https://github.com/egulias/EmailValidator?tab=readme-ov-file#supported-rfcs) 验证电子邮件，当发现警告时失败（例如尾随句点和多个连续句点）。
- `dns`：`DNSCheckValidation` - 确保电子邮件地址的域具有有效的 MX 记录。
- `spoof`：`SpoofCheckValidation` - 确保电子邮件地址不包含同形异义字或欺骗性的 Unicode 字符。
- `filter`：`FilterEmailValidation` - 确保电子邮件地址根据 PHP 的 `filter_var` 函数有效。
- `filter_unicode`：`FilterEmailValidation::unicode()` - 确保电子邮件地址根据 PHP 的 `filter_var` 函数有效，允许某些 Unicode 字符。

</div>

为方便起见，电子邮件验证规则可以使用流式规则构建器构建：

```php
use Illuminate\Validation\Rule;

$request->validate([
    'email' => [
        'required',
        Rule::email()
            ->rfcCompliant(strict: false)
            ->validateMxRecord()
            ->preventSpoofing()
    ],
]);
```

> [!WARNING]
> `dns` 和 `spoof` 验证器需要 PHP `intl` 扩展。

<a name="rule-encoding"></a>
#### encoding:*encoding_type*

验证中的字段必须匹配指定的字符编码。此规则使用 PHP 的 `mb_check_encoding` 函数来验证给定文件或字符串值的编码。为方便起见，`encoding` 规则可以使用 Laravel 的流式文件规则构建器构建：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\File;

Validator::validate($input, [
    'attachment' => [
        'required',
        File::types(['csv'])
            ->encoding('utf-8'),
    ],
]);
```

<a name="rule-ends-with"></a>
#### ends_with:_foo_,_bar_,...

验证中的字段必须以给定值之一结尾。

<a name="rule-enum"></a>
#### enum

`Enum` 规则是一个基于类的规则，验证验证中的字段是否包含有效的枚举值。`Enum` 规则接受枚举名称作为其唯一的构造函数参数。验证原始值时，应向 `Enum` 规则提供 backed 枚举：

```php
use App\Enums\ServerStatus;
use Illuminate\Validation\Rule;

$request->validate([
    'status' => [Rule::enum(ServerStatus::class)],
]);
```

`Enum` 规则的 `only` 和 `except` 方法可用于限制哪些枚举用例应被视为有效：

```php
Rule::enum(ServerStatus::class)
    ->only([ServerStatus::Pending, ServerStatus::Active]);

Rule::enum(ServerStatus::class)
    ->except([ServerStatus::Pending, ServerStatus::Active]);
```

`when` 方法可用于有条件地修改 `Enum` 规则：

```php
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

Rule::enum(ServerStatus::class)
    ->when(
        Auth::user()->isAdmin(),
        fn ($rule) => $rule->only(...),
        fn ($rule) => $rule->only(...),
    );
```

<a name="rule-exclude"></a>
#### exclude

验证中的字段将从 `validate` 和 `validated` 方法返回的请求数据中排除。

<a name="rule-exclude-if"></a>
#### exclude_if:_anotherfield_,_value_

如果 _anotherfield_ 字段等于 _value_，则验证中的字段将从 `validate` 和 `validated` 方法返回的请求数据中排除。

如果需要复杂的条件排除逻辑，你可以使用 `Rule::excludeIf` 方法。此方法接受一个布尔值或闭包。当提供闭包时，闭包应返回 `true` 或 `false` 以指示是否应排除验证中的字段：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

Validator::make($request->all(), [
    'role_id' => [Rule::excludeIf($request->user()->is_admin)],
]);

Validator::make($request->all(), [
    'role_id' => [Rule::excludeIf(fn () => $request->user()->is_admin)],
]);
```

<a name="rule-exclude-unless"></a>
#### exclude_unless:_anotherfield_,_value_

除非 _anotherfield_ 字段等于 _value_，否则验证中的字段将从 `validate` 和 `validated` 方法返回的请求数据中排除。如果 _value_ 为 `null`（`exclude_unless:name,null`），则除非比较字段为 `null` 或比较字段从请求数据中缺失，否则将排除验证中的字段。

如果需要复杂的条件排除逻辑，你可以使用 `Rule::excludeUnless` 方法。此方法接受一个布尔值或闭包。当提供闭包时，闭包应返回 `true` 或 `false` 以指示是否不应排除验证中的字段：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

Validator::make($request->all(), [
    'role_id' => [Rule::excludeUnless($request->user()->is_admin)],
]);

Validator::make($request->all(), [
    'role_id' => [Rule::excludeUnless(fn () => $request->user()->is_admin)],
]);
```

<a name="rule-exclude-with"></a>
#### exclude_with:_anotherfield_

如果 _anotherfield_ 字段存在，则验证中的字段将从 `validate` 和 `validated` 方法返回的请求数据中排除。

<a name="rule-exclude-without"></a>
#### exclude_without:_anotherfield_

如果 _anotherfield_ 字段不存在，则验证中的字段将从 `validate` 和 `validated` 方法返回的请求数据中排除。

<a name="rule-exists"></a>
#### exists:_table_,_column_

验证中的字段必须存在于给定的数据库表中。

<a name="basic-usage-of-exists-rule"></a>
#### Exists 规则的基本用法

```php
'state' => ['exists:states']
```

如果未指定 `column` 选项，则将使用字段名称。因此，在这种情况下，规则将验证 `states` 数据库表包含一个具有 `state` 列值的记录，该值匹配请求的 `state` 属性值。

<a name="specifying-a-custom-column-name"></a>
#### 指定自定义列名

你可以通过将数据库表名放在验证规则中，后跟列名来显式指定验证规则应使用的数据库列名：

```php
'state' => ['exists:states,abbreviation']
```

有时，你可能需要指定用于 `exists` 查询的特定数据库连接。你可以通过将连接名称前置到表名来实现：

```php
'email' => ['exists:connection.staff,email']
```

你可以指定 Eloquent 模型来确定表名，而不是直接指定表名：

```php
'user_id' => ['exists:App\Models\User,id']
```

如果你希望自定义验证规则执行的查询，可以使用 `Rule` 类流畅地定义规则。

```php
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

Validator::make($data, [
    'email' => [
        'required',
        Rule::exists('staff')->where(function (Builder $query) {
            $query->where('account_id', 1);
        }),
    ],
]);
```

你可以通过将列名作为第二个参数提供给 `exists` 方法，显式指定 `Rule::exists` 方法生成的 `exists` 规则应使用的数据库列名：

```php
'state' => [Rule::exists('states', 'abbreviation')],
```

有时，你可能希望验证一组值是否存在于数据库中。你可以通过将 `exists` 和 [array](#rule-array) 规则同时添加到被验证的字段来实现：

```php
'states' => ['array', Rule::exists('states', 'abbreviation')],
```

当这两个规则都分配给一个字段时，Laravel 将自动构建一个单一的查询，以确定所有给定值是否存在于指定的表中。

<a name="rule-extensions"></a>
#### extensions:_foo_,_bar_,...

验证中的文件必须具有与列出的扩展名之一对应的用户分配扩展名：

```php
'photo' => ['required', 'extensions:jpg,png'],
```

> [!WARNING]
> 你绝不应仅依赖通过用户分配的扩展名来验证文件。此规则通常应始终与 [mimes](#rule-mimes) 或 [mimetypes](#rule-mimetypes) 规则结合使用。

<a name="rule-file"></a>
#### file

验证中的字段必须是成功上传的文件。

<a name="rule-filled"></a>
#### filled

当验证中的字段存在时，不能为空。

<a name="rule-gt"></a>
#### gt:_field_

验证中的字段必须大于给定的 _field_ 或 _value_。这两个字段必须是相同类型。字符串、数字、数组和文件的评估方式与 [size](#rule-size) 规则相同。

<a name="rule-gte"></a>
#### gte:_field_

验证中的字段必须大于或等于给定的 _field_ 或 _value_。这两个字段必须是相同类型。字符串、数字、数组和文件的评估方式与 [size](#rule-size) 规则相同。

<a name="rule-hex-color"></a>
#### hex_color

验证中的字段必须包含 [十六进制](https://developer.mozilla.org/en-US/docs/Web/CSS/hex-color) 格式的有效颜色值。

<a name="rule-image"></a>
#### image

验证中的文件必须是图像（jpg、jpeg、png、bmp、gif 或 webp）。

> [!WARNING]
> 默认情况下，由于 XSS 漏洞的可能性，图像规则不允许 SVG 文件。如果你需要允许 SVG 文件，你可以向 `image` 规则提供 `allow_svg` 指令（`image:allow_svg`）。

<a name="rule-in"></a>
#### in:_foo_,_bar_,...

验证中的字段必须包含在给定的值列表中。由于此规则通常需要你 `implode` 一个数组，因此可以使用 `Rule::in` 方法流畅地构建规则：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

Validator::make($data, [
    'zones' => [
        'required',
        Rule::in(['first-zone', 'second-zone']),
    ],
]);
```

当 `in` 规则与 `array` 规则结合时，输入数组中的每个值必须出现在提供给 `in` 规则的值列表中。在以下示例中，输入数组中的 `LAS` 机场代码无效，因为它不包含在提供给 `in` 规则的机场列表中：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

$input = [
    'airports' => ['NYC', 'LAS'],
];

Validator::make($input, [
    'airports' => [
        'required',
        'array',
    ],
    'airports.*' => Rule::in(['NYC', 'LIT']),
]);
```

<a name="rule-in-array"></a>
#### in_array:_anotherfield_.*

验证中的字段必须存在于 _anotherfield_ 的值中。

<a name="rule-in-array-keys"></a>
#### in_array_keys:_value_.*

验证中的字段必须是一个数组，且至少具有一个给定 _values_ 作为数组中的键：

```php
'config' => ['array', 'in_array_keys:timezone']
```

<a name="rule-integer"></a>
#### integer

验证中的字段必须是整数。

你可以使用 `strict` 参数，仅当字段的类型为 `integer` 时才将其视为有效。具有整数值的字符串将被视为无效：

```php
'age' => ['integer:strict']
```

> [!WARNING]
> 此验证规则不验证输入是否为"integer"变量类型，仅验证输入是否为 PHP 的 `FILTER_VALIDATE_INT` 规则接受的类型。如果你需要验证输入为数字，请将此规则与[`numeric` 验证规则](#rule-numeric)结合使用。

<a name="rule-ip"></a>
#### ip

验证中的字段必须是 IP 地址。

<a name="ipv4"></a>
#### ipv4

验证中的字段必须是 IPv4 地址。

<a name="ipv6"></a>
#### ipv6

验证中的字段必须是 IPv6 地址。

<a name="rule-json"></a>
#### json

验证中的字段必须是有效的 JSON 字符串。

<a name="rule-lt"></a>
#### lt:_field_

验证中的字段必须小于给定的 _field_。这两个字段必须是相同类型。字符串、数字、数组和文件的评估方式与 [size](#rule-size) 规则相同。

<a name="rule-lte"></a>
#### lte:_field_

验证中的字段必须小于或等于给定的 _field_。这两个字段必须是相同类型。字符串、数字、数组和文件的评估方式与 [size](#rule-size) 规则相同。

<a name="rule-lowercase"></a>
#### lowercase

验证中的字段必须为小写。

<a name="rule-list"></a>
#### list

验证中的字段必须是一个列表形式的数组。如果数组的键由从 0 到 `count($array) - 1` 的连续数字组成，则该数组被视为列表。

<a name="rule-mac"></a>
#### mac_address

验证中的字段必须是 MAC 地址。

<a name="rule-max"></a>
#### max:_value_

验证中的字段必须小于或等于最大值 _value_。字符串、数字、数组和文件的评估方式与 [size](#rule-size) 规则相同。

<a name="rule-max-digits"></a>
#### max_digits:_value_

验证中的整数的最大长度必须为 _value_。

<a name="rule-mimetypes"></a>
#### mimetypes:_text/plain_,...

验证中的文件必须匹配给定的 MIME 类型之一：

```php
'video' => ['mimetypes:video/avi,video/mpeg,video/quicktime'],

'media' => ['mimetypes:image/*,video/*'],
```

要确定上传文件的 MIME 类型，将读取文件内容，框架将尝试猜测 MIME 类型，这可能与客户端提供的 MIME 类型不同。

<a name="rule-mimes"></a>
#### mimes:_foo_,_bar_,...

验证中的文件必须具有与列出的扩展名之一对应的 MIME 类型：

```php
'photo' => ['mimes:jpg,bmp,png']
```

虽然你只需要指定扩展名，但此规则实际上通过读取文件内容并猜测其 MIME 类型来验证文件的 MIME 类型。MIME 类型及其对应扩展名的完整列表可在以下位置找到：

[https://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types](https://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types)

<a name="mime-types-and-extensions"></a>
#### MIME 类型和扩展名

此验证规则不验证 MIME 类型与用户分配给文件的扩展名之间的一致性。例如，`mimes:png` 验证规则会将包含有效 PNG 内容的文件视为有效的 PNG 图像，即使文件名为 `photo.txt`。如果你希望验证用户分配给文件的扩展名，可以使用 [extensions](#rule-extensions) 规则。

<a name="rule-min"></a>
#### min:_value_

验证中的字段必须具有最小值 _value_。字符串、数字、数组和文件的评估方式与 [size](#rule-size) 规则相同。

<a name="rule-min-digits"></a>
#### min_digits:_value_

验证中的整数的最小长度必须为 _value_。

<a name="rule-multiple-of"></a>
#### multiple_of:_value_

验证中的字段必须是 _value_ 的倍数。

<a name="rule-missing"></a>
#### missing

验证中的字段不得出现在输入数据中。

<a name="rule-missing-if"></a>
#### missing_if:_anotherfield_,_value_,...

如果 _anotherfield_ 字段等于任何 _value_，则验证中的字段不得出现。

<a name="rule-missing-unless"></a>
#### missing_unless:_anotherfield_,_value_

除非 _anotherfield_ 字段等于任何 _value_，否则验证中的字段不得出现。

<a name="rule-missing-with"></a>
#### missing_with:_foo_,_bar_,...

验证中的字段仅当任何其他指定字段存在时才不得出现。

<a name="rule-missing-with-all"></a>
#### missing_with_all:_foo_,_bar_,...

验证中的字段仅当所有其他指定字段都存在时才不得出现。

<a name="rule-not-in"></a>
#### not_in:_foo_,_bar_,...

验证中的字段不得包含在给定的值列表中。`Rule::notIn` 方法可用于流畅地构建规则：

```php
use Illuminate\Validation\Rule;

Validator::make($data, [
    'toppings' => [
        'required',
        Rule::notIn(['sprinkles', 'cherries']),
    ],
]);
```

<a name="rule-not-regex"></a>
#### not_regex:_pattern_

验证中的字段不得匹配给定的正则表达式。

在内部，此规则使用 PHP `preg_match` 函数。指定的模式应遵循 `preg_match` 所需的相同格式，因此还应包括有效的分隔符。例如：`'email' => ['not_regex:/^.+$/i']`。

<a name="rule-nullable"></a>
#### nullable

验证中的字段可以为 `null`。

<a name="rule-numeric"></a>
#### numeric

验证中的字段必须是[数字](https://www.php.net/manual/en/function.is-numeric.php)。

你可以使用 `strict` 参数，仅当值为整数或浮点类型时才将字段视为有效。数字字符串将被视为无效：

```php
'amount' => ['numeric:strict']
```

<a name="rule-present"></a>
#### present

验证中的字段必须存在于输入数据中。

<a name="rule-present-if"></a>
#### present_if:_anotherfield_,_value_,...

如果 _anotherfield_ 字段等于任何 _value_，则验证中的字段必须存在。

<a name="rule-present-unless"></a>
#### present_unless:_anotherfield_,_value_

除非 _anotherfield_ 字段等于任何 _value_，否则验证中的字段必须存在。

<a name="rule-present-with"></a>
#### present_with:_foo_,_bar_,...

验证中的字段仅当任何其他指定字段存在时才必须存在。

<a name="rule-present-with-all"></a>
#### present_with_all:_foo_,_bar_,...

验证中的字段仅当所有其他指定字段都存在时才必须存在。

<a name="rule-prohibited"></a>
#### prohibited

验证中的字段必须缺失或为空。如果满足以下条件之一，则字段为"空"：

<div class="content-list" markdown="1">

- 值为 `null`。
- 值为空字符串。
- 值为空数组或空的 `Countable` 对象。
- 值为具有空路径的上传文件。

</div>

<a name="rule-prohibited-if"></a>
#### prohibited_if:_anotherfield_,_value_,...

如果 _anotherfield_ 字段等于任何 _value_，则验证中的字段必须缺失或为空。如果满足以下条件之一，则字段为"空"：

<div class="content-list" markdown="1">

- 值为 `null`。
- 值为空字符串。
- 值为空数组或空的 `Countable` 对象。
- 值为具有空路径的上传文件。

</div>

如果需要复杂的条件禁止逻辑，你可以使用 `Rule::prohibitedIf` 方法。此方法接受一个布尔值或闭包。当提供闭包时，闭包应返回 `true` 或 `false` 以指示是否应禁止验证中的字段：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

Validator::make($request->all(), [
    'role_id' => [Rule::prohibitedIf($request->user()->is_admin)],
]);

Validator::make($request->all(), [
    'role_id' => [Rule::prohibitedIf(fn () => $request->user()->is_admin)],
]);
```

<a name="rule-prohibited-if-accepted"></a>
#### prohibited_if_accepted:_anotherfield_,...

如果 _anotherfield_ 字段等于 `"yes"`、`"on"`、`1`、`"1"`、`true` 或 `"true"`，则验证中的字段必须缺失或为空。

<a name="rule-prohibited-if-declined"></a>
#### prohibited_if_declined:_anotherfield_,...

如果 _anotherfield_ 字段等于 `"no"`、`"off"`、`0`、`"0"`、`false` 或 `"false"`，则验证中的字段必须缺失或为空。

<a name="rule-prohibited-unless"></a>
#### prohibited_unless:_anotherfield_,_value_,...

除非 _anotherfield_ 字段等于任何 _value_，否则验证中的字段必须缺失或为空。如果满足以下条件之一，则字段为"空"：

<div class="content-list" markdown="1">

- 值为 `null`。
- 值为空字符串。
- 值为空数组或空的 `Countable` 对象。
- 值为具有空路径的上传文件。

</div>

如果需要复杂的条件禁止逻辑，你可以使用 `Rule::prohibitedUnless` 方法。此方法接受一个布尔值或闭包。当提供闭包时，闭包应返回 `true` 或 `false` 以指示是否不应禁止验证中的字段：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

Validator::make($request->all(), [
    'role_id' => [Rule::prohibitedUnless($request->user()->is_admin)],
]);

Validator::make($request->all(), [
    'role_id' => [Rule::prohibitedUnless(fn () => $request->user()->is_admin)],
]);
```

<a name="rule-prohibits"></a>
#### prohibits:_anotherfield_,...

如果验证中的字段不缺失或不为空，则 _anotherfield_ 中的所有字段必须缺失或为空。如果满足以下条件之一，则字段为"空"：

<div class="content-list" markdown="1">

- 值为 `null`。
- 值为空字符串。
- 值为空数组或空的 `Countable` 对象。
- 值为具有空路径的上传文件。

</div>

<a name="rule-regex"></a>
#### regex:_pattern_

验证中的字段必须匹配给定的正则表达式。

在内部，此规则使用 PHP `preg_match` 函数。指定的模式应遵循 `preg_match` 所需的相同格式，因此还应包括有效的分隔符。例如：`'email' => ['regex:/^.+@.+$/i']`。

<a name="rule-required"></a>
#### required

验证中的字段必须存在于输入数据中且不为空。如果满足以下条件之一，则字段为"空"：

<div class="content-list" markdown="1">

- 值为 `null`。
- 值为空字符串。
- 值为空数组或空的 `Countable` 对象。
- 值为没有路径的上传文件。

</div>

<a name="rule-required-if"></a>
#### required_if:_anotherfield_,_value_,...

如果 _anotherfield_ 字段等于任何 _value_，则验证中的字段必须存在且不为空。

如果你希望为 `required_if` 规则构建更复杂的条件，可以使用 `Rule::requiredIf` 方法。此方法接受一个布尔值或闭包。当传递闭包时，闭包应返回 `true` 或 `false` 以指示验证中的字段是否为必填：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

Validator::make($request->all(), [
    'role_id' => [Rule::requiredIf($request->user()->is_admin)],
]);

Validator::make($request->all(), [
    'role_id' => [Rule::requiredIf(fn () => $request->user()->is_admin)],
]);
```

<a name="rule-required-if-accepted"></a>
#### required_if_accepted:_anotherfield_,...

如果 _anotherfield_ 字段等于 `"yes"`、`"on"`、`1`、`"1"`、`true` 或 `"true"`，则验证中的字段必须存在且不为空。

<a name="rule-required-if-declined"></a>
#### required_if_declined:_anotherfield_,...

如果 _anotherfield_ 字段等于 `"no"`、`"off"`、`0`、`"0"`、`false` 或 `"false"`，则验证中的字段必须存在且不为空。

<a name="rule-required-unless"></a>
#### required_unless:_anotherfield_,_value_,...

除非 _anotherfield_ 字段等于任何 _value_，否则验证中的字段必须存在且不为空。这也意味着除非 _value_ 为 `null`，否则 _anotherfield_ 必须存在于请求数据中。如果 _value_ 为 `null`（`required_unless:name,null`），则除非比较字段为 `null` 或比较字段从请求数据中缺失，否则验证中的字段为必填。

如果你希望为 `required_unless` 规则构建更复杂的条件，可以使用 `Rule::requiredUnless` 方法。此方法接受一个布尔值或闭包。当传递闭包时，闭包应返回 `true` 或 `false` 以指示验证中的字段是否不为必填：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

Validator::make($request->all(), [
    'role_id' => [Rule::requiredUnless($request->user()->is_admin)],
]);

Validator::make($request->all(), [
    'role_id' => [Rule::requiredUnless(fn () => $request->user()->is_admin)],
]);
```

<a name="rule-required-with"></a>
#### required_with:_foo_,_bar_,...

验证中的字段仅当任何其他指定字段存在且不为空时才必须存在且不为空。

<a name="rule-required-with-all"></a>
#### required_with_all:_foo_,_bar_,...

验证中的字段仅当所有其他指定字段存在且不为空时才必须存在且不为空。

<a name="rule-required-without"></a>
#### required_without:_foo_,_bar_,...

验证中的字段仅当任何其他指定字段为空或不不存在时才必须存在且不为空。

<a name="rule-required-without-all"></a>
#### required_without_all:_foo_,_bar_,...

验证中的字段仅当所有其他指定字段为空或不不存在时才必须存在且不为空。

<a name="rule-required-array-keys"></a>
#### required_array_keys:_foo_,_bar_,...

验证中的字段必须是一个数组，并且必须至少包含指定的键。

<a name="rule-same"></a>
#### same:_field_

给定的 _field_ 必须与验证中的字段匹配。

<a name="rule-size"></a>
#### size:_value_

验证中的字段必须具有匹配给定 _value_ 的大小。对于字符串数据，_value_ 对应于字符数。对于数字数据，_value_ 对应于给定的整数值（属性还必须具有 `numeric` 或 `integer` 规则）。对于数组，_size_ 对应于数组的 `count`。对于文件，_size_ 对应于以千字节为单位的文件大小。让我们看一些示例：

```php
// 验证字符串是否恰好为 12 个字符长...
'title' => ['size:12'];

// 验证提供的整数是否等于 10...
'seats' => ['integer', 'size:10'];

// 验证数组是否恰好有 5 个元素...
'tags' => ['array', 'size:5'];

// 验证上传的文件是否恰好为 512 千字节...
'image' => ['file', 'size:512'];
```

<a name="rule-starts-with"></a>
#### starts_with:_foo_,_bar_,...

验证中的字段必须以给定值之一开头。

<a name="rule-string"></a>
#### string

验证中的字段必须是字符串。如果你希望允许该字段也可以为 `null`，应将 `nullable` 规则分配给该字段。

为方便起见，字符串验证规则也可以使用流式 `Rule::string()` 规则构建器构建：

```php
use Illuminate\Validation\Rule;

'title' => [
    'required',
    Rule::string()
        ->min(3)
        ->max(255)
        ->alphaDash(ascii: true),
],
```

字符串规则构建器提供了常见字符串约束的方法，包括 `alpha`、`alphaDash`、`alphaNumeric`、`ascii`、`between`、`doesntEndWith`、`doesntStartWith`、`endsWith`、`exactly`、`lowercase`、`max`、`min`、`startsWith` 和 `uppercase`。由于规则构建器是可条件的，你还可以使用 `when` 和 `unless` 方法有条件地应用约束。

<a name="rule-timezone"></a>
#### timezone

验证中的字段必须是根据 `DateTimeZone::listIdentifiers` 方法的有效时区标识符。

`DateTimeZone::listIdentifiers` 方法接受的参数也可以提供给此验证规则：

```php
'timezone' => ['required', 'timezone:all'];

'timezone' => ['required', 'timezone:Africa'];

'timezone' => ['required', 'timezone:per_country,US'];
```

<a name="rule-unique"></a>
#### unique:_table_,_column_

验证中的字段不得存在于给定的数据库表中。

**指定自定义表/列名：**

你可以指定 Eloquent 模型来确定表名，而不是直接指定表名：

```php
'email' => ['unique:App\Models\User,email_address']
```

`column` 选项可用于指定字段对应的数据库列。如果未指定 `column` 选项，将使用正在验证的字段的名称。

```php
'email' => ['unique:users,email_address']
```

**指定自定义数据库连接**

有时，你可能需要为验证器执行的数据库查询设置自定义连接。为此，你可以将连接名称前置到表名：

```php
'email' => ['unique:connection.users,email_address']
```

**强制唯一规则忽略给定 ID：**

有时，你可能希望在唯一验证期间忽略给定的 ID。例如，考虑一个"更新个人资料"页面，其中包含用户的姓名、电子邮件地址和位置。你可能希望验证电子邮件地址是唯一的。但是，如果用户只更改了姓名字段而未更改电子邮件字段，你不希望抛出验证错误，因为用户已经是该电子邮件地址的拥有者。

要指示验证器忽略用户的 ID，我们将使用 `Rule` 类流畅地定义规则。

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

Validator::make($data, [
    'email' => [
        'required',
        Rule::unique('users')->ignore($user->id),
    ],
]);
```

> [!WARNING]
> 你绝不应将任何用户控制的请求输入传递给 `ignore` 方法。相反，你应仅传递系统生成的唯一 ID，例如自增 ID 或来自 Eloquent 模型实例的 UUID。否则，你的应用程序将容易受到 SQL 注入攻击。

你还可以传递整个模型实例，而不是将模型键的值传递给 `ignore` 方法。Laravel 将自动从模型中提取键：

```php
Rule::unique('users')->ignore($user)
```

如果你的表使用的主键列名不是 `id`，你可以在调用 `ignore` 方法时指定列名：

```php
Rule::unique('users')->ignore($user->id, 'user_id')
```

默认情况下，`unique` 规则将检查与正在验证的属性名称匹配的列的唯一性。但是，你可以将不同的列名作为第二个参数传递给 `unique` 方法：

```php
Rule::unique('users', 'email_address')->ignore($user->id)
```

**添加额外的 Where 子句：**

你可以使用 `where` 方法自定义查询来指定额外的查询条件。例如，让我们添加一个查询条件，将查询范围限制为仅搜索 `account_id` 列值为 `1` 的记录：

```php
'email' => Rule::unique('users')->where(fn (Builder $query) => $query->where('account_id', 1))
```

**在唯一检查中忽略软删除记录：**

默认情况下，unique 规则在确定唯一性时会包含软删除记录。要从唯一性检查中排除软删除记录，你可以调用 `withoutTrashed` 方法：

```php
Rule::unique('users')->withoutTrashed();
```

如果你的模型使用 `deleted_at` 以外的列名作为软删除记录，你可以在调用 `withoutTrashed` 方法时提供列名：

```php
Rule::unique('users')->withoutTrashed('was_deleted_at');
```

<a name="rule-uppercase"></a>
#### uppercase

验证中的字段必须为大写。

<a name="rule-url"></a>
#### url

验证中的字段必须是有效的 URL。

如果你希望指定应被视为有效的 URL 协议，可以将协议作为验证规则参数传递：

```php
'url' => ['url:http,https'],

'game' => ['url:minecraft,steam'],
```

<a name="rule-ulid"></a>
#### ulid

验证中的字段必须是有效的[通用唯一字典序可排序标识符](https://github.com/ulid/spec)（ULID）。

<a name="rule-uuid"></a>
#### uuid

验证中的字段必须是有效的 RFC 9562（版本 1、3、4、5、6、7 或 8）通用唯一标识符（UUID）。

你还可以验证给定的 UUID 是否按版本匹配 UUID 规范：

```php
'uuid' => ['uuid:4']
```

<a name="conditionally-adding-rules"></a>
## 条件添加规则

<a name="skipping-validation-when-fields-have-certain-values"></a>
#### 在字段具有特定值时跳过验证

有时你可能希望如果另一个字段具有给定值，则不验证给定字段。你可以使用 `exclude_if` 验证规则来实现。在此示例中，如果 `has_appointment` 字段的值为 `false`，则 `appointment_date` 和 `doctor_name` 字段将不被验证：

```php
use Illuminate\Support\Facades\Validator;

$validator = Validator::make($data, [
    'has_appointment' => ['required', 'boolean'],
    'appointment_date' => ['exclude_if:has_appointment,false', 'required', 'date'],
    'doctor_name' => ['exclude_if:has_appointment,false', 'required', 'string'],
]);
```

或者，你可以使用 `exclude_unless` 规则，除非另一个字段具有给定值，否则不验证给定字段：

```php
$validator = Validator::make($data, [
    'has_appointment' => ['required', 'boolean'],
    'appointment_date' => ['exclude_unless:has_appointment,true', 'required', 'date'],
    'doctor_name' => ['exclude_unless:has_appointment,true', 'required', 'string'],
]);
```

<a name="validating-when-present"></a>
#### 在字段存在时验证

在某些情况下，你可能希望仅当字段存在于正在验证的数据中时才对其运行验证检查。要快速实现此目的，请将 `sometimes` 规则添加到规则列表中：

```php
$validator = Validator::make($data, [
    'email' => ['sometimes', 'required', 'email'],
]);
```

在上面的示例中，`email` 字段仅当存在于 `$data` 数组中时才被验证。

> [!NOTE]
> 如果你正在尝试验证应始终存在但可能为空的字段，请查看[关于可选字段的说明](#a-note-on-optional-fields)。

<a name="complex-conditional-validation"></a>
#### 复杂条件验证

有时你可能希望基于更复杂的条件逻辑添加验证规则。例如，你可能希望仅当另一个字段的值大于 100 时才要求某个给定字段为必填。或者，当另一个字段存在时，两个字段才需要具有给定值。添加这些验证规则不一定很痛苦。首先，创建一个包含你的_静态规则_（永不更改）的 `Validator` 实例：

```php
use Illuminate\Support\Facades\Validator;

$validator = Validator::make($request->all(), [
    'email' => ['required', 'email'],
    'games' => ['required', 'integer', 'min:0'],
]);
```

假设我们的 Web 应用程序是面向游戏收藏者的。如果游戏收藏者注册我们的应用程序并且拥有超过 100 个游戏，我们希望他们解释为什么拥有这么多游戏。例如，也许他们经营一家游戏转售店，或者他们只是喜欢收集游戏。要有条件地添加此要求，我们可以使用 `Validator` 实例上的 `sometimes` 方法。

```php
use Illuminate\Support\Fluent;

$validator->sometimes('reason', ['required', 'max:500'], function (Fluent $input) {
    return $input->games >= 100;
});
```

传递给 `sometimes` 方法的第一个参数是我们要有条件验证的字段的名称。第二个参数是我们要添加的规则列表。如果作为第三个参数传递的闭包返回 `true`，则将添加这些规则。此方法使得构建复杂的条件验证变得轻而易举。你甚至可以一次为多个字段添加条件验证：

```php
$validator->sometimes(['reason', 'cost'], 'required', function (Fluent $input) {
    return $input->games >= 100;
});
```

> [!NOTE]
> 传递给闭包的 `$input` 参数将是 `Illuminate\Support\Fluent` 的一个实例，可用于访问你的输入和正在验证的文件。

<a name="complex-conditional-array-validation"></a>
#### 复杂条件数组验证

有时你可能希望基于同一嵌套数组中的另一个字段来验证一个字段，而你不知道其索引。在这些情况下，你可以让你的闭包接收第二个参数，该参数将是正在验证的数组中的当前单个项目：

```php
$input = [
    'channels' => [
        [
            'type' => 'email',
            'address' => 'abigail@example.com',
        ],
        [
            'type' => 'url',
            'address' => 'https://example.com',
        ],
    ],
];

$validator->sometimes('channels.*.address', 'email', function (Fluent $input, Fluent $item) {
    return $item->type === 'email';
});

$validator->sometimes('channels.*.address', 'url', function (Fluent $input, Fluent $item) {
    return $item->type !== 'email';
});
```

与传递给闭包的 `$input` 参数一样，当属性数据是数组时，`$item` 参数是 `Illuminate\Support\Fluent` 的一个实例；否则，它是字符串。

<a name="validating-arrays"></a>
## 验证数组

如[数组验证规则文档](#rule-array)中所讨论的，`array` 规则接受一个允许的数组键列表。如果数组中存在任何额外的键，验证将失败：

```php
use Illuminate\Support\Facades\Validator;

$input = [
    'user' => [
        'name' => 'Taylor Otwell',
        'username' => 'taylorotwell',
        'admin' => true,
    ],
];

Validator::make($input, [
    'user' => ['array:name,username'],
]);
```

一般来说，你应该始终指定允许出现在数组中的数组键。否则，验证器的 `validate` 和 `validated` 方法将返回所有已验证的数据，包括数组及其所有键，即使这些键未被其他嵌套数组验证规则验证。

<a name="validating-nested-array-input"></a>
### 验证嵌套数组输入

验证基于数组的嵌套表单输入字段不一定很痛苦。你可以使用"点表示法"来验证数组内的属性。例如，如果传入的 HTTP 请求包含 `photos[profile]` 字段，你可以像这样验证它：

```php
use Illuminate\Support\Facades\Validator;

$validator = Validator::make($request->all(), [
    'photos.profile' => ['required', 'image'],
]);
```

你还可以验证数组的每个元素。例如，要验证给定数组输入字段中的每个电子邮件是否唯一，你可以执行以下操作：

```php
$validator = Validator::make($request->all(), [
    'users.*.email' => ['email', 'unique:users'],
    'users.*.first_name' => ['required_with:users.*.last_name'],
]);
```

同样，你可以在指定[语言文件中的自定义验证消息](#custom-messages-for-specific-attributes)时使用 `*` 字符，从而轻松地为基于数组的字段使用单个验证消息：

```php
'custom' => [
    'users.*.email' => [
        'unique' => '每个用户必须具有唯一的电子邮件地址',
    ]
],
```

<a name="accessing-nested-array-data"></a>
#### 访问嵌套数组数据

有时你可能需要在为属性分配验证规则时访问给定嵌套数组元素的值。你可以使用 `Rule::forEach` 方法来实现。`forEach` 方法接受一个闭包，该闭包将针对正在验证的数组属性的每次迭代被调用，并将接收属性的值和明确的、完全展开的属性名称。闭包应返回要分配给数组元素的规则数组：

```php
use App\Rules\HasPermission;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

$validator = Validator::make($request->all(), [
    'companies.*.id' => Rule::forEach(function (string|null $value, string $attribute) {
        return [
            Rule::exists(Company::class, 'id'),
            new HasPermission('manage-company', $value),
        ];
    }),
]);
```

<a name="error-message-indexes-and-positions"></a>
### 错误消息索引和位置

验证数组时，你可能希望在应用程序显示的错误消息中引用特定项目的索引或位置。为此，你可以在[自定义验证消息](#manual-customizing-the-error-messages)中包含 `:index`（从 `0` 开始）、`:position`（从 `1` 开始）或 `:ordinal-position`（从 `1st` 开始）占位符：

```php
use Illuminate\Support\Facades\Validator;

$input = [
    'photos' => [
        [
            'name' => 'BeachVacation.jpg',
            'description' => '我的海滩度假照片！',
        ],
        [
            'name' => 'GrandCanyon.jpg',
            'description' => '',
        ],
    ],
];

Validator::validate($input, [
    'photos.*.description' => ['required'],
], [
    'photos.*.description.required' => '请描述照片 #:position。',
]);
```

根据上面的示例，验证将失败，用户将看到错误信息_"请描述照片 #2。"_

如有必要，你可以通过 `second-index`、`second-position`、`third-index`、`third-position` 等引用更深的嵌套索引和位置。

```php
'photos.*.attributes.*.string' => '照片 #:second-position 的属性无效。',
```

<a name="validating-files"></a>
## 验证文件

Laravel 提供了各种可用于验证上传文件的验证规则，例如 `mimes`、`image`、`min` 和 `max`。虽然你可以自由地在验证文件时单独指定这些规则，但 Laravel 还提供了一个流畅的文件验证规则构建器，你可能会觉得方便：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\File;

Validator::validate($input, [
    'attachment' => [
        'required',
        File::types(['mp3', 'wav'])
            ->min(1024)
            ->max(12 * 1024),
    ],
]);
```

<a name="validating-files-file-types"></a>
#### 验证文件类型

虽然在调用 `types` 方法时你只需要指定扩展名，但此方法实际上通过读取文件内容并猜测其 MIME 类型来验证文件的 MIME 类型。MIME 类型及其对应扩展名的完整列表可在以下位置找到：

[https://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types](https://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types)

<a name="validating-files-file-sizes"></a>
#### 验证文件大小

为方便起见，最小和最大文件大小可以指定为带有指示文件大小单位的后缀的字符串。支持 `kb`、`mb`、`gb` 和 `tb` 后缀：

```php
File::types(['mp3', 'wav'])
    ->min('1kb')
    ->max('10mb');
```

<a name="validating-files-image-files"></a>
#### 验证图像文件

如果你的应用程序接受用户上传的图像，你可以使用 `File` 规则的 `image` 构造函数方法来确保正在验证的文件是图像（jpg、jpeg、png、bmp、gif 或 webp）。

此外，`dimensions` 规则可用于限制图像的尺寸：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;

Validator::validate($input, [
    'photo' => [
        'required',
        File::image()
            ->min(1024)
            ->max(12 * 1024)
            ->dimensions(Rule::dimensions()->maxWidth(1000)->maxHeight(500)),
    ],
]);
```

> [!NOTE]
> 有关验证图像尺寸的更多信息，请参见[尺寸规则文档](#rule-dimensions)。

> [!WARNING]
> 默认情况下，由于 XSS 漏洞的可能性，`image` 规则不允许 SVG 文件。如果你需要允许 SVG 文件，可以向 `image` 规则传递 `allowSvg: true`：`File::image(allowSvg: true)`。

<a name="validating-files-image-dimensions"></a>
#### 验证图像尺寸

你还可以验证图像的尺寸。例如，要验证上传的图像宽度至少为 1000 像素且高度至少为 500 像素，你可以使用 `dimensions` 规则：

```php
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;

File::image()->dimensions(
    Rule::dimensions()
        ->maxWidth(1000)
        ->maxHeight(500)
)
```

> [!NOTE]
> 有关验证图像尺寸的更多信息，请参见[尺寸规则文档](#rule-dimensions)。

<a name="validating-passwords"></a>
## 验证密码

为了确保密码具有足够的复杂程度，你可以使用 Laravel 的 `Password` 规则对象：

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

$validator = Validator::make($request->all(), [
    'password' => ['required', 'confirmed', Password::min(8)],
]);
```

`Password` 规则对象允许你轻松自定义应用程序的密码复杂度要求，例如指定密码需要至少一个字母、数字、符号或混合大小写字符：

```php
// 要求至少 8 个字符...
Password::min(8)

// 要求至少一个字母...
Password::min(8)->letters()

// 要求至少一个大写字母和一个小写字母...
Password::min(8)->mixedCase()

// 要求至少一个数字...
Password::min(8)->numbers()

// 要求至少一个符号...
Password::min(8)->symbols()
```

此外，你可以使用 `uncompromised` 方法确保密码未在公共密码数据泄露事件中被泄露：

```php
Password::min(8)->uncompromised()
```

在内部，`Password` 规则对象使用 [k-匿名性](https://en.wikipedia.org/wiki/K-anonymity) 模型来确定密码是否已通过 [haveibeenpwned.com](https://haveibeenpwned.com) 服务泄露，而不会牺牲用户的隐私或安全。

默认情况下，如果密码在数据泄露中出现至少一次，它将被视为已泄露。你可以使用 `uncompromised` 方法的第一个参数自定义此阈值：

```php
// 确保密码在同一次数据泄露中出现少于 3 次...
Password::min(8)->uncompromised(3);
```

当然，你可以链式调用上面示例中的所有方法：

```php
Password::min(8)
    ->letters()
    ->mixedCase()
    ->numbers()
    ->symbols()
    ->uncompromised()
```

你可以使用 `toPasswordRulesString` 方法将 `Password` 规则对象转换为适用于 HTML `passwordrules` 属性的字符串：

```blade
<input
    type="password"
    name="password"
    autocomplete="new-password"
    passwordrules="{{ Password::defaults()->toPasswordRulesString() }}"
/>
```

<a name="defining-default-password-rules"></a>
#### 定义默认密码规则

你可能会发现在应用程序的单个位置指定密码的默认验证规则很方便。你可以使用 `Password::defaults` 方法轻松实现这一点，该方法接受一个闭包。提供给 `defaults` 方法的闭包应返回 Password 规则的默认配置。通常，`defaults` 规则应在应用程序的服务提供者的 `boot` 方法中调用：

```php
use Illuminate\Validation\Rules\Password;

/**
 * 引导应用程序服务。
 */
public function boot(): void
{
    Password::defaults(function () {
        $rule = Password::min(8);

        return $this->app->isProduction()
            ? $rule->mixedCase()->uncompromised()
            : $rule;
    });
}
```

然后，当你希望将默认规则应用于正在验证的特定密码时，你可以不带参数调用 `defaults` 方法：

```php
'password' => ['required', Password::defaults()],
```

有时，你可能希望将附加验证规则附加到默认密码验证规则。你可以使用 `rules` 方法来实现：

```php
use App\Rules\ZxcvbnRule;

Password::defaults(function () {
    $rule = Password::min(8)->rules([new ZxcvbnRule]);

    // ...
});
```

<a name="custom-validation-rules"></a>
## 自定义验证规则

<a name="using-rule-objects"></a>
### 使用规则对象

Laravel 提供了各种有用的验证规则；但是，你可能希望指定一些自己的规则。注册自定义验证规则的一种方法是使用规则对象。要生成新的规则对象，你可以使用 `make:rule` Artisan 命令。让我们使用此命令生成一个验证字符串是否大写的规则。Laravel 会将新规则放置在 `app/Rules` 目录中。如果此目录不存在，Laravel 将在你执行 Artisan 命令创建规则时创建它：

```shell
php artisan make:rule Uppercase
```

创建规则后，我们准备定义其行为。规则对象包含一个方法：`validate`。此方法接收属性名称、其值以及在失败时应使用验证错误消息调用的回调：

```php
<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class Uppercase implements ValidationRule
{
    /**
     * 运行验证规则。
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (strtoupper($value) !== $value) {
            $fail(':attribute 必须为大写。');
        }
    }
}
```

定义规则后，你可以通过将规则对象的实例与其他验证规则一起传递给验证器来将其附加到验证器：

```php
use App\Rules\Uppercase;

$request->validate([
    'name' => ['required', 'string', new Uppercase],
]);
```

#### 翻译验证消息

除了向 `$fail` 闭包提供字面错误消息外，你还可以提供[翻译字符串键](/docs/{{version}}/localization)并指示 Laravel 翻译错误消息：

```php
if (strtoupper($value) !== $value) {
    $fail('validation.uppercase')->translate();
}
```

如有必要，你可以将占位符替换值和首选语言作为 `translate` 方法的第一和第二个参数提供：

```php
$fail('validation.location')->translate([
    'value' => $this->value,
], 'fr');
```

#### 访问附加数据

如果你的自定义验证规则类需要访问所有正在验证的其他数据，你的规则类可以实现 `Illuminate\Contracts\Validation\DataAwareRule` 接口。此接口要求你的类定义一个 `setData` 方法。Laravel 将在（验证进行之前）自动调用此方法，并提供所有正在验证的数据：

```php
<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\DataAwareRule;
use Illuminate\Contracts\Validation\ValidationRule;

class Uppercase implements DataAwareRule, ValidationRule
{
    /**
     * 所有正在验证的数据。
     *
     * @var array<string, mixed>
     */
    protected $data = [];

    // ...

    /**
     * 设置正在验证的数据。
     *
     * @param  array<string, mixed>  $data
     */
    public function setData(array $data): static
    {
        $this->data = $data;

        return $this;
    }
}
```

或者，如果你的验证规则需要访问执行验证的验证器实例，你可以实现 `ValidatorAwareRule` 接口：

```php
<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\ValidatorAwareRule;
use Illuminate\Validation\Validator;

class Uppercase implements ValidationRule, ValidatorAwareRule
{
    /**
     * 验证器实例。
     *
     * @var \Illuminate\Validation\Validator
     */
    protected $validator;

    // ...

    /**
     * 设置当前验证器。
     */
    public function setValidator(Validator $validator): static
    {
        $this->validator = $validator;

        return $this;
    }
}
```

<a name="using-closures"></a>
### 使用闭包

如果你在应用程序中只需要使用一次自定义规则的功能，你可以使用闭包而不是规则对象。闭包接收属性的名称、属性的值以及在验证失败时应调用的 `$fail` 回调：

```php
use Illuminate\Support\Facades\Validator;
use Closure;

$validator = Validator::make($request->all(), [
    'title' => [
        'required',
        'max:255',
        function (string $attribute, mixed $value, Closure $fail) {
            if ($value === 'foo') {
                $fail("{$attribute} 无效。");
            }
        },
    ],
]);
```

<a name="implicit-rules"></a>
### 隐式规则

默认情况下，当正在验证的属性不存在或包含空字符串时，包括自定义规则在内的正常验证规则不会运行。例如，[unique](#rule-unique) 规则不会对空字符串运行：

```php
use Illuminate\Support\Facades\Validator;

$rules = ['name' => ['unique:users,name']];

$input = ['name' => ''];

Validator::make($input, $rules)->passes(); // true
```

要使自定义规则即使在属性为空时也能运行，该规则必须暗示该属性是必填的。要快速生成新的隐式规则对象，你可以使用带有 `--implicit` 选项的 `make:rule` Artisan 命令：

```shell
php artisan make:rule Uppercase --implicit
```

> [!WARNING]
> "隐式"规则仅_暗示_该属性是必填的。它是否实际使缺失或空属性无效取决于你。

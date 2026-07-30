# Precognition（预认知）

- [简介](#introduction)
- [实时验证](#live-validation)
    - [使用 Vue](#using-vue)
    - [使用 React](#using-react)
    - [使用 Alpine 和 Blade](#using-alpine)
    - [配置 Axios](#configuring-axios)
- [验证数组](#validating-arrays)
- [自定义验证规则](#customizing-validation-rules)
- [处理文件上传](#handling-file-uploads)
- [管理副作用](#managing-side-effects)
- [测试](#testing)

<a name="introduction"></a>
## 简介

Laravel Precognition（预认知）允许你预测未来 HTTP 请求的结果。Precognition 的主要用例之一是能够为你的前端 JavaScript 应用程序提供"实时"验证，而无需重复应用程序的后端验证规则。

当 Laravel 收到"预认知请求"时，它会执行路由的所有中间件并解析路由的控制器依赖项，包括验证[表单请求](/docs/{{version}}/validation#form-request-validation)——但不会实际执行路由的控制器方法。

> [!NOTE]
> 从 Inertia 2.3 开始，已内置对 Precognition 的支持。请查阅 [Inertia Forms 文档](https://inertiajs.com/forms)了解更多信息。早期版本的 Inertia 需要 Precognition 0.x。

<a name="live-validation"></a>
## 实时验证

<a name="using-vue"></a>
### 使用 Vue

使用 Laravel Precognition，你可以为用户提供实时验证体验，而无需在前端 Vue 应用程序中重复验证规则。为了说明其工作原理，让我们在应用程序中构建一个用于创建新用户的表单。

首先，要为路由启用 Precognition，应将 `HandlePrecognitiveRequests` 中间件添加到路由定义中。你还应该创建一个[表单请求](/docs/{{version}}/validation#form-request-validation)来存放路由的验证规则：

```php
use App\Http\Requests\StoreUserRequest;
use Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests;

Route::post('/users', function (StoreUserRequest $request) {
    // ...
})->middleware([HandlePrecognitiveRequests::class]);
```

接下来，你应该通过 NPM 安装适用于 Vue 的 Laravel Precognition 前端助手：

```shell
npm install laravel-precognition-vue
```

安装 Laravel Precognition 包后，你现在可以使用 Precognition 的 `useForm` 函数创建一个表单对象，提供 HTTP 方法（`post`）、目标 URL（`/users`）和初始表单数据。

然后，要启用实时验证，在每个输入的 `change` 事件上调用表单的 `validate` 方法，并提供输入的名称：

```vue
<script setup>
import { useForm } from 'laravel-precognition-vue';

const form = useForm('post', '/users', {
    name: '',
    email: '',
});

const submit = () => form.submit();
</script>

<template>
    <form @submit.prevent="submit">
        <label for="name">名称</label>
        <input
            id="name"
            v-model="form.name"
            @change="form.validate('name')"
        />
        <div v-if="form.invalid('name')">
            {{ form.errors.name }}
        </div>

        <label for="email">邮箱</label>
        <input
            id="email"
            type="email"
            v-model="form.email"
            @change="form.validate('email')"
        />
        <div v-if="form.invalid('email')">
            {{ form.errors.email }}
        </div>

        <button :disabled="form.processing">
            创建用户
        </button>
    </form>
</template>
```

现在，当用户填写表单时，Precognition 将提供由路由表单请求中的验证规则驱动的实时验证输出。当表单的输入发生变化时，会向你的 Laravel 应用程序发送一个经过防抖处理的"预认知"验证请求。你可以通过调用表单的 `setValidationTimeout` 函数来配置防抖超时时间：

```js
form.setValidationTimeout(3000);
```

当验证请求正在进行时，表单的 `validating` 属性将为 `true`：

```html
<div v-if="form.validating">
    正在验证...
</div>
```

在验证请求或表单提交期间返回的任何验证错误都将自动填充到表单的 `errors` 对象中：

```html
<div v-if="form.invalid('email')">
    {{ form.errors.email }}
</div>
```

你可以使用表单的 `hasErrors` 属性判断表单是否有任何错误：

```html
<div v-if="form.hasErrors">
    <!-- ... -->
</div>
```

你还可以通过将输入的名称分别传递给表单的 `valid` 和 `invalid` 函数来判断输入是否通过或未通过验证：

```html
<span v-if="form.valid('email')">
    ✅
</span>

<span v-else-if="form.invalid('email')">
    ❌
</span>
```

> [!WARNING]
> 表单输入只有在发生更改并收到验证响应后，才会显示为有效或无效。

如果你使用 Precognition 验证表单输入的子集，手动清除错误可能很有用。你可以使用表单的 `forgetError` 函数来实现这一点：

```html
<input
    id="avatar"
    type="file"
    @change="(e) => {
        form.avatar = e.target.files[0]

        form.forgetError('avatar')
    }"
>
```

正如我们所看到的，你可以挂载到输入的 `change` 事件上，在用户与输入交互时逐个验证输入；但是，你可能需要验证用户尚未与之交互的输入。这在构建"向导"时很常见，你希望在进入下一步之前验证所有可见输入，无论用户是否与其交互过。

要使用 Precognition 实现这一点，你应该调用 `validate` 方法，将要验证的字段名称传递给 `only` 配置键。你可以使用 `onSuccess` 或 `onValidationError` 回调来处理验证结果：

```html
<button
    type="button"
    @click="form.validate({
        only: ['name', 'email', 'phone'],
        onSuccess: (response) => nextStep(),
        onValidationError: (response) => /* ... */,
    })"
>下一步</button>
```

当然，你也可以根据表单提交的响应来执行代码。表单的 `submit` 函数返回一个 Axios 请求的 Promise。这提供了一种便捷的方式来访问响应数据、在成功提交后重置表单输入，或处理失败的请求：

```js
const submit = () => form.submit()
    .then(response => {
        form.reset();

        alert('用户创建成功。');
    })
    .catch(error => {
        alert('发生错误。');
    });
```

你可以通过检查表单的 `processing` 属性来判断表单提交请求是否正在进行：

```html
<button :disabled="form.processing">
    提交
</button>
```

<a name="using-react"></a>
### 使用 React

使用 Laravel Precognition，你可以为用户提供实时验证体验，而无需在前端 React 应用程序中重复验证规则。为了说明其工作原理，让我们在应用程序中构建一个用于创建新用户的表单。

首先，要为路由启用 Precognition，应将 `HandlePrecognitiveRequests` 中间件添加到路由定义中。你还应该创建一个[表单请求](/docs/{{version}}/validation#form-request-validation)来存放路由的验证规则：

```php
use App\Http\Requests\StoreUserRequest;
use Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests;

Route::post('/users', function (StoreUserRequest $request) {
    // ...
})->middleware([HandlePrecognitiveRequests::class]);
```

接下来，你应该通过 NPM 安装适用于 React 的 Laravel Precognition 前端助手：

```shell
npm install laravel-precognition-react
```

安装 Laravel Precognition 包后，你现在可以使用 Precognition 的 `useForm` 函数创建一个表单对象，提供 HTTP 方法（`post`）、目标 URL（`/users`）和初始表单数据。

要启用实时验证，你应该监听每个输入的 `change` 和 `blur` 事件。在 `change` 事件处理程序中，你应该使用 `setData` 函数设置表单数据，传入输入的名称和新值。然后，在 `blur` 事件处理程序中调用表单的 `validate` 方法，提供输入的名称：

```jsx
import { useForm } from 'laravel-precognition-react';

export default function Form() {
    const form = useForm('post', '/users', {
        name: '',
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();

        form.submit();
    };

    return (
        <form onSubmit={submit}>
            <label htmlFor="name">名称</label>
            <input
                id="name"
                value={form.data.name}
                onChange={(e) => form.setData('name', e.target.value)}
                onBlur={() => form.validate('name')}
            />
            {form.invalid('name') && <div>{form.errors.name}</div>}

            <label htmlFor="email">邮箱</label>
            <input
                id="email"
                value={form.data.email}
                onChange={(e) => form.setData('email', e.target.value)}
                onBlur={() => form.validate('email')}
            />
            {form.invalid('email') && <div>{form.errors.email}</div>}

            <button disabled={form.processing}>
                创建用户
            </button>
        </form>
    );
};
```

现在，当用户填写表单时，Precognition 将提供由路由表单请求中的验证规则驱动的实时验证输出。当表单的输入发生变化时，会向你的 Laravel 应用程序发送一个经过防抖处理的"预认知"验证请求。你可以通过调用表单的 `setValidationTimeout` 函数来配置防抖超时时间：

```js
form.setValidationTimeout(3000);
```

当验证请求正在进行时，表单的 `validating` 属性将为 `true`：

```jsx
{form.validating && <div>验证中...</div>}
```

在验证请求或表单提交期间返回的任何验证错误都将自动填充到表单的 `errors` 对象中：

```jsx
{form.invalid('email') && <div>{form.errors.email}</div>}
```

你可以使用表单的 `hasErrors` 属性判断表单是否有任何错误：

```jsx
{form.hasErrors && <div><!-- ... --></div>}
```

你还可以通过将输入的名称分别传递给表单的 `valid` 和 `invalid` 函数来判断输入是否通过或未通过验证：

```jsx
{form.valid('email') && <span>✅</span>}

{form.invalid('email') && <span>❌</span>}
```

> [!WARNING]
> 表单输入只有在发生更改并收到验证响应后，才会显示为有效或无效。

如果你使用 Precognition 验证表单输入的子集，手动清除错误可能很有用。你可以使用表单的 `forgetError` 函数来实现这一点：

```jsx
<input
    id="avatar"
    type="file"
    onChange={(e) => {
        form.setData('avatar', e.target.files[0]);

        form.forgetError('avatar');
    }}
>
```

正如我们所看到的，你可以挂载到输入的 `blur` 事件上，在用户与输入交互时逐个验证输入；但是，你可能需要验证用户尚未与之交互的输入。这在构建"向导"时很常见，你希望在进入下一步之前验证所有可见输入，无论用户是否与其交互过。

要使用 Precognition 实现这一点，你应该调用 `validate` 方法，将要验证的字段名称传递给 `only` 配置键。你可以使用 `onSuccess` 或 `onValidationError` 回调来处理验证结果：

```jsx
<button
    type="button"
    onClick={() => form.validate({
        only: ['name', 'email', 'phone'],
        onSuccess: (response) => nextStep(),
        onValidationError: (response) => /* ... */,
    })}
>下一步</button>
```

当然，你也可以根据表单提交的响应来执行代码。表单的 `submit` 函数返回一个 Axios 请求的 Promise。这提供了一种便捷的方式来访问响应数据、在成功提交后重置表单输入，或处理失败的请求：

```js
const submit = (e) => {
    e.preventDefault();

    form.submit()
        .then(response => {
            form.reset();

            alert('用户创建成功。');
        })
        .catch(error => {
            alert('发生错误。');
        });
};
```

你可以通过检查表单的 `processing` 属性来判断表单提交请求是否正在进行：

```html
<button disabled={form.processing}>
    提交
</button>
```

<a name="using-alpine"></a>
### 使用 Alpine 和 Blade

使用 Laravel Precognition，你可以为用户提供实时验证体验，而无需在前端 Alpine 应用程序中重复验证规则。为了说明其工作原理，让我们在应用程序中构建一个用于创建新用户的表单。

首先，要为路由启用 Precognition，应将 `HandlePrecognitiveRequests` 中间件添加到路由定义中。你还应该创建一个[表单请求](/docs/{{version}}/validation#form-request-validation)来存放路由的验证规则：

```php
use App\Http\Requests\CreateUserRequest;
use Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests;

Route::post('/users', function (CreateUserRequest $request) {
    // ...
})->middleware([HandlePrecognitiveRequests::class]);
```

接下来，你应该通过 NPM 安装适用于 Alpine 的 Laravel Precognition 前端助手：

```shell
npm install laravel-precognition-alpine
```

然后，在你的 `resources/js/app.js` 文件中将 Precognition 插件注册到 Alpine：

```js
import Alpine from 'alpinejs';
import Precognition from 'laravel-precognition-alpine';

window.Alpine = Alpine;

Alpine.plugin(Precognition);
Alpine.start();
```

安装并注册 Laravel Precognition 包后，你现在可以使用 Precognition 的 `$form` "魔法方法"创建一个表单对象，提供 HTTP 方法（`post`）、目标 URL（`/users`）和初始表单数据。

要启用实时验证，你应该将表单数据绑定到相应的输入，然后监听每个输入的 `change` 事件。在 `change` 事件处理程序中，你应该调用表单的 `validate` 方法，提供输入的名称：

```html
<form x-data="{
    form: $form('post', '/register', {
        name: '',
        email: '',
    }),
}">
    @csrf
    <label for="name">名称</label>
    <input
        id="name"
        name="name"
        x-model="form.name"
        @change="form.validate('name')"
    />
    <template x-if="form.invalid('name')">
        <div x-text="form.errors.name"></div>
    </template>

    <label for="email">邮箱</label>
    <input
        id="email"
        name="email"
        x-model="form.email"
        @change="form.validate('email')"
    />
    <template x-if="form.invalid('email')">
        <div x-text="form.errors.email"></div>
    </template>

    <button :disabled="form.processing">
        创建用户
    </button>
</form>
```

现在，当用户填写表单时，Precognition 将提供由路由表单请求中的验证规则驱动的实时验证输出。当表单的输入发生变化时，会向你的 Laravel 应用程序发送一个经过防抖处理的"预认知"验证请求。你可以通过调用表单的 `setValidationTimeout` 函数来配置防抖超时时间：

```js
form.setValidationTimeout(3000);
```

当验证请求正在进行时，表单的 `validating` 属性将为 `true`：

```html
<template x-if="form.validating">
    <div>验证中...</div>
</template>
```

在验证请求或表单提交期间返回的任何验证错误都将自动填充到表单的 `errors` 对象中：

```html
<template x-if="form.invalid('email')">
    <div x-text="form.errors.email"></div>
</template>
```

你可以使用表单的 `hasErrors` 属性判断表单是否有任何错误：

```html
<template x-if="form.hasErrors">
    <div><!-- ... --></div>
</template>
```

你还可以通过将输入的名称分别传递给表单的 `valid` 和 `invalid` 函数来判断输入是否通过或未通过验证：

```html
<template x-if="form.valid('email')">
    <span>✅</span>
</template>

<template x-if="form.invalid('email')">
    <span>❌</span>
</template>
```

> [!WARNING]
> 表单输入只有在发生更改并收到验证响应后，才会显示为有效或无效。

正如我们所看到的，你可以挂载到输入的 `change` 事件上，在用户与输入交互时逐个验证输入；但是，你可能需要验证用户尚未与之交互的输入。这在构建"向导"时很常见，你希望在进入下一步之前验证所有可见输入，无论用户是否与其交互过。

要使用 Precognition 实现这一点，你应该调用 `validate` 方法，将要验证的字段名称传递给 `only` 配置键。你可以使用 `onSuccess` 或 `onValidationError` 回调来处理验证结果：

```html
<button
    type="button"
    @click="form.validate({
        only: ['name', 'email', 'phone'],
        onSuccess: (response) => nextStep(),
        onValidationError: (response) => /* ... */,
    })"
>下一步</button>
```

你可以通过检查表单的 `processing` 属性来判断表单提交请求是否正在进行：

```html
<button :disabled="form.processing">
    提交
</button>
```

<a name="repopulating-old-form-data"></a>
#### 重新填充旧表单数据

在上面讨论的用户创建示例中，我们使用 Precognition 进行实时验证；但是，我们正在执行传统的服务器端表单提交来提交表单。因此，表单应使用从服务器端表单提交返回的任何"旧"输入和验证错误进行填充：

```html
<form x-data="{
    form: $form('post', '/register', {
        name: '{{ old('name') }}',
        email: '{{ old('email') }}',
    }).setErrors({{ Js::from($errors->messages()) }}),
}">
```

或者，如果你希望通过 XHR 提交表单，可以使用表单的 `submit` 函数，该函数返回一个 Axios 请求的 Promise：

```html
<form
    x-data="{
        form: $form('post', '/register', {
            name: '',
            email: '',
        }),
        submit() {
            this.form.submit()
                .then(response => {
                    this.form.reset();

                    alert('用户创建成功。')
                })
                .catch(error => {
                    alert('发生错误。');
                });
        },
    }"
    @submit.prevent="submit"
>
```

<a name="configuring-axios"></a>
### 配置 Axios

Precognition 验证库使用 [Axios](https://github.com/axios/axios) HTTP 客户端向应用程序的后端发送请求。为方便起见，如果应用程序需要，可以对 Axios 实例进行自定义。例如，使用 `laravel-precognition-vue` 库时，你可以在应用程序的 `resources/js/app.js` 文件中为每个传出请求添加额外的请求头：

```js
import { client } from 'laravel-precognition-vue';

client.axios().defaults.headers.common['Authorization'] = authToken;
```

或者，如果你已经为应用程序配置了 Axios 实例，你可以告诉 Precognition 使用该实例：

```js
import Axios from 'axios';
import { client } from 'laravel-precognition-vue';

window.axios = Axios.create()
window.axios.defaults.headers.common['Authorization'] = authToken;

client.use(window.axios)
```

<a name="validating-arrays"></a>
## 验证数组

你可以使用通配符来验证数组或嵌套对象中的字段。每个 `*` 匹配一个路径段：

```js
// 验证数组中所有用户的邮箱...
form.validate('users.*.email');

// 验证 profile 对象中的所有字段...
form.validate('profile.*');

// 验证所有用户的所有字段...
form.validate('users.*.*');
```

<a name="customizing-validation-rules"></a>
## 自定义验证规则

通过使用请求的 `isPrecognitive` 方法，可以自定义在预认知请求期间执行的验证规则。

例如，在用户创建表单上，我们可能只想在最终提交表单时验证密码是否"未泄露"。对于预认知验证请求，我们只需验证密码为必填且至少 8 个字符。使用 `isPrecognitive` 方法，我们可以自定义表单请求定义的规则：

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    /**
     * 获取适用于请求的验证规则。
     *
     * @return array
     */
    protected function rules()
    {
        return [
            'password' => [
                'required',
                $this->isPrecognitive()
                    ? Password::min(8)
                    : Password::min(8)->uncompromised(),
            ],
            // ...
        ];
    }
}
```

<a name="handling-file-uploads"></a>
## 处理文件上传

默认情况下，Laravel Precognition 在预认知验证请求期间不会上传或验证文件。这确保了大文件不会不必要地被多次上传。

由于这种行为，你应该确保你的应用程序[自定义相应表单请求的验证规则](#customizing-validation-rules)，以指定该字段仅在完整表单提交时才为必填：

```php
/**
 * 获取适用于请求的验证规则。
 *
 * @return array
 */
protected function rules()
{
    return [
        'avatar' => [
            ...$this->isPrecognitive() ? [] : ['required'],
            'image',
            'mimes:jpg,png',
            'dimensions:ratio=3/2',
        ],
        // ...
    ];
}
```

如果你希望在每个验证请求中都包含文件，可以在客户端表单实例上调用 `validateFiles` 函数：

```js
form.validateFiles();
```

<a name="managing-side-effects"></a>
## 管理副作用

当将 `HandlePrecognitiveRequests` 中间件添加到路由时，你应该考虑在_其他_中间件中是否存在任何应在预认知请求期间跳过的副作用。

例如，你可能有一个中间件会递增每个用户在应用程序中的"交互"总数，但你可能不希望将预认知请求计为一次交互。为此，我们可以在递增交互计数之前检查请求的 `isPrecognitive` 方法：

```php
<?php

namespace App\Http\Middleware;

use App\Facades\Interaction;
use Closure;
use Illuminate\Http\Request;

class InteractionMiddleware
{
    /**
     * 处理传入的请求。
     */
    public function handle(Request $request, Closure $next): mixed
    {
        if (! $request->isPrecognitive()) {
            Interaction::incrementFor($request->user());
        }

        return $next($request);
    }
}
```

<a name="testing"></a>
## 测试

如果你希望在测试中发送预认知请求，Laravel 的 `TestCase` 包含一个 `withPrecognition` 辅助方法，它会添加 `Precognition` 请求头。

此外，如果你希望断言预认知请求成功（例如，未返回任何验证错误），可以在响应上使用 `assertSuccessfulPrecognition` 方法：

```php tab=Pest
it('使用预认知验证注册表单', function () {
    $response = $this->withPrecognition()
        ->post('/register', [
            'name' => 'Taylor Otwell',
        ]);

    $response->assertSuccessfulPrecognition();

    expect(User::count())->toBe(0);
});
```

```php tab=PHPUnit
public function test_it_validates_registration_form_with_precognition()
{
    $response = $this->withPrecognition()
        ->post('/register', [
            'name' => 'Taylor Otwell',
        ]);

    $response->assertSuccessfulPrecognition();
    $this->assertSame(0, User::count());
}
```

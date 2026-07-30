# 入门套件

- [简介](#introduction)
- [使用入门套件创建应用](#creating-an-application)
- [可用的入门套件](#available-starter-kits)
    - [React](#react)
    - [Svelte](#svelte)
    - [Vue](#vue)
    - [Livewire](#livewire)
- [入门套件自定义](#starter-kit-customization)
    - [React](#react-customization)
    - [Svelte](#svelte-customization)
    - [Vue](#vue-customization)
    - [Livewire](#livewire-customization)
- [身份验证](#authentication)
    - [启用和禁用功能](#enabling-and-disabling-features)
    - [自定义用户创建和密码重置](#customizing-actions)
    - [双因素认证](#two-factor-authentication)
    - [频率限制](#rate-limiting)
- [团队](#teams)
- [WorkOS AuthKit 身份验证](#workos)
- [Inertia SSR](#inertia-ssr)
- [社区维护的入门套件](#community-maintained-starter-kits)
- [常见问题](#faqs)

<a name="introduction"></a>
## 简介

为了让您更快地构建新的 Laravel 应用，我们很高兴提供[应用入门套件](https://laravel.com/starter-kits)。这些入门套件为您构建下一个 Laravel 应用提供了先机，并包含注册和验证应用用户所需的路由、控制器和视图。入门套件使用 [Laravel Fortify](/docs/{{version}}/fortify) 提供身份验证。

虽然欢迎您使用这些入门套件，但它们并非必需。您可以通过简单地安装一份全新的 Laravel 来从头构建自己的应用。无论哪种方式，我们知道您都会构建出很棒的东西！

<a name="creating-an-application"></a>
## 使用入门套件创建应用

要使用我们的某个入门套件创建新的 Laravel 应用，您应首先[安装 PHP 和 Laravel CLI 工具](/docs/{{version}}/installation#installing-php)。如果您已经安装了 PHP 和 Composer，可以通过 Composer 安装 Laravel 安装器 CLI 工具：

```shell
composer global require laravel/installer
```

然后，使用 Laravel 安装器 CLI 创建一个新的 Laravel 应用。Laravel 安装器将提示您选择偏好的入门套件：

```shell
laravel new my-app
```

创建 Laravel 应用后，您只需通过 NPM 安装前端依赖并启动 Laravel 开发服务器：

```shell
cd my-app
npm install && npm run build
composer run dev
```

启动 Laravel 开发服务器后，您的应用将在浏览器中通过 [http://localhost:8000](http://localhost:8000) 访问。

<a name="available-starter-kits"></a>
## 可用的入门套件

<a name="react"></a>
### React

我们的 React 入门套件为使用 [Inertia](https://inertiajs.com) 构建具有 React 前端的 Laravel 应用提供了一个健壮、现代的起点。

Inertia 允许您使用传统的服务器端路由和控制器构建现代的单页 React 应用。这使您可以同时享受 React 的前端能力与 Laravel 令人难以置信的后端生产力以及极快的 Vite 编译速度。

React 入门套件使用 React 19、TypeScript、Tailwind 和 [shadcn/ui](https://ui.shadcn.com) 组件库。

<a name="svelte"></a>
### Svelte

我们的 Svelte 入门套件为使用 [Inertia](https://inertiajs.com) 构建具有 Svelte 前端的 Laravel 应用提供了一个健壮、现代的起点。

Inertia 允许您使用传统的服务器端路由和控制器构建现代的单页 Svelte 应用。这使您可以同时享受 Svelte 的前端能力与 Laravel 令人难以置信的后端生产力以及极快的 Vite 编译速度。

Svelte 入门套件使用 Svelte 5、TypeScript、Tailwind 和 [shadcn-svelte](https://www.shadcn-svelte.com/) 组件库。

<a name="vue"></a>
### Vue

我们的 Vue 入门套件为使用 [Inertia](https://inertiajs.com) 构建具有 Vue 前端的 Laravel 应用提供了一个很好的起点。

Inertia 允许您使用传统的服务器端路由和控制器构建现代的单页 Vue 应用。这使您可以同时享受 Vue 的前端能力与 Laravel 令人难以置信的后端生产力以及极快的 Vite 编译速度。

Vue 入门套件使用 Vue Composition API、TypeScript、Tailwind 和 [shadcn-vue](https://www.shadcn-vue.com/) 组件库。

<a name="livewire"></a>
### Livewire

我们的 Livewire 入门套件为构建具有 [Laravel Livewire](https://livewire.laravel.com) 前端的 Laravel 应用提供了完美的起点。

Livewire 是一种仅使用 PHP 构建动态、响应式前端 UI 的强大方式。它非常适合主要使用 Blade 模板并寻求 JavaScript 驱动的 SPA 框架（如 React、Svelte 和 Vue）的更简单替代方案的团队。

Livewire 入门套件使用 Livewire、Tailwind 和 [Flux UI](https://fluxui.dev) 组件库。

<a name="starter-kit-customization"></a>
## 入门套件自定义

<a name="react-customization"></a>
### React

我们的 React 入门套件使用 Inertia 3、React 19、Tailwind 4 和 [shadcn/ui](https://ui.shadcn.com) 构建。与我们所有的入门套件一样，所有后端和前端代码都存在于您的应用中，以允许完全自定义。

大部分前端代码位于 `resources/js` 目录中。您可以自由修改任何代码来自定义应用的外观和行为：

```text
resources/js/
├── components/    # 可复用的 React 组件
├── hooks/         # React hooks
├── layouts/       # 应用布局
├── lib/           # 工具函数和配置
├── pages/         # 页面组件
└── types/         # TypeScript 定义
```

要发布额外的 shadcn 组件，首先[找到您要发布的组件](https://ui.shadcn.com)。然后，使用 `npx` 发布该组件：

```shell
npx shadcn@latest add switch
```

在此示例中，该命令会将 Switch 组件发布到 `resources/js/components/ui/switch.tsx`。组件发布后，您可以在任何页面中使用它：

```jsx
import { Switch } from "@/components/ui/switch"

const MyPage = () => {
  return (
    <div>
      <Switch />
    </div>
  );
};

export default MyPage;
```

<a name="react-available-layouts"></a>
#### 可用的布局

React 入门套件包含两种不同的主要布局供您选择："侧边栏"布局和"页头"布局。侧边栏布局是默认布局，但您可以通过修改应用 `resources/js/layouts/app-layout.tsx` 文件顶部导入的布局来切换到页头布局：

```js
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout'; // [tl! remove]
import AppLayoutTemplate from '@/layouts/app/app-header-layout'; // [tl! add]
```

<a name="react-sidebar-variants"></a>
#### 侧边栏变体

侧边栏布局包含三种不同的变体：默认侧边栏变体、"inset"变体和"floating"变体。您可以通过修改 `resources/js/components/app-sidebar.tsx` 组件来选择您最喜欢的变体：

```text
<Sidebar collapsible="icon" variant="sidebar"> [tl! remove]
<Sidebar collapsible="icon" variant="inset"> [tl! add]
```

<a name="react-authentication-page-layout-variants"></a>
#### 身份验证页面布局变体

React 入门套件附带的身份验证页面（如登录页面和注册页面）也提供三种不同的布局变体："simple"、"card"和"split"。

要更改您的身份验证布局，请修改应用 `resources/js/layouts/auth-layout.tsx` 文件顶部导入的布局：

```js
import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout'; // [tl! remove]
import AuthLayoutTemplate from '@/layouts/auth/auth-split-layout'; // [tl! add]
```

<a name="svelte-customization"></a>
### Svelte

我们的 Svelte 入门套件使用 Inertia 3、Svelte 5、Tailwind 和 [shadcn-svelte](https://www.shadcn-svelte.com/) 构建。与我们所有的入门套件一样，所有后端和前端代码都存在于您的应用中，以允许完全自定义。

大部分前端代码位于 `resources/js` 目录中。您可以自由修改任何代码来自定义应用的外观和行为：

```text
resources/js/
├── components/    # 可复用的 Svelte 组件
├── layouts/       # 应用布局
├── lib/           # 工具函数和配置以及 Svelte rune 模块
├── pages/         # 页面组件
└── types/         # TypeScript 定义
```

要发布额外的 shadcn-svelte 组件，首先[找到您要发布的组件](https://www.shadcn-svelte.com)。然后，使用 `npx` 发布该组件：

```shell
npx shadcn-svelte@latest add switch
```

在此示例中，该命令会将 Switch 组件发布到 `resources/js/components/ui/switch/switch.svelte`。组件发布后，您可以在任何页面中使用它：

```svelte
<script lang="ts">
    import { Switch } from '@/components/ui/switch'
</script>

<div>
    <Switch />
</div>
```

<a name="svelte-available-layouts"></a>
#### 可用的布局

Svelte 入门套件包含两种不同的主要布局供您选择："侧边栏"布局和"页头"布局。侧边栏布局是默认布局，但您可以通过修改应用 `resources/js/layouts/AppLayout.svelte` 文件顶部导入的布局来切换到页头布局：

```js
import AppLayout from '@/layouts/app/AppSidebarLayout.svelte'; // [tl! remove]
import AppLayout from '@/layouts/app/AppHeaderLayout.svelte'; // [tl! add]
```

<a name="svelte-sidebar-variants"></a>
#### 侧边栏变体

侧边栏布局包含三种不同的变体：默认侧边栏变体、"inset"变体和"floating"变体。您可以通过修改 `resources/js/components/AppSidebar.svelte` 组件来选择您最喜欢的变体：

```text
<Sidebar collapsible="icon" variant="sidebar"> [tl! remove]
<Sidebar collapsible="icon" variant="inset"> [tl! add]
```

<a name="svelte-authentication-page-layout-variants"></a>
#### 身份验证页面布局变体

Svelte 入门套件附带的身份验证页面（如登录页面和注册页面）也提供三种不同的布局变体："simple"、"card"和"split"。

要更改您的身份验证布局，请修改应用 `resources/js/layouts/AuthLayout.svelte` 文件顶部导入的布局：

```js
import AuthLayout from '@/layouts/auth/AuthSimpleLayout.svelte'; // [tl! remove]
import AuthLayout from '@/layouts/auth/AuthSplitLayout.svelte'; // [tl! add]
```

<a name="vue-customization"></a>
### Vue

我们的 Vue 入门套件使用 Inertia 3、Vue 3 Composition API、Tailwind 和 [shadcn-vue](https://www.shadcn-vue.com/) 构建。与我们所有的入门套件一样，所有后端和前端代码都存在于您的应用中，以允许完全自定义。

大部分前端代码位于 `resources/js` 目录中。您可以自由修改任何代码来自定义应用的外观和行为：

```text
resources/js/
├── components/    # 可复用的 Vue 组件
├── composables/   # Vue composables / hooks
├── layouts/       # 应用布局
├── lib/           # 工具函数和配置
├── pages/         # 页面组件
└── types/         # TypeScript 定义
```

要发布额外的 shadcn-vue 组件，首先[找到您要发布的组件](https://www.shadcn-vue.com)。然后，使用 `npx` 发布该组件：

```shell
npx shadcn-vue@latest add switch
```

在此示例中，该命令会将 Switch 组件发布到 `resources/js/components/ui/Switch.vue`。组件发布后，您可以在任何页面中使用它：

```vue
<script setup lang="ts">
import { Switch } from '@/components/ui/switch'
</script>

<template>
    <div>
        <Switch />
    </div>
</template>
```

<a name="vue-available-layouts"></a>
#### 可用的布局

Vue 入门套件包含两种不同的主要布局供您选择："侧边栏"布局和"页头"布局。侧边栏布局是默认布局，但您可以通过修改应用 `resources/js/layouts/AppLayout.vue` 文件顶部导入的布局来切换到页头布局：

```js
import AppLayout from '@/layouts/app/AppSidebarLayout.vue'; // [tl! remove]
import AppLayout from '@/layouts/app/AppHeaderLayout.vue'; // [tl! add]
```

<a name="vue-sidebar-variants"></a>
#### 侧边栏变体

侧边栏布局包含三种不同的变体：默认侧边栏变体、"inset"变体和"floating"变体。您可以通过修改 `resources/js/components/AppSidebar.vue` 组件来选择您最喜欢的变体：

```text
<Sidebar collapsible="icon" variant="sidebar"> [tl! remove]
<Sidebar collapsible="icon" variant="inset"> [tl! add]
```

<a name="vue-authentication-page-layout-variants"></a>
#### 身份验证页面布局变体

Vue 入门套件附带的身份验证页面（如登录页面和注册页面）也提供三种不同的布局变体："simple"、"card"和"split"。

要更改您的身份验证布局，请修改应用 `resources/js/layouts/AuthLayout.vue` 文件顶部导入的布局：

```js
import AuthLayout from '@/layouts/auth/AuthSimpleLayout.vue'; // [tl! remove]
import AuthLayout from '@/layouts/auth/AuthSplitLayout.vue'; // [tl! add]
```

<a name="livewire-customization"></a>
### Livewire

我们的 Livewire 入门套件使用 Livewire 4、Tailwind 和 [Flux UI](https://fluxui.dev/) 构建。与我们所有的入门套件一样，所有后端和前端代码都存在于您的应用中，以允许完全自定义。

大部分前端代码位于 `resources/views` 目录中。您可以自由修改任何代码来自定义应用的外观和行为：

```text
resources/views
├── components            # 可复用的组件
├── flux                  # 自定义的 Flux 组件
├── layouts               # 应用布局
├── pages                 # Livewire 页面
├── partials              # 可复用的 Blade 局部视图
├── dashboard.blade.php   # 已验证用户仪表盘
├── welcome.blade.php     # 游客欢迎页面
```

<a name="livewire-available-layouts"></a>
#### 可用的布局

Livewire 入门套件包含两种不同的主要布局供您选择："侧边栏"布局和"页头"布局。侧边栏布局是默认布局，但您可以通过修改应用 `resources/views/layouts/app.blade.php` 文件使用的布局来切换到页头布局。此外，您还应在主要的 Flux 组件中添加 `container` 属性：

```blade
<x-layouts::app.header>
    <flux:main container>
        {{ $slot }}
    </flux:main>
</x-layouts::app.header>
```

<a name="livewire-authentication-page-layout-variants"></a>
#### 身份验证页面布局变体

Livewire 入门套件附带的身份验证页面（如登录页面和注册页面）也提供三种不同的布局变体："simple"、"card"和"split"。

要更改您的身份验证布局，请修改应用 `resources/views/layouts/auth.blade.php` 文件使用的布局：

```blade
<x-layouts::auth.split>
    {{ $slot }}
</x-layouts::auth.split>
```

<a name="authentication"></a>
## 身份验证

所有入门套件都使用 [Laravel Fortify](/docs/{{version}}/fortify) 处理身份验证。Fortify 提供登录、注册、密码重置、电子邮件验证等的路由、控制器和逻辑。

Fortify 根据应用 `config/fortify.php` 配置文件中启用的功能自动注册以下身份验证路由：

<div class="overflow-auto">

| 路由                               | 方法    | 描述                     |
| ---------------------------------- | ------ | ----------------------- |
| `/login`                           | `GET`    | 显示登录表单              |
| `/login`                           | `POST`   | 验证用户身份              |
| `/logout`                          | `POST`   | 注销用户                  |
| `/register`                        | `GET`    | 显示注册表单              |
| `/register`                        | `POST`   | 创建新用户                |
| `/forgot-password`                 | `GET`    | 显示密码重置请求表单       |
| `/forgot-password`                 | `POST`   | 发送密码重置链接           |
| `/reset-password/{token}`          | `GET`    | 显示密码重置表单           |
| `/reset-password`                  | `POST`   | 更新密码                  |
| `/email/verify`                    | `GET`    | 显示电子邮件验证通知       |
| `/email/verify/{id}/{hash}`        | `GET`    | 验证电子邮件地址           |
| `/email/verification-notification` | `POST`   | 重新发送验证邮件           |
| `/user/confirm-password`           | `GET`    | 显示密码确认表单           |
| `/user/confirm-password`           | `POST`   | 确认密码                  |
| `/two-factor-challenge`            | `GET`    | 显示双因素认证挑战表单     |
| `/two-factor-challenge`            | `POST`   | 验证双因素认证代码         |

</div>

`php artisan route:list` Artisan 命令可用于显示应用中的所有路由。

<a name="enabling-and-disabling-features"></a>
### 启用和禁用功能

您可以控制在应用 `config/fortify.php` 配置文件中启用了哪些 Fortify 功能：

```php
use Laravel\Fortify\Features;

'features' => [
    Features::registration(),
    Features::resetPasswords(),
    Features::emailVerification(),
    Features::twoFactorAuthentication([
        'confirm' => true,
        'confirmPassword' => true,
    ]),
],
```

要禁用某个功能，请从 `features` 数组中注释掉或移除该功能条目。例如，移除 `Features::registration()` 以禁用公开注册。

使用 [React](#react)、[Svelte](#svelte) 或 [Vue](#vue) 入门套件时，您还需要在前端代码中移除对已禁用功能路由的任何引用。例如，如果您禁用了电子邮件验证，应移除 React、Svelte 或 Vue 组件中对 `verification` 路由的导入和引用。这是必要的，因为这些入门套件使用 Wayfinder 进行类型安全路由，它会在构建时生成路由定义。如果您引用了不再存在的路由，您的应用将无法构建。

<a name="customizing-actions"></a>
### 自定义用户创建和密码重置

当用户注册或重置密码时，Fortify 会调用位于应用 `app/Actions/Fortify` 目录中的操作类：

<div class="overflow-auto">

| 文件                            | 描述                           |
| ----------------------------- | ----------------------------- |
| `CreateNewUser.php`           | 验证并创建新用户                |
| `ResetUserPassword.php`       | 验证并更新用户密码              |
| `PasswordValidationRules.php` | 定义密码验证规则                |

</div>

例如，要自定义应用的注册逻辑，您应编辑 `CreateNewUser` 操作：

```php
public function create(array $input): User
{
    Validator::make($input, [
        'name' => ['required', 'string', 'max:255'],
        'email' => ['required', 'email', 'max:255', 'unique:users'],
        'phone' => ['required', 'string', 'max:20'], // [tl! add]
        'password' => $this->passwordRules(),
    ])->validate();

    return User::create([
        'name' => $input['name'],
        'email' => $input['email'],
        'phone' => $input['phone'], // [tl! add]
        'password' => Hash::make($input['password']),
    ]);
}
```

<a name="two-factor-authentication"></a>
### 双因素认证

入门套件包含内置的双因素认证（2FA），允许用户使用任何兼容 TOTP 的身份验证器应用保护他们的帐户。2FA 默认通过应用 `config/fortify.php` 配置文件中的 `Features::twoFactorAuthentication()` 启用。

`confirm` 选项要求用户在完全启用 2FA 之前验证代码，而 `confirmPassword` 要求在启用或禁用 2FA 之前确认密码。有关更多详细信息，请参阅 [Fortify 的双因素认证文档](/docs/{{version}}/fortify#two-factor-authentication)。

<a name="rate-limiting"></a>
### 频率限制

频率限制可防止暴力破解和重复登录尝试压垮您的身份验证端点。您可以在应用的 `FortifyServiceProvider` 中自定义 Fortify 的频率限制行为：

```php
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Cache\RateLimiting\Limit;

RateLimiter::for('login', function ($request) {
    return Limit::perMinute(5)->by($request->email.$request->ip());
});
```

<a name="teams"></a>
## 团队

React、Svelte、Vue 和 Livewire 入门套件也可以生成团队支持。当团队功能启用时，每个用户属于一个或多个团队，并有一个当前团队。在注册期间，新用户会自动获得一个个人团队。入门套件还包括团队管理界面，用于创建团队、切换团队、邀请成员和更新团队详细信息。

当路由限定到当前团队时，当前团队的 slug 会包含在 URL 中。例如，仪表盘路由变为 `/{current_team}/dashboard`，而团队管理页面使用诸如 `settings/teams/{team}` 之类的路由。使用 `{current_team}` 和 `{team}` 路由参数时，入门套件会在允许访问路由之前自动确保已验证用户属于所请求的团队。

为更方便地生成感知团队的 URL，入门套件会为已验证用户的当前团队注册 URL 默认值。这使得对 `route('dashboard')` 等辅助方法的调用会自动包含当前团队的 slug。当用户登录、注册或切换团队时，入门套件会更新当前团队并刷新这些 URL 默认值，以便生成的链接继续使用正确的团队上下文。

在创建或重命名团队时，入门套件还会阻止用户选择可能产生不安全或冲突路由片段的保留名称。例如，不能使用与路由前缀（如 `settings`、`login` 或 `dashboard`）冲突的名称。

<a name="workos"></a>
## WorkOS AuthKit 身份验证

默认情况下，React、Svelte、Vue 和 Livewire 入门套件都利用 Laravel 内置的身份验证系统来提供登录、注册、密码重置、电子邮件验证等功能。此外，我们还为每个入门套件提供基于 [WorkOS AuthKit](https://authkit.com) 的变体，提供：

<div class="content-list" markdown="1">

- 社交身份验证（Google、Microsoft、GitHub 和 Apple）
- 通行密钥身份验证
- 基于电子邮件的"Magic Auth"
- SSO

</div>

使用 WorkOS 作为您的身份验证提供者[需要一个 WorkOS 帐户](https://workos.com)。WorkOS 为每月活跃用户不超过 100 万的应用提供免费身份验证。

要使用 WorkOS AuthKit 作为应用的身份验证提供者，请在通过 `laravel new` 创建新的入门套件驱动的应用时选择 WorkOS 选项。

### 配置您的 WorkOS 入门套件

使用基于 WorkOS 的入门套件创建新应用后，您应在应用的 `.env` 文件中设置 `WORKOS_CLIENT_ID`、`WORKOS_API_KEY` 和 `WORKOS_REDIRECT_URL` 环境变量。这些变量应与 WorkOS 控制面板中为您的应用提供的值匹配：

```ini
WORKOS_CLIENT_ID=your-client-id
WORKOS_API_KEY=your-api-key
WORKOS_REDIRECT_URL="${APP_URL}/authenticate"
```

此外，您还应在 WorkOS 控制面板中配置应用主页 URL。该 URL 是用户在注销应用后将被重定向到的地址。

<a name="configuring-authkit-authentication-methods"></a>
#### 配置 AuthKit 身份验证方法

使用基于 WorkOS 的入门套件时，我们建议您在应用的 WorkOS AuthKit 配置设置中禁用"Email + Password"身份验证，允许用户仅通过社交身份验证提供者、通行密钥、"Magic Auth"和 SSO 进行身份验证。这样您的应用就可以完全避免处理用户密码。

<a name="configuring-authkit-session-timeouts"></a>
#### 配置 AuthKit 会话超时

此外，我们建议您将 WorkOS AuthKit 会话不活动超时配置为与 Laravel 应用的会话超时阈值匹配，通常是两小时。

<a name="inertia-ssr"></a>
### Inertia SSR

React、Svelte 和 Vue 入门套件与 Inertia 的[服务器端渲染](https://inertiajs.com/server-side-rendering)能力兼容。要为您的应用构建 Inertia SSR 兼容包，请运行 `build:ssr` 命令：

```shell
npm run build:ssr
```

为方便起见，还提供了 `composer dev:ssr` 命令。该命令将为您的应用构建 SSR 兼容包后启动 Laravel 开发服务器和 Inertia SSR 服务器，允许您使用 Inertia 的服务器端渲染引擎在本地测试应用：

```shell
composer dev:ssr
```

<a name="community-maintained-starter-kits"></a>
### 社区维护的入门套件

使用 Laravel 安装器创建新的 Laravel 应用时，您可以将 Packagist 上可用的任何社区维护的入门套件传递给 `--using` 标志：

```shell
laravel new my-app --using=example/starter-kit
```

<a name="creating-starter-kits"></a>
#### 创建入门套件

为确保您的入门套件可供其他人使用，您需要将其发布到 [Packagist](https://packagist.org)。您的入门套件应在其 `.env.example` 文件中定义所需的环境变量，任何必要的安装后命令应列在入门套件 `composer.json` 文件的 `post-create-project-cmd` 数组中。

<a name="faqs"></a>
### 常见问题

<a name="faq-upgrade"></a>
#### 如何升级？

每个入门套件都为您下一个应用提供了一个坚实的起点。由于您拥有代码的完全所有权，您可以完全按照自己的设想调整、自定义和构建应用。但是，无需更新入门套件本身。

<a name="faq-enable-email-verification"></a>
#### 如何启用电子邮件验证？

可以通过取消注释 `App/Models/User.php` 模型中的 `MustVerifyEmail` 导入并确保模型实现 `MustVerifyEmail` 接口来添加电子邮件验证：

```php
<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
// ...

class User extends Authenticatable implements MustVerifyEmail
{
    // ...
}
```

注册后，用户将收到验证电子邮件。要限制对某些路由的访问直到用户验证其电子邮件地址，请将 `verified` 中间件添加到路由：

```php
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});
```

> [!NOTE]
> 使用入门套件的 [WorkOS](#workos) 变体时，不需要电子邮件验证。

<a name="faq-modify-email-template"></a>
#### 如何修改默认电子邮件模板？

您可能希望自定义默认电子邮件模板以更好地匹配应用的品牌。要修改此模板，您应使用以下命令将邮件视图发布到应用：

```
php artisan vendor:publish --tag=laravel-mail
```

这将在 `resources/views/vendor/mail` 中生成多个文件。您可以修改这些文件以及 `resources/views/vendor/mail/themes/default.css` 文件来更改默认电子邮件模板的外观。

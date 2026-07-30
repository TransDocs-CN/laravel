# 贡献指南

- [错误报告](#bug-reports)
- [支持问题](#support-questions)
- [核心开发讨论](#core-development-discussion)
- [选择哪个分支？](#which-branch)
- [编译的资源](#compiled-assets)
- [AI 生成的贡献](#ai-generated-contributions)
- [安全漏洞](#security-vulnerabilities)
- [编码风格](#coding-style)
    - [PHPDoc](#phpdoc)
    - [StyleCI](#styleci)
- [行为准则](#code-of-conduct)

<a name="bug-reports"></a>
## 错误报告

为鼓励积极参与协作，Laravel 强烈鼓励提交拉取请求，而不仅仅是错误报告。拉取请求仅在标记为"准备审核"（非"草稿"状态）且新功能的所有测试通过时才会被审核。长时间处于"草稿"状态的非活跃拉取请求将在几天后关闭。

但是，如果您提交错误报告，您的问题应包含标题和问题的清晰描述。您还应包含尽可能多的相关信息以及演示问题的代码示例。错误报告的目标是让您自己——以及其他人——能够轻松重现错误并开发修复。

请记住，创建错误报告是希望遇到相同问题的其他人能够与您合作解决。不要期望错误报告会自动获得任何关注或其他人会主动修复它。创建错误报告有助于您自己和他人开始解决问题的道路。如果您想贡献力量，可以通过修复[我们问题追踪器中列出的任何错误](https://github.com/issues?q=is%3Aopen+is%3Aissue+label%3Abug+user%3Alaravel)来提供帮助。您必须通过 GitHub 身份验证才能查看 Laravel 的所有问题。

如果您在使用 Laravel 时发现不当的 DocBlock、PHPStan 或 IDE 警告，请不要创建 GitHub 问题。相反，请提交拉取请求来修复问题。

Laravel 的源代码托管在 GitHub 上，每个 Laravel 项目都有相应的仓库：

<div class="content-list" markdown="1">

- [Laravel 应用](https://github.com/laravel/laravel)
- [Laravel Art](https://github.com/laravel/art)
- [Laravel Boost](https://github.com/laravel/boost)
- [Laravel 文档](https://github.com/laravel/docs)
- [Laravel Dusk](https://github.com/laravel/dusk)
- [Laravel Cashier Stripe](https://github.com/laravel/cashier)
- [Laravel Cashier Paddle](https://github.com/laravel/cashier-paddle)
- [Laravel Echo](https://github.com/laravel/echo)
- [Laravel Envoy](https://github.com/laravel/envoy)
- [Laravel Folio](https://github.com/laravel/folio)
- [Laravel 框架](https://github.com/laravel/framework)
- [Laravel Horizon](https://github.com/laravel/horizon)
- [Laravel Passport](https://github.com/laravel/passport)
- [Laravel Pennant](https://github.com/laravel/pennant)
- [Laravel Pint](https://github.com/laravel/pint)
- [Laravel Prompts](https://github.com/laravel/prompts)
- [Laravel Reverb](https://github.com/laravel/reverb)
- [Laravel Sail](https://github.com/laravel/sail)
- [Laravel Sanctum](https://github.com/laravel/sanctum)
- [Laravel Scout](https://github.com/laravel/scout)
- [Laravel Socialite](https://github.com/laravel/socialite)
- [Laravel Telescope](https://github.com/laravel/telescope)
- [Laravel Livewire 入门套件](https://github.com/laravel/livewire-starter-kit)
- [Laravel React 入门套件](https://github.com/laravel/react-starter-kit)
- [Laravel Svelte 入门套件](https://github.com/laravel/svelte-starter-kit)
- [Laravel Vue 入门套件](https://github.com/laravel/vue-starter-kit)

</div>

<a name="support-questions"></a>
## 支持问题

Laravel 的 GitHub 问题追踪器不用于提供 Laravel 帮助或支持。请改用以下渠道之一：

<div class="content-list" markdown="1">

- [GitHub 讨论](https://github.com/laravel/framework/discussions)
- [Laracasts 论坛](https://laracasts.com/discuss)
- [Laravel.io 论坛](https://laravel.io/forum)
- [StackOverflow](https://stackoverflow.com/questions/tagged/laravel)
- [Discord](https://discord.gg/laravel)
- [Larachat](https://larachat.co)
- [IRC](https://web.libera.chat/?nick=artisan&channels=#laravel)

</div>

<a name="core-development-discussion"></a>
## 核心开发讨论

您可以在 Laravel 框架仓库的 [GitHub 讨论板](https://github.com/laravel/framework/discussions)中提出新功能或改进现有 Laravel 行为的建议。如果您提出新功能，请愿意至少实现完成该功能所需的部分代码。

关于错误、新功能和现有功能实现的非正式讨论在 [Laravel Discord 服务器](https://discord.gg/laravel)的 `#internals` 频道中进行。Laravel 的维护者 Taylor Otwell 通常在周一至周五的 8:00-17:00（UTC-06:00 或 America/Chicago）出现在该频道，其他时间则偶尔出现。

<a name="which-branch"></a>
## 选择哪个分支？

**所有**错误修复应提交到支持错误修复的最新版本（当前为 `13.x`）。错误修复**绝不**应提交到 `master` 分支，除非它们修复的是仅存在于即将发布的版本中的功能。

与当前版本**完全向后兼容**的**次要**功能可以提交到最新的稳定分支（当前为 `13.x`）。

**主要**新功能或包含破坏性变更的功能应始终提交到包含即将发布版本的 `master` 分支。

<a name="compiled-assets"></a>
## 编译的资源

如果您提交的更改会影响编译文件，例如 `laravel/laravel` 仓库中 `resources/css` 或 `resources/js` 中的大部分文件，请不要提交编译后的文件。由于它们体积庞大，维护者无法实际审核。这可能会被利用为向 Laravel 注入恶意代码的方式。为了防御性地防止这种情况，所有编译文件将由 Laravel 维护者生成并提交。

<a name="ai-generated-contributions"></a>
## AI 生成的贡献

我们感谢提交给 Laravel 的每一个拉取请求。但是，未经深思熟虑的人工审核和考量而主要由 AI 生成的贡献是不可接受的。

如果您选择使用 AI 工具协助您的贡献，生成的代码**必须**在提交前经过您的彻底审查、测试和理解。

**完全由 AI 生成的大量问题或拉取请求将不被容忍。** 此类拉取请求将在未经审核的情况下关闭，贡献用户可能会被禁止访问该仓库。

我们鼓励贡献者熟悉现有的代码库，与社区互动，并提交反映他们对自己正在解决的问题的理解和深思熟虑的拉取请求。

<a name="security-vulnerabilities"></a>
## 安全漏洞

如果您发现 Laravel 中存在安全漏洞，请通过电子邮件向我们的安全团队发送邮件至 <a href="mailto:security@laravel.com">security@laravel.com</a>。所有安全漏洞将得到及时处理。

<a name="coding-style"></a>
## 编码风格

Laravel 遵循 [PSR-2](https://github.com/php-fig/fig-standards/blob/master/accepted/PSR-2-coding-style-guide.md) 编码标准和 [PSR-4](https://github.com/php-fig/fig-standards/blob/master/accepted/PSR-4-autoloader.md) 自动加载标准。

<a name="phpdoc"></a>
### PHPDoc

以下是有效的 Laravel 文档块的示例。请注意，`@param` 属性后跟两个空格、参数类型、再两个空格，最后是变量名：

```php
/**
 * 向容器注册绑定。
 *
 * @param  string|array  $abstract
 * @param  \Closure|string|null  $concrete
 * @param  bool  $shared
 * @return void
 *
 * @throws \Exception
 */
public function bind($abstract, $concrete = null, $shared = false)
{
    // ...
}
```

当由于使用了原生类型而使 `@param` 或 `@return` 属性冗余时，可以将其移除：

```php
/**
 * 执行任务。
 * [tl! remove]
 * @return void [tl! remove]
 */
public function handle(AudioProcessor $processor): void
{
    // ...
}
```

但是，当原生类型是泛型时，请通过使用 `@param` 或 `@return` 属性指定泛型类型：

```php
/**
 * 获取消息的附件。
 * [tl! add]
 * @return array<int, \Illuminate\Mail\Mailables\Attachment> [tl! add]
 */
public function attachments(): array
{
    return [
        Attachment::fromStorage('/path/to/file'),
    ];
}
```

<a name="styleci"></a>
### StyleCI

如果您的代码风格不完美，请不要担心！[StyleCI](https://styleci.io/) 会在拉取请求合并后自动将任何风格修复合并到 Laravel 仓库中。这使我们能够专注于贡献的内容而不是代码风格。

<a name="code-of-conduct"></a>
## 行为准则

Laravel 的行为准则源自 Ruby 的行为准则。任何违反行为准则的行为均可向 Taylor Otwell（taylor@laravel.com）报告：

<div class="content-list" markdown="1">

- 参与者应容忍反对意见。
- 参与者必须确保他们的语言和行为不受人身攻击和贬低性言论的影响。
- 在解释他人的言行时，参与者应始终假设善意。
- 任何可合理视为骚扰的行为都将不被容忍。

</div>

# Laravel Socialite

- [简介](#introduction)
- [安装](#installation)
- [升级 Socialite](#upgrading-socialite)
- [配置](#configuration)
- [认证](#authentication)
    - [路由](#routing)
    - [认证与存储](#authentication-and-storage)
    - [访问范围](#access-scopes)
    - [Slack Bot 范围](#slack-bot-scopes)
    - [可选参数](#optional-parameters)
- [检索用户详情](#retrieving-user-details)
- [测试](#testing)

<a name="introduction"></a>
## 简介

除了传统的基于表单的认证外，Laravel 还提供了一种简单、便捷的方式，使用 [Laravel Socialite](https://github.com/laravel/socialite) 通过 OAuth 提供者进行认证。Socialite 目前支持通过 Facebook、X、LinkedIn、Google、GitHub、GitLab、Bitbucket 和 Slack 进行认证。

> [!NOTE]
> 其他平台的适配器可通过社区驱动的 [Socialite Providers](https://socialiteproviders.com/) 网站获取。

<a name="installation"></a>
## 安装

要开始使用 Socialite，请使用 Composer 包管理器将包添加到项目的依赖中：

```shell
composer require laravel/socialite
```

<a name="upgrading-socialite"></a>
## 升级 Socialite

当升级到 Socialite 的新主要版本时，仔细阅读[升级指南](https://github.com/laravel/socialite/blob/master/UPGRADE.md)非常重要。

<a name="configuration"></a>
## 配置

在使用 Socialite 之前，你需要为应用程序使用的 OAuth 提供者添加凭证。通常，这些凭证可以通过在你要进行认证的服务的仪表盘中创建一个"开发者应用程序"来获取。

这些凭证应放在应用程序的 `config/services.php` 配置文件中，根据应用程序需要的提供者，应使用 `facebook`、`x`、`linkedin-openid`、`google`、`github`、`gitlab`、`bitbucket`、`slack` 或 `slack-openid` 作为键：

```php
'github' => [
    'client_id' => env('GITHUB_CLIENT_ID'),
    'client_secret' => env('GITHUB_CLIENT_SECRET'),
    'redirect' => 'http://example.com/callback-url',
],
```

> [!NOTE]
> 如果 `redirect` 选项包含相对路径，它将自动解析为完整的 URL。

<a name="authentication"></a>
## 认证

<a name="routing"></a>
### 路由

要使用 OAuth 提供者认证用户，你需要两个路由：一个用于将用户重定向到 OAuth 提供者，另一个用于在认证后接收来自提供者的回调。以下路由示例演示了两个路由的实现：

```php
use Laravel\Socialite\Socialite;

Route::get('/auth/redirect', function () {
    return Socialite::driver('github')->redirect();
});

Route::get('/auth/callback', function () {
    $user = Socialite::driver('github')->user();

    // $user->token
});
```

`Socialite` 门面提供的 `redirect` 方法负责将用户重定向到 OAuth 提供者，而 `user` 方法将检查传入的请求，并在用户批准认证请求后从提供者检索用户信息。

<a name="authentication-and-storage"></a>
### 认证与存储

从 OAuth 提供者检索到用户后，你可以确定该用户是否存在于应用程序的数据库中并[认证该用户](/docs/{{version}}/authentication#authenticate-a-user-instance)。如果该用户不存在于应用程序的数据库中，你通常会创建一个新记录来表示该用户：

```php
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Socialite;

Route::get('/auth/callback', function () {
    $githubUser = Socialite::driver('github')->user();

    $user = User::updateOrCreate([
        'github_id' => $githubUser->id,
    ], [
        'name' => $githubUser->name,
        'email' => $githubUser->email,
        'github_token' => $githubUser->token,
        'github_refresh_token' => $githubUser->refreshToken,
    ]);

    Auth::login($user);

    return redirect('/dashboard');
});
```

> [!NOTE]
> 有关特定 OAuth 提供者提供哪些用户信息的更多信息，请查阅关于[检索用户详情](#retrieving-user-details)的文档。

<a name="access-scopes"></a>
### 访问范围

在重定向用户之前，你可以使用 `scopes` 方法指定应在认证请求中包含的"范围"。此方法会将所有之前指定的范围与你指定的范围合并：

```php
use Laravel\Socialite\Socialite;

return Socialite::driver('github')
    ->scopes(['read:user', 'public_repo'])
    ->redirect();
```

你可以使用 `setScopes` 方法覆盖认证请求上的所有现有范围：

```php
return Socialite::driver('github')
    ->setScopes(['read:user', 'public_repo'])
    ->redirect();
```

<a name="slack-bot-scopes"></a>
### Slack Bot 范围

Slack 的 API 提供了[不同类型的访问令牌](https://api.slack.com/authentication/token-types)，每种令牌都有自己的一组[权限范围](https://api.slack.com/scopes)。Socialite 与以下两种 Slack 访问令牌类型兼容：

<div class="content-list" markdown="1">

- Bot（以 `xoxb-` 为前缀）
- User（以 `xoxp-` 为前缀）

</div>

默认情况下，`slack` 驱动会生成一个 `user` 令牌，调用驱动的 `user` 方法将返回用户的详细信息。

Bot 令牌主要用于你的应用程序需要向应用程序用户拥有的外部 Slack 工作区发送通知的情况。要生成 Bot 令牌，在将用户重定向到 Slack 进行认证之前调用 `asBotUser` 方法：

```php
return Socialite::driver('slack')
    ->asBotUser()
    ->setScopes(['chat:write', 'chat:write.public', 'chat:write.customize'])
    ->redirect();
```

此外，在 Slack 将用户重定向回你的应用程序后，你必须在调用 `user` 方法之前调用 `asBotUser` 方法：

```php
$user = Socialite::driver('slack')->asBotUser()->user();
```

生成 Bot 令牌时，`user` 方法仍会返回一个 `Laravel\Socialite\Two\User` 实例；但是，只有 `token` 属性会被填充。此令牌可以存储起来，用于[向已验证用户的 Slack 工作区发送通知](/docs/{{version}}/notifications#notifying-external-slack-workspaces)。

<a name="optional-parameters"></a>
### 可选参数

许多 OAuth 提供者在重定向请求上支持其他可选参数。要在请求中包含任何可选参数，使用关联数组调用 `with` 方法：

```php
use Laravel\Socialite\Socialite;

return Socialite::driver('google')
    ->with(['hd' => 'example.com'])
    ->redirect();
```

> [!WARNING]
> 使用 `with` 方法时，注意不要传递任何保留关键字，如 `state` 或 `response_type`。

<a name="retrieving-user-details"></a>
## 检索用户详情

在用户被重定向回应用程序的认证回调路由后，你可以使用 Socialite 的 `user` 方法检索用户的详细信息。`user` 方法返回的用户对象提供了多种属性和方法，你可以用来将用户信息存储在自己的数据库中。

根据你认证的 OAuth 提供者是支持 OAuth 1.0 还是 OAuth 2.0，此对象上可用的属性和方法可能不同：

```php
use Laravel\Socialite\Socialite;

Route::get('/auth/callback', function () {
    $user = Socialite::driver('github')->user();

    // OAuth 2.0 提供者...
    $token = $user->token;
    $refreshToken = $user->refreshToken;
    $expiresIn = $user->expiresIn;

    // OAuth 1.0 提供者...
    $token = $user->token;
    $tokenSecret = $user->tokenSecret;

    // 所有提供者...
    $user->getId();
    $user->getNickname();
    $user->getName();
    $user->getEmail();
    $user->getAvatar();
});
```

<a name="retrieving-user-details-from-a-token-oauth2"></a>
#### 从令牌检索用户详情

如果你已经拥有用户的有效访问令牌，可以使用 Socialite 的 `userFromToken` 方法检索他们的用户详情：

```php
use Laravel\Socialite\Socialite;

$user = Socialite::driver('github')->userFromToken($token);
```

如果你正在通过 iOS 应用程序使用 Facebook Limited Login，Facebook 将返回 OIDC 令牌而不是访问令牌。与访问令牌一样，OIDC 令牌可以提供给 `userFromToken` 方法以检索用户详情。

<a name="stateless-authentication"></a>
#### 无状态认证

`stateless` 方法可用于禁用会话状态验证。这在向不使用基于 cookie 的会话的无状态 API 添加社交认证时非常有用：

```php
use Laravel\Socialite\Socialite;

return Socialite::driver('google')->stateless()->user();
```

<a name="testing"></a>
## 测试

Laravel Socialite 提供了一种便捷的方式来测试 OAuth 认证流程，而无需实际向 OAuth 提供者发送请求。`fake` 方法允许你模拟 OAuth 提供者的行为，并定义应返回的用户数据。

<a name="faking-the-redirect"></a>
#### 模拟重定向

要测试你的应用程序是否正确地将用户重定向到 OAuth 提供者，你可以在向重定向路由发出请求之前调用 `fake` 方法。这将导致 Socialite 返回一个重定向到假的授权 URL，而不是重定向到实际的 OAuth 提供者：

```php
use Laravel\Socialite\Socialite;

test('用户被重定向到 github', function () {
    Socialite::fake('github');

    $response = $this->get('/auth/github/redirect');

    $response->assertRedirect();
});
```

<a name="faking-the-callback"></a>
#### 模拟回调

要测试应用程序的回调路由，你可以调用 `fake` 方法并提供一个 `User` 实例，当应用程序向提供者请求用户详情时应返回该实例。`User` 实例可以使用 `fake` 方法创建：

```php
use Laravel\Socialite\Socialite;
use Laravel\Socialite\Two\User;

test('用户可以使用 github 登录', function () {
    Socialite::fake('github', User::fake([
        'id' => 'github-123',
        'name' => '张三',
        'email' => 'zhangsan@example.com',
    ]));

    $response = $this->get('/auth/github/callback');

    $response->assertRedirect('/dashboard');

    $this->assertDatabaseHas('users', [
        'name' => '张三',
        'email' => 'zhangsan@example.com',
        'github_id' => 'github-123',
    ]);
});
```

默认情况下，`User` 实例将包含假的 OAuth 令牌值。如果需要，你可以通过向 `fake` 方法传递额外属性来覆盖这些值：

```php
$fakeUser = User::fake([
    'id' => 'github-123',
    'name' => '张三',
    'email' => 'zhangsan@example.com',
    'token' => 'fake-token',
    'refreshToken' => 'fake-refresh-token',
    'expiresIn' => 3600,
    'approvedScopes' => ['read', 'write'],
]);
```

OAuth 1 用户可以使用 `Laravel\Socialite\One\User` 类进行模拟。

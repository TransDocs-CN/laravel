# Laravel Passport

- [简介](#introduction)
    - [Passport 还是 Sanctum？](#passport-or-sanctum)
- [安装](#installation)
    - [部署 Passport](#deploying-passport)
    - [升级 Passport](#upgrading-passport)
- [配置](#configuration)
    - [令牌生命周期](#token-lifetimes)
    - [覆盖默认模型](#overriding-default-models)
    - [覆盖路由](#overriding-routes)
- [授权码授权](#authorization-code-grant)
    - [管理客户端](#managing-clients)
    - [请求令牌](#requesting-tokens)
    - [管理令牌](#managing-tokens)
    - [刷新令牌](#refreshing-tokens)
    - [撤销令牌](#revoking-tokens)
    - [清除令牌](#purging-tokens)
- [带 PKCE 的授权码授权](#code-grant-pkce)
    - [创建客户端](#creating-a-auth-pkce-grant-client)
    - [请求令牌](#requesting-auth-pkce-grant-tokens)
- [设备授权授权](#device-authorization-grant)
    - [创建设备授权授权客户端](#creating-a-device-authorization-grant-client)
    - [请求令牌](#requesting-device-authorization-grant-tokens)
- [密码授权](#password-grant)
    - [创建密码授权客户端](#creating-a-password-grant-client)
    - [请求令牌](#requesting-password-grant-tokens)
    - [请求所有作用域](#requesting-all-scopes)
    - [自定义用户提供者](#customizing-the-user-provider)
    - [自定义用户名字段](#customizing-the-username-field)
    - [自定义密码验证](#customizing-the-password-validation)
- [隐式授权](#implicit-grant)
- [客户端凭证授权](#client-credentials-grant)
- [个人访问令牌](#personal-access-tokens)
    - [创建个人访问客户端](#creating-a-personal-access-client)
    - [自定义用户提供者](#customizing-the-user-provider-for-pat)
    - [管理个人访问令牌](#managing-personal-access-tokens)
- [保护路由](#protecting-routes)
    - [通过中间件](#via-middleware)
    - [传递访问令牌](#passing-the-access-token)
- [令牌作用域](#token-scopes)
    - [定义作用域](#defining-scopes)
    - [默认作用域](#default-scope)
    - [分配作用域给令牌](#assigning-scopes-to-tokens)
    - [检查作用域](#checking-scopes)
- [SPA 身份验证](#spa-authentication)
- [事件](#events)
- [测试](#testing)

<a name="introduction"></a>
## 简介

[Laravel Passport](https://github.com/laravel/passport) 在几分钟内为你的 Laravel 应用程序提供完整的 OAuth2 服务器实现。Passport 基于由 Andy Millington 和 Simon Hamp 维护的 [League OAuth2 服务器](https://github.com/thephpleague/oauth2-server)构建。

> [!NOTE]
> 本文档假设你已经熟悉 OAuth2。如果你对 OAuth2 一无所知，建议在继续之前熟悉 OAuth2 的一般[术语](https://oauth2.thephpleague.com/terminology/)和功能。

<a name="passport-or-sanctum"></a>
### Passport 还是 Sanctum？

在开始之前，你可能希望确定你的应用程序更适合使用 Laravel Passport 还是 [Laravel Sanctum](/docs/{{version}}/sanctum)。如果你的应用程序绝对需要支持 OAuth2，那么你应该使用 Laravel Passport。

但是，如果你正在尝试验证单页应用、移动应用或颁发 API 令牌，则应使用 [Laravel Sanctum](/docs/{{version}}/sanctum)。Laravel Sanctum 不支持 OAuth2；但是，它提供了更简单的 API 身份验证开发体验。

<a name="installation"></a>
## 安装

你可以通过 `install:api` Artisan 命令安装 Laravel Passport：

```shell
php artisan install:api --passport
```

此命令将发布并运行必要的数据库迁移，以创建应用程序存储 OAuth2 客户端和访问令牌所需的表。该命令还将创建生成安全访问令牌所需的加密密钥。

运行 `install:api` 命令后，将 `Laravel\Passport\HasApiTokens` trait 和 `Laravel\Passport\Contracts\OAuthenticatable` 接口添加到你的 `App\Models\User` 模型中。此 trait 将为你的模型提供一些辅助方法，使你能够检查已认证用户的令牌和作用域：

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Passport\Contracts\OAuthenticatable;
use Laravel\Passport\HasApiTokens;

class User extends Authenticatable implements OAuthenticatable
{
    use HasApiTokens, HasFactory, Notifiable;
}
```

最后，在应用程序的 `config/auth.php` 配置文件中，你应定义一个 `api` 身份验证守卫并将 `driver` 选项设置为 `passport`。这将指示你的应用程序在验证传入的 API 请求时使用 Passport 的 `TokenGuard`：

```php
'guards' => [
    'web' => [
        'driver' => 'session',
        'provider' => 'users',
    ],

    'api' => [
        'driver' => 'passport',
        'provider' => 'users',
    ],
],
```

<a name="deploying-passport"></a>
### 部署 Passport

首次将 Passport 部署到应用程序的服务器时，你可能需要运行 `passport:keys` 命令。此命令生成 Passport 生成访问令牌所需的加密密钥。生成的密钥通常不保存在源代码控制中：

```shell
php artisan passport:keys
```

如果需要，你可以定义 Passport 加载密钥的路径。你可以使用 `Passport::loadKeysFrom` 方法来实现。通常，此方法应在应用程序的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用：

```php
/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Passport::loadKeysFrom(__DIR__.'/../secrets/oauth');
}
```

<a name="loading-keys-from-the-environment"></a>
#### 从环境加载密钥

或者，你可以使用 `vendor:publish` Artisan 命令发布 Passport 的配置文件：

```shell
php artisan vendor:publish --tag=passport-config
```

发布配置文件后，你可以通过将它们定义为环境变量来加载应用程序的加密密钥：

```ini
PASSPORT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
<private key here>
-----END RSA PRIVATE KEY-----"

PASSPORT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
<public key here>
-----END PUBLIC KEY-----"
```

<a name="upgrading-passport"></a>
### 升级 Passport

升级到 Passport 的新主要版本时，仔细阅读[升级指南](https://github.com/laravel/passport/blob/master/UPGRADE.md)非常重要。

<a name="configuration"></a>
## 配置

<a name="token-lifetimes"></a>
### 令牌生命周期

默认情况下，Passport 颁发长期有效的访问令牌，一年后过期。如果你希望配置更长/更短的令牌生命周期，可以使用 `tokensExpireIn`、`refreshTokensExpireIn` 和 `personalAccessTokensExpireIn` 方法。这些方法应在应用程序的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用：

```php
use Carbon\CarbonInterval;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Passport::tokensExpireIn(CarbonInterval::days(15));
    Passport::refreshTokensExpireIn(CarbonInterval::days(30));
    Passport::personalAccessTokensExpireIn(CarbonInterval::months(6));
}
```

> [!WARNING]
> Passport 数据库表中的 `expires_at` 列是只读的，仅用于显示目的。颁发令牌时，Passport 将过期信息存储在签名和加密的令牌中。如果你需要使令牌失效，应[撤销它](#revoking-tokens)。

<a name="overriding-default-models"></a>
### 覆盖默认模型

你可以自由地扩展 Passport 内部使用的模型，方法是定义自己的模型并扩展相应的 Passport 模型：

```php
use Laravel\Passport\Client as PassportClient;

class Client extends PassportClient
{
    // ...
}
```

定义模型后，你可以通过 `Laravel\Passport\Passport` 类指示 Passport 使用你的自定义模型。通常，你应在应用程序的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中告知 Passport 你的自定义模型：

```php
use App\Models\Passport\AuthCode;
use App\Models\Passport\Client;
use App\Models\Passport\DeviceCode;
use App\Models\Passport\RefreshToken;
use App\Models\Passport\Token;
use Laravel\Passport\Passport;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Passport::useTokenModel(Token::class);
    Passport::useRefreshTokenModel(RefreshToken::class);
    Passport::useAuthCodeModel(AuthCode::class);
    Passport::useClientModel(Client::class);
    Passport::useDeviceCodeModel(DeviceCode::class);
}
```

<a name="overriding-routes"></a>
### 覆盖路由

有时你可能希望自定义 Passport 定义的路由。为实现这一点，你首先需要通过将 `Passport::ignoreRoutes` 添加到应用程序 `AppServiceProvider` 的 `register` 方法来忽略 Passport 注册的路由：

```php
use Laravel\Passport\Passport;

/**
 * Register any application services.
 */
public function register(): void
{
    Passport::ignoreRoutes();
}
```

然后，你可以将 Passport 在其[路由文件](https://github.com/laravel/passport/blob/master/routes/web.php)中定义的路由复制到应用程序的 `routes/web.php` 文件中，并根据需要修改它们：

```php
Route::group([
    'as' => 'passport.',
    'prefix' => config('passport.path', 'oauth'),
    'namespace' => '\Laravel\Passport\Http\Controllers',
], function () {
    // Passport routes...
});
```

<a name="authorization-code-grant"></a>
## 授权码授权

通过授权码使用 OAuth2 是大多数开发者熟悉 OAuth2 的方式。使用授权码时，客户端应用程序将用户重定向到你的服务器，用户将在那里批准或拒绝向客户端颁发访问令牌的请求。

首先，我们需要指示 Passport 如何返回我们的"授权"视图。

所有授权视图的渲染逻辑都可以通过 `Laravel\Passport\Passport` 类提供的相应方法进行自定义。通常，你应在应用程序的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用此方法：

```php
use Inertia\Inertia;
use Laravel\Passport\Passport;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    // By providing a view name...
    Passport::authorizationView('auth.oauth.authorize');

    // By providing a closure...
    Passport::authorizationView(
        fn ($parameters) => Inertia::render('Auth/OAuth/Authorize', [
            'request' => $parameters['request'],
            'authToken' => $parameters['authToken'],
            'client' => $parameters['client'],
            'user' => $parameters['user'],
            'scopes' => $parameters['scopes'],
        ])
    );
}
```

Passport 将自动定义返回此视图的 `/oauth/authorize` 路由。你的 `auth.oauth.authorize` 模板应包含一个向 `passport.authorizations.approve` 路由发起 POST 请求以批准授权的表单，以及一个向 `passport.authorizations.deny` 路由发起 DELETE 请求以拒绝授权的表单。`passport.authorizations.approve` 和 `passport.authorizations.deny` 路由需要 `state`、`client_id` 和 `auth_token` 字段。

<a name="managing-clients"></a>
### 管理客户端

构建需要与应用程序 API 交互的应用程序的开发人员需要通过创建"客户端"来向你的应用程序注册他们的应用程序。通常，这包括提供其应用程序的名称和一个 URI，在用户批准其授权请求后，你的应用程序可以重定向到该 URI。

<a name="managing-first-party-clients"></a>
#### 第一方客户端

创建客户端的最简单方法是使用 `passport:client` Artisan 命令。此命令可用于创建第一方客户端或测试你的 OAuth2 功能。运行 `passport:client` 命令时，Passport 将提示你提供有关客户端的更多信息，并为你提供客户端 ID 和密钥：

```shell
php artisan passport:client
```

如果你希望允许客户端有多个重定向 URI，可以在 `passport:client` 命令提示输入 URI 时使用逗号分隔列表指定它们。任何包含逗号的 URI 都应用 URI 编码：

```shell
https://third-party-app.com/callback,https://example.com/oauth/redirect
```

<a name="managing-third-party-clients"></a>
#### 第三方客户端

由于应用程序的用户将无法使用 `passport:client` 命令，你可以使用 `Laravel\Passport\ClientRepository` 类的 `createAuthorizationCodeGrantClient` 方法为给定用户注册客户端：

```php
use App\Models\User;
use Laravel\Passport\ClientRepository;

$user = User::find($userId);

// Creating an OAuth app client that belongs to the given user...
$client = app(ClientRepository::class)->createAuthorizationCodeGrantClient(
    user: $user,
    name: 'Example App',
    redirectUris: ['https://third-party-app.com/callback'],
    confidential: false,
    enableDeviceFlow: true
);

// Retrieving all the OAuth app clients that belong to the user...
$clients = $user->oauthApps()->get();
```

`createAuthorizationCodeGrantClient` 方法返回 `Laravel\Passport\Client` 的实例。你可以向用户显示 `$client->id` 作为客户端 ID，`$client->plainSecret` 作为客户端密钥。

<a name="requesting-tokens"></a>
### 请求令牌

<a name="requesting-tokens-redirecting-for-authorization"></a>
#### 重定向以请求授权

创建客户端后，开发人员可以使用其客户端 ID 和密钥向你的应用程序请求授权码和访问令牌。首先，消费应用程序应向你的应用程序的 `/oauth/authorize` 路由发起重定向请求，如下所示：

```php
use Illuminate\Http\Request;
use Illuminate\Support\Str;

Route::get('/redirect', function (Request $request) {
    $request->session()->put('state', $state = Str::random(40));

    $query = http_build_query([
        'client_id' => 'your-client-id',
        'redirect_uri' => 'https://third-party-app.com/callback',
        'response_type' => 'code',
        'scope' => 'user:read orders:create',
        'state' => $state,
        // 'prompt' => '', // "none", "consent", or "login"
    ]);

    return redirect('https://passport-app.test/oauth/authorize?'.$query);
});
```

`prompt` 参数可用于指定 Passport 应用程序的身份验证行为。

如果 `prompt` 值为 `none`，如果用户尚未通过 Passport 应用程序身份验证，Passport 将始终抛出身份验证错误。如果值为 `consent`，Passport 将始终显示授权批准屏幕，即使所有作用域先前已授予消费应用程序。当值为 `login` 时，Passport 应用程序将始终提示用户重新登录应用程序，即使他们已有现有会话。

如果未提供 `prompt` 值，仅当用户先前未授权消费应用程序访问请求的作用域时，才会提示用户进行授权。

> [!NOTE]
> 记住，`/oauth/authorize` 路由已由 Passport 定义。你不需要手动定义此路由。

<a name="approving-the-request"></a>
#### 批准请求

当收到授权请求时，Passport 将根据 `prompt` 参数的值（如果存在）自动响应，并可能向用户显示模板，允许他们批准或拒绝授权请求。如果他们批准请求，他们将被重定向回消费应用程序指定的 `redirect_uri`。`redirect_uri` 必须与创建客户端时指定的 `redirect` URL 匹配。

有时你可能希望跳过授权提示，例如在授权第一方客户端时。你可以通过[扩展 `Client` 模型](#overriding-default-models)并定义 `skipsAuthorization` 方法来实现。如果 `skipsAuthorization` 返回 `true`，客户端将被批准，用户将立即重定向回 `redirect_uri`，除非消费应用程序在重定向以请求授权时显式设置了 `prompt` 参数：

```php
<?php

namespace App\Models\Passport;

use Illuminate\Contracts\Auth\Authenticatable;
use Laravel\Passport\Client as BaseClient;

class Client extends BaseClient
{
    /**
     * Determine if the client should skip the authorization prompt.
     *
     * @param  \Laravel\Passport\Scope[]  $scopes
     */
    public function skipsAuthorization(Authenticatable $user, array $scopes): bool
    {
        return $this->firstParty();
    }
}
```

<a name="requesting-tokens-converting-authorization-codes-to-access-tokens"></a>
#### 将授权码转换为访问令牌

如果用户批准授权请求，他们将被重定向回消费应用程序。消费者应首先验证 `state` 参数是否与重定向前存储的值匹配。如果 state 参数匹配，则消费者应向你的应用程序发出 `POST` 请求以请求访问令牌。该请求应包括用户在批准授权请求时由你的应用程序颁发的授权码：

```php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

Route::get('/callback', function (Request $request) {
    $state = $request->session()->pull('state');

    throw_unless(
        strlen($state) > 0 && $state === $request->state,
        InvalidArgumentException::class,
        'Invalid state value.'
    );

    $response = Http::asForm()->post('https://passport-app.test/oauth/token', [
        'grant_type' => 'authorization_code',
        'client_id' => 'your-client-id',
        'client_secret' => 'your-client-secret',
        'redirect_uri' => 'https://third-party-app.com/callback',
        'code' => $request->code,
    ]);

    return $response->json();
});
```

此 `/oauth/token` 路由将返回包含 `access_token`、`refresh_token` 和 `expires_in` 属性的 JSON 响应。`expires_in` 属性包含访问令牌过期前的秒数。

> [!NOTE]
> 与 `/oauth/authorize` 路由一样，`/oauth/token` 路由已由 Passport 为你定义。无需手动定义此路由。

<a name="managing-tokens"></a>
### 管理令牌

你可以使用 `Laravel\Passport\HasApiTokens` trait 的 `tokens` 方法检索用户授权的令牌。例如，这可用于为你的用户提供一个仪表板，用于跟踪他们与第三方应用程序的连接：

```php
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Date;
use Laravel\Passport\Token;

$user = User::find($userId);

// Retrieving all of the valid tokens for the user...
$tokens = $user->tokens()
    ->where('revoked', false)
    ->where('expires_at', '>', Date::now())
    ->get();

// Retrieving all the user's connections to third-party OAuth app clients...
$connections = $tokens->load('client')
    ->reject(fn (Token $token) => $token->client->firstParty())
    ->groupBy('client_id')
    ->map(fn (Collection $tokens) => [
        'client' => $tokens->first()->client,
        'scopes' => $tokens->pluck('scopes')->flatten()->unique()->values()->all(),
        'tokens_count' => $tokens->count(),
    ])
    ->values();
```

<a name="refreshing-tokens"></a>
### 刷新令牌

如果你的应用程序颁发短期访问令牌，用户将需要通过颁发访问令牌时提供的刷新令牌来刷新其访问令牌：

```php
use Illuminate\Support\Facades\Http;

$response = Http::asForm()->post('https://passport-app.test/oauth/token', [
    'grant_type' => 'refresh_token',
    'refresh_token' => 'the-refresh-token',
    'client_id' => 'your-client-id',
    'client_secret' => 'your-client-secret', // Required for confidential clients only...
    'scope' => 'user:read orders:create',
]);

return $response->json();
```

此 `/oauth/token` 路由将返回包含 `access_token`、`refresh_token` 和 `expires_in` 属性的 JSON 响应。`expires_in` 属性包含访问令牌过期前的秒数。

<a name="revoking-tokens"></a>
### 撤销令牌

你可以使用 `Laravel\Passport\Token` 模型上的 `revoke` 方法撤销令牌。你可以使用 `Laravel\Passport\RefreshToken` 模型上的 `revoke` 方法撤销令牌的刷新令牌：

```php
use Laravel\Passport\Passport;
use Laravel\Passport\Token;

$token = Passport::token()->find($tokenId);

// Revoke an access token...
$token->revoke();

// Revoke the token's refresh token...
$token->refreshToken?->revoke();

// Revoke all of the user's tokens...
User::find($userId)->tokens()->each(function (Token $token) {
    $token->revoke();
    $token->refreshToken?->revoke();
});
```

<a name="purging-tokens"></a>
### 清除令牌

当令牌被撤销或过期时，你可能希望从数据库中清除它们。Passport 包含的 `passport:purge` Artisan 命令可以为你完成此操作：

```shell
# Purge revoked and expired tokens, auth codes, and device codes...
php artisan passport:purge

# Only purge tokens expired for more than 6 hours...
php artisan passport:purge --hours=6

# Only purge revoked tokens, auth codes, and device codes...
php artisan passport:purge --revoked

# Only purge expired tokens, auth codes, and device codes...
php artisan passport:purge --expired
```

你也可以在应用程序的 `routes/console.php` 文件中配置一个[计划任务](/docs/{{version}}/scheduling)来按计划自动清理令牌：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('passport:purge')->hourly();
```

<a name="code-grant-pkce"></a>
## 带 PKCE 的授权码授权

带"代码交换证明密钥"（PKCE）的授权码授权是一种安全的方式，用于对单页应用或移动应用进行身份验证以访问你的 API。当你无法保证客户端密钥将被机密存储，或为了减轻授权码被攻击者拦截的威胁时，应使用此授权。在将授权码交换为访问令牌时，"代码验证器"和"代码挑战"的组合取代了客户端密钥。

<a name="creating-a-auth-pkce-grant-client"></a>
### 创建客户端

在应用程序可以通过带 PKCE 的授权码授权颁发令牌之前，你需要创建一个启用 PKCE 的客户端。你可以使用带有 `--public` 选项的 `passport:client` Artisan 命令来完成此操作：

```shell
php artisan passport:client --public
```

<a name="requesting-auth-pkce-grant-tokens"></a>
### 请求令牌

<a name="code-verifier-code-challenge"></a>
#### 代码验证器和代码挑战

由于此授权授权不提供客户端密钥，开发人员需要生成代码验证器和代码挑战的组合来请求令牌。

代码验证器应是一个 43 到 128 个字符之间的随机字符串，包含字母、数字和 `"-"`、`"."`、`"_"`、`"~"` 字符，如 [RFC 7636 规范](https://tools.ietf.org/html/rfc7636)中定义。

代码挑战应是一个 Base64 编码的字符串，使用 URL 和文件名安全字符。尾部的 `'='` 字符应被移除，且不应包含换行符、空白或其他额外字符。

```php
$encoded = base64_encode(hash('sha256', $codeVerifier, true));

$codeChallenge = strtr(rtrim($encoded, '='), '+/', '-_');
```

<a name="code-grant-pkce-redirecting-for-authorization"></a>
#### 重定向以请求授权

创建客户端后，你可以使用客户端 ID 以及生成的代码验证器和代码挑战来向你的应用程序请求授权码和访问令牌。首先，消费应用程序应向你的应用程序的 `/oauth/authorize` 路由发起重定向请求：

```php
use Illuminate\Http\Request;
use Illuminate\Support\Str;

Route::get('/redirect', function (Request $request) {
    $request->session()->put('state', $state = Str::random(40));

    $request->session()->put(
        'code_verifier', $codeVerifier = Str::random(128)
    );

    $codeChallenge = strtr(rtrim(
        base64_encode(hash('sha256', $codeVerifier, true))
    , '='), '+/', '-_');

    $query = http_build_query([
        'client_id' => 'your-client-id',
        'redirect_uri' => 'https://third-party-app.com/callback',
        'response_type' => 'code',
        'scope' => 'user:read orders:create',
        'state' => $state,
        'code_challenge' => $codeChallenge,
        'code_challenge_method' => 'S256',
        // 'prompt' => '', // "none", "consent", or "login"
    ]);

    return redirect('https://passport-app.test/oauth/authorize?'.$query);
});
```

<a name="code-grant-pkce-converting-authorization-codes-to-access-tokens"></a>
#### 将授权码转换为访问令牌

如果用户批准授权请求，他们将被重定向回消费应用程序。消费者应验证 `state` 参数是否与重定向前存储的值匹配，如标准授权码授权中所示。

如果 state 参数匹配，则消费者应向你的应用程序发出 `POST` 请求以请求访问令牌。该请求应包括用户在批准授权请求时由你的应用程序颁发的授权码以及最初生成的代码验证器：

```php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

Route::get('/callback', function (Request $request) {
    $state = $request->session()->pull('state');

    $codeVerifier = $request->session()->pull('code_verifier');

    throw_unless(
        strlen($state) > 0 && $state === $request->state,
        InvalidArgumentException::class
    );

    $response = Http::asForm()->post('https://passport-app.test/oauth/token', [
        'grant_type' => 'authorization_code',
        'client_id' => 'your-client-id',
        'redirect_uri' => 'https://third-party-app.com/callback',
        'code_verifier' => $codeVerifier,
        'code' => $request->code,
    ]);

    return $response->json();
});
```

<a name="device-authorization-grant"></a>
## 设备授权授权

OAuth2 设备授权授权允许无浏览器或输入受限的设备（如电视和游戏机）通过交换"设备码"来获取访问令牌。使用设备流时，设备客户端将指示用户使用辅助设备（如计算机或智能手机）连接到你的服务器，并在其中输入提供的"用户码"，然后批准或拒绝访问请求。

首先，我们需要指示 Passport 如何返回我们的"用户码"和"授权"视图。

所有授权视图的渲染逻辑都可以通过 `Laravel\Passport\Passport` 类提供的相应方法进行自定义。通常，你应在应用程序的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用此方法。

```php
use Inertia\Inertia;
use Laravel\Passport\Passport;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    // By providing a view name...
    Passport::deviceUserCodeView('auth.oauth.device.user-code');
    Passport::deviceAuthorizationView('auth.oauth.device.authorize');

    // By providing a closure...
    Passport::deviceUserCodeView(
        fn ($parameters) => Inertia::render('Auth/OAuth/Device/UserCode')
    );

    Passport::deviceAuthorizationView(
        fn ($parameters) => Inertia::render('Auth/OAuth/Device/Authorize', [
            'request' => $parameters['request'],
            'authToken' => $parameters['authToken'],
            'client' => $parameters['client'],
            'user' => $parameters['user'],
            'scopes' => $parameters['scopes'],
        ])
    );

    // ...
}
```

Passport 将自动定义返回这些视图的路由。你的 `auth.oauth.device.user-code` 模板应包含一个向 `passport.device.authorizations.authorize` 路由发起 GET 请求的表单。`passport.device.authorizations.authorize` 路由需要一个 `user_code` 查询参数。

你的 `auth.oauth.device.authorize` 模板应包含一个向 `passport.device.authorizations.approve` 路由发起 POST 请求以批准授权的表单，以及一个向 `passport.device.authorizations.deny` 路由发起 DELETE 请求以拒绝授权的表单。`passport.device.authorizations.approve` 和 `passport.device.authorizations.deny` 路由需要 `state`、`client_id` 和 `auth_token` 字段。

<a name="creating-a-device-authorization-grant-client"></a>
### 创建设备授权授权客户端

在应用程序可以通过设备授权授权颁发令牌之前，你需要创建一个启用设备流的客户端。你可以使用带有 `--device` 选项的 `passport:client` Artisan 命令来完成此操作。此命令将创建一个第一方设备流客户端，并为你提供客户端 ID 和密钥：

```shell
php artisan passport:client --device
```

此外，你可以使用 `ClientRepository` 类上的 `createDeviceAuthorizationGrantClient` 方法来注册属于给定用户的第三方客户端：

```php
use App\Models\User;
use Laravel\Passport\ClientRepository;

$user = User::find($userId);

$client = app(ClientRepository::class)->createDeviceAuthorizationGrantClient(
    user: $user,
    name: 'Example Device',
    confidential: false,
);
```

<a name="requesting-device-authorization-grant-tokens"></a>
### 请求令牌

<a name="device-code"></a>
#### 请求设备码

创建客户端后，开发人员可以使用其客户端 ID 向你的应用程序请求设备码。首先，消费设备应向你的应用程序的 `/oauth/device/code` 路由发起 `POST` 请求以请求设备码：

```php
use Illuminate\Support\Facades\Http;

$response = Http::asForm()->post('https://passport-app.test/oauth/device/code', [
    'client_id' => 'your-client-id',
    'scope' => 'user:read orders:create',
]);

return $response->json();
```

这将返回一个包含 `device_code`、`user_code`、`verification_uri`、`interval` 和 `expires_in` 属性的 JSON 响应。`expires_in` 属性包含设备码过期前的秒数。`interval` 属性包含消费设备在轮询 `/oauth/token` 路由时应在请求之间等待的秒数，以避免速率限制错误。

> [!NOTE]
> 记住，`/oauth/device/code` 路由已由 Passport 定义。你不需要手动定义此路由。

<a name="user-code"></a>
#### 显示验证 URI 和用户码

获取设备码请求后，消费设备应指示用户使用另一台设备访问提供的 `verification_uri` 并输入 `user_code` 以批准授权请求。

<a name="polling-token-request"></a>
#### 轮询令牌请求

由于用户将使用单独的设备来授予（或拒绝）访问权限，消费设备应轮询你的应用程序的 `/oauth/token` 路由，以确定用户何时已响应请求。消费设备应使用请求设备码时 JSON 响应中提供的最小轮询 `interval`，以避免速率限制错误：

```php
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;

$interval = 5;

do {
    Sleep::for($interval)->seconds();

    $response = Http::asForm()->post('https://passport-app.test/oauth/token', [
        'grant_type' => 'urn:ietf:params:oauth:grant-type:device_code',
        'client_id' => 'your-client-id',
        'client_secret' => 'your-client-secret', // Required for confidential clients only...
        'device_code' => 'the-device-code',
    ]);

    if ($response->json('error') === 'slow_down') {
        $interval += 5;
    }
} while (in_array($response->json('error'), ['authorization_pending', 'slow_down']));

return $response->json();
```

如果用户已批准授权请求，这将返回一个包含 `access_token`、`refresh_token` 和 `expires_in` 属性的 JSON 响应。`expires_in` 属性包含访问令牌过期前的秒数。

<a name="password-grant"></a>
## 密码授权

> [!WARNING]
> 我们不再建议使用密码授权令牌。相反，你应选择[OAuth2 服务器当前推荐的授权类型](https://oauth2.thephpleague.com/authorization-server/which-grant/)。

OAuth2 密码授权允许你的其他第一方客户端（例如移动应用程序）使用电子邮件地址/用户名和密码获取访问令牌。这允许你安全地向第一方客户端颁发访问令牌，而无需要求用户经历完整的 OAuth2 授权码重定向流程。

要启用密码授权，请在应用程序的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用 `enablePasswordGrant` 方法：

```php
/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Passport::enablePasswordGrant();
}
```

<a name="creating-a-password-grant-client"></a>
### 创建密码授权客户端

在应用程序可以通过密码授权颁发令牌之前，你需要创建一个密码授权客户端。你可以使用带有 `--password` 选项的 `passport:client` Artisan 命令来完成此操作。

```shell
php artisan passport:client --password
```

<a name="requesting-password-grant-tokens"></a>
### 请求令牌

启用授权并创建密码授权客户端后，你可以通过向 `/oauth/token` 路由发起 `POST` 请求来请求访问令牌，并附上用户的电子邮件地址和密码。记住，此路由已由 Passport 注册，因此无需手动定义。如果请求成功，你将收到服务器 JSON 响应中的 `access_token` 和 `refresh_token`：

```php
use Illuminate\Support\Facades\Http;

$response = Http::asForm()->post('https://passport-app.test/oauth/token', [
    'grant_type' => 'password',
    'client_id' => 'your-client-id',
    'client_secret' => 'your-client-secret', // Required for confidential clients only...
    'username' => 'taylor@laravel.com',
    'password' => 'my-password',
    'scope' => 'user:read orders:create',
]);

return $response->json();
```

> [!NOTE]
> 记住，访问令牌默认是长期有效的。但是，你可以根据需要[配置最大访问令牌生命周期](#configuration)。

<a name="requesting-all-scopes"></a>
### 请求所有作用域

使用密码授权或客户端凭证授权时，你可能希望授权令牌具有应用程序支持的所有作用域。你可以通过请求 `*` 作用域来实现。如果你请求 `*` 作用域，令牌实例上的 `can` 方法将始终返回 `true`。此作用域只能分配给使用 `password` 或 `client_credentials` 授权颁发的令牌：

```php
use Illuminate\Support\Facades\Http;

$response = Http::asForm()->post('https://passport-app.test/oauth/token', [
    'grant_type' => 'password',
    'client_id' => 'your-client-id',
    'client_secret' => 'your-client-secret', // Required for confidential clients only...
    'username' => 'taylor@laravel.com',
    'password' => 'my-password',
    'scope' => '*',
]);
```

<a name="customizing-the-user-provider"></a>
### 自定义用户提供者

如果你的应用程序使用多个[身份验证用户提供者](/docs/{{version}}/authentication#introduction)，你可以通过在通过 `artisan passport:client --password` 命令创建客户端时提供 `--provider` 选项来指定密码授权客户端使用的用户提供者。给定的提供者名称应与应用程序 `config/auth.php` 配置文件中定义的有效提供者匹配。然后，你可以[使用中间件保护路由](#multiple-authentication-guards)，以确保只有来自守卫指定提供者的用户被授权。

<a name="customizing-the-username-field"></a>
### 自定义用户名字段

使用密码授权进行身份验证时，Passport 将使用可认证模型的 `email` 属性作为"用户名"。但是，你可以通过在模型上定义 `findForPassport` 方法来自定义此行为：

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Passport\Bridge\Client;
use Laravel\Passport\Contracts\OAuthenticatable;
use Laravel\Passport\HasApiTokens;

class User extends Authenticatable implements OAuthenticatable
{
    use HasApiTokens, Notifiable;

    /**
     * Find the user instance for the given username.
     */
    public function findForPassport(string $username, Client $client): User
    {
        return $this->where('username', $username)->first();
    }
}
```

<a name="customizing-the-password-validation"></a>
### 自定义密码验证

使用密码授权进行身份验证时，Passport 将使用模型的 `password` 属性来验证给定的密码。如果你的模型没有 `password` 属性，或者你希望自定义密码验证逻辑，可以在模型上定义一个 `validateForPassportPasswordGrant` 方法：

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Hash;
use Laravel\Passport\Contracts\OAuthenticatable;
use Laravel\Passport\HasApiTokens;

class User extends Authenticatable implements OAuthenticatable
{
    use HasApiTokens, Notifiable;

    /**
     * Validate the password of the user for the Passport password grant.
     */
    public function validateForPassportPasswordGrant(string $password): bool
    {
        return Hash::check($password, $this->password);
    }
}
```

<a name="implicit-grant"></a>
## 隐式授权

> [!WARNING]
> 我们不再建议使用隐式授权令牌。相反，你应选择[OAuth2 服务器当前推荐的授权类型](https://oauth2.thephpleague.com/authorization-server/which-grant/)。

隐式授权类似于授权码授权；但是，令牌在未经授权码交换的情况下直接返回给客户端。此授权最常用于 JavaScript 或移动应用程序，因为客户端凭据无法安全存储。要启用该授权，请在应用程序的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用 `enableImplicitGrant` 方法：

```php
/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Passport::enableImplicitGrant();
}
```

在应用程序可以通过隐式授权颁发令牌之前，你需要创建一个隐式授权客户端。你可以使用带有 `--implicit` 选项的 `passport:client` Artisan 命令来完成此操作。

```shell
php artisan passport:client --implicit
```

启用授权并创建隐式客户端后，开发人员可以使用其客户端 ID 向你的应用程序请求访问令牌。消费应用程序应向你的应用程序的 `/oauth/authorize` 路由发起重定向请求，如下所示：

```php
use Illuminate\Http\Request;

Route::get('/redirect', function (Request $request) {
    $request->session()->put('state', $state = Str::random(40));

    $query = http_build_query([
        'client_id' => 'your-client-id',
        'redirect_uri' => 'https://third-party-app.com/callback',
        'response_type' => 'token',
        'scope' => 'user:read orders:create',
        'state' => $state,
        // 'prompt' => '', // "none", "consent", or "login"
    ]);

    return redirect('https://passport-app.test/oauth/authorize?'.$query);
});
```

> [!NOTE]
> 记住，`/oauth/authorize` 路由已由 Passport 定义。你不需要手动定义此路由。

<a name="client-credentials-grant"></a>
## 客户端凭证授权

客户端凭证授权适用于机器对机器的身份验证。例如，你可以在执行 API 维护任务的计划作业中使用此授权。

在应用程序可以通过客户端凭证授权颁发令牌之前，你需要创建一个客户端凭证授权客户端。你可以使用 `passport:client` Artisan 命令的 `--client` 选项来完成此操作：

```shell
php artisan passport:client --client
```

接下来，将 `Laravel\Passport\Http\Middleware\EnsureClientIsResourceOwner` 中间件分配给一个路由：

```php
use Laravel\Passport\Http\Middleware\EnsureClientIsResourceOwner;

Route::get('/orders', function (Request $request) {
    // Access token is valid and the client is resource owner...
})->middleware(EnsureClientIsResourceOwner::class);
```

要限制对路由的访问以仅限特定作用域，你可以向 `using` 方法提供所需作用域的列表：

```php
Route::get('/orders', function (Request $request) {
    // Access token is valid, the client is resource owner, and has both "servers:read" and "servers:create" scopes...
})->middleware(EnsureClientIsResourceOwner::using('servers:read', 'servers:create'));
```

> [!WARNING]
> [底层 OAuth2 服务器](https://oauth2.thephpleague.com/database-setup/#:~:text=Please%20note%20that,the%20bearer%20token.)将令牌的 `sub` 声明设置为客户端凭证令牌的客户端标识符。默认情况下，Passport 对客户端使用 UUID，因此这不会与用户的整数主键冲突。但是，如果你已将 `Passport::$clientUuids` 设置为 `false`，客户端凭证令牌可能会意外地解析出 ID 与客户端 ID 匹配的用户。在这种情况下，使用此中间件无法保证传入令牌是客户端凭证令牌。

<a name="retrieving-tokens"></a>
### 检索令牌

要使用此授权类型检索令牌，请向 `oauth/token` 端点发出请求：

```php
use Illuminate\Support\Facades\Http;

$response = Http::asForm()->post('https://passport-app.test/oauth/token', [
    'grant_type' => 'client_credentials',
    'client_id' => 'your-client-id',
    'client_secret' => 'your-client-secret',
    'scope' => 'servers:read servers:create',
]);

return $response->json()['access_token'];
```

<a name="personal-access-tokens"></a>
## 个人访问令牌

有时，你的用户可能希望在不经过典型的授权码重定向流程的情况下自行颁发访问令牌。允许用户通过应用程序的 UI 自行颁发令牌对于让用户试验你的 API 可能很有用，或者可以作为颁发访问令牌的更简单方法。

> [!NOTE]
> 如果你的应用程序主要使用 Passport 来颁发个人访问令牌，请考虑使用 [Laravel Sanctum](/docs/{{version}}/sanctum)，这是 Laravel 用于颁发 API 访问令牌的轻量级第一方库。

<a name="creating-a-personal-access-client"></a>
### 创建个人访问客户端

在应用程序可以颁发个人访问令牌之前，你需要创建一个个人访问客户端。你可以通过执行带有 `--personal` 选项的 `passport:client` Artisan 命令来完成此操作。如果你已经运行了 `passport:install` 命令，则无需运行此命令：

```shell
php artisan passport:client --personal
```

<a name="customizing-the-user-provider-for-pat"></a>
### 自定义用户提供者

如果你的应用程序使用多个[身份验证用户提供者](/docs/{{version}}/authentication#introduction)，你可以通过在通过 `artisan passport:client --personal` 命令创建客户端时提供 `--provider` 选项来指定个人访问授权客户端使用的用户提供者。给定的提供者名称应与应用程序 `config/auth.php` 配置文件中定义的有效提供者匹配。然后，你可以[使用中间件保护路由](#multiple-authentication-guards)，以确保只有来自守卫指定提供者的用户被授权。

<a name="managing-personal-access-tokens"></a>
### 管理个人访问令牌

创建个人访问客户端后，你可以使用 `App\Models\User` 模型实例上的 `createToken` 方法为给定用户颁发令牌。`createToken` 方法接受令牌名称作为其第一个参数，以及可选的[作用域](#token-scopes)数组作为其第二个参数：

```php
use App\Models\User;
use Illuminate\Support\Facades\Date;
use Laravel\Passport\Token;

$user = User::find($userId);

// Creating a token without scopes...
$token = $user->createToken('My Token')->accessToken;

// Creating a token with scopes...
$token = $user->createToken('My Token', ['user:read', 'orders:create'])->accessToken;

// Creating a token with all scopes...
$token = $user->createToken('My Token', ['*'])->accessToken;

// Retrieving all the valid personal access tokens that belong to the user...
$tokens = $user->tokens()
    ->with('client')
    ->where('revoked', false)
    ->where('expires_at', '>', Date::now())
    ->get()
    ->filter(fn (Token $token) => $token->client->hasGrantType('personal_access'));
```

<a name="protecting-routes"></a>
## 保护路由

<a name="via-middleware"></a>
### 通过中间件

Passport 包含一个[身份验证守卫](/docs/{{version}}/authentication#adding-custom-guards)，它将验证传入请求上的访问令牌。一旦你将 `api` 守卫配置为使用 `passport` 驱动，你只需要在任何需要有效访问令牌的路由上指定 `auth:api` 中间件：

```php
Route::get('/user', function () {
    // Only API authenticated users may access this route...
})->middleware('auth:api');
```

> [!WARNING]
> 如果你使用的是[客户端凭证授权](#client-credentials-grant)，应使用[`Laravel\Passport\Http\Middleware\EnsureClientIsResourceOwner` 中间件](#client-credentials-grant)来保护路由，而不是 `auth:api` 中间件。

<a name="multiple-authentication-guards"></a>
#### 多个身份验证守卫

如果你的应用程序对不同类型的用户（可能使用完全不同的 Eloquent 模型）进行身份验证，你可能需要为应用程序中的每个用户提供者类型定义守卫配置。这允许你保护针对特定用户提供者的请求。例如，给定 `config/auth.php` 配置文件中的以下守卫配置：

```php
'guards' => [
    'api' => [
        'driver' => 'passport',
        'provider' => 'users',
    ],

    'api-customers' => [
        'driver' => 'passport',
        'provider' => 'customers',
    ],
],
```

以下路由将使用 `api-customers` 守卫，该守卫使用 `customers` 用户提供者来验证传入请求：

```php
Route::get('/customer', function () {
    // ...
})->middleware('auth:api-customers');
```

> [!NOTE]
> 有关将多个用户提供者与 Passport 一起使用的更多信息，请查阅[个人访问令牌文档](#customizing-the-user-provider-for-pat)和[密码授权文档](#customizing-the-user-provider)。

<a name="passing-the-access-token"></a>
### 传递访问令牌

当调用受 Passport 保护的路由时，应用程序的 API 消费者应将其访问令牌作为请求的 `Authorization` 标头中的 `Bearer` 令牌指定。例如，使用 `Http` 门面时：

```php
use Illuminate\Support\Facades\Http;

$response = Http::withHeaders([
    'Accept' => 'application/json',
    'Authorization' => "Bearer $accessToken",
])->get('https://passport-app.test/api/user');

return $response->json();
```

<a name="token-scopes"></a>
## 令牌作用域

作用域允许你的 API 客户端在请求授权访问账户时请求一组特定的权限。例如，如果你正在构建一个电子商务应用程序，并非所有 API 消费者都需要下订单的能力。相反，你可以允许消费者仅请求授权访问订单发货状态。换句话说，作用域允许你的应用程序的用户限制第三方应用程序代表他们可以执行的操作。

<a name="defining-scopes"></a>
### 定义作用域

你可以使用 `Passport::tokensCan` 方法在应用程序的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中定义 API 的作用域。`tokensCan` 方法接受作用域名称和作用域描述的数组。作用域描述可以是任何你想要的内容，并将显示在授权批准屏幕上给用户：

```php
/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Passport::tokensCan([
        'user:read' => 'Retrieve the user info',
        'orders:create' => 'Place orders',
        'orders:read:status' => 'Check order status',
    ]);
}
```

<a name="default-scope"></a>
### 默认作用域

如果客户端没有请求任何特定作用域，你可以使用 `defaultScopes` 方法配置你的 Passport 服务器以将默认作用域附加到令牌。通常，你应在应用程序的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用此方法：

```php
use Laravel\Passport\Passport;

Passport::tokensCan([
    'user:read' => 'Retrieve the user info',
    'orders:create' => 'Place orders',
    'orders:read:status' => 'Check order status',
]);

Passport::defaultScopes([
    'user:read',
    'orders:create',
]);
```

<a name="assigning-scopes-to-tokens"></a>
### 分配作用域给令牌

<a name="when-requesting-authorization-codes"></a>
#### 请求授权码时

使用授权码授权请求访问令牌时，消费者应将其所需的作用域指定为 `scope` 查询字符串参数。`scope` 参数应是一个以空格分隔的作用域列表：

```php
Route::get('/redirect', function () {
    $query = http_build_query([
        'client_id' => 'your-client-id',
        'redirect_uri' => 'https://third-party-app.com/callback',
        'response_type' => 'code',
        'scope' => 'user:read orders:create',
    ]);

    return redirect('https://passport-app.test/oauth/authorize?'.$query);
});
```

<a name="when-issuing-personal-access-tokens"></a>
#### 颁发个人访问令牌时

如果你使用 `App\Models\User` 模型的 `createToken` 方法颁发个人访问令牌，可以将所需作用域的数组作为第二个参数传递给该方法：

```php
$token = $user->createToken('My Token', ['orders:create'])->accessToken;
```

<a name="checking-scopes"></a>
### 检查作用域

Passport 包含两个中间件，可用于验证传入请求是否使用已授予给定作用域的令牌进行身份验证。

<a name="check-for-all-scopes"></a>
#### 检查所有作用域

`Laravel\Passport\Http\Middleware\CheckToken` 中间件可以分配给一个路由，以验证传入请求的访问令牌是否具有所有列出的作用域：

```php
use Laravel\Passport\Http\Middleware\CheckToken;

Route::get('/orders', function () {
    // Access token has both "orders:read" and "orders:create" scopes...
})->middleware(['auth:api', CheckToken::using('orders:read', 'orders:create')]);
```

<a name="check-for-any-scopes"></a>
#### 检查任意作用域

`Laravel\Passport\Http\Middleware\CheckTokenForAnyScope` 中间件可以分配给一个路由，以验证传入请求的访问令牌是否具有*至少一个*列出的作用域：

```php
use Laravel\Passport\Http\Middleware\CheckTokenForAnyScope;

Route::get('/orders', function () {
    // Access token has either "orders:read" or "orders:create" scope...
})->middleware(['auth:api', CheckTokenForAnyScope::using('orders:read', 'orders:create')]);
```

<a name="scope-attributes"></a>
#### 作用域属性

如果你的应用程序使用[控制器中间件属性](/docs/{{version}}/controllers#middleware-attributes)，你可以使用 `Laravel\Passport\Attributes\AuthorizeToken` 属性作为 Passport 作用域中间件的便捷快捷方式：

```php
<?php

namespace App\Http\Controllers;

use Laravel\Passport\Attributes\AuthorizeToken;

#[AuthorizeToken('orders:read')]
#[AuthorizeToken('orders:create', only: ['store'])]
class OrderController
{
    #[AuthorizeToken(['orders:read', 'orders:create'], anyScope: true)]
    public function index()
    {
        // Access token has either "orders:read" or "orders:create" scope...
    }

    public function store()
    {
        // Access token has both "orders:read" and "orders:create" scopes...
    }
}
```

默认情况下，`AuthorizeToken` 属性要求所有给定的作用域。如果你传递 `anyScope: true`，则当令牌至少具有其中一个给定的作用域时，请求将被授权。

<a name="checking-scopes-on-a-token-instance"></a>
#### 在令牌实例上检查作用域

一旦访问令牌通过身份验证的请求进入你的应用程序，你仍然可以使用已认证的 `App\Models\User` 实例上的 `tokenCan` 方法检查令牌是否具有给定作用域：

```php
use Illuminate\Http\Request;

Route::get('/orders', function (Request $request) {
    if ($request->user()->tokenCan('orders:create')) {
        // ...
    }
});
```

<a name="additional-scope-methods"></a>
#### 其他作用域方法

`scopeIds` 方法将返回所有已定义 ID/名称的数组：

```php
use Laravel\Passport\Passport;

Passport::scopeIds();
```

`scopes` 方法将返回所有已定义作用域的数组，作为 `Laravel\Passport\Scope` 的实例：

```php
Passport::scopes();
```

`scopesFor` 方法将返回与给定 ID/名称匹配的 `Laravel\Passport\Scope` 实例数组：

```php
Passport::scopesFor(['user:read', 'orders:create']);
```

你可以使用 `hasScope` 方法确定是否已定义给定作用域：

```php
Passport::hasScope('orders:create');
```

<a name="spa-authentication"></a>
## SPA 身份验证

在构建 API 时，能够从你的 JavaScript 应用程序消费自己的 API 非常有用。这种 API 开发方法允许你自己的应用程序消费你与世界共享的相同 API。相同的 API 可以被你的 Web 应用程序、移动应用程序、第三方应用程序以及你在各种包管理器上发布的任何 SDK 消费。

通常，如果你想从 JavaScript 应用程序消费自己的 API，你需要手动向应用程序发送一个访问令牌，并在每次请求时将其传递给你的应用程序。但是，Passport 包含一个可以为你处理此操作的中间件。你只需将 `CreateFreshApiToken` 中间件添加到应用程序 `bootstrap/app.php` 文件中的 `web` 中间件组：

```php
use Laravel\Passport\Http\Middleware\CreateFreshApiToken;

->withMiddleware(function (Middleware $middleware): void {
    $middleware->web(append: [
        CreateFreshApiToken::class,
    ]);
})
```

> [!WARNING]
> 你应确保 `CreateFreshApiToken` 中间件是中间件堆栈中列出的最后一个中间件。

此中间件会将一个 `laravel_token` cookie 附加到你的外出响应中。此 cookie 包含一个加密的 JWT，Passport 将使用它来验证来自你的 JavaScript 应用程序的 API 请求。JWT 的生命周期等于你的 `session.lifetime` 配置值。现在，由于浏览器会自动将 cookie 与所有后续请求一起发送，你可以向应用程序的 API 发出请求，而无需显式传递访问令牌：

```js
axios.get('/api/user')
    .then(response => {
        console.log(response.data);
    });
```

<a name="customizing-the-cookie-name"></a>
#### 自定义 Cookie 名称

如果需要，你可以使用 `Passport::cookie` 方法自定义 `laravel_token` cookie 的名称。通常，此方法应在应用程序的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用：

```php
/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Passport::cookie('custom_name');
}
```

<a name="csrf-protection"></a>
#### CSRF 保护

使用此身份验证方法时，你需要确保请求中包含有效的 CSRF 令牌标头。默认 Laravel JavaScript 脚手架（包含在骨架应用程序和所有入门套件中）包含一个 [Axios](https://github.com/axios/axios) 实例，它将自动使用加密的 `XSRF-TOKEN` cookie 值在同源请求上发送 `X-XSRF-TOKEN` 标头。

> [!NOTE]
> 如果你选择发送 `X-CSRF-TOKEN` 标头而不是 `X-XSRF-TOKEN`，则需要使用 `csrf_token()` 提供的未加密令牌。

<a name="events"></a>
## 事件

Passport 在颁发访问令牌和刷新令牌时引发事件。你可以[监听这些事件](/docs/{{version}}/events)以清除或撤销数据库中的其他访问令牌：

<div class="overflow-auto">

| 事件名称                                       |
| --------------------------------------------- |
| `Laravel\Passport\Events\AccessTokenCreated`  |
| `Laravel\Passport\Events\AccessTokenRevoked`  |
| `Laravel\Passport\Events\RefreshTokenCreated` |

</div>

<a name="testing"></a>
## 测试

Passport 的 `actingAs` 方法可用于指定当前已认证用户及其作用域。传递给 `actingAs` 方法的第一个参数是用户实例，第二个参数是应授予用户令牌的作用域数组：

```php tab=Pest
use App\Models\User;
use Laravel\Passport\Passport;

test('orders can be created', function () {
    Passport::actingAs(
        User::factory()->create(),
        ['orders:create']
    );

    $response = $this->post('/api/orders');

    $response->assertStatus(201);
});
```

```php tab=PHPUnit
use App\Models\User;
use Laravel\Passport\Passport;

public function test_orders_can_be_created(): void
{
    Passport::actingAs(
        User::factory()->create(),
        ['orders:create']
    );

    $response = $this->post('/api/orders');

    $response->assertStatus(201);
}
```

Passport 的 `actingAsClient` 方法可用于指定当前已认证客户端及其作用域。传递给 `actingAsClient` 方法的第一个参数是客户端实例，第二个参数是应授予客户端令牌的作用域数组：

```php tab=Pest
use Laravel\Passport\Client;
use Laravel\Passport\Passport;

test('servers can be retrieved', function () {
    Passport::actingAsClient(
        Client::factory()->create(),
        ['servers:read']
    );

    $response = $this->get('/api/servers');

    $response->assertStatus(200);
});
```

```php tab=PHPUnit
use Laravel\Passport\Client;
use Laravel\Passport\Passport;

public function test_servers_can_be_retrieved(): void
{
    Passport::actingAsClient(
        Client::factory()->create(),
        ['servers:read']
    );

    $response = $this->get('/api/servers');

    $response->assertStatus(200);
}
```

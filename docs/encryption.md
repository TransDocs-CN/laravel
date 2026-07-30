# 加密

- [简介](#introduction)
- [配置](#configuration)
    - [优雅地轮换加密密钥](#gracefully-rotating-encryption-keys)
- [使用加密器](#using-the-encrypter)

<a name="introduction"></a>
## 简介

Laravel 的加密服务提供了一个简单、方便的接口，用于通过 OpenSSL 使用 AES-256 和 AES-128 加密对文本进行加密和解密。所有 Laravel 的加密值都使用消息认证码（MAC）签名，这样它们的底层值一旦被加密就无法被修改或篡改。

<a name="configuration"></a>
## 配置

在使用 Laravel 的加密器之前，你必须在 `config/app.php` 配置文件中设置 `key` 配置选项。此配置值由 `APP_KEY` 环境变量驱动。你应该使用 `php artisan key:generate` 命令来生成此变量的值，因为 `key:generate` 命令将使用 PHP 的安全随机字节生成器为你的应用程序构建一个加密安全的密钥。通常，`APP_KEY` 环境变量的值将在 [Laravel 安装](/docs/{{version}}/installation)期间为你生成。

<a name="gracefully-rotating-encryption-keys"></a>
### 优雅地轮换加密密钥

如果你更改应用程序的加密密钥，所有已认证的用户会话将从你的应用程序中退出登录。这是因为每个 Cookie，包括会话 Cookie，都由 Laravel 加密。此外，将无法再解密任何使用你之前的加密密钥加密的数据。

为了缓解此问题，Laravel 允许你在应用程序的 `APP_PREVIOUS_KEYS` 环境变量中列出之前的加密密钥。此变量可以包含一个逗号分隔的所有之前加密密钥的列表：

```ini
APP_KEY="base64:J63qRTDLub5NuZvP+kb8YIorGS6qFYHKVo6u7179stY="
APP_PREVIOUS_KEYS="base64:2nLsGFGzyoae2ax3EF2Lyq/hH6QghBGLIq5uL+Gp8/w="
```

当你设置此环境变量时，Laravel 在加密值时将始终使用「当前」加密密钥。但是，在解密值时，Laravel 将首先尝试当前密钥，如果使用当前密钥解密失败，Laravel 将尝试所有之前的密钥，直到其中某个密钥能够解密该值。

这种优雅的解密方法允许用户即使你的加密密钥被轮换，也能保持不间断地使用你的应用程序。

<a name="using-the-encrypter"></a>
## 使用加密器

<a name="encrypting-a-value"></a>
#### 加密值

你可以使用 `Crypt` 门面提供的 `encryptString` 方法来加密一个值。所有加密的值都使用 OpenSSL 和 AES-256-CBC 加密算法进行加密。此外，所有加密的值都使用消息认证码（MAC）签名。集成的消息认证码将阻止对任何被恶意用户篡改过的值进行解密：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;

class DigitalOceanTokenController extends Controller
{
    /**
     * Store a DigitalOcean API token for the user.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->user()->fill([
            'token' => Crypt::encryptString($request->token),
        ])->save();

        return redirect('/secrets');
    }
}
```

<a name="decrypting-a-value"></a>
#### 解密值

你可以使用 `Crypt` 门面提供的 `decryptString` 方法解密值。如果无法正确解密值，例如当消息认证码无效时，将抛出 `Illuminate\Contracts\Encryption\DecryptException`：

```php
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;

try {
    $decrypted = Crypt::decryptString($encryptedValue);
} catch (DecryptException $e) {
    // ...
}
```

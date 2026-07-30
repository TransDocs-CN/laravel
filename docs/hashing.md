# 哈希

- [简介](#introduction)
- [配置](#configuration)
- [基本用法](#basic-usage)
    - [哈希密码](#hashing-passwords)
    - [验证密码是否与哈希匹配](#verifying-that-a-password-matches-a-hash)
    - [判断密码是否需要重新哈希](#determining-if-a-password-needs-to-be-rehashed)
- [哈希算法验证](#hash-algorithm-verification)

<a name="introduction"></a>
## 简介

Laravel 的 `Hash`[门面](/docs/{{version}}/facades)为存储用户密码提供了安全的 Bcrypt 和 Argon2 哈希。如果你正在使用其中一个 [Laravel 应用程序启动工具包](/docs/{{version}}/starter-kits)，默认情况下将使用 Bcrypt 进行注册和身份认证。

Bcrypt 是哈希密码的一个很好的选择，因为其「工作因子」是可调整的，这意味着生成哈希所需的时间可以随着硬件能力的提高而增加。在哈希密码时，慢是好事。算法哈希密码所需的时间越长，恶意用户生成可能用于对应用程序进行暴力攻击的所有可能字符串哈希值的「彩虹表」所需的时间就越长。

<a name="configuration"></a>
## 配置

默认情况下，Laravel 在哈希数据时使用 `bcrypt` 哈希驱动。但是，还支持其他几种哈希驱动，包括 [argon](https://en.wikipedia.org/wiki/Argon2) 和 [argon2id](https://en.wikipedia.org/wiki/Argon2)。

你可以使用 `HASH_DRIVER` 环境变量指定应用程序的哈希驱动。但是，如果你想自定义 Laravel 的所有哈希驱动选项，应使用 `config:publish` Artisan 命令发布完整的 `hashing` 配置文件：

```shell
php artisan config:publish hashing
```

<a name="basic-usage"></a>
## 基本用法

<a name="hashing-passwords"></a>
### 哈希密码

你可以通过在 `Hash` 门面上调用 `make` 方法来哈希密码：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class PasswordController extends Controller
{
    /**
     * Update the password for the user.
     */
    public function update(Request $request): RedirectResponse
    {
        // Validate the new password length...

        $request->user()->fill([
            'password' => Hash::make($request->newPassword)
        ])->save();

        return redirect('/profile');
    }
}
```

<a name="adjusting-the-bcrypt-work-factor"></a>
#### 调整 Bcrypt 工作因子

如果你正在使用 Bcrypt 算法，`make` 方法允许你使用 `rounds` 选项管理算法的工作因子；但是，Laravel 管理的默认工作因子对于大多数应用程序来说是可以接受的：

```php
$hashed = Hash::make('password', [
    'rounds' => 12,
]);
```

<a name="adjusting-the-argon2-work-factor"></a>
#### 调整 Argon2 工作因子

如果你正在使用 Argon2 算法，`make` 方法允许你使用 `memory`、`time` 和 `threads` 选项管理算法的工作因子；但是，Laravel 管理的默认值对于大多数应用程序来说是可以接受的：

```php
$hashed = Hash::make('password', [
    'memory' => 1024,
    'time' => 2,
    'threads' => 2,
]);
```

> [!NOTE]
> 有关这些选项的更多信息，请参考[关于 Argon 哈希的官方 PHP 文档](https://secure.php.net/manual/en/function.password-hash.php)。

<a name="verifying-that-a-password-matches-a-hash"></a>
### 验证密码是否与哈希匹配

`Hash` 门面提供的 `check` 方法允许你验证给定的纯文本字符串是否与给定的哈希匹配：

```php
if (Hash::check('plain-text', $hashedPassword)) {
    // The passwords match...
}
```

<a name="determining-if-a-password-needs-to-be-rehashed"></a>
### 判断密码是否需要重新哈希

`Hash` 门面提供的 `needsRehash` 方法允许你确定自密码哈希以来，哈希器使用的工作因子是否已更改。某些应用程序选择在应用程序的认证过程中执行此检查：

```php
if (Hash::needsRehash($hashed)) {
    $hashed = Hash::make('plain-text');
}
```

<a name="hash-algorithm-verification"></a>
## 哈希算法验证

为防止哈希算法篡改，Laravel 的 `Hash::check` 方法将首先验证给定的哈希是使用应用程序选择的哈希算法生成的。如果算法不同，将抛出 `RuntimeException` 异常。

对于大多数应用程序来说，这是预期的行为，哈希算法预计不会改变，不同的算法可能表明存在恶意攻击。但是，如果你需要在应用程序中支持多种哈希算法，例如当从一种算法迁移到另一种算法时，你可以通过将 `HASH_VERIFY` 环境变量设置为 `false` 来禁用哈希算法验证：

```ini
HASH_VERIFY=false
```

# Laravel Valet

- [简介](#introduction)
- [安装](#installation)
    - [升级 Valet](#upgrading-valet)
- [服务站点](#serving-sites)
    - ["Park"命令](#the-park-command)
    - ["Link"命令](#the-link-command)
    - [使用 TLS 保护站点](#securing-sites)
    - [服务默认站点](#serving-a-default-site)
    - [每个站点的 PHP 版本](#per-site-php-versions)
- [分享站点](#sharing-sites)
    - [在本地网络上分享站点](#sharing-sites-on-your-local-network)
- [站点特定的环境变量](#site-specific-environment-variables)
- [代理服务](#proxying-services)
- [自定义 Valet 驱动](#custom-valet-drivers)
    - [本地驱动](#local-drivers)
- [其他 Valet 命令](#other-valet-commands)
- [Valet 目录和文件](#valet-directories-and-files)
    - [磁盘访问](#disk-access)

<a name="introduction"></a>
## 简介

> [!NOTE]
> 在寻找更简单的方法在 macOS 或 Windows 上开发 Laravel 应用程序吗？请查看 [Laravel Herd](https://herd.laravel.com)。Herd 包含了开始 Laravel 开发所需的一切，包括 Valet、PHP 和 Composer。

[Laravel Valet](https://github.com/laravel/valet) 是为 macOS 极简主义者设计的开发环境。Laravel Valet 配置你的 Mac，使其在系统启动时始终在后台运行 [Nginx](https://www.nginx.com/)。然后，使用 [DnsMasq](https://en.wikipedia.org/wiki/Dnsmasq)，Valet 代理所有对 `*.test` 域名的请求，指向你本地机器上安装的站点。

换句话说，Valet 是一个极快的 Laravel 开发环境，仅使用约 7 MB 的 RAM。Valet 不能完全替代 [Sail](/docs/{{version}}/sail) 或 [Homestead](/docs/{{version}}/homestead)，但如果你想要灵活的基础功能、追求极致的速度，或者在使用内存有限的机器时，它提供了一个很好的替代方案。

开箱即用，Valet 支持包括但不限于以下内容：

<style>
    #valet-support > ul {
        column-count: 3; -moz-column-count: 3; -webkit-column-count: 3;
        line-height: 1.9;
    }
</style>

<div id="valet-support" markdown="1">

- [Laravel](https://laravel.com)
- [Bedrock](https://roots.io/bedrock/)
- [CakePHP 3](https://cakephp.org)
- [ConcreteCMS](https://www.concretecms.com/)
- [Contao](https://contao.org/en/)
- [Craft](https://craftcms.com)
- [Drupal](https://www.drupal.org/)
- [ExpressionEngine](https://www.expressionengine.com/)
- [Jigsaw](https://jigsaw.tighten.co)
- [Joomla](https://www.joomla.org/)
- [Katana](https://github.com/themsaid/katana)
- [Kirby](https://getkirby.com/)
- [Magento](https://magento.com/)
- [OctoberCMS](https://octobercms.com/)
- [Sculpin](https://sculpin.io/)
- [Slim](https://www.slimframework.com)
- [Statamic](https://statamic.com)
- 静态 HTML
- [Symfony](https://symfony.com)
- [WordPress](https://wordpress.org)
- [Zend](https://framework.zend.com)

</div>

但是，你可以通过自己的[自定义驱动](#custom-valet-drivers)来扩展 Valet。

<a name="installation"></a>
## 安装

> [!WARNING]
> Valet 需要 macOS 和 [Homebrew](https://brew.sh/)。在安装之前，你应确保没有其他程序（如 Apache 或 Nginx）绑定到本地机器的 80 端口。

首先，你需要使用 `update` 命令确保 Homebrew 是最新的：

```shell
brew update
```

接下来，你应该使用 Homebrew 安装 PHP：

```shell
brew install php
```

安装 PHP 后，你就可以安装 [Composer 包管理器](https://getcomposer.org)了。此外，你应确保 `$HOME/.composer/vendor/bin` 目录在你的系统"PATH"中。安装 Composer 后，你可以将 Laravel Valet 安装为全局 Composer 包：

```shell
composer global require laravel/valet
```

最后，你可以执行 Valet 的 `install` 命令。这将配置和安装 Valet 和 DnsMasq。此外，Valet 依赖的守护进程将被配置为在系统启动时启动：

```shell
valet install
```

Valet 安装后，尝试在你的终端中 ping 任意 `*.test` 域名，例如 `ping foobar.test`。如果 Valet 安装正确，你应该看到此域名响应 `127.0.0.1`。

Valet 将在每次机器启动时自动启动其所需的服务。

<a name="php-versions"></a>
#### PHP 版本

> [!NOTE]
> 除了修改全局 PHP 版本，你也可以通过 `isolate` [命令](#per-site-php-versions)指示 Valet 使用每个站点的 PHP 版本。

Valet 允许你使用 `valet use php@version` 命令切换 PHP 版本。如果指定的 PHP 版本尚未安装，Valet 将通过 Homebrew 安装它：

```shell
valet use php@8.2

valet use php
```

你也可以在项目的根目录创建一个 `.valetrc` 文件。`.valetrc` 文件应包含站点应使用的 PHP 版本：

```shell
php=php@8.2
```

创建此文件后，你可以简单地执行 `valet use` 命令，该命令将通过读取文件来确定站点的首选 PHP 版本。

> [!WARNING]
> Valet 一次只服务一个 PHP 版本，即使你安装了多个 PHP 版本。

<a name="database"></a>
#### 数据库

如果你的应用程序需要数据库，请查看 [DBngin](https://dbngin.com)，它提供了一个免费的、一体化的数据库管理工具，包括 MySQL、PostgreSQL 和 Redis。安装 DBngin 后，你可以使用 `root` 用户名和空密码连接到 `127.0.0.1` 上的数据库。

<a name="resetting-your-installation"></a>
#### 重置安装

如果你在正常运行 Valet 安装时遇到问题，执行 `composer global require laravel/valet` 命令后接 `valet install` 将重置你的安装，并可以解决各种问题。在极少数情况下，可能需要通过执行 `valet uninstall --force` 后接 `valet install` 来"硬重置"Valet。

<a name="upgrading-valet"></a>
### 升级 Valet

你可以通过在终端中执行 `composer global require laravel/valet` 命令来更新你的 Valet 安装。升级后，最好运行 `valet install` 命令，以便 Valet 在必要时对你的配置文件进行额外升级。

<a name="upgrading-to-valet-4"></a>
#### 升级到 Valet 4

如果你正在从 Valet 3 升级到 Valet 4，请执行以下步骤以正确升级你的 Valet 安装：

<div class="content-list" markdown="1">

- 如果你已添加 `.valetphprc` 文件来自定义站点的 PHP 版本，请将每个 `.valetphprc` 文件重命名为 `.valetrc`。然后，在 `.valetrc` 文件的现有内容前加上 `php=`。
- 更新任何自定义驱动以匹配新驱动系统的命名空间、扩展、类型提示和返回类型提示。你可以参考 Valet 的 [SampleValetDriver](https://github.com/laravel/valet/blob/d7787c025e60abc24a5195dc7d4c5c6f2d984339/cli/stubs/SampleValetDriver.php) 作为示例。
- 如果你使用 PHP 7.1 - 7.4 来服务站点，请确保你仍然使用 Homebrew 安装 PHP 8.0 或更高版本，因为 Valet 将使用此版本（即使不是你主链接的版本）来运行其某些脚本。

</div>

<a name="serving-sites"></a>
## 服务站点

Valet 安装后，你就可以开始服务你的 Laravel 应用程序了。Valet 提供了两个命令来帮助你服务应用程序：`park` 和 `link`。

<a name="the-park-command"></a>
### `park` 命令

`park` 命令在你的机器上注册一个包含你的应用程序的目录。一旦该目录被 Valet"停放"，该目录中的所有子目录都可以在 Web 浏览器中通过 `http://<directory-name>.test` 访问：

```shell
cd ~/Sites

valet park
```

仅此而已。现在，你在"停放"目录中创建的任何应用程序都将自动使用 `http://<directory-name>.test` 约定提供服务。因此，如果你的停放目录包含一个名为"laravel"的目录，则该目录中的应用程序可通过 `http://laravel.test` 访问。此外，Valet 自动允许你使用通配符子域名（`http://foo.laravel.test`）访问站点。

<a name="the-link-command"></a>
### `link` 命令

`link` 命令也可用于服务你的 Laravel 应用程序。如果你只想服务目录中的单个站点而不是整个目录，此命令非常有用：

```shell
cd ~/Sites/laravel

valet link
```

一旦应用程序通过 `link` 命令链接到 Valet，你就可以使用其目录名称访问该应用程序。因此，上例中链接的站点可以通过 `http://laravel.test` 访问。此外，Valet 自动允许你使用通配符子域名（`http://foo.laravel.test`）访问站点。

如果你希望以不同的主机名服务该应用程序，可以将主机名传递给 `link` 命令。例如，你可以运行以下命令使应用程序可通过 `http://application.test` 访问：

```shell
cd ~/Sites/laravel

valet link application
```

当然，你也可以使用 `link` 命令在子域名上服务应用程序：

```shell
valet link api.application
```

你可以执行 `links` 命令来显示所有链接目录的列表：

```shell
valet links
```

`unlink` 命令可用于删除站点的符号链接：

```shell
cd ~/Sites/laravel

valet unlink
```

<a name="securing-sites"></a>
### 使用 TLS 保护站点

默认情况下，Valet 通过 HTTP 服务站点。但是，如果你希望通过加密的 TLS 使用 HTTP/2 服务站点，可以使用 `secure` 命令。例如，如果你的站点由 Valet 在 `laravel.test` 域上提供服务，你应该运行以下命令来保护它：

```shell
valet secure laravel
```

要"取消保护"站点并恢复为通过普通 HTTP 服务流量，请使用 `unsecure` 命令。与 `secure` 命令一样，此命令接受你想要取消保护的主机名：

```shell
valet unsecure laravel
```

<a name="serving-a-default-site"></a>
### 服务默认站点

有时，你可能希望配置 Valet 在访问未知的 `test` 域名时服务一个"默认"站点，而不是显示 `404`。为此，你可以向 `~/.config/valet/config.json` 配置文件添加一个 `default` 选项，其中包含应作为默认站点的路径：

    "default": "/Users/Sally/Sites/example-site",

<a name="per-site-php-versions"></a>
### 每个站点的 PHP 版本

默认情况下，Valet 使用全局 PHP 安装来服务你的站点。但是，如果你需要在不同站点间支持多个 PHP 版本，可以使用 `isolate` 命令来指定某个特定站点应使用的 PHP 版本。`isolate` 命令配置 Valet 为你当前工作目录中的站点使用指定的 PHP 版本：

```shell
cd ~/Sites/example-site

valet isolate php@8.0
```

如果你的站点名称与包含它的目录名称不匹配，可以使用 `--site` 选项指定站点名称：

```shell
valet isolate php@8.0 --site="site-name"
```

为了方便，你可以使用 `valet php`、`composer` 和 `which-php` 命令，基于站点配置的 PHP 版本将调用代理到适当的 PHP CLI 或工具：

```shell
valet php
valet composer
valet which-php
```

你可以执行 `isolated` 命令来显示所有隔离站点及其 PHP 版本的列表：

```shell
valet isolated
```

要将站点恢复为 Valet 的全局安装 PHP 版本，可以在站点的根目录中调用 `unisolate` 命令：

```shell
valet unisolate
```

<a name="sharing-sites"></a>
## 分享站点

Valet 包含一个向全世界分享你的本地站点的命令，提供了一种简单的方式来在移动设备上测试你的站点，或与团队成员和客户分享。

开箱即用，Valet 支持通过 ngrok 或 Expose 分享你的站点。在分享站点之前，你应该使用 `share-tool` 命令更新你的 Valet 配置，指定 `ngrok`、`expose` 或 `cloudflared`：

```shell
valet share-tool ngrok
```

如果你选择的工具没有通过 Homebrew（对于 ngrok 和 cloudflared）或 Composer（对于 Expose）安装，Valet 会自动提示你安装它。当然，这两个工具都需要你在开始分享站点之前验证你的 ngrok 或 Expose 账户。

要分享站点，在你的终端中导航到站点目录并运行 Valet 的 `share` 命令。一个公开可访问的 URL 将被放入你的剪贴板，可以直接粘贴到浏览器中或与你的团队分享：

```shell
cd ~/Sites/laravel

valet share
```

要停止分享你的站点，你可以按 `Control + C`。

> [!WARNING]
> 如果你使用自定义 DNS 服务器（如 `1.1.1.1`），ngrok 分享可能无法正常工作。如果出现这种情况，打开 Mac 的系统设置，转到网络设置，打开高级设置，然后转到 DNS 标签页，将 `127.0.0.1` 添加为你的第一个 DNS 服务器。

<a name="sharing-sites-via-ngrok"></a>
#### 通过 Ngrok 分享站点

使用 ngrok 分享你的站点需要你[创建一个 ngrok 账户](https://dashboard.ngrok.com/signup)并[设置一个认证令牌](https://dashboard.ngrok.com/get-started/your-authtoken)。拥有认证令牌后，你可以使用该令牌更新 Valet 配置：

```shell
valet set-ngrok-token YOUR_TOKEN_HERE
```

> [!NOTE]
> 你可以向 share 命令传递额外的 ngrok 参数，例如 `valet share --region=eu`。更多信息，请查阅 [ngrok 文档](https://ngrok.com/docs)。

<a name="sharing-sites-via-expose"></a>
#### 通过 Expose 分享站点

使用 Expose 分享你的站点需要你[创建一个 Expose 账户](https://expose.dev/register)并通过你的认证令牌[向 Expose 进行认证](https://expose.dev/docs/getting-started/getting-your-token)。

你可以查阅 [Expose 文档](https://expose.dev/docs)了解有关其支持的其他命令行参数的信息。

<a name="sharing-sites-on-your-local-network"></a>
### 在本地网络上分享站点

Valet 默认将传入流量限制到内部 `127.0.0.1` 接口，以便你的开发机器不暴露于 Internet 的安全风险。

如果你希望允许本地网络上的其他设备通过机器的 IP 地址（例如：`192.168.1.10/application.test`）访问你机器上的 Valet 站点，你需要手动编辑该站点的相应 Nginx 配置文件，以移除 `listen` 指令上的限制。你应移除 80 和 443 端口的 `listen` 指令上的 `127.0.0.1:` 前缀。

如果你没有对项目运行 `valet secure`，可以通过编辑 `/usr/local/etc/nginx/valet/valet.conf` 文件为所有非 HTTPS 站点开放网络访问。但是，如果你通过 HTTPS（已为站点运行了 `valet secure`）服务项目站点，则应编辑 `~/.config/valet/Nginx/app-name.test` 文件。

更新 Nginx 配置后，运行 `valet restart` 命令以应用配置更改。

<a name="site-specific-environment-variables"></a>
## 站点特定的环境变量

某些使用其他框架的应用程序可能依赖于服务器环境变量，但未提供在项目中配置这些变量的方式。Valet 允许你通过在项目根目录添加 `.valet-env.php` 文件来配置站点特定的环境变量。此文件应返回一个站点/环境变量对的数组，这些变量将添加到全局 `$_SERVER` 数组中，适用于数组中指定的每个站点：

```php
<?php

return [
    // 为 laravel.test 站点设置 $_SERVER['key'] 为 "value"...
    'laravel' => [
        'key' => 'value',
    ],

    // 为所有站点设置 $_SERVER['key'] 为 "value"...
    '*' => [
        'key' => 'value',
    ],
];
```

<a name="proxying-services"></a>
## 代理服务

有时你可能希望将 Valet 域名代理到本地机器上的另一个服务。例如，你可能偶尔需要运行 Valet 的同时在 Docker 中运行一个单独的站点；但是，Valet 和 Docker 不能同时绑定到 80 端口。

为了解决这个问题，你可以使用 `proxy` 命令来生成一个代理。例如，你可以将所有来自 `http://elasticsearch.test` 的流量代理到 `http://127.0.0.1:9200`：

```shell
# 通过 HTTP 代理...
valet proxy elasticsearch http://127.0.0.1:9200

# 通过 TLS + HTTP/2 代理...
valet proxy elasticsearch http://127.0.0.1:9200 --secure
```

你可以使用 `unproxy` 命令删除代理：

```shell
valet unproxy elasticsearch
```

你可以使用 `proxies` 命令列出所有被代理的站点配置：

```shell
valet proxies
```

<a name="custom-valet-drivers"></a>
## 自定义 Valet 驱动

你可以编写自己的 Valet"驱动"来服务运行在 Valet 原生不支持的框架或 CMS 上的 PHP 应用程序。安装 Valet 时，会创建一个 `~/.config/valet/Drivers` 目录，其中包含一个 `SampleValetDriver.php` 文件。此文件包含一个示例驱动实现，演示如何编写自定义驱动。编写驱动只需要你实现三个方法：`serves`、`isStaticFile` 和 `frontControllerPath`。

所有三个方法都接收 `$sitePath`、`$siteName` 和 `$uri` 值作为参数。`$sitePath` 是机器上正在服务的站点的完整路径，例如 `/Users/Lisa/Sites/my-project`。`$siteName` 是域名的"主机"/"站点名称"部分（`my-project`）。`$uri` 是传入的请求 URI（`/foo/bar`）。

完成自定义 Valet 驱动后，将其放置在 `~/.config/valet/Drivers` 目录中，使用 `FrameworkValetDriver.php` 命名约定。例如，如果你正在为 WordPress 编写自定义 Valet 驱动，文件名应为 `WordPressValetDriver.php`。

让我们看看你的自定义 Valet 驱动应实现的每个方法的示例实现。

<a name="the-serves-method"></a>
#### `serves` 方法

如果您的驱动应处理传入的请求，`serves` 方法应返回 `true`。否则，该方法应返回 `false`。因此，在此方法中，你应该尝试确定给定的 `$sitePath` 是否包含你试图服务类型的项目。

例如，假设我们正在编写一个 `WordPressValetDriver`。我们的 `serves` 方法可能如下所示：

```php
/**
 * 确定驱动是否应服务该请求。
 */
public function serves(string $sitePath, string $siteName, string $uri): bool
{
    return is_dir($sitePath.'/wp-admin');
}
```

<a name="the-isstaticfile-method"></a>
#### `isStaticFile` 方法

`isStaticFile` 应确定传入的请求是否针对"静态"文件，如图像或样式表。如果文件是静态的，该方法应返回磁盘上静态文件的完整路径。如果传入的请求不是针对静态文件，该方法应返回 `false`：

```php
/**
 * 确定传入请求是否针对静态文件。
 *
 * @return string|false
 */
public function isStaticFile(string $sitePath, string $siteName, string $uri)
{
    if (file_exists($staticFilePath = $sitePath.'/public/'.$uri)) {
        return $staticFilePath;
    }

    return false;
}
```

> [!WARNING]
> `isStaticFile` 方法仅在 `serves` 方法对传入请求返回 `true` 且请求 URI 不是 `/` 时才会被调用。

<a name="the-frontcontrollerpath-method"></a>
#### `frontControllerPath` 方法

`frontControllerPath` 方法应返回应用程序的"前端控制器"的完整路径，通常是一个"index.php"文件或等效文件：

```php
/**
 * 获取应用程序前端控制器的完整解析路径。
 */
public function frontControllerPath(string $sitePath, string $siteName, string $uri): string
{
    return $sitePath.'/public/index.php';
}
```

<a name="local-drivers"></a>
### 本地驱动

如果你想为单个应用程序定义自定义 Valet 驱动，请在应用程序的根目录创建一个 `LocalValetDriver.php` 文件。你的自定义驱动可以扩展基础 `ValetDriver` 类，或扩展现有的应用程序特定驱动，如 `LaravelValetDriver`：

```php
use Valet\Drivers\LaravelValetDriver;

class LocalValetDriver extends LaravelValetDriver
{
    /**
     * 确定驱动是否应服务该请求。
     */
    public function serves(string $sitePath, string $siteName, string $uri): bool
    {
        return true;
    }

    /**
     * 获取应用程序前端控制器的完整解析路径。
     */
    public function frontControllerPath(string $sitePath, string $siteName, string $uri): string
    {
        return $sitePath.'/public_html/index.php';
    }
}
```

<a name="other-valet-commands"></a>
## 其他 Valet 命令

<div class="overflow-auto">

| 命令 | 描述 |
| --- | --- |
| `valet list` | 显示所有 Valet 命令的列表。 |
| `valet diagnose` | 输出诊断信息以帮助调试 Valet。 |
| `valet directory-listing` | 确定目录列表行为。默认为"off"，对目录渲染 404 页面。 |
| `valet forget` | 从"停放"目录中运行此命令以将其从停放目录列表中移除。 |
| `valet log` | 查看 Valet 服务写入的日志列表。 |
| `valet paths` | 查看所有"停放"路径。 |
| `valet restart` | 重启 Valet 守护进程。 |
| `valet start` | 启动 Valet 守护进程。 |
| `valet stop` | 停止 Valet 守护进程。 |
| `valet trust` | 为 Brew 和 Valet 添加 sudoers 文件，允许 Valet 命令无需输入密码即可运行。 |
| `valet uninstall` | 卸载 Valet：显示手动卸载说明。传递 `--force` 选项可强力删除 Valet 的所有资源。 |

</div>

<a name="valet-directories-and-files"></a>
## Valet 目录和文件

在解决 Valet 环境问题时，以下目录和文件信息可能对你有所帮助：

#### `~/.config/valet`

包含 Valet 的所有配置。你可能希望备份此目录。

#### `~/.config/valet/dnsmasq.d/`

此目录包含 DNSMasq 的配置。

#### `~/.config/valet/Drivers/`

此目录包含 Valet 的驱动。驱动决定了特定框架/CMS 如何被服务。

#### `~/.config/valet/Nginx/`

此目录包含 Valet 的所有 Nginx 站点配置。这些文件在运行 `install` 和 `secure` 命令时重建。

#### `~/.config/valet/Sites/`

此目录包含你的[链接项目](#the-link-command)的所有符号链接。

#### `~/.config/valet/config.json`

此文件是 Valet 的主配置文件。

#### `~/.config/valet/valet.sock`

此文件是 Valet 的 Nginx 安装使用的 PHP-FPM 套接字。仅在 PHP 正常运行时才存在。

#### `~/.config/valet/Log/fpm-php.www.log`

此文件是 PHP 错误的用户日志。

#### `~/.config/valet/Log/nginx-error.log`

此文件是 Nginx 错误的用户日志。

#### `/usr/local/var/log/php-fpm.log`

此文件是 PHP-FPM 错误的系统日志。

#### `/usr/local/var/log/nginx`

此目录包含 Nginx 的访问和错误日志。

#### `/usr/local/etc/php/X.X/conf.d`

此目录包含各种 PHP 配置设置的 `*.ini` 文件。

#### `/usr/local/etc/php/X.X/php-fpm.d/valet-fpm.conf`

此文件是 PHP-FPM 池配置文件。

#### `~/.composer/vendor/laravel/valet/cli/stubs/secure.valet.conf`

此文件是用于为你的站点构建 SSL 证书的默认 Nginx 配置。

<a name="disk-access"></a>
### 磁盘访问

自 macOS 10.14 起，默认情况下对某些文件和目录的访问受到限制。这些限制包括桌面、文档和下载目录。此外，网络卷和可移动卷的访问也受到限制。因此，Valet 建议你的站点文件夹位于这些受保护位置之外。

但是，如果你希望从这些位置之一服务站点，你需要授予 Nginx"完全磁盘访问权限"。否则，你可能会遇到服务器错误或 Nginx 的其他不可预测行为，尤其是在服务静态资源时。通常，macOS 会自动提示你授予 Nginx 对这些位置的完全访问权限。或者，你可以通过 `系统偏好设置` > `安全性与隐私` > `隐私` 并选择 `完全磁盘访问权限` 来手动完成。然后，启用主窗格中的任何 `nginx` 条目。

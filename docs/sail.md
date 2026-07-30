# Laravel Sail

- [简介](#introduction)
- [安装与设置](#installation)
    - [重建 Sail 镜像](#rebuilding-sail-images)
    - [配置 Shell 别名](#configuring-a-shell-alias)
- [启动和停止 Sail](#starting-and-stopping-sail)
- [执行命令](#executing-sail-commands)
    - [执行 PHP 命令](#executing-php-commands)
    - [执行 Composer 命令](#executing-composer-commands)
    - [执行 Artisan 命令](#executing-artisan-commands)
    - [执行 Node / NPM 命令](#executing-node-npm-commands)
- [与数据库交互](#interacting-with-sail-databases)
    - [MySQL](#mysql)
    - [MongoDB](#mongodb)
    - [Redis](#redis)
    - [Valkey](#valkey)
    - [Meilisearch](#meilisearch)
    - [Typesense](#typesense)
- [文件存储](#file-storage)
- [运行测试](#running-tests)
    - [Laravel Dusk](#laravel-dusk)
- [预览邮件](#previewing-emails)
- [容器 CLI](#sail-container-cli)
- [PHP 版本](#sail-php-versions)
    - [额外 PHP 扩展](#sail-php-extensions)
- [Node 版本](#sail-node-versions)
- [分享你的站点](#sharing-your-site)
- [使用 Xdebug 调试](#debugging-with-xdebug)
    - [Xdebug CLI 用法](#xdebug-cli-usage)
    - [Xdebug 浏览器用法](#xdebug-browser-usage)
- [自定义](#sail-customization)

<a name="introduction"></a>
## 简介

[Laravel Sail](https://github.com/laravel/sail) 是一个轻量级的命令行界面，用于与 Laravel 默认的 Docker 开发环境进行交互。Sail 为使用 PHP、MySQL 和 Redis 构建 Laravel 应用程序提供了一个很好的起点，无需预先具备 Docker 经验。

Sail 的核心是 `compose.yaml` 文件和存储在项目根目录的 `sail` 脚本。`sail` 脚本提供了一个 CLI，其中包含与 `compose.yaml` 文件定义的 Docker 容器进行交互的便捷方法。

Laravel Sail 支持 macOS、Linux 和 Windows（通过 [WSL2](https://docs.microsoft.com/en-us/windows/wsl/about)）。

<a name="installation"></a>
## 安装与设置

你可以使用 Composer 包管理器安装 Sail：

```shell
composer require laravel/sail --dev
```

安装 Sail 后，你可以运行 `sail:install` Artisan 命令。此命令会将 Sail 的 `compose.yaml` 文件发布到应用程序的根目录，并修改你的 `.env` 文件，添加连接到 Docker 服务所需的环境变量：

```shell
php artisan sail:install
```

最后，你可以启动 Sail。要继续学习如何使用 Sail，请阅读本文档的其余部分：

```shell
./vendor/bin/sail up
```

> [!WARNING]
> 如果你在 Linux 上使用 Docker Desktop，应通过执行以下命令使用 `default` Docker 上下文：`docker context use default`。此外，如果在容器中遇到文件权限错误，你可能需要将 `SUPERVISOR_PHP_USER` 环境变量设置为 `root`。

<a name="adding-additional-services"></a>
#### 添加额外服务

如果你想为现有的 Sail 安装添加额外服务，可以运行 `sail:add` Artisan 命令：

```shell
php artisan sail:add
```

<a name="using-devcontainers"></a>
#### 使用 Devcontainer

如果你希望在一个 [Devcontainer](https://code.visualstudio.com/docs/remote/containers) 中进行开发，可以为 `sail:install` 命令提供 `--devcontainer` 选项。`--devcontainer` 选项将指示 `sail:install` 命令将一个默认的 `.devcontainer/devcontainer.json` 文件发布到应用程序的根目录：

```shell
php artisan sail:install --devcontainer
```

<a name="rebuilding-sail-images"></a>
### 重建 Sail 镜像

有时你可能想要完全重建 Sail 镜像，以确保镜像的所有包和软件都是最新的。你可以使用 `build` 命令来实现：

```shell
docker compose down -v

sail build --no-cache

sail up
```

<a name="configuring-a-shell-alias"></a>
### 配置 Shell 别名

默认情况下，Sail 命令通过所有新 Laravel 应用程序都附带的 `vendor/bin/sail` 脚本调用：

```shell
./vendor/bin/sail up
```

但是，与其重复输入 `vendor/bin/sail` 来执行 Sail 命令，你可能希望配置一个 shell 别名，以便更轻松地执行 Sail 的命令：

```shell
alias sail='sh $([ -f sail ] && echo sail || echo vendor/bin/sail)'
```

为了确保此别名始终可用，你可以将其添加到主目录中的 shell 配置文件中，例如 `~/.zshrc` 或 `~/.bashrc`，然后重新启动你的 shell。

配置好 shell 别名后，你可以通过简单地输入 `sail` 来执行 Sail 命令。本文档其余部分的示例将假设你已配置此别名：

```shell
sail up
```

<a name="starting-and-stopping-sail"></a>
## 启动和停止 Sail

Laravel Sail 的 `compose.yaml` 文件定义了多种 Docker 容器，它们协同工作以帮助你构建 Laravel 应用程序。每个容器都是 `compose.yaml` 文件中 `services` 配置的一个条目。`laravel.test` 容器是提供应用程序服务的主要应用容器。

在启动 Sail 之前，你应确保本地计算机上没有运行其他 Web 服务器或数据库。要启动应用程序 `compose.yaml` 文件中定义的所有 Docker 容器，应执行 `up` 命令：

```shell
sail up
```

要以后台模式启动所有 Docker 容器，你可以以"分离"模式启动 Sail：

```shell
sail up -d
```

一旦应用程序的容器启动，你就可以在 Web 浏览器中通过 http://localhost 访问该项目。

要停止所有容器，只需按 Control + C 停止容器运行。或者，如果容器在后台运行，你可以使用 `stop` 命令：

```shell
sail stop
```

<a name="executing-sail-commands"></a>
## 执行命令

使用 Laravel Sail 时，你的应用程序在 Docker 容器中执行，并与本地计算机隔离。但是，Sail 提供了一种便捷的方式来对你的应用程序运行各种命令，例如任意 PHP 命令、Artisan 命令、Composer 命令和 Node / NPM 命令。

**在阅读 Laravel 文档时，你经常会看到对 Composer、Artisan 和 Node / NPM 命令的引用，但这些命令没有提及 Sail。** 这些示例假设这些工具已安装在你的本地计算机上。如果你使用 Sail 作为本地 Laravel 开发环境，则应使用 Sail 执行这些命令：

```shell
# 在本地运行 Artisan 命令...
php artisan queue:work

# 在 Laravel Sail 中运行 Artisan 命令...
sail artisan queue:work
```

<a name="executing-php-commands"></a>
### 执行 PHP 命令

PHP 命令可以使用 `php` 命令执行。当然，这些命令将使用为应用程序配置的 PHP 版本执行。要了解 Laravel Sail 可用的 PHP 版本，请查阅 [PHP 版本文档](#sail-php-versions)：

```shell
sail php --version

sail php script.php
```

<a name="executing-composer-commands"></a>
### 执行 Composer 命令

Composer 命令可以使用 `composer` 命令执行。Laravel Sail 的应用容器包含 Composer 安装：

```shell
sail composer require laravel/sanctum
```

<a name="executing-artisan-commands"></a>
### 执行 Artisan 命令

Laravel Artisan 命令可以使用 `artisan` 命令执行：

```shell
sail artisan queue:work
```

<a name="executing-node-npm-commands"></a>
### 执行 Node / NPM 命令

Node 命令可以使用 `node` 命令执行，而 NPM 命令可以使用 `npm` 命令执行：

```shell
sail node --version

sail npm run dev
```

如果你愿意，可以使用 Yarn 代替 NPM：

```shell
sail yarn
```

<a name="interacting-with-sail-databases"></a>
## 与数据库交互

<a name="mysql"></a>
### MySQL

你可能已经注意到，应用程序的 `compose.yaml` 文件包含一个 MySQL 容器的条目。该容器使用 [Docker 卷](https://docs.docker.com/storage/volumes/)，以便即使停止和重启容器，存储在数据库中的数据也能持久保存。

此外，MySQL 容器首次启动时，会为你创建两个数据库。第一个数据库使用 `DB_DATABASE` 环境变量的值命名，用于本地开发。第二个是名为 `testing` 的专用测试数据库，将确保你的测试不会干扰开发数据。

启动容器后，你可以通过将应用程序 `.env` 文件中的 `DB_HOST` 环境变量设置为 `mysql` 来连接到 MySQL 实例。

要从本地计算机连接到应用程序的 MySQL 数据库，你可以使用图形化的数据库管理应用程序，如 [TablePlus](https://tableplus.com)。默认情况下，MySQL 数据库可通过 `localhost` 端口 3306 访问，访问凭证对应于 `DB_USERNAME` 和 `DB_PASSWORD` 环境变量的值。或者，你可以以 `root` 用户身份连接，该用户也使用 `DB_PASSWORD` 环境变量的值作为密码。

<a name="mongodb"></a>
### MongoDB

如果你在安装 Sail 时选择了安装 [MongoDB](https://www.mongodb.com/) 服务，你的应用程序的 `compose.yaml` 文件将包含一个 [MongoDB Atlas Local](https://www.mongodb.com/docs/atlas/cli/current/atlas-cli-local-cloud/) 容器的条目，该容器提供具有 Atlas 功能（如[搜索索引](https://www.mongodb.com/docs/atlas/atlas-search/)）的 MongoDB 文档数据库。该容器使用 [Docker 卷](https://docs.docker.com/storage/volumes/)，以便即使停止和重启容器，存储在数据库中的数据也能持久保存。

启动容器后，你可以通过将应用程序 `.env` 文件中的 `MONGODB_URI` 环境变量设置为 `mongodb://mongodb:27017` 来连接到 MongoDB 实例。默认情况下，身份验证是禁用的，但你可以在启动 `mongodb` 容器之前设置 `MONGODB_USERNAME` 和 `MONGODB_PASSWORD` 环境变量来启用身份验证。然后，将凭证添加到连接字符串中：

```ini
MONGODB_USERNAME=user
MONGODB_PASSWORD=laravel
MONGODB_URI=mongodb://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@mongodb:27017
```

为了实现 MongoDB 与你的应用程序的无缝集成，你可以安装 [MongoDB 维护的官方包](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/)。

要从本地计算机连接到应用程序的 MongoDB 数据库，你可以使用图形界面，如 [Compass](https://www.mongodb.com/products/tools/compass)。默认情况下，MongoDB 数据库可通过 `localhost` 端口 `27017` 访问。

<a name="redis"></a>
### Redis

你的应用程序的 `compose.yaml` 文件还包含一个 [Redis](https://redis.io) 容器的条目。该容器使用 [Docker 卷](https://docs.docker.com/storage/volumes/)，以便即使停止和重启容器，存储在 Redis 实例中的数据也能持久保存。启动容器后，你可以通过将应用程序 `.env` 文件中的 `REDIS_HOST` 环境变量设置为 `redis` 来连接到 Redis 实例。

要从本地计算机连接到应用程序的 Redis 数据库，你可以使用图形化的数据库管理应用程序，如 [TablePlus](https://tableplus.com)。默认情况下，Redis 数据库可通过 `localhost` 端口 6379 访问。

<a name="valkey"></a>
### Valkey

如果你在安装 Sail 时选择安装 Valkey 服务，你的应用程序的 `compose.yaml` 文件将包含一个 [Valkey](https://valkey.io/) 容器的条目。该容器使用 [Docker 卷](https://docs.docker.com/storage/volumes/)，以便即使停止和重启容器，存储在 Valkey 实例中的数据也能持久保存。你可以通过将应用程序 `.env` 文件中的 `REDIS_HOST` 环境变量设置为 `valkey` 来连接到该容器。

要从本地计算机连接到应用程序的 Valkey 数据库，你可以使用图形化的数据库管理应用程序，如 [TablePlus](https://tableplus.com)。默认情况下，Valkey 数据库可通过 `localhost` 端口 6379 访问。

<a name="meilisearch"></a>
### Meilisearch

如果你在安装 Sail 时选择了安装 [Meilisearch](https://www.meilisearch.com) 服务，你的应用程序的 `compose.yaml` 文件将包含这个强大的搜索引擎的条目，它与 [Laravel Scout](/docs/{{version}}/scout) 集成。启动容器后，你可以通过将 `MEILISEARCH_HOST` 环境变量设置为 `http://meilisearch:7700` 来连接到 Meilisearch 实例。

在你的本地计算机上，你可以在 Web 浏览器中访问 `http://localhost:7700` 来打开 Meilisearch 的基于 Web 的管理面板。

<a name="typesense"></a>
### Typesense

如果你在安装 Sail 时选择了安装 [Typesense](https://typesense.org) 服务，你的应用程序的 `compose.yaml` 文件将包含这个极速、开源搜索引擎的条目，它与 [Laravel Scout](/docs/{{version}}/scout#typesense) 原生集成。启动容器后，你可以通过设置以下环境变量来连接到 Typesense 实例：

```ini
TYPESENSE_HOST=typesense
TYPESENSE_PORT=8108
TYPESENSE_PROTOCOL=http
TYPESENSE_API_KEY=xyz
```

在你的本地计算机上，你可以通过 `http://localhost:8108` 访问 Typesense 的 API。

<a name="file-storage"></a>
## 文件存储

如果你计划在生产环境中使用 Amazon S3 存储文件，你可能希望在安装 Sail 时安装 [RustFS](https://rustfs.com) 服务。RustFS 提供了一个与 S3 兼容的 API，你可以使用 Laravel 的 `s3` 文件存储驱动在本地开发，而无需在生产 S3 环境中创建"测试"存储桶。如果你在安装 Sail 时选择安装 RustFS，一个 RustFS 配置部分将添加到你的应用程序的 `compose.yaml` 文件中。

默认情况下，你的应用程序的 `filesystems` 配置文件已经包含了一个用于 `s3` 磁盘的磁盘配置。除了使用此磁盘与 Amazon S3 交互外，你还可以使用它与任何兼容 S3 的文件存储服务（如 RustFS）交互，只需修改控制其配置的相关环境变量即可。例如，使用 RustFS 时，你的文件系统环境变量配置应定义如下：

```ini
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=sail
AWS_SECRET_ACCESS_KEY=password
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=local
AWS_ENDPOINT=http://rustfs:9000
AWS_USE_PATH_STYLE_ENDPOINT=true
```

<a name="running-tests"></a>
## 运行测试

Laravel 提供了开箱即用的出色测试支持，你可以使用 Sail 的 `test` 命令来运行应用程序的[功能和单元测试](/docs/{{version}}/testing)。Pest / PHPUnit 接受的任何 CLI 选项也可以传递给 `test` 命令：

```shell
sail test

sail test --group orders
```

Sail 的 `test` 命令相当于运行 `test` Artisan 命令：

```shell
sail artisan test
```

默认情况下，Sail 会创建一个专用的 `testing` 数据库，这样你的测试就不会干扰数据库的当前状态。在默认的 Laravel 安装中，Sail 还会配置你的 `phpunit.xml` 文件，在执行测试时使用此数据库：

```xml
<env name="DB_DATABASE" value="testing"/>
```

<a name="laravel-dusk"></a>
### Laravel Dusk

[Laravel Dusk](/docs/{{version}}/dusk) 提供了一个富有表现力且易于使用的浏览器自动化和测试 API。得益于 Sail，你无需在本地计算机上安装 Selenium 或其他工具即可运行这些测试。首先，取消注释应用程序 `compose.yaml` 文件中的 Selenium 服务：

```yaml
selenium:
    image: 'selenium/standalone-chrome'
    extra_hosts:
      - 'host.docker.internal:host-gateway'
    volumes:
        - '/dev/shm:/dev/shm'
    networks:
        - sail
```

接下来，确保应用程序 `compose.yaml` 文件中的 `laravel.test` 服务有一个 `depends_on` 条目指向 `selenium`：

```yaml
depends_on:
    - mysql
    - redis
    - selenium
```

最后，你可以通过启动 Sail 并运行 `dusk` 命令来运行你的 Dusk 测试套件：

```shell
sail dusk
```

<a name="selenium-on-apple-silicon"></a>
#### Apple Silicon 上的 Selenium

如果你的本地计算机包含 Apple Silicon 芯片，你的 `selenium` 服务必须使用 `selenium/standalone-chromium` 镜像：

```yaml
selenium:
    image: 'selenium/standalone-chromium'
    extra_hosts:
        - 'host.docker.internal:host-gateway'
    volumes:
        - '/dev/shm:/dev/shm'
    networks:
        - sail
```

<a name="previewing-emails"></a>
## 预览邮件

Laravel Sail 的默认 `compose.yaml` 文件包含一个 [Mailpit](https://github.com/axllent/mailpit) 服务的条目。Mailpit 会拦截你的应用程序在本地开发期间发送的邮件，并提供一个便捷的 Web 界面，让你可以在浏览器中预览邮件消息。使用 Sail 时，Mailpit 的默认主机是 `mailpit`，可通过端口 1025 访问：

```ini
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_ENCRYPTION=null
```

当 Sail 运行时，你可以通过 http://localhost:8025 访问 Mailpit 的 Web 界面。

<a name="sail-container-cli"></a>
## 容器 CLI

有时你可能希望在应用程序的容器中启动一个 Bash 会话。你可以使用 `shell` 命令连接到应用程序的容器，从而检查其文件、已安装的服务以及在容器内执行任意 shell 命令：

```shell
sail shell

sail root-shell
```

要启动一个新的 [Laravel Tinker](https://github.com/laravel/tinker) 会话，可以执行 `tinker` 命令：

```shell
sail tinker
```

<a name="sail-php-versions"></a>
## PHP 版本

Sail 目前支持通过 PHP 8.5、8.4、8.3、8.2、8.1 或 PHP 8.0 来服务你的应用程序。Sail 使用的默认 PHP 版本目前是 PHP 8.5。要更改用于服务应用程序的 PHP 版本，应更新应用程序 `compose.yaml` 文件中 `laravel.test` 容器的 `build` 定义：

```yaml
# PHP 8.5
context: ./vendor/laravel/sail/runtimes/8.5

# PHP 8.4
context: ./vendor/laravel/sail/runtimes/8.4

# PHP 8.3
context: ./vendor/laravel/sail/runtimes/8.3

# PHP 8.2
context: ./vendor/laravel/sail/runtimes/8.2

# PHP 8.1
context: ./vendor/laravel/sail/runtimes/8.1

# PHP 8.0
context: ./vendor/laravel/sail/runtimes/8.0
```

此外，你可能希望更新 `image` 名称以反映应用程序使用的 PHP 版本。此选项也在应用程序的 `compose.yaml` 文件中定义：

```yaml
image: sail-8.2/app
```

更新应用程序的 `compose.yaml` 文件后，应重建容器镜像：

```shell
sail build --no-cache

sail up
```

<a name="sail-php-extensions"></a>
### 额外 PHP 扩展

Sail 的运行时镜像包含一组常见的 PHP 扩展。如果你的应用程序需要额外的扩展，你可以在构建镜像时通过向应用程序 `compose.yaml` 文件中的 `laravel.test` 服务添加一个以空格分隔的 `PHP_EXTENSIONS` 构建参数来安装它们：

```yaml
build:
    args:
        WWWGROUP: '${WWWGROUP}'
        PHP_EXTENSIONS: 'gmp imagick'
```

更新应用程序的 `compose.yaml` 文件后，应重建容器镜像。

<a name="sail-node-versions"></a>
## Node 版本

Sail 默认安装 Node 24。要更改构建镜像时安装的 Node 版本，可以更新应用程序 `compose.yaml` 文件中 `laravel.test` 服务的 `build.args` 定义：

```yaml
build:
    args:
        WWWGROUP: '${WWWGROUP}'
        NODE_VERSION: '18'
```

更新应用程序的 `compose.yaml` 文件后，应重建容器镜像：

```shell
sail build --no-cache

sail up
```

<a name="sharing-your-site"></a>
## 分享你的站点

有时你可能需要公开分享你的站点，以便与同事预览或测试与应用程序的 Webhook 集成。要分享你的站点，可以使用 `share` 命令。执行此命令后，你将获得一个随机的 `laravel-sail.site` URL，可用于访问你的应用程序：

```shell
sail share
```

通过 `share` 命令分享你的站点时，应在应用程序的 `bootstrap/app.php` 文件中使用 `trustProxies` 中间件方法来配置应用程序的可信代理。否则，诸如 `url` 和 `route` 之类的 URL 生成助手将无法确定 URL 生成时应使用的正确 HTTP 主机：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->trustProxies(at: '*');
})
```

如果你想为分享的站点选择子域名，可以在执行 `share` 命令时提供 `subdomain` 选项：

```shell
sail share --subdomain=my-sail-site
```

> [!NOTE]
> `share` 命令由 [Expose](https://github.com/beyondcode/expose) 驱动，这是一个由 [BeyondCode](https://beyondco.de) 提供的开源隧道服务。

<a name="debugging-with-xdebug"></a>
## 使用 Xdebug 调试

Laravel Sail 的 Docker 配置包含对 [Xdebug](https://xdebug.org/) 的支持，这是一个流行且强大的 PHP 调试器。要启用 Xdebug，请确保你已[发布 Sail 配置](#sail-customization)。然后，将以下变量添加到你的应用程序 `.env` 文件中以配置 Xdebug：

```ini
SAIL_XDEBUG_MODE=develop,debug,coverage
```

接下来，确保你已发布的 `php.ini` 文件包含以下配置，以便在指定的模式下激活 Xdebug：

```ini
[xdebug]
xdebug.mode=${XDEBUG_MODE}
```

修改 `php.ini` 文件后，记得重建你的 Docker 镜像，以便你对 `php.ini` 文件的更改生效：

```shell
sail build --no-cache
```

#### Linux 主机 IP 配置

在内部，`XDEBUG_CONFIG` 环境变量被定义为 `client_host=host.docker.internal`，以便 Xdebug 在 Mac 和 Windows（WSL2）上正确配置。如果你的本地计算机运行 Linux 并且你使用的是 Docker 20.10+，则 `host.docker.internal` 可用，无需手动配置。

对于早于 20.10 的 Docker 版本，Linux 上不支持 `host.docker.internal`，你将需要手动定义主机 IP。为此，通过在 `compose.yaml` 文件中定义自定义网络来为容器配置静态 IP：

```yaml
networks:
  custom_network:
    ipam:
      config:
        - subnet: 172.20.0.0/16

services:
  laravel.test:
    networks:
      custom_network:
        ipv4_address: 172.20.0.2
```

设置好静态 IP 后，在应用程序的 .env 文件中定义 SAIL_XDEBUG_CONFIG 变量：

```ini
SAIL_XDEBUG_CONFIG="client_host=172.20.0.2"
```

<a name="xdebug-cli-usage"></a>
### Xdebug CLI 用法

可以使用 `sail debug` 命令在运行 Artisan 命令时启动调试会话：

```shell
# 在不使用 Xdebug 的情况下运行 Artisan 命令...
sail artisan migrate

# 使用 Xdebug 运行 Artisan 命令...
sail debug migrate
```

<a name="xdebug-browser-usage"></a>
### Xdebug 浏览器用法

要通过 Web 浏览器与应用程序交互时进行调试，请遵循 [Xdebug 提供的说明](https://xdebug.org/docs/step_debug#web-application)，从 Web 浏览器启动 Xdebug 会话。

如果你使用 PhpStorm，请查看 JetBrains 关于[零配置调试](https://www.jetbrains.com/help/phpstorm/zero-configuration-debugging.html)的文档。

> [!WARNING]
> Laravel Sail 依赖 `artisan serve` 来服务你的应用程序。`artisan serve` 命令从 Laravel 8.53.0 版本开始才接受 `XDEBUG_CONFIG` 和 `XDEBUG_MODE` 变量。旧版本的 Laravel（8.52.0 及以下）不支持这些变量，并且不会接受调试连接。

<a name="sail-customization"></a>
## 自定义

由于 Sail 只是 Docker，你可以自由地自定义几乎所有内容。要发布 Sail 自己的 Dockerfile，可以执行 `sail:publish` 命令：

```shell
sail artisan sail:publish
```

运行此命令后，Laravel Sail 使用的 Dockerfile 和其他配置文件将放置在应用程序根目录的 `docker` 目录中。自定义 Sail 安装后，你可能希望更改应用程序 `compose.yaml` 文件中应用容器的镜像名称。更改后，使用 `build` 命令重建应用程序的容器。为应用镜像分配唯一名称在使用 Sail 在同一台机器上开发多个 Laravel 应用程序时尤为重要：

```shell
sail build --no-cache
```

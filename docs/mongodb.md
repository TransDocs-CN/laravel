# MongoDB

- [简介](#introduction)
- [安装](#installation)
    - [MongoDB 驱动](#mongodb-driver)
    - [启动 MongoDB 服务器](#starting-a-mongodb-server)
    - [安装 Laravel MongoDB 包](#install-the-laravel-mongodb-package)
- [配置](#configuration)
- [特性](#features)

<a name="introduction"></a>
## 简介

[MongoDB](https://www.mongodb.com/resources/products/fundamentals/why-use-mongodb) 是最流行的 NoSQL 文档型数据库之一，以其高写入负载（适用于分析或物联网）和高可用性（易于设置带自动故障转移的副本集）而闻名。它还可以轻松地对数据库进行分片以实现水平扩展，并拥有强大的查询语言用于聚合、文本搜索或地理空间查询。

与 SQL 数据库将数据存储在行或列的表结构中不同，MongoDB 数据库中的每条记录都是以 BSON（数据的二进制表示形式）描述的文档。应用随后可以以 JSON 格式检索这些信息。它支持多种数据类型，包括文档、数组、嵌入式文档和二进制数据。

在使用 MongoDB 与 Laravel 之前，我们建议通过 Composer 安装并使用 `mongodb/laravel-mongodb` 包。`laravel-mongodb` 包由 MongoDB 官方维护，虽然 PHP 通过 MongoDB 驱动原生支持 MongoDB，但 [Laravel MongoDB](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/) 包提供了与 Eloquent 和其他 Laravel 功能的更丰富集成：

```shell
composer require mongodb/laravel-mongodb
```

<a name="installation"></a>
## 安装

<a name="mongodb-driver"></a>
### MongoDB 驱动

要连接到 MongoDB 数据库，需要 `mongodb` PHP 扩展。如果你正在使用 [Laravel Herd](https://herd.laravel.com) 进行本地开发或通过 `php.new` 安装了 PHP，你的系统上已安装此扩展。但是，如果你需要手动安装该扩展，可以通过 PECL 进行：

```shell
pecl install mongodb
```

有关安装 MongoDB PHP 扩展的更多信息，请查看 [MongoDB PHP 扩展安装说明](https://www.php.net/manual/en/mongodb.installation.php)。

<a name="starting-a-mongodb-server"></a>
### 启动 MongoDB 服务器

MongoDB Community Server 可用于在本地运行 MongoDB，可安装在 Windows、macOS、Linux 上，或作为 Docker 容器使用。要了解如何安装 MongoDB，请参考 [MongoDB Community 官方安装指南](https://docs.mongodb.com/manual/administration/install-community/)。

MongoDB 服务器的连接字符串可以在你的 `.env` 文件中设置：

```ini
MONGODB_URI="mongodb://localhost:27017"
MONGODB_DATABASE="laravel_app"
```

如需在云中托管 MongoDB，请考虑使用 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)。
要从你的应用本地访问 MongoDB Atlas 集群，你需要在集群的网络设置中[将你自己的 IP 地址](https://www.mongodb.com/docs/atlas/security/add-ip-address-to-list/)添加到项目的 IP 访问列表中。

MongoDB Atlas 的连接字符串也可以在 `.env` 文件中设置：

```ini
MONGODB_URI="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority"
MONGODB_DATABASE="laravel_app"
```

<a name="install-the-laravel-mongodb-package"></a>
### 安装 Laravel MongoDB 包

最后，使用 Composer 安装 Laravel MongoDB 包：

```shell
composer require mongodb/laravel-mongodb
```

> [!NOTE]
> 如果未安装 `mongodb` PHP 扩展，此包安装将失败。PHP 配置在 CLI 和 Web 服务器之间可能不同，因此请确保在两种配置中都启用了该扩展。

<a name="configuration"></a>
## 配置

你可以通过应用的 `config/database.php` 配置文件配置 MongoDB 连接。在此文件中，添加一个使用 `mongodb` 驱动的 `mongodb` 连接：

```php
'connections' => [
    'mongodb' => [
        'driver' => 'mongodb',
        'dsn' => env('MONGODB_URI', 'mongodb://localhost:27017'),
        'database' => env('MONGODB_DATABASE', 'laravel_app'),
    ],
],
```

<a name="features"></a>
## 特性

配置完成后，你可以在应用中使用 `mongodb` 包和数据库连接，以利用各种强大的特性：

- [使用 Eloquent](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/eloquent-models/)，模型可以存储在 MongoDB 集合中。除了标准的 Eloquent 特性，Laravel MongoDB 包还提供了额外的特性，如嵌入式关系。该包还提供对 MongoDB 驱动的直接访问，可用于执行诸如原生查询和聚合管道等操作。
- [编写复杂查询](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/query-builder/)使用查询构建器。
- [相似度/向量搜索](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/fundamentals/vector-search/)使用向量嵌入和 `vectorSearch` Eloquent 方法。
- `mongodb` [缓存驱动](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/cache/)经过优化，可使用 MongoDB 的特性（如 TTL 索引）自动清除过期的缓存条目。
- [分派和处理队列任务](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/queues/)使用 `mongodb` 队列驱动。
- [在 GridFS 中存储文件](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/filesystems/)，通过 [Flysystem 的 GridFS 适配器](https://flysystem.thephpleague.com/docs/adapter/gridfs/)。
- [全文搜索](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/scout/)使用 `mongodb` Scout 引擎。
- 大多数使用数据库连接或 Eloquent 的第三方包都可以与 MongoDB 一起使用。

要继续学习如何使用 MongoDB 和 Laravel，请参考 MongoDB 的[快速入门指南](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/quick-start/)。

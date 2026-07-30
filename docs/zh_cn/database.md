# 数据库：入门

- [简介](#introduction)
    - [配置](#configuration)
    - [读/写连接](#read-and-write-connections)
    - [PostgreSQL 连接池](#pooled-postgresql-connections)
- [运行 SQL 查询](#running-queries)
    - [使用多个数据库连接](#using-multiple-database-connections)
    - [监听查询事件](#listening-for-query-events)
    - [监控累积查询时间](#monitoring-cumulative-query-time)
- [数据库事务](#database-transactions)
- [连接数据库 CLI](#connecting-to-the-database-cli)
- [检查数据库](#inspecting-your-databases)
- [监控数据库](#monitoring-your-databases)

<a name="introduction"></a>
## 简介

几乎所有现代 Web 应用都会与数据库进行交互。Laravel 让通过各种支持的数据库与数据库的交互变得极其简单，支持使用原生 SQL、[流式查询构建器](/docs/{{version}}/queries)和 [Eloquent ORM](/docs/{{version}}/eloquent)。目前，Laravel 为五种数据库提供了一方支持：

<div class="content-list" markdown="1">

- MariaDB 10.3+（[版本策略](https://mariadb.org/about/#maintenance-policy)）
- MySQL 5.7+（[版本策略](https://en.wikipedia.org/wiki/MySQL#Release_history)）
- PostgreSQL 10.0+（[版本策略](https://www.postgresql.org/support/versioning/)）
- SQLite 3.26.0+
- SQL Server 2017+（[版本策略](https://docs.microsoft.com/en-us/lifecycle/products/?products=sql-server)）

</div>

此外，MongoDB 通过由 MongoDB 官方维护的 `mongodb/laravel-mongodb` 包获得支持。查看 [Laravel MongoDB](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/) 文档了解更多信息。

<a name="configuration"></a>
### 配置

Laravel 数据库服务的配置位于应用的 `config/database.php` 配置文件中。在此文件中，你可以定义所有数据库连接，并指定默认使用哪个连接。此文件中的大多数配置选项由应用环境变量的值驱动。该文件中提供了 Laravel 支持的大多数数据库系统的示例。

默认情况下，Laravel 的示例[环境配置](/docs/{{version}}/configuration#environment-configuration)已准备就绪，可与 [Laravel Sail](/docs/{{version}}/sail) 一起使用，Sail 是用于在本地机器上开发 Laravel 应用的 Docker 配置。不过，你可以根据需要修改数据库配置以适配本地数据库。

<a name="sqlite-configuration"></a>
#### SQLite 配置

SQLite 数据库包含在文件系统中的一个文件内。你可以使用终端中的 `touch` 命令创建新的 SQLite 数据库：`touch database/database.sqlite`。创建数据库后，你可以通过将数据库的绝对路径设置在 `DB_DATABASE` 环境变量中，轻松配置环境变量以指向此数据库：

```ini
DB_CONNECTION=sqlite
DB_DATABASE=/absolute/path/to/database.sqlite
```

默认情况下，SQLite 连接启用了外键约束。如果你想禁用它，应将 `DB_FOREIGN_KEYS` 环境变量设置为 `false`：

```ini
DB_FOREIGN_KEYS=false
```

> [!NOTE]
> 如果你使用 [Laravel 安装器](/docs/{{version}}/installation#creating-a-laravel-project)创建 Laravel 应用并选择 SQLite 作为数据库，Laravel 将自动创建 `database/database.sqlite` 文件并为你运行默认的[数据库迁移](/docs/{{version}}/migrations)。

<a name="mssql-configuration"></a>
#### Microsoft SQL Server 配置

要使用 Microsoft SQL Server 数据库，你应确保已安装 `sqlsrv` 和 `pdo_sqlsrv` PHP 扩展，以及它们可能需要的任何依赖项，例如 Microsoft SQL ODBC 驱动程序。

<a name="configuration-using-urls"></a>
#### 使用 URL 进行配置

通常，数据库连接使用多个配置值进行配置，例如 `host`、`database`、`username`、`password` 等。每个配置值都有其对应的环境变量。这意味着在生产服务器上配置数据库连接信息时，你需要管理多个环境变量。

某些托管数据库提供商（如 AWS 和 Heroku）提供一个单一的数据库"URL"，该 URL 在一个字符串中包含数据库的所有连接信息。示例数据库 URL 可能如下所示：

```html
mysql://root:password@127.0.0.1/forge?charset=UTF-8
```

这些 URL 通常遵循标准模式约定：

```html
driver://username:password@host:port/database?options
```

为了方便，Laravel 支持这些 URL 作为使用多个配置选项配置数据库的替代方案。如果存在 `url`（或相应的 `DB_URL` 环境变量）配置选项，将使用它来提取数据库连接和凭据信息。

<a name="read-and-write-connections"></a>
### 读/写连接

有时你可能希望使用一个数据库连接用于 SELECT 语句，另一个用于 INSERT、UPDATE 和 DELETE 语句。Laravel 让这变得轻而易举，无论你使用原生查询、查询构建器还是 Eloquent ORM，都会始终使用适当的连接。

要了解如何配置读/写连接，让我们看这个示例：

```php
'mysql' => [
    'driver' => 'mysql',
    
    'read' => [
        'host' => [
            '192.168.1.1',
            '196.168.1.2',
        ],
    ],
    'write' => [
        'host' => [
            '192.168.1.3',
        ],
    ],
    'sticky' => true,
    
    'port' => env('DB_PORT', '3306'),
    'database' => env('DB_DATABASE', 'laravel'),
    'username' => env('DB_USERNAME', 'root'),
    'password' => env('DB_PASSWORD', ''),
    'unix_socket' => env('DB_SOCKET', ''),
    'charset' => env('DB_CHARSET', 'utf8mb4'),
    'collation' => env('DB_COLLATION', 'utf8mb4_unicode_ci'),
    'prefix' => '',
    'prefix_indexes' => true,
    'strict' => true,
    'engine' => null,
    'options' => extension_loaded('pdo_mysql') ? array_filter([
        (PHP_VERSION_ID >= 80500 ? \Pdo\Mysql::ATTR_SSL_CA : \PDO::MYSQL_ATTR_SSL_CA) => env('MYSQL_ATTR_SSL_CA'),
    ]) : [],
],
```

注意配置数组中添加了三个键：`read`、`write` 和 `sticky`。`read` 和 `write` 键的数组值包含单个键：`host`。`read` 和 `write` 连接的其余数据库选项将从主 `mysql` 配置数组合并。

只需在你希望覆盖主 `mysql` 数组中的值时，才需要将条目放入 `read` 和 `write` 数组。因此，在此例中，`192.168.1.1` 将用作"读取"连接的主机，而 `192.168.1.3` 将用于"写入"连接。数据库凭据、前缀、字符集以及主 `mysql` 数组中的所有其他选项将在两个连接之间共享。当 `host` 配置数组中存在多个值时，将为每个请求随机选择一个数据库主机。

<a name="the-sticky-option"></a>
#### `sticky` 选项

`sticky` 选项是一个*可选*值，可用于允许在当前请求周期内立即读取已写入数据库的记录。如果启用了 `sticky` 选项，并且在当前请求周期内对数据库执行了"写入"操作，则任何后续的"读取"操作都将使用"写入"连接。这确保了在请求周期内写入的任何数据可以在同一请求中立即从数据库读取。由你来决定这是否是你的应用所需的行为。

<a name="pooled-postgresql-connections"></a>
### PostgreSQL 连接池

许多托管 PostgreSQL 提供商通过 PgBouncer 等服务或连接代理提供事务模式连接池。这些连接池非常适合应用查询，但某些模式操作、迁移和维护命令需要直接的数据库连接。

要使用 PostgreSQL 的事务连接池，请照常配置连接池连接，并通过 `direct` 配置选项提供直接连接详情：

```php
'pgsql' => [
    'driver' => 'pgsql',
    // ...
    'pooled' => env('DB_POOLED', false),
    'direct' => array_filter([
        'host' => env('DB_DIRECT_HOST'),
        'port' => env('DB_DIRECT_PORT'),
        'username' => env('DB_DIRECT_USERNAME'),
        'password' => env('DB_DIRECT_PASSWORD'),
        'sslmode' => env('DB_DIRECT_SSLMODE'),
    ]),
],
```

当 PostgreSQL 连接被配置为连接池时，Laravel 会自动为连接池连接启用模拟预处理。直接连接继承 `direct` 配置中未显式定义的任何选项，并默认使用原生预处理。

Laravel 会自动为迁移、模式转储和恢复、`db:wipe`、`db:show` 和 `db:table` 使用直接连接。当启用连接池模式并配置了直接连接时，`db` 命令也默认使用直接连接；你可以传递 `--pooled` 选项来连接连接池：

```shell
php artisan db --pooled
```

如果你需要在应用中显式使用直接连接，请在连接名称后附加 `::direct` 后缀：

```php
DB::connection('pgsql::direct')->statement('create extension if not exists "uuid-ossp"');
```

<a name="running-queries"></a>
## 运行 SQL 查询

配置好数据库连接后，你可以使用 `DB` 门面运行查询。`DB` 门面为每种查询类型提供了方法：`select`、`update`、`insert`、`delete` 和 `statement`。

<a name="running-a-select-query"></a>
#### 运行 Select 查询

要运行基本的 SELECT 查询，你可以使用 `DB` 门面上的 `select` 方法：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class UserController extends Controller
{
    /**
     * Show a list of all of the application's users.
     */
    public function index(): View
    {
        $users = DB::select('select * from users where active = ?', [1]);

        return view('user.index', ['users' => $users]);
    }
}
```

传递给 `select` 方法的第一个参数是 SQL 查询，第二个参数是需要绑定到查询的任何参数绑定。通常，这些是 `where` 子句约束的值。参数绑定提供了防止 SQL 注入的保护。

`select` 方法将始终返回一个结果 `array`。数组中的每个结果将是一个 PHP `stdClass` 对象，表示数据库中的一条记录：

```php
use Illuminate\Support\Facades\DB;

$users = DB::select('select * from users');

foreach ($users as $user) {
    echo $user->name;
}
```

<a name="selecting-scalar-values"></a>
#### 选择标量值

有时你的数据库查询可能产生单个标量值。Laravel 允许你直接使用 `scalar` 方法检索此值，而无需从记录对象中获取查询的标量结果：

```php
$burgers = DB::scalar(
    "select count(case when food = 'burger' then 1 end) as burgers from menu"
);
```

<a name="selecting-multiple-result-sets"></a>
#### 选择多个结果集

如果你的应用调用返回多个结果集的存储过程，你可以使用 `selectResultSets` 方法检索存储过程返回的所有结果集：

```php
[$options, $notifications] = DB::selectResultSets(
    "CALL get_user_options_and_notifications(?)", $request->user()->id
);
```

<a name="using-named-bindings"></a>
#### 使用命名绑定

你可以使用命名绑定来执行查询，而不是使用 `?` 表示参数绑定：

```php
$results = DB::select('select * from users where id = :id', ['id' => 1]);
```

<a name="running-an-insert-statement"></a>
#### 运行 Insert 语句

要执行 `insert` 语句，你可以使用 `DB` 门面上的 `insert` 方法。与 `select` 类似，此方法接受 SQL 查询作为第一个参数，绑定作为第二个参数：

```php
use Illuminate\Support\Facades\DB;

DB::insert('insert into users (id, name) values (?, ?)', [1, 'Marc']);
```

<a name="running-an-update-statement"></a>
#### 运行 Update 语句

`update` 方法应用于更新数据库中的现有记录。该方法返回受语句影响的行数：

```php
use Illuminate\Support\Facades\DB;

$affected = DB::update(
    'update users set votes = 100 where name = ?',
    ['Anita']
);
```

<a name="running-a-delete-statement"></a>
#### 运行 Delete 语句

`delete` 方法应用于从数据库中删除记录。与 `update` 一样，该方法将返回受影响的行数：

```php
use Illuminate\Support\Facades\DB;

$deleted = DB::delete('delete from users');
```

<a name="running-a-general-statement"></a>
#### 运行通用语句

某些数据库语句不返回任何值。对于这类操作，你可以使用 `DB` 门面上的 `statement` 方法：

```php
DB::statement('drop table users');
```

<a name="running-an-unprepared-statement"></a>
#### 运行未预处理语句

有时你可能想要执行 SQL 语句而不绑定任何值。你可以使用 `DB` 门面的 `unprepared` 方法来实现：

```php
DB::unprepared('update users set votes = 100 where name = "Dries"');
```

> [!WARNING]
> 由于未预处理语句不绑定参数，它们可能容易受到 SQL 注入攻击。你绝不应允许用户控制的值出现在未预处理语句中。

<a name="implicit-commits-in-transactions"></a>
#### 隐式提交

在事务中使用 `DB` 门面的 `statement` 和 `unprepared` 方法时，必须小心避免导致[隐式提交](https://dev.mysql.com/doc/refman/8.0/en/implicit-commit.html)的语句。这些语句会导致数据库引擎间接提交整个事务，而 Laravel 对数据库的事务级别一无所知。此类语句的一个示例是创建数据库表：

```php
DB::unprepared('create table a (col varchar(1) null)');
```

请参考 MySQL 手册以了解[所有触发隐式提交的语句列表](https://dev.mysql.com/doc/refman/8.0/en/implicit-commit.html)。

<a name="using-multiple-database-connections"></a>
### 使用多个数据库连接

如果你的应用在 `config/database.php` 配置文件中定义了多个连接，你可以通过 `DB` 门面提供的 `connection` 方法访问每个连接。传递给 `connection` 方法的连接名称应对应于 `config/database.php` 配置文件中列出的某个连接，或在运行时使用 `config` 辅助函数配置的连接：

```php
use Illuminate\Support\Facades\DB;

$users = DB::connection('sqlite')->select(/* ... */);
```

你可以使用连接实例上的 `getPdo` 方法访问连接的原生底层 PDO 实例：

```php
$pdo = DB::connection()->getPdo();
```

<a name="listening-for-query-events"></a>
### 监听查询事件

如果你想指定一个为应用执行的每个 SQL 查询调用的闭包，可以使用 `DB` 门面的 `listen` 方法。此方法可用于记录查询或调试。你可以在[服务提供者](/docs/{{version}}/providers)的 `boot` 方法中注册查询监听器闭包：

```php
<?php

namespace App\Providers;

use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // ...
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        DB::listen(function (QueryExecuted $query) {
            // $query->sql;
            // $query->bindings;
            // $query->time;
            // $query->toRawSql();
        });
    }
}
```

<a name="monitoring-cumulative-query-time"></a>
### 监控累积查询时间

现代 Web 应用的一个常见性能瓶颈是它们在数据库查询上花费的时间。幸运的是，当 Laravel 在单个请求中花费太多时间查询数据库时，它可以调用你选择的闭包或回调。首先，向 `whenQueryingForLongerThan` 方法提供一个查询时间阈值（以毫秒为单位）和闭包。你可以在[服务提供者](/docs/{{version}}/providers)的 `boot` 方法中调用此方法：

```php
<?php

namespace App\Providers;

use Illuminate\Database\Connection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Database\Events\QueryExecuted;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // ...
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        DB::whenQueryingForLongerThan(500, function (Connection $connection, QueryExecuted $event) {
            // Notify development team...
        });
    }
}
```

<a name="database-transactions"></a>
## 数据库事务

你可以使用 `DB` 门面提供的 `transaction` 方法在数据库事务中运行一组操作。如果在事务闭包中抛出异常，事务将自动回滚，并且异常将被重新抛出。如果闭包执行成功，事务将自动提交。使用 `transaction` 方法时，你无需担心手动回滚或提交：

```php
use Illuminate\Support\Facades\DB;

DB::transaction(function () {
    DB::update('update users set votes = 1');

    DB::delete('delete from posts');
});
```

<a name="handling-deadlocks"></a>
#### 处理死锁

`transaction` 方法接受一个可选的第二个参数，该参数定义在发生死锁时应重试事务的次数。当这些尝试耗尽后，将抛出异常：

```php
use Illuminate\Support\Facades\DB;

DB::transaction(function () {
    DB::update('update users set votes = 1');

    DB::delete('delete from posts');
}, attempts: 5);
```

<a name="manually-using-transactions"></a>
#### 手动使用事务

如果你想手动开始一个事务并完全控制回滚和提交，可以使用 `DB` 门面提供的 `beginTransaction` 方法：

```php
use Illuminate\Support\Facades\DB;

DB::beginTransaction();
```

你可以通过 `rollBack` 方法回滚事务：

```php
DB::rollBack();
```

最后，你可以通过 `commit` 方法提交事务：

```php
DB::commit();
```

> [!NOTE]
> `DB` 门面的事务方法控制[查询构建器](/docs/{{version}}/queries)和 [Eloquent ORM](/docs/{{version}}/eloquent) 的事务。

<a name="connecting-to-the-database-cli"></a>
## 连接数据库 CLI

如果你想连接到数据库的 CLI，可以使用 `db` Artisan 命令：

```shell
php artisan db
```

如果需要，你可以指定一个数据库连接名称来连接非默认的数据库连接：

```shell
php artisan db mysql
```

<a name="inspecting-your-databases"></a>
## 检查数据库

使用 `db:show` 和 `db:table` Artisan 命令，你可以深入了解你的数据库及其相关表。要查看数据库概述，包括其大小、类型、打开连接数以及表的摘要，你可以使用 `db:show` 命令：

```shell
php artisan db:show
```

你可以通过 `--database` 选项提供数据库连接名称来指定要检查哪个数据库连接：

```shell
php artisan db:show --database=pgsql
```

如果你想在命令输出中包含表行计数和数据库视图详情，可以分别提供 `--counts` 和 `--views` 选项。在大型数据库上，检索行计数和视图详情可能会很慢：

```shell
php artisan db:show --counts --views
```

此外，你可以使用以下 `Schema` 方法来检查你的数据库：

```php
use Illuminate\Support\Facades\Schema;

$tables = Schema::getTables();
$views = Schema::getViews();
$columns = Schema::getColumns('users');
$indexes = Schema::getIndexes('users');
$foreignKeys = Schema::getForeignKeys('users');
```

如果你想检查非应用默认连接的数据库连接，可以使用 `connection` 方法：

```php
$columns = Schema::connection('sqlite')->getColumns('users');
```

<a name="table-overview"></a>
#### 表概述

如果你想获取数据库中单个表的概述，可以执行 `db:table` Artisan 命令。此命令提供数据库表的总体概述，包括其列、类型、属性、键和索引：

```shell
php artisan db:table users
```

<a name="monitoring-your-databases"></a>
## 监控数据库

使用 `db:monitor` Artisan 命令，当你的数据库管理的打开连接数超过指定数量时，你可以指示 Laravel 分派一个 `Illuminate\Database\Events\DatabaseBusy` 事件。

首先，你应将 `db:monitor` 命令安排为[每分钟运行一次](/docs/{{version}}/scheduling)。该命令接受你希望监控的数据库连接配置名称，以及在分派事件之前应容忍的最大打开连接数：

```shell
php artisan db:monitor --databases=mysql,pgsql --max=100
```

仅安排此命令本身不足以触发关于打开连接数的通知。当命令遇到打开连接数超过阈值的数据库时，将分派一个 `DatabaseBusy` 事件。你应在应用的 `AppServiceProvider` 中监听此事件，以便向你或你的开发团队发送通知：

```php
use App\Notifications\DatabaseApproachingMaxConnections;
use Illuminate\Database\Events\DatabaseBusy;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Event::listen(function (DatabaseBusy $event) {
        Notification::route('mail', 'dev@example.com')
            ->notify(new DatabaseApproachingMaxConnections(
                $event->connectionName,
                $event->connections
            ));
    });
}
```

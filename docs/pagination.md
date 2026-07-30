# 数据库：分页

- [简介](#introduction)
- [基本用法](#basic-usage)
    - [分页查询构建器结果](#paginating-query-builder-results)
    - [分页 Eloquent 结果](#paginating-eloquent-results)
    - [游标分页](#cursor-pagination)
    - [手动创建分页器](#manually-creating-a-paginator)
    - [自定义分页 URL](#customizing-pagination-urls)
- [显示分页结果](#displaying-pagination-results)
    - [调整分页链接窗口](#adjusting-the-pagination-link-window)
    - [将结果转换为 JSON](#converting-results-to-json)
- [自定义分页视图](#customizing-the-pagination-view)
    - [使用 Bootstrap](#using-bootstrap)
- [分页器和 LengthAwarePaginator 实例方法](#paginator-instance-methods)
- [游标分页器实例方法](#cursor-paginator-instance-methods)

<a name="introduction"></a>
## 简介

在其他框架中，分页可能非常痛苦。我们希望 Laravel 的分页方式能让人耳目一新。Laravel 的分页器与[查询构建器](/docs/{{version}}/queries)和 [Eloquent ORM](/docs/{{version}}/eloquent) 集成，提供了方便易用的数据库记录分页功能，且无需任何配置。

默认情况下，分页器生成的 HTML 与 [Tailwind CSS 框架](https://tailwindcss.com/)兼容；但也支持 Bootstrap 分页。

<a name="tailwind"></a>
#### Tailwind

如果你正在使用 Laravel 默认的 Tailwind 分页视图与 Tailwind 4.x，你的应用的 `resources/css/app.css` 文件应已正确配置为 `@source` Laravel 的分页视图：

```css
@import 'tailwindcss';

@source '../../vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php';
```

<a name="basic-usage"></a>
## 基本用法

<a name="paginating-query-builder-results"></a>
### 分页查询构建器结果

有几种方法可以对项目进行分页。最简单的是在[查询构建器](/docs/{{version}}/queries)或 [Eloquent 查询](/docs/{{version}}/eloquent)上使用 `paginate` 方法。`paginate` 方法会自动根据用户当前浏览的页面设置查询的"limit"和"offset"。默认情况下，当前页面由 HTTP 请求上的 `page` 查询字符串参数的值检测。此值由 Laravel 自动检测，并自动插入到分页器生成的链接中。

在此示例中，传递给 `paginate` 方法的唯一参数是你希望每页显示的条目数。在此例中，我们指定每页显示 `15` 条：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class UserController extends Controller
{
    /**
     * Show all application users.
     */
    public function index(): View
    {
        return view('user.index', [
            'users' => DB::table('users')->paginate(15)
        ]);
    }
}
```

<a name="simple-pagination"></a>
#### 简单分页

`paginate` 方法在从数据库检索记录之前会计算查询匹配的记录总数。这样做是为了让分页器知道总共有多少页记录。但是，如果你不打算在应用的 UI 中显示总页数，那么记录计数查询是不必要的。

因此，如果你只需在应用的 UI 中显示简单的"上一页"和"下一页"链接，可以使用 `simplePaginate` 方法执行单个高效的查询：

```php
$users = DB::table('users')->simplePaginate(15);
```

<a name="paginating-eloquent-results"></a>
### 分页 Eloquent 结果

你也可以对 [Eloquent](/docs/{{version}}/eloquent) 查询进行分页。在此示例中，我们将对 `App\Models\User` 模型进行分页，并指定每页显示 15 条记录。如你所见，语法几乎与分页查询构建器结果相同：

```php
use App\Models\User;

$users = User::paginate(15);
```

当然，你可以在查询上设置其他约束（例如 `where` 子句）后再调用 `paginate` 方法：

```php
$users = User::where('votes', '>', 100)->paginate(15);
```

在分页 Eloquent 模型时，你也可以使用 `simplePaginate` 方法：

```php
$users = User::where('votes', '>', 100)->simplePaginate(15);
```

同样，你可以使用 `cursorPaginate` 方法对 Eloquent 模型进行游标分页：

```php
$users = User::where('votes', '>', 100)->cursorPaginate(15);
```

<a name="multiple-paginator-instances-per-page"></a>
#### 每页多个分页器实例

有时你可能需要在应用渲染的单个屏幕上渲染两个独立的分页器。但是，如果两个分页器实例都使用 `page` 查询字符串参数来存储当前页，则两个分页器会发生冲突。要解决此冲突，你可以通过 `paginate`、`simplePaginate` 和 `cursorPaginate` 方法提供的第三个参数传递你想要用于存储分页器当前页的查询字符串参数的名称：

```php
use App\Models\User;

$users = User::where('votes', '>', 100)->paginate(
    $perPage = 15, $columns = ['*'], $pageName = 'users'
);
```

<a name="cursor-pagination"></a>
### 游标分页

虽然 `paginate` 和 `simplePaginate` 使用 SQL"offset"子句创建查询，但游标分页通过构建比较查询中包含的有序列值的"where"子句来工作，提供了 Laravel 所有分页方法中最高的数据库性能。这种分页方法特别适合大数据集和"无限"滚动用户界面。

与基于偏移的分页（在分页器生成的 URL 的查询字符串中包含页码）不同，基于游标的分页在查询字符串中放置一个"cursor"字符串。游标是一个编码字符串，包含下一个分页查询应开始分页的位置及其分页方向：

```text
http://localhost/users?cursor=eyJpZCI6MTUsIl9wb2ludHNUb05leHRJdGVtcyI6dHJ1ZX0
```

你可以通过查询构建器提供的 `cursorPaginate` 方法创建基于游标的分页器实例。此方法返回一个 `Illuminate\Pagination\CursorPaginator` 实例：

```php
$users = DB::table('users')->orderBy('id')->cursorPaginate(15);
```

检索到游标分页器实例后，你可以像通常使用 `paginate` 和 `simplePaginate` 方法时一样[显示分页结果](#displaying-pagination-results)。有关游标分页器提供的实例方法的更多信息，请参阅[游标分页器实例方法文档](#cursor-paginator-instance-methods)。

> [!WARNING]
> 你的查询必须包含"order by"子句才能利用游标分页。此外，查询排序的列必须属于你正在分页的表。

<a name="cursor-vs-offset-pagination"></a>
#### 游标分页与偏移分页

为了说明偏移分页和游标分页之间的区别，让我们检查一些示例 SQL 查询。以下两个查询都将显示按 `id` 排序的 `users` 表的"第二页"结果：

```sql
# Offset Pagination...
select * from users order by id asc limit 15 offset 15;

# Cursor Pagination...
select * from users where id > 15 order by id asc limit 15;
```

游标分页查询相比偏移分页具有以下优势：

- 对于大数据集，如果"order by"列已建立索引，游标分页将提供更好的性能。这是因为"offset"子句会扫描所有先前匹配的数据。
- 对于写入频繁的数据集，如果用户当前正在查看的页面上最近添加或删除了结果，偏移分页可能会跳过记录或显示重复项。

但是，游标分页有以下限制：

- 与 `simplePaginate` 一样，游标分页只能用于显示"下一页"和"上一页"链接，不支持生成带有页码的链接。
- 它要求排序至少基于一个唯一列或唯一列的组合。不支持包含 `null` 值的列。
- "order by"子句中的查询表达式只有在被别名化并也添加到"select"子句中时才受支持。
- 不支持带参数的查询表达式。

<a name="manually-creating-a-paginator"></a>
### 手动创建分页器

有时你可能希望手动创建分页实例，向其传递你已在内存中的项目数组。你可以根据需要创建 `Illuminate\Pagination\Paginator`、`Illuminate\Pagination\LengthAwarePaginator` 或 `Illuminate\Pagination\CursorPaginator` 实例。

`Paginator` 和 `CursorPaginator` 类不需要知道结果集中的项目总数；但是，因此这些类没有检索最后一页索引的方法。`LengthAwarePaginator` 接受与 `Paginator` 几乎相同的参数；但它需要结果集中项目总数的计数。

换句话说，`Paginator` 对应于查询构建器上的 `simplePaginate` 方法，`CursorPaginator` 对应于 `cursorPaginate` 方法，而 `LengthAwarePaginator` 对应于 `paginate` 方法。

> [!WARNING]
> 手动创建分页器实例时，你应该手动"切片"传递给分页器的结果数组。如果你不确定如何操作，请查看 [array_slice](https://secure.php.net/manual/en/function.array-slice.php) PHP 函数。

<a name="customizing-pagination-urls"></a>
### 自定义分页 URL

默认情况下，分页器生成的链接将匹配当前请求的 URI。但是，分页器的 `withPath` 方法允许你自定义分页器在生成链接时使用的 URI。例如，如果你希望分页器生成像 `http://example.com/admin/users?page=N` 这样的链接，应将 `/admin/users` 传递给 `withPath` 方法：

```php
use App\Models\User;

Route::get('/users', function () {
    $users = User::paginate(15);

    $users->withPath('/admin/users');

    // ...
});
```

<a name="appending-query-string-values"></a>
#### 追加查询字符串值

你可以使用 `appends` 方法向分页链接的查询字符串追加内容。例如，要向每个分页链接追加 `sort=votes`，应进行以下 `appends` 调用：

```php
use App\Models\User;

Route::get('/users', function () {
    $users = User::paginate(15);

    $users->appends(['sort' => 'votes']);

    // ...
});
```

如果你希望将所有当前请求的查询字符串值追加到分页链接，可以使用 `withQueryString` 方法：

```php
$users = User::paginate(15)->withQueryString();
```

<a name="appending-hash-fragments"></a>
#### 追加哈希片段

如果你需要向分页器生成的 URL 追加"hash fragment"，可以使用 `fragment` 方法。例如，要在每个分页链接的末尾追加 `#users`，应如下调用 `fragment` 方法：

```php
$users = User::paginate(15)->fragment('users');
```

<a name="displaying-pagination-results"></a>
## 显示分页结果

调用 `paginate` 方法时，你将收到一个 `Illuminate\Pagination\LengthAwarePaginator` 实例，而调用 `simplePaginate` 方法将返回一个 `Illuminate\Pagination\Paginator` 实例。最后，调用 `cursorPaginate` 方法将返回一个 `Illuminate\Pagination\CursorPaginator` 实例。

这些对象提供了几种描述结果集的方法。除了这些辅助方法，分页器实例是迭代器，可以像数组一样循环。因此，一旦检索到结果，你可以使用 [Blade](/docs/{{version}}/blade) 显示结果并渲染页面链接：

```blade
<div class="container">
    @foreach ($users as $user)
        {{ $user->name }}
    @endforeach
</div>

{{ $users->links() }}
```

`links` 方法将渲染结果集中其余页面的链接。每个链接都已包含适当的 `page` 查询字符串变量。请记住，`links` 方法生成的 HTML 与 [Tailwind CSS 框架](https://tailwindcss.com)兼容。

<a name="adjusting-the-pagination-link-window"></a>
### 调整分页链接窗口

当分页器显示分页链接时，会显示当前页码以及当前页前后三页的链接。使用 `onEachSide` 方法，你可以控制在分页器生成的中间滑动窗口中当前页每侧显示多少个额外链接：

```blade
{{ $users->onEachSide(5)->links() }}
```

<a name="converting-results-to-json"></a>
### 将结果转换为 JSON

Laravel 分页器类实现了 `Illuminate\Contracts\Support\Jsonable` 接口契约并公开了 `toJson` 方法，因此将分页结果转换为 JSON 非常容易。你也可以通过从路由或控制器操作中返回分页器实例来将其转换为 JSON：

```php
use App\Models\User;

Route::get('/users', function () {
    return User::paginate();
});
```

分页器的 JSON 将包含元信息，如 `total`、`current_page`、`last_page` 等。结果记录可通过 JSON 数组中的 `data` 键获得。以下是从路由返回分页器实例时创建的 JSON 示例：

```json
{
   "total": 50,
   "per_page": 15,
   "current_page": 1,
   "last_page": 4,
   "current_page_url": "http://laravel.app?page=1",
   "first_page_url": "http://laravel.app?page=1",
   "last_page_url": "http://laravel.app?page=4",
   "next_page_url": "http://laravel.app?page=2",
   "prev_page_url": null,
   "path": "http://laravel.app",
   "from": 1,
   "to": 15,
   "data":[
        {
            // Record...
        },
        {
            // Record...
        }
   ]
}
```

<a name="customizing-the-pagination-view"></a>
## 自定义分页视图

默认情况下，用于显示分页链接的视图与 [Tailwind CSS](https://tailwindcss.com) 框架兼容。但是，如果你不使用 Tailwind，你可以自由定义自己的视图来渲染这些链接。在分页器实例上调用 `links` 方法时，你可以将视图名称作为第一个参数传递给该方法：

```blade
{{ $paginator->links('view.name') }}

<!-- Passing additional data to the view... -->
{{ $paginator->links('view.name', ['foo' => 'bar']) }}
```

然而，自定义分页视图最简单的方法是使用 `vendor:publish` 命令将它们导出到你的 `resources/views/vendor` 目录：

```shell
php artisan vendor:publish --tag=laravel-pagination
```

此命令会将视图放置在你的应用的 `resources/views/vendor/pagination` 目录中。此目录中的 `tailwind.blade.php` 文件对应于默认分页视图。你可以编辑此文件来修改分页 HTML。

如果你希望指定其他文件作为默认分页视图，可以在 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用分页器的 `defaultView` 和 `defaultSimpleView` 方法：

```php
<?php

namespace App\Providers;

use Illuminate\Pagination\Paginator;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Paginator::defaultView('view-name');

        Paginator::defaultSimpleView('view-name');
    }
}
```

<a name="using-bootstrap"></a>
### 使用 Bootstrap

Laravel 包含使用 [Bootstrap CSS](https://getbootstrap.com/) 构建的分页视图。要使用这些视图而不是默认的 Tailwind 视图，你可以在 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用分页器的 `useBootstrapFour` 或 `useBootstrapFive` 方法：

```php
use Illuminate\Pagination\Paginator;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Paginator::useBootstrapFive();
    Paginator::useBootstrapFour();
}
```

<a name="paginator-instance-methods"></a>
## 分页器 / LengthAwarePaginator 实例方法

每个分页器实例通过以下方法提供额外的分页信息：

<div class="overflow-auto">

| 方法                                     | 描述                                                                                      |
| ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| `$paginator->count()`                    | 获取当前页的项目数量。                                                                    |
| `$paginator->currentPage()`              | 获取当前页码。                                                                            |
| `$paginator->firstItem()`                | 获取结果中第一个项目的结果编号。                                                          |
| `$paginator->getOptions()`               | 获取分页器选项。                                                                          |
| `$paginator->getUrlRange($start, $end)`  | 创建一系列分页 URL。                                                                      |
| `$paginator->hasPages()`                 | 判断是否有足够的项目分成多页。                                                            |
| `$paginator->hasMorePages()`             | 判断数据存储中是否有更多项目。                                                            |
| `$paginator->items()`                    | 获取当前页的项目。                                                                        |
| `$paginator->lastItem()`                 | 获取结果中最后一个项目的结果编号。                                                        |
| `$paginator->lastPage()`                 | 获取最后一页的页码。（使用 `simplePaginate` 时不可用）。                                  |
| `$paginator->nextPageUrl()`              | 获取下一页的 URL。                                                                        |
| `$paginator->onFirstPage()`              | 判断分页器是否在第一页。                                                                  |
| `$paginator->onLastPage()`               | 判断分页器是否在最后一页。                                                                |
| `$paginator->perPage()`                  | 每页显示的项目数。                                                                        |
| `$paginator->previousPageUrl()`          | 获取上一页的 URL。                                                                        |
| `$paginator->total()`                    | 确定数据存储中匹配项目的总数。（使用 `simplePaginate` 时不可用）。                        |
| `$paginator->url($page)`                 | 获取给定页码的 URL。                                                                      |
| `$paginator->getPageName()`              | 获取用于存储页面的查询字符串变量。                                                        |
| `$paginator->setPageName($name)`         | 设置用于存储页面的查询字符串变量。                                                        |
| `$paginator->through($callback)`         | 使用回调转换每个项目。                                                                    |

</div>

<a name="cursor-paginator-instance-methods"></a>
## 游标分页器实例方法

每个游标分页器实例通过以下方法提供额外的分页信息：

<div class="overflow-auto">

| 方法                               | 描述                                                      |
| ---------------------------------- | --------------------------------------------------------- |
| `$paginator->count()`              | 获取当前页的项目数量。                                    |
| `$paginator->cursor()`             | 获取当前游标实例。                                        |
| `$paginator->getOptions()`         | 获取分页器选项。                                          |
| `$paginator->hasPages()`           | 判断是否有足够的项目分成多页。                            |
| `$paginator->hasMorePages()`       | 判断数据存储中是否有更多项目。                            |
| `$paginator->getCursorName()`      | 获取用于存储游标的查询字符串变量。                        |
| `$paginator->items()`              | 获取当前页的项目。                                        |
| `$paginator->nextCursor()`         | 获取下一组项目的游标实例。                                |
| `$paginator->nextPageUrl()`        | 获取下一页的 URL。                                        |
| `$paginator->onFirstPage()`        | 判断分页器是否在第一页。                                  |
| `$paginator->onLastPage()`         | 判断分页器是否在最后一页。                                |
| `$paginator->perPage()`            | 每页显示的项目数。                                        |
| `$paginator->previousCursor()`     | 获取上一组项目的游标实例。                                |
| `$paginator->previousPageUrl()`    | 获取上一页的 URL。                                        |
| `$paginator->setCursorName()`      | 设置用于存储游标的查询字符串变量。                        |
| `$paginator->url($cursor)`         | 获取给定游标实例的 URL。                                  |

</div>

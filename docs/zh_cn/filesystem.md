# 文件存储

- [简介](#introduction)
- [配置](#configuration)
    - [本地驱动](#the-local-driver)
    - [公共磁盘](#the-public-disk)
    - [驱动前提条件](#driver-prerequisites)
    - [作用域和只读文件系统](#scoped-and-read-only-filesystems)
    - [Amazon S3 兼容文件系统](#amazon-s3-compatible-filesystems)
- [获取磁盘实例](#obtaining-disk-instances)
    - [按需磁盘](#on-demand-disks)
- [检索文件](#retrieving-files)
    - [下载文件](#downloading-files)
    - [文件 URL](#file-urls)
    - [临时 URL](#temporary-urls)
    - [文件元数据](#file-metadata)
- [存储文件](#storing-files)
    - [在文件前/后追加内容](#prepending-appending-to-files)
    - [复制和移动文件](#copying-moving-files)
    - [自动流式传输](#automatic-streaming)
    - [文件上传](#file-uploads)
    - [文件可见性](#file-visibility)
    - [图像处理](#image-manipulation)
- [删除文件](#deleting-files)
- [目录](#directories)
- [测试](#testing)
- [自定义文件系统](#custom-filesystems)

<a name="introduction"></a>
## 简介

Laravel 提供了强大的文件系统抽象，这要归功于 Frank de Jonge 出色的 [Flysystem](https://github.com/thephpleague/flysystem) PHP 包。Laravel Flysystem 集成为处理本地文件系统、SFTP 和 Amazon S3 提供了简单的驱动。更棒的是，在这些存储选项之间切换非常简单，因为每个系统的 API 都是相同的。

<a name="configuration"></a>
## 配置

Laravel 的文件系统配置文件位于 `config/filesystems.php`。在此文件中，你可以配置所有文件系统"磁盘"。每个磁盘代表特定的存储驱动和存储位置。配置文件中包含了每个支持的驱动的示例配置，以便你可以修改配置以反映你的存储偏好和凭据。

`local` 驱动与存储在运行 Laravel 应用的服务器上的本地文件进行交互，而 `sftp` 存储驱动用于基于 SSH 密钥的 FTP。`s3` 驱动用于写入 Amazon 的 S3 云存储服务。

> [!NOTE]
> 你可以配置任意数量的磁盘，甚至可以拥有多个使用相同驱动的磁盘。

<a name="the-local-driver"></a>
### 本地驱动

当使用 `local` 驱动时，所有文件操作都相对于 `filesystems` 配置文件中定义的 `root` 目录。默认情况下，此值设置为 `storage/app/private` 目录。因此，以下方法将写入 `storage/app/private/example.txt`：

```php
use Illuminate\Support\Facades\Storage;

Storage::disk('local')->put('example.txt', 'Contents');
```

<a name="the-public-disk"></a>
### 公共磁盘

你应用 `filesystems` 配置文件中包含的 `public` 磁盘用于将要公开访问的文件。默认情况下，`public` 磁盘使用 `local` 驱动，并将其文件存储在 `storage/app/public` 中。

如果你的 `public` 磁盘使用 `local` 驱动，并且你希望这些文件可以从 Web 访问，你应从源目录 `storage/app/public` 创建符号链接到目标目录 `public/storage`：

要创建符号链接，你可以使用 `storage:link` Artisan 命令：

```shell
php artisan storage:link
```

文件存储好并创建符号链接后，你可以使用 `asset` 辅助函数创建文件的 URL：

```php
echo asset('storage/file.txt');
```

你可以在 `filesystems` 配置文件中配置额外的符号链接。每个配置的链接将在你运行 `storage:link` 命令时创建：

```php
'links' => [
    public_path('storage') => storage_path('app/public'),
    public_path('images') => storage_path('app/images'),
],
```

`storage:unlink` 命令可用于销毁你配置的符号链接：

```shell
php artisan storage:unlink
```

<a name="driver-prerequisites"></a>
### 驱动前提条件

<a name="s3-driver-configuration"></a>
#### S3 驱动配置

在使用 S3 驱动之前，你需要通过 Composer 包管理器安装 Flysystem S3 包：

```shell
composer require league/flysystem-aws-s3-v3 "^3.0" --with-all-dependencies
```

一个 S3 磁盘配置数组位于你的 `config/filesystems.php` 配置文件中。通常，你应该使用 `config/filesystems.php` 配置文件引用的以下环境变量来配置 S3 信息和凭据：

```ini
AWS_ACCESS_KEY_ID=<your-key-id>
AWS_SECRET_ACCESS_KEY=<your-secret-access-key>
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=<your-bucket-name>
AWS_USE_PATH_STYLE_ENDPOINT=false
```

为方便起见，这些环境变量与 AWS CLI 使用的命名约定匹配。

<a name="ftp-driver-configuration"></a>
#### FTP 驱动配置

在使用 FTP 驱动之前，你需要通过 Composer 包管理器安装 Flysystem FTP 包：

```shell
composer require league/flysystem-ftp "^3.0"
```

Laravel 的 Flysystem 集成与 FTP 配合得很好；但是，框架的默认 `config/filesystems.php` 配置文件中不包含示例配置。如果你需要配置 FTP 文件系统，你可以使用下面的配置示例：

```php
'ftp' => [
    'driver' => 'ftp',
    'host' => env('FTP_HOST'),
    'username' => env('FTP_USERNAME'),
    'password' => env('FTP_PASSWORD'),

    // 可选的 FTP 设置...
    // 'port' => env('FTP_PORT', 21),
    // 'root' => env('FTP_ROOT'),
    // 'passive' => true,
    // 'ssl' => true,
    // 'timeout' => 30,
],
```

<a name="sftp-driver-configuration"></a>
#### SFTP 驱动配置

在使用 SFTP 驱动之前，你需要通过 Composer 包管理器安装 Flysystem SFTP 包：

```shell
composer require league/flysystem-sftp-v3 "^3.0"
```

Laravel 的 Flysystem 集成与 SFTP 配合得很好；但是，框架的默认 `config/filesystems.php` 配置文件中不包含示例配置。如果你需要配置 SFTP 文件系统，你可以使用下面的配置示例：

```php
'sftp' => [
    'driver' => 'sftp',
    'host' => env('SFTP_HOST'),

    // 基本认证设置...
    'username' => env('SFTP_USERNAME'),
    'password' => env('SFTP_PASSWORD'),

    // 使用加密密码的 SSH 密钥认证设置...
    'privateKey' => env('SFTP_PRIVATE_KEY'),
    'passphrase' => env('SFTP_PASSPHRASE'),

    // 文件/目录权限设置...
    'visibility' => 'private', // `private` = 0600, `public` = 0644
    'directory_visibility' => 'private', // `private` = 0700, `public` = 0755

    // 可选的 SFTP 设置...
    // 'hostFingerprint' => env('SFTP_HOST_FINGERPRINT'),
    // 'maxTries' => 4,
    // 'passphrase' => env('SFTP_PASSPHRASE'),
    // 'port' => env('SFTP_PORT', 22),
    // 'root' => env('SFTP_ROOT', ''),
    // 'timeout' => 30,
    // 'useAgent' => true,
],
```

<a name="scoped-and-read-only-filesystems"></a>
### 作用域和只读文件系统

作用域磁盘允许你定义一个文件系统，其中所有路径都自动添加给定的路径前缀。在创建作用域文件系统磁盘之前，你需要通过 Composer 包管理器安装额外的 Flysystem 包：

```shell
composer require league/flysystem-path-prefixing "^3.0"
```

你可以通过定义一个使用 `scoped` 驱动的磁盘来创建任何现有文件系统磁盘的路径作用域实例。例如，你可以创建一个磁盘，将现有的 `s3` 磁盘作用域到特定的路径前缀，然后使用你的作用域磁盘的每个文件操作都将使用指定的前缀：

```php
's3-videos' => [
    'driver' => 'scoped',
    'disk' => 's3',
    'prefix' => 'path/to/videos',
],
```

"只读"磁盘允许你创建不允许写入操作的文件系统磁盘。在使用 `read-only` 配置选项之前，你需要通过 Composer 包管理器安装额外的 Flysystem 包：

```shell
composer require league/flysystem-read-only "^3.0"
```

接下来，你可以在一个或多个磁盘的配置数组中包含 `read-only` 配置选项：

```php
's3-videos' => [
    'driver' => 's3',
    // ...
    'read-only' => true,
],
```

<a name="amazon-s3-compatible-filesystems"></a>
### Amazon S3 兼容文件系统

默认情况下，你的应用的 `filesystems` 配置文件包含一个用于 `s3` 磁盘的磁盘配置。除了使用此磁盘与 [Amazon S3](https://aws.amazon.com/s3/) 交互外，你还可以使用它与任何 S3 兼容的文件存储服务进行交互，例如 [RustFS](https://github.com/rustfs/rustfs)、[DigitalOcean Spaces](https://www.digitalocean.com/products/spaces/)、[Vultr Object Storage](https://www.vultr.com/products/object-storage/)、[Cloudflare R2](https://www.cloudflare.com/developer-platform/products/r2/) 或 [Hetzner Cloud Storage](https://www.hetzner.com/storage/object-storage/)。

通常，在将磁盘的凭据更新为与你计划使用的服务的凭据匹配后，你只需要更新 `endpoint` 配置选项的值。此选项的值通常通过 `AWS_ENDPOINT` 环境变量定义：

```php
'endpoint' => env('AWS_ENDPOINT', 'https://rustfs:9000'),
```

<a name="obtaining-disk-instances"></a>
## 获取磁盘实例

`Storage` 门面可用于与你配置的任何磁盘进行交互。例如，你可以使用门面上的 `put` 方法将头像存储在默认磁盘上。如果你在调用 `Storage` 门面的方法之前没有先调用 `disk` 方法，该方法将自动传递给默认磁盘：

```php
use Illuminate\Support\Facades\Storage;

Storage::put('avatars/1', $content);
```

如果你的应用与多个磁盘交互，你可以使用 `Storage` 门面的 `disk` 方法在特定磁盘上处理文件：

```php
Storage::disk('s3')->put('avatars/1', $content);
```

<a name="on-demand-disks"></a>
### 按需磁盘

有时你可能希望使用给定配置在运行时创建磁盘，而该配置实际上不存在于你的应用 `filesystems` 配置文件中。为此，你可以向 `Storage` 门面的 `build` 方法传递一个配置数组：

```php
use Illuminate\Support\Facades\Storage;

$disk = Storage::build([
    'driver' => 'local',
    'root' => '/path/to/root',
]);

$disk->put('image.jpg', $content);
```

<a name="retrieving-files"></a>
## 检索文件

`get` 方法可用于检索文件的内容。该方法将返回文件的原始字符串内容。请记住，所有文件路径应相对于磁盘的"根"位置指定：

```php
$contents = Storage::get('file.jpg');
```

如果你检索的文件包含 JSON，你可以使用 `json` 方法检索文件并解码其内容：

```php
$orders = Storage::json('orders.json');
```

`exists` 方法可用于判断文件是否存在于磁盘上：

```php
if (Storage::disk('s3')->exists('file.jpg')) {
    // ...
}
```

`missing` 方法可用于判断磁盘上是否缺少文件：

```php
if (Storage::disk('s3')->missing('file.jpg')) {
    // ...
}
```

<a name="downloading-files"></a>
### 下载文件

`download` 方法可用于生成一个响应，强制用户的浏览器下载给定路径的文件。`download` 方法接受一个文件名作为第二个参数，该参数将决定用户看到的文件名。最后，你可以将 HTTP 标头数组作为第三个参数传递：

```php
return Storage::download('file.jpg');

return Storage::download('file.jpg', $name, $headers);
```

<a name="file-urls"></a>
### 文件 URL

你可以使用 `url` 方法获取给定文件的 URL。如果你使用 `local` 驱动，这通常会将 `/storage` 添加到给定路径前面，并返回文件的相对 URL。如果你使用 `s3` 驱动，将返回完整的远程 URL：

```php
use Illuminate\Support\Facades\Storage;

$url = Storage::url('file.jpg');
```

使用 `local` 驱动时，所有应公开访问的文件应放置在 `storage/app/public` 目录中。此外，你应在 `public/storage` 处[创建一个符号链接](#the-public-disk)，指向 `storage/app/public` 目录。

> [!WARNING]
> 使用 `local` 驱动时，`url` 的返回值不是 URL 编码的。因此，我们建议你始终使用能生成有效 URL 的名称来存储文件。

<a name="url-host-customization"></a>
#### URL 主机自定义

如果你想修改使用 `Storage` 门面生成的 URL 的主机，你可以在磁盘的配置数组中添加或更改 `url` 选项：

```php
'public' => [
    'driver' => 'local',
    'root' => storage_path('app/public'),
    'url' => env('APP_URL').'/storage',
    'visibility' => 'public',
    'throw' => false,
],
```

<a name="temporary-urls"></a>
### 临时 URL

使用 `temporaryUrl` 方法，你可以为使用 `local` 和 `s3` 驱动存储的文件创建临时 URL。此方法接受一个路径和一个 `DateTime` 实例，指定 URL 何时过期：

```php
use Illuminate\Support\Facades\Storage;

$url = Storage::temporaryUrl(
    'file.jpg', now()->plus(minutes: 5)
);
```

<a name="enabling-local-temporary-urls"></a>
#### 启用本地临时 URL

如果你在 `local` 驱动引入临时 URL 支持之前开始开发应用，你可能需要启用本地临时 URL。为此，在 `config/filesystems.php` 配置文件中将 `serve` 选项添加到 `local` 磁盘的配置数组中：

```php
'local' => [
    'driver' => 'local',
    'root' => storage_path('app/private'),
    'serve' => true, // [tl! add]
    'throw' => false,
],
```

<a name="s3-request-parameters"></a>
#### S3 请求参数

如果你需要指定额外的 [S3 请求参数](https://docs.aws.amazon.com/AmazonS3/latest/API/RESTObjectGET.html#RESTObjectGET-requests)，你可以将请求参数数组作为第三个参数传递给 `temporaryUrl` 方法：

```php
$url = Storage::temporaryUrl(
    'file.jpg',
    now()->plus(minutes: 5),
    [
        'ResponseContentType' => 'application/octet-stream',
        'ResponseContentDisposition' => 'attachment; filename=file2.jpg',
    ]
);
```

<a name="customizing-temporary-urls"></a>
#### 自定义临时 URL

如果你需要自定义特定存储磁盘的临时 URL 创建方式，你可以使用 `buildTemporaryUrlsUsing` 方法。例如，如果你有一个控制器允许用户下载存储在通常不支持临时 URL 的磁盘上的文件，这会很有用。通常，此方法应在服务提供者的 `boot` 方法中调用：

```php
<?php

namespace App\Providers;

use DateTime;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Storage::disk('local')->buildTemporaryUrlsUsing(
            function (string $path, DateTime $expiration, array $options) {
                return URL::temporarySignedRoute(
                    'files.download',
                    $expiration,
                    array_merge($options, ['path' => $path])
                );
            }
        );
    }
}
```

<a name="temporary-upload-urls"></a>
#### 临时上传 URL

> [!WARNING]
> 生成临时上传 URL 的功能仅受 `s3` 和 `local` 驱动支持。

如果你需要生成一个可用于直接从客户端应用上传文件的临时 URL，你可以使用 `temporaryUploadUrl` 方法。此方法接受一个路径和一个 `DateTime` 实例，指定 URL 何时过期。`temporaryUploadUrl` 方法返回一个关联数组，可以解构为上传 URL 和应包含在上传请求中的标头：

```php
use Illuminate\Support\Facades\Storage;

['url' => $url, 'headers' => $headers] = Storage::temporaryUploadUrl(
    'file.jpg', now()->plus(minutes: 5)
);
```

此方法主要用于无服务器环境，该环境要求客户端应用直接将文件上传到云存储系统（如 Amazon S3）。

<a name="file-metadata"></a>
### 文件元数据

除了读写文件，Laravel 还可以提供有关文件本身的信息。例如，`size` 方法可用于获取文件大小（以字节为单位）：

```php
use Illuminate\Support\Facades\Storage;

$size = Storage::size('file.jpg');
```

`lastModified` 方法返回文件最后修改的 UNIX 时间戳：

```php
$time = Storage::lastModified('file.jpg');
```

给定文件的 MIME 类型可通过 `mimeType` 方法获取：

```php
$mime = Storage::mimeType('file.jpg');
```

<a name="file-paths"></a>
#### 文件路径

你可以使用 `path` 方法获取给定文件的路径。如果你使用 `local` 驱动，这将返回文件的绝对路径。如果你使用 `s3` 驱动，此方法将返回 S3 存储桶中文件的相对路径：

```php
use Illuminate\Support\Facades\Storage;

$path = Storage::path('file.jpg');
```

<a name="storing-files"></a>
## 存储文件

`put` 方法可用于在磁盘上存储文件内容。你也可以向 `put` 方法传递一个 PHP `resource`，它将使用 Flysystem 的底层流支持。请记住，所有文件路径应相对于为磁盘配置的"根"位置：

```php
use Illuminate\Support\Facades\Storage;

Storage::put('file.jpg', $contents);

Storage::put('file.jpg', $resource);
```

<a name="failed-writes"></a>
#### 写入失败

如果 `put` 方法（或其他"写入"操作）无法将文件写入磁盘，将返回 `false`：

```php
if (! Storage::put('file.jpg', $contents)) {
    // 文件无法写入磁盘...
}
```

如果愿意，你可以在文件系统磁盘的配置数组中定义 `throw` 选项。当此选项定义为 `true` 时，如果写入操作失败，"写入"方法（如 `put`）将抛出 `League\Flysystem\UnableToWriteFile` 实例：

```php
'public' => [
    'driver' => 'local',
    // ...
    'throw' => true,
],
```

<a name="prepending-appending-to-files"></a>
### 在文件前/后追加内容

`prepend` 和 `append` 方法允许你在文件的开头或结尾写入内容：

```php
Storage::prepend('file.log', 'Prepended Text');

Storage::append('file.log', 'Appended Text');
```

<a name="copying-moving-files"></a>
### 复制和移动文件

`copy` 方法可用于将现有文件复制到磁盘上的新位置，而 `move` 方法可用于重命名或将现有文件移动到新位置：

```php
Storage::copy('old/file.jpg', 'new/file.jpg');

Storage::move('old/file.jpg', 'new/file.jpg');
```

<a name="automatic-streaming"></a>
### 自动流式传输

将文件流式传输到存储可以显著减少内存使用。如果你希望 Laravel 自动管理将给定文件流式传输到存储位置，你可以使用 `putFile` 或 `putFileAs` 方法。此方法接受 `Illuminate\Http\File` 或 `Illuminate\Http\UploadedFile` 实例，并将自动将文件流式传输到你所需的位置：

```php
use Illuminate\Http\File;
use Illuminate\Support\Facades\Storage;

// 自动为文件名生成唯一 ID...
$path = Storage::putFile('photos', new File('/path/to/photo'));

// 手动指定文件名...
$path = Storage::putFileAs('photos', new File('/path/to/photo'), 'photo.jpg');
```

关于 `putFile` 方法有一些重要的注意事项。请注意，我们只指定了目录名称，而不是文件名。默认情况下，`putFile` 方法将生成一个唯一 ID 作为文件名。文件的扩展名将通过检查文件的 MIME 类型来确定。`putFile` 方法将返回文件的路径，因此你可以将包含生成文件名的路径存储在数据库中。

`putFile` 和 `putFileAs` 方法也接受一个参数来指定存储文件的"可见性"。如果你将文件存储在云端磁盘（如 Amazon S3）上，并希望文件通过生成的 URL 公开访问，这特别有用：

```php
Storage::putFile('photos', new File('/path/to/photo'), 'public');
```

<a name="file-uploads"></a>
### 文件上传

在 Web 应用中，最常见的文件存储用例之一是存储用户上传的文件，如照片和文档。Laravel 使得使用上传文件实例上的 `store` 方法非常容易存储上传的文件。使用你想要存储上传文件的路径调用 `store` 方法：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class UserAvatarController extends Controller
{
    /**
     * Update the avatar for the user.
     */
    public function update(Request $request): string
    {
        $path = $request->file('avatar')->store('avatars');

        return $path;
    }
}
```

关于此示例有一些重要的注意事项。请注意，我们只指定了目录名称，而不是文件名。默认情况下，`store` 方法将生成一个唯一 ID 作为文件名。文件的扩展名将通过检查文件的 MIME 类型来确定。`store` 方法将返回文件的路径，因此你可以将包含生成文件名的路径存储在数据库中。

你也可以在 `Storage` 门面上调用 `putFile` 方法来执行与上面示例相同的文件存储操作：

```php
$path = Storage::putFile('avatars', $request->file('avatar'));
```

<a name="specifying-a-file-name"></a>
#### 指定文件名

如果你不希望自动为存储的文件分配文件名，你可以使用 `storeAs` 方法，它接收路径、文件名和（可选的）磁盘作为参数：

```php
$path = $request->file('avatar')->storeAs(
    'avatars', $request->user()->id
);
```

你也可以在 `Storage` 门面上使用 `putFileAs` 方法，它将执行与上面示例相同的文件存储操作：

```php
$path = Storage::putFileAs(
    'avatars', $request->file('avatar'), $request->user()->id
);
```

> [!WARNING]
> 不可打印和无效的 Unicode 字符将从文件路径中自动移除。因此，你可能希望在将文件路径传递给 Laravel 的文件存储方法之前对其进行清理。文件路径使用 `League\Flysystem\WhitespacePathNormalizer::normalizePath` 方法进行规范化。

<a name="specifying-a-disk"></a>
#### 指定磁盘

默认情况下，此上传文件的 `store` 方法将使用你的默认磁盘。如果你想指定另一个磁盘，将磁盘名称作为第二个参数传递给 `store` 方法：

```php
$path = $request->file('avatar')->store(
    'avatars/'.$request->user()->id, 's3'
);
```

如果你使用 `storeAs` 方法，你可以将磁盘名称作为第三个参数传递给该方法：

```php
$path = $request->file('avatar')->storeAs(
    'avatars',
    $request->user()->id,
    's3'
);
```

<a name="other-uploaded-file-information"></a>
#### 其他上传文件信息

如果你想获取上传文件的原始名称和扩展名，你可以使用 `getClientOriginalName` 和 `getClientOriginalExtension` 方法：

```php
$file = $request->file('avatar');

$name = $file->getClientOriginalName();
$extension = $file->getClientOriginalExtension();
```

但请记住，`getClientOriginalName` 和 `getClientOriginalExtension` 方法被认为是不安全的，因为文件名和扩展名可能被恶意用户篡改。因此，你应该首选 `hashName` 和 `extension` 方法来获取给定上传文件的名称和扩展名：

```php
$file = $request->file('avatar');

$name = $file->hashName(); // 生成唯一的随机名称...
$extension = $file->extension(); // 根据文件的 MIME 类型确定文件扩展名...
```

<a name="file-visibility"></a>
### 文件可见性

在 Laravel 的 Flysystem 集成中，"可见性"是跨多个平台的文件权限抽象。文件可以声明为 `public` 或 `private`。当文件声明为 `public` 时，你表示该文件通常应对其他人可访问。例如，使用 S3 驱动时，你可以检索 `public` 文件的 URL。

你可以在通过 `put` 方法写入文件时设置可见性：

```php
use Illuminate\Support\Facades\Storage;

Storage::put('file.jpg', $contents, 'public');
```

如果文件已存储，可以通过 `getVisibility` 和 `setVisibility` 方法检索和设置其可见性：

```php
$visibility = Storage::getVisibility('file.jpg');

Storage::setVisibility('file.jpg', 'public');
```

与上传文件交互时，你可以使用 `storePublicly` 和 `storePubliclyAs` 方法以 `public` 可见性存储上传的文件：

```php
$path = $request->file('avatar')->storePublicly('avatars', 's3');

$path = $request->file('avatar')->storePubliclyAs(
    'avatars',
    $request->user()->id,
    's3'
);
```

<a name="image-manipulation"></a>
### 图像处理

如果你需要在存储上传的图像之前调整大小、裁剪或转换格式，你可以使用 Laravel 的[图像处理功能](/docs/{{version}}/images)：

```php
$path = $request->image('avatar')
    ->cover(400, 400)
    ->toWebp()
    ->storePublicly('avatars', 'public');
```

你也可以从已存储在文件系统磁盘上的文件创建图像实例：

```php
$image = Storage::disk('public')->image('avatars/photo.jpg');
```

<a name="local-files-and-visibility"></a>
#### 本地文件和可见性

使用 `local` 驱动时，`public` [可见性](#file-visibility)转换为目录的 `0755` 权限和文件的 `0644` 权限。你可以在应用的 `filesystems` 配置文件中修改权限映射：

```php
'local' => [
    'driver' => 'local',
    'root' => storage_path('app'),
    'permissions' => [
        'file' => [
            'public' => 0644,
            'private' => 0600,
        ],
        'dir' => [
            'public' => 0755,
            'private' => 0700,
        ],
    ],
    'throw' => false,
],
```

<a name="deleting-files"></a>
## 删除文件

`delete` 方法接受单个文件名或要删除的文件数组：

```php
use Illuminate\Support\Facades\Storage;

Storage::delete('file.jpg');

Storage::delete(['file.jpg', 'file2.jpg']);
```

如果需要，你可以指定应从哪个磁盘删除文件：

```php
use Illuminate\Support\Facades\Storage;

Storage::disk('s3')->delete('path/file.jpg');
```

<a name="directories"></a>
## 目录

<a name="get-all-files-within-a-directory"></a>
#### 获取目录中的所有文件

`files` 方法返回给定目录中所有文件的数组。如果你想检索给定目录中包括子目录的所有文件的列表，你可以使用 `allFiles` 方法：

```php
use Illuminate\Support\Facades\Storage;

$files = Storage::files($directory);

$files = Storage::allFiles($directory);
```

<a name="get-all-directories-within-a-directory"></a>
#### 获取目录中的所有子目录

`directories` 方法返回给定目录中所有目录的数组。如果你想检索给定目录中包括子目录的所有目录的列表，你可以使用 `allDirectories` 方法：

```php
$directories = Storage::directories($directory);

$directories = Storage::allDirectories($directory);
```

<a name="create-a-directory"></a>
#### 创建目录

`makeDirectory` 方法将创建给定目录，包括任何需要的子目录：

```php
Storage::makeDirectory($directory);
```

<a name="delete-a-directory"></a>
#### 删除目录

最后，`deleteDirectory` 方法可用于删除目录及其所有文件：

```php
Storage::deleteDirectory($directory);
```

<a name="testing"></a>
## 测试

`Storage` 门面的 `fake` 方法允许你轻松生成一个虚拟磁盘，结合 `Illuminate\Http\UploadedFile` 类的文件生成工具，大大简化了文件上传的测试。例如：

```php tab=Pest
<?php

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('albums can be uploaded', function () {
    Storage::fake('photos');

    $response = $this->json('POST', '/photos', [
        UploadedFile::fake()->image('photo1.jpg'),
        UploadedFile::fake()->image('photo2.jpg')
    ]);

    // 断言一个或多个文件已存储...
    Storage::disk('photos')->assertExists('photo1.jpg');
    Storage::disk('photos')->assertExists(['photo1.jpg', 'photo2.jpg']);

    // 断言一个或多个文件未存储...
    Storage::disk('photos')->assertMissing('missing.jpg');
    Storage::disk('photos')->assertMissing(['missing.jpg', 'non-existing.jpg']);

    // 断言给定目录中的文件数量与预期计数匹配...
    Storage::disk('photos')->assertCount('/wallpapers', 2);

    // 断言给定目录为空...
    Storage::disk('photos')->assertDirectoryEmpty('/wallpapers');

    // 断言磁盘不包含任何文件...
    Storage::disk('photos')->assertEmpty();
});
```

```php tab=PHPUnit
<?php

namespace Tests\Feature;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_albums_can_be_uploaded(): void
    {
        Storage::fake('photos');

        $response = $this->json('POST', '/photos', [
            UploadedFile::fake()->image('photo1.jpg'),
            UploadedFile::fake()->image('photo2.jpg')
        ]);

        // 断言一个或多个文件已存储...
        Storage::disk('photos')->assertExists('photo1.jpg');
        Storage::disk('photos')->assertExists(['photo1.jpg', 'photo2.jpg']);

        // 断言一个或多个文件未存储...
        Storage::disk('photos')->assertMissing('missing.jpg');
        Storage::disk('photos')->assertMissing(['missing.jpg', 'non-existing.jpg']);

        // 断言给定目录中的文件数量与预期计数匹配...
        Storage::disk('photos')->assertCount('/wallpapers', 2);

        // 断言给定目录为空...
        Storage::disk('photos')->assertDirectoryEmpty('/wallpapers');

        // 断言磁盘不包含任何文件...
        Storage::disk('photos')->assertEmpty();
    }
}
```

默认情况下，`fake` 方法将删除其临时目录中的所有文件。如果你想保留这些文件，可以使用 "persistentFake" 方法。关于测试文件上传的更多信息，你可以查阅 [HTTP 测试文档中关于文件上传的信息](/docs/{{version}}/http-tests#testing-file-uploads)。

> [!WARNING]
> `image` 方法需要 [GD 扩展](https://www.php.net/manual/en/book.image.php)。

<a name="custom-filesystems"></a>
## 自定义文件系统

Laravel 的 Flysystem 集成开箱即用地支持几个"驱动"；但是，Flysystem 并不仅限于这些，它还有许多其他存储系统的适配器。如果你想在 Laravel 应用中使用这些额外的适配器之一，你可以创建自定义驱动。

为了定义自定义文件系统，你需要一个 Flysystem 适配器。让我们将一个社区维护的 Dropbox 适配器添加到我们的项目中：

```shell
composer require spatie/flysystem-dropbox
```

接下来，你可以在你的应用[服务提供者](/docs/{{version}}/providers)之一的 `boot` 方法中注册该驱动。为此，你应该使用 `Storage` 门面的 `extend` 方法：

```php
<?php

namespace App\Providers;

use Illuminate\Contracts\Foundation\Application;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\ServiceProvider;
use League\Flysystem\Filesystem;
use Spatie\Dropbox\Client as DropboxClient;
use Spatie\FlysystemDropbox\DropboxAdapter;

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
        Storage::extend('dropbox', function (Application $app, array $config) {
            $adapter = new DropboxAdapter(new DropboxClient(
                $config['authorization_token']
            ));

            return new FilesystemAdapter(
                new Filesystem($adapter, $config),
                $adapter,
                $config
            );
        });
    }
}
```

`extend` 方法的第一个参数是驱动的名称，第二个是一个接收 `$app` 和 `$config` 变量的闭包。该闭包必须返回 `Illuminate\Filesystem\FilesystemAdapter` 的实例。`$config` 变量包含 `config/filesystems.php` 中为指定磁盘定义的值。

在创建并注册扩展的服务提供者后，你可以在 `config/filesystems.php` 配置文件中使用 `dropbox` 驱动。

# Laravel Pint

- [简介](#introduction)
- [安装](#installation)
- [运行 Pint](#running-pint)
- [配置 Pint](#configuring-pint)
    - [预设](#presets)
    - [规则](#rules)
    - [排除文件/文件夹](#excluding-files-or-folders)
- [持续集成](#continuous-integration)
    - [GitHub Actions](#running-tests-on-github-actions)

<a name="introduction"></a>
## 简介

[Laravel Pint](https://github.com/laravel/pint) 是一个为极简主义者量身定制的固执己见的 PHP 代码风格修复工具。Pint 基于 [PHP CS Fixer](https://github.com/FriendsOfPHP/PHP-CS-Fixer) 构建，让你可以轻松确保代码风格保持整洁和一致。

Pint 会自动安装到所有新的 Laravel 应用程序中，因此你可以立即开始使用它。默认情况下，Pint 不需要任何配置，并将按照 Laravel 的编码风格来修复代码中的代码风格问题。

<a name="installation"></a>
## 安装

Pint 已包含在 Laravel 框架的最新版本中，因此通常无需安装。但是，对于较旧的应用程序，你可以通过 Composer 安装 Laravel Pint：

```shell
composer require laravel/pint --dev
```

<a name="running-pint"></a>
## 运行 Pint

你可以通过调用项目中 `vendor/bin` 目录下的 `pint` 二进制文件来指示 Pint 修复代码风格问题：

```shell
./vendor/bin/pint
```

如果你希望 Pint 以并行模式（实验性）运行以提高性能，可以使用 `--parallel` 选项：

```shell
./vendor/bin/pint --parallel
```

并行模式还允许你通过 `--max-processes` 选项指定要运行的最大进程数。如果未提供此选项，Pint 将使用机器上的所有可用核心：

```shell
./vendor/bin/pint --parallel --max-processes=4
```

你也可以对特定文件或目录运行 Pint：

```shell
./vendor/bin/pint app/Models

./vendor/bin/pint app/Models/User.php
```

Pint 将显示其更新的所有文件的详细列表。你可以通过在调用 Pint 时提供 `-v` 选项来查看 Pint 更改的更多详情：

```shell
./vendor/bin/pint -v
```

如果你希望 Pint 仅检查代码中的样式错误而不实际更改文件，可以使用 `--test` 选项。如果发现任何代码样式错误，Pint 将返回非零退出码：

```shell
./vendor/bin/pint --test
```

如果你希望 Pint 仅修改与提供的分支不同的文件（根据 Git），可以使用 `--diff=[branch]` 选项。这可以在 CI 环境（如 GitHub Actions）中有效使用，通过仅检查新文件或修改文件来节省时间：

```shell
./vendor/bin/pint --diff=main
```

如果你希望 Pint 仅修改根据 Git 有未提交更改的文件，可以使用 `--dirty` 选项：

```shell
./vendor/bin/pint --dirty
```

如果你希望 Pint 修复任何有代码样式错误的文件，但在修复任何错误后仍以非零退出码退出，可以使用 `--repair` 选项：

```shell
./vendor/bin/pint --repair
```

<a name="configuring-pint"></a>
## 配置 Pint

如前所述，Pint 不需要任何配置。但是，如果你想自定义预设、规则或检查的文件夹，可以在项目的根目录中创建一个 `pint.json` 文件：

```json
{
    "preset": "laravel"
}
```

此外，如果你想使用特定目录中的 `pint.json`，可以在调用 Pint 时提供 `--config` 选项：

```shell
./vendor/bin/pint --config vendor/my-company/coding-style/pint.json
```

<a name="presets"></a>
### 预设

预设定义了一组可用于修复代码中代码风格问题的规则。默认情况下，Pint 使用 `laravel` 预设，它按照 Laravel 的编码风格修复问题。但是，你可以通过向 Pint 提供 `--preset` 选项来指定不同的预设：

```shell
./vendor/bin/pint --preset psr12
```

如果你愿意，也可以在项目的 `pint.json` 文件中设置预设：

```json
{
    "preset": "psr12"
}
```

Pint 当前支持的预设为：`laravel`、`per`、`psr12`、`symfony` 和 `empty`。

<a name="rules"></a>
### 规则

规则是 Pint 将用于修复代码中代码风格问题的样式指南。如上所述，预设是预定义的规则组，对于大多数 PHP 项目来说应该是完美的，因此你通常不需要担心它们包含的个别规则。

但是，如果你愿意，可以在 `pint.json` 文件中启用或禁用特定规则，或使用 `empty` 预设并从头开始定义规则：

```json
{
    "preset": "laravel",
    "rules": {
        "simplified_null_return": true,
        "array_indentation": false,
        "new_with_parentheses": {
            "anonymous_class": true,
            "named_class": true
        }
    }
}
```

Pint 基于 [PHP CS Fixer](https://github.com/FriendsOfPHP/PHP-CS-Fixer) 构建。因此，你可以使用其任何规则来修复项目中的代码风格问题：[PHP CS Fixer Configurator](https://mlocati.github.io/php-cs-fixer-configurator)。

<a name="custom-rules"></a>
#### 自定义规则

除了 PHP CS Fixer 规则外，Pint 还提供了以 `Pint/` 为前缀的自定义规则。这些规则默认未启用，但你可以在 `pint.json` 文件中启用它们。

<a name="phpdoc-type-annotations-only"></a>
##### `Pint/phpdoc_type_annotations_only`

此规则从你的代码中删除所有注释和文档块散文，只保留包含 `@` 注解的行，如 `@param`、`@return`、`@var`、`@phpstan-type` 等：

```php
/**
 * Get the posts for the user. [tl! remove]
 * [tl! remove]
 * @return HasMany<Post, $this>
 */
public function posts(): HasMany
```

没有 `@` 注解的单行注释和块注释将被完全删除。如果你想保留特定注释，可以为其加上 `@note`、`@warning` 或 `@todo` 前缀：

```php
// @note This comment will be preserved.
```

要启用此规则，请将其添加到你的 `pint.json` 文件中：

```json
{
    "preset": "laravel",
    "rules": {
        "Pint/phpdoc_type_annotations_only": true
    }
}
```

> [!NOTE]
> 此规则会自动跳过 `config` 目录中的文件，因为配置文件通常依赖注释作为文档。

<a name="excluding-files-or-folders"></a>
### 排除文件/文件夹

默认情况下，Pint 将检查项目中除 `vendor` 目录之外的所有 `.php` 文件。如果你想排除更多文件夹，可以使用 `exclude` 配置选项：

```json
{
    "exclude": [
        "my-specific/folder"
    ]
}
```

如果你想排除所有包含给定名称模式的文件，可以使用 `notName` 配置选项：

```json
{
    "notName": [
        "*-my-file.php"
    ]
}
```

如果你想通过提供文件的精确路径来排除文件，可以使用 `notPath` 配置选项：

```json
{
    "notPath": [
        "path/to/excluded-file.php"
    ]
}
```

<a name="continuous-integration"></a>
## 持续集成

<a name="running-tests-on-github-actions"></a>
### GitHub Actions

要自动化使用 Laravel Pint 检查项目代码风格，你可以配置 [GitHub Actions](https://github.com/features/actions)，以便在将新代码推送到 GitHub 时运行 Pint。首先，确保在 GitHub 上为工作流授予"读取和写入权限"，路径为 **设置 > Actions > 常规 > 工作流权限**。然后，创建一个包含以下内容的 `.github/workflows/lint.yml` 文件：

```yaml
name: Fix Code Style

on: [push]

jobs:
  lint:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: true
      matrix:
        php: [8.4]

    steps:
      - name: Checkout code
        uses: actions/checkout@v5

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: ${{ matrix.php }}
          tools: pint

      - name: Run Pint
        run: pint

      - name: Commit linted files
        uses: stefanzweifel/git-auto-commit-action@v6
```

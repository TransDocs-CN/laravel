# 任务调度

- [简介](#introduction)
- [定义调度](#defining-schedules)
    - [调度 Artisan 命令](#scheduling-artisan-commands)
    - [调度队列作业](#scheduling-queued-jobs)
    - [调度 Shell 命令](#scheduling-shell-commands)
    - [调度频率选项](#schedule-frequency-options)
    - [时区](#timezones)
    - [防止任务重叠](#preventing-task-overlaps)
    - [在单台服务器上运行任务](#running-tasks-on-one-server)
    - [后台任务](#background-tasks)
    - [维护模式](#maintenance-mode)
    - [暂停计划任务](#pausing-scheduled-tasks)
    - [调度组](#schedule-groups)
- [运行调度器](#running-the-scheduler)
    - [亚分钟计划任务](#sub-minute-scheduled-tasks)
    - [在本地运行调度器](#running-the-scheduler-locally)
- [任务输出](#task-output)
- [任务钩子](#task-hooks)
- [事件](#events)

<a name="introduction"></a>
## 简介

过去，你可能需要为要在服务器上调度的每个任务编写一个 cron 配置项。但这很快就会变得很麻烦，因为你的任务调度不再在版本控制中，而且你必须通过 SSH 登录到服务器才能查看现有的 cron 条目或添加额外的条目。

Laravel 的命令调度器提供了一种管理服务器上计划任务的全新方法。调度器允许你在 Laravel 应用程序中流畅且富有表现力地定义命令调度。使用调度器时，你的服务器上只需要一个 cron 条目。你的任务调度通常在应用程序的 `routes/console.php` 文件中定义。

<a name="defining-schedules"></a>
## 定义调度

你可以在应用程序的 `routes/console.php` 文件中定义所有计划任务。让我们先看一个示例。在此示例中，我们将计划一个闭包在每天午夜调用。在闭包中，我们将执行一个数据库查询来清空一个表：

```php
<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;

Schedule::call(function () {
    DB::table('recent_users')->delete();
})->daily();
```

除了使用闭包进行调度，你还可以调度[可调用对象](https://secure.php.net/manual/en/language.oop5.magic.php#object.invoke)。可调用对象是包含 `__invoke` 方法的简单 PHP 类：

```php
Schedule::call(new DeleteRecentUsers)->daily();
```

如果你更愿意将 `routes/console.php` 文件仅用于命令定义，可以在应用程序的 `bootstrap/app.php` 文件中使用 `withSchedule` 方法来定义计划任务。此方法接受一个闭包，该闭包接收一个调度器实例：

```php
use Illuminate\Console\Scheduling\Schedule;

->withSchedule(function (Schedule $schedule) {
    $schedule->call(new DeleteRecentUsers)->daily();
})
```

如果你想查看计划任务的概述及其计划运行的下一次时间，可以使用 `schedule:list` Artisan 命令：

```shell
php artisan schedule:list
```

<a name="scheduling-artisan-commands"></a>
### 调度 Artisan 命令

除了调度闭包，你还可以调度 [Artisan 命令](/docs/{{version}}/artisan)和系统命令。例如，你可以使用 `command` 方法通过命令的名称或类来调度 Artisan 命令。

当使用命令的类名调度 Artisan 命令时，你可以传递一个额外的命令行参数数组，这些参数将在命令被调用时提供给它：

```php
use App\Console\Commands\SendEmailsCommand;
use Illuminate\Support\Facades\Schedule;

Schedule::command('emails:send Taylor --force')->daily();

Schedule::command(SendEmailsCommand::class, ['Taylor', '--force'])->daily();
```

<a name="scheduling-artisan-closure-commands"></a>
#### 调度 Artisan 闭包命令

如果你想调度一个由闭包定义的 Artisan 命令，可以在命令定义后链式调用调度相关的方法：

```php
Artisan::command('delete:recent-users', function () {
    DB::table('recent_users')->delete();
})->purpose('删除最近用户')->daily();
```

如果你需要向闭包命令传递参数，可以将它们提供给 `schedule` 方法：

```php
Artisan::command('emails:send {user} {--force}', function ($user) {
    // ...
})->purpose('向指定用户发送邮件')->schedule(['Taylor', '--force'])->daily();
```

<a name="scheduling-queued-jobs"></a>
### 调度队列作业

`job` 方法可用于调度[队列作业](/docs/{{version}}/queues)。此方法提供了一种便捷的方式来调度队列作业，而无需使用 `call` 方法来定义闭包以将作业加入队列：

```php
use App\Jobs\Heartbeat;
use Illuminate\Support\Facades\Schedule;

Schedule::job(new Heartbeat)->everyFiveMinutes();
```

可以向 `job` 方法提供可选的第二和第三个参数，用于指定队列名称和应用于作业的队列连接：

```php
use App\Jobs\Heartbeat;
use Illuminate\Support\Facades\Schedule;

// 将作业分派到 "sqs" 连接的 "heartbeats" 队列...
Schedule::job(new Heartbeat, 'heartbeats', 'sqs')->everyFiveMinutes();
```

<a name="scheduling-shell-commands"></a>
### 调度 Shell 命令

`exec` 方法可用于向操作系统发出命令：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::exec('node /home/forge/script.js')->daily();
```

<a name="schedule-frequency-options"></a>
### 调度频率选项

我们已经看到了一些如何配置任务以指定间隔运行的示例。但是，还有更多任务调度频率可以分配给任务：

<div class="overflow-auto">

| 方法 | 描述 |
| --- | --- |
| `->cron('* * * * *');` | 按自定义 cron 调度运行任务。 |
| `->everySecond();` | 每秒运行任务。 |
| `->everyTwoSeconds();` | 每两秒运行任务。 |
| `->everyFiveSeconds();` | 每五秒运行任务。 |
| `->everyTenSeconds();` | 每十秒运行任务。 |
| `->everyFifteenSeconds();` | 每十五秒运行任务。 |
| `->everyTwentySeconds();` | 每二十秒运行任务。 |
| `->everyThirtySeconds();` | 每三十秒运行任务。 |
| `->everyMinute();` | 每分钟运行任务。 |
| `->everyTwoMinutes();` | 每两分钟运行任务。 |
| `->everyThreeMinutes();` | 每三分钟运行任务。 |
| `->everyFourMinutes();` | 每四分钟运行任务。 |
| `->everyFiveMinutes();` | 每五分钟运行任务。 |
| `->everyTenMinutes();` | 每十分钟运行任务。 |
| `->everyFifteenMinutes();` | 每十五分钟运行任务。 |
| `->everyThirtyMinutes();` | 每三十分钟运行任务。 |
| `->hourly();` | 每小时运行任务。 |
| `->hourlyAt(17);` | 每小时在 17 分时运行任务。 |
| `->everyOddHour($minutes = 0);` | 每隔一小时运行任务。 |
| `->everyTwoHours($minutes = 0);` | 每两小时运行任务。 |
| `->everyThreeHours($minutes = 0);` | 每三小时运行任务。 |
| `->everyFourHours($minutes = 0);` | 每四小时运行任务。 |
| `->everySixHours($minutes = 0);` | 每六小时运行任务。 |
| `->daily();` | 每天午夜运行任务。 |
| `->dailyAt('13:00');` | 每天 13:00 运行任务。 |
| `->twiceDaily(1, 13);` | 每天在 1:00 和 13:00 运行任务。 |
| `->twiceDailyAt(1, 13, 15);` | 每天在 1:15 和 13:15 运行任务。 |
| `->daysOfMonth([1, 10, 20]);` | 在每月的特定日期运行任务。 |
| `->weekly();` | 每周日 00:00 运行任务。 |
| `->weeklyOn(1, '8:00');` | 每周一 8:00 运行任务。 |
| `->monthly();` | 每月第一天 00:00 运行任务。 |
| `->monthlyOn(4, '15:00');` | 每月第 4 天 15:00 运行任务。 |
| `->twiceMonthly(1, 16, '13:00');` | 每月 1 日和 16 日 13:00 运行任务。 |
| `->lastDayOfMonth('15:00');` | 每月最后一天 15:00 运行任务。 |
| `->quarterly();` | 每季度第一天 00:00 运行任务。 |
| `->quarterlyOn(4, '14:00');` | 每季度第 4 天 14:00 运行任务。 |
| `->yearly();` | 每年第一天 00:00 运行任务。 |
| `->yearlyOn(6, 1, '17:00');` | 每年 6 月 1 日 17:00 运行任务。 |
| `->timezone('America/New_York');` | 设置任务的时区。 |

</div>

这些方法可以与额外的约束条件结合使用，以创建仅在特定星期几运行的更精细的调度。例如，你可以安排一个命令在每周一运行：

```php
use Illuminate\Support\Facades\Schedule;

// 每周一 13:00 运行一次...
Schedule::call(function () {
    // ...
})->weekly()->mondays()->at('13:00');

// 工作日上午 8 点到下午 5 点每小时运行...
Schedule::command('foo')
    ->weekdays()
    ->hourly()
    ->timezone('America/Chicago')
    ->between('8:00', '17:00');
```

额外的调度约束列表可在下面找到：

<div class="overflow-auto">

| 方法 | 描述 |
| --- | --- |
| `->weekdays();` | 将任务限制为工作日。 |
| `->weekends();` | 将任务限制为周末。 |
| `->sundays();` | 将任务限制为周日。 |
| `->mondays();` | 将任务限制为周一。 |
| `->tuesdays();` | 将任务限制为周二。 |
| `->wednesdays();` | 将任务限制为周三。 |
| `->thursdays();` | 将任务限制为周四。 |
| `->fridays();` | 将任务限制为周五。 |
| `->saturdays();` | 将任务限制为周六。 |
| `->days(array\|mixed);` | 将任务限制为特定日期。 |
| `->between($startTime, $endTime);` | 将任务限制在开始和结束时间之间运行。 |
| `->unlessBetween($startTime, $endTime);` | 将任务限制不在开始和结束时间之间运行。 |
| `->when(Closure);` | 基于真值测试限制任务。 |
| `->environments($env);` | 将任务限制为特定环境。 |

</div>

<a name="day-constraints"></a>
#### 日期约束

`days` 方法可用于将任务的执行限制在特定的星期几。例如，你可以安排一个命令在周日和周三每小时运行：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('emails:send')
    ->hourly()
    ->days([0, 3]);
```

或者，在定义任务应运行的日期时，你可以使用 `Illuminate\Console\Scheduling\Schedule` 类上的常量：

```php
use Illuminate\Support\Facades;
use Illuminate\Console\Scheduling\Schedule;

Facades\Schedule::command('emails:send')
    ->hourly()
    ->days([Schedule::SUNDAY, Schedule::WEDNESDAY]);
```

<a name="between-time-constraints"></a>
#### 时间范围约束

`between` 方法可用于根据一天中的时间限制任务的执行：

```php
Schedule::command('emails:send')
    ->hourly()
    ->between('7:00', '22:00');
```

类似地，`unlessBetween` 方法可用于排除任务在一段时间内执行：

```php
Schedule::command('emails:send')
    ->hourly()
    ->unlessBetween('23:00', '4:00');
```

<a name="truth-test-constraints"></a>
#### 真值测试约束

`when` 方法可用于根据给定真值测试的结果限制任务的执行。换句话说，如果给定的闭包返回 `true`，并且没有其他约束条件阻止任务运行，则该任务将执行：

```php
Schedule::command('emails:send')->daily()->when(function () {
    return true;
});
```

`skip` 方法可以看作是 `when` 的逆操作。如果 `skip` 方法返回 `true`，计划任务将不会执行：

```php
Schedule::command('emails:send')->daily()->skip(function () {
    return true;
});
```

当使用链式 `when` 方法时，计划命令仅在所有 `when` 条件都返回 `true` 时才会执行。

<a name="environment-constraints"></a>
#### 环境约束

`environments` 方法可用于仅在给定环境（由 `APP_ENV` [环境变量](/docs/{{version}}/configuration#environment-configuration)定义）下执行任务：

```php
Schedule::command('emails:send')
    ->daily()
    ->environments(['staging', 'production']);
```

<a name="timezones"></a>
### 时区

使用 `timezone` 方法，你可以指定计划任务的时间应在某个时区内解释：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('report:generate')
    ->timezone('America/New_York')
    ->at('2:00')
```

如果你反复为所有计划任务分配相同的时区，可以通过在应用程序的 `app` 配置文件中定义一个 `schedule_timezone` 选项来指定应分配给所有调度的时区：

```php
'timezone' => 'UTC',

'schedule_timezone' => 'America/Chicago',
```

> [!WARNING]
> 请记住，某些时区使用夏令时。当日令时发生变化时，你的计划任务可能会运行两次或根本不运行。因此，我们建议尽可能避免使用时区调度。

<a name="preventing-task-overlaps"></a>
### 防止任务重叠

默认情况下，即使任务的先前实例仍在运行，计划任务也会运行。要防止这种情况，你可以使用 `withoutOverlapping` 方法：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('emails:send')->withoutOverlapping();
```

在此示例中，如果 `emails:send` [Artisan 命令](/docs/{{version}}/artisan)尚未运行，它将每分钟运行一次。`withoutOverlapping` 方法在你执行时间变化很大的任务时尤其有用，这使你无法准确预测给定任务需要多长时间。

如果需要，你可以指定在"不重叠"锁过期之前必须经过的分钟数。默认情况下，锁将在 24 小时后过期：

```php
Schedule::command('emails:send')->withoutOverlapping(10);
```

在底层，`withoutOverlapping` 方法利用应用程序的[缓存](/docs/{{version}}/cache)来获取锁。如有必要，你可以使用 `schedule:clear-cache` Artisan 命令清除这些缓存锁。这通常仅在任务因意外的服务器问题而卡住时才有必要。

<a name="running-tasks-on-one-server"></a>
### 在单台服务器上运行任务

> [!WARNING]
> 要使用此功能，你的应用程序必须使用 `database`、`memcached`、`dynamodb` 或 `redis` 缓存驱动作为应用程序的默认缓存驱动。此外，所有服务器必须与同一个中央缓存服务器通信。

如果你的应用程序的调度器在多台服务器上运行，你可以将计划作业限制为仅在一台服务器上执行。例如，假设你有一个计划任务，每周五晚生成一份新报告。如果任务调度器在三台工作服务器上运行，则计划任务将在所有三台服务器上运行并生成三份报告。这不好！

要指示该任务应仅在一台服务器上运行，请在定义计划任务时使用 `onOneServer` 方法。第一个获取该任务的服务器将获得作业的原子锁，以防止其他服务器同时运行同一任务：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('report:generate')
    ->fridays()
    ->at('17:00')
    ->onOneServer();
```

你可以使用 `useCache` 方法来自定义调度器用于获取单服务器任务原子锁的缓存存储：

```php
Schedule::useCache('database');
```

<a name="naming-unique-jobs"></a>
#### 命名单服务器作业

有时你可能需要使用不同参数调度同一作业，同时仍然指示 Laravel 在单台服务器上运行每个作业变体。为此，你可以通过 `name` 方法为每个调度定义分配一个唯一名称：

```php
Schedule::job(new CheckUptime('https://laravel.com'))
    ->name('check_uptime:laravel.com')
    ->everyFiveMinutes()
    ->onOneServer();

Schedule::job(new CheckUptime('https://vapor.laravel.com'))
    ->name('check_uptime:vapor.laravel.com')
    ->everyFiveMinutes()
    ->onOneServer();
```

类似地，如果计划闭包要在单台服务器上运行，则必须为其分配一个名称：

```php
Schedule::call(fn () => User::resetApiRequestCount())
    ->name('reset-api-request-count')
    ->daily()
    ->onOneServer();
```

<a name="background-tasks"></a>
### 后台任务

默认情况下，在同一时间调度的多个任务将按照它们在 `schedule` 方法中定义的顺序顺序执行。如果你有长时间运行的任务，这可能导致后续任务比预期晚很多才开始。如果你希望任务在后台运行以便它们可以同时运行，可以使用 `runInBackground` 方法：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('analytics:report')
    ->daily()
    ->runInBackground();
```

> [!WARNING]
> `runInBackground` 方法仅在通过 `command` 和 `exec` 方法调度任务时使用。

<a name="maintenance-mode"></a>
### 维护模式

当应用程序处于[维护模式](/docs/{{version}}/configuration#maintenance-mode)时，你的计划任务将不会运行，因为我们不希望你的任务干扰你可能正在服务器上执行的任何未完成的维护工作。但是，如果你希望强制任务即使在维护模式下也运行，可以在定义任务时调用 `evenInMaintenanceMode` 方法：

```php
Schedule::command('emails:send')->evenInMaintenanceMode();
```

<a name="pausing-scheduled-tasks"></a>
### 暂停计划任务

你可以使用 `schedule:pause` Artisan 命令临时暂停计划任务处理，而无需更改已部署的代码：

```shell
php artisan schedule:pause
```

当调度器暂停时，没有计划任务会运行。你可以使用 `schedule:continue` 命令恢复计划任务处理：

```shell
php artisan schedule:continue
```

如果某个任务在调度器暂停时仍然应该运行，你可以使用 `evenWhenPaused` 方法标记它：

```php
Schedule::command('emails:send')->evenWhenPaused();
```

<a name="schedule-groups"></a>
### 调度组

当定义多个具有相似配置的计划任务时，你可以使用 Laravel 的任务分组功能来避免为每个任务重复相同的设置。分组任务简化了你的代码，并确保了相关任务之间的一致性。

要创建一组计划任务，调用所需的配置方法，后跟 `group` 方法。`group` 方法接受一个闭包，该闭包负责定义共享指定配置的任务：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::daily()
    ->onOneServer()
    ->timezone('America/New_York')
    ->group(function () {
        Schedule::command('emails:send --force');
        Schedule::command('emails:prune');
    });
```

<a name="running-the-scheduler"></a>
## 运行调度器

现在我们已经学会了如何定义计划任务，让我们讨论如何在服务器上实际运行它们。`schedule:run` Artisan 命令将评估所有计划任务，并根据服务器的当前时间确定它们是否需要运行。

因此，使用 Laravel 的调度器时，我们只需要在服务器上添加一个每分钟运行 `schedule:run` 命令的 cron 配置项。如果你不知道如何向服务器添加 cron 条目，可以考虑使用托管平台，如 [Laravel Cloud](https://cloud.laravel.com)，它可以为你管理计划任务执行：

```shell
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

<a name="sub-minute-scheduled-tasks"></a>
### 亚分钟计划任务

在大多数操作系统上，cron 作业最多每分钟运行一次。但是，Laravel 的调度器允许你以更频繁的间隔调度任务，甚至每秒一次：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::call(function () {
    DB::table('recent_users')->delete();
})->everySecond();
```

当在应用程序中定义了亚分钟任务时，`schedule:run` 命令将继续运行到当前分钟结束，而不是立即退出。这允许该命令在整个分钟内调用所有必需的亚分钟任务。

由于耗时超出预期的亚分钟任务可能会延迟后续亚分钟任务的执行，建议所有亚分钟任务都分派队列作业或后台命令来处理实际的任务处理：

```php
use App\Jobs\DeleteRecentUsers;

Schedule::job(new DeleteRecentUsers)->everyTenSeconds();

Schedule::command('users:delete')->everyTenSeconds()->runInBackground();
```

<a name="interrupting-sub-minute-tasks"></a>
#### 中断亚分钟任务

由于定义了亚分钟任务时 `schedule:run` 命令会在调用的整个分钟内运行，因此在部署应用程序时有时可能需要中断该命令。否则，已运行的 `schedule:run` 命令实例将继续使用应用程序先前部署的代码，直到当前分钟结束。

要中断正在进行的 `schedule:run` 调用，你可以将 `schedule:interrupt` 命令添加到应用程序的部署脚本中。此命令应在应用程序部署完成后调用：

```shell
php artisan schedule:interrupt
```

<a name="running-the-scheduler-locally"></a>
### 在本地运行调度器

通常，你不会将调度器 cron 条目添加到本地开发机器。相反，你可以使用 `schedule:work` Artisan 命令。此命令将在前台运行，每分钟调用一次调度器，直到你终止该命令。当定义了亚分钟任务时，调度器将在每分钟内继续运行以处理这些任务：

```shell
php artisan schedule:work
```

<a name="task-output"></a>
## 任务输出

Laravel 调度器提供了几种便捷的方法来处理计划任务生成的输出。首先，使用 `sendOutputTo` 方法，你可以将输出发送到文件以供后续检查：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('emails:send')
    ->daily()
    ->sendOutputTo($filePath);
```

如果你希望将输出追加到给定文件，可以使用 `appendOutputTo` 方法：

```php
Schedule::command('emails:send')
    ->daily()
    ->appendOutputTo($filePath);
```

使用 `emailOutputTo` 方法，你可以将输出通过电子邮件发送到你选择的电子邮件地址。在通过电子邮件发送任务输出之前，你应该配置 Laravel 的[邮件服务](/docs/{{version}}/mail)：

```php
Schedule::command('report:generate')
    ->daily()
    ->sendOutputTo($filePath)
    ->emailOutputTo('taylor@example.com');
```

如果你只希望在计划 Artisan 或系统命令以非零退出代码终止时才通过电子邮件发送输出，请使用 `emailOutputOnFailure` 方法：

```php
Schedule::command('report:generate')
    ->daily()
    ->emailOutputOnFailure('taylor@example.com');
```

> [!WARNING]
> `emailOutputTo`、`emailOutputOnFailure`、`sendOutputTo` 和 `appendOutputTo` 方法仅适用于 `command` 和 `exec` 方法。

<a name="task-hooks"></a>
## 任务钩子

使用 `before` 和 `after` 方法，你可以指定在计划任务执行之前和之后要执行的代码：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('emails:send')
    ->daily()
    ->before(function () {
        // 任务即将执行...
    })
    ->after(function () {
        // 任务已执行...
    });
```

`onSuccess` 和 `onFailure` 方法允许你指定在计划任务成功或失败时执行的代码。失败表示计划 Artisan 或系统命令以非零退出代码终止：

```php
Schedule::command('emails:send')
    ->daily()
    ->onSuccess(function () {
        // 任务成功...
    })
    ->onFailure(function () {
        // 任务失败...
    });
```

如果命令有可用输出，你可以在 `after`、`onSuccess` 或 `onFailure` 钩子中通过类型提示一个 `Illuminate\Support\Stringable` 实例作为 `$output` 参数来访问它：

```php
use Illuminate\Support\Stringable;

Schedule::command('emails:send')
    ->daily()
    ->onSuccess(function (Stringable $output) {
        // 任务成功...
    })
    ->onFailure(function (Stringable $output) {
        // 任务失败...
    });
```

<a name="pinging-urls"></a>
#### Ping URL

使用 `pingBefore` 和 `thenPing` 方法，调度器可以在任务执行之前或之后自动 ping 一个给定的 URL。此方法对于通知外部服务（例如 [Envoyer](https://envoyer.io)）你的计划任务已开始或已完成执行非常有用：

```php
Schedule::command('emails:send')
    ->daily()
    ->pingBefore($url)
    ->thenPing($url);
```

`pingOnSuccess` 和 `pingOnFailure` 方法可用于仅在任务成功或失败时 ping 给定 URL。失败表示计划 Artisan 或系统命令以非零退出代码终止：

```php
Schedule::command('emails:send')
    ->daily()
    ->pingOnSuccess($successUrl)
    ->pingOnFailure($failureUrl);
```

`pingBeforeIf`、`thenPingIf`、`pingOnSuccessIf` 和 `pingOnFailureIf` 方法可用于仅在给定条件为 `true` 时 ping 给定 URL：

```php
Schedule::command('emails:send')
    ->daily()
    ->pingBeforeIf($condition, $url)
    ->thenPingIf($condition, $url);

Schedule::command('emails:send')
    ->daily()
    ->pingOnSuccessIf($condition, $successUrl)
    ->pingOnFailureIf($condition, $failureUrl);
```

<a name="events"></a>
## 事件

Laravel 在调度过程中分派多种[事件](/docs/{{version}}/events)。你可以为以下任何事件[定义监听器](/docs/{{version}}/events)：

<div class="overflow-auto">

| 事件名称 |
| --- |
| `Illuminate\Console\Events\ScheduledTaskStarting` |
| `Illuminate\Console\Events\ScheduledTaskFinished` |
| `Illuminate\Console\Events\ScheduledBackgroundTaskFinished` |
| `Illuminate\Console\Events\ScheduledTaskSkipped` |
| `Illuminate\Console\Events\ScheduledTaskFailed` |

</div>

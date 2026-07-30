import { defineConfig } from 'vitepress'

const zhTitles: Record<string, string> = {
  readme: "Laravel 文档", releases: "版本发布说明", upgrade: "升级指南",
  contributions: "贡献指南", installation: "安装", configuration: "配置",
  structure: "目录结构", deployment: "部署", "starter-kits": "入门套件",
  lifecycle: "请求生命周期", container: "服务容器", providers: "服务提供者",
  facades: "门面", contracts: "契约", routing: "路由", middleware: "中间件",
  csrf: "CSRF 保护", controllers: "控制器", requests: "HTTP 请求",
  responses: "HTTP 响应", views: "视图", blade: "Blade 模板",
  vite: "资源打包 (Vite)", mix: "Laravel Mix", frontend: "前端",
  artisan: "Artisan 控制台", broadcasting: "广播", cache: "缓存",
  collections: "集合", concurrency: "并发", context: "上下文",
  errors: "错误处理", events: "事件", filesystem: "文件存储",
  helpers: "辅助函数", "http-client": "HTTP 客户端", images: "图像处理",
  localization: "本地化", logging: "日志", mail: "邮件", mcp: "Laravel MCP",
  mocking: "模拟", notifications: "通知", packages: "包开发",
  pint: "Laravel Pint", processes: "进程", prompts: "Prompts（提示）", queues: "队列",
  "rate-limiting": "频率限制", redis: "Redis", scheduling: "任务调度",
  search: "搜索", session: "HTTP 会话", strings: "字符串",
  testing: "测试：入门指南", urls: "URL 生成", validation: "验证",
  authentication: "身份认证", authorization: "授权",
  encryption: "加密", hashing: "哈希", passwords: "重置密码",
  verification: "电子邮件验证", database: "数据库：入门",
  queries: "数据库：查询构建器", pagination: "数据库：分页",
  migrations: "数据库：迁移", seeding: "数据库：数据填充",
  eloquent: "Eloquent：入门指南", "eloquent-relationships": "Eloquent：关联关系",
  "eloquent-collections": "Eloquent：集合", "eloquent-mutators": "Eloquent：修改器 & 类型转换",
  "eloquent-resources": "Eloquent：API 资源", "eloquent-serialization": "Eloquent：序列化",
  "eloquent-factories": "Eloquent：工厂", "http-tests": "HTTP 测试",
  "console-tests": "控制台测试", "database-testing": "数据库测试",
  dusk: "Laravel Dusk", billing: "Laravel Cashier (Stripe)",
  "cashier-paddle": "Laravel Cashier (Paddle)", envoy: "Laravel Envoy",
  folio: "Laravel Folio", fortify: "Laravel Fortify", homestead: "Laravel Homestead",
  horizon: "Laravel Horizon", octane: "Laravel Octane", passport: "Laravel Passport",
  pennant: "Laravel Pennant", precognition: "Precognition（预认知）", pulse: "Laravel Pulse",
  sail: "Laravel Sail", sanctum: "Laravel Sanctum", scout: "Laravel Scout",
  socialite: "Laravel Socialite", telescope: "Laravel Telescope", valet: "Laravel Valet",
  reverb: "Laravel Reverb", boost: "Laravel Boost", ai: "AI 辅助开发",
  "ai-sdk": "Laravel AI SDK", mongodb: "MongoDB",
}

const sidebarCategories: [string, string[]][] = [
  ["序言", ["readme", "releases", "upgrade", "contributions"]],
  ["快速入门", ["installation", "configuration", "structure", "deployment", "starter-kits"]],
  ["架构概念", ["lifecycle", "container", "providers", "facades", "contracts"]],
  ["基础功能", ["routing", "middleware", "csrf", "controllers", "requests", "responses", "views", "blade", "vite", "mix", "frontend"]],
  ["进阶功能", ["artisan", "broadcasting", "cache", "collections", "concurrency", "context", "errors", "events", "filesystem", "helpers", "http-client", "images", "localization", "logging", "mail", "mcp", "mocking", "notifications", "packages", "pint", "processes", "prompts", "queues", "rate-limiting", "redis", "scheduling", "search", "session", "strings", "testing", "urls", "validation"]],
  ["安全", ["authentication", "authorization", "encryption", "hashing", "passwords", "verification"]],
  ["数据库", ["database", "queries", "pagination", "migrations", "seeding", "redis"]],
  ["Eloquent ORM", ["eloquent", "eloquent-relationships", "eloquent-collections", "eloquent-mutators", "eloquent-resources", "eloquent-serialization", "eloquent-factories"]],
  ["测试", ["testing", "http-tests", "console-tests", "database-testing", "dusk", "mocking"]],
  ["官方扩展包", ["billing", "cashier-paddle", "envoy", "folio", "fortify", "homestead", "horizon", "octane", "passport", "pennant", "pint", "precognition", "pulse", "sail", "sanctum", "scout", "socialite", "telescope", "valet", "reverb", "boost", "ai", "ai-sdk", "mix"]],
  ["MongoDB", ["mongodb"]],
]

export default defineConfig({
  srcDir: 'docs',
  title: 'Laravel文档',
  description: 'Laravel 中文文档中心',
  lang: 'zh-CN',
  ignoreDeadLinks: [/^\//, /^https?:\/\//, /^mailto:/],
  markdown: {
    container: {
      tipLabel: '提示',
      warningLabel: '警告',
      dangerLabel: '危险',
      infoLabel: '信息',
      detailsLabel: '详情',
    },
  },
  themeConfig: {
    nav: [],
    sidebar: sidebarCategories.map(([category, slugs]) => ({
      text: category,
      items: slugs.map((slug) => ({
        text: zhTitles[slug] || slug,
        link: `/${slug}`,
      })),
    })),
    socialLinks: [
      { icon: 'laravel', link: 'https://laravel.com' },
    ],
    docFooter: {
      prev: '上一页',
      next: '下一页',
    },
    outline: {
      label: '页面导航',
    },
  },
})

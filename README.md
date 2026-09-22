# Affiliate GEO Marketplace

基于 Payload CMS、Next.js 和 Cloudflare Workers 的地区化 Affiliate 产品站。生产环境使用 Cloudflare D1 保存内容、R2 保存媒体，OpenNext 将 Next.js 与 Payload Admin/API 部署到 Worker。

## 已实现

- Payload Admin、REST API、GraphQL API
- 产品、分类、地区、内容更新、媒体和站点设置模型
- D1 数据库与 R2 媒体绑定
- 产品列表和地区化产品详情页
- 根据 `CF-IPCountry` 选择商品实际支持的地区，并提供安全回退
- Lexical 富文本、地区价格、结构化数据和 Affiliate 标记
- 动态 sitemap、robots、404、隐私政策和 Affiliate Disclosure
- 幂等种子脚本和一次性每日内容更新处理
- GitHub Actions 类型检查、定时更新与部署流程
- DeepSeek 每日文章生成、质量门槛、幂等发布及生产验证报告

## 本地开发

要求 Node.js 20.9 或更高版本。

```powershell
npm install
Copy-Item .env.example .env
```

在 `.env` 中设置至少 32 位随机 `PAYLOAD_SECRET`，然后执行：

```powershell
npm run payload -- migrate
npm run seed
npm run dev
```

访问：

- 前台：`http://localhost:3000`
- 后台：`http://localhost:3000/admin`

第一次访问后台时创建管理员账号。

## 验证命令

```powershell
npm run generate:types
npm run lint
npm run typecheck
npm run build
npm run build:cloudflare
npm run daily:update
```

Worker 预览与烟雾测试：

```powershell
Copy-Item .dev.vars.example .dev.vars
npm run preview
# 在另一个终端执行
npm run smoke
```

OpenNext 在 Windows 下会显示兼容性提示；GitHub Actions 使用 Ubuntu，不受该提示影响。

## Cloudflare 上线前配置

1. 创建 D1 数据库 `affiliate-geo-site`。
2. 创建 R2 Bucket `affiliate-geo-site-media`。
3. 将 [wrangler.jsonc](./wrangler.jsonc) 中的 `REPLACE_WITH_D1_DATABASE_ID` 替换为真实 D1 ID。
4. 使用 `npx wrangler secret put PAYLOAD_SECRET` 设置生产密钥。
5. 在 GitHub `production` Environment 中配置：
   - Secret：`PAYLOAD_SECRET`
   - Secret：`AUTOMATION_SECRET`
   - Secret：`DEEPSEEK_API_KEY`
   - Secret：`CLOUDFLARE_API_TOKEN`
   - Secret：`CLOUDFLARE_ACCOUNT_ID`
   - Variable：`NEXT_PUBLIC_SITE_URL`
6. 部署前生成并提交数据库迁移：

```powershell
npm run payload -- migrate:create
npm run deploy
```

`npm run deploy` 会修改远程数据库并发布 Worker，请只在确认 Cloudflare 配置后执行。

推送到 `main` 后，[deploy.yml](./.github/workflows/deploy.yml) 会自动执行类型检查、数据库迁移和 Worker 部署。

## DeepSeek 每日自动发文

[daily-publish.yml](./.github/workflows/daily-publish.yml) 每天 UTC 19:17（北京时间次日 03:17）运行，位于 DeepSeek 空闲计价时段：

1. 从生产 API 获取活动商品和近期文章。
2. 访问产品销售官网或供应商支持页，并将可验证资料与市场记录组成证据包。
3. 使用 `deepseek-flash`（当前对应 DeepSeek-V4.1-Flash）及 JSON Output 同时生成一篇英文文章和结构化产品资料。
4. 检查文章长度、章节、FAQ、重复内容、夸大宣传用语，以及产品摘要、功能、适用人群和限制的结构完整性。
5. 只有文章质量分不低于 85 且产品官网证据可用时，才通过带密钥的 Worker API 更新产品并写入生产 D1。
6. 再从生产 API 查询当天记录，要求恰好发布一篇。
7. 上传生成报告和 D1 验证报告，保留 30 天。

同一日期和商品使用唯一 `automationKey`，重复运行只会返回已有文章。自动文章默认 `indexable=true`、`monetizable=false`、`reviewStatus=autoPublished`。

## 内容更新

在 Admin 的 `Content Updates` 中创建记录，设置发布时间、关联产品并勾选发布。每日工作流只处理 `processedAt` 为空且已到发布时间的记录；成功后写入 `processedAt`，不会重复执行。

## 上线前人工检查

- 将 Privacy 页面中的联系方式替换为真实可监控邮箱
- 确认每个 Affiliate URL、价格和佣金披露准确
- 确认 Cloudflare Worker Paid 计划及 D1/R2 配额满足需求
- 使用真实域名检查 sitemap、robots、Admin 登录和媒体上传

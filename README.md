# Affiliate GEO Site

Payload CMS + Next.js 14 静态导出 + Cloudflare Pages 部署的 Affiliate Marketplace 网站。

## 特性

- 每个 Affiliate Product 独立推广页（`/products/{slug}/{region}`）
- 大量 GEO 匹配：基于访问者国家自动路由到最优地区页面
- SEO 优化：sitemap、robots、Open Graph、Twitter Cards、Schema.org、hreflang
- 每日自动内容更新（GitHub Actions + Cloudflare Pages）
- 静态导出，部署在 Cloudflare Pages 全球边缘网络

## 项目结构

```
payloadcms/
├── payload.config.ts
├── next.config.js
├── package.json
├── .cloudflare/pages.toml
├── .github/workflows/daily-deploy.yml
├── src/
│   ├── collections/
│   │   ├── Products.ts
│   │   ├── Categories.ts
│   │   ├── GeoRegions.ts
│   │   ├── ContentUpdates.ts
│   │   ├── Media.ts
│   │   └── Global.ts
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── sitemap.ts
│   │   ├── robots.ts
│   │   └── products/
│   │       ├── [slug]/page.tsx
│   │       └── [slug]/[region]/page.tsx
│   └── components/
├── functions/
│   └── _middleware.ts
└── scripts/
    ├── generate-static-pages.ts
    ├── daily-update.ts
    └── seed.ts
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，设置 `PAYLOAD_SECRET`。

### 3. 本地开发

```bash
npm run dev
```

访问 http://localhost:3000/admin 打开 Payload Admin。

### 4. 初始化数据

```bash
npx tsx scripts/seed.ts
```

### 5. 构建 & 预览

```bash
npm run deploy
npm run preview
```

## 部署到 Cloudflare Pages

### 前置要求

- GitHub 仓库
- Cloudflare 账号

### 步骤

1. **推送到 GitHub**
```bash
git init
git remote add origin https://github.com/YOUR_USERNAME/affiliate-geo-site.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

2. **创建 Cloudflare Pages 项目**
   - 连接 GitHub 仓库
   - Build command: `npm run deploy`
   - Output directory: `dist`
   - Node version: `20`
   - 添加环境变量：`PAYLOAD_SECRET`

3. **配置 GitHub Secrets**
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `PAYLOAD_SECRET`

4. **自定义域名**
   在 Cloudflare Pages → Custom domains 添加你的域名。

## 自动化

- **每日构建**：GitHub Actions 每天 UTC 00:00 自动构建并部署
- **内容更新**：在 ContentUpdates 中发布内容后，次日自动生效
- **GEO 路由**：Cloudflare Pages Functions 自动检测访问者国家并重定向

## 脚本

- `npm run generate:static` - 为所有产品×地区生成静态 HTML
- `npm run daily:update` - 执行每日内容更新
- `npm run seed` - 初始化示例数据

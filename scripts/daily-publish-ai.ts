import fs from 'fs/promises'
import path from 'path'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { researchProduct, type ResearchBundle } from './research-product'

type GeneratedArticle = {
  title: string
  excerpt: string
  sections: Array<{ heading: string; paragraphs: string[]; bullets?: string[] }>
  faq: Array<{ question: string; answer: string }>
}

type ProductEnrichment = {
  summary: string
  overview: string[]
  features: Array<{ title: string; description: string }>
  idealFor: string[]
  limitations: string[]
}

type GeneratedContent = { article: GeneratedArticle; product: ProductEnrichment }

type QualityResult = { score: number; errors: string[]; notes: string[]; wordCount: number }

const promptVersion = 'affiliate-editor-v3-evidence'
const reportPath = path.resolve('artifacts/daily-publish-report.json')
// Official API identifier for the current DeepSeek-V4.1-Flash release.
const model = process.env.DEEPSEEK_MODEL || 'deepseek-flash'
const language = process.env.AI_ARTICLE_LANGUAGE || 'en'

function slugify(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 90)
}

function textNode(text: string) {
  return { type: 'text', version: 1, text, detail: 0, format: 0, mode: 'normal', style: '' }
}

function productEnrichmentData(product: ProductEnrichment) {
  const capabilityText = product.features.map((feature) => `${feature.title}: ${feature.description}`).join(' - ')
  const description = `${product.overview.join(' ')} --- Key capabilities - ${capabilityText} --- Who this product is for - ${product.idealFor.join(' - ')} --- What to verify before buying - ${product.limitations.join(' - ')}`
  return {
    shortDescription: product.summary,
    description: { root: { type: 'root', version: 1, direction: 'ltr' as const, format: '' as const, indent: 0, children: [{ type: 'paragraph', version: 1, direction: 'ltr' as const, format: '' as const, indent: 0, children: [textNode(description)] }] } },
    features: product.features,
    lastUpdated: new Date().toISOString(),
  }
}

function richText(article: GeneratedArticle, research: ResearchBundle) {
  const children: Record<string, unknown>[] = []
  for (const section of article.sections) {
    children.push({ type: 'heading', version: 1, tag: 'h2', direction: 'ltr', format: '', indent: 0, children: [textNode(section.heading)] })
    for (const paragraph of section.paragraphs) children.push({ type: 'paragraph', version: 1, direction: 'ltr', format: '', indent: 0, children: [textNode(paragraph)] })
    if (section.bullets?.length) children.push({ type: 'list', version: 1, listType: 'bullet', start: 1, tag: 'ul', direction: 'ltr', format: '', indent: 0, children: section.bullets.map((bullet, index) => ({ type: 'listitem', version: 1, value: index + 1, direction: 'ltr', format: '', indent: 0, children: [{ type: 'paragraph', version: 1, direction: 'ltr', format: '', indent: 0, children: [textNode(bullet)] }] })) })
  }
  children.push({ type: 'heading', version: 1, tag: 'h2', direction: 'ltr', format: '', indent: 0, children: [textNode('Frequently asked questions')] })
  for (const item of article.faq) {
    children.push({ type: 'heading', version: 1, tag: 'h3', direction: 'ltr', format: '', indent: 0, children: [textNode(item.question)] })
    children.push({ type: 'paragraph', version: 1, direction: 'ltr', format: '', indent: 0, children: [textNode(item.answer)] })
  }
  children.push({ type: 'heading', version: 1, tag: 'h2', direction: 'ltr', format: '', indent: 0, children: [textNode('Sources and verification')] })
  children.push({ type: 'list', version: 1, listType: 'bullet', start: 1, tag: 'ul', direction: 'ltr', format: '', indent: 0, children: research.sources.map((source, index) => ({ type: 'listitem', version: 1, value: index + 1, direction: 'ltr', format: '', indent: 0, children: [{ type: 'paragraph', version: 1, direction: 'ltr', format: '', indent: 0, children: [textNode(`[${source.id}] ${source.title} — ${source.url}`)] }] })) })
  children.push({ type: 'paragraph', version: 1, direction: 'ltr', format: '', indent: 0, children: [textNode('Disclosure: This article may contain affiliate links. We may earn a commission at no additional cost to you. Verify current pricing and terms on the provider’s official website.')] })
  return { root: { type: 'root', version: 1, direction: 'ltr', format: '', indent: 0, children } }
}

function allText(article: GeneratedArticle) {
  return [article.title, article.excerpt, ...article.sections.flatMap((section) => [section.heading, ...section.paragraphs, ...(section.bullets || [])]), ...article.faq.flatMap((item) => [item.question, item.answer])].join(' ')
}

function assertGeneratedArticle(value: unknown): GeneratedArticle {
  if (!value || typeof value !== 'object') throw new Error('DeepSeek JSON is not an object')
  const article = value as Partial<GeneratedArticle>
  if (typeof article.title !== 'string' || typeof article.excerpt !== 'string' || !Array.isArray(article.sections) || !Array.isArray(article.faq)) throw new Error('DeepSeek JSON is missing required article fields')
  if (article.sections.some((section) => !section || typeof section.heading !== 'string' || !Array.isArray(section.paragraphs) || section.paragraphs.some((paragraph) => typeof paragraph !== 'string') || (section.bullets !== undefined && (!Array.isArray(section.bullets) || section.bullets.some((bullet) => typeof bullet !== 'string'))))) throw new Error('DeepSeek JSON contains an invalid section')
  if (article.faq.some((item) => !item || typeof item.question !== 'string' || typeof item.answer !== 'string')) throw new Error('DeepSeek JSON contains an invalid FAQ entry')
  return article as GeneratedArticle
}

function assertGeneratedContent(value: unknown): GeneratedContent {
  if (!value || typeof value !== 'object') throw new Error('DeepSeek JSON is not an object')
  const content = value as Partial<GeneratedContent>
  const article = assertGeneratedArticle(content.article)
  const product = content.product
  if (!product || typeof product.summary !== 'string' || !Array.isArray(product.overview) || !Array.isArray(product.features) || !Array.isArray(product.idealFor) || !Array.isArray(product.limitations)) throw new Error('DeepSeek JSON is missing product enrichment fields')
  if (product.summary.length < 80 || product.summary.length > 160) throw new Error('Product summary must be 80-160 characters')
  if (product.overview.length < 2 || product.overview.length > 4 || product.overview.some((item) => typeof item !== 'string' || item.length < 80 || item.length > 700)) throw new Error('Product overview must contain 2-4 supported paragraphs')
  if (product.features.length < 4 || product.features.length > 8 || product.features.some((item) => !item || typeof item.title !== 'string' || typeof item.description !== 'string' || item.title.length > 90 || item.description.length < 40 || item.description.length > 400)) throw new Error('Product features must contain 4-8 supported items')
  if (product.idealFor.length < 2 || product.idealFor.length > 6 || product.idealFor.some((item) => typeof item !== 'string' || item.length < 20 || item.length > 240)) throw new Error('Product audience must contain 2-6 supported items')
  if (product.limitations.length < 2 || product.limitations.length > 6 || product.limitations.some((item) => typeof item !== 'string' || item.length < 20 || item.length > 240)) throw new Error('Product limitations must contain 2-6 supported items')
  return { article, product }
}

function titleSimilarity(left: string, right: string) {
  const a = new Set(left.toLowerCase().split(/\W+/).filter((word) => word.length > 2))
  const b = new Set(right.toLowerCase().split(/\W+/).filter((word) => word.length > 2))
  const intersection = [...a].filter((word) => b.has(word)).length
  const union = new Set([...a, ...b]).size
  return union ? intersection / union : 0
}

function validateArticle(article: GeneratedArticle, recentTitles: string[], research: ResearchBundle): QualityResult {
  const errors: string[] = []
  const notes: string[] = []
  const text = allText(article)
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  if (article.title.length < 35 || article.title.length > 90) errors.push('title length must be 35-90 characters')
  if (/\bjson\b/i.test(article.title) || /\bjson\b/i.test(article.excerpt)) errors.push('public title and excerpt must not mention JSON')
  if (article.excerpt.length < 100 || article.excerpt.length > 240) errors.push('excerpt length must be 100-240 characters')
  if (article.sections.length < 4) errors.push('at least four sections are required')
  if (article.sections.some((section) => section.paragraphs.length < 2)) errors.push('every section needs at least two paragraphs')
  if (article.faq.length < 3) errors.push('at least three FAQ entries are required')
  if (!article.sections.some((section) => /compar|alternative|versus|\bvs\b|对比|比较|替代|vergleich/i.test(section.heading))) errors.push('a balanced comparison or alternatives section is required')
  const citedIds = new Set([...text.matchAll(/\[(S\d+)\]/g)].map((match) => match[1]))
  const allowedIds = new Set(research.sources.map((source) => source.id))
  if (citedIds.size < Math.min(2, research.sources.length)) errors.push('at least two evidence sources must be cited')
  for (const id of citedIds) if (!allowedIds.has(id)) errors.push(`unknown evidence citation ${id}`)
  const paragraphs = article.sections.flatMap((section) => section.paragraphs).map((paragraph) => paragraph.toLowerCase().replace(/\s+/g, ' ').trim())
  if (new Set(paragraphs).size !== paragraphs.length) errors.push('duplicate paragraphs are not allowed')
  if (wordCount < 700 || wordCount > 1800) errors.push(`word count ${wordCount} is outside 700-1800`)
  const banned = [/guaranteed/gi, /risk[- ]free/gi, /the best (?:product|choice|deal)/gi, /you will (?:earn|save|profit)/gi, /limited time/gi]
  for (const pattern of banned) if (pattern.test(text)) errors.push(`prohibited claim matched ${pattern.source}`)
  if (recentTitles.some((title) => titleSimilarity(article.title, title) >= 0.65)) errors.push('title is too similar to a recent article')
  if (!/official|provider/i.test(text)) notes.push('article should remind readers to verify provider terms')
  const score = Math.max(0, 100 - errors.length * 20 - notes.length * 5)
  return { score, errors, notes, wordCount }
}

async function requestDeepSeek(product: Record<string, unknown>, research: ResearchBundle, recentTitles: string[], feedback: string[]) {
  if (process.env.AI_TEST_MODE === '1') {
    const base = 'Readers should compare the documented product scope with their own requirements, existing tools, budget, technical experience, and support expectations before making a decision. Current pricing, availability, regional terms, integrations, and feature limits can change, so every important detail should be checked on the official provider website. A careful evaluation should also include alternatives, operational effort, migration needs, and the practical value of each feature rather than relying on promotional language alone.'
    const sections = ['Understanding the product scope', 'Evaluating features and limitations', 'Comparison and alternatives', 'Making a careful purchase decision'].map((heading, index) => ({ heading, paragraphs: [`Section ${index + 1} begins with the main decision factors [S1]. ${base} ${base}`, `A second perspective for section ${index + 1} focuses on verification and tradeoffs [S2]. ${base} ${base}`], bullets: ['Confirm current terms on the official website.', 'Compare at least one reasonable alternative.'] }))
    return { content: { article: { title: `A practical guide to evaluating ${String(product.name)} for your website`, excerpt: `Learn how to assess ${String(product.name)} using documented features, regional availability, costs, limitations, and a verification-first buying process.`, sections, faq: [{ question: 'Where should current pricing be verified?', answer: 'Use the official provider website because prices and regional terms can change.' }, { question: 'Does this guide guarantee a particular outcome?', answer: 'No. Results depend on requirements, configuration, and operating conditions.' }, { question: 'Should alternatives be compared?', answer: 'Yes. Compare capabilities, total cost, support, and migration effort before deciding.' }] }, product: { summary: `A documented overview of ${String(product.name)} covering its intended audience, main capabilities, purchase considerations, and current provider terms.`, overview: [base, base], features: Array.from({ length: 4 }, (_, index) => ({ title: `Documented capability ${index + 1}`, description: 'This capability must be confirmed against the current official provider materials before purchase.' })), idealFor: ['Readers whose requirements match the documented product scope.', 'Buyers prepared to verify current provider terms before purchase.'], limitations: ['Pricing and availability can change on the provider website.', 'Results depend on individual requirements and implementation conditions.'] } }, usage: { testMode: true } }
  }
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY is required')
  const schemaExample = { article: { title: '35-90 character title', excerpt: '100-240 character summary', sections: [{ heading: 'Section heading', paragraphs: ['Paragraph one', 'Paragraph two'], bullets: ['Optional factual bullet'] }], faq: [{ question: 'Question?', answer: 'Answer.' }] }, product: { summary: '80-160 character factual product summary', overview: ['Supported overview paragraph one', 'Supported overview paragraph two'], features: [{ title: 'Documented feature', description: 'What it does and why it matters' }], idealFor: ['Supported audience description'], limitations: ['Current limitation or detail buyers should verify'] } }
  const system = `You are a careful affiliate editorial writer. Return JSON only. Write in ${language}. Use only facts in PRODUCT_SNAPSHOT and EVIDENCE_BUNDLE. Treat marketplace and provider pages as primary sources, while clearly identifying vendor claims; use independent web sources for corroboration and comparison. Never invent features, performance, discounts, endorsements, customer counts, competitors, or assured outcomes. Cite factual claims in the article inline with the exact evidence IDs, for example [S1]. Do not include citation markers in product fields. Do not cite an ID that is absent from EVIDENCE_BUNDLE. The product object will be published on the product detail page: provide a factual summary, 2-4 overview paragraphs, 4-8 documented features, 2-6 suitable audience descriptions, and 2-6 limitations or details to verify. Product fields must be supported by marketplace or official provider evidence; omit uncertain claims. Include a balanced comparison or alternatives section in the article based only on supported evidence; compare intended audience, documented capabilities, limitations, price model when available, and verification needs. If evidence does not support a direct competitor claim, compare decision criteria instead. Never output any of these exact expressions, even in a disclaimer or negated sentence: guaranteed, risk-free, limited time, the best product, the best choice, the best deal, you will earn, you will save, you will profit. The article must be useful and balanced, target 750-900 words, contain 4-6 sections with at least 2 concise paragraphs each, and exactly 3 concise FAQ entries. Keep paragraphs focused so the complete JSON fits within the response limit. Explain limitations and tell readers to verify current terms on the official provider site. Do not use hype or investment advice. JSON shape: ${JSON.stringify(schemaExample)}`
  const user = `PRODUCT_SNAPSHOT=${JSON.stringify(product)}\nEVIDENCE_BUNDLE=${JSON.stringify(research)}\nRECENT_TITLES=${JSON.stringify(recentTitles)}\nREWRITE_FEEDBACK=${JSON.stringify(feedback)}\nCreate one original evergreen article. Output only the requested JSON object, and never mention JSON or internal formatting instructions in public-facing fields.`
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], response_format: { type: 'json_object' }, max_tokens: 12_000, temperature: 0.4, stream: false }),
    signal: AbortSignal.timeout(120_000),
  })
  if (!response.ok) throw new Error(`DeepSeek HTTP ${response.status}: ${(await response.text()).slice(0, 500)}`)
  const data = await response.json() as { choices?: Array<{ finish_reason?: string; message?: { content?: string | null } }>; usage?: unknown }
  const choice = data.choices?.[0]
  if (!choice?.message?.content) throw new Error('DeepSeek returned empty content')
  if (choice.finish_reason === 'length') throw new Error('DeepSeek response was truncated')
  return { content: assertGeneratedContent(JSON.parse(choice.message.content)), usage: data.usage }
}

async function writeReport(report: Record<string, unknown>) {
  await fs.mkdir(path.dirname(reportPath), { recursive: true })
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
}

async function fetchAutomation(url: string | URL, init: RequestInit, label: string) {
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    const response = await fetch(url, init)
    if (response.ok || ![429, 500, 502, 503, 504].includes(response.status) || attempt === 8) return response
    console.warn(JSON.stringify({ event: 'automation-api-retry', label, attempt, status: response.status }))
    await new Promise((resolve) => setTimeout(resolve, Math.min(1_000 * 2 ** attempt, 30_000)))
  }
  throw new Error(`${label} request exhausted retries`)
}

function productSnapshot(product: Record<string, any>) {
  return {
    id: product.id, name: product.name, slug: product.slug, shortDescription: product.shortDescription,
    vendorName: product.vendorName, salesPageUrl: product.salesPageUrl, affiliateSupportPageUrl: product.affiliateSupportPageUrl,
    pricing: product.pricing, features: product.features?.map((feature: any) => ({ title: feature.title, description: feature.description })),
    regions: product.geoRegions?.map((region: any) => typeof region === 'object' ? { code: region.code, name: region.name, currency: region.currency } : region),
    affiliateURL: product.affiliateUrl, sourceData: product.sourceData,
  }
}

async function findResearchableProduct(products: Array<Record<string, any>>, startIndex: number) {
  const failures: string[] = []
  const attempts = Math.min(products.length, 6)
  for (let offset = 0; offset < attempts; offset += 1) {
    const product = products[(startIndex + offset) % products.length]
    const snapshot = productSnapshot(product)
    const research = await researchProduct(snapshot)
    if (research.sources.length >= 2 && research.sources.some((source) => source.kind === 'sales-page' || source.kind === 'affiliate-support')) {
      console.log(JSON.stringify({ event: 'product-research-selected', productId: product.id, offset, sources: research.sources.length, warnings: research.warnings.length }))
      return { product, snapshot, research }
    }
    const reason = research.warnings.join('; ') || 'no retrievable product or independent pages'
    failures.push(`${String(product.id)}: ${reason}`)
    console.warn(JSON.stringify({ event: 'product-research-skipped', productId: product.id, offset, reason }))
  }
  throw new Error(`Insufficient product evidence after ${attempts} candidates: ${failures.join(' | ')}`)
}

async function runRemote() {
  const baseURL = process.env.PUBLISH_API_URL?.replace(/\/$/, '')
  const automationSecret = process.env.AUTOMATION_SECRET
  if (!baseURL || !automationSecret) throw new Error('PUBLISH_API_URL and AUTOMATION_SECRET are required for remote publishing')
  const automationHeaders = {
    'accept': 'application/json',
    'user-agent': 'Mozilla/5.0 (compatible; AffiliateGeoPublisher/1.0)',
    'x-automation-secret': automationSecret,
  }
  const startedAt = new Date()
  const date = startedAt.toISOString().slice(0, 10)
  const contextResponse = await fetchAutomation(new URL('/automation/context', baseURL), {
    headers: automationHeaders,
  }, 'context')
  if (!contextResponse.ok) throw new Error(`Automation context API returned ${contextResponse.status}`)
  const context = await contextResponse.json() as {
    products: Array<Record<string, any>>
    articles: Array<{ id: string | number; slug: string; automationKey?: string; title: string; aiGenerated?: boolean; publishedAt?: string }>
  }
  if (!context.products.length) throw new Error('No active products are available for article generation')
  const publishedToday = context.articles.find((article) => article.aiGenerated === true && article.publishedAt?.startsWith(date))
  if (publishedToday) {
    await writeReport({ status: 'skipped', reason: 'daily-cap-reached', date, articleId: publishedToday.id, slug: publishedToday.slug })
    console.log(JSON.stringify({ event: 'daily-publish-skipped', reason: 'daily-cap-reached', articleId: publishedToday.id }))
    return
  }
  const dayIndex = Math.floor(startedAt.getTime() / 86_400_000) % context.products.length
  const { product, snapshot, research } = await findResearchableProduct(context.products, dayIndex)
  const automationKey = `${date}:${product.id}`
  const existing = context.articles.find((article) => article.automationKey === automationKey)
  if (existing) {
    await writeReport({ status: 'skipped', reason: 'already-published', date, automationKey, articleId: existing.id, slug: existing.slug })
    console.log(JSON.stringify({ event: 'daily-publish-skipped', automationKey, articleId: existing.id }))
    return
  }
  const recentTitles = context.articles.map((article) => article.title)
  let feedback: string[] = []
  let lastQuality: QualityResult | undefined
  let lastError: string | undefined
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const result = await requestDeepSeek(snapshot, research, recentTitles, feedback)
      const article = result.content.article
      const productEnrichment = result.content.product
      lastQuality = validateArticle(article, recentTitles, research)
      if (lastQuality.errors.length || lastQuality.score < 85) {
        feedback = lastQuality.errors
        continue
      }
      const slug = `${slugify(article.title) || `article-${date}`}-${date}`
      const publishResponse = await fetchAutomation(`${baseURL}/automation/publish`, {
        method: 'POST', headers: { ...automationHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: article.title, slug, excerpt: article.excerpt, content: richText(article, research), productId: product.id, productEnrichment, categoryId: typeof product.category === 'object' ? product.category.id : product.category, automationKey, model, promptVersion, qualityScore: lastQuality.score, qualityNotes: [...lastQuality.notes, ...research.warnings], sourceSnapshot: { product: snapshot, research }, publishedAt: startedAt.toISOString() }),
        signal: AbortSignal.timeout(60_000),
      }, 'publish')
      const published = await publishResponse.json() as { status?: string; article?: Record<string, any>; error?: string }
      if (!publishResponse.ok) throw new Error(`Publish API ${publishResponse.status}: ${published.error || 'unknown error'}`)
      const report = { status: published.status, date, automationKey, articleId: published.article?.id, slug: published.article?.slug || slug, title: article.title, model, attempt, quality: lastQuality, usage: result.usage, publishedAt: published.article?.publishedAt }
      await writeReport(report)
      console.log(JSON.stringify({ event: 'daily-publish-complete', ...report }))
      return
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
      feedback = [`Previous generation failed schema, API, or publishing validation: ${lastError}`]
    }
  }
  await writeReport({ status: 'failed', date, automationKey, model, quality: lastQuality, reason: lastError || 'quality-gate-rejected' })
  throw new Error(`Remote article rejected after three attempts: ${lastQuality?.errors.join('; ') || lastError}`)
}

async function run() {
  if (process.env.PUBLISH_API_URL) {
    await runRemote()
    process.exit(0)
  }
  const startedAt = new Date()
  const date = startedAt.toISOString().slice(0, 10)
  const payload = await getPayload({ config })
  const products = await payload.find({
    collection: 'products',
    where: { status: { equals: 'active' } },
    limit: 100,
    depth: 1,
    sort: 'slug',
    select: { name: true, slug: true, shortDescription: true, pricing: true, features: true, geoRegions: true, affiliateUrl: true, salesPageUrl: true, affiliateSupportPageUrl: true, vendorName: true, sourceData: true, category: true },
  })
  if (!products.docs.length) throw new Error('No active products are available for article generation')
  const dayIndex = Math.floor(startedAt.getTime() / 86_400_000) % products.docs.length
  const { product, snapshot, research } = await findResearchableProduct(products.docs as Array<Record<string, any>>, dayIndex)
  const automationKey = `${date}:${product.id}`
  const existing = await payload.find({ collection: 'articles', where: { automationKey: { equals: automationKey } }, limit: 1 })
  if (existing.docs[0]) {
    await writeReport({ status: 'skipped', reason: 'already-published', date, automationKey, articleId: existing.docs[0].id, slug: existing.docs[0].slug })
    console.log(JSON.stringify({ event: 'daily-publish-skipped', automationKey, articleId: existing.docs[0].id }))
    process.exit(0)
  }

  const recent = await payload.find({ collection: 'articles', where: { status: { equals: 'published' } }, limit: 30, sort: '-publishedAt' })
  const recentTitles = recent.docs.map((article) => article.title)
  let feedback: string[] = []
  let lastQuality: QualityResult | undefined
  let usage: unknown
  let lastError: string | undefined
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    let result: Awaited<ReturnType<typeof requestDeepSeek>>
    try {
      result = await requestDeepSeek(snapshot, research, recentTitles, feedback)
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
      feedback = [`Previous generation failed schema or API validation: ${lastError}`]
      continue
    }
    usage = result.usage
    const article = result.content.article
    const productEnrichment = result.content.product
    lastQuality = validateArticle(article, recentTitles, research)
    if (!lastQuality.errors.length && lastQuality.score >= 85) {
      const baseSlug = slugify(article.title) || `article-${date}`
      const slug = `${baseSlug}-${date}`
      const created = await payload.create({ collection: 'articles', data: {
        title: article.title, slug, excerpt: article.excerpt, content: richText(article, research) as never,
        relatedProduct: product.id, category: typeof product.category === 'object' ? product.category.id : product.category,
        status: 'published', publishedAt: startedAt.toISOString(), automationKey, aiGenerated: true, aiModel: model,
        promptVersion, qualityScore: lastQuality.score, qualityNotes: lastQuality.notes.map((note) => ({ note })),
        sourceSnapshot: { product: snapshot, research }, indexable: true, monetizable: false, reviewStatus: 'autoPublished',
      } })
      await payload.update({ collection: 'products', id: product.id, data: productEnrichmentData(productEnrichment), overrideAccess: true })
      const report = { status: 'published', date, automationKey, articleId: created.id, slug, title: article.title, model, attempt, quality: lastQuality, usage, publishedAt: created.publishedAt }
      await writeReport(report)
      console.log(JSON.stringify({ event: 'daily-publish-complete', ...report }))
      process.exit(0)
    }
    feedback = lastQuality.errors
  }
  const report = { status: 'failed', date, automationKey, model, quality: lastQuality, reason: lastError || 'quality-gate-rejected' }
  await writeReport(report)
  throw new Error(`Article rejected after three attempts: ${lastQuality?.errors.join('; ') || lastError}`)
}

run().catch(async (error) => {
  const message = error instanceof Error ? error.message : String(error)
  await writeReport({ status: 'failed', date: new Date().toISOString().slice(0, 10), reason: message }).catch(() => undefined)
  console.error(JSON.stringify({ event: 'daily-publish-failed', error: message }))
  process.exit(1)
})

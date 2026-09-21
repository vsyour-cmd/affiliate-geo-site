import fs from 'fs/promises'
import path from 'path'
import { getPayload } from 'payload'
import config from '../src/payload.config'

type GeneratedArticle = {
  title: string
  excerpt: string
  sections: Array<{ heading: string; paragraphs: string[]; bullets?: string[] }>
  faq: Array<{ question: string; answer: string }>
}

type QualityResult = { score: number; errors: string[]; notes: string[]; wordCount: number }

const promptVersion = 'affiliate-editor-v1'
const reportPath = path.resolve('artifacts/daily-publish-report.json')
const model = process.env.DEEPSEEK_MODEL || 'deepseek-flash'
const language = process.env.AI_ARTICLE_LANGUAGE || 'en'

function slugify(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 90)
}

function textNode(text: string) {
  return { type: 'text', version: 1, text, detail: 0, format: 0, mode: 'normal', style: '' }
}

function richText(article: GeneratedArticle) {
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

function titleSimilarity(left: string, right: string) {
  const a = new Set(left.toLowerCase().split(/\W+/).filter((word) => word.length > 2))
  const b = new Set(right.toLowerCase().split(/\W+/).filter((word) => word.length > 2))
  const intersection = [...a].filter((word) => b.has(word)).length
  const union = new Set([...a, ...b]).size
  return union ? intersection / union : 0
}

function validateArticle(article: GeneratedArticle, recentTitles: string[]): QualityResult {
  const errors: string[] = []
  const notes: string[] = []
  const text = allText(article)
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  if (article.title.length < 35 || article.title.length > 90) errors.push('title length must be 35-90 characters')
  if (article.excerpt.length < 100 || article.excerpt.length > 240) errors.push('excerpt length must be 100-240 characters')
  if (article.sections.length < 4) errors.push('at least four sections are required')
  if (article.sections.some((section) => section.paragraphs.length < 2)) errors.push('every section needs at least two paragraphs')
  if (article.faq.length < 3) errors.push('at least three FAQ entries are required')
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

async function requestDeepSeek(product: Record<string, unknown>, recentTitles: string[], feedback: string[]) {
  if (process.env.AI_TEST_MODE === '1') {
    const base = 'Readers should compare the documented product scope with their own requirements, existing tools, budget, technical experience, and support expectations before making a decision. Current pricing, availability, regional terms, integrations, and feature limits can change, so every important detail should be checked on the official provider website. A careful evaluation should also include alternatives, operational effort, migration needs, and the practical value of each feature rather than relying on promotional language alone.'
    const sections = ['Understanding the product scope', 'Evaluating features and limitations', 'Comparing cost and operational fit', 'Making a careful purchase decision'].map((heading, index) => ({ heading, paragraphs: [`Section ${index + 1} begins with the main decision factors. ${base} ${base}`, `A second perspective for section ${index + 1} focuses on verification and tradeoffs. ${base} ${base}`], bullets: ['Confirm current terms on the official website.', 'Compare at least one reasonable alternative.'] }))
    return { article: { title: `A practical guide to evaluating ${String(product.name)} for your website`, excerpt: `Learn how to assess ${String(product.name)} using documented features, regional availability, costs, limitations, and a verification-first buying process.`, sections, faq: [{ question: 'Where should current pricing be verified?', answer: 'Use the official provider website because prices and regional terms can change.' }, { question: 'Does this guide guarantee a particular outcome?', answer: 'No. Results depend on requirements, configuration, and operating conditions.' }, { question: 'Should alternatives be compared?', answer: 'Yes. Compare capabilities, total cost, support, and migration effort before deciding.' }] }, usage: { testMode: true } }
  }
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY is required')
  const schemaExample = { title: '35-90 character title', excerpt: '100-240 character summary', sections: [{ heading: 'Section heading', paragraphs: ['Paragraph one', 'Paragraph two'], bullets: ['Optional factual bullet'] }], faq: [{ question: 'Question?', answer: 'Answer.' }] }
  const system = `You are a careful affiliate editorial writer. Return JSON only. Write in ${language}. Use only facts in PRODUCT_SNAPSHOT; never invent performance, discounts, endorsements, customer counts, or guarantees. The article must be useful and balanced, 700-1800 words, contain at least 4 sections with at least 2 paragraphs each, and at least 3 FAQ entries. Explain limitations and tell readers to verify current terms on the official provider site. Do not use hype or investment advice. JSON shape: ${JSON.stringify(schemaExample)}`
  const user = `PRODUCT_SNAPSHOT=${JSON.stringify(product)}\nRECENT_TITLES=${JSON.stringify(recentTitles)}\nREWRITE_FEEDBACK=${JSON.stringify(feedback)}\nCreate one original evergreen article. Include the word JSON in your response instructions and output only the JSON object.`
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], response_format: { type: 'json_object' }, max_tokens: 5000, temperature: 0.5, stream: false }),
    signal: AbortSignal.timeout(120_000),
  })
  if (!response.ok) throw new Error(`DeepSeek HTTP ${response.status}: ${(await response.text()).slice(0, 500)}`)
  const data = await response.json() as { choices?: Array<{ finish_reason?: string; message?: { content?: string | null } }>; usage?: unknown }
  const choice = data.choices?.[0]
  if (!choice?.message?.content) throw new Error('DeepSeek returned empty content')
  if (choice.finish_reason === 'length') throw new Error('DeepSeek response was truncated')
  return { article: assertGeneratedArticle(JSON.parse(choice.message.content)), usage: data.usage }
}

async function writeReport(report: Record<string, unknown>) {
  await fs.mkdir(path.dirname(reportPath), { recursive: true })
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
}

async function runRemote() {
  const baseURL = process.env.PUBLISH_API_URL?.replace(/\/$/, '')
  const automationSecret = process.env.AUTOMATION_SECRET
  if (!baseURL || !automationSecret) throw new Error('PUBLISH_API_URL and AUTOMATION_SECRET are required for remote publishing')
  const startedAt = new Date()
  const date = startedAt.toISOString().slice(0, 10)
  const productsURL = new URL('/api/products', baseURL)
  productsURL.searchParams.set('where[status][equals]', 'active')
  productsURL.searchParams.set('limit', '100')
  productsURL.searchParams.set('depth', '2')
  productsURL.searchParams.set('sort', 'slug')
  const productResponse = await fetch(productsURL)
  if (!productResponse.ok) throw new Error(`Products API returned ${productResponse.status}`)
  const productData = await productResponse.json() as { docs: Array<Record<string, any>> }
  if (!productData.docs.length) throw new Error('No active products are available for article generation')
  const product = productData.docs[Math.floor(startedAt.getTime() / 86_400_000) % productData.docs.length]
  const automationKey = `${date}:${product.id}`
  const existingURL = new URL('/api/articles', baseURL)
  existingURL.searchParams.set('where[automationKey][equals]', automationKey)
  existingURL.searchParams.set('limit', '1')
  const existingResponse = await fetch(existingURL)
  if (!existingResponse.ok) throw new Error(`Articles API returned ${existingResponse.status}`)
  const existingData = await existingResponse.json() as { docs: Array<Record<string, any>> }
  if (existingData.docs[0]) {
    const existing = existingData.docs[0]
    await writeReport({ status: 'skipped', reason: 'already-published', date, automationKey, articleId: existing.id, slug: existing.slug })
    console.log(JSON.stringify({ event: 'daily-publish-skipped', automationKey, articleId: existing.id }))
    return
  }
  const recentURL = new URL('/api/articles', baseURL)
  recentURL.searchParams.set('where[status][equals]', 'published')
  recentURL.searchParams.set('limit', '30')
  recentURL.searchParams.set('sort', '-publishedAt')
  const recentResponse = await fetch(recentURL)
  if (!recentResponse.ok) throw new Error(`Recent articles API returned ${recentResponse.status}`)
  const recentData = await recentResponse.json() as { docs: Array<{ title: string }> }
  const recentTitles = recentData.docs.map((article) => article.title)
  const snapshot = {
    id: product.id, name: product.name, slug: product.slug, shortDescription: product.shortDescription,
    pricing: product.pricing, features: product.features?.map((feature: any) => ({ title: feature.title, description: feature.description })),
    regions: product.geoRegions?.map((region: any) => typeof region === 'object' ? { code: region.code, name: region.name, currency: region.currency } : region),
    affiliateURL: product.affiliateUrl,
  }
  let feedback: string[] = []
  let lastQuality: QualityResult | undefined
  let lastError: string | undefined
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const result = await requestDeepSeek(snapshot, recentTitles, feedback)
      const article = assertGeneratedArticle(result.article)
      lastQuality = validateArticle(article, recentTitles)
      if (lastQuality.errors.length || lastQuality.score < 85) {
        feedback = lastQuality.errors
        continue
      }
      const slug = `${slugify(article.title) || `article-${date}`}-${date}`
      const publishResponse = await fetch(`${baseURL}/api/automation/publish`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-automation-secret': automationSecret },
        body: JSON.stringify({ title: article.title, slug, excerpt: article.excerpt, content: richText(article), productId: product.id, categoryId: typeof product.category === 'object' ? product.category.id : product.category, automationKey, model, promptVersion, qualityScore: lastQuality.score, qualityNotes: lastQuality.notes, sourceSnapshot: snapshot, publishedAt: startedAt.toISOString() }),
        signal: AbortSignal.timeout(60_000),
      })
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
  const products = await payload.find({ collection: 'products', where: { status: { equals: 'active' } }, limit: 100, depth: 2, sort: 'slug' })
  if (!products.docs.length) throw new Error('No active products are available for article generation')
  const dayIndex = Math.floor(startedAt.getTime() / 86_400_000) % products.docs.length
  const product = products.docs[dayIndex]
  const automationKey = `${date}:${product.id}`
  const existing = await payload.find({ collection: 'articles', where: { automationKey: { equals: automationKey } }, limit: 1 })
  if (existing.docs[0]) {
    await writeReport({ status: 'skipped', reason: 'already-published', date, automationKey, articleId: existing.docs[0].id, slug: existing.docs[0].slug })
    console.log(JSON.stringify({ event: 'daily-publish-skipped', automationKey, articleId: existing.docs[0].id }))
    process.exit(0)
  }

  const recent = await payload.find({ collection: 'articles', where: { status: { equals: 'published' } }, limit: 30, sort: '-publishedAt' })
  const recentTitles = recent.docs.map((article) => article.title)
  const snapshot = {
    id: product.id, name: product.name, slug: product.slug, shortDescription: product.shortDescription,
    pricing: product.pricing, features: product.features?.map((feature) => ({ title: feature.title, description: feature.description })),
    regions: product.geoRegions?.map((region) => typeof region === 'object' ? { code: region.code, name: region.name, currency: region.currency } : region),
    affiliateURL: product.affiliateUrl,
  }
  let feedback: string[] = []
  let lastQuality: QualityResult | undefined
  let usage: unknown
  let lastError: string | undefined
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    let result: Awaited<ReturnType<typeof requestDeepSeek>>
    try {
      result = await requestDeepSeek(snapshot, recentTitles, feedback)
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
      feedback = [`Previous generation failed schema or API validation: ${lastError}`]
      continue
    }
    usage = result.usage
    const article = assertGeneratedArticle(result.article)
    lastQuality = validateArticle(article, recentTitles)
    if (!lastQuality.errors.length && lastQuality.score >= 85) {
      const baseSlug = slugify(article.title) || `article-${date}`
      const slug = `${baseSlug}-${date}`
      const created = await payload.create({ collection: 'articles', data: {
        title: article.title, slug, excerpt: article.excerpt, content: richText(article) as never,
        relatedProduct: product.id, category: typeof product.category === 'object' ? product.category.id : product.category,
        status: 'published', publishedAt: startedAt.toISOString(), automationKey, aiGenerated: true, aiModel: model,
        promptVersion, qualityScore: lastQuality.score, qualityNotes: lastQuality.notes.map((note) => ({ note })),
        sourceSnapshot: snapshot, indexable: true, monetizable: false, reviewStatus: 'autoPublished',
      } })
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

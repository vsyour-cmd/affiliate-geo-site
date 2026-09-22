import fs from 'fs/promises'
import path from 'path'
import { researchProduct } from './research-product'

type ProductEnrichment = {
  summary: string
  overview: string[]
  features: Array<{ title: string; description: string }>
  idealFor: string[]
  limitations: string[]
}

const baseURL = process.env.PUBLISH_API_URL?.replace(/\/$/, '') || ''
const secret = process.env.AUTOMATION_SECRET || ''
const model = process.env.DEEPSEEK_MODEL || 'deepseek-flash'
const batchSize = Math.min(10, Math.max(1, Number.parseInt(process.env.PRODUCT_ENRICHMENT_BATCH_SIZE || '5', 10) || 5))
const reportPath = path.resolve('artifacts/product-enrichment-report.json')
const headers = { accept: 'application/json', 'user-agent': 'Mozilla/5.0 (compatible; AffiliateGeoPublisher/1.0)', 'x-automation-secret': secret }

function normalize(value: unknown): ProductEnrichment {
  if (!value || typeof value !== 'object') throw new Error('product enrichment is not an object')
  const item = value as Partial<ProductEnrichment>
  const clean = (text: string) => text.replace(/\s*\[S\d+\]/gi, '').replace(/\s+/g, ' ').trim()
  const summary = typeof item.summary === 'string' ? clean(item.summary).slice(0, 160) : ''
  const overview = Array.isArray(item.overview) ? item.overview.filter((text): text is string => typeof text === 'string').map(clean).filter((text) => text.length >= 40).slice(0, 4) : []
  const features = Array.isArray(item.features) ? item.features.flatMap((feature) => feature && typeof feature.title === 'string' && typeof feature.description === 'string' ? [{ title: clean(feature.title).slice(0, 90), description: clean(feature.description).slice(0, 400) }] : []).filter((feature) => feature.title.length >= 3 && feature.description.length >= 20).slice(0, 8) : []
  const idealFor = Array.isArray(item.idealFor) ? item.idealFor.filter((text): text is string => typeof text === 'string').map(clean).filter((text) => text.length >= 10).slice(0, 6) : []
  const limitations = Array.isArray(item.limitations) ? item.limitations.filter((text): text is string => typeof text === 'string').map(clean).filter((text) => text.length >= 10).slice(0, 6) : []
  if (summary.length < 50) throw new Error(`summary too short (${summary.length})`)
  if (overview.length < 2) throw new Error(`not enough overview paragraphs (${overview.length})`)
  if (features.length < 4) throw new Error(`not enough usable features (${features.length})`)
  if (idealFor.length < 2) throw new Error(`not enough audience items (${idealFor.length})`)
  if (limitations.length < 2) throw new Error(`not enough limitation items (${limitations.length})`)
  return { summary, overview, features, idealFor, limitations }
}

async function generate(product: Record<string, unknown>, evidence: Awaited<ReturnType<typeof researchProduct>>) {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY is required')
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'Return JSON only. Create factual product-page content using only the supplied marketplace and official-provider evidence. Never invent capabilities, results, discounts, guarantees, endorsements, or customer counts. Clearly frame vendor claims. Do not include citation markers such as [S1] in product fields. Produce summary (80-160 characters), overview (2-4 paragraphs), features (4-8 title/description objects), idealFor (2-6 items), and limitations (2-6 items). Each feature description must be 40-400 characters.' },
        { role: 'user', content: `PRODUCT=${JSON.stringify(product)}\nEVIDENCE=${JSON.stringify(evidence)}` },
      ],
      response_format: { type: 'json_object' }, thinking: { type: 'disabled' }, max_tokens: 3_500, temperature: 0.3, stream: false,
    }),
    signal: AbortSignal.timeout(90_000),
  })
  if (!response.ok) throw new Error(`DeepSeek HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`)
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }>; usage?: unknown }
  const raw = data.choices?.[0]?.message?.content
  if (!raw) throw new Error('DeepSeek returned empty product enrichment')
  const enrichment = normalize(JSON.parse(raw) as unknown)
  return { enrichment, usage: data.usage }
}

async function run() {
  if (!baseURL || !secret) throw new Error('PUBLISH_API_URL and AUTOMATION_SECRET are required')
  const contextResponse = await fetch(`${baseURL}/automation/context`, { headers, signal: AbortSignal.timeout(60_000) })
  if (!contextResponse.ok) throw new Error(`Automation context returned ${contextResponse.status}`)
  const context = await contextResponse.json() as { products: Array<Record<string, unknown>> }
  const candidates = context.products.filter((product) => !Array.isArray(product.features) || product.features.length === 0)
  const enriched: Array<Record<string, unknown>> = []
  const failures: Array<Record<string, unknown>> = []
  for (const product of candidates.slice(0, Math.max(batchSize * 5, 20))) {
    if (enriched.length >= batchSize) break
    try {
      const evidence = await researchProduct(product)
      if (!evidence.sources.some((source) => source.kind === 'sales-page' || source.kind === 'affiliate-support')) throw new Error('no retrievable official provider page')
      const generated = await generate(product, evidence)
      const response = await fetch(`${baseURL}/automation/enrich-product`, { method: 'POST', headers: { ...headers, 'content-type': 'application/json' }, body: JSON.stringify({ productId: product.id, product: generated.enrichment }), signal: AbortSignal.timeout(60_000) })
      const result = await response.json() as { status?: string; product?: Record<string, unknown>; error?: string }
      if (!response.ok) throw new Error(`Enrichment API ${response.status}: ${result.error || 'unknown error'}`)
      enriched.push({ ...result.product, sources: evidence.sources.length, usage: generated.usage })
      console.log(JSON.stringify({ event: 'product-enrichment-complete', ...result.product, sources: evidence.sources.length }))
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      failures.push({ productId: product.id, reason })
      console.warn(JSON.stringify({ event: 'product-enrichment-skipped', productId: product.id, reason }))
    }
  }
  const report = { status: enriched.length ? 'complete' : 'failed', requested: batchSize, enriched, failures, completedAt: new Date().toISOString() }
  await fs.mkdir(path.dirname(reportPath), { recursive: true })
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  if (!enriched.length) throw new Error(`No products enriched after ${failures.length} candidates`)
}

run().catch((error) => { console.error(JSON.stringify({ event: 'product-enrichment-failed', error: error instanceof Error ? error.message : String(error) })); process.exit(1) })

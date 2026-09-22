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

function valid(value: unknown): value is ProductEnrichment {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<ProductEnrichment>
  return typeof item.summary === 'string' && item.summary.length >= 80 && item.summary.length <= 160
    && Array.isArray(item.overview) && item.overview.length >= 2 && item.overview.length <= 4 && item.overview.every((text) => typeof text === 'string' && text.length >= 80 && text.length <= 700)
    && Array.isArray(item.features) && item.features.length >= 4 && item.features.length <= 8 && item.features.every((feature) => feature && typeof feature.title === 'string' && feature.title.length <= 90 && typeof feature.description === 'string' && feature.description.length >= 40 && feature.description.length <= 400)
    && Array.isArray(item.idealFor) && item.idealFor.length >= 2 && item.idealFor.length <= 6
    && Array.isArray(item.limitations) && item.limitations.length >= 2 && item.limitations.length <= 6
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
  const enrichment = JSON.parse(raw) as unknown
  if (!valid(enrichment)) throw new Error('DeepSeek returned invalid product enrichment structure')
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

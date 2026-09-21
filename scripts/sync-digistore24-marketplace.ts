import fs from 'fs/promises'
import path from 'path'

type Offer = Record<string, unknown> & { id: string; productId: number; label: string }
type Page = { result?: { count?: number; currency?: string; items?: Offer[] } }
const endpoint = 'https://www.digistore24-app.com/v2/api/marketplace/results'
const affiliateId = process.env.DIGISTORE24_AFFILIATE_ID || 'adminstore'
const baseURL = (process.env.PUBLISH_API_URL || '').replace(/\/$/, '')
const secret = process.env.AUTOMATION_SECRET || ''
const reportPath = path.resolve('artifacts/digistore24-catalog-report.json')

function pageURL(page: number) {
  const url = new URL(endpoint)
  for (const [key, value] of Object.entries({ query: '', page: String(page), itemsPerPage: '100', sort: 'stars', currency: 'EUR', vendor: '' })) url.searchParams.set(key, value)
  return url
}

async function fetchPage(page: number) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(pageURL(page), { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(30_000) })
    if (response.ok) {
      const payload = await response.json() as Page
      if (!Array.isArray(payload.result?.items) || !Number.isInteger(payload.result?.count)) throw new Error(`Invalid Marketplace page ${page}`)
      return { count: Number(payload.result?.count), currency: String(payload.result?.currency || 'EUR'), items: payload.result.items }
    }
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 4) throw new Error(`Marketplace page ${page} returned ${response.status}`)
    await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt))
  }
  throw new Error(`Marketplace page ${page} failed`)
}

async function run() {
  if (!/^[A-Za-z0-9_-]{1,127}$/.test(affiliateId)) throw new Error('Invalid DIGISTORE24_AFFILIATE_ID')
  const fetchedAt = new Date().toISOString()
  const first = await fetchPage(1)
  const pages = Math.ceil(first.count / 100)
  let offers = [...first.items]
  const observedCounts = [first.count]
  for (let start = 2; start <= pages; start += 3) {
    const batch = await Promise.all(Array.from({ length: Math.min(3, pages - start + 1) }, (_, index) => fetchPage(start + index)))
    for (const page of batch) {
      observedCounts.push(page.count)
      offers.push(...page.items)
    }
  }
  const minimumCount = Math.min(...observedCounts)
  const maximumCount = Math.max(...observedCounts)
  if (maximumCount - minimumCount > 10) throw new Error(`Marketplace count drifted too far during pagination: ${minimumCount}-${maximumCount}`)
  offers = [...new Map(offers.map((offer) => [String(offer.id), offer])).values()]
  const unique = new Set(offers.map((offer) => String(offer.id)))
  if (unique.size < minimumCount - 10) throw new Error(`Incomplete catalog: observed ${minimumCount}-${maximumCount}, got ${unique.size} unique`)
  if (process.env.CATALOG_DRY_RUN === '1') {
    const report = { status: 'dry-run', fetchedAt, catalogScope: 'global-marketplace', observedCountRange: [minimumCount, maximumCount], fetchedCount: offers.length, uniqueCount: unique.size, withPromoLink: offers.length, affiliateId }
    await fs.mkdir(path.dirname(reportPath), { recursive: true })
    await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
    console.log(JSON.stringify({ event: 'catalog-sync-dry-run', ...report }))
    return
  }
  if (!baseURL || !secret) throw new Error('PUBLISH_API_URL and AUTOMATION_SECRET are required')
  const startOffset = Number.parseInt(process.env.CATALOG_START_OFFSET || '0', 10)
  if (!Number.isInteger(startOffset) || startOffset < 0 || startOffset >= offers.length) throw new Error('CATALOG_START_OFFSET is invalid')
  let created = 0
  let updated = 0
  let unchanged = 0
  for (let offset = startOffset; offset < offers.length; offset += 1) {
    const items = offers.slice(offset, offset + 1).map((offer) => ({ ...offer, currency: String(offer.currency || first.currency), imageUrl: offer.imageUrl ? new URL(String(offer.imageUrl), endpoint).toString() : undefined, promoLink: `https://www.digistore24.com/redir/${Number(offer.productId)}/${affiliateId}/` }))
    let result: { created?: number; updated?: number; unchanged?: number; error?: string } | undefined
    for (let attempt = 1; attempt <= 8; attempt += 1) {
      const response = await fetch(`${baseURL}/automation/catalog-sync`, { method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0 (compatible; AffiliateGeoPublisher/1.0)', 'x-automation-secret': secret }, body: JSON.stringify({ offers: items, fetchedAt }), signal: AbortSignal.timeout(120_000) })
      const responseText = await response.text()
      try { result = JSON.parse(responseText) as typeof result } catch { result = { error: responseText.slice(0, 240).replace(/\s+/g, ' ') } }
      if (response.ok) break
      if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 8) throw new Error(`Catalog batch ${offset}-${offset + items.length}: HTTP ${response.status} ${result?.error || ''}`)
      console.warn(JSON.stringify({ event: 'catalog-batch-retry', offset, attempt, status: response.status }))
      await new Promise((resolve) => setTimeout(resolve, Math.min(1_000 * 2 ** attempt, 30_000)))
    }
    if (!result) throw new Error(`Catalog batch ${offset}-${offset + items.length} returned no result`)
    created += result.created || 0
    updated += result.updated || 0
    unchanged += result.unchanged || 0
    console.log(JSON.stringify({ event: 'catalog-batch', processed: offset + items.length, total: offers.length, created, updated, unchanged }))
  }
  const report = { status: 'complete', fetchedAt, catalogScope: 'global-marketplace', observedCountRange: [minimumCount, maximumCount], fetchedCount: offers.length, uniqueCount: unique.size, withPromoLink: offers.length, affiliateId, created, updated, unchanged }
  await fs.mkdir(path.dirname(reportPath), { recursive: true })
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  console.log(JSON.stringify({ event: 'catalog-sync-complete', ...report }))
}

run().catch(async (error) => {
  const report = { status: 'failed', error: error instanceof Error ? error.message : String(error), failedAt: new Date().toISOString() }
  await fs.mkdir(path.dirname(reportPath), { recursive: true })
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  console.error(JSON.stringify({ event: 'catalog-sync-failed', ...report }))
  process.exit(1)
})

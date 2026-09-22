import { isIP } from 'node:net'

export type ResearchSource = {
  id: string
  title: string
  url: string
  kind: 'marketplace' | 'sales-page' | 'affiliate-support' | 'independent-web'
  excerpt: string
  fetchedAt: string
}

export type ResearchBundle = {
  query: string
  sources: ResearchSource[]
  warnings: string[]
}

type SearchResult = { title: string; url: string; description: string }

const MAX_PAGE_BYTES = 600_000
const MAX_EXCERPT_CHARS = 9_000

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
}

function htmlToText(html: string) {
  return decodeEntities(html)
    .replace(/<(script|style|noscript|svg|template)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[^]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function pageTitle(html: string, fallback: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return (match ? htmlToText(match[1]) : fallback).slice(0, 180)
}

function isPrivateIPv4(host: string) {
  const parts = host.split('.').map(Number)
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false
  return parts[0] === 10 || parts[0] === 127 || parts[0] === 0 || (parts[0] === 169 && parts[1] === 254) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168)
}

function assertPublicURL(raw: string) {
  const url = new URL(raw)
  if (url.protocol !== 'https:') throw new Error('only HTTPS sources are allowed')
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (!host || host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) throw new Error('local hosts are not allowed')
  if (isPrivateIPv4(host) || (isIP(host) === 6 && (host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80:')))) throw new Error('private IP addresses are not allowed')
  return url
}

async function readLimited(response: Response) {
  if (!response.body) return ''
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_PAGE_BYTES) {
      await reader.cancel()
      break
    }
    chunks.push(value)
  }
  const merged = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0))
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder().decode(merged)
}

async function fetchPage(rawURL: string) {
  let url = assertPublicURL(rawURL)
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    const response = await fetch(url, {
      redirect: 'manual',
      headers: { accept: 'text/html,text/plain;q=0.9', 'user-agent': 'AffiliateResearchBot/1.0 (+https://store.2bkf.com)' },
      signal: AbortSignal.timeout(15_000),
    })
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location')
      if (!location || redirects === 3) throw new Error('redirect limit exceeded')
      url = assertPublicURL(new URL(location, url).toString())
      continue
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const contentType = response.headers.get('content-type') || ''
    if (!/text\/(html|plain)|application\/xhtml\+xml/i.test(contentType)) throw new Error(`unsupported content type ${contentType || 'unknown'}`)
    const html = await readLimited(response)
    const excerpt = htmlToText(html).slice(0, MAX_EXCERPT_CHARS)
    if (excerpt.length < 160) throw new Error('page did not contain enough readable text')
    return { title: pageTitle(html, url.hostname), url: url.toString(), excerpt }
  }
  throw new Error('unable to fetch page')
}

async function braveSearch(query: string): Promise<SearchResult[]> {
  const token = process.env.BRAVE_SEARCH_API_KEY
  if (!token) return []
  const url = new URL('https://api.search.brave.com/res/v1/web/search')
  url.searchParams.set('q', query)
  url.searchParams.set('count', '6')
  url.searchParams.set('safesearch', 'moderate')
  const response = await fetch(url, { headers: { accept: 'application/json', 'x-subscription-token': token }, signal: AbortSignal.timeout(15_000) })
  if (!response.ok) throw new Error(`Brave Search HTTP ${response.status}`)
  const data = await response.json() as { web?: { results?: Array<{ title?: string; url?: string; description?: string }> } }
  return (data.web?.results || []).flatMap((item) => item.title && item.url ? [{ title: htmlToText(item.title), url: item.url, description: htmlToText(item.description || '') }] : [])
}

async function duckDuckGoSearch(query: string): Promise<SearchResult[]> {
  const url = new URL('https://html.duckduckgo.com/html/')
  url.searchParams.set('q', query)
  const response = await fetch(url, { headers: { accept: 'text/html', 'user-agent': 'Mozilla/5.0 (compatible; AffiliateResearchBot/1.0)' }, signal: AbortSignal.timeout(15_000) })
  if (!response.ok) throw new Error(`DuckDuckGo HTTP ${response.status}`)
  const html = await readLimited(response)
  const results: SearchResult[] = []
  const pattern = /<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?(?:class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>|class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/div>)/gi
  for (const match of html.matchAll(pattern)) {
    let resultURL = decodeEntities(match[1])
    try {
      const parsed = new URL(resultURL, 'https://html.duckduckgo.com')
      resultURL = parsed.searchParams.get('uddg') || parsed.toString()
      assertPublicURL(resultURL)
      results.push({ title: htmlToText(match[2]), url: resultURL, description: htmlToText(match[3] || match[4] || '') })
    } catch { /* Ignore malformed or non-public results. */ }
    if (results.length >= 6) break
  }
  return results
}

async function bingSearch(query: string): Promise<SearchResult[]> {
  const url = new URL('https://www.bing.com/search')
  url.searchParams.set('q', query)
  url.searchParams.set('count', '6')
  const response = await fetch(url, { headers: { accept: 'text/html', 'user-agent': 'Mozilla/5.0 (compatible; AffiliateResearchBot/1.0)' }, signal: AbortSignal.timeout(15_000) })
  if (!response.ok) throw new Error(`Bing HTTP ${response.status}`)
  const html = await readLimited(response)
  const results: SearchResult[] = []
  const pattern = /<li[^>]+class="[^"]*b_algo[^"]*"[^>]*>[\s\S]*?<h2[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?(?:<p[^>]*>([\s\S]*?)<\/p>)?/gi
  for (const match of html.matchAll(pattern)) {
    try {
      const resultURL = decodeEntities(match[1])
      assertPublicURL(resultURL)
      results.push({ title: htmlToText(match[2]), url: resultURL, description: htmlToText(match[3] || '') })
    } catch { /* Ignore malformed or non-public results. */ }
    if (results.length >= 6) break
  }
  return results
}

function marketplaceExcerpt(product: Record<string, unknown>) {
  const sourceData = product.sourceData && typeof product.sourceData === 'object' ? product.sourceData : {}
  return JSON.stringify({
    name: product.name,
    vendorName: product.vendorName,
    shortDescription: product.shortDescription,
    pricing: product.pricing,
    features: product.features,
    regions: product.regions,
    marketplaceData: sourceData,
  }).slice(0, MAX_EXCERPT_CHARS)
}

export async function researchProduct(product: Record<string, unknown>): Promise<ResearchBundle> {
  const warnings: string[] = []
  const sources: ResearchSource[] = []
  const fetchedAt = new Date().toISOString()
  const marketplace = marketplaceExcerpt(product)
  if (marketplace.length >= 160) sources.push({ id: '', title: `${String(product.name)} — Digistore24 Marketplace record`, url: 'https://www.digistore24-app.com/app/en/affiliate/account/marketplace/all', kind: 'marketplace', excerpt: marketplace, fetchedAt })

  const officialCandidates = [
    { value: product.salesPageUrl, kind: 'sales-page' as const },
    { value: product.affiliateSupportPageUrl, kind: 'affiliate-support' as const },
  ]
  for (const candidate of officialCandidates) {
    if (typeof candidate.value !== 'string' || !candidate.value) continue
    try {
      const page = await fetchPage(candidate.value)
      sources.push({ id: '', ...page, kind: candidate.kind, fetchedAt })
    } catch (error) {
      warnings.push(`${candidate.kind}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const query = `"${String(product.name)}" ${String(product.vendorName || '')} review alternatives comparison`.trim()
  let results: SearchResult[] = []
  const providers: Array<[string, () => Promise<SearchResult[]>]> = []
  if (process.env.BRAVE_SEARCH_API_KEY) providers.push(['brave', () => braveSearch(query)])
  providers.push(['duckduckgo', () => duckDuckGoSearch(query)], ['bing', () => bingSearch(query)])
  for (const [provider, search] of providers) {
    try {
      results = await search()
      if (results.length) break
      warnings.push(`${provider}-search: no results parsed`)
    } catch (error) {
      warnings.push(`${provider}-search: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const knownHosts = new Set(sources.flatMap((source) => { try { return [new URL(source.url).hostname] } catch { return [] } }))
  for (const result of results) {
    if (sources.filter((source) => source.kind === 'independent-web').length >= 3) break
    try {
      const host = assertPublicURL(result.url).hostname
      if (knownHosts.has(host)) continue
      const page = await fetchPage(result.url)
      knownHosts.add(host)
      sources.push({ id: '', title: page.title || result.title, url: page.url, kind: 'independent-web', excerpt: page.excerpt || result.description, fetchedAt })
    } catch (error) {
      warnings.push(`web-result: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return { query, sources: sources.map((source, index) => ({ ...source, id: `S${index + 1}` })), warnings }
}

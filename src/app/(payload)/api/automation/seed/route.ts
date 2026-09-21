import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { isAutomationAuthorized } from '@/lib/automation-auth'

const richText = (text: string) => ({ root: { type: 'root', children: [{ type: 'paragraph', version: 1, children: [{ type: 'text', version: 1, text }] }], direction: 'ltr' as const, format: '' as const, indent: 0, version: 1 } })

export async function POST(request: NextRequest) {
  if (!(await isAutomationAuthorized(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = await getPayload({ config })
  const regions = [
    { name: 'United States', code: 'us', countryCode: 'US', language: 'en', currency: 'USD', priority: 10 },
    { name: 'United Kingdom', code: 'uk', countryCode: 'GB', language: 'en', currency: 'GBP', priority: 9 },
    { name: 'China', code: 'cn', countryCode: 'CN', language: 'zh', currency: 'CNY', priority: 8 },
    { name: 'Japan', code: 'jp', countryCode: 'JP', language: 'ja', currency: 'JPY', priority: 7 },
    { name: 'Germany', code: 'de', countryCode: 'DE', language: 'de', currency: 'EUR', priority: 6 },
    { name: 'France', code: 'fr', countryCode: 'FR', language: 'fr', currency: 'EUR', priority: 5 },
    { name: 'Australia', code: 'au', countryCode: 'AU', language: 'en', currency: 'AUD', priority: 4 },
  ]
  for (const region of regions) {
    const found = await payload.find({ collection: 'geoRegions', where: { code: { equals: region.code } }, limit: 1 })
    if (!found.docs[0]) await payload.create({ collection: 'geoRegions', overrideAccess: true, data: region as never })
  }
  const categoryResult = await payload.find({ collection: 'categories', where: { slug: { equals: 'technology' } }, limit: 1 })
  const category = categoryResult.docs[0] || await payload.create({ collection: 'categories', overrideAccess: true, data: { name: 'Technology', slug: 'technology', description: 'Tech products and infrastructure' } })
  const regionResult = await payload.find({ collection: 'geoRegions', where: { code: { equals: 'us' } }, limit: 1 })
  const productResult = await payload.find({ collection: 'products', where: { slug: { equals: 'cloudflare-pro' } }, limit: 1 })
  if (!productResult.docs[0] && regionResult.docs[0]) await payload.create({ collection: 'products', overrideAccess: true, data: {
    name: 'Cloudflare Pro', slug: 'cloudflare-pro', status: 'active', shortDescription: 'A performance and security plan for websites that need more than the free tier.',
    description: richText('Cloudflare Pro combines CDN, web application security, image optimization, and analytics in one plan.'), category: category.id,
    affiliateUrl: 'https://www.cloudflare.com/plans/', commissionRate: 0, pricing: { amount: 20, currency: 'USD' }, geoRegions: [regionResult.docs[0].id], reviewScore: 4.6, lastUpdated: new Date().toISOString(),
    features: [{ title: 'Global CDN', description: 'Edge delivery across Cloudflare’s network.' }, { title: 'Web security', description: 'Managed protections for common web threats.' }, { title: 'Performance tools', description: 'Optimization features for production websites.' }],
    tags: [{ tag: 'cdn' }, { tag: 'security' }], geoContent: [{ region: regionResult.docs[0].id, localizedName: 'Cloudflare Pro', localizedDescription: richText('A practical upgrade for US-based website owners who need additional performance and security controls.'), localizedPrice: 20, localizedCurrency: 'USD' }],
  } })
  return NextResponse.json({ status: 'seeded', regions: regions.length, category: category.id })
}

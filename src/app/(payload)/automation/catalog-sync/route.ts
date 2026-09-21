import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { isAutomationAuthorized } from '@/lib/automation-auth'

type MarketplaceOffer = {
  id: string
  productId: number
  label: string
  description?: string
  type?: string
  vendorId?: number
  vendorName?: string
  salesPageUrl?: string
  affiliateSupportPageUrl?: string
  imageUrl?: string
  acceptsAffiliationsAutomatically?: boolean
  approvalStatus?: string
  billingTypes?: string[]
  price?: number
  currency?: string
  commission?: number
  commissionFix?: number
  conversionRate?: number
  cancelRate?: number
  earningsPerSale?: number
  earningsPerOrderformClick?: number
  salesRank?: number
  promoLink: string
}

const slugify = (value: string) => value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80)
const plainText = (html = '') => html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim()
const richText = (text: string) => ({ root: { type: 'root', children: [{ type: 'paragraph', version: 1, children: [{ type: 'text', version: 1, text }] }], direction: 'ltr' as const, format: '' as const, indent: 0, version: 1 } })
const currencies = ['USD', 'EUR', 'GBP', 'CNY', 'JPY', 'AUD'] as const

export async function POST(request: NextRequest) {
  if (!(await isAutomationAuthorized(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json() as { offers?: MarketplaceOffer[]; fetchedAt?: string }
  if (!Array.isArray(body.offers) || !body.offers.length || body.offers.length > 25) return NextResponse.json({ error: 'Expected 1-25 offers' }, { status: 400 })
  const payload = await getPayload({ config })
  const placeholder = await payload.find({ collection: 'products', where: { slug: { equals: 'cloudflare-pro' } }, limit: 1, overrideAccess: true })
  if (placeholder.docs[0]?.source !== 'digistore24' && placeholder.docs[0]?.status !== 'archived') {
    await payload.update({ collection: 'products', id: placeholder.docs[0].id, data: { status: 'archived' }, overrideAccess: true })
  }
  const categoryIds = new Map<string, number>()
  let created = 0
  let updated = 0

  for (const offer of body.offers) {
    if (!/^\d+$/.test(String(offer.productId)) || !offer.id || !offer.label || !offer.promoLink.includes(`/redir/${offer.productId}/`)) {
      return NextResponse.json({ error: `Invalid offer ${offer.id || 'unknown'}` }, { status: 400 })
    }
    const categoryName = String(offer.type || 'Other').trim() || 'Other'
    const categorySlug = slugify(categoryName) || 'other'
    let categoryId = categoryIds.get(categorySlug)
    if (!categoryId) {
      const found = await payload.find({ collection: 'categories', where: { slug: { equals: categorySlug } }, limit: 1, overrideAccess: true })
      const category = found.docs[0] || await payload.create({ collection: 'categories', data: { name: categoryName, slug: categorySlug }, overrideAccess: true })
      categoryId = Number(category.id)
      categoryIds.set(categorySlug, categoryId)
    }
    const description = plainText(offer.description) || `Marketplace listing for ${offer.label}. Verify current product details on the vendor website.`
    const sourceId = `digistore24:${offer.id}`
    const existing = await payload.find({ collection: 'products', where: { sourceId: { equals: sourceId } }, limit: 1, overrideAccess: true })
    const data = {
      name: offer.label,
      slug: `${slugify(offer.label) || 'product'}-${offer.productId}`,
      source: 'digistore24', sourceId, productId: offer.productId, vendorId: offer.vendorId, vendorName: offer.vendorName,
      shortDescription: description.slice(0, 160), description: richText(description), category: categoryId,
      status: 'active' as const, affiliateUrl: offer.promoLink, salesPageUrl: offer.salesPageUrl,
      affiliateSupportPageUrl: offer.affiliateSupportPageUrl, marketplaceImageUrl: offer.imageUrl,
      acceptsAffiliationsAutomatically: Boolean(offer.acceptsAffiliationsAutomatically), approvalStatus: offer.approvalStatus,
      billingTypes: offer.billingTypes || [], commissionRate: Math.max(0, Math.min(100, Number(offer.commission || 0))),
      commissionFixed: offer.commissionFix, conversionRate: offer.conversionRate, cancelRate: offer.cancelRate,
      earningsPerSale: offer.earningsPerSale, earningsPerOrderformClick: offer.earningsPerOrderformClick, salesRank: offer.salesRank,
      pricing: { amount: Math.max(0, Number(offer.price || 0)), currency: currencies.find((currency) => currency === offer.currency) || 'EUR' },
      reviewScore: 0, lastUpdated: body.fetchedAt || new Date().toISOString(), sourceStatus: 'active' as const,
      lastSeenAt: body.fetchedAt || new Date().toISOString(), sourceData: offer,
    }
    if (existing.docs[0]) {
      await payload.update({ collection: 'products', id: existing.docs[0].id, data, overrideAccess: true })
      updated += 1
    } else {
      await payload.create({ collection: 'products', data, overrideAccess: true })
      created += 1
    }
  }
  return NextResponse.json({ created, updated, processed: body.offers.length })
}

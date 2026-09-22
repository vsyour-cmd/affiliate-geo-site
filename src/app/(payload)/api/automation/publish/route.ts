import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { isAutomationAuthorized } from '@/lib/automation-auth'

type PublishBody = {
  title: string
  slug: string
  excerpt: string
  content: Record<string, unknown>
  productId: number
  productEnrichment: {
    summary: string
    overview: string[]
    features: Array<{ title: string; description: string }>
    idealFor: string[]
    limitations: string[]
  }
  categoryId?: number
  automationKey: string
  model: string
  promptVersion: string
  qualityScore: number
  qualityNotes: string[]
  sourceSnapshot: Record<string, unknown>
  publishedAt: string
}

function validProductEnrichment(value: PublishBody['productEnrichment'] | undefined): value is PublishBody['productEnrichment'] {
  return Boolean(value
    && typeof value.summary === 'string' && value.summary.length >= 80 && value.summary.length <= 160
    && Array.isArray(value.overview) && value.overview.length >= 2 && value.overview.length <= 4
    && value.overview.every((item) => typeof item === 'string' && item.length >= 80 && item.length <= 700)
    && Array.isArray(value.features) && value.features.length >= 4 && value.features.length <= 8
    && value.features.every((item) => item && typeof item.title === 'string' && item.title.length <= 90 && typeof item.description === 'string' && item.description.length >= 40 && item.description.length <= 400)
    && Array.isArray(value.idealFor) && value.idealFor.length >= 2 && value.idealFor.length <= 6
    && value.idealFor.every((item) => typeof item === 'string' && item.length >= 20 && item.length <= 240)
    && Array.isArray(value.limitations) && value.limitations.length >= 2 && value.limitations.length <= 6
    && value.limitations.every((item) => typeof item === 'string' && item.length >= 20 && item.length <= 240))
}

function productEnrichmentData(product: PublishBody['productEnrichment']) {
  const capabilityText = product.features.map((feature) => `${feature.title}: ${feature.description}`).join(' - ')
  const text = `${product.overview.join(' ')} --- Key capabilities - ${capabilityText} --- Who this product is for - ${product.idealFor.join(' - ')} --- What to verify before buying - ${product.limitations.join(' - ')}`
  return {
    shortDescription: product.summary,
    description: { root: { type: 'root', version: 1, direction: 'ltr' as const, format: '' as const, indent: 0, children: [{ type: 'paragraph', version: 1, direction: 'ltr' as const, format: '' as const, indent: 0, children: [{ type: 'text', version: 1, text, detail: 0, format: 0, mode: 'normal', style: '' }] }] } },
    features: product.features,
    lastUpdated: new Date().toISOString(),
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAutomationAuthorized(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json() as Partial<PublishBody>
  if (!body.title || !body.slug || !body.excerpt || !body.content || typeof body.productId !== 'number' || !validProductEnrichment(body.productEnrichment) || !body.automationKey || !body.model || !body.publishedAt || typeof body.qualityScore !== 'number' || body.qualityScore < 85) return NextResponse.json({ error: 'Invalid article or product enrichment payload' }, { status: 400 })
  const payload = await getPayload({ config })
  const existing = await payload.find({ collection: 'articles', where: { automationKey: { equals: body.automationKey } }, limit: 1 })
  if (existing.docs[0]) return NextResponse.json({ status: 'existing', article: existing.docs[0] })
  await payload.update({ collection: 'products', id: body.productId, data: productEnrichmentData(body.productEnrichment), overrideAccess: true })
  const created = await payload.create({ collection: 'articles', overrideAccess: true, data: {
    title: body.title, slug: body.slug, excerpt: body.excerpt, content: body.content as never,
    relatedProduct: body.productId, ...(body.categoryId ? { category: body.categoryId } : {}),
    status: 'published', publishedAt: body.publishedAt, automationKey: body.automationKey,
    aiGenerated: true, aiModel: body.model, promptVersion: body.promptVersion || 'unknown', qualityScore: body.qualityScore,
    qualityNotes: (body.qualityNotes || []).map((note) => ({ note })), sourceSnapshot: body.sourceSnapshot,
    indexable: true, monetizable: false, reviewStatus: 'autoPublished',
  } })
  return NextResponse.json({ status: 'published', article: created }, { status: 201 })
}

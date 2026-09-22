import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { isAutomationAuthorized } from '@/lib/automation-auth'

type ProductEnrichment = {
  summary: string
  overview: string[]
  features: Array<{ title: string; description: string }>
  idealFor: string[]
  limitations: string[]
}

function valid(value: ProductEnrichment | undefined): value is ProductEnrichment {
  return Boolean(value
    && typeof value.summary === 'string' && value.summary.length >= 50 && value.summary.length <= 160
    && Array.isArray(value.overview) && value.overview.length >= 2 && value.overview.length <= 4
    && value.overview.every((item) => typeof item === 'string' && item.length >= 40 && item.length <= 700)
    && Array.isArray(value.features) && value.features.length >= 4 && value.features.length <= 8
    && value.features.every((item) => item && typeof item.title === 'string' && item.title.length >= 3 && item.title.length <= 90 && typeof item.description === 'string' && item.description.length >= 20 && item.description.length <= 400)
    && Array.isArray(value.idealFor) && value.idealFor.length >= 2 && value.idealFor.length <= 6
    && Array.isArray(value.limitations) && value.limitations.length >= 2 && value.limitations.length <= 6)
}

const clean = (value: string) => value.replace(/\s*\[S\d+\]/gi, '').replace(/\s+/g, ' ').trim()

export async function POST(request: NextRequest) {
  if (!(await isAutomationAuthorized(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json() as { productId?: number; product?: ProductEnrichment }
  if (typeof body.productId !== 'number' || !valid(body.product)) return NextResponse.json({ error: 'Invalid product enrichment payload' }, { status: 400 })
  const product = body.product
  const features = product.features.map((item) => ({ title: clean(item.title), description: clean(item.description) }))
  const text = `${product.overview.map(clean).join(' ')} --- Key capabilities - ${features.map((item) => `${item.title}: ${item.description}`).join(' - ')} --- Who this product is for - ${product.idealFor.map(clean).join(' - ')} --- What to verify before buying - ${product.limitations.map(clean).join(' - ')}`
  const payload = await getPayload({ config })
  const updated = await payload.update({ collection: 'products', id: body.productId, overrideAccess: true, data: {
    shortDescription: clean(product.summary),
    description: { root: { type: 'root', version: 1, direction: 'ltr', format: '', indent: 0, children: [{ type: 'paragraph', version: 1, direction: 'ltr', format: '', indent: 0, children: [{ type: 'text', version: 1, text, detail: 0, format: 0, mode: 'normal', style: '' }] }] } },
    features,
    lastUpdated: new Date().toISOString(),
  } })
  return NextResponse.json({ status: 'enriched', product: { id: updated.id, slug: updated.slug, featureCount: features.length } })
}

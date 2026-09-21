import { getPayload } from 'payload'
import config from '@payload-config'
import { isAutomationAuthorized } from '@/lib/automation-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  if (!(await isAutomationAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config })
  const [products, articles] = await Promise.all([
    payload.find({
      collection: 'products',
      where: {
        and: [
          { status: { equals: 'active' } },
          { source: { equals: 'digistore24' } },
          { acceptsAffiliationsAutomatically: { equals: true } },
        ],
      },
      limit: 100,
      depth: 2,
      sort: 'slug',
      overrideAccess: true,
    }),
    payload.find({
      collection: 'articles',
      where: { status: { equals: 'published' } },
      limit: 30,
      sort: '-publishedAt',
      overrideAccess: true,
    }),
  ])

  return NextResponse.json({ products: products.docs, articles: articles.docs })
}

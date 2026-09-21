import { getPayload } from 'payload'
import config from '@payload-config'
import { isAutomationAuthorized } from '@/lib/automation-auth'

export async function GET(request: Request) {
  if (!(await isAutomationAuthorized(request))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config })
  const [products, articles] = await Promise.all([
    payload.find({
      collection: 'products',
      where: { status: { equals: 'active' } },
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

  return Response.json({ products: products.docs, articles: articles.docs })
}

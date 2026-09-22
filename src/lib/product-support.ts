import type { Payload } from 'payload'
import type { Language } from '@/lib/languages'
import type { Product } from '@/payload-types'

export async function loadProductSupport(payload: Payload, product: Product, language: Language) {
  const categoryID = typeof product.category === 'object' ? product.category.id : product.category
  const [alternatives, articles] = await Promise.all([
    payload.find({
      collection: 'products',
      where: { and: [{ status: { equals: 'active' } }, { category: { equals: categoryID } }, { id: { not_equals: product.id } }] },
      limit: 3,
      sort: '-updatedAt',
      depth: 0,
      locale: language,
      select: { slug: true, name: true, shortDescription: true, marketplaceImageUrl: true, pricing: true },
    }),
    payload.find({
      collection: 'articles',
      where: { and: [{ status: { equals: 'published' } }, { relatedProduct: { equals: product.id } }] },
      limit: 3,
      sort: '-publishedAt',
      depth: 0,
      locale: language,
      select: { slug: true, title: true, excerpt: true },
    }),
  ])
  return { alternatives: alternatives.docs, articles: articles.docs }
}

import type { Payload } from 'payload'
import type { Language } from '@/lib/languages'
import type { Product } from '@/payload-types'

export async function loadProductSupport(payload: Payload, product: Product, language: Language) {
  const categoryID = typeof product.category === 'object' ? product.category.id : product.category
  const [alternativeCandidates, articles] = await Promise.all([
    payload.find({
      collection: 'products',
      where: { and: [{ status: { equals: 'active' } }, { category: { equals: categoryID } }, { id: { not_equals: product.id } }] },
      limit: 12,
      sort: '-updatedAt',
      depth: 0,
      locale: language,
      select: { slug: true, name: true, shortDescription: true, marketplaceImageUrl: true, pricing: true, productId: true },
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
  const seenProductIDs = new Set<number>()
  if (product.productId) seenProductIDs.add(product.productId)
  const alternatives = alternativeCandidates.docs.filter((candidate) => {
    if (candidate.productId && seenProductIDs.has(candidate.productId)) return false
    if (candidate.productId) seenProductIDs.add(candidate.productId)
    return true
  }).slice(0, 3)
  return { alternatives, articles: articles.docs }
}

import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({ config })
  const products = await payload.find({ collection: 'products', where: { status: { equals: 'active' } }, limit: 1000, depth: 1 })
  const articles = await payload.find({ collection: 'articles', where: { and: [{ status: { equals: 'published' } }, { indexable: { equals: true } }] }, limit: 1000, depth: 0 })
  const baseURL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const urls: MetadataRoute.Sitemap = [
    { url: baseURL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseURL}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseURL}/articles`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseURL}/affiliate-disclosure`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${baseURL}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
  ]
  for (const product of products.docs) {
    for (const region of product.geoRegions || []) {
      if (typeof region !== 'object') continue
      urls.push({ url: `${baseURL}/products/${product.slug}/${region.code}`, lastModified: new Date(product.updatedAt), changeFrequency: 'weekly', priority: 0.9 })
    }
  }
  for (const article of articles.docs) urls.push({ url: `${baseURL}/articles/${article.slug}`, lastModified: new Date(article.updatedAt), changeFrequency: 'monthly', priority: 0.7 })
  return urls
}

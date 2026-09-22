import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getLanguage, getMessages } from '@/lib/i18n'

export const metadata: Metadata = { title: 'Products', description: 'Browse all active product recommendations.' }
export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const language = await getLanguage()
  const t = getMessages(language)
  const payload = await getPayload({ config })
  const products = await payload.find({
    collection: 'products',
    where: { status: { equals: 'active' } },
    limit: 30,
    depth: 0,
    sort: 'name',
    locale: language,
    select: { slug: true, name: true, shortDescription: true, marketplaceImageUrl: true, pricing: true, geoRegions: true },
  })
  return (
    <main className="section shell">
      <div className="section-head"><div><span className="eyebrow">{t.marketplace}</span><h1 style={{fontSize:'3rem'}}>{t.allProducts}</h1></div></div>
      {products.docs.length ? <div className="grid">{products.docs.map((product) => (
        <Link className="card" href={`/products/${product.slug}`} key={product.id}>
          {product.marketplaceImageUrl ? <div className="card-media"><img src={product.marketplaceImageUrl} alt="" loading="lazy" /></div> : <div className="card-media card-media-fallback" aria-hidden="true"><span>{product.name.slice(0, 1)}</span></div>}
          <span className="badge">{product.geoRegions?.length || 0} {t.regions}</span><h2>{product.name}</h2><p>{product.shortDescription}</p>
          <span className="price">{product.pricing?.currency} {product.pricing?.amount}</span>
        </Link>
      ))}</div> : <div className="empty">{t.noProducts}</div>}
    </main>
  )
}

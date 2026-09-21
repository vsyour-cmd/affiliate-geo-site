import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'

export const metadata: Metadata = { title: 'Products', description: 'Browse all active product recommendations.' }
export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const payload = await getPayload({ config })
  const products = await payload.find({ collection: 'products', where: { status: { equals: 'active' } }, limit: 100, depth: 1, sort: 'name' })
  return (
    <main className="section shell">
      <div className="section-head"><div><span className="eyebrow">Marketplace</span><h1 style={{fontSize:'3rem'}}>All products</h1></div></div>
      {products.docs.length ? <div className="grid">{products.docs.map((product) => (
        <Link className="card" href={`/products/${product.slug}`} key={product.id}>
          <span className="badge">{product.geoRegions?.length || 0} regions</span><h2>{product.name}</h2><p>{product.shortDescription}</p>
          <span className="price">{product.pricing?.currency} {product.pricing?.amount}</span>
        </Link>
      ))}</div> : <div className="empty">No active products are currently available.</div>}
    </main>
  )
}

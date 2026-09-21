import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const payload = await getPayload({ config })
  const products = await payload.find({
    collection: 'products',
    where: { status: { equals: 'active' } },
    limit: 3,
    depth: 1,
    sort: '-updatedAt',
  })

  return (
    <main>
      <section className="hero">
        <div className="shell">
          <span className="eyebrow">Region-aware recommendations</span>
          <h1>Find the right product, with the right offer for your market.</h1>
          <p className="lede">Clear comparisons, localized pricing, and direct links to official providers—without the clutter.</p>
          <div className="actions">
            <Link className="button" href="/products">Browse products</Link>
            <Link className="button secondary" href="/affiliate-disclosure">How we earn</Link>
          </div>
        </div>
      </section>
      <section className="section shell">
        <div className="section-head"><h2>Recently updated</h2><Link href="/products">View all →</Link></div>
        {products.docs.length ? (
          <div className="grid">
            {products.docs.map((product) => (
              <Link className="card" href={`/products/${product.slug}`} key={product.id}>
                <span className="badge">{product.status}</span>
                <h3>{product.name}</h3>
                <p>{product.shortDescription}</p>
                <span className="price">{product.pricing?.currency} {product.pricing?.amount}</span>
              </Link>
            ))}
          </div>
        ) : <div className="empty">No active products yet. Add one from the Payload Admin.</div>}
      </section>
    </main>
  )
}

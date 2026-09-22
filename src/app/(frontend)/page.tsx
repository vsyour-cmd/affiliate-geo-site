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
    depth: 0,
    sort: '-updatedAt',
    select: { slug: true, name: true, shortDescription: true, marketplaceImageUrl: true, pricing: true },
  })

  return (
    <main>
      <section className="hero">
        <div className="shell hero-grid">
          <div>
            <span className="eyebrow">Independent marketplace intelligence</span>
            <h1>Make a clearer choice before you buy.</h1>
            <p className="lede">Explore current marketplace listings and practical, AI-assisted buying guides designed around verification—not hype.</p>
            <div className="actions">
              <Link className="button" href="/products">Explore marketplace</Link>
              <Link className="button secondary" href="/articles">Read buying guides</Link>
            </div>
          </div>
          <aside className="trust-panel" aria-label="Our editorial approach">
            <span className="eyebrow">How this site works</span>
            <strong>Current products. Clear context. Transparent links.</strong>
            <ul><li>Daily marketplace data refresh</li><li>AI-assisted articles with quality gates</li><li>Visible affiliate disclosure on every offer</li></ul>
          </aside>
        </div>
      </section>
      <section className="section shell">
        <div className="section-head"><h2>Recently updated</h2><Link href="/products">View all →</Link></div>
        {products.docs.length ? (
          <div className="grid">
            {products.docs.map((product) => (
              <Link className="card" href={`/products/${product.slug}`} key={product.id}>
                {product.marketplaceImageUrl ? <div className="card-media"><img src={product.marketplaceImageUrl} alt="" loading="lazy" /></div> : <div className="card-media card-media-fallback" aria-hidden="true"><span>{product.name.slice(0, 1)}</span></div>}
                <span className="badge">Marketplace listing</span>
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

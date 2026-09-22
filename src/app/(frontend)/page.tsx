import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getLanguage, getMessages } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const language = await getLanguage()
  const t = getMessages(language)
  const payload = await getPayload({ config })
  const products = await payload.find({
    collection: 'products',
    where: { status: { equals: 'active' } },
    limit: 3,
    depth: 0,
    sort: '-updatedAt',
    locale: language,
    select: { slug: true, name: true, shortDescription: true, marketplaceImageUrl: true, pricing: true },
  })

  return (
    <main>
      <section className="hero">
        <div className="shell hero-grid">
          <div>
            <span className="eyebrow">{t.heroEyebrow}</span>
            <h1>{t.heroTitle}</h1>
            <p className="lede">{t.heroText}</p>
            <div className="actions">
              <Link className="button" href="/products">{t.explore}</Link>
              <Link className="button secondary" href="/articles">{t.guides}</Link>
            </div>
          </div>
          <aside className="trust-panel" aria-label="Our editorial approach">
            <span className="eyebrow">{t.how}</span>
            <strong>{t.trust}</strong>
            <ul><li>{t.refresh}</li><li>{t.ai}</li><li>{t.transparent}</li></ul>
          </aside>
        </div>
      </section>
      <section className="section shell">
        <div className="section-head"><h2>{t.recent}</h2><Link href="/products">{t.viewAll}</Link></div>
        {products.docs.length ? (
          <div className="grid">
            {products.docs.map((product) => (
              <Link className="card" href={`/products/${product.slug}`} key={product.id}>
                {product.marketplaceImageUrl ? <div className="card-media"><img src={product.marketplaceImageUrl} alt="" loading="lazy" /></div> : <div className="card-media card-media-fallback" aria-hidden="true"><span>{product.name.slice(0, 1)}</span></div>}
                <span className="badge">{t.listing}</span>
                <h3>{product.name}</h3>
                <p>{product.shortDescription}</p>
                <span className="price">{product.pricing?.currency} {product.pricing?.amount}</span>
              </Link>
            ))}
          </div>
        ) : <div className="empty">{t.noProducts}</div>}
      </section>
    </main>
  )
}

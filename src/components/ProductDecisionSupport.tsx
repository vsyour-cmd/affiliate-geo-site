import Link from 'next/link'
import { productImageSrc } from '@/lib/product-image'

type ComparisonProduct = {
  id: number
  slug: string
  name: string
  shortDescription: string
  marketplaceImageUrl?: string | null
  pricing?: { amount: number; currency?: string | null } | null
}

type RelatedArticle = {
  id: number
  slug: string
  title: string
  excerpt: string
}

type Labels = {
  compare: string
  compareIntro: string
  current: string
  alternative: string
  viewDetails: string
  guides: string
  guidesIntro: string
  readGuide: string
}

function ProductVisual({ product }: { product: ComparisonProduct }) {
  const imageSrc = productImageSrc(product.marketplaceImageUrl)
  return imageSrc
    ? <img src={imageSrc} alt={`${product.name} product image`} loading="lazy" />
    : <span aria-hidden="true">{product.name.slice(0, 1)}</span>
}

export function ProductDecisionSupport({ current, alternatives, articles, labels }: { current: ComparisonProduct; alternatives: ComparisonProduct[]; articles: RelatedArticle[]; labels: Labels }) {
  const comparison = [current, ...alternatives]
  return <>
    {alternatives.length ? <section className="comparison-section">
      <div className="decision-heading"><span className="eyebrow">{labels.compare}</span><h2>{labels.compare}</h2><p>{labels.compareIntro}</p></div>
      <div className="comparison-grid">
        {comparison.map((product, index) => <article className={index === 0 ? 'comparison-card is-current' : 'comparison-card'} key={product.id}>
          <div className="comparison-media"><ProductVisual product={product} /></div>
          <div className="comparison-content">
            <span className="comparison-label">{index === 0 ? labels.current : labels.alternative}</span>
            <h3>{product.name}</h3>
            <p>{product.shortDescription}</p>
            <div className="comparison-footer"><strong>{product.pricing?.currency} {product.pricing?.amount}</strong><Link href={`/products/${product.slug}`}>{labels.viewDetails} →</Link></div>
          </div>
        </article>)}
      </div>
    </section> : null}
    {articles.length ? <section className="related-guides">
      <div className="decision-heading"><span className="eyebrow">{labels.guides}</span><h2>{labels.guides}</h2><p>{labels.guidesIntro}</p></div>
      <div className="guide-list">{articles.map((article) => <Link href={`/articles/${article.slug}`} key={article.id}><span>{article.title}</span><small>{article.excerpt}</small><strong>{labels.readGuide} →</strong></Link>)}</div>
    </section> : null}
  </>
}

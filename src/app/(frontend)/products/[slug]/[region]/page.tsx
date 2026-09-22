import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ProductDescription } from '@/components/ProductDescription'
import { ProductActions } from '@/components/ProductActions'
import { ProductFacts } from '@/components/ProductFacts'
import { ProductDecisionSupport } from '@/components/ProductDecisionSupport'
import { getLanguage, getMessages } from '@/lib/i18n'
import { loadProductSupport } from '@/lib/product-support'

type Props = { params: Promise<{ slug: string; region: string }> }

async function loadProduct(slug: string, region: string) {
  const language = await getLanguage()
  const payload = await getPayload({ config })
  const result = await payload.find({ collection: 'products', where: { and: [{ slug: { equals: slug } }, { status: { equals: 'active' } }] }, limit: 1, depth: 2, locale: language })
  const product = result.docs[0]
  if (!product) return null
  const regionData = (product.geoRegions || []).find((item) => typeof item === 'object' && item.code === region)
  if (!regionData || typeof regionData !== 'object') return null
  const geoContent = product.geoContent?.find((item) => typeof item.region === 'object' && item.region.code === region)
  return { product, regionData, geoContent }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, region } = await params
  const data = await loadProduct(slug, region)
  if (!data) return { title: 'Product not found' }
  const title = data.geoContent?.localizedName || data.product.name
  return {
    title,
    description: data.product.shortDescription,
    alternates: { canonical: `/products/${slug}/${region}` },
    openGraph: { title, description: data.product.shortDescription, type: 'website', locale: data.regionData.language },
  }
}

export const dynamic = 'force-dynamic'

export default async function ProductRegionPage({ params }: Props) {
  const { slug, region } = await params
  const data = await loadProduct(slug, region)
  if (!data) notFound()
  const { product, regionData, geoContent } = data
  const language = await getLanguage()
  const t = getMessages(language)
  const name = geoContent?.localizedName || product.name
  const description = geoContent?.localizedDescription || product.description
  const price = geoContent?.localizedPrice ?? product.pricing?.amount
  const currency = geoContent?.localizedCurrency || product.pricing?.currency
  const support = await loadProductSupport(await getPayload({ config }), product, language)

  return (
    <main className="shell product-layout">
      <article>
        <span className="badge">{regionData.name}</span>
        <h1 style={{fontSize:'clamp(2.5rem,6vw,4.5rem)'}}>{name}</h1>
        <p className="lede">{product.shortDescription}</p>
        <ProductActions slug={product.slug} title={name} labels={{ save: t.save, saved: t.saved, share: t.share, copied: t.copied }} />
        {product.marketplaceImageUrl ? <figure className="product-hero"><img src={product.marketplaceImageUrl} alt={`${name} product illustration`} /></figure> : null}
        <section className="product-overview"><h2>{t.overview}</h2>{description ? <ProductDescription data={description} affiliateUrl={product.affiliateUrl} /> : null}</section>
        <ProductFacts product={product} labels={{ title:t.details, vendor:t.vendor, resources:t.resources, salesPage:t.salesPage }} />
        <ProductDecisionSupport current={product} alternatives={support.alternatives} articles={support.articles} labels={{ compare:t.compare, compareIntro:t.compareIntro, current:t.currentChoice, alternative:t.alternative, viewDetails:t.viewDetails, guides:t.relatedGuides, guidesIntro:t.relatedGuidesIntro, readGuide:t.readGuide }} />
        {product.features?.length ? <section><h2>{t.features}</h2><ul className="features">{product.features.map((feature) => <li key={feature.id || feature.title}><strong>{feature.title.replace(/\s*\[S\d+\]/gi, '')}</strong>{feature.description ? <div>{feature.description.replace(/\s*\[S\d+\]/gi, '')}</div> : null}</li>)}</ul></section> : null}
        <section><h2>{t.availableRegions}</h2><div className="regions">{product.geoRegions?.map((item) => typeof item === 'object' ? <Link key={item.id} href={`/products/${slug}/${item.code}`}>{item.code.toUpperCase()}</Link> : null)}</div></section>
      </article>
      <aside><div className="offer-box"><span className="eyebrow">{t.currentPrice}</span><div className="price">{currency} {price}</div><p>{t.priceNote}</p><a className="button" href={product.affiliateUrl} target="_blank" rel="nofollow sponsored noopener noreferrer">{t.visit}</a><p style={{fontSize:'.8rem'}}>{t.affiliateNote}</p></div></aside>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context':'https://schema.org', '@type':'Product', name, description:product.shortDescription, offers:{ '@type':'Offer', price, priceCurrency:currency, availability:'https://schema.org/InStock', url:product.affiliateUrl }, ...(product.reviewScore ? { aggregateRating:{ '@type':'AggregateRating', ratingValue:product.reviewScore, bestRating:5 } } : {}) }).replace(/</g, '\\u003c') }} />
    </main>
  )
}

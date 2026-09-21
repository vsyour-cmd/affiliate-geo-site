import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { getPayload } from 'payload'
import config from '@payload-config'

type Props = { params: Promise<{ slug: string; region: string }> }

async function loadProduct(slug: string, region: string) {
  const payload = await getPayload({ config })
  const result = await payload.find({ collection: 'products', where: { and: [{ slug: { equals: slug } }, { status: { equals: 'active' } }] }, limit: 1, depth: 2 })
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
  const name = geoContent?.localizedName || product.name
  const description = geoContent?.localizedDescription || product.description
  const price = geoContent?.localizedPrice ?? product.pricing?.amount
  const currency = geoContent?.localizedCurrency || product.pricing?.currency

  return (
    <main className="shell product-layout">
      <article>
        <span className="badge">{regionData.name}</span>
        <h1 style={{fontSize:'clamp(2.5rem,6vw,4.5rem)'}}>{name}</h1>
        <p className="lede">{product.shortDescription}</p>
        <section><h2>Overview</h2>{description ? <RichText data={description} /> : null}</section>
        {product.features?.length ? <section><h2>Key features</h2><ul className="features">{product.features.map((feature) => <li key={feature.id || feature.title}><strong>{feature.title}</strong>{feature.description ? <div>{feature.description}</div> : null}</li>)}</ul></section> : null}
        <section><h2>Available regions</h2><div className="regions">{product.geoRegions?.map((item) => typeof item === 'object' ? <Link key={item.id} href={`/products/${slug}/${item.code}`}>{item.code.toUpperCase()}</Link> : null)}</div></section>
      </article>
      <aside><div className="offer-box"><span className="eyebrow">Current listed price</span><div className="price">{currency} {price}</div><p>Pricing and availability may change on the provider’s website.</p><a className="button" href={product.affiliateUrl} target="_blank" rel="nofollow sponsored noopener noreferrer">Visit official site →</a><p style={{fontSize:'.8rem'}}>Affiliate disclosure: we may earn a commission if you purchase through this link.</p></div></aside>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context':'https://schema.org', '@type':'Product', name, description:product.shortDescription, offers:{ '@type':'Offer', price, priceCurrency:currency, availability:'https://schema.org/InStock', url:product.affiliateUrl }, ...(product.reviewScore ? { aggregateRating:{ '@type':'AggregateRating', ratingValue:product.reviewScore, bestRating:5 } } : {}) }).replace(/</g, '\\u003c') }} />
    </main>
  )
}

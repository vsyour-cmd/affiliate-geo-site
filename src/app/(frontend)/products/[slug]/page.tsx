import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { getPayload } from 'payload'
import config from '@payload-config'

const countryToRegion: Record<string, string> = { AU:'au', CN:'cn', DE:'de', FR:'fr', GB:'uk', JP:'jp', US:'us' }

export const dynamic = 'force-dynamic'

export default async function ProductRedirectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayload({ config })
  const result = await payload.find({ collection: 'products', where: { and: [{ slug: { equals: slug } }, { status: { equals: 'active' } }] }, limit: 1, depth: 1 })
  const product = result.docs[0]
  if (!product) notFound()

  const regionCodes = (product.geoRegions || []).map((item) => typeof item === 'object' ? item.code : null).filter(Boolean) as string[]
  if (!regionCodes.length) {
    return (
      <main className="shell product-layout">
        <article>
          <span className="badge">Global marketplace listing</span>
          <h1 style={{fontSize:'clamp(2.5rem,6vw,4.5rem)'}}>{product.name}</h1>
          <p className="lede">{product.shortDescription}</p>
          {product.marketplaceImageUrl ? <figure className="product-hero"><img src={product.marketplaceImageUrl} alt={`${product.name} product illustration`} /></figure> : null}
          <section><h2>Overview</h2>{product.description ? <RichText data={product.description} /> : null}</section>
        </article>
        <aside><div className="offer-box"><span className="eyebrow">Current listed price</span><div className="price">{product.pricing?.currency} {product.pricing?.amount}</div><p>Pricing and availability may change on the provider’s website.</p><a className="button" href={product.affiliateUrl} target="_blank" rel="nofollow sponsored noopener noreferrer">Visit official site →</a><p style={{fontSize:'.8rem'}}>Affiliate disclosure: we may earn a commission if you purchase through this link.</p></div></aside>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context':'https://schema.org', '@type':'Product', name:product.name, description:product.shortDescription, offers:{ '@type':'Offer', price:product.pricing?.amount, priceCurrency:product.pricing?.currency, availability:'https://schema.org/InStock', url:product.affiliateUrl } }).replace(/</g, '\\u003c') }} />
      </main>
    )
  }
  const country = (await headers()).get('cf-ipcountry')?.toUpperCase() || 'US'
  const preferred = countryToRegion[country]
  redirect(`/products/${slug}/${preferred && regionCodes.includes(preferred) ? preferred : regionCodes[0]}`)
}

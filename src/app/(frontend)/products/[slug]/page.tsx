import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ProductDescription } from '@/components/ProductDescription'
import { getLanguage, getMessages } from '@/lib/i18n'

const countryToRegion: Record<string, string> = { AU:'au', CN:'cn', DE:'de', FR:'fr', GB:'uk', JP:'jp', US:'us' }

export const dynamic = 'force-dynamic'

export default async function ProductRedirectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const language = await getLanguage()
  const t = getMessages(language)
  const payload = await getPayload({ config })
  const result = await payload.find({ collection: 'products', where: { and: [{ slug: { equals: slug } }, { status: { equals: 'active' } }] }, limit: 1, depth: 1, locale: language })
  const product = result.docs[0]
  if (!product) notFound()

  const regionCodes = (product.geoRegions || []).map((item) => typeof item === 'object' ? item.code : null).filter(Boolean) as string[]
  if (!regionCodes.length) {
    return (
      <main className="shell product-layout">
        <article>
          <span className="badge">{t.globalListing}</span>
          <h1 style={{fontSize:'clamp(2.5rem,6vw,4.5rem)'}}>{product.name}</h1>
          <p className="lede">{product.shortDescription}</p>
          {product.marketplaceImageUrl ? <figure className="product-hero"><img src={product.marketplaceImageUrl} alt={`${product.name} product illustration`} /></figure> : null}
          <section className="product-overview"><h2>{t.overview}</h2>{product.description ? <ProductDescription data={product.description} /> : null}</section>
        </article>
        <aside><div className="offer-box"><span className="eyebrow">{t.currentPrice}</span><div className="price">{product.pricing?.currency} {product.pricing?.amount}</div><p>{t.priceNote}</p><a className="button" href={product.affiliateUrl} target="_blank" rel="nofollow sponsored noopener noreferrer">{t.visit}</a><p style={{fontSize:'.8rem'}}>{t.affiliateNote}</p></div></aside>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context':'https://schema.org', '@type':'Product', name:product.name, description:product.shortDescription, offers:{ '@type':'Offer', price:product.pricing?.amount, priceCurrency:product.pricing?.currency, availability:'https://schema.org/InStock', url:product.affiliateUrl } }).replace(/</g, '\\u003c') }} />
      </main>
    )
  }
  const country = (await headers()).get('cf-ipcountry')?.toUpperCase() || 'US'
  const preferred = countryToRegion[country]
  redirect(`/products/${slug}/${preferred && regionCodes.includes(preferred) ? preferred : regionCodes[0]}`)
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getLanguage, getMessages } from '@/lib/i18n'
import { productImageSrc } from '@/lib/product-image'

export const metadata: Metadata = { title: 'Products', description: 'Browse all active product recommendations.' }
export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ q?: string; sort?: string; page?: string }>

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const language = await getLanguage()
  const t = getMessages(language)
  const params = await searchParams
  const query = (params.q || '').trim().slice(0, 80)
  const page = Math.max(1, Number.parseInt(params.page || '1', 10) || 1)
  const sortKey = ['newest', 'popular', 'name'].includes(params.sort || '') ? params.sort! : 'newest'
  const sort = sortKey === 'name' ? 'name' : sortKey === 'popular' ? 'salesRank' : '-updatedAt'
  const payload = await getPayload({ config })
  const products = await payload.find({
    collection: 'products',
    where: query ? { and: [{ status: { equals: 'active' } }, { or: [{ name: { contains: query } }, { shortDescription: { contains: query } }] }] } : { status: { equals: 'active' } },
    limit: 24,
    page,
    depth: 0,
    sort,
    locale: language,
    select: { slug: true, name: true, shortDescription: true, marketplaceImageUrl: true, pricing: true },
  })
  return (
    <main className="section shell">
      <div className="section-head"><div><span className="eyebrow">{t.marketplace}</span><h1 style={{fontSize:'3rem'}}>{t.allProducts}</h1></div></div>
      <form className="product-toolbar" action="/products" method="get" role="search">
        <label className="search-field"><span>{t.searchProducts}</span><input type="search" name="q" defaultValue={query} placeholder={t.searchPlaceholder} /></label>
        <label className="sort-field"><span>{t.sortBy}</span><select name="sort" defaultValue={sortKey}><option value="newest">{t.newest}</option><option value="name">{t.alphabetical}</option><option value="popular">{t.popular}</option></select></label>
        <button className="button" type="submit">{t.search}</button>
        {query || sortKey !== 'newest' ? <Link className="clear-button" href="/products">{t.clear}</Link> : null}
      </form>
      <div className="results-summary" aria-live="polite"><strong>{products.totalDocs.toLocaleString()}</strong> {t.results}</div>
      {products.docs.length ? <div className="grid">{products.docs.map((product) => (
        <Link className="card" href={`/products/${product.slug}`} key={product.id}>
          {productImageSrc(product.marketplaceImageUrl) ? <div className="card-media"><img src={productImageSrc(product.marketplaceImageUrl)} alt="" loading="lazy" /></div> : <div className="card-media card-media-fallback" aria-hidden="true"><span>{product.name.slice(0, 1)}</span></div>}
          <h2>{product.name}</h2><p>{product.shortDescription}</p>
          <span className="price">{product.pricing?.currency} {product.pricing?.amount}</span>
        </Link>
      ))}</div> : <div className="empty">{t.noProducts}</div>}
      {products.totalPages > 1 ? <nav className="pagination" aria-label="Pagination">
        {products.hasPrevPage ? <Link href={{ pathname: '/products', query: { ...(query ? { q: query } : {}), sort: sortKey, page: page - 1 } }}>{t.previous}</Link> : <span aria-disabled="true">{t.previous}</span>}
        <strong>{t.page} {products.page} {t.of} {products.totalPages}</strong>
        {products.hasNextPage ? <Link href={{ pathname: '/products', query: { ...(query ? { q: query } : {}), sort: sortKey, page: page + 1 } }}>{t.next}</Link> : <span aria-disabled="true">{t.next}</span>}
      </nav> : null}
    </main>
  )
}

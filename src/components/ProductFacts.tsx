type FactLabels = {
  title: string
  vendor: string
  commission: string
  billing: string
  conversion: string
  cancellation: string
  earningsSale: string
  earningsClick: string
  approval: string
  automatic: string
  manual: string
  updated: string
  resources: string
  salesPage: string
  promoMaterials: string
  metricNote: string
}

type ProductFactData = {
  vendorName?: string | null
  commissionRate?: number | null
  commissionFixed?: number | null
  conversionRate?: number | null
  cancelRate?: number | null
  earningsPerSale?: number | null
  earningsPerOrderformClick?: number | null
  billingTypes?: unknown
  acceptsAffiliationsAutomatically?: boolean | null
  salesPageUrl?: string | null
  affiliateSupportPageUrl?: string | null
  lastUpdated?: string | null
  pricing?: { currency?: string | null } | null
}

function billingValue(value: unknown) {
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string').join(', ')
  if (typeof value === 'string') return value
  return ''
}

function money(value: number, currency?: string | null) {
  return `${currency || 'EUR'} ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

export function ProductFacts({ product, labels, locale }: { product: ProductFactData; labels: FactLabels; locale: string }) {
  const billing = billingValue(product.billingTypes)
  const facts = [
    product.vendorName ? [labels.vendor, product.vendorName] : null,
    product.commissionRate != null && product.commissionRate > 0 ? [labels.commission, `${product.commissionRate}%${product.commissionFixed ? ` + ${money(product.commissionFixed, product.pricing?.currency)}` : ''}`] : null,
    billing ? [labels.billing, billing] : null,
    product.conversionRate != null && product.conversionRate > 0 ? [labels.conversion, `${product.conversionRate}%`] : null,
    product.cancelRate != null && product.cancelRate > 0 ? [labels.cancellation, `${product.cancelRate}%`] : null,
    product.earningsPerSale != null && product.earningsPerSale > 0 ? [labels.earningsSale, money(product.earningsPerSale, product.pricing?.currency)] : null,
    product.earningsPerOrderformClick != null && product.earningsPerOrderformClick > 0 ? [labels.earningsClick, money(product.earningsPerOrderformClick, product.pricing?.currency)] : null,
    product.acceptsAffiliationsAutomatically != null ? [labels.approval, product.acceptsAffiliationsAutomatically ? labels.automatic : labels.manual] : null,
    product.lastUpdated ? [labels.updated, new Date(product.lastUpdated).toLocaleDateString(locale)] : null,
  ].filter(Boolean) as string[][]

  const resources = [
    product.salesPageUrl ? [labels.salesPage, product.salesPageUrl] : null,
    product.affiliateSupportPageUrl ? [labels.promoMaterials, product.affiliateSupportPageUrl] : null,
  ].filter(Boolean) as string[][]

  if (!facts.length && !resources.length) return null

  return <section className="product-facts-section">
    <h2>{labels.title}</h2>
    {facts.length ? <dl className="product-facts">{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> : null}
    {resources.length ? <div className="product-resources"><h3>{labels.resources}</h3>{resources.map(([label, url]) => <a key={url} href={url} target="_blank" rel="noopener noreferrer nofollow">{label} <span aria-hidden="true">↗</span></a>)}</div> : null}
    <p className="metric-note">{labels.metricNote}</p>
  </section>
}

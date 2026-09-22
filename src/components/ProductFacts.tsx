type FactLabels = {
  title: string
  vendor: string
  resources: string
  salesPage: string
}

type ProductFactData = {
  vendorName?: string | null
  affiliateUrl: string
}

export function ProductFacts({ product, labels }: { product: ProductFactData; labels: FactLabels }) {
  return <section className="product-facts-section">
    {product.vendorName ? <><h2>{labels.title}</h2><dl className="product-facts"><div><dt>{labels.vendor}</dt><dd>{product.vendorName}</dd></div></dl></> : null}
    <div className="product-resources"><h3>{labels.resources}</h3><a href={product.affiliateUrl} target="_blank" rel="sponsored noopener noreferrer nofollow">{labels.salesPage} <span aria-hidden="true">↗</span></a></div>
  </section>
}

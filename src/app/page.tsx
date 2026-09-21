import { notFound } from 'next/navigation';
import { getPayload } from 'payload';
import config from '@/payload.config';

async function getProducts() {
  const payload = await getPayload({ config });
  const response = await payload.find({
    collection: 'products',
    where: {
      status: { equals: 'active' },
    },
    limit: 50,
    sort: '-lastUpdated',
  });
  return response.docs;
}

export const revalidate = 3600;

export default async function HomePage() {
  const products = await getProducts();

  return (
    <main className="container">
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '2rem 0 1rem' }}>
        Featured Products
      </h1>
      <p style={{ fontSize: '1.25rem', color: '#6b7280', marginBottom: '2rem' }}>
        Discover the best products tailored to your region
      </p>

      <div className="product-grid">
        {products.map((product: any) => (
          <article key={product.id} className="product-card">
            <h2 className="product-title">
              <a href={`/products/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                {product.name}
              </a>
            </h2>
            <p className="product-description">{product.shortDescription}</p>
            {product.pricing && (
              <div className="product-price">
                {product.pricing.currency} {product.pricing.amount}
              </div>
            )}
            <div>
              {product.geoRegions?.map((region: any) => (
                <span key={region.id} className="region-badge">
                  {region.code}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

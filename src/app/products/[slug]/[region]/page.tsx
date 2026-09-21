import { notFound } from 'next/navigation';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string; region: string }>;
}

async function getProductWithRegion(slug: string, regionCode: string) {
  const payload = await getPayload({ config });
  const response = await payload.find({
    collection: 'products',
    where: {
      slug: { equals: slug },
      status: { equals: 'active' },
    },
    limit: 1,
    depth: 2,
  });
  const product = response.docs[0];
  
  if (!product) return null;

  // Find geo content for this region
  const geoContent = product.geoContent?.find(
    (gc: any) => gc.region?.code === regionCode
  );

  return {
    ...product,
    geoContent,
    regionCode,
  };
}

async function getRegion(code: string) {
  const payload = await getPayload({ config });
  const response = await payload.find({
    collection: 'geoRegions',
    where: {
      code: { equals: code },
    },
    limit: 1,
  });
  return response.docs[0];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, region } = await params;
  const data = await getProductWithRegion(slug, region);
  
  if (!data) {
    return {
      title: 'Product Not Found',
    };
  }

  const regionData = await getRegion(region);
  
  return {
    title: data.geoContent?.localizedName || data.name,
    description: data.shortDescription,
    alternates: {
      canonical: `https://affiliate.example.com/products/${slug}/${region}`,
    },
    openGraph: {
      title: data.geoContent?.localizedName || data.name,
      description: data.shortDescription,
      type: 'website',
      locale: regionData?.language || 'en',
    },
  };
}

export const revalidate = 3600;

export default async function ProductRegionPage({ params }: Props) {
  const { slug, region } = await params;
  const data = await getProductWithRegion(slug, region);

  if (!data) {
    notFound();
  }

  const { geoContent, regionCode } = data;
  const regionData = await getRegion(regionCode);

  return (
    <main className="container" style={{ padding: '2rem 20px' }}>
      <article>
        <header style={{ marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <span className="region-badge">
              {regionData?.name || regionCode}
            </span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            {geoContent?.localizedName || data.name}
          </h1>
          <p style={{ fontSize: '1.125rem', color: '#6b7280', lineHeight: '1.6' }}>
            {geoContent?.localizedDescription || data.description}
          </p>
        </header>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
            Pricing
          </h2>
          <p style={{ fontSize: '2rem', fontWeight: '700', color: '#111827' }}>
            {geoContent?.localizedCurrency || data.pricing?.currency} {geoContent?.localizedPrice || data.pricing?.amount}
          </p>
        </section>

        {data.features && data.features.length > 0 && (
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
              Key Features
            </h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {data.features.map((feature: any, index: number) => (
                <li key={index} style={{ padding: '0.75rem 0', borderBottom: '1px solid #e5e7eb' }}>
                  <strong>{feature.title}</strong>
                  {feature.description && (
                    <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>
                      {feature.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
            Why Choose This Product?
          </h2>
          <div
            dangerouslySetInnerHTML={{
              __html: geoContent?.localizedDescription || data.description || '',
            }}
          />
        </section>

        <section style={{ marginTop: '3rem', padding: '2rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
            Ready to Get Started?
          </h2>
          <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
            Click below to visit the official site and get the best deal in your region.
          </p>
          <a
            href={data.affiliateUrl}
            className="product-link"
            style={{ fontSize: '1.125rem', padding: '0.75rem 1.5rem' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit Official Site →
          </a>
        </section>

        <section style={{ marginTop: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
            Available In
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {data.geoRegions?.map((geo: any) => (
              <a
                key={geo.id}
                href={`/products/${slug}/${geo.code}`}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  textDecoration: 'none',
                  color: '#374151',
                }}
              >
                {geo.code}
              </a>
            ))}
          </div>
        </section>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: geoContent?.localizedName || data.name,
              description: data.shortDescription,
              offers: {
                '@type': 'Offer',
                price: geoContent?.localizedPrice || data.pricing?.amount,
                priceCurrency: geoContent?.localizedCurrency || data.pricing?.currency,
                availability: 'https://schema.org/InStock',
                url: data.affiliateUrl,
              },
              aggregateRating: data.reviewScore
                ? {
                    '@type': 'AggregateRating',
                    ratingValue: data.reviewScore,
                    bestRating: 5,
                  }
                : undefined,
            }),
          }}
        />
      </article>
    </main>
  );
}

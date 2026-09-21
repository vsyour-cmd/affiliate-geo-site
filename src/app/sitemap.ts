import { getPayload } from 'payload';
import config from '@/payload.config';

export const revalidate = 3600;

export async function GET() {
  const payload = await getPayload({ config });
  
  // Fetch all active products
  const products = await payload.find({
    collection: 'products',
    where: {
      status: { equals: 'active' },
    },
    limit: 1000,
    depth: 1,
  });

  // Fetch all active content updates
  const updates = await payload.find({
    collection: 'contentUpdates',
    where: {
      isPublished: { equals: true },
    },
    limit: 1000,
  });

  const baseUrl = 'https://affiliate.example.com';

  const urls = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  // Add product URLs for each region
  for (const product of products.docs) {
    const slug = product.slug as string;
    for (const region of product.geoRegions || []) {
      urls.push({
        url: `${baseUrl}/products/${slug}/${(region as any).code}`,
        lastModified: new Date(product.updatedAt as string),
        changeFrequency: 'weekly',
        priority: 0.9,
      });
    }
  }

  // Add content update URLs
  for (const update of updates.docs) {
    urls.push({
      url: `${baseUrl}/updates/${(update as any).id}`,
      lastModified: new Date(update.updatedAt as string),
      changeFrequency: 'daily',
      priority: 0.6,
    });
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls
    .map(
      (url) => `
  <url>
    <loc>${url.url}</loc>
    <lastmod>${url.lastModified.toISOString().split('T')[0]}</lastmod>
    <changefreq>${url.changeFrequency}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
    )
    .join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

import { getPayload } from 'payload';
import config from '../payload.config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const distDir = path.resolve(dirname, '../dist');
const outputDir = path.resolve(distDir, 'products');

interface EnvConfig {
  PAYLOAD_SECRET: string;
}

async function generateStaticPages() {
  const payload = await getPayload({ config } as any);

  // Fetch all active products
  const products = await payload.find({
    collection: 'products',
    where: {
      status: { equals: 'active' },
    },
    limit: 1000,
    depth: 2,
  });

  // Fetch all regions
  const regions = await payload.find({
    collection: 'geoRegions',
    limit: 100,
  });

  console.log(`Found ${products.docs.length} products and ${regions.docs.length} regions`);

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  // For each product, generate pages for each region
  for (const product of products.docs) {
    const slug = product.slug as string;
    
    // Default page (redirects to best region)
    await fs.mkdir(path.join(distDir, 'products', slug), { recursive: true });
    
    // Generate region-specific pages
    for (const region of regions.docs) {
      const regionCode = region.code as string;
      const regionDir = path.join(distDir, 'products', slug, regionCode);
      await fs.mkdir(regionDir, { recursive: true });
      
      // Generate a basic HTML page for this product+region combination
      const html = await generateProductHTML(product, region);
      await fs.writeFile(path.join(regionDir, 'index.html'), html);
      
      console.log(`Generated: /products/${slug}/${regionCode}`);
    }
  }

  console.log('Static page generation complete!');
}

async function generateProductHTML(product: any, region: any): Promise<string> {
  const geoContent = product.geoContent?.find(
    (gc: any) => gc.region?.code === region.code
  );

  return `<!DOCTYPE html>
<html lang="${region.language || 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${geoContent?.localizedName || product.name} - ${region.name}</title>
  <meta name="description" content="${product.shortDescription}">
  <meta name="canonical" href="https://affiliate.example.com/products/${product.slug}/${region.code}">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${geoContent?.localizedName || product.name}">
  <meta property="og:description" content="${product.shortDescription}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="${region.language || 'en'}">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${geoContent?.localizedName || product.name}">
  <meta name="twitter:description" content="${product.shortDescription}">
  
  <!-- Hreflang -->
  <link rel="alternate" hreflang="x-default" href="https://affiliate.example.com/products/${product.slug}/${region.code}">
  
  <!-- Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "${geoContent?.localizedName || product.name}",
    "description": "${product.shortDescription.replace(/"/g, '\\"')}",
    "offers": {
      "@type": "Offer",
      "price": "${geoContent?.localizedPrice || product.pricing?.amount}",
      "priceCurrency": "${geoContent?.localizedCurrency || product.pricing?.currency}",
      "availability": "https://schema.org/InStock",
      "url": "${product.affiliateUrl}"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "${product.reviewScore}",
      "bestRating": 5
    }
  }
  </script>
</head>
<body>
  <main style="max-width: 1200px; margin: 0 auto; padding: 2rem;">
    <article>
      <header style="margin-bottom: 2rem;">
        <span style="display: inline-block; padding: 0.25rem 0.75rem; background: #dbeafe; color: #1e40af; border-radius: 9999px; font-size: 0.875rem; margin-bottom: 0.5rem;">
          ${region.name}
        </span>
        <h1 style="font-size: 2.5rem; font-weight: bold; margin-bottom: 1rem;">
          ${geoContent?.localizedName || product.name}
        </h1>
        <p style="font-size: 1.125rem; color: #6b7280; line-height: 1.6;">
          ${geoContent?.localizedDescription || product.description}
        </p>
      </header>
      
      <section style="margin-bottom: 2rem;">
        <h2 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 1rem;">Pricing</h2>
        <p style="font-size: 2rem; font-weight: 700; color: #111827;">
          ${geoContent?.localizedCurrency || product.pricing?.currency} ${geoContent?.localizedPrice || product.pricing?.amount}
        </p>
      </section>
      
      ${product.features?.length ? `
      <section style="margin-bottom: 2rem;">
        <h2 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 1rem;">Key Features</h2>
        <ul style="list-style: none; padding: 0;">
          ${product.features.map((feature: any) => `
          <li style="padding: 0.75rem 0; border-bottom: 1px solid #e5e7eb;">
            <strong>${feature.title}</strong>
            ${feature.description ? `<p style="color: #6b7280; margin-top: 0.25rem;">${feature.description}</p>` : ''}
          </li>
          `).join('')}
        </ul>
      </section>
      ` : ''}
      
      <section style="margin-top: 3rem; padding: 2rem; background: #f9fafb; border-radius: 0.5rem;">
        <h2 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 1rem;">Ready to Get Started?</h2>
        <p style="margin-bottom: 1.5rem; color: #6b7280;">
          Click below to visit the official site and get the best deal in your region.
        </p>
        <a href="${product.affiliateUrl}" 
           style="display: inline-block; padding: 0.75rem 1.5rem; background: #2563eb; color: white; text-decoration: none; border-radius: 0.375rem; font-size: 1.125rem;"
           target="_blank" rel="noopener noreferrer">
          Visit Official Site →
        </a>
      </section>
    </article>
  </main>
</body>
</html>`;
}

generateStaticPages().catch((err) => {
  console.error('Failed to generate static pages:', err);
  process.exit(1);
});

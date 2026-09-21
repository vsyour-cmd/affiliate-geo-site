import { getPayload } from 'payload';
import config from '../payload.config';

const runSeed = async () => {
  const payload = await getPayload({ config });

  console.log('Seeding database...');

  // Seed Geo Regions
  const regions = [
    { name: 'United States', code: 'us', countryCode: 'US', language: 'en', currency: 'USD', priority: 10 },
    { name: 'United Kingdom', code: 'uk', countryCode: 'GB', language: 'en', currency: 'GBP', priority: 9 },
    { name: 'China', code: 'cn', countryCode: 'CN', language: 'zh', currency: 'CNY', priority: 8 },
    { name: 'Japan', code: 'jp', countryCode: 'JP', language: 'ja', currency: 'JPY', priority: 7 },
    { name: 'Germany', code: 'de', countryCode: 'DE', language: 'de', currency: 'EUR', priority: 6 },
    { name: 'France', code: 'fr', countryCode: 'FR', language: 'fr', currency: 'EUR', priority: 5 },
    { name: 'Australia', code: 'au', countryCode: 'AU', language: 'en', currency: 'AUD', priority: 4 },
  ];

  for (const region of regions) {
    await payload.findOrCreate({
      collection: 'geoRegions',
      where: { code: { equals: region.code } },
      data: region,
    });
  }
  console.log(`Seeded ${regions.length} regions`);

  // Seed Categories
  const categories = [
    { name: 'Technology', slug: 'technology', description: 'Tech products and gadgets' },
    { name: 'Software', slug: 'software', description: 'Software tools and services' },
    { name: 'Courses', slug: 'courses', description: 'Online courses and education' },
    { name: 'Finance', slug: 'finance', description: 'Financial products and services' },
  ];

  for (const category of categories) {
    await payload.findOrCreate({
      collection: 'categories',
      where: { slug: { equals: category.slug } },
      data: category,
    });
  }
  console.log(`Seeded ${categories.length} categories`);

  // Seed Sample Products
  const techCategory = await payload.find({
    collection: 'categories',
    where: { slug: { equals: 'technology' } },
    limit: 1,
  });

  const usRegion = await payload.find({
    collection: 'geoRegions',
    where: { code: { equals: 'us' } },
    limit: 1,
  });

  if (techCategory.docs[0] && usRegion.docs[0]) {
    await payload.create({
      collection: 'products',
      data: {
        name: 'Cloudflare Pro',
        slug: 'cloudflare-pro',
        shortDescription: 'Supercharge your website with Cloudflare Pro - CDN, Security, and Performance in one package.',
        description: '<p>Cloudflare Pro provides enterprise-grade security and performance for your website. Includes CDN, DDoS protection, and advanced analytics.</p>',
        category: techCategory.docs[0].id,
        status: 'active',
        affiliateUrl: 'https://www.cloudflare.com/plans/',
        commissionRate: 15,
        pricing: { amount: 20, currency: 'USD' },
        geoRegions: [usRegion.docs[0].id],
        images: [],
        features: [
          { title: 'Global CDN', description: 'Content delivery from 300+ locations worldwide' },
          { title: 'DDoS Protection', description: 'Advanced protection against all types of DDoS attacks' },
          { title: 'Analytics', description: 'Detailed traffic and security analytics' },
        ],
        tags: [{ tag: 'cloudflare' }, { tag: 'cdn' }, { tag: 'security' }],
        reviewScore: 4.8,
        lastUpdated: new Date().toISOString(),
        geoContent: [
          {
            region: usRegion.docs[0].id,
            localizedName: 'Cloudflare Pro',
            localizedDescription: '<p>Supercharge your website with Cloudflare Pro - CDN, Security, and Performance in one package.</p>',
            localizedPrice: 20,
            localizedCurrency: 'USD',
          },
        ],
      },
    });
    console.log('Seeded sample product: Cloudflare Pro');
  }

  console.log('Database seeding complete!');
  process.exit(0);
};

runSeed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

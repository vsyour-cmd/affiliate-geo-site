import { getPayload } from 'payload';
import config from '../payload.config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

interface DailyUpdateConfig {
  PAYLOAD_SECRET: string;
}

async function runDailyUpdate() {
  const payload = await getPayload({ config } as any);
  
  console.log('Starting daily content update...');

  // 1. Fetch published content updates
  const updates = await payload.find({
    collection: 'contentUpdates',
    where: {
      isPublished: { equals: true },
      publishDate: { less_than_equal: new Date().toISOString() },
    },
    limit: 100,
    depth: 1,
  });

  console.log(`Found ${updates.docs.length} published content updates`);

  // 2. Process each update
  for (const update of updates.docs) {
    console.log(`Processing update: ${update.title}`);

    // Update related products
    if (update.relatedProducts?.length) {
      for (const productId of update.relatedProducts) {
        await payload.update({
          collection: 'products',
          id: productId,
          data: {
            lastUpdated: new Date().toISOString(),
            description: update.content,
          } as any,
        });
        console.log(`  Updated product: ${productId}`);
      }
    }

    // Mark update as processed
    await payload.update({
      collection: 'contentUpdates',
      id: update.id,
      data: {
        isPublished: true,
      } as any,
    });
  }

  // 3. Generate updated static pages for affected products
  console.log('Regenerating static pages...');
  const distDir = path.resolve(dirname, '../dist/products');
  await fs.mkdir(distDir, { recursive: true });

  // In a real implementation, you would regenerate only affected pages
  // For now, we'll just log that regeneration is needed
  console.log('Static page regeneration needed. Run build to regenerate.');

  console.log('Daily update complete!');
}

runDailyUpdate().catch((err) => {
  console.error('Daily update failed:', err);
  process.exit(1);
});

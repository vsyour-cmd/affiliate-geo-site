import { buildConfig } from 'payload';
import { sqlite } from 'payload';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { seoPlugin } from '@payloadcms/plugin-seo';
import path from 'path';
import { fileURLToPath } from 'url';

import { Products } from './src/collections/Products';
import { Categories } from './src/collections/Categories';
import { GeoRegions } from './src/collections/GeoRegions';
import { ContentUpdates } from './src/collections/ContentUpdates';
import { Media } from './src/collections/Media';
import { Global } from './src/collections/Global';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: 'admin',
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Products,
    Categories,
    GeoRegions,
    ContentUpdates,
    Media,
    Global,
  ],
  editor: lexicalEditor,
  secret: process.env.PAYLOAD_SECRET || 'your-secret-key-here',
  typescript: {
    outputFile: path.resolve(dirname, 'src/types/payload-types.ts'),
  },
  db: sqlite({
    database: path.resolve(dirname, '.payload/db.sqlite'),
  }),
  plugins: [
    seoPlugin({
      collections: ['products', 'categories'],
      globals: ['global'],
      generateTitle: ({ doc }) => {
        return doc?.seo?.title || doc?.name || 'Affiliate Marketplace';
      },
      generateDescription: ({ doc }) => {
        return doc?.seo?.description || doc?.shortDescription || '';
      },
    }),
  ],
  cors: ['*'],
});

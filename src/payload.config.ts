import fs from 'fs'
import path from 'path'
import { getCloudflareContext, type CloudflareContext } from '@opennextjs/cloudflare'
import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { r2Storage } from '@payloadcms/storage-r2'
import { buildConfig } from 'payload'
import type { GetPlatformProxyOptions } from 'wrangler'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Articles } from './collections/Articles'
import { ContentUpdates } from './collections/ContentUpdates'
import { GeoRegions } from './collections/GeoRegions'
import { Global } from './collections/Global'
import { Media } from './collections/Media'
import { Products } from './collections/Products'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const realpath = (value: string) => {
  try {
    return fs.existsSync(value) ? fs.realpathSync(value) : undefined
  } catch {
    return undefined
  }
}

const isCLI = process.argv.some((value) => {
  const resolved = realpath(value)
  return Boolean(
    resolved &&
      (resolved.endsWith(path.join('payload', 'bin.js')) ||
        resolved.endsWith(path.join('next', 'dist', 'bin', 'next')) ||
        resolved.endsWith(path.join('scripts', 'seed.ts')) ||
        resolved.endsWith(path.join('scripts', 'daily-update.ts')) ||
        resolved.endsWith(path.join('scripts', 'daily-publish-ai.ts')) ||
        resolved.endsWith(path.join('scripts', 'verify-daily-publish.ts'))),
  )
})
const isProduction = process.env.NODE_ENV === 'production'
const useLocalBuildBindings = process.env.PAYLOAD_BUILD_LOCAL === '1'
const cloudflare =
  isCLI || !isProduction || useLocalBuildBindings
    ? await getCloudflareContextFromWrangler()
    : await getCloudflareContext({ async: true })

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
  },
  collections: [Users, Products, Categories, GeoRegions, Articles, ContentUpdates, Media],
  globals: [Global],
  editor: lexicalEditor(),
  localization: {
    locales: ['en', 'zh', 'ja', 'de', 'fr'],
    defaultLocale: 'en',
    fallback: true,
  },
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: sqliteD1Adapter({ binding: cloudflare.env.D1, push: false }),
  plugins: [
    r2Storage({ bucket: cloudflare.env.R2, collections: { media: true } }),
    seoPlugin({
      collections: ['products', 'categories'],
      globals: ['global'],
      generateTitle: ({ doc }) => doc?.seo?.title || doc?.name || 'Affiliate Marketplace',
      generateDescription: ({ doc }) => doc?.seo?.description || doc?.shortDescription || '',
    }),
  ],
})

function getCloudflareContextFromWrangler(): Promise<CloudflareContext> {
  return import(/* webpackIgnore: true */ `${'__wrangler'.replaceAll('_', '')}`).then(
    ({ getPlatformProxy }) =>
      getPlatformProxy({
        environment: process.env.CLOUDFLARE_ENV,
        remoteBindings: isProduction && !useLocalBuildBindings,
      } satisfies GetPlatformProxyOptions),
  )
}

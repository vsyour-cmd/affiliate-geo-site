import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'

const countryToRegion: Record<string, string> = { AU:'au', CN:'cn', DE:'de', FR:'fr', GB:'uk', JP:'jp', US:'us' }

export const dynamic = 'force-dynamic'

export default async function ProductRedirectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayload({ config })
  const result = await payload.find({ collection: 'products', where: { and: [{ slug: { equals: slug } }, { status: { equals: 'active' } }] }, limit: 1, depth: 1 })
  const product = result.docs[0]
  if (!product) notFound()

  const regionCodes = (product.geoRegions || []).map((item) => typeof item === 'object' ? item.code : null).filter(Boolean) as string[]
  if (!regionCodes.length) notFound()
  const country = (await headers()).get('cf-ipcountry')?.toUpperCase() || 'US'
  const preferred = countryToRegion[country]
  redirect(`/products/${slug}/${preferred && regionCodes.includes(preferred) ? preferred : regionCodes[0]}`)
}

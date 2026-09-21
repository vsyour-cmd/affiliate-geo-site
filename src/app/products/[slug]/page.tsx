import { notFound, redirect } from 'next/navigation';
import { getPayload } from 'payload';
import config from '@/payload.config';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
  const payload = await getPayload({ config });
  const response = await payload.find({
    collection: 'products',
    where: {
      slug: { equals: slug },
      status: { equals: 'active' },
    },
    limit: 1,
  });
  return response.docs[0];
}

function getBestRegionForProduct(product: any) {
  // Default to the first geo region or 'global'
  return product.geoRegions?.[0]?.code || 'global';
}

export const revalidate = 3600;

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const bestRegion = getBestRegionForProduct(product);
  
  // Redirect to the best region for this product
  redirect(`/products/${slug}/${bestRegion}`);

  // This will never render due to redirect
  return null;
}

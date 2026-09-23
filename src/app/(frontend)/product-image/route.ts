import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_HOSTS = new Set(['www.digistore24-app.com', 'digistore24-app.com'])
const ALLOWED_TYPES = new Set(['image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/webp'])

function allowedSource(value: string | null) {
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.hostname.toLowerCase()) || !url.pathname.startsWith('/pb/img/')) return null
    url.username = ''
    url.password = ''
    url.hash = ''
    return url
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const source = allowedSource(request.nextUrl.searchParams.get('url'))
  if (!source) return NextResponse.json({ error: 'Invalid product image URL' }, { status: 400 })

  const upstream = await fetch(source, {
    headers: { accept: 'image/avif,image/webp,image/png,image/jpeg,image/gif;q=0.8,*/*;q=0.1', 'user-agent': 'AffiliateGeoImageProxy/1.0' },
    redirect: 'follow',
    signal: AbortSignal.timeout(15_000),
  })
  const contentType = upstream.headers.get('content-type')?.split(';', 1)[0].toLowerCase() || ''
  if (!upstream.ok || !upstream.body || !ALLOWED_TYPES.has(contentType)) {
    return NextResponse.json({ error: 'Product image unavailable' }, { status: 502 })
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      'cache-control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000',
      'content-type': contentType,
      'x-content-type-options': 'nosniff',
    },
  })
}


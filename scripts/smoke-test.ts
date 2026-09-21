const baseURL = (process.env.SMOKE_BASE_URL || 'http://127.0.0.1:8787').replace(/\/$/, '')

const routes = [
  ['/', 200],
  ['/products', 200],
  ['/articles', 200],
  ['/products/cloudflare-pro/us', 200],
  ['/admin', 200],
  ['/api/products?limit=1', 200],
  ['/sitemap.xml', 200],
  ['/robots.txt', 200],
  ['/affiliate-disclosure', 200],
  ['/privacy', 200],
  ['/does-not-exist', 404],
] as const

async function run() {
  for (const [path, expected] of routes) {
    const response = await fetch(`${baseURL}${path}`, { redirect: 'manual' })
    if (response.status !== expected) throw new Error(`${path}: expected ${expected}, received ${response.status}`)
    console.log(`PASS ${response.status} ${path}`)
  }

  const geoResponse = await fetch(`${baseURL}/products/cloudflare-pro`, { headers: { 'cf-ipcountry': 'DE' }, redirect: 'manual' })
  if (geoResponse.status !== 307 || geoResponse.headers.get('location') !== '/products/cloudflare-pro/us') {
    throw new Error(`GEO fallback failed: ${geoResponse.status} ${geoResponse.headers.get('location')}`)
  }
  console.log('PASS GEO fallback → /products/cloudflare-pro/us')

  const homeResponse = await fetch(`${baseURL}/`)
  if (!(await homeResponse.text()).includes('Cloudflare Pro')) throw new Error('Seeded product is missing from the home page')
  const apiResponse = await fetch(`${baseURL}/api/products?limit=1`)
  const apiData = await apiResponse.json() as { docs?: unknown[] }
  if (!apiData.docs?.length) throw new Error('Products API returned no documents')
  const articleResponse = await fetch(`${baseURL}/api/articles?where[status][equals]=published&limit=1`)
  const articleData = await articleResponse.json() as { docs?: Array<{ slug?: string }> }
  const articleSlug = articleData.docs?.[0]?.slug
  if (articleSlug) {
    const publicArticle = await fetch(`${baseURL}/articles/${articleSlug}`)
    if (publicArticle.status !== 200) throw new Error(`Published article page returned ${publicArticle.status}`)
    console.log(`PASS published article /articles/${articleSlug}`)
  }
  console.log('PASS seeded content visible in HTML and API')
}

run().catch((error) => { console.error(error); process.exit(1) })

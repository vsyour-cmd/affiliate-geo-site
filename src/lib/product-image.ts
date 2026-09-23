const PROXIED_IMAGE_HOSTS = new Set(['www.digistore24-app.com', 'digistore24-app.com'])

export function productImageSrc(value?: string | null) {
  if (!value) return undefined
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return undefined
    if (PROXIED_IMAGE_HOSTS.has(url.hostname.toLowerCase()) && url.pathname.startsWith('/pb/img/')) {
      return `/product-image?url=${encodeURIComponent(url.toString())}`
    }
    return url.toString()
  } catch {
    return undefined
  }
}


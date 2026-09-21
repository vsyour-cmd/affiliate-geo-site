import { getPayload } from 'payload';
import config from '../../payload.config';

interface Env {
  PAYLOAD_SECRET: string;
}

interface Context {
  request: Request;
  env: Env;
  waitUntil: (promise: Promise<any>) => void;
  next: (input?: Request | string) => Promise<Response>;
  cf: any;
}

export async function onRequest(context: Context) {
  const { request, cf, next } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Only apply to product pages
  const productMatch = pathname.match(/^\/products\/([^\/]+)$/);
  if (productMatch) {
    const slug = productMatch[1];
    
    // Detect region from Cloudflare headers
    const countryCode = cf?.country?.toLowerCase() || 'us';
    
    // Map country codes to region codes (simplified)
    const countryToRegion: Record<string, string> = {
      'cn': 'cn',
      'us': 'us',
      'gb': 'uk',
      'jp': 'jp',
      'de': 'de',
      'fr': 'fr',
      'au': 'au',
    };
    
    const region = countryToRegion[countryCode] || 'us';
    
    // Check if the region-specific page exists by trying to fetch it
    // For static sites, we'll assume it exists and redirect
    const newUrl = `${url.origin}/products/${slug}/${region}`;
    
    return Response.redirect(newUrl, 302);
  }

  return next();
}

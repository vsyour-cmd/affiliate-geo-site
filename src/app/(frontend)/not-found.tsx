import Link from 'next/link'
export default function NotFound() { return <main className="content"><span className="eyebrow">404</span><h1>Page not found</h1><p>The requested page or regional offer is not available.</p><Link className="button" href="/products">Browse products</Link></main> }

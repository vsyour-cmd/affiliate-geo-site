import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import './globals.css'

const siteURL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteURL),
  title: { default: 'Affiliate Marketplace', template: '%s | Affiliate Marketplace' },
  description: 'Independent product comparisons and region-aware affiliate offers.',
}

export default function FrontendLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <header className="site-header">
          <div className="shell nav-row">
            <Link className="brand" href="/">Affiliate Marketplace</Link>
            <nav aria-label="Primary navigation">
              <Link href="/products">Products</Link>
              <Link href="/articles">Articles</Link>
              <Link href="/affiliate-disclosure">Disclosure</Link>
              <Link href="/privacy">Privacy</Link>
            </nav>
          </div>
        </header>
        <div id="main-content">{children}</div>
        <footer className="site-footer">
          <div className="shell footer-row">
            <span>© {new Date().getFullYear()} Affiliate Marketplace</span>
            <span>Independent research. Some links may earn us a commission.</span>
          </div>
        </footer>
      </body>
    </html>
  )
}

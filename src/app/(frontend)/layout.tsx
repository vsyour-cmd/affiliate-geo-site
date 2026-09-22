import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { getLanguage, getMessages } from '@/lib/i18n'
import './globals.css'

const siteURL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteURL),
  title: { default: 'Affiliate Marketplace', template: '%s | Affiliate Marketplace' },
  description: 'Independent product comparisons and region-aware affiliate offers.',
}

export default async function FrontendLayout({ children }: { children: ReactNode }) {
  const language = await getLanguage()
  const t = getMessages(language)
  return (
    <html lang={language}>
      <body>
        <a className="skip-link" href="#main-content">{t.skip}</a>
        <header className="site-header">
          <div className="shell nav-row">
            <Link className="brand" href="/">Affiliate Marketplace</Link>
            <nav aria-label="Primary navigation">
              <Link href="/products">{t.products}</Link>
              <Link href="/articles">{t.articles}</Link>
              <Link href="/affiliate-disclosure">{t.disclosure}</Link>
              <Link href="/privacy">{t.privacy}</Link>
              <LanguageSwitcher current={language} label={t.language} />
            </nav>
          </div>
        </header>
        <div id="main-content">{children}</div>
        <footer className="site-footer">
          <div className="shell footer-row">
            <span>© {new Date().getFullYear()} Affiliate Marketplace</span>
            <span>{t.footer}</span>
          </div>
        </footer>
      </body>
    </html>
  )
}

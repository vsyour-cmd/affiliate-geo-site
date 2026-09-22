import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getLanguage, getMessages, localeTag } from '@/lib/i18n'

export const metadata: Metadata = { title: 'Articles', description: 'Practical product explainers, comparisons, and buying considerations.' }
export const dynamic = 'force-dynamic'

export default async function ArticlesPage() {
  const language = await getLanguage()
  const t = getMessages(language)
  const payload = await getPayload({ config })
  const articles = await payload.find({ collection: 'articles', where: { status: { equals: 'published' } }, limit: 50, sort: '-publishedAt', depth: 1, locale: language })
  return <main className="section shell"><div className="section-head"><div><span className="eyebrow">{t.editorial}</span><h1 className="page-title">{t.practicalGuides}</h1><p className="section-intro">{t.guidesIntro}</p></div></div>{articles.docs.length ? <div className="grid article-grid">{articles.docs.map((article) => { const product = typeof article.relatedProduct === 'object' ? article.relatedProduct : null; return <Link className="card article-card" href={`/articles/${article.slug}`} key={article.id}>{product?.marketplaceImageUrl ? <div className="card-media"><img src={product.marketplaceImageUrl} alt="" loading="lazy" /></div> : <div className="card-media card-media-fallback" aria-hidden="true"><span>AI</span></div>}<span className="badge">{article.aiGenerated ? t.aiChecked : t.editorialLabel}</span><h2>{article.title}</h2><p>{article.excerpt}</p><small>{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString(localeTag(language)) : ''}</small></Link> })}</div> : <div className="empty">{t.noArticles}</div>}</main>
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'

export const metadata: Metadata = { title: 'Articles', description: 'Practical product explainers, comparisons, and buying considerations.' }
export const dynamic = 'force-dynamic'

export default async function ArticlesPage() {
  const payload = await getPayload({ config })
  const articles = await payload.find({ collection: 'articles', where: { status: { equals: 'published' } }, limit: 50, sort: '-publishedAt', depth: 1 })
  return <main className="section shell"><div className="section-head"><div><span className="eyebrow">Editorial library</span><h1 style={{fontSize:'3rem'}}>Articles</h1></div></div>{articles.docs.length ? <div className="grid">{articles.docs.map((article) => <Link className="card" href={`/articles/${article.slug}`} key={article.id}><span className="badge">{article.aiGenerated ? 'AI assisted' : 'Editorial'}</span><h2>{article.title}</h2><p>{article.excerpt}</p><small>{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-US') : ''}</small></Link>)}</div> : <div className="empty">No published articles yet.</div>}</main>
}

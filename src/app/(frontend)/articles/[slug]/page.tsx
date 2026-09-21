import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { getPayload } from 'payload'
import config from '@payload-config'

type Props = { params: Promise<{ slug: string }> }

async function loadArticle(slug: string) {
  const payload = await getPayload({ config })
  const result = await payload.find({ collection: 'articles', where: { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }] }, limit: 1, depth: 2 })
  return result.docs[0] || null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await loadArticle((await params).slug)
  if (!article) return { title: 'Article not found' }
  return { title: article.title, description: article.excerpt, robots: article.indexable ? { index: true, follow: true } : { index: false, follow: true }, alternates: { canonical: `/articles/${article.slug}` } }
}

export const dynamic = 'force-dynamic'

export default async function ArticlePage({ params }: Props) {
  const article = await loadArticle((await params).slug)
  if (!article) notFound()
  const product = typeof article.relatedProduct === 'object' ? article.relatedProduct : null
  return <main className="content article"><span className="eyebrow">{article.aiGenerated ? 'AI-assisted editorial' : 'Editorial'}</span><h1 style={{fontSize:'clamp(2.4rem,6vw,4.2rem)'}}>{article.title}</h1><p className="lede">{article.excerpt}</p><div className="article-meta"><span>{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-US') : ''}</span>{article.aiGenerated ? <span>Quality score: {article.qualityScore}/100</span> : null}</div><RichText data={article.content} />{product ? <aside className="article-cta"><h2>Explore {product.name}</h2><p>{product.shortDescription}</p><Link className="button" href={`/products/${product.slug}`}>View product details</Link></aside> : null}</main>
}

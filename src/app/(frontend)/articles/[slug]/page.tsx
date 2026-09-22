import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getLanguage, getMessages, localeTag } from '@/lib/i18n'

type Props = { params: Promise<{ slug: string }> }

async function loadArticle(slug: string) {
  const language = await getLanguage()
  const payload = await getPayload({ config })
  const result = await payload.find({ collection: 'articles', where: { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }] }, limit: 1, depth: 2, locale: language })
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
  const language = await getLanguage()
  const t = getMessages(language)
  return <main className="content article"><span className="eyebrow">{t.editorialLabel}</span><h1>{article.title}</h1><p className="lede">{article.excerpt}</p><div className="article-meta"><span>{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString(localeTag(language)) : ''}</span><span>{t.included}</span></div>{product?.marketplaceImageUrl ? <figure className="article-hero"><img src={product.marketplaceImageUrl} alt={`${product.name} product illustration`} /><figcaption>{t.imageCaption}</figcaption></figure> : null}<div className="article-body"><RichText data={article.content} /></div>{product ? <aside className="article-cta"><span className="eyebrow">{t.related}</span><h2>{t.exploreProduct} {product.name}</h2><p>{product.shortDescription}</p><Link className="button" href={`/products/${product.slug}`}>{t.viewProduct}</Link></aside> : null}</main>
}

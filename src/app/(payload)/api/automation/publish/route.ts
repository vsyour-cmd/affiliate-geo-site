import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { isAutomationAuthorized } from '@/lib/automation-auth'

type PublishBody = {
  title: string
  slug: string
  excerpt: string
  content: Record<string, unknown>
  productId: number
  categoryId?: number
  automationKey: string
  model: string
  promptVersion: string
  qualityScore: number
  qualityNotes: string[]
  sourceSnapshot: Record<string, unknown>
  publishedAt: string
}

export async function POST(request: NextRequest) {
  if (!(await isAutomationAuthorized(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json() as Partial<PublishBody>
  if (!body.title || !body.slug || !body.excerpt || !body.content || typeof body.productId !== 'number' || !body.automationKey || !body.model || !body.publishedAt || typeof body.qualityScore !== 'number' || body.qualityScore < 85) return NextResponse.json({ error: 'Invalid or low-quality article payload' }, { status: 400 })
  const payload = await getPayload({ config })
  const existing = await payload.find({ collection: 'articles', where: { automationKey: { equals: body.automationKey } }, limit: 1 })
  if (existing.docs[0]) return NextResponse.json({ status: 'existing', article: existing.docs[0] })
  const created = await payload.create({ collection: 'articles', overrideAccess: true, data: {
    title: body.title, slug: body.slug, excerpt: body.excerpt, content: body.content as never,
    relatedProduct: body.productId, ...(body.categoryId ? { category: body.categoryId } : {}),
    status: 'published', publishedAt: body.publishedAt, automationKey: body.automationKey,
    aiGenerated: true, aiModel: body.model, promptVersion: body.promptVersion || 'unknown', qualityScore: body.qualityScore,
    qualityNotes: (body.qualityNotes || []).map((note) => ({ note })), sourceSnapshot: body.sourceSnapshot,
    indexable: true, monetizable: false, reviewStatus: 'autoPublished',
  } })
  return NextResponse.json({ status: 'published', article: created }, { status: 201 })
}

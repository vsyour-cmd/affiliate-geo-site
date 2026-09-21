import fs from 'fs/promises'
import path from 'path'
import { getPayload } from 'payload'
import config from '../src/payload.config'

async function run() {
  if (process.env.PUBLISH_API_URL) {
    const baseURL = process.env.PUBLISH_API_URL.replace(/\/$/, '')
    const date = new Date().toISOString().slice(0, 10)
    const start = `${date}T00:00:00.000Z`
    const end = `${date}T23:59:59.999Z`
    const automationSecret = process.env.AUTOMATION_SECRET
    if (!automationSecret) throw new Error('AUTOMATION_SECRET is required for remote verification')
    const response = await fetch(new URL('/automation/context', baseURL), {
      headers: {
        'accept': 'application/json',
        'user-agent': 'Mozilla/5.0 (compatible; AffiliateGeoPublisher/1.0)',
        'x-automation-secret': automationSecret,
      },
    })
    if (!response.ok) throw new Error(`Automation context API returned ${response.status}`)
    const context = await response.json() as { articles: Array<Record<string, any>> }
    const articles = context.articles.filter((article) => article.aiGenerated === true && article.publishedAt >= start && article.publishedAt <= end)
    const verification = { date, publishedCount: articles.length, articles: articles.map((article) => ({ id: article.id, slug: article.slug, title: article.title, publishedAt: article.publishedAt, qualityScore: article.qualityScore, model: article.aiModel })) }
    await fs.mkdir(path.resolve('artifacts'), { recursive: true })
    await fs.writeFile(path.resolve('artifacts/daily-publish-verification.json'), `${JSON.stringify(verification, null, 2)}\n`, 'utf8')
    console.log(JSON.stringify({ event: 'daily-publish-verified', ...verification }))
    if (articles.length !== 1) throw new Error(`Expected exactly one AI article for ${date}, found ${articles.length}`)
    process.exit(0)
  }
  const payload = await getPayload({ config })
  const date = new Date().toISOString().slice(0, 10)
  const start = `${date}T00:00:00.000Z`
  const end = `${date}T23:59:59.999Z`
  const result = await payload.find({ collection: 'articles', where: { and: [{ aiGenerated: { equals: true } }, { status: { equals: 'published' } }, { publishedAt: { greater_than_equal: start } }, { publishedAt: { less_than_equal: end } }] }, limit: 10, sort: '-publishedAt' })
  const verification = { date, publishedCount: result.docs.length, articles: result.docs.map((article) => ({ id: article.id, slug: article.slug, title: article.title, publishedAt: article.publishedAt, qualityScore: article.qualityScore, model: article.aiModel })) }
  await fs.mkdir(path.resolve('artifacts'), { recursive: true })
  await fs.writeFile(path.resolve('artifacts/daily-publish-verification.json'), `${JSON.stringify(verification, null, 2)}\n`, 'utf8')
  console.log(JSON.stringify({ event: 'daily-publish-verified', ...verification }))
  if (result.docs.length !== 1) throw new Error(`Expected exactly one AI article for ${date}, found ${result.docs.length}`)
  process.exit(0)
}

run().catch((error) => { console.error(error); process.exit(1) })

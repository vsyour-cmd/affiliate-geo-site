import { getPayload } from 'payload'
import config from '../src/payload.config'

async function runDailyUpdate() {
  const payload = await getPayload({ config })
  const now = new Date().toISOString()
  const updates = await payload.find({ collection: 'contentUpdates', where: { and: [{ isPublished: { equals: true } }, { publishDate: { less_than_equal: now } }, { processedAt: { exists: false } }] }, limit: 100, depth: 1 })
  console.log(JSON.stringify({ event: 'daily-update-start', count: updates.docs.length }))
  let updatedProducts = 0
  for (const update of updates.docs) {
    try {
      for (const relatedProduct of update.relatedProducts || []) {
        const productID = typeof relatedProduct === 'object' ? relatedProduct.id : relatedProduct
        await payload.update({ collection: 'products', id: productID, data: { lastUpdated: now, ...(update.content ? { description: update.content } : {}) } })
        updatedProducts += 1
      }
      await payload.update({ collection: 'contentUpdates', id: update.id, data: { processedAt: now } })
      console.log(JSON.stringify({ event: 'content-update-processed', id: update.id }))
    } catch (error) {
      console.error(JSON.stringify({ event: 'content-update-failed', id: update.id, error: error instanceof Error ? error.message : String(error) }))
      throw error
    }
  }
  console.log(JSON.stringify({ event: 'daily-update-complete', processed: updates.docs.length, updatedProducts }))
  process.exit(0)
}

runDailyUpdate().catch((error) => { console.error(error); process.exit(1) })

import fs from 'fs/promises'
import path from 'path'

const migrations = [
  { source: 'src/migrations/20260921_021904.ts', output: 'migrations/0001_initial.sql', name: '20260921_021904', batch: 1 },
  { source: 'src/migrations/20260921_025320.ts', output: 'migrations/0002_add_articles.sql', name: '20260921_025320', batch: 2 },
  { source: 'src/migrations/20260921_041748_digistore_catalog_fields.ts', output: 'migrations/0003_digistore_catalog_fields.sql', name: '20260921_041748_digistore_catalog_fields', batch: 3 },
]

async function run() {
  await fs.mkdir(path.resolve('migrations'), { recursive: true })
  for (const migration of migrations) {
    const source = await fs.readFile(path.resolve(migration.source), 'utf8')
    const upStart = source.indexOf('export async function up')
    const downStart = source.indexOf('export async function down')
    if (upStart < 0 || downStart < 0) throw new Error(`Cannot locate migration functions in ${migration.source}`)
    const upBody = source.slice(upStart, downStart)
    const statements = [...upBody.matchAll(/db\.run\(sql`((?:\\`|[^`])*)`\)/g)].map((match) => match[1].replace(/\\`/g, '`').trim())
    if (!statements.length) throw new Error(`No SQL statements found in ${migration.source}`)
    if (statements.some((statement) => !statement.endsWith(';'))) throw new Error(`Incomplete SQL statement exported from ${migration.source}`)
    statements.push(`INSERT INTO payload_migrations (name, batch, updated_at, created_at) VALUES ('${migration.name}', ${migration.batch}, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));`)
    const sql = `-- Generated from ${migration.source}. Do not edit manually.\n${statements.join('\n\n')}\n`
    await fs.writeFile(path.resolve(migration.output), sql, 'utf8')
    console.log(`Generated ${migration.output} (${statements.length} statements)`)
  }
}

run().catch((error) => { console.error(error); process.exit(1) })

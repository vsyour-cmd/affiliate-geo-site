import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`products_images_locales_parent_id_idx\` ON \`products_images_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`products_features_locales_parent_id_idx\` ON \`products_features_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`products_geo_content_locales_parent_id_idx\` ON \`products_geo_content_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`products_locales_parent_id_idx\` ON \`products_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`categories_locales_parent_id_idx\` ON \`categories_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`geo_regions_locales_parent_id_idx\` ON \`geo_regions_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`content_updates_locales_parent_id_idx\` ON \`content_updates_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`global_locales_parent_id_idx\` ON \`global_locales\` (\`_parent_id\`);`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`products_images_locales_parent_id_idx\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`products_features_locales_parent_id_idx\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`products_geo_content_locales_parent_id_idx\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`products_locales_parent_id_idx\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`categories_locales_parent_id_idx\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`geo_regions_locales_parent_id_idx\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`content_updates_locales_parent_id_idx\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`global_locales_parent_id_idx\`;`)
}

-- Generated from src/migrations/20260922_000001_locale_parent_indexes.ts. Do not edit manually.
CREATE INDEX IF NOT EXISTS `products_images_locales_parent_id_idx` ON `products_images_locales` (`_parent_id`);

CREATE INDEX IF NOT EXISTS `products_features_locales_parent_id_idx` ON `products_features_locales` (`_parent_id`);

CREATE INDEX IF NOT EXISTS `products_geo_content_locales_parent_id_idx` ON `products_geo_content_locales` (`_parent_id`);

CREATE INDEX IF NOT EXISTS `products_locales_parent_id_idx` ON `products_locales` (`_parent_id`);

CREATE INDEX IF NOT EXISTS `categories_locales_parent_id_idx` ON `categories_locales` (`_parent_id`);

CREATE INDEX IF NOT EXISTS `geo_regions_locales_parent_id_idx` ON `geo_regions_locales` (`_parent_id`);

CREATE INDEX IF NOT EXISTS `content_updates_locales_parent_id_idx` ON `content_updates_locales` (`_parent_id`);

CREATE INDEX IF NOT EXISTS `global_locales_parent_id_idx` ON `global_locales` (`_parent_id`);

INSERT INTO payload_migrations (name, batch, updated_at, created_at) VALUES ('20260922_000001_locale_parent_indexes', 4, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

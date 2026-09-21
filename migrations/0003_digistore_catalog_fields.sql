-- Generated from src/migrations/20260921_041748_digistore_catalog_fields.ts. Do not edit manually.
ALTER TABLE `products` ADD `source` text DEFAULT 'manual';

ALTER TABLE `products` ADD `source_id` text;

ALTER TABLE `products` ADD `product_id` numeric;

ALTER TABLE `products` ADD `vendor_id` numeric;

ALTER TABLE `products` ADD `vendor_name` text;

ALTER TABLE `products` ADD `sales_page_url` text;

ALTER TABLE `products` ADD `affiliate_support_page_url` text;

ALTER TABLE `products` ADD `marketplace_image_url` text;

ALTER TABLE `products` ADD `accepts_affiliations_automatically` integer DEFAULT false;

ALTER TABLE `products` ADD `approval_status` text;

ALTER TABLE `products` ADD `billing_types` text;

ALTER TABLE `products` ADD `commission_fixed` numeric;

ALTER TABLE `products` ADD `conversion_rate` numeric;

ALTER TABLE `products` ADD `cancel_rate` numeric;

ALTER TABLE `products` ADD `earnings_per_sale` numeric;

ALTER TABLE `products` ADD `earnings_per_orderform_click` numeric;

ALTER TABLE `products` ADD `sales_rank` numeric;

ALTER TABLE `products` ADD `source_status` text DEFAULT 'active';

ALTER TABLE `products` ADD `last_seen_at` text;

ALTER TABLE `products` ADD `source_data` text;

CREATE INDEX `products_source_idx` ON `products` (`source`);

CREATE UNIQUE INDEX `products_source_id_idx` ON `products` (`source_id`);

CREATE INDEX `products_product_id_idx` ON `products` (`product_id`);

CREATE INDEX `products_sales_rank_idx` ON `products` (`sales_rank`);

CREATE INDEX `products_source_status_idx` ON `products` (`source_status`);

CREATE INDEX `products_last_seen_at_idx` ON `products` (`last_seen_at`);

INSERT INTO payload_migrations (name, batch, updated_at, created_at) VALUES ('20260921_041748_digistore_catalog_fields', 3, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

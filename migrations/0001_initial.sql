-- Generated from src/migrations/20260921_021904.ts. Do not edit manually.
CREATE TABLE `users_sessions` (
  	`_order` integer NOT NULL,
  	`_parent_id` integer NOT NULL,
  	`id` text PRIMARY KEY NOT NULL,
  	`created_at` text,
  	`expires_at` text NOT NULL,
  	FOREIGN KEY (`_parent_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
  );

CREATE INDEX `users_sessions_order_idx` ON `users_sessions` (`_order`);

CREATE INDEX `users_sessions_parent_id_idx` ON `users_sessions` (`_parent_id`);

CREATE TABLE `users` (
  	`id` integer PRIMARY KEY NOT NULL,
  	`name` text,
  	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	`email` text NOT NULL,
  	`reset_password_token` text,
  	`reset_password_expiration` text,
  	`salt` text,
  	`hash` text,
  	`reset_password_requested_at` text,
  	`login_attempts` numeric DEFAULT 0,
  	`lock_until` text
  );

CREATE INDEX `users_updated_at_idx` ON `users` (`updated_at`);

CREATE INDEX `users_created_at_idx` ON `users` (`created_at`);

CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);

CREATE TABLE `products_images` (
  	`_order` integer NOT NULL,
  	`_parent_id` integer NOT NULL,
  	`id` text PRIMARY KEY NOT NULL,
  	`image_id` integer,
  	FOREIGN KEY (`image_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (`_parent_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
  );

CREATE INDEX `products_images_order_idx` ON `products_images` (`_order`);

CREATE INDEX `products_images_parent_id_idx` ON `products_images` (`_parent_id`);

CREATE INDEX `products_images_image_idx` ON `products_images` (`image_id`);

CREATE TABLE `products_images_locales` (
  	`alt` text,
  	`id` integer PRIMARY KEY NOT NULL,
  	`_locale` text NOT NULL,
  	`_parent_id` text NOT NULL,
  	FOREIGN KEY (`_parent_id`) REFERENCES `products_images`(`id`) ON UPDATE no action ON DELETE cascade
  );

CREATE UNIQUE INDEX `products_images_locales_locale_parent_id_unique` ON `products_images_locales` (`_locale`,`_parent_id`);

CREATE TABLE `products_features` (
  	`_order` integer NOT NULL,
  	`_parent_id` integer NOT NULL,
  	`id` text PRIMARY KEY NOT NULL,
  	FOREIGN KEY (`_parent_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
  );

CREATE INDEX `products_features_order_idx` ON `products_features` (`_order`);

CREATE INDEX `products_features_parent_id_idx` ON `products_features` (`_parent_id`);

CREATE TABLE `products_features_locales` (
  	`title` text NOT NULL,
  	`description` text,
  	`id` integer PRIMARY KEY NOT NULL,
  	`_locale` text NOT NULL,
  	`_parent_id` text NOT NULL,
  	FOREIGN KEY (`_parent_id`) REFERENCES `products_features`(`id`) ON UPDATE no action ON DELETE cascade
  );

CREATE UNIQUE INDEX `products_features_locales_locale_parent_id_unique` ON `products_features_locales` (`_locale`,`_parent_id`);

CREATE TABLE `products_tags` (
  	`_order` integer NOT NULL,
  	`_parent_id` integer NOT NULL,
  	`id` text PRIMARY KEY NOT NULL,
  	`tag` text,
  	FOREIGN KEY (`_parent_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
  );

CREATE INDEX `products_tags_order_idx` ON `products_tags` (`_order`);

CREATE INDEX `products_tags_parent_id_idx` ON `products_tags` (`_parent_id`);

CREATE TABLE `products_geo_content` (
  	`_order` integer NOT NULL,
  	`_parent_id` integer NOT NULL,
  	`id` text PRIMARY KEY NOT NULL,
  	`region_id` integer NOT NULL,
  	`localized_price` numeric,
  	`localized_currency` text,
  	FOREIGN KEY (`region_id`) REFERENCES `geo_regions`(`id`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (`_parent_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
  );

CREATE INDEX `products_geo_content_order_idx` ON `products_geo_content` (`_order`);

CREATE INDEX `products_geo_content_parent_id_idx` ON `products_geo_content` (`_parent_id`);

CREATE INDEX `products_geo_content_region_idx` ON `products_geo_content` (`region_id`);

CREATE TABLE `products_geo_content_locales` (
  	`localized_name` text,
  	`localized_description` text,
  	`id` integer PRIMARY KEY NOT NULL,
  	`_locale` text NOT NULL,
  	`_parent_id` text NOT NULL,
  	FOREIGN KEY (`_parent_id`) REFERENCES `products_geo_content`(`id`) ON UPDATE no action ON DELETE cascade
  );

CREATE UNIQUE INDEX `products_geo_content_locales_locale_parent_id_unique` ON `products_geo_content_locales` (`_locale`,`_parent_id`);

CREATE TABLE `products` (
  	`id` integer PRIMARY KEY NOT NULL,
  	`slug` text NOT NULL,
  	`category_id` integer NOT NULL,
  	`status` text DEFAULT 'draft' NOT NULL,
  	`affiliate_url` text NOT NULL,
  	`commission_rate` numeric NOT NULL,
  	`pricing_amount` numeric NOT NULL,
  	`pricing_currency` text DEFAULT 'USD',
  	`review_score` numeric NOT NULL,
  	`last_updated` text NOT NULL,
  	`seo_canonical` text,
  	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
  );

CREATE UNIQUE INDEX `products_slug_idx` ON `products` (`slug`);

CREATE INDEX `products_category_idx` ON `products` (`category_id`);

CREATE INDEX `products_updated_at_idx` ON `products` (`updated_at`);

CREATE INDEX `products_created_at_idx` ON `products` (`created_at`);

CREATE TABLE `products_locales` (
  	`name` text NOT NULL,
  	`short_description` text NOT NULL,
  	`description` text NOT NULL,
  	`seo_title` text,
  	`seo_description` text,
  	`seo_keywords` text,
  	`meta_title` text,
  	`meta_description` text,
  	`id` integer PRIMARY KEY NOT NULL,
  	`_locale` text NOT NULL,
  	`_parent_id` integer NOT NULL,
  	FOREIGN KEY (`_parent_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
  );

CREATE UNIQUE INDEX `products_locales_locale_parent_id_unique` ON `products_locales` (`_locale`,`_parent_id`);

CREATE TABLE `products_rels` (
  	`id` integer PRIMARY KEY NOT NULL,
  	`order` integer,
  	`parent_id` integer NOT NULL,
  	`path` text NOT NULL,
  	`geo_regions_id` integer,
  	FOREIGN KEY (`parent_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (`geo_regions_id`) REFERENCES `geo_regions`(`id`) ON UPDATE no action ON DELETE cascade
  );

CREATE INDEX `products_rels_order_idx` ON `products_rels` (`order`);

CREATE INDEX `products_rels_parent_idx` ON `products_rels` (`parent_id`);

CREATE INDEX `products_rels_path_idx` ON `products_rels` (`path`);

CREATE INDEX `products_rels_geo_regions_id_idx` ON `products_rels` (`geo_regions_id`);

CREATE TABLE `categories` (
  	`id` integer PRIMARY KEY NOT NULL,
  	`slug` text NOT NULL,
  	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );

CREATE UNIQUE INDEX `categories_slug_idx` ON `categories` (`slug`);

CREATE INDEX `categories_updated_at_idx` ON `categories` (`updated_at`);

CREATE INDEX `categories_created_at_idx` ON `categories` (`created_at`);

CREATE TABLE `categories_locales` (
  	`name` text NOT NULL,
  	`description` text,
  	`seo_title` text,
  	`seo_description` text,
  	`meta_title` text,
  	`meta_description` text,
  	`id` integer PRIMARY KEY NOT NULL,
  	`_locale` text NOT NULL,
  	`_parent_id` integer NOT NULL,
  	FOREIGN KEY (`_parent_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
  );

CREATE UNIQUE INDEX `categories_name_idx` ON `categories_locales` (`name`,`_locale`);

CREATE UNIQUE INDEX `categories_locales_locale_parent_id_unique` ON `categories_locales` (`_locale`,`_parent_id`);

CREATE TABLE `geo_regions` (
  	`id` integer PRIMARY KEY NOT NULL,
  	`code` text NOT NULL,
  	`country_code` text NOT NULL,
  	`language` text NOT NULL,
  	`currency` text NOT NULL,
  	`priority` numeric DEFAULT 0,
  	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );

CREATE UNIQUE INDEX `geo_regions_code_idx` ON `geo_regions` (`code`);

CREATE INDEX `geo_regions_updated_at_idx` ON `geo_regions` (`updated_at`);

CREATE INDEX `geo_regions_created_at_idx` ON `geo_regions` (`created_at`);

CREATE TABLE `geo_regions_locales` (
  	`name` text NOT NULL,
  	`id` integer PRIMARY KEY NOT NULL,
  	`_locale` text NOT NULL,
  	`_parent_id` integer NOT NULL,
  	FOREIGN KEY (`_parent_id`) REFERENCES `geo_regions`(`id`) ON UPDATE no action ON DELETE cascade
  );

CREATE UNIQUE INDEX `geo_regions_locales_locale_parent_id_unique` ON `geo_regions_locales` (`_locale`,`_parent_id`);

CREATE TABLE `content_updates` (
  	`id` integer PRIMARY KEY NOT NULL,
  	`type` text NOT NULL,
  	`publish_date` text NOT NULL,
  	`is_published` integer DEFAULT false,
  	`processed_at` text,
  	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );

CREATE INDEX `content_updates_updated_at_idx` ON `content_updates` (`updated_at`);

CREATE INDEX `content_updates_created_at_idx` ON `content_updates` (`created_at`);

CREATE TABLE `content_updates_locales` (
  	`title` text NOT NULL,
  	`content` text,
  	`seo_title` text,
  	`seo_description` text,
  	`id` integer PRIMARY KEY NOT NULL,
  	`_locale` text NOT NULL,
  	`_parent_id` integer NOT NULL,
  	FOREIGN KEY (`_parent_id`) REFERENCES `content_updates`(`id`) ON UPDATE no action ON DELETE cascade
  );

CREATE UNIQUE INDEX `content_updates_locales_locale_parent_id_unique` ON `content_updates_locales` (`_locale`,`_parent_id`);

CREATE TABLE `content_updates_rels` (
  	`id` integer PRIMARY KEY NOT NULL,
  	`order` integer,
  	`parent_id` integer NOT NULL,
  	`path` text NOT NULL,
  	`products_id` integer,
  	`geo_regions_id` integer,
  	FOREIGN KEY (`parent_id`) REFERENCES `content_updates`(`id`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (`products_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (`geo_regions_id`) REFERENCES `geo_regions`(`id`) ON UPDATE no action ON DELETE cascade
  );

CREATE INDEX `content_updates_rels_order_idx` ON `content_updates_rels` (`order`);

CREATE INDEX `content_updates_rels_parent_idx` ON `content_updates_rels` (`parent_id`);

CREATE INDEX `content_updates_rels_path_idx` ON `content_updates_rels` (`path`);

CREATE INDEX `content_updates_rels_products_id_idx` ON `content_updates_rels` (`products_id`);

CREATE INDEX `content_updates_rels_geo_regions_id_idx` ON `content_updates_rels` (`geo_regions_id`);

CREATE TABLE `media` (
  	`id` integer PRIMARY KEY NOT NULL,
  	`alt` text NOT NULL,
  	`_objectkey` text,
  	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	`url` text,
  	`thumbnail_u_r_l` text,
  	`filename` text,
  	`mime_type` text,
  	`filesize` numeric,
  	`width` numeric,
  	`height` numeric
  );

CREATE INDEX `media_updated_at_idx` ON `media` (`updated_at`);

CREATE INDEX `media_created_at_idx` ON `media` (`created_at`);

CREATE UNIQUE INDEX `media_filename_idx` ON `media` (`filename`);

CREATE TABLE `payload_kv` (
  	`id` integer PRIMARY KEY NOT NULL,
  	`key` text NOT NULL,
  	`data` text NOT NULL
  );

CREATE UNIQUE INDEX `payload_kv_key_idx` ON `payload_kv` (`key`);

CREATE TABLE `payload_locked_documents` (
  	`id` integer PRIMARY KEY NOT NULL,
  	`global_slug` text,
  	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );

CREATE INDEX `payload_locked_documents_global_slug_idx` ON `payload_locked_documents` (`global_slug`);

CREATE INDEX `payload_locked_documents_updated_at_idx` ON `payload_locked_documents` (`updated_at`);

CREATE INDEX `payload_locked_documents_created_at_idx` ON `payload_locked_documents` (`created_at`);

CREATE TABLE `payload_locked_documents_rels` (
  	`id` integer PRIMARY KEY NOT NULL,
  	`order` integer,
  	`parent_id` integer NOT NULL,
  	`path` text NOT NULL,
  	`users_id` integer,
  	`products_id` integer,
  	`categories_id` integer,
  	`geo_regions_id` integer,
  	`content_updates_id` integer,
  	`media_id` integer,
  	FOREIGN KEY (`parent_id`) REFERENCES `payload_locked_documents`(`id`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (`users_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (`products_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (`categories_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (`geo_regions_id`) REFERENCES `geo_regions`(`id`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (`content_updates_id`) REFERENCES `content_updates`(`id`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE cascade
  );

CREATE INDEX `payload_locked_documents_rels_order_idx` ON `payload_locked_documents_rels` (`order`);

CREATE INDEX `payload_locked_documents_rels_parent_idx` ON `payload_locked_documents_rels` (`parent_id`);

CREATE INDEX `payload_locked_documents_rels_path_idx` ON `payload_locked_documents_rels` (`path`);

CREATE INDEX `payload_locked_documents_rels_users_id_idx` ON `payload_locked_documents_rels` (`users_id`);

CREATE INDEX `payload_locked_documents_rels_products_id_idx` ON `payload_locked_documents_rels` (`products_id`);

CREATE INDEX `payload_locked_documents_rels_categories_id_idx` ON `payload_locked_documents_rels` (`categories_id`);

CREATE INDEX `payload_locked_documents_rels_geo_regions_id_idx` ON `payload_locked_documents_rels` (`geo_regions_id`);

CREATE INDEX `payload_locked_documents_rels_content_updates_id_idx` ON `payload_locked_documents_rels` (`content_updates_id`);

CREATE INDEX `payload_locked_documents_rels_media_id_idx` ON `payload_locked_documents_rels` (`media_id`);

CREATE TABLE `payload_preferences` (
  	`id` integer PRIMARY KEY NOT NULL,
  	`key` text,
  	`value` text,
  	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );

CREATE INDEX `payload_preferences_key_idx` ON `payload_preferences` (`key`);

CREATE INDEX `payload_preferences_updated_at_idx` ON `payload_preferences` (`updated_at`);

CREATE INDEX `payload_preferences_created_at_idx` ON `payload_preferences` (`created_at`);

CREATE TABLE `payload_preferences_rels` (
  	`id` integer PRIMARY KEY NOT NULL,
  	`order` integer,
  	`parent_id` integer NOT NULL,
  	`path` text NOT NULL,
  	`users_id` integer,
  	FOREIGN KEY (`parent_id`) REFERENCES `payload_preferences`(`id`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (`users_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
  );

CREATE INDEX `payload_preferences_rels_order_idx` ON `payload_preferences_rels` (`order`);

CREATE INDEX `payload_preferences_rels_parent_idx` ON `payload_preferences_rels` (`parent_id`);

CREATE INDEX `payload_preferences_rels_path_idx` ON `payload_preferences_rels` (`path`);

CREATE INDEX `payload_preferences_rels_users_id_idx` ON `payload_preferences_rels` (`users_id`);

CREATE TABLE `payload_migrations` (
  	`id` integer PRIMARY KEY NOT NULL,
  	`name` text,
  	`batch` numeric,
  	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );

CREATE INDEX `payload_migrations_updated_at_idx` ON `payload_migrations` (`updated_at`);

CREATE INDEX `payload_migrations_created_at_idx` ON `payload_migrations` (`created_at`);

CREATE TABLE `global_supported_languages` (
  	`_order` integer NOT NULL,
  	`_parent_id` integer NOT NULL,
  	`id` text PRIMARY KEY NOT NULL,
  	`code` text NOT NULL,
  	`name` text NOT NULL,
  	FOREIGN KEY (`_parent_id`) REFERENCES `global`(`id`) ON UPDATE no action ON DELETE cascade
  );

CREATE INDEX `global_supported_languages_order_idx` ON `global_supported_languages` (`_order`);

CREATE INDEX `global_supported_languages_parent_id_idx` ON `global_supported_languages` (`_parent_id`);

CREATE TABLE `global_footer_links` (
  	`_order` integer NOT NULL,
  	`_parent_id` integer NOT NULL,
  	`id` text PRIMARY KEY NOT NULL,
  	`label` text,
  	`url` text,
  	FOREIGN KEY (`_parent_id`) REFERENCES `global`(`id`) ON UPDATE no action ON DELETE cascade
  );

CREATE INDEX `global_footer_links_order_idx` ON `global_footer_links` (`_order`);

CREATE INDEX `global_footer_links_parent_id_idx` ON `global_footer_links` (`_parent_id`);

CREATE TABLE `global` (
  	`id` integer PRIMARY KEY NOT NULL,
  	`site_name` text NOT NULL,
  	`default_language` text DEFAULT 'en',
  	`header_logo_id` integer,
  	`header_cta_text` text,
  	`header_cta_url` text,
  	`default_s_e_o_image_id` integer,
  	`updated_at` text,
  	`created_at` text,
  	FOREIGN KEY (`header_logo_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (`default_s_e_o_image_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null
  );

CREATE INDEX `global_header_header_logo_idx` ON `global` (`header_logo_id`);

CREATE INDEX `global_default_s_e_o_default_s_e_o_image_idx` ON `global` (`default_s_e_o_image_id`);

CREATE TABLE `global_locales` (
  	`site_description` text,
  	`footer_copyright` text,
  	`default_s_e_o_title` text,
  	`default_s_e_o_description` text,
  	`meta_title` text,
  	`meta_description` text,
  	`id` integer PRIMARY KEY NOT NULL,
  	`_locale` text NOT NULL,
  	`_parent_id` integer NOT NULL,
  	FOREIGN KEY (`_parent_id`) REFERENCES `global`(`id`) ON UPDATE no action ON DELETE cascade
  );

CREATE UNIQUE INDEX `global_locales_locale_parent_id_unique` ON `global_locales` (`_locale`,`_parent_id`);

INSERT INTO payload_migrations (name, batch, updated_at, created_at) VALUES ('20260921_021904', 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

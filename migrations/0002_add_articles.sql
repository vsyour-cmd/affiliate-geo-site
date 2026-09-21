-- Generated from src/migrations/20260921_025320.ts. Do not edit manually.
CREATE TABLE `articles_quality_notes` (
  	`_order` integer NOT NULL,
  	`_parent_id` integer NOT NULL,
  	`id` text PRIMARY KEY NOT NULL,
  	`note` text NOT NULL,
  	FOREIGN KEY (`_parent_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade
  );

CREATE INDEX `articles_quality_notes_order_idx` ON `articles_quality_notes` (`_order`);

CREATE INDEX `articles_quality_notes_parent_id_idx` ON `articles_quality_notes` (`_parent_id`);

CREATE TABLE `articles` (
  	`id` integer PRIMARY KEY NOT NULL,
  	`title` text NOT NULL,
  	`slug` text NOT NULL,
  	`excerpt` text NOT NULL,
  	`content` text NOT NULL,
  	`related_product_id` integer NOT NULL,
  	`category_id` integer,
  	`status` text DEFAULT 'draft' NOT NULL,
  	`published_at` text,
  	`automation_key` text,
  	`ai_generated` integer DEFAULT false,
  	`ai_model` text,
  	`prompt_version` text,
  	`quality_score` numeric,
  	`source_snapshot` text,
  	`indexable` integer DEFAULT true,
  	`monetizable` integer DEFAULT false,
  	`review_status` text DEFAULT 'autoPublished',
  	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (`related_product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
  );

CREATE UNIQUE INDEX `articles_slug_idx` ON `articles` (`slug`);

CREATE INDEX `articles_related_product_idx` ON `articles` (`related_product_id`);

CREATE INDEX `articles_category_idx` ON `articles` (`category_id`);

CREATE UNIQUE INDEX `articles_automation_key_idx` ON `articles` (`automation_key`);

CREATE INDEX `articles_updated_at_idx` ON `articles` (`updated_at`);

CREATE INDEX `articles_created_at_idx` ON `articles` (`created_at`);

ALTER TABLE `payload_locked_documents_rels` ADD `articles_id` integer REFERENCES articles(id);

CREATE INDEX `payload_locked_documents_rels_articles_id_idx` ON `payload_locked_documents_rels` (`articles_id`);

INSERT INTO payload_migrations (name, batch, updated_at, created_at) VALUES ('20260921_025320', 2, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

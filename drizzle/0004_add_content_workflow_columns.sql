ALTER TABLE `airlines` ADD `og_image_id` varchar(36);--> statement-breakpoint
ALTER TABLE `airlines` ADD `canonical_url` varchar(255);--> statement-breakpoint
ALTER TABLE `airlines` ADD `noindex` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `airlines` ADD `status` enum('draft','published','scheduled') DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE `airlines` ADD `published_at` datetime;--> statement-breakpoint
ALTER TABLE `airlines` ADD `scheduled_at` datetime;--> statement-breakpoint
ALTER TABLE `airlines` ADD `deleted_at` datetime;--> statement-breakpoint
ALTER TABLE `airlines` ADD `draft_data` longtext;--> statement-breakpoint
ALTER TABLE `airlines` ADD `draft_saved_at` datetime;--> statement-breakpoint
ALTER TABLE `blog_posts` ADD `canonical_url` varchar(255);--> statement-breakpoint
ALTER TABLE `blog_posts` ADD `noindex` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `blog_posts` ADD `status` enum('draft','published','scheduled') DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE `blog_posts` ADD `scheduled_at` datetime;--> statement-breakpoint
ALTER TABLE `blog_posts` ADD `deleted_at` datetime;--> statement-breakpoint
ALTER TABLE `blog_posts` ADD `draft_data` longtext;--> statement-breakpoint
ALTER TABLE `blog_posts` ADD `draft_saved_at` datetime;--> statement-breakpoint
ALTER TABLE `offices` ADD `canonical_url` varchar(255);--> statement-breakpoint
ALTER TABLE `offices` ADD `noindex` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `offices` ADD `status` enum('draft','published','scheduled') DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE `offices` ADD `scheduled_at` datetime;--> statement-breakpoint
ALTER TABLE `offices` ADD `deleted_at` datetime;--> statement-breakpoint
ALTER TABLE `offices` ADD `draft_data` longtext;--> statement-breakpoint
ALTER TABLE `offices` ADD `draft_saved_at` datetime;--> statement-breakpoint
ALTER TABLE `airlines` ADD CONSTRAINT `airlines_og_image_id_images_id_fk` FOREIGN KEY (`og_image_id`) REFERENCES `images`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `airlines_status_idx` ON `airlines` (`status`);--> statement-breakpoint
CREATE INDEX `airlines_deleted_at_idx` ON `airlines` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `airlines_scheduled_at_idx` ON `airlines` (`scheduled_at`);--> statement-breakpoint
CREATE INDEX `blog_posts_status_idx` ON `blog_posts` (`status`);--> statement-breakpoint
CREATE INDEX `blog_posts_deleted_at_idx` ON `blog_posts` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `blog_posts_scheduled_at_idx` ON `blog_posts` (`scheduled_at`);--> statement-breakpoint
CREATE INDEX `offices_status_idx` ON `offices` (`status`);--> statement-breakpoint
CREATE INDEX `offices_deleted_at_idx` ON `offices` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `offices_scheduled_at_idx` ON `offices` (`scheduled_at`);
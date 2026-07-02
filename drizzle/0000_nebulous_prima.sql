CREATE TABLE `airlines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(100) NOT NULL,
	`name` varchar(150) NOT NULL,
	`iata_code` varchar(3),
	`icao_code` varchar(4),
	`logo_image_id` varchar(36),
	`cover_image_id` varchar(36),
	`description` longtext,
	`website` varchar(255),
	`email` varchar(150),
	`phone` varchar(50),
	`founded_year` int,
	`alliance` varchar(100),
	`hq_address` varchar(255),
	`hq_phone` varchar(50),
	`hq_email` varchar(150),
	`facebook` varchar(255),
	`twitter` varchar(255),
	`instagram` varchar(255),
	`youtube` varchar(255),
	`is_featured` boolean DEFAULT false,
	`meta_title` varchar(255),
	`meta_description` varchar(500),
	`is_published` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updated_by` int,
	CONSTRAINT `airlines_id` PRIMARY KEY(`id`),
	CONSTRAINT `airlines_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `blog_faqs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`post_id` int NOT NULL,
	`question` varchar(255) NOT NULL,
	`answer` text NOT NULL,
	`sort_order` int DEFAULT 0,
	CONSTRAINT `blog_faqs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blog_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(150) NOT NULL,
	`title` varchar(255) NOT NULL,
	`excerpt` text,
	`category` varchar(100),
	`content` longtext,
	`hero_image_id` varchar(36),
	`og_image_id` varchar(36),
	`author` varchar(100),
	`related_posts` json,
	`meta_title` varchar(255),
	`meta_description` varchar(500),
	`reading_time` varchar(20),
	`is_published` boolean DEFAULT false,
	`published_at` timestamp,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blog_posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `blog_posts_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `images` (
	`id` varchar(36) NOT NULL,
	`filename` varchar(255),
	`mime_type` varchar(50) NOT NULL,
	`data` mediumblob NOT NULL,
	`width` int,
	`height` int,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `office_faqs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`office_id` int NOT NULL,
	`question` varchar(255) NOT NULL,
	`answer` text NOT NULL,
	`sort_order` int DEFAULT 0,
	CONSTRAINT `office_faqs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `offices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(150) NOT NULL,
	`airline_id` int NOT NULL,
	`full_title` varchar(255) NOT NULL,
	`city` varchar(100) NOT NULL,
	`country` varchar(100) NOT NULL,
	`country_code` varchar(2),
	`region` varchar(50),
	`address` varchar(255),
	`map_embed_url` text,
	`map_lat` decimal(10,7),
	`map_lng` decimal(10,7),
	`phone` varchar(50),
	`cta_phone` varchar(50),
	`email` varchar(150),
	`working_hours` varchar(100),
	`working_days` varchar(100),
	`website` varchar(255),
	`online_checkin` varchar(255),
	`flight_status` varchar(255),
	`baggage_info` varchar(255),
	`is_headquarters` boolean DEFAULT false,
	`hero_image_id` varchar(36),
	`og_image_id` varchar(36),
	`facebook` varchar(255),
	`twitter` varchar(255),
	`instagram` varchar(255),
	`youtube` varchar(255),
	`linkedin` varchar(255),
	`content` longtext,
	`meta_title` varchar(255),
	`meta_description` varchar(500),
	`is_published` boolean DEFAULT false,
	`is_featured` boolean DEFAULT false,
	`published_at` timestamp,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updated_by` int,
	CONSTRAINT `offices_id` PRIMARY KEY(`id`),
	CONSTRAINT `airline_slug_idx` UNIQUE(`airline_id`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`email` varchar(150) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role` enum('editor','admin','super_admin') NOT NULL DEFAULT 'editor',
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`created_by` int,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `airlines` ADD CONSTRAINT `airlines_logo_image_id_images_id_fk` FOREIGN KEY (`logo_image_id`) REFERENCES `images`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `airlines` ADD CONSTRAINT `airlines_cover_image_id_images_id_fk` FOREIGN KEY (`cover_image_id`) REFERENCES `images`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `airlines` ADD CONSTRAINT `airlines_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `blog_faqs` ADD CONSTRAINT `blog_faqs_post_id_blog_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `blog_posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `blog_posts` ADD CONSTRAINT `blog_posts_hero_image_id_images_id_fk` FOREIGN KEY (`hero_image_id`) REFERENCES `images`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `blog_posts` ADD CONSTRAINT `blog_posts_og_image_id_images_id_fk` FOREIGN KEY (`og_image_id`) REFERENCES `images`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `office_faqs` ADD CONSTRAINT `office_faqs_office_id_offices_id_fk` FOREIGN KEY (`office_id`) REFERENCES `offices`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `offices` ADD CONSTRAINT `offices_airline_id_airlines_id_fk` FOREIGN KEY (`airline_id`) REFERENCES `airlines`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `offices` ADD CONSTRAINT `offices_hero_image_id_images_id_fk` FOREIGN KEY (`hero_image_id`) REFERENCES `images`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `offices` ADD CONSTRAINT `offices_og_image_id_images_id_fk` FOREIGN KEY (`og_image_id`) REFERENCES `images`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `offices` ADD CONSTRAINT `offices_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
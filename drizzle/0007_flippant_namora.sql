CREATE TABLE `activity_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(36),
	`user_name` varchar(255),
	`action` varchar(30) NOT NULL,
	`entity_type` varchar(20) NOT NULL,
	`entity_id` varchar(64),
	`entity_title` varchar(255),
	`href` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `activity_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `activity_log` ADD CONSTRAINT `activity_log_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `activity_log_created_at_idx` ON `activity_log` (`created_at`);--> statement-breakpoint
CREATE INDEX `activity_log_entity_idx` ON `activity_log` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `activity_log_user_idx` ON `activity_log` (`user_id`);
CREATE TABLE `settings` (
	`key` varchar(100) NOT NULL,
	`value` text,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updated_by` varchar(36),
	CONSTRAINT `settings_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
ALTER TABLE `settings` ADD CONSTRAINT `settings_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `airlines` DROP FOREIGN KEY `airlines_updated_by_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `offices` DROP FOREIGN KEY `offices_updated_by_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `airlines` DROP COLUMN `updated_by`;--> statement-breakpoint
ALTER TABLE `offices` DROP COLUMN `updated_by`;--> statement-breakpoint
DROP TABLE `users`;

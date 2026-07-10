CREATE TABLE `redirects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`from_path` varchar(300) NOT NULL,
	`to_path` varchar(300) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `redirects_id` PRIMARY KEY(`id`),
	CONSTRAINT `redirects_from_path_unique` UNIQUE(`from_path`)
);

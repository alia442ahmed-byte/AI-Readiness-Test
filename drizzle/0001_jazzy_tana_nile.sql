CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`company` varchar(255) NOT NULL,
	`score` int NOT NULL,
	`tier` enum('high_risk','moderate_risk','optimized') NOT NULL,
	`answers` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);

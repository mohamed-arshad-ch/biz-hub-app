CREATE TABLE `companies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`logo` text,
	`address` text,
	`city` text,
	`state` text,
	`zip_code` text,
	`country` text,
	`phone` text,
	`email` text,
	`website` text,
	`tax_id` text,
	`industry` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`avatar_url` text,
	`notifications_enabled` integer DEFAULT true,
	`email_notifications` integer DEFAULT true,
	`push_notifications` integer DEFAULT true,
	`language` text DEFAULT 'en',
	`theme` text DEFAULT 'light',
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
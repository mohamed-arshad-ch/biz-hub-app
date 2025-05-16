PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_companies` (
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
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_companies`("id", "user_id", "name", "logo", "address", "city", "state", "zip_code", "country", "phone", "email", "website", "tax_id", "industry", "created_at") SELECT "id", "user_id", "name", "logo", "address", "city", "state", "zip_code", "country", "phone", "email", "website", "tax_id", "industry", "created_at" FROM `companies`;--> statement-breakpoint
DROP TABLE `companies`;--> statement-breakpoint
ALTER TABLE `__new_companies` RENAME TO `companies`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
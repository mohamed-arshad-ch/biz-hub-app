CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`address` text,
	`city` text,
	`state` text,
	`zip_code` text,
	`country` text,
	`company` text,
	`notes` text,
	`contact_person` text,
	`category` text,
	`outstanding_balance` integer DEFAULT 0,
	`total_purchases` integer DEFAULT 0,
	`last_purchase_date` text,
	`tax_id` text,
	`payment_terms` text,
	`credit_limit` integer DEFAULT 0,
	`status` text DEFAULT 'active',
	`tags` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
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
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_companies`("id", "user_id", "name", "logo", "address", "city", "state", "zip_code", "country", "phone", "email", "website", "tax_id", "industry", "created_at") SELECT "id", "user_id", "name", "logo", "address", "city", "state", "zip_code", "country", "phone", "email", "website", "tax_id", "industry", "created_at" FROM `companies`;--> statement-breakpoint
DROP TABLE `companies`;--> statement-breakpoint
ALTER TABLE `__new_companies` RENAME TO `companies`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
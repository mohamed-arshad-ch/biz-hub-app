PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_vendors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`company` text,
	`email` text,
	`phone` text,
	`address` text,
	`city` text,
	`state` text,
	`zip_code` text,
	`country` text,
	`contact_person` text,
	`category` text,
	`status` text DEFAULT 'active',
	`notes` text,
	`payment_terms` text,
	`tax_id` text,
	`tags` text,
	`total_purchases` integer DEFAULT 0,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_vendors`("id", "user_id", "name", "company", "email", "phone", "address", "city", "state", "zip_code", "country", "contact_person", "category", "status", "notes", "payment_terms", "tax_id", "tags", "total_purchases", "created_at") SELECT "id", "user_id", "name", "company", "email", "phone", "address", "city", "state", "zip_code", "country", "contact_person", "category", "status", "notes", "payment_terms", "tax_id", "tags", "total_purchases", "created_at" FROM `vendors`;--> statement-breakpoint
DROP TABLE `vendors`;--> statement-breakpoint
ALTER TABLE `__new_vendors` RENAME TO `vendors`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
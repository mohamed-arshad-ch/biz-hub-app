PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
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
	`credit_limit` integer DEFAULT 0,
	`payment_terms` text,
	`tax_id` text,
	`tags` text,
	`outstanding_balance` integer DEFAULT 0,
	`total_purchases` integer DEFAULT 0,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
INSERT INTO `__new_customers`("id", "name", "company", "email", "phone", "address", "city", "state", "zip_code", "country", "contact_person", "category", "status", "notes", "credit_limit", "payment_terms", "tax_id", "tags", "outstanding_balance", "total_purchases", "created_at") SELECT "id", "name", "company", "email", "phone", "address", "city", "state", "zip_code", "country", "contact_person", "category", "status", "notes", "credit_limit", "payment_terms", "tax_id", "tags", "outstanding_balance", "total_purchases", "created_at" FROM `customers`;--> statement-breakpoint
DROP TABLE `customers`;--> statement-breakpoint
ALTER TABLE `__new_customers` RENAME TO `customers`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
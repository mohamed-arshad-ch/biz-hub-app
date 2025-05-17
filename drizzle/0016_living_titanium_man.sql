CREATE TABLE `payment_in_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`payment_id` integer NOT NULL,
	`invoice_id` integer NOT NULL,
	`amount` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`payment_id`) REFERENCES `payment_ins`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invoice_id`) REFERENCES `sales_invoices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payment_ins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`payment_number` text NOT NULL,
	`customer_id` integer NOT NULL,
	`payment_date` text NOT NULL,
	`amount` integer NOT NULL,
	`payment_method` text NOT NULL,
	`reference_number` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sales_returns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`return_number` text NOT NULL,
	`invoice_id` integer NOT NULL,
	`return_date` text NOT NULL,
	`status` text DEFAULT 'draft',
	`subtotal` integer NOT NULL,
	`tax` integer DEFAULT 0,
	`total` integer NOT NULL,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invoice_id`) REFERENCES `sales_invoices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_sales_returns`("id", "user_id", "return_number", "invoice_id", "return_date", "status", "subtotal", "tax", "total", "notes", "created_at", "updated_at") SELECT "id", "user_id", "return_number", "invoice_id", "return_date", "status", "subtotal", "tax", "total", "notes", "created_at", "updated_at" FROM `sales_returns`;--> statement-breakpoint
DROP TABLE `sales_returns`;--> statement-breakpoint
ALTER TABLE `__new_sales_returns` RENAME TO `sales_returns`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `sales_return_items` DROP COLUMN `reason`;
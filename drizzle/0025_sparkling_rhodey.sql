CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`transaction_type` text NOT NULL,
	`reference_id` integer NOT NULL,
	`reference_type` text NOT NULL,
	`amount` integer NOT NULL,
	`date` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'pending',
	`payment_method` text,
	`reference_number` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_payment_out_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`payment_out_id` integer NOT NULL,
	`invoice_id` integer NOT NULL,
	`amount` integer NOT NULL,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`payment_out_id`) REFERENCES `payment_out`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invoice_id`) REFERENCES `purchase_invoices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_payment_out_items`("id", "payment_out_id", "invoice_id", "amount", "notes", "created_at", "updated_at") SELECT "id", "payment_out_id", "invoice_id", "amount", "notes", "created_at", "updated_at" FROM `payment_out_items`;--> statement-breakpoint
DROP TABLE `payment_out_items`;--> statement-breakpoint
ALTER TABLE `__new_payment_out_items` RENAME TO `payment_out_items`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_payment_out` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`payment_number` text NOT NULL,
	`vendor_id` integer NOT NULL,
	`payment_date` text NOT NULL,
	`payment_method` text NOT NULL,
	`reference_number` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`amount` integer NOT NULL,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_payment_out`("id", "user_id", "payment_number", "vendor_id", "payment_date", "payment_method", "reference_number", "status", "amount", "notes", "created_at", "updated_at") SELECT "id", "user_id", "payment_number", "vendor_id", "payment_date", "payment_method", "reference_number", "status", "amount", "notes", "created_at", "updated_at" FROM `payment_out`;--> statement-breakpoint
DROP TABLE `payment_out`;--> statement-breakpoint
ALTER TABLE `__new_payment_out` RENAME TO `payment_out`;
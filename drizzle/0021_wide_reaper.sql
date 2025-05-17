CREATE TABLE `payment_out_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`payment_out_id` integer NOT NULL,
	`invoice_id` integer NOT NULL,
	`amount` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`payment_out_id`) REFERENCES `payment_out`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invoice_id`) REFERENCES `purchase_invoices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payment_out` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`vendor_id` integer NOT NULL,
	`payment_number` text NOT NULL,
	`payment_date` text NOT NULL,
	`amount` integer NOT NULL,
	`payment_method` text NOT NULL,
	`reference_number` text,
	`notes` text,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action
);

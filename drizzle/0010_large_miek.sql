PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sales_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`customer_id` integer NOT NULL,
	`order_number` text NOT NULL,
	`order_date` text NOT NULL,
	`status` text DEFAULT 'draft',
	`total` integer NOT NULL,
	`subtotal` integer NOT NULL,
	`tax` integer DEFAULT 0,
	`discount` integer DEFAULT 0,
	`shipping_cost` integer DEFAULT 0,
	`notes` text,
	`payment_status` text DEFAULT 'pending',
	`payment_method` text,
	`shipping_address` text,
	`billing_address` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_sales_orders`("id", "user_id", "customer_id", "order_number", "order_date", "status", "total", "subtotal", "tax", "discount", "shipping_cost", "notes", "payment_status", "payment_method", "shipping_address", "billing_address", "created_at", "updated_at") SELECT "id", "user_id", "customer_id", "order_number", "order_date", "status", "total", "subtotal", "tax", "discount", "shipping_cost", "notes", "payment_status", "payment_method", "shipping_address", "billing_address", "created_at", "updated_at" FROM `sales_orders`;--> statement-breakpoint
DROP TABLE `sales_orders`;--> statement-breakpoint
ALTER TABLE `__new_sales_orders` RENAME TO `sales_orders`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `sales_order_items` ADD `discount` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `sales_order_items` ADD `tax` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `sales_order_items` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `sales_order_items` DROP COLUMN `product_name`;
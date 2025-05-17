PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sales_order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price` integer NOT NULL,
	`total` integer NOT NULL,
	`discount` integer DEFAULT 0,
	`tax` integer DEFAULT 0,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`order_id`) REFERENCES `sales_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_sales_order_items`("id", "order_id", "product_id", "quantity", "unit_price", "total", "discount", "tax", "notes", "created_at") SELECT "id", "order_id", "product_id", "quantity", "unit_price", "total", "discount", "tax", "notes", "created_at" FROM `sales_order_items`;--> statement-breakpoint
DROP TABLE `sales_order_items`;--> statement-breakpoint
ALTER TABLE `__new_sales_order_items` RENAME TO `sales_order_items`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
DROP INDEX `sales_orders_order_number_unique`;--> statement-breakpoint
ALTER TABLE `sales_orders` ADD `total` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `sales_orders` ADD `tax` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `sales_orders` ADD `discount` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `sales_orders` ADD `payment_terms` text;--> statement-breakpoint
ALTER TABLE `sales_orders` ADD `due_date` text;--> statement-breakpoint
ALTER TABLE `sales_orders` DROP COLUMN `tax_amount`;--> statement-breakpoint
ALTER TABLE `sales_orders` DROP COLUMN `discount_amount`;--> statement-breakpoint
ALTER TABLE `sales_orders` DROP COLUMN `total_amount`;--> statement-breakpoint
ALTER TABLE `sales_orders` DROP COLUMN `payment_status`;--> statement-breakpoint
ALTER TABLE `sales_orders` DROP COLUMN `payment_method`;
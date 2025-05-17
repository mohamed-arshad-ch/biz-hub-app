ALTER TABLE `sales_order_items` ADD `tax_rate` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `sales_order_items` ADD `tax_amount` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `sales_order_items` ADD `discount_amount` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `sales_order_items` ADD `total_amount` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `sales_order_items` DROP COLUMN `total`;--> statement-breakpoint
ALTER TABLE `sales_order_items` DROP COLUMN `discount`;--> statement-breakpoint
ALTER TABLE `sales_order_items` DROP COLUMN `tax`;--> statement-breakpoint
ALTER TABLE `sales_orders` ADD `tax_amount` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `sales_orders` ADD `discount_amount` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `sales_orders` ADD `total_amount` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `sales_orders` ADD `terms_and_conditions` text;--> statement-breakpoint
CREATE UNIQUE INDEX `sales_orders_order_number_unique` ON `sales_orders` (`order_number`);--> statement-breakpoint
ALTER TABLE `sales_orders` DROP COLUMN `total`;--> statement-breakpoint
ALTER TABLE `sales_orders` DROP COLUMN `tax`;--> statement-breakpoint
ALTER TABLE `sales_orders` DROP COLUMN `discount`;--> statement-breakpoint
ALTER TABLE `sales_orders` DROP COLUMN `shipping_cost`;
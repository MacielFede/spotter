CREATE TABLE `outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text
);
--> statement-breakpoint
CREATE INDEX `outbox_created_at_idx` ON `outbox` (`created_at`);--> statement-breakpoint
CREATE INDEX `outbox_kind_idx` ON `outbox` (`kind`);
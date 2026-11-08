ALTER TABLE `exercises` ADD `uses_weight` integer DEFAULT true NOT NULL;
--> statement-breakpoint
UPDATE `exercises` SET `uses_weight` = 1;

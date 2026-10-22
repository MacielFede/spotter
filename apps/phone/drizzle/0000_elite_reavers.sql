CREATE TABLE `active_workout` (
	`id` integer PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`details` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "active_workout_singleton" CHECK("active_workout"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`title_key` text NOT NULL,
	`description` text NOT NULL,
	`archived` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exercises_title_key_unique` ON `exercises` (`title_key`);--> statement-breakpoint
CREATE TABLE `items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`module_id` integer NOT NULL,
	`kind` text NOT NULL,
	`position` integer NOT NULL,
	`exercise_id` text,
	`rounds` integer,
	`rest_seconds` integer,
	FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `items_module_id_idx` ON `items` (`module_id`);--> statement-breakpoint
CREATE TABLE `modules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`routine_id` text NOT NULL,
	`kind` text NOT NULL,
	`enabled` integer NOT NULL,
	`position` integer NOT NULL,
	FOREIGN KEY (`routine_id`) REFERENCES `routines`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `modules_routine_kind_unique` ON `modules` (`routine_id`,`kind`);--> statement-breakpoint
CREATE INDEX `modules_routine_id_idx` ON `modules` (`routine_id`);--> statement-breakpoint
CREATE TABLE `plans` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `routines` (
	`id` text PRIMARY KEY NOT NULL,
	`plan_id` text NOT NULL,
	`name` text NOT NULL,
	`active` integer DEFAULT false NOT NULL,
	`position` integer NOT NULL,
	FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `routines_plan_id_idx` ON `routines` (`plan_id`);--> statement-breakpoint
CREATE TABLE `sets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_id` integer NOT NULL,
	`position` integer NOT NULL,
	`mode` text NOT NULL,
	`target_reps` integer,
	`target_seconds` integer,
	`weight_kg` real,
	`rest_seconds` integer,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sets_item_id_idx` ON `sets` (`item_id`);--> statement-breakpoint
CREATE TABLE `superset_members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_id` integer NOT NULL,
	`position` integer NOT NULL,
	`exercise_id` text NOT NULL,
	`mode` text NOT NULL,
	`target_reps` integer,
	`target_seconds` integer,
	`weight_kg` real,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `superset_members_item_id_idx` ON `superset_members` (`item_id`);--> statement-breakpoint
CREATE TABLE `workouts` (
	`workout_id` text PRIMARY KEY NOT NULL,
	`plan_id` text NOT NULL,
	`plan_name` text NOT NULL,
	`routine_id` text NOT NULL,
	`routine_name` text NOT NULL,
	`started_at` text NOT NULL,
	`ended_at` text NOT NULL,
	`started_on` text NOT NULL,
	`details` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `workouts_started_at_idx` ON `workouts` (`started_at`);--> statement-breakpoint
CREATE INDEX `workouts_plan_id_idx` ON `workouts` (`plan_id`);--> statement-breakpoint
CREATE INDEX `workouts_routine_id_idx` ON `workouts` (`routine_id`);
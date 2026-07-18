CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text,
	`description` text NOT NULL,
	`params` text NOT NULL,
	`example_dice` text,
	`section` text NOT NULL,
	`primitive` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `game_mode_categories` (
	`game_mode_id` text NOT NULL,
	`category_id` text NOT NULL,
	`label_override` text,
	`order_index` integer NOT NULL,
	PRIMARY KEY(`game_mode_id`, `category_id`),
	FOREIGN KEY (`game_mode_id`) REFERENCES `game_modes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `game_modes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`dice_count` integer NOT NULL,
	`is_builtin` integer DEFAULT false NOT NULL,
	`upper_bonus_threshold` integer NOT NULL,
	`upper_bonus_amount` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`session_code` text NOT NULL,
	`name` text NOT NULL,
	`order_index` integer NOT NULL,
	FOREIGN KEY (`session_code`) REFERENCES `sessions`(`code`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `scores` (
	`session_code` text NOT NULL,
	`player_id` text NOT NULL,
	`category_id` text NOT NULL,
	`value` integer,
	`updated_at` integer,
	PRIMARY KEY(`session_code`, `player_id`, `category_id`),
	FOREIGN KEY (`session_code`) REFERENCES `sessions`(`code`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session_categories` (
	`session_code` text NOT NULL,
	`category_id` text NOT NULL,
	`label_override` text,
	`order_index` integer NOT NULL,
	PRIMARY KEY(`session_code`, `category_id`),
	FOREIGN KEY (`session_code`) REFERENCES `sessions`(`code`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`code` text PRIMARY KEY NOT NULL,
	`game_mode_id` text NOT NULL,
	`host_token_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`finished_at` integer,
	FOREIGN KEY (`game_mode_id`) REFERENCES `game_modes`(`id`) ON UPDATE no action ON DELETE cascade
);

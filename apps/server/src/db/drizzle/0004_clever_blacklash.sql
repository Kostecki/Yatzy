CREATE TABLE `host_tokens` (
	`session_code` text NOT NULL,
	`token_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`session_code`, `token_hash`),
	FOREIGN KEY (`session_code`) REFERENCES `sessions`(`code`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `sessions` DROP COLUMN `host_token_hash`;
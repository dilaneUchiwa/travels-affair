CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`user_id` text NOT NULL,
	`flight_id` text NOT NULL,
	`status` text DEFAULT 'PENDING_PAYMENT' NOT NULL,
	`seats` integer NOT NULL,
	`unit_price` integer NOT NULL,
	`total` integer NOT NULL,
	`currency` text NOT NULL,
	`reminder_sent_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`flight_id`) REFERENCES `flights`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bookings_reference_unique` ON `bookings` (`reference`);--> statement-breakpoint
CREATE INDEX `bookings_user_idx` ON `bookings` (`user_id`);--> statement-breakpoint
CREATE INDEX `bookings_status_idx` ON `bookings` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `email_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text,
	`to` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`delivered` integer DEFAULT false NOT NULL,
	`error` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `flights` (
	`id` text PRIMARY KEY NOT NULL,
	`airline` text NOT NULL,
	`from_city` text NOT NULL,
	`from_airport` text NOT NULL,
	`to_city` text NOT NULL,
	`to_airport` text NOT NULL,
	`trip_type` text DEFAULT 'ONE_WAY' NOT NULL,
	`depart_at` integer NOT NULL,
	`arrive_at` integer NOT NULL,
	`stops` integer DEFAULT 0 NOT NULL,
	`baggage` text NOT NULL,
	`currency` text NOT NULL,
	`price` integer NOT NULL,
	`seats_available` integer NOT NULL,
	`conditions` text DEFAULT '' NOT NULL,
	`cancellation_policy` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `flights_status_depart_idx` ON `flights` (`status`,`depart_at`);--> statement-breakpoint
CREATE TABLE `passengers` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`full_name` text NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`method` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`status` text NOT NULL,
	`provider_reference` text,
	`failure_reason` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'CLIENT' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
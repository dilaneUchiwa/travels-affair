CREATE TABLE `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`country` text NOT NULL,
	`city` text NOT NULL,
	`start_at` integer NOT NULL,
	`duration_hours` integer DEFAULT 2 NOT NULL,
	`currency` text NOT NULL,
	`price` integer NOT NULL,
	`places_available` integer NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`conditions` text DEFAULT '' NOT NULL,
	`cancellation_policy` text DEFAULT '' NOT NULL,
	`photos` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`user_id` text NOT NULL,
	`service_type` text DEFAULT 'FLIGHT' NOT NULL,
	`item_id` text NOT NULL,
	`title` text NOT NULL,
	`subtitle` text DEFAULT '' NOT NULL,
	`start_at` integer NOT NULL,
	`end_at` integer NOT NULL,
	`details` text DEFAULT '[]' NOT NULL,
	`conditions` text DEFAULT '' NOT NULL,
	`cancellation_policy` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'PENDING_PAYMENT' NOT NULL,
	`quantity` integer NOT NULL,
	`multiplier` integer DEFAULT 1 NOT NULL,
	`unit_price` integer NOT NULL,
	`total` integer NOT NULL,
	`currency` text NOT NULL,
	`reminders_sent` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bookings_reference_unique` ON `bookings` (`reference`);--> statement-breakpoint
CREATE INDEX `bookings_user_idx` ON `bookings` (`user_id`);--> statement-breakpoint
CREATE INDEX `bookings_status_idx` ON `bookings` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `bookings_item_idx` ON `bookings` (`service_type`,`item_id`,`start_at`);--> statement-breakpoint
CREATE TABLE `contact_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`subject` text NOT NULL,
	`message` text NOT NULL,
	`handled` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE `faq_items` (
	`id` text PRIMARY KEY NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`question_fr` text NOT NULL,
	`answer_fr` text NOT NULL,
	`question_en` text DEFAULT '' NOT NULL,
	`answer_en` text DEFAULT '' NOT NULL
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
	`photos` text DEFAULT '[]' NOT NULL,
	`return_depart_at` integer,
	`return_arrive_at` integer,
	`itinerary` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `flights_status_depart_idx` ON `flights` (`status`,`depart_at`);--> statement-breakpoint
CREATE TABLE `hotel_properties` (
	`id` text PRIMARY KEY NOT NULL,
	`hotel_id` text NOT NULL,
	`name` text NOT NULL,
	`capacity` integer DEFAULT 2 NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`rooms_detail` text DEFAULT '' NOT NULL,
	`amenities` text DEFAULT '' NOT NULL,
	`currency` text NOT NULL,
	`price_per_night` integer NOT NULL,
	`photos` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `hotels` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text DEFAULT 'HOTEL' NOT NULL,
	`stars` integer DEFAULT 3 NOT NULL,
	`country` text NOT NULL,
	`city` text NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`amenities` text DEFAULT '' NOT NULL,
	`conditions` text DEFAULT '' NOT NULL,
	`cancellation_policy` text DEFAULT '' NOT NULL,
	`photos` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pages` (
	`slug` text PRIMARY KEY NOT NULL,
	`title_fr` text NOT NULL,
	`title_en` text NOT NULL,
	`body_fr` text DEFAULT '' NOT NULL,
	`body_en` text DEFAULT '' NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `passengers` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`full_name` text NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `password_resets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `password_resets_token_hash_unique` ON `password_resets` (`token_hash`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`method` text NOT NULL,
	`provider` text DEFAULT 'SIMULATED' NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`status` text NOT NULL,
	`provider_reference` text,
	`failure_reason` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transport_providers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`contact` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transports` (
	`id` text PRIMARY KEY NOT NULL,
	`provider_id` text NOT NULL,
	`mode` text DEFAULT 'SHUTTLE' NOT NULL,
	`from_place` text NOT NULL,
	`to_place` text NOT NULL,
	`depart_at` integer NOT NULL,
	`arrive_at` integer NOT NULL,
	`driver_name` text DEFAULT '' NOT NULL,
	`access_conditions` text DEFAULT '' NOT NULL,
	`currency` text NOT NULL,
	`price` integer NOT NULL,
	`seats_available` integer NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`photos` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`provider_id`) REFERENCES `transport_providers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'CLIENT' NOT NULL,
	`lang` text DEFAULT 'fr' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `vehicle_brands` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vehicle_brands_name_unique` ON `vehicle_brands` (`name`);--> statement-breakpoint
CREATE TABLE `vehicle_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vehicle_categories_name_unique` ON `vehicle_categories` (`name`);--> statement-breakpoint
CREATE TABLE `vehicle_models` (
	`id` text PRIMARY KEY NOT NULL,
	`brand_id` text NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`brand_id`) REFERENCES `vehicle_brands`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` text PRIMARY KEY NOT NULL,
	`model_id` text NOT NULL,
	`category_id` text NOT NULL,
	`location` text NOT NULL,
	`seats` integer DEFAULT 5 NOT NULL,
	`units` integer DEFAULT 1 NOT NULL,
	`currency` text NOT NULL,
	`price_per_day` integer NOT NULL,
	`amenities` text DEFAULT '' NOT NULL,
	`conditions` text DEFAULT '' NOT NULL,
	`photos` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`model_id`) REFERENCES `vehicle_models`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `vehicle_categories`(`id`) ON UPDATE no action ON DELETE no action
);

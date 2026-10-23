CREATE TABLE `activities` (
	`id` varchar(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`country` varchar(128) NOT NULL,
	`city` varchar(128) NOT NULL,
	`start_at` timestamp NOT NULL,
	`duration_hours` int NOT NULL DEFAULT 2,
	`currency` varchar(8) NOT NULL,
	`price` int NOT NULL,
	`places_available` int NOT NULL,
	`description` text NOT NULL,
	`conditions` text NOT NULL,
	`cancellation_policy` text NOT NULL,
	`photos` text NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'DRAFT',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `airlines` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(16) NOT NULL DEFAULT '',
	`country` varchar(128) NOT NULL DEFAULT '',
	`logo` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `airlines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` varchar(36) NOT NULL,
	`reference` varchar(64) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`service_type` varchar(16) NOT NULL DEFAULT 'FLIGHT',
	`item_id` varchar(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`subtitle` varchar(255) NOT NULL DEFAULT '',
	`start_at` timestamp NOT NULL,
	`end_at` timestamp NOT NULL,
	`details` text NOT NULL,
	`conditions` text NOT NULL,
	`cancellation_policy` text NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'PENDING_PAYMENT',
	`quantity` int NOT NULL,
	`multiplier` int NOT NULL DEFAULT 1,
	`unit_price` int NOT NULL,
	`total` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`reminders_sent` varchar(255) NOT NULL DEFAULT '',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`),
	CONSTRAINT `bookings_reference_unique` UNIQUE(`reference`)
);
--> statement-breakpoint
CREATE TABLE `contact_messages` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`handled` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contact_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_logs` (
	`id` varchar(36) NOT NULL,
	`booking_id` varchar(36),
	`to` varchar(255) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`delivered` boolean NOT NULL DEFAULT false,
	`error` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `faq_items` (
	`id` varchar(36) NOT NULL,
	`position` int NOT NULL DEFAULT 0,
	`question_fr` varchar(512) NOT NULL,
	`answer_fr` text NOT NULL,
	`question_en` varchar(512) NOT NULL DEFAULT '',
	`answer_en` text NOT NULL,
	CONSTRAINT `faq_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `flights` (
	`id` varchar(36) NOT NULL,
	`airline` varchar(255) NOT NULL,
	`airline_id` varchar(36),
	`layovers` text NOT NULL,
	`from_city` varchar(255) NOT NULL,
	`from_airport` varchar(16) NOT NULL,
	`to_city` varchar(255) NOT NULL,
	`to_airport` varchar(16) NOT NULL,
	`trip_type` varchar(16) NOT NULL DEFAULT 'ONE_WAY',
	`depart_at` timestamp NOT NULL,
	`arrive_at` timestamp NOT NULL,
	`stops` int NOT NULL DEFAULT 0,
	`baggage` varchar(255) NOT NULL,
	`currency` varchar(8) NOT NULL,
	`price` int NOT NULL,
	`seats_available` int NOT NULL,
	`conditions` text NOT NULL,
	`cancellation_policy` text NOT NULL,
	`description` text NOT NULL,
	`photos` text NOT NULL,
	`return_depart_at` timestamp,
	`return_arrive_at` timestamp,
	`itinerary` text NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'DRAFT',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `flights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hotel_properties` (
	`id` varchar(36) NOT NULL,
	`hotel_id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`capacity` int NOT NULL DEFAULT 2,
	`quantity` int NOT NULL DEFAULT 1,
	`rooms_detail` text NOT NULL,
	`amenities` text NOT NULL,
	`currency` varchar(8) NOT NULL,
	`price_per_night` int NOT NULL,
	`photos` text NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'DRAFT',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hotel_properties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hotels` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(32) NOT NULL DEFAULT 'HOTEL',
	`stars` int NOT NULL DEFAULT 3,
	`country` varchar(128) NOT NULL,
	`city` varchar(128) NOT NULL,
	`address` varchar(255) NOT NULL DEFAULT '',
	`description` text NOT NULL,
	`amenities` text NOT NULL,
	`conditions` text NOT NULL,
	`cancellation_policy` text NOT NULL,
	`photos` text NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'DRAFT',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hotels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pages` (
	`slug` varchar(191) NOT NULL,
	`title_fr` varchar(255) NOT NULL,
	`title_en` varchar(255) NOT NULL,
	`body_fr` text NOT NULL,
	`body_en` text NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pages_slug` PRIMARY KEY(`slug`)
);
--> statement-breakpoint
CREATE TABLE `passengers` (
	`id` varchar(36) NOT NULL,
	`booking_id` varchar(36) NOT NULL,
	`full_name` varchar(255) NOT NULL,
	CONSTRAINT `passengers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `password_resets` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `password_resets_id` PRIMARY KEY(`id`),
	CONSTRAINT `password_resets_token_hash_unique` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` varchar(36) NOT NULL,
	`booking_id` varchar(36) NOT NULL,
	`method` varchar(32) NOT NULL,
	`provider` varchar(32) NOT NULL DEFAULT 'SIMULATED',
	`amount` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`status` varchar(16) NOT NULL,
	`provider_reference` varchar(255),
	`failure_reason` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` varchar(191) NOT NULL,
	`value` text NOT NULL,
	CONSTRAINT `settings_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `transport_providers` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`contact` varchar(128) NOT NULL DEFAULT '',
	`description` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transport_providers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transports` (
	`id` varchar(36) NOT NULL,
	`provider_id` varchar(36) NOT NULL,
	`mode` varchar(16) NOT NULL DEFAULT 'SHUTTLE',
	`from_place` varchar(255) NOT NULL,
	`to_place` varchar(255) NOT NULL,
	`depart_at` timestamp NOT NULL,
	`arrive_at` timestamp NOT NULL,
	`driver_name` varchar(255) NOT NULL DEFAULT '',
	`access_conditions` text NOT NULL,
	`currency` varchar(8) NOT NULL,
	`price` int NOT NULL,
	`seats_available` int NOT NULL,
	`description` text NOT NULL,
	`photos` text NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'DRAFT',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role` varchar(16) NOT NULL DEFAULT 'CLIENT',
	`lang` varchar(8) NOT NULL DEFAULT 'fr',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `vehicle_brands` (
	`id` varchar(36) NOT NULL,
	`name` varchar(191) NOT NULL,
	CONSTRAINT `vehicle_brands_id` PRIMARY KEY(`id`),
	CONSTRAINT `vehicle_brands_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `vehicle_categories` (
	`id` varchar(36) NOT NULL,
	`name` varchar(191) NOT NULL,
	CONSTRAINT `vehicle_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `vehicle_categories_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `vehicle_models` (
	`id` varchar(36) NOT NULL,
	`brand_id` varchar(36) NOT NULL,
	`name` varchar(191) NOT NULL,
	CONSTRAINT `vehicle_models_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` varchar(36) NOT NULL,
	`model_id` varchar(36) NOT NULL,
	`category_id` varchar(36) NOT NULL,
	`location` varchar(255) NOT NULL,
	`seats` int NOT NULL DEFAULT 5,
	`units` int NOT NULL DEFAULT 1,
	`currency` varchar(8) NOT NULL,
	`price_per_day` int NOT NULL,
	`amenities` text NOT NULL,
	`conditions` text NOT NULL,
	`photos` text NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'DRAFT',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vehicles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_logs` ADD CONSTRAINT `email_logs_booking_id_bookings_id_fk` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `flights` ADD CONSTRAINT `flights_airline_id_airlines_id_fk` FOREIGN KEY (`airline_id`) REFERENCES `airlines`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `hotel_properties` ADD CONSTRAINT `hotel_properties_hotel_id_hotels_id_fk` FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `passengers` ADD CONSTRAINT `passengers_booking_id_bookings_id_fk` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `password_resets` ADD CONSTRAINT `password_resets_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_booking_id_bookings_id_fk` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transports` ADD CONSTRAINT `transports_provider_id_transport_providers_id_fk` FOREIGN KEY (`provider_id`) REFERENCES `transport_providers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vehicle_models` ADD CONSTRAINT `vehicle_models_brand_id_vehicle_brands_id_fk` FOREIGN KEY (`brand_id`) REFERENCES `vehicle_brands`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vehicles` ADD CONSTRAINT `vehicles_model_id_vehicle_models_id_fk` FOREIGN KEY (`model_id`) REFERENCES `vehicle_models`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vehicles` ADD CONSTRAINT `vehicles_category_id_vehicle_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `vehicle_categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `bookings_user_idx` ON `bookings` (`user_id`);--> statement-breakpoint
CREATE INDEX `bookings_status_idx` ON `bookings` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `bookings_item_idx` ON `bookings` (`service_type`,`item_id`,`start_at`);--> statement-breakpoint
CREATE INDEX `flights_status_depart_idx` ON `flights` (`status`,`depart_at`);
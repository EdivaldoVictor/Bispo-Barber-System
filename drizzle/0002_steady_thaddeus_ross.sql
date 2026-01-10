ALTER TABLE `appointments` ADD `paymentStatus` enum('pending','completed','failed','refunded') DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `appointments` ADD `stripePaymentIntentId` varchar(255);--> statement-breakpoint
ALTER TABLE `appointments` ADD `stripeCheckoutSessionId` varchar(255);--> statement-breakpoint
ALTER TABLE `appointments` ADD `priceInCents` int;--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(255);
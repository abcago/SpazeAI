ALTER TABLE "users" ADD COLUMN "device_id" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_device_id_unique" UNIQUE("device_id");
CREATE TYPE "public"."subscription_period" AS ENUM('weekly', 'monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'cancelled', 'expired', 'grace_period');--> statement-breakpoint
ALTER TYPE "public"."transaction_type" ADD VALUE 'subscription';--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"period" "subscription_period" NOT NULL,
	"price_try" real NOT NULL,
	"coins_per_period" integer NOT NULL,
	"max_generations_per_period" integer NOT NULL,
	"apple_product_id" varchar(255),
	"google_product_id" varchar(255),
	"badge" varchar(100),
	"features" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" varchar(100) NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"current_period_start" timestamp DEFAULT now() NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"cancelled_at" timestamp,
	"auto_renew" boolean DEFAULT true NOT NULL,
	"apple_original_transaction_id" varchar(255),
	"apple_latest_receipt" text,
	"google_purchase_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "subscription_plan_id" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "generations_this_period" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "period_reset_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;
CREATE TYPE "public"."auth_provider" AS ENUM('email', 'apple', 'google', 'guest');--> statement-breakpoint
CREATE TYPE "public"."generation_status" AS ENUM('pending', 'generating', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."input_mode" AS ENUM('singlePhoto', 'twoPhotos');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('purchase', 'generation', 'refund', 'bonus');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "app_settings" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coin_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coin_amount" integer NOT NULL,
	"price_try" real NOT NULL,
	"badge" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"total_purchases" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generation_types" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"icon" varchar(50) NOT NULL,
	"input_mode" "input_mode" DEFAULT 'singlePhoto' NOT NULL,
	"fal_model" varchar(255) DEFAULT 'fal-ai/flux-pulid' NOT NULL,
	"prompt" text NOT NULL,
	"coin_cost" integer DEFAULT 2 NOT NULL,
	"estimated_seconds" integer DEFAULT 30 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"total_usage_count" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"generation_type_id" varchar(100) NOT NULL,
	"input_image_url" text,
	"input_image_url_2" text,
	"result_image_url" text,
	"result_image_url_2" text,
	"status" "generation_status" DEFAULT 'pending' NOT NULL,
	"coin_cost" integer NOT NULL,
	"error_message" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "transaction_type" NOT NULL,
	"coin_amount" integer NOT NULL,
	"price_try" real,
	"package_id" uuid,
	"generation_id" uuid,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255),
	"password_hash" text,
	"name" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"auth_provider" "auth_provider" DEFAULT 'email' NOT NULL,
	"apple_id" varchar(255),
	"google_id" varchar(255),
	"avatar_url" text,
	"coin_balance" integer DEFAULT 5 NOT NULL,
	"total_generations" integer DEFAULT 0 NOT NULL,
	"total_spent" real DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_active_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_apple_id_unique" UNIQUE("apple_id"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
ALTER TABLE "generations" ADD CONSTRAINT "generations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generations" ADD CONSTRAINT "generations_generation_type_id_generation_types_id_fk" FOREIGN KEY ("generation_type_id") REFERENCES "public"."generation_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_package_id_coin_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."coin_packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_generation_id_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."generations"("id") ON DELETE no action ON UPDATE no action;
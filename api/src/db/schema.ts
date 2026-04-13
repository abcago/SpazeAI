import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  pgEnum,
  jsonb,
  integer,
  real,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const authProviderEnum = pgEnum("auth_provider", ["email", "apple", "google", "guest"]);

export const generationStatusEnum = pgEnum("generation_status", [
  "pending",
  "generating",
  "completed",
  "failed",
]);

export const inputModeEnum = pgEnum("input_mode", ["singlePhoto", "twoPhotos"]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "purchase",
  "generation",
  "refund",
  "bonus",
  "subscription",
]);

export const subscriptionPeriodEnum = pgEnum("subscription_period", [
  "weekly",
  "monthly",
  "yearly",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "cancelled",
  "expired",
  "grace_period",
]);

// ── Users ───────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).unique(),
  passwordHash: text("password_hash"),
  name: varchar("name", { length: 255 }).notNull(),
  bio: text("bio"),
  role: userRoleEnum("role").notNull().default("user"),
  authProvider: authProviderEnum("auth_provider").notNull().default("email"),
  appleId: varchar("apple_id", { length: 255 }).unique(),
  googleId: varchar("google_id", { length: 255 }).unique(),
  deviceId: varchar("device_id", { length: 255 }).unique(),
  avatarUrl: text("avatar_url"),
  coinBalance: integer("coin_balance").notNull().default(5),
  totalGenerations: integer("total_generations").notNull().default(0),
  totalSpent: real("total_spent").notNull().default(0),
  // Period limits for current subscription/free tier
  generationsThisPeriod: integer("generations_this_period").notNull().default(0),
  periodResetAt: timestamp("period_reset_at"),
  isActive: boolean("is_active").notNull().default(true),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Generation Types ────────────────────────────────────
export const generationTypes = pgTable("generation_types", {
  id: varchar("id", { length: 100 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 50 }).notNull(),
  category: varchar("category", { length: 100 }).notNull().default("photo"),
  inputMode: inputModeEnum("input_mode").notNull().default("singlePhoto"),
  falModel: varchar("fal_model", { length: 255 }).notNull().default("fal-ai/flux-pulid"),
  prompt: text("prompt").notNull(),
  coinCost: integer("coin_cost").notNull().default(2),
  estimatedSeconds: integer("estimated_seconds").notNull().default(30),
  isActive: boolean("is_active").notNull().default(true),
  previewBeforeUrl: text("preview_before_url"),
  previewAfterUrl: text("preview_after_url"),
  totalUsageCount: integer("total_usage_count").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Generations ─────────────────────────────────────────
export const generations = pgTable("generations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  generationTypeId: varchar("generation_type_id", { length: 100 })
    .notNull()
    .references(() => generationTypes.id),
  inputImageUrl: text("input_image_url"),
  inputImageUrl2: text("input_image_url_2"),
  resultImageUrl: text("result_image_url"),
  resultImageUrl2: text("result_image_url_2"),
  status: generationStatusEnum("status").notNull().default("pending"),
  coinCost: integer("coin_cost").notNull(),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Coin Packages ───────────────────────────────────────
export const coinPackages = pgTable("coin_packages", {
  id: uuid("id").defaultRandom().primaryKey(),
  coinAmount: integer("coin_amount").notNull(),
  priceTRY: real("price_try").notNull(),
  badge: varchar("badge", { length: 100 }),
  isActive: boolean("is_active").notNull().default(true),
  totalPurchases: integer("total_purchases").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Transactions ────────────────────────────────────────
export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: transactionTypeEnum("type").notNull(),
  coinAmount: integer("coin_amount").notNull(),
  priceTRY: real("price_try"),
  packageId: uuid("package_id").references(() => coinPackages.id),
  generationId: uuid("generation_id").references(() => generations.id),
  subscriptionPlanId: varchar("subscription_plan_id", { length: 100 }),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── App Settings ────────────────────────────────────────
export const appSettings = pgTable("app_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Refresh Tokens ──────────────────────────────────────
export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Feed Posts ──────────────────────────────────────────
export const feedPosts = pgTable("feed_posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  generationId: uuid("generation_id")
    .notNull()
    .references(() => generations.id, { onDelete: "cascade" }),
  caption: text("caption"),
  likesCount: integer("likes_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Subscription Plans ──────────────────────────────────
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id", { length: 100 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  period: subscriptionPeriodEnum("period").notNull(),
  priceTRY: real("price_try").notNull(),
  coinsPerPeriod: integer("coins_per_period").notNull(),
  maxGenerationsPerPeriod: integer("max_generations_per_period").notNull(),
  // Apple StoreKit / Google Play product identifier
  appleProductId: varchar("apple_product_id", { length: 255 }),
  googleProductId: varchar("google_product_id", { length: 255 }),
  // Display
  badge: varchar("badge", { length: 100 }),
  features: jsonb("features").$type<string[]>().default([]),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── User Subscriptions ──────────────────────────────────
export const userSubscriptions = pgTable("user_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  planId: varchar("plan_id", { length: 100 })
    .notNull()
    .references(() => subscriptionPlans.id),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  currentPeriodStart: timestamp("current_period_start").notNull().defaultNow(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelledAt: timestamp("cancelled_at"),
  autoRenew: boolean("auto_renew").notNull().default(true),
  // Receipt verification (Apple/Google)
  appleOriginalTransactionId: varchar("apple_original_transaction_id", { length: 255 }),
  appleLatestReceipt: text("apple_latest_receipt"),
  googlePurchaseToken: text("google_purchase_token"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Post Likes ──────────────────────────────────────────
export const postLikes = pgTable("post_likes", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id")
    .notNull()
    .references(() => feedPosts.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

import { z } from "zod";

// ── Auth ────────────────────────────────────────────────
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(255),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const socialLoginSchema = z.object({
  provider: z.enum(["apple", "google"]),
  token: z.string(),
  email: z.string().email().optional(),
  name: z.string().optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string(),
});

// ── Generation Types ────────────────────────────────────
export const createGenerationTypeSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  description: z.string().min(1),
  icon: z.string().min(1).max(50),
  category: z.string().max(100).default("photo"),
  inputMode: z.enum(["singlePhoto", "twoPhotos"]).default("singlePhoto"),
  falModel: z.string().default("fal-ai/flux-pulid"),
  prompt: z.string().min(1),
  coinCost: z.number().int().positive(),
  estimatedSeconds: z.number().int().positive(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  metadata: z.record(z.unknown()).optional(),
});

export const updateGenerationTypeSchema = createGenerationTypeSchema
  .extend({
    previewBeforeUrl: z.string().optional(),
    previewAfterUrl: z.string().optional(),
  })
  .partial()
  .omit({ id: true });

// ── Generations ─────────────────────────────────────────
export const createGenerationSchema = z.object({
  generationTypeId: z.string(),
  inputImage: z.string(), // base64
  inputImage2: z.string().optional(), // base64 for twoPhotos mode
});

export const generationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  typeId: z.string().optional(),
  status: z.enum(["pending", "generating", "completed", "failed"]).optional(),
  userId: z.string().optional(),
});

// ── Coin Packages ───────────────────────────────────────
export const createCoinPackageSchema = z.object({
  coinAmount: z.number().int().positive(),
  priceTRY: z.number().positive(),
  badge: z.string().max(100).optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const updateCoinPackageSchema = createCoinPackageSchema.partial();

// ── Transactions ────────────────────────────────────────
export const transactionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: z.enum(["purchase", "generation", "refund", "bonus"]).optional(),
  userId: z.string().optional(),
});

// ── Admin Users ─────────────────────────────────────────
export const adminUserQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  role: z.enum(["user", "admin"]).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["user", "admin"]),
});

export const adjustCoinsSchema = z.object({
  amount: z.number().int(),
  reason: z.string().min(1),
});

// ── Settings ────────────────────────────────────────────
export const updateSettingsSchema = z.object({
  falApiKey: z.string().optional(),
  defaultCoinBonus: z.coerce.number().int().optional(),
  maintenanceMode: z.coerce.boolean().optional(),
  maxGenerationsPerDay: z.coerce.number().int().optional(),
  supportEmail: z.string().email().optional(),
});

// ── Feed ────────────────────────────────────────────────
export const publishToFeedSchema = z.object({
  generationId: z.string().uuid(),
  caption: z.string().max(500).optional(),
});

export const feedQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

// ── Profile ─────────────────────────────────────────────
export const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  bio: z.string().max(300).optional(),
});

// ── Pagination helper ───────────────────────────────────
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

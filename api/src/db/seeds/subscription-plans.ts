/**
 * Subscription Plans Seed
 * ────────────────────────────────────────────────────────
 * Default subscription tiers. Update freely; this seed is
 * idempotent and production-safe (UPSERT by id).
 */

export type SubscriptionPlanSeed = {
  id: string;
  name: string;
  description: string;
  period: "weekly" | "monthly" | "yearly";
  priceTRY: number;
  coinsPerPeriod: number;
  maxGenerationsPerPeriod: number;
  appleProductId?: string;
  googleProductId?: string;
  badge?: string;
  features: string[];
  isActive?: boolean;
  sortOrder: number;
};

export const subscriptionPlansSeed: SubscriptionPlanSeed[] = [
  {
    id: "starter_weekly",
    name: "Starter",
    description: "Try Pro features with a low-commitment weekly plan",
    period: "weekly",
    priceTRY: 49,
    coinsPerPeriod: 30,
    maxGenerationsPerPeriod: 30,
    appleProductId: "com.spazeai.app.starter.weekly",
    googleProductId: "starter_weekly",
    features: [
      "30 generations per week",
      "All photo styles",
      "Standard quality",
      "Cancel anytime",
    ],
    sortOrder: 1,
  },
  {
    id: "pro_monthly",
    name: "Pro",
    description: "The most popular plan for regular creators",
    period: "monthly",
    priceTRY: 149,
    coinsPerPeriod: 150,
    maxGenerationsPerPeriod: 150,
    appleProductId: "com.spazeai.app.pro.monthly",
    googleProductId: "pro_monthly",
    badge: "Most Popular",
    features: [
      "150 generations per month",
      "All photo + video styles",
      "Priority queue",
      "HD downloads",
      "Cancel anytime",
    ],
    sortOrder: 2,
  },
  {
    id: "premium_monthly",
    name: "Premium",
    description: "For power users who generate every day",
    period: "monthly",
    priceTRY: 299,
    coinsPerPeriod: 400,
    maxGenerationsPerPeriod: 400,
    appleProductId: "com.spazeai.app.premium.monthly",
    googleProductId: "premium_monthly",
    features: [
      "400 generations per month",
      "All styles unlocked",
      "Highest priority queue",
      "HD + 4K downloads",
      "Early access to new styles",
    ],
    sortOrder: 3,
  },
  {
    id: "annual",
    name: "Annual",
    description: "Best value — save 30% with yearly billing",
    period: "yearly",
    priceTRY: 2499,
    coinsPerPeriod: 4800,
    maxGenerationsPerPeriod: 400, // per month average
    appleProductId: "com.spazeai.app.annual",
    googleProductId: "annual",
    badge: "Save 30%",
    features: [
      "400 generations every month",
      "All Premium features",
      "30% savings vs monthly",
      "Premium support",
      "Early access",
    ],
    sortOrder: 4,
  },
];

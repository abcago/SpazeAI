import { Hono } from "hono";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  userSubscriptions,
  subscriptionPlans,
  users,
  transactions,
} from "../../db/schema.js";
import { authMiddleware, type AuthEnv } from "../../middleware/auth.js";

const subs = new Hono<AuthEnv>();

subs.use("/*", authMiddleware);

// ── Get current user's active subscription ──────────────
subs.get("/me", async (c) => {
  const user = c.get("user");

  const [activeSub] = await db
    .select({
      sub: userSubscriptions,
      plan: subscriptionPlans,
    })
    .from(userSubscriptions)
    .innerJoin(
      subscriptionPlans,
      eq(userSubscriptions.planId, subscriptionPlans.id)
    )
    .where(
      and(
        eq(userSubscriptions.userId, user.sub),
        eq(userSubscriptions.status, "active")
      )
    )
    .orderBy(desc(userSubscriptions.startedAt))
    .limit(1);

  if (!activeSub) {
    return c.json({ subscription: null, plan: null });
  }

  return c.json({
    subscription: activeSub.sub,
    plan: activeSub.plan,
  });
});

// ── Subscribe (called after Apple/Google purchase) ──────
const subscribeSchema = z.object({
  planId: z.string(),
  // Receipt data from Apple StoreKit / Google Play
  appleOriginalTransactionId: z.string().optional(),
  appleLatestReceipt: z.string().optional(),
  googlePurchaseToken: z.string().optional(),
});

subs.post("/subscribe", async (c) => {
  const user = c.get("user");
  const body = subscribeSchema.parse(await c.req.json());

  // Get the plan
  const [plan] = await db
    .select()
    .from(subscriptionPlans)
    .where(
      and(
        eq(subscriptionPlans.id, body.planId),
        eq(subscriptionPlans.isActive, true)
      )
    )
    .limit(1);

  if (!plan) return c.json({ error: "Plan not found or inactive" }, 404);

  // TODO: Verify Apple/Google receipt before granting subscription.
  // For now we trust the client (replace with verifyAppleReceipt() before going live).

  // Cancel any existing active subscription
  await db
    .update(userSubscriptions)
    .set({ status: "cancelled", cancelledAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(userSubscriptions.userId, user.sub),
        eq(userSubscriptions.status, "active")
      )
    );

  // Calculate period end
  const now = new Date();
  const periodEnd = new Date(now);
  if (plan.period === "weekly") periodEnd.setDate(periodEnd.getDate() + 7);
  else if (plan.period === "monthly") periodEnd.setMonth(periodEnd.getMonth() + 1);
  else if (plan.period === "yearly") periodEnd.setFullYear(periodEnd.getFullYear() + 1);

  // Create the subscription
  const [newSub] = await db
    .insert(userSubscriptions)
    .values({
      userId: user.sub,
      planId: plan.id,
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      appleOriginalTransactionId: body.appleOriginalTransactionId,
      appleLatestReceipt: body.appleLatestReceipt,
      googlePurchaseToken: body.googlePurchaseToken,
    })
    .returning();

  // Grant coins and reset usage counter
  const [dbUser] = await db
    .select({ coinBalance: users.coinBalance })
    .from(users)
    .where(eq(users.id, user.sub))
    .limit(1);

  await db
    .update(users)
    .set({
      coinBalance: (dbUser?.coinBalance ?? 0) + plan.coinsPerPeriod,
      generationsThisPeriod: 0,
      periodResetAt: periodEnd,
      totalSpent: 0, // optional: track lifetime
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.sub));

  // Record the transaction
  await db.insert(transactions).values({
    userId: user.sub,
    type: "subscription",
    coinAmount: plan.coinsPerPeriod,
    priceTRY: plan.priceTRY,
    subscriptionPlanId: plan.id,
    description: `Subscription: ${plan.name} (${plan.period})`,
  });

  return c.json({ subscription: newSub, plan }, 201);
});

// ── Cancel auto-renew (sub stays active until period end) ──
subs.post("/cancel", async (c) => {
  const user = c.get("user");

  const [active] = await db
    .select()
    .from(userSubscriptions)
    .where(
      and(
        eq(userSubscriptions.userId, user.sub),
        eq(userSubscriptions.status, "active")
      )
    )
    .limit(1);

  if (!active) return c.json({ error: "No active subscription" }, 404);

  await db
    .update(userSubscriptions)
    .set({
      autoRenew: false,
      cancelledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(userSubscriptions.id, active.id));

  return c.json({ message: "Auto-renew cancelled. Access continues until period end." });
});

export default subs;

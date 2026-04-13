import { Hono } from "hono";
import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { db } from "../../db/index.js";
import { subscriptionPlans } from "../../db/schema.js";
import { authMiddleware, adminMiddleware, type AuthEnv } from "../../middleware/auth.js";

const plans = new Hono<AuthEnv>();

// ── Public: list active plans (for mobile app shop) ─────
plans.get("/", async (c) => {
  const items = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.isActive, true))
    .orderBy(asc(subscriptionPlans.sortOrder));

  return c.json(items);
});

// ── Admin: list all plans (including inactive) ──────────
plans.get("/all", authMiddleware, adminMiddleware, async (c) => {
  const items = await db
    .select()
    .from(subscriptionPlans)
    .orderBy(asc(subscriptionPlans.sortOrder));

  return c.json(items);
});

// ── Admin: create / update plan ─────────────────────────
const planSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  description: z.string().min(1),
  period: z.enum(["weekly", "monthly", "yearly"]),
  priceTRY: z.number().positive(),
  coinsPerPeriod: z.number().int().positive(),
  maxGenerationsPerPeriod: z.number().int().positive(),
  appleProductId: z.string().optional(),
  googleProductId: z.string().optional(),
  badge: z.string().max(100).optional(),
  features: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

plans.post("/", authMiddleware, adminMiddleware, async (c) => {
  const body = planSchema.parse(await c.req.json());

  const [item] = await db.insert(subscriptionPlans).values(body).returning();
  return c.json(item, 201);
});

plans.patch("/:id", authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const body = planSchema.partial().omit({ id: true }).parse(await c.req.json());

  const [item] = await db
    .update(subscriptionPlans)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(subscriptionPlans.id, id))
    .returning();

  if (!item) return c.json({ error: "Plan not found" }, 404);
  return c.json(item);
});

plans.delete("/:id", authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const [item] = await db
    .delete(subscriptionPlans)
    .where(eq(subscriptionPlans.id, id))
    .returning({ id: subscriptionPlans.id });

  if (!item) return c.json({ error: "Plan not found" }, 404);
  return c.json({ message: "Deleted" });
});

export default plans;

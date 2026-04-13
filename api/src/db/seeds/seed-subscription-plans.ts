/**
 * Production-safe seed runner for subscription plans only.
 * Inserts new plans, updates existing ones (UPSERT by id).
 *
 * Usage:
 *   npm run db:seed:plans
 */
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { subscriptionPlans } from "../schema.js";
import { subscriptionPlansSeed } from "./subscription-plans.js";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log(`Seeding ${subscriptionPlansSeed.length} subscription plans...`);

  let inserted = 0;
  let updated = 0;

  for (const plan of subscriptionPlansSeed) {
    const values = {
      ...plan,
      isActive: plan.isActive ?? true,
      features: plan.features ?? [],
    };

    const [existing] = await db
      .select({ id: subscriptionPlans.id })
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, plan.id))
      .limit(1);

    if (existing) {
      await db
        .update(subscriptionPlans)
        .set({
          name: values.name,
          description: values.description,
          period: values.period,
          priceTRY: values.priceTRY,
          coinsPerPeriod: values.coinsPerPeriod,
          maxGenerationsPerPeriod: values.maxGenerationsPerPeriod,
          appleProductId: values.appleProductId,
          googleProductId: values.googleProductId,
          badge: values.badge,
          features: values.features,
          isActive: values.isActive,
          sortOrder: values.sortOrder,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionPlans.id, plan.id));
      updated++;
    } else {
      await db.insert(subscriptionPlans).values(values);
      inserted++;
    }
  }

  console.log(`✓ Done. Inserted: ${inserted}, Updated: ${updated}`);
  await pool.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

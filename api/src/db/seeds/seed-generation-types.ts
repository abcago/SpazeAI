/**
 * Production-safe seed runner for generation types only.
 *
 * Behavior:
 *   - Inserts new generation types (ON CONFLICT DO NOTHING by id)
 *   - Updates existing types' name, description, icon, prompt, coinCost,
 *     estimatedSeconds, sortOrder, isActive (so prompt tweaks ship)
 *   - Does NOT touch users, generations, transactions, settings
 *
 * Usage:
 *   npm run db:seed:gen-types
 *   # or
 *   node --env-file=.env node_modules/.bin/tsx src/db/seeds/seed-generation-types.ts
 */
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { generationTypes } from "../schema.js";
import { generationTypesSeed } from "./generation-types.js";

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  console.log(`Seeding ${generationTypesSeed.length} generation types...`);

  let inserted = 0;
  let updated = 0;

  for (const type of generationTypesSeed) {
    const values = {
      ...type,
      falModel: type.falModel ?? "fal-ai/flux-pulid",
      inputMode: type.inputMode ?? ("singlePhoto" as const),
      isActive: type.isActive ?? true,
    };

    const [existing] = await db
      .select({ id: generationTypes.id })
      .from(generationTypes)
      .where(eq(generationTypes.id, type.id))
      .limit(1);

    if (existing) {
      await db
        .update(generationTypes)
        .set({
          name: values.name,
          description: values.description,
          icon: values.icon,
          category: values.category,
          prompt: values.prompt,
          coinCost: values.coinCost,
          estimatedSeconds: values.estimatedSeconds,
          sortOrder: values.sortOrder,
          inputMode: values.inputMode,
          falModel: values.falModel,
          isActive: values.isActive,
          metadata: values.metadata ?? null,
          updatedAt: new Date(),
        })
        .where(eq(generationTypes.id, type.id));
      updated++;
    } else {
      await db.insert(generationTypes).values(values);
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

/**
 * Full database seed (development).
 *
 * Seeds: admin user, generation types, coin packages, app settings.
 * Generation types use the shared `seeds/generation-types.ts` file
 * so the data is identical between dev and production seeding.
 *
 * For production-safe gen-type-only seeding, use:
 *   npm run db:seed:gen-types
 */
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { users, generationTypes, coinPackages, appSettings } from "./schema.js";
import { hashPassword } from "../lib/password.js";
import { generationTypesSeed } from "./seeds/generation-types.js";

async function seed() {
  const pool = new pg.Pool({
    connectionString:
      process.env.DATABASE_URL ??
      "postgresql://spazeai:spazeai_dev@localhost:5432/spazeai",
  });

  const db = drizzle(pool);
  console.log("Seeding database...");

  // ── Admin user ──────────────────────────────────────────
  const passwordHash = await hashPassword("admin123456");
  await db
    .insert(users)
    .values({
      email: "admin@spazeai.com",
      passwordHash,
      name: "Admin",
      role: "admin",
      authProvider: "email",
      coinBalance: 999,
    })
    .onConflictDoNothing();

  // ── Generation Types ────────────────────────────────────
  for (const type of generationTypesSeed) {
    await db
      .insert(generationTypes)
      .values({
        ...type,
        falModel: type.falModel ?? "fal-ai/flux-pulid",
        inputMode: type.inputMode ?? "singlePhoto",
        isActive: type.isActive ?? true,
      })
      .onConflictDoNothing();
  }

  // ── Coin Packages ───────────────────────────────────────
  const packages = [
    { coinAmount: 10, priceTRY: 29.99, sortOrder: 1 },
    { coinAmount: 30, priceTRY: 69.99, sortOrder: 2 },
    { coinAmount: 75, priceTRY: 129.99, badge: "Popular", sortOrder: 3 },
    { coinAmount: 150, priceTRY: 219.99, badge: "20% savings", sortOrder: 4 },
    { coinAmount: 500, priceTRY: 549.99, badge: "40% savings", sortOrder: 5 },
  ];

  for (const pkg of packages) {
    await db.insert(coinPackages).values(pkg).onConflictDoNothing();
  }

  // ── Default Settings ────────────────────────────────────
  const settings = [
    { key: "defaultCoinBonus", value: "5" },
    { key: "maintenanceMode", value: "false" },
    { key: "maxGenerationsPerDay", value: "50" },
    { key: "supportEmail", value: "support@spazeai.com" },
  ];

  for (const s of settings) {
    await db.insert(appSettings).values(s).onConflictDoNothing();
  }

  console.log("Seed complete!");
  console.log("  Admin: admin@spazeai.com / admin123456");
  console.log(`  ${generationTypesSeed.length} generation types created`);
  console.log("  5 coin packages created");
  await pool.end();
}

seed().catch(console.error);

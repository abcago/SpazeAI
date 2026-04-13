/**
 * Backfill generation type previews from existing generations.
 *
 * For each generation type, picks the most recent successful generation
 * and copies its inputImageUrl → previewBeforeUrl and resultImageUrl →
 * previewAfterUrl. Skips types that already have previews unless --force.
 *
 * Usage:
 *   npm run db:populate-previews          # only fill missing previews
 *   npm run db:populate-previews -- --force   # overwrite existing previews
 *   npm run db:populate-previews -- --type baby_version   # one type only
 */
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, desc, isNotNull } from "drizzle-orm";
import { generationTypes, generations } from "../src/db/schema.js";

const args = process.argv.slice(2);
const force = args.includes("--force");
const typeIdx = args.indexOf("--type");
const onlyType = typeIdx >= 0 ? args[typeIdx + 1] : null;

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  // Get all generation types (or just one if --type specified)
  const types = onlyType
    ? await db.select().from(generationTypes).where(eq(generationTypes.id, onlyType))
    : await db.select().from(generationTypes);

  console.log(`Processing ${types.length} generation type(s)...\n`);

  let updated = 0;
  let skipped = 0;
  let noResults = 0;

  for (const type of types) {
    // Skip if already has previews and not forcing
    if (!force && type.previewBeforeUrl && type.previewAfterUrl) {
      console.log(`  ⊘ ${type.id}: already has previews (skipping)`);
      skipped++;
      continue;
    }

    // Find the most recent successful generation for this type that has
    // both an input image and a result image.
    const [latest] = await db
      .select()
      .from(generations)
      .where(
        and(
          eq(generations.generationTypeId, type.id),
          eq(generations.status, "completed"),
          isNotNull(generations.inputImageUrl),
          isNotNull(generations.resultImageUrl)
        )
      )
      .orderBy(desc(generations.createdAt))
      .limit(1);

    if (!latest) {
      console.log(`  ⚠ ${type.id}: no completed generations found`);
      noResults++;
      continue;
    }

    await db
      .update(generationTypes)
      .set({
        previewBeforeUrl: latest.inputImageUrl,
        previewAfterUrl: latest.resultImageUrl,
        updatedAt: new Date(),
      })
      .where(eq(generationTypes.id, type.id));

    console.log(`  ✓ ${type.id}: previews set from generation ${latest.id.slice(0, 8)}`);
    updated++;
  }

  console.log(`\n────────────────────────────────`);
  console.log(`Updated:    ${updated}`);
  console.log(`Skipped:    ${skipped} (already had previews; use --force to overwrite)`);
  console.log(`No results: ${noResults} (no completed generations yet)`);

  await pool.end();
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});

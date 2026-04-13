import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { generationTypes } from "../src/db/schema.js";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function main() {
  await db
    .insert(generationTypes)
    .values({
      id: "linkedin_corporate",
      name: "LinkedIn Pro",
      description: "Professional corporate headshot",
      icon: "💼",
      category: "realistic",
      inputMode: "singlePhoto",
      falModel: "fal-ai/flux-pulid",
      prompt:
        "Ultra realistic professional corporate LinkedIn headshot of this person, wearing a tailored modern business suit (charcoal gray or navy blue blazer with crisp white dress shirt), confident friendly smile, direct eye contact with camera, soft natural office lighting from a large window, slightly blurred modern corporate office background with subtle bokeh, shot on Canon EOS R5 with 85mm f/1.4 lens, shallow depth of field, sharp focus on the eyes, professional color grading, neutral skin tones, well-groomed hair, natural makeup, premium business portrait, magazine-quality executive photography, clean and polished look, approachable yet authoritative demeanor, high resolution photorealistic, DSLR studio quality, no filters, 4K detail",
      coinCost: 4,
      estimatedSeconds: 35,
      sortOrder: 12,
      isActive: true,
    })
    .onConflictDoNothing();

  console.log("LinkedIn Pro generation type added!");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

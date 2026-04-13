import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { appSettings } from "../../db/schema.js";
import { authMiddleware, adminMiddleware, type AuthEnv } from "../../middleware/auth.js";
import { updateSettingsSchema } from "../../lib/schemas.js";

const settings = new Hono<AuthEnv>();

settings.use("/*", authMiddleware);
settings.use("/*", adminMiddleware);

const DEFAULT_SETTINGS: Record<string, string> = {
  falApiKey: "",
  defaultCoinBonus: "5",
  maintenanceMode: "false",
  maxGenerationsPerDay: "50",
  supportEmail: "support@spazeai.com",
};

// Get all settings
settings.get("/", async (c) => {
  const rows = await db.select().from(appSettings);

  const result: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    result[row.key] = row.value;
  }

  return c.json(result);
});

// Update settings
settings.patch("/", async (c) => {
  const body = updateSettingsSchema.parse(await c.req.json());

  const entries = Object.entries(body).filter(([, v]) => v !== undefined);

  for (const [key, value] of entries) {
    const strValue = String(value);
    const existing = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, key))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(appSettings)
        .set({ value: strValue, updatedAt: new Date() })
        .where(eq(appSettings.key, key));
    } else {
      await db.insert(appSettings).values({ key, value: strValue });
    }
  }

  // Return updated settings
  const rows = await db.select().from(appSettings);
  const result: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    result[row.key] = row.value;
  }

  return c.json(result);
});

export default settings;

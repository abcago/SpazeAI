import { Hono } from "hono";
import { eq, asc } from "drizzle-orm";
import { db } from "../../db/index.js";
import { coinPackages } from "../../db/schema.js";
import { authMiddleware, adminMiddleware, type AuthEnv } from "../../middleware/auth.js";
import {
  createCoinPackageSchema,
  updateCoinPackageSchema,
} from "../../lib/schemas.js";

const packages = new Hono<AuthEnv>();

// Public: list active coin packages (for mobile app)
packages.get("/", async (c) => {
  const items = await db
    .select()
    .from(coinPackages)
    .where(eq(coinPackages.isActive, true))
    .orderBy(asc(coinPackages.sortOrder));

  return c.json(items);
});

// Admin: list all packages
packages.get("/all", authMiddleware, adminMiddleware, async (c) => {
  const items = await db
    .select()
    .from(coinPackages)
    .orderBy(asc(coinPackages.sortOrder));

  return c.json(items);
});

// Admin: create package
packages.post("/", authMiddleware, adminMiddleware, async (c) => {
  const body = createCoinPackageSchema.parse(await c.req.json());

  const [item] = await db
    .insert(coinPackages)
    .values(body)
    .returning();

  return c.json(item, 201);
});

// Admin: update package
packages.patch("/:id", authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const body = updateCoinPackageSchema.parse(await c.req.json());

  const [item] = await db
    .update(coinPackages)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(coinPackages.id, id))
    .returning();

  if (!item) return c.json({ error: "Package not found" }, 404);
  return c.json(item);
});

// Admin: delete package
packages.delete("/:id", authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param("id");

  const [item] = await db
    .delete(coinPackages)
    .where(eq(coinPackages.id, id))
    .returning({ id: coinPackages.id });

  if (!item) return c.json({ error: "Package not found" }, 404);
  return c.json({ message: "Deleted" });
});

export default packages;

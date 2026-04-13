import { Hono } from "hono";
import { eq, asc } from "drizzle-orm";
import { db } from "../../db/index.js";
import { generationTypes } from "../../db/schema.js";
import { authMiddleware, adminMiddleware, type AuthEnv } from "../../middleware/auth.js";
import {
  createGenerationTypeSchema,
  updateGenerationTypeSchema,
} from "../../lib/schemas.js";
import { uploadPreviewMedia } from "../../lib/r2.js";

const genTypes = new Hono<AuthEnv>();

// Public: list active generation types (for mobile app)
genTypes.get("/", async (c) => {
  const items = await db
    .select()
    .from(generationTypes)
    .where(eq(generationTypes.isActive, true))
    .orderBy(asc(generationTypes.sortOrder));

  return c.json(items);
});

// Admin: list all generation types (including inactive)
genTypes.get("/all", authMiddleware, adminMiddleware, async (c) => {
  const items = await db
    .select()
    .from(generationTypes)
    .orderBy(asc(generationTypes.sortOrder));

  return c.json(items);
});

// Admin: create generation type
genTypes.post("/", authMiddleware, adminMiddleware, async (c) => {
  const body = createGenerationTypeSchema.parse(await c.req.json());

  const [item] = await db
    .insert(generationTypes)
    .values(body)
    .returning();

  return c.json(item, 201);
});

// Admin: update generation type
genTypes.patch("/:id", authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const body = updateGenerationTypeSchema.parse(await c.req.json());

  const [item] = await db
    .update(generationTypes)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(generationTypes.id, id))
    .returning();

  if (!item) return c.json({ error: "Generation type not found" }, 404);
  return c.json(item);
});

// Admin: upload preview media (before/after images, gifs, videos)
genTypes.post("/:id/preview", authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param("id");

  const [existing] = await db
    .select({ id: generationTypes.id })
    .from(generationTypes)
    .where(eq(generationTypes.id, id))
    .limit(1);

  if (!existing) return c.json({ error: "Generation type not found" }, 404);

  const formData = await c.req.formData();
  const beforeFile = formData.get("before") as File | null;
  const afterFile = formData.get("after") as File | null;

  const update: Record<string, unknown> = { updatedAt: new Date() };

  if (beforeFile) {
    const buffer = Buffer.from(await beforeFile.arrayBuffer());
    const ext = getExtension(beforeFile.name, beforeFile.type);
    update.previewBeforeUrl = await uploadPreviewMedia(buffer, `previews/${id}_before.${ext}`, beforeFile.type);
  }

  if (afterFile) {
    const buffer = Buffer.from(await afterFile.arrayBuffer());
    const ext = getExtension(afterFile.name, afterFile.type);
    update.previewAfterUrl = await uploadPreviewMedia(buffer, `previews/${id}_after.${ext}`, afterFile.type);
  }

  const [item] = await db
    .update(generationTypes)
    .set(update)
    .where(eq(generationTypes.id, id))
    .returning();

  return c.json(item);
});

// Admin: delete generation type
genTypes.delete("/:id", authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param("id");

  const [item] = await db
    .delete(generationTypes)
    .where(eq(generationTypes.id, id))
    .returning({ id: generationTypes.id });

  if (!item) return c.json({ error: "Generation type not found" }, 404);
  return c.json({ message: "Deleted" });
});

function getExtension(filename: string, mimeType: string): string {
  if (filename.includes(".")) return filename.split(".").pop()!;
  if (mimeType.includes("gif")) return "gif";
  if (mimeType.includes("mp4") || mimeType.includes("video")) return "mp4";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("png")) return "png";
  return "jpg";
}

export default genTypes;

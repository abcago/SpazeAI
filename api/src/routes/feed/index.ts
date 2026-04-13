import { Hono } from "hono";
import { eq, and, desc, count } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  feedPosts,
  postLikes,
  generations,
  generationTypes,
  users,
} from "../../db/schema.js";
import { authMiddleware, type AuthEnv } from "../../middleware/auth.js";
import { publishToFeedSchema, feedQuerySchema } from "../../lib/schemas.js";

const feed = new Hono<AuthEnv>();

// All feed routes require auth
feed.use("/*", authMiddleware);

// ── Get public feed ─────────────────────────────────────
feed.get("/", async (c) => {
  const user = c.get("user");
  const query = feedQuerySchema.parse(c.req.query());
  const offset = (query.page - 1) * query.limit;

  const [items, [total]] = await Promise.all([
    db
      .select({
        id: feedPosts.id,
        caption: feedPosts.caption,
        likesCount: feedPosts.likesCount,
        createdAt: feedPosts.createdAt,
        userId: feedPosts.userId,
        userName: users.name,
        userAvatarUrl: users.avatarUrl,
        generationId: feedPosts.generationId,
        resultImageUrl: generations.resultImageUrl,
        resultImageUrl2: generations.resultImageUrl2,
        generationTypeId: generations.generationTypeId,
        generationTypeName: generationTypes.name,
      })
      .from(feedPosts)
      .innerJoin(users, eq(feedPosts.userId, users.id))
      .innerJoin(generations, eq(feedPosts.generationId, generations.id))
      .innerJoin(
        generationTypes,
        eq(generations.generationTypeId, generationTypes.id)
      )
      .orderBy(desc(feedPosts.createdAt))
      .limit(query.limit)
      .offset(offset),
    db.select({ count: count() }).from(feedPosts),
  ]);

  // Check which posts the current user has liked
  const postIds = items.map((i) => i.id);
  let likedPostIds: Set<string> = new Set();

  if (postIds.length > 0) {
    const likes = await db
      .select({ postId: postLikes.postId })
      .from(postLikes)
      .where(eq(postLikes.userId, user.sub));

    likedPostIds = new Set(likes.map((l) => l.postId));
  }

  const data = items.map((item) => ({
    ...item,
    isLiked: likedPostIds.has(item.id),
  }));

  return c.json({
    data,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: total.count,
      totalPages: Math.ceil(total.count / query.limit),
    },
  });
});

// ── Publish generation to feed ──────────────────────────
feed.post("/", async (c) => {
  const user = c.get("user");
  const body = publishToFeedSchema.parse(await c.req.json());

  // Verify the generation belongs to this user and is completed
  const [generation] = await db
    .select()
    .from(generations)
    .where(
      and(
        eq(generations.id, body.generationId),
        eq(generations.userId, user.sub),
        eq(generations.status, "completed")
      )
    )
    .limit(1);

  if (!generation) {
    return c.json(
      { error: "Generation not found or not completed" },
      404
    );
  }

  // Check if already published
  const [existing] = await db
    .select()
    .from(feedPosts)
    .where(eq(feedPosts.generationId, body.generationId))
    .limit(1);

  if (existing) {
    return c.json({ error: "This generation is already published" }, 409);
  }

  const [post] = await db
    .insert(feedPosts)
    .values({
      userId: user.sub,
      generationId: body.generationId,
      caption: body.caption,
    })
    .returning();

  return c.json(post, 201);
});

// ── Like / Unlike a post ────────────────────────────────
feed.post("/:id/like", async (c) => {
  const user = c.get("user");
  const postId = c.req.param("id");

  // Check post exists
  const [post] = await db
    .select()
    .from(feedPosts)
    .where(eq(feedPosts.id, postId))
    .limit(1);

  if (!post) return c.json({ error: "Post not found" }, 404);

  // Check if already liked
  const [existingLike] = await db
    .select()
    .from(postLikes)
    .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, user.sub)))
    .limit(1);

  if (existingLike) {
    // Unlike
    await db.delete(postLikes).where(eq(postLikes.id, existingLike.id));
    await db
      .update(feedPosts)
      .set({ likesCount: Math.max(0, post.likesCount - 1) })
      .where(eq(feedPosts.id, postId));

    return c.json({ liked: false, likesCount: Math.max(0, post.likesCount - 1) });
  } else {
    // Like
    await db.insert(postLikes).values({ postId, userId: user.sub });
    await db
      .update(feedPosts)
      .set({ likesCount: post.likesCount + 1 })
      .where(eq(feedPosts.id, postId));

    return c.json({ liked: true, likesCount: post.likesCount + 1 });
  }
});

// ── Delete own post ─────────────────────────────────────
feed.delete("/:id", async (c) => {
  const user = c.get("user");
  const postId = c.req.param("id");

  const [post] = await db
    .select()
    .from(feedPosts)
    .where(and(eq(feedPosts.id, postId), eq(feedPosts.userId, user.sub)))
    .limit(1);

  if (!post) return c.json({ error: "Post not found" }, 404);

  await db.delete(feedPosts).where(eq(feedPosts.id, postId));
  return c.json({ success: true });
});

export default feed;

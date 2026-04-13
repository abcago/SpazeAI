import { Hono } from "hono";
import { eq, desc, count } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  users,
  feedPosts,
  generations,
  generationTypes,
  postLikes,
} from "../../db/schema.js";
import { authMiddleware, type AuthEnv } from "../../middleware/auth.js";
import { updateProfileSchema, feedQuerySchema } from "../../lib/schemas.js";

const profile = new Hono<AuthEnv>();

profile.use("/*", authMiddleware);

// ── Update own profile ──────────────────────────────────
profile.put("/me", async (c) => {
  const user = c.get("user");
  const body = updateProfileSchema.parse(await c.req.json());

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.name !== undefined) updates.name = body.name;
  if (body.bio !== undefined) updates.bio = body.bio;

  await db.update(users).set(updates).where(eq(users.id, user.sub));

  const [updated] = await db
    .select({
      id: users.id,
      name: users.name,
      bio: users.bio,
      email: users.email,
      avatarUrl: users.avatarUrl,
      totalGenerations: users.totalGenerations,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, user.sub))
    .limit(1);

  return c.json(updated);
});

// ── Get public profile ──────────────────────────────────
profile.get("/:userId", async (c) => {
  const userId = c.req.param("userId");

  const [userRow] = await db
    .select({
      id: users.id,
      name: users.name,
      bio: users.bio,
      avatarUrl: users.avatarUrl,
      totalGenerations: users.totalGenerations,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!userRow) return c.json({ error: "User not found" }, 404);

  // Count published posts
  const [postCount] = await db
    .select({ count: count() })
    .from(feedPosts)
    .where(eq(feedPosts.userId, userId));

  // Count total likes received
  const userPosts = await db
    .select({ likesCount: feedPosts.likesCount })
    .from(feedPosts)
    .where(eq(feedPosts.userId, userId));

  const totalLikes = userPosts.reduce((sum, p) => sum + p.likesCount, 0);

  return c.json({
    ...userRow,
    postCount: postCount.count,
    totalLikes,
  });
});

// ── Get user's published posts ──────────────────────────
profile.get("/:userId/posts", async (c) => {
  const requestingUser = c.get("user");
  const userId = c.req.param("userId");
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
      .where(eq(feedPosts.userId, userId))
      .orderBy(desc(feedPosts.createdAt))
      .limit(query.limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(feedPosts)
      .where(eq(feedPosts.userId, userId)),
  ]);

  // Check likes
  const likes = await db
    .select({ postId: postLikes.postId })
    .from(postLikes)
    .where(eq(postLikes.userId, requestingUser.sub));

  const likedPostIds = new Set(likes.map((l) => l.postId));

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

export default profile;

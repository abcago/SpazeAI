import { Hono } from "hono";
import { eq, desc, count, and, ilike, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  users,
  generations,
  generationTypes,
  transactions,
  coinPackages,
} from "../../db/schema.js";
import {
  authMiddleware,
  adminMiddleware,
  type AuthEnv,
} from "../../middleware/auth.js";
import {
  adminUserQuerySchema,
  updateUserRoleSchema,
  adjustCoinsSchema,
  generationQuerySchema,
} from "../../lib/schemas.js";

const admin = new Hono<AuthEnv>();

admin.use("/*", authMiddleware);
admin.use("/*", adminMiddleware);

// ── Dashboard Stats ─────────────────────────────────────
admin.get("/stats", async (c) => {
  const [userCount] = await db.select({ count: count() }).from(users);
  const [activeUsers] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.isActive, true));
  const [genCount] = await db.select({ count: count() }).from(generations);

  const genByStatus = await db
    .select({ status: generations.status, count: count() })
    .from(generations)
    .groupBy(generations.status);

  const genByType = await db
    .select({
      typeId: generations.generationTypeId,
      count: count(),
    })
    .from(generations)
    .groupBy(generations.generationTypeId)
    .orderBy(desc(count()))
    .limit(10);

  const totalRevenue = await db
    .select({ total: sql<number>`coalesce(sum(${transactions.priceTRY}), 0)` })
    .from(transactions)
    .where(eq(transactions.type, "purchase"));

  const recentGenerations = await db
    .select({
      id: generations.id,
      userId: generations.userId,
      userName: users.name,
      generationTypeId: generations.generationTypeId,
      status: generations.status,
      coinCost: generations.coinCost,
      createdAt: generations.createdAt,
    })
    .from(generations)
    .leftJoin(users, eq(generations.userId, users.id))
    .orderBy(desc(generations.createdAt))
    .limit(10);

  return c.json({
    users: { total: userCount.count, active: activeUsers.count },
    generations: {
      total: genCount.count,
      byStatus: genByStatus,
      byType: genByType,
    },
    revenue: { totalTRY: totalRevenue[0]?.total ?? 0 },
    recentGenerations,
  });
});

// ── Dashboard Charts (30-day trends) ────────────────────
admin.get("/charts", async (c) => {
  const generationTrend = await db
    .select({
      date: sql<string>`to_char(${generations.createdAt}, 'YYYY-MM-DD')`,
      count: count(),
    })
    .from(generations)
    .where(sql`${generations.createdAt} > now() - interval '30 days'`)
    .groupBy(sql`to_char(${generations.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${generations.createdAt}, 'YYYY-MM-DD')`);

  const revenueTrend = await db
    .select({
      date: sql<string>`to_char(${transactions.createdAt}, 'YYYY-MM-DD')`,
      total: sql<number>`coalesce(sum(${transactions.priceTRY}), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.type, "purchase"),
        sql`${transactions.createdAt} > now() - interval '30 days'`
      )
    )
    .groupBy(sql`to_char(${transactions.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${transactions.createdAt}, 'YYYY-MM-DD')`);

  const userSignups = await db
    .select({
      date: sql<string>`to_char(${users.createdAt}, 'YYYY-MM-DD')`,
      count: count(),
    })
    .from(users)
    .where(sql`${users.createdAt} > now() - interval '30 days'`)
    .groupBy(sql`to_char(${users.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${users.createdAt}, 'YYYY-MM-DD')`);

  return c.json({ generationTrend, revenueTrend, userSignups });
});

// ── List Users ──────────────────────────────────────────
admin.get("/users", async (c) => {
  const query = adminUserQuerySchema.parse(c.req.query());
  const offset = (query.page - 1) * query.limit;

  const conditions = [];
  if (query.role) conditions.push(eq(users.role, query.role));
  if (query.isActive !== undefined) conditions.push(eq(users.isActive, query.isActive));
  if (query.search) {
    conditions.push(
      sql`(${ilike(users.name, `%${query.search}%`)} OR ${ilike(users.email, `%${query.search}%`)})`
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, [total]] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        authProvider: users.authProvider,
        coinBalance: users.coinBalance,
        totalGenerations: users.totalGenerations,
        totalSpent: users.totalSpent,
        isActive: users.isActive,
        lastActiveAt: users.lastActiveAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(query.limit)
      .offset(offset),
    db.select({ count: count() }).from(users).where(where),
  ]);

  return c.json({
    data: items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: total.count,
      totalPages: Math.ceil(total.count / query.limit),
    },
  });
});

// ── Get User Detail ─────────────────────────────────────
admin.get("/users/:id", async (c) => {
  const id = c.req.param("id");

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user) return c.json({ error: "User not found" }, 404);

  const [genCount] = await db
    .select({ count: count() })
    .from(generations)
    .where(eq(generations.userId, id));

  const { passwordHash, ...safeUser } = user;
  return c.json({ ...safeUser, generationCount: genCount.count });
});

// ── Update User Role ────────────────────────────────────
admin.patch("/users/:id/role", async (c) => {
  const id = c.req.param("id");
  const { role } = updateUserRoleSchema.parse(await c.req.json());

  const [user] = await db
    .update(users)
    .set({ role, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning({ id: users.id, email: users.email, name: users.name, role: users.role });

  if (!user) return c.json({ error: "User not found" }, 404);
  return c.json(user);
});

// ── Toggle User Active ──────────────────────────────────
admin.patch("/users/:id/toggle-active", async (c) => {
  const id = c.req.param("id");

  const [existing] = await db
    .select({ isActive: users.isActive })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!existing) return c.json({ error: "User not found" }, 404);

  const [user] = await db
    .update(users)
    .set({ isActive: !existing.isActive, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning({ id: users.id, email: users.email, name: users.name, isActive: users.isActive });

  return c.json(user);
});

// ── Adjust User Coins ───────────────────────────────────
admin.post("/users/:id/coins", async (c) => {
  const id = c.req.param("id");
  const { amount, reason } = adjustCoinsSchema.parse(await c.req.json());

  const [user] = await db
    .select({ coinBalance: users.coinBalance })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user) return c.json({ error: "User not found" }, 404);

  const newBalance = user.coinBalance + amount;
  if (newBalance < 0) return c.json({ error: "Balance cannot go below 0" }, 400);

  await db
    .update(users)
    .set({ coinBalance: newBalance, updatedAt: new Date() })
    .where(eq(users.id, id));

  await db.insert(transactions).values({
    userId: id,
    type: amount > 0 ? "bonus" : "refund",
    coinAmount: amount,
    description: reason,
  });

  return c.json({ id, coinBalance: newBalance });
});

// ── List All Generations (Admin) ────────────────────────
admin.get("/generations", async (c) => {
  const query = generationQuerySchema.parse(c.req.query());
  const offset = (query.page - 1) * query.limit;

  const conditions = [];
  if (query.typeId) conditions.push(eq(generations.generationTypeId, query.typeId));
  if (query.status) conditions.push(eq(generations.status, query.status));
  if (query.userId) conditions.push(eq(generations.userId, query.userId));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, [total]] = await Promise.all([
    db
      .select({
        id: generations.id,
        userId: generations.userId,
        userName: users.name,
        generationTypeId: generations.generationTypeId,
        generationTypeName: generationTypes.name,
        generationTypeInputMode: generationTypes.inputMode,
        inputImageUrl: generations.inputImageUrl,
        inputImageUrl2: generations.inputImageUrl2,
        resultImageUrl: generations.resultImageUrl,
        resultImageUrl2: generations.resultImageUrl2,
        status: generations.status,
        coinCost: generations.coinCost,
        errorMessage: generations.errorMessage,
        metadata: generations.metadata,
        createdAt: generations.createdAt,
        updatedAt: generations.updatedAt,
      })
      .from(generations)
      .leftJoin(users, eq(generations.userId, users.id))
      .leftJoin(generationTypes, eq(generations.generationTypeId, generationTypes.id))
      .where(where)
      .orderBy(desc(generations.createdAt))
      .limit(query.limit)
      .offset(offset),
    db.select({ count: count() }).from(generations).where(where),
  ]);

  return c.json({
    data: items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: total.count,
      totalPages: Math.ceil(total.count / query.limit),
    },
  });
});

// ── Delete Generation (Admin) ───────────────────────────
admin.delete("/generations/:id", async (c) => {
  const id = c.req.param("id");

  const [item] = await db
    .delete(generations)
    .where(eq(generations.id, id))
    .returning({ id: generations.id });

  if (!item) return c.json({ error: "Generation not found" }, 404);
  return c.json({ message: "Deleted" });
});

export default admin;

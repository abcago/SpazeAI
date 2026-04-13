import { Hono } from "hono";
import { eq, and, desc, count } from "drizzle-orm";
import { db } from "../../db/index.js";
import { transactions, users } from "../../db/schema.js";
import { authMiddleware, adminMiddleware, type AuthEnv } from "../../middleware/auth.js";
import { transactionQuerySchema } from "../../lib/schemas.js";

const txns = new Hono<AuthEnv>();

txns.use("/*", authMiddleware);

// User: list own transactions
txns.get("/me", async (c) => {
  const user = c.get("user");
  const query = transactionQuerySchema.parse(c.req.query());
  const offset = (query.page - 1) * query.limit;

  const conditions = [eq(transactions.userId, user.sub)];
  if (query.type) conditions.push(eq(transactions.type, query.type));

  const where = and(...conditions);

  const [items, [total]] = await Promise.all([
    db
      .select()
      .from(transactions)
      .where(where)
      .orderBy(desc(transactions.createdAt))
      .limit(query.limit)
      .offset(offset),
    db.select({ count: count() }).from(transactions).where(where),
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

// Admin: list all transactions
txns.get("/", adminMiddleware, async (c) => {
  const query = transactionQuerySchema.parse(c.req.query());
  const offset = (query.page - 1) * query.limit;

  const conditions = [];
  if (query.type) conditions.push(eq(transactions.type, query.type));
  if (query.userId) conditions.push(eq(transactions.userId, query.userId));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, [total]] = await Promise.all([
    db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        userName: users.name,
        type: transactions.type,
        coinAmount: transactions.coinAmount,
        priceTRY: transactions.priceTRY,
        description: transactions.description,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .where(where)
      .orderBy(desc(transactions.createdAt))
      .limit(query.limit)
      .offset(offset),
    db.select({ count: count() }).from(transactions).where(where),
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

export default txns;

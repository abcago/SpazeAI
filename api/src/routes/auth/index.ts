import { Hono } from "hono";
import { eq, and, gt } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users, refreshTokens } from "../../db/schema.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../lib/jwt.js";
import {
  loginSchema,
  registerSchema,
  refreshSchema,
  socialLoginSchema,
} from "../../lib/schemas.js";
import { authMiddleware, type AuthEnv } from "../../middleware/auth.js";

const auth = new Hono<AuthEnv>();

// ── Register ────────────────────────────────────────────
auth.post("/register", async (c) => {
  const body = registerSchema.parse(await c.req.json());

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, body.email))
    .limit(1);

  if (existing.length > 0) {
    return c.json({ error: "Email already registered" }, 409);
  }

  const passwordHash = await hashPassword(body.password);
  const [user] = await db
    .insert(users)
    .values({
      email: body.email,
      passwordHash,
      name: body.name,
      authProvider: "email",
    })
    .returning({ id: users.id, email: users.email, role: users.role, coinBalance: users.coinBalance });

  const accessToken = await signAccessToken({ sub: user.id, email: user.email!, role: user.role });
  const refreshToken = await signRefreshToken(user.id);

  await db.insert(refreshTokens).values({
    userId: user.id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return c.json({ accessToken, refreshToken, user }, 201);
});

// ── Login ───────────────────────────────────────────────
auth.post("/login", async (c) => {
  const body = loginSchema.parse(await c.req.json());

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, body.email))
    .limit(1);

  if (!user || !user.passwordHash || !(await verifyPassword(body.password, user.passwordHash))) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  if (!user.isActive) return c.json({ error: "Account is deactivated" }, 403);

  // Update last active
  await db.update(users).set({ lastActiveAt: new Date() }).where(eq(users.id, user.id));

  const accessToken = await signAccessToken({ sub: user.id, email: user.email!, role: user.role });
  const refreshToken = await signRefreshToken(user.id);

  await db.insert(refreshTokens).values({
    userId: user.id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return c.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      coinBalance: user.coinBalance,
    },
  });
});

// ── Social Login (Apple / Google) ───────────────────────
auth.post("/social", async (c) => {
  const body = socialLoginSchema.parse(await c.req.json());

  // In production, verify the token with Apple/Google
  // For now, trust the token and use provider ID
  const providerField = body.provider === "apple" ? "appleId" : "googleId";

  // Check if user exists by provider ID
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users[providerField], body.token))
    .limit(1);

  if (!user && body.email) {
    // Check by email
    [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email))
      .limit(1);

    if (user) {
      // Link provider to existing account
      await db
        .update(users)
        .set({ [providerField]: body.token, authProvider: body.provider })
        .where(eq(users.id, user.id));
    }
  }

  if (!user) {
    // Create new user
    [user] = await db
      .insert(users)
      .values({
        email: body.email,
        name: body.name ?? body.email?.split("@")[0] ?? "User",
        authProvider: body.provider,
        [providerField]: body.token,
      })
      .returning();
  }

  if (!user.isActive) return c.json({ error: "Account is deactivated" }, 403);

  await db.update(users).set({ lastActiveAt: new Date() }).where(eq(users.id, user.id));

  const accessToken = await signAccessToken({
    sub: user.id,
    email: user.email ?? "",
    role: user.role,
  });
  const refreshToken = await signRefreshToken(user.id);

  await db.insert(refreshTokens).values({
    userId: user.id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return c.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      coinBalance: user.coinBalance,
    },
  });
});

// ── Guest Login ─────────────────────────────────────────
auth.post("/guest", async (c) => {
  let body: { deviceId?: string } = {};
  try {
    body = await c.req.json();
  } catch {
    // empty body is OK for backwards compatibility
  }

  let user: typeof users.$inferSelect | undefined;

  // If deviceId provided, try to find existing guest for this device
  if (body.deviceId) {
    [user] = await db
      .select()
      .from(users)
      .where(eq(users.deviceId, body.deviceId))
      .limit(1);

    if (user) {
      // Existing account for this device — refresh last active and return it
      await db
        .update(users)
        .set({ lastActiveAt: new Date() })
        .where(eq(users.id, user.id));
    }
  }

  // No existing account — create a new one
  if (!user) {
    [user] = await db
      .insert(users)
      .values({
        name: "Guest",
        authProvider: "guest",
        deviceId: body.deviceId,
      })
      .returning();
  }

  if (!user.isActive) {
    return c.json({ error: "Account is deactivated" }, 403);
  }

  const accessToken = await signAccessToken({ sub: user.id, email: "", role: user.role });
  const refreshToken = await signRefreshToken(user.id);

  await db.insert(refreshTokens).values({
    userId: user.id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return c.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      coinBalance: user.coinBalance,
    },
  }, 201);
});

// ── Refresh Token ───────────────────────────────────────
auth.post("/refresh", async (c) => {
  const { refreshToken } = refreshSchema.parse(await c.req.json());

  let payload: { sub: string };
  try {
    payload = await verifyRefreshToken(refreshToken);
  } catch {
    return c.json({ error: "Invalid refresh token" }, 401);
  }

  const [stored] = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.token, refreshToken),
        gt(refreshTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!stored) return c.json({ error: "Refresh token expired or revoked" }, 401);

  await db.delete(refreshTokens).where(eq(refreshTokens.id, stored.id));

  const [user] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
  if (!user || !user.isActive) return c.json({ error: "User not found or deactivated" }, 401);

  const newAccessToken = await signAccessToken({
    sub: user.id,
    email: user.email ?? "",
    role: user.role,
  });
  const newRefreshToken = await signRefreshToken(user.id);

  await db.insert(refreshTokens).values({
    userId: user.id,
    token: newRefreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return c.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
});

// ── Link Guest Account to Real Account ──────────────────
auth.post("/link", authMiddleware, async (c) => {
  const currentUser = c.get("user");
  const body = socialLoginSchema.parse(await c.req.json());

  const providerField = body.provider === "apple" ? "appleId" : "googleId";

  // Check if the provider account already exists
  let [existingProvider] = await db
    .select()
    .from(users)
    .where(eq(users[providerField], body.token))
    .limit(1);

  if (existingProvider && existingProvider.id !== currentUser.sub) {
    // Provider already linked to a different account — merge guest data into existing
    // Transfer generations, transactions from guest to existing account
    const { generations, transactions: txns } = await import("../../db/schema.js");

    await db
      .update(generations)
      .set({ userId: existingProvider.id })
      .where(eq(generations.userId, currentUser.sub));

    await db
      .update(txns)
      .set({ userId: existingProvider.id })
      .where(eq(txns.userId, currentUser.sub));

    // Add guest's coin balance to existing account
    const [guestUser] = await db
      .select({ coinBalance: users.coinBalance })
      .from(users)
      .where(eq(users.id, currentUser.sub))
      .limit(1);

    if (guestUser) {
      await db
        .update(users)
        .set({
          coinBalance: existingProvider.coinBalance + guestUser.coinBalance,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingProvider.id));
    }

    // Delete the guest account
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, currentUser.sub));
    await db.delete(users).where(eq(users.id, currentUser.sub));

    // Issue new tokens for the existing account
    const accessToken = await signAccessToken({
      sub: existingProvider.id,
      email: existingProvider.email ?? "",
      role: existingProvider.role,
    });
    const refreshToken = await signRefreshToken(existingProvider.id);

    await db.insert(refreshTokens).values({
      userId: existingProvider.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return c.json({
      accessToken,
      refreshToken,
      user: {
        id: existingProvider.id,
        email: existingProvider.email,
        name: existingProvider.name,
        role: existingProvider.role,
        coinBalance: existingProvider.coinBalance + (guestUser?.coinBalance ?? 0),
      },
    });
  }

  // No existing provider account — upgrade the guest account in place
  const updateData: Record<string, unknown> = {
    authProvider: body.provider,
    [providerField]: body.token,
    updatedAt: new Date(),
  };

  if (body.email) updateData.email = body.email;
  if (body.name) updateData.name = body.name;

  const [updated] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, currentUser.sub))
    .returning();

  const accessToken = await signAccessToken({
    sub: updated.id,
    email: updated.email ?? "",
    role: updated.role,
  });
  const refreshToken = await signRefreshToken(updated.id);

  await db.delete(refreshTokens).where(eq(refreshTokens.userId, updated.id));
  await db.insert(refreshTokens).values({
    userId: updated.id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return c.json({
    accessToken,
    refreshToken,
    user: {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      coinBalance: updated.coinBalance,
    },
  });
});

// ── Logout ──────────────────────────────────────────────
auth.post("/logout", authMiddleware, async (c) => {
  const user = c.get("user");
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, user.sub));
  return c.json({ message: "Logged out" });
});

// ── Me ──────────────────────────────────────────────────
auth.get("/me", authMiddleware, async (c) => {
  const payload = c.get("user");
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      authProvider: users.authProvider,
      avatarUrl: users.avatarUrl,
      coinBalance: users.coinBalance,
      totalGenerations: users.totalGenerations,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, payload.sub))
    .limit(1);

  if (!user) return c.json({ error: "User not found" }, 404);
  return c.json(user);
});

export default auth;

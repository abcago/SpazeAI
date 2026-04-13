import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { swaggerUI } from "@hono/swagger-ui";
import { env } from "./lib/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import auth from "./routes/auth/index.js";
import generationTypesRoutes from "./routes/generation-types/index.js";
import generationsRoutes from "./routes/generations/index.js";
import coinPackagesRoutes from "./routes/coin-packages/index.js";
import transactionsRoutes from "./routes/transactions/index.js";
import settingsRoutes from "./routes/settings/index.js";
import admin from "./routes/admin/index.js";
import feedRoutes from "./routes/feed/index.js";
import profileRoutes from "./routes/profile/index.js";
import subscriptionPlansRoutes from "./routes/subscription-plans/index.js";
import subscriptionsRoutes from "./routes/subscriptions/index.js";

const app = new Hono();

// ── Global Middleware ───────────────────────────────────
app.use("*", logger());
app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin: env.CORS_ORIGINS.split(","),
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.onError(errorHandler);

// ── Routes ──────────────────────────────────────────────
app.route("/api/auth", auth);
app.route("/api/generation-types", generationTypesRoutes);
app.route("/api/generations", generationsRoutes);
app.route("/api/coin-packages", coinPackagesRoutes);
app.route("/api/transactions", transactionsRoutes);
app.route("/api/settings", settingsRoutes);
app.route("/api/admin", admin);
app.route("/api/feed", feedRoutes);
app.route("/api/profile", profileRoutes);
app.route("/api/subscription-plans", subscriptionPlansRoutes);
app.route("/api/subscriptions", subscriptionsRoutes);

// ── Health Check ────────────────────────────────────────
app.get("/api/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Swagger UI ──────────────────────────────────────────
app.get("/docs", swaggerUI({ url: "/api/openapi" }));

app.get("/api/openapi", (c) => {
  return c.json({
    openapi: "3.0.0",
    info: {
      title: "SpazeAI API",
      version: "0.2.0",
      description: "API for SpazeAI mobile app and backoffice",
    },
    servers: [{ url: `http://localhost:${env.PORT}`, description: "Development" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
  });
});

// ── Startup Recovery ────────────────────────────────────
// Any generation row left in "generating" status when the server
// starts is an orphan from a crash / hot-reload. Mark them failed
// and refund the user. Skips rows newer than 30s (still in flight).
async function recoverOrphanedGenerations() {
  try {
    const { db } = await import("./db/index.js");
    const { generations, users, transactions } = await import("./db/schema.js");
    const { sql, eq, and, lt } = await import("drizzle-orm");

    const orphans = await db
      .select()
      .from(generations)
      .where(
        and(
          eq(generations.status, "generating"),
          lt(generations.createdAt, new Date(Date.now() - 30_000))
        )
      );

    if (orphans.length === 0) return;

    console.log(`[recovery] Found ${orphans.length} orphaned generations, refunding...`);

    for (const gen of orphans) {
      await db.transaction(async (tx) => {
        // Refund coins
        await tx
          .update(users)
          .set({ coinBalance: sql`${users.coinBalance} + ${gen.coinCost}` })
          .where(eq(users.id, gen.userId));

        // Record refund transaction
        await tx.insert(transactions).values({
          userId: gen.userId,
          type: "refund",
          coinAmount: gen.coinCost,
          generationId: gen.id,
          description: "Refund: server restart interrupted generation",
        });

        // Mark generation as failed
        await tx
          .update(generations)
          .set({
            status: "failed",
            errorMessage:
              "İşlem sunucu yeniden başlatılması nedeniyle kesildi. Coinleriniz iade edildi.",
            updatedAt: new Date(),
          })
          .where(eq(generations.id, gen.id));
      });
    }
    console.log(`[recovery] Refunded ${orphans.length} stuck generations`);
  } catch (err) {
    console.error("[recovery] Failed to recover orphaned generations:", err);
  }
}

// ── Start Server ────────────────────────────────────────
console.log(`SpazeAI API running on http://localhost:${env.PORT}`);

await recoverOrphanedGenerations();

serve({ fetch: app.fetch, port: env.PORT });

export default app;

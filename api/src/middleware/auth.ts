import { createMiddleware } from "hono/factory";
import type { Context } from "hono";
import { verifyAccessToken, type JwtPayload } from "../lib/jwt.js";

export type AuthEnv = {
  Variables: {
    user: JwtPayload;
  };
};

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid authorization header" }, 401);
  }

  try {
    const token = header.slice(7);
    const payload = await verifyAccessToken(token);
    c.set("user", payload);
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
});

export const adminMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const user = c.get("user");
  if (user.role !== "admin") {
    return c.json({ error: "Admin access required" }, 403);
  }
  await next();
});

export function getUser(c: Context) {
  return (c as unknown as { get(key: "user"): JwtPayload }).get("user");
}

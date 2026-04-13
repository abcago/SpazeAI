import { SignJWT, jwtVerify } from "jose";
import { env } from "./env.js";

const secret = new TextEncoder().encode(env.JWT_SECRET);
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  [key: string]: unknown;
}

export async function signAccessToken(payload: JwtPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(refreshSecret);
}

export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as JwtPayload;
}

export async function verifyRefreshToken(
  token: string
): Promise<{ sub: string }> {
  const { payload } = await jwtVerify(token, refreshSecret);
  return payload as unknown as { sub: string };
}

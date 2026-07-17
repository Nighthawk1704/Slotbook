import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const COOKIE = "slotbook_session";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-secret-change-me",
);

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  timezone: string;
  role: "provider" | "user";
};

export function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export async function verifyCredentials(email: string, password: string) {
  const [u] = await db.select().from(users).where(eq(users.email, email));
  if (!u) return null;
  const ok = await bcrypt.compare(password, u.passwordHash);
  if (!ok) return null;
  return u;
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** Returns the signed-in user, or null. Fresh DB read so timezone/role stay current. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.sub;
    if (!userId) return null;
    const [u] = await db.select().from(users).where(eq(users.id, userId));
    if (!u) return null;
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      timezone: u.timezone,
      role: u.role,
    };
  } catch {
    return null;
  }
}

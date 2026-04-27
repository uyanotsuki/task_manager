import { cookies } from "next/headers";
import { createSessionToken, verifySessionToken } from "@/lib/session-token";

export class SessionAuthError extends Error {
  constructor(message = "User not authenticated") {
    super(message);
    this.name = "SessionAuthError";
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export async function setSession(userId: string) {
  const token = await createSessionToken(userId);
  const cookieStore = await cookies();

  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
}

export async function getSessionUserId() {
  const session = await getSession();
  return session?.userId ?? null;
}

export async function requireSessionUserId() {
  const userId = await getSessionUserId();
  if (!userId) {
    throw new SessionAuthError();
  }
  return userId;
}
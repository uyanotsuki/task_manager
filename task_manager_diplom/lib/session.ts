import { getSession } from "@/lib/auth";

export class SessionAuthError extends Error {
  constructor(message = "User not authenticated") {
    super(message);
    this.name = "SessionAuthError";
  }
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
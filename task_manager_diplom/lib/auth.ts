import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { createSessionToken, verifySessionToken } from "@/lib/session-token"

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createToken(userId: string): Promise<string> {
  return createSessionToken(userId)
}

export async function verifyToken(token: string) {
  return verifySessionToken(token)
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  if (!token) return null

  return verifyToken(token)
}

export async function setSession(userId: string) {
  const token = await createToken(userId)
  const cookieStore = await cookies()

  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete("token")
}

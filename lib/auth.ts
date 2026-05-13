import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import type { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

const MIN_JWT_SECRET_LEN = 16

function getJwtSecretKey(): Uint8Array {
  const raw = process.env.JWT_SECRET?.trim()
  if (!raw || raw.length < MIN_JWT_SECRET_LEN) {
    throw new Error(
      `JWT_SECRET must be set in the environment (minimum ${MIN_JWT_SECRET_LEN} characters). ` +
        "Generate a value with: openssl rand -base64 32",
    )
  }
  return new TextEncoder().encode(raw)
}

const SESSION_COOKIE_NAME = "token"

const sessionCookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createToken(userId: string): Promise<string> {
  return new SignJWT({ userId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(getJwtSecretKey())
}

export async function verifyToken(token: string) {
  try {
    const verified = await jwtVerify(token, getJwtSecretKey())
    return verified.payload as { userId: string }
  } catch (err) {
    return null
  }
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!token) return null

  return verifyToken(token)
}

/** Надёжно для Route Handlers: cookie попадает в Set-Cookie ответа. */
export async function attachSessionToResponse(response: NextResponse, userId: string) {
  const token = await createToken(userId)
  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieBase)
}

export function clearSessionOnResponse(response: NextResponse) {
  response.cookies.delete({ name: SESSION_COOKIE_NAME, path: "/" })
}

export async function setSession(userId: string) {
  const token = await createToken(userId)
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieBase)
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

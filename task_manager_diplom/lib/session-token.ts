import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-this-in-production");

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({ userId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret);
}

export async function verifySessionToken(token: string) {
  try {
    const verified = await jwtVerify(token, secret);
    return verified.payload as { userId: string };
  } catch {
    return null;
  }
}

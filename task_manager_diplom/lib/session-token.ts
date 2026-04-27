import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-this-in-production");
const TOKEN_LIFETIME = "7d";

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_LIFETIME)
    .sign(secret);
}

export async function verifySessionToken(token: string) {
  try {
    const verified = await jwtVerify(token, secret);
    const { userId, exp, iat } = verified.payload;

    if (typeof userId !== "string" || typeof exp !== "number" || typeof iat !== "number") {
      return null;
    }

    return { userId, exp, iat };
  } catch {
    return null;
  }
}

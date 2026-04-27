# TaskForce (Next.js + Prisma)

## Architecture overview

- **Framework:** Next.js App Router (`app/`) with server-first rendering.
- **Database:** Prisma ORM (singleton client in `lib/prisma.ts`) with PostgreSQL.
- **Auth/session:** JWT is stored in an `httpOnly` cookie named `token`.
  - `lib/session-token.ts` handles JWT creation/verification only.
  - `lib/session.ts` handles high-level session access via cookies (`getSession`, `setSession`, `clearSession`, `requireSessionUserId`).
  - `lib/auth.ts` handles password hashing/verification (`bcryptjs`) only.

## Request flow

- Edge `middleware.ts` checks cookie token and protects non-auth pages.
- API route handlers use `requireSessionUserId()` / `getSession()` for auth checks.
- Protected operations use Prisma through `lib/prisma.ts` (no route-level `new PrismaClient()`).

## Validation and API behavior

- Profile update endpoints use lightweight Zod validation for input payloads.
- Error conventions:
  - `401` for unauthenticated requests
  - `400` for invalid input
  - `500` for unexpected server errors

## Current limitations

- No refresh-token flow (single JWT session cookie).
- Validation is intentionally basic and currently applied only to profile update APIs.

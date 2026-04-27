import { prisma } from "@/lib/prisma";
import { requireSessionUserId, SessionAuthError } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
});

export async function POST(req: Request) {
  try {
    const userId = await requireSessionUserId();
    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request body" }, { status: 400 });
    }
    const { name } = parsed.data;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    if (error instanceof SessionAuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { requireSessionUserId, SessionAuthError } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
  try {
    const userId = await requireSessionUserId();
    const { name } = await req.json();

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { name: name.trim() },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof SessionAuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
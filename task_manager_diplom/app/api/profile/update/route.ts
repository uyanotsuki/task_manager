import { prisma } from "@/lib/prisma";
import { requireSessionUserId, SessionAuthError } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const userId = await requireSessionUserId();
    const { name } = await req.json();

    if (!name || name.trim().length < 2) {
      return new Response("Invalid name", { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name },
    });

    return Response.json(updatedUser);
  } catch (error) {
    if (error instanceof SessionAuthError) {
      return new Response("Unauthorized", { status: 401 });
    }
    return new Response("Internal server error", { status: 500 });
  }
}
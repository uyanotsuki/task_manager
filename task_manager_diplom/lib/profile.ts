import { prisma } from "@/lib/prisma"
import { getSessionUserId } from "./session"

export async function getUserProfile() {
  const userId = await getSessionUserId(); // берем текущего пользователя
  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      teamMembers: {
        include: {
          team: true,
        },
      },
    },
  });

  return user;
}
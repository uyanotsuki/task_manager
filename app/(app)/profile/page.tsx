import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { isTransientPrismaConnectionError, prisma, withPrismaRetry } from "@/lib/prisma"
import { ProfilePageClient } from "@/components/profile-page-client"

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) {
    redirect("/login")
  }

  const userId = session.userId

  let user: { id: string; name: string; email: string; createdAt: Date } | null = null
  try {
    user = await withPrismaRetry(() =>
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      }),
    )
  } catch (error) {
    if (!isTransientPrismaConnectionError(error)) {
      throw error
    }
  }

  if (!user) {
    redirect("/login")
  }

  let projectsCount = 0
  let tasksAdded = 0
  let tasksAssigned = 0
  let tasksCompleted = 0
  try {
    ;[projectsCount, tasksAdded, tasksAssigned, tasksCompleted] = await withPrismaRetry(() =>
      Promise.all([
        prisma.team.count({
          where: {
            OR: [{ creatorId: userId }, { members: { some: { userId } } }],
          },
        }),
        prisma.task.count({
          where: { userId },
        }),
        prisma.task.count({
          where: { assignee: { userId } },
        }),
        prisma.task.count({
          where: { assignee: { userId }, status: "complete" },
        }),
      ]),
    )
  } catch (error) {
    if (!isTransientPrismaConnectionError(error)) {
      throw error
    }
  }

  return (
    <ProfilePageClient
      user={{
        name: user.name,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
      }}
      stats={{
        projectsCount,
        completedTasks: tasksCompleted,
        tasksAdded,
        tasksAssigned,
        tasksCompleted,
      }}
    />
  )
}

import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { isTransientPrismaConnectionError, prisma, withPrismaRetry } from "@/lib/prisma"
import { DashboardClient } from "@/components/dashboard-client"

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  let user: { id: string; name: string; email: string } | null = null
  try {
    user = await withPrismaRetry(() =>
      prisma.user.findUnique({
        where: { id: session.userId },
        select: {
          id: true,
          name: true,
          email: true,
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

  return <DashboardClient user={user} />
}

import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { assertTeamAccess } from "@/lib/team-access"
import { parseJson, taskReorderBodySchema } from "@/lib/api-schemas"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Пользователь не авторизован" }, { status: 401 })
    }

    let json: unknown
    try {
      json = await request.json()
    } catch {
      return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 })
    }

    const parsed = parseJson(taskReorderBodySchema, json)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const { taskId, newStatus, newOrder } = parsed.data

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, teamId: true },
    })
    if (!task) {
      return NextResponse.json({ error: "Задача не найдена" }, { status: 404 })
    }

    const access = await assertTeamAccess(task.teamId, session.userId)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        order: newOrder,
      },
      select: { id: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Ошибка обновления задачи:", error)
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

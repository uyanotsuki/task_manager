import { type NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { assertTeamAccess } from "@/lib/team-access"
import { parseJson, taskReorderBodySchema } from "@/lib/api-schemas"

type TaskStatus = "todo" | "inprogress" | "complete"

type TxClient = Prisma.TransactionClient

/** Перенумеровывает order у списка задач (0, 1, 2, …). */
async function applyOrders(
  tx: TxClient,
  items: Array<{ id: string }>,
  status?: TaskStatus,
) {
  for (let i = 0; i < items.length; i++) {
    await tx.task.update({
      where: { id: items[i].id },
      data: status !== undefined ? { status, order: i } : { order: i },
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Пользователь не авторизован" }, { status: 401 })
    }

    const parsed = parseJson(taskReorderBodySchema, await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const { taskId, newStatus, newOrder } = parsed.data

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, teamId: true, status: true },
    })

    if (!task) {
      return NextResponse.json({ error: "Задача не найдена" }, { status: 404 })
    }

    const access = await assertTeamAccess(task.teamId, session.userId)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const oldStatus = task.status as TaskStatus
    const teamId = task.teamId

    await prisma.$transaction(async (tx) => {
      if (oldStatus === newStatus) {
        // Перестановка внутри одной колонки: splice по индексу, затем перенумерация
        const columnTasks = await tx.task.findMany({
          where: { teamId, status: newStatus },
          orderBy: { order: "asc" },
          select: { id: true },
        })

        const fromIndex = columnTasks.findIndex((t) => t.id === taskId)
        if (fromIndex === -1) return

        const toIndex = Math.min(Math.max(newOrder, 0), columnTasks.length - 1)
        if (fromIndex === toIndex) return

        const [moved] = columnTasks.splice(fromIndex, 1)
        columnTasks.splice(toIndex, 0, moved)

        await applyOrders(tx, columnTasks)
      } else {
        // Cross-column: убираем из исходной, вставляем в целевую, пересчитываем обе
        const sourceTasks = await tx.task.findMany({
          where: { teamId, status: oldStatus },
          orderBy: { order: "asc" },
          select: { id: true },
        })

        const targetTasks = await tx.task.findMany({
          where: { teamId, status: newStatus, id: { not: taskId } },
          orderBy: { order: "asc" },
          select: { id: true },
        })

        const fromIndex = sourceTasks.findIndex((t) => t.id === taskId)
        if (fromIndex !== -1) {
          sourceTasks.splice(fromIndex, 1)
        }

        const toIndex = Math.min(Math.max(newOrder, 0), targetTasks.length)
        targetTasks.splice(toIndex, 0, { id: taskId })

        await applyOrders(tx, sourceTasks)
        await applyOrders(tx, targetTasks, newStatus)
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Reorder error:", error)
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

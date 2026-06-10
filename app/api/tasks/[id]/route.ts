import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { ensureTaskDeadlineColumn, prisma } from "@/lib/prisma"
import { assertTeamAccess } from "@/lib/team-access"
import { parseJson, taskIdParamsSchema, taskPatchBodySchema } from "@/lib/api-schemas"

const taskResponseSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  deadline: true,
  order: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  teamId: true,
  assigneeId: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  assignee: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
}

function isMissingTaskDeadlineColumn(error: any): boolean {
  if (error?.code !== "P2022") {
    return false
  }

  const column = String(error?.meta?.column ?? "").toLowerCase()
  const message = String(error?.message ?? "").toLowerCase()

  return (
    column === "deadline" ||
    column.endsWith(".deadline") ||
    message.includes("`deadline` does not exist") ||
    message.includes("column `deadline` does not exist") ||
    message.includes("task.deadline")
  )
}

async function hydrateTaskAssignee<T extends { assigneeId: string | null; teamId: string; assignee: any }>(task: T): Promise<T> {
  if (!task.assigneeId || task.assignee) {
    return task
  }

  const member = await prisma.teamMember.findFirst({
    where: {
      teamId: task.teamId,
      OR: [{ id: task.assigneeId }, { userId: task.assigneeId }],
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  if (!member) {
    return task
  }

  return { ...task, assignee: member }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureTaskDeadlineColumn()

    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Пользователь не авторизован" }, { status: 401 })
    }

    const { id } = await params

    const json = await request.json().catch(() => ({}))
    const parsedBody = parseJson(taskPatchBodySchema, json)
    if (!parsedBody.success) {
      return NextResponse.json({ error: parsedBody.error }, { status: 400 })
    }
    const body = parsedBody.data

    // Проверки
    const existingTask = await prisma.task.findUnique({
      where: { id },
      select: { teamId: true }
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Задача не найдена" }, { status: 404 })
    }

    const access = await assertTeamAccess(existingTask.teamId, session.userId)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    // === Основные данные + дедлайн + исполнитель ===
    const updateData: any = {}

    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.status !== undefined) updateData.status = body.status

    // Обработка исполнителя (assignee)
    if (body.assigneeId !== undefined) {
      if (body.assigneeId === null || body.assigneeId === "") {
        updateData.assigneeId = null
      } else {
        // Проверяем существование исполнителя в команде
        const teamMember = await prisma.teamMember.findFirst({
          where: {
            id: body.assigneeId,
            teamId: existingTask.teamId,
          },
        })
        
        if (!teamMember) {
          return NextResponse.json({ error: "Исполнитель не найден в этой команде" }, { status: 400 })
        }
        
        updateData.assigneeId = body.assigneeId
      }
    }

    // Дедлайн — максимально просто
    if (body.deadline !== undefined) {
      if (body.deadline === null || body.deadline === "" || body.deadline === "null") {
        updateData.deadline = null
      } else if (typeof body.deadline === "string") {
        const date = new Date(body.deadline)
        if (isNaN(date.getTime())) {
          return NextResponse.json({ error: "Некорректный формат даты" }, { status: 400 })
        }
        updateData.deadline = date
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      select: taskResponseSelect,
    })

    const hydratedTask = await hydrateTaskAssignee(updatedTask)

    return NextResponse.json({ task: hydratedTask })

  } catch (error: any) {
    console.error("[v0] Ошибка обновления задачи:", error)
    
    if (error.message?.includes("date") || error.message?.includes("Invalid")) {
      return NextResponse.json({ error: "Некорректный формат даты дедлайна" }, { status: 400 })
    }

    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Пользователь не авторизован" }, { status: 401 })
    }

    const rawParams = await params
    const paramResult = taskIdParamsSchema.safeParse(rawParams)
    if (!paramResult.success) {
      return NextResponse.json({ error: "Некорректный идентификатор задачи" }, { status: 400 })
    }
    const { id } = paramResult.data

    const existing = await prisma.task.findUnique({
      where: { id },
      select: { teamId: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const access = await assertTeamAccess(existing.teamId, session.userId)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    await prisma.task.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Ошибка удаления задачи:", error)
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}
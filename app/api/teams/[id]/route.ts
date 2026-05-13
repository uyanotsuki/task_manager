import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { assertTeamAccess } from "@/lib/team-access"
import { parseJson, teamIdParamsSchema, teamPatchBodySchema } from "@/lib/api-schemas"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rawParams = await params
    const paramResult = teamIdParamsSchema.safeParse(rawParams)
    if (!paramResult.success) {
      return NextResponse.json({ error: "Некорректный идентификатор проекта" }, { status: 400 })
    }
    const { id } = paramResult.data

    const team = await prisma.team.findFirst({
      where: {
        id,
        OR: [{ creatorId: session.userId }, { members: { some: { userId: session.userId } } }],
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
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
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    return NextResponse.json({ team })
  } catch (error) {
    console.error("[v0] Get team error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rawParams = await params
    const paramResult = teamIdParamsSchema.safeParse(rawParams)
    if (!paramResult.success) {
      return NextResponse.json({ error: "Некорректный идентификатор проекта" }, { status: 400 })
    }
    const { id } = paramResult.data

    let json: unknown
    try {
      json = await request.json()
    } catch {
      return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 })
    }

    const parsed = parseJson(teamPatchBodySchema, json)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const team = await prisma.team.findUnique({
      where: { id },
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const access = await assertTeamAccess(id, session.userId)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId: id,
        userId: session.userId,
        role: "admin",
      },
      select: { id: true },
    })

    if (!membership) {
      return NextResponse.json({ error: "Только администратор может редактировать проект" }, { status: 403 })
    }

    const updateData: { name: string; description?: string | null } = { name: parsed.data.name }
    if (parsed.data.description !== undefined) {
      updateData.description = parsed.data.description
    }

    const updatedTeam = await prisma.team.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
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
      },
    })

    return NextResponse.json({ team: updatedTeam })
  } catch (error) {
    console.error("[v0] Update team error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Пользователь не авторизован" }, { status: 401 })
    }

    const rawParams = await params
    const paramResult = teamIdParamsSchema.safeParse(rawParams)
    if (!paramResult.success) {
      return NextResponse.json({ error: "Некорректный идентификатор проекта" }, { status: 400 })
    }
    const { id } = paramResult.data

    const team = await prisma.team.findUnique({
      where: { id },
    })

    if (!team) {
      return NextResponse.json({ error: "Проект на найден" }, { status: 404 })
    }

    if (team.creatorId !== session.userId) {
      return NextResponse.json({ error: "Только тот, кто добавил проект может удалить его." }, { status: 403 })
    }

    await prisma.team.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Ошибка удаления проекта:", error)
    return NextResponse.json({ error: "Внутрення ошибка сервера" }, { status: 500 })
  }
}

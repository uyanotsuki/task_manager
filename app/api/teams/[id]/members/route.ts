import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { assertTeamAccess } from "@/lib/team-access"
import { memberIdQuerySchema, parseJson, parseSearchParams, teamIdParamsSchema, teamMemberPostBodySchema } from "@/lib/api-schemas"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    let json: unknown
    try {
      json = await request.json()
    } catch {
      return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 })
    }

    const parsed = parseJson(teamMemberPostBodySchema, json)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
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
    })

    if (!membership) {
      return NextResponse.json({ error: "Только администратор может добавить участников команды." }, { status: 403 })
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: parsed.data.email, mode: "insensitive" } },
    })

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 })
    }

    const existingMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: user.id,
          teamId: id,
        },
      },
    })

    if (existingMember) {
      return NextResponse.json({ error: "Пользователь уже является участником" }, { status: 400 })
    }

    const roleResolved = parsed.data.role?.trim() || "member"

    const member = await prisma.teamMember.create({
      data: {
        userId: user.id,
        teamId: id,
        role: roleResolved,
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

    return NextResponse.json({ member }, { status: 201 })
  } catch (error) {
    console.error("[v0] Ошибка при добавлении пользователя:", error)
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const rawParams = await params
    const paramResult = teamIdParamsSchema.safeParse(rawParams)
    if (!paramResult.success) {
      return NextResponse.json({ error: "Некорректный идентификатор проекта" }, { status: 400 })
    }
    const { id } = paramResult.data

    const { searchParams } = new URL(request.url)
    const q = parseSearchParams(memberIdQuerySchema, searchParams)
    if (!q.success) {
      return NextResponse.json({ error: q.error }, { status: 400 })
    }
    const { memberId } = q.data

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
    })

    if (!membership) {
      return NextResponse.json({ error: "Только администратор может удалить пользователей из проекта." }, { status: 403 })
    }

    const removed = await prisma.teamMember.deleteMany({
      where: { id: memberId, teamId: id },
    })

    if (removed.count === 0) {
      return NextResponse.json({ error: "Участник не найден в этом проекте" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Remove member error:", error)
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

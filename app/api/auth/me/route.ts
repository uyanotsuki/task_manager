import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { mePatchBodySchema, parseJson } from "@/lib/api-schemas"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("[v0] Get user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let json: unknown
    try {
      json = await request.json()
    } catch {
      return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 })
    }

    const parsed = parseJson(mePatchBodySchema, json)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const { name, email } = parsed.data
    const emailNormalized = email?.toLowerCase()

    // Проверка уникальности email
    if (emailNormalized) {
      const existingByEmail = await prisma.user.findUnique({
        where: { email: emailNormalized },
        select: { id: true },
      })

      if (existingByEmail && existingByEmail.id !== session.userId) {
        return NextResponse.json({ error: "Эта электронная почта уже используется" }, { status: 400 })
      }
    }

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: {
        ...(name !== undefined && { name }),
        ...(emailNormalized && { email: emailNormalized }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,       
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error("[v0] Update user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
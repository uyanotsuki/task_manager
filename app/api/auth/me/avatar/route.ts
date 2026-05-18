import { NextResponse } from "next/server"
import { put, del } from "@vercel/blob"

import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const MAX_SIZE = 2 * 1024 * 1024 // 2MB

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) return NextResponse.json({ error: "Файл не найден" }, { status: 400 })
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Файл слишком большой (макс. 2 МБ)" }, { status: 400 })
    }

    // Удаляем старый аватар
    const existing = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { avatarUrl: true }
    })

    if (existing?.avatarUrl) {
      try {
        await del(existing.avatarUrl)
      } catch (e) {
        console.warn("Failed to delete old avatar:", e)
      }
    }

    // Загружаем новый файл в Vercel Blob
    const blob = await put(`avatars/${session.userId}-${Date.now()}`, file, {
      access: "public",
      addRandomSuffix: true,
    })

    // Обновляем в базе
    const user = await prisma.user.update({
      where: { id: session.userId },
      data: { avatarUrl: blob.url },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        updatedAt: true,
      }
    })

    return NextResponse.json({ user })
  } catch (error: any) {
    console.error("[avatar] POST error:", error)
    return NextResponse.json({ error: "Не удалось загрузить аватар" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { avatarUrl: true }
    })

    if (user?.avatarUrl) {
      await del(user.avatarUrl).catch(() => {})
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: { avatarUrl: null },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        updatedAt: true,
      }
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error("[avatar] DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
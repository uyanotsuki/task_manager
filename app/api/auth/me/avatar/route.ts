import { NextResponse } from "next/server"
import { put, del } from "@vercel/blob"

import { getSession } from "@/lib/auth"
import {
  AVATAR_MIME_TO_EXT,
  MAX_AVATAR_BYTES,
  avatarBlobPathname,
  removeStoredAvatar,
} from "@/lib/avatar-storage"
import { prisma } from "@/lib/prisma"

const userSelect = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
} as const

function logAvatarError(
  operation: "POST" | "DELETE",
  error: unknown,
  context?: Record<string, unknown>,
) {
  console.error(`[avatar] ${operation} error:`, {
    ...context,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let uploadedBlobUrl: string | null = null

  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Нужно выбрать файл изображения" },
        { status: 400 },
      )
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "Пустой файл" }, { status: 400 })
    }

    if (file.size > MAX_AVATAR_BYTES) {
      return NextResponse.json(
        { error: "Файл слишком большой (максимум 2 МБ)" },
        { status: 400 },
      )
    }

    if (!AVATAR_MIME_TO_EXT[file.type]) {
      return NextResponse.json(
        { error: "Допустимы только изображения JPEG, PNG, WebP и GIF" },
        { status: 400 },
      )
    }

    const existing = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { avatarUrl: true },
    })

    if (existing?.avatarUrl) {
      await removeStoredAvatar(existing.avatarUrl)
    }

    const pathname = avatarBlobPathname(session.userId, file.type)

    const blob = await put(pathname, file, {
      access: "private",
      addRandomSuffix: false,
    })

    uploadedBlobUrl = blob.url

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: { avatarUrl: blob.url },
      select: userSelect,
    })

    return NextResponse.json({ user })
  } catch (error) {
    if (uploadedBlobUrl) {
      try {
        await del(uploadedBlobUrl)
      } catch (rollbackError) {
        logAvatarError("POST", rollbackError, {
          userId: session.userId,
          phase: "rollback",
          blobUrl: uploadedBlobUrl,
        })
      }
    }

    logAvatarError("POST", error, { userId: session.userId })
    return NextResponse.json(
      { error: "Не удалось загрузить аватар" },
      { status: 500 },
    )
  }
}

export async function DELETE() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { avatarUrl: true },
    })

    if (existing?.avatarUrl) {
      await removeStoredAvatar(existing.avatarUrl)
    }

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: { avatarUrl: null },
      select: userSelect,
    })

    return NextResponse.json({ user })
  } catch (error) {
    logAvatarError("DELETE", error, { userId: session.userId })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

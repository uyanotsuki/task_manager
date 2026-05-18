import { readFile } from "fs/promises"
import path from "path"
import { type NextRequest, NextResponse } from "next/server"

import { getSession } from "@/lib/auth"
import {
  isAllowedAvatarReference,
  isLegacyLocalAvatarPath,
} from "@/lib/avatar-storage"
import { fetchAvatarBlob } from "@/lib/blob"

/**
 * Прокси для private Blob — отдаёт изображение авторизованному пользователю.
 * Эквивалент signed URL для <img src="...">.
 */
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const blobUrl = request.nextUrl.searchParams.get("url")?.trim()
  if (!blobUrl) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 })
  }

  if (!isAllowedAvatarReference(blobUrl)) {
    return NextResponse.json({ error: "Invalid avatar url" }, { status: 400 })
  }

  try {
    if (isLegacyLocalAvatarPath(blobUrl)) {
      const rel = blobUrl.replace(/^\//, "")
      const filePath = path.join(process.cwd(), "public", rel)
      const buffer = await readFile(filePath)
      const ext = path.extname(filePath).toLowerCase()
      const contentType =
        ext === ".png"
          ? "image/png"
          : ext === ".webp"
            ? "image/webp"
            : ext === ".gif"
              ? "image/gif"
              : "image/jpeg"

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "private, no-cache",
          "X-Content-Type-Options": "nosniff",
        },
      })
    }

    const result = await fetchAvatarBlob(blobUrl)

    if (!result) {
      return new NextResponse("Not found", { status: 404 })
    }

    if (result.statusCode === 304) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: result.blob.etag,
          "Cache-Control": "private, no-cache",
        },
      })
    }

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType,
        "X-Content-Type-Options": "nosniff",
        ETag: result.blob.etag,
        "Cache-Control": "private, no-cache",
      },
    })
  } catch (error) {
    console.error("[avatar/view] GET error:", {
      blobUrl,
      userId: session.userId,
      message: error instanceof Error ? error.message : error,
    })
    return new NextResponse("Failed to load avatar", { status: 500 })
  }
}

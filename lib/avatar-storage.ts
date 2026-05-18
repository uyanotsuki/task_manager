import { del } from "@vercel/blob"
import { unlink } from "fs/promises"
import path from "path"

/** Максимальный размер загружаемого аватара (2 МБ). */
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024

/** Допустимые MIME → расширение файла в Blob Store. */
export const AVATAR_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
}

const LEGACY_PREFIX = "/uploads/avatars/"

/** Путь в Blob Store: avatars/{userId}.jpg (без random suffix). */
export function avatarBlobPathname(userId: string, mimeType: string): string {
  const ext = AVATAR_MIME_TO_EXT[mimeType]
  if (!ext) {
    throw new Error(`Unsupported avatar MIME type: ${mimeType}`)
  }
  return `avatars/${userId}${ext}`
}

/** Любой URL Vercel Blob (public или private). */
export function isVercelBlobUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    return hostname.includes("blob.vercel-storage.com")
  } catch {
    return false
  }
}

/** Private store: *.private.blob.vercel-storage.com */
export function isPrivateBlobUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    return hostname.endsWith(".private.blob.vercel-storage.com")
  } catch {
    return false
  }
}

/** Старые записи в БД: /uploads/avatars/{userId}.ext */
export function isLegacyLocalAvatarPath(url: string): boolean {
  const normalized = url.startsWith("/") ? url : `/${url}`
  return normalized.startsWith(LEGACY_PREFIX)
}

/** Только URL из нашего private/public store и legacy-пути. */
export function isAllowedAvatarReference(url: string): boolean {
  if (isLegacyLocalAvatarPath(url)) return true
  if (!isVercelBlobUrl(url)) return false
  try {
    const { pathname } = new URL(url)
    return pathname.startsWith("/avatars/")
  } catch {
    return false
  }
}

/**
 * Удаляет аватар из хранилища:
 * - Vercel Blob (private/public) → del(url)
 * - legacy local → unlink из public/uploads/avatars
 */
export async function removeStoredAvatar(avatarUrl: string): Promise<void> {
  if (isVercelBlobUrl(avatarUrl)) {
    try {
      await del(avatarUrl)
    } catch (error) {
      console.warn("[avatar] Failed to delete blob:", {
        avatarUrl,
        error: error instanceof Error ? error.message : error,
      })
    }
    return
  }

  if (isLegacyLocalAvatarPath(avatarUrl)) {
    const rel = avatarUrl.replace(/^\//, "")
    const fullPath = path.join(process.cwd(), "public", rel)
    try {
      await unlink(fullPath)
    } catch {
      // файл уже удалён или отсутствует
    }
  }
}

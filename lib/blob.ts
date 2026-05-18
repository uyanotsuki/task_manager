import "server-only"

import { get } from "@vercel/blob"

import {
  isAllowedAvatarReference,
  isLegacyLocalAvatarPath,
  isPrivateBlobUrl,
} from "@/lib/avatar-storage"

/** TTL по умолчанию для клиентского кэша display URL (секунды). */
export const DEFAULT_AVATAR_URL_EXPIRES_IN = 3600

/**
 * URL для отображения private blob в <img>.
 * В @vercel/blob нет getSignedUrl — используем прокси-роут приложения
 * (см. GET /api/avatar/view), что эквивалентно временному доступу.
 */
export function buildAvatarViewUrl(
  blobUrl: string,
  options?: { cacheKey?: string | null; expiresIn?: number },
): string {
  const params = new URLSearchParams({ url: blobUrl })
  const cacheKey = options?.cacheKey?.toString().trim()
  if (cacheKey) params.set("v", cacheKey)
  if (options?.expiresIn) params.set("exp", String(options.expiresIn))
  return `/api/avatar/view?${params.toString()}`
}

/**
 * Серверный аналог «signed URL» для private Blob.
 * Для legacy-путей возвращает относительный путь как есть.
 */
export async function getAvatarUrl(
  url: string | null | undefined,
  expiresIn = DEFAULT_AVATAR_URL_EXPIRES_IN,
): Promise<string | null> {
  if (!url?.trim()) return null

  const trimmed = url.trim()

  if (isLegacyLocalAvatarPath(trimmed)) {
    return trimmed
  }

  if (!isAllowedAvatarReference(trimmed)) {
    return null
  }

  if (isPrivateBlobUrl(trimmed)) {
    return buildAvatarViewUrl(trimmed, { expiresIn })
  }

  // public blob — прямой URL
  if (trimmed.startsWith("http")) {
    return trimmed
  }

  return null
}

/** Стрим private/public blob для прокси-роута. */
export async function fetchAvatarBlob(url: string) {
  if (!isAllowedAvatarReference(url) || isLegacyLocalAvatarPath(url)) {
    return null
  }

  return get(url, {
    access: isPrivateBlobUrl(url) ? "private" : "public",
  })
}

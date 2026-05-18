/**
 * Клиентские хелперы для отображения avatarUrl.
 * Private Blob не отдаётся напрямую в <img> — см. hooks/use-avatar.ts.
 */

export function formatAvatarCacheKey(
  cacheKey?: string | Date | null,
): string | null {
  if (cacheKey == null) return null
  if (cacheKey instanceof Date) return cacheKey.toISOString()
  const trimmed = String(cacheKey).trim()
  return trimmed.length > 0 ? trimmed : null
}

/** Private Vercel Blob Store */
export function isPrivateBlobUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    return hostname.endsWith(".private.blob.vercel-storage.com")
  } catch {
    return false
  }
}

/** Legacy: /uploads/avatars/... */
export function resolveLegacyAvatarSrc(
  imageUrl: string,
  cacheKey?: string | null,
): string | undefined {
  const origin =
    typeof window !== "undefined" ? window.location.origin : ""
  if (!origin) return imageUrl

  let src = imageUrl.startsWith("/") ? `${origin}${imageUrl}` : `${origin}/${imageUrl}`

  if (cacheKey) {
    const sep = src.includes("?") ? "&" : "?"
    src = `${src}${sep}v=${encodeURIComponent(cacheKey)}`
  }

  return src
}

/**
 * @deprecated Используйте useAvatar() в UserAvatar.
 * Оставлено для обратной совместимости с public/legacy URL.
 */
export function resolveAvatarImageSrc(
  imageUrl: string | null | undefined,
  options?: {
    cacheKey?: string | Date | null
    origin?: string
  },
): string | undefined {
  const raw = imageUrl?.trim()
  if (!raw) return undefined

  if (isPrivateBlobUrl(raw)) {
    return undefined
  }

  if (raw.startsWith("/uploads/avatars/")) {
    return resolveLegacyAvatarSrc(raw, formatAvatarCacheKey(options?.cacheKey))
  }

  if (!/^https?:\/\//i.test(raw)) {
    const origin =
      options?.origin ??
      (typeof window !== "undefined" ? window.location.origin : "")
    if (!origin) return undefined
    let src = raw.startsWith("/") ? `${origin}${raw}` : `${origin}/${raw}`
    const cacheKey = formatAvatarCacheKey(options?.cacheKey)
    if (cacheKey) {
      const sep = src.includes("?") ? "&" : "?"
      src = `${src}${sep}v=${encodeURIComponent(cacheKey)}`
    }
    return src
  }

  let src = raw
  const cacheKey = formatAvatarCacheKey(options?.cacheKey)
  if (cacheKey) {
    const sep = src.includes("?") ? "&" : "?"
    src = `${src}${sep}v=${encodeURIComponent(cacheKey)}`
  }
  return src
}

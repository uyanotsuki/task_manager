"use client"

import { useEffect, useState } from "react"

import {
  formatAvatarCacheKey,
  isPrivateBlobUrl,
  resolveLegacyAvatarSrc,
} from "@/lib/avatar-url"

const DEFAULT_EXPIRES_IN = 3600

type CacheEntry = {
  url: string
  expiresAt: number
}

/** Клиентский кэш display URL (не запрашиваем API на каждый рендер). */
const displayUrlCache = new Map<string, CacheEntry>()

function buildViewUrl(blobUrl: string, cacheKey: string | null, expiresIn: number) {
  const params = new URLSearchParams({ url: blobUrl, exp: String(expiresIn) })
  if (cacheKey) params.set("v", cacheKey)
  return `/api/avatar/view?${params.toString()}`
}

export type UseAvatarResult = {
  /** URL для <img> или undefined (показать fallback) */
  src: string | undefined
  loading: boolean
  error: boolean
}

/**
 * Резолвит avatarUrl для UserAvatar:
 * - private Blob → прокси /api/avatar/view (аналог signed URL)
 * - legacy /uploads/... → origin + path
 * - public Blob → прямой https URL
 */
export function useAvatar(
  imageUrl: string | null | undefined,
  imageCacheKey?: string | Date | null,
  expiresIn = DEFAULT_EXPIRES_IN,
): UseAvatarResult {
  const [src, setSrc] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    const raw = imageUrl?.trim()
    const cacheKey = formatAvatarCacheKey(imageCacheKey)

    if (!raw) {
      setSrc(undefined)
      setLoading(false)
      setError(false)
      return
    }

    if (raw.startsWith("/uploads/avatars/")) {
      setSrc(resolveLegacyAvatarSrc(raw, cacheKey))
      setLoading(false)
      setError(false)
      return
    }

    if (isPrivateBlobUrl(raw)) {
      const mapKey = `${raw}|${cacheKey ?? ""}|${expiresIn}`
      const cached = displayUrlCache.get(mapKey)
      const now = Date.now()

      if (cached && cached.expiresAt > now) {
        setSrc(cached.url)
        setLoading(false)
        setError(false)
        return
      }

      const viewUrl = buildViewUrl(raw, cacheKey, expiresIn)
      displayUrlCache.set(mapKey, {
        url: viewUrl,
        expiresAt: now + expiresIn * 1000,
      })

      setSrc(viewUrl)
      setLoading(false)
      setError(false)
      return
    }

    if (/^https?:\/\//i.test(raw)) {
      let publicSrc = raw
      if (cacheKey) {
        const sep = publicSrc.includes("?") ? "&" : "?"
        publicSrc = `${publicSrc}${sep}v=${encodeURIComponent(cacheKey)}`
      }
      setSrc(publicSrc)
      setLoading(false)
      setError(false)
      return
    }

    setSrc(undefined)
    setLoading(false)
    setError(true)
  }, [imageUrl, imageCacheKey, expiresIn])

  return { src, loading, error }
}

/** Сброс кэша после загрузки нового аватара */
export function invalidateAvatarDisplayCache() {
  displayUrlCache.clear()
}

'use client'

import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'

import { cn } from '@/lib/utils'

function initialsFromName(name: string): string {
  const cleaned = (name || '').trim()
  if (!cleaned) return '?'
  return cleaned
    .split(/\s+/)
    .map((p) => p[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Базовые компоненты
function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        'relative flex size-8 shrink-0 overflow-hidden rounded-full',
        className,
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full object-cover', className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'bg-muted flex size-full items-center justify-center rounded-full font-semibold text-white',
        className,
      )}
      {...props}
    />
  )
}

// Улучшенный компонент с поддержкой аватарки пользователя
function UserAvatar({
  name,
  imageUrl,
  className,
  fallbackClassName,
  imageClassName,
  imageCacheKey,
}: {
  name: string
  imageUrl?: string | null
  className?: string
  fallbackClassName?: string
  imageClassName?: string
  /** Для инвалидации кэша браузера при смене аватарки */
  imageCacheKey?: string | null
}) {
  const initials = initialsFromName(name)

  const src = imageUrl
    ? imageCacheKey
      ? `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}v=${encodeURIComponent(imageCacheKey)}`
      : imageUrl
    : undefined

  return (
    <Avatar className={className}>
      {src && <AvatarImage src={src} alt="" className={imageClassName} />}
      <AvatarFallback className={fallbackClassName}>
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}

export { Avatar, AvatarImage, AvatarFallback, UserAvatar }
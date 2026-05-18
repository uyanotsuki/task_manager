'use client'

import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'

import { useAvatar } from '@/hooks/use-avatar'
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

type UserAvatarProps = {
  name: string
  /** Private Blob URL, public Blob URL или legacy /uploads/avatars/... */
  imageUrl?: string | null
  className?: string
  fallbackClassName?: string
  imageClassName?: string
  /** user.updatedAt — сброс кэша после смены аватара */
  imageCacheKey?: string | Date | null
}

function UserAvatar({
  name,
  imageUrl,
  className,
  fallbackClassName,
  imageClassName,
  imageCacheKey,
}: UserAvatarProps) {
  const initials = initialsFromName(name)
  const { src, error } = useAvatar(imageUrl, imageCacheKey)

  const showImage = Boolean(src) && !error

  return (
    <Avatar className={className}>
      {showImage ? (
        <AvatarImage
          src={src}
          alt={name}
          className={imageClassName}
          onError={() => {
            // Radix покажет fallback при битой ссылке
          }}
        />
      ) : null}
      <AvatarFallback className={fallbackClassName}>{initials}</AvatarFallback>
    </Avatar>
  )
}

export { Avatar, AvatarImage, AvatarFallback, UserAvatar }

/**
 * Одноразовая миграция: локальные /uploads/avatars/* → Vercel Blob.
 *
 * Запуск (нужны DATABASE_URL и BLOB_READ_WRITE_TOKEN):
 *   pnpm migrate:avatars
 *   pnpm migrate:avatars -- --dry-run
 */
import { readFile } from "fs/promises"
import path from "path"
import { put } from "@vercel/blob"
import { PrismaClient } from "@prisma/client"

import {
  avatarBlobPathname,
  isLegacyLocalAvatarPath,
  isVercelBlobUrl,
} from "../lib/avatar-storage"

const prisma = new PrismaClient()
const dryRun = process.argv.includes("--dry-run")

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
}

async function main() {
  const users = await prisma.user.findMany({
    where: { avatarUrl: { not: null } },
    select: { id: true, avatarUrl: true },
  })

  let migrated = 0
  let skipped = 0
  let failed = 0

  for (const user of users) {
    const url = user.avatarUrl!
    if (isVercelBlobUrl(url)) {
      skipped++
      continue
    }

    if (!isLegacyLocalAvatarPath(url)) {
      console.warn(`[skip] ${user.id}: неизвестный формат URL: ${url}`)
      skipped++
      continue
    }

    const rel = url.replace(/^\//, "")
    const filePath = path.join(process.cwd(), "public", rel)
    const ext = path.extname(filePath).toLowerCase()
    const mime = MIME_BY_EXT[ext]

    if (!mime) {
      console.warn(`[skip] ${user.id}: неподдерживаемое расширение ${ext}`)
      skipped++
      continue
    }

    if (dryRun) {
      console.log(`[dry-run] ${user.id}: ${filePath} → Blob`)
      migrated++
      continue
    }

    try {
      const buffer = await readFile(filePath)
      const pathname = avatarBlobPathname(user.id, mime)
      const blob = await put(pathname, buffer, {
        access: "private",
        addRandomSuffix: false,
        contentType: mime,
      })

      await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: blob.url },
      })

      console.log(`[ok] ${user.id} → ${blob.url}`)
      migrated++
    } catch (error) {
      console.error(`[fail] ${user.id}:`, error)
      failed++
    }
  }

  console.log(
    `\nГотово. migrated=${migrated} skipped=${skipped} failed=${failed}${dryRun ? " (dry-run)" : ""}`,
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

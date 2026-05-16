"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserAvatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { notifyUserUpdated } from "@/lib/user-events"
import { Camera } from "lucide-react"
import { FolderKanban, CheckCircle2, Flame, BarChart3,} from "lucide-react"

type ProfileUser = {
  name: string
  email: string
  avatarUrl: string | null
  createdAt: string
  updatedAt?: string
}

type ProfileStats = {
  projectsCount: number
  completedTasks: number
  tasksAdded: number
  tasksAssigned: number
  tasksCompleted: number
}

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString()
}

export function ProfilePageClient({
  user,
  stats,
}: {
  user: ProfileUser
  stats: ProfileStats
}) {
  const [profile, setProfile] = useState<ProfileUser>(user)
  const [activeDays, setActiveDays] = useState<number>(1)
  const [isEditing, setIsEditing] = useState(false)
  const [draftName, setDraftName] = useState(user.name)
  const [draftEmail, setDraftEmail] = useState(user.email)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>("")

  const [avatarBusy, setAvatarBusy] = useState(false)
  const [avatarError, setAvatarError] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const imageCacheKey = profile.updatedAt ?? null

  useEffect(() => {
    setProfile(user)
    setDraftName(user.name)
    setDraftEmail(user.email)
  }, [user])

  useEffect(() => {
    const key = "qm_active_since"
    const now = Date.now()
    const existing = window.localStorage.getItem(key)
    const since = existing ? Number(existing) : NaN
    const start = Number.isFinite(since) ? since : now

    if (!Number.isFinite(since)) {
      window.localStorage.setItem(key, String(now))
    }

    const days = Math.max(
      1,
      Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1
    )

    setActiveDays(days)
  }, [])

  const openAvatarPicker = () => {
    setAvatarError("")
    fileInputRef.current?.click()
  }

  const uploadAvatar = async (file: File) => {
    setAvatarBusy(true)
    setAvatarError("")

    try {
      const fd = new FormData()
      fd.set("file", file)

      const res = await fetch("/api/auth/me/avatar", {
        method: "POST",
        body: fd,
        credentials: "include",
      })

      const payload = await res.json()

      if (!res.ok) {
        throw new Error(payload?.error || "Не удалось загрузить аватар")
      }

      const u = payload.user

      const next = {
        name: u.name ?? profile.name,
        email: u.email ?? profile.email,
        avatarUrl: u.avatarUrl ?? null,
        createdAt: profile.createdAt,
        updatedAt: u.updatedAt
          ? new Date(u.updatedAt).toISOString()
          : profile.updatedAt,
      }

      setProfile(next)
      notifyUserUpdated(u)
    } catch (e: unknown) {
      setAvatarError(
        e instanceof Error
          ? e.message
          : "Не удалось загрузить аватар"
      )
    } finally {
      setAvatarBusy(false)
    }
  }

  const onAvatarFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]

    e.target.value = ""

    if (!file) return

    await uploadAvatar(file)
  }

  const removeAvatar = async () => {
    setAvatarBusy(true)
    setAvatarError("")

    try {
      const res = await fetch("/api/auth/me/avatar", {
        method: "DELETE",
        credentials: "include",
      })

      const payload = await res.json()

      if (!res.ok) {
        throw new Error(payload?.error || "Не удалось удалить аватар")
      }

      const u = payload.user

      const next = {
        name: u.name ?? profile.name,
        email: u.email ?? profile.email,
        avatarUrl: u.avatarUrl ?? null,
        createdAt: profile.createdAt,
        updatedAt: u.updatedAt
          ? new Date(u.updatedAt).toISOString()
          : profile.updatedAt,
      }

      setProfile(next)
      notifyUserUpdated(u)
    } catch (e: unknown) {
      setAvatarError(
        e instanceof Error
          ? e.message
          : "Не удалось удалить аватар"
      )
    } finally {
      setAvatarBusy(false)
    }
  }

  const startEditing = () => {
    setError("")
    setDraftName(profile.name)
    setDraftEmail(profile.email)
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setError("")
    setDraftName(profile.name)
    setDraftEmail(profile.email)
    setIsEditing(false)
  }

  const saveProfile = async () => {
    setSaving(true)
    setError("")

    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draftName,
          email: draftEmail,
        }),
      })

      const payload = await res.json()

      if (!res.ok) {
        throw new Error(
          payload?.error || "Не удалось сохранить профиль"
        )
      }

      if (!payload?.user) {
        throw new Error("Сервер вернул некорректный ответ")
      }

      const next = {
        name: payload.user.name,
        email: payload.user.email,
        avatarUrl: payload.user.avatarUrl ?? null,
        createdAt: payload.user.createdAt,
        updatedAt: payload.user.updatedAt
          ? new Date(payload.user.updatedAt).toISOString()
          : profile.updatedAt,
      }

      setProfile(next)
      notifyUserUpdated(payload.user)

      setIsEditing(false)
    } catch (e: any) {
      setError(e?.message || "Не удалось сохранить профиль")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <main className="relative container mx-auto flex-1">
        <div className="space-y-6">
          {/* PROFILE CARD */}
          <Card className="
            rounded-3xl
            border border-violet-500/20
            bg-white
            shadow-sm
            dark:border-white/10
            dark:bg-white/5
            dark:backdrop-blur-xl
            dark:shadow-none
          ">
            <CardContent className="flex flex-col gap-6 p-8 lg:flex-row lg:items-center">
              
              {/* AVATAR */}
              <div className="flex flex-col items-center lg:items-start">
                <div className="relative">
                  <UserAvatar
                    className="h-24 w-24 ring-4 ring-white/40 dark:ring-white/10 shadow-sm"
                    name={profile.name}
                    imageUrl={profile.avatarUrl}
                    imageCacheKey={imageCacheKey}
                    fallbackClassName="bg-violet-600 text-xl font-semibold"
                  />

                  <button
                    type="button"
                    onClick={openAvatarPicker}
                    disabled={avatarBusy || saving}
                    className="
                      absolute bottom-0 right-0
                      flex h-8 w-8 items-center justify-center
                      rounded-full
                      border border-white/20
                      bg-background/80
                      backdrop-blur-md
                      text-sm
                      transition
                      hover:scale-105
                    "
                  >
                    <Camera className="h-4 w-4" />
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    tabIndex={-1}
                    onChange={onAvatarFileChange}
                  />
                </div>

                {profile.avatarUrl && (
                  <button
                    type="button"
                    disabled={avatarBusy || saving}
                    onClick={removeAvatar}
                    className="
                      mt-3 text-xs
                      text-muted-foreground
                      transition
                      hover:text-red-500
                    "
                  >
                    Удалить фото
                  </button>
                )}

                {avatarError && (
                  <p className="mt-2 text-xs text-destructive text-center lg:text-left">
                    {avatarError}
                  </p>
                )}
              </div>

              {/* USER INFO */}
              <div className="min-w-0 flex-1">
                <div className="truncate text-3xl font-semibold tracking-tight">
                  {profile.name}
                </div>

                <div className="mt-2 truncate text-sm text-muted-foreground/80">
                  {profile.email}
                </div>

                <div className="mt-1 text-sm text-muted-foreground/80">
                  Дата регистрации: {formatDate(profile.createdAt)}
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex items-center gap-2 lg:ml-auto">
                {!isEditing ? (
                  <Button
                    variant="outline"
                    onClick={startEditing}
                    className="
                      rounded-xl
                      border-violet-500/10
                      bg-white/40
                      dark:bg-white/5
                      backdrop-blur-md
                      hover:bg-white/60
                      dark:hover:bg-white/10
                    "
                  >
                    Редактировать
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={cancelEditing}
                      disabled={saving}
                      className="rounded-xl"
                    >
                      Отмена
                    </Button>

                    <Button
                      onClick={saveProfile}
                      disabled={saving}
                      className="rounded-xl"
                    >
                      {saving ? "Сохранение..." : "Сохранить"}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* EDIT FORM */}
          {isEditing && (
            <Card className="
              rounded-3xl
              border border-violet-500/20
              bg-white
              shadow-sm
              dark:border-white/10
              dark:bg-white/5
              dark:backdrop-blur-xl
              dark:shadow-none
            ">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Редактирование профиля
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {error && (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="profile-name">Имя</Label>

                  <Input
                    id="profile-name"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    disabled={saving}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-email">
                    Электронная почта
                  </Label>

                  <Input
                    id="profile-email"
                    type="email"
                    value={draftEmail}
                    onChange={(e) => setDraftEmail(e.target.value)}
                    disabled={saving}
                    className="rounded-xl"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* STATS */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="
              rounded-3xl
              border border-violet-500/20
              bg-white
              shadow-sm
              dark:border-white/10
              dark:bg-white/5
              dark:backdrop-blur-xl
              dark:shadow-none
            ">
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <div className="rounded-2xl bg-violet-500/10 p-3">
                    <FolderKanban className="h-5 w-5 text-violet-500" />
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      Проекты
                    </div>

                    <div className="mt-1 text-3xl font-bold">
                      {stats.projectsCount}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="
              rounded-3xl
              border border-violet-500/20
              bg-white
              shadow-sm
              dark:border-white/10
              dark:bg-white/5
              dark:backdrop-blur-xl
              dark:shadow-none
            ">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="rounded-2xl bg-green-500/10 p-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      Завершённые задачи
                    </div>

                    <div className="mt-1 text-3xl font-bold">
                      {stats.completedTasks}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="
              rounded-3xl
              border border-violet-500/20
              bg-white
              shadow-sm
              dark:border-white/10
              dark:bg-white/5
              dark:backdrop-blur-xl
              dark:shadow-none
            ">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="rounded-2xl bg-orange-500/10 p-3">
                    <Flame className="h-5 w-5 text-orange-500" />
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      Активные дни
                    </div>

                    <div className="mt-1 text-3xl font-bold">
                      {activeDays}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="
              rounded-3xl
              border border-violet-500/20
              bg-white
              shadow-sm
              dark:border-white/10
              dark:bg-white/5
              dark:backdrop-blur-xl
              dark:shadow-none
            ">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="rounded-2xl bg-blue-500/10 p-3">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      Статистика задач
                    </div>

                    <div className="mt-1 text-3xl font-bold">
                      {stats.tasksStats}
                    </div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Добавлено</span>
                    <span className="font-semibold text-foreground">
                      {stats.tasksAdded}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Назначено</span>
                    <span className="font-semibold text-foreground">
                      {stats.tasksAssigned}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Завершено</span>
                    <span className="font-semibold text-foreground">
                      {stats.tasksCompleted}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
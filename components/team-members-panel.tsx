"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { UserPlus, Trash2 } from "lucide-react"

interface Team {
  id: string
  members: Array<{
    id: string
    role: string
    user: {
      id: string
      name: string
      email: string
    }
  }>
}

interface TeamMembersPanelProps {
  team: Team
  isAdmin: boolean
  currentUserId: string
}

export function TeamMembersPanel({ team, isAdmin, currentUserId }: TeamMembersPanelProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("member")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<{
    id: string
    name: string
    email: string
  } | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch(`/api/teams/${team.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to add member")
        return
      }

      setEmail("")
      window.location.reload()
    } catch (err) {
      setError("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const openRemoveConfirm = (member: Team["members"][number]) => {
    setMemberToDelete({
      id: member.id,
      name: member.user.name,
      email: member.user.email,
    })
    setConfirmOpen(true)
  }

  const handleRemoveMember = async () => {
    if (!memberToDelete) return
  
    setDeleteLoading(true)
  
    try {
      const res = await fetch(`/api/teams/${team.id}/members?memberId=${memberToDelete.id}`, {
        method: "DELETE",
      })
      
      if (res.ok) {
        setConfirmOpen(false)
        // Сохраняем активную вкладку members и перезагружаем
        const url = new URL(window.location.href)
        url.searchParams.set('tab', 'members')
        window.location.href = url.toString()
      } else {
        console.error("Ошибка при удалении")
        setConfirmOpen(false)
      }
    } catch (error) {
      console.error("[v0] Remove member error:", error)
      setConfirmOpen(false)
    } finally {
      setDeleteLoading(false)
      setMemberToDelete(null)
    }
  }
  // const handleRemoveMember = async () => {
  //   if (!memberToDelete) return

  //   setConfirmOpen(false)
  //   setDeleteLoading(true)

  //   try {
  //     await fetch(`/api/teams/${team.id}/members?memberId=${memberToDelete.id}`, {
  //       method: "DELETE",
  //     })
  //     window.location.reload()
  //   } catch (error) {
  //     console.error("[v0] Remove member error:", error)
  //   } finally {
  //     setDeleteLoading(false)
  //     setMemberToDelete(null)
  //   }
  // }

  return (
    <div className="space-y-6">
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Добавить участника команды</CardTitle>
            <CardDescription>Пригласите пользователя присоединиться к вашей команде по электронной почте</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddMember} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="email">Электронная почта</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Роль</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Участник</SelectItem>
                      <SelectItem value="admin">Администратор</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={loading}>
                <UserPlus className="h-4 w-4 mr-2" />
                {loading ? "Adding..." : "Добавить участника"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Участники команды ({team.members.length})</CardTitle>
          <CardDescription>Управляйте вашей командой и её ролями</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {team.members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{member.user.name}</p>
                  <p className="text-sm text-muted-foreground">{member.user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={member.role === "admin" ? "default" : "secondary"}>{member.role}</Badge>
                  {isAdmin && member.user.id !== currentUserId && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => openRemoveConfirm(member)}
                      disabled={deleteLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open)
          if (!open) setMemberToDelete(null)
        }}
      >
        <DialogContent
          className="
            sm:max-w-[520px]
            rounded-3xl
            border border-black/5
            bg-white/80
            backdrop-blur-2xl
            shadow-2xl
            dark:bg-zinc-900/80
            dark:border-white/10
          "
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold tracking-tight">
              Удалить участника?
            </DialogTitle>
            <DialogDescription className="light:text-gray dark:text-white">
              {memberToDelete
                ? `Вы уверены, что хотите удалить ${memberToDelete.name} (${memberToDelete.email}) из команды?`
                : "Вы уверены, что хотите удалить этого участника из команды?"}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={deleteLoading}
              className="rounded-xl"
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveMember}
              disabled={deleteLoading}
              className="rounded-xl"
            >
              {deleteLoading ? "Удаление..." : "Удалить участника"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

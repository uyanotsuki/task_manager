import { prisma } from "@/lib/prisma"

/** Участник команды (включая создателя, если он в members — как при создании команды). */
export async function findTeamMembership(teamId: string, userId: string) {
  return prisma.teamMember.findFirst({
    where: { teamId, userId },
    select: { id: true, role: true },
  })
}

/** Доступ к команде: участник или создатель (на случай старых данных без строки в TeamMember). */
export async function canAccessTeam(teamId: string, userId: string): Promise<boolean> {
  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      OR: [{ creatorId: userId }, { members: { some: { userId } } }],
    },
    select: { id: true },
  })
  return Boolean(team)
}

export type AccessDenied = { ok: false; status: 403 | 404; error: string }

export type TeamMemberOk = { ok: true; membership: { id: string; role: string } }

/** Только участники с ролью admin (как в существующих handlers). */
export async function assertTeamAdmin(teamId: string, userId: string): Promise<TeamMemberOk | AccessDenied> {
  const membership = await prisma.teamMember.findFirst({
    where: { teamId, userId, role: "admin" },
    select: { id: true, role: true },
  })
  if (!membership) {
    return { ok: false, status: 403, error: "Требуются права администратора" }
  }
  return { ok: true, membership }
}

/** Любой участник команды или создатель. */
export async function assertTeamAccess(teamId: string, userId: string): Promise<{ ok: true } | AccessDenied> {
  const allowed = await canAccessTeam(teamId, userId)
  if (!allowed) {
    return { ok: false, status: 403, error: "Нет доступа к этому проекту" }
  }
  return { ok: true }
}

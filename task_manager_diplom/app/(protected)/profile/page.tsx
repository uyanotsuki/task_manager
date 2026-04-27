// app/profile/page.tsx
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileTabs from "./profile-tabs";

export default async function ProfilePage() {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      tasks: {
        select: { id: true, status: true },
      },
      teamMembers: {
        include: {
          team: {
            select: {
              id: true,
              name: true,
              description: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Статистика
  const createdTasks = user.tasks.length;

  const completedTasks = user.tasks.filter(t => 
    ["done", "completed", "DONE"].includes(t.status.toLowerCase())
  ).length;

  const assignedTasks = await prisma.task.count({
    where: {
      OR: [
        { assigneeId: { in: user.teamMembers.map((tm: any) => tm.id) } },
        { userId: userId } // задачи, созданные тобой (даже если assignee не указан)
      ]
    }
  });

  const stats = {
    totalTeams: user.teamMembers.length,
    createdTasks,
    assignedTasks,
    completedTasks,
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Профиль</h1>
          <p className="text-muted-foreground mt-1">Управляйте своим аккаунтом и смотрите статистику</p>
        </div>
      </div>

      <ProfileTabs user={user} stats={stats} />
    </div>
  );
}
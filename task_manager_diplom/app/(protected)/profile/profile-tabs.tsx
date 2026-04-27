// app/profile/profile-tabs.tsx
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, CheckCircle2, TrendingUp } from "lucide-react";
import ProfileForm from "./profile-form";
import ChangePasswordForm from "./change-password-form";

interface ProfileTabsProps {
  user: any;
  stats: {
    totalTeams: number;
    createdTasks: number;
    assignedTasks: number;
    completedTasks: number;
  };
}

export default function ProfileTabs({ user, stats }: ProfileTabsProps) {
  const completionRate = stats.createdTasks > 0 
    ? Math.round((stats.completedTasks / stats.createdTasks) * 100) 
    : 0;

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-8">
        <TabsTrigger value="overview">Обзор</TabsTrigger>
        <TabsTrigger value="teams">Мои команды</TabsTrigger>
        <TabsTrigger value="settings">Настройки</TabsTrigger>
      </TabsList>

      {/* ОБЗОР */}
      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Команды</CardTitle>
              <Users className="h-5 w-5 text-violet-500" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.totalTeams}</div>
              <p className="text-xs text-muted-foreground">в которых вы состоите</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Создано задач</CardTitle>
              <Target className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.createdTasks}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Назначено задач</CardTitle>
              <Users className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.assignedTasks}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Завершено</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-emerald-500">{stats.completedTasks}</div>
              <p className="text-xs text-emerald-500/80">{completionRate}% успеха</p>
            </CardContent>
          </Card>
        </div>

        {/* Прогресс бар */}
        <Card>
          <CardHeader>
            <CardTitle>Ваша продуктивность</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-2 text-sm">
                <span>Завершено из созданных</span>
                <span className="font-medium">{stats.completedTasks} / {stats.createdTasks}</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-violet-500 rounded-full transition-all"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* МОИ КОМАНДЫ */}
      <TabsContent value="teams" className="space-y-4">
        {user.teamMembers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Вы пока не состоите ни в одной команде</p>
            </CardContent>
          </Card>
        ) : (
          user.teamMembers.map((member: any) => (
            <Card key={member.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{member.team.name}</CardTitle>
                    {member.team.description && (
                      <p className="text-muted-foreground mt-1">{member.team.description}</p>
                    )}
                  </div>
                  <span className="px-3 py-1 bg-violet-500/10 text-violet-500 text-xs rounded-full capitalize">
                    {member.role}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Присоединились: {new Date(member.joinedAt).toLocaleDateString('ru-RU')}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </TabsContent>

      {/* НАСТРОЙКИ */}
      <TabsContent value="settings" className="space-y-10">
        <ProfileForm initialName={user.name} />
        <ChangePasswordForm />
      </TabsContent>
    </Tabs>
  );
}
// app/api/profile/change-password/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return Response.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) {
      return Response.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    // Проверяем текущий пароль
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return Response.json({ error: "Текущий пароль неверный" }, { status: 400 });
    }

    // Хэшируем новый пароль
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return Response.json({ message: "Пароль успешно изменён" });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
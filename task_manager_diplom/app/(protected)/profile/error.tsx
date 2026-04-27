"use client";

export default function ProfileError() {
  return (
    <div className="max-w-xl mx-auto p-8 space-y-3">
      <h2 className="text-xl font-semibold">Не удалось загрузить профиль</h2>
      <p className="text-muted-foreground">Попробуйте обновить страницу.</p>
    </div>
  );
}

// app/profile/change-password-form.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("Пароли не совпадают");
      return;
    }

    if (newPassword.length < 6) {
      setStatus("error");
      setMessage("Новый пароль должен быть не менее 6 символов");
      return;
    }

    setStatus("loading");
    setMessage("");

    const res = await fetch("/api/profile/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setStatus("success");
      setMessage("Пароль успешно изменён!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setStatus("error");
      setMessage(data.error || "Ошибка при смене пароля");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Смена пароля</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Текущий пароль</label>
            <div className="relative">
              <Input
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Новый пароль</label>
            <div className="relative">
              <Input
                type={showPasswords ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Подтвердите новый пароль</label>
            <div className="relative">
              <Input
                type={showPasswords ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="show"
              checked={showPasswords}
              onChange={() => setShowPasswords(!showPasswords)}
            />
            <label htmlFor="show" className="text-sm">Показать пароли</label>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={status === "loading"}
          >
            {status === "loading" ? "Меняем пароль..." : "Изменить пароль"}
          </Button>

          {message && (
            <p className={`text-sm text-center ${status === "success" ? "text-emerald-500" : "text-red-500"}`}>
              {message}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
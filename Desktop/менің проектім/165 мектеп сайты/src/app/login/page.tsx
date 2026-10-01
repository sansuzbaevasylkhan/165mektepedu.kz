"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Lock, Phone } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type UserRole = "student" | "parent";

export default function LoginPage() {
  const [role, setRole] = useState<UserRole>("student");
  const [formData, setFormData] = useState({
    phone: "+7 ",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (!value.startsWith("+7 ")) return;

    const digits = value.substring(2).replace(/\D/g, "");
    let formatted = "+7 ";

    if (digits.length > 0) formatted += "(" + digits.substring(0, 3);
    if (digits.length > 3) formatted += ") " + digits.substring(3, 6);
    if (digits.length > 6) formatted += "-" + digits.substring(6, 8);
    if (digits.length > 8) formatted += "-" + digits.substring(8, 11);

    setFormData({ ...formData, phone: formatted.substring(0, 18) });
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (formData.phone.length < 18) {
      setError("Телефон нөмірін толық енгізіңіз");
      return;
    }

    setLoading(true);
    try {
      const email = `${formData.phone.replace(/\s+/g, "")}@165mektep.edu.kz`;
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: formData.password,
      });

      if (authError) throw authError;

      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message || "Логин кезінде қате кетті");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-3xl border bg-background p-8 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-2xl">
            165
          </div>
          <h1 className="text-3xl font-bold">Кіру</h1>
          <p className="text-muted-foreground">Жеке кабинетіңізге кіріңіз</p>
        </div>

        <div className="flex p-1 bg-muted rounded-xl">
          <button
            type="button"
            onClick={() => setRole("student")}
            className={cn(
              "flex-1 py-2 text-sm font-semibold rounded-lg transition-all",
              role === "student" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            ОҚУШЫ
          </button>
          <button
            type="button"
            onClick={() => setRole("parent")}
            className={cn(
              "flex-1 py-2 text-sm font-semibold rounded-lg transition-all",
              role === "parent" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            АТА-АНА
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Телефон нөмірі</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                required
                className="w-full rounded-xl border bg-transparent py-2 pl-10 pr-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="+7 (777)-777-77-77"
                value={formData.phone}
                onChange={handlePhoneChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Пароль</label>
              <Link href="/forgot-password" className="text-xs text-primary font-semibold hover:underline">
                Парольді ұмыттыңыз ба?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                required
                type={showPassword ? "text" : "password"}
                className="w-full rounded-xl border bg-transparent py-2 pl-10 pr-10 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Парольді енгізіңіз"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm font-medium text-destructive text-center">{error}</p>}

          <button
            disabled={loading}
            type="submit"
            className={cn(
              "w-full rounded-xl py-3 text-sm font-bold transition-all",
              !loading
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {loading ? "КІРУДЕ..." : "КІРУ"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Аккаунтыңыз жоқ па? <Link href="/register" className="text-primary font-semibold hover:underline">Тіркеліңіз</Link>
        </p>
      </div>
    </div>
  );
}

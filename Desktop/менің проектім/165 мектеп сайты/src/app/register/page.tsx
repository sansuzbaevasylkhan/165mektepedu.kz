"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Lock, User, Phone } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type UserRole = "student" | "parent";

export default function RegisterPage() {
  const [role, setRole] = useState<UserRole>("student");
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "+7 ",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Парольдер сәйкес келмейді");
      return;
    }

    if (formData.phone.length < 18) {
      setError("Телефон нөмірін толық енгізіңіз");
      return;
    }

    setLoading(true);
    try {
      // Supabase handles email/password. To use phone as ID, we create a virtual email.
      const email = `${formData.phone.replace(/\s+/g, "")}@165mektep.edu.kz`;

      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password: formData.password,
      });

      if (authError) throw authError;
      if (!data.user) throw new Error("Пайдаланушы құрылған жоқ");

      // Create profile in profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .insert([
          {
            id: data.user.id,
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            role: role,
          },
        ]);

      if (profileError) throw profileError;

      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message || "Тіркелу кезінде қате кетті");
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
          <h1 className="text-3xl font-bold">Тіркелу</h1>
          <p className="text-muted-foreground">Платформаға қосылу үшін деректерді енгізіңіз</p>
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

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Фамилия</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  required
                  className="w-full rounded-xl border bg-transparent py-2 pl-10 pr-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Фамилия"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Аты</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  required
                  className="w-full rounded-xl border bg-transparent py-2 pl-10 pr-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Аты"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
            </div>
          </div>

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
            <label className="text-sm font-medium">Пароль</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
              required
              type={showPassword ? "text" : "password"}
              className="w-full rounded-xl border bg-transparent py-2 pl-10 pr-10 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Пароль ойлап табыңыз"
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

          <div className="space-y-2">
            <label className="text-sm font-medium">Парольді қайталау</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                required
                type={showPassword ? "text" : "password"}
                className="w-full rounded-xl border bg-transparent py-2 pl-10 pr-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Парольді қайталаңыз"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="terms"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer select-none">
              Әкімшілік және құпиялылық саясатымен келісемін
            </label>
          </div>

          {error && <p className="text-sm font-medium text-destructive text-center">{error}</p>}

          <button
            type="submit"
            disabled={!agreed || loading}
            className={cn(
              "w-full rounded-xl py-3 text-sm font-bold transition-all",
              agreed && !loading
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {loading ? "ЖҮКТЕЛУДЕ..." : "ТІРКЕЛУ"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Аккаунтыңыз бар ма? <Link href="/login" className="text-primary font-semibold hover:underline">Кіріңіз</Link>
        </p>
      </div>
    </div>
  );
}

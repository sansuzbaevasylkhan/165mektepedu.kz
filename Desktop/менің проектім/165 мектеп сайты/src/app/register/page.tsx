"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Lock, User, Phone, Sparkles } from "lucide-react";
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
      // Replace non-digit characters to get only numbers
      const phoneDigits = formData.phone.replace(/\D/g, "");
      // Remove the leading '7' if it exists to avoid double 7s if user entered +7
      const cleanedDigits = phoneDigits.startsWith('7') ? phoneDigits.substring(1) : phoneDigits;
      const email = `${cleanedDigits}@165mektep.edu.kz`;

      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            role: role,
          },
        },
      });

      if (authError) throw authError;
      if (!data.user) throw new Error("Пайдаланушы құрылған жоқ");

      // Профиль автоматты түрде SQL Trigger арқылы жасалады
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message || "Тіркелу кезінде қате кетті");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Cinematic Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-[3rem] overflow-hidden border border-white/10 bg-background/60 backdrop-blur-2xl shadow-2xl relative z-10">

        {/* Left Side: Branding/Visual */}
        <div className="hidden lg:flex flex-col justify-center p-16 bg-gradient-to-br from-[#050505] via-[#101010] to-black text-white relative">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle,rgba(212,175,55,0.1)_0%,transparent_70%)]" />
          </div>

          <div className="relative z-10 space-y-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl gold-gradient text-black font-black text-3xl shadow-2xl mb-8">
              165
            </div>
            <h2 className="text-6xl font-black tracking-tighter leading-none">
              БОЛАШАҚТЫҢ <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-[#D4AF37] to-[#B8860B]">
                МЕКТЕБІ
              </span>
            </h2>
            <p className="text-xl text-white/60 font-light leading-relaxed max-w-md">
              №165 мектеп — бұл тек білім емес, бұл сіздің әлеміңізді өзгертуге мүмкіндік беретін заманауи цифрлық экожүйе.
            </p>
            <div className="flex gap-4 pt-8">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-white/80">
                <Sparkles className="h-3 w-3 text-primary" />
                Premium Quality
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-white/80">
                <Sparkles className="h-3 w-3 text-primary" />
                Modern Tech
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Register Form */}
        <div className="p-8 md:p-16 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full space-y-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-black tracking-tight mb-2">Қош келдіңіз!</h1>
              <p className="text-muted-foreground font-medium">Білім жолына бірінші қадамды жасаңыз</p>
            </div>

            {/* Role Selector - Premium Segmented Control */}
            <div className="flex p-1.5 bg-muted/50 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => setRole("student")}
                className={cn(
                  "flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 uppercase tracking-widest",
                  role === "student"
                    ? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black shadow-lg scale-100"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                ОҚУШЫ
              </button>
              <button
                type="button"
                onClick={() => setRole("parent")}
                className={cn(
                  "flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 uppercase tracking-widest",
                  role === "parent"
                    ? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black shadow-lg scale-100"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                АТА-АНА
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Фамилия</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      required
                      className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      placeholder="Фамилияңыз"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Аты</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      required
                      className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      placeholder="Атыңыз"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Телефон нөмірі</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    required
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="+7 (777)-777-77-77"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Пароль</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-12 pr-12 text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="Қатты пароль ойлаңыз"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Парольді қайталау</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="Парольді қайталаңыз"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 py-3">
                <input
                  type="checkbox"
                  id="terms"
                  className="h-5 w-5 rounded border-white/10 bg-white/5 text-primary focus:ring-primary cursor-pointer"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <label htmlFor="terms" className="text-xs text-white/40 cursor-pointer select-none leading-tight">
                  Мен <span className="text-white/70">әкімшілік және құпиялылық саясатымен</span> толық келісемін
                </label>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium text-center animate-shake">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!agreed || loading}
                className={cn(
                  "w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all duration-300 shadow-xl",
                  agreed && !loading
                    ? "bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#B8860B] text-black hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                    : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                )}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ЖҮКТЕЛУДЕ...
                  </div>
                ) : "ТІРКЕЛУ"}
              </button>
            </form>

            <p className="text-center text-sm text-white/40">
              Аккаунтыңыз бар ма? <Link href="/login" className="text-primary font-bold hover:text-[#FFD700] transition-colors underline underline-offset-4">Кіріңіз</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

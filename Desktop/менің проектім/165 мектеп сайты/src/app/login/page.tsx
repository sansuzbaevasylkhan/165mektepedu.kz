"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Lock, Phone, Sparkles, ShieldCheck } from "lucide-react";
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
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: formData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Пайдаланушы табылмады");

      // Пайдаланушының рөлін тексеру
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      // Рөліне байланысты бетке жіберу
      if (profile?.role === 'admin') {
        window.location.href = "/admin";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      setError(err.message || "Логин кезінде қате кетті");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Cinematic Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-[3rem] overflow-hidden border border-white/10 bg-background/60 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10">

        {/* Left Side: Luxury Branding */}
        <div className="hidden lg:flex flex-col justify-center p-20 bg-gradient-to-br from-[#050505] via-[#101010] to-black text-white relative">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle,rgba(212,175,55,0.15)_0%,transparent_70%)]" />
          </div>

          <div className="relative z-10 space-y-10">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl gold-gradient text-black font-black text-4xl shadow-[0_0_30px_rgba(212,175,55,0.4)] mb-12">
              165
            </div>
            <h2 className="text-7xl font-black tracking-tighter leading-none italic">
              ҚАЙТА <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-[#D4AF37] to-[#B8860B]">
                КЕЛДІҢІЗ
              </span>
            </h2>
            <p className="text-2xl text-white/60 font-light leading-relaxed max-w-lg">
              Білім жолындағы сапарыңызды жалғастырыңыз. Сіздің жеке кабинетіңіз сізді күтуде.
            </p>
            <div className="flex flex-wrap gap-4 pt-10">
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-white/80 backdrop-blur-md">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Secure Access
              </div>
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-white/80 backdrop-blur-md">
                <Sparkles className="h-4 w-4 text-primary" />
                Ultra Premium UI
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 md:p-20 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full space-y-10">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-black tracking-tight mb-3">Кіру</h1>
              <p className="text-muted-foreground font-medium text-lg">Жеке кабинетіңізге қосылыңыз</p>
            </div>

            {/* Role Selector - Luxury Segmented Control */}
            <div className="flex p-2 bg-muted/30 rounded-2xl border border-white/10 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setRole("student")}
                className={cn(
                  "flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-500 uppercase tracking-widest",
                  role === "student"
                    ? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black shadow-xl scale-100"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                ОҚУШЫ
              </button>
              <button
                type="button"
                onClick={() => setRole("parent")}
                className={cn(
                  "flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-500 uppercase tracking-widest",
                  role === "parent"
                    ? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black shadow-xl scale-100"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                АТА-АНА
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Телефон нөмірі</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    required
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-sm transition-all focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none"
                    placeholder="+7 (777)-777-77-77"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase tracking-widest text-//muted-foreground ml-1">Пароль</label>
                  <Link href="/forgot-password" className="text-xs text-primary font-bold hover:text-[#FFD700] transition-colors underline underline-offset-4">
                    Ұмыттыңыз ба?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-12 text-sm transition-all focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none"
                    placeholder="Пароліңізді енгізіңіз"
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

              {error && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium text-center animate-shake">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full py-5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all duration-500 shadow-2xl",
                  !loading
                    ? "bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#B8860B] text-black hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)]"
                    : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                )}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    КІРУДЕ...
                  </div>
                ) : "КІРУ"}
              </button>
            </form>

            <p className="text-center text-sm text-white/40">
              Аккаунтыңыз жоқ па? <Link href="/register" className="text-primary font-bold hover:text-[#FFD700] transition-colors underline underline-offset-4">Тіркеліңіз</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

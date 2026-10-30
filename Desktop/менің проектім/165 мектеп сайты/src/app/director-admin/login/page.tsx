"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, Phone, User, ShieldCheck, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function DirectorLoginPage() {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "+7 ",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successUser, setSuccessUser] = useState<string | null>(null);

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
    setSuccessUser(null);

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

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (profileError) throw profileError;
      if (profile?.role !== 'director') {
        throw new Error("Сіздің директорлық құқығыңыз жоқ");
      }

      setSuccessUser(`${formData.first_name} ${formData.last_name}`);

      setTimeout(() => {
        window.location.href = "/director-admin/dashboard";
      }, 2000);

    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.message || "Кіру кезінде қате кетті");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-12 relative overflow-hidden bg-background">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[150px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.05)_0%,transparent_70%)]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md rounded-[3rem] border border-white/10 bg-background/60 backdrop-blur-3xl shadow-[0_20px_80px_rgba(0,0,0,0.6)] relative z-10 p-8 md:p-12 overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

        <div className="text-center mb-10">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.8 }}
            className="flex h-20 w-20 items-center justify-center rounded-3xl gold-gradient text-black font-black text-3xl shadow-[0_0_40px_rgba(212,175,55,0.5)] mx-auto mb-6 cursor-pointer"
          >
            D
          </motion.div>
          <h1 className="text-4xl font-black tracking-tighter uppercase text-center mb-2">
            DIRECTOR <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-[#D4AF37] to-[#B8860B]">ACCESS</span>
          </h1>
          <p className="text-muted-foreground font-medium text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2">
            <Sparkles className="h-3 w-3 text-primary" />
            Басқару панеліне кіру
          </p>
        </div>

        <AnimatePresence mode="wait">
          {successUser ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 0.8 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center space-y-6"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 text-green-500 mx-auto relative">
                <ShieldCheck className="h-10 w-10" />
                <div className="absolute inset-0 rounded-full border-2 border-green-500 animate-ping opacity-20" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black tracking-tight">Сәтті кіріңіз!</h2>
                <p className="text-xl text-primary font-bold">{successUser}</p>
              </div>
              <p className="text-sm text-muted-foreground animate-pulse uppercase tracking-widest">Дашбордқа бағытталуда...</p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleLogin}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Аты</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      required
                      className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-sm transition-all focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none backdrop-blur-sm"
                      placeholder="Атыңыз"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Жөні</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      required
                      className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-sm transition-all focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none backdrop-blur-sm"
                      placeholder="Жөніңіз"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Телефон нөмірі</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    required
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-sm transition-all focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none backdrop-blur-sm"
                    placeholder="+7 (777)-777-77-77"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Пароль</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-12 text-sm transition-all focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none backdrop-blur-sm"
                    placeholder="Директор пароліңізді енгізіңіз"
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
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold text-center"
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] transition-all duration-500 shadow-2xl relative overflow-hidden group",
                  !loading
                    ? "bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#B8860B] text-black hover:shadow-[0_0_40px_rgba(212,175,55,0.6)]"
                    : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                )}
              >
                <div className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      ЖҮКТЕЛУДЕ...
                    </>
                    : "КІРУ"}
                </div>
                {!loading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                )}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

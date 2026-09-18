"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Film, Eye, EyeOff, Lock, AlertCircle, LogIn } from "lucide-react";
import { useToast } from "@/components/ui/ToastContext";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    // If already logged in, redirect
    fetch("/api/admin/check")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) {
          router.push("/admin/dashboard");
        }
      })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Сәтті кірдіңіз", "Қош келдіңіз!");
        router.push("/admin/dashboard");
      } else {
        setError(data.error || "Құпия сөз қате");
      }
    } catch {
      setError("Желі қатесі");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden bg-background">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 h-1/2 w-1/2 rounded-full bg-primary-500/20 blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-accent-500/20 blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-pink-500/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        <div className="rounded-3xl glass-dark p-8 md:p-10 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="relative mb-4"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-pink-500 rounded-2xl blur-xl opacity-50" />
              <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-primary-500/40">
                <Film className="h-8 w-8 text-white" />
              </div>
            </motion.div>
            <h1 className="font-display text-2xl font-bold text-white">Admin Panel</h1>
            <p className="text-sm text-white/50 mt-1">Mansur Drama басқару панелі</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white/80 mb-2 block">
                Құпия сөз
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Құпия сөзді енгізіңіз"
                  className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/40 transition-all"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30"
              >
                <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
                <p className="text-sm text-rose-300">{error}</p>
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-500 to-pink-500 hover:from-primary-600 hover:to-pink-600 text-white font-bold shadow-lg shadow-primary-500/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Тексерілуде...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Кіру
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              ← Сайтқа оралу
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

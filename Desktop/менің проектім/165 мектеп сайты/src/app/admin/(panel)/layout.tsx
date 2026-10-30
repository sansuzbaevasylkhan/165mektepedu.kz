"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useHeartbeat } from "@/hooks/use-heartbeat";
import {
  LayoutDashboard,
  Users,
  Newspaper,
  BookOpen,
  Settings,
  LogOut,
  Award,
  Link2
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const MENU_ITEMS = [
  { name: "Дашборд", href: "/admin", icon: LayoutDashboard },
  { name: "Пайдаланушылар", href: "/admin/users", icon: Users },
  { name: "Ата-ана байланысы", href: "/admin/parent-links", icon: Link2 },
  { name: "Жаңалықтар", href: "/admin/news", icon: Newspaper },
  { name: "ҰБТ Сабақтары", href: "/admin/unt", icon: BookOpen },
  { name: "Тест Нәтижелері", href: "/admin/results", icon: Award },
  { name: "Баптаулар", href: "/admin/settings", icon: Settings },
];

// Director-only menu items
const DIRECTOR_MENU_ITEMS = [
  { name: "Директор панелі", href: "/admin/dashboard/direktor-admini", icon: LayoutDashboard },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  useHeartbeat();

  useEffect(() => {
    async function checkAdmin() {
      if (typeof window !== 'undefined' && window.location.pathname === "/admin/login") return;

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        window.location.href = "/admin/login";
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authUser.id)
        .single();

      if (profile?.role !== "admin" && profile?.role !== "director") {
        window.location.href = "/dashboard";
        return;
      }

      // Store role in window for sidebar visibility
      (window as any).userRole = profile?.role;
    }
    checkAdmin().finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-white">Жүктелуде...</div>;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">
      {/* Sidebar - Professional Dark */}
      <aside className="w-64 border-r border-white/5 bg-[#0f0f0f] hidden md:flex flex-col transition-all duration-300">
        <div className="p-6 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8860B] text-black flex items-center justify-center font-black text-lg shadow-[0_0_15px_rgba(212,175,55,0.3)]">A</div>
          <span className="text-lg font-bold tracking-tight text-white/90">Admin Panel</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {MENU_ITEMS.map((item) => {
            const isActive = typeof window !== 'undefined' && window.location.pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-primary text-black shadow-lg scale-[1.02]"
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className={cn("h-5 w-5 transition-colors", isActive ? "text-black" : "text-white/40 group-hover:text-white")} />
                {item.name}
              </Link>
            );
          })}

          {(window as any).userRole === 'director' && (
            <div className="pt-4 mt-4 border-t border-white/5">
              <p className="px-4 text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Басқару</p>
              {DIRECTOR_MENU_ITEMS.map((item) => {
                const isActive = typeof window !== 'undefined' && window.location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                      isActive
                        ? "bg-primary text-black shadow-lg scale-[1.02]"
                        : "text-white/50 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5 transition-colors", isActive ? "text-black" : "text-white/40 group-hover:text-white")} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => supabase.auth.signOut().then(() => window.location.href = "/login")}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all group"
          >
            <LogOut className="h-5 w-5 group-hover:translate-x-1 transition-transform" /> Шығу
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        <header className="h-16 border-b border-white/5 bg-[#0f0f0f]/50 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between px-8">
          <h2 className="font-bold text-white/80 tracking-tight">Әкімшілік басқару</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <div className="h-6 w-6 rounded-full bg-primary text-black flex items-center justify-center text-[10px] font-black">ADM</div>
              <span className="text-xs font-medium text-white/70">Administrator</span>
            </div>
          </div>
        </header>
        <div className="p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}

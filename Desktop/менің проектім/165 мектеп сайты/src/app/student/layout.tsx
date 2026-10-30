"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard,
  Calendar,
  ClipboardCheck,
  TrendingUp,
  BookOpen,
  Bell,
  Award,
  User
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const MENU_ITEMS = [
  { name: "Басты панель", href: "/student/dashboard", icon: LayoutDashboard },
  { name: "Сабақ кестесі", href: "/student/timetable", icon: Calendar },
  { name: "Тапсырмалар", href: "/student/assignments", icon: ClipboardCheck },
  { name: "Менің бағаларым", href: "/student/grades", icon: TrendingUp },
  { name: "ҰБТ Дайындығы", href: "/student/unt", icon: BookOpen },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function checkStudent() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: userProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (userProfile?.role !== "student") {
        window.location.href = "/dashboard";
        return;
      }

      setProfile(userProfile);
      setLoading(false);
    }
    checkStudent();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-white">Жүктелуде...</div>;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">
      <aside className="w-64 border-r border-white/5 bg-[#0f0f0f] hidden md:flex flex-col transition-all duration-300">
        <div className="p-6 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8860B] text-black flex items-center justify-center font-black text-lg shadow-[0_0_15px_rgba(212,175,55,0.3)]">S</div>
          <span className="text-lg font-bold tracking-tight text-white/90">Student Hub</span>
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
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-4">
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Сыныбым</p>
            <p className="text-sm font-bold text-primary">{profile?.class_name || "Белгісіз"}</p>
          </div>
          <button
            onClick={() => supabase.auth.signOut().then(() => window.location.href = "/login")}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all group"
          >
            <LogOut className="h-5 w-5 group-hover:translate-x-1 transition-transform" /> Шығу
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative">
        <header className="h-16 border-b border-white/5 bg-[#0f0f0f]/50 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between px-8">
          <h2 className="font-bold text-white/80 tracking-tight">Оқушы кабинеті</h2>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-primary rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <div className="h-6 w-6 rounded-full bg-primary text-black flex items-center justify-center text-[10px] font-black">S</div>
              <span className="text-xs font-medium text-white/70">{profile?.first_name}</span>
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

import { LogOut } from "lucide-react";

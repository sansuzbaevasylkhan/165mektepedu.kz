"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard,
  Users,
  Newspaper,
  BookOpen,
  Settings,
  LogOut,
  ChevronRight,
  UserPlus,
  ShieldAlert
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const MENU_ITEMS = [
  { name: "Дашборд", href: "/admin", icon: LayoutDashboard },
  { name: "Пайдаланушылар", href: "/admin/users", icon: Users },
  { name: "Жаңалықтар", href: "/admin/news", icon: Newspaper },
  { name: "ҰБТ Сабақтары", href: "/admin/unt", icon: BookOpen },
  { name: "Баптаулар", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        window.location.href = "/login";
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authUser.id)
        .single();

      if (profile?.role !== "admin") {
        window.location.href = "/dashboard";
        return;
      }
      setUser(authUser);
    }
    checkAdmin().finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center">Жүктелуде...</div>;

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-background hidden md:flex flex-col">
        <div className="p-6 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">A</div>
          <span className="text-lg font-bold tracking-tight">Admin Panel</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {MENU_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-muted"
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={() => supabase.auth.signOut().then(() => window.location.href = "/login")}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" /> Шығу
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 border-b bg-background flex items-center justify-between px-8">
          <h2 className="font-semibold">Әкімшілік панелі</h2>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">ADM</div>
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

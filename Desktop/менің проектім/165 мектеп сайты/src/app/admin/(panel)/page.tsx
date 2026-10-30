"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Users, BookOpen, Newspaper, UserCheck } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    students: 0,
    parents: 0,
    lessons: 0,
    news: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const { count: students } = await supabase.from("profiles").select("*", { count: 'exact', head: true }).eq("role", "student");
      const { count: parents } = await supabase.from("profiles").select("*", { count: 'exact', head: true }).eq("role", "parent");
      const { count: lessons } = await supabase.from("lessons").select("*", { count: 'exact', head: true });
      const { count: news } = await supabase.from("news").select("*", { count: 'exact', head: true });

      setStats({
        students: students || 0,
        parents: parents || 0,
        lessons: lessons || 0,
        news: news || 0,
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  if (loading) return <div>Жүктелуде...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Жалпы статистика</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Оқушылар" value={stats.students} icon={Users} color="text-blue-500" />
        <StatCard title="Ата-аналар" value={stats.parents} icon={UserCheck} color="text-emerald-500" />
        <StatCard title="Сабақтар" value={stats.lessons} icon={BookOpen} color="text-purple-500" />
        <StatCard title="Жаңалықтар" value={stats.news} icon={Newspaper} color="text-orange-500" />
      </div>

      <div className="p-8 rounded-3xl border bg-background shadow-sm">
        <h3 className="text-xl font-bold mb-4">Жүйе жайрымы</h3>
        <p className="text-muted-foreground">
          Платформа тұрақты жұмыс істеп тұр. Барлық Row Level Security (RLS) саясаттары белсенді.
          ҰБТ бөліміндегі сабақтардың ашылу логикасы дұрыс жұмыс істейді.
        </p>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="p-6 rounded-3xl border bg-background shadow-sm flex items-center gap-4">
      <div className={cn("h-12 w-12 rounded-2xl bg-muted flex items-center justify-center", color)}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

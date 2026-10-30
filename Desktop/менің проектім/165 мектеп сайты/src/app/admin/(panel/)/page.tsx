"use client";

import { useState, useEffect } from "react";
import {
  Users,
  BookOpen,
  Newspaper,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  LayoutDashboard,
  Activity,
  Zap,
  Bell,
  Search,
  MoreHorizontal
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Премиум Статистика карточкасы
function StatCard({ title, value, change, icon: Icon, color, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative group p-6 rounded-[2rem] border border-white/10 bg-background/40 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-500 hover:border-primary/50 hover:shadow-primary/10"
    >
      {/* Фондағы жарық эффектісі */}
      <div className={cn("absolute -right-4 -top-4 h-24 w-24 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500", color)} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className={cn("p-3 rounded-2xl shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3", color)}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className={cn(
            "flex items-center gap-1 text-xs font-black px-3 py-1 rounded-full backdrop-blur-md transition-all duration-500",
            change > 0 ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"
          )}>
            {change > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(change)}%
          </div>
        </div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-4xl font-black tracking-tighter text-foreground group-hover:text-primary transition-colors duration-300">
          {value}
        </h3>
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeLessons: 0,
    totalNews: 0,
    performance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const { count: usersCount } = await supabase.from("profiles").select("*", { count: 'exact', head: true });
        const { count: newsCount } = await supabase.from("news").select("*", { count: 'exact', head: true });
        const { count: untCount } = await supabase.from("unt_lessons").select("*", { count: 'exact', head: true });

        setStats({
          totalUsers: usersCount || 0,
          activeLessons: untCount || 0,
          totalNews: newsCount || 0,
          performance: 94,
        });
      } catch (error) {
        console.error("Статистиканы алу кезінде қате кетті:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="relative">
          <div className="h-16 w-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <div className="absolute inset-0 h-16 w-16 border-4 border-primary/10 border-b-primary rounded-full animate-spin [animation-duration:2s]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 p-2">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest">
            <Zap className="h-4 w-4 fill-current" />
            Басқару панелі
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/80 to-primary">
            Админ <span className="text-primary">Дашборд</span>
          </h1>
          <p className="text-muted-foreground font-medium">Мектеп жүйесінің нақты уақыттағы мониторингі</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative px-5 py-3 rounded-2xl bg-background border border-white/10 text-sm font-bold flex items-center gap-3 shadow-xl">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </div>
              Жүйе белсенді
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Оқушылар"
          value={stats.totalUsers}
          change={12}
          icon={Users}
          color="bg-blue-500"
          delay={0.1}
        />
        <StatCard
          title="ҰБТ Сабақтары"
          value={stats.activeLessons}
          change={5}
          icon={BookOpen}
          color="bg-purple-500"
          delay={0.2}
        />
        <StatCard
          title="Жаңалықтар"
          value={stats.totalNews}
          change={-2}
          icon={Newspaper}
          color="bg-orange-500"
          delay={0.3}
        />
        <StatCard
          title="Тиімділік"
          value={`${stats.performance}%`}
          change={1}
          icon={TrendingUp}
          color="bg-green-500"
          delay={0.4}
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Activity Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="relative p-8 rounded-[2.5rem] border border-white/10 bg-background/40 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Bell className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight">Соңғы белсенділік</h2>
              </div>
              <button className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all border border-white/5">
                Барлығын көру
              </button>
            </div>

            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  whileHover={{ x: 10 }}
                  className="flex items-center justify-between p-5 rounded-3xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center gap-5">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">Жаңа пайдаланушы тіркелді</p>
                      <p className="text-xs text-muted-foreground font-medium">2 сағат бұрын • ID-120{i}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-primary/10 text-primary">Жаңа</span>
                    <MoreHorizontal className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Quick Actions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-6"
        >
          <div className="relative p-8 rounded-[2.5rem] border border-primary/20 bg-gradient-to-b from-primary/10 to-background/40 backdrop-blur-xl shadow-2xl overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -mr-16 -mt-16" />

            <h2 className="text-2xl font-black uppercase tracking-tight mb-8 flex items-center gap-3 relative z-10">
              <LayoutDashboard className="h-6 w-6 text-primary" />
              Жылдам басқару
            </h2>

            <div className="grid grid-cols-1 gap-4 relative z-10">
              {[
                { label: "Пайдаланушыларды басқару", icon: Users },
                { label: "Жаңалық қосу", icon: Newspaper },
                { label: "ҰБТ материалдарын жаңарту", icon: BookOpen },
              ].map((action, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full p-5 rounded-2xl bg-background/60 border border-white/10 text-left text-sm font-bold hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all group flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <action.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    {action.label}
                  </div>
                  <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0" />
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

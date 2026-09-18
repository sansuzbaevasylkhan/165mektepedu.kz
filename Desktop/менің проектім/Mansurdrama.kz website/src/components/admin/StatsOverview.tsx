"use client";

import { useEffect, useState } from "react";
import { Film, Users, Eye, PlayCircle } from "lucide-react";
import { motion } from "framer-motion";
import { isFirebaseClientConfigured } from "@/lib/firebase-client";
import { subscribeToSiteStats } from "@/lib/firebase-helpers";

interface Stats {
  totalDramas: number;
  totalEpisodes: number;
  totalUsers: number;
  totalViews: number;
}

export function StatsOverview() {
  const [stats, setStats] = useState<Stats>({
    totalDramas: 0,
    totalEpisodes: 0,
    totalUsers: 0,
    totalViews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [liveBadge, setLiveBadge] = useState(false);

  useEffect(() => {
    // Prisma-дан бастапқы деректер
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setStats(data);
      })
      .finally(() => setLoading(false));

    // Firebase RTDB-дан live жаңартулар
    if (isFirebaseClientConfigured()) {
      const unsubscribe = subscribeToSiteStats((live) => {
        if (!live) return;
        setStats((prev) => ({
          totalDramas: live.dramas ?? prev.totalDramas,
          totalEpisodes: live.episodes ?? prev.totalEpisodes,
          totalUsers: live.users ?? prev.totalUsers,
          // totalViews-ты қоспаймыз — Prisma-дағы жиынтық сақталады,
          // RTDB-да тек дельта болады. Кейіннен API stats/views-ты қосуға болады.
        }));
        setLiveBadge(true);
        const t = setTimeout(() => setLiveBadge(false), 2000);
        return () => clearTimeout(t);
      });
      return () => {
        unsubscribe();
      };
    }
  }, []);

  const items = [
    {
      label: "Дорамалар",
      value: stats.totalDramas,
      icon: Film,
      gradient: "from-pink-500 to-rose-500",
      bg: "from-pink-500/10 to-rose-500/10",
    },
    {
      label: "Бөлімдер",
      value: stats.totalEpisodes,
      icon: PlayCircle,
      gradient: "from-violet-500 to-purple-500",
      bg: "from-violet-500/10 to-purple-500/10",
    },
    {
      label: "Қолданушылар",
      value: stats.totalUsers,
      icon: Users,
      gradient: "from-sky-500 to-blue-500",
      bg: "from-sky-500/10 to-blue-500/10",
    },
    {
      label: "Көрілімдер",
      value: stats.totalViews.toLocaleString(),
      icon: Eye,
      gradient: "from-emerald-500 to-teal-500",
      bg: "from-emerald-500/10 to-teal-500/10",
    },
  ];

  return (
    <div className="space-y-3">
      {liveBadge && (
        <div className="flex items-center gap-2 text-xs text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          Live · Firebase
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`relative overflow-hidden rounded-2xl p-4 md:p-5 bg-gradient-to-br ${item.bg} border border-white/5`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs md:text-sm text-white/50 font-medium">
                    {item.label}
                  </p>
                  {loading ? (
                    <div className="h-8 w-16 mt-2 rounded bg-white/10 animate-pulse" />
                  ) : (
                    <p className="text-2xl md:text-3xl font-bold text-white mt-1">
                      {item.value}
                    </p>
                  )}
                </div>
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className={`absolute -bottom-1/2 -right-1/4 h-32 w-32 rounded-full bg-gradient-to-br ${item.gradient} opacity-10 blur-2xl pointer-events-none`} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

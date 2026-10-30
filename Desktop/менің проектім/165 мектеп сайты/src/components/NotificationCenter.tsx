"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Bell,
  CheckCircle,
  Clock,
  TrendingUp,
  BookOpen,
  User,
  Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setNotifications(data || []);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();

    // Realtime Subscription
    const channel = supabase
      .channel('global-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function markAsRead(id: string) {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  }

  if (loading) return null;

  return (
    <div className="fixed top-20 right-6 z-[100] w-full max-w-sm">
      <AnimatePresence>
        {notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="bg-[#0f0f0f] border border-white/10 backdrop-blur-2xl rounded-[2rem] shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <h3 className="text-sm font-black uppercase tracking-widest text-white">Хабарландырулар</h3>
              <span className="px-2 py-1 rounded-full bg-primary text-black text-[10px] font-bold">
                {notifications.filter(n => !n.is_read).length} жаңа
              </span>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-4 space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "p-4 rounded-2xl border transition-all cursor-pointer group",
                    n.is_read ? "bg-white/5 border-white/5" : "bg-primary/10 border-primary/20"
                  )}
                  onClick={() => markAsRead(n.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                      n.type === 'GRADE' ? "bg-emerald-500/20 text-emerald-400" :
                      n.type === 'ASSIGNMENT' ? "bg-blue-500/20 text-blue-400" :
                      "bg-primary/20 text-primary"
                    )}>
                      {n.type === 'GRADE' ? <TrendingUp className="h-4 w-4" /> :
                       n.type === 'ASSIGNMENT' ? <BookOpen className="h-4 w-4" /> :
                       <Bell className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-xs font-bold text-white">{n.title}</p>
                      <p className="text-[11px] text-white/50 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-white/20 mt-2">{new Date(n.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

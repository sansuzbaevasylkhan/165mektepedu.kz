"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Users,
  TrendingUp,
  Calendar,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";

function ChildCard({ child }: any) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl hover:border-primary/50 transition-all flex flex-col justify-between"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-primary text-black flex items-center justify-center font-black text-2xl shadow-lg">
            {child.first_name[0]}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">{child.first_name} {child.last_name}</h3>
            <p className="text-sm text-white/40 font-medium">{child.class_name || "Сыныбы белгісіз"}</p>
          </div>
        </div>
        <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">
          Белсенді
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-center">
          <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Орташа балл</p>
          <p className="text-xl font-black text-white">4.5</p>
        </div>
        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-center">
          <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Қатысу</p>
          <p className="text-xl font-black text-white">98%</p>
        </div>
      </div>

      <Link
        href={`/parent/children/${child.id}`}
        className="w-full py-4 rounded-2xl bg-primary text-black text-sm font-black uppercase tracking-widest text-center transition-all hover:scale-[1.02] active:scale-95 shadow-xl flex items-center justify-center gap-2"
      >
        Бақылау <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}

export default function ParentDashboard() {
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingApproval, setPendingApproval] = useState(false);

  useEffect(() => {
    async function fetchChildren() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Check for pending links
        const { data: pending } = await supabase
          .from("parent_student_links")
          .select("id")
          .eq("parent_id", user.id)
          .eq("status", "PENDING");

        setPendingApproval(pending && pending.length > 0);

        // 2. Fetch approved children
        const { data: approvedLinks } = await supabase
          .from("parent_student_links")
          .select(`
            student_id,
            student:profiles!student_id(id, first_name, last_name, class_id)
          `)
          .eq("parent_id", user.id)
          .eq("status", "APPROVED");

        const childrenProfiles = approvedLinks?.map(link => link.student);
        setChildren(childrenProfiles || []);

      } catch (err) {
        console.error("Error fetching children:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchChildren();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen text-white">Жүктелуде...</div>;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="text-4xl font-black tracking-tight text-white">Қош келдіңіз, ата-ана! 👋</h1>
          <p className="text-muted-foreground mt-2">Балаңыздың оқу үлгерімі мен сабақ кестесін бақылаңыз</p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-md">
          <div className="h-10 w-10 rounded-xl bg-primary text-black flex items-center justify-center font-bold">
            <Users className="h-5 w-5" />
          </div>
          <span className="text-sm font-bold pr-4 uppercase tracking-widest">Parental Control</span>
        </div>
      </div>

      {pendingApproval && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center gap-4"
        >
          <AlertCircle className="h-6 w-6 flex-shrink-0" />
          <p className="text-sm font-medium">
            Сіздің аккаунтыңыз тіркелді, бірақ әлі мектеп әкімшілігімен расталған жоқ.
            Балаңыздың деректерін көру үшін растауды күтіңіз.
          </p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {children.length > 0 ? children.map((child, idx) => (
          <ChildCard key={child.id} child={child} />
        )) : (
          <div className="col-span-full py-32 text-center space-y-6">
            <div className="mx-auto h-24 w-24 rounded-full bg-white/5 flex items-center justify-center text-white/20">
              <User className="h-12 w-12" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Байланыс орнатылмаған</h2>
              <p className="text-muted-foreground max-w-md mx-auto mt-2">
                Балаңыздың деректерін көру үшін Admin панелі арқылы байланыстыру қажет.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

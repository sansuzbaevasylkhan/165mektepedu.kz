"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  TrendingUp,
  Award,
  Calendar,
  MessageSquare,
  ArrowUpRight,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

function GradeCard({ grade }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl hover:border-primary/50 transition-all group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-12 w-12 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg",
            grade.score >= 8 ? "bg-emerald-500 text-white" :
            grade.score >= 5 ? "bg-yellow-500 text-black" :
            "bg-red-500 text-white"
          )}>
            {grade.score}
          </div>
          <div>
            <h4 className="text-lg font-bold text-white group-hover:text-primary transition-colors">
              {grade.assignments?.title || "Тапсырма"}
            </h4>
            <p className="text-xs text-white/40 font-medium">
              {grade.assignments?.subject?.name || "Пән белгісіз"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/30 block mb-1">Күні</span>
          <span className="text-xs text-white/60">{new Date(grade.graded_at).toLocaleDateString('kk-KZ')}</span>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-sm text-white/70 leading-relaxed italic">
        {grade.teacher_comment || "Мұғалім пікірі қалдырған жоқ"}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-white/30">
          <Award className="h-3 w-3" />
          Макс: {grade.max_score}
        </div>
        <div className="text-xs font-bold text-primary flex items-center gap-1">
          Толығырақ <ArrowUpRight className="h-3 w-3" />
        </div>
      </div>
    </motion.div>
  );
}

export default function StudentGradesPage() {
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgGrade, setAvgGrade] = useState("0.0");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function fetchGrades() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("assignment_grades")
          .select(`
            *,
            assignments(title, subject:subjects(name))
          `)
          .eq("student_id", user.id)
          .order("graded_at", { ascending: false });

        if (error) throw error;
        setGrades(data || []);

        if (data && data.length > 0) {
          const avg = (data.reduce((acc, g) => acc + g.score, 0) / data.length).toFixed(1);
          setAvgGrade(avg);
        }
      } catch (err) {
        console.error("Error fetching grades:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchGrades();
  }, []);

  const filteredGrades = grades.filter(g => {
    if (filter === "high") return g.score >= 8;
    if (filter === "low") return g.score < 5;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center min-h-screen text-white">Жүктелуде...</div>;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="text-4xl font-black tracking-tight text-white">Менің бағаларым</h1>
          <p className="text-muted-foreground mt-2">Үлгеріміңізді бақылаңыз және мұғалім пікірлерін оқыңыз</p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-md">
          <div className="h-10 w-10 rounded-xl bg-primary text-black flex items-center justify-center font-bold">
            <TrendingUp className="h-5 w-5" />
          </div>
          <span className="text-sm font-bold pr-4 uppercase tracking-widest">Academic Progress</span>
        </div>
      </div>

      {/* Performance Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-primary/20 to-transparent backdrop-blur-xl flex items-center justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-white/40 mb-1">Орташа балл</p>
            <h2 className="text-5xl font-black text-white">{avgGrade}</h2>
          </div>
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <Award className="h-8 w-8" />
          </div>
        </div>
        <div className="p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl flex items-center justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-white/40 mb-1">Барлық бағалар</p>
            <h2 className="text-5xl font-black text-white">{grades.length}</h2>
          </div>
          <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center text-white/40">
            <Calendar className="h-8 w-8" />
          </div>
        </div>
        <div className="p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl flex items-center justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-white/40 mb-1">Статус</p>
            <h2 className="text-2xl font-black text-emerald-400 uppercase tracking-tight">Жақсы</h2>
          </div>
          <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="h-8 w-8" />
          </div>
        </div>
      </div>

      {/* Grades Filter & List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" /> Толық тізім
          </h3>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-sm">
            {['all', 'high', 'low'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all",
                  filter === f ? "bg-primary text-black shadow-md" : "text-white/40 hover:text-white"
                )}
              >
                {f === 'all' ? 'Барлығы' : f === 'high' ? 'Жоғары' : 'Төмен'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGrades.length > 0 ? filteredGrades.map((grade, idx) => (
            <GradeCard key={idx} grade={grade} />
          )) : (
            <div className="col-span-full py-20 text-center text-white/30 italic">
              Әзірге қойылған бағалар жоқ
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { CheckCircle2 } from "lucide-react";

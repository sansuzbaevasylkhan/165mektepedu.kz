"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Users,
  BookOpen,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

function StatCard({ title, value, icon: Icon, color, description }: any) {
  return (
    <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl flex flex-col gap-4 transition-all hover:border-primary/50">
      <div className="flex items-center justify-between">
        <div className={cn("h-12 w-12 rounded-2xl bg-muted flex items-center justify-center", color)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div>
        <p className="text-sm text-white/50">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
        {description && <p className="text-xs text-white/30 mt-1">{description}</p>}
      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  const [stats, setStats] = useState({
    activeClasses: 0,
    pendingGrading: 0,
    totalStudents: 0,
    avgGrade: "0.0",
  });
  const [loading, setLoading] = useState(true);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        // This is a mock logic that will be replaced by real DB calls as tables are populated
        // In a real app, we would filter by auth.uid()
        const { count: classesCount } = await supabase
          .from('lesson_schedule')
          .select('*', { count: 'exact', head: true })
          .eq('teacher_id', (await supabase.auth.getUser()).data.user?.id);

        const { count: pending } = await supabase
          .from('assignment_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('submission_status', 'SUBMITTED');

        setStats({
          activeClasses: classesCount || 0,
          pendingGrading: pending || 0,
          totalStudents: 120, // Mock
          avgGrade: "4.2", // Mock
        });

        const { data: submissions } = await supabase
          .from('assignment_submissions')
          .select('*, profiles(first_name, last_name), assignments(title)')
          .order('submitted_at', { ascending: false })
          .limit(5);

        setRecentSubmissions(submissions || []);
      } catch (err) {
        console.error("Error loading teacher stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen text-white">Жүктелуде...</div>;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white">Мұғалім панелі</h1>
          <p className="text-muted-foreground mt-2">Оқу процесін басқару және бағалау орталығы</p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-md">
          <div className="h-10 w-10 rounded-xl bg-primary text-black flex items-center justify-center font-bold">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="text-sm font-bold pr-4 uppercase tracking-widest">Academic Hub</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Белсенді сыныптар" value={stats.activeClasses} icon={Users} color="text-blue-400" description="Бұл семестрде" />
        <StatCard title="Тексерілмеген" value={stats.pendingGrading} icon={ClipboardCheck} color="text-orange-400" description="Жұмыстар саны" />
        <StatCard title="Жалпы оқушылар" value={stats.totalStudents} icon={UserCheck} color="text-emerald-400" description="Барлық топтарда" />
        <StatCard title="Орташа балл" value={stats.avgGrade} icon={TrendingUp} color="text-purple-400" description="Сыныптар бойынша" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" /> Соңғы жіберілген жұмыстар
          </h3>
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-white/40 font-medium">
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4">Оқушы</th>
                  <th className="px-6 py-4">Тапсырма</th>
                  <th className="px-6 py-4">Күні</th>
                  <th className="px-6 py-4 text-right">Әрекет</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentSubmissions.length > 0 ? recentSubmissions.map((sub, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-medium text-white">
                      {sub.profiles?.first_name} {sub.profiles?.last_name}
                    </td>
                    <td className="px-6 py-4 text-white/70">
                      {sub.assignments?.title}
                    </td>
                    <td className="px-6 py-4 text-white/40 text-xs">
                      {new Date(sub.submitted_at).toLocaleString('kk-KZ')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="px-4 py-2 rounded-xl bg-primary text-black text-xs font-bold hover:scale-105 transition-all">
                        Тексеру
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center text-white/30 italic">Жаңа жұмыстар жоқ</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-primary" /> Маңызды ескертулер
          </h3>
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-4">
            <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm">
              <p className="font-bold mb-1">Кешіктірілген есеп</p>
              <p className="text-xs opacity-80">Апталық есепті жіберу мерзімі аяқталды.</p>
            </div>
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
              <p className="font-bold mb-1">Жаңа тапсырма</p>
              <p className="text-xs opacity-80">9А сыныбына тапсырма берілді.</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              <p className="font-bold mb-1">Бағалау аяқталды</p>
              <p className="text-xs opacity-80">10Б сыныбының барлық жұмыстары тексерілді.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

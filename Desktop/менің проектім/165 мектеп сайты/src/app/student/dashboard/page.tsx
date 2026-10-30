"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  TrendingUp,
  Calendar,
  ClipboardCheck,
  BookOpen,
  Award,
  User,
  Zap
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
      <div className="text-left">
        <p className="text-sm text-white/50">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
        {description && <p className="text-xs text-white/30 mt-1">{description}</p>}
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const [stats, setStats] = useState({
    avgGrade: "0.0",
    completedTasks: 0,
    pendingTasks: 0,
    untProgress: "0%",
  });
  const [loading, setLoading] = useState(true);
  const [nextLessons, setNextLessons] = useState<any[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Calculate Average Grade
        const { data: grades } = await supabase
          .from('assignment_grades')
          .select('score')
          .eq('student_id', user.id);

        const avg = grades && grades.length > 0
          ? (grades.reduce((acc, g) => acc + g.score, 0) / grades.length).toFixed(1)
          : "0.0";

        // 2. Task Counts
        const { count: completed } = await supabase
          .from('assignment_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', user.id)
          .eq('submission_status', 'GRADED');

        const { count: pending } = await supabase
          .from('assignment_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', user.id)
          .eq('submission_status', 'SUBMITTED');

        // 3. UNT Progress
        const { data: progress } = await supabase
          .from('progress')
          .select('video_completed')
          .eq('user_id', user.id);

        const untPerc = progress && progress.length > 0
          ? Math.round((progress.filter(p => p.video_completed).length / progress.length) * 100) + "%"
          : "0%";

        setStats({
          avgGrade: avg,
          completedTasks: completed || 0,
          pendingTasks: pending || 0,
          untProgress: untPerc,
        });

        // 4. Next Lessons from Timetable
        const { data: profile } = await supabase.from('profiles').select('class_id').eq('id', user.id).single();
        if (profile?.class_id) {
          const { data: lessons } = await supabase
            .from('lesson_schedule')
            .select('*, subjects(name)')
            .eq('class_id', profile.class_id)
            .eq('is_published', true)
            .order('lesson_number', { ascending: true })
            .limit(3);
          setNextLessons(lessons || []);
        }

      } catch (err) {
        console.error("Error loading student dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen text-white">Жүктелуде...</div>;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="text-4xl font-black tracking-tight text-white">Сәлем, оқушы! 👋</h1>
          <p className="text-muted-foreground mt-2">Сенің оқу прогресің және бүгінгі жоспарларың</p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-md">
          <div className="h-10 w-10 rounded-xl bg-primary text-black flex items-center justify-center font-bold">
            <Zap className="h-5 w-5" />
          </div>
          <span className="text-sm font-bold pr-4 uppercase tracking-widest">Learning Mode</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Орташа балл" value={stats.avgGrade} icon={TrendingUp} color="text-primary" description="Барлық пәндер бойынша" />
        <StatCard title="Орындалған" value={stats.completedTasks} icon={CheckCircle2} color="text-emerald-400" description="Жалпы тапсырмалар" />
        <StatCard title="Күтуде" value={stats.pendingTasks} icon={ClipboardCheck} color="text-orange-400" description="Тексерілуді күтіп тұр" />
        <StatCard title="ҰБТ Прогресс" value={stats.untProgress} icon={Award} color="text-purple-400" description="Сабақтардың орындалуы" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" /> Бүгінгі сабақтар
          </h3>
          <div className="space-y-4">
            {nextLessons.length > 0 ? nextLessons.map((lesson, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl flex items-center justify-between group hover:border-primary/50 transition-all"
              >
                <div className="flex items-center gap-6">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-xl border border-primary/20">
                    {lesson.lesson_number}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                      {lesson.subjects?.name || "Пән белгісіз"}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-white/40 mt-1">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {lesson.start_time}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Каб: {lesson.classroom_id}</span>
                    </div>
                  </div>
                </div>
                <Link
                  href="/student/timetable"
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all"
                >
                  Толық көру
                </Link>
              </motion.div>
            )) : (
              <div className="p-12 rounded-3xl border border-dashed border-white/10 text-center text-white/30 italic">
                Бүгін сабақтар жоқ немесе кесте жарияланбаған
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" /> Оқу жоспары
          </h3>
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-4">
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-sm">
              <p className="font-bold mb-1">ҰБТ-ға дайындық</p>
              <p className="text-xs opacity-80">Келесі сабақ: Математика - 2-бөлім</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/70 text-sm">
              <p className="font-bold mb-1">Үй тапсырмасы</p>
              <p className="text-xs opacity-80">Қазақ тілінен эссе жазу</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/70 text-sm">
              <p className="font-bold mb-1">Келесі тест</p>
              <p className="text-xs opacity-80">Тарих пәні бойынша сынақ - Жұма</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { CheckCircle2, MapPin } from "lucide-react";

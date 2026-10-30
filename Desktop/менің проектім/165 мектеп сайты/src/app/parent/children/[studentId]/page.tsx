"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  TrendingUp,
  Calendar,
  BookOpen,
  CheckCircle2,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function ChildDetailPage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const [student, setStudent] = useState<any>(null);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const { data: studentData } = await supabase
          .from("profiles")
          .select(`*, class_groups(name)`)
          .eq("id", studentId)
          .single();

        setStudent(studentData);

        const { data: gradeData } = await supabase
          .from("assignment_grades")
          .select(`
            *,
            assignments(title, subject:subjects(name))
          `)
          .eq("student_id", studentId)
          .order("graded_at", { ascending: false });

        setGrades(gradeData || []);
      } catch (err) {
        console.error("Error fetching child data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [studentId]);

  if (loading) return <div className="flex items-center justify-center min-h-screen text-white">Жүктелуде...</div>;

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> Кейін
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-white/40">Оқушы профилі</span>
          <div className="h-8 w-8 rounded-full bg-primary text-black flex items-center justify-center font-bold">
            {student?.first_name[0]}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Student Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl text-center space-y-6">
            <div className="h-32 w-32 rounded-full bg-gradient-to-br from-primary to-yellow-600 mx-auto flex items-center justify-center text-4xl font-black text-black shadow-2xl">
              {student?.first_name[0]}{student?.last_name[0]}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">{student?.first_name} {student?.last_name}</h2>
              <p className="text-primary font-medium mt-1">{student?.class_groups?.name || "Сыныбы белгісіз"}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Орташа балл</p>
                <p className="text-xl font-black text-white">4.8</p>
              </div>
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Қатысу</p>
                <p className="text-xl font-black text-emerald-400">100%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Grade Analysis */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" /> Үлгерімді бақылау
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {grades.length > 0 ? grades.map((grade, idx) => (
              <div key={idx} className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl flex items-center justify-between group hover:border-primary/50 transition-all">
                <div className="space-y-1">
                  <h4 className="font-bold text-white">{grade.assignments?.title}</h4>
                  <p className="text-xs text-white/40">{grade.assignments?.subject?.name}</p>
                </div>
                <div className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg",
                  grade.score >= 8 ? "bg-emerald-500 text-white" :
                  grade.score >= 5 ? "bg-yellow-500 text-black" :
                  "bg-red-500 text-white"
                )}>
                  {grade.score}
                </div>
              </div>
            )) : (
              <div className="col-span-full py-20 text-center text-white/30 italic">
                Әзірге бағалар жоқ
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

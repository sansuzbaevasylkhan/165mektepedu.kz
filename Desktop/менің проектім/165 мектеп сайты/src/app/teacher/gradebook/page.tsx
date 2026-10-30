"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Search,
  Filter,
  TrendingUp,
  ArrowRight,
  FileCheck,
  User,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function TeacherGradebookPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchGrades();
    }
  }, [selectedClass]);

  async function fetchClasses() {
    try {
      const { data } = await supabase.from("class_groups").select("*").order("name");
      setClasses(data || []);
    } catch (err) {
      console.error("Error fetching classes:", err);
    }
  }

  async function fetchGrades() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("assignment_grades")
        .select(`
          *,
          profiles!student_id(first_name, last_name),
          assignments(title)
        `)
        .eq("class_id", selectedClass) // Assuming we added class_id to grades or join via assignment
        .order("graded_at", { ascending: false });

      if (error) throw error;
      setGrades(data || []);
    } catch (err) {
      console.error("Error fetching grades:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredGrades = grades.filter(g =>
    `${g.profiles?.first_name} ${g.profiles?.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    g.assignments?.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading && selectedClass) return <div className="flex items-center justify-center min-h-screen text-white">Жүктелуде...</div>;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="text-4xl font-black tracking-tight text-white">Бағалар журналы</h1>
          <p className="text-muted-foreground mt-2">Оқушылардың үлгерімін бақылау және бағалау</p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-md">
          <div className="h-10 w-10 rounded-xl bg-primary text-black flex items-center justify-center font-bold">
            <TrendingUp className="h-5 w-5" />
          </div>
          <span className="text-sm font-bold pr-4 uppercase tracking-widest">Gradebook</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl space-y-6">
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Сыныпты таңдаңыз</label>
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {classes.map(cls => (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClass(cls.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-xl text-sm transition-all border",
                      selectedClass === cls.id
                        ? "bg-primary text-black border-primary font-bold shadow-md"
                        : "bg-black/20 text-white/70 border-white/10 hover:border-primary/50"
                    )}
                  >
                    {cls.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">Орташа балл:</span>
                <span className="font-bold text-primary">4.2</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">Толықтырылған:</span>
                <span className="font-bold text-emerald-400">85%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Grades Table */}
        <div className="lg:col-span-3 space-y-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              className="w-full pl-12 pr-6 py-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md text-white outline-none focus:border-primary transition-all"
              placeholder="Оқушы немесе тапсырма бойынша іздеу..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-white/40 font-medium">
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4">Оқушы</th>
                  <th className="px-6 py-4">Тапсырма</th>
                  <th className="px-6 py-4">Баға</th>
                  <th className="px-6 py-4">Күні</th>
                  <th className="px-6 py-4 text-right">Әрекет</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredGrades.length > 0 ? filteredGrades.map((grade, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-medium text-white">
                      {grade.profiles?.last_name} {grade.profiles?.first_name}
                    </td>
                    <td className="px-6 py-4 text-white/70">
                      {grade.assignments?.title}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-1 rounded-lg font-black text-xs",
                          grade.score >= 8 ? "bg-emerald-500/20 text-emerald-400" :
                          grade.score >= 5 ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-red-500/20 text-red-400"
                        )}>
                          {grade.score} / {grade.max_score}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white/40 text-xs">
                      {new Date(grade.graded_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => window.location.href = `/teacher/gradebook/review/${grade.id}`}
                        className="p-2 hover:bg-white/10 rounded-lg text-blue-400 transition-colors"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-white/30 italic">
                      {!selectedClass ? "Сыныпты таңдаңыз" : "Бағалар табылмады"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

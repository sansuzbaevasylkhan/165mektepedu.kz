"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  Trash2,
  Save,
  X,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Assignment {
  id: string;
  teacher_id: string;
  class_id: string;
  subject_id: string;
  title: string;
  description: string;
  max_score: number;
  due_date: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
}

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  const [currentAssignment, setCurrentAssignment] = useState<Partial<Assignment>>({
    title: "",
    description: "",
    max_score: 10,
    due_date: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    status: 'DRAFT'
  });

  useEffect(() => {
    fetchMeta();
    fetchAssignments();
  }, []);

  async function fetchMeta() {
    try {
      const { data: c } = await supabase.from("class_groups").select("*").order("name");
      const { data: s } = await supabase.from("subjects").select("*").order("name");
      setClasses(c || []);
      setSubjects(s || []);
    } catch (err) {
      console.error("Meta fetch error:", err);
    }
  }

  async function fetchAssignments() {
    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .eq("teacher_id", user.user?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setAssignments(data || []);
    } catch (err) {
      console.error("Assignments fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaveLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Авторизация қажет");

      if (currentAssignment.id) {
        await supabase.from("assignments").update(currentAssignment).eq("id", currentAssignment.id);
      } else {
        await supabase.from("assignments").insert([
          { ...currentAssignment, teacher_id: user.id }
        ]);
      }
      setIsEditing(false);
      await fetchAssignments();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Бұл тапсырманы өшіруге сенімдісіз бе?")) return;
    try {
      await supabase.from("assignments").delete().eq("id", id);
      await fetchAssignments();
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-white">Жүктелуде...</div>;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="text-4xl font-black tracking-tight text-white">Тапсырмаларды басқару</h1>
          <p className="text-muted-foreground mt-2">Оқушыларға жаңа тапсырмалар беріңіз және оларды бақылаңыз</p>
        </div>
        <button
          onClick={() => {
            setCurrentAssignment({
              title: "",
              description: "",
              max_score: 10,
              due_date: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
              status: 'DRAFT'
            });
            setIsEditing(true);
          }}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold bg-primary text-black hover:scale-105 active:scale-95 shadow-lg transition-all"
        >
          <Plus className="h-4 w-4" /> Жаңа тапсырма қосу
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-white/40 font-medium">
              <tr className="border-b border-white/10">
                <th className="px-6 py-4">Тапсырма</th>
                <th className="px-6 py-4">Сынып / Пән</th>
                <th className="px-6 py-4">Мерзімі</th>
                <th className="px-6 py-4">Статус</th>
                <th className="px-6 py-4 text-right">Әрекет</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {assignments.length > 0 ? assignments.map((asn) => (
                <tr key={asn.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white">{asn.title}</div>
                    <div className="text-xs text-white/40 line-clamp-1">{asn.description}</div>
                  </td>
                  <td className="px-6 py-4 text-white/70">
                    {/* Class/Subject mapping logic would go here */}
                    Сынып / Пән
                  </td>
                  <td className="px-6 py-4 text-white/40 text-xs">
                    {new Date(asn.due_date).toLocaleString('kk-KZ')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                      asn.status === 'PUBLISHED' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                      asn.status === 'DRAFT' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                      "bg-red-500/10 text-red-500 border-red-500/20"
                    )}>
                      {asn.status === 'PUBLISHED' ? 'Жарияланды' : asn.status === 'DRAFT' ? 'Жоба' : 'Жабылды'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => { setCurrentAssignment(asn); setIsEditing(true); }}
                      className="p-2 hover:bg-white/10 rounded-lg text-blue-400 transition-colors"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(asn.id)}
                      className="p-2 hover:bg-white/10 rounded-lg text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-white/30 italic">Тапсырмалар табылмады</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-2xl w-full bg-[#0f0f0f] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-black text-white">{currentAssignment.id ? "Тапсырманы өңдеу" : "Жаңа тапсырма қосу"}</h2>
                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white/10 rounded-full text-white/50 transition-colors">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Сынып</label>
                    <select
                      value={currentAssignment.class_id}
                      onChange={(e) => setCurrentAssignment({...currentAssignment, class_id: e.target.value})}
                      className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-primary transition-all"
                    >
                      <option value="">Сыныпты таңдаңыз</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Пән</label>
                    <select
                      value={currentAssignment.subject_id}
                      onChange={(e) => setCurrentAssignment({...currentAssignment, subject_id: e.target.value})}
                      className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-primary transition-all"
                    >
                      <option value="">Пәнді таңдаңыз</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Мерзімі</label>
                    <input
                      type="datetime-local"
                      value={currentAssignment.due_date}
                      onChange={(e) => setCurrentAssignment({...currentAssignment, due_date: e.target.value})}
                      className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Максималды балл</label>
                    <input
                      type="number"
                      value={currentAssignment.max_score}
                      onChange={(e) => setCurrentAssignment({...currentAssignment, max_score: parseInt(e.target.value)})}
                      className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-primary transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Статус</label>
                    <select
                      value={currentAssignment.status}
                      onChange={(e) => setCurrentAssignment({...currentAssignment, status: e.target.value as any})}
                      className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-primary transition-all"
                    >
                      <option value="DRAFT">Жоба (Draft)</option>
                      <option value="PUBLISHED">Жариялау (Published)</option>
                      <option value="CLOSED">Жабу (Closed)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Тапсырма атауы</label>
                  <input
                    value={currentAssignment.title}
                    onChange={(e) => setCurrentAssignment({...currentAssignment, title: e.target.value})}
                    className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-primary transition-all"
                    placeholder="Тапсырманың қысқаша атауы"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Сипаттама</label>
                  <textarea
                    value={currentAssignment.description}
                    onChange={(e) => setCurrentAssignment({...currentAssignment, description: e.target.value})}
                    className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-primary transition-all h-32"
                    placeholder="Тапсырманың толық сипаттамасы, талаптары және нұсқаулары..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-white/10">
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 rounded-xl text-sm font-bold text-white/50 hover:text-white transition-colors"
                  >
                    Бас тарту
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saveLoading}
                    className={cn(
                      "px-8 py-3 rounded-xl text-sm font-bold text-black transition-all shadow-xl",
                      saveLoading ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary hover:scale-105 active:scale-95"
                    )}
                  >
                    {saveLoading ? "САҚТАЛУДЕ..." : "САҚТАУ"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </AnimatePresence>
    </div>
  );
}

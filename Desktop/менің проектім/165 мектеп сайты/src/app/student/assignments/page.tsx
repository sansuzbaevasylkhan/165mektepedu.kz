"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  FileText,
  Send,
  Clock,
  AlertCircle,
  CheckCircle2,
  Upload,
  FileCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissionData, setSubmissionData] = useState({
    answer_text: "",
    attachment_path: ""
  });

  useEffect(() => {
    fetchAssignments();
  }, []);

  async function fetchAssignments() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get the student's class
      const { data: profile } = await supabase
        .from('profiles')
        .select('class_id')
        .eq('id', user.id)
        .single();

      if (!profile?.class_id) {
        setAssignments([]);
        setLoading(false);
        return;
      }

      // 2. Fetch assignments for this class
      const { data, error } = await supabase
        .from("assignments")
        .select(`
          *,
          assignment_submissions(id, submission_status)
        `)
        .eq("class_id", profile.class_id)
        .eq("status", "PUBLISHED")
        .order("due_date", { ascending: true });

      if (error) throw error;
      setAssignments(data || []);
    } catch (err) {
      console.error("Error fetching assignments:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Авторизация қажет");

      const { error } = await supabase
        .from("assignment_submissions")
        .insert([
          {
            assignment_id: selectedAssignment.id,
            student_id: user.id,
            answer_text: submissionData.answer_text,
            attachment_path: submissionData.attachment_path,
            submitted_at: new Date().toISOString(),
            submission_status: 'SUBMITTED'
          }
        ]);

      if (error) throw error;

      setSelectedAssignment(null);
      setSubmissionData({ answer_text: "", attachment_path: "" });
      await fetchAssignments();
      alert("Тапсырма сәтті жіберілді!");
    } catch (err: any) {
      alert("Қате кетті: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-white">Жүктелуде...</div>;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="text-4xl font-black tracking-tight text-white">Менің тапсырмаларым</h1>
          <p className="text-muted-foreground mt-2">Тапсырмаларды орындаңыз және мұғалімге жіберіңіз</p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-md">
          <div className="h-10 w-10 rounded-xl bg-primary text-black flex items-center justify-center font-bold">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <span className="text-sm font-bold pr-4 uppercase tracking-widest">Submission Hub</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.length > 0 ? assignments.map((asn) => {
          const submission = asn.assignment_submissions?.[0];
          const isSubmitted = !!submission;

          return (
            <motion.div
              key={asn.id}
              whileHover={{ y: -5 }}
              className={cn(
                "p-6 rounded-3xl border transition-all duration-300 backdrop-blur-xl",
                isSubmitted
                  ? "bg-emerald-500/10 border-emerald-500/20"
                  : "bg-white/5 border-white/10 hover:border-primary/50"
              )}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-2xl bg-white/10 text-white">
                  <FileText className="h-6 w-6" />
                </div>
                {isSubmitted ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">
                    Жіберілді
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold uppercase tracking-widest border border-orange-500/20">
                    Күтуде
                  </span>
                )}
              </div>

              <h3 className="text-xl font-bold text-white mb-2">{asn.title}</h3>
              <p className="text-sm text-white/60 line-clamp-2 mb-6 h-10">
                {asn.description}
              </p>

              <div className="flex items-center justify-between pt-6 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs text-white/40 font-medium">
                  <Clock className="h-3 w-3" />
                  {new Date(asn.due_date).toLocaleDateString()}
                </div>
                {!isSubmitted && (
                  <button
                    onClick={() => setSelectedAssignment(asn)}
                    className="px-4 py-2 rounded-xl bg-primary text-black text-xs font-bold hover:scale-105 transition-all"
                  >
                    Орындау
                  </button>
                )}
              </div>
            </motion.div>
          );
        }) : (
          <div className="col-span-full py-20 text-center text-white/30 italic">
            Қазіргі уақытта жарияланған тапсырмалар жоқ
          </div>
        )}
      </div>

      {/* Submission Modal */}
      <AnimatePresence>
        {selectedAssignment && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-2xl w-full bg-[#0f0f0f] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-white">{selectedAssignment.title}</h2>
                  <p className="text-xs text-white/40 uppercase tracking-widest">Тапсырманы орындап, жіберіңіз</p>
                </div>
                <button onClick={() => setSelectedAssignment(null)} className="p-2 hover:bg-white/10 rounded-full text-white/50 transition-colors">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-sm text-white/70 leading-relaxed">
                  {selectedAssignment.description}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Жауап мәтіні</label>
                    <textarea
                      value={submissionData.answer_text}
                      onChange={(e) => setSubmissionData({...submissionData, answer_text: e.target.value})}
                      className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 text-white outline-none focus:border-primary transition-all h-40 resize-none"
                      placeholder="Мұнда жауабыңызды жазыңыз..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Файл тіркеу (URL)</label>
                    <div className="flex gap-3">
                      <input
                        value={submissionData.attachment_path}
                        onChange={(e) => setSubmissionData({...submissionData, attachment_path: e.target.value})}
                        className="flex-1 p-4 rounded-2xl bg-black/40 border border-white/10 text-white outline-none focus:border-primary transition-all"
                        placeholder="Файл сілтемесін енгізіңіз (Drive, Dropbox etc...)"
                      />
                      <button className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all">
                        <Upload className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6">
                  <button
                    onClick={() => setSelectedAssignment(null)}
                    className="px-6 py-3 rounded-xl text-sm font-bold text-white/50 hover:text-white transition-colors"
                  >
                    Бас тарту
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={cn(
                      "px-8 py-3 rounded-xl text-sm font-bold text-black transition-all shadow-xl",
                      isSubmitting ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary hover:scale-105 active:scale-95"
                    )}
                  >
                    {isSubmitting ? "ЖІБЕРІЛУДЕ..." : "ЖІБЕРУ"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { X } from "lucide-react";

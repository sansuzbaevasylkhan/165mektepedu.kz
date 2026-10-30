"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function GradeReviewPage() {
  const params = useParams();
  const gradeId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<any>(null);
  const [grade, setGrade] = useState<any>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [newScore, setNewScore] = useState("");

  useEffect(() => {
    fetchData();
  }, [gradeId]);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: gradeData, error: gradeErr } = await supabase
        .from("assignment_grades")
        .select(`
          *,
          assignment_submissions(answer_text, attachment_path, submitted_at)
        `)
        .eq("id", gradeId)
        .single();

      if (gradeErr) throw gradeErr;

      const { data: submissionData, error: subErr } = await supabase
        .from("assignment_submissions")
        .select(`
          *,
          profiles(first_name, last_name),
          assignments(title, max_score)
        `)
        .eq("id", gradeData.assignment_submissions.id)
        .single();

      if (subErr) throw subErr;

      setGrade(gradeData);
      setSubmission(submissionData);
      setFeedback(gradeData.teacher_comment || "");
      setNewScore(gradeData.score.toString());
    } catch (err) {
      console.error("Error fetching review data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateGrade() {
    setSaveLoading(true);
    try {
      const { error } = await supabase
        .from("assignment_grades")
        .update({
          score: parseFloat(newScore),
          teacher_comment: feedback,
          updated_at: new Date().toISOString()
        })
        .eq("id", gradeId);

      if (error) throw error;
      alert("Баға сәтті жаңартылды!");
    } catch (err: any) {
      alert("Қате кетті: " + err.message);
    } finally {
      setSaveLoading(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-white">Жүктелуде...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> Кейін
        </button>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-full bg-primary text-black font-bold text-sm">
            Бағалау режимі
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Submission Side */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-6">
              <div>
                <h2 className="text-3xl font-bold text-white">{submission?.profiles?.first_name} {submission?.profiles?.last_name}</h2>
                <p className="text-muted-foreground mt-1">
                  Тапсырма: <span className="text-primary font-medium">{submission?.assignments?.title}</span>
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-white/40 uppercase tracking-widest mb-1">Жіберілген уақыты</div>
                <div className="text-sm font-medium text-white">{new Date(submission?.submitted_at).toLocaleString('kk-KZ')}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white/60 text-sm font-bold uppercase tracking-widest">
                <FileText className="h-4 w-4" /> Оқушының жауабы
              </div>
              <div className="p-6 rounded-2xl bg-black/40 border border-white/10 text-white leading-relaxed whitespace-pre-wrap">
                {submission?.answer_text || "Мәтіндік жауап жоқ"}
              </div>
              {submission?.attachment_path && (
                <div className="p-4 rounded-2xl border border-dashed border-white/20 flex items-center justify-between bg-white/5">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm text-white/70">Тіркелген файл бар</span>
                  </div>
                  <a
                    href={submission.attachment_path}
                    target="_blank"
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Файлды ашу
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grading Side */}
        <div className="space-y-6">
          <div className="p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-white">Баға қою</h3>
              <p className="text-xs text-white/40">Максималды балл: {grade?.max_score || 10}</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Балл</label>
                <input
                  type="number"
                  value={newScore}
                  onChange={(e) => setNewScore(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 text-white text-center text-2xl font-black outline-none focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Пікір</label>
                <div className="relative">
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 text-white outline-none focus:border-primary transition-all h-32 resize-none"
                    placeholder="Оқушыға түзетулер мен ұсыныстар жазыңыз..."
                  />
                  <div className="absolute bottom-4 right-4">
                    <MessageSquare className="h-4 w-4 text-white/20" />
                  </div>
                </div>
              </div>

              <button
                onClick={handleUpdateGrade}
                disabled={saveLoading}
                className={cn(
                  "w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-xl",
                  saveLoading ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary text-black hover:scale-105 active:scale-95"
                )}
              >
                {saveLoading ? "САҚТАЛУДЕ..." : "БАҒАНЫ САҚТАУ"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

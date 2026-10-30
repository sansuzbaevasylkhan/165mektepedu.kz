"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ChevronLeft,
  CheckCircle,
  Lock,
  PlayCircle,
  FileText,
  Trophy,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function LessonPage() {
  const { id } = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState<any>(null);
  const [test, setTest] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testAnswers, setTestAnswers] = useState<Record<string, string>>({});
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isGrading, setIsGrading] = useState(false);

  useEffect(() => {
    async function loadLesson() {
      setLoading(true);
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          router.push("/login");
          return;
        }
        setUser(authUser);

        const { data: lessonData } = await supabase.from("lessons").select("*").eq("id", id).single();
        if (!lessonData) throw new Error("Сабақ табылмады");
        setLesson(lessonData);

        const { data: testData } = await supabase.from("tests").select("*").eq("lesson_id", id);
        setTest(testData || []);

        const { data: progressData } = await supabase
          .from("progress")
          .select("*")
          .eq("user_id", authUser.id)
          .eq("lesson_id", id)
          .single();

        setProgress(progressData);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadLesson();
  }, [id, router]);

  const handleVideoComplete = async () => {
    if (!user || !lesson) return;
    await supabase.from("progress").upsert({
      user_id: user.id,
      lesson_id: lesson.id,
      video_completed: true,
    });
    setProgress(prev => ({ ...prev, video_completed: true }));
  };

  const submitTest = async () => {
    if (!test || test.length === 0) return;
    setIsGrading(true);

    // Artificial delay for "Premium" feel
    await new Promise(resolve => setTimeout(resolve, 1500));

    let correctCount = 0;
    test.forEach((q: any) => {
      if (testAnswers[q.id] === q.correct_answer) correctCount++;
    });

    const finalScore = Math.round((correctCount / test.length) * 100);
    setScore(finalScore);
    setTestSubmitted(true);

    if (user && lesson) {
      await supabase.from("progress").upsert({
        user_id: user.id,
        lesson_id: lesson.id,
        test_completed: true,
        test_score: finalScore,
      });
      setProgress(prev => ({ ...prev, test_completed: true, test_score: finalScore }));
    }
    setIsGrading(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background text-white">
      <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );

  if (!lesson) return (
    <div className="min-h-screen flex items-center justify-center text-white">
      <p>Сабақ табылмады.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Luxury Header */}
      <header className="p-6 max-w-7xl mx-auto flex items-center justify-between">
        <Link
          href="/unt"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
        >
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Курсқа қайту</span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/60">
            <Trophy className="h-3 w-3 text-primary" />
            ҰБТ Дайындығы
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Cinematic Video Studio */}
          <div className="lg:col-span-8 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">
                {lesson.title}
              </h1>

              <div className="relative aspect-video w-full rounded-[3rem] overflow-hidden bg-black shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10 group">
                <iframe
                  src={lesson.video_url}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onLoadedData={handleVideoComplete}
                />
                <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 rounded-[3rem]" />
              </div>

              <div className="p-8 rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-xl space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs mb-2">
                  <FileText className="h-4 w-4" /> Сабақ сипаттамасы
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed font-medium">
                  {lesson.description}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Interactive Test Studio */}
          <div className="lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="sticky top-24 p-8 rounded-[3rem] border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl space-y-8"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black tracking-tight">Бекіту <span className="text-primary">Тесті</span></h3>
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>

              {!test || test.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground font-medium">Бұл сабаққа тест қосылмаған.</p>
                </div>
              ) : testSubmitted ? (
                <div className="text-center space-y-6 py-8">
                  <div className="relative inline-block">
                    <div className="h-32 w-32 rounded-full border-8 border-primary/20 flex items-center justify-center mx-auto relative">
                      <span className="text-5xl font-black text-white">{score}%</span>
                    </div>
                    <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center border-4 border-background">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-bold text-white">Тамаша нәтиже!</h4>
                    <p className="text-sm text-muted-foreground">Біліміңізді бекіттіңіз. Келесі сабаққа өтсеңіз болады.</p>
                  </div>
                  <Link
                    href="/unt"
                    className="block w-full py-4 rounded-2xl bg-primary text-black font-black uppercase tracking-widest text-sm transition-all hover:scale-105"
                  >
                    Келесі сабаққа
                  </Link>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                    {test.map((q: any, idx: number) => (
                      <div key={q.id} className="space-y-4 p-4 rounded-2xl bg-black/30 border border-white/5">
                        <p className="font-bold text-sm leading-relaxed">{idx + 1}. {q.question}</p>
                        <div className="grid gap-2">
                          {q.options.map((opt: string, oIdx: number) => (
                            <button
                              key={oIdx}
                              onClick={() => setTestAnswers({ ...testAnswers, [q.id]: opt })}
                              className={cn(
                                "w-full text-left p-3 rounded-xl border transition-all text-xs font-medium",
                                testAnswers[q.id] === opt
                                  ? "border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                                  : "border-white/10 hover:bg-white/5 text-white/70"
                              )}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={submitTest}
                    disabled={Object.keys(testAnswers).length < test.length || isGrading}
                    className={cn(
                      "w-full py-5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-xl",
                      Object.keys(testAnswers).length < test.length || isGrading
                        ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                        : "bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#B8860B] text-black hover:scale-[1.02] active:scale-95"
                    )}
                  >
                    {isGrading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        ТЕКСЕРІЛУДЕ...
                      </div>
                    ) : "Нәтижені алу"}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

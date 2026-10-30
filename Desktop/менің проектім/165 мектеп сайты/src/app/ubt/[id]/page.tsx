"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { CheckCircle2, ArrowLeft, PlayCircle, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LessonPage() {
  const { id } = useParams();
  const [lesson, setLesson] = useState<any>(null);
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    async function fetchLesson() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          window.location.href = "/login";
          return;
        }

        // 1. Сабақ мәліметтерін алу
        const { data: lessonData, error: lError } = await supabase
          .from("ubt_lessons")
          .select("*")
          .eq("id", id)
          .single();

        if (lError) throw lError;

        // 2. Осы сабаққа байланысты тестті алу
        const { data: testData, error: tError } = await supabase
          .from("ubt_tests")
          .select("*")
          .eq("lesson_id", id)
          .single();

        if (tError && tError.code !== 'PGRST116') throw tError; // PGRST116 means no rows found

        // 3. Пайдаланушының прогресін тексеру
        const { data: progress } = await supabase
          .from("lesson_progress")
          .select("is_completed")
          .eq("user_id", user.id)
          .eq("lesson_id", id)
          .single();

        setLesson(lessonData);
        setTest(testData);
        setIsCompleted(progress?.is_completed || false);
      } catch (err) {
        console.error("Error loading lesson:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLesson();
  }, [id]);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("lesson_progress")
        .upsert({
          user_id: user.id,
          lesson_id: id,
          is_completed: true,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      setIsCompleted(true);
    } catch (err) {
      alert("Қате кетті, қайта көріңіз");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-muted-foreground">Жүктелуде...</p>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Сабақ табылмады</h1>
        <Link href="/ubt" className="text-primary underline mt-4 block">Кері қайту</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/ubt"
          className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Тізімге қайту
        </Link>
        <div className="px-4 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
          Сабақ #{lesson.order_index}
        </div>
      </div >

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Video */}
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-video w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 bg-black">
            <iframe
              src={lesson.video_url}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="p-6 rounded-3xl border bg-background">
            <h1 className="text-3xl font-black mb-4">{lesson.title}</h1>
            <p className="text-muted-foreground leading-relaxed">
              {lesson.description}
            </p>
          </div>
        </div>

        {/* Sidebar: Controls */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border bg-background shadow-lg space-y-6">
            <h3 className="text-xl font-bold mb-4">Басқару</h3>

            {/* Complete Button */}
            <button
              onClick={handleComplete}
              disabled={completing || isCompleted}
              className={cn(
                "w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2",
                isCompleted
                  ? "bg-green-500/10 text-green-500 cursor-default"
                  : "bg-primary text-black hover:scale-[1.02] active:scale-95"
              )}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 className="h-5 w-5" /> Сабақ аяқталды
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" /> Аяқтадым
                </>
              )}
            </button>

            {/* Test Button */}
            {test ? (
              <Link
                href={`/ubt/test/${test.id}`}
                className="w-full py-4 rounded-2xl bg-white text-black border-2 border-black font-bold text-sm transition-all flex items-center justify-center gap-2 hover:bg-muted"
              >
                <FileText className="h-5 w-5" /> Тест тапсыру
              </Link>
            ) : (
              <div className="w-full py-4 rounded-2xl bg-muted text-muted-foreground text-sm text-center font-medium">
                Бұл сабаққа тест жоқ
              </div>
            )}
          </div>

          <div className="p-6 rounded-3xl border bg-primary/5 text-sm text-muted-foreground leading-relaxed">
            <div className="flex items-center gap-2 font-bold text-foreground mb-2">
              <PlayCircle className="h-4 w-4 text-primary" /> Көмек
            </div>
            Видеоны соңына дейін көріңіз, содан кейін "Аяқтадым" батырмасын басып, тестке өтіңіз.
          </div>
        </div>
      </div>
    </div>
  );
}

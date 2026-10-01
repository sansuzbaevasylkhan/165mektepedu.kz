"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Lock, CheckCircle, PlayCircle, BookOpen, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Lesson {
  id: string;
  title: string;
  description: string;
  order_index: number;
  is_published: boolean;
}

interface Progress {
  lesson_id: string;
  video_completed: boolean;
  test_completed: boolean;
}

export default function UNTPage() {
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // Check Auth
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          router.push("/login");
          return;
        }
        setUser(authUser);

        // Fetch Lessons
        const { data: lessonsData } = await supabase
          .from("lessons")
          .select("*")
          .eq("is_published", true)
          .order("order_index", { ascending: true });

        setLessons(lessonsData || []);

        // Fetch Progress
        const { data: progressData } = await supabase
          .from("progress")
          .select("lesson_id, video_completed, test_completed")
          .eq("user_id", authUser.id);

        setProgress(progressData || []);
      } catch (err) {
        console.error("Error loading UNT data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-muted-foreground">Сабақтар жүктелуде...</p>
      </div>
    );
  }

  const checkLockStatus = (lessonIndex: number) => {
    if (lessonIndex === 0) return "unlocked"; // First lesson is always open

    const prevLesson = lessons[lessonIndex - 1];
    const prevProgress = progress.find(p => p.lesson_id === prevLesson.id);

    if (prevProgress && prevProgress.video_completed && prevProgress.test_completed) {
      return "unlocked";
    }
    return "locked";
  };

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="flex flex-col items-center text-center mb-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6">
          <BookOpen className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-extrabold md:text-6xl mb-4">ҰБТ-ға дайындық</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Кезең-кезеңімен оқып, тест тапсырып, біліміңізді арттырыңыз.
        </p>
      </div>

      <div className="max-w-4xl mx-auto grid gap-6">
        {lessons.map((lesson, index) => {
          const status = checkLockStatus(index);
          const lessonProgress = progress.find(p => p.lesson_id === lesson.id);
          const isCompleted = lessonProgress?.video_completed && lessonProgress?.test_completed;

          return (
            <div
              key={lesson.id}
              className={cn(
                "group relative flex items-center justify-between p-6 rounded-3xl border transition-all",
                status === "locked"
                  ? "bg-muted/50 opacity-70 cursor-not-allowed"
                  : "bg-background hover:border-primary hover:shadow-md cursor-pointer"
              )}
              onClick={() => status === "unlocked" && router.push(`/unt/lesson/${lesson.id}`)}
            >
              <div className="flex items-center gap-6">
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full font-bold transition-colors",
                  status === "locked" ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
                )}>
                  {status === "locked" ? <Lock className="h-5 w-5" /> : (index + 1)}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{lesson.title}</h3>
                  <p className="text-sm text-muted-foreground">{lesson.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {isCompleted ? (
                  <div className="flex items-center gap-2 text-emerald-500 font-medium">
                    <CheckCircle className="h-5 w-5" /> Аяқталды
                  </div>
                ) : status === "unlocked" ? (
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <PlayCircle className="h-5 w-5" /> Бастау <ChevronRight className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">Құлыпталған</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

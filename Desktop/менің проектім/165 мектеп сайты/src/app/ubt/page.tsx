"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { PlayCircle, CheckCircle2, Lock, BookOpen, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Lesson {
  id: number;
  title: string;
  description: string;
  order_index: number;
  is_completed?: boolean;
}

export default function UBTPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Пайдаланушыны анықтау
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        // 2. Сабақтарды алу
        const { data: lessonsData, error: lessonsError } = await supabase
          .from("ubt_lessons")
          .select("*")
          .order("order_index", { ascending: true });

        if (lessonsError) throw lessonsError;

        // 3. Егер пайдаланушы болса, оның прогресін тексеру
        if (currentUser) {
          const { data: progressData } = await supabase
            .from("lesson_progress")
            .select("lesson_id")
            .eq("user_id", currentUser.id)
            .eq("is_completed", true);

          const completedIds = new Set(progressData?.map(p => p.lesson_id) || []);

          const lessonsWithProgress = lessonsData?.map(lesson => ({
            ...lesson,
            is_completed: completedIds.has(lesson.id)
          }));

          setLessons(lessonsWithProgress || []);
        } else {
          setLessons(lessonsData || []);
        }
      } catch (err) {
        console.error("Error loading UBT data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-muted-foreground">Сабақтар жүктелуде...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="flex flex-col items-center text-center mb-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6">
          <BookOpen className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-extrabold md:text-6xl mb-4">ҰБТ Дайындық</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Кезең-кезеңімен оқып, тест тапсырып, біліміңізді арттырыңыз.
        </p>
      </div>

      {!user ? (
        <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed max-w-2xl mx-auto">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Кіру қажет</h2>
          <p className="text-muted-foreground mb-8">Сабақтарды көру үшін жеке кабинетіңізге кіріңіз</p>
          <Link
            href="/login"
            className="px-8 py-3 rounded-full bg-primary text-black font-bold hover:scale-105 transition-all inline-block"
          >
            Кіру / Тіркелу
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {lessons.length === 0 ? (
            <p className="text-center col-span-full text-muted-foreground py-20">Сабақтар әлі қосылмады.</p>
          ) : (
            lessons.map((lesson, index) => (
              <div
                key={lesson.id}
                className="group relative p-6 rounded-3xl border bg-background transition-all hover:shadow-xl hover:border-primary/30"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                      {index + 1}
                    </span>
                    <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                      {lesson.title}
                    </h3>
                  </div>
                  {lesson.is_completed && (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  )}
                </div>

                <p className="text-muted-foreground text-sm mb-6 line-clamp-2">
                  {lesson.description}
                </p>

                <Link
                  href={`/ubt/${lesson.id}`}
                  className={cn(
                    "flex items-center justify-between w-full p-3 rounded-2xl font-bold text-sm transition-all",
                    lesson.is_completed
                      ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                      : "bg-primary/10 text-primary hover:bg-primary hover:text-black"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <PlayCircle className="h-4 w-4" />
                    {lesson.is_completed ? "Қайта көру" : "Сабақты бастау"}
                  </div>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

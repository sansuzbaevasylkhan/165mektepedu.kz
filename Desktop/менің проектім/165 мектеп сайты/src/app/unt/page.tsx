"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Lock, CheckCircle, PlayCircle, BookOpen, ChevronRight, Trophy, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          router.push("/login");
          return;
        }
        setUser(authUser);

        const { data: lessonsData } = await supabase
          .from("lessons")
          .select("*")
          .eq("is_published", true)
          .order("order_index", { ascending: true });

        setLessons(lessonsData || []);

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

  const checkLockStatus = (lessonIndex: number) => {
    if (lessonIndex === 0) return "unlocked";

    const prevLesson = lessons[lessonIndex - 1];
    const prevProgress = progress.find(p => p.lesson_id === prevLesson.id);

    if (prevProgress && prevProgress.video_completed && prevProgress.test_completed) {
      return "unlocked";
    }
    return "locked";
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="relative">
          <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-primary animate-pulse" />
          </div>
        </div>
        <p className="mt-6 text-muted-foreground font-medium tracking-widest uppercase text-xs">Жүктелуде...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-32">
      {/* Cinematic Hero Section */}
      <section className="relative py-24 px-4 overflow-hidden text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent -z-10" />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-primary text-xs font-bold mb-8 backdrop-blur-md animate-fade-in uppercase tracking-widest">
            <Zap className="h-3 w-3" />
            ҰБТ-ға жол
          </div>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6 uppercase leading-none">
            БІЛІМ <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-[#D4AF37] to-[#B8860B]">ПЛАТФОРМАСЫ</span>
          </h1>
          <p className="text-lg md:text-2xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed">
            Кезең-кезеңімен оқып, тест тапсырып, арманыңыздағы университетке жол ашыңыз.
          </p>
        </motion.div>
      </section>

      {/* Learning Journey Map */}
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="relative">
          {/* Center Line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-white/10 to-transparent transform -translate-x-1/2 hidden md:block" />

          <div className="space-y-12">
            {lessons.map((lesson, index) => {
              const status = checkLockStatus(index);
              const lessonProgress = progress.find(p => p.lesson_id === lesson.id);
              const isCompleted = lessonProgress?.video_completed && lessonProgress?.test_completed;
              const isEven = index % 2 === 0;

              return (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={cn(
                    "flex flex-col md:flex-row items-center gap-8",
                    isEven ? "md:flex-row-reverse" : ""
                  )}
                >
                  {/* Lesson Content */}
                  <div className="w-full md:w-1/2">
                    <div
                      onClick={() => status === "unlocked" && router.push(`/unt/lesson/${lesson.id}`)}
                      className={cn(
                        "group relative p-8 rounded-[2.5rem] border transition-all duration-500 cursor-pointer overflow-hidden",
                        status === "locked"
                          ? "bg-muted/30 border-white/5 opacity-60 cursor-not-allowed"
                          : "bg-white/5 border-white/10 hover:border-primary/50 hover:shadow-[0_0_40px_rgba(212,175,55,0.1)] backdrop-blur-xl"
                      )}
                    >
                      <div className="absolute top-0 right-0 p-4">
                        {isCompleted ? (
                          <CheckCircle className="h-6 w-6 text-emerald-500" />
                        ) : status === "locked" ? (
                          <Lock className="h-6 w-6 text-muted-foreground" />
                        ) : (
                          <PlayCircle className="h-6 w-6 text-primary" />
                        )}
                      </div>

                      <div className="flex items-center gap-4 mb-4">
                        <div className={cn(
                          "h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg transition-all",
                          status === "locked" ? "bg-muted text-muted-foreground" : "bg-primary text-black"
                        )}>
                          {index + 1}
                        </div>
                        <h3 className="text-2xl font-bold text-white group-hover:text-primary transition-colors">
                          {lesson.title}
                        </h3>
                      </div>

                      <p className="text-muted-foreground leading-relaxed font-medium">
                        {lesson.description}
                      </p>

                      {status === "unlocked" && (
                        <div className="mt-6 flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                          Сабаққа өту <ChevronRight className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Center Marker */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className={cn(
                      "h-12 w-12 rounded-full border-4 flex items-center justify-center transition-all duration-500",
                      isCompleted
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                        : status === "unlocked"
                          ? "bg-primary border-primary text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                          : "bg-background border-white/10 text-white/20"
                    )}>
                      {isCompleted ? <Trophy className="h-5 w-5" /> : <span className="font-black">{index + 1}</span>}
                    </div>
                  </div>

                  {/* Empty Space for Layout Balance */}
                  <div className="hidden md:block w-1/2" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

import { Trophy } from "lucide-react";

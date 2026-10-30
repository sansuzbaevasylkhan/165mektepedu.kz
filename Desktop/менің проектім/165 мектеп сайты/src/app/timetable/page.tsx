"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Calendar, Clock, MapPin, User, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function TimetablePage() {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInitialData() {
      setLoading(true);
      try {
        // 1. Fetch all available classes
        const { data: classData } = await supabase
          .from("class_groups")
          .select("*")
          .order("name");
        setClasses(classData || []);

        // If user is logged in, try to auto-select their class
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("class_id")
            .eq("id", user.id)
            .single();

          if (profile?.class_id) {
            setSelectedClass(profile.class_id);
            fetchTimetable(profile.class_id);
          }
        }
      } catch (err) {
        console.error("Error loading initial data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchInitialData();
  }, []);

  async function fetchTimetable(classId: string) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("lesson_schedule")
        .select(`
          *,
          subjects(name),
          profiles(first_name, last_name),
          classrooms(room_number)
        `)
        .eq("class_id", classId)
        .eq("is_published", true)
        .order("weekday", { ascending: true })
        .order("lesson_number", { ascending: true });

      if (error) throw error;
      setTimetable(data || []);
    } catch (err) {
      console.error("Error fetching timetable:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedClass) {
      fetchTimetable(selectedClass);
    }
  }, [selectedClass]);

  const days = [
    { id: 1, name: "Дүйсенбі" },
    { id: 2, name: "Сейсенбі" },
    { id: 3, name: "Сәрсенбі" },
    { id: 4, name: "Бейсенбі" },
    { id: 5, name: "Жұма" },
    { id: 6, name: "Сенбі" },
    { id: 7, name: "Жексенбі" },
  ];

  if (loading && !selectedClass) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Hero Section */}
      <section className="relative py-24 px-4 overflow-hidden text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent -z-10" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto relative z-10"
        >
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 uppercase">
            САБАҚ <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-[#D4AF37] to-[#B8860B]">КЕСТЕСІ</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
            Оқу процесінің жоспарын қараңыз және уақытыңызды тиімді басқарыңыз.
          </p>
        </motion.div>
      </section>

      <div className="container mx-auto px-4">
        {/* Class Selector */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => setSelectedClass(cls.id)}
              className={cn(
                "px-6 py-3 rounded-2xl font-bold transition-all duration-300 border backdrop-blur-md",
                selectedClass === cls.id
                  ? "bg-primary text-black border-primary shadow-[0_0_20px_rgba(212,175,55,0.4)] scale-105"
                  : "bg-white/5 text-white border-white/10 hover:border-primary/50"
              )}
            >
              {cls.name}
            </button>
          ))}
        </div>

        {/* Timetable Grid */}
        {!selectedClass ? (
          <div className="text-center py-32 space-y-6">
            <div className="mx-auto h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Calendar className="h-12 w-12" />
            </div>
            <h2 className="text-3xl font-bold">Сыныпты таңдаңыз</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Кестені көру үшін жоғарыдағы тізімнен өз сыныбыңызды таңдаңыз.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
            {days.map((day) => {
              const dayLessons = timetable.filter(l => l.weekday === day.id);
              return (
                <div key={day.id} className="space-y-4">
                  <div className="text-center py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                    <h3 className="text-lg font-black uppercase tracking-widest">{day.name}</h3>
                  </div>

                  <AnimatePresence mode="popLayout">
                    {dayLessons.length > 0 ? (
                      dayLessons.map((lesson, idx) => (
                        <motion.div
                          key={lesson.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ delay: idx * 0.05 }}
                          className="p-5 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl hover:border-primary/50 transition-all group relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />

                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-black px-2 py-1 rounded-lg bg-primary text-black uppercase">
                              {lesson.lesson_number}-сабақ
                            </span>
                            <div className="flex items-center gap-1 text-[10px] text-white/40 font-mono">
                              <Clock className="h-3 w-3" />
                              {lesson.start_time} - {lesson.end_time}
                            </div>
                          </div>

                          <h4 className="text-xl font-bold mb-3 leading-tight group-hover:text-primary transition-colors">
                            {lesson.subjects?.name || "Пән белгісіз"}
                          </h4>

                          <div className="space-y-2 text-sm text-white/60">
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3 text-primary" />
                              <span className="truncate">{lesson.profiles?.first_name} {lesson.profiles?.last_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3 text-primary" />
                              <span>Каб: {lesson.classrooms?.room_number || "—"}</span>
                            </div>
                          </div>

                          {lesson.lesson_title && (
                            <div className="mt-4 pt-4 border-t border-white/5">
                              <p className="text-xs italic text-white/40 line-clamp-2">
                                {lesson.lesson_title}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      ))
                    ) : (
                      <div className="p-8 rounded-3xl border border-dashed border-white/10 text-center text-white/20 italic text-sm">
                        Сабақ жоқ
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

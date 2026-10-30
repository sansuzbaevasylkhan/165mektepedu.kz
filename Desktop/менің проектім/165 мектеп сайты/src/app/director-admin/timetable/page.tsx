"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  Trash2,
  Save,
  X,
  Calendar,
  Clock,
  User,
  MapPin,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface TimetableEntry {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  classroom_id: string;
  weekday: number;
  lesson_number: number;
  start_time: string;
  end_time: string;
  lesson_title: string;
  description: string;
  is_published: boolean;
  visibility: 'PUBLIC' | 'AUTHENTICATED_ONLY' | 'PRIVATE';
}

export default function DirectorTimetablePage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  const [currentEntry, setCurrentEntry] = useState<Partial<TimetableEntry>>({
    weekday: 1,
    lesson_number: 1,
    start_time: "08:00",
    end_time: "08:45",
    is_published: true,
    visibility: 'PUBLIC'
  });

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchTimetable();
    }
  }, [selectedClass]);

  async function fetchMeta() {
    try {
      const { data: c } = await supabase.from("class_groups").select("*").order("name");
      const { data: s } = await supabase.from("subjects").select("*").order("name");
      const { data: t } = await supabase.from("profiles").select("*").eq("role", "teacher").order("last_name");
      const { data: r } = await supabase.from("classrooms").select("*").order("room_number");

      setClasses(c || []);
      setSubjects(s || []);
      setTeachers(t || []);
      setClassrooms(r || []);
    } catch (err) {
      console.error("Meta fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTimetable() {
    if (!selectedClass) return;
    try {
      const { data } = await supabase
        .from("lesson_schedule")
        .select("*")
        .eq("class_id", selectedClass)
        .order("weekday", { ascending: true })
        .order("lesson_number", { ascending: true });
      setTimetable(data || []);
    } catch (err) {
      console.error("Timetable fetch error:", err);
    }
  }

  async function handleSave() {
    setSaveLoading(true);
    try {
      // 1. Conflict Validation
      const { data: conflicts } = await supabase
        .from("lesson_schedule")
        .select("id")
        .neq("id", currentEntry.id || "00000000-0000-0000-0000-000000000000")
        .eq("weekday", currentEntry.weekday)
        .eq("lesson_number", currentEntry.lesson_number)
        .or(`class_id.eq.${selectedClass},teacher_id.eq.${currentEntry.teacher_id},classroom_id.eq.${currentEntry.classroom_id}`);

      if (conflicts && conflicts.length > 0) {
        throw new Error("Кестеде қайшылық анықталды! Мұғалім, кабинет немесе сынып бұл уақытта басқа сабақта.");
      }

      if (currentEntry.id) {
        await supabase.from("lesson_schedule").update(currentEntry).eq("id", currentEntry.id);
      } else {
        await supabase.from("lesson_schedule").insert([
          { ...currentEntry, class_id: selectedClass }
        ]);
      }

      setIsEditing(false);
      await fetchTimetable();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Бұл сабақты өшіруге сенімдісіз бе?")) return;
    try {
      await supabase.from("lesson_schedule").delete().eq("id", id);
      await fetchTimetable();
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-white">Жүктелуде...</div>;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="text-4xl font-black tracking-tight text-white">Сабақ кестесін басқару</h1>
          <p className="text-muted-foreground mt-2">Сыныптар бойынша сабақтарды жоспарлаңыз және жариялаңыз</p>
        </div>
        <button
          disabled={!selectedClass}
          onClick={() => {
            setCurrentEntry({
              weekday: 1,
              lesson_number: 1,
              start_time: "08:00",
              end_time: "08:45",
              is_published: true,
              visibility: 'PUBLIC'
            });
            setIsEditing(true);
          }}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all",
            !selectedClass
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-black hover:scale-105 active:scale-95 shadow-lg"
          )}
        >
          <Plus className="h-4 w-4" /> Жаңа сабақ қосу
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Class Selector Sidebar */}
        <div className="xl:col-span-1 space-y-6">
          <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" /> Сыныпты таңдау
            </h3>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
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
        </div>

        {/* Main Timetable Area */}
        <div className="xl:col-span-3 space-y-6">
          {!selectedClass ? (
            <div className="flex flex-col items-center justify-center py-32 rounded-3xl border border-dashed border-white/10 bg-white/5 text-center space-y-4">
              <Calendar className="h-16 w-16 text-white/20" />
              <h2 className="text-2xl font-bold text-white/40">Кестені көру үшін сыныпты таңдаңыз</h2>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Timetable Grid (Simplified for Management) */}
              <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-white/40 font-medium">
                    <tr className="border-b border-white/10">
                      <th className="px-6 py-4">Сабақ</th>
                      <th className="px-6 py-4">Пән</th>
                      <th className="px-6 py-4">Мұғалім</th>
                      <th className="px-6 py-4">Кабинет</th>
                      <th className="px-6 py-4">Уақыты</th>
                      <th className="px-6 py-4 text-right">Әрекет</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {timetable.length > 0 ? timetable.map((entry) => (
                      <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-bold text-primary">#{entry.lesson_number}</td>
                        <td className="px-6 py-4 font-medium text-white">
                          {entry.subjects?.name || "Белгісіз"}
                        </td>
                        <td className="px-6 py-4 text-white/70">
                          {entry.profiles?.first_name} {entry.profiles?.last_name}
                        </td>
                        <td className="px-6 py-4 text-white/70">
                          {entry.classrooms?.room_number || "—"}
                        </td>
                        <td className="px-6 py-4 text-white/40 font-mono text-xs">
                          {entry.start_time} - {entry.end_time}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => { setCurrentEntry(entry); setIsEditing(true); }}
                            className="p-2 hover:bg-white/10 rounded-lg text-blue-400 transition-colors"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-2 hover:bg-white/10 rounded-lg text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-20 text-center text-white/30 italic">Бұл сыныпқа кесте құрастырылмаған</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit/Create Modal */}
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
                <h2 className="text-2xl font-black text-white">{currentEntry.id ? "Сабақты өңдеу" : "Жаңа сабақ қосу"}</h2>
                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white/10 rounded-full text-white/50 transition-colors">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Күн</label>
                    <select
                      value={currentEntry.weekday}
                      onChange={(e) => setCurrentEntry({...currentEntry, weekday: parseInt(e.target.value)})}
                      className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-primary transition-all"
                    >
                      { [1,2,3,4,5,6,7].map(d => (
                        <option key={d} value={d}>
                          {d === 1 ? "Дүйсенбі" : d === 2 ? "Сейсенбі" : d === 3 ? "Сәрсенбі" : d === 4 ? "Бейсенбі" : d === 5 ? "Жұма" : d === 6 ? "Сенбі" : "Жексенбі"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Сабақ нөмірі</label>
                    <input
                      type="number"
                      value={currentEntry.lesson_number}
                      onChange={(e) => setCurrentEntry({...currentEntry, lesson_number: parseInt(e.target.value)})}
                      className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-primary transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Басталуы</label>
                      <input
                        type="time"
                        value={currentEntry.start_time}
                        onChange={(e) => setCurrentEntry({...currentEntry, start_time: e.target.value})}
                        className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-primary transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Аяқталуы</label>
                      <input
                        type="time"
                        value={currentEntry.end_time}
                        onChange={(e) => setCurrentEntry({...currentEntry, end_time: e.target.value})}
                        className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-primary transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Assignments */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Пән</label>
                    <select
                      value={currentEntry.subject_id}
                      onChange={(e) => setCurrentEntry({...currentEntry, subject_id: e.target.value})}
                      className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-primary transition-all"
                    >
                      <option value="">Пәнді таңдаңыз</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Мұғалім</label>
                    <select
                      value={currentEntry.teacher_id}
                      onChange={(e) => setCurrentEntry({...currentEntry, teacher_id: e.target.value})}
                      className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-primary transition-all"
                    >
                      <option value="">Мұғалімді таңдаңыз</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.last_name} {t.first_name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Кабинет</label>
                    <select
                      value={currentEntry.classroom_id}
                      onChange={(e) => setCurrentEntry({...currentEntry, classroom_id: e.target.value})}
                      className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-primary transition-all"
                    >
                      <option value="">Кабинетті таңдаңыз</option>
                      {classrooms.map(r => <option key={r.id} value={r.id}>{r.room_number}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Сабақ тақырыбы</label>
                  <input
                    value={currentEntry.lesson_title}
                    onChange={(e) => setCurrentEntry({...currentEntry, lesson_title: e.target.value})}
                    className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-primary transition-all"
                    placeholder="Тақырыпты енгізіңіз..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Сипаттама</label>
                  <textarea
                    value={currentEntry.description}
                    onChange={(e) => setCurrentEntry({...currentEntry, description: e.target.value})}
                    className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-primary transition-all h-24"
                    placeholder="Қосымша мәліметтер..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-white/10">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_published"
                      checked={currentEntry.is_published}
                      onChange={(e) => setCurrentEntry({...currentEntry, is_published: e.target.checked})}
                      className="h-4 w-4 accent-primary"
                    />
                    <label htmlFor="is_published" className="text-sm text-white/70">Жариялау</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={currentEntry.visibility}
                      onChange={(e) => setCurrentEntry({...currentEntry, visibility: e.target.value})}
                      className="p-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white outline-none"
                    >
                      <option value="PUBLIC">Жалпыға</option>
                      <option value="AUTHENTICATED_ONLY">Авторизацияланғандарға</option>
                      <option value="PRIVATE">Жеке</option>
                    </select>
                  </div>
                </div>
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
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, Edit3, Save, X, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Lesson {
  id?: string;
  title: string;
  description: string;
  video_url: string;
  order_index: number;
  is_published: boolean;
}

export default function AdminUNTPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<Lesson>({
    title: "",
    description: "",
    video_url: "",
    order_index: 0,
    is_published: true,
  });
  const [loading, setLoading] = useState(false);

  async function fetchLessons() {
    const { data } = await supabase.from("lessons").select("*").order("order_index", { ascending: true });
    if (data) setLessons(data);
  }

  useEffect(() => {
    fetchLessons();
  }, []);

  async function handleSave() {
    setLoading(true);
    try {
      if (currentLesson.id) {
        await supabase.from("lessons").update(currentLesson).eq("id", currentLesson.id);
      } else {
        await supabase.from("lessons").insert([currentLesson]);
      }
      setIsEditing(false);
      setCurrentLesson({ title: "", description: "", video_url: "", order_index: 0, is_published: true });
      await fetchLessons();
    } catch (err) {
      alert("Қате кетті!");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Сабақты өшіруге сенімдісіз бе?")) return;
    await supabase.from("lessons").delete().eq("id", id);
    await fetchLessons();
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">ҰБТ Сабақтарын басқару</h1>
        {!isEditing && (
          <button
            onClick={() => { setIsEditing(true); setCurrentLesson({ title: "", description: "", video_url: "", order_index: 0, is_published: true }); }}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Сабақ қосу
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="max-w-2xl mx-auto p-6 rounded-3xl border bg-background space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{currentLesson.id ? "Өзгерту" : "Жаңа сабақ қосу"}</h2>
            <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-muted rounded-full"><X className="h-5 w-5" /></button>
          </div>
          <div className="space-y-4">
            <input
              placeholder="Сабақ тақырыбы"
              className="w-full p-3 rounded-xl border bg-transparent"
              value={currentLesson.title}
              onChange={(e) => setCurrentLesson({ ...currentLesson, title: e.target.value })}
            />
            <textarea
              placeholder="Сипаттама"
              className="w-full p-3 rounded-xl border bg-transparent h-32"
              value={currentLesson.description}
              onChange={(e) => setCurrentLesson({ ...currentLesson, description: e.target.value })}
            />
            <input
              placeholder="YouTube Video URL"
              className="w-full p-3 rounded-xl border bg-transparent"
              value={currentLesson.video_url}
              onChange={(e) => setCurrentLesson({ ...currentLesson, video_url: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Реті (Order index)</label>
                <input
                  type="number"
                  className="w-full p-3 rounded-xl border bg-transparent"
                  value={currentLesson.order_index}
                  onChange={(e) => setCurrentLesson({ ...currentLesson, order_index: parseInt(e.target.value) })}
                />
              </div>
              <div className="flex items-center gap-2 pt-8">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={currentLesson.is_published}
                  onChange={(e) => setCurrentLesson({ ...currentLesson, is_published: e.target.checked })}
                />
                <label htmlFor="is_published" className="text-sm font-medium">Жарылысқа шығару</label>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" /> {loading ? "САҚТАЛУДЕ..." : "САҚТАУ"}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {lessons.map((lesson, idx) => (
            <div key={lesson.id} className="flex items-center justify-between p-4 rounded-2xl border bg-background">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                  {lesson.order_index}
                </div>
                <div>
                  <h3 className="font-bold">{lesson.title}</h3>
                  <p className="text-xs text-muted-foreground">{lesson.description.substring(0, 60)}...</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setCurrentLesson(lesson); setIsEditing(true); }} className="p-2 hover:bg-muted rounded-lg text-blue-500"><Edit3 className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(lesson.id!)} className="p-2 hover:bg-muted rounded-lg text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

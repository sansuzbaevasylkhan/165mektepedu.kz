"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, BookOpen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Lesson {
  id: number;
  title: string;
  description: string;
  video_url: string;
  order_index: number;
}

export default function AdminUBTPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newLesson, setNewLesson] = useState({
    title: "",
    description: "",
    video_url: "",
    order_index: 1,
  });

  useEffect(() => {
    fetchLessons();
  }, []);

  async function fetchLessons() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ubt_lessons")
        .select("*")
        .order("order_index", { ascending: true });
      if (error) throw error;
      setLessons(data || []);
    } catch (err) {
      console.error("Error fetching lessons:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("ubt_lessons")
        .insert([newLesson]);
      if (error) throw error;

      setNewLesson({ title: "", description: "", video_url: "", order_index: 1 });
      setIsDialogOpen(false);
      await fetchLessons();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteLesson = async (id: number) => {
    if (!confirm("Бұл сабақты және оған байланысты барлық тесттерді өшіргіңіз келе ме?")) return;
    try {
      const { error } = await supabase.from("ubt_lessons").delete().eq("id", id);
      if (error) throw error;
      await fetchLessons();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Жүктелуде...</div>;

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">ҰБТ Сабақтарын Басқару</h1>
          <p className="text-muted-foreground">Сабақтарды қосыңыз, өңдеңіз және ретін белгілеңіз</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-black font-bold gap-2">
              <Plus className="h-4 w-4" /> Жаңа сабақ қосу
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-background border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Жаңа сабақ қосу</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddLesson} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Сабақ атауы</label>
                <Input
                  required
                  value={newLesson.title}
                  onChange={(e) => setNewLesson({...newLesson, title: e.target.value})}
                  placeholder="Мысалы: 1-сабақ: Кіріспе"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Сипаттама</label>
                <Textarea
                  required
                  value={newLesson.description}
                  onChange={(e) => setNewLesson({...newLesson, description: e.target.value})}
                  placeholder="Сабақтың қысқаша мазмұны"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Видео сілтемесі (Embed URL)</label>
                <Input
                  required
                  value={newLesson.video_url}
                  onChange={(e) => setNewLesson({...newLesson, video_url: e.target.value})}
                  placeholder="https://www.youtube.com/embed/..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Сабақ реті (Order Index)</label>
                <Input
                  type="number"
                  required
                  value={newLesson.order_index}
                  onChange={(e) => setNewLesson({...newLesson, order_index: parseInt(e.target.value)})}
                />
              </div>
              <Button type="submit" className="w-full bg-primary text-black font-bold">Қосу</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-3xl border border-white/10 bg-background/50 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">Реті</TableHead>
              <TableHead className="font-bold">Атауы</TableHead>
              <TableHead className="font-bold">Сипаттама</TableHead>
              <TableHead className="font-bold text-right">Әрекеттер</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lessons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">Сабақтар табылмады</TableCell>
              </TableRow>
            ) : (
              lessons.map((lesson) => (
                <TableRow key={lesson.id} className="hover:bg-white/5 transition-colors">
                  <TableCell className="font-bold text-primary">#{lesson.order_index}</TableCell>
                  <TableCell className="font-medium">{lesson.title}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">{lesson.description}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => window.location.href = `/admin/ubt/test/${lesson.id}`} className="text-primary">
                      <BookOpen className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteLesson(lesson.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

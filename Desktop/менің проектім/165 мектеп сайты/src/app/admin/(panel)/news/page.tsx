"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, Edit3, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsItem {
  id?: string;
  title: string;
  description: string;
  content: string;
  image_url: string;
  created_at?: string;
}

export default function AdminNewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentNews, setCurrentNews] = useState<NewsItem>({
    title: "",
    description: "",
    content: "",
    image_url: "",
  });
  const [loading, setLoading] = useState(false);

  async function fetchNews() {
    const { data } = await supabase.from("news").select("*").order("created_at", { ascending: false });
    if (data) setNews(data);
  }

  useEffect(() => {
    fetchNews();
  }, []);

  async function handleSave() {
    setLoading(true);
    try {
      if (currentNews.id) {
        await supabase.from("news").update(currentNews).eq("id", currentNews.id);
      } else {
        await supabase.from("news").insert([currentNews]);
      }
      setIsEditing(false);
      setCurrentNews({ title: "", description: "", content: "", image_url: "" });
      await fetchNews();
    } catch (err) {
      alert("Қате кетті!");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Бұл жаңалықты өшіруге сенімдісіз бе?")) return;
    await supabase.from("news").delete().eq("id", id);
    await fetchNews();
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Жаңалықтарды басқару</h1>
        {!isEditing && (
          <button
            onClick={() => { setIsEditing(true); setCurrentNews({ title: "", description: "", content: "", image_url: "" }); }}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Жаңалық қосу
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="max-w-2xl mx-auto p-6 rounded-3xl border bg-background space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{currentNews.id ? "Өзгерту" : "Жаңалық қосу"}</h2>
            <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-muted rounded-full"><X className="h-5 w-5" /></button>
          </div>
          <div className="space-y-4">
            <input
              placeholder="Тақырыбы"
              className="w-full p-3 rounded-xl border bg-transparent"
              value={currentNews.title}
              onChange={(e) => setCurrentNews({ ...currentNews, title: e.target.value })}
            />
            <input
              placeholder="Қысқаша сипаттама"
              className="w-full p-3 rounded-xl border bg-transparent"
              value={currentNews.description}
              onChange={(e) => setCurrentNews({ ...currentNews, description: e.target.value })}
            />
            <textarea
              placeholder="Толық мәтін"
              className="w-full p-3 rounded-xl border bg-transparent h-40"
              value={currentNews.content}
              onChange={(e) => setCurrentNews({ ...currentNews, content: e.target.value })}
            />
            <input
              placeholder="Сурет сілтемесі (URL)"
              className="w-full p-3 rounded-xl border bg-transparent"
              value={currentNews.image_url}
              onChange={(e) => setCurrentNews({ ...currentNews, image_url: e.target.value })}
            />
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
          {news.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl border bg-background">
              <div className="flex items-center gap-4">
                <img src={item.image_url} className="h-12 w-12 rounded-lg object-cover" />
                <div>
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setCurrentNews(item); setIsEditing(true); }} className="p-2 hover:bg-muted rounded-lg text-blue-500"><Edit3 className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(item.id!)} className="p-2 hover:bg-muted rounded-lg text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

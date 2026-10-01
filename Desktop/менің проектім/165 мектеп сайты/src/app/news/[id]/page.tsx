"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewsDetailPage() {
  const { id } = useParams();
  const [news, setNews] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      try {
        const { data, error } = await supabase
          .from("news")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setNews(data);
      } catch (err) {
        console.error("Error fetching news detail:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, [id]);

  if (loading) return <div className="container mx-auto px-4 py-20 text-center">Жүктелуде...</div>;
  if (!news) return <div className="container mx-auto px-4 py-20 text-center">Жаңалық табылмады.</div>;

  return (
    <div className="container mx-auto px-4 py-20">
      <Link
        href="/news"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Жаңалықтарға қайту
      </Link>

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 text-muted-foreground mb-6">
          <Calendar className="h-4 w-4" />
          {new Date(news.created_at).toLocaleDateString('kk-KZ')}
        </div>
        <h1 className="text-4xl font-extrabold md:text-6xl mb-8">{news.title}</h1>
        <div className="rounded-3xl overflow-hidden mb-10">
          <img
            src={news.image_url || "/api/placeholder/800/400"}
            alt={news.title}
            className="w-full h-auto max-h-[500px] object-cover"
          />
        </div>
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p className="text-xl text-muted-foreground mb-6 font-medium leading-relaxed">
            {news.description}
          </p>
          <div className="text-lg leading-relaxed space-y-4 whitespace-pre-wrap">
            {news.content}
          </div>
        </div>
      </div>
    </div>
  );
}

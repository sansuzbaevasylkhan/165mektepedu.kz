"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Calendar, ArrowRight, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsItem {
  id: string;
  title: string;
  description: string;
  content: string;
  image_url: string;
  created_at: string;
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      try {
        const { data, error } = await supabase
          .from("news")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setNews(data || []);
      } catch (err) {
        console.error("Error fetching news:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-muted-foreground">Жүктелуде...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="flex flex-col items-center text-center mb-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6">
          <Newspaper className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-extrabold md:text-6xl mb-4">Жаңалықтар</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Мектеп өмірінен ең маңызды оқиғалар, жетістіктер мен хабарландырулар.
        </p>
      </div>

      {news.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed">
          <p className="text-muted-foreground text-lg">Әзірге жаңалықтар жоқ.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {news.map((item) => (
            <div key={item.id} className="group flex flex-col overflow-hidden rounded-3xl border bg-background transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="relative h-56 w-full overflow-hidden">
                <img
                  src={item.image_url || "/api/placeholder/400/300"}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="flex flex-col p-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Calendar className="h-4 w-4" />
                  {new Date(item.created_at).toLocaleDateString('kk-KZ')}
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-muted-foreground line-clamp-3 mb-6 flex-1">
                  {item.description}
                </p>
                <Link
                  href={`/news/${item.id}`}
                  className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:gap-3 transition-all"
                >
                  Толығырақ <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

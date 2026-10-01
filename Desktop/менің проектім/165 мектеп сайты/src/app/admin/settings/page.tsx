"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Save, Globe } from "lucide-react";

export default function AdminSettingsPage() {
  const [links, setLinks] = useState({
    instagram: "",
    tiktok: "",
    youtube: "",
    telegram: "",
    whatsapp: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchLinks() {
      const { data } = await supabase.from("social_links").select("*");
      if (data) {
        const newLinks = {};
        data.forEach(item => {
          newLinks[item.platform] = item.url;
        });
        setLinks(newLinks);
      }
    }
    fetchLinks();
  }, []);

  async function handleSave() {
    setLoading(true);
    try {
      const linkData = Object.entries(links).map(([platform, url]) => ({ platform, url }));

      // Simplification: delete and re-insert or upsert
      await supabase.from("social_links").delete().neq("platform", "placeholder");
      await supabase.from("social_links").insert(linkData);

      alert("Сілтемелер сәтті сақталды!");
    } catch (err) {
      alert("Қате кетті!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-3xl font-bold">Сайт баптаулары</h1>

      <div className="p-6 rounded-3xl border bg-background space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Globe className="h-5 w-5" /> Әлеуметтік желілер
        </h2>

        <div className="space-y-4">
          {Object.keys(links).map(platform => (
            <div key={platform} className="space-y-2">
              <label className="text-sm font-medium capitalize">{platform}</label>
              <input
                className="w-full p-3 rounded-xl border bg-transparent"
                placeholder={`https://...`}
                value={links[platform as keyof typeof links]}
                onChange={(e) => setLinks({ ...links, [platform]: e.target.value })}
              />
            </div>
          ))}
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
  );
}

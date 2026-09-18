"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, Save, Sparkles, GripVertical } from "lucide-react";
import { useToast } from "@/components/ui/ToastContext";
import { FileUpload, UploadedFile } from "@/components/ui/FileUpload";
import { slugify } from "@/lib/slug";

interface EpisodeData {
  id?: string;
  episodeNumber: number;
  title: string;
  videoUrl: string;
  duration: number;
}

interface DramaData {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  posterUrl: string;
  isPublished: boolean;
}

interface DramaFormProps {
  drama: DramaData | null;
  onSaved: () => void;
  onCancel: () => void;
}

export function DramaForm({ drama, onSaved, onCancel }: DramaFormProps) {
  const [title, setTitle] = useState(drama?.title || "");
  const [slug, setSlug] = useState(drama?.slug || "");
  const [slugTouched, setSlugTouched] = useState(!!drama);
  const [description, setDescription] = useState(drama?.description || "");
  const [poster, setPoster] = useState<UploadedFile | null>(
    drama?.posterUrl
      ? { url: drama.posterUrl, filename: drama.posterUrl.split("/").pop() || "", size: 0 }
      : null
  );
  const [isPublished, setIsPublished] = useState(drama?.isPublished ?? true);
  const [episodes, setEpisodes] = useState<EpisodeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const toast = useToast();

  // Auto-generate slug from title (Cyrillic + Latin)
  useEffect(() => {
    if (!slugTouched && title) {
      setSlug(slugify(title));
    }
  }, [title, slugTouched]);

  // Load existing episodes when editing
  useEffect(() => {
    if (drama?.id) {
      setLoadingEpisodes(true);
      fetch(`/api/admin/dramas/${drama.id}/episodes`)
        .then((r) => r.json())
        .then((data) => {
          if (data.episodes) {
            setEpisodes(
              data.episodes.map((e: any) => ({
                id: e.id,
                episodeNumber: e.episodeNumber,
                title: e.title,
                videoUrl: e.videoUrl,
                duration: e.duration,
              }))
            );
          }
        })
        .catch(() => toast.error("Бөлімдерді жүктеу қатесі"))
        .finally(() => setLoadingEpisodes(false));
    }
  }, [drama?.id]);

  const addEpisode = () => {
    setEpisodes((prev) => [
      ...prev,
      {
        episodeNumber: prev.length + 1,
        title: `Бөлім ${prev.length + 1}`,
        videoUrl: "",
        duration: 0,
      },
    ]);
  };

  const removeEpisode = (idx: number) => {
    setEpisodes((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      // Renumber
      return next.map((e, i) => ({ ...e, episodeNumber: i + 1 }));
    });
  };

  const updateEpisode = (idx: number, patch: Partial<EpisodeData>) => {
    setEpisodes((prev) => prev.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Дорама атын енгізіңіз");
    if (!slug.trim()) return toast.error("Slug міндетті");
    if (!poster) return toast.error("Постер жүктеңіз");

    // Validate episodes
    for (let i = 0; i < episodes.length; i++) {
      if (!episodes[i].videoUrl) {
        return toast.error(`${i + 1}-бөлімге видео жүктеңіз`);
      }
    }

    setLoading(true);
    try {
      const url = drama ? `/api/admin/dramas/${drama.id}` : "/api/admin/dramas";
      const method = drama ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          description,
          posterUrl: poster.url,
          isPublished,
          episodes: episodes.map((e) => ({
            episodeNumber: e.episodeNumber,
            title: e.title,
            videoUrl: e.videoUrl,
            duration: e.duration,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(drama ? "Дорама жаңартылды" : "Дорама қосылды");
        onSaved();
      } else {
        toast.error(data.error || "Сақтау қатесі");
      }
    } catch (err) {
      toast.error("Желі қатесі");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: Poster */}
        <div>
          <label className="text-sm font-medium text-white/80 mb-2 block">
            Постер <span className="text-rose-400">*</span>
          </label>
          <FileUpload
            accept="image"
            value={poster || undefined}
            onChange={setPoster}
            maxSizeMB={10}
          />
          <p className="text-xs text-white/40 mt-2">Ұсынылатын: 2:3 арақатынас, мин 600x900px</p>
        </div>

        {/* Right: Text fields */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-white/80 mb-2 block">
              Дорама аты <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Мысалы: The Glory"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/40 text-sm"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-white/80 mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary-400" />
              Slug (автоматты)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                  setSlugTouched(true);
                }}
                placeholder="the-glory"
                className="w-full pl-7 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/40 text-sm font-mono"
                required
              />
            </div>
            <p className="text-xs text-white/40 mt-1.5">
              URL: <span className="text-primary-400">/drama/{slug || "..."}</span>
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-white/80 mb-2 block">Сипаттама</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Дорама туралы қысқаша ақпарат..."
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/40 text-sm resize-none"
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none p-3 rounded-xl bg-white/5 border border-white/10">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 rounded accent-primary-500"
            />
            <span className="text-sm text-white">Сайтта жариялау</span>
          </label>
        </div>
      </div>

      {/* Episodes */}
      <div className="border-t border-white/10 pt-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-white">Бөлімдер</h3>
            <p className="text-xs text-white/50 mt-0.5">
              Барлығы: {episodes.length} бөлім
            </p>
          </div>
          <button
            type="button"
            onClick={addEpisode}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            Бөлім қосу
          </button>
        </div>

        {loadingEpisodes ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-white/40" />
          </div>
        ) : episodes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-6 text-center">
            <p className="text-sm text-white/50">Бөлімдер жоқ. Жоғарыдағы батырманы басып қосыңыз.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {episodes.map((ep, idx) => (
              <EpisodeRow
                key={idx}
                episode={ep}
                onChange={(patch) => updateEpisode(idx, patch)}
                onRemove={() => removeEpisode(idx)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium"
        >
          Бас тарту
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-pink-500 hover:from-primary-600 hover:to-pink-600 text-white font-bold text-sm shadow-lg shadow-primary-500/25 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Сақталуда...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Сақтау
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function EpisodeRow({
  episode,
  onChange,
  onRemove,
}: {
  episode: EpisodeData;
  onChange: (patch: Partial<EpisodeData>) => void;
  onRemove: () => void;
}) {
  const [video, setVideo] = useState<UploadedFile | null>(
    episode.videoUrl
      ? { url: episode.videoUrl, filename: episode.videoUrl.split("/").pop() || "", size: 0 }
      : null
  );

  return (
    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10">
      <GripVertical className="h-4 w-4 text-white/20 flex-shrink-0" />
      <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary-500/30 to-pink-500/30 border border-primary-500/30 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
        {episode.episodeNumber}
      </div>
      <input
        type="text"
        value={episode.title}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="Атауы"
        className="flex-1 min-w-0 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500/40"
      />
      <div className="w-48 hidden md:block">
        <FileUpload
          accept="video"
          value={video || undefined}
          onChange={(f) => {
            setVideo(f);
            onChange({ videoUrl: f?.url || "" });
          }}
          maxSizeMB={500}
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="h-8 w-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

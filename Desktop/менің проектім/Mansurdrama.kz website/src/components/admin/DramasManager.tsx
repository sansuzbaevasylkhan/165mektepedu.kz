"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Search, Film, Eye, Calendar, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/ToastContext";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DramaForm } from "./DramaForm";
import { Skeleton } from "@/components/ui/Skeleton";

interface Drama {
  id: string;
  title: string;
  slug: string;
  posterUrl: string;
  totalEpisodes: number;
  views: number;
  isPublished: boolean;
  createdAt: string;
}

export function DramasManager() {
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Drama | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const toast = useToast();

  const PAGE_SIZE = 12;

  const fetchDramas = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/dramas");
      const data = await res.json();
      if (data.dramas) setDramas(data.dramas);
    } catch (err) {
      toast.error("Дорамаларды жүктеу қатесі");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDramas();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/dramas/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        toast.success("Дорама жойылды");
        fetchDramas();
      } else {
        toast.error(data.error || "Жою қатесі");
      }
    } catch {
      toast.error("Желі қатесі");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (drama: Drama) => {
    setEditing(drama);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSaved = () => {
    setFormOpen(false);
    setEditing(null);
    fetchDramas();
  };

  const filtered = dramas.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.slug.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <div>
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Дорама іздеу..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/40 text-sm"
          />
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-pink-500 hover:from-primary-600 hover:to-pink-600 text-white font-semibold text-sm shadow-lg shadow-primary-500/25 transition-all"
        >
          <Plus className="h-4 w-4" />
          Дорама қосу
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl bg-white/5 border border-dashed border-white/10">
          <Film className="h-12 w-12 text-white/20 mb-3" />
          <h3 className="text-lg font-semibold text-white mb-1">Дорамалар табылмады</h3>
          <p className="text-sm text-white/50">
            {search ? "Іздеу нәтижесі бос" : "Алғашқы дорамаңызды қосыңыз"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {paged.map((drama, i) => (
                <motion.div
                  key={drama.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                  className="card p-4 flex gap-3"
                >
                  <div className="relative h-24 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-dark-800">
                    {drama.posterUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={drama.posterUrl}
                        alt={drama.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="h-5 w-5 text-white/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-sm line-clamp-1">
                      {drama.title}
                    </h3>
                    <p className="text-xs text-white/40 mt-0.5 truncate">/{drama.slug}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-white/50">
                      <span className="flex items-center gap-1">
                        <Film className="h-3 w-3" />
                        {drama.totalEpisodes}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {drama.views}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-3">
                      <button
                        onClick={() => handleEdit(drama)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors"
                      >
                        <Pencil className="h-3 w-3" />
                        Өңдеу
                      </button>
                      <button
                        onClick={() => setDeletingId(drama.id)}
                        className="inline-flex items-center justify-center p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm disabled:opacity-30"
              >
                Алдыңғы
              </button>
              <span className="text-sm text-white/60 px-3">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm disabled:opacity-30"
              >
                Келесі
              </button>
            </div>
          )}
        </>
      )}

      <Modal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        title={editing ? "Дораманы өңдеу" : "Жаңа дорама қосу"}
        description="Дорама мәліметтерін толтырыңыз"
        size="xl"
      >
        <DramaForm drama={editing} onSaved={handleSaved} onCancel={() => setFormOpen(false)} />
      </Modal>

      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && handleDelete(deletingId)}
        title="Дораманы жою"
        description="Бұл дорама мен оның бөлімдері толық жойылады. Бұл әрекетті қайтару мүмкін емес."
        confirmText="Жою"
      />
    </div>
  );
}

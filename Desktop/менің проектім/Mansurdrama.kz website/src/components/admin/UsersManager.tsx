"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, Mail, Calendar, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/ToastContext";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  status: "active" | "banned" | "inactive";
  createdAt: string;
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  banned: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  inactive: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

const statusLabels: Record<string, string> = {
  active: "Белсенді",
  banned: "Бұғатталған",
  inactive: "Белсенді емес",
};

export function UsersManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const toast = useToast();
  const PAGE_SIZE = 10;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch {
      toast.error("Қолданушыларды жүктеу қатесі");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Қолданушы жойылды");
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.error || "Жою қатесі");
      }
    } catch {
      toast.error("Желі қатесі");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <div>
      <div className="relative max-w-md mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Аты немесе email бойынша іздеу..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/40 text-sm"
        />
      </div>

      <div className="rounded-2xl border border-white/5 overflow-hidden bg-white/[0.02]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="text-left text-xs font-semibold text-white/50 uppercase tracking-wider px-4 py-3">ID</th>
                <th className="text-left text-xs font-semibold text-white/50 uppercase tracking-wider px-4 py-3">Қолданушы</th>
                <th className="text-left text-xs font-semibold text-white/50 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Email</th>
                <th className="text-left text-xs font-semibold text-white/50 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Қосылған</th>
                <th className="text-left text-xs font-semibold text-white/50 uppercase tracking-wider px-4 py-3">Статус</th>
                <th className="text-right text-xs font-semibold text-white/50 uppercase tracking-wider px-4 py-3">Әрекет</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-6 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-white/50">
                    Қолданушылар табылмады
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {paged.map((user, i) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3 text-xs text-white/40 font-mono">
                        {user.id.slice(0, 6)}...
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary-500/30 to-pink-500/30 border border-white/10 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                            {user.avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              user.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user.name}</p>
                            <p className="text-xs text-white/40 md:hidden truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-sm text-white/70 truncate max-w-[200px]">{user.email}</p>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <p className="text-sm text-white/60">
                          {new Date(user.createdAt).toLocaleDateString("kk-KZ")}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border",
                          statusColors[user.status]
                        )}>
                          {statusLabels[user.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setDeletingId(user.id)}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-white/60 px-3">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && handleDelete(deletingId)}
        title="Қолданушыны жою"
        description="Бұл қолданушының барлық деректері жойылады."
        confirmText="Жою"
      />
    </div>
  );
}

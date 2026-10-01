"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { UserCheck, UserX, Search, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setUsers(data || []);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  async function toggleUserStatus(userId: string, currentStatus: boolean) {
    try {
      // In a real app, we'd have an 'is_active' column in profiles
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: !currentStatus })
        .eq("id", userId);

      if (error) throw error;

      // Refresh list
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      setUsers(data || []);
    } catch (err) {
      alert("Қате кетті!");
    }
  }

  const filteredUsers = users.filter(u =>
    u.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.last_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search)
  );

  if (loading) return <div className="py-20 text-center">Жүктелуде...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Пайдаланушыларды басқару</h1>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full pl-10 pr-4 py-2 rounded-xl border bg-background"
            placeholder="Іздеу..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-3xl border bg-background overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="p-4 font-semibold text-sm">Аты-жөні</th>
                <th className="p-4 font-semibold text-sm">Телефон</th>
                <th className="p-4 font-semibold text-sm">Рөлі</th>
                <th className="p-4 font-semibold text-sm">Күні</th>
                <th className="p-4 font-semibold text-sm text-right">Әрекет</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium">{user.last_name} {user.first_name}</td>
                  <td className="p-4 text-sm text-muted-foreground">{user.phone}</td>
                  <td className="p-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-bold",
                      user.role === 'student' ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"
                    )}>
                      {user.role === 'student' ? 'Оқушы' : 'Ата-ана'}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => toggleUserStatus(user.id, user.is_active)}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        user.is_active ? "text-emerald-500 hover:bg-emerald-50" : "text-destructive hover:bg-destructive/10"
                      )}
                      title={user.is_active ? "Блоктау" : "Белсендіру"}
                    >
                      {user.is_active ? <UserX className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="py-20 text-center text-muted-foreground">Пайдаланушылар табылмады.</div>
        )}
      </div>
    </div>
  );
}

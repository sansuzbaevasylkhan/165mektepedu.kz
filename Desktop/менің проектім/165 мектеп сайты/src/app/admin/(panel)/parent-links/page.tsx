"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Search, UserPlus, Link as LinkIcon, Link2, UserCheck, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function ParentLinkPage() {
  const [parents, setParents] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedParent, setSelectedParent] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParent, setSearchParent] = useState("");
  const [searchStudent, setSearchStudent] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    setLoading(true);
    try {
      const { data: parentsData } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "parent")
        .order("created_at", { ascending: false });

      const { data: studentsData } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "student")
        .order("last_name", { ascending: true });

      const { data: linksData } = await supabase
        .from("parent_student_links")
        .select(`
          *,
          parent:profiles!parent_id(first_name, last_name, phone),
          student:profiles!student_id(first_name, last_name, phone)
        `);

      setParents(parentsData || []);
      setStudents(studentsData || []);
      setLinks(linksData || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLinkParentStudent() {
    if (!selectedParent || !selectedStudent) return;

    try {
      const { error } = await supabase
        .from("parent_student_links")
        .insert([
          {
            parent_id: selectedParent,
            student_id: selectedStudent,
            status: "APPROVED",
            approved_by: (window as any).userRole === 'admin' ? (await supabase.auth.getUser()).data.user?.id : null,
            approved_at: new Date().toISOString(),
          },
        ]);

      if (error) throw error;

      setSelectedStudent(null);
      await fetchInitialData();
      alert("Байланыс сәтті жасалды!");
    } catch (err: any) {
      alert("Қате кетті: " + err.message);
    }
  }

  async function handleRevokeLink(linkId: string) {
    if (!confirm("Бұл байланысты жоюға сенімдісіз бе?")) return;

    try {
      const { error } = await supabase
        .from("parent_student_links")
        .update({ status: "REVOKED", revoked_at: new Date().toISOString() })
        .eq("id", linkId);

      if (error) throw error;
      await fetchInitialData();
    } catch (err: any) {
      alert("Қате кетті: " + err.message);
    }
  }

  const filteredParents = parents.filter(p =>
    p.first_name?.toLowerCase().includes(searchParent.toLowerCase()) ||
    p.last_name?.toLowerCase().includes(searchParent.toLowerCase()) ||
    p.phone?.includes(searchParent)
  );

  const filteredStudents = students.filter(s =>
    s.first_name?.toLowerCase().includes(searchStudent.toLowerCase()) ||
    s.last_name?.toLowerCase().includes(searchStudent.toLowerCase()) ||
    s.phone?.includes(searchStudent)
  );

  if (loading) return <div className="flex items-center justify-center min-h-screen text-white">Жүктелуде...</div>;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white">Ата-ана мен оқушыны байланыстыру</h1>
          <p className="text-muted-foreground mt-2">Ата-аналарға балаларының үлгерімін көруге рұқсат беріңіз</p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-md">
          <div className="h-10 w-10 rounded-xl bg-primary text-black flex items-center justify-center font-bold">
            <Link2 className="h-5 w-5" />
          </div>
          <span className="text-sm font-bold pr-4 uppercase tracking-widest">Access Control</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Parent and Student Selection Area */}
        <div className="xl:col-span-1 space-y-6">
          <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Жаңа байланыс жасау
            </h3>

            <div className="space-y-4">
              {/* Parent Select */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Ата-ананы таңдау</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-black/40 text-sm outline-none focus:border-primary transition-all"
                    placeholder="Аты-жөні немесе телефон..."
                    value={searchParent}
                    onChange={(e) => setSearchParent(e.target.value)}
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar mt-2">
                  {filteredParents.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedParent(p.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl text-xs transition-all border",
                        selectedParent === p.id
                          ? "bg-primary text-black border-primary font-bold"
                          : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
                      )}
                    >
                      {p.last_name} {p.first_name} <span className="opacity-50 ml-2">({p.phone})</span>
                    </button>
                  ))}
                  {filteredParents.length === 0 && <p className="text-center text-xs text-muted-foreground py-4">Ата-ана табылмады</p>}
                </div>
              </div>

              {/* Student Select */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Оқушыны таңдау</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-black/40 text-sm outline-none focus:border-primary transition-all"
                    placeholder="Аты-жөні немесе телефон..."
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar mt-2">
                  {filteredStudents.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStudent(s.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl text-xs transition-all border",
                        selectedStudent === s.id
                          ? "bg-primary text-black border-primary font-bold"
                          : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
                      )}
                    >
                      {s.last_name} {s.first_name} <span className="opacity-50 ml-2">({s.phone})</span>
                    </button>
                  ))}
                  {filteredStudents.length === 0 && <p className="text-center text-xs text-muted-foreground py-4">Оқушы табылмады</p>}
                </div>
              </div>

              <button
                onClick={handleLinkParentStudent}
                disabled={!selectedParent || !selectedStudent}
                className={cn(
                  "w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-xl",
                  (!selectedParent || !selectedStudent)
                    ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                    : "bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#B8860B] text-black hover:scale-[1.02] active:scale-95"
                )}
              >
                Байланыстыру
              </button>
            </div>
          </div>
        </div>

        {/* Active Links Table */}
        <div className="xl:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-primary" /> Белсенді байланыстар
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-white/40 font-medium">
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-4">Ата-ана</th>
                    <th className="px-6 py-4">Оқушы</th>
                    <th className="px-6 py-4">Статус</th>
                    <th className="px-6 py-4">Күні</th>
                    <th className="px-6 py-4 text-right">Әрекет</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {links.length > 0 ? links.map((link) => (
                    <tr key={link.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-medium text-white">
                        {link.parent?.last_name} {link.parent?.first_name}
                      </td>
                      <td className="px-6 py-4 font-medium text-white">
                        {link.student?.last_name} {link.student?.first_name}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                          link.status === 'APPROVED' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                          link.status === 'REVOKED' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                          "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                        )}>
                          {link.status === 'APPROVED' ? 'Расталды' : link.status === 'REVOKED' ? 'Жойылды' : 'Күтуде'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white/40 text-xs">
                        {new Date(link.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRevokeLink(link.id)}
                          className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                          title="Байланысты жою"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-white/30 italic">Байланыстар табылмады</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

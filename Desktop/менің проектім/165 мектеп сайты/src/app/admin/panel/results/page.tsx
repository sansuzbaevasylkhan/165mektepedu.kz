"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, User, FileText, Calendar, Award } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TestAttempt {
  id: number;
  user_id: string;
  test_id: number;
  score: number;
  total_questions: number;
  completed_at: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
  ubt_tests: {
    title: string;
  };
}

export default function ResultsPage() {
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchResults() {
      try {
        const { data, error } = await supabase
          .from("test_attempts")
          .select(`
            *,
            profiles (first_name, last_name),
            ubt_tests (title)
          `)
          .order("completed_at", { ascending: false });

        if (error) throw error;
        setAttempts(data || []);
      } catch (err) {
        console.error("Error fetching results:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, []);

  const filteredAttempts = attempts.filter(attempt =>
    attempt.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attempt.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attempt.ubt_tests?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Тест Нәтижелері</h1>
          <p className="text-muted-foreground">Оқушылардың тест тапсыру статистикасы</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Оқушыны немесе тестті іздеу..."
            className="pl-10 bg-background/50 border-white/10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-background/50 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">Оқушы</TableHead>
              <TableHead className="font-bold">Тест атауы</TableHead>
              <TableHead className="font-bold text-center">Балл</TableHead>
              <TableHead className="font-bold text-right">Күні</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAttempts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                  Мәліметтер табылмады
                </TableCell>
              </TableRow>
            ) : (
              filteredAttempts.map((attempt) => (
                <TableRow key={attempt.id} className="hover:bg-white/5 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      {attempt.profiles?.first_name} {attempt.profiles?.last_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      {attempt.ubt_tests?.title}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1 font-bold">
                      <Award className="h-4 w-4 text-yellow-500" />
                      {attempt.score} / {attempt.total_questions}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(attempt.completed_at).toLocaleDateString('kk-KZ')}
                    </div>
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

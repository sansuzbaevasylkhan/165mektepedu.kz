"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Save, ArrowLeft, HelpCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Question {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  order_index: number;
}

interface Test {
  id: number;
  title: string;
  description: string;
}

export default function AdminTestPage() {
  const { id } = useParams();
  const router = useRouter();
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [isQuestionOpen, setIsQuestionOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_option: "A",
    order_index: 1,
  });

  useEffect(() => {
    fetchTestData();
  }, [id]);

  async function fetchTestData() {
    setLoading(true);
    try {
      const { data: testData, error: testError } = await supabase
        .from("ubt_tests")
        .select("*")
        .eq("id", id)
        .single();

      if (testError) throw testError;
      setTest(testData);

      const { data: questionsData, error: qError } = await supabase
        .from("ubt_questions")
        .select("*")
        .eq("test_id", id)
        .order("order_index", { ascending: true });

      if (qError) throw qError;
      setQuestions(questionsData || []);
    } catch (err) {
      console.error("Error loading test data:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("ubt_questions").insert([
        {
          ...newQuestion,
          test_id: id,
        },
      ]);
      if (error) throw error;
      setNewQuestion({
        question_text: "",
        option_a: "",
        option_b: "",
        option_c: "",
        option_d: "",
        correct_option: "A",
        order_index: questions.length + 1,
      });
      setIsQuestionOpen(false);
      await fetchTestData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteQuestion = async (qId: number) => {
    if (!confirm("Сұрақты өшіруге сенімдісіз бе?")) return;
    try {
      const { error } = await supabase.from("ubt_questions").delete().eq("id", qId);
      if (error) throw error;
      await fetchTestData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Жүктелуде...</div>;
  if (!test) return <div className="flex items-center justify-center min-h-screen">Тест табылмады</div>;

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="text-primary">
            <ArrowLeft className="h-4 w-4 mr-2" /> Кері
          </Button>
          <div>
            <h1 className="text-3xl font-black tracking-tight">{test.title}</h1>
            <p className="text-muted-foreground">{test.description}</p>
          </div>
        </div>
        <Dialog open={isQuestionOpen} onOpenChange={setIsQuestionOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-black font-bold gap-2">
              <Plus className="h-4 w-4" /> Сұрақ қосу
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-background border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Жаңа сұрақ қосу</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddQuestion} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Сұрақ мәтіні</label>
                <Textarea
                  required
                  value={newQuestion.question_text}
                  onChange={(e) => setNewQuestion({...newQuestion, question_text: e.target.value})}
                  placeholder="Сұрақты жазыңыз..."
                />
              </div>
              <div className="grid grid-cols-1 gap-3">
                {['a', 'b', 'c', 'd'].map((opt) => (
                  <div key={opt} className="flex gap-2 items-center">
                    <span className="font-bold uppercase w-4">{opt}</span>
                    <Input
                      required
                      value={(newQuestion as any)[`option_${opt}`]}
                      onChange={(e) => setNewQuestion({...newQuestion, [`option_${opt}`]: e.target.value})}
                      placeholder={`Нұсқа ${opt.toUpperCase()}`}
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Дұрыс жауап</label>
                <select
                  className="w-full p-3 rounded-xl border bg-background"
                  value={newQuestion.correct_option}
                  onChange={(e) => setNewQuestion({...newQuestion, correct_option: e.target.value})}
                >
                  <option value="A">A нұсқасы</option>
                  <option value="B">B нұсқасы</option>
                  <option value="C">C нұсқасы</option>
                  <option value="D">D нұсқасы</option>
                </select>
              </div>
              <Button type="submit" className="w-full bg-primary text-black font-bold">Сұрақты сақтау</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-3xl border border-white/10 bg-background/50 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">№</TableHead>
              <TableHead className="font-bold">Сұрақ</TableHead>
              <TableHead className="font-bold text-center">Дұрыс жауабы</TableHead>
              <TableHead className="font-bold text-right">Әрекет</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">Сұрақтар әлі қосылмады</TableCell>
              </TableRow>
            ) : (
              questions.map((q, idx) => (
                <TableRow key={q.id} className="hover:bg-white/5 transition-colors">
                  <TableCell className="font-bold text-primary">{idx + 1}</TableCell>
                  <TableCell className="max-w-md truncate">{q.question_text}</TableCell>
                  <TableCell className="text-center font-bold text-green-500">{q.correct_option}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(q.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

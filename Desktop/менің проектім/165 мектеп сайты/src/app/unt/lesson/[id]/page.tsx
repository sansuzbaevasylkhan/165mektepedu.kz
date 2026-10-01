"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ChevronLeft, CheckCircle, Lock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function LessonPage() {
  const { id } = useParams();
  const [lesson, setLesson] = useState<any>(null);
  const [test, setTest] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testAnswers, setTestAnswers] = useState<Record<string, string>>({});
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    async function loadLesson() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          window.location.href = "/login";
          return;
        }
        setUser(authUser);

        const { data: lessonData } = await supabase.from("lessons").select("*").eq("id", id).single();
        setLesson(lessonData);

        const { data: testData } = await supabase.from("tests").select("*").eq("lesson_id", id);
        setTest(testData);

        const { data: progressData } = await supabase
          .from("progress")
          .select("*")
          .eq("user_id", authUser.id)
          .eq("lesson_id", id)
          .single();

        setProgress(progressData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadLesson();
  }, [id]);

  const handleVideoComplete = async () => {
    if (!user || !lesson) return;
    await supabase.from("progress").upsert({
      user_id: user.id,
      lesson_id: lesson.id,
      video_completed: true,
    });
    setProgress(prev => ({ ...prev, video_completed: true }));
  };

  const submitTest = async () => {
    if (!test) return;
    let correctCount = 0;
    test.forEach((q: any) => {
      if (testAnswers[q.id] === q.correct_answer) correctCount++;
    });

    const finalScore = Math.round((correctCount / test.length) * 100);
    setScore(finalScore);
    setTestSubmitted(true);

    if (user && lesson) {
      await supabase.from("progress").upsert({
        user_id: user.id,
        lesson_id: lesson.id,
        test_completed: true,
        test_score: finalScore,
      });
      setProgress(prev => ({ ...prev, test_completed: true, test_score: finalScore }));
    }
  };

  if (loading) return <div className="container mx-auto px-4 py-20 text-center">Жүктелуде...</div>;
  if (!lesson) return <div className="container mx-auto px-4 py-20 text-center">Сабақ табылмады.</div>;

  return (
    <div className="container mx-auto px-4 py-20">
      <Link
        href="/unt"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" /> Сабақтар тізіміне қайту
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Video Section */}
        <div className="lg:col-span-2 space-y-8">
          <h1 className="text-4xl font-extrabold">{lesson.title}</h1>
          <div className="aspect-video w-full rounded-3xl overflow-hidden bg-black shadow-2xl">
            <iframe
              src={lesson.video_url}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoadedData={handleVideoComplete} // Simplified: real video players need API events
            />
          </div>
          <div className="p-6 rounded-3xl border bg-background">
            <h3 className="text-xl font-bold mb-4">Сабақ сипаттамасы</h3>
            <p className="text-muted-foreground leading-relaxed">{lesson.description}</p>
          </div>
        </div>

        {/* Test Section */}
        <div className="space-y-8">
          <div className="p-6 rounded-3xl border bg-background shadow-sm">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-primary" /> Тест
            </h3>

            {!test || test.length === 0 ? (
              <p className="text-muted-foreground">Бұл сабаққа тест қосылмаған.</p>
            ) : testSubmitted ? (
              <div className="text-center space-y-4">
                <div className="text-5xl font-extrabold text-primary">{score}%</div>
                <p className="text-muted-foreground font-medium">Тест аяқталды!</p>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${score}%` }} />
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {test.map((q: any, idx: number) => (
                  <div key={q.id} className="space-y-4">
                    <p className="font-semibold">{idx + 1}. {q.question}</p>
                    <div className="grid gap-2">
                      {q.options.map((opt: string, oIdx: number) => (
                        <button
                          key={oIdx}
                          onClick={() => setTestAnswers({ ...testAnswers, [q.id]: opt })}
                          className={cn(
                            "w-full text-left p-3 rounded-xl border transition-all text-sm",
                            testAnswers[q.id] === opt ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  onClick={submitTest}
                  disabled={Object.keys(testAnswers).length < test.length}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 disabled:opacity-50"
                >
                  Нәтижені тексеру
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

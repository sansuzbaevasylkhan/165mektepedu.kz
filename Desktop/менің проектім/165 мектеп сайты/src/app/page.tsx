"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  {
    title: "БІЛІМ",
    description: "Сапалы білім және жаңа мүмкіндік.",
    color: "from-[#D4AF37] to-[#B8860B]",
    icon: "🎓"
  },
  {
    title: "ҰБТ",
    description: "ҰБТ-ға жүйелі дайындық.",
    color: "from-[#D4AF37] to-[#B8860B]",
    icon: "🎯"
  },
  {
    title: "ЖЕТІСТІК",
    description: "Оқушылардың жетістіктері.",
    color: "from-[#D4AF37] to-[#B8860B]",
    icon: "🏆"
  },
  {
    title: "МЕКТЕП",
    description: "Мектеп өмірі мен жаңалықтары.",
    color: "from-[#D4AF37] to-[#B8860B]",
    icon: "🏫"
  },
];

export default function HomePage() {
  const [currentCategory, setCurrentCategory] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentCategory((prev) => (prev + 1) % CATEGORIES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextCategory = () => setCurrentCategory((prev) => (prev + 1) % CATEGORIES.length);
  const prevCategory = () => setCurrentCategory((prev) => (prev - 1 + CATEGORIES.length) % CATEGORIES.length);

  return (
    <div className="flex flex-col gap-32 pb-32 bg-background text-foreground">
      {/* Hero Section - Cinematic Ultra Premium */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
        {/* Backgrounds */}
        <div className="absolute inset-0 bg-[#050505] dark:bg-black" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="container relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-primary text-xs font-bold mb-8 backdrop-blur-md animate-fade-in">
            <Sparkles className="h-3 w-3" />
            <span className="uppercase tracking-widest">Premium Education Platform</span>
          </div>

          <h1 className="mb-8 text-7xl md:text-9xl font-black tracking-tighter leading-none text-white">
            №165 <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#FFD700] via-[#D4AF37] to-[#B8860B]">МЕКТЕП</span>
          </h1>

          <p className="mb-6 text-2xl md:text-4xl font-bold text-white/90 max-w-4xl leading-tight tracking-tight">
            БІЛІМ — БОЛАШАҚҚА БАСТАР <span className="text-[#D4AF37] italic">ЖОЛ</span>
          </p>

          <p className="mb-12 max-w-2xl text-lg md:text-xl text-white/50 leading-relaxed font-light">
            Заманауи білім. Жаңа мүмкіндік. Үлкен болашақ.
          </p>

          <div className="flex flex-wrap justify-center gap-6">
            <Link
              href="/unt"
              className="group relative inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] px-10 py-5 text-lg font-bold text-black transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              ҰБТ-ҒА ДАЙЫНДАЛУ
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 backdrop-blur-md px-10 py-5 text-lg font-bold text-white transition-all hover:bg-white/10 hover:border-white/40"
            >
              МЕКТЕП ТУРАЛЫ
            </Link>
          </div>
        </div>
      </section>

      {/* Statistics Section - Premium Typography */}
      <section className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-20 border-y border-white/10">
          {[
            { label: "Оқушы", value: "1000+" },
            { label: "Сабақ", value: "50+" },
            { label: "Тест", value: "100+" },
            { label: "Даму", value: "100%" },
          ].map((stat, i) => (
            <div key={i} className="text-center group">
              <div className="text-5xl md:text-7xl font-black text-white mb-2 group-hover:text-[#D4AF37] transition-colors">
                {stat.value}
              </div>
              <div className="text-sm uppercase tracking-widest text-white/40 font-bold">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Section - Luxury Interactive Cards */}
      <section className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-black/40 backdrop-blur-2xl p-8 md:p-20 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-6">
            <div className="text-left">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white">БАҒЫТТАРЫМЫЗ</h2>
              <p className="text-white/40 mt-2 font-medium">Біздің білім беру жүйесінің негізгі тіректері</p>
            </div>
            <div className="flex gap-3">
              <button onClick={prevCategory} className="h-14 w-14 rounded-full border border-white/10 bg-white/5 flex items-center justify-center transition-all hover:bg-[#D4AF37] hover:text-black shadow-sm">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button onClick={nextCategory} className="h-14 w-14 rounded-full border border-white/10 bg-white/5 flex items-center justify-center transition-all hover:bg-[#D4AF37] hover:text-black shadow-sm">
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="relative h-[400px] md:h-[500px] flex items-center justify-center">
            {CATEGORIES.map((cat, idx) => (
              <div
                key={idx}
                className={cn(
                  "absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-1000 ease-in-out",
                  idx === currentCategory
                    ? "opacity-100 scale-100 translate-x-0 z-10"
                    : "opacity-0 scale-90 translate-x-12 pointer-events-none z-0"
                )}
              >
                <div className={cn(
                  "mb-8 h-32 w-32 rounded-[2.5rem] shadow-2xl flex items-center justify-center text-6xl transition-transform hover:rotate-12",
                  `bg-gradient-to-br ${cat.color} text-white`
                )}>
                  {cat.icon}
                </div>
                <h3 className="mb-6 text-5xl md:text-7xl font-black tracking-tighter text-white">{cat.title}</h3>
                <p className="max-w-xl text-xl md:text-2xl text-white/60 leading-relaxed font-medium">
                  {cat.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-16 flex justify-center gap-3">
            {CATEGORIES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentCategory(idx)}
                className={cn(
                  "h-2 rounded-full transition-all duration-500",
                  idx === currentCategory ? "w-12 bg-[#D4AF37]" : "w-2 bg-white/20 hover:bg-white/40"
                )}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

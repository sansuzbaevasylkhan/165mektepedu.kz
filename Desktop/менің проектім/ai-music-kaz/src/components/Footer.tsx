import Link from 'next/link';
import { Music } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-glass-border bg-graphite py-12">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center text-center gap-6">
        <div className="flex items-center gap-2">
          <Music className="w-6 h-6 text-platinum" />
          <span className="text-lg font-bold tracking-tighter text-gradient">
            AI MUSIC KAZ
          </span>
        </div>
        <p className="text-slate-500 max-w-md">
          Қазақ музыкасының заманауи, premium деңгейдегі платформасы.
          Музыканы онлайн тыңдаңыз және жүктеп алыңыз.
        </p>
        <div className="text-sm text-slate-600">
          © {new Date().getFullYear()} AI MUSIC KAZ. Барлық құқықтар қорғалған.
        </div>
      </div>
    </footer>
  );
}

import Link from "next/link";
import { Film, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-white/5 bg-background">
      <div className="container mx-auto px-4 md:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary-500 to-pink-500 flex items-center justify-center">
                <Film className="h-5 w-5 text-white" />
              </div>
              <span className="font-display font-bold text-white text-lg">
                Mansur Drama
              </span>
            </Link>
            <p className="text-sm text-white/50 max-w-xs">
              Жоғары сапалы қысқа дорамаларды онлайн көру үшін ең жақсы платформа.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Навигация</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-white/60 hover:text-white transition-colors">
                  Басты бет
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-white/60 hover:text-white transition-colors">
                  Іздеу
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="text-white/60 hover:text-white transition-colors">
                  Админ панель
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Байланыс</h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li>support@mansurdrama.kz</li>
              <li>Қазақстан</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <p>© {new Date().getFullYear()} Mansur Drama. Барлық құқықтар қорғалған.</p>
          <p className="flex items-center gap-1.5">
            <Heart className="h-3 w-3 text-rose-400 fill-rose-400" /> жасалған Қазақстанда
          </p>
        </div>
      </div>
    </footer>
  );
}

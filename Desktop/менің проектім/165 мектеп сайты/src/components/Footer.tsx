import Link from "next/link";
import { Camera, Play, MessageCircle, Send } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#050505] text-white">
      <div className="container mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* Brand Section */}
          <div className="flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full gold-gradient text-black font-black text-lg">
                165
              </div>
              <span className="text-2xl font-black tracking-tighter uppercase">№165 МЕКТЕП</span>
            </Link>
            <p className="text-sm text-white/50 leading-relaxed max-w-xs">
              Білім — болашаққа бастар жол. Оқушылардың сапалы білім алып, өз қабілеттерін дамытуына арналған заманауи мектеп платформасы.
            </p>
          </div>

          {/* Contact & Socials */}
          <div className="flex flex-col gap-6 md:items-end">
            <h3 className="text-lg font-bold uppercase tracking-widest text-primary">Байланыс</h3>
            <div className="text-sm text-white/50 space-y-3 md:text-right">
              <p className="flex items-center md:justify-end gap-2">Телефон: +7 (7xx) xxx-xx-xx</p>
              <p className="flex items-center md:justify-end gap-2">Email: info@165mektep.edu.kz</p>
              <p className="flex items-center md:justify-end gap-2">Мекенжайы: Қазақстан, Алматы қ.</p>
            </div>
            <div className="flex gap-4 mt-4 md:justify-end">
              {["Instagram", "TikTok", "YouTube", "Telegram", "WhatsApp"].map((soc) => (
                <a
                  key={soc}
                  href="#"
                  className="h-10 w-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white/50 hover:text-primary hover:border-primary transition-all hover:scale-110"
                >
                  <span className="text-[10px] font-bold">{soc[0]}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 mt-20 pt-8 text-center text-xs text-white/30 tracking-widest uppercase space-y-2">
          <p>© {new Date().getFullYear()} №165 МЕКТЕП. Барлық құқықтар қорғалған.</p>
          <div className="flex justify-center gap-4">
            <Link href="/privacy" className="hover:text-primary transition-colors underline underline-offset-4">
              Әкімшілік және құпиялылық саясаты
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

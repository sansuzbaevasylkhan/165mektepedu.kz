import Link from "next/link";
import { Camera, Play, Twitter, MessageCircle, Send } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                165
              </div>
              <span className="text-lg font-bold">№165 МЕКТЕП</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Білім — болашаққа бастар жол. Оқушылардың сапалы білім алып, өз қабілеттерін дамытуына арналған заманауи мектеп платформасы.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold">Меню</h3>
            <nav className="flex flex-col gap-2">
              <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">Басты бет</Link>
              <Link href="/news" className="text-sm text-muted-foreground hover:text-primary transition-colors">Жаңалықтар</Link>
              <Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">Мектеп туралы</Link>
              <Link href="/unt" className="text-sm text-muted-foreground hover:text-primary transition-colors">ҰБТ</Link>
              <Link href="/register" className="text-sm text-muted-foreground hover:text-primary transition-colors">Тіркелу</Link>
              <Link href="/login" className="text-sm text-muted-foreground hover://text-primary transition-colors">Логин</Link>
            </nav>
          </div>

          {/* Contact & Socials */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold">Байланыс</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Телефон: +7 (7xx) xxx-xx-xx</p>
              <p>Email: info@165mektep.edu.kz</p>
              <p>Мекенжайы: Қазақстан, Алматы қ.</p>
            </div>
            <div className="flex gap-4 mt-2">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Camera className="h-5 w-5" /></a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Play className="h-5 w-5" /></a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><MessageCircle className="h-5 w-5" /></a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Send className="h-5 w-5" /></a>
            </div>
          </div>
        </div>

        <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} №165 Мектеп. Барлық құқықтар қорғалған.
        </div>
      </div>
    </footer>
  );
}

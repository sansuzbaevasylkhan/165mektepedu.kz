"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Moon, Sun, Menu, X, User } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

const navLinks = [
  { name: "Басты бет", href: "/" },
  { name: "Жаңалықтар", href: "/news" },
  { name: "Мектеп туралы", href: "/about" },
  { name: "Сабақ кестесі", href: "/timetable" },
  { name: "ҰБТ", href: "/unt" },
];

export default function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    checkUser();
  }, []);

  if (!mounted) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md transition-all">
      <div className="container mx-auto flex h-20 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="flex h-12 w-12 items-center justify-center rounded-full gold-gradient text-black font-black text-xl shadow-lg">
            165
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase">№165 МЕКТЕП</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-bold uppercase tracking-widest transition-colors hover:text-primary"
            >
              {link.name}
            </Link>
          ))}

          {user ? (
            <Link
              href="/profile"
              className="text-sm font-bold uppercase tracking-widest transition-colors hover:text-primary flex items-center gap-2"
            >
              <User className="h-4 w-4" /> Профиль
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="text-sm font-bold uppercase tracking-widest transition-colors hover:text-primary"
              >
                Тіркелу
              </Link>
              <Link
                href="/login"
                className="text-sm font-bold uppercase tracking-widest transition-colors hover:text-primary"
              >
                Логин
              </Link>
            </>
          )}

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full p-2 transition-colors hover:bg-primary/10"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-5 w-5 text-primary" /> : <Moon className="h-5 w-5 text-primary" />}
          </button>
        </nav>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full p-2 transition-colors hover:bg-primary/10"
          >
            {theme === "dark" ? <Sun className="h-5 w-5 text-primary" /> : <Moon className="h-5 w-5 text-primary" />}
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative h-10 w-10 flex items-center justify-center rounded-lg transition-colors hover:bg-primary/10 focus:outline-none"
          >
            <div className="relative w-6 h-5">
              {/* Top Line */}
              <span className={cn(
                "absolute block h-0.5 w-6 bg-current transition-all duration-300 ease-out rounded-full",
                isOpen ? "top-2 rotate-45" : "top-0"
              )} />
              {/* Middle Line */}
              <span className={cn(
                "absolute block h-0.5 w-6 bg-current transition-all duration-300 ease-out rounded-full",
                isOpen ? "opacity-0" : "top-2"
              )} />
              {/* Bottom Line */}
              <span className={cn(
                "absolute block h-0.5 w-6 bg-current transition-all duration-300 ease-out rounded-full",
                isOpen ? "top-2 -rotate-45" : "top-4"
              )} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={cn(
        "md:hidden absolute top-20 left-0 w-full border-t bg-background/95 backdrop-blur-xl transition-all duration-500 ease-in-out z-50 overflow-hidden",
        isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
      )}>
        <nav className="flex flex-col p-6 gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="text-lg font-bold uppercase tracking-widest transition-colors hover:text-primary"
            >
              {link.name}
            </Link>
          ))}

          {user ? (
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="text-lg font-bold uppercase tracking-widest transition-colors hover:text-primary flex items-center gap-3 p-2 rounded-xl bg-white/5"
            >
              <User className="h-5 w-5" /> Профиль
            </Link>
          ) : (
            <div className="flex flex-col gap-4 pt-4 border-t border-white/10">
              <Link
                href="/register"
                onClick={() => setIsOpen(false)}
                className="text-lg font-bold uppercase tracking-widest transition-colors hover:text-primary"
              >
                Тіркелу
              </Link>
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="text-lg font-bold uppercase tracking-widest transition-colors hover:text-primary"
              >
                Логин
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

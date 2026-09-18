"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Search, Film, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setMobileOpen(false);
    }
  };

  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) return null;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-white/5"
          : "bg-gradient-to-b from-background/80 to-transparent"
      )}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative h-9 w-9 rounded-lg bg-gradient-to-br from-primary-500 to-pink-500 flex items-center justify-center">
                <Film className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <p className="font-display font-bold text-white text-lg leading-none">
                Mansur Drama
              </p>
              <p className="text-[10px] text-white/50 tracking-wider uppercase leading-none mt-0.5">
                Premium Streaming
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Басты бет
            </Link>
            <Link
              href="/search"
              className="text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Іздеу
            </Link>
          </nav>

          {/* Search (desktop) */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 focus-within:border-primary-500/50 focus-within:bg-white/10 transition-all w-64"
          >
            <Search className="h-4 w-4 text-white/50" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Дорама іздеу..."
              className="bg-transparent border-0 outline-none text-sm text-white placeholder:text-white/40 flex-1"
            />
          </form>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 text-white"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/5 bg-background/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4 space-y-3">
              <form
                onSubmit={handleSearch}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus-within:border-primary-500/50"
              >
                <Search className="h-4 w-4 text-white/50" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Дорама іздеу..."
                  className="bg-transparent border-0 outline-none text-sm text-white placeholder:text-white/40 flex-1"
                />
              </form>
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 rounded-xl hover:bg-white/5 text-white/80 font-medium"
              >
                Басты бет
              </Link>
              <Link
                href="/search"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 rounded-xl hover:bg-white/5 text-white/80 font-medium"
              >
                Іздеу
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

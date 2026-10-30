"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function GlobalLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // /admin-auth немесе /admin- немен басталатын беттерде Navbar және Footer көрсетілмейді
  const isAdminPage = pathname.startsWith("/admin");

  return (
    <div className="flex flex-col min-h-screen">
      {!isAdminPage && <Header />}
      <main className="flex-1 bg-background">
        {children}
      </main>
      {!isAdminPage && <Footer />}
    </div>
  );
}

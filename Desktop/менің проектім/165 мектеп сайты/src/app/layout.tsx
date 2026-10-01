import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SecurityGuard from "@/components/SecurityGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "№165 Мектеп — Білім және ҰБТ дайындығы",
  description: "№165 мектептің ресми білім беру платформасы. Мектеп жаңалықтары, мектеп туралы ақпарат және ҰБТ-ға дайындық материалдары.",
  openGraph: {
    title: "№165 Мектеп — Білім және ҰБТ дайындығы",
    description: "№165 мектептің ресми білім беру платформасы.",
    url: "https://165mektep.edu.kz",
    siteName: "№165 Мектеп",
    locale: "kk_KZ",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="kk"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col select-none">
        <Providers>
          <div className="flex flex-col min-h-screen">
            <SecurityGuard />
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}

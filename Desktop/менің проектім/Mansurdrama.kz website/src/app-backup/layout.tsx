import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/Toaster";
import { Providers } from "@/components/Providers";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Mansur Drama";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} - Premium Short Drama Streaming`,
    template: `%s | ${siteName}`,
  },
  description:
    "Жоғары сапалы қысқа дорамаларды онлайн көру. Premium short drama streaming platform with thousands of episodes.",
  keywords: [
    "short drama",
    "қысқа дорама",
    "drama streaming",
    "online drama",
    "Mansur Drama",
    "қазақша дорама",
  ],
  authors: [{ name: "Mansur Drama" }],
  creator: "Mansur Drama",
  openGraph: {
    type: "website",
    locale: "kk_KZ",
    url: siteUrl,
    siteName,
    title: `${siteName} - Premium Short Drama Streaming`,
    description:
      "Жоғары сапалы қысқа дорамаларды онлайн көру. Premium short drama streaming platform.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} - Premium Short Drama Streaming`,
    description: "Premium short drama streaming platform.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="kk" className="dark">
      <body
        className={`${inter.variable} ${poppins.variable} font-sans bg-background text-foreground min-h-screen`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

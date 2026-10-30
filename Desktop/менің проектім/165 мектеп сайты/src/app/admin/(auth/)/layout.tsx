"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}

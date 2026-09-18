"use client";

import { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/ToastContext";

export function Providers({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}

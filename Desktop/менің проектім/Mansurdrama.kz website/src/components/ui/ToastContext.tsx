"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  title?: string;
  description?: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  toast: (opts: Omit<Toast, "id">) => void;
  success: (description: string, title?: string) => void;
  error: (description: string, title?: string) => void;
  info: (description: string, title?: string) => void;
  warning: (description: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const iconMap: Record<ToastType, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const colorMap: Record<ToastType, string> = {
  success: "border-emerald-500/30 bg-emerald-500/10",
  error: "border-rose-500/30 bg-rose-500/10",
  info: "border-sky-500/30 bg-sky-500/10",
  warning: "border-amber-500/30 bg-amber-500/10",
};

const iconColor: Record<ToastType, string> = {
  success: "text-emerald-400",
  error: "text-rose-400",
  info: "text-sky-400",
  warning: "text-amber-400",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (opts: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).slice(2);
      const newToast: Toast = { id, duration: 4000, ...opts };
      setToasts((prev) => [...prev, newToast]);
      const timeout = setTimeout(() => remove(id), newToast.duration);
      return () => clearTimeout(timeout);
    },
    [remove]
  );

  const value: ToastContextValue = {
    toast,
    success: (description, title) => toast({ type: "success", description, title }),
    error: (description, title) => toast({ type: "error", description, title }),
    info: (description, title) => toast({ type: "info", description, title }),
    warning: (description, title) => toast({ type: "warning", description, title }),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = iconMap[t.type];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 100, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={cn(
                  "pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl",
                  colorMap[t.type]
                )}
              >
                <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", iconColor[t.type])} />
                <div className="flex-1 min-w-0">
                  {t.title && <p className="font-semibold text-white text-sm">{t.title}</p>}
                  {t.description && (
                    <p className="text-sm text-white/80 mt-0.5">{t.description}</p>
                  )}
                </div>
                <button
                  onClick={() => remove(t.id)}
                  className="text-white/40 hover:text-white transition-colors flex-shrink-0"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

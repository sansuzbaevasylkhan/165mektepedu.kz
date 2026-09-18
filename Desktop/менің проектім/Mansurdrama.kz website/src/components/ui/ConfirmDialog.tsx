"use client";

import { ReactNode, useState } from "react";
import { Modal } from "./Modal";
import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  loading?: boolean;
  children?: ReactNode;
}

const variantStyles = {
  danger: "bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600",
  warning: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600",
  info: "bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600",
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Растау",
  description = "Бұл әрекетті орындағыңыз келе ме?",
  confirmText = "Иә",
  cancelText = "Жоқ",
  variant = "danger",
  loading = false,
  children,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false);

  const handleConfirm = async () => {
    try {
      setPending(true);
      await onConfirm();
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className={cn(
            "mx-auto h-14 w-14 rounded-full flex items-center justify-center mb-4",
            variant === "danger" && "bg-rose-500/10",
            variant === "warning" && "bg-amber-500/10",
            variant === "info" && "bg-sky-500/10"
          )}
        >
          <AlertTriangle
            className={cn(
              "h-7 w-7",
              variant === "danger" && "text-rose-400",
              variant === "warning" && "text-amber-400",
              variant === "info" && "text-sky-400"
            )}
          />
        </motion.div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-white/60 mb-6">{description}</p>
        {children}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={pending || loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={pending || loading}
            className={cn(
              "flex-1 px-4 py-2.5 rounded-xl text-white font-semibold transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50",
              variantStyles[variant]
            )}
          >
            {pending || loading ? "Күтуде..." : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}

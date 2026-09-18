"use client";

import { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
  tabsClassName?: string;
  onChange?: (id: string) => void;
}

export function Tabs({ tabs, defaultTab, className, tabsClassName, onChange }: TabsProps) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id);

  const handleChange = (id: string) => {
    setActive(id);
    onChange?.(id);
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "flex items-center gap-2 p-1 rounded-2xl bg-white/5 border border-white/10 mb-6 w-fit",
          tabsClassName
        )}
      >
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleChange(tab.id)}
              className={cn(
                "relative px-5 py-2.5 text-sm font-medium rounded-xl transition-colors flex items-center gap-2",
                isActive ? "text-white" : "text-white/60 hover:text-white/80"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="tab-bg"
                  className="absolute inset-0 bg-gradient-to-r from-primary-500 to-pink-500 rounded-xl shadow-lg shadow-primary-500/30"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {tab.icon}
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      <AnimatePresence mode="wait">
        {tabs.map((tab) =>
          active === tab.id ? (
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {tab.content}
            </motion.div>
          ) : null
        )}
      </AnimatePresence>
    </div>
  );
}

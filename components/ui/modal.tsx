"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/app/lib/cn";
import { IconButton } from "@/components/ui/icon-button";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  panelClassName?: string;
};

export function Modal({ open, onClose, title, children, className, panelClassName }: Props) {
  if (!open) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md",
        className
      )}
      onClick={onClose}
      role="presentation"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className={cn(
          "elevated-popover relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-surface-elevated/85 shadow-2xl backdrop-blur-2xl",
          panelClassName
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 backdrop-blur-md">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
            <IconButton label="Close" onClick={onClose} className="text-muted">
              <X className="size-4" strokeWidth={1.5} />
            </IconButton>
          </div>
        )}
        {children}
      </motion.div>
    </motion.div>
  );
}

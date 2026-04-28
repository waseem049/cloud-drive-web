"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/app/lib/cn";

type Props = HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
  children?: ReactNode;
};

export function Card({
  className,
  interactive,
  children,
  onMouseMove,
  onMouseLeave,
  ...props
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      onMouseMove?.(e);
      if (!interactive || !ref.current) return;
      const r = ref.current.getBoundingClientRect();
      ref.current.style.setProperty("--mouse-x", `${e.clientX - r.left}px`);
      ref.current.style.setProperty("--mouse-y", `${e.clientY - r.top}px`);
    },
    [interactive, onMouseMove]
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      onMouseLeave?.(e);
      if (!ref.current) return;
      ref.current.style.removeProperty("--mouse-x");
      ref.current.style.removeProperty("--mouse-y");
    },
    [onMouseLeave]
  );

  return (
    <motion.div
      layout
      initial={false}
      whileHover={interactive ? { y: -2 } : undefined}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      className={cn(
        "rounded-xl border border-border bg-surface-elevated/80 shadow-sm backdrop-blur-sm",
        interactive && [
          "transition-[box-shadow,border-color] duration-300",
          "hover:border-white/15 hover:shadow-lg hover:glow-border",
        ],
        className
      )}
    >
      <div
        ref={ref}
        className={cn(
          "relative h-full min-h-0 w-full overflow-hidden rounded-[inherit]",
          interactive && "spotlight-card cursor-pointer"
        )}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {children}
      </div>
    </motion.div>
  );
}

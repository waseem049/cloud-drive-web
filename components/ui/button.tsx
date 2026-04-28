"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/app/lib/cn";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
                    "disabled:opacity-50 disabled:pointer-events-none",
                    variant === "primary" &&
                        "bg-gradient-to-r from-[var(--primary-from)] to-[var(--primary-to)] text-primary-foreground shadow-md shadow-indigo-500/20 hover:brightness-110 hover:shadow-lg",
                    variant === "secondary" &&
                        "bg-surface border border-border text-foreground hover:bg-surface-muted",
                    variant === "ghost" && "text-muted hover:bg-surface-muted hover:text-foreground",
                    variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
                    size === "sm" && "text-xs px-3 py-1.5",
                    size === "md" && "text-sm px-4 py-2.5",
                    size === "lg" && "text-sm px-5 py-3",
                    className
                )}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

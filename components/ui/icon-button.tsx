"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/app/lib/cn";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
    label: string;
};

export const IconButton = forwardRef<HTMLButtonElement, Props>(
    ({ className, label, children, ...props }, ref) => (
        <button
            ref={ref}
            type="button"
            aria-label={label}
            title={label}
            className={cn(
                "inline-flex items-center justify-center rounded-lg p-1.5",
                "text-muted hover:bg-surface-muted hover:text-foreground transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                className
            )}
            {...props}
        >
            {children}
        </button>
    )
);
IconButton.displayName = "IconButton";

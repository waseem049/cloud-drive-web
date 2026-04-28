"use client";

import { Cloud } from "lucide-react";
import { cn } from "@/app/lib/cn";

type Props = {
    className?: string;
    compact?: boolean;
};

export function AppLogo({ className, compact }: Props) {
    return (
        <div className={cn("flex items-center gap-2.5", className)}>
            <div
                className={cn(
                    "flex items-center justify-center rounded-[10px] bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25",
                    compact ? "size-8" : "size-9"
                )}
            >
                <Cloud className={compact ? "size-4" : "size-[18px]"} strokeWidth={2.25} />
            </div>
            {!compact && (
                <span className="font-bold tracking-tight text-foreground text-lg">Cloud Drive</span>
            )}
        </div>
    );
}

"use client";

import {
    Archive,
    File,
    FileText,
    ImageIcon,
    Music,
    Presentation,
    Table2,
    Video,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/app/lib/cn";

type Props = {
    mimeType: string;
    className?: string;
    size?: number;
};

export function mimeTypeIcon(mimeType: string): LucideIcon {
    if (mimeType.startsWith("image/")) return ImageIcon;
    if (mimeType.startsWith("video/")) return Video;
    if (mimeType.startsWith("audio/")) return Music;
    if (mimeType === "application/pdf") return FileText;
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return Table2;
    if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return Presentation;
    if (mimeType.includes("word") || mimeType.includes("document")) return FileText;
    if (mimeType.includes("zip") || mimeType.includes("compressed")) return Archive;
    return File;
}

/** Lucide icon for a MIME type (dashboard / lists). */
export function MimeTypeIcon({ mimeType, className, size = 28 }: Props) {
    const Icon = mimeTypeIcon(mimeType);
    // This is a dynamic *reference* to a stable exported component from lucide-react.
    // eslint-disable-next-line react-hooks/static-components
    return <Icon className={cn("text-primary shrink-0", className)} size={size} strokeWidth={1.75} />;
}

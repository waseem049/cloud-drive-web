'use client';

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";
import { cn } from "@/app/lib/cn";

type Props = {
    onFiles: (files: File[]) => void;
    disabled?: boolean;
};

export function UploadDropzone({ onFiles, disabled }: Props) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled) return;
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) onFiles(files);
    }, [onFiles, disabled]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleClick = useCallback(() => {
        if (disabled) return;
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.onchange = (e) => {
            const files = Array.from((e.target as HTMLInputElement).files ?? []);
            if (files.length > 0) onFiles(files);
        };
        input.click();
    }, [onFiles, disabled]);

    return (
        <motion.div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleClick}
            whileHover={disabled ? undefined : { scale: 1.005 }}
            whileTap={disabled ? undefined : { scale: 0.995 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={cn(
                "glass-panel cursor-pointer select-none rounded-2xl border border-dashed p-7 text-center transition-colors",
                isDragging
                    ? "border-[var(--primary-from)]/60 bg-[var(--primary-from)]/10 glow-border"
                    : "border-white/15 hover:border-white/25 hover:bg-white/[0.04]",
                disabled && "cursor-not-allowed opacity-50"
            )}
        >
            <Upload className="mx-auto mb-2 size-9 text-primary" strokeWidth={1.5} />
            <p className="text-sm font-medium tracking-tight text-foreground">
                {isDragging ? 'Drop to upload' : 'Drop files here'}
            </p>
            <p className="mt-1 text-xs text-muted">or click to browse</p>
        </motion.div>
    );
}

export default UploadDropzone;

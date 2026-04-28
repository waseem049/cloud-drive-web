'use client';

import { useState, useEffect } from 'react';
import { Download, Loader2, Music, X } from 'lucide-react';
import { IconButton } from '@/components/ui/icon-button';
import { MimeTypeIcon } from '@/app/lib/mime-type-icon';
import { cn } from '@/app/lib/cn';

const btnPrimarySm = cn(
    'inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-1.5',
    'text-xs font-medium text-primary-foreground shadow-sm transition-colors',
    'hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2'
);

const btnPrimaryMd = cn(
    'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3',
    'text-sm font-medium text-primary-foreground shadow-sm transition-colors',
    'bg-primary hover:bg-primary-hover',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2'
);

type Props = {
    file: {
        name: string;
        mimeType: string;
        sizeBytes: number;
    };
    downloadUrl: string;
    onClose: () => void;
};

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 ** 3) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 ** 3)).toFixed(1)} GB`;
}

export function FilePreview({ file, downloadUrl, onClose }: Props) {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const isImage = file.mimeType.startsWith('image/');
    const isVideo = file.mimeType.startsWith('video/');
    const isAudio = file.mimeType.startsWith('audio/');
    const isPdf = file.mimeType === 'application/pdf';
    const isPreviewable = isImage || isVideo || isAudio || isPdf;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px]"
            onClick={onClose}
            role="presentation"
        >
            <div
                className="relative mx-4 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-2xl"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <h3 className="truncate text-sm font-medium text-foreground">{file.name}</h3>
                        <span className="shrink-0 text-xs text-muted">{formatBytes(file.sizeBytes)}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <a
                            href={downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={btnPrimarySm}
                        >
                            <Download className="size-3.5" />
                            Download
                        </a>
                        <IconButton label="Close preview" onClick={onClose}>
                            <X className="size-4" />
                        </IconButton>
                    </div>
                </div>

                <div className="relative flex min-h-[300px] flex-1 items-center justify-center overflow-auto bg-surface p-4">
                    {isImage && (
                        <>
                            {loading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="size-10 animate-spin text-primary" />
                                </div>
                            )}
                            <img
                                src={downloadUrl}
                                alt={file.name}
                                className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-sm"
                                onLoad={() => setLoading(false)}
                                onError={() => setLoading(false)}
                            />
                        </>
                    )}

                    {isVideo && (
                        <video
                            src={downloadUrl}
                            controls
                            autoPlay
                            className="max-h-[70vh] max-w-full rounded-lg shadow-sm"
                            onLoadedData={() => setLoading(false)}
                        >
                            Your browser does not support video playback.
                        </video>
                    )}

                    {isAudio && (
                        <div className="flex flex-col items-center gap-4 py-8">
                            <Music className="size-16 text-primary/80" strokeWidth={1.25} />
                            <p className="text-sm font-medium text-foreground">{file.name}</p>
                            <audio
                                src={downloadUrl}
                                controls
                                autoPlay
                                className="w-full max-w-md"
                                onLoadedData={() => setLoading(false)}
                            />
                        </div>
                    )}

                    {isPdf && (
                        <iframe
                            src={downloadUrl}
                            className="h-[70vh] w-full rounded-lg border border-border"
                            title={file.name}
                            onLoad={() => setLoading(false)}
                        />
                    )}

                    {!isPreviewable && (
                        <div className="flex flex-col items-center gap-3 py-12 text-muted">
                            <MimeTypeIcon mimeType={file.mimeType} size={56} />
                            <p className="text-sm font-medium text-foreground">Preview not available</p>
                            <p className="text-xs">{file.mimeType}</p>
                            <a
                                href={downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(btnPrimaryMd, 'mt-2')}
                            >
                                <Download className="size-4" />
                                Download file
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

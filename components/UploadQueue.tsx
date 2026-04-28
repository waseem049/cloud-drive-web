'use client';

import { motion, AnimatePresence } from 'framer-motion';

type Upload = {
    fileName: string;
    progress: number;
    status: 'uploading' | 'complete' | 'error';
    error?: string;
};

type Props = {
    uploads: Upload[];
    onClear: () => void;
};

export function UploadQueue({ uploads, onClear }: Props) {
    if (uploads.length === 0) return null;

    const allDone = uploads.every(u => u.status !== 'uploading');

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                className="elevated-popover fixed bottom-6 right-6 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/12 bg-surface-elevated/90 shadow-2xl backdrop-blur-2xl"
            >
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                    <span className="text-sm font-medium tracking-tight text-foreground">
                        Uploads ({uploads.length})
                    </span>
                    {allDone && (
                        <button
                            type="button"
                            onClick={onClear}
                            className="text-xs text-muted transition-colors hover:text-foreground"
                        >
                            Clear
                        </button>
                    )}
                </div>

                <div className="max-h-60 overflow-y-auto">
                    {uploads.map((u, i) => (
                        <div key={`${u.fileName}-${i}`} className="border-b border-white/5 px-4 py-3 last:border-0">
                            <div className="mb-1.5 flex items-center justify-between gap-2">
                                <span className="max-w-[12rem] truncate text-xs text-foreground">
                                    {u.fileName}
                                </span>
                                <span className="shrink-0 text-xs">
                                    {u.status === 'complete' && (
                                        <span className="text-emerald-400">Complete</span>
                                    )}
                                    {u.status === 'error' && (
                                        <span className="text-red-400">Error</span>
                                    )}
                                    {u.status === 'uploading' && (
                                        <span className="text-primary">{u.progress}%</span>
                                    )}
                                </span>
                            </div>

                            <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
                                {u.status === 'uploading' ? (
                                    <motion.div
                                        className="upload-progress-shimmer h-full rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${u.progress}%` }}
                                        transition={{ type: "spring", stiffness: 120, damping: 18 }}
                                    />
                                ) : (
                                    <div
                                        className={`h-full rounded-full transition-all duration-300 ${
                                            u.status === 'complete' ? 'bg-emerald-500' :
                                            u.status === 'error' ? 'bg-red-500' :
                                            'bg-primary'
                                        }`}
                                        style={{ width: `${u.progress}%` }}
                                    />
                                )}
                            </div>

                            {u.status === 'error' && u.error && (
                                <p className="mt-1 text-xs text-red-400/90">{u.error}</p>
                            )}
                        </div>
                    ))}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

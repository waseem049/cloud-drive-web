'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { filesApi, DriveFile } from "@/app/lib/files";
import { starsApi } from "@/app/lib/stars";
import { MimeTypeIcon } from "@/app/lib/mime-type-icon";
import { IconButton } from "@/components/ui/icon-button";
import { Card } from "@/components/ui/card";
import { useMemo } from "react";

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(isoString: string) {
    return new Date(isoString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: '2-digit',
    });
}

type Props = {
    folderId?: string | null;
}

export function FileGrid({ folderId }: Props) {
    const queryClient = useQueryClient();
    const {data: files, isLoading, error} = useQuery({
        queryKey: ['files', folderId ?? null],
        queryFn: () => filesApi.list(folderId),
    });

    const { data: starsData } = useQuery({
        queryKey: ['stars'],
        queryFn: starsApi.list,
    });

    const starredSet = useMemo(() => {
        const s = new Set<string>();
        starsData?.files.forEach((f) => s.add(f.id));
        return s;
    }, [starsData]);

    const toggleStar = useMutation({
        mutationFn: async (p: { id: string; starred: boolean }) => {
            if (p.starred) await starsApi.unstar('file', p.id);
            else await starsApi.star('file', p.id);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stars'] }),
    });

    const handleDownload = async (file: DriveFile) => {
        try {
            const signedUrl = await filesApi.getSignedUrl(file.id);
            window.open(signedUrl, '_blank');
        } catch (error) {
            alert('Error downloading file:' + (error as Error).message);
        }
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded-xl bg-surface-muted" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-12 text-center text-sm text-red-600">
                Failed to load files. Please refresh the page.
            </div>
        );
    }

    if (!files || files.length === 0) {
        return (
            <div className="flex flex-col items-center py-20 text-muted">
                <p className="font-medium text-foreground">No files yet</p>
                <p className="mt-1 text-sm">Drop files above to upload</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {files.map((file) => {
                const isStarred = starredSet.has(file.id);
                return (
                <div key={file.id} className="group relative">
                <Card
                    interactive
                    className="flex w-full flex-col items-center p-5 text-left"
                    onClick={() => handleDownload(file)}
                >
                    <IconButton
                        label={isStarred ? 'Remove star' : 'Star'}
                        className={`absolute left-2 top-2 z-10 ${isStarred ? 'text-amber-500' : 'text-muted opacity-0 group-hover:opacity-100'}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleStar.mutate({ id: file.id, starred: isStarred });
                        }}
                    >
                        <Star className={`size-4 ${isStarred ? 'fill-amber-400' : ''}`} strokeWidth={1.75} />
                    </IconButton>
                    <div className="mb-3">
                        <MimeTypeIcon mimeType={file.mime_type} size={40} />
                    </div>
                    <span className="mb-1.5 line-clamp-2 w-full text-center text-sm font-semibold text-foreground">
                        {file.name}
                    </span>
                    <span className="text-xs font-medium text-muted">
                        {formatBytes(file.size_bytes)}
                    </span>
                    <span className="mt-1 text-xs text-muted/80">
                        {formatDate(file.created_at)}
                    </span>
                </Card>
                </div>
            );})}
        </div>
    );
}

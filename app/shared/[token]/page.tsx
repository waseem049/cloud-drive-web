'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Download, Loader2, Lock } from 'lucide-react';
import { shareApi, SharedFile } from '@/app/lib/share';
import { AppLogo } from '@/components/AppLogo';
import { MimeTypeIcon } from '@/app/lib/mime-type-icon';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 ** 3) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 ** 3)).toFixed(1)} GB`;
}

export default function SharedFilePage() {
    const params = useParams();
    const token = params.token as string;
    const [data, setData] = useState<SharedFile | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        shareApi.access(token)
            .then(setData)
            .catch((err) => {
                const msg = err.response?.data?.message || 'This link is invalid or has expired.';
                setError(msg);
            })
            .finally(() => setLoading(false));
    }, [token]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="size-10 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <Card className="w-full max-w-sm p-8 text-center">
                    <Lock className="mx-auto mb-4 size-12 text-muted" strokeWidth={1.25} />
                    <h1 className="mb-2 text-lg font-semibold text-foreground">Link unavailable</h1>
                    <p className="text-sm text-muted">{error || 'This share link is invalid.'}</p>
                </Card>
            </div>
        );
    }

    const handleDownload = () => {
        window.open(data.downloadUrl, '_blank');
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-sm p-8">
                <div className="mb-6 flex justify-center">
                    <AppLogo />
                </div>

                <div className="mb-6 flex flex-col items-center">
                    <MimeTypeIcon mimeType={data.file.mimeType} size={48} className="mb-3" />
                    <h1 className="mb-1 text-center text-base font-semibold text-foreground">
                        {data.file.name}
                    </h1>
                    <p className="text-sm text-muted">{formatBytes(data.file.sizeBytes)}</p>
                </div>

                <Button type="button" className="w-full gap-2" onClick={handleDownload}>
                    <Download className="size-4" />
                    Download
                </Button>

                <p className="mt-4 text-center text-xs text-muted">Shared via Cloud Drive</p>
            </Card>
        </div>
    );
}

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { filesApi } from "@/app/lib/files";

type UploadState = {
    fileName: string;
    progress: number;
    status: 'uploading' | 'complete' | 'error';
    error?: string;
};

export function useUpload(folderId?: string | null) {
    const queryClient = useQueryClient();
    const [uploads, setUploads] = useState<UploadState[]>([]);

    const uploadFile = useCallback(async (file: File) => {
        // Add this file to the upload list
        setUploads(prev => [...prev, {
            fileName: file.name,
            progress: 0, 
            status: 'uploading',
        }]);

        const updateState = (patch: Partial<UploadState>) => {
            setUploads(prev =>
                prev.map(u =>
                    u.fileName === file.name ? { ...u, ...patch } : u
                )
            );
        };

        try {
            // Phase 1: init - get presigned URL
            const { fileId, uploadUrl } = await filesApi.init(
                file.name,
                file.type || 'application/octet-stream',
                file.size,
                folderId ?? null
            );

            // Phase 2: Upload directly to Supabase Storage 
            await filesApi.uploadDirect(uploadUrl, file, (progress) => {
                updateState({progress});
            });

            // Phase 3: tell backend it's done
            await filesApi.complete(fileId);

            updateState({status: 'complete', progress: 100});

            // Invalidate the file list so it re-fetches and shows the new file 
            queryClient.invalidateQueries({queryKey: ['files', folderId ?? null]});
        } catch (err: unknown){
            const message = err instanceof Error ? err.message : 'Upload failed';
            updateState({status: 'error', error: message});
        }
    }, [folderId, queryClient]);

    const uploadFiles = useCallback((files: File[]) => {
        // Upload all files in parallel
        files.forEach(uploadFile);
    }, [uploadFile]);

    const clearCompleted = useCallback(() => {
        setUploads(prev => prev.filter(u => u.status !== 'complete'));
    }, []);

    return { uploads, uploadFiles, clearCompleted };
}
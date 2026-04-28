import { api } from "./api";

export type DriveFile = {
    id: string;
    name: string;
    mime_type: string;
    size_bytes: number;
    folder_id: string | null;
    created_at: string;
    updated_at: string;
};

export type UploadinitResponse = {
    fileId: string;
    storageKey: string;
    uploadUrl: string;
};

export const filesApi = {
    // Step 1 - get a presigned URL from our backend
    init: async (
        name: string,
        mimeType: string,
        size: number,
        folderId: string | null
    ): Promise<UploadinitResponse> => {
        const res = await api.post('/api/files/init', {name, mimeType, size, folderId})
        return res.data;
    },

    // Step 2 - PUT directly to Supabase (NOT through our API)
    uploadDirect: async (
        uploadUrl: string,
        file: File, 
        onProgress: (percent: number) => void
    ): Promise<void> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    onProgress(Math.round((event.loaded / event.total) * 100));
                }
            });

            xhr.addEventListener('load', () => {
                if(xhr.status >= 200 && xhr.status < 300) resolve();
                else reject(new Error(`Upload failed with status ${xhr.status}`));
            });

            xhr.addEventListener('error', () => reject(new Error('Network error during upload')));

            xhr.open('PUT', uploadUrl);
            xhr.setRequestHeader('Content-Type', file.type);
            xhr.send(file);
        });
    },

    // Step 3 - tell our backend the upload is complete (so it can save metadata to DB)
    complete: async (FileId: string): Promise<DriveFile> => {
        const res = await api.post('/api/files/complete', {fileId: FileId})
        return res.data.file;
    },

    // List files in a folder
    list: async (folderId?: string | null): Promise<DriveFile[]> => {
        const params = folderId ? {folderId} : {};
        const res = await api.get('/api/files', {params});
        return res.data;
    },

    recent: async (limit?: number): Promise<DriveFile[]> => {
        const res = await api.get("/api/files/recent", {
            params: limit ? { limit } : {},
        });
        return res.data.files;
    },

    // Get a single file's metadata
    getSignedUrl: async (fileId: string): Promise<string> => {
        const res = await api.get(`/api/files/${fileId}`);
        return res.data.downloadUrl;
    },

    // Soft delete (move to trash)
    delete: async (fileId: string): Promise<void> => {
        await api.delete(`/api/files/${fileId}`);
    },

    rename: async (fileId: string, name: string): Promise<DriveFile> => {
        const res = await api.patch(`/api/files/${fileId}`, {name});
        return res.data.file;
    },

    // Move a file to a different folder.
    // Why a separate method? The PATCH endpoint accepts both `name` and `folderId`,
    // but semantically "move" and "rename" are different user actions.
    // Keeping them separate makes the calling code self-documenting.
    move: async (fileId: string, targetFolderId: string | null): Promise<DriveFile> => {
        const res = await api.patch(`/api/files/${fileId}`, { folderId: targetFolderId });
        return res.data.file;
    },
};

// Why XMLHttpRequest instead of fetch for the upload? fetch does not support upload progress events. xhr.upload.onprogress is the only way to track how many bytes have been sent — which is what drives your progress bar.

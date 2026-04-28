import { api } from './api';

export type ShareLink = {
    shareToken: string;
    expiresAt: string;
    shareUrl: string;
};

export type SharedFile = {
    file: {
        name: string;
        mimeType: string;
        sizeBytes: number;
    };
    downloadUrl: string;
};

export const shareApi = {
    create: async (fileId: string, expiresInHours?: number): Promise<ShareLink> => {
        const res = await api.post(`/api/files/${fileId}/share`, 
            expiresInHours ? { expiresInHours } : {}
        );
        return res.data;
    },

    revoke: async (fileId: string): Promise<void> => {
        await api.delete(`/api/files/${fileId}/share`);
    },

    // Public endpoint - no auth needed
    access: async (token: string): Promise<SharedFile> => {
        const res = await api.get(`/api/shared/${token}`);
        return res.data;
    },
};

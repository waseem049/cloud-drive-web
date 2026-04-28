import { api } from './api';

export type StorageUsage = {
    usedBytes: number;
    limitBytes: number;
    fileCount: number;
    percentUsed: number;
};

export const storageApi = {
    getUsage: async (): Promise<StorageUsage> => {
        const res = await api.get('/api/storage');
        return res.data;
    },
};

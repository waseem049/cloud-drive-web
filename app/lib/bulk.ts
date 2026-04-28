import { api } from './api';

export const bulkApi = {
    // Delete multiple files and folders in one transaction
    delete: async (fileIds: string[], folderIds: string[]): Promise<void> => {
        await api.post('/api/bulk/delete', { fileIds, folderIds });
    },

    // Move multiple files and folders into a target folder in one transaction
    move: async (fileIds: string[], folderIds: string[], targetFolderId: string | null): Promise<void> => {
        await api.post('/api/bulk/move', { fileIds, folderIds, targetFolderId });
    },
};

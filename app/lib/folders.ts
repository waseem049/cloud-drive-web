import { api } from "./api";
import { DriveFile } from "./files";

export type Folder = {
    id: string;
    name: string;
    parentId: string | null;
    createdAt: string;
    updatedAt: string;
};

export type BreadcrumbItem = {
    id: string;
    name: string;
};

export type FolderContents = {
    folders: Folder[];
    files: DriveFile[];
    path: BreadcrumbItem[];
    access?: "owner" | "editor" | "viewer";
};

export const foldersApi = {
    create: async (name: string, parentId?: string | null): Promise<Folder> => {
        const response = await api.post('/api/folders', {name, parentId});
        return response.data.folder;
    },

    getContents: async (folderId?: string | null): Promise<FolderContents> => {
        const id = folderId ?? 'root';
        const res = await api.get(`/api/folders/${id}`);
        return res.data;
    },

    rename: async (folderId: string, name: string): Promise<Folder> => {
        const res = await api.patch(`/api/folders/${folderId}`, { name });
        return res.data.folder;
    },

    move: async (folderId: string, newParentId: string | null): Promise<Folder> => {
        const res = await api.patch(`/api/folders/${folderId}`, { parentId: newParentId });
        return res.data.folder;
    },

    delete: async (folderId: string): Promise<void> => {
        await api.delete(`/api/folders/${folderId}`);
    },
};

export const trashApi = {
    list: async () => {
        const res = await api.get('/api/trash');
        return res.data as { files: DriveFile[]; folders: Folder[] };
    },

    restore: async (resourceType: 'file' | 'folder', resourceId: string) => {
        await api.post('/api/trash/restore', { resourceType, resourceId });
    },

    purge: async (resourceType: 'file' | 'folder', resourceId: string) => {
        await api.delete(`/api/trash/purge/${resourceType}/${resourceId}`);
    },
};
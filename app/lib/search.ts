import { api } from './api';
import { DriveFile } from './files';
import { Folder } from './folders';

export type SearchResults = {
    files: (DriveFile & { starred?: boolean })[];
    folders: (Folder & { starred?: boolean })[];
    query: string;
    nextCursor?: string | null;
    hasMore?: boolean;
};

export type SearchParams = {
    type?: string;
    starred?: boolean;
    limit?: number;
    cursor?: string;
};

export const searchApi = {
    search: async (q: string, extra?: SearchParams): Promise<SearchResults> => {
        const params: Record<string, string | number | boolean> = { q };
        if (extra?.type) params.type = extra.type;
        if (extra?.starred !== undefined) params.starred = extra.starred;
        if (extra?.limit) params.limit = extra.limit;
        if (extra?.cursor) params.cursor = extra.cursor;
        const res = await api.get('/api/search', { params });
        return res.data;
    },
};

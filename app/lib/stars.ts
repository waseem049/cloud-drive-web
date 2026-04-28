import { api } from "./api";
import { DriveFile } from "./files";
import { Folder } from "./folders";

export type StarsList = {
    files: DriveFile[];
    folders: Folder[];
};

export const starsApi = {
    list: async (): Promise<StarsList> => {
        const res = await api.get("/api/stars");
        return res.data;
    },

    star: async (resourceType: "file" | "folder", resourceId: string): Promise<void> => {
        await api.post("/api/stars", { resourceType, resourceId });
    },

    unstar: async (resourceType: "file" | "folder", resourceId: string): Promise<void> => {
        await api.delete("/api/stars", { params: { resourceType, resourceId } });
    },
};

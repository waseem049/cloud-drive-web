import { api } from './api';

export type UserProfile = {
    id: string;
    email: string;
    name: string;
    imageUrl: string | null;
    createdAt?: string;
};

export const profileApi = {
    // Get the current user's profile details
    getProfile: async (): Promise<UserProfile> => {
        const res = await api.get('/api/profile');
        return res.data.user;
    },

    // Update the user's name or email
    updateProfile: async (data: { name?: string; email?: string }): Promise<UserProfile> => {
        const res = await api.patch('/api/profile', data);
        return res.data.user;
    },

    // Change password (requires confirming current password)
    changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
        await api.post('/api/profile/password', { currentPassword, newPassword });
    },
};

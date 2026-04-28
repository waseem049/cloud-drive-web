import { api } from './api';

export type User = {
  id: string;
  email: string;
  name: string;
  imageUrl: string | null;
};

export const authApi = {
  register: async (email: string, password: string, name: string): Promise<User> => {
    const res = await api.post('/api/auth/register', { email, password, name });
    return res.data.user;
  },

  login: async (email: string, password: string): Promise<User> => {
    const res = await api.post('/api/auth/login', { email, password });
    return res.data.user;
  },

  logout: async (): Promise<void> => {
    await api.post('/api/auth/logout');
  },

  me: async (): Promise<User> => {
    const res = await api.get('/api/auth/me');
    return res.data.user;
  },

  requestPasswordReset: async (
    email: string
  ): Promise<{ message: string; _devResetUrl?: string }> => {
    const res = await api.post('/api/auth/forgot-password', { email });
    return { message: res.data.message, _devResetUrl: res.data._devResetUrl };
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await api.post('/api/auth/reset-password', { token, password });
  },
};
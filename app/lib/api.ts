import axios from 'axios';

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true, // send httpOnly cookies on every request
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor - handle token refresh and errors globally
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // if 401 error and we haven't already tried refreshing
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url.includes('/refresh') &&
            !originalRequest.url.includes('/login')
        ) {
            if (isRefreshing) {
                // Queue the request until the token is refreshed
                return new Promise((resolve) => {
                    refreshQueue.push(() => resolve(api(originalRequest)));
                })
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await api.post('/api/auth/refresh');
                refreshQueue.forEach((cb) => cb(null)); // retry all queued requests
                refreshQueue = [];
                return api(originalRequest); // retry original request
            } catch (err) {
                // Refresh failed - reject all queued requests
                refreshQueue = [];
                window.location.href = '/login'; // redirect to login on refresh failure
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        // Re-throw the original error so components can read err.response?.data?.message
        return Promise.reject(error);
    }
);

import axios from 'axios';

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true, // send httpOnly cookies on every request
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor - handle errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // error.response.data.error is our {code, message} shape
        const message = error.response?.data?.error?.message || 'Something went wrong.';
        // Re-throw with a clean message - components just catch this
        return Promise.reject(new Error(message));
    }
);
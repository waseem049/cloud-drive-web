// This file defines the AuthProvider component which manages authentication state
// and provides login, register, and logout functions to the rest of the app.

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { authApi, User } from '../lib/auth';

type AuthContextType = {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(() => Boolean(Cookies.get('is_authenticated')));
    const router = useRouter();

    // On mount - restore session if cookie exists
    useEffect(() => {
        const isAuth = Cookies.get('is_authenticated');
        if (!isAuth) {
            return;
        }
        // Cookie exists → fetch the real user from /me
        let cancelled = false;
        authApi.me()
            .then((u) => {
                if (!cancelled) setUser(u);
            })
            .catch(() => {
                if (!cancelled) setUser(null);
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const login = async (email: string, password: string) => {
        const user = await authApi.login(email, password);
        setUser(user);
        Cookies.set('is_authenticated', 'true', { expires: 7 });
        router.push('/');
    };

    const register = async (name: string, email: string, password: string) => {
        const user = await authApi.register(email, password, name);
        setUser(user);
        Cookies.set('is_authenticated', 'true', { expires: 7 });
        router.push('/');
    };

    const logout = async () => {
        await authApi.logout();
        setUser(null);
        Cookies.remove('is_authenticated');
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return ctx;
}
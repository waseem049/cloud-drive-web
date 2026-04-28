'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../providers/AuthProvider';
import { Eye, EyeOff, Cloud, ArrowRight, Loader2 } from 'lucide-react';
import type { AxiosError } from 'axios';
import s from '../auth.module.css';

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login(email, password);
        } catch (err: unknown) {
            const axiosErr = err as AxiosError<{ message?: string }>;
            setError(axiosErr.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={s.card}>
            {/* Logo */}
            <div className={s.logo}>
                <div className={s.logoIcon}>
                    <Cloud size={20} strokeWidth={1.5} />
                </div>
                <span className={s.logoText}>CloudDrive</span>
            </div>

            {/* Header */}
            <h1 className={s.title}>Welcome back</h1>
            <p className={s.subtitle}>Sign in to access your files and storage</p>

            {/* Form */}
            <form onSubmit={handleSubmit} className={s.form}>
                <div className={`${s.field} ${focusedField === 'email' ? s.fieldFocused : ''}`}>
                    <label className={s.label}>Email address</label>
                    <input
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="you@example.com"
                        required
                        className={s.input}
                        autoComplete="email"
                    />
                </div>

                <div className={`${s.field} ${focusedField === 'password' ? s.fieldFocused : ''}`}>
                    <div className={s.labelRow}>
                        <label className={s.label}>Password</label>
                        <Link href="/forgot-password" className={s.forgotLink}>
                            Forgot password?
                        </Link>
                    </div>
                    <div className={s.inputWrapper}>
                        <input
                            id="login-password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={() => setFocusedField('password')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="••••••••"
                            required
                            className={`${s.input} ${s.inputPassword}`}
                            autoComplete="current-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className={s.togglePw}
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className={s.error}>
                        <div className={s.errorDot} />
                        {error}
                    </div>
                )}

                <button
                    id="login-submit"
                    type="submit"
                    disabled={isLoading}
                    className={s.submit}
                >
                    {isLoading ? (
                        <Loader2 size={18} className={s.spinner} strokeWidth={1.5} />
                    ) : (
                        <>
                            Sign in
                            <ArrowRight size={16} strokeWidth={1.5} />
                        </>
                    )}
                </button>
            </form>

            {/* Footer */}
            <p className={s.footer}>
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="auth-link">
                    Create one
                </Link>
            </p>
        </div>
    );
}

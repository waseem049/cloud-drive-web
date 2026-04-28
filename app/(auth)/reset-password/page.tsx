'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Cloud, Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { authApi } from '@/app/lib/auth';
import s from '../auth.module.css';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const tokenFromQuery = searchParams.get('token') || '';

    const [token, setToken] = useState(tokenFromQuery);
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    useEffect(() => {
        if (tokenFromQuery) setToken(tokenFromQuery);
    }, [tokenFromQuery]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }
        if (!token.trim()) {
            setError('Reset link is missing or invalid. Open the link from your email again.');
            return;
        }
        setIsLoading(true);
        try {
            await authApi.resetPassword(token.trim(), password);
            setDone(true);
        } catch (err: unknown) {
            const msg =
                typeof err === 'object' && err !== null && 'response' in err
                    ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                    : undefined;
            setError(msg || 'Could not reset password. The link may have expired.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={s.card}>
            <div className={s.logo}>
                <div className={s.logoIcon}>
                    <Cloud size={20} strokeWidth={1.5} />
                </div>
                <span className={s.logoText}>CloudDrive</span>
            </div>

            <h1 className={s.title}>Choose a new password</h1>
            <p className={s.subtitle}>Enter a strong password you haven&apos;t used here before.</p>

            {done ? (
                <div className={s.form}>
                    <div
                        className={s.error}
                        style={{
                            background: 'rgba(34, 197, 94, 0.08)',
                            borderColor: 'rgba(34, 197, 94, 0.2)',
                            color: '#86efac',
                        }}
                    >
                        <Check size={18} strokeWidth={1.5} />
                        Password updated. You can sign in with your new password.
                    </div>
                    <Link href="/login" className={s.submit} style={{ textAlign: 'center', textDecoration: 'none' }}>
                        Sign in
                    </Link>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className={s.form}>
                    {!tokenFromQuery && (
                        <div className={`${s.field} ${focusedField === 'token' ? s.fieldFocused : ''}`}>
                            <label className={s.label} htmlFor="reset-token">
                                Reset token (from email link)
                            </label>
                            <input
                                id="reset-token"
                                type="text"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                onFocus={() => setFocusedField('token')}
                                onBlur={() => setFocusedField(null)}
                                placeholder="Paste token if the link did not open correctly"
                                className={s.input}
                                autoComplete="off"
                            />
                        </div>
                    )}

                    <div className={`${s.field} ${focusedField === 'password' ? s.fieldFocused : ''}`}>
                        <label className={s.label} htmlFor="reset-password">
                            New password
                        </label>
                        <div className={s.inputWrapper}>
                            <input
                                id="reset-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                                placeholder="At least 8 characters"
                                required
                                minLength={8}
                                className={`${s.input} ${s.inputPassword}`}
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className={s.togglePw}
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <EyeOff size={16} strokeWidth={1.5} />
                                ) : (
                                    <Eye size={16} strokeWidth={1.5} />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className={`${s.field} ${focusedField === 'confirm' ? s.fieldFocused : ''}`}>
                        <label className={s.label} htmlFor="reset-confirm">
                            Confirm password
                        </label>
                        <input
                            id="reset-confirm"
                            type={showPassword ? 'text' : 'password'}
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            onFocus={() => setFocusedField('confirm')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="Repeat password"
                            required
                            minLength={8}
                            className={s.input}
                            autoComplete="new-password"
                        />
                    </div>

                    {error && (
                        <div className={s.error}>
                            <div className={s.errorDot} />
                            {error}
                        </div>
                    )}

                    <button id="reset-submit" type="submit" disabled={isLoading} className={s.submit}>
                        {isLoading ? (
                            <Loader2 size={18} className={s.spinner} strokeWidth={1.5} />
                        ) : (
                            'Update password'
                        )}
                    </button>
                </form>
            )}

            <p className={s.footer}>
                <Link href="/login" className="auth-link">
                    ← Back to sign in
                </Link>
            </p>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense
            fallback={
                <div className={s.card}>
                    <p className={s.subtitle}>Loading…</p>
                </div>
            }
        >
            <ResetPasswordForm />
        </Suspense>
    );
}

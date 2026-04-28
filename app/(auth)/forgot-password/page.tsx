'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Cloud, ArrowLeft, Loader2, Mail } from 'lucide-react';
import { authApi } from '@/app/lib/auth';
import s from '../auth.module.css';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [devUrl, setDevUrl] = useState<string | null>(null);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        setDevUrl(null);
        try {
            const res = await authApi.requestPasswordReset(email.trim());
            setDone(true);
            if (res._devResetUrl) setDevUrl(res._devResetUrl);
        } catch (err: unknown) {
            const msg =
                typeof err === 'object' && err !== null && 'response' in err
                    ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                    : undefined;
            setError(msg || 'Something went wrong. Please try again.');
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

            <h1 className={s.title}>Reset your password</h1>
            <p className={s.subtitle}>
                Enter your email and we&apos;ll send you a link to choose a new password.
            </p>

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
                        <Mail size={18} strokeWidth={1.5} style={{ flexShrink: 0 }} />
                        <span>
                            If an account exists for that address, check your email for a reset link. The
                            link expires in one hour.
                        </span>
                    </div>
                    {devUrl && (
                        <p className={s.terms} style={{ textAlign: 'left' }}>
                            <strong className="text-foreground/90">Development only:</strong>{' '}
                            <a href={devUrl} className="auth-link" style={{ wordBreak: 'break-all' }}>
                                Open reset page
                            </a>
                        </p>
                    )}
                    <Link href="/login" className={s.submit} style={{ textAlign: 'center', textDecoration: 'none' }}>
                        <ArrowLeft size={16} strokeWidth={1.5} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
                        Back to sign in
                    </Link>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className={s.form}>
                    <div className={`${s.field} ${focusedField === 'email' ? s.fieldFocused : ''}`}>
                        <label className={s.label} htmlFor="forgot-email">
                            Email address
                        </label>
                        <input
                            id="forgot-email"
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

                    {error && (
                        <div className={s.error}>
                            <div className={s.errorDot} />
                            {error}
                        </div>
                    )}

                    <button id="forgot-submit" type="submit" disabled={isLoading} className={s.submit}>
                        {isLoading ? (
                            <Loader2 size={18} className={s.spinner} strokeWidth={1.5} />
                        ) : (
                            'Send reset link'
                        )}
                    </button>
                </form>
            )}

            {!done && (
                <p className={s.footer}>
                    <Link href="/login" className="auth-link">
                        ← Back to sign in
                    </Link>
                </p>
            )}
        </div>
    );
}

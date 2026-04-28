'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../../providers/AuthProvider';
import { Eye, EyeOff, Cloud, ArrowRight, Loader2, Check } from 'lucide-react';
import type { AxiosError } from 'axios';
import s from '../auth.module.css';

export default function SignupPage() {
    const { register: signup } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const passwordStrength = useMemo(() => {
        if (!password) return { score: 0, label: '', color: '' };
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score <= 1) return { score: 1, label: 'Weak', color: '#ef4444' };
        if (score <= 2) return { score: 2, label: 'Fair', color: '#f59e0b' };
        if (score <= 3) return { score: 3, label: 'Good', color: '#3b82f6' };
        return { score: 4, label: 'Strong', color: '#10b981' };
    }, [password]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            await signup(name, email, password);
        } catch (err: unknown) {
            const axiosErr = err as AxiosError<{ message?: string }>;
            setError(axiosErr.response?.data?.message || 'Signup failed. Please try again.');
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
            <h1 className={s.title}>Create your account</h1>
            <p className={s.subtitle}>Start storing your files securely in the cloud</p>

            {/* Form */}
            <form onSubmit={handleSubmit} className={`${s.form} ${s.formCompact}`}>
                <div className={`${s.field} ${focusedField === 'name' ? s.fieldFocused : ''}`}>
                    <label className={s.label}>Full name</label>
                    <input
                        id="signup-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="John Doe"
                        required
                        className={s.input}
                        autoComplete="name"
                    />
                </div>

                <div className={`${s.field} ${focusedField === 'email' ? s.fieldFocused : ''}`}>
                    <label className={s.label}>Email address</label>
                    <input
                        id="signup-email"
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
                    <label className={s.label}>Password</label>
                    <div className={s.inputWrapper}>
                        <input
                            id="signup-password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={() => setFocusedField('password')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="Min. 8 characters"
                            required
                            className={`${s.input} ${s.inputPassword}`}
                            autoComplete="new-password"
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

                    {/* Password strength indicator */}
                    {password && (
                        <div className={s.pwStrength}>
                            <div className={s.pwStrengthBar}>
                                {[1, 2, 3, 4].map((level) => (
                                    <div
                                        key={level}
                                        className={s.pwStrengthSegment}
                                        style={{
                                            background: level <= passwordStrength.score
                                                ? passwordStrength.color
                                                : 'rgba(255,255,255,0.06)',
                                        }}
                                    />
                                ))}
                            </div>
                            <span className={s.pwStrengthLabel} style={{ color: passwordStrength.color }}>
                                {passwordStrength.label}
                            </span>
                        </div>
                    )}

                    {/* Password requirements */}
                    {password && (
                        <div className={s.pwReqs}>
                            <div className={`${s.pwReq} ${password.length >= 8 ? s.pwReqMet : ''}`}>
                                <Check size={12} strokeWidth={1.5} />
                                <span>8+ characters</span>
                            </div>
                            <div className={`${s.pwReq} ${/[A-Z]/.test(password) ? s.pwReqMet : ''}`}>
                                <Check size={12} strokeWidth={1.5} />
                                <span>Uppercase</span>
                            </div>
                            <div className={`${s.pwReq} ${/[0-9]/.test(password) ? s.pwReqMet : ''}`}>
                                <Check size={12} strokeWidth={1.5} />
                                <span>Number</span>
                            </div>
                        </div>
                    )}
                </div>

                {error && (
                    <div className={s.error}>
                        <div className={s.errorDot} />
                        {error}
                    </div>
                )}

                <button
                    id="signup-submit"
                    type="submit"
                    disabled={isLoading}
                    className={s.submit}
                >
                    {isLoading ? (
                        <Loader2 size={18} className={s.spinner} strokeWidth={1.5} />
                    ) : (
                        <>
                            Create account
                            <ArrowRight size={16} strokeWidth={1.5} />
                        </>
                    )}
                </button>
            </form>

            {/* Terms */}
            <p className={s.terms}>
                By creating an account, you agree to our{' '}
                <Link href="/terms" className="auth-link-subtle">Terms</Link>
                {' '}and{' '}
                <Link href="/privacy" className="auth-link-subtle">Privacy Policy</Link>
            </p>

            {/* Footer */}
            <p className={`${s.footer} ${s.footerCompact}`}>
                Already have an account?{' '}
                <Link href="/login" className="auth-link">
                    Sign in
                </Link>
            </p>
        </div>
    );
}

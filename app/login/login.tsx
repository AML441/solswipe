'use client';

import { useState } from 'react';
import { signInWithGoogle } from '@/lib/services/auth';
import { useRouter } from 'next/navigation';

export const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async () => {
        setError('');
        setLoading(true);
        try {
            const user = await signInWithGoogle();
            console.log('Logged in user:', user);
            console.log('Token', user.token);

            // Send Firebase token to backend for verification & user creation
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: user.token }),
            });

            const data = await res.json();
            if (data.success) {
                router.push('/dashboard');
            } else {
                setError('Login failed on server.');
            }
        } catch (err) {
            console.error(err);
            setError('Google login failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-5 py-16 bg-linear-to-b from-indigo-900 to-slate-900">
            <div className="w-full max-w-md bg-slate-900 rounded-xl p-8 shadow-lg border border-slate-100">
                <h1 className="text-center text-2xl font-semibold text-white">Welcome to SolSwipe!</h1>
                <p className="text-center text-md text-white">SolSwipe is a web-app designed to help users learn about existing non-profits in need of funding and contribute through Solana transactions</p>
                {error && (
                    <div className="mt-3 bg-rose-50 text-rose-700 px-3 py-2 rounded-md text-sm text-center border border-rose-100">
                        {error}
                    </div>
                )}

                <button
                    type="button"
                    disabled={loading}
                    onClick={handleLogin}
                    className="mt-4 h-11 w-full rounded-md bg-cyan-200 text-slate-900 font-semibold hover:bg-teal-600 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {loading ? 'Logging in...' : 'Login with Google'}
                </button>
            </div>
        </div>
    );
};

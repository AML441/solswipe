'use client'

import { signInWithGoogle } from '@/lib/services/auth';
import React, { useState } from 'react';

interface LoginFormData {
    email: string;
    password: string;
}

export const LoginPage: React.FC = () => {
    const [formData, setFormData] = useState<LoginFormData>({
        email: '',
        password: '',
    });
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleGoogleLogin = async () => {
        setError('');
        setLoading(true);
        try {
            const user = await signInWithGoogle();
            console.log('Logged in user:', user);

        } catch (err) {
            console.error(err);
            setError('Google login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-5 py-16 bg-gradient-to-b from-white via-slate-50 to-slate-50">
            <div className="w-full max-w-md bg-white rounded-xl p-8 shadow-lg border border-slate-100">
                <h1 className="text-center text-2xl font-semibold text-slate-900">Login</h1>
                {error && (
                    <div className="mt-3 bg-rose-50 text-rose-700 px-3 py-2 rounded-md text-sm text-center border border-rose-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleGoogleLogin} className="mt-4 flex flex-col gap-3">
    
                    <button
                        type="submit"
                        disabled={loading}
                        className="h-11 rounded-md bg-teal-500 text-white font-semibold hover:bg-teal-600 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};
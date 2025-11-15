'use client'

import { signInWithGoogle } from '@/lib/services/auth';
import React, { useState } from 'react';

interface LoginFormData {
    email: string;
    password: string;
}

export default function LoginPage() {
    
    const [formData, setFormData] = useState<LoginFormData>({
        email: '',
        password: '',
    });
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

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


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    // const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    //     e.preventDefault();
    //     setError('');
    //     setLoading(true);

    //     try {
    //         // Add your authentication logic here
    //         console.log('Login attempt:', formData);
    //         // Example: await authenticateUser(formData);
    //     } catch (err) {
    //         setError('Invalid email or password');
    //     } finally {
    //         setLoading(false);
    //     }
    // };

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
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="h-11 px-3 border border-slate-200 rounded-md text-slate-900 placeholder-slate-400 bg-transparent outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="h-11 px-3 border border-slate-200 rounded-md text-slate-900 placeholder-slate-400 bg-transparent outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                    />
                    <button
                        type="submit"
                        onClick={handleGoogleLogin}
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
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store';
import { api } from '../../lib/api';
import { Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, password });
      if (res.data.success) {
        setAuth(res.data.data.user, res.data.data.token);
        toast.success('Account created successfully!');
        router.push('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary-600/20 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />

      <div className="relative w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 shadow-xl shadow-primary-600/20">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">Create your account</h2>
          <p className="mt-1 text-xs text-gray-400">Join ReachInbox Email Automation Engine</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-8 shadow-2xl">
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Senior Evaluator"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-gray-950 pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-gray-950 pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-gray-950 pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center space-x-2 rounded-xl bg-primary-600 py-3 text-xs font-semibold text-white shadow-lg shadow-primary-600/30 hover:bg-primary-500 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary-400 hover:text-primary-300 underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

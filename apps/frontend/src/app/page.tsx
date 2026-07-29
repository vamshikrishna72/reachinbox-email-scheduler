'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../lib/store';

export default function Home() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [token, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex items-center space-x-2 text-primary-400">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
        </span>
        <span className="text-sm font-semibold">Loading ReachInbox Engine...</span>
      </div>
    </div>
  );
}

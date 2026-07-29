'use client';

import React from 'react';
import { useAuthStore } from '../lib/store';
import { Mail, Plus, LogOut, Zap, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface NavbarProps {
  onOpenCompose: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCompose }) => {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 shadow-lg shadow-primary-500/20">
            <Mail className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold tracking-tight text-white text-lg">ReachInbox</span>
              <span className="rounded-full bg-primary-500/10 px-2 py-0.5 text-xs font-semibold text-primary-400 border border-primary-500/20">
                Outreach Engine
              </span>
            </div>
            <p className="text-xs text-gray-400">Queue Throttling & Email Automation</p>
          </div>
        </div>

        {/* Action Controls & User Info */}
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>BullMQ Active</span>
          </div>

          <button
            onClick={onOpenCompose}
            className="inline-flex items-center space-x-2 rounded-lg bg-primary-600 hover:bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-md shadow-primary-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>Compose Email</span>
          </button>

          {user && (
            <div className="flex items-center space-x-3 border-l border-border pl-4">
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 border border-gray-700 text-gray-300">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-medium text-gray-200">{user.name}</p>
                  <p className="text-[10px] text-gray-400">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

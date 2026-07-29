'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store';
import { api } from '../../lib/api';
import { DashboardStats, ScheduledEmail } from '../../types';
import { Navbar } from '../../components/Navbar';
import { StatsCards } from '../../components/StatsCards';
import { ScheduledTable } from '../../components/ScheduledTable';
import { SentTable } from '../../components/SentTable';
import { ComposeEmailModal } from '../../components/ComposeEmailModal';
import { EtherealDrawer } from '../../components/EtherealDrawer';
import { Clock, CheckCircle2, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const { user, token } = useAuthStore();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [sentEmails, setSentEmails] = useState<ScheduledEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');

  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedEmailForPreview, setSelectedEmailForPreview] = useState<ScheduledEmail | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, scheduledRes, sentRes] = await Promise.all([
        api.get('/stats/dashboard'),
        api.get('/emails/scheduled'),
        api.get('/emails/sent'),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (scheduledRes.data.success) setScheduledEmails(scheduledRes.data.data);
      if (sentRes.data.success) setSentEmails(sentRes.data.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    fetchDashboardData();

    // Auto-polling interval every 3 seconds for real-time queue status updates
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 3000);

    return () => clearInterval(interval);
  }, [token, router, fetchDashboardData]);

  if (!token) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navbar */}
      <Navbar onOpenCompose={() => setIsComposeOpen(true)} />

      {/* Main Container */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* KPI Metrics */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Queue Control & Outreach Metrics</h1>
            <p className="text-xs text-gray-400">Real-time status updates every 3 seconds</p>
          </div>
          <button
            onClick={() => fetchDashboardData()}
            className="inline-flex items-center space-x-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Sync Now</span>
          </button>
        </div>

        <StatsCards stats={stats} loading={loading} />

        {/* Navigation Tabs */}
        <div className="flex border-b border-border space-x-6">
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`flex items-center space-x-2 pb-3 text-xs font-bold transition-colors relative ${
              activeTab === 'scheduled' ? 'text-primary-400' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Scheduled Emails ({scheduledEmails.length})</span>
            {activeTab === 'scheduled' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-t-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('sent')}
            className={`flex items-center space-x-2 pb-3 text-xs font-bold transition-colors relative ${
              activeTab === 'sent' ? 'text-emerald-400' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Sent & Delivery Logs ({sentEmails.length})</span>
            {activeTab === 'sent' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-t-full" />
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'scheduled' ? (
          <ScheduledTable emails={scheduledEmails} loading={loading} onRefresh={fetchDashboardData} />
        ) : (
          <SentTable
            emails={sentEmails}
            loading={loading}
            onRefresh={fetchDashboardData}
            onSelectEmailForPreview={(email) => setSelectedEmailForPreview(email)}
          />
        )}
      </main>

      {/* Compose Email Modal */}
      <ComposeEmailModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSuccess={fetchDashboardData}
      />

      {/* Ethereal Email Inspector Drawer */}
      <EtherealDrawer
        email={selectedEmailForPreview}
        onClose={() => setSelectedEmailForPreview(null)}
      />
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { ScheduledEmail } from '../types';
import { Search, CheckCircle2, AlertTriangle, ExternalLink, RotateCcw, Eye, Mail } from 'lucide-react';
import { api } from '../lib/api';
import { toast } from 'sonner';

interface SentTableProps {
  emails: ScheduledEmail[];
  loading: boolean;
  onRefresh: () => void;
  onSelectEmailForPreview: (email: ScheduledEmail) => void;
}

export const SentTable: React.FC<SentTableProps> = ({
  emails,
  loading,
  onRefresh,
  onSelectEmailForPreview,
}) => {
  const [search, setSearch] = useState('');

  const filteredEmails = emails.filter(
    (e) =>
      e.recipient.toLowerCase().includes(search.toLowerCase()) ||
      e.subject.toLowerCase().includes(search.toLowerCase())
  );

  const handleResend = async (id: string) => {
    try {
      await api.post(`/emails/${id}/resend`);
      toast.success('Email re-queued for immediate dispatch');
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to resend email');
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border p-4 bg-gray-900/40">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <h3 className="font-semibold text-white text-sm">Sent & Delivery Log ({filteredEmails.length})</h3>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search sent emails..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-gray-950 pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-gray-950/60 text-gray-400 uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3">Recipient</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Dispatched At</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ethereal Inbox Link</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 text-gray-300">
            {loading ? (
              [1, 2, 3].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-4"><div className="h-4 w-36 rounded bg-gray-800" /></td>
                  <td className="px-4 py-4"><div className="h-4 w-48 rounded bg-gray-800" /></td>
                  <td className="px-4 py-4"><div className="h-4 w-28 rounded bg-gray-800" /></td>
                  <td className="px-4 py-4"><div className="h-4 w-20 rounded bg-gray-800" /></td>
                  <td className="px-4 py-4"><div className="h-4 w-28 rounded bg-gray-800" /></td>
                  <td className="px-4 py-4 text-right"><div className="h-4 w-12 rounded bg-gray-800 ml-auto" /></td>
                </tr>
              ))
            ) : filteredEmails.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-500">
                  <Mail className="mx-auto h-8 w-8 text-gray-600 mb-2" />
                  <p className="font-medium text-sm text-gray-400">No sent email logs yet</p>
                  <p className="text-xs text-gray-600">Dispatched emails with Ethereal preview links will appear here</p>
                </td>
              </tr>
            ) : (
              filteredEmails.map((email) => (
                <tr key={email.id} className="hover:bg-gray-900/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{email.recipient}</td>
                  <td className="px-4 py-3 max-w-xs truncate">{email.subject}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {email.sentAt
                      ? new Date(email.sentAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {email.status === 'SENT' ? (
                      <span className="inline-flex items-center space-x-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-emerald-400 border border-emerald-500/20 font-medium">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Sent</span>
                      </span>
                    ) : (
                      <span
                        title={email.failureReason || 'Failed'}
                        className="inline-flex items-center space-x-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-rose-400 border border-rose-500/20 font-medium cursor-help"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        <span>Failed</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {email.etherealUrl ? (
                      <a
                        href={email.etherealUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-primary-400 hover:text-primary-300 underline font-medium"
                      >
                        <span>View Ethereal Email</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-gray-500 text-[11px]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => onSelectEmailForPreview(email)}
                      title="Inspect Email Body"
                      className="rounded p-1 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleResend(email.id)}
                      title="Resend Email"
                      className="rounded p-1 text-gray-400 hover:bg-primary-500/10 hover:text-primary-400 transition-colors"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

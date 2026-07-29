'use client';

import React, { useState } from 'react';
import { ScheduledEmail } from '../types';
import { Search, Clock, XCircle, Trash2, Mail, Layers, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { toast } from 'sonner';

interface ScheduledTableProps {
  emails: ScheduledEmail[];
  loading: boolean;
  onRefresh: () => void;
}

export const ScheduledTable: React.FC<ScheduledTableProps> = ({
  emails,
  loading,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');

  const filteredEmails = emails.filter(
    (e) =>
      e.recipient.toLowerCase().includes(search.toLowerCase()) ||
      e.subject.toLowerCase().includes(search.toLowerCase())
  );

  const handleCancel = async (id: string) => {
    try {
      await api.post(`/emails/${id}/cancel`);
      toast.success('Email dispatch cancelled');
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to cancel email');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/emails/${id}`);
      toast.success('Email deleted');
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete email');
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border p-4 bg-gray-900/40">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-amber-400" />
          <h3 className="font-semibold text-white text-sm">Scheduled Email Queue ({filteredEmails.length})</h3>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search recipient or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-gray-950 pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-gray-950/60 text-gray-400 uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3">Recipient</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Scheduled Time</th>
              <th className="px-4 py-3">Status</th>
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
                  <td className="px-4 py-4 text-right"><div className="h-4 w-12 rounded bg-gray-800 ml-auto" /></td>
                </tr>
              ))
            ) : filteredEmails.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-500">
                  <Mail className="mx-auto h-8 w-8 text-gray-600 mb-2" />
                  <p className="font-medium text-sm text-gray-400">No scheduled emails found</p>
                  <p className="text-xs text-gray-600">Click "Compose Email" to queue a new dispatch sequence</p>
                </td>
              </tr>
            ) : (
              filteredEmails.map((email) => (
                <tr key={email.id} className="hover:bg-gray-900/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{email.recipient}</td>
                  <td className="px-4 py-3 max-w-xs truncate">{email.subject}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(email.scheduledAt).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    {email.status === 'PROCESSING' ? (
                      <span className="inline-flex items-center space-x-1 rounded-md bg-purple-500/10 px-2 py-0.5 text-purple-400 border border-purple-500/20 font-medium">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Sending...</span>
                      </span>
                    ) : email.status === 'QUEUED' ? (
                      <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-amber-400 border border-amber-500/20 font-medium">
                        Queued
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-0.5 text-blue-400 border border-blue-500/20 font-medium">
                        Scheduled
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => handleCancel(email.id)}
                      title="Cancel Email"
                      className="rounded p-1 text-gray-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(email.id)}
                      title="Delete Record"
                      className="rounded p-1 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
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

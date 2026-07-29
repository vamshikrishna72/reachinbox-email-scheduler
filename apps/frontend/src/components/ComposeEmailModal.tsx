'use client';

import React, { useState } from 'react';
import { X, Send, Clock, Sliders, Users, Mail, CheckCircle, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { toast } from 'sonner';

interface ComposeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ComposeEmailModal: React.FC<ComposeEmailModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [recipientsText, setRecipientsText] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [userDelaySeconds, setUserDelaySeconds] = useState(3);
  const [hourlyRateLimit, setHourlyRateLimit] = useState(50);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Compute parsed recipients preview
  const recipientList = recipientsText
    .split(',')
    .map((r) => r.trim())
    .filter((r) => r.length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (recipientList.length === 0) {
      toast.error('Please enter at least one recipient email address');
      return;
    }
    if (!subject.trim()) {
      toast.error('Subject is required');
      return;
    }
    if (!body.trim()) {
      toast.error('Email body is required');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/emails/schedule', {
        recipients: recipientList,
        subject,
        body,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        userDelaySeconds: Number(userDelaySeconds),
        hourlyRateLimit: Number(hourlyRateLimit),
      });

      if (response.data.success) {
        toast.success(`Successfully enqueued ${recipientList.length} email(s) into BullMQ worker queue!`);
        onSuccess();
        onClose();
        // Reset form
        setRecipientsText('');
        setSubject('');
        setBody('');
        setScheduledAt('');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to schedule emails');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-gray-900/50">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary-400" />
            <h2 className="text-lg font-bold text-white">Compose & Schedule Sequence</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Recipients */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Recipients <span className="text-gray-500 font-normal">(Comma-separated for bulk outreach)</span>
            </label>
            <input
              type="text"
              placeholder="alex@stripe.com, sarah@datadog.com, lead@linear.app"
              value={recipientsText}
              onChange={(e) => setRecipientsText(e.target.value)}
              className="w-full rounded-xl border border-border bg-gray-950 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            {recipientList.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="text-xs text-gray-400 self-center mr-1">Parsed ({recipientList.length}):</span>
                {recipientList.slice(0, 5).map((email, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded-md bg-primary-500/10 px-2 py-0.5 text-xs font-medium text-primary-400 border border-primary-500/20"
                  >
                    {email}
                  </span>
                ))}
                {recipientList.length > 5 && (
                  <span className="text-xs text-gray-400 self-center">+{recipientList.length - 5} more</span>
                )}
              </div>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Subject Line</label>
            <input
              type="text"
              placeholder="e.g. Scaling outreach deliverability with BullMQ"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl border border-border bg-gray-950 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Email Body (HTML / Plaintext)</label>
            <textarea
              rows={5}
              placeholder="Write your email content here... (HTML tags like <p>, <b> supported)"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full rounded-xl border border-border bg-gray-950 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 font-mono text-xs"
            />
          </div>

          {/* Scheduling & Throttling Settings Card */}
          <div className="rounded-xl border border-border bg-gray-950/60 p-4 space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-gray-200">
              <Sliders className="h-4 w-4 text-primary-400" />
              <span>Queue Throttling & Rate Controls</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Scheduled DateTime */}
              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-1">Schedule Time</label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-white focus:border-primary-500 focus:outline-none"
                />
                <span className="text-[10px] text-gray-500 mt-0.5 block">Leave empty for instant queue dispatch</span>
              </div>

              {/* Inter-email Delay */}
              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-1">
                  Delay Between Emails: <span className="text-primary-400 font-bold">{userDelaySeconds}s</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={userDelaySeconds}
                  onChange={(e) => setUserDelaySeconds(Number(e.target.value))}
                  className="w-full accent-primary-500 cursor-pointer"
                />
                <span className="text-[10px] text-gray-500 mt-0.5 block">Humanizes email cadence</span>
              </div>

              {/* Hourly Rate Limit */}
              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-1">Hourly Limit</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={hourlyRateLimit}
                  onChange={(e) => setHourlyRateLimit(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-white focus:border-primary-500 focus:outline-none"
                />
                <span className="text-[10px] text-gray-500 mt-0.5 block">Max emails / hr</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center space-x-2 rounded-xl bg-primary-600 hover:bg-primary-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-primary-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <span>Enqueueing Jobs...</span>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Schedule Sequence ({recipientList.length})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

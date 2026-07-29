'use client';

import React from 'react';
import { ScheduledEmail } from '../types';
import { X, ExternalLink, Mail, Calendar, User, CheckCircle2, FileText } from 'lucide-react';

interface EtherealDrawerProps {
  email: ScheduledEmail | null;
  onClose: () => void;
}

export const EtherealDrawer: React.FC<EtherealDrawerProps> = ({ email, onClose }) => {
  if (!email) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg border-l border-border bg-surface p-6 shadow-2xl overflow-y-auto flex flex-col h-full">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-primary-400" />
            <h3 className="font-bold text-white text-base">Email Inspector</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Email Metadata */}
        <div className="mt-6 space-y-4 text-xs">
          <div>
            <span className="text-gray-400 font-semibold block mb-1">Subject</span>
            <p className="text-white text-sm font-bold bg-gray-950 p-3 rounded-xl border border-border">
              {email.subject}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-950 p-3 rounded-xl border border-border">
              <span className="text-gray-400 block mb-0.5">Recipient</span>
              <p className="text-white font-medium truncate">{email.recipient}</p>
            </div>
            <div className="bg-gray-950 p-3 rounded-xl border border-border">
              <span className="text-gray-400 block mb-0.5">Status</span>
              <span className="inline-flex items-center space-x-1 font-bold text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{email.status}</span>
              </span>
            </div>
          </div>

          {email.etherealUrl && (
            <div className="rounded-xl border border-primary-500/30 bg-primary-500/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-primary-300">Live Ethereal Test Inbox URL</h4>
                  <p className="text-[11px] text-gray-300 mt-0.5">
                    Rendered by Nodemailer Ethereal SMTP server
                  </p>
                </div>
                <a
                  href={email.etherealUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md hover:bg-primary-500 transition-colors"
                >
                  <span>Open Inbox</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* Rendered Body */}
          <div>
            <div className="flex items-center space-x-1 text-gray-400 font-semibold mb-2">
              <FileText className="h-4 w-4" />
              <span>Email Body Content</span>
            </div>
            <div
              className="rounded-xl border border-border bg-gray-950 p-4 text-gray-200 prose prose-invert prose-xs max-w-none font-sans min-h-[150px]"
              dangerouslySetInnerHTML={{ __html: email.body }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-6 border-t border-border">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-gray-800 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import { DashboardStats } from '../types';
import { Mail, Clock, CheckCircle2, AlertTriangle, Gauge } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatsCardsProps {
  stats: DashboardStats | null;
  loading: boolean;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, loading }) => {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-surface border border-border/60" />
        ))}
      </div>
    );
  }

  const items = [
    {
      title: 'Total Emails Scheduled',
      value: stats.totalEmails,
      subtitle: `${stats.activeBatchesCount} Active Batch Sequences`,
      icon: Mail,
      color: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30',
    },
    {
      title: 'Pending In Queue',
      value: stats.scheduledCount,
      subtitle: 'Rate-limited execution',
      icon: Clock,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
    },
    {
      title: 'Successfully Dispatched',
      value: stats.sentCount,
      subtitle: 'Delivered via Ethereal SMTP',
      icon: CheckCircle2,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
    },
    {
      title: 'Hourly Quota Speedometer',
      value: `${stats.sentLastHour} / ${stats.hourlyQuotaCap}`,
      subtitle: 'Emails sent in last 60 mins',
      icon: Gauge,
      color: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.08 }}
            className="relative overflow-hidden rounded-xl border border-border bg-surface p-5 shadow-sm hover:border-gray-700 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">{item.title}</span>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br border ${item.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-white">{item.value}</div>
              <p className="mt-1 text-xs text-gray-400">{item.subtitle}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

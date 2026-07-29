export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface EmailBatch {
  id: string;
  userId: string;
  name: string;
  userDelaySeconds: number;
  hourlyRateLimit: number;
  totalEmails: number;
  sentCount: number;
  failedCount: number;
  status: 'SCHEDULED' | 'PROCESSING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledEmail {
  id: string;
  userId: string;
  batchId?: string | null;
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: string;
  sentAt?: string | null;
  status: 'SCHEDULED' | 'QUEUED' | 'PROCESSING' | 'SENT' | 'FAILED' | 'CANCELLED';
  etherealUrl?: string | null;
  failureReason?: string | null;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  batch?: EmailBatch;
}

export interface DashboardStats {
  totalEmails: number;
  scheduledCount: number;
  sentCount: number;
  failedCount: number;
  activeBatchesCount: number;
  sentLastHour: number;
  hourlyQuotaCap: number;
}

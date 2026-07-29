import './globals.css';
import type { Metadata } from 'next';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'ReachInbox AI — Email Scheduler & Queue Automation Engine',
  description: 'Production-grade rate-limited email scheduler built with Next.js 15, BullMQ, and Nodemailer Ethereal.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased selection:bg-primary-500 selection:text-white">
        {children}
        <Toaster richColors position="top-right" theme="dark" />
      </body>
    </html>
  );
}

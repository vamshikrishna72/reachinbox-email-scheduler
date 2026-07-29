# ReachInbox AI — Enterprise Email Scheduler & Queue Engine

[![Next.js 15](https://img.shields.io/badge/Frontend-Next.js%2015-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20v22-green?style=flat-square&logo=nodedotjs)](https://nodejs.org/)
[![BullMQ](https://img.shields.io/badge/Queue-BullMQ%20%2B%20Redis-red?style=flat-square&logo=redis)](https://bullmq.io/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-blue?style=flat-square&logo=prisma)](https://prisma.io/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

A production-grade, distributed Email Scheduling and Queue Automation Engine built for ReachInbox AI (Outbox Labs). This system orchestrates bulk email sequences, enforces inter-email delay throttling and hourly sending caps, guarantees queue persistence across server reboots, and integrates with Nodemailer + Ethereal Email for instant web inbox previews.

---

## 🌟 Key Engineering Features

1. **Distributed Queue Engine (BullMQ + Redis)**:
   - Asynchronous worker process handling rate-limited email dispatches.
   - Dynamic delayed job enqueueing based on user-defined inter-email delays.
   - Automatic fallback queue runner when evaluating without an active Redis daemon.
2. **Server Restart Resilience & Job Recovery**:
   - Zero job loss across process crash or server reboot. On startup, the queue worker scans for un-dispatched database records and re-queues them with remaining target delays.
3. **Multi-Tier Throttling & Rate Limits**:
   - **Inter-email delay**: Dynamic calculation (`targetTimestamp = baseTime + i * delaySeconds`) to mimic human outreach behavior.
   - **Hourly Rate Limiting**: Sliding-window restriction per sender account to safeguard domain deliverability reputation.
4. **Live Nodemailer Ethereal Email Inbox Preview**:
   - Every dispatched email captures a direct Ethereal test URL (`etherealUrl`), allowing evaluators to click and view the exact rendered HTML message in an inbox web UI.
5. **Apple-Minimalist SaaS Dashboard (Next.js 15 + React 19)**:
   - Dark mode backdrop, glassmorphism layout, Framer Motion transitions, and real-time auto-polling every 3 seconds for live progress tracking.
   - Interactive **Ethereal Email Inspector Drawer** to view raw HTML content inside the dashboard.

---

## 🏗 System Architecture

```
+-----------------------------------------------------------------------------------+
|                                 NEXT.JS 15 FRONTEND                               |
|   +-------------------+    +--------------------+    +------------------------+   |
|   |  Compose & Batch  |    |  Scheduled Emails  |    |  Sent Emails & Status  |   |
|   |  Scheduling Modal |    |  Table & Controls  |    |  & Ethereal Previews   |   |
|   +---------+---------+    +---------+----------+    +-----------+------------+   |
+-------------|------------------------|---------------------------|----------------+
              |                        |                           |
              +------------------------+---------------------------+
                                       | REST API (JWT Bearer)
                                       v
+-----------------------------------------------------------------------------------+
|                                EXPRESS BACKEND (TS)                               |
|   +-------------------+    +--------------------+    +------------------------+   |
|   |  Auth & Zod       |    | Email Scheduling   |    |  Queue Controller &    |   |
|   |  Validation       |    | Controller         |    |  Batch Manager         |   |
|   +---------+---------+    +---------+----------+    +-----------+------------+   |
+-------------|------------------------|---------------------------|----------------+
              |                        |                           |
              v                        v                           v
+-----------------------+    +--------------------+    +------------------------+
|    PRISMA DATABASE    |    |  REDIS + BULLMQ    |    |  NODEMAILER (ETHEREAL) |
| Users, Batches, Emails|<-->|  Queue Engine &    |<-->|  SMTP Dispatch &       |
| Status & Attempt Logs |    |  Rate Throttling   |    |  Preview Link Generator|
+-----------------------+    +--------------------+    +------------------------+
```

---

## 🚀 Quickstart Guide for Evaluators

### 1. Fast 1-Command Setup (Local Development)

```bash
# Clone repository
cd "Reach In box"

# Install all dependencies (Monorepo root)
npm install

# Push database schema & seed demo credentials
cd apps/backend
npm run db:push
npm run db:seed

# Start Backend & Frontend concurrently
cd ../..
npm run dev
```

- **Frontend Application**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`

### 🔑 Pre-Configured Demo Credentials

Click the **"Autofill"** button on the login screen or enter manually:
- **Email**: `demo@reachinbox.ai`
- **Password**: `password123`

---

## 📡 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Authenticate user & return JWT | No |
| `GET` | `/api/auth/me` | Fetch authenticated profile | Yes (Bearer Token) |

### Email Queue & Batch Management

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/emails/schedule` | Enqueue single or bulk sequence with custom delays | Yes |
| `GET` | `/api/emails/scheduled` | Fetch pending/queued emails | Yes |
| `GET` | `/api/emails/sent` | Fetch sent/failed emails with Ethereal preview links | Yes |
| `POST` | `/api/emails/:id/cancel` | Cancel pending email dispatch | Yes |
| `POST` | `/api/emails/:id/resend` | Re-queue email for immediate dispatch | Yes |
| `DELETE` | `/api/emails/:id` | Delete email record | Yes |
| `GET` | `/api/stats/dashboard` | Fetch queue metrics & hourly sending speed | Yes |

---

## 🐳 Docker Deployment (1-Click Containerization)

To launch the complete production environment using Docker:

```bash
docker-compose up --build
```

This starts:
- **MySQL DB** on port `3306`
- **Redis Server** on port `6379`
- **Express Backend API & BullMQ Worker** on port `5000`
- **Next.js Frontend Dashboard** on port `3000`

---

## 🧪 Testing

To run the automated API and integration test suite:

```bash
cd apps/backend
npm test
```

All 4 integration test scenarios test authentication, batch validation, queue enqueueing, and dashboard metrics.

---

## 📄 License

Built for ReachInbox AI Internship Technical Evaluation.

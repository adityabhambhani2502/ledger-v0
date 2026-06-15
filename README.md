# Ledger 

A personal finance tracker with a Supabase backend, Express API, and a Vite-powered frontend — deployed on Vercel.

Track transactions, manage budgets, link bank accounts, and get a monthly financial snapshot delivered right to your inbox.

---

## Features

- **Transaction tracking** — Log income and expenses with categories, dates, and descriptions
- **Bank account management** — Link multiple bank accounts with balance tracking
- **Budget management** — Set monthly budgets by category and monitor spending
- **Monthly newsletter** — Automated financial snapshot emails with spending summaries
- **Secure auth** — Custom user authentication with Row Level Security via Supabase

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vite + JavaScript + CSS |
| Backend | Node.js + Express (ESM) |
| Database | Supabase (PostgreSQL) |
| Deployment | Vercel |

---

## Project Structure

```
ledger-v0/
├── client/               # Frontend (Vite)
│   └── dist/             # Build output (generated)
├── server/               # Express server logic
├── api/                  # Vercel serverless API entry
├── supabase-schema.sql   # Database schema
├── vercel.json           # Vercel deployment config
├── .env.example          # Environment variable template
└── package.json          # Root dependencies
```

---

## Database Schema

The app uses five tables in Supabase:

- **`users`** — Auth credentials and profile info
- **`transactions`** — Income/expense records linked to users and optionally to a bank account
- **`bank_accounts`** — Linked bank accounts with balance and status
- **`budgets`** — Monthly category-level budget limits (unique per user + category + month)
- **`newsletter_log`** — Record of monthly financial snapshot emails sent

Row Level Security (RLS) is enabled on all tables. The service role key is used server-side to bypass RLS for all operations.

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Vercel](https://vercel.com) account (for deployment)

### 1. Clone the repo

```bash
git clone https://github.com/adityabhambhani2502/ledger-v0.git
cd ledger-v0
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Open the **SQL Editor** in your Supabase dashboard
3. Run the contents of `supabase-schema.sql` to create all tables and indexes

### 3. Configure environment variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

> Get these from your Supabase dashboard under **Project Settings → API**.

### 4. Install dependencies

```bash
# Root (server dependencies)
npm install

# Client
cd client && npm install
```

### 5. Run locally

```bash
# Start the Express server
node server/index.js

# In a separate terminal, start the frontend dev server
cd client && npm run dev
```

---

## Deployment (Vercel)

The project is pre-configured for Vercel via `vercel.json`:

- **Build command:** `cd client && npm install && npm run build`
- **Output directory:** `client/dist`
- API routes under `/api/*` are handled by the serverless function in `api/`
- All other routes fall back to `index.html` for client-side routing

To deploy:

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com/new)
3. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as environment variables in Vercel project settings
4. Deploy

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypasses RLS — keep secret) |

> ⚠️ Never expose your `SUPABASE_SERVICE_ROLE_KEY` on the client side.

---




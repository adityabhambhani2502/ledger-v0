-- Ledger Finance - Supabase Schema
-- Run this in Supabase SQL Editor after creating your project

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  description TEXT DEFAULT '',
  source_bank_account_id TEXT,
  source_bank_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bank Accounts table
CREATE TABLE IF NOT EXISTS bank_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_type TEXT NOT NULL,
  account_last4 TEXT NOT NULL,
  balance NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'active',
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  month TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category, month)
);

-- Newsletter log table
CREATE TABLE IF NOT EXISTS newsletter_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  month TEXT NOT NULL,
  snapshot JSONB,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month);
CREATE INDEX IF NOT EXISTS idx_newsletter_user ON newsletter_log(user_id);

-- Enable Row Level Security (optional for server-side access with service key)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_log ENABLE ROW LEVEL SECURITY;

-- Allow service role to bypass RLS (default behavior with service_role key)
-- These policies allow the service role key to do anything
CREATE POLICY "service_role_all" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON bank_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON budgets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON newsletter_log FOR ALL USING (true) WITH CHECK (true);

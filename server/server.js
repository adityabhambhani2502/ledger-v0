import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let seedDB;
try { seedDB = require('./db.json'); } catch (e) { seedDB = { transactions: [] }; console.warn('[Seed] db.json not found, skipping seed data'); }

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// ── Supabase Client ──
const SUPABASE_URL = 'https://fpwkhsjynyzggdbnpcvs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwd2toc2p5bnl6Z2dkYm5wY3ZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTQwOTA3MywiZXhwIjoyMDk2OTg1MDczfQ.pKufZ9VgnmbAP4qduw_myai80Qbx7WNCxvbA66lu2Uw';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Camel ↔ Snake helpers ──
function toSnake(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k.replace(/([A-Z])/g, '_$1').toLowerCase()] = v;
  }
  return out;
}
function toCamel(obj) {
  if (!obj) return obj;
  if (Array.isArray(obj)) return obj.map(toCamel);
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = v;
  }
  return out;
}

// ── Auth Middleware ──
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized. No token provided.' });
  }
  const userId = authHeader.split(' ')[1];
  const { data: user, error } = await supabase.from('users').select('id, email, name').eq('id', userId).single();
  if (error || !user) {
    return res.status(401).json({ message: 'Unauthorized. Invalid session.' });
  }
  req.userId = userId;
  req.userEmail = user.email;
  next();
}

/* ── AUTH ENDPOINTS ── */

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const { data: existing } = await supabase.from('users').select('id').ilike('email', email).maybeSingle();
    if (existing) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const newUser = {
      id: '_' + Math.random().toString(36).substr(2, 9),
      email, password, name,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('users').insert(newUser);
    if (error) throw error;

    // Seed initial transactions for new users
    await seedDemoData(newUser.id);

    res.status(201).json({
      token: newUser.id,
      user: { id: newUser.id, email: newUser.email, name: newUser.name }
    });
  } catch (e) {
    console.error('Register error:', e.message);
    res.status(500).json({ message: 'Registration failed.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const { data: user, error } = await supabase.from('users').select('*').ilike('email', email).maybeSingle();
    if (error || !user || user.password !== password) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    res.json({
      token: user.id,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (e) {
    console.error('Login error:', e.message);
    res.status(500).json({ message: 'Login failed.' });
  }
});

/* ── TRANSACTION ENDPOINTS ── */

app.get('/api/transactions', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('transactions').select('*').eq('user_id', req.userId).order('date', { ascending: false });
    if (error) throw error;
    res.json(toCamel(data || []));
  } catch (e) {
    console.error('Get transactions error:', e.message);
    res.status(500).json({ message: 'Failed to fetch transactions.' });
  }
});

app.post('/api/transactions', authenticate, async (req, res) => {
  try {
    const { amount, type, category, date, description, sourceBankAccountId } = req.body;
    if (!amount || !type || !category || !date) {
      return res.status(400).json({ message: 'Amount, type, category, and date are required.' });
    }

    let sourceBankName = null;
    if (sourceBankAccountId) {
      const { data: acc } = await supabase.from('bank_accounts')
        .select('*').eq('id', sourceBankAccountId).eq('user_id', req.userId).single();
      if (acc) {
        const delta = type === 'income' ? parseFloat(amount) : -parseFloat(amount);
        const newBalance = +(parseFloat(acc.balance) + delta).toFixed(2);
        await supabase.from('bank_accounts').update({ balance: newBalance }).eq('id', acc.id);
        sourceBankName = acc.bank_name;
      }
    }

    const newTx = {
      id: '_' + Math.random().toString(36).substr(2, 9),
      user_id: req.userId,
      amount: parseFloat(amount), type, category, date,
      description: description || '',
      source_bank_account_id: sourceBankAccountId || null,
      source_bank_name: sourceBankName,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('transactions').insert(newTx);
    if (error) throw error;

    res.status(201).json(toCamel(newTx));
  } catch (e) {
    console.error('Create transaction error:', e.message);
    res.status(500).json({ message: 'Failed to create transaction.' });
  }
});

app.put('/api/transactions/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: existing } = await supabase.from('transactions')
      .select('*').eq('id', id).eq('user_id', req.userId).single();
    if (!existing) return res.status(404).json({ message: 'Transaction not found.' });

    const { amount, type, category, date, description } = req.body;
    const updates = {};
    if (amount !== undefined) updates.amount = parseFloat(amount);
    if (type) updates.type = type;
    if (category) updates.category = category;
    if (date) updates.date = date;
    if (description !== undefined) updates.description = description;

    const { data: updated, error } = await supabase.from('transactions')
      .update(updates).eq('id', id).select().single();
    if (error) throw error;

    res.json(toCamel(updated));
  } catch (e) {
    console.error('Update transaction error:', e.message);
    res.status(500).json({ message: 'Failed to update transaction.' });
  }
});

app.delete('/api/transactions/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: existing } = await supabase.from('transactions')
      .select('id').eq('id', id).eq('user_id', req.userId).single();
    if (!existing) return res.status(404).json({ message: 'Transaction not found.' });

    await supabase.from('transactions').delete().eq('id', id);
    res.json({ message: 'Transaction deleted successfully.' });
  } catch (e) {
    console.error('Delete transaction error:', e.message);
    res.status(500).json({ message: 'Failed to delete transaction.' });
  }
});

/* ── BANK ACCOUNTS ENDPOINTS ── */

const SYNC_TEMPLATES = {
  Checking: {
    income: [
      { category: 'Shopping', desc: ['Direct Deposit - Payroll', 'ACH Credit - Employer', 'Zelle Transfer Received'] },
      { category: 'Shopping', desc: ['Refund - Amazon', 'Cashback Reward', 'Venmo Payment Received'] },
    ],
    expense: [
      { category: 'Food', desc: ['Starbucks', 'Whole Foods', 'Chipotle', 'DoorDash', "Trader Joe's"] },
      { category: 'Housing', desc: ['Rent Payment', 'Mortgage Payment', 'HOA Fee'] },
      { category: 'Utilities', desc: ['Electric Bill', 'Water Utility', 'Internet - Comcast', 'Phone Bill'] },
      { category: 'Entertainment', desc: ['Netflix', 'Spotify', 'Movie Tickets', 'Steam Games'] },
      { category: 'Shopping', desc: ['Uber Ride', 'Gas Station', 'Amazon Purchase', 'Target'] },
      { category: 'Credit Card Payment', desc: ['Credit Card Payment - Capital One', 'Credit Card Payment - Chase', 'CC AutoPay'] },
    ]
  },
  Savings: {
    income: [{ category: 'Shopping', desc: ['Transfer from Checking', 'Interest Payment', 'Savings Goal Deposit'] }],
    expense: [{ category: 'Shopping', desc: ['Transfer to Checking', 'Emergency Withdrawal'] }]
  },
  'Credit Card': {
    income: [{ category: 'Shopping', desc: ['Payment Received - Thank You', 'Statement Credit', 'Cashback Applied'] }],
    expense: [
      { category: 'Food', desc: ['Restaurant - Olive Garden', 'Grubhub Order', 'Coffee Shop'] },
      { category: 'Entertainment', desc: ['Apple TV+', 'Hulu Subscription', 'Concert Tickets'] },
      { category: 'Shopping', desc: ['Apple Store', 'Best Buy', 'Monthly Subscription'] },
    ]
  },
  Investment: {
    income: [{ category: 'Shopping', desc: ['Dividend Payment', 'Capital Gains Distribution', 'Deposit - Investment'] }],
    expense: [{ category: 'Shopping', desc: ['Brokerage Fee', 'Withdrawal - Investment'] }]
  }
};

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randAmount(min, max) { return +(Math.random() * (max - min) + min).toFixed(2); }

function generateSyncTransactions(account, userId) {
  const templates = SYNC_TEMPLATES[account.accountType || account.account_type] || SYNC_TEMPLATES.Checking;
  const count = Math.floor(Math.random() * 3) + 1;
  const today = new Date().toISOString().split('T')[0];
  const txs = [];
  for (let i = 0; i < count; i++) {
    const isIncome = Math.random() < 0.4;
    const pool = isIncome ? templates.income : templates.expense;
    const template = pickRandom(pool);
    const desc = pickRandom(template.desc);
    const amount = isIncome
      ? randAmount((account.accountType || account.account_type) === 'Savings' ? 100 : 200, (account.accountType || account.account_type) === 'Savings' ? 2000 : 5000)
      : randAmount(8, (account.accountType || account.account_type) === 'Housing' ? 2200 : 400);
    txs.push({
      id: '_sync_' + Math.random().toString(36).substr(2, 9),
      user_id: userId, amount,
      type: isIncome ? 'income' : 'expense',
      category: template.category, date: today, description: desc,
      created_at: new Date().toISOString(),
      source_bank_account_id: account.id,
      source_bank_name: account.bank_name || account.bankName
    });
  }
  return txs;
}

app.get('/api/bank-accounts', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('bank_accounts')
      .select('*').eq('user_id', req.userId).order('linked_at', { ascending: false });
    if (error) throw error;
    res.json(toCamel(data || []));
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch bank accounts.' });
  }
});

app.post('/api/bank-accounts', authenticate, async (req, res) => {
  try {
    const { bankName, accountType, accountLast4, balance } = req.body;
    if (!bankName || !accountType || !accountLast4) {
      return res.status(400).json({ message: 'Bank name, account type, and last 4 digits are required.' });
    }
    const newAccount = {
      id: '_ba_' + Math.random().toString(36).substr(2, 9),
      user_id: req.userId,
      bank_name: bankName, account_type: accountType,
      account_last4: String(accountLast4).slice(-4),
      balance: parseFloat(balance) || 0,
      status: 'active',
      linked_at: new Date().toISOString(),
      last_synced_at: null
    };
    const { error } = await supabase.from('bank_accounts').insert(newAccount);
    if (error) throw error;
    res.status(201).json(toCamel(newAccount));
  } catch (e) {
    console.error('Create bank account error:', e.message);
    res.status(500).json({ message: 'Failed to create bank account.' });
  }
});

app.patch('/api/bank-accounts/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { balance } = req.body;
    const updates = {};
    if (balance !== undefined) updates.balance = parseFloat(balance);

    const { data, error } = await supabase.from('bank_accounts')
      .update(updates).eq('id', id).eq('user_id', req.userId).select().single();
    if (error || !data) return res.status(404).json({ message: 'Account not found.' });
    res.json(toCamel(data));
  } catch (e) {
    res.status(500).json({ message: 'Failed to update account.' });
  }
});

app.post('/api/bank-accounts/:id/sync', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: account, error } = await supabase.from('bank_accounts')
      .select('*').eq('id', id).eq('user_id', req.userId).single();
    if (error || !account) return res.status(404).json({ message: 'Account not found.' });

    const newTxs = generateSyncTransactions(account, req.userId);
    if (newTxs.length > 0) await supabase.from('transactions').insert(newTxs);

    const netChange = newTxs.reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount), 0);
    const newBalance = +(parseFloat(account.balance) + netChange).toFixed(2);
    await supabase.from('bank_accounts').update({
      balance: newBalance, last_synced_at: new Date().toISOString()
    }).eq('id', id);

    account.balance = newBalance;
    account.last_synced_at = new Date().toISOString();

    res.json({
      syncedTransactions: toCamel(newTxs),
      account: toCamel(account),
      netChange
    });
  } catch (e) {
    console.error('Sync error:', e.message);
    res.status(500).json({ message: 'Sync failed.' });
  }
});

app.post('/api/bank-accounts/sync-all', authenticate, async (req, res) => {
  try {
    const { data: userAccounts } = await supabase.from('bank_accounts')
      .select('*').eq('user_id', req.userId).eq('status', 'active');
    const allNewTxs = [];

    for (const account of (userAccounts || [])) {
      const newTxs = generateSyncTransactions(account, req.userId);
      if (newTxs.length > 0) await supabase.from('transactions').insert(newTxs);

      const netChange = newTxs.reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount), 0);
      const newBalance = +(parseFloat(account.balance) + netChange).toFixed(2);
      await supabase.from('bank_accounts').update({
        balance: newBalance, last_synced_at: new Date().toISOString()
      }).eq('id', account.id);

      allNewTxs.push(...newTxs);
    }

    const { data: updatedAccounts } = await supabase.from('bank_accounts')
      .select('*').eq('user_id', req.userId);

    res.json({
      syncedTransactions: toCamel(allNewTxs),
      accounts: toCamel(updatedAccounts || []),
      totalNew: allNewTxs.length
    });
  } catch (e) {
    console.error('Sync-all error:', e.message);
    res.status(500).json({ message: 'Sync failed.' });
  }
});

app.delete('/api/bank-accounts/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = await supabase.from('bank_accounts')
      .select('id').eq('id', id).eq('user_id', req.userId).single();
    if (!data) return res.status(404).json({ message: 'Account not found.' });

    await supabase.from('bank_accounts').delete().eq('id', id);
    res.json({ message: 'Account unlinked successfully.' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete account.' });
  }
});

/* ── BUDGET ENDPOINTS ── */

app.get('/api/budgets', authenticate, async (req, res) => {
  try {
    const month = req.query.month;
    let query = supabase.from('budgets').select('*').eq('user_id', req.userId);
    if (month) query = query.eq('month', month);

    const { data: budgets, error } = await query;
    if (error) throw error;

    const spending = {};
    if (month) {
      const { data: txs } = await supabase.from('transactions')
        .select('category, amount').eq('user_id', req.userId)
        .eq('type', 'expense').like('date', month + '%');
      (txs || []).forEach(t => {
        spending[t.category] = (spending[t.category] || 0) + parseFloat(t.amount);
      });
    }

    res.json({ budgets: toCamel(budgets || []), spending });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch budgets.' });
  }
});

app.post('/api/budgets', authenticate, async (req, res) => {
  try {
    const { category, month, amount } = req.body;
    if (!category || !month || amount === undefined) {
      return res.status(400).json({ message: 'Category, month, and amount are required.' });
    }

    // Check for existing
    const { data: existing } = await supabase.from('budgets')
      .select('*').eq('user_id', req.userId).eq('category', category).eq('month', month).maybeSingle();

    if (existing) {
      const { data: updated, error } = await supabase.from('budgets')
        .update({ amount: parseFloat(amount) }).eq('id', existing.id).select().single();
      if (error) throw error;
      return res.json(toCamel(updated));
    }

    const newBudget = {
      id: '_bud_' + Math.random().toString(36).substr(2, 9),
      user_id: req.userId, category, month,
      amount: parseFloat(amount),
      created_at: new Date().toISOString()
    };
    const { error } = await supabase.from('budgets').insert(newBudget);
    if (error) throw error;
    res.status(201).json(toCamel(newBudget));
  } catch (e) {
    console.error('Create budget error:', e.message);
    res.status(500).json({ message: 'Failed to create budget.' });
  }
});

app.put('/api/budgets/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const updates = {};
    if (amount !== undefined) updates.amount = parseFloat(amount);

    const { data, error } = await supabase.from('budgets')
      .update(updates).eq('id', id).eq('user_id', req.userId).select().single();
    if (error || !data) return res.status(404).json({ message: 'Budget not found.' });
    res.json(toCamel(data));
  } catch (e) {
    res.status(500).json({ message: 'Failed to update budget.' });
  }
});

app.delete('/api/budgets/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = await supabase.from('budgets')
      .select('id').eq('id', id).eq('user_id', req.userId).single();
    if (!data) return res.status(404).json({ message: 'Budget not found.' });

    await supabase.from('budgets').delete().eq('id', id);
    res.json({ message: 'Budget deleted.' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete budget.' });
  }
});

/* ── NEWSLETTER / EMAIL SNAPSHOT ── */

app.post('/api/newsletter/send', authenticate, async (req, res) => {
  try {
    const { month, snapshot } = req.body;
    const userEmail = req.userEmail || 'unknown';
    const entry = {
      id: '_nl_' + Date.now(),
      user_id: req.userId, user_email: userEmail,
      month, snapshot, sent_at: new Date().toISOString()
    };
    await supabase.from('newsletter_log').insert(entry);
    console.log('[Newsletter] Sent to ' + userEmail + ' for ' + month);
    res.json({ success: true, message: 'Newsletter snapshot for ' + month + ' sent to ' + userEmail, entry: toCamel(entry) });
  } catch (e) {
    console.error('Newsletter send error:', e.message);
    res.json({ success: false, message: 'Failed to send newsletter.' });
  }
});

app.post('/api/newsletter/schedule', authenticate, (req, res) => {
  const { enabled } = req.body;
  const email = req.userEmail || 'unknown';
  console.log('[Newsletter] Monthly schedule ' + (enabled ? 'enabled' : 'disabled') + ' for ' + email);
  res.json({ success: true, message: 'Monthly newsletter ' + (enabled ? 'scheduled' : 'unscheduled'), enabled });
});

app.get('/api/newsletter/history', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('newsletter_log')
      .select('*').eq('user_id', req.userId).order('sent_at', { ascending: false });
    if (error) throw error;
    res.json(toCamel(data || []));
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch newsletter history.' });
  }
});

/* ── SEED DEMO DATA ── */
async function seedDemoData(userId) {
  try {
    // Check if user already has transactions
    const { data: existing } = await supabase.from('transactions')
      .select('id').eq('user_id', userId).limit(1);
    if (existing && existing.length > 0) return; // Already seeded

    const seed = seedDB;
    if (!seed || !seed.transactions || seed.transactions.length === 0) {
      console.log('[Seed] No seed data available, skipping');
      return;
    }

    // Insert seed transactions with new userId
    const txs = seed.transactions.map(t => ({
      ...toSnake(t),
      id: '_seed_' + Math.random().toString(36).substr(2, 9),
      user_id: userId
    }));
    // Insert in batches of 50
    for (let i = 0; i < txs.length; i += 50) {
      const { error } = await supabase.from('transactions').insert(txs.slice(i, i + 50));
      if (error) console.error('[Seed] Batch insert error:', error.message);
    }
    console.log('[Seed] Demo data loaded for user ' + userId);
  } catch (e) {
    console.error('[Seed] Error:', e.message);
  }
}

// Only listen when running directly (not in serverless)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Ledger API server running on port ${PORT} (Supabase: ${SUPABASE_URL ? 'connected' : 'NOT CONFIGURED'})`);
  });
}

export default app;

import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import {
  Plus, Link2, Unlink, X, Building2, Wallet, CreditCard,
  Landmark, AlertCircle, Check, DollarSign, RefreshCw, Zap, Clock
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const BANK_OPTIONS = [
  'Chase Bank',
  'Bank of America',
  'Wells Fargo',
  'Citibank',
  'Ally Bank',
  'Capital One',
  'US Bank',
  'PNC Bank',
  'Goldman Sachs',
  'Other'
];

const ACCOUNT_TYPES = ['Checking', 'Savings', 'Credit Card', 'Investment'];

const BANK_COLORS = {
  'Chase Bank':      { bg: 'rgba(10, 80, 200, 0.2)',  color: '#4da3ff' },
  'Bank of America': { bg: 'rgba(220, 40, 40, 0.18)', color: '#ff6b6b' },
  'Wells Fargo':     { bg: 'rgba(200, 60, 20, 0.18)', color: '#ff8c42' },
  'Citibank':        { bg: 'rgba(0, 100, 200, 0.18)', color: '#38bdf8' },
  'Ally Bank':       { bg: 'rgba(80, 40, 180, 0.2)',  color: '#c084fc' },
  'Capital One':     { bg: 'rgba(0, 120, 80, 0.18)',  color: '#10d98a' },
  'US Bank':         { bg: 'rgba(0, 60, 160, 0.18)',  color: '#60a5fa' },
  'PNC Bank':        { bg: 'rgba(220, 120, 0, 0.18)', color: '#f59e0b' },
  'Goldman Sachs':   { bg: 'rgba(100, 80, 200, 0.18)',color: '#a78bfa' },
  'Other':           { bg: 'rgba(100, 100, 100, 0.18)',color: '#94a3b8' },
};

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [unlinkConfirm, setUnlinkConfirm] = useState(null);

  // Sync state
  const [syncingIds, setSyncingIds] = useState(new Set());
  const [syncAllLoading, setSyncAllLoading] = useState(false);
  const [toast, setToast] = useState(null); // { message, type: 'success'|'info' }
  const autoSyncRef = useRef(null);
  const AUTO_SYNC_INTERVAL = 60_000; // 60 seconds

  // Form state
  const [bankName, setBankName] = useState(BANK_OPTIONS[0]);
  const [accountType, setAccountType] = useState(ACCOUNT_TYPES[0]);
  const [accountLast4, setAccountLast4] = useState('');
  const [balance, setBalance] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAccounts();
    // Set up auto-sync interval
    autoSyncRef.current = setInterval(() => {
      handleSyncAll(true); // silent=true for auto-sync
    }, AUTO_SYNC_INTERVAL);

    return () => clearInterval(autoSyncRef.current);
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await axios.get('/api/bank-accounts');
      setAccounts(res.data);
    } catch (e) {
      console.error('Failed to load bank accounts', e);
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setBankName(BANK_OPTIONS[0]);
    setAccountType(ACCOUNT_TYPES[0]);
    setAccountLast4('');
    setBalance('');
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!accountLast4 || accountLast4.length !== 4 || !/^\d{4}$/.test(accountLast4)) {
      setFormError('Please enter exactly 4 digits for the account number.');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('/api/bank-accounts', {
        bankName,
        accountType,
        accountLast4,
        balance: parseFloat(balance) || 0
      });
      setShowModal(false);
      fetchAccounts();
    } catch (e) {
      setFormError(e.response?.data?.message || 'Failed to link account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnlink = async (id) => {
    try {
      await axios.delete(`/api/bank-accounts/${id}`);
      setUnlinkConfirm(null);
      fetchAccounts();
    } catch (e) {
      console.error('Failed to unlink account', e);
    }
  };

  // Sync a single bank account
  const handleSync = async (accountId) => {
    setSyncingIds(prev => new Set(prev).add(accountId));
    try {
      const res = await axios.post(`/api/bank-accounts/${accountId}/sync`);
      const { syncedTransactions, account, netChange } = res.data;
      // Update the account in state
      setAccounts(prev => prev.map(a => a.id === account.id ? account : a));
      const sign = netChange >= 0 ? '+' : '';
      showToast(`${account.bankName}: ${syncedTransactions.length} new transaction(s) • Net ${sign}$${netChange.toFixed(2)}`, 'success');
    } catch (e) {
      showToast(`Failed to sync ${accountId}`, 'error');
    } finally {
      setSyncingIds(prev => { const s = new Set(prev); s.delete(accountId); return s; });
    }
  };

  // Sync all accounts
  const handleSyncAll = async (silent = false) => {
    if (accounts.filter(a => a.status === 'active').length === 0) return;
    setSyncAllLoading(true);
    try {
      const res = await axios.post('/api/bank-accounts/sync-all');
      const { syncedTransactions, accounts: updatedAccounts, totalNew } = res.data;
      setAccounts(updatedAccounts);
      if (!silent) {
        showToast(`Synced all accounts: ${totalNew} new transaction(s) imported`, 'success');
      } else if (totalNew > 0) {
        showToast(`Auto-sync: ${totalNew} new transaction(s) from ${updatedAccounts.length} account(s)`, 'info');
      }
    } catch (e) {
      if (!silent) showToast('Failed to sync accounts', 'error');
    } finally {
      setSyncAllLoading(false);
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const activeCount = accounts.filter(a => a.status === 'active').length;

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Topbar title="Ledger — Bank Accounts" />

        <main className="page-body">
          {loading ? (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(139,61,255,0.2)', borderTopColor: 'var(--c-purple)', borderRadius: '50%' }}></div>
            </div>
          ) : (
            <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* KPIs */}
              <section className="kpi-grid">
                <div className="glass kpi-card lift">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '13px', color: 'var(--c-text3)' }}>Linked Accounts</span>
                      <h3 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--ff-brand)', color: '#fff', marginTop: '6px' }}>
                        {activeCount}
                      </h3>
                    </div>
                    <div style={{ background: 'rgba(139, 61, 255, 0.15)', color: 'var(--c-purple3)', padding: '10px', borderRadius: '12px' }}>
                      <Link2 size={20} />
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--c-text3)', marginTop: '14px' }}>
                    Active bank connections
                  </div>
                </div>

                <div className="glass kpi-card lift">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '13px', color: 'var(--c-text3)' }}>Total Linked Balance</span>
                      <h3 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--ff-brand)', color: 'var(--c-green)', marginTop: '6px' }}>
                        ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </h3>
                    </div>
                    <div style={{ background: 'rgba(16, 217, 138, 0.15)', color: 'var(--c-green)', padding: '10px', borderRadius: '12px' }}>
                      <DollarSign size={20} />
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--c-text3)', marginTop: '14px' }}>
                    Combined across all accounts
                  </div>
                </div>

                <div className="glass kpi-card lift" style={{ cursor: 'pointer' }} onClick={openModal}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '13px', color: 'var(--c-text3)' }}>Quick Action</span>
                      <h3 style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'var(--ff-brand)', color: 'var(--c-purple3)', marginTop: '6px' }}>
                        Link New Account
                      </h3>
                    </div>
                    <div style={{ background: 'rgba(139, 61, 255, 0.15)', color: 'var(--c-purple3)', padding: '10px', borderRadius: '12px' }}>
                      <Plus size={20} />
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--c-text3)', marginTop: '14px' }}>
                    Connect a new bank or credit union
                  </div>
                </div>
              </section>

              {/* Accounts Grid */}
              <section className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', fontFamily: 'var(--ff-brand)' }}>
                    Your Accounts
                  </h3>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      className="btn btn-ghost"
                      onClick={() => handleSyncAll(false)}
                      disabled={syncAllLoading || accounts.filter(a => a.status === 'active').length === 0}
                      style={{ fontSize: '12px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <RefreshCw size={14} className={syncAllLoading ? 'animate-spin' : ''} /> Sync All
                    </button>
                    <button className="btn btn-primary" onClick={openModal} style={{ fontSize: '12px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Plus size={14} /> Link Account
                    </button>
                  </div>
                </div>

                {accounts.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">⬡</div>
                    <h4>No Accounts Linked</h4>
                    <p style={{ fontSize: '13px' }}>Connect a bank account to track your net worth in real time.</p>
                    <button className="btn btn-primary" onClick={openModal} style={{ marginTop: '8px' }}>
                      <Plus size={16} /> Link Your First Account
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {accounts.map(acc => {
                      const palette = BANK_COLORS[acc.bankName] || BANK_COLORS['Other'];
                      return (
                        <div
                          key={acc.id}
                          className="lift"
                          style={{
                            background: `linear-gradient(135deg, ${palette.bg}, rgba(0,0,0,0.3))`,
                            border: `1px solid ${palette.color}33`,
                            borderRadius: 'var(--radius-md)',
                            padding: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '14px',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                        >
                          {/* Decorative corner */}
                          <div style={{
                            position: 'absolute', top: '-20px', right: '-20px',
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: `${palette.color}15`
                          }} />

                          {/* Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ background: palette.bg, padding: '8px', borderRadius: '10px', display: 'flex' }}>
                                <Landmark size={18} style={{ color: palette.color }} />
                              </div>
                              <div>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{acc.bankName}</div>
                                <div style={{ fontSize: '11px', color: 'var(--c-text3)' }}>
                                  •••• •••• •••• {acc.accountLast4}
                                </div>
                              </div>
                            </div>
                            <span style={{
                              fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              padding: '3px 8px', borderRadius: '99px',
                              background: acc.status === 'active' ? 'rgba(16, 217, 138, 0.15)' : 'rgba(255, 77, 122, 0.15)',
                              color: acc.status === 'active' ? 'var(--c-green)' : 'var(--c-red)',
                            }}>
                              {acc.status}
                            </span>
                          </div>

                          {/* Type + Balance */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div>
                              <div style={{ fontSize: '11px', color: 'var(--c-text3)', marginBottom: '2px' }}>Account Type</div>
                              <span style={{
                                fontSize: '11px', fontWeight: '600',
                                padding: '3px 8px', borderRadius: '6px',
                                background: 'rgba(255,255,255,0.06)',
                                color: 'var(--c-text2)',
                              }}>
                                {acc.accountType}
                              </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '11px', color: 'var(--c-text3)', marginBottom: '2px' }}>Balance</div>
                              <div style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--ff-brand)', color: '#fff' }}>
                                ${acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                          </div>

                          {/* Linked date + Unlink */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <span style={{ fontSize: '11px', color: 'var(--c-text3)' }}>
                                Linked {new Date(acc.linkedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                              {acc.lastSyncedAt && (
                                <span style={{ fontSize: '10px', color: 'var(--c-text3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Clock size={9} /> Last synced {new Date(acc.lastSyncedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                onClick={() => handleSync(acc.id)}
                                disabled={syncingIds.has(acc.id)}
                                style={{
                                  background: syncingIds.has(acc.id) ? 'rgba(139,61,255,0.2)' : 'rgba(139,61,255,0.15)',
                                  border: 'none', color: 'var(--c-purple3)', cursor: syncingIds.has(acc.id) ? 'wait' : 'pointer',
                                  display: 'flex', alignItems: 'center', gap: '4px',
                                  fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '6px',
                                  transition: 'background 0.2s'
                                }}
                                title="Sync transactions now"
                              >
                                <RefreshCw size={11} className={syncingIds.has(acc.id) ? 'animate-spin' : ''} />
                                {syncingIds.has(acc.id) ? 'Syncing...' : 'Sync'}
                              </button>
                              {unlinkConfirm === acc.id ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '11px', color: 'var(--c-red)' }}>Unlink?</span>
                                  <button
                                    onClick={() => handleUnlink(acc.id)}
                                    style={{ background: 'rgba(255, 77, 122, 0.2)', border: 'none', color: 'var(--c-red)', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}
                                  >
                                    Yes
                                  </button>
                                  <button
                                    onClick={() => setUnlinkConfirm(null)}
                                    style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'var(--c-text3)', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setUnlinkConfirm(acc.id)}
                                  style={{ background: 'transparent', border: 'none', color: 'var(--c-text3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                                  title="Unlink account"
                                >
                                  <Unlink size={12} /> Unlink
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>

      {/* Link Account Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px'
        }}>
          <div className="glass-strong animate-scaleIn" style={{
            width: '100%', maxWidth: '420px', borderRadius: 'var(--radius-xl)',
            padding: '32px', border: '1px solid var(--c-border2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontFamily: 'var(--ff-brand)', fontSize: '20px', fontWeight: '700', color: '#fff' }}>
                Link Bank Account
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--c-text3)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'rgba(255, 77, 122, 0.12)', border: '1px solid rgba(255, 77, 122, 0.25)', borderRadius: 'var(--radius-md)', color: 'var(--c-red)', fontSize: '13px', marginBottom: '16px' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--c-text2)' }}>Bank / Institution</label>
                <select
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--c-border)', color: '#fff', fontSize: '13px', outline: 'none' }}
                >
                  {BANK_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--c-text2)' }}>Account Type</label>
                <select
                  value={accountType}
                  onChange={e => setAccountType(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--c-border)', color: '#fff', fontSize: '13px', outline: 'none' }}
                >
                  {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--c-text2)' }}>Last 4 Digits of Account</label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="e.g. 4821"
                  value={accountLast4}
                  onChange={e => setAccountLast4(e.target.value.replace(/\D/g, ''))}
                  style={{ padding: '10px 14px', letterSpacing: '0.3em', textAlign: 'center', fontSize: '16px', fontWeight: '700' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--c-text2)' }}>Current Balance (optional)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={balance}
                  onChange={e => setBalance(e.target.value)}
                  style={{ padding: '10px 14px' }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {submitting ? 'Linking...' : <><Link2 size={14} /> Link Account</>}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Sync Toast */}
      {toast && (
        <div
          className="animate-fadeIn"
          style={{
            position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '14px 20px', borderRadius: 'var(--radius-md)',
            background: toast.type === 'error'
              ? 'rgba(255, 77, 122, 0.95)'
              : toast.type === 'success'
                ? 'rgba(16, 217, 138, 0.95)'
                : 'rgba(139, 61, 255, 0.95)',
            color: '#fff', fontSize: '13px', fontWeight: '600',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(8px)',
            cursor: 'pointer',
            maxWidth: '360px'
          }}
          onClick={() => setToast(null)}
        >
          {toast.type === 'error' ? <AlertCircle size={16} /> : <Zap size={16} />}
          <span style={{ flex: 1 }}>{toast.message}</span>
          <X size={14} style={{ opacity: 0.7, flexShrink: 0 }} />
        </div>
      )}
    </div>
  );
}

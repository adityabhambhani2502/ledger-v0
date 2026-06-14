import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  ChevronLeft, ChevronRight, BarChart3, TrendingUp, TrendingDown,
  DollarSign, Activity, Flame, Layers, Zap, RotateCcw, Eye,
  Mail, Send, Calendar, Check, X, Bell
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from 'recharts';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';

const ALL_CATEGORIES = ['Food', 'Housing', 'Entertainment', 'Utilities', 'Credit Card Payment', 'Shopping'];

const CAT_HEX = {
  Food: '#f59e0b', Housing: '#8b3dff', Entertainment: '#38bdf8',
  Utilities: '#4f46e5', 'Credit Card Payment': '#ec4899', Shopping: '#7c5cbf',
};
const CAT_BG = {
  Food: 'rgba(245,158,11,0.18)', Housing: 'rgba(139,61,255,0.18)',
  Entertainment: 'rgba(56,189,248,0.18)', Utilities: 'rgba(79,70,229,0.18)',
  'Credit Card Payment': 'rgba(236,72,153,0.18)', Shopping: 'rgba(124,92,191,0.18)',
};

function getMonthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function buildMonthRange(selectedDate, count = 12) {
  const months = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - i, 1);
    months.push({
      key: getMonthKey(d),
      label: d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
    });
  }
  return months;
}

export default function InsightsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeCategories, setActiveCategories] = useState(new Set(ALL_CATEGORIES));

  // Newsletter state
  const [showNewsletter, setShowNewsletter] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [scheduled, setScheduled] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios.get('/api/transactions')
      .then(res => setTransactions(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const months = useMemo(() => buildMonthRange(selectedDate, 12), [selectedDate]);
  const monthKey = getMonthKey(selectedDate);
  const monthLabel = selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const toggleCategory = (cat) => {
    setActiveCategories(prev => {
      if (prev === null) return new Set([cat]);
      const next = new Set(prev);
      if (next.has(cat)) { next.delete(cat); } else { next.add(cat); }
      return next.size === 0 ? null : next;
    });
  };

  const showTotal = () => setActiveCategories(null);
  const selectAll = () => setActiveCategories(new Set(ALL_CATEGORIES));

  const isShowingTotal = activeCategories === null;
  const activeCatsArr = isShowingTotal ? [] : ALL_CATEGORIES.filter(c => activeCategories.has(c));

  const histogramData = useMemo(() => {
    return months.map(m => {
      const txs = transactions.filter(t => t.type === 'expense' && t.date && t.date.startsWith(m.key));
      const row = { label: m.label };
      if (isShowingTotal) {
        row.Total = Math.round(txs.reduce((s, t) => s + t.amount, 0) * 100) / 100;
      } else {
        ALL_CATEGORIES.forEach(cat => {
          row[cat] = Math.round(txs.filter(t => t.category === cat).reduce((s, t) => s + t.amount, 0) * 100) / 100;
        });
      }
      return row;
    });
  }, [transactions, months, isShowingTotal]);

  const trendData = useMemo(() => {
    const range = buildMonthRange(selectedDate, 6);
    return range.map(m => {
      const txs = transactions.filter(t => t.date && t.date.startsWith(m.key));
      const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      return { month: m.label, Income: income, Expenses: expense, Savings: income - expense };
    });
  }, [transactions, selectedDate]);

  const categoryTotals = useMemo(() => {
    const txs = transactions.filter(t => t.type === 'expense' && t.date && t.date.startsWith(monthKey));
    const totals = {};
    txs.forEach(t => { totals[t.category] = (totals[t.category] || 0) + t.amount; });
    return ALL_CATEGORIES.map(cat => ({ name: cat, amount: totals[cat] || 0 })).sort((a, b) => b.amount - a.amount);
  }, [transactions, monthKey]);

  const monthExpenseTxs = transactions.filter(t => t.type === 'expense' && t.date && t.date.startsWith(monthKey));
  const monthIncomeTxs = transactions.filter(t => t.type === 'income' && t.date && t.date.startsWith(monthKey));
  const totalMonthSpend = monthExpenseTxs.reduce((s, t) => s + t.amount, 0);
  const totalMonthIncome = monthIncomeTxs.reduce((s, t) => s + t.amount, 0);
  const netSavings = totalMonthIncome - totalMonthSpend;
  const topCategory = categoryTotals[0]?.amount > 0 ? categoryTotals[0].name : '—';

  const prevMonth = () => setSelectedDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setSelectedDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  // Send newsletter
  const sendNewsletter = async () => {
    setSending(true);
    setSendResult(null);
    try {
      const snapshot = {
        monthLabel, totalIncome: totalMonthIncome, totalExpenses: totalMonthSpend,
        netSavings, topCategory, categoryTotals: categoryTotals.filter(c => c.amount > 0),
        transactionCount: monthExpenseTxs.length + monthIncomeTxs.length,
      };
      await axios.post('/api/newsletter/send', { month: monthKey, snapshot });
      setSendResult({ success: true, message: `Newsletter for ${monthLabel} sent to ${user?.email || 'your email'}` });
    } catch (e) {
      setSendResult({ success: false, message: 'Failed to send newsletter. Please try again.' });
    }
    setSending(false);
  };

  const toggleSchedule = async () => {
    const next = !scheduled;
    setScheduled(next);
    try { await axios.post('/api/newsletter/schedule', { enabled: next }); } catch (e) { /* silent */ }
  };

  const overlayStyle = { position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', padding: '24px' };
  const modalStyle = { width: '100%', maxWidth: '560px', maxHeight: '85vh', background: '#0d0620', border: '1px solid rgba(139,61,255,0.25)', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' };

  const fmtTick = (v) => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : '$' + v;

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Topbar title="Insights — Deep Analytics" />

        <main className="page-body">
          {loading ? (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(139,61,255,0.2)', borderTopColor: 'var(--c-purple)', borderRadius: '50%' }} />
            </div>
          ) : (
            <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* Newsletter Modal */}
              {showNewsletter && (
                <div style={overlayStyle} onClick={() => { setShowNewsletter(false); setSendResult(null); }}>
                  <div style={modalStyle} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid rgba(139,61,255,0.15)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Mail size={20} style={{ color: 'var(--c-purple3)' }} />
                        <span style={{ fontFamily: 'var(--ff-brand)', fontWeight: '800', fontSize: '18px', color: '#fff' }}>Monthly Insights Newsletter</span>
                      </div>
                      <button onClick={() => { setShowNewsletter(false); setSendResult(null); }} style={{ background: 'none', border: 'none', color: 'var(--c-text3)', cursor: 'pointer', padding: '4px' }}><X size={20} /></button>
                    </div>

                    <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                      {/* Newsletter preview card */}
                      <div style={{ background: 'rgba(139,61,255,0.06)', border: '1px solid rgba(139,61,255,0.15)', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(139,61,255,0.12)' }}>
                          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--c-purple3)', marginBottom: '6px' }}>Ledger Finance</div>
                          <h4 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', fontFamily: 'var(--ff-brand)' }}>{monthLabel}</h4>
                          <p style={{ fontSize: '12px', color: 'var(--c-text3)', marginTop: '4px' }}>Your Monthly Financial Snapshot</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                          <div style={{ textAlign: 'center', padding: '12px 8px', background: 'rgba(16,217,138,0.08)', borderRadius: '8px', border: '1px solid rgba(16,217,138,0.15)' }}>
                            <div style={{ fontSize: '10px', color: 'var(--c-text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Income</div>
                            <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--c-green)', fontFamily: 'var(--ff-brand)', marginTop: '4px' }}>
                              +${totalMonthIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </div>
                          </div>
                          <div style={{ textAlign: 'center', padding: '12px 8px', background: 'rgba(255,77,122,0.08)', borderRadius: '8px', border: '1px solid rgba(255,77,122,0.15)' }}>
                            <div style={{ fontSize: '10px', color: 'var(--c-text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expenses</div>
                            <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--c-red)', fontFamily: 'var(--ff-brand)', marginTop: '4px' }}>
                              -${totalMonthSpend.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </div>
                          </div>
                          <div style={{ textAlign: 'center', padding: '12px 8px', background: 'rgba(139,61,255,0.08)', borderRadius: '8px', border: '1px solid rgba(139,61,255,0.15)' }}>
                            <div style={{ fontSize: '10px', color: 'var(--c-text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net Savings</div>
                            <div style={{ fontSize: '16px', fontWeight: '800', color: netSavings >= 0 ? 'var(--c-green)' : 'var(--c-red)', fontFamily: 'var(--ff-brand)', marginTop: '4px' }}>
                              ${netSavings.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'rgba(139,61,255,0.08)', borderRadius: '8px', marginBottom: '16px' }}>
                          <Flame size={16} style={{ color: 'var(--c-amber)' }} />
                          <span style={{ fontSize: '12px', color: 'var(--c-text2)' }}>Top spending category:</span>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: CAT_HEX[topCategory] || '#fff' }}>{topCategory}</span>
                          <span style={{ fontSize: '12px', color: 'var(--c-text3)' }}>(${categoryTotals[0]?.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })})</span>
                        </div>

                        <div style={{ fontSize: '11px', color: 'var(--c-text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Category Breakdown</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {categoryTotals.filter(c => c.amount > 0).map(cat => {
                            const totalAll = categoryTotals.reduce((s, c) => s + c.amount, 0);
                            const share = totalAll > 0 ? (cat.amount / totalAll) * 100 : 0;
                            return (
                              <div key={cat.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: CAT_HEX[cat.name] || '#7c5cbf' }} />
                                  <span style={{ fontSize: '12px', color: 'var(--c-text2)', fontWeight: '500' }}>{cat.name}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <span style={{ fontSize: '12px', color: '#fff', fontWeight: '700' }}>${cat.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                  <span style={{ fontSize: '10px', color: 'var(--c-text3)', minWidth: '36px', textAlign: 'right' }}>{share.toFixed(1)}%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(139,61,255,0.12)', textAlign: 'center' }}>
                          <p style={{ fontSize: '10px', color: 'var(--c-text3)' }}>Generated by Ledger Finance &bull; {monthExpenseTxs.length + monthIncomeTxs.length} transactions recorded</p>
                        </div>
                      </div>

                      {/* Schedule toggle */}
                      <div
                        onClick={toggleSchedule}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '14px 16px', borderRadius: '10px', cursor: 'pointer',
                          background: scheduled ? 'rgba(139,61,255,0.12)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${scheduled ? 'rgba(139,61,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                          transition: 'all 0.2s', marginBottom: '16px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Calendar size={16} style={{ color: scheduled ? 'var(--c-purple3)' : 'var(--c-text3)' }} />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: scheduled ? '#fff' : 'var(--c-text2)' }}>Schedule Monthly Newsletter</div>
                            <div style={{ fontSize: '11px', color: 'var(--c-text3)' }}>Auto-send a snapshot on the last day of each month</div>
                          </div>
                        </div>
                        <div style={{
                          width: '40px', height: '22px', borderRadius: '11px',
                          background: scheduled ? 'var(--c-purple)' : 'rgba(255,255,255,0.1)',
                          position: 'relative', transition: 'background 0.2s',
                        }}>
                          <div style={{
                            width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                            position: 'absolute', top: '2px',
                            left: scheduled ? '20px' : '2px', transition: 'left 0.2s',
                          }} />
                        </div>
                      </div>

                      {sendResult && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
                          background: sendResult.success ? 'rgba(16,217,138,0.1)' : 'rgba(255,77,122,0.1)',
                          border: `1px solid ${sendResult.success ? 'rgba(16,217,138,0.25)' : 'rgba(255,77,122,0.25)'}`,
                          borderRadius: '8px', marginBottom: '12px',
                        }}>
                          {sendResult.success ? <Check size={16} style={{ color: 'var(--c-green)' }} /> : <X size={16} style={{ color: 'var(--c-red)' }} />}
                          <span style={{ fontSize: '12px', color: sendResult.success ? 'var(--c-green)' : 'var(--c-red)' }}>{sendResult.message}</span>
                        </div>
                      )}
                    </div>

                    <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(139,61,255,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--c-text3)' }}>
                        <Mail size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        Sending to {user?.email || 'your email'}
                      </span>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => { setShowNewsletter(false); setSendResult(null); }} className="btn btn-ghost" style={{ fontSize: '13px', padding: '10px 18px' }}>Close</button>
                        <button
                          onClick={sendNewsletter}
                          disabled={sending}
                          className="btn btn-primary"
                          style={{ fontSize: '13px', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          {sending ? (
                            <><div className="animate-spin" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} /> Sending...</>
                          ) : (
                            <><Send size={14} /> Send Snapshot</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Month Selector + Email Icon */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                <button onClick={prevMonth} className="btn btn-ghost btn-icon"><ChevronLeft size={18} /></button>
                <h2 style={{ fontFamily: 'var(--ff-brand)', fontSize: '22px', fontWeight: '800', color: '#fff', minWidth: '220px', textAlign: 'center' }}>
                  {monthLabel}
                </h2>
                <button onClick={nextMonth} className="btn btn-ghost btn-icon"><ChevronRight size={18} /></button>
                <button
                  onClick={() => setShowNewsletter(true)}
                  title="Email monthly insights snapshot"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: 'rgba(139,61,255,0.12)', border: '1px solid rgba(139,61,255,0.25)',
                    color: 'var(--c-purple3)', cursor: 'pointer', transition: 'all 0.2s', marginLeft: '8px',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,61,255,0.25)'; e.currentTarget.style.borderColor = 'rgba(139,61,255,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,61,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(139,61,255,0.25)'; }}
                >
                  <Mail size={18} />
                </button>
              </div>

              {/* KPI Cards */}
              <section className="kpi-grid">
                <div className="glass kpi-card lift">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '13px', color: 'var(--c-text3)' }}>Monthly Outflow</span>
                      <h3 style={{ fontSize: '26px', fontWeight: '800', fontFamily: 'var(--ff-brand)', color: 'var(--c-red)', marginTop: '6px' }}>
                        -${totalMonthSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </h3>
                    </div>
                    <div style={{ background: 'rgba(255,77,122,0.15)', color: 'var(--c-red)', padding: '10px', borderRadius: '12px' }}>
                      <TrendingDown size={20} />
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--c-text3)', marginTop: '14px' }}>
                    {monthExpenseTxs.length} expense transaction{monthExpenseTxs.length !== 1 ? 's' : ''} this month
                  </div>
                </div>

                <div className="glass kpi-card lift">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '13px', color: 'var(--c-text3)' }}>Monthly Inflow</span>
                      <h3 style={{ fontSize: '26px', fontWeight: '800', fontFamily: 'var(--ff-brand)', color: 'var(--c-green)', marginTop: '6px' }}>
                        +${totalMonthIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </h3>
                    </div>
                    <div style={{ background: 'rgba(16,217,138,0.15)', color: 'var(--c-green)', padding: '10px', borderRadius: '12px' }}>
                      <TrendingUp size={20} />
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--c-text3)', marginTop: '14px' }}>
                    Net: <span style={{ color: netSavings >= 0 ? 'var(--c-green)' : 'var(--c-red)', fontWeight: '700' }}>
                      ${netSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="glass kpi-card lift">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '13px', color: 'var(--c-text3)' }}>Top Category</span>
                      <h3 style={{ fontSize: '22px', fontWeight: '800', fontFamily: 'var(--ff-brand)', color: CAT_HEX[topCategory] || '#fff', marginTop: '6px' }}>
                        {topCategory}
                      </h3>
                    </div>
                    <div style={{ background: 'rgba(139,61,255,0.15)', color: 'var(--c-purple3)', padding: '10px', borderRadius: '12px' }}>
                      <Flame size={20} />
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--c-text3)', marginTop: '14px' }}>
                    ${categoryTotals[0]?.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} spent this month
                  </div>
                </div>
              </section>

              {/* Histogram */}
              <section className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', fontFamily: 'var(--ff-brand)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BarChart3 size={18} style={{ color: 'var(--c-purple3)' }} />
                      Monthly Spending — Last 12 Months
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--c-text3)', marginTop: '4px' }}>
                      {isShowingTotal ? 'Showing total spending across all categories' : `Showing ${activeCatsArr.length} selected categor${activeCatsArr.length !== 1 ? 'ies' : 'y'}`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={showTotal} disabled={isShowingTotal} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 13px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: `1px solid ${isShowingTotal ? 'rgba(139,61,255,0.4)' : 'rgba(255,255,255,0.12)'}`, background: isShowingTotal ? 'rgba(139,61,255,0.18)' : 'transparent', color: isShowingTotal ? '#c084fc' : 'var(--c-text3)', opacity: isShowingTotal ? 1 : 0.8, transition: 'all 0.2s' }}>
                      <Eye size={12} /> Show Total
                    </button>
                    <button onClick={selectAll} disabled={!isShowingTotal && activeCatsArr.length === ALL_CATEGORIES.length} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 13px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'var(--c-text3)', transition: 'all 0.2s' }}>
                      <RotateCcw size={12} /> Reset All
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                  {ALL_CATEGORIES.map(cat => {
                    const isActive = !isShowingTotal && activeCategories.has(cat);
                    const catTotal = categoryTotals.find(c => c.name === cat)?.amount || 0;
                    return (
                      <button key={cat} onClick={() => toggleCategory(cat)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '99px', border: `1px solid ${isActive ? CAT_HEX[cat] : 'rgba(255,255,255,0.08)'}`, background: isActive ? CAT_BG[cat] : 'transparent', color: isActive ? CAT_HEX[cat] : 'var(--c-text3)', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s ease', opacity: isActive ? 1 : 0.45 }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: CAT_HEX[cat], opacity: isActive ? 1 : 0.35 }} />
                        {cat}
                        {catTotal > 0 && <span style={{ fontSize: '10px', fontWeight: '700', opacity: 0.75 }}>${catTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>}
                      </button>
                    );
                  })}
                </div>

                <div style={{ width: '100%', height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={histogramData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100,40,200,0.12)" />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#8b6ab5' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#8b6ab5' }} tickFormatter={fmtTick} />
                      <Tooltip formatter={(value, name) => [`$${Number(value).toFixed(2)}`, name]} contentStyle={{ background: 'rgba(20,5,50,0.95)', border: '1px solid rgba(139,61,255,0.3)', borderRadius: '10px', fontSize: '12px', color: '#f0e6ff', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }} cursor={{ fill: 'rgba(139,61,255,0.06)' }} />
                      {isShowingTotal ? (
                        <Bar dataKey="Total" fill="#7c5cbf" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                      ) : (
                        activeCatsArr.map(cat => <Bar key={cat} dataKey={cat} stackId="stack" fill={CAT_HEX[cat]} isAnimationActive={false} />)
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Trend + Category Rank */}
              <section className="chart-grid">
                <div className="glass chart-card">
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', fontFamily: 'var(--ff-brand)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={16} style={{ color: 'var(--c-amber)' }} />
                    6-Month Cash Flow Trend
                  </h3>
                  <div style={{ width: '100%', height: '260px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100,40,200,0.12)" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8b6ab5' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#8b6ab5' }} tickFormatter={fmtTick} />
                        <Tooltip formatter={(value, name) => [`$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, name]} contentStyle={{ background: 'rgba(20,5,50,0.95)', border: '1px solid rgba(139,61,255,0.3)', borderRadius: '10px', fontSize: '12px', color: '#f0e6ff', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }} />
                        <Legend wrapperStyle={{ fontSize: '11px', color: '#8b6ab5' }} />
                        <Line type="monotone" dataKey="Income" stroke="#10d98a" strokeWidth={2} dot={{ r: 3, fill: '#10d98a' }} isAnimationActive={false} />
                        <Line type="monotone" dataKey="Expenses" stroke="#ff4d7a" strokeWidth={2} dot={{ r: 3, fill: '#ff4d7a' }} isAnimationActive={false} />
                        <Line type="monotone" dataKey="Savings" stroke="#8b3dff" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: '#8b3dff' }} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass chart-card">
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', fontFamily: 'var(--ff-brand)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Flame size={16} style={{ color: 'var(--c-red)' }} />
                    Category Breakdown — {monthLabel}
                  </h3>
                  {categoryTotals.every(c => c.amount === 0) ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text3)', gap: '8px', height: '260px' }}>
                      <Layers size={28} />
                      <span style={{ fontSize: '13px' }}>No expenses this month yet</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {categoryTotals.filter(c => c.amount > 0).map(cat => {
                        const maxAmt = categoryTotals.find(c => c.amount > 0)?.amount || 1;
                        const pct = (cat.amount / maxAmt) * 100;
                        const hex = CAT_HEX[cat.name] || '#7c5cbf';
                        const totalAll = categoryTotals.reduce((s, c) => s + c.amount, 0);
                        const share = totalAll > 0 ? (cat.amount / totalAll) * 100 : 0;
                        return (
                          <div key={cat.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: hex, flexShrink: 0 }} />
                                <span style={{ color: 'var(--c-text2)', fontWeight: '600' }}>{cat.name}</span>
                              </div>
                              <span style={{ color: '#fff', fontWeight: '700' }}>
                                ${cat.amount.toFixed(2)}
                                <span style={{ color: 'var(--c-text3)', fontWeight: '400', marginLeft: '6px', fontSize: '10px' }}>{share.toFixed(1)}%</span>
                              </span>
                            </div>
                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: '99px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, borderRadius: '99px', background: `linear-gradient(90deg, ${hex}, ${hex}88)`, transition: 'width 0.5s ease' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>

              {/* Monthly Income vs Expenses */}
              <section className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', fontFamily: 'var(--ff-brand)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DollarSign size={16} style={{ color: 'var(--c-green)' }} />
                  Monthly Income vs Expenses (6 Months)
                </h3>
                <div style={{ width: '100%', height: '260px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100,40,200,0.12)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8b6ab5' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#8b6ab5' }} tickFormatter={fmtTick} />
                      <Tooltip formatter={(value, name) => [`$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, name]} contentStyle={{ background: 'rgba(20,5,50,0.95)', border: '1px solid rgba(139,61,255,0.3)', borderRadius: '10px', fontSize: '12px', color: '#f0e6ff', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }} />
                      <Legend wrapperStyle={{ fontSize: '11px', color: '#8b6ab5' }} />
                      <Bar dataKey="Income" fill="#10d98a" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                      <Bar dataKey="Expenses" fill="#ff4d7a" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}

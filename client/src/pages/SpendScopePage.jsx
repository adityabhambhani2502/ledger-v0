import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  Plus, X, AlertTriangle, Check, Trash2, Edit2,
  ChevronLeft, ChevronRight, Target, TrendingDown,
  ShieldAlert, DollarSign, PieChart
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const CATEGORIES = ['Food', 'Housing', 'Entertainment', 'Utilities', 'Credit Card Payment', 'Shopping'];

const CAT_META = {
  Food:          { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  Housing:       { color: '#8b3dff', bg: 'rgba(139, 61, 255, 0.15)' },
  Entertainment: { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' },
  Utilities:     { color: '#4f46e5', bg: 'rgba(79, 70, 229, 0.15)' },
  'Credit Card Payment': { color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' },
  Shopping: { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' },
};

function getMonthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function getMonthLabel(d) {
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export default function SpendScopePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [budgets, setBudgets] = useState([]);
  const [spending, setSpending] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editBudget, setEditBudget] = useState(null);

  // Form state
  const [formCategory, setFormCategory] = useState(CATEGORIES[0]);
  const [formAmount, setFormAmount] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const monthKey = getMonthKey(selectedDate);
  const monthLabel = getMonthLabel(selectedDate);

  useEffect(() => {
    fetchData();
  }, [monthKey]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/budgets?month=${monthKey}`);
      setBudgets(res.data.budgets);
      setSpending(res.data.spending || {});
    } catch (e) {
      console.error('Failed to load budgets', e);
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => {
    setSelectedDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setSelectedDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const openCreateModal = () => {
    setEditBudget(null);
    setFormCategory(CATEGORIES[0]);
    setFormAmount('');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (b) => {
    setEditBudget(b);
    setFormCategory(b.category);
    setFormAmount(b.amount.toString());
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formAmount || parseFloat(formAmount) <= 0) {
      setFormError('Please enter a valid budget amount.');
      return;
    }
    setSubmitting(true);
    try {
      if (editBudget) {
        await axios.put(`/api/budgets/${editBudget.id}`, { amount: parseFloat(formAmount) });
      } else {
        await axios.post('/api/budgets', { category: formCategory, month: monthKey, amount: parseFloat(formAmount) });
      }
      setShowModal(false);
      fetchData();
    } catch (e) {
      setFormError(e.response?.data?.message || 'Failed to save budget.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/budgets/${id}`);
      fetchData();
    } catch (e) {
      console.error('Failed to delete budget', e);
    }
  };

  // Computed stats
  const stats = useMemo(() => {
    let totalBudgeted = 0;
    let totalSpent = 0;
    let alertCount = 0;
    const rows = CATEGORIES.map(cat => {
      const budget = budgets.find(b => b.category === cat);
      const budgetAmt = budget ? budget.amount : 0;
      const spent = spending[cat] || 0;
      totalBudgeted += budgetAmt;
      totalSpent += spent;
      const pct = budgetAmt > 0 ? (spent / budgetAmt) * 100 : 0;
      let status = 'ok';
      if (pct >= 100) { status = 'exceeded'; alertCount++; }
      else if (pct >= 80) { status = 'warning'; alertCount++; }
      return { cat, budget, budgetAmt, spent, pct, status };
    });
    return { totalBudgeted, totalSpent, remaining: totalBudgeted - totalSpent, alertCount, rows };
  }, [budgets, spending]);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Topbar title="SpendScope" />

        <main className="page-body">
          {loading ? (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(139,61,255,0.2)', borderTopColor: 'var(--c-purple)', borderRadius: '50%' }}></div>
            </div>
          ) : (
            <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* Month Selector */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                <button onClick={prevMonth} className="btn btn-ghost btn-icon"><ChevronLeft size={18} /></button>
                <h2 style={{ fontFamily: 'var(--ff-brand)', fontSize: '22px', fontWeight: '800', color: '#fff', minWidth: '200px', textAlign: 'center' }}>
                  {monthLabel}
                </h2>
                <button onClick={nextMonth} className="btn btn-ghost btn-icon"><ChevronRight size={18} /></button>
              </div>

              {/* Alerts banner */}
              {stats.alertCount > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px',
                  background: 'rgba(255, 77, 122, 0.1)', border: '1px solid rgba(255, 77, 122, 0.25)',
                  borderRadius: 'var(--radius-md)', color: 'var(--c-red)', fontSize: '13px', fontWeight: '600'
                }}>
                  <ShieldAlert size={18} />
                  <span>{stats.alertCount} categor{stats.alertCount === 1 ? 'y' : 'ies'} approaching or over budget this month</span>
                </div>
              )}

              {/* KPIs */}
              <section className="kpi-grid">
                <div className="glass kpi-card lift">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '13px', color: 'var(--c-text3)' }}>Total Budgeted</span>
                      <h3 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--ff-brand)', color: '#fff', marginTop: '6px' }}>
                        ${stats.totalBudgeted.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </h3>
                    </div>
                    <div style={{ background: 'rgba(139, 61, 255, 0.15)', color: 'var(--c-purple3)', padding: '10px', borderRadius: '12px' }}>
                      <Target size={20} />
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--c-text3)', marginTop: '14px' }}>
                    Across {budgets.length} categor{budgets.length === 1 ? 'y' : 'ies'}
                  </div>
                </div>

                <div className="glass kpi-card lift">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '13px', color: 'var(--c-text3)' }}>Total Spent</span>
                      <h3 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--ff-brand)', color: stats.totalSpent > stats.totalBudgeted ? 'var(--c-red)' : 'var(--c-amber)', marginTop: '6px' }}>
                        ${stats.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </h3>
                    </div>
                    <div style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--c-amber)', padding: '10px', borderRadius: '12px' }}>
                      <TrendingDown size={20} />
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--c-text3)', marginTop: '14px' }}>
                    {stats.totalBudgeted > 0 ? `${Math.min(100, ((stats.totalSpent / stats.totalBudgeted) * 100)).toFixed(0)}% of total budget used` : 'No budgets set'}
                  </div>
                </div>

                <div className="glass kpi-card lift">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '13px', color: 'var(--c-text3)' }}>Remaining</span>
                      <h3 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--ff-brand)', color: stats.remaining >= 0 ? 'var(--c-green)' : 'var(--c-red)', marginTop: '6px' }}>
                        {stats.remaining >= 0 ? '' : '-'}${Math.abs(stats.remaining).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </h3>
                    </div>
                    <div style={{ background: stats.remaining >= 0 ? 'rgba(16, 217, 138, 0.15)' : 'rgba(255, 77, 122, 0.15)', color: stats.remaining >= 0 ? 'var(--c-green)' : 'var(--c-red)', padding: '10px', borderRadius: '12px' }}>
                      <DollarSign size={20} />
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--c-text3)', marginTop: '14px' }}>
                    {stats.remaining >= 0 ? 'Safe to spend' : 'Over budget!'}
                  </div>
                </div>
              </section>

              {/* Budget Cards */}
              <section className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', fontFamily: 'var(--ff-brand)' }}>
                    Category Budgets
                  </h3>
                  <button className="btn btn-primary" onClick={openCreateModal} style={{ fontSize: '12px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={14} /> Set Budget
                  </button>
                </div>

                {stats.rows.every(r => r.budgetAmt === 0) ? (
                  <div className="empty-state">
                    <div className="empty-icon">⬡</div>
                    <h4>No Budgets Set for {monthLabel}</h4>
                    <p style={{ fontSize: '13px' }}>Create spending limits per category to stay on track.</p>
                    <button className="btn btn-primary" onClick={openCreateModal} style={{ marginTop: '8px' }}>
                      <Plus size={16} /> Create First Budget
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {stats.rows.map(({ cat, budget, budgetAmt, spent, pct, status }) => {
                      if (budgetAmt === 0 && spent === 0) return null;
                      const meta = CAT_META[cat] || CAT_META.Other;
                      const clampedPct = Math.min(pct, 100);
                      const barColor = status === 'exceeded' ? 'var(--c-red)' : status === 'warning' ? 'var(--c-amber)' : meta.color;
                      const remaining = budgetAmt - spent;

                      return (
                        <div key={cat} style={{
                          background: 'rgba(255,255,255,0.02)', border: `1px solid ${status === 'exceeded' ? 'rgba(255,77,122,0.3)' : status === 'warning' ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.06)'}`,
                          borderRadius: 'var(--radius-md)', padding: '18px 20px'
                        }}>
                          {/* Header row */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{cat}</span>
                              {status === 'exceeded' && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '700', color: 'var(--c-red)', background: 'rgba(255,77,122,0.12)', padding: '2px 8px', borderRadius: '99px' }}>
                                  <AlertTriangle size={10} /> OVER BUDGET
                                </span>
                              )}
                              {status === 'warning' && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '700', color: 'var(--c-amber)', background: 'rgba(245,158,11,0.12)', padding: '2px 8px', borderRadius: '99px' }}>
                                  <AlertTriangle size={10} /> APPROACHING LIMIT
                                </span>
                              )}
                              {status === 'ok' && budgetAmt > 0 && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '700', color: 'var(--c-green)', background: 'rgba(16,217,138,0.1)', padding: '2px 8px', borderRadius: '99px' }}>
                                  <Check size={10} /> ON TRACK
                                </span>
                              )}
                            </div>
                            {budget && (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button onClick={() => openEditModal(budget)} className="btn btn-ghost btn-icon" title="Edit budget"><Edit2 size={13} /></button>
                                <button onClick={() => handleDelete(budget.id)} className="btn btn-danger btn-icon" title="Remove budget"><Trash2 size={13} /></button>
                              </div>
                            )}
                          </div>

                          {/* Progress bar */}
                          <div style={{ height: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '99px', overflow: 'hidden', marginBottom: '10px' }}>
                            <div style={{
                              height: '100%', width: `${clampedPct}%`, borderRadius: '99px',
                              background: barColor, transition: 'width 0.6s ease'
                            }} />
                          </div>

                          {/* Stats row */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                            <span style={{ color: 'var(--c-text3)' }}>
                              <strong style={{ color: '#fff' }}>${spent.toFixed(2)}</strong> of ${budgetAmt > 0 ? budgetAmt.toFixed(2) : '—'} spent
                              <span style={{ marginLeft: '8px', color: meta.color, fontWeight: '600' }}>({pct.toFixed(0)}%)</span>
                            </span>
                            {budgetAmt > 0 && (
                              <span style={{ color: remaining >= 0 ? 'var(--c-green)' : 'var(--c-red)', fontWeight: '600' }}>
                                {remaining >= 0 ? `$${remaining.toFixed(2)} left` : `-$${Math.abs(remaining).toFixed(2)} over`}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Uncategorized spending note */}
              {Object.keys(spending).some(k => !CATEGORIES.includes(k) || !stats.rows.find(r => r.cat === k && r.budgetAmt > 0)) && (
                <div style={{ padding: '12px 16px', background: 'rgba(139,61,255,0.06)', border: '1px solid rgba(139,61,255,0.15)', borderRadius: 'var(--radius-md)', fontSize: '12px', color: 'var(--c-text3)' }}>
                  💡 Transactions are automatically categorized by their assigned category. Set budgets above to track spending limits.
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Budget Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px'
        }}>
          <div className="glass-strong animate-scaleIn" style={{
            width: '100%', maxWidth: '400px', borderRadius: 'var(--radius-xl)',
            padding: '32px', border: '1px solid var(--c-border2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontFamily: 'var(--ff-brand)', fontSize: '20px', fontWeight: '700', color: '#fff' }}>
                {editBudget ? 'Edit Budget' : 'Set Monthly Budget'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--c-text3)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'rgba(255, 77, 122, 0.12)', border: '1px solid rgba(255, 77, 122, 0.25)', borderRadius: 'var(--radius-md)', color: 'var(--c-red)', fontSize: '13px', marginBottom: '16px' }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--c-text2)' }}>Category</label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value)}
                  disabled={!!editBudget}
                  style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--c-border)', color: '#fff', fontSize: '13px', outline: 'none' }}
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--c-text2)' }}>
                  Monthly Limit ($) <span style={{ color: 'var(--c-text3)', fontWeight: '400' }}>for {monthLabel}</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 500"
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value)}
                  style={{ padding: '10px 14px', fontSize: '16px', fontWeight: '700' }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {submitting ? 'Saving...' : <><Target size={14} /> {editBudget ? 'Update Budget' : 'Set Budget'}</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

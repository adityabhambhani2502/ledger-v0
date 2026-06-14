import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  TrendingUp, TrendingDown, DollarSign, Plus, ArrowUpRight,
  ShoppingBag, Home, Coffee, AlertCircle, Compass, Layers
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const CATEGORY_COLORS = {
  Food: 'var(--c-amber)',
  Housing: 'var(--c-purple)',
  Entertainment: 'var(--c-blue)',
  Utilities: 'var(--c-indigo)',
  Shopping: 'var(--c-muted)',
  'Credit Card Payment': '#ec4899',
};

// Resolved hex colors for Recharts (can't use CSS vars)
const CATEGORY_HEX = {
  Food: '#f59e0b',
  Housing: '#8b3dff',
  Entertainment: '#38bdf8',
  Utilities: '#4f46e5',
  Shopping: '#7c5cbf',
  'Credit Card Payment': '#ec4899',
};

// Custom donut tooltip — renders nothing; just calls back with hovered data
function DonutTooltip({ active, payload, onHover }) {
  useEffect(() => {
    if (onHover) {
      onHover(active && payload && payload.length ? payload[0] : null);
    }
  }, [active, payload]);
  return null;
}

export default function DashboardPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredSlice, setHoveredSlice] = useState(null);

  const handleSliceHover = useCallback((payload) => {
    setHoveredSlice(payload);
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('/api/transactions');
      setTransactions(response.data);
    } catch (e) {
      console.error('Failed to load transactions', e);
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const incomeTxs = transactions.filter(t => t.type === 'income');
  const expenseTxs = transactions.filter(t => t.type === 'expense');

  const totalIncome = incomeTxs.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenseTxs.reduce((sum, t) => sum + t.amount, 0);
  const netWorth = totalIncome - totalExpense;

  // Categories spending
  const categoryTotals = {};
  expenseTxs.forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });

  const categoryProgress = Object.keys(categoryTotals).map(cat => ({
    name: cat,
    amount: categoryTotals[cat],
    percent: totalExpense > 0 ? (categoryTotals[cat] / totalExpense) * 100 : 0
  })).sort((a,b) => b.amount - a.amount);

  // Chart data: Group by month — show cumulative savings at end of each month
  const getChartData = () => {
    const months = [];
    const now = new Date();
    // Generate last 6 months (including current)
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth(); // 0-indexed
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
      months.push({ key, label, year, month, income: 0, expenses: 0 });
    }

    // Bucket transactions into their month
    transactions.forEach(t => {
      if (!t.date) return;
      const txKey = t.date.substring(0, 7); // YYYY-MM
      const bucket = months.find(m => m.key === txKey);
      if (bucket) {
        if (t.type === 'income') bucket.income += t.amount;
        else bucket.expenses += t.amount;
      }
    });

    // Compute cumulative savings (running balance) at end of each month
    let cumulative = 0;
    return months.map(m => {
      cumulative += m.income - m.expenses;
      return {
        date: m.label,
        Savings: cumulative,
      };
    });
  };

  const chartData = getChartData();

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Topbar title="Ledger Dashboard" />

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
                      <span style={{ fontSize: '13px', color: 'var(--c-text3)' }}>Net Liquid Worth</span>
                      <h3 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--ff-brand)', color: '#fff', marginTop: '6px' }}>
                        ${netWorth.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </h3>
                    </div>
                    <div style={{ background: 'rgba(139, 61, 255, 0.15)', color: 'var(--c-purple3)', padding: '10px', borderRadius: '12px' }}>
                      <DollarSign size={20} />
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--c-text3)', marginTop: '14px' }}>
                    Active cash vault balance
                  </div>
                </div>

                <div className="glass kpi-card lift">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '13px', color: 'var(--c-text3)' }}>Total Inflow</span>
                      <h3 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--ff-brand)', color: 'var(--c-green)', marginTop: '6px' }}>
                        +${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </h3>
                    </div>
                    <div style={{ background: 'rgba(16, 217, 138, 0.15)', color: 'var(--c-green)', padding: '10px', borderRadius: '12px' }}>
                      <TrendingUp size={20} />
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--c-text3)', marginTop: '14px' }}>
                    {incomeTxs.length} incoming deposits
                  </div>
                </div>

                <div className="glass kpi-card lift">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '13px', color: 'var(--c-text3)' }}>Total Outflow</span>
                      <h3 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--ff-brand)', color: 'var(--c-red)', marginTop: '6px' }}>
                        -${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </h3>
                    </div>
                    <div style={{ background: 'rgba(255, 77, 122, 0.15)', color: 'var(--c-red)', padding: '10px', borderRadius: '12px' }}>
                      <TrendingDown size={20} />
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--c-text3)', marginTop: '14px' }}>
                    {expenseTxs.length} expense transactions
                  </div>
                </div>
              </section>

              {/* Main Chart + Categories */}
              <section className="chart-grid">
                {/* Visual Area Chart */}
                <div className="glass chart-card">
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '20px', fontFamily: 'var(--ff-brand)' }}>
                    Cash Flow — Monthly Savings
                  </h3>
                  <div style={{ width: '100%', height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--c-purple)" stopOpacity={0.35}/>
                            <stop offset="95%" stopColor="var(--c-purple)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                        <Area type="monotone" dataKey="Savings" stroke="var(--c-purple)" fillOpacity={1} fill="url(#colorSavings)" strokeWidth={2} dot={{ r: 4, fill: 'var(--c-purple)', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Categories Breakdown */}
                <div className="glass chart-card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '20px', fontFamily: 'var(--ff-brand)' }}>
                    Spending Categories
                  </h3>
                  
                  {categoryProgress.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text3)', gap: '8px' }}>
                      <Layers size={32} />
                      <span style={{ fontSize: '13px' }}>No expense data to analyze yet</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, justifyContent: 'center', gap: '16px' }}>
                      {/* Donut Chart */}
                      <div style={{ width: '100%', height: '200px', position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryProgress}
                              cx="50%"
                              cy="50%"
                              innerRadius={52}
                              outerRadius={78}
                              paddingAngle={3}
                              dataKey="amount"
                              nameKey="name"
                              strokeWidth={0}
                            >
                              {categoryProgress.map((entry, index) => (
                                <Cell key={entry.name} fill={CATEGORY_HEX[entry.name] || '#7c5cbf'} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        {/* Center label — swaps between Total and hovered slice */}
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none', transition: 'opacity 0.15s ease' }}>
                          {hoveredSlice ? (
                            <>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginBottom: '2px' }}>
                                <div style={{ width: '7px', height: '7px', borderRadius: '2px', background: CATEGORY_HEX[hoveredSlice.name] || '#7c5cbf' }} />
                                <div style={{ fontSize: '10px', color: 'var(--c-text2)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{hoveredSlice.name}</div>
                              </div>
                              <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff', fontFamily: 'var(--ff-brand)' }}>
                                ${hoveredSlice.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </div>
                            </>
                          ) : (
                            <>
                              <div style={{ fontSize: '10px', color: 'var(--c-text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</div>
                              <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff', fontFamily: 'var(--ff-brand)' }}>${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Legend */}
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {categoryProgress.map(cat => (
                          <div key={cat.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: CATEGORY_HEX[cat.name] || '#7c5cbf', flexShrink: 0 }} />
                              <span style={{ color: 'var(--c-text2)', fontWeight: '500' }}>{cat.name}</span>
                            </div>
                            <span style={{ color: '#fff', fontWeight: '700' }}>
                              ${cat.amount.toFixed(2)} <span style={{ fontSize: '10px', color: 'var(--c-text3)', fontWeight: 'normal' }}>({cat.percent.toFixed(0)}%)</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Recent Transactions List */}
              <section className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', fontFamily: 'var(--ff-brand)' }}>
                    Recent Vault Operations
                  </h3>
                  <Link to="/transactions" className="btn btn-ghost" style={{ fontSize: '12px', padding: '6px 14px' }}>
                    View All Vault Txs <ArrowUpRight size={14} />
                  </Link>
                </div>

                {transactions.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">⬡</div>
                    <h4>No Operations Logged</h4>
                    <p style={{ fontSize: '13px' }}>Click below to create your first financial entry.</p>
                    <Link to="/transactions" className="btn btn-primary" style={{ marginTop: '8px' }}>
                      <Plus size={16} /> Log First Transaction
                    </Link>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="tx-table">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Description</th>
                          <th>Date</th>
                          <th style={{ textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.slice(0, 5).map(tx => (
                          <tr key={tx.id} className="water-row">
                            <td>
                              <span className={`badge ${tx.type === 'income' ? 'badge-income' : 'badge-expense'}`}>
                                {tx.category}
                              </span>
                            </td>
                            <td>{tx.description || <span style={{ color: 'var(--c-muted)', fontSize: '12px' }}>No description</span>}</td>
                            <td>{new Date(tx.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                            <td style={{ textAlign: 'right', fontWeight: '700', color: tx.type === 'income' ? 'var(--c-green)' : 'var(--c-red)' }}>
                              {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}

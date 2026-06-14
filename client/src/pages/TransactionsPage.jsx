import { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Plus, Search, Filter, Trash2, Edit2, X, PlusCircle, MinusCircle, Check, Landmark
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const CATEGORIES = ['Food', 'Housing', 'Entertainment', 'Utilities', 'Credit Card Payment', 'Shopping'];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingId, setEditingId] = useState(null);

  // Form states
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  // Bank accounts
  const [bankAccounts, setBankAccounts] = useState([]);
  const [sourceBankAccountId, setSourceBankAccountId] = useState('');

  useEffect(() => {
    fetchTransactions();
    fetchBankAccounts();
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

  const fetchBankAccounts = async () => {
    try {
      const res = await axios.get('/api/bank-accounts');
      setBankAccounts(res.data.filter(a => a.status === 'active'));
    } catch (e) {
      console.error('Failed to load bank accounts', e);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setAmount('');
    setType('expense');
    setCategory('Food');
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setSourceBankAccountId(bankAccounts.length > 0 ? bankAccounts[0].id : '');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (tx) => {
    setModalMode('edit');
    setEditingId(tx.id);
    setAmount(tx.amount.toString());
    setType(tx.type);
    setCategory(tx.category);
    setDate(tx.date);
    setDescription(tx.description);
    setSourceBankAccountId(tx.sourceBankAccountId || '');
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!amount || parseFloat(amount) <= 0) {
      setFormError('Please enter a valid amount greater than 0.');
      return;
    }

    const payload = {
      amount: parseFloat(amount),
      type,
      category,
      date,
      description,
      sourceBankAccountId: sourceBankAccountId || null
    };

    try {
      if (modalMode === 'create') {
        const response = await axios.post('/api/transactions', payload);
        setTransactions([response.data, ...transactions]);
      } else {
        const response = await axios.put(`/api/transactions/${editingId}`, payload);
        setTransactions(transactions.map(t => t.id === editingId ? response.data : t));
      }
      setShowModal(false);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Operation failed. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to purge this transaction record?')) return;
    try {
      await axios.delete(`/api/transactions/${id}`);
      setTransactions(transactions.filter(t => t.id !== id));
    } catch (e) {
      console.error('Delete failed', e);
    }
  };

  // Filter Logic
  const filteredTxs = transactions.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(search.toLowerCase()) ||
                          tx.category.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    const matchesCat = catFilter === 'all' || tx.category === catFilter;

    return matchesSearch && matchesType && matchesCat;
  });

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Topbar title="Transaction Vault" />

        <main className="page-body">
          <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Header + Quick Action */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--ff-brand)', color: '#fff' }}>Operations Log</h3>
                <p style={{ fontSize: '13px', color: 'var(--c-text3)', marginTop: '2px' }}>Browse, filter, and append financial entries</p>
              </div>
              <button onClick={openCreateModal} className="btn btn-primary animate-glow">
                <Plus size={16} /> Log Transaction
              </button>
            </div>

            {/* Filters Row */}
            <section className="glass" style={{ padding: '16px 20px', borderRadius: 'var(--radius-lg)', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text3)' }} />
                <input
                  type="text"
                  placeholder="Search description or category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: '44px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Filter size={14} style={{ color: 'var(--c-text3)' }} />
                  <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ width: '130px', padding: '10px 14px' }}>
                    <option value="all">All Types</option>
                    <option value="income">Inflow</option>
                    <option value="expense">Outflow</option>
                  </select>
                </div>

                <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} style={{ width: '150px', padding: '10px 14px' }}>
                  <option value="all">All Categories</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </section>

            {/* Transactions Table Card */}
            <section className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '24px', overflow: 'hidden' }}>
              {loading ? (
                <div style={{ display: 'flex', height: '200px', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="animate-spin" style={{ width: '30px', height: '30px', border: '3px solid rgba(139,61,255,0.2)', borderTopColor: 'var(--c-purple)', borderRadius: '50%' }}></div>
                </div>
              ) : filteredTxs.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">⬡</div>
                  <h4>No Matching Records</h4>
                  <p style={{ fontSize: '13px' }}>Try resetting your search query or filters.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="tx-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Account</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTxs.map(tx => (
                        <tr key={tx.id} className="water-row">
                          <td>
                            <span className={`badge ${tx.type === 'income' ? 'badge-income' : 'badge-expense'}`}>
                              {tx.category}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: '500', color: '#fff' }}>
                              {tx.description || <span style={{ color: 'var(--c-muted)', fontStyle: 'italic', fontSize: '13px' }}>No description</span>}
                            </span>
                          </td>
                          <td>
                            {tx.sourceBankName ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--c-purple3)', fontWeight: '500' }}>
                                <Landmark size={11} /> {tx.sourceBankName}
                              </span>
                            ) : (
                              <span style={{ fontSize: '12px', color: 'var(--c-muted)', fontStyle: 'italic' }}>Manual</span>
                            )}
                          </td>
                          <td>{new Date(tx.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                          <td style={{ fontWeight: '750', color: tx.type === 'income' ? 'var(--c-green)' : 'var(--c-red)' }}>
                            {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button 
                                onClick={() => openEditModal(tx)} 
                                className="btn btn-ghost btn-icon"
                                title="Edit Record"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={() => handleDelete(tx.id)} 
                                className="btn btn-danger btn-icon"
                                title="Purge Record"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

          </div>
        </main>

        {/* Modal Backdrop / Box */}
        {showModal && (
          <div className="modal-backdrop">
            <div className="glass-strong modal-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontFamily: 'var(--ff-brand)', fontSize: '20px', fontWeight: '800', color: '#fff' }}>
                  {modalMode === 'create' ? 'Log New Transaction' : 'Modify Record'}
                </h3>
                <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--c-text3)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              {formError && (
                <div style={{ display: 'flex', gap: '8px', padding: '10px 14px', background: 'rgba(255, 77, 122, 0.1)', border: '1px solid rgba(255, 77, 122, 0.2)', borderRadius: 'var(--radius-md)', color: 'var(--c-red)', fontSize: '12px', marginBottom: '18px' }}>
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Type toggle */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`btn ${type === 'expense' ? 'btn-danger' : 'btn-ghost'}`}
                    style={{ padding: '10px' }}
                  >
                    <MinusCircle size={16} /> Outflow
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`btn ${type === 'income' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ padding: '10px' }}
                  >
                    <PlusCircle size={16} /> Inflow
                  </button>
                </div>

                {/* Amount */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--c-text2)' }}>Value ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                {/* Category */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--c-text2)' }}>Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--c-text2)' }}>Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                {/* Description */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--c-text2)' }}>Description</label>
                  <input
                    type="text"
                    placeholder="Food delivery, Rent deposit, etc."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* From Account */}
                {bankAccounts.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--c-text2)' }}>
                      From Account <span style={{ color: 'var(--c-text3)', fontWeight: '400' }}>(optional — balance will update)</span>
                    </label>
                    <select
                      value={sourceBankAccountId}
                      onChange={e => setSourceBankAccountId(e.target.value)}
                      style={{ padding: '10px 14px' }}
                    >
                      <option value="">— No account (manual entry) —</option>
                      {bankAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.bankName} •••• {acc.accountLast4} ({acc.accountType}) — ${acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost" style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    <Check size={16} /> Save Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

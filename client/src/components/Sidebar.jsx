import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, Target, CreditCard, LineChart, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import LedgerLogo from './LedgerLogo';

const NAV_ITEMS = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions',  icon: ArrowLeftRight,  label: 'Transactions' },
  { to: '/spend-scope',   icon: Target,          label: 'SpendScope' },
  { to: '/bank-accounts', icon: CreditCard,      label: 'Bank Accounts' },
  { to: '/insights',      icon: LineChart,       label: 'Insights' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        <LedgerLogo size={34} />
        {!isCollapsed && <span className="brand-name">Ledger</span>}
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'collapsed' : ''}`
            }
            title={isCollapsed ? item.label : undefined}
          >
            <item.icon className="nav-icon" />
            {!isCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {!isCollapsed && user && (
          <div className="user-info">
            <div className="user-avatar">{user.name?.charAt(0) || 'U'}</div>
            <div className="user-details">
              <span className="user-name">{user.name}</span>
              <span className="user-role">{user.email}</span>
            </div>
          </div>
        )}

        <button onClick={logout} className={`btn-logout ${isCollapsed ? 'collapsed' : ''}`} title="Sign Out">
          <LogOut size={18} />
          {!isCollapsed && <span>Sign Out</span>}
        </button>

        <button
          onClick={() => setIsCollapsed(c => !c)}
          className="sidebar-toggle"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!isCollapsed && <span style={{ fontSize: '12px', color: 'var(--c-text3)' }}>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

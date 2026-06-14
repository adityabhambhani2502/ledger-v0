import { useAuth } from '../context/AuthContext';
import { User } from 'lucide-react';

export default function Topbar({ title }) {
  const { user } = useAuth();

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'var(--ff-brand)', color: '#fff' }}>
          {title}
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {user && (
          <div className="glass-subtle" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--c-border)' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--c-purple), var(--c-indigo))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={14} style={{ color: '#fff' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff', lineHeight: 1 }}>{user.name}</span>
              <span style={{ fontSize: '10px', color: 'var(--c-text3)' }}>{user.email}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

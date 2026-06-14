import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import LedgerLogo from '../components/LedgerLogo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, #11002c 0%, #06000f 100%)', padding: '24px' }}>
      <div className="glass-strong animate-scaleIn" style={{ width: '100%', maxWidth: '420px', borderRadius: 'var(--radius-xl)', padding: '40px 32px', border: '1px solid var(--c-border2)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ marginBottom: '16px' }}><LedgerLogo size={44} /></div>
          <h2 style={{ fontFamily: 'var(--ff-brand)', fontSize: '28px', fontWeight: '800', color: '#fff' }}>Welcome Back</h2>
          <p style={{ fontSize: '13px', color: 'var(--c-text3)', marginTop: '4px' }}>Log in to access your secure financial vault</p>
        </div>

        {error && (
          <div className="animate-fadeIn" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(255, 77, 122, 0.12)', border: '1px solid rgba(255, 77, 122, 0.25)', borderRadius: 'var(--radius-md)', color: 'var(--c-red)', fontSize: '13px', marginBottom: '20px' }}>
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--c-text2)' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text3)' }} />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '44px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--c-text2)' }}>Password</label>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text3)' }} />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '44px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary animate-glow"
            style={{ width: '100%', marginTop: '8px', padding: '12px' }}
          >
            {loading ? 'Decrypting Vault...' : 'Access Vault'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div
          onClick={() => { setEmail('john.doe@example.com'); setPassword('password123'); }}
          style={{
            marginTop: '20px',
            padding: '12px 16px',
            background: 'rgba(139, 61, 255, 0.08)',
            border: '1px solid rgba(139, 61, 255, 0.25)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(139, 61, 255, 0.16)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(139, 61, 255, 0.08)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Sparkles size={14} style={{ color: 'var(--c-purple3)' }} />
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--c-purple3)' }}>Click to autofill credentials</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '28px', fontSize: '13px', color: 'var(--c-text3)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--c-purple3)', textDecoration: 'none', fontWeight: '600' }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}

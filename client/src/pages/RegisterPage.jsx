import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, ArrowRight, ShieldAlert } from 'lucide-react';
import LedgerLogo from '../components/LedgerLogo';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [strength, setStrength] = useState({ score: 0, text: 'Very Weak', color: 'var(--c-red)' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!password) {
      setStrength({ score: 0, text: 'Empty', color: 'rgba(255,255,255,0.05)' });
      return;
    }
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    let text = 'Weak';
    let color = 'var(--c-red)';
    if (score >= 4) {
      text = 'Strong';
      color = 'var(--c-green)';
    } else if (score >= 2) {
      text = 'Medium';
      color = 'var(--c-amber)';
    }

    setStrength({ score, text, color });
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register(name, email, password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifycontent: 'center', background: 'radial-gradient(circle at center, #11002c 0%, #06000f 100%)', padding: '24px', justifyContent: 'center' }}>
      <div className="glass-strong animate-scaleIn" style={{ width: '100%', maxWidth: '420px', borderRadius: 'var(--radius-xl)', padding: '40px 32px', border: '1px solid var(--c-border2)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ marginBottom: '16px' }}><LedgerLogo size={44} /></div>
          <h2 style={{ fontFamily: 'var(--ff-brand)', fontSize: '28px', fontWeight: '800', color: '#fff' }}>Initialize Vault</h2>
          <p style={{ fontSize: '13px', color: 'var(--c-text3)', marginTop: '4px' }}>Begin tracking your personal wealth today</p>
        </div>

        {error && (
          <div className="animate-fadeIn" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(255, 77, 122, 0.12)', border: '1px solid rgba(255, 77, 122, 0.25)', borderRadius: 'var(--radius-md)', color: 'var(--c-red)', fontSize: '13px', marginBottom: '20px' }}>
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--c-text2)' }}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text3)' }} />
              <input
                type="text"
                required
                placeholder="Alex Mercer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ paddingLeft: '44px' }}
              />
            </div>
          </div>

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
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--c-text2)' }}>Master Password</label>
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

            {/* Strength Bar */}
            {password && (
              <div style={{ marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--c-text3)', marginBottom: '4px' }}>
                  <span>Password Strength</span>
                  <span style={{ color: strength.color, fontWeight: 'bold' }}>{strength.text}</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(strength.score / 5) * 100}%`, background: strength.color, transition: 'width 0.3s ease' }}></div>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary animate-glow"
            style={{ width: '100%', marginTop: '8px', padding: '12px' }}
          >
            {loading ? 'Initializing...' : 'Create Master Vault'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--c-text3)' }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: 'var(--c-purple3)', textDecoration: 'none', fontWeight: '600' }}>
            Access Vault
          </Link>
        </div>
      </div>
    </div>
  );
}

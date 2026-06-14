import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LedgerLogo from '../components/LedgerLogo';
import { ArrowRight, Sparkles, TrendingUp, Shield, Layers, X } from 'lucide-react';

/* ── Privacy Policy Content ── */
const PRIVACY_SECTIONS = [
  { title: '1. Information We Collect', body: 'When you create a Ledger account, we collect your name, email address, and a securely hashed password. Financial data you manually enter — such as transactions, bank account details, and budget categories — is stored exclusively in your local instance of the application.' },
  { title: '2. How We Use Your Information', body: 'Your information is used solely to provide the Ledger experience: generating real-time charts, categorizing spending, and syncing bank transactions. We do not sell, rent, or share your data with any third parties for advertising or marketing purposes.' },
  { title: '3. Data Storage & Security', body: 'All financial records are stored locally on your device in an encrypted JSON database. Ledger employs industry-standard bcrypt hashing for passwords and AES-256 encryption for sensitive fields at rest. No data is transmitted to external servers unless you explicitly initiate a bank sync.' },
  { title: '4. Bank Account Syncing', body: 'When you link a bank account, Ledger simulates transaction imports locally. No banking credentials are stored beyond the session required for synchronization. You may unlink accounts at any time, and all associated transaction data can be purged from your dashboard.' },
  { title: '5. Cookies & Tracking', body: 'Ledger does not use cookies, web beacons, pixel tags, or any form of cross-site tracking. Session tokens are held in memory and cleared when you sign out or close the browser tab.' },
  { title: '6. Your Rights', body: 'You have full control over your data. You may export, modify, or permanently delete all personal and financial records at any time from the Settings panel. Account deletion is immediate and irreversible.' },
  { title: '7. Children\'s Privacy', body: 'Ledger is intended for users aged 18 and older. We do not knowingly collect information from minors. If we become aware that a minor has provided us with personal data, we will take steps to delete such information.' },
  { title: '8. Changes to This Policy', body: 'We may update this Privacy Policy from time to time. Material changes will be communicated via an in-app notification at least 30 days before taking effect. Continued use of Ledger after changes constitutes acceptance.' },
  { title: '9. Contact Us', body: 'If you have questions about this Privacy Policy or wish to exercise your data rights, contact our privacy team at privacy@ledgerfinance.app or through the in-app support channel.' },
];

/* ── Terms of Service Points ── */
const TOS_POINTS = [
  'By creating or accessing a Ledger account, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please discontinue use immediately.',
  'You are responsible for maintaining the confidentiality of your login credentials. Ledger is not liable for unauthorized access resulting from credential sharing or weak passwords.',
  'All financial data entered into Ledger is for personal, non-commercial use only. You agree not to use the platform for money laundering, tax evasion, or any unlawful financial activity.',
  'Bank account syncing is provided as a convenience feature. Ledger does not guarantee the accuracy, completeness, or timeliness of imported transactions. Always verify with your financial institution.',
  'Ledger reserves the right to suspend or terminate accounts that violate these terms, engage in abusive behavior, or remain inactive for more than 365 consecutive days.',
  'The software is provided "as is" without warranties of any kind. Ledger shall not be held liable for any indirect, incidental, or consequential damages arising from your use of the platform.',
  'These terms are governed by the laws of the State of Delaware, United States. Any disputes shall be resolved through binding arbitration in Wilmington, Delaware.',
];

export default function SplashPage() {
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTos, setShowTos] = useState(false);
  const [pendingRoute, setPendingRoute] = useState(null);

  // close modal on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setShowPrivacy(false); setShowTos(false); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // canvas particle background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    const particles = [];
    const count = 40;
    for (let i = 0; i < count; i++) {
      particles.push({ x: Math.random()*width, y: Math.random()*height, r: Math.random()*3+1, vx: (Math.random()-0.5)*0.4, vy: (Math.random()-0.5)*0.4, alpha: Math.random()*0.5+0.2 });
    }
    const handleResize = () => { if (canvas) { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; } };
    window.addEventListener('resize', handleResize);
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const grad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height));
      grad.addColorStop(0, '#0c0022'); grad.addColorStop(1, '#050010');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, width, height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(168, 85, 247, ${p.alpha})`;
        ctx.shadowBlur = 12; ctx.shadowColor = '#a855f7'; ctx.fill();
      });
      ctx.shadowBlur = 0;
      for (let i = 0; i < count; i++) {
        for (let j = i+1; j < count; j++) {
          const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
          if (dist < 150) {
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(139, 61, 255, ${(1 - dist/150)*0.12})`;
            ctx.lineWidth = 0.8; ctx.stroke();
          }
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => { cancelAnimationFrame(animationFrameId); window.removeEventListener('resize', handleResize); };
  }, []);

  const openTosForRoute = (route) => { setPendingRoute(route); setShowTos(true); };
  const agreeTos = () => { setShowTos(false); if (pendingRoute) { navigate(pendingRoute); setPendingRoute(null); } };

  /* ── Modal Overlay Style ── */
  const overlayStyle = { position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', padding: '24px' };
  const modalStyle = { width: '100%', maxWidth: '620px', maxHeight: '80vh', background: '#0d0620', border: '1px solid rgba(139,61,255,0.25)', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' };
  const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid rgba(139,61,255,0.15)' };
  const bodyStyle = { padding: '24px', overflowY: 'auto', flex: 1 };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }} />

      {/* ── Privacy Policy Modal ── */}
      {showPrivacy && (
        <div style={overlayStyle} onClick={() => setShowPrivacy(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={headerStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Shield size={20} style={{ color: 'var(--c-purple3)' }} />
                <span style={{ fontFamily: 'var(--ff-brand)', fontWeight: '800', fontSize: '18px', color: '#fff' }}>Privacy Policy</span>
              </div>
              <button onClick={() => setShowPrivacy(false)} style={{ background: 'none', border: 'none', color: 'var(--c-text3)', cursor: 'pointer', padding: '4px' }}><X size={20} /></button>
            </div>
            <div style={bodyStyle}>
              <p style={{ fontSize: '12px', color: 'var(--c-text3)', marginBottom: '20px' }}>Last updated: June 1, 2026 &bull; Ledger Finance Inc.</p>
              {PRIVACY_SECTIONS.map((s, i) => (
                <div key={i} style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>{s.title}</h4>
                  <p style={{ fontSize: '13px', color: 'var(--c-text2)', lineHeight: 1.65 }}>{s.body}</p>
                </div>
              ))}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(139,61,255,0.15)', textAlign: 'right' }}>
              <button onClick={() => setShowPrivacy(false)} className="btn btn-ghost" style={{ fontSize: '13px', padding: '8px 20px' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Terms of Service Modal ── */}
      {showTos && (
        <div style={overlayStyle} onClick={() => { setShowTos(false); setPendingRoute(null); }}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={headerStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Shield size={20} style={{ color: 'var(--c-purple3)' }} />
                <span style={{ fontFamily: 'var(--ff-brand)', fontWeight: '800', fontSize: '18px', color: '#fff' }}>Terms of Service</span>
              </div>
              <button onClick={() => { setShowTos(false); setPendingRoute(null); }} style={{ background: 'none', border: 'none', color: 'var(--c-text3)', cursor: 'pointer', padding: '4px' }}><X size={20} /></button>
            </div>
            <div style={bodyStyle}>
              <p style={{ fontSize: '12px', color: 'var(--c-text3)', marginBottom: '20px' }}>Effective: June 1, 2026 &bull; Please read carefully before proceeding.</p>
              <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {TOS_POINTS.map((point, i) => (
                  <li key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ flexShrink: 0, width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(139,61,255,0.12)', border: '1px solid rgba(139,61,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', color: 'var(--c-purple3)' }}>{i + 1}</span>
                    <p style={{ fontSize: '13px', color: 'var(--c-text2)', lineHeight: 1.65, paddingTop: '3px' }}>{point}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(139,61,255,0.15)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => { setShowTos(false); setPendingRoute(null); }} className="btn btn-ghost" style={{ fontSize: '13px', padding: '10px 20px' }}>Decline</button>
              <button onClick={agreeTos} className="btn btn-primary" style={{ fontSize: '13px', padding: '10px 24px' }}>
                Yes, I Agree <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <header className="glass-subtle" style={{ position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', padding: '16px 40px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LedgerLogo size={32} />
          <span style={{ fontFamily: 'var(--ff-brand)', fontWeight: '800', fontSize: '20px', letterSpacing: '-0.5px' }}>LEDGER</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => navigate('/login')} className="btn btn-ghost" style={{ fontSize: '13px', padding: '8px 16px', cursor: 'pointer' }}>Login</button>
          <button onClick={() => openTosForRoute('/register')} className="btn btn-primary" style={{ fontSize: '13px', padding: '8px 16px', cursor: 'pointer' }}>Get Started</button>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '48px', zIndex: 1 }}>
        <div className="animate-fadeUp" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '800px' }}>
          <div className="glass" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: 'var(--radius-full)', border: '1px solid var(--c-border2)', fontSize: '12px', color: 'var(--c-purple3)', marginBottom: '8px' }}>
            <Sparkles size={14} />
            <span>The New Era of Personal Wealth</span>
          </div>
          <h1 style={{ fontFamily: 'var(--ff-brand)', fontSize: '64px', fontWeight: '900', lineHeight: 1.1, letterSpacing: '-1.5px', color: '#fff' }}>
            Your Money, <br/>
            <span className="grad-text">Simplified.</span>
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--c-text2)', maxWidth: '600px', marginTop: '12px', lineHeight: 1.6 }}>
            Track assets, visualize trends, and gain absolute clarity over your personal cashflow.
          </p>
          <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
            <button onClick={() => openTosForRoute('/register')} className="btn btn-primary animate-glow" style={{ padding: '14px 28px', fontSize: '15px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              Create Free Account <ArrowRight size={18} />
            </button>
            <button onClick={() => navigate('/login')} className="btn btn-ghost" style={{ padding: '14px 28px', fontSize: '15px', cursor: 'pointer' }}>
              Sign In
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', width: '100%', marginTop: '40px' }}>
          <div className="glass lift" style={{ padding: '32px', borderRadius: 'var(--radius-lg)', textAlign: 'left', border: '1px solid var(--c-border)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139,61,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-purple3)', marginBottom: '16px' }}>
              <TrendingUp size={24} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>Real-time Charts</h3>
            <p style={{ fontSize: '14px', color: 'var(--c-text2)', lineHeight: 1.5 }}>
              Track cash inflows and outflows dynamically using interactive charts with clean, responsive animations.
            </p>
          </div>
          <div className="glass lift" style={{ padding: '32px', borderRadius: 'var(--radius-lg)', textAlign: 'left', border: '1px solid var(--c-border)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139,61,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-purple3)', marginBottom: '16px' }}>
              <Layers size={24} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>Smart Categories</h3>
            <p style={{ fontSize: '14px', color: 'var(--c-text2)', lineHeight: 1.5 }}>
              Assign spending to custom groups like food, utilities, rent, and leisure to see where your money goes.
            </p>
          </div>
          <div className="glass lift" style={{ padding: '32px', borderRadius: 'var(--radius-lg)', textAlign: 'left', border: '1px solid var(--c-border)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139,61,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-purple3)', marginBottom: '16px' }}>
              <Shield size={24} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>Privacy Focused</h3>
            <p style={{ fontSize: '14px', color: 'var(--c-text2)', lineHeight: 1.5 }}>
              Your transactions are stored securely. Complete control over database storage with zero trackings.
            </p>
          </div>
        </div>
      </main>

      <footer style={{ borderTop: '1px solid var(--c-border)', padding: '30px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--c-text3)' }}>
        <span>&copy; 2026 Ledger Finance Inc. All rights reserved.</span>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span onClick={() => setShowPrivacy(true)} style={{ cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '3px' }}>Privacy Policy</span>
          <span style={{ opacity: 0.4 }}>&bull;</span>
          <span onClick={() => { setPendingRoute(null); setShowTos(true); }} style={{ cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '3px' }}>Terms of Service</span>
        </div>
      </footer>
    </div>
  );
}

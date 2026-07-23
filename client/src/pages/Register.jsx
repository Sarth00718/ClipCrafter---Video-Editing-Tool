import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Mail, Lock, Eye, EyeOff, User, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { authService } from '../services/index.js';
import { Spinner } from '../components/ui/index.jsx';
import ThemeToggle from '../components/ui/ThemeToggle.jsx';
import ParticleField from '../components/ui/ParticleField.jsx';
import { staggerContainer, fadeInUp } from '../utils/animations.js';
import { pageTransition } from '../utils/animations.js';

function PasswordStrength({ password }) {
  const criteria = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Number', met: /\d/.test(password) },
    { label: 'Special character', met: /[^a-zA-Z0-9]/.test(password) },
  ];
  const strength = criteria.filter((c) => c.met).length;
  const colors = ['transparent', '#ef4444', '#fbbf24', '#c9a84c', '#4ade80'];

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {criteria.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < strength ? colors[strength] : 'var(--bg-elevated)', transition: 'background 0.3s' }} />
        ))}
      </div>
    </div>
  );
}

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) return null; // hide form during redirect

  const handleRegister = async () => {
    if (!name || !email || !password) { toast.error('Please fill all fields'); return; }
    if (password !== confirmPw) { toast.error('Passwords do not match'); return; }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (!terms) { toast.error('Please accept the terms of service'); return; }
    setLoading(true);
    try {
      const res = await authService.register({ name, email, password });
      const { token, refreshToken, user } = res.data.data;
      login(token, user, refreshToken);
      toast.success(`Welcome to ClipCrafters, ${user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      const message = err.userMessage || err.response?.data?.message || 'Registration failed';
      toast.error(message);
    } finally { setLoading(false); }
  };

  return (
    <motion.div {...pageTransition} style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {/* LEFT — Decorative */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }} className="desktop-only-flex">
        <ParticleField count={40} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 380 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gradient-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 10l4.553-2.276A1 1 0 0121 8.67v6.66a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" stroke="#0a0806" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem' }}>ClipCrafters</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginBottom: 16 }}>
            Join 10,000+{' '}
            <span className="gradient-text">Expert Creators</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Transform your research, lectures, and reports into professional videos powered by agentic AI.
          </p>
          {['Zero hallucinations — citation grounded', 'Scene-level editing control', 'Confidence scoring on every scene'].map((f) => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--gold-subtle)', border: '1px solid var(--border-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Check size={12} color="var(--gold-primary)" />
              </div>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT — Form */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', background: 'var(--bg-primary)', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Create Account</span>
            <ThemeToggle size="sm" />
          </div>

          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            <motion.h1 variants={fadeInUp} style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>
              Get started free
            </motion.h1>
            <motion.p variants={fadeInUp} style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>
              No credit card required
            </motion.p>

            {/* Full Name */}
            <motion.div variants={fadeInUp} className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="text" className="input-neu" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" style={{ paddingLeft: 44 }} data-cursor="text" />
              </div>
            </motion.div>

            {/* Email */}
            <motion.div variants={fadeInUp} className="form-group">
              <label className="form-label">Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="email" className="input-neu" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ paddingLeft: 44 }} data-cursor="text" />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div variants={fadeInUp} className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type={showPw ? 'text' : 'password'} className="input-neu" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" style={{ paddingLeft: 44, paddingRight: 44 }} data-cursor="text" />
                <button onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} data-cursor="pointer">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password && <PasswordStrength password={password} />}
            </motion.div>

            {/* Confirm Password */}
            <motion.div variants={fadeInUp} className="form-group">
              <label className="form-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type={showPw ? 'text' : 'password'} className="input-neu" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Re-enter password" style={{ paddingLeft: 44, paddingRight: 44 }} data-cursor="text" />
                {confirmPw && <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
                  {password === confirmPw ? <Check size={16} color="#4ade80" /> : <span style={{ color: '#f87171', fontSize: 16 }}>✗</span>}
                </div>}
              </div>
            </motion.div>

            {/* Terms */}
            <motion.div variants={fadeInUp} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <input type="checkbox" id="terms" checked={terms} onChange={(e) => setTerms(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--gold-primary)' }} data-cursor="pointer" />
              <label htmlFor="terms" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                I agree to the <a href="#" style={{ color: 'var(--gold-primary)' }}>Terms of Service</a> and <a href="#" style={{ color: 'var(--gold-primary)' }}>Privacy Policy</a>
              </label>
            </motion.div>

            <motion.button
              variants={fadeInUp}
              onClick={handleRegister}
              disabled={loading}
              className="btn-primary"
              data-cursor="pointer"
              style={{ width: '100%', justifyContent: 'center', padding: '14px', marginBottom: 20, fontSize: '1rem' }}
            >
              {loading ? <><Spinner size={18} /> Creating account...</> : 'Create Account'}
            </motion.button>

            <motion.p variants={fadeInUp} style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--gold-primary)', fontWeight: 600 }} data-cursor="pointer">Sign in →</Link>
            </motion.p>
          </motion.div>
        </div>
      </div>

      <style>{`@media (max-width: 767px) { .desktop-only-flex { display: none; } }`}</style>
    </motion.div>
  );
}

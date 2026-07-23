import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Mail, Lock, ArrowLeft, Timer } from 'lucide-react';
import { authService } from '../services/index.js';
import { Spinner } from '../components/ui/index.jsx';
import ThemeToggle from '../components/ui/ThemeToggle.jsx';
import ParticleField from '../components/ui/ParticleField.jsx';
import { staggerContainer, fadeInUp, pageTransition } from '../utils/animations.js';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: email, 2: otp+password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0); // OTP expiry countdown in seconds
  const countdownRef = useRef(null);
  const navigate = useNavigate();

  // Cleanup timer on unmount
  useEffect(() => () => clearInterval(countdownRef.current), []);

  const startCountdown = (seconds = 300) => {
    setCountdown(seconds);
    clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown((t) => {
        if (t <= 1) { clearInterval(countdownRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const formatCountdown = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleRequestOtp = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    setLoading(true);
    try {
      await authService.requestPasswordOtp({ email });
      toast.success('OTP sent to your email — valid for 5 minutes');
      setStep(2);
      startCountdown(300); // 5-minute OTP expiry
    } catch (err) {
      const message = err.userMessage || err.response?.data?.message || 'Failed to send OTP';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({ email, otp: otpCode, newPassword });
      toast.success('Password reset successfully!');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      const message = err.userMessage || err.response?.data?.message || 'Failed to reset password';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (val, idx) => {
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  return (
    <motion.div {...pageTransition} style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {/* LEFT — Decorative */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }} className="desktop-only-flex">
        <ParticleField count={40} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 400, textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--gradient-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Lock size={36} color="#0a0806" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginBottom: 16 }}>
            Reset Your Password
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Don't worry, it happens to the best of us. We'll send you a verification code to reset your password securely.
          </p>
        </div>
      </div>

      {/* RIGHT — Form */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', background: 'var(--bg-primary)' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
            <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <ArrowLeft size={16} /> Back to Login
            </Link>
            <ThemeToggle size="sm" />
          </div>

          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            {step === 1 ? (
              <>
                <motion.h1 variants={fadeInUp} style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>
                  Forgot Password?
                </motion.h1>
                <motion.p variants={fadeInUp} style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
                  Enter your email to receive a verification code
                </motion.p>

                <motion.div variants={fadeInUp} className="form-group">
                  <label className="form-label">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input
                      type="email"
                      className="input-neu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      style={{ paddingLeft: 44 }}
                      data-cursor="text"
                      onKeyDown={(e) => e.key === 'Enter' && handleRequestOtp()}
                    />
                  </div>
                </motion.div>

                <motion.button
                  variants={fadeInUp}
                  onClick={handleRequestOtp}
                  disabled={loading}
                  className="btn-primary"
                  data-cursor="pointer"
                  style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem' }}
                >
                  {loading ? <><Spinner size={18} /> Sending...</> : 'Send Verification Code'}
                </motion.button>
              </>
            ) : (
              <>
                <motion.h1 variants={fadeInUp} style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>
                  Enter Verification Code
                </motion.h1>
                <motion.p variants={fadeInUp} style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                  We sent a 6-digit code to {email}
                </motion.p>

                <motion.div variants={fadeInUp} style={{ marginBottom: 20 }}>
                  <label className="form-label" style={{ marginBottom: 12 }}>Verification Code</label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'center' }}>
                    {otp.map((v, i) => (
                      <input
                        key={i}
                        id={`otp-${i}`}
                        type="text"
                        maxLength={1}
                        value={v}
                        onChange={(e) => handleOtpChange(e.target.value, i)}
                        data-cursor="text"
                        style={{
                          width: 52,
                          height: 56,
                          textAlign: 'center',
                          borderRadius: 10,
                          border: '1px solid var(--border-default)',
                          background: 'var(--bg-elevated)',
                          color: 'var(--text-primary)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '1.5rem',
                          fontWeight: 700,
                          outline: 'none',
                          transition: 'border-color 0.2s',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = 'var(--gold-primary)')}
                        onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
                      />
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    {countdown > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        <Timer size={13} />
                        OTP expires in <strong style={{ color: countdown < 60 ? '#f87171' : 'var(--gold-primary)', fontFamily: 'var(--font-mono)' }}>{formatCountdown(countdown)}</strong>
                      </div>
                    ) : (
                      <button
                        onClick={async () => {
                          if (!email) return;
                          try {
                            await authService.requestPasswordOtp({ email });
                            toast.success('New OTP sent');
                            startCountdown(300);
                            setOtp(['', '', '', '', '', '']);
                          } catch (err) {
                            toast.error(err.response?.data?.message || 'Failed to resend OTP');
                          }
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--gold-primary)', cursor: 'pointer', fontSize: '0.85rem' }}
                        data-cursor="pointer"
                      >
                        Resend code
                      </button>
                    )}
                  </div>
                </motion.div>

                <motion.div variants={fadeInUp} className="form-group">
                  <label className="form-label">New Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input
                      type="password"
                      className="input-neu"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      style={{ paddingLeft: 44 }}
                      data-cursor="text"
                    />
                  </div>
                </motion.div>

                <motion.div variants={fadeInUp} className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input
                      type="password"
                      className="input-neu"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      style={{ paddingLeft: 44 }}
                      data-cursor="text"
                      onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
                    />
                  </div>
                </motion.div>

                <motion.button
                  variants={fadeInUp}
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="btn-primary"
                  data-cursor="pointer"
                  style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem' }}
                >
                  {loading ? <><Spinner size={18} /> Resetting...</> : 'Reset Password'}
                </motion.button>
              </>
            )}
          </motion.div>
        </div>
      </div>

      <style>{`@media (max-width: 767px) { .desktop-only-flex { display: none; } }`}</style>
    </motion.div>
  );
}

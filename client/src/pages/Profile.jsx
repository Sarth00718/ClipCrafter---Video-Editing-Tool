import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { CheckCircle2, Sun, Moon, AlertCircle, Activity, Edit2, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { authService, projectService } from '../services/index.js';
import Sidebar from '../components/layout/Sidebar.jsx';
import { Spinner } from '../components/ui/index.jsx';
import { getInitials, formatDate, formatRelative } from '../utils/formatters.js';
import { pageTransition, staggerContainer, fadeInUp } from '../utils/animations.js';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, completed: 0 });
  const [activityStats, setActivityStats] = useState(null);
  const [activityHistory, setActivityHistory] = useState([]);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [updating, setUpdating] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    projectService.getAll({ limit: 100 }).then((res) => {
      const projects = res.data.data?.projects || res.data.data || [];
      setStats({ total: projects.length, completed: projects.filter((p) => p.status === 'completed').length });
    }).catch(() => {});

    // Fetch activity stats
    authService.getActivityStats().then((res) => {
      setActivityStats(res.data.data);
    }).catch(() => {});

    // Fetch recent activity history
    authService.getActivityHistory({ limit: 10 }).then((res) => {
      setActivityHistory(res.data.data?.activities || []);
    }).catch(() => {});
  }, []);

  const handleSendOtp = async () => {
    setSending(true);
    try {
      await authService.sendOtp({ method: 'email', email: user?.email });
      setOtpSent(true);
      toast.success(`OTP sent to ${user?.email}`);
      // Countdown
      setResendTimer(60);
      const interval = setInterval(() => setResendTimer((t) => { if (t <= 1) { clearInterval(interval); return 0; } return t - 1; }), 1000);
    } catch (err) {
      const message = err.userMessage || err.response?.data?.message || 'Failed to send OTP';
      toast.error(message);
    } finally { setSending(false); }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 6) { toast.error('Enter 6-digit OTP'); return; }
    setVerifying(true);
    try {
      await authService.verifyOtp({ otp: code, method: 'email' });
      toast.success('Email verified!');
      updateUser({ isVerified: true });
      setOtpSent(false);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      const message = err.userMessage || err.response?.data?.message || 'Invalid OTP';
      toast.error(message);
    } finally { setVerifying(false); }
  };

  const handleOtpChange = (val, idx) => {
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    setUpdating(true);
    try {
      const updateData = { name: editName };
      if (editPhone) updateData.phone = editPhone;
      
      const res = await authService.updateProfile(updateData);
      updateUser(res.data.data.user);
      toast.success('Profile updated successfully');
      setShowEditModal(false);
    } catch (err) {
      const message = err.userMessage || err.response?.data?.message || 'Failed to update profile';
      toast.error(message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== user?.email) {
      toast.error('Email does not match');
      return;
    }
    setDeleting(true);
    try {
      await authService.deleteAccount();
      toast.success('Account deleted successfully');
      await logout();
      navigate('/');
    } catch (err) {
      const message = err.userMessage || err.response?.data?.message || 'Failed to delete account';
      toast.error(message);
      setDeleting(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a JPEG, PNG, or WebP image');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload immediately
    handleAvatarUpload(file);
  };

  const handleAvatarUpload = async (file) => {
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await authService.updateAvatar(formData);
      const updatedUser = res.data.data.user;
      updateUser({ avatar: updatedUser.avatar });
      toast.success('Avatar updated successfully');
      setAvatarPreview(null);
    } catch (err) {
      const message = err.userMessage || err.response?.data?.message || 'Failed to upload avatar';
      toast.error(message);
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <motion.div {...pageTransition} style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 240, padding: '32px', maxWidth: 800 }}>
        <h1 style={{ 
          fontFamily: 'var(--font-display)', 
          fontSize: '1.8rem', 
          fontWeight: 800, 
          marginBottom: 32,
          color: 'var(--text-primary)',
          textShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
          Account Settings
        </h1>

        <motion.div variants={staggerContainer} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Avatar & Name */}
          <motion.div variants={fadeInUp} className="glass-card" style={{ padding: '28px', display: 'flex', alignItems: 'center', gap: 24, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ position: 'relative' }}>
                {user?.avatar?.url || avatarPreview ? (
                  <img 
                    src={avatarPreview || user.avatar.url} 
                    alt={user?.name} 
                    style={{ 
                      width: 80, 
                      height: 80, 
                      borderRadius: '50%', 
                      objectFit: 'cover',
                      border: '3px solid var(--gold-primary)',
                      opacity: uploadingAvatar ? 0.5 : 1
                    }} 
                  />
                ) : (
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--gradient-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, color: 'var(--text-inverse)', flexShrink: 0 }}>
                    {getInitials(user?.name || 'U')}
                  </div>
                )}
                {uploadingAvatar && (
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                    <Spinner size={24} />
                  </div>
                )}
                <input 
                  type="file" 
                  id="avatar-upload" 
                  accept="image/jpeg,image/png,image/webp" 
                  style={{ display: 'none' }} 
                  onChange={handleAvatarChange}
                  disabled={uploadingAvatar}
                />
                <button 
                  onClick={() => document.getElementById('avatar-upload').click()}
                  disabled={uploadingAvatar}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'var(--gold-primary)',
                    border: '2px solid var(--bg-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  data-cursor="pointer"
                  title="Change avatar"
                >
                  <Edit2 size={12} color="#0a0806" />
                </button>
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{user?.name}</h2>
                <p style={{ color: 'var(--text-muted)', margin: '4px 0 8px' }}>{user?.email}</p>
                {user?.isVerified !== false ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4ade80', fontSize: '0.8rem' }}>
                    <CheckCircle2 size={14} /> Verified account
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fbbf24', fontSize: '0.8rem' }}>
                    <AlertCircle size={14} /> Unverified
                  </div>
                )}
              </div>
            </div>
            <button 
              onClick={() => {
                setEditName(user?.name || '');
                setEditPhone(user?.phone || '');
                setShowEditModal(true);
              }} 
              className="btn-ghost btn-sm" 
              data-cursor="pointer"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Edit2 size={14} /> Edit
            </button>
          </motion.div>

          {/* Account Info */}
          <motion.div variants={fadeInUp} className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ 
              fontFamily: 'var(--font-display)', 
              fontSize: '1.1rem', 
              fontWeight: 700, 
              marginBottom: 16,
              color: 'var(--text-primary)'
            }}>
              Account Information
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Full Name', value: user?.name },
                { label: 'Email', value: user?.email },
                { label: 'Phone', value: user?.phone || 'Not set' },
                { label: 'Role', value: user?.role || 'user' },
                { label: 'Member Since', value: formatDate(user?.createdAt) || 'N/A' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--border-default)' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>{value || '—'}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* OTP Verification */}
          {user?.isVerified === false && (
            <motion.div variants={fadeInUp} className="glass-card" style={{ padding: '24px', border: '1px solid rgba(251,191,36,0.3)' }}>
              <h3 style={{ 
                fontFamily: 'var(--font-display)', 
                fontSize: '1.1rem', 
                fontWeight: 700, 
                marginBottom: 8,
                color: 'var(--text-primary)'
              }}>
                <AlertCircle size={18} style={{ color: '#fbbf24', marginRight: 8, verticalAlign: 'middle' }} />
                Verify Your Email
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 16 }}>
                Verify your email to unlock all features.
              </p>
              {!otpSent ? (
                <button onClick={handleSendOtp} disabled={sending} className="btn-primary btn-sm" data-cursor="pointer">
                  {sending ? <><Spinner size={14} /> Sending...</> : 'Send Verification Code'}
                </button>
              ) : (
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>Enter the 6-digit code sent to {user?.email}</p>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
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
                          width: 44, height: 52, textAlign: 'center', borderRadius: 8,
                          border: '1px solid var(--border-default)', background: 'var(--bg-elevated)',
                          color: 'var(--text-primary)', fontFamily: 'var(--font-mono)',
                          fontSize: '1.4rem', fontWeight: 700, outline: 'none',
                          transition: 'border-color 0.2s',
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--gold-primary)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border-default)'}
                      />
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <button onClick={handleVerifyOtp} disabled={verifying} className="btn-primary btn-sm" data-cursor="pointer">
                      {verifying ? <><Spinner size={14} /> Verifying...</> : 'Verify'}
                    </button>
                    {resendTimer > 0 ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Resend in {resendTimer}s</span>
                    ) : (
                      <button onClick={handleSendOtp} style={{ background: 'none', border: 'none', color: 'var(--gold-primary)', cursor: 'pointer', fontSize: '0.8rem' }}>Resend OTP</button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Theme */}
          <motion.div variants={fadeInUp} className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ 
              fontFamily: 'var(--font-display)', 
              fontSize: '1.1rem', 
              fontWeight: 700, 
              marginBottom: 16,
              color: 'var(--text-primary)'
            }}>
              Appearance
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { key: 'dark', label: 'Dark', icon: Moon, desc: 'Cinema dark golden theme' },
                { key: 'light', label: 'Light', icon: Sun, desc: 'Bright and airy theme' },
              ].map(({ key, label, icon: Icon, desc }) => (
                <button
                  key={key}
                  onClick={() => key !== theme && toggleTheme()}
                  data-cursor="pointer"
                  style={{
                    padding: '16px', borderRadius: 12,
                    border: `2px solid ${theme === key ? 'var(--gold-primary)' : 'var(--border-default)'}`,
                    background: theme === key ? 'var(--gold-subtle)' : 'var(--bg-elevated)',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                    display: 'flex', gap: 12, alignItems: 'center',
                  }}
                >
                  <Icon size={20} style={{ color: theme === key ? 'var(--primary)' : 'var(--text-muted)' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: theme === key ? 'var(--primary-light)' : 'var(--text-primary)' }}>{label}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div variants={fadeInUp} className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ 
              fontFamily: 'var(--font-display)', 
              fontSize: '1.1rem', 
              fontWeight: 700, 
              marginBottom: 16,
              color: 'var(--text-primary)'
            }}>
              Your Activity
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              {[
                { label: 'Total Projects', value: stats.total },
                { label: 'Videos Completed', value: stats.completed },
              ].map(({ label, value }) => (
                <div key={label} style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 10 }}>
                  <div style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 900 }} className="gradient-text">{value}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</div>
                </div>
              ))}
            </div>
            
            {activityStats && (
              <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 10, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Activity size={16} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Activity Stats</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.8rem' }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>Total Activities:</span> <strong>{activityStats.totalActivities}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Active Days:</span> <strong>{activityStats.activeDays}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>This Week:</span> <strong>{activityStats.thisWeek}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Last Active:</span> <strong>{formatRelative(activityStats.lastActive)}</strong></div>
                </div>
              </div>
            )}

            {activityHistory.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Recent Activity</span>
                  {activityHistory.length > 5 && (
                    <button 
                      onClick={() => setShowAllActivity(!showAllActivity)} 
                      style={{ background: 'none', border: 'none', color: 'var(--gold-primary)', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                      {showAllActivity ? 'Show less' : 'View all'}
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(showAllActivity ? activityHistory : activityHistory.slice(0, 5)).map((activity, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        padding: '10px 12px', 
                        background: 'var(--bg-elevated)', 
                        borderRadius: 8,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{activity.action}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatRelative(activity.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Danger Zone */}
          <motion.div variants={fadeInUp} style={{ padding: '24px', borderRadius: 16, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.03)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#f87171', marginBottom: 8 }}>Danger Zone</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 16 }}>Permanently delete your account and all data.</p>
            <button onClick={() => setShowDeleteModal(true)} className="btn-danger btn-sm" data-cursor="pointer">Delete Account</button>
          </motion.div>
        </motion.div>
      </main>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 420 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 16 }}>Edit Profile</h3>
            
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                className="input-neu" 
                value={editName} 
                onChange={(e) => setEditName(e.target.value)} 
                placeholder="Your name"
                data-cursor="text"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number (Optional)</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input 
                  className="input-neu" 
                  value={editPhone} 
                  onChange={(e) => setEditPhone(e.target.value)} 
                  placeholder="+1234567890"
                  data-cursor="text"
                  style={{ paddingLeft: 44 }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button 
                onClick={handleUpdateProfile} 
                disabled={updating}
                className="btn-primary" 
                data-cursor="pointer"
                style={{ flex: 1 }}
              >
                {updating ? <><Spinner size={14} /> Updating...</> : 'Save Changes'}
              </button>
              <button 
                className="btn-ghost" 
                onClick={() => setShowEditModal(false)} 
                data-cursor="pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 380 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: '#f87171', marginBottom: 8 }}>Delete Account?</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 16 }}>This is irreversible. Type your email to confirm.</p>
            <input className="input-neu" placeholder={user?.email} value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} data-cursor="text" style={{ marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                disabled={deleteConfirm !== user?.email || deleting} 
                className="btn-danger" 
                data-cursor="pointer" 
                onClick={handleDeleteAccount}
              >
                {deleting ? <><Spinner size={14} /> Deleting...</> : 'Delete Account'}
              </button>
              <button className="btn-ghost" onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); }} data-cursor="pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@media (max-width: 1023px) { main[style] { margin-left: 0 !important; } }`}</style>
    </motion.div>
  );
}

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit3, CheckCircle2, Shield, RotateCcw, Sparkles, Film, Upload, LogIn } from 'lucide-react';
import { authService } from '../../services/index.js';
import { staggerContainer, fadeInUp } from '../../utils/animations.js';
import { formatRelative } from '../../utils/formatters.js';
import { Spinner } from '../ui/index.jsx';

const iconMap = {
  edit: Edit3,
  generate: Film,
  factcheck: Shield,
  undo: RotateCcw,
  upload: Upload,
  login: LogIn,
  default: CheckCircle2,
};

const typeColor = {
  edit: 'var(--gold-primary)',
  generate: '#4ade80',
  factcheck: '#fbbf24',
  undo: '#60a5fa',
  upload: '#a78bfa',
  login: '#34d399',
  default: 'var(--gold-primary)',
};

function getActivityType(action = '') {
  const a = action.toLowerCase();
  if (a.includes('edit') || a.includes('update') || a.includes('save')) return 'edit';
  if (a.includes('generat')) return 'generate';
  if (a.includes('fact') || a.includes('check')) return 'factcheck';
  if (a.includes('undo') || a.includes('revert')) return 'undo';
  if (a.includes('upload')) return 'upload';
  if (a.includes('login') || a.includes('sign')) return 'login';
  return 'default';
}

export default function ActivityFeed({ activities: propActivities }) {
  const [activities, setActivities] = useState(propActivities || []);
  const [loading, setLoading] = useState(!propActivities);

  useEffect(() => {
    // If activities were passed as a prop, use them directly (no fetch needed)
    if (propActivities) return;
    // Fetch real activity from API
    authService.getActivityHistory({ limit: 10 })
      .then((res) => {
        const data = res.data.data?.activities || res.data.data || [];
        setActivities(data);
      })
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
        <Spinner size={24} />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
        <Sparkles size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
        <p style={{ margin: 0, fontSize: '0.875rem' }}>No recent activity</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
    >
      {activities.map((item, i) => {
        const type = getActivityType(item.action || item.type || item.message || '');
        const Icon = iconMap[type] || CheckCircle2;
        const color = typeColor[type] || 'var(--gold-primary)';
        const label = item.action || item.message || 'Activity';
        const sub = item.metadata?.projectTitle || item.project || item.metadata?.detail || '';
        const time = formatRelative(item.createdAt || item.time);

        return (
          <motion.div
            key={item._id || i}
            variants={fadeInUp}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: 10, transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: `${color}18`, border: `1px solid ${color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon size={14} color={color} />
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {label}
              </div>
              {sub && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sub}
                </div>
              )}
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>{time}</span>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

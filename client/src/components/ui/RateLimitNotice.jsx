import { AlertTriangle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Rate Limit Notice Component
 * Displays a warning when rate limit is approaching or exceeded
 */
export default function RateLimitNotice({ 
  show = false, 
  retryAfter = null, 
  type = 'warning' // 'warning' | 'error'
}) {
  if (!show) return null;

  const isError = type === 'error';
  const bgColor = isError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(251, 191, 36, 0.1)';
  const borderColor = isError ? 'rgba(239, 68, 68, 0.3)' : 'rgba(251, 191, 36, 0.3)';
  const textColor = isError ? '#f87171' : '#fbbf24';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{
        padding: '12px 16px',
        borderRadius: 10,
        background: bgColor,
        border: `1px solid ${borderColor}`,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
      }}
    >
      {isError ? (
        <AlertTriangle size={18} color={textColor} style={{ flexShrink: 0 }} />
      ) : (
        <Clock size={18} color={textColor} style={{ flexShrink: 0 }} />
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: textColor, marginBottom: 2 }}>
          {isError ? 'Rate Limit Exceeded' : 'Approaching Rate Limit'}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          {isError ? (
            retryAfter ? (
              `Too many requests. Please try again in ${retryAfter} seconds.`
            ) : (
              'Too many requests. Please try again in a few minutes.'
            )
          ) : (
            'You\'re making requests quickly. Please slow down to avoid being rate limited.'
          )}
        </div>
      </div>
    </motion.div>
  );
}

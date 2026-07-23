import { motion } from 'framer-motion';
import { X, Shield, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { ProgressBar } from '../ui/index.jsx';

export default function FactCheckModal({ result, onClose }) {
  if (!result) return null;

  const { confidence, issues = [], result: resultText } = result;
  const confidencePercent = Math.round((confidence || 0) * 100);
  
  const getConfidenceColor = () => {
    if (confidencePercent >= 90) return '#4ade80';
    if (confidencePercent >= 70) return '#fbbf24';
    return '#f87171';
  };

  const getConfidenceLabel = () => {
    if (confidencePercent >= 90) return 'High Confidence';
    if (confidencePercent >= 70) return 'Medium Confidence';
    return 'Low Confidence';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        style={{ maxWidth: 600 }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'var(--gold-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={20} color="var(--gold-primary)" />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
              Fact Check Results
            </h2>
          </div>
          <button onClick={onClose} className="btn-icon" data-cursor="pointer">
            <X size={18} />
          </button>
        </div>

        {/* Confidence Score */}
        <div
          className="glass-card"
          style={{
            padding: 24,
            marginBottom: 20,
            textAlign: 'center',
            background: `linear-gradient(135deg, ${getConfidenceColor()}10, transparent)`,
            border: `1px solid ${getConfidenceColor()}30`,
          }}
        >
          <div style={{ fontSize: '3rem', fontFamily: 'var(--font-display)', fontWeight: 900, color: getConfidenceColor(), marginBottom: 8 }}>
            {confidencePercent}%
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16 }}>
            {getConfidenceLabel()}
          </div>
          <ProgressBar value={confidencePercent} color={getConfidenceColor()} />
        </div>

        {/* Result Text */}
        {resultText && (
          <div
            className="glass-card"
            style={{
              padding: 16,
              marginBottom: 20,
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
            }}
          >
            <Info size={18} color="var(--gold-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              {resultText}
            </p>
          </div>
        )}

        {/* Issues List */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
              Issues Found
            </h3>
            <span
              className={issues.length === 0 ? 'badge badge-completed' : 'badge badge-warning'}
              style={{ fontSize: '0.7rem' }}
            >
              {issues.length}
            </span>
          </div>

          {issues.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '32px 20px',
                background: 'var(--bg-elevated)',
                borderRadius: 12,
              }}
            >
              <CheckCircle size={48} color="#4ade80" style={{ marginBottom: 12, opacity: 0.8 }} />
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                No Issues Detected
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                The content appears to be factually accurate
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {issues.map((issue, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass-card"
                  style={{
                    padding: 14,
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                    border: '1px solid rgba(251, 191, 36, 0.2)',
                  }}
                >
                  <AlertTriangle size={16} color="#fbbf24" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                      {typeof issue === 'string' ? issue : issue.description || issue.message || 'Unknown issue'}
                    </p>
                    {issue.severity && (
                      <span
                        className="badge"
                        style={{
                          fontSize: '0.65rem',
                          marginTop: 6,
                          background:
                            issue.severity === 'high'
                              ? 'rgba(239, 68, 68, 0.1)'
                              : issue.severity === 'medium'
                              ? 'rgba(251, 191, 36, 0.1)'
                              : 'rgba(156, 163, 175, 0.1)',
                          color:
                            issue.severity === 'high'
                              ? '#f87171'
                              : issue.severity === 'medium'
                              ? '#fbbf24'
                              : 'var(--text-muted)',
                        }}
                      >
                        {issue.severity} severity
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-default)' }}>
          <button onClick={onClose} className="btn-primary" data-cursor="pointer" style={{ width: '100%', justifyContent: 'center' }}>
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

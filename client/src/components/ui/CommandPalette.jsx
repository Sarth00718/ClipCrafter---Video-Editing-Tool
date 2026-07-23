import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, BarChart3, Plus, User, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCommandPalette } from '../../hooks/index.js';
import { NAV_COMMANDS } from '../../utils/seedData.js';

export default function CommandPalette() {
  const { isAuthenticated } = useAuth();
  const { isOpen, close } = useCommandPalette();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setTimeout(() => setQuery(''), 0);
    }
  }, [isOpen]);

  if (!isAuthenticated) return null;

  const iconMap = { BarChart3, Plus, User };

  const filtered = NAV_COMMANDS.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  const go = (route) => { navigate(route); close(); };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={close}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 2000 }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
              width: '100%', maxWidth: 560,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 16,
              overflow: 'hidden',
              zIndex: 2001,
              boxShadow: 'var(--shadow-glow), 0 32px 80px rgba(0,0,0,0.5)',
            }}
          >
            {/* Search input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--border-default)' }}>
              <Search size={18} color="var(--text-muted)" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search commands..."
                data-cursor="text"
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '1rem',
                }}
              />
              <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <X size={16} />
              </button>
            </div>
            {/* Results */}
            <div style={{ padding: '8px 0', maxHeight: 320, overflowY: 'auto' }}>
              {filtered.length === 0 && (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No commands found</div>
              )}
              {filtered.map((cmd) => {
                const Icon = iconMap[cmd.icon] || Search;
                return (
                  <button
                    key={cmd.route}
                    onClick={() => go(cmd.route)}
                    data-cursor="pointer"
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 20px', background: 'none', border: 'none',
                      cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
                      color: 'var(--text-primary)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--gold-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={16} color="var(--gold-primary)" />
                    </div>
                    <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: '0.95rem' }}>{cmd.label}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', padding: '2px 8px', border: '1px solid var(--border-default)', borderRadius: 6 }}>{cmd.shortcut}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ padding: '8px 20px 12px', borderTop: '1px solid var(--border-default)', display: 'flex', gap: 16 }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>↵ to select</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>ESC to close</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

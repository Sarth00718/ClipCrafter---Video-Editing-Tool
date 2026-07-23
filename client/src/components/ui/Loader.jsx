import { motion } from 'framer-motion';

export default function Loader() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 24, zIndex: 9999,
    }}>
      {/* Logo mark */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        style={{
          width: 60, height: 60,
          borderRadius: '50%',
          border: '3px solid var(--border-default)',
          borderTopColor: 'var(--gold-primary)',
        }}
      />
      <motion.p
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', letterSpacing: '0.1em' }}
      >
        LOADING
      </motion.p>
    </div>
  );
}

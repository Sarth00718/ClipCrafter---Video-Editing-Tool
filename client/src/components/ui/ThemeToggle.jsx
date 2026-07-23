import { useTheme } from '../../context/ThemeContext.jsx';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ThemeToggle({ size = 'md' }) {
  const { theme, toggleTheme } = useTheme();
  const s = size === 'sm' ? 16 : 20;

  return (
    <motion.button
      onClick={toggleTheme}
      data-cursor="pointer"
      whileTap={{ scale: 0.9 }}
      style={{
        width: size === 'sm' ? 32 : 40,
        height: size === 'sm' ? 32 : 40,
        borderRadius: '50%',
        border: '1px solid var(--border-default)',
        background: 'var(--bg-elevated)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'var(--gold-primary)',
        transition: 'all 0.3s',
        flexShrink: 0,
      }}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {theme === 'dark' ? <Sun size={s} /> : <Moon size={s} />}
      </motion.div>
    </motion.button>
  );
}

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PlusCircle, Upload, ArrowRight } from 'lucide-react';

export default function QuickActions() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {[
        {
          icon: PlusCircle,
          title: 'Create New Project',
          desc: 'Turn your content into a professional video',
          to: '/projects/create',
          isPrimary: true,
        },
        {
          icon: Upload,
          title: 'Dashboard Overview',
          desc: 'View all your projects and stats',
          to: '/dashboard',
          isPrimary: false,
        },
      ].map(({ icon: Icon, title, desc, to, isPrimary }) => (
        <Link key={to} to={to} data-cursor="pointer" style={{ textDecoration: 'none' }}>
          <motion.div
            whileHover={{ y: -4, boxShadow: 'var(--shadow-glow)' }}
            transition={{ duration: 0.2 }}
            className="glass-card"
            style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 12, height: '100%', cursor: 'pointer' }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 14, background: isPrimary ? 'var(--gradient-gold)' : 'var(--gold-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={22} color={isPrimary ? '#0a0806' : 'var(--gold-primary)'} />
            </div>
            <div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>{title}</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{desc}</p>
            </div>
            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gold-primary)', fontSize: '0.8rem', fontWeight: 600 }}>
              Get started <ArrowRight size={14} />
            </div>
          </motion.div>
        </Link>
      ))}
    </div>
  );
}

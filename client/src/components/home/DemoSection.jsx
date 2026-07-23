import { useState } from 'react';
import { motion } from 'framer-motion';
import { Monitor, CheckCircle2 } from 'lucide-react';
import { slideInLeft, slideInRight } from '../../utils/animations.js';
import { unsplash } from '../../utils/imageLoader.js';

const TABS = [
  { label: 'Research Paper', key: 'research', desc: '12 scenes • 4:30 min • 96% accuracy' },
  { label: 'Lecture Notes', key: 'lecture', desc: '8 scenes • 3:00 min • 98% accuracy' },
  { label: 'Policy Brief', key: 'policy', desc: '6 scenes • 2:15 min • 97% accuracy' },
];

const FEATURES_DEMO = [
  { title: 'Scene-Level Editor', desc: 'Edit individual scenes independently without touching the full video.' },
  { title: 'AI Citation Grounding', desc: 'Every claim traced to your source document in real time.' },
  { title: 'Confidence Scoring', desc: 'Know exactly how confident the AI is before you publish.' },
  { title: 'Edit History', desc: 'Roll back any change at any time with one click.' },
];

export default function DemoSection() {
  const [activeTab, setActiveTab] = useState('research');

  return (
    <section id="demo" className="section">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{ textAlign: 'center', marginBottom: 64 }}
        >
          <span className="section-label" style={{ marginBottom: 20, display: 'inline-flex' }}>See It In Action</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', marginBottom: 16 }}>
            The Editor That <span className="gradient-text">Thinks With You</span>
          </h2>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          {/* Left — Features list */}
          <motion.div
            variants={slideInLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
          >
            {FEATURES_DEMO.map(({ title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gold-subtle)', border: '1px solid var(--border-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  <CheckCircle2 size={14} color="var(--gold-primary)" />
                </div>
                <div>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, marginBottom: 4 }}>{title}</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Right — Browser mockup */}
          <motion.div
            variants={slideInRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {/* Tab switcher */}
            <div className="tabs-row" style={{ marginBottom: 16 }}>
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                  data-cursor="pointer"
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {/* Sub info */}
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
              {TABS.find((t) => t.key === activeTab)?.desc}
            </p>

            {/* Browser frame */}
            <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-glow)' }}>
              {/* Browser chrome */}
              <div style={{ background: 'var(--bg-elevated)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border-default)' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['#f87171', '#fbbf24', '#4ade80'].map((c) => (
                    <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                  ))}
                </div>
                <div style={{ flex: 1, background: 'var(--bg-card)', borderRadius: 6, padding: '4px 10px', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  clipcrafters.app/editor/demo
                </div>
                <Monitor size={14} color="var(--text-muted)" />
              </div>
              {/* Dashboard image */}
              <div style={{ position: 'relative' }}>
                <img src={unsplash.dashboard} alt="ClipCrafters Editor" loading="lazy" style={{ width: '100%', height: 280, objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(10,8,6,0.6), rgba(201,168,76,0.05))' }} />
                {/* Floating labels */}
                <div style={{ position: 'absolute', top: 20, left: 20, padding: '6px 12px', borderRadius: 8, background: 'rgba(10,8,6,0.9)', border: '1px solid var(--border-active)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--gold-light)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>Scene Panel</span>
                </div>
                <div className="glass-card" style={{ position: 'absolute', top: 20, right: 20, padding: '6px 12px', borderRadius: 8, background: 'rgba(10,8,6,0.9)', border: '1px solid var(--border-active)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--gold-light)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>AI Grounding</span>
                </div>
                <div className="glass-card" style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', padding: '6px 12px', borderRadius: 8, background: 'rgba(10,8,6,0.9)', border: '1px solid var(--border-active)', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--gold-light)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>Edit History ↩</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          #demo .container > div > div:first-child { display: none; }
          #demo .container > div { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

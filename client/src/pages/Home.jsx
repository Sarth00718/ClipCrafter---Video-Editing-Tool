import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  ArrowRight, Star, Video, Mic, Sparkles, Edit3, Shield, Brain,
  Activity, History, Zap, Film, CheckCircle2, Layers, ChevronRight,
} from 'lucide-react';
import PageTransition from '../components/common/PageTransition.jsx';
import ScrollReveal from '../components/common/ScrollReveal.jsx';
import ParticleField from '../components/ui/ParticleField.jsx';
import Navbar from '../components/layout/Navbar.jsx';
import Footer from '../components/layout/Footer.jsx';
import { unsplash } from '../utils/imageLoader.js';
import { FEATURES, STATS, TESTIMONIALS, PRICING } from '../utils/seedData.js';
import { staggerContainer, fadeInUp, floatY } from '../utils/animations.js';
import useAnimatedCounter from '../hooks/useAnimatedCounter.js';

const iconMap = { Edit3, Shield, Brain, Activity, History, Zap, Film, CheckCircle2, Layers };

export default function Home({ snowfallEnabled, setSnowfallEnabled }) {
  return (
    <PageTransition>
      <Navbar snowfallEnabled={snowfallEnabled} setSnowfallEnabled={setSnowfallEnabled} />
      <main>
        <HeroSection />
        <div className="section-separator">
          <div className="separator-line"></div>
          <div className="separator-glow"></div>
        </div>
        <FeaturesSection />
        <StatsSection />
        <TestimonialsSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </PageTransition>
  );
}

/* ─── HERO ──────────────────────────────────── */
function HeroSection() {
  const { isAuthenticated } = useAuth();
  return (
    <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'var(--gradient-hero)' }} />
      <div style={{ position: 'absolute', inset: 0 }}><ParticleField count={60} /></div>

      <div style={{ position: 'relative', zIndex: 10, maxWidth: 1280, margin: '0 auto', padding: '96px 32px 60px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center', width: '100%' }} className="hero-grid">
        {/* Left */}
        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          <motion.div variants={fadeInUp} className="section-label" style={{ marginBottom: 24 }}>✦ AI-Powered Video Creation</motion.div>
          <motion.h1 variants={fadeInUp} style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: 24, color: 'var(--text-primary)' }}>
            Create Expert Videos,{' '}
            <span className="gradient-text" style={{ fontStyle: 'italic' }}>Powered by Agentic AI</span>
          </motion.h1>
          <motion.p variants={fadeInUp} style={{ fontSize: '1.05rem', marginBottom: 32, maxWidth: 480, lineHeight: 1.7, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
            Transform research papers, reports, and lecture notes into stunning, accurate videos. AI writes, grounds, and verifies — you stay in control.
          </motion.p>

          <motion.div variants={fadeInUp} style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 40 }}>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="btn-primary" data-cursor="pointer" style={{ fontSize: '1rem', padding: '13px 28px' }}>
                  Go to Dashboard <ArrowRight size={18} />
                </Link>
                <Link to="/projects/create" className="btn-ghost" data-cursor="pointer" style={{ fontSize: '1rem', padding: '13px 28px' }}>
                  Create Project <ChevronRight size={16} />
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn-primary" data-cursor="pointer" style={{ fontSize: '1rem', padding: '13px 28px' }}>
                  Start Creating Free <ArrowRight size={18} />
                </Link>
                <a href="#demo" className="btn-ghost" data-cursor="pointer" style={{ fontSize: '1rem', padding: '13px 28px' }}>
                  Watch Demo <ChevronRight size={16} />
                </a>
              </>
            )}
          </motion.div>

          <motion.div variants={fadeInUp} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex' }}>
              {[unsplash.avatar1, unsplash.avatar2, unsplash.avatar3, unsplash.avatar4].map((src, i) => (
                <img key={i} src={src} alt="user" style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--bg-primary)', marginLeft: i === 0 ? 0 : -8, objectFit: 'cover' }} />
              ))}
            </div>
            <div>
              <div style={{ display: 'flex', gap: 2, marginBottom: 2 }}>
                {Array(5).fill(0).map((_, i) => <Star key={i} size={12} fill="#c9a84c" color="#c9a84c" />)}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>Trusted by 10,000+ creators</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Right — floating hero cards */}
        <div style={{ position: 'relative', height: 500, display: 'none' }} className="hero-right">
          {/* Main video editing screenshot */}
          <motion.div 
            variants={floatY} 
            animate="animate" 
            style={{ 
              position: 'absolute', 
              top: 20, 
              right: 0, 
              width: 480, 
              height: 280, 
              borderRadius: 16, 
              overflow: 'hidden', 
              border: '1px solid var(--border-default)', 
              boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(201,168,76,0.15)',
              transform: 'perspective(1000px) rotateY(-5deg)',
            }}
          >
            <img 
              src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80" 
              alt="Video Editing Interface" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,8,6,0.6), transparent)' }} />
          </motion.div>

          {/* Output Quality Card */}
          <motion.div 
            variants={floatY} 
            animate="animate" 
            transition={{ delay: 0.3 }} 
            className="glass-card" 
            style={{ 
              position: 'absolute', 
              top: 320, 
              right: 80, 
              padding: 20, 
              width: 200,
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}
          >
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, fontFamily: 'var(--font-body)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Output Quality</p>
            <p className="gradient-text" style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: 900, margin: 0, lineHeight: 1 }}>4K</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--gold-primary)', fontFamily: 'var(--font-body)', margin: 0, marginTop: 4 }}>98% Accuracy</p>
          </motion.div>

          {/* AI Processing Card */}
          <motion.div 
            variants={floatY} 
            animate="animate" 
            transition={{ delay: 0.6 }} 
            className="glass-card" 
            style={{ 
              position: 'absolute', 
              bottom: 80, 
              left: 0, 
              padding: 16, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12, 
              width: 240,
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{ padding: 10, borderRadius: 10, background: 'var(--gold-subtle)', border: '1px solid var(--border-active)' }}>
              <Sparkles size={22} style={{ color: 'var(--gold-primary)' }} />
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-body)' }}>AI Processing</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, fontFamily: 'var(--font-body)' }}>Generating scenes...</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom feature row */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderTop: '1px solid var(--border-default)', background: 'var(--bg-secondary)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 32px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="hero-bottom-grid">
          {[
            { icon: Video, title: '4K Output', sub: 'Ultra HD quality' },
            { icon: Mic, title: 'Voice Sync', sub: 'AI narration' },
            { icon: Sparkles, title: 'AI Scripts', sub: '10x faster' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px' }}>
              <item.icon size={20} style={{ color: 'var(--gold-primary)', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-body)' }}>{item.title}</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, fontFamily: 'var(--font-body)' }}>{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) { .hero-right { display: block !important; } }
        @media (max-width: 1023px) { .hero-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 600px) { .hero-bottom-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}

/* ─── FEATURES ──────────────────────────────── */
function FeaturesSection() {
  return (
    <section id="features" style={{ padding: '96px 0', background: 'var(--bg-primary)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <ScrollReveal>
            <span className="section-label" style={{ marginBottom: 16, display: 'inline-flex' }}>✦ FEATURES</span>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 900, marginBottom: 16, color: 'var(--text-primary)', textAlign: 'center' }}>
              Built for <span className="gradient-text" style={{ fontStyle: 'italic' }}>precision</span>, not just speed
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 640, margin: '0 auto', fontFamily: 'var(--font-body)', fontSize: '1rem', lineHeight: 1.7, textAlign: 'center' }}>
              Every feature designed for researchers, educators, and experts who demand accuracy.
            </p>
          </ScrollReveal>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, maxWidth: 1200, margin: '0 auto' }}>
          {FEATURES.map((f, i) => {
            const Icon = iconMap[f.icon];
            return (
              <ScrollReveal key={i} delay={i * 0.08}>
                <div className="glass-card card-3d" style={{ padding: 32, height: '100%', display: 'flex', flexDirection: 'column' }} data-cursor="pointer">
                  <div style={{ width: 56, height: 56, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, background: 'var(--gold-subtle)', border: '1px solid var(--border-default)' }}>
                    {Icon && <Icon size={28} style={{ color: f.color }} />}
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.15rem', marginBottom: 12, color: 'var(--text-primary)', lineHeight: 1.3 }}>{f.title}</h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0 }}>{f.desc}</p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── STATS ─────────────────────────────────── */
function StatCard({ stat }) {
  const Icon = iconMap[stat.icon];
  const { count, ref } = useAnimatedCounter(stat.value);
  return (
    <div ref={ref} style={{ textAlign: 'center', padding: '32px 16px' }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', background: 'var(--gold-subtle)', border: '1px solid var(--border-default)' }}>
        {Icon && <Icon size={22} style={{ color: 'var(--gold-primary)' }} />}
      </div>
      <p className="gradient-text" style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 900, margin: '0 0 4px' }}>
        {count}<span>{stat.suffix}</span>
      </p>
      <p style={{ fontSize: '0.7rem', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', margin: 0 }}>{stat.label}</p>
    </div>
  );
}

function StatsSection() {
  return (
    <section style={{ borderTop: '1px solid var(--border-default)', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-secondary)' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 32px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }} className="stats-grid">
        {STATS.map((stat, i) => <StatCard key={i} stat={stat} />)}
      </div>
      <style>{`@media (max-width: 640px) { .stats-grid { grid-template-columns: repeat(2, 1fr) !important; } }`}</style>
    </section>
  );
}

/* ─── TESTIMONIALS ──────────────────────────── */
function TestimonialsSection() {
  const [active, setActive] = React.useState(0);
  React.useEffect(() => {
    const timer = setInterval(() => setActive(p => (p + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(timer);
  }, []);
  const t = TESTIMONIALS[active];
  return (
    <section style={{ padding: '96px 0', background: 'var(--bg-primary)' }}>
      <div style={{ maxWidth: 768, margin: '0 auto', padding: '0 32px', textAlign: 'center' }}>
        <ScrollReveal>
          <span className="section-label" style={{ marginBottom: 24, display: 'inline-flex' }}>✦ Testimonials</span>
          <div style={{ position: 'relative', marginBottom: 32 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '6rem', position: 'absolute', top: -32, left: '50%', transform: 'translateX(-50%)', opacity: 0.1, color: 'var(--gold-primary)', lineHeight: 1 }}>"</span>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.1rem, 2vw, 1.4rem)', fontStyle: 'italic', lineHeight: 1.7, color: 'var(--text-primary)', position: 'relative' }}>"{t.quote}"</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
            <img src={t.avatar} alt={t.name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold-primary)' }} />
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>{t.name}</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{t.role}</p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            {TESTIMONIALS.map((_, i) => (
              <button key={i} onClick={() => setActive(i)} data-cursor="pointer" style={{ width: 8, height: 8, borderRadius: '50%', border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: i === active ? 'var(--gold-primary)' : 'var(--border-default)' }} />
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ─── PRICING ───────────────────────────────── */
function PricingSection() {
  const [annual, setAnnual] = React.useState(true);
  const navigate = useNavigate();
  return (
    <section id="pricing" style={{ padding: '96px 0', background: 'var(--bg-secondary)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        <ScrollReveal>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="section-label" style={{ marginBottom: 16, display: 'inline-flex' }}>✦ Pricing</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 900, marginBottom: 24, color: 'var(--text-primary)' }}>Simple, transparent pricing</h2>
            <div style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 100, padding: 4, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
              {['Monthly', 'Annual'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setAnnual(tab === 'Annual')}
                  data-cursor="pointer"
                  style={{
                    padding: '8px 20px', borderRadius: 100, border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.2s',
                    background: (annual ? tab === 'Annual' : tab === 'Monthly') ? 'var(--gradient-gold)' : 'transparent',
                    color: (annual ? tab === 'Annual' : tab === 'Monthly') ? '#0a0806' : 'var(--text-secondary)',
                  }}
                >
                  {tab} {tab === 'Annual' && <span style={{ fontSize: '0.7rem', marginLeft: 4 }}>Save 20%</span>}
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {PRICING.map((plan, i) => (
            <ScrollReveal key={i} delay={i * 0.1}>
              <div
                className="glass-card"
                style={{
                  padding: 32, height: '100%', display: 'flex', flexDirection: 'column',
                  border: plan.highlighted ? '2px solid var(--gold-primary)' : undefined,
                  boxShadow: plan.highlighted ? 'var(--shadow-glow)' : undefined,
                }}
              >
                {plan.highlighted && <span className="section-label" style={{ marginBottom: 16, alignSelf: 'flex-start' }}>Most Popular</span>}
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>{plan.name}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16, fontFamily: 'var(--font-body)' }}>{plan.desc}</p>
                <div style={{ marginBottom: 24 }}>
                  <span className="gradient-text" style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 900 }}>
                    ₹{annual ? plan.price.annual : plan.price.monthly}
                  </span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>/mo</span>
                </div>
                <ul style={{ listStyle: 'none', flex: 1, marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.875rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
                      <CheckCircle2 size={16} style={{ color: 'var(--gold-primary)', flexShrink: 0, marginTop: 2 }} /> {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={plan.highlighted ? 'btn-primary' : 'btn-ghost'}
                  data-cursor="pointer"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => navigate('/register')}
                >{plan.cta}</button>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ───────────────────────────────────── */
function CTASection() {
  const { isAuthenticated } = useAuth();
  return (
    <section style={{ padding: '96px 0', position: 'relative', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      {/* Gold gradient glow background */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(201,168,76,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 768, margin: '0 auto', padding: '0 32px', textAlign: 'center', position: 'relative' }}>
        <ScrollReveal>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, marginBottom: 16, color: 'var(--text-primary)' }}>
            {isAuthenticated ? 'Create Your Next Video' : 'Ready to Transform Your Research?'}
          </h2>
          <p style={{ fontSize: '1.1rem', marginBottom: 32, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', lineHeight: 1.7 }}>
            {isAuthenticated
              ? 'Go to your dashboard and start a new AI-powered project.'
              : 'Join 10,000+ researchers, educators, and experts.'
            }
          </p>
          {isAuthenticated ? (
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/dashboard" className="btn-primary" data-cursor="pointer" style={{ fontSize: '1.05rem', padding: '16px 40px' }}>
                Go to Dashboard <ArrowRight size={20} />
              </Link>
              <Link to="/projects/create" className="btn-ghost" data-cursor="pointer" style={{ fontSize: '1.05rem', padding: '16px 40px' }}>
                New Project
              </Link>
            </div>
          ) : (
            <Link to="/register" className="btn-primary" data-cursor="pointer" style={{ fontSize: '1.05rem', padding: '16px 40px' }}>
              Start Creating Free <ArrowRight size={20} />
            </Link>
          )}
        </ScrollReveal>
      </div>
    </section>
  );
}

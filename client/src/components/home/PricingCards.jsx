import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { PRICING } from '../../utils/seedData.js';
import { useCardTilt } from '../../hooks/index.js';

function PricingCard({ plan, isAnnual, index }) {
  const tiltRef = useCardTilt(8);
  const price = isAnnual ? plan.price.annual : plan.price.monthly;

  return (
    <motion.div
      ref={tiltRef}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="card-3d"
      style={{
        background: plan.highlighted 
          ? 'linear-gradient(135deg, rgba(201, 168, 76, 0.12) 0%, rgba(20, 16, 8, 0.98) 100%)'
          : 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        border: plan.highlighted ? '2px solid var(--gold-primary)' : '1px solid var(--border-default)',
        borderRadius: 24,
        padding: plan.highlighted ? '48px 32px' : '40px 28px',
        display: 'flex', 
        flexDirection: 'column', 
        gap: 28,
        position: 'relative',
        boxShadow: plan.highlighted 
          ? '0 20px 60px rgba(201, 168, 76, 0.3), 0 0 0 1px rgba(201, 168, 76, 0.2) inset'
          : 'var(--shadow-card)',
        transform: plan.highlighted ? 'scale(1.05)' : 'scale(1)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: plan.highlighted ? 2 : 1,
        minHeight: 520,
      }}
    >
      {/* Popular Badge */}
      {plan.highlighted && (
        <motion.div 
          initial={{ scale: 0, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          style={{
            position: 'absolute', 
            top: -16, 
            left: '50%', 
            transform: 'translateX(-50%)',
            background: 'var(--gradient-gold)',
            color: '#0a0806',
            padding: '6px 20px', 
            borderRadius: 100,
            fontSize: '0.7rem', 
            fontWeight: 800,
            letterSpacing: '0.1em',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 4px 20px rgba(201, 168, 76, 0.4)',
          }}
        >
          <Sparkles size={12} />
          MOST POPULAR
        </motion.div>
      )}

      {/* Animated border glow for Pro */}
      {plan.highlighted && (
        <div style={{
          position: 'absolute', 
          inset: -2, 
          borderRadius: 26, 
          zIndex: -1,
          background: 'linear-gradient(135deg, #c9a84c, #e8c97a, #c9a84c, #9a7a2e)',
          backgroundSize: '300% 300%',
          animation: 'gradient-shift 4s ease infinite',
          opacity: 0.6,
        }} />
      )}

      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: 20 }}>
        <h3 style={{ 
          fontFamily: 'var(--font-display)', 
          fontSize: '1.75rem', 
          fontWeight: 800, 
          marginBottom: 8,
          color: plan.highlighted ? 'var(--gold-light)' : 'var(--text-primary)',
        }}>
          {plan.name}
        </h3>
        <p style={{ 
          fontSize: '0.9rem', 
          color: plan.highlighted ? 'var(--text-secondary)' : 'var(--text-muted)', 
          margin: 0,
          lineHeight: 1.5,
        }}>
          {plan.desc}
        </p>
      </div>

      {/* Price */}
      <AnimatePresence mode="wait">
        <motion.div
          key={isAnnual ? 'annual' : 'monthly'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          style={{ paddingBottom: 20 }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
            <span style={{ 
              fontSize: '1.1rem', 
              color: plan.highlighted ? 'var(--gold-primary)' : 'var(--text-muted)',
              fontWeight: 600,
            }}>
              ₹
            </span>
            <span style={{ 
              fontSize: '3.5rem', 
              fontFamily: 'var(--font-display)', 
              fontWeight: 900,
              lineHeight: 1,
              color: plan.highlighted ? 'var(--gold-light)' : 'var(--text-primary)',
            }}>
              {price.toLocaleString()}
            </span>
            {price > 0 && (
              <span style={{ 
                color: plan.highlighted ? 'var(--text-secondary)' : 'var(--text-muted)', 
                fontSize: '1rem',
                fontWeight: 500,
              }}>
                /mo
              </span>
            )}
          </div>
          {price === 0 ? (
            <span style={{ 
              color: 'var(--text-muted)', 
              fontSize: '0.875rem',
              fontWeight: 500,
            }}>
              Forever free
            </span>
          ) : isAnnual && (
            <span style={{ 
              color: 'var(--gold-light)', 
              fontSize: '0.875rem',
              fontWeight: 600,
            }}>
              Save ₹{((plan.price.monthly - plan.price.annual) * 12).toLocaleString()}/year
            </span>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Features */}
      <ul style={{ 
        listStyle: 'none', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 14,
        flex: 1,
      }}>
        {plan.features.map((f, i) => (
          <motion.li 
            key={f}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 + i * 0.05 }}
            style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: 12, 
              fontSize: '0.9rem', 
              color: plan.highlighted ? 'var(--text-secondary)' : 'var(--text-secondary)',
              lineHeight: 1.6,
            }}
          >
            <CheckCircle2 
              size={18} 
              color={plan.highlighted ? 'var(--gold-light)' : 'var(--gold-primary)'} 
              style={{ flexShrink: 0, marginTop: 2 }} 
            />
            <span style={{ color: plan.highlighted ? 'var(--text-secondary)' : 'var(--text-secondary)' }}>{f}</span>
          </motion.li>
        ))}
      </ul>

      {/* CTA Button */}
      <div style={{ marginTop: 'auto', paddingTop: 8 }}>
        <Link
          to={plan.name === 'Enterprise' ? '/contact' : '/register'}
          data-cursor="pointer"
          className={plan.highlighted ? 'btn-primary w-full' : 'btn-ghost w-full'}
          style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            textDecoration: 'none',
            padding: '14px 24px',
            fontSize: '0.95rem',
            fontWeight: 700,
            borderRadius: 12,
            transition: 'all 0.3s ease',
            ...(plan.highlighted && {
              background: 'var(--gradient-gold)',
              color: '#0a0806',
              border: 'none',
            }),
          }}
        >
          {plan.cta}
        </Link>
      </div>
    </motion.div>
  );
}

export default function PricingCards() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section id="pricing" className="section">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{ textAlign: 'center', marginBottom: 48 }}
        >
          <span className="section-label" style={{ marginBottom: 20, display: 'inline-flex' }}>✦ PRICING</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', marginBottom: 16, fontFamily: 'var(--font-display)', fontWeight: 900 }}>
            Simple, <span className="gradient-text">transparent pricing</span>
          </h2>

          {/* Toggle */}
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 16, 
            background: 'var(--bg-elevated)', 
            border: '1px solid var(--border-default)', 
            borderRadius: 100, 
            padding: '8px 8px 8px 20px', 
            marginTop: 32,
            boxShadow: 'var(--shadow-sm)',
          }}>
            <span style={{ 
              fontSize: '0.9rem', 
              color: isAnnual ? 'var(--text-muted)' : 'var(--text-primary)', 
              fontWeight: 600,
              transition: 'color 0.3s ease',
            }}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              data-cursor="pointer"
              style={{
                width: 56, 
                height: 30, 
                borderRadius: 15,
                background: isAnnual ? 'var(--gradient-gold)' : 'var(--bg-card)',
                border: '2px solid var(--border-default)',
                position: 'relative', 
                cursor: 'pointer', 
                transition: 'all 0.3s ease',
                boxShadow: isAnnual ? '0 4px 12px rgba(201, 168, 76, 0.3)' : 'none',
              }}
            >
              <motion.div
                animate={{ x: isAnnual ? 26 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                style={{ 
                  width: 22, 
                  height: 22, 
                  borderRadius: '50%', 
                  background: isAnnual ? '#0a0806' : 'var(--text-muted)', 
                  position: 'absolute', 
                  top: 2,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              />
            </button>
            <span style={{ 
              fontSize: '0.9rem', 
              color: isAnnual ? 'var(--text-primary)' : 'var(--text-muted)', 
              fontWeight: 600,
              transition: 'color 0.3s ease',
            }}>
              Annual
            </span>
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="badge badge-gold"
              style={{
                fontSize: '0.75rem',
                padding: '4px 12px',
                fontWeight: 700,
              }}
            >
              Save 20%
            </motion.span>
          </div>
        </motion.div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: 32, 
          alignItems: 'stretch', 
          padding: '40px 0',
          maxWidth: 1200,
          margin: '0 auto',
        }}>
          {PRICING.map((plan, index) => (
            <PricingCard key={plan.name} plan={plan} isAnnual={isAnnual} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

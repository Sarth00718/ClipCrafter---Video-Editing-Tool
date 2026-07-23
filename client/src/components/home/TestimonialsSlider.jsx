import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { TESTIMONIALS } from '../../utils/seedData.js';

export default function TestimonialsSlider() {
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState(1);
  const intervalRef = useRef(null);
  const containerRef = useRef(null);
  const touchStartX = useRef(null);

  const go = useCallback((idx, direction = 1) => {
    setDir(direction);
    setCurrent((idx + TESTIMONIALS.length) % TESTIMONIALS.length);
  }, []);

  const next = useCallback(() => go(current + 1, 1), [go, current]);
  const prev = useCallback(() => go(current - 1, -1), [go, current]);

  const stopAuto = useCallback(() => clearInterval(intervalRef.current), []);
  const startAuto = useCallback(() => { intervalRef.current = setInterval(next, 5000); }, [next]);

  useEffect(() => { startAuto(); return stopAuto; }, [current, startAuto, stopAuto]);

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (!touchStartX.current) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { diff > 0 ? next() : prev(); }
    touchStartX.current = null;
  };

  const t = TESTIMONIALS[current];

  return (
    <section className="section">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{ textAlign: 'center', marginBottom: 64 }}
        >
          <span className="section-label" style={{ marginBottom: 20, display: 'inline-flex' }}>Testimonials</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>
            Loved by <span className="gradient-text">Experts</span>
          </h2>
        </motion.div>

        <div
          ref={containerRef}
          onMouseEnter={stopAuto}
          onMouseLeave={startAuto}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          style={{ maxWidth: 760, margin: '0 auto', position: 'relative' }}
        >
          {/* Quote decoration */}
          <div style={{
            position: 'absolute', top: -20, left: 0,
            fontSize: '10rem', fontFamily: 'var(--font-display)', fontWeight: 900,
            color: 'var(--gold-primary)', opacity: 0.06, lineHeight: 1,
            pointerEvents: 'none', userSelect: 'none',
          }}>"</div>

          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={current}
              custom={dir}
              initial={{ opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="glass-card"
              style={{ padding: '48px 40px', textAlign: 'center' }}
            >
              {/* Stars */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 24 }}>
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} size={18} fill="var(--gold-primary)" color="var(--gold-primary)" />
                ))}
              </div>

              {/* Tag */}
              <span className="badge badge-gold" style={{ marginBottom: 20 }}>{t.tag}</span>

              {/* Quote */}
              <blockquote style={{
                fontFamily: 'var(--font-display)', fontSize: 'clamp(1rem, 2.5vw, 1.3rem)',
                fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.7,
                marginBottom: 32, margin: '16px 0 32px',
              }}>
                "{t.quote}"
              </blockquote>

              {/* Author */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                <img src={t.avatar} alt={t.name} loading="lazy" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold-primary)' }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>{t.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.role}</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 32 }}>
            <button onClick={prev} className="btn-icon" data-cursor="pointer"><ChevronLeft size={16} /></button>
            <div style={{ display: 'flex', gap: 8 }}>
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i} onClick={() => go(i, i > current ? 1 : -1)}
                  data-cursor="pointer"
                  style={{
                    width: i === current ? 24 : 8, height: 8, borderRadius: 4,
                    border: 'none', cursor: 'pointer',
                    background: i === current ? 'var(--gold-primary)' : 'var(--border-default)',
                    transition: 'all 0.3s',
                  }}
                />
              ))}
            </div>
            <button onClick={next} className="btn-icon" data-cursor="pointer"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </section>
  );
}

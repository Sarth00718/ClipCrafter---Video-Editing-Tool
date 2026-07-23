import { useState, useEffect, useCallback, useRef } from 'react';
import { videoService } from '../services/index.js';

// ─── useLocalStorage ──────────────────────────────────────────────────────────
export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : defaultValue;
    } catch { return defaultValue; }
  });

  const setStoredValue = useCallback((val) => {
    const toStore = val instanceof Function ? val(value) : val;
    setValue(toStore);
    try { localStorage.setItem(key, JSON.stringify(toStore)); } catch {} // eslint-disable-line no-empty
  }, [key, value]);

  return [value, setStoredValue];
}

// ─── useMousePosition ─────────────────────────────────────────────────────────
export function useMousePosition() {
  const [pos, setPos] = useState({ x: 0, y: 0, normalizedX: 0, normalizedY: 0 });

  useEffect(() => {
    const handler = (e) => {
      setPos({
        x: e.clientX,
        y: e.clientY,
        normalizedX: (e.clientX / window.innerWidth - 0.5) * 2,
        normalizedY: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  return pos;
}

// ─── useCardTilt ──────────────────────────────────────────────────────────────
export function useCardTilt(maxAngle = 15) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const rx = ((e.clientY - cy) / (rect.height / 2)) * -maxAngle;
      const ry = ((e.clientX - cx) / (rect.width / 2)) * maxAngle;
      el.style.setProperty('--rx', `${rx}deg`);
      el.style.setProperty('--ry', `${ry}deg`);
      el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateZ(10px)`;
    };

    const onLeave = () => {
      el.style.transform = 'rotateX(0deg) rotateY(0deg) translateZ(0)';
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [maxAngle]);

  return ref;
}

// ─── useAnimatedCounter ───────────────────────────────────────────────────────
export function useAnimatedCounter(target, duration = 2000, startOnVisible = true) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  const animate = useCallback(() => {
    if (started.current) return;
    started.current = true;
    const startTime = performance.now();
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.floor(easeOut(progress) * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  useEffect(() => {
    if (!startOnVisible) { animate(); return; }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { animate(); obs.disconnect(); } }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [animate, startOnVisible]);

  return { count, ref };
}

// ─── useVideoStatus ───────────────────────────────────────────────────────────
export function useVideoStatus(videoId, initialStatus) {
  const [status, setStatus] = useState(initialStatus || 'pending');
  const [progress, setProgress] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!videoId) return;
    if (initialStatus === 'completed' || initialStatus === 'failed') return;

    // Start polling after the current render cycle to avoid synchronous setState warnings
    const startPolling = () => {
      setIsPolling(true);
      intervalRef.current = setInterval(async () => {
        try {
          const res = await videoService.getById(videoId);
          const vid = res.data.data;
          setStatus(vid.generationStatus);
          if (vid.generationStatus === 'completed' || vid.generationStatus === 'failed') {
            clearInterval(intervalRef.current);
            setIsPolling(false);
            setProgress(100);
          } else {
            setProgress((p) => Math.min(p + Math.random() * 8, 90));
          }
        } catch {
          clearInterval(intervalRef.current);
          setIsPolling(false);
        }
      }, 3000);
    };

    const timerId = setTimeout(startPolling, 0);

    return () => {
      clearTimeout(timerId);
      clearInterval(intervalRef.current);
    };
  }, [videoId, initialStatus]);

  return { status, progress, isPolling };
}

// ─── useScrollY ───────────────────────────────────────────────────────────────
export function useScrollY() {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);
  return scrollY;
}

// ─── useIntersection ─────────────────────────────────────────────────────────
export function useIntersection(options = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  // Capture options as a ref to avoid including unstable objects in dep array
  const optionsRef = useRef(options);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, { threshold: 0.1, ...optionsRef.current });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, isVisible };
}

// ─── useCommandPalette ────────────────────────────────────────────────────────
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((o) => !o);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return { isOpen, setIsOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) };
}

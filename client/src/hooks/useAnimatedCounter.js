import { useState, useEffect, useRef } from 'react';

/**
 * useAnimatedCounter — dual API:
 *
 * Shape A (scroll-triggered, used by Home StatCard):
 *   const { count, ref } = useAnimatedCounter(target)
 *   — attach `ref` to the DOM element to auto-start on visibility
 *
 * Shape B (externally triggered, used by StatsSection StatCard):
 *   const count = useAnimatedCounter(target, duration, isIntersecting)
 *   — returns just the count number when isIntersecting becomes true
 */
export default function useAnimatedCounter(target, duration = 2000, externalTrigger) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  const doAnimate = () => {
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
  };

  // Shape B — external boolean trigger (isIntersecting prop passed)
  useEffect(() => {
    if (externalTrigger !== undefined) {
      if (externalTrigger) doAnimate();
    }
  }, [externalTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // Shape A — IntersectionObserver on the returned ref
  useEffect(() => {
    if (externalTrigger !== undefined) return; // skip if Shape B
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          doAnimate();
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  // Shape B returns plain number; Shape A returns { count, ref }
  if (externalTrigger !== undefined) return count;
  return { count, ref };
}

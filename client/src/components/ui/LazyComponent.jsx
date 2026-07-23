import { useState, useEffect, useRef, memo } from 'react';

const LazyComponent = memo(({ 
  children, 
  threshold = 0.1,
  rootMargin = '50px',
  className = '',
  animationClass = 'animate-slide-up',
  delay = 0,
}) => {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Add delay if specified
          if (delay > 0) {
            setTimeout(() => setIsInView(true), delay);
          } else {
            setIsInView(true);
          }
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(ref.current);

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold, rootMargin, delay]);

  return (
    <div
      ref={ref}
      className={`lazy-load ${isInView ? `loaded ${animationClass}` : ''} ${className}`}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0)' : 'translateY(20px)',
      }}
    >
      {isInView ? children : <div className="skeleton-loader" style={{ minHeight: '100px' }} />}
    </div>
  );
});

LazyComponent.displayName = 'LazyComponent';

export default LazyComponent;

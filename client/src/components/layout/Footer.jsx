import { Link } from 'react-router-dom';
import { Github, Linkedin, Twitter, ArrowUp } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-default)' }}>
      {/* Main Footer Content */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 32px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 48, marginBottom: 48 }}>
          {/* Brand Section */}
          <div style={{ maxWidth: 320 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--gradient-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M15 10l4.553-2.276A1 1 0 0121 8.67v6.66a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" stroke="#0a0806" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                ClipCrafters
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: 20, fontFamily: 'var(--font-body)' }}>
              Transform research papers into stunning, accurate videos with Agentic AI.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { icon: Github, href: 'https://github.com' },
                { icon: Twitter, href: 'https://twitter.com' },
                { icon: Linkedin, href: 'https://linkedin.com' },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-icon"
                  data-cursor="pointer"
                  style={{ width: 36, height: 36 }}
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>
              Product
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Features', to: '/#features' },
                { label: 'Pricing', to: '/#pricing' },
                { label: 'Demo', to: '/#demo' },
                { label: 'Changelog', to: '/changelog' },
              ].map((link, i) => (
                <li key={i}>
                  <Link
                    to={link.to}
                    style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s', fontFamily: 'var(--font-body)' }}
                    onMouseEnter={(e) => e.target.style.color = 'var(--gold-primary)'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                    data-cursor="pointer"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>
              Resources
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Documentation', to: '/docs' },
                { label: 'API Reference', to: '/api' },
                { label: 'Blog', to: '/blog' },
                { label: 'Support', to: '/support' },
              ].map((link, i) => (
                <li key={i}>
                  <Link
                    to={link.to}
                    style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s', fontFamily: 'var(--font-body)' }}
                    onMouseEnter={(e) => e.target.style.color = 'var(--gold-primary)'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                    data-cursor="pointer"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>
              Company
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'About', to: '/about' },
                { label: 'Careers', to: '/careers' },
                { label: 'Privacy', to: '/privacy' },
                { label: 'Terms', to: '/terms' },
              ].map((link, i) => (
                <li key={i}>
                  <Link
                    to={link.to}
                    style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s', fontFamily: 'var(--font-body)' }}
                    onMouseEnter={(e) => e.target.style.color = 'var(--gold-primary)'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                    data-cursor="pointer"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, fontFamily: 'var(--font-body)' }}>
            © 2026 ClipCrafters. Built for Storytellers by{' '}
            <span style={{ color: 'var(--gold-primary)' }}>CACTUS AI Solutions</span>.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
              Made with ❤️ and AI
            </span>
            <button
              onClick={scrollToTop}
              className="btn-icon"
              data-cursor="pointer"
              style={{ width: 32, height: 32 }}
              aria-label="Scroll to top"
            >
              <ArrowUp size={16} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { Logo } from '../Brand';
import { useAuth } from '../../context/AuthContext';

const links = [
  { label: 'Templates', to: '/templates' },
  { label: 'Features', href: '/#features' },
  { label: 'AI Studio', href: '/#ai' },
  { label: 'Pricing', href: '/#pricing' },
];

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, sites } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const dashboardTarget = user?.role === 'admin' ? '/admin' : sites[0] ? `/dashboard/${sites[0].id}` : '/onboarding';
  const goHash = (href: string) => {
    if (location.pathname !== '/') navigate(`/${href.replace(/^\/#/, '#')}`);
    else document.querySelector(href.replace('/', ''))?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <header className={`marketing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="container nav-inner">
          <Logo />
          <nav className="nav-links" aria-label="Main navigation">
            {links.map((link) => link.to ? (
              <NavLink key={link.label} to={link.to} className={({ isActive }) => isActive ? 'active' : ''}>{link.label}</NavLink>
            ) : (
              <button key={link.label} type="button" onClick={() => goHash(link.href!)}>{link.label}</button>
            ))}
          </nav>
          <div className="nav-actions">
            {user ? (
              <Link className="btn btn-sm" to={dashboardTarget}>Open dashboard <ArrowUpRight size={14} /></Link>
            ) : (
              <>
                <Link className="nav-login" to="/login">Log in</Link>
                <Link className="btn btn-sm" to="/register">Start free <ArrowUpRight size={14} /></Link>
              </>
            )}
            <button className="nav-mobile-toggle" onClick={() => setOpen(!open)} aria-label="Toggle menu">
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>
      {open && (
        <div className="mobile-menu">
          <div className="mobile-menu-links">
            {links.map((link) => link.to ? (
              <Link key={link.label} to={link.to}>{link.label}<ArrowUpRight size={16} /></Link>
            ) : (
              <button key={link.label} onClick={() => { setOpen(false); goHash(link.href!); }}>{link.label}<ArrowUpRight size={16} /></button>
            ))}
            <Link to="/login">Log in</Link>
          </div>
          <Link className="btn btn-accent btn-lg btn-block" to={user ? dashboardTarget : '/register'}>
            {user ? 'Open dashboard' : 'Start building free'}
          </Link>
        </div>
      )}
    </>
  );
}

export function MarketingFooter() {
  return (
    <footer className="marketing-footer">
      <div className="container footer-top">
        <div className="footer-brand">
          <Logo light />
          <p>Beautiful websites,<br />intelligently made.</p>
          <div className="footer-status"><i /> All systems operational</div>
        </div>
        <div className="footer-cols">
          <div>
            <h4>Product</h4>
            <Link to="/templates">Template library</Link>
            <Link to="/#features">Features</Link>
            <Link to="/#ai">AI agents</Link>
            <Link to="/#pricing">Pricing</Link>
          </div>
          <div>
            <h4>Business types</h4>
            <Link to="/templates?category=ecommerce">E-commerce</Link>
            <Link to="/templates?category=food">Food & drink</Link>
            <Link to="/templates?category=services">Services</Link>
            <Link to="/templates?category=portfolio">Portfolio</Link>
          </div>
          <div>
            <h4>Platform</h4>
            <Link to="/login">Log in</Link>
            <Link to="/register">Create account</Link>
            <a href="mailto:support@nexora.studio">Support</a>
            <a href="mailto:hello@nexora.studio">Contact</a>
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Nexora Studio. Crafted for independent businesses.</span>
        <div><span>Privacy</span><span>Terms</span><span>Status</span></div>
      </div>
    </footer>
  );
}

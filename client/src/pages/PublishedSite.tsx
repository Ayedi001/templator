import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { SiteRenderer } from '../components/SiteRenderer';
import { Logo } from '../components/Brand';
import { get } from '../lib/api';
import { applySiteMeta, resetSiteMeta } from '../lib/seo';
import type { PublicSitePayload } from '../lib/types';

export function PublishedSite() {
  const { slug } = useParams();
  const [payload, setPayload] = useState<PublicSitePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordRequired, setPasswordRequired] = useState(false);

  async function load(access?: string) {
    setLoading(true);
    setError('');
    try {
      const data = await get<PublicSitePayload>(`/public/sites/${slug}${access ? `?access=${encodeURIComponent(access)}` : ''}`);
      setPayload(data);
      setPasswordRequired(false);
      applySiteMeta(data.site);
    } catch (err: any) {
      if (err.data?.passwordRequired) {
        setPasswordRequired(true);
        setError('');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    window.scrollTo(0, 0);
    return () => { resetSiteMeta(); };
  }, [slug]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--paper)' }}>
        <div className="page-loader"><span className="spinner dark lg" /><p>Opening website…</p></div>
      </div>
    );
  }

  if (passwordRequired) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--paper)', padding: 24 }}>
        <div className="card card-pad" style={{ width: 'min(420px,100%)', textAlign: 'center', padding: 36 }}>
          <span style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--paper-2)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}><Lock size={20} /></span>
          <h1 className="display" style={{ fontSize: 36 }}>This site is private.</h1>
          <p className="muted text-sm mt-8">Enter the password to continue.</p>
          <form className="mt-24" onSubmit={(e) => { e.preventDefault(); load(password); }}>
            <input className="input" type="password" placeholder="Website password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="btn btn-accent btn-block mt-12">Enter website</button>
          </form>
          {error && <div className="form-error mt-12">{error}</div>}
        </div>
      </div>
    );
  }

  if (!payload || error) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--paper)', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 460 }}>
          <Logo />
          <h1 className="display" style={{ fontSize: 52, marginTop: 28, lineHeight: .98 }}>This website isn't available.</h1>
          <p className="muted mt-16" style={{ fontSize: 14, lineHeight: 1.6 }}>{error || 'The address may have changed, or the website has been unpublished by its owner.'}</p>
          <Link className="btn btn-outline mt-24" to="/"><ArrowLeft size={14} /> Back to Nexora</Link>
        </div>
      </div>
    );
  }

  return <SiteRenderer payload={payload} live />;
}

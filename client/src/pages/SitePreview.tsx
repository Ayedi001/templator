import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Pencil, Rocket } from 'lucide-react';
import { SiteRenderer } from '../components/SiteRenderer';
import { Logo } from '../components/Brand';
import { get, post, formatDate } from '../lib/api';
import type { Category, Item, SiteDetails } from '../lib/types';
import { useToast } from '../context/ToastContext';

export function SitePreview() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [details, setDetails] = useState<SiteDetails | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!siteId) return;
    Promise.all([
      get<SiteDetails>(`/sites/${siteId}`),
      get<{ items: Item[] }>(`/sites/${siteId}/items?status=active`),
      get<{ categories: Category[] }>(`/sites/${siteId}/categories`),
    ]).then(([siteData, itemData, categoryData]) => {
      setDetails(siteData);
      setItems(itemData.items);
      setCategories(categoryData.categories);
      document.title = `Preview · ${siteData.site.name}`;
    }).catch((err) => toast(err.message, 'error')).finally(() => setLoading(false));
    return () => { document.title = 'Nexora Studio'; };
  }, [siteId]);

  async function publish() {
    if (!details) return;
    setPublishing(true);
    try {
      const data = await post<SiteDetails>(`/sites/${details.site.id}/publish`);
      setDetails(data);
      toast('Website published.');
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setPublishing(false);
    }
  }

  if (loading) return <div className="page-loader" style={{ minHeight: '100vh' }}><span className="spinner dark lg" /><p>Preparing preview…</p></div>;
  if (!details) return <div className="page-loader">Could not load preview.</div>;

  const payload = {
    site: details.site,
    template: details.template,
    items,
    categories,
    owner: '',
    reviews: details.site.content.testimonials || [],
  };

  return (
    <div>
      <div className="preview-toolbar">
        <div className="flex-center gap-10">
          <Logo compact />
          <span className="preview-toolbar-divider" />
          <div>
            <b>{details.site.name}</b>
            <small>Draft preview · {details.site.status === 'published' ? 'Published' : 'Not yet public'}</small>
          </div>
        </div>
        <div className="flex-center gap-8">
          <Link className="btn btn-sm btn-light" to={`/dashboard/${details.site.id}`}><ArrowLeft size={13} /> Dashboard</Link>
          <Link className="btn btn-sm btn-light" to={`/dashboard/${details.site.id}/design`}><Pencil size={13} /> Customise</Link>
          {details.site.status === 'published' ? (
            <a className="btn btn-sm btn-accent" href={`/site/${details.site.slug}`} target="_blank" rel="noreferrer">View live <ExternalLink size={13} /></a>
          ) : (
            <button className="btn btn-sm btn-accent" onClick={publish} disabled={publishing}>{publishing ? <span className="spinner" /> : <><Rocket size={13} /> Publish</>}</button>
          )}
        </div>
      </div>
      <SiteRenderer payload={payload} preview />
    </div>
  );
}

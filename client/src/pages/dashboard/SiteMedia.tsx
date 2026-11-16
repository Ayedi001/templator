import { useEffect, useRef, useState } from 'react';
import { Copy, Image as ImageIcon, Link2, Plus, Trash2, Upload } from 'lucide-react';
import { useSite } from '../../components/dashboard/SiteLayout';
import { Modal } from '../../components/Modal';
import { EmptyState, PageHeader } from '../../components/UI';
import { useToast } from '../../context/ToastContext';
import { del, get, post } from '../../lib/api';
import type { Media } from '../../lib/types';

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function SiteMedia() {
  const { details } = useSite();
  const { toast } = useToast();
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [urlOpen, setUrlOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [urlName, setUrlName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Media | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      const data = await get<{ media: Media[] }>(`/sites/${details.site.id}/media`);
      setMedia(data.media);
    } catch (err: any) { toast(err.message, 'error'); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [details.site.id]);

  async function upload(file: File) {
    if (!file.type.startsWith('image/')) { toast('Choose an image file.', 'error'); return; }
    setBusy(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const data = await post<{ media: Media }>(`/sites/${details.site.id}/media`, { dataUrl, name: file.name });
      setMedia((prev) => [data.media, ...prev]);
      toast('Image uploaded.');
    } catch (err: any) { toast(err.message, 'error'); } finally { setBusy(false); }
  }

  async function addUrl() {
    if (!url) return;
    setBusy(true);
    try {
      const data = await post<{ media: Media }>(`/sites/${details.site.id}/media`, { url, name: urlName || 'Linked image' });
      setMedia((prev) => [data.media, ...prev]);
      setUrl(''); setUrlName(''); setUrlOpen(false);
      toast('Image added to your library.');
    } catch (err: any) { toast(err.message, 'error'); } finally { setBusy(false); }
  }

  async function remove() {
    if (!deleteTarget) return;
    try {
      await del(`/sites/${details.site.id}/media/${deleteTarget.id}`);
      setMedia((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast('Image deleted.');
    } catch (err: any) { toast(err.message, 'error'); }
  }

  const totalMb = (media.reduce((sum, m) => sum + (m.size || 0), 0) / 1024 / 1024).toFixed(1);

  return (
    <>
      <PageHeader
        eyebrow="Assets"
        title="Media library"
        description={`Brand photography, product images and graphics. ${media.length} files · ${totalMb} MB used of ${details.subscription?.storage_limit_mb || 250} MB.`}
        actions={<>
          <button className="btn btn-outline btn-sm" onClick={() => setUrlOpen(true)}><Link2 size={13} /> Add from URL</button>
          <button className="btn btn-accent btn-sm" onClick={() => fileRef.current?.click()} disabled={busy}><Plus size={13} /> Upload image</button>
        </>}
      />
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />

      <div
        className={`upload-zone ${dragging ? 'dragging' : ''}`}
        style={{ marginBottom: 20 }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const file = e.dataTransfer.files[0]; if (file) upload(file); }}
        onClick={() => fileRef.current?.click()}
      >
        <Upload size={22} />
        <h4>{busy ? 'Uploading your image…' : 'Drop an image here, or click to browse'}</h4>
        <p>JPG, PNG, WEBP, GIF or SVG · up to 8 MB</p>
      </div>

      {loading ? <div className="media-grid">{[...Array(5)].map((_, i) => <div className="skeleton" key={i} style={{ aspectRatio: 1, borderRadius: 10 }} />)}</div> : media.length === 0 ? (
        <div className="panel"><EmptyState icon={<ImageIcon size={22} />} title="Your media library is empty." description="Upload the images you want to use across your website, products and stories." action={<button className="btn btn-accent btn-sm" onClick={() => fileRef.current?.click()}>Upload your first image</button>} /></div>
      ) : (
        <div className="media-grid">
          {media.map((item) => (
            <div className="media-card" key={item.id}>
              <div className="media-card-image"><img src={item.url} alt={item.name} loading="lazy" /></div>
              <div className="media-card-info"><span>{item.name}</span><span>{Math.round((item.size || 0) / 1024)} KB</span></div>
              <button className="media-card-delete" onClick={() => setDeleteTarget(item)} aria-label={`Delete ${item.name}`}><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      )}

      <Modal open={urlOpen} onClose={() => setUrlOpen(false)} title="Add image from URL" subtitle="Use a hosted image from your CDN or another service."
        footer={<><button className="btn btn-ghost" onClick={() => setUrlOpen(false)}>Cancel</button><button className="btn btn-accent" onClick={addUrl} disabled={busy || !url}>{busy ? <span className="spinner" /> : 'Add image'}</button></>}>
        <div className="form-grid">
          <div className="field"><label>Image URL</label><input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://images.example.com/photo.jpg" /></div>
          <div className="field"><label>Name</label><input className="input" value={urlName} onChange={(e) => setUrlName(e.target.value)} placeholder="Campaign hero" /></div>
        </div>
      </Modal>

      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete this image?"
        footer={<><button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button><button className="btn btn-danger" onClick={remove}>Delete image</button></>}>
        <p className="confirm-copy">“{deleteTarget?.name}” will be removed from your library. Any page still using this URL will show a missing image.</p>
      </Modal>
    </>
  );
}

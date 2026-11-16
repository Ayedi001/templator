import { useRef, useState } from 'react';
import { Image as ImageIcon, Upload, Link2, X } from 'lucide-react';
import { Modal } from '../Modal';
import { useToast } from '../../context/ToastContext';
import { get, post } from '../../lib/api';
import type { Media } from '../../lib/types';

interface Props {
  siteId: string;
  value?: string;
  onChange: (url: string) => void;
  label?: string;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ImagePicker({ siteId, value, onChange, label = 'Image' }: Props) {
  const [open, setOpen] = useState(false);
  const [media, setMedia] = useState<Media[]>([]);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  async function openPicker() {
    setOpen(true);
    try {
      const data = await get<{ media: Media[] }>(`/sites/${siteId}/media`);
      setMedia(data.media);
    } catch { /* */ }
  }

  async function upload(file: File) {
    setBusy(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const data = await post<{ media: Media }>(`/sites/${siteId}/media`, { dataUrl, name: file.name });
      setMedia((prev) => [data.media, ...prev]);
      onChange(data.media.url);
      toast('Image uploaded.');
      setOpen(false);
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="field">
      <label>{label}</label>
      <div className="image-field">
        <span className="image-field-preview">{value ? <img src={value} alt="" /> : <ImageIcon size={18} />}</span>
        <input className="input" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="https://… or choose from your library" />
        <button type="button" className="btn btn-outline btn-sm" onClick={openPicker}>Library</button>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Media library" subtitle="Choose an image or upload a new one." size="wide">
        <div className="flex-between gap-12 mb-16">
          <label className="marketplace-search" style={{ width: '100%', maxWidth: 360 }}>
            <Link2 size={14} />
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste an image URL" />
          </label>
          <button className="btn btn-outline btn-sm" disabled={!url} onClick={() => { onChange(url); setOpen(false); }}>Use URL</button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          <button className="btn btn-sm" onClick={() => fileRef.current?.click()} disabled={busy}><Upload size={13} /> {busy ? 'Uploading…' : 'Upload'}</button>
        </div>
        {media.length === 0 ? (
          <button className="upload-zone" style={{ width: '100%' }} onClick={() => fileRef.current?.click()}>
            <ImageIcon size={24} />
            <h4>Your library is empty</h4>
            <p>Upload a JPG, PNG, WEBP, GIF or SVG up to 8 MB.</p>
          </button>
        ) : (
          <div className="media-grid">
            {media.map((item) => (
              <button key={item.id} className="media-card" style={{ textAlign: 'left', padding: 0 }} onClick={() => { onChange(item.url); setOpen(false); }}>
                <div className="media-card-image"><img src={item.url} alt={item.name} /></div>
                <div className="media-card-info"><span>{item.name}</span></div>
              </button>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

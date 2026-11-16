import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight, Bot, Check, Copy, Loader2, MessageSquare, Palette as PaletteIcon,
  PenTool, RefreshCw, Search, Send, Sparkles, Tag, Wand2, Package, LifeBuoy,
  FileText, Layers,
} from 'lucide-react';
import { useSite } from '../../components/dashboard/SiteLayout';
import { useToast } from '../../context/ToastContext';
import { get, patch, post } from '../../lib/api';
import type { AiChatResponse } from '../../lib/types';

type Tab = 'assistant' | 'content' | 'product' | 'design' | 'seo' | 'support';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agents?: { id: string; name: string; model: string }[];
  mode?: string;
}

const AGENT_INFO = [
  { id: 'business-analysis', name: 'Business Analysis', desc: 'Audience, positioning and the right site structure.' },
  { id: 'template-recommendation', name: 'Template Recommendation', desc: 'Shortlists designs with a concrete reason for each.' },
  { id: 'website-generation', name: 'Website Generation', desc: 'Writes hero, about and SEO copy in your voice.' },
  { id: 'product-content', name: 'Product & Content', desc: 'Titles, descriptions, categories and product SEO.' },
  { id: 'design-assistant', name: 'Design Assistant', desc: 'Palettes, typography, layout and section advice.' },
  { id: 'seo', name: 'SEO', desc: 'Audits metadata, headings and content health.' },
  { id: 'customer-support', name: 'Customer Support', desc: 'Walks you through any part of the platform.' },
];

const QUICK_PROMPTS = [
  'Analyse my business and suggest a homepage structure',
  'Make my website feel warmer and more editorial',
  'Run an SEO audit and explain the top priorities',
  'Write website copy that sounds like my brand',
  'How do I connect a custom domain?',
];

function InlineText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).filter(Boolean);
  return <>{parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '.9em', background: 'rgba(0,0,0,.06)', padding: '1px 4px', borderRadius: 3 }}>{part.slice(1, -1)}</code>;
    return part;
  })}</>;
}

function Markdown({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div>
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: 7 }} />;
        if (line.startsWith('### ')) return <h3 key={i}>{line.slice(4)}</h3>;
        if (line.startsWith('## ')) return <h3 key={i}>{line.slice(3)}</h3>;
        if (/^\d+\.\s/.test(line) || line.startsWith('• ')) return <p key={i} style={{ paddingLeft: 2 }}><InlineText text={line} /></p>;
        return <p key={i}><InlineText text={line} /></p>;
      })}
    </div>
  );
}

export function SiteAI() {
  const { details, reload, setDetails } = useSite();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const initialTab = (params.get('tab') as Tab) || 'assistant';
  const [tab, setTabState] = useState<Tab>(['assistant', 'content', 'product', 'design', 'seo', 'support'].includes(initialTab) ? initialTab : 'assistant');
  const [catalog, setCatalog] = useState<{ agents: any[]; status: { mode: string; model: string; configured: boolean } } | null>(null);
  const [usage, setUsage] = useState({ used: details.subscription?.ai_used || 0, limit: details.subscription?.ai_limit || 50 });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const [brief, setBrief] = useState(details.site.description || '');
  const [tone, setTone] = useState('Warm, specific, premium');
  const [contentResult, setContentResult] = useState<any>(null);
  const [contentBusy, setContentBusy] = useState(false);

  const [productForm, setProductForm] = useState({ name: '', category: details.template?.categoryName || '', notes: '', price: '' });
  const [productResult, setProductResult] = useState<any>(null);
  const [productBusy, setProductBusy] = useState(false);

  const [designPrompt, setDesignPrompt] = useState('Make the design feel warmer and more editorial, without losing the clean layout.');
  const [designResult, setDesignResult] = useState<any>(null);
  const [designBusy, setDesignBusy] = useState(false);

  const [seoResult, setSeoResult] = useState<any>(null);
  const [seoBusy, setSeoBusy] = useState(false);

  const [supportMessages, setSupportMessages] = useState<{ role: 'user' | 'assistant'; text: string; steps?: string[] }[]>([
    { role: 'assistant', text: 'Hi — I can guide you through publishing, products, orders, designs, domains, media or billing. What are you trying to do?' },
  ]);
  const [supportInput, setSupportInput] = useState('');
  const [supportBusy, setSupportBusy] = useState(false);

  useEffect(() => {
    get<typeof catalog>('/ai/catalog').then((data) => setCatalog(data as any)).catch(() => undefined);
  }, []);

  useEffect(() => {
    const next = new URLSearchParams(params);
    if (tab === 'assistant') next.delete('tab'); else next.set('tab', tab);
    setParams(next, { replace: true });
  }, [tab]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  function setTab(next: Tab) { setTabState(next); }

  function applyUsage(next?: { used: number; limit: number }) {
    if (next) setUsage({ used: next.used, limit: next.limit });
  }

  async function sendMessage(text?: string) {
    const message = (text || input).trim();
    if (!message || thinking) return;
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', content: message }]);
    setInput('');
    setThinking(true);
    try {
      const data = await post<AiChatResponse>('/ai/chat', {
        siteId: details.site.id,
        message,
        history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      });
      setMessages((prev) => [...prev, {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        agents: data.agents,
        mode: data.meta.mode,
      }]);
      applyUsage(data.usage);
    } catch (err: any) {
      toast(err.message, 'error');
      setMessages((prev) => [...prev, { id: `e-${Date.now()}`, role: 'assistant', content: `**I could not complete that request.**\n\n${err.message}` }]);
    } finally {
      setThinking(false);
    }
  }

  async function generateContent() {
    setContentBusy(true);
    try {
      const data = await post<any>('/ai/generate-site', { siteId: details.site.id, brief, tone });
      setContentResult(data.result);
      applyUsage(data.usage);
      toast('Website copy drafted.');
    } catch (err: any) { toast(err.message, 'error'); } finally { setContentBusy(false); }
  }

  async function applyContent() {
    if (!contentResult?.content) return;
    try {
      const data = await patch<any>(`/sites/${details.site.id}/design`, { content: contentResult.content });
      setDetails({ ...details, ...data });
      toast('New copy applied to your website.');
    } catch (err: any) { toast(err.message, 'error'); }
  }

  async function generateProduct() {
    if (!productForm.name.trim()) { toast('Add a product name first.', 'error'); return; }
    setProductBusy(true);
    try {
      const data = await post<any>('/ai/product-copy', {
        siteId: details.site.id,
        name: productForm.name, category: productForm.category, notes: productForm.notes,
        priceCents: Math.round(Number(productForm.price || 0) * 100),
      });
      setProductResult(data.result);
      applyUsage(data.usage);
    } catch (err: any) { toast(err.message, 'error'); } finally { setProductBusy(false); }
  }

  async function createProductDraft() {
    if (!productResult) return;
    try {
      await post(`/sites/${details.site.id}/items`, {
        name: productResult.title,
        description: productResult.description,
        priceCents: Math.round(Number(productResult.priceSuggestion || 0) * 100),
        status: 'draft',
        kind: 'product',
        images: [],
        metadata: { tag: productResult.tags?.[0] || '' },
      });
      await reload();
      toast('Draft product created. Find it in your catalogue.');
    } catch (err: any) { toast(err.message, 'error'); }
  }

  async function generateDesign() {
    setDesignBusy(true);
    try {
      const data = await post<any>('/ai/design', { siteId: details.site.id, message: designPrompt });
      setDesignResult(data.result);
      applyUsage(data.usage);
    } catch (err: any) { toast(err.message, 'error'); } finally { setDesignBusy(false); }
  }

  async function applyPalette(option: any) {
    try {
      const theme = {
        ...details.site.theme,
        palette: option.palette,
        fonts: option.fonts || details.site.theme.fonts,
        mode: option.palette.bg.startsWith('#0') ? 'dark' : 'light',
      };
      const data = await patch<any>(`/sites/${details.site.id}/design`, { theme });
      setDetails({ ...details, ...data });
      toast(`${option.name} applied. Open the design studio to fine-tune.`);
    } catch (err: any) { toast(err.message, 'error'); }
  }

  async function runSeo() {
    setSeoBusy(true);
    try {
      const data = await post<any>('/ai/seo', { siteId: details.site.id });
      setSeoResult(data.result);
      applyUsage(data.usage);
    } catch (err: any) { toast(err.message, 'error'); } finally { setSeoBusy(false); }
  }

  async function applySeo() {
    if (!seoResult) return;
    try {
      await patch(`/sites/${details.site.id}/settings`, { settings: { seo: { title: seoResult.title, description: seoResult.description, keywords: seoResult.keywords } } });
      await reload();
      toast('SEO metadata applied.');
    } catch (err: any) { toast(err.message, 'error'); }
  }

  async function sendSupport(text?: string) {
    const message = (text || supportInput).trim();
    if (!message || supportBusy) return;
    setSupportMessages((prev) => [...prev, { role: 'user', text: message }]);
    setSupportInput('');
    setSupportBusy(true);
    try {
      const data = await post<any>('/ai/support', { message, siteId: details.site.id });
      setSupportMessages((prev) => [...prev, { role: 'assistant', text: data.result.reply, steps: data.result.steps }]);
    } catch (err: any) {
      toast(err.message, 'error');
    } finally { setSupportBusy(false); }
  }

  const usagePct = Math.min(100, Math.round((usage.used / Math.max(usage.limit, 1)) * 100));
  const toolTabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'assistant', label: 'Assistant', icon: MessageSquare },
    { id: 'content', label: 'Content studio', icon: FileText },
    { id: 'product', label: 'Product writer', icon: Package },
    { id: 'design', label: 'Design advisor', icon: PaletteIcon },
    { id: 'seo', label: 'SEO audit', icon: Search },
    { id: 'support', label: 'Support', icon: LifeBuoy },
  ];

  return (
    <>
      <div className="dash-page-head" style={{ marginBottom: 18 }}>
        <div>
          <div className="eyebrow"><Sparkles size={11} /> Nexora Intelligence</div>
          <h1>AI Studio</h1>
          <p>Seven specialist agents, one orchestrator. Work from the context of {details.site.name} — nothing is applied without your say-so.</p>
        </div>
        <div className="dash-page-actions">
          <Link className="btn btn-outline btn-sm" to={`/dashboard/${details.site.id}/design`}><PenTool size={13} /> Design studio</Link>
        </div>
      </div>

      <div className="ai-usage-strip">
        <div className="ai-usage-copy"><span className="ai-usage-orb" /><div><b>{usage.used} of {usage.limit} AI actions used</b><span>{catalog?.status.mode === 'hybrid' ? `Hybrid mode · ${catalog.status.model}` : 'Local intelligence mode · no API key required'}</span></div></div>
        <div className="ai-usage-meter"><div className="ai-usage-meter-bar"><i style={{ width: `${usagePct}%` }} /></div><span>{usage.limit - usage.used} remaining this cycle</span></div>
        {usage.used >= usage.limit ? <Link className="btn btn-sm" to={`/dashboard/${details.site.id}/billing`}>Upgrade</Link> : <span className="badge" style={{ background: 'rgba(255,255,255,.1)', borderColor: 'rgba(255,255,255,.15)', color: 'var(--paper)' }}>{details.subscription?.plan || 'starter'} plan</span>}
      </div>

      <div className="ai-tool-tabs">
        {toolTabs.map((item) => <button key={item.id} className={`chip ${tab === item.id ? 'active' : ''}`} style={{ minHeight: 32, fontSize: 10.5 }} onClick={() => setTab(item.id)}><item.icon size={12} /> {item.label}</button>)}
      </div>

      {tab === 'assistant' && (
        <div className="ai-studio">
          <section className="ai-chat-panel">
            <div className="ai-chat-panel-head">
              <h2><span className="ai-usage-orb" style={{ width: 18, height: 18 }} /> Orchestrator <span className="badge active" style={{ fontSize: 8 }}>online</span></h2>
              <div className="flex-center gap-8"><span className="ai-mode">{catalog?.status.mode || 'local'}</span><button className="icon-btn sm" onClick={() => setMessages([])} title="New conversation"><RefreshCw size={12} /></button></div>
            </div>
            <div className="ai-messages">
              {messages.length === 0 && (
                <div className="ai-empty">
                  <div className="ai-empty-orb" />
                  <h3>What should we make better?</h3>
                  <p>I can write, redesign, audit, explain or analyse. Ask in your own words — I will bring in the right specialists.</p>
                  <div className="ai-suggested">
                    {QUICK_PROMPTS.map((prompt) => <button key={prompt} onClick={() => sendMessage(prompt)}>{prompt}</button>)}
                  </div>
                </div>
              )}
              {messages.map((message) => (
                <div className={`ai-message ${message.role}`} key={message.id}>
                  <span className="ai-message-avatar">{message.role === 'assistant' ? 'AI' : 'You'}</span>
                  <div className="ai-message-body">
                    <div className="ai-bubble">
                      {message.role === 'assistant' ? <Markdown content={message.content} /> : message.content}
                    </div>
                    {message.agents && (
                      <div className="ai-agents-used">
                        {message.agents.map((agent) => <span className="ai-agent-chip-mini" key={agent.id}><i />{agent.name.replace(' Agent', '')}</span>)}
                        <span className="ai-agent-chip-mini">validated</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {thinking && <div className="ai-thinking"><span className="ai-dots"><i /><i /><i /></span> Orchestrator is choosing the right agents…</div>}
              <div ref={endRef} />
            </div>
            <div className="ai-composer">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Ask for a change, a rewrite or a second opinion…"
                rows={2}
              />
              <button className="btn btn-accent" onClick={() => sendMessage()} disabled={!input.trim() || thinking} aria-label="Send message">{thinking ? <Loader2 size={14} className="spin" /> : <Send size={14} />}</button>
            </div>
          </section>

          <aside className="ai-side">
            <div className="ai-side-card">
              <h3><Bot size={13} /> Agent roster</h3>
              <div className="ai-agent-roster">
                {AGENT_INFO.map((agent) => (
                  <div className="ai-agent-row" key={agent.id}><span className="ai-agent-dot" /><div><b>{agent.name}</b><span>{agent.desc}</span></div></div>
                ))}
              </div>
            </div>
            <div className="ai-side-card">
              <h3><Wand2 size={13} /> Go straight to a specialist</h3>
              <div className="ai-quick-tools">
                <button className="ai-quick-tool" onClick={() => setTab('content')}><FileText size={13} /> Write my website copy</button>
                <button className="ai-quick-tool" onClick={() => setTab('product')}><Package size={13} /> Improve a product</button>
                <button className="ai-quick-tool" onClick={() => setTab('design')}><PaletteIcon size={13} /> Find a new direction</button>
                <button className="ai-quick-tool" onClick={() => setTab('seo')}><Search size={13} /> Audit my SEO</button>
                <button className="ai-quick-tool" onClick={() => setTab('support')}><LifeBuoy size={13} /> Get platform help</button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {tab === 'content' && (
        <section className="ai-tool-panel">
          <div className="flex-between gap-16 flex-wrap">
            <div><h2>Website copy, in your voice.</h2><p>The Website Generation Agent writes a hero, an About section and meta copy using your real business details. You can edit everything afterwards.</p></div>
            <span className="badge"><Sparkles size={10} /> Website Generation Agent</span>
          </div>
          <div className="form-grid" style={{ maxWidth: 660 }}>
            <div className="field"><label>What should the copy focus on?</label><textarea className="textarea" rows={3} value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="Describe the promise, audience or tone you want…" /></div>
            <div className="field"><label>Tone</label><input className="input" value={tone} onChange={(e) => setTone(e.target.value)} placeholder="Warm, specific, premium" /></div>
            <button className="btn btn-accent" onClick={generateContent} disabled={contentBusy} style={{ width: 'fit-content' }}>{contentBusy ? <><Loader2 size={14} className="spin" /> Writing…</> : <><Sparkles size={14} /> Generate copy</>}</button>
          </div>
          {contentResult && (
            <div className="ai-result">
              <div className="flex-between"><h3>Proposed copy</h3><span className="badge draft">Not applied</span></div>
              <div className="ai-generated-hero">
                <small>{contentResult.content.hero?.eyebrow}</small>
                <h3>{contentResult.content.hero?.headline}</h3>
                <p>{contentResult.content.hero?.subheadline}</p>
              </div>
              <h3 className="mt-16">About section</h3>
              <pre>{contentResult.content.about?.body}</pre>
              <div className="flex-between mt-16">
                <span className="text-xs muted">{contentResult.rationale}</span>
                <button className="btn btn-accent btn-sm" onClick={applyContent}><Check size={12} /> Apply to website</button>
              </div>
            </div>
          )}
        </section>
      )}

      {tab === 'product' && (
        <section className="ai-tool-panel">
          <div className="flex-between gap-16 flex-wrap">
            <div><h2>Make the product page sell it.</h2><p>Give the Product & Content Agent a name and a few notes. It returns a stronger title, a real description, tags and SEO metadata.</p></div>
            <span className="badge"><Package size={10} /> Product & Content Agent</span>
          </div>
          <div className="form-grid" style={{ maxWidth: 660 }}>
            <div className="field-row">
              <div className="field"><label>Product or service name</label><input className="input" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} placeholder="The Margaux Coat" /></div>
              <div className="field"><label>Category</label><input className="input" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} placeholder="Outerwear" /></div>
            </div>
            <div className="field"><label>Notes or raw description</label><textarea className="textarea" rows={3} value={productForm.notes} onChange={(e) => setProductForm({ ...productForm, notes: e.target.value })} placeholder="Double-faced wool, relaxed shoulder, horn buttons…" /></div>
            <div className="field" style={{ maxWidth: 220 }}><label>Price (USD)</label><input className="input" type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} placeholder="690" /></div>
            <button className="btn btn-accent" style={{ width: 'fit-content' }} onClick={generateProduct} disabled={productBusy}>{productBusy ? <><Loader2 size={14} className="spin" /> Writing…</> : <><Sparkles size={14} /> Write product copy</>}</button>
          </div>
          {productResult && (
            <div className="ai-result">
              <div className="flex-between"><h3>{productResult.title}</h3><button className="btn btn-outline btn-sm" onClick={() => navigator.clipboard?.writeText(productResult.description)}><Copy size={11} /> Copy</button></div>
              <pre>{productResult.description}</pre>
              <div className="flex-between mt-16">
                <div className="seo-keyword-list">{productResult.tags?.map((tag: string) => <span key={tag}>{tag}</span>)}</div>
                <button className="btn btn-accent btn-sm" onClick={createProductDraft}><Check size={12} /> Create draft item</button>
              </div>
            </div>
          )}
        </section>
      )}

      {tab === 'design' && (
        <section className="ai-tool-panel">
          <div className="flex-between gap-16 flex-wrap">
            <div><h2>A second pair of designer eyes.</h2><p>The Design Assistant reads your current palette and layout, then suggests a direction. Apply any palette in one click — nothing else changes.</p></div>
            <span className="badge"><PaletteIcon size={10} /> Design Assistant</span>
          </div>
          <div className="field"><label>Describe the feeling you want</label><textarea className="textarea" rows={3} value={designPrompt} onChange={(e) => setDesignPrompt(e.target.value)} /></div>
          <button className="btn btn-accent mt-16" onClick={generateDesign} disabled={designBusy}>{designBusy ? <><Loader2 size={14} className="spin" /> Thinking…</> : <><Wand2 size={14} /> Suggest a direction</>}</button>
          {designResult && (
            <div className="ai-result">
              <Markdown content={designResult.reply} />
              <h3 className="mt-16">Palette options</h3>
              <div className="ai-palette-options">
                {designResult.options?.map((option: any) => (
                  <div className="ai-palette-option" key={option.id}>
                    <div className="ai-palette-swatches">{Object.values(option.palette).map((color: any, i) => <i key={i} style={{ background: color }} />)}</div>
                    <b>{option.name}</b><span>{option.description}</span>
                    <button className="btn btn-outline btn-sm mt-8" style={{ width: '100%' }} onClick={() => applyPalette(option)}>Apply palette</button>
                  </div>
                ))}
              </div>
              <p className="field-hint mt-16">{designResult.rationale}</p>
              {designResult.sectionSuggestions && <div className="seo-keyword-list mt-12">{designResult.sectionSuggestions.map((section: string) => <span key={section}>{section}</span>)}</div>}
            </div>
          )}
        </section>
      )}

      {tab === 'seo' && (
        <section className="ai-tool-panel">
          <div className="flex-between gap-16 flex-wrap">
            <div><h2>See what search engines see.</h2><p>The SEO Agent checks your metadata, headings and content depth, then hands you prioritised changes.</p></div>
            <span className="badge"><Search size={10} /> SEO Agent</span>
          </div>
          <button className="btn btn-accent" onClick={runSeo} disabled={seoBusy}>{seoBusy ? <><Loader2 size={14} className="spin" /> Auditing…</> : <><Search size={14} /> Run SEO audit</>}</button>
          {seoResult && (
            <div className="ai-result">
              <div className="flex-between"><h3>Score: {seoResult.score}/100 · {seoResult.grade}</h3><button className="btn btn-accent btn-sm" onClick={applySeo}><Check size={12} /> Apply metadata</button></div>
              <div className="seo-preview-google mt-16">
                <div className="seo-preview-url">https://{details.site.slug}.nexora.studio</div>
                <div className="seo-preview-title">{seoResult.title}</div>
                <div className="seo-preview-desc">{seoResult.description}</div>
              </div>
              <div className="seo-issues">
                {seoResult.issues?.slice(0, 5).map((issue: any, i: number) => (
                  <div className="seo-issue" key={i}><span className={`seo-issue-icon ${issue.severity}`}><Search size={11} /></span><div><b>{issue.title}</b><p>{issue.detail}</p></div></div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {tab === 'support' && (
        <section className="ai-tool-panel">
          <div className="flex-between gap-16 flex-wrap">
            <div><h2>How can we help?</h2><p>The Customer Support Agent knows this platform. It will walk you through publishing, products, domains or billing step by step.</p></div>
            <span className="badge"><LifeBuoy size={10} /> Customer Support Agent</span>
          </div>
          <div className="ai-suggested" style={{ justifyContent: 'flex-start', marginBottom: 16 }}>
            {['How do I publish my website?', 'How do custom domains work?', 'How do I add a product?', 'Where do orders appear?'].map((q) => <button key={q} onClick={() => sendSupport(q)}>{q}</button>)}
          </div>
          <div className="ai-messages" style={{ maxHeight: 400, border: '1px solid var(--line)', borderRadius: 10, padding: 16, background: 'var(--cream)' }}>
            {supportMessages.map((message, i) => (
              <div className={`ai-message ${message.role}`} key={i}>
                <span className="ai-message-avatar">{message.role === 'assistant' ? 'AI' : 'You'}</span>
                <div className="ai-message-body">
                  <div className="ai-bubble"><Markdown content={message.text} />
                    {message.steps && <div className="analysis-list mt-8">{message.steps.map((step) => <div key={step}><Check size={12} /><span>{step}</span></div>)}</div>}
                  </div>
                </div>
              </div>
            ))}
            {supportBusy && <div className="ai-thinking"><span className="ai-dots"><i /><i /><i /></span> Looking that up…</div>}
          </div>
          <div className="ai-composer" style={{ border: '1px solid var(--line)', borderRadius: 10, marginTop: 10 }}>
            <textarea value={supportInput} onChange={(e) => setSupportInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendSupport(); } }} placeholder="Ask a platform question…" rows={2} />
            <button className="btn btn-accent" onClick={() => sendSupport()} disabled={supportBusy || !supportInput.trim()}><Send size={14} /></button>
          </div>
        </section>
      )}
    </>
  );
}

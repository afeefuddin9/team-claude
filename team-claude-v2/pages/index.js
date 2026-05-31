import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { supabase, isConfigured } from '../lib/supabase';

const TEAM_NAME = process.env.NEXT_PUBLIC_TEAM_NAME || 'Lead with Tribe';

const PRESET_COLORS = [
  '#CF5C7E','#4A9EE0','#2BAE8E','#E0943A',
  '#9B8AE0','#8A8680','#E07050','#D97757',
  '#5BAD8A','#C75B5B','#6B9EE0','#B07AE0',
];

const FALLBACK_WORKSPACES = [
  { id:'marketing',  label:'Marketing & Content',   color:'#CF5C7E', prompt:'', sort_order:1 },
  { id:'dev',        label:'Development / Tech',    color:'#4A9EE0', prompt:'', sort_order:2 },
  { id:'ops',        label:'Operations',            color:'#2BAE8E', prompt:'', sort_order:3 },
  { id:'client',     label:'Client Work',           color:'#E0943A', prompt:'', sort_order:4 },
  { id:'leadership', label:'Leadership',            color:'#9B8AE0', prompt:'', sort_order:5 },
  { id:'general',    label:'General / Experiments', color:'#8A8680', prompt:'', sort_order:6 },
  { id:'events',     label:'Upcoming Events',       color:'#E07050', prompt:'', sort_order:7 },
];

const initials = (n='') =>
  n.trim().split(/\s+/).map(w=>w[0]).join('').toUpperCase().slice(0,2) || '?';

const timeAgo = (ts) => {
  const s = (Date.now() - new Date(ts).getTime()) / 1000;
  if (s < 60)    return 'just now';
  if (s < 3600)  return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};

function mdToHtml(text='') {
  text = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  text = text.replace(/```(\w*)\n([\s\S]*?)```/g,(_,l,c)=>`<pre><code>${c.trimEnd()}</code></pre>`);
  text = text.replace(/`([^`\n]+)`/g,'<code>$1</code>');
  text = text.replace(/^### (.+)$/gm,'<h3>$1</h3>');
  text = text.replace(/^## (.+)$/gm,'<h2>$1</h2>');
  text = text.replace(/^# (.+)$/gm,'<h1>$1</h1>');
  text = text.replace(/\*\*\*(.+?)\*\*\*/g,'<strong><em>$1</em></strong>');
  text = text.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
  text = text.replace(/\*(.+?)\*/g,'<em>$1</em>');
  text = text.replace(/(^|\n)((?:[ \t]*[-*] .+\n?)+)/g,(_,p,b)=>{
    const items=b.trim().split('\n').map(l=>`<li>${l.replace(/^[ \t]*[-*] /,'')}</li>`).join('');
    return `${p}<ul>${items}</ul>`;
  });
  text = text.replace(/(^|\n)((?:[ \t]*\d+\. .+\n?)+)/g,(_,p,b)=>{
    const items=b.trim().split('\n').map(l=>`<li>${l.replace(/^[ \t]*\d+\. /,'')}</li>`).join('');
    return `${p}<ol>${items}</ol>`;
  });
  text = text.split(/\n{2,}/).map(p=>{
    const t=p.trim();
    if(!t) return '';
    if(/^<(h[1-3]|ul|ol|pre)/.test(t)) return t;
    return `<p>${t.replace(/\n/g,'<br>')}</p>`;
  }).join('\n');
  return text;
}

/* ── Workspace modal (Add / Edit) ───────────────── */
function WorkspaceModal({ existing, onSave, onClose }) {
  const isEdit = Boolean(existing);
  const [label,  setLabel]  = useState(existing?.label  || '');
  const [color,  setColor]  = useState(existing?.color  || PRESET_COLORS[0]);
  const [prompt, setPrompt] = useState(existing?.prompt || '');
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');

  async function handleSave() {
    if (!label.trim()) { setErr('Name is required'); return; }
    setSaving(true);
    setErr('');
    // Generate slug from label for new workspaces
    const id = isEdit
      ? existing.id
      : label.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    await onSave({ id, label: label.trim(), color, prompt: prompt.trim() });
    setSaving(false);
  }

  return (
    <div className="ws-picker-backdrop" onClick={onClose}>
      <div className="ws-picker-modal" style={{ width: 400 }} onClick={e => e.stopPropagation()}>
        <p className="ws-picker-title" style={{ marginBottom: 16 }}>
          {isEdit ? 'Edit workspace' : 'Add new workspace'}
        </p>

        {/* Name */}
        <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:4 }}>Workspace name *</label>
        <input
          autoFocus
          value={label}
          onChange={e => setLabel(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          placeholder="e.g. Product Design"
          style={{ width:'100%', marginBottom:12, padding:'8px 12px', borderRadius:8, border:'1px solid var(--border-2)', background:'var(--bg)', color:'var(--text)', fontSize:14, outline:'none', boxSizing:'border-box' }}
        />

        {/* Color */}
        <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Colour</label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:14 }}>
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{ width:26, height:26, borderRadius:'50%', background:c, border: color===c ? '3px solid var(--text)' : '2px solid transparent', cursor:'pointer', padding:0 }}
            />
          ))}
        </div>

        {/* Preview */}
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:8, background:'var(--bg-hover)', marginBottom:14 }}>
          <span style={{ width:10, height:10, borderRadius:'50%', background:color, display:'inline-block', flexShrink:0 }} />
          <span style={{ fontSize:13, color:'var(--text)', fontWeight:500 }}>{label || 'Workspace name'}</span>
        </div>

        {/* Custom system prompt (optional) */}
        <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:4 }}>
          Custom instructions for Claude <span style={{ color:'var(--text-3)' }}>(optional)</span>
        </label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="e.g. You are a product design expert. Help with UX, wireframes, user research, and design systems..."
          rows={3}
          style={{ width:'100%', marginBottom:14, padding:'8px 12px', borderRadius:8, border:'1px solid var(--border-2)', background:'var(--bg)', color:'var(--text)', fontSize:13, outline:'none', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box' }}
        />

        {err && <p style={{ color:'var(--danger)', fontSize:12, marginBottom:8 }}>{err}</p>}

        <div style={{ display:'flex', gap:8 }}>
          <button
            onClick={handleSave}
            disabled={saving || !label.trim()}
            style={{ flex:1, padding:'9px 0', background:'var(--accent)', color:'white', border:'none', borderRadius:8, fontWeight:500, fontSize:13, cursor: saving||!label.trim() ? 'not-allowed' : 'pointer', opacity: saving||!label.trim() ? 0.5 : 1 }}
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add workspace'}
          </button>
          <button
            onClick={onClose}
            style={{ padding:'9px 14px', borderRadius:8, border:'1px solid var(--border-2)', background:'none', color:'var(--text-2)', cursor:'pointer', fontSize:13 }}
          >
            Cancel
          </button>
        </div>

        {isEdit && (
          <button
            onClick={() => onSave({ ...existing, _delete: true })}
            style={{ width:'100%', marginTop:8, padding:'7px 0', color:'var(--danger)', background:'none', border:'none', cursor:'pointer', fontSize:12 }}
          >
            Delete this workspace
          </button>
        )}
      </div>
    </div>
  );
}

/* ── WS Picker (for new chat when on "All") ─────── */
function WsPicker({ workspaces, onPick, onClose }) {
  return (
    <div className="ws-picker-backdrop" onClick={onClose}>
      <div className="ws-picker-modal" onClick={e => e.stopPropagation()}>
        <p className="ws-picker-title">Start a new chat in…</p>
        <div className="ws-picker-grid">
          {workspaces.map(w => (
            <button key={w.id} className="ws-picker-btn" onClick={() => onPick(w.id)}>
              <span style={{ width:10, height:10, borderRadius:'50%', background:w.color, flexShrink:0, display:'inline-block' }} />
              <span style={{ fontSize:12, textAlign:'left', lineHeight:1.3 }}>{w.label}</span>
            </button>
          ))}
        </div>
        <button onClick={onClose} style={{ marginTop:12, fontSize:12, color:'var(--text-3)', width:'100%', padding:'6px 0', cursor:'pointer', borderRadius:6 }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ── Message ─────────────────────────────────────── */
function Message({ msg, identity, isStreaming }) {
  const isUser = msg.role === 'user';
  const isMe   = isUser && msg.author_name === identity?.name;
  return (
    <div className={`message-row ${isUser ? 'user' : 'assistant'}`}>
      {isUser
        ? <div className="msg-avatar" style={{ background: msg.author_color||'#D97757' }} title={msg.author_name}>{initials(msg.author_name)}</div>
        : <div className="msg-avatar claude" title="Claude">C</div>
      }
      <div className={`msg-body ${isUser ? 'user' : ''}`}>
        <div className="msg-meta">{isUser ? (isMe ? 'You' : msg.author_name) : 'Claude'}</div>
        <div className={`msg-bubble ${isUser ? 'user' : 'assistant'}`}>
          {isUser
            ? <span style={{ whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{msg.content}</span>
            : <>
                <div dangerouslySetInnerHTML={{ __html: mdToHtml(msg.content) }} style={{ wordBreak:'break-word' }} />
                {isStreaming && <span className="msg-cursor" />}
              </>
          }
        </div>
      </div>
    </div>
  );
}

/* ── Setup screen ─────────────────────────────────── */
function SetupScreen({ workspaces, onJoin }) {
  const [name, setName] = useState('');
  const COLORS = ['#D97757','#7F77DD','#1D9E75','#4A9EE0','#CF5C7E','#E0943A','#E07050','#2BAE8E'];

  function handleSubmit(e) {
    e?.preventDefault();
    if (!name.trim()) return;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    onJoin({ name: name.trim(), color });
  }

  return (
    <div className="setup-screen">
      <div className="setup-card">
        <div className="setup-logo">C</div>
        <h1 className="setup-title">Team Claude</h1>
        <p className="setup-sub">
          Shared workspace for <strong>{TEAM_NAME}</strong> — all conversations
          visible to your whole team.
        </p>
        <div className="setup-ws-chips">
          {workspaces.map(w => (
            <span key={w.id} className="setup-ws-chip">
              <span style={{ width:7, height:7, borderRadius:'50%', background:w.color, display:'inline-block' }} />
              {w.label.split(' ')[0]}
            </span>
          ))}
        </div>
        <form onSubmit={handleSubmit}>
          <label className="setup-label">Your name</label>
          <input autoFocus className="setup-input" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Mohammed Al-Rashid" />
          <button type="submit" className="setup-btn" disabled={!name.trim()}>Join workspace →</button>
        </form>
        <p className="setup-note">Your name appears on all your conversations. No password needed.</p>
      </div>
    </div>
  );
}

/* ── Main App ─────────────────────────────────────── */
export default function App() {
  const [identity,     setIdentity]     = useState(null);
  const [workspaces,   setWorkspaces]   = useState(FALLBACK_WORKSPACES);
  const [conversations,setConvs]        = useState([]);
  const [activeWs,     setActiveWs]     = useState('all');
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages,     setMessages]     = useState([]);
  const [input,        setInput]        = useState('');
  const [streaming,    setStreaming]     = useState(false);
  const [search,       setSearch]       = useState('');
  const [showPicker,   setShowPicker]   = useState(false);
  const [wsModal,      setWsModal]      = useState(null); // null | 'new' | workspace object
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(true);
  const [sidebarOpen,  setSidebarOpen]  = useState(false);

  const convRef   = useRef([]);
  const inputRef  = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => { convRef.current = conversations; }, [conversations]);

  /* ── Init ────────────────────────────────────────── */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tc_identity');
      if (saved) setIdentity(JSON.parse(saved));
    } catch {}
    loadWorkspaces();
    loadConversations();
  }, []);

  /* ── Realtime ─────────────────────────────────────── */
  useEffect(() => {
    if (!supabase) return;
    const ch = supabase.channel('realtime:all')
      .on('postgres_changes', { event:'*', schema:'public', table:'conversations' }, loadConversations)
      .on('postgres_changes', { event:'*', schema:'public', table:'workspaces' },    loadWorkspaces)
      .subscribe();
    return () => ch.unsubscribe();
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  /* ── Loaders ──────────────────────────────────────── */
  async function loadWorkspaces() {
    if (!supabase) return;
    const { data } = await supabase.from('workspaces').select('*').order('sort_order');
    if (data?.length) setWorkspaces(data);
  }

  async function loadConversations() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('conversations').select('*').order('updated_at', { ascending:false });
    if (data) { setConvs(data); convRef.current = data; }
    setLoading(false);
  }

  /* ── Identity ─────────────────────────────────────── */
  function handleJoin(id) {
    setIdentity(id);
    try { localStorage.setItem('tc_identity', JSON.stringify(id)); } catch {}
  }

  /* ── Workspace CRUD ───────────────────────────────── */
  async function handleWsSave(ws) {
    if (!supabase) { setWsModal(null); return; }

    if (ws._delete) {
      await supabase.from('workspaces').delete().eq('id', ws.id);
      setWorkspaces(prev => prev.filter(w => w.id !== ws.id));
      if (activeWs === ws.id) setActiveWs('all');
    } else if (wsModal === 'new') {
      // Check for duplicate id
      const exists = workspaces.find(w => w.id === ws.id);
      const finalId = exists ? ws.id + '-' + Date.now().toString(36) : ws.id;
      const newWs = { ...ws, id: finalId, sort_order: workspaces.length + 1 };
      const { data, error } = await supabase.from('workspaces').insert(newWs).select().single();
      if (data) setWorkspaces(prev => [...prev, data]);
    } else {
      // Edit
      await supabase.from('workspaces').update({ label: ws.label, color: ws.color, prompt: ws.prompt }).eq('id', ws.id);
      setWorkspaces(prev => prev.map(w => w.id === ws.id ? { ...w, ...ws } : w));
    }
    setWsModal(null);
  }

  /* ── New conversation ─────────────────────────────── */
  async function createConversation(wsId) {
    if (!identity) return;
    setShowPicker(false);
    if (!supabase) { setError('Supabase not configured. See README.'); return; }
    const { data, error: err } = await supabase.from('conversations').insert({
      title: 'New conversation', workspace: wsId,
      author_name: identity.name, author_color: identity.color,
    }).select().single();
    if (err) { setError('Could not create: ' + err.message); return; }
    setConvs(prev => [data, ...prev]);
    convRef.current = [data, ...convRef.current];
    setActiveConvId(data.id); setActiveWs(wsId);
    setMessages([]); setError(''); setSidebarOpen(false);
    setTimeout(() => inputRef.current?.focus(), 60);
  }

  /* ── Open conversation ────────────────────────────── */
  async function openConversation(convId) {
    if (!supabase) return;
    setActiveConvId(convId); setError(''); setSidebarOpen(false);
    const { data } = await supabase.from('messages').select('*').eq('conversation_id', convId).order('created_at');
    setMessages(data || []);
    setTimeout(() => inputRef.current?.focus(), 60);
  }

  /* ── Send message ─────────────────────────────────── */
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming || !activeConvId || !identity) return;
    setInput(''); setError('');
    if (inputRef.current) inputRef.current.style.height = 'auto';

    const userMsg = {
      id: `opt-u-${Date.now()}`, conversation_id: activeConvId,
      role: 'user', content: text,
      author_name: identity.name, author_color: identity.color,
      created_at: new Date().toISOString(),
    };
    const placeholder = {
      id: `opt-a-${Date.now()}`, conversation_id: activeConvId,
      role: 'assistant', content: '', created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg, placeholder]);
    setStreaming(true);

    try {
      if (supabase) {
        await supabase.from('messages').insert({
          conversation_id: activeConvId, role: 'user', content: text,
          author_name: identity.name, author_color: identity.color,
        });
      }

      const conv   = convRef.current.find(c => c.id === activeConvId);
      const wsData = workspaces.find(w => w.id === conv?.workspace);
      const apiMsgs = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMsgs, workspacePrompt: wsData?.prompt || '' }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const dec    = new TextDecoder();
      let fullText = '', buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n'); buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const p = JSON.parse(line.slice(6));
            if (p.error) throw new Error(p.error);
            if (p.text) {
              fullText += p.text;
              setMessages(prev => {
                const u = [...prev];
                u[u.length-1] = { ...u[u.length-1], content: fullText };
                return u;
              });
            }
          } catch(pe) { if (!pe.message?.includes('JSON')) throw pe; }
        }
      }

      if (supabase && fullText) {
        await supabase.from('messages').insert({ conversation_id: activeConvId, role: 'assistant', content: fullText });
        const isFirst  = (conv?.message_count || 0) === 0;
        const newTitle = isFirst ? text.slice(0,65)+(text.length>65?'…':'') : conv?.title;
        await supabase.from('conversations').update({
          title: newTitle, preview: fullText.slice(0,110),
          message_count: (conv?.message_count||0)+2, updated_at: new Date().toISOString(),
        }).eq('id', activeConvId);
        setConvs(prev =>
          prev.map(c => c.id===activeConvId
            ? { ...c, title:newTitle, preview:fullText.slice(0,110), message_count:(c.message_count||0)+2, updated_at:new Date().toISOString() }
            : c
          ).sort((a,b) => new Date(b.updated_at)-new Date(a.updated_at))
        );
      }
    } catch(err) {
      const msg = err.message || 'Unknown error';
      setError(msg);
      setMessages(prev => { const u=[...prev]; u[u.length-1]={...u[u.length-1],content:`⚠ ${msg}`}; return u; });
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  }, [input, streaming, activeConvId, identity, messages, workspaces]);

  function handleKeyDown(e) {
    if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }
  function handleInputChange(e) {
    setInput(e.target.value);
    const ta = e.target; ta.style.height='auto'; ta.style.height=Math.min(ta.scrollHeight,200)+'px';
  }

  /* ── Derived state ─────────────────────────────────── */
  const wsCounts = {};
  conversations.forEach(c => { wsCounts[c.workspace]=(wsCounts[c.workspace]||0)+1; });

  const filteredConvs = conversations
    .filter(c => activeWs==='all' || c.workspace===activeWs)
    .filter(c => {
      if (!search) return true;
      const q = search.toLowerCase();
      return c.title?.toLowerCase().includes(q) || c.author_name?.toLowerCase().includes(q);
    });

  const activeConv   = conversations.find(c => c.id===activeConvId);
  const activeConvWs = workspaces.find(w => w.id===activeConv?.workspace) || { label:'Unknown', color:'#888' };
  const activeWsData = activeWs==='all' ? { label:'All workspaces', color:'#888' } : (workspaces.find(w=>w.id===activeWs)||{label:'',color:'#888'});

  if (!identity) return (
    <>
      <Head><title>Team Claude — {TEAM_NAME}</title></Head>
      <SetupScreen workspaces={workspaces} onJoin={handleJoin} />
    </>
  );

  return (
    <>
      <Head>
        <title>{activeConv ? `${activeConv.title} — Team Claude` : `Team Claude — ${TEAM_NAME}`}</title>
      </Head>

      {sidebarOpen && (
        <div onClick={()=>setSidebarOpen(false)} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:40 }} />
      )}

      {/* ── SIDEBAR ──────────────────────────────────── */}
      <aside className={`sidebar ${sidebarOpen?'open':''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">C</div>
            <span className="sidebar-logo-text">Team Claude</span>
            <span className="sidebar-logo-team">{TEAM_NAME}</span>
          </div>
          <button className="new-chat-btn" onClick={() => activeWs!=='all' ? createConversation(activeWs) : setShowPicker(true)}>
            <span style={{ fontSize:18,lineHeight:1,marginTop:-1 }}>+</span> New chat
          </button>
        </div>

        <div className="ws-nav">
          {/* "All" row */}
          <div className="ws-section-label" style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <span>Workspaces</span>
            <button
              onClick={() => setWsModal('new')}
              title="Add workspace"
              style={{ fontSize:16,lineHeight:1,color:'var(--text-3)',padding:'0 2px',cursor:'pointer',borderRadius:4 }}
            >+</button>
          </div>

          <button className={`ws-item ${activeWs==='all'?'active':''}`} onClick={()=>{setActiveWs('all');setActiveConvId(null);setMessages([]);}}>
            <span className="ws-dot" style={{ background:'#888' }} />
            <span style={{ flex:1 }}>All workspaces</span>
          </button>

          {workspaces.map(ws => (
            <div key={ws.id} style={{ display:'flex',alignItems:'center',gap:0 }}>
              <button
                className={`ws-item ${activeWs===ws.id?'active':''}`}
                style={{ flex:1 }}
                onClick={() => { setActiveWs(ws.id); setActiveConvId(null); setMessages([]); }}
              >
                <span className="ws-dot" style={{ background:ws.color }} />
                <span style={{ flex:1 }}>{ws.label}</span>
                {wsCounts[ws.id]>0 && <span className="ws-count">{wsCounts[ws.id]}</span>}
              </button>
              {/* Edit pencil — appears on hover via CSS or always visible subtly */}
              <button
                onClick={() => setWsModal(ws)}
                title="Edit workspace"
                style={{ padding:'4px 5px',borderRadius:4,color:'var(--text-3)',fontSize:11,cursor:'pointer',flexShrink:0,opacity:0.5 }}
              >✎</button>
            </div>
          ))}
        </div>

        <div className="conv-search">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search conversations…" />
          </div>
        </div>

        <div className="conv-list">
          {loading && <div className="no-convs">Loading…</div>}
          {!loading && filteredConvs.length===0 && (
            <div className="no-convs">{search?'No results':'No conversations yet.\nStart one above.'}</div>
          )}
          {filteredConvs.map(conv => {
            const cws = workspaces.find(w=>w.id===conv.workspace) || { color:'#888' };
            return (
              <button key={conv.id} className={`conv-item ${activeConvId===conv.id?'active':''}`} onClick={()=>openConversation(conv.id)}>
                <div className="conv-item-meta">
                  {activeWs==='all' && <span className="conv-ws-dot" style={{ background:cws.color }} />}
                  <div className="conv-avatar" style={{ background:conv.author_color }}>{initials(conv.author_name)}</div>
                  <span className="conv-author">{conv.author_name}</span>
                  <span className="conv-time">{timeAgo(conv.updated_at)}</span>
                </div>
                <div className="conv-title">{conv.title}</div>
                {conv.preview && <div className="conv-preview">{conv.preview}</div>}
              </button>
            );
          })}
        </div>

        <div className="sidebar-footer">
          <div className="user-avatar" style={{ background:identity.color }}>{initials(identity.name)}</div>
          <span className="user-name">{identity.name}</span>
          <span className="sync-status">{isConfigured?'● live':'○ no db'}</span>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────── */}
      <main className="main">
        {!activeConvId ? (
          <>
            <div style={{ padding:'12px 16px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:8 }}>
              <button className="mobile-menu-btn" onClick={()=>setSidebarOpen(true)}>☰</button>
              <span style={{ fontSize:14,color:'var(--text-2)' }}>Team Claude</span>
            </div>
            {!isConfigured && (
              <div className="config-warn" style={{ margin:'16px 24px 0' }}>
                <strong>⚠ Supabase not configured</strong> — add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to your <code>.env.local</code>, then restart. See README.
              </div>
            )}
            <div className="empty-state">
              <div className="empty-icon">C</div>
              <h2 className="empty-title">{activeWs==='all'?`${TEAM_NAME} workspace`:activeWsData.label}</h2>
              <p className="empty-sub">
                {filteredConvs.length>0
                  ? `${filteredConvs.length} team conversation${filteredConvs.length!==1?'s':''}. Select one or start a new chat.`
                  : 'No conversations yet. Start the first one for your team.'}
              </p>
              <button className="empty-cta" onClick={()=>activeWs!=='all'?createConversation(activeWs):setShowPicker(true)}>
                + New {activeWs!=='all'?activeWsData.label.split(' ')[0]+' ':''}chat
              </button>
              {conversations.length>0 && (
                <div className="team-pills">
                  {[...new Set(conversations.map(c=>c.author_name))].slice(0,8).map(name => {
                    const color = conversations.find(c=>c.author_name===name)?.author_color||'#D97757';
                    return (
                      <span key={name} className="team-pill">
                        <span style={{ width:18,height:18,borderRadius:'50%',background:color,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:600,color:'white' }}>
                          {initials(name)}
                        </span>
                        {name}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="chat-header">
              <button className="mobile-menu-btn" onClick={()=>setSidebarOpen(true)}>☰</button>
              <div className="chat-header-ws-badge">
                <span style={{ width:8,height:8,borderRadius:'50%',background:activeConvWs.color,display:'inline-block' }} />
                {activeConvWs.label}
              </div>
              <h1 className="chat-header-title">{activeConv?.title||'Conversation'}</h1>
              <div style={{ display:'flex',alignItems:'center',gap:5,flexShrink:0 }}>
                <div style={{ width:20,height:20,borderRadius:'50%',background:activeConv?.author_color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:600,color:'white' }}>
                  {initials(activeConv?.author_name||'')}
                </div>
                <span style={{ fontSize:12,color:'var(--text-3)' }}>{activeConv?.author_name}</span>
                {activeConv?.author_name!==identity.name && <span className="continuing-badge">continuing</span>}
              </div>
              <button className="chat-close-btn" onClick={()=>{setActiveConvId(null);setMessages([]);}}>✕</button>
            </div>

            <div className="messages-area">
              <div className="messages-inner">
                {messages.length===0 && !streaming && (
                  <div style={{ textAlign:'center',color:'var(--text-3)',fontSize:14,padding:'48px 0' }}>
                    Send a message to start the conversation
                  </div>
                )}
                {messages.map((msg,i) => (
                  <Message key={msg.id} msg={msg} identity={identity}
                    isStreaming={streaming && i===messages.length-1 && msg.role==='assistant'} />
                ))}
                <div ref={bottomRef} />
              </div>
            </div>

            {error && <div className="error-bar"><strong>Error:</strong> {error}</div>}

            <div className="input-area">
              <div className="input-inner">
                <div className="input-box">
                  <textarea
                    ref={inputRef}
                    className="input-textarea"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message Claude in ${activeConvWs.label}…`}
                    rows={1}
                    disabled={streaming}
                  />
                  <button className="send-btn" onClick={sendMessage} disabled={streaming||!input.trim()} aria-label="Send">
                    {streaming ? <div className="spinner"/> : '↑'}
                  </button>
                </div>
                <div className="input-hint">
                  Enter to send · Shift+Enter for new line ·{' '}
                  <span style={{ color:activeConvWs.color }}>{activeConvWs.label}</span>
                  {' '}· visible to all team members
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Modals */}
      {showPicker && <WsPicker workspaces={workspaces} onPick={createConversation} onClose={()=>setShowPicker(false)} />}
      {wsModal    && (
        <WorkspaceModal
          existing={wsModal==='new' ? null : wsModal}
          onSave={handleWsSave}
          onClose={()=>setWsModal(null)}
        />
      )}
    </>
  );
}

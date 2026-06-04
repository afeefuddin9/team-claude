import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase, isConfigured, isAllowedEmail, TEAM_DOMAIN } from '../lib/supabase';

const TEAM_NAME = process.env.NEXT_PUBLIC_TEAM_NAME || 'Lead with Tribe';

// ── AI Models ──────────────────────────────────────────────
const MODELS = [
  { id:'claude-haiku-4-5',        provider:'claude',  name:'Claude Haiku',      badge:'Fastest',      color:'#D97757' },
  { id:'claude-sonnet-4-5',       provider:'claude',  name:'Claude Sonnet',     badge:'Balanced',     color:'#D97757' },
  { id:'claude-opus-4-5',         provider:'claude',  name:'Claude Opus',       badge:'Powerful',     color:'#D97757' },
  { id:'gemini-1.5-flash',        provider:'gemini',  name:'Gemini 1.5 Flash',  badge:'Free',         color:'#4285F4' },
  { id:'gemini-1.5-pro',          provider:'gemini',  name:'Gemini 1.5 Pro',    badge:'Free·Limited', color:'#4285F4' },
  { id:'gemini-2.0-flash',        provider:'gemini',  name:'Gemini 2.0 Flash',  badge:'Needs billing',color:'#4285F4' },
  { id:'llama-3.3-70b-versatile', provider:'groq',    name:'Llama 3.3 70B',     badge:'Free',         color:'#0467DF' },
  { id:'llama-3.1-8b-instant',    provider:'groq',    name:'Llama 3.1 8B',      badge:'Free·Fast',    color:'#0467DF' },
];
const DEFAULT_MODEL = MODELS.find(m => m.id === 'claude-sonnet-4-5') || MODELS[0];

// ── Workspaces fallback ────────────────────────────────────
const FALLBACK_WS = [
  { id:'all',        label:'All workspaces',        color:'#888780' },
  { id:'marketing',  label:'Marketing & Content',   color:'#CF5C7E' },
  { id:'dev',        label:'Development / Tech',    color:'#4A9EE0' },
  { id:'ops',        label:'Operations',            color:'#2BAE8E' },
  { id:'client',     label:'Client Work',           color:'#E0943A' },
  { id:'leadership', label:'Leadership',            color:'#9B8AE0' },
  { id:'general',    label:'General / Experiments', color:'#8A8680' },
  { id:'events',     label:'Upcoming Events',       color:'#E07050' },
];

const MEMBER_COLORS = ['#D97757','#7F77DD','#1D9E75','#4A9EE0','#CF5C7E','#E0943A','#E07050','#2BAE8E'];
const gid   = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`;
const inits = (n='') => n.trim().split(/\s+/).map(w=>w[0]).join('').toUpperCase().slice(0,2)||'?';
const ago   = ts => {
  const s=(Date.now()-new Date(ts).getTime())/1000;
  if(s<60) return 'now'; if(s<3600) return `${~~(s/60)}m`; if(s<86400) return `${~~(s/3600)}h`; return `${~~(s/86400)}d`;
};
function mdToHtml(t=''){
  t=t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  t=t.replace(/```(\w*)\n([\s\S]*?)```/g,(_,l,c)=>`<pre><code>${c.trimEnd()}</code></pre>`);
  t=t.replace(/`([^`\n]+)`/g,'<code>$1</code>');
  t=t.replace(/^### (.+)$/gm,'<h3>$1</h3>').replace(/^## (.+)$/gm,'<h2>$1</h2>').replace(/^# (.+)$/gm,'<h1>$1</h1>');
  t=t.replace(/\*\*\*(.+?)\*\*\*/g,'<strong><em>$1</em></strong>').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>');
  t=t.replace(/(^|\n)((?:[ \t]*[-*] .+\n?)+)/g,(_,p,b)=>`${p}<ul>${b.trim().split('\n').map(l=>`<li>${l.replace(/^[ \t]*[-*] /,'')}</li>`).join('')}</ul>`);
  t=t.replace(/(^|\n)((?:[ \t]*\d+\. .+\n?)+)/g,(_,p,b)=>`${p}<ol>${b.trim().split('\n').map(l=>`<li>${l.replace(/^[ \t]*\d+\. /,'')}</li>`).join('')}</ol>`);
  t=t.split(/\n{2,}/).map(p=>{const r=p.trim();if(!r)return'';if(/^<(h[1-3]|ul|ol|pre)/.test(r))return r;return`<p>${r.replace(/\n/g,'<br>')}</p>`;}).join('\n');
  return t;
}

// ── Google G icon SVG ──────────────────────────────────────
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" style={{flexShrink:0}}>
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.59.102-1.167.282-1.707V4.961H.957C.347 6.174 0 7.548 0 9s.348 2.826.957 4.039l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
  </svg>
);

// ── Auth Screen ────────────────────────────────────────────
function AuthScreen({ errorCode }) {
  const [loading, setLoading] = useState(false);
  const errors = {
    wrong_domain:  `Only @${TEAM_DOMAIN} accounts are allowed.`,
    auth_failed:   'Authentication failed. Please try again.',
    missing_code:  'Invalid callback. Please try signing in again.',
  };

  async function signIn() {
    if (!supabase) return;
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { hd: TEAM_DOMAIN },
      },
    });
  }

  return (
    <div className="setup-screen">
      <div className="setup-card">
        <div className="setup-logo">C</div>
        <h1 className="setup-title">Team Claude</h1>
        <p className="setup-sub">
          Sign in with your <strong>@{TEAM_DOMAIN}</strong> Google account to access
          the {TEAM_NAME} AI workspace.
        </p>
        {errorCode && errors[errorCode] && (
          <div className="error-bar" style={{marginBottom:14}}>{errors[errorCode]}</div>
        )}
        <button
          className="google-btn"
          onClick={signIn}
          disabled={loading || !supabase}
        >
          <GoogleIcon />
          {loading ? 'Redirecting to Google…' : 'Continue with Google'}
        </button>
        {!supabase && (
          <div className="config-warn" style={{marginTop:12}}>
            Supabase is not configured. Add environment variables and redeploy.
          </div>
        )}
        <p className="setup-note">Only @{TEAM_DOMAIN} accounts are permitted to sign in.</p>
      </div>
    </div>
  );
}

// ── Model Picker ───────────────────────────────────────────
function ModelPicker({ value, onChange, isLocked, onToggleLock, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = MODELS.find(m => m.id === value?.id) || DEFAULT_MODEL;
  const providers = [...new Set(MODELS.map(m => m.provider))];

  useEffect(() => {
    if (!open) return;
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div ref={ref} style={{position:'relative', display:'inline-flex', alignItems:'center', gap:4}}>
      {/* Model selector button */}
      <button
        className="model-picker-btn"
        onClick={() => !isLocked && !disabled && setOpen(p=>!p)}
        title={isLocked ? 'Model locked for this conversation' : 'Change AI model'}
        style={{ opacity: isLocked ? 0.75 : 1, cursor: isLocked ? 'default' : 'pointer' }}
      >
        <span style={{width:8,height:8,borderRadius:'50%',background:current.color,flexShrink:0,display:'inline-block'}}/>
        <span style={{fontSize:12,fontWeight:500,color:'var(--text)'}}>{current.name}</span>
        <span style={{fontSize:10,color:'var(--text-3)',background:'var(--bg-hover)',padding:'1px 5px',borderRadius:4}}>{current.badge}</span>
        {!isLocked && <span style={{fontSize:10,color:'var(--text-3)'}}>▾</span>}
      </button>

      {/* Lock / Unlock toggle */}
      <button
        className="model-lock-btn"
        onClick={onToggleLock}
        title={isLocked ? 'Unlock model (allow switching)' : 'Lock model for this conversation'}
      >
        {isLocked
          ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
        }
      </button>

      {/* Dropdown */}
      {open && (
        <div className="model-dropdown">
          {providers.map(p => (
            <div key={p}>
              <div className="model-dropdown-group">{p === 'groq' ? 'Meta Llama (via Groq)' : p.charAt(0).toUpperCase()+p.slice(1)}</div>
              {MODELS.filter(m => m.provider === p).map(m => (
                <button
                  key={m.id}
                  className={`model-dropdown-item ${value?.id === m.id ? 'active' : ''}`}
                  onClick={() => { onChange(m); setOpen(false); }}
                >
                  <span style={{width:8,height:8,borderRadius:'50%',background:m.color,display:'inline-block',flexShrink:0}}/>
                  <span style={{flex:1,fontSize:12,color:'var(--text)'}}>{m.name}</span>
                  <span style={{fontSize:10,color:'var(--text-3)',background:'var(--bg-hover)',padding:'1px 5px',borderRadius:4}}>{m.badge}</span>
                </button>
              ))}
            </div>
          ))}
          <div style={{borderTop:'0.5px solid var(--border)',padding:'6px 10px'}}>
            <p style={{fontSize:10,color:'var(--text-3)',margin:0}}>Groq models are free. Gemini Pro requires billing. Claude requires Anthropic API key.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Workspace Modal ────────────────────────────────────────
const PRESET_COLORS = ['#CF5C7E','#4A9EE0','#2BAE8E','#E0943A','#9B8AE0','#8A8680','#E07050','#D97757','#5BAD8A','#C75B5B','#6B9EE0','#B07AE0'];

function WorkspaceModal({ existing, onSave, onClose }) {
  const isEdit = Boolean(existing);
  const [label,  setLabel]  = useState(existing?.label  || '');
  const [color,  setColor]  = useState(existing?.color  || PRESET_COLORS[0]);
  const [prompt, setPrompt] = useState(existing?.prompt || '');
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');

  async function save() {
    if (!label.trim()) { setErr('Name is required'); return; }
    setSaving(true); setErr('');
    const id = isEdit ? existing.id : label.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    await onSave({ id, label:label.trim(), color, prompt:prompt.trim() });
    setSaving(false);
  }

  return (
    <div className="ws-picker-backdrop" onClick={onClose}>
      <div className="ws-picker-modal" style={{width:400}} onClick={e=>e.stopPropagation()}>
        <p className="ws-picker-title">{isEdit ? 'Edit workspace' : 'Add new workspace'}</p>
        <label style={{fontSize:12,color:'var(--text-2)',display:'block',marginBottom:4}}>Workspace name</label>
        <input autoFocus value={label} onChange={e=>setLabel(e.target.value)} onKeyDown={e=>e.key==='Enter'&&save()} placeholder="e.g. Product Design" style={{width:'100%',marginBottom:12,boxSizing:'border-box'}}/>
        <label style={{fontSize:12,color:'var(--text-2)',display:'block',marginBottom:6}}>Colour</label>
        <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:14}}>
          {PRESET_COLORS.map(c=>(
            <button key={c} onClick={()=>setColor(c)} style={{width:26,height:26,borderRadius:'50%',background:c,border:color===c?'3px solid var(--text)':'2px solid transparent',cursor:'pointer',padding:0}}/>
          ))}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',borderRadius:8,background:'var(--bg-hover)',marginBottom:14}}>
          <span style={{width:10,height:10,borderRadius:'50%',background:color,display:'inline-block',flexShrink:0}}/>
          <span style={{fontSize:13,color:'var(--text)',fontWeight:500}}>{label||'Workspace name'}</span>
        </div>
        <label style={{fontSize:12,color:'var(--text-2)',display:'block',marginBottom:4}}>Claude instructions <span style={{color:'var(--text-3)'}}>(optional)</span></label>
        <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="e.g. You are a product design expert..." rows={3} style={{width:'100%',marginBottom:14,padding:'8px 12px',borderRadius:8,border:'1px solid var(--border-2)',background:'var(--bg)',color:'var(--text)',fontSize:13,outline:'none',resize:'vertical',fontFamily:'inherit',boxSizing:'border-box'}}/>
        {err && <p style={{color:'var(--danger)',fontSize:12,marginBottom:8}}>{err}</p>}
        <div style={{display:'flex',gap:8}}>
          <button onClick={save} disabled={saving||!label.trim()} style={{flex:1,padding:'9px 0',background:'var(--accent)',color:'white',border:'none',borderRadius:8,fontWeight:500,fontSize:13,cursor:saving||!label.trim()?'not-allowed':'pointer',opacity:saving||!label.trim()?0.5:1}}>
            {saving?'Saving…':isEdit?'Save changes':'Add workspace'}
          </button>
          <button onClick={onClose} style={{padding:'9px 14px',borderRadius:8,border:'1px solid var(--border-2)',background:'none',color:'var(--text-2)',cursor:'pointer',fontSize:13}}>Cancel</button>
        </div>
        {isEdit&&<button onClick={()=>onSave({...existing,_delete:true})} style={{width:'100%',marginTop:8,padding:'7px 0',color:'var(--danger)',background:'none',border:'none',cursor:'pointer',fontSize:12}}>Delete this workspace</button>}
      </div>
    </div>
  );
}

// ── WS Picker modal ────────────────────────────────────────
function WsPicker({ workspaces, onPick, onClose }) {
  return (
    <div className="ws-picker-backdrop" onClick={onClose}>
      <div className="ws-picker-modal" onClick={e=>e.stopPropagation()}>
        <p className="ws-picker-title">Start a new chat in…</p>
        <div className="ws-picker-grid">
          {workspaces.map(w=>(
            <button key={w.id} className="ws-picker-btn" onClick={()=>onPick(w.id)}>
              <span style={{width:10,height:10,borderRadius:'50%',background:w.color,flexShrink:0,display:'inline-block'}}/>
              <span style={{fontSize:12,textAlign:'left',lineHeight:1.3}}>{w.label}</span>
            </button>
          ))}
        </div>
        <button onClick={onClose} style={{marginTop:12,fontSize:12,color:'var(--text-3)',width:'100%',padding:'6px 0',cursor:'pointer',borderRadius:6}}>Cancel</button>
      </div>
    </div>
  );
}

// ── Message component ──────────────────────────────────────
function Message({ msg, user, isStreaming }) {
  const isUser = msg.role === 'user';
  const isMe   = isUser && (msg.author_name === user?.user_metadata?.full_name || msg.author_name === user?.email);
  const modelInfo = !isUser && msg.model_used ? MODELS.find(m=>m.id===msg.model_used) : null;

  return (
    <div className={`message-row ${isUser?'user':'assistant'}`}>
      {isUser
        ? <div className="msg-avatar" style={{background:msg.author_color||'#D97757'}} title={msg.author_name}>{inits(msg.author_name)}</div>
        : <div className="msg-avatar claude" title="AI Assistant">
            {modelInfo ? <span style={{width:8,height:8,borderRadius:'50%',background:modelInfo.color,display:'block'}}/> : 'C'}
          </div>
      }
      <div className={`msg-body ${isUser?'user':''}`}>
        <div className="msg-meta">
          {isUser
            ? (isMe ? 'You' : msg.author_name)
            : (modelInfo ? modelInfo.name : 'Claude')
          }
        </div>
        <div className={`msg-bubble ${isUser?'user':'assistant'}`}>
          {isUser
            ? <span style={{whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{msg.content}</span>
            : <>
                <div dangerouslySetInnerHTML={{__html:mdToHtml(msg.content)}} style={{wordBreak:'break-word'}}/>
                {isStreaming && <span className="msg-cursor"/>}
              </>
          }
        </div>
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────
export default function App() {
  const router = useRouter();

  // Auth
  const [user,        setUser]        = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Workspaces
  const [workspaces, setWorkspaces] = useState(FALLBACK_WS.filter(w=>w.id!=='all'));

  // Conversations
  const [conversations, setConvs]       = useState([]);
  const [activeWs,      setActiveWs]    = useState('all');
  const [activeConvId,  setActiveConvId]= useState(null);
  const [messages,      setMessages]    = useState([]);

  // Model
  const [currentModel,   setCurrentModel]   = useState(DEFAULT_MODEL);
  const [isModelLocked,  setIsModelLocked]  = useState(false);

  // UI
  const [input,       setInput]       = useState('');
  const [streaming,   setStreaming]   = useState(false);
  const [search,      setSearch]      = useState('');
  const [showPicker,  setShowPicker]  = useState(false);
  const [wsModal,     setWsModal]     = useState(null);
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const convRef  = useRef([]);
  const inputRef = useRef(null);
  const bottomRef= useRef(null);

  useEffect(()=>{ convRef.current = conversations; },[conversations]);

  // ── Auth init ──────────────────────────────────────────
  useEffect(()=>{
    if (!supabase) { setAuthLoading(false); return; }

    supabase.auth.getSession().then(({data:{session}})=>{
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const {data:{subscription}} = supabase.auth.onAuthStateChange((_,session)=>{
      setUser(session?.user ?? null);
    });

    return ()=> subscription.unsubscribe();
  },[]);

  // ── Data load ──────────────────────────────────────────
  useEffect(()=>{
    if(!user) return;
    loadWorkspaces();
    loadConversations();
  },[user]);

  // ── Realtime ───────────────────────────────────────────
  useEffect(()=>{
    if(!supabase||!user) return;
    const ch = supabase.channel('realtime')
      .on('postgres_changes',{event:'*',schema:'public',table:'conversations'},loadConversations)
      .on('postgres_changes',{event:'*',schema:'public',table:'workspaces'},loadWorkspaces)
      .subscribe();
    return ()=> ch.unsubscribe();
  },[user]);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}); },[messages]);

  // ── Loaders ────────────────────────────────────────────
  async function loadWorkspaces(){
    if(!supabase) return;
    const {data} = await supabase.from('workspaces').select('*').order('sort_order');
    if(data?.length) setWorkspaces(data);
  }

  async function loadConversations(){
    if(!supabase){ setLoading(false); return; }
    const {data} = await supabase.from('conversations').select('*').order('updated_at',{ascending:false});
    if(data){ setConvs(data); convRef.current=data; }
    setLoading(false);
  }

  // ── Workspace CRUD ─────────────────────────────────────
  async function handleWsSave(ws){
    if(!supabase){ setWsModal(null); return; }
    if(ws._delete){
      await supabase.from('workspaces').delete().eq('id',ws.id);
      setWorkspaces(prev=>prev.filter(w=>w.id!==ws.id));
      if(activeWs===ws.id) setActiveWs('all');
    } else if(wsModal==='new'){
      const exists=workspaces.find(w=>w.id===ws.id);
      const finalId=exists?ws.id+'-'+Date.now().toString(36):ws.id;
      const {data}=await supabase.from('workspaces').insert({...ws,id:finalId,sort_order:workspaces.length+1}).select().single();
      if(data) setWorkspaces(prev=>[...prev,data]);
    } else {
      await supabase.from('workspaces').update({label:ws.label,color:ws.color,prompt:ws.prompt}).eq('id',ws.id);
      setWorkspaces(prev=>prev.map(w=>w.id===ws.id?{...w,...ws}:w));
    }
    setWsModal(null);
  }

  // ── New conversation ───────────────────────────────────
  async function createConversation(wsId){
    if(!user||!supabase){ setError('Not signed in.'); return; }
    setShowPicker(false);
    const {data,error:err} = await supabase.from('conversations').insert({
      title:          'New conversation',
      workspace:      wsId,
      author_name:    user.user_metadata?.full_name || user.email,
      author_color:   MEMBER_COLORS[Math.floor(Math.random()*MEMBER_COLORS.length)],
      owner_id:       user.id,
      model_used:     currentModel.id,
      provider:       currentModel.provider,
      is_model_locked: false,
    }).select().single();
    if(err){ setError('Could not create: '+err.message); return; }
    setConvs(prev=>[data,...prev]); convRef.current=[data,...convRef.current];
    setActiveConvId(data.id); setActiveWs(wsId);
    setMessages([]); setError(''); setSidebarOpen(false);
    setIsModelLocked(false);
    setTimeout(()=>inputRef.current?.focus(),60);
  }

  // ── Open conversation ──────────────────────────────────
  async function openConversation(convId){
    if(!supabase) return;
    setActiveConvId(convId); setError(''); setSidebarOpen(false);
    // Restore model state for this conversation
    const conv = convRef.current.find(c=>c.id===convId);
    if(conv){
      const saved = MODELS.find(m=>m.id===conv.model_used)||DEFAULT_MODEL;
      setCurrentModel(saved);
      setIsModelLocked(conv.is_model_locked||false);
    }
    const {data} = await supabase.from('messages').select('*').eq('conversation_id',convId).order('created_at');
    setMessages(data||[]);
    setTimeout(()=>inputRef.current?.focus(),60);
  }

  // ── Toggle private ─────────────────────────────────────
  async function togglePrivate(){
    if(!activeConvId||!supabase) return;
    const conv=convRef.current.find(c=>c.id===activeConvId);
    if(!conv||conv.owner_id!==user?.id) return; // only owner can toggle
    const newVal=!conv.is_private;
    await supabase.from('conversations').update({is_private:newVal}).eq('id',activeConvId);
    setConvs(prev=>prev.map(c=>c.id===activeConvId?{...c,is_private:newVal}:c));
  }

  // ── Toggle model lock ──────────────────────────────────
  async function toggleModelLock(){
    const newLocked=!isModelLocked;
    setIsModelLocked(newLocked);
    if(activeConvId&&supabase){
      await supabase.from('conversations').update({is_model_locked:newLocked}).eq('id',activeConvId);
      setConvs(prev=>prev.map(c=>c.id===activeConvId?{...c,is_model_locked:newLocked}:c));
    }
  }

  // ── Change model ───────────────────────────────────────
  async function changeModel(model){
    setCurrentModel(model);
    if(activeConvId&&supabase&&!isModelLocked){
      await supabase.from('conversations').update({model_used:model.id,provider:model.provider}).eq('id',activeConvId);
      setConvs(prev=>prev.map(c=>c.id===activeConvId?{...c,model_used:model.id,provider:model.provider}:c));
    }
  }

  // ── Send message ───────────────────────────────────────
  const sendMessage = useCallback(async()=>{
    const text=input.trim();
    if(!text||streaming||!activeConvId||!user) return;
    setInput(''); setError('');
    if(inputRef.current) inputRef.current.style.height='auto';

    const authorName = user.user_metadata?.full_name || user.email;
    const authorColor= MEMBER_COLORS[Math.floor(Math.random()*MEMBER_COLORS.length)];
    const uMsg = {id:`opt-u-${Date.now()}`,conversation_id:activeConvId,role:'user',content:text,author_name:authorName,author_color:authorColor,model_used:null,provider:null,created_at:new Date().toISOString()};
    const phld = {id:`opt-a-${Date.now()}`,conversation_id:activeConvId,role:'assistant',content:'',model_used:currentModel.id,provider:currentModel.provider,created_at:new Date().toISOString()};
    setMessages(prev=>[...prev,uMsg,phld]);
    setStreaming(true);

    try{
      if(supabase){
        await supabase.from('messages').insert({conversation_id:activeConvId,role:'user',content:text,author_name:authorName,author_color:authorColor});
      }

      const conv=convRef.current.find(c=>c.id===activeConvId);
      const wsData=workspaces.find(w=>w.id===conv?.workspace);
      const apiMsgs=[...messages,uMsg].map(m=>({role:m.role,content:m.content}));

      const res=await fetch('/api/chat',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({messages:apiMsgs,provider:currentModel.provider,model:currentModel.id,workspacePrompt:wsData?.prompt||''}),
      });
      if(!res.ok){const b=await res.json().catch(()=>({})); throw new Error(b.error||`HTTP ${res.status}`);}

      const reader=res.body.getReader(),dec=new TextDecoder();
      let full='',buf='';
      while(true){
        const{done,value}=await reader.read(); if(done) break;
        buf+=dec.decode(value,{stream:true});
        const lines=buf.split('\n'); buf=lines.pop();
        for(const ln of lines){
          if(!ln.startsWith('data: ')) continue;
          try{const p=JSON.parse(ln.slice(6));if(p.error)throw new Error(p.error);if(p.text){full+=p.text;setMessages(pv=>{const u=[...pv];u[u.length-1]={...u[u.length-1],content:full};return u;});}}catch(pe){if(!pe.message?.includes('JSON'))throw pe;}
        }
      }

      if(supabase&&full){
        await supabase.from('messages').insert({conversation_id:activeConvId,role:'assistant',content:full,model_used:currentModel.id,provider:currentModel.provider});
        const isFirst=(conv?.message_count||0)===0;
        const newTitle=isFirst?text.slice(0,65)+(text.length>65?'…':''):conv?.title;
        await supabase.from('conversations').update({title:newTitle,preview:full.slice(0,110),message_count:(conv?.message_count||0)+2,updated_at:new Date().toISOString(),model_used:currentModel.id,provider:currentModel.provider}).eq('id',activeConvId);
        setConvs(prev=>prev.map(c=>c.id===activeConvId?{...c,title:newTitle,preview:full.slice(0,110),message_count:(c.message_count||0)+2,updated_at:new Date().toISOString(),model_used:currentModel.id,provider:currentModel.provider}:c).sort((a,b)=>new Date(b.updated_at)-new Date(a.updated_at)));
      }
    }catch(err){
      setError(err.message||'Unknown error');
      setMessages(pv=>{const u=[...pv];u[u.length-1]={...u[u.length-1],content:`⚠ ${err.message}`};return u;});
    }finally{
      setStreaming(false); inputRef.current?.focus();
    }
  },[input,streaming,activeConvId,user,messages,currentModel,workspaces]);

  function handleKeyDown(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}}
  function handleInputChange(e){setInput(e.target.value);const ta=e.target;ta.style.height='auto';ta.style.height=Math.min(ta.scrollHeight,200)+'px';}

  // ── Sign out ───────────────────────────────────────────
  async function signOut(){
    await supabase?.auth.signOut();
    setUser(null); setConvs([]); setMessages([]); setActiveConvId(null);
  }

  // ── Derived ────────────────────────────────────────────
  const wsCounts={};
  conversations.forEach(c=>{wsCounts[c.workspace]=(wsCounts[c.workspace]||0)+1;});
  const allWs=[{id:'all',label:'All workspaces',color:'#888780'},...workspaces];
  const filtered=conversations
    .filter(c=>activeWs==='all'||c.workspace===activeWs)
    .filter(c=>!search||c.title?.toLowerCase().includes(search.toLowerCase())||c.author_name?.toLowerCase().includes(search.toLowerCase()));
  const activeConv=conversations.find(c=>c.id===activeConvId);
  const activeConvWs=workspaces.find(w=>w.id===activeConv?.workspace)||{label:'Unknown',color:'#888'};
  const activeWsData=allWs.find(w=>w.id===activeWs)||allWs[0];
  const errorCode=router.query.error;

  // ── Render guards ──────────────────────────────────────
  if(authLoading) return (
    <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)'}}>
      <p style={{color:'var(--text-2)',fontSize:14}}>Loading…</p>
    </div>
  );

  if(!user) return (
    <>
      <Head><title>Sign in — Team Claude</title></Head>
      <AuthScreen errorCode={errorCode}/>
    </>
  );

  // ── Main layout ────────────────────────────────────────
  return (
    <>
      <Head>
        <title>{activeConv?`${activeConv.title} — Team Claude`:`Team Claude — ${TEAM_NAME}`}</title>
      </Head>

      {sidebarOpen&&<div onClick={()=>setSidebarOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:40}}/>}

      {/* ── SIDEBAR ────────────────────────────────────── */}
      <aside className={`sidebar ${sidebarOpen?'open':''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">C</div>
            <span className="sidebar-logo-text">Team Claude</span>
            <span className="sidebar-logo-team">{TEAM_NAME}</span>
          </div>
          <button className="new-chat-btn" onClick={()=>activeWs!=='all'?createConversation(activeWs):setShowPicker(true)}>
            <span style={{fontSize:18,lineHeight:1,marginTop:-1}}>+</span> New chat
          </button>
        </div>

        {/* Workspace nav */}
        <div className="ws-nav">
          <div className="ws-section-label" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span>Workspaces</span>
            <button onClick={()=>setWsModal('new')} title="Add workspace" style={{fontSize:16,lineHeight:1,color:'var(--text-3)',padding:'0 2px',cursor:'pointer',borderRadius:4}}>+</button>
          </div>
          {allWs.map(ws=>(
            <div key={ws.id} style={{display:'flex',alignItems:'center',gap:0}}>
              <button className={`ws-item ${activeWs===ws.id?'active':''}`} style={{flex:1}} onClick={()=>{setActiveWs(ws.id);setActiveConvId(null);setMessages([]);}}>
                <span className="ws-dot" style={{background:ws.color}}/>
                <span style={{flex:1}}>{ws.label}</span>
                {ws.id!=='all'&&wsCounts[ws.id]>0&&<span className="ws-count">{wsCounts[ws.id]}</span>}
              </button>
              {ws.id!=='all'&&<button onClick={()=>setWsModal(ws)} title="Edit" style={{padding:'4px 5px',borderRadius:4,color:'var(--text-3)',fontSize:11,cursor:'pointer',flexShrink:0,opacity:0.5}}>✎</button>}
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="conv-search">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search conversations…"/>
          </div>
        </div>

        {/* Conversation list */}
        <div className="conv-list">
          {loading&&<div className="no-convs">Loading…</div>}
          {!loading&&filtered.length===0&&<div className="no-convs">{search?'No results':'No conversations yet.'}</div>}
          {filtered.map(conv=>{
            const cws=workspaces.find(w=>w.id===conv.workspace)||{color:'#888'};
            const modelInfo=MODELS.find(m=>m.id===conv.model_used);
            return (
              <button key={conv.id} className={`conv-item ${activeConvId===conv.id?'active':''}`} onClick={()=>openConversation(conv.id)}>
                <div className="conv-item-meta">
                  {activeWs==='all'&&<span className="conv-ws-dot" style={{background:cws.color}}/>}
                  <div className="conv-avatar" style={{background:conv.author_color}}>{inits(conv.author_name)}</div>
                  <span className="conv-author">{conv.author_name}</span>
                  {conv.is_private&&<span title="Private" style={{fontSize:9,color:'var(--text-3)'}}>🔒</span>}
                  {modelInfo&&<span style={{width:6,height:6,borderRadius:'50%',background:modelInfo.color,display:'inline-block',flexShrink:0,marginLeft:'auto'}} title={modelInfo.name}/>}
                  <span className="conv-time">{ago(conv.updated_at)}</span>
                </div>
                <div className="conv-title">{conv.title}</div>
                {conv.preview&&<div className="conv-preview">{conv.preview}</div>}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="sidebar-footer" style={{flexDirection:'column',gap:6,alignItems:'stretch'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            {user.user_metadata?.avatar_url
              ? <img src={user.user_metadata.avatar_url} width={28} height={28} style={{borderRadius:'50%',flexShrink:0}} alt=""/>
              : <div className="user-avatar" style={{background:'var(--accent)'}}>{inits(user.user_metadata?.full_name||user.email)}</div>
            }
            <div style={{flex:1,minWidth:0}}>
              <div className="user-name" style={{fontSize:12,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.user_metadata?.full_name||user.email}</div>
              <div style={{fontSize:10,color:'var(--text-3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.email}</div>
            </div>
            <button onClick={signOut} title="Sign out" style={{fontSize:11,color:'var(--text-3)',cursor:'pointer',borderRadius:4,padding:'3px 6px',flexShrink:0}}>Sign out</button>
          </div>
          <div className="sync-status" style={{fontSize:10,color:'var(--text-3)'}}>{isConfigured?'● live sync':'○ offline'}</div>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────── */}
      <main className="main">
        {!activeConvId ? (
          <>
            <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:8}}>
              <button className="mobile-menu-btn" onClick={()=>setSidebarOpen(true)}>☰</button>
              <span style={{fontSize:14,color:'var(--text-2)'}}>Team Claude</span>
            </div>
            <div className="empty-state">
              <div className="empty-icon">C</div>
              <h2 className="empty-title">{activeWs==='all'?`${TEAM_NAME} workspace`:activeWsData.label}</h2>
              <p className="empty-sub">
                {filtered.length>0
                  ?`${filtered.length} conversation${filtered.length!==1?'s':''}. Select one or start a new chat.`
                  :'No conversations yet. Start the first one.'}
              </p>
              <button className="empty-cta" onClick={()=>activeWs!=='all'?createConversation(activeWs):setShowPicker(true)}>
                + New {activeWs!=='all'?activeWsData.label.split(' ')[0]+' ':''}chat
              </button>
              {conversations.length>0&&(
                <div className="team-pills">
                  {[...new Set(conversations.map(c=>c.author_name))].slice(0,8).map(name=>{
                    const col=conversations.find(c=>c.author_name===name)?.author_color||'#D97757';
                    return(
                      <span key={name} className="team-pill">
                        <span style={{width:18,height:18,borderRadius:'50%',background:col,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:600,color:'white'}}>{inits(name)}</span>
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
            {/* Chat header */}
            <div className="chat-header">
              <button className="mobile-menu-btn" onClick={()=>setSidebarOpen(true)}>☰</button>
              <div className="chat-header-ws-badge">
                <span style={{width:8,height:8,borderRadius:'50%',background:activeConvWs.color,display:'inline-block'}}/>
                {activeConvWs.label}
              </div>
              <h1 className="chat-header-title">{activeConv?.title||'Chat'}</h1>
              <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
                <div style={{width:20,height:20,borderRadius:'50%',background:activeConv?.author_color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:600,color:'white'}}>{inits(activeConv?.author_name||'')}</div>
                <span style={{fontSize:11,color:'var(--text-3)'}}>{activeConv?.author_name}</span>
                {activeConv?.author_name!==(user.user_metadata?.full_name||user.email)&&<span className="continuing-badge">continuing</span>}

                {/* Private toggle — only owner can change */}
                {activeConv?.owner_id===user?.id&&(
                  <button
                    onClick={togglePrivate}
                    title={activeConv?.is_private?'Make public to team':'Make private (only you)'}
                    style={{padding:'3px 7px',borderRadius:6,border:'1px solid var(--border-2)',background:activeConv?.is_private?'var(--accent-light)':'none',color:activeConv?.is_private?'var(--accent-text)':'var(--text-3)',fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',gap:3}}
                  >
                    {activeConv?.is_private?'🔒 Private':'👁 Public'}
                  </button>
                )}
                {activeConv?.is_private&&activeConv?.owner_id!==user?.id&&(
                  <span style={{fontSize:10,color:'var(--text-3)'}}>🔒</span>
                )}
              </div>
              <button className="chat-close-btn" onClick={()=>{setActiveConvId(null);setMessages([]);}}>✕</button>
            </div>

            {/* Messages */}
            <div className="messages-area">
              <div className="messages-inner">
                {messages.length===0&&!streaming&&(
                  <div style={{textAlign:'center',color:'var(--text-3)',fontSize:14,padding:'48px 0'}}>Send a message to start</div>
                )}
                {messages.map((msg,i)=>(
                  <Message key={msg.id} msg={msg} user={user} isStreaming={streaming&&i===messages.length-1&&msg.role==='assistant'}/>
                ))}
                <div ref={bottomRef}/>
              </div>
            </div>

            {error&&<div className="error-bar"><strong>Error:</strong> {error}</div>}

            {/* Input */}
            <div className="input-area">
              <div className="input-inner">
                {/* Model picker row */}
                <div style={{display:'flex',alignItems:'center',marginBottom:6}}>
                  <ModelPicker
                    value={currentModel}
                    onChange={changeModel}
                    isLocked={isModelLocked}
                    onToggleLock={toggleModelLock}
                    disabled={streaming}
                  />
                  {isModelLocked&&(
                    <span style={{marginLeft:6,fontSize:10,color:'var(--accent)',fontWeight:500}}>Model locked</span>
                  )}
                </div>

                <div className="input-box">
                  <textarea
                    ref={inputRef}
                    className="input-textarea"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${currentModel.name} in ${activeConvWs.label}…`}
                    rows={1}
                    disabled={streaming}
                  />
                  <button className="send-btn" onClick={sendMessage} disabled={streaming||!input.trim()} aria-label="Send">
                    {streaming?<div className="spinner"/>:'↑'}
                  </button>
                </div>
                <div className="input-hint">
                  Enter to send · Shift+Enter for new line ·{' '}
                  <span style={{color:activeConvWs.color}}>{activeConvWs.label}</span>
                  {' '}· {activeConv?.is_private?'🔒 private':'visible to all team members'}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {showPicker&&<WsPicker workspaces={workspaces} onPick={createConversation} onClose={()=>setShowPicker(false)}/>}
      {wsModal&&<WorkspaceModal existing={wsModal==='new'?null:wsModal} onSave={handleWsSave} onClose={()=>setWsModal(null)}/>}
    </>
  );
}

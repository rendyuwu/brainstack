
const { useState, useEffect, useRef } = React;

/* ── Icons ─────────────────────────────────────────────── */
const ICONS = {
  search: `M11 11l3.5 3.5M7.5 13a5.5 5.5 0 100-11 5.5 5.5 0 000 11z`,
  home: `M3 9.5L8 4l5 5.5V15H10v-4H6v4H3V9.5z`,
  book: `M4 3h10a1 1 0 011 1v11a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1zm3 0v13M4 7h3M4 10h3`,
  file: `M4 2h7l4 4v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1zm7 0v4h4`,
  bolt: `M13 2L4 10h6l-3 8 9-10H10l3-8z`,
  settings: `M10.325 3.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z`,
  chat: `M8 12H5a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v5a2 2 0 01-2 2h-3l-4 4v-4z`,
  chevronRight: `M8 4l4 4-4 4`,
  chevronDown: `M4 8l4 4 4-4`,
  chevronLeft: `M12 4l-4 4 4 4`,
  close: `M5 5l6 6M11 5l-6 6`,
  copy: `M8 4H5a1 1 0 00-1 1v10a1 1 0 001 1h6a1 1 0 001-1v-2M9 4h5a1 1 0 011 1v7a1 1 0 01-1 1H9a1 1 0 01-1-1V5a1 1 0 011-1z`,
  check: `M4 8l3 3 5-5`,
  sun: `M12 3v1M12 20v1M4.22 4.22l.7.7M18.36 18.36l.7.7M3 12h1M20 12h1M4.22 19.78l.7-.7M18.36 5.64l.7-.7M12 7a5 5 0 100 10A5 5 0 0012 7z`,
  moon: `M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z`,
  plus: `M12 4v16M4 12h16`,
  send: `M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z`,
  link: `M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71`,
  list: `M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01`,
  hash: `M4 9h16M4 15h16M10 3l-2 18M16 3l-2 18`,
  alertCircle: `M12 8v4M12 16h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z`,
  info: `M12 16v-4M12 8h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z`,
  externalLink: `M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3`,
  collapse: `M4 4h5M4 4v5M20 4h-5M20 4v5M4 20h5M4 20v-5M20 20h-5M20 20v-5`,
  menu: `M4 6h16M4 12h16M4 18h16`,
  tag: `M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01`,
  layers: `M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5`,
  terminal: `M4 17l6-6-6-6M12 19h8`,
  cpu: `M9 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2h-2M9 3a1 1 0 000 2h6a1 1 0 000-2M9 3V1M15 3V1M9 12h6M9 16h4`,
  globe: `M12 2a10 10 0 100 20A10 10 0 0012 2zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z`,
  zap: `M13 2L3 14h9l-1 8 10-12h-9l1-8z`,
  sparkles: `M5 3v4M3 5h4M6.5 17.5l-2 2M7.5 16.5l-2-2M19 3v4M17 5h4M17.5 17.5l2 2M16.5 16.5l2-2M12 6l1.5 3H17l-2.5 2 1 3.5L12 13l-3.5 1.5L9.5 11 7 9h3.5L12 6z`,
  arrowRight: `M5 12h14M12 5l7 7-7 7`,
  upload: `M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12`,
  image: `M21 19H3a2 2 0 01-2-2V7a2 2 0 012-2h3l2-2h8l2 2h3a2 2 0 012 2v10a2 2 0 01-2 2zM12 17a5 5 0 100-10 5 5 0 000 10z`,
  wand: `M15 4l5 5-11 11H4v-5L15 4zM13 6l5 5`,
  refresh: `M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15`,
  play: `M5 3l14 9-14 9V3z`,
};

const Icon = ({ name, size = 16, className = '', style = {} }) => {
  const d = ICONS[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      className={className} style={style}>
      {d.split('M').filter(Boolean).map((seg, i) => (
        <path key={i} d={'M' + seg} />
      ))}
    </svg>
  );
};

/* ── Tag / Chip ─────────────────────────────────────────── */
const Tag = ({ label, color, onClick, small }) => {
  const colors = {
    docker: { bg: 'var(--tag-docker-bg)', text: 'var(--tag-docker-text)' },
    linux: { bg: 'var(--tag-linux-bg)', text: 'var(--tag-linux-text)' },
    git: { bg: 'var(--tag-git-bg)', text: 'var(--tag-git-text)' },
    k8s: { bg: 'var(--tag-k8s-bg)', text: 'var(--tag-k8s-text)' },
    nginx: { bg: 'var(--tag-nginx-bg)', text: 'var(--tag-nginx-text)' },
    postgres: { bg: 'var(--tag-postgres-bg)', text: 'var(--tag-postgres-text)' },
    ai: { bg: 'var(--teal-bg)', text: 'var(--teal)' },
    default: { bg: 'var(--bg-3)', text: 'var(--tx-2)' },
  };
  const c = colors[color] || colors.default;
  return (
    <span onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center',
        padding: small ? '2px 7px' : '3px 9px',
        fontSize: small ? '11px' : '12px',
        fontFamily: 'var(--font-mono)',
        fontWeight: 500,
        borderRadius: '4px',
        background: c.bg,
        color: c.text,
        cursor: onClick ? 'pointer' : 'default',
        letterSpacing: '0.02em',
        userSelect: 'none',
        transition: 'opacity .15s',
      }}
    >{label}</span>
  );
};

/* ── CodeBlock ──────────────────────────────────────────── */
const CodeBlock = ({ code, lang = 'bash', title, collapsed: initCollapsed = false }) => {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(initCollapsed);

  const highlight = (src) => {
    // Minimal syntax highlighter
    return src
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/(#[^\n]*)/g, '<span class="syn-comment">$1</span>')
      .replace(/\b(docker|kubectl|nginx|git|sudo|apt|yum|systemctl|curl|wget|echo|export|cd|ls|mkdir|rm|cp|mv|cat|grep|awk|sed|ps|top|kill|ssh|scp|tar|chmod|chown)\b/g, '<span class="syn-keyword">$1</span>')
      .replace(/(["'`])([^"'`]*)\1/g, '<span class="syn-string">$1$2$1</span>')
      .replace(/\b(\d+(\.\d+)*)\b/g, '<span class="syn-number">$1</span>')
      .replace(/(\$\w+|--[\w-]+|-[\w])/g, '<span class="syn-flag">$1</span>')
      .replace(/\b(FROM|RUN|CMD|EXPOSE|ENV|ADD|COPY|ENTRYPOINT|VOLUME|WORKDIR|ARG|LABEL|USER|ONBUILD)\b/g, '<span class="syn-type">$1</span>');
  };

  const copy = () => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      background: 'var(--bg-0)', border: '1px solid var(--bd-default)',
      borderRadius: '8px', overflow: 'hidden', margin: '20px 0', fontSize: '13.5px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 14px', borderBottom: '1px solid var(--bd-subtle)',
        background: 'var(--bg-1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="terminal" size={13} style={{ color: 'var(--tx-3)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--tx-2)' }}>
            {title || lang}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setCollapsed(c => !c)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--tx-3)', padding: '2px 6px', borderRadius: 4,
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
          }}>
            <Icon name="collapse" size={12} />
          </button>
          <button onClick={copy} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: copied ? 'var(--green)' : 'var(--tx-3)',
            padding: '2px 6px', borderRadius: 4,
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
            transition: 'color .2s',
          }}>
            <Icon name={copied ? 'check' : 'copy'} size={12} />
            <span style={{ fontFamily: 'var(--font-mono)' }}>{copied ? 'copied' : 'copy'}</span>
          </button>
        </div>
      </div>
      {!collapsed && (
        <pre style={{
          margin: 0, padding: '16px 18px', overflowX: 'auto',
          fontFamily: 'var(--font-mono)', lineHeight: 1.65, color: 'var(--tx-1)',
          fontSize: '13px',
        }}>
          <code dangerouslySetInnerHTML={{ __html: highlight(code) }} />
        </pre>
      )}
      {collapsed && (
        <div onClick={() => setCollapsed(false)} style={{
          padding: '8px 18px', color: 'var(--tx-3)', fontSize: 12,
          fontFamily: 'var(--font-mono)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Icon name="chevronRight" size={12} /> {code.split('\n').length} lines hidden — click to expand
        </div>
      )}
    </div>
  );
};

/* ── Callout ────────────────────────────────────────────── */
const Callout = ({ type = 'info', title, children }) => {
  const types = {
    info:    { icon: 'info',        color: 'var(--blue)',   bg: 'rgba(88,166,255,.07)', bd: 'rgba(88,166,255,.2)' },
    warning: { icon: 'alertCircle', color: 'var(--amber)',  bg: 'var(--amber-bg)',      bd: 'var(--amber-bd)' },
    tip:     { icon: 'zap',         color: 'var(--green)',  bg: 'rgba(63,185,80,.07)',  bd: 'rgba(63,185,80,.2)' },
    danger:  { icon: 'alertCircle', color: 'var(--red)',    bg: 'rgba(248,81,73,.07)',  bd: 'rgba(248,81,73,.2)' },
  };
  const t = types[type] || types.info;
  return (
    <div style={{
      background: t.bg, border: `1px solid ${t.bd}`,
      borderRadius: 8, padding: '14px 16px', margin: '20px 0',
      display: 'flex', gap: 12,
    }}>
      <Icon name={t.icon} size={16} style={{ color: t.color, flexShrink: 0, marginTop: 2 }} />
      <div>
        {title && <div style={{ fontWeight: 600, fontSize: 14, color: t.color, marginBottom: 4 }}>{title}</div>}
        <div style={{ fontSize: 14, color: 'var(--tx-2)', lineHeight: 1.6 }}>{children}</div>
      </div>
    </div>
  );
};

/* ── Citation Pill ──────────────────────────────────────── */
const CitationPill = ({ num, label, onClick }) => (
  <span onClick={onClick} title={label} style={{
    display: 'inline-flex', alignItems: 'center', gap: 3,
    padding: '1px 6px', borderRadius: 4,
    background: 'var(--teal-bg)', border: '1px solid var(--teal-bd)',
    color: 'var(--teal)', fontSize: 11, fontFamily: 'var(--font-mono)',
    cursor: 'pointer', userSelect: 'none',
    transition: 'background .15s',
    verticalAlign: 'middle', marginLeft: 2,
  }}>
    [{num}]
  </span>
);

/* ── Breadcrumb ─────────────────────────────────────────── */
const Breadcrumb = ({ items }) => (
  <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--tx-3)' }}>
    {items.map((item, i) => (
      <React.Fragment key={i}>
        {i > 0 && <Icon name="chevronRight" size={12} style={{ opacity: .4 }} />}
        {item.onClick
          ? <span onClick={item.onClick} style={{ color: 'var(--tx-2)', cursor: 'pointer', ':hover': { color: 'var(--amber)' } }}>{item.label}</span>
          : <span style={{ color: i === items.length - 1 ? 'var(--tx-2)' : 'var(--tx-3)' }}>{item.label}</span>
        }
      </React.Fragment>
    ))}
  </nav>
);

/* ── TopNav ─────────────────────────────────────────────── */
const TopNav = ({ screen, setScreen, theme, setTheme, onSearch, onNewPost, sidebarOpen, setSidebarOpen }) => {
  return (
    <header style={{
      height: 52, display: 'flex', alignItems: 'center',
      padding: '0 20px', gap: 12,
      background: 'var(--bg-1)', borderBottom: '1px solid var(--bd-default)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      {/* Mobile menu */}
      <button onClick={() => setSidebarOpen(o => !o)} style={{
        display: 'none', background: 'none', border: 'none',
        cursor: 'pointer', color: 'var(--tx-2)', padding: 4,
        className: 'mobile-menu-btn',
      }} className="mobile-only">
        <Icon name="menu" size={18} />
      </button>

      {/* Logo */}
      <div onClick={() => setScreen('home')} style={{
        display: 'flex', alignItems: 'center', gap: 8,
        cursor: 'pointer', flexShrink: 0, userSelect: 'none',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="layers" size={15} style={{ color: '#000' }} />
        </div>
        <span style={{ fontWeight: 600, fontSize: 16, letterSpacing: '-.02em', color: 'var(--tx-1)' }}>
          Brain<span style={{ color: 'var(--amber)' }}>Stack</span>
        </span>
      </div>

      {/* Search bar */}
      <div onClick={onSearch} style={{
        flex: 1, maxWidth: 440, margin: '0 8px',
        background: 'var(--bg-0)', border: '1px solid var(--bd-default)',
        borderRadius: 7, padding: '0 12px', height: 34,
        display: 'flex', alignItems: 'center', gap: 8,
        cursor: 'pointer', color: 'var(--tx-3)', fontSize: 13.5,
        transition: 'border-color .15s',
      }}>
        <Icon name="search" size={14} />
        <span style={{ flex: 1 }}>Search docs, tutorials, cheatsheets…</span>
        <kbd style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, padding: '2px 6px',
          background: 'var(--bg-2)', border: '1px solid var(--bd-default)',
          borderRadius: 4, color: 'var(--tx-3)',
        }}>⌘K</kbd>
      </div>

      <div style={{ flex: 1 }} />

      {/* Nav links */}
      {['home','article','cheatsheet','ai-chat'].map(s => {
        const labels = { home: 'Discover', article: 'Article', cheatsheet: 'Cheatsheet', 'ai-chat': 'Ask AI' };
        const iconNames = { home: 'home', article: 'book', cheatsheet: 'list', 'ai-chat': 'sparkles' };        return (
          <button key={s} onClick={() => setScreen(s)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: screen === s ? 'var(--amber)' : 'var(--tx-2)',
            fontSize: 13.5, padding: '4px 8px', borderRadius: 5,
            display: 'flex', alignItems: 'center', gap: 5,
            fontWeight: screen === s ? 500 : 400,
            background: screen === s ? 'var(--amber-bg)' : 'none',
            transition: 'all .15s',
          }} className="nav-link-desktop">
            <Icon name={iconNames[s]} size={14} />
            <span className="nav-label">{labels[s]}</span>
          </button>
        );
      })}

      <div style={{ width: 1, height: 20, background: 'var(--bd-default)' }} />

      {/* Theme toggle */}
      <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--tx-2)', padding: 6, borderRadius: 6,
        display: 'flex', alignItems: 'center',
        transition: 'color .15s',
      }}>
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
      </button>

      {/* Settings */}
      <button onClick={() => setScreen('settings')} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: screen === 'settings' ? 'var(--amber)' : 'var(--tx-2)',
        padding: 6, borderRadius: 6, display: 'flex', alignItems: 'center',
      }}>
        <Icon name="settings" size={16} />
      </button>

      {/* New Post */}
      <button onClick={() => { onNewPost(); setScreen('editor'); }} style={{
        background: 'var(--amber)', border: 'none', cursor: 'pointer',
        color: '#000', padding: '6px 12px', borderRadius: 6,
        fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5,
        transition: 'opacity .15s', flexShrink: 0,
      }}>
        <Icon name="plus" size={13} style={{ color: '#000' }} />
        <span className="nav-label">New Post</span>
      </button>
    </header>
  );
};

/* ── Sidebar ────────────────────────────────────────────── */
const TOPICS = [
  { id: 'docker', label: 'Docker', icon: 'layers', color: 'docker', count: 24,
    children: ['Networking Deep Dive', 'Volumes & Bind Mounts', 'Multi-stage Builds', 'Docker Compose Patterns', 'Security Hardening'] },
  { id: 'linux', label: 'Linux', icon: 'terminal', color: 'linux', count: 31,
    children: ['Systemd Services', 'Bash Scripting', 'File Permissions', 'Network Tools', 'Package Management'] },
  { id: 'git', label: 'Git', icon: 'file', color: 'git', count: 18,
    children: ['Branching Strategies', 'Rebase vs Merge', 'Git Hooks', 'Monorepo Workflows'] },
  { id: 'k8s', label: 'Kubernetes', icon: 'cpu', color: 'k8s', count: 27,
    children: ['Pod Scheduling', 'Ingress Controllers', 'Helm Charts', 'RBAC Patterns', 'Operators'] },
  { id: 'nginx', label: 'Nginx', icon: 'globe', color: 'nginx', count: 12,
    children: ['Reverse Proxy Setup', 'SSL/TLS Config', 'Load Balancing', 'Rate Limiting'] },
  { id: 'postgres', label: 'PostgreSQL', icon: 'book', color: 'postgres', count: 16,
    children: ['Query Optimization', 'Indexing Strategies', 'Replication', 'JSON Queries'] },
];

const Sidebar = ({ screen, setScreen, open, setOpen, onToggle }) => {
  const [expanded, setExpanded] = useState({ docker: true });

  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div onClick={() => setOpen(false)} style={{
          display: 'none', position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,.5)', zIndex: 89,
        }} className="mobile-overlay" />
      )}
      <aside style={{
        width: 220, flexShrink: 0,
        borderRight: '1px solid var(--bd-default)',
        background: 'var(--bg-1)',
        overflowY: 'auto', padding: '16px 0',
        height: '100%', position: 'relative',
      }}>
        {/* Collapse button */}
        <div style={{ padding: '0 12px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 11, color: 'var(--tx-3)', fontFamily: 'var(--font-mono)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
            Topic Stacks
          </div>
          {onToggle && (
            <button onClick={onToggle} title="Hide sidebar" style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--tx-3)', padding: '2px 4px', borderRadius: 4,
              display: 'flex', alignItems: 'center',
              transition: 'color .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--tx-1)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--tx-3)'}
            >
              <Icon name="chevronLeft" size={14} />
            </button>
          )}
        </div>
        {TOPICS.map(topic => (
          <div key={topic.id}>
            <div onClick={() => toggle(topic.id)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 14px', cursor: 'pointer',
              color: expanded[topic.id] ? 'var(--tx-1)' : 'var(--tx-2)',
              borderRadius: 0,
              transition: 'background .1s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Icon name={expanded[topic.id] ? 'chevronDown' : 'chevronRight'} size={12} style={{ color: 'var(--tx-3)', flexShrink: 0 }} />
              <Icon name={topic.icon} size={14} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13.5, fontWeight: 500, flex: 1 }}>{topic.label}</span>
              <span style={{ fontSize: 11, color: 'var(--tx-3)', fontFamily: 'var(--font-mono)' }}>{topic.count}</span>
            </div>
            {expanded[topic.id] && (
              <div>
                {topic.children.map(child => (
                  <div key={child}
                    onClick={() => { setScreen('article'); setOpen(false); }}
                    style={{
                      padding: '6px 14px 6px 38px',
                      fontSize: 13, color: 'var(--tx-2)', cursor: 'pointer',
                      transition: 'all .1s',
                      borderLeft: child === 'Networking Deep Dive' ? '2px solid var(--amber)' : '2px solid transparent',
                      color: child === 'Networking Deep Dive' ? 'var(--tx-1)' : 'var(--tx-2)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {child}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <div style={{ margin: '16px 12px', height: 1, background: 'var(--bd-subtle)' }} />

        <div style={{ padding: '0 12px 12px', fontSize: 11, color: 'var(--tx-3)', fontFamily: 'var(--font-mono)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
          Quick Access
        </div>
        {[
          { label: 'All Cheatsheets', icon: 'list', s: 'cheatsheet' },
          { label: 'Ask the KB', icon: 'sparkles', s: 'ai-chat' },
        ].map(({ label, icon, s }) => (
          <div key={s} onClick={() => { setScreen(s); setOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 14px', cursor: 'pointer',
              color: screen === s ? 'var(--amber)' : 'var(--tx-2)',
              background: screen === s ? 'var(--amber-bg)' : 'transparent',
              transition: 'all .1s', fontSize: 13.5,
            }}
            onMouseEnter={e => e.currentTarget.style.background = screen === s ? 'var(--amber-bg)' : 'var(--bg-2)'}
            onMouseLeave={e => e.currentTarget.style.background = screen === s ? 'var(--amber-bg)' : 'transparent'}
          >
            <Icon name={icon} size={14} />
            <span>{label}</span>
          </div>
        ))}
      </aside>
    </>
  );
};

/* ── Command Palette ────────────────────────────────────── */
const CommandPalette = ({ open, onClose, setScreen }) => {
  const [q, setQ] = useState('');
  const inputRef = useRef();

  useEffect(() => {
    if (open) { setQ(''); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const results = [
    { type: 'article', label: 'Docker Networking Deep Dive', meta: 'Docker · 12 min', screen: 'article' },
    { type: 'cheatsheet', label: 'Git Command Reference', meta: 'Git · cheatsheet', screen: 'cheatsheet' },
    { type: 'article', label: 'Kubernetes Pod Scheduling', meta: 'Kubernetes · 8 min', screen: 'article' },
    { type: 'article', label: 'Nginx Rate Limiting', meta: 'Nginx · 6 min', screen: 'article' },
    { type: 'cheatsheet', label: 'Docker CLI Quick Ref', meta: 'Docker · cheatsheet', screen: 'cheatsheet' },
    { type: 'article', label: 'PostgreSQL Query Optimization', meta: 'PostgreSQL · 15 min', screen: 'article' },
  ].filter(r => !q || r.label.toLowerCase().includes(q.toLowerCase()));

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)',
      zIndex: 1000, display: 'flex', alignItems: 'flex-start',
      justifyContent: 'center', paddingTop: 80,
      backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 560,
        background: 'var(--bg-2)', border: '1px solid var(--bd-strong)',
        borderRadius: 12, overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(0,0,0,.5)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', borderBottom: '1px solid var(--bd-default)',
        }}>
          <Icon name="search" size={16} style={{ color: 'var(--tx-3)' }} />
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search docs, tutorials, cheatsheets…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--tx-1)', fontSize: 15, fontFamily: 'var(--font-sans)',
            }}
          />
          <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '2px 6px', background: 'var(--bg-3)', border: '1px solid var(--bd-default)', borderRadius: 4, color: 'var(--tx-3)' }}>esc</kbd>
        </div>
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {results.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--tx-3)', fontSize: 14 }}>
              No results for "{q}"
            </div>
          ) : results.map((r, i) => (
            <div key={i} onClick={() => { setScreen(r.screen); onClose(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 16px', cursor: 'pointer',
                borderBottom: '1px solid var(--bd-subtle)',
                transition: 'background .1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Icon name={r.type === 'cheatsheet' ? 'list' : 'book'} size={15} style={{ color: 'var(--tx-3)', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 14, color: 'var(--tx-1)' }}>{r.label}</span>
              <span style={{ fontSize: 12, color: 'var(--tx-3)', fontFamily: 'var(--font-mono)' }}>{r.meta}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '8px 16px', display: 'flex', gap: 16, fontSize: 11, color: 'var(--tx-3)', fontFamily: 'var(--font-mono)' }}>
          <span>↑↓ navigate</span><span>↵ open</span><span>esc close</span>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Icon, Tag, CodeBlock, Callout, CitationPill, Breadcrumb, TopNav, Sidebar, CommandPalette, TOPICS });

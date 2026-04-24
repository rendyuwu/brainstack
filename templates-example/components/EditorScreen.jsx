
const { useState, useRef, useEffect } = React;

/* ── StackPicker ────────────────────────────────────────── */
const BASE_STACKS = [
  { id: 'docker',   label: 'Docker',     icon: 'layers',   color: 'docker'   },
  { id: 'linux',    label: 'Linux',      icon: 'terminal', color: 'linux'    },
  { id: 'git',      label: 'Git',        icon: 'file',     color: 'git'      },
  { id: 'k8s',      label: 'Kubernetes', icon: 'cpu',      color: 'k8s'      },
  { id: 'nginx',    label: 'Nginx',      icon: 'globe',    color: 'nginx'    },
  { id: 'postgres', label: 'PostgreSQL', icon: 'book',     color: 'postgres' },
];

const StackPicker = ({ value, onChange }) => {
  const [open, setOpen]       = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [custom, setCustom]   = useState([]);
  const ref = useRef();

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setCreating(false); } };
    if (open) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const allStacks = [...BASE_STACKS, ...custom];
  const selected  = allStacks.find(s => s.id === value);

  const create = () => {
    if (!newName.trim()) return;
    const id = newName.trim().toLowerCase().replace(/\s+/g, '-');
    const stack = { id, label: newName.trim(), icon: 'layers', color: 'default' };
    setCustom(c => [...c, stack]);
    onChange(id);
    setNewName(''); setCreating(false); setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '5px 10px', borderRadius: 6,
        background: 'var(--bg-0)',
        border: `1px solid ${open ? 'var(--bd-strong)' : 'var(--bd-default)'}`,
        color: selected ? 'var(--tx-1)' : 'var(--tx-3)',
        fontSize: 13, cursor: 'pointer', transition: 'all .15s',
      }}>
        {selected
          ? <Tag label={selected.label} color={selected.color} small />
          : <><Icon name="layers" size={13} /><span>Select stack…</span></>}
        <Icon name="chevronDown" size={12} style={{ color: 'var(--tx-3)', marginLeft: 2 }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 300,
          background: 'var(--bg-2)', border: '1px solid var(--bd-strong)',
          borderRadius: 10, overflow: 'hidden', minWidth: 210,
          boxShadow: 'var(--shadow-md)',
        }}>
          <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--bd-subtle)', fontSize: 11, color: 'var(--tx-3)', fontFamily: 'var(--font-mono)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
            Topic Stack
          </div>
          {allStacks.map(s => (
            <div key={s.id} onClick={() => { onChange(s.id); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 12px', cursor: 'pointer',
                background: value === s.id ? 'var(--bg-3)' : 'transparent',
                transition: 'background .1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
              onMouseLeave={e => e.currentTarget.style.background = value === s.id ? 'var(--bg-3)' : 'transparent'}
            >
              <Icon name={s.icon} size={14} style={{ color: 'var(--tx-3)', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13.5, color: 'var(--tx-1)' }}>{s.label}</span>
              {s.id !== value && custom.find(c => c.id === s.id) && (
                <span style={{ fontSize: 10, color: 'var(--tx-3)', fontFamily: 'var(--font-mono)' }}>custom</span>
              )}
              {value === s.id && <Icon name="check" size={12} style={{ color: 'var(--amber)' }} />}
            </div>
          ))}
          <div style={{ padding: '8px', borderTop: '1px solid var(--bd-default)' }}>
            {creating ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') create(); if (e.key === 'Escape') setCreating(false); }}
                  placeholder="Stack name…"
                  style={{
                    flex: 1, background: 'var(--bg-0)', border: '1px solid var(--bd-default)',
                    borderRadius: 5, padding: '5px 8px', color: 'var(--tx-1)',
                    fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)',
                  }}
                />
                <button onClick={create} style={{
                  background: 'var(--amber)', border: 'none', borderRadius: 5,
                  padding: '5px 10px', color: '#000', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>Create</button>
                <button onClick={() => setCreating(false)} style={{
                  background: 'none', border: '1px solid var(--bd-default)', borderRadius: 5,
                  padding: '5px 8px', color: 'var(--tx-3)', fontSize: 12, cursor: 'pointer',
                }}>✕</button>
              </div>
            ) : (
              <button onClick={() => setCreating(true)} style={{
                width: '100%', padding: '6px 8px', borderRadius: 6,
                background: 'none', border: '1px dashed var(--bd-default)',
                color: 'var(--tx-2)', cursor: 'pointer', fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--amber)'; e.currentTarget.style.color = 'var(--amber)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bd-default)'; e.currentTarget.style.color = 'var(--tx-2)'; }}
              >
                <Icon name="plus" size={13} /> New stack…
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Simple markdown renderer ───────────────────────────── */
const renderMarkdown = (md) => {
  return md
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    // Code blocks
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre style="background:var(--bg-0);border:1px solid var(--bd-default);border-radius:8px;padding:14px 16px;overflow-x:auto;margin:16px 0;font-family:var(--font-mono);font-size:13px;line-height:1.65">$1</pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code style="font-family:var(--font-mono);font-size:.88em;background:var(--bg-2);padding:1px 5px;border-radius:3px;border:1px solid var(--bd-default)">$1</code>')
    // Headings
    .replace(/^## (.+)$/gm, '<h2 style="font-size:20px;font-weight:600;color:var(--tx-1);margin:32px 0 12px;padding-bottom:8px;border-bottom:1px solid var(--bd-subtle);letter-spacing:-.02em">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:17px;font-weight:600;color:var(--tx-1);margin:24px 0 8px;letter-spacing:-.01em">$1</h3>')
    // Bold / italic
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    // HR
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--bd-default);margin:24px 0">')
    // Lists
    .replace(/^- (.+)$/gm, '<li style="margin-bottom:4px">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, '<ul style="padding-left:20px;margin:12px 0;color:var(--tx-1)">$&</ul>')
    // Paragraphs
    .replace(/^(?!<[a-z]).+$/gm, '<p style="margin:0 0 14px;color:var(--tx-1)">$&</p>');
};

const DRAFT_SAMPLE = `## Introduction

Docker volumes are the preferred mechanism for persisting data generated by and used by containers. Unlike bind mounts, volumes are managed by Docker and are isolated from the core functionality of the host machine.

## Why Volumes?

When a container is removed, any data written to its writable layer is lost. Volumes solve this by storing data outside the container's lifecycle:

- **Decoupled from container lifecycle** — volumes persist after container removal
- **Easy to share** between multiple containers
- **Backed up and migrated** independently of containers
- **Managed by Docker** — no need to deal with raw filesystem paths

## Creating and Using Volumes

The simplest way to create a named volume:

\`\`\`bash
# Create a named volume
docker volume create pgdata

# Mount it when running a container
docker run -d \\
  --name postgres \\
  -v pgdata:/var/lib/postgresql/data \\
  -e POSTGRES_PASSWORD=secret \\
  postgres:16
\`\`\`

## Inspecting Volumes

\`\`\`bash
# List all volumes
docker volume ls

# Inspect a specific volume
docker volume inspect pgdata

# Find where it lives on the host
docker volume inspect pgdata --format '{{ .Mountpoint }}'
# /var/lib/docker/volumes/pgdata/_data
\`\`\`

## Cleanup

\`\`\`bash
# Remove a specific volume (only if no containers use it)
docker volume rm pgdata

# Remove all unused volumes
docker volume prune
\`\`\``;

const AI_SUGGESTIONS = [
  { label: 'Add a troubleshooting section', icon: 'zap' },
  { label: 'Add tmpfs mount comparison', icon: 'layers' },
  { label: 'Improve the introduction', icon: 'wand' },
  { label: 'Add Docker Compose example', icon: 'file' },
];

const EditorScreen = ({ setScreen }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [ideaInput, setIdeaInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const [activeTab, setActiveTab] = useState('draft'); // 'draft' | 'iterate'
  const [preview, setPreview] = useState(false);
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef();
  const chatEndRef = useRef();

  useEffect(() => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    setWordCount(words);
  }, [content]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ block: 'nearest' });
  }, [aiMessages, aiTyping]);

  const generateDraft = () => {
    if (!ideaInput.trim()) return;
    const idea = ideaInput.trim();
    setGenerating(true);
    setAiMessages([{ role: 'user', content: `Draft a tutorial: ${idea}` }]);

    // Phase 1: title appears fast
    setTimeout(() => {
      setTitle('Docker Volumes & Persistent Storage');
      setTopic('docker');
      setTags(['volumes', 'storage', 'containers']);
    }, 600);

    // Phase 2: content streams in
    setTimeout(() => {
      setContent(DRAFT_SAMPLE);
      setAiMessages(m => [...m, {
        role: 'assistant',
        content: `I've drafted a tutorial on Docker volumes. The structure covers the why, basic usage, inspection, and cleanup. A few things to note:`,
        bullets: [
          'Added named volume creation and a real Postgres example',
          'Included host-path inspection command — useful for debugging',
          'Left a spot for a Docker Compose section — want me to add that?',
        ],
      }]);
      setGenerating(false);
      setActiveTab('iterate');
    }, 2000);
  };

  const sendAiMessage = () => {
    if (!aiInput.trim()) return;
    const msg = aiInput.trim();
    setAiInput('');
    setAiMessages(m => [...m, { role: 'user', content: msg }]);
    setAiTyping(true);
    setTimeout(() => {
      if (msg.toLowerCase().includes('compose')) {
        setContent(c => c + `\n\n## Docker Compose Example\n\n\`\`\`yaml\nservices:\n  postgres:\n    image: postgres:16\n    volumes:\n      - pgdata:/var/lib/postgresql/data\n    environment:\n      POSTGRES_PASSWORD: secret\n\nvolumes:\n  pgdata:\n\`\`\``);
        setAiMessages(m => [...m, {
          role: 'assistant',
          content: "Added a Docker Compose example at the end. It uses a named top-level volume which is the idiomatic Compose pattern — avoids the awkward bind-mount path issues.",
        }]);
      } else {
        setAiMessages(m => [...m, {
          role: 'assistant',
          content: "Done — I've updated that section. Let me know if you'd like to adjust the tone, add more examples, or restructure.",
        }]);
      }
      setAiTyping(false);
    }, 1200);
  };

  const applySuggestion = (s) => {
    setAiInput(s.label);
  };

  const addTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) setTags(t => [...t, tagInput.trim()]);
      setTagInput('');
    }
  };

  const saveAsDraft = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const insertFormatting = (before, after = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = content.slice(start, end) || 'text';
    const newContent = content.slice(0, start) + before + sel + after + content.slice(end);
    setContent(newContent);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + sel.length);
    }, 0);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>

      {/* Editor top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 20px', borderBottom: '1px solid var(--bd-default)',
        background: 'var(--bg-1)', flexShrink: 0,
      }}>
        <button onClick={() => setScreen('home')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--tx-3)', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13,
        }}>
          <Icon name="chevronLeft" size={14} /> Discard
        </button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: 'var(--tx-3)', fontFamily: 'var(--font-mono)' }}>
          {wordCount > 0 ? `${wordCount} words` : 'New post'}
        </span>
        <button onClick={saveAsDraft} style={{
          padding: '6px 14px', borderRadius: 6,
          background: 'var(--bg-3)', border: '1px solid var(--bd-default)',
          color: saved ? 'var(--green)' : 'var(--tx-2)',
          cursor: 'pointer', fontSize: 13,
          display: 'flex', alignItems: 'center', gap: 5,
          transition: 'color .2s',
        }}>
          <Icon name={saved ? 'check' : 'file'} size={13} />
          {saved ? 'Saved' : 'Save draft'}
        </button>
        <button style={{
          padding: '6px 16px', borderRadius: 6,
          background: title && content ? 'var(--amber)' : 'var(--bg-3)',
          border: 'none', cursor: title && content ? 'pointer' : 'default',
          color: title && content ? '#000' : 'var(--tx-3)',
          fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 5,
          transition: 'all .15s',
        }}>
          Publish <Icon name="arrowRight" size={13} style={{ color: title && content ? '#000' : 'var(--tx-3)' }} />
        </button>
      </div>

      {/* Main split */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* ── Left: Editor ─────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Metadata bar */}
          <div style={{
            padding: '12px 32px', borderBottom: '1px solid var(--bd-subtle)',
            display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
            background: 'var(--bg-1)', flexWrap: 'wrap',
          }}>
              {/* Stack picker */}
              <StackPicker value={topic} onChange={setTopic} />

            {/* Tags */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, flexWrap: 'wrap' }}>
              {tags.map(tag => (
                <span key={tag} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '2px 8px', borderRadius: 4,
                  background: 'var(--bg-3)', border: '1px solid var(--bd-default)',
                  fontSize: 12, color: 'var(--tx-2)', fontFamily: 'var(--font-mono)',
                }}>
                  {tag}
                  <span onClick={() => setTags(t => t.filter(x => x !== tag))}
                    style={{ cursor: 'pointer', color: 'var(--tx-3)', lineHeight: 1 }}>×</span>
                </span>
              ))}
              <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag}
                placeholder="Add tag…"
                style={{
                  background: 'none', border: 'none', outline: 'none',
                  color: 'var(--tx-1)', fontSize: 13, fontFamily: 'var(--font-mono)',
                  width: 90, minWidth: 60,
                }}
              />
            </div>
          </div>

          {/* Formatting toolbar */}
          <div style={{
            padding: '6px 32px', borderBottom: '1px solid var(--bd-subtle)',
            display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0,
            background: 'var(--bg-1)',
          }}>
            {!preview && [
              { label: 'H2', action: () => insertFormatting('## ') },
              { label: 'H3', action: () => insertFormatting('### ') },
              { label: 'B',  action: () => insertFormatting('**', '**'), bold: true },
              { label: 'I',  action: () => insertFormatting('_', '_'), italic: true },
              { label: '`',  action: () => insertFormatting('`', '`'), mono: true },
              { label: '```', action: () => insertFormatting('\n```bash\n', '\n```\n'), mono: true },
              { label: '—',  action: () => insertFormatting('\n---\n') },
            ].map((btn, i) => (
              <button key={i} onClick={btn.action} style={{
                padding: '3px 8px', borderRadius: 4,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--tx-2)', fontSize: btn.mono ? 12 : 13,
                fontFamily: btn.mono ? 'var(--font-mono)' : 'var(--font-sans)',
                fontWeight: btn.bold ? 700 : btn.italic ? 400 : 500,
                fontStyle: btn.italic ? 'italic' : 'normal',
                transition: 'background .1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
              title={btn.label}>
                {btn.label}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <button onClick={() => setPreview(p => !p)} style={{
              padding: '4px 10px', borderRadius: 5,
              background: preview ? 'var(--bg-3)' : 'none',
              border: `1px solid ${preview ? 'var(--bd-strong)' : 'transparent'}`,
              color: preview ? 'var(--tx-1)' : 'var(--tx-3)',
              cursor: 'pointer', fontSize: 12.5,
              display: 'flex', alignItems: 'center', gap: 5,
              transition: 'all .15s',
            }}>
              <Icon name="play" size={11} /> {preview ? 'Edit' : 'Preview'}
            </button>
          </div>

          {/* Title + content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px 32px 80px' }}>
            <div style={{ maxWidth: 720, margin: '0 auto' }}>
              <textarea
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Post title…"
                rows={1}
                style={{
                  width: '100%', background: 'none', border: 'none', outline: 'none',
                  color: 'var(--tx-1)', fontSize: 28, fontWeight: 600,
                  fontFamily: 'var(--font-sans)', resize: 'none',
                  lineHeight: 1.25, letterSpacing: '-.03em', marginBottom: 8,
                  borderBottom: title ? 'none' : '1px dashed var(--bd-default)',
                  paddingBottom: 8,
                }}
                onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
              />

              {!content && !generating && (
                <div style={{
                  padding: '40px 0', textAlign: 'center',
                  color: 'var(--tx-3)', borderTop: '1px dashed var(--bd-subtle)',
                }}>
                  <Icon name="wand" size={28} style={{ display: 'block', margin: '0 auto 12px', opacity: .25 }} />
                  <p style={{ fontSize: 15, marginBottom: 6 }}>Start writing, or use the AI panel to draft from an idea.</p>
                  <p style={{ fontSize: 13 }}>Type <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '2px 5px', background: 'var(--bg-2)', border: '1px solid var(--bd-default)', borderRadius: 3 }}>/</kbd> for slash commands</p>
                </div>
              )}

              {generating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 0', color: 'var(--teal)' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)', animation: `pulse 1.2s ${i*0.2}s infinite` }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 13 }}>Drafting your post…</span>
                </div>
              )}

              {content && !preview && (
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  style={{
                    width: '100%', background: 'none', border: 'none', outline: 'none',
                    color: 'var(--tx-1)', fontSize: 15, lineHeight: 1.75,
                    fontFamily: 'var(--font-mono)', resize: 'none',
                    minHeight: 400,
                  }}
                  onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                />
              )}

              {content && preview && (
                <div style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--tx-1)' }}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── Right: AI Assist Panel ───────────────────────── */}
        <div style={{
          width: 340, flexShrink: 0,
          borderLeft: '1px solid var(--bd-default)',
          background: 'var(--bg-1)', display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>

          {/* Panel header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--bd-default)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 6,
                background: 'var(--teal-bg)', border: '1px solid var(--teal-bd)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="sparkles" size={13} style={{ color: 'var(--teal)' }} />
              </div>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--tx-1)' }}>AI Assist</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
                {['draft','iterate'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} style={{
                    padding: '3px 10px', borderRadius: 5, cursor: 'pointer',
                    background: activeTab === tab ? 'var(--bg-3)' : 'none',
                    border: `1px solid ${activeTab === tab ? 'var(--bd-strong)' : 'transparent'}`,
                    color: activeTab === tab ? 'var(--tx-1)' : 'var(--tx-3)',
                    fontSize: 12, fontWeight: activeTab === tab ? 500 : 400,
                  }}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Draft tab */}
          {activeTab === 'draft' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              <p style={{ fontSize: 13, color: 'var(--tx-2)', marginBottom: 14, lineHeight: 1.55 }}>
                Describe your post idea and AI will generate a full draft — title, structure, code examples, and all.
              </p>

              <div style={{ marginBottom: 12 }}>
                <textarea
                  value={ideaInput}
                  onChange={e => setIdeaInput(e.target.value)}
                  placeholder="e.g. Docker volumes and persistent storage — how to create, mount, and manage volumes including named volumes, bind mounts, and tmpfs"
                  rows={4}
                  style={{
                    width: '100%', background: 'var(--bg-0)',
                    border: '1px solid var(--bd-default)', borderRadius: 8,
                    padding: '10px 12px', color: 'var(--tx-1)', fontSize: 13.5,
                    fontFamily: 'var(--font-sans)', resize: 'vertical',
                    lineHeight: 1.55, outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Upload area */}
              <div onClick={() => setUploadOpen(o => !o)} style={{
                border: `1.5px dashed ${uploadOpen ? 'var(--teal-bd)' : 'var(--bd-default)'}`,
                background: uploadOpen ? 'var(--teal-bg)' : 'var(--bg-0)',
                borderRadius: 8, padding: '12px',
                textAlign: 'center', cursor: 'pointer',
                color: 'var(--tx-3)', fontSize: 13, marginBottom: 12,
                transition: 'all .15s',
              }}>
                <Icon name="image" size={16} style={{ display: 'block', margin: '0 auto 5px', opacity: .5 }} />
                <span>{uploadOpen ? 'Drop screenshot here' : 'Attach screenshot or diagram (optional)'}</span>
              </div>

              <button onClick={generateDraft} disabled={!ideaInput.trim() || generating} style={{
                width: '100%', padding: '9px', borderRadius: 7,
                background: ideaInput.trim() && !generating ? 'var(--teal)' : 'var(--bg-3)',
                border: 'none',
                color: ideaInput.trim() && !generating ? '#000' : 'var(--tx-3)',
                cursor: ideaInput.trim() && !generating ? 'pointer' : 'default',
                fontSize: 14, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all .15s',
              }}>
                {generating
                  ? <><Icon name="refresh" size={14} style={{ animation: 'spin 1s linear infinite' }} /> Drafting…</>
                  : <><Icon name="sparkles" size={14} style={{ color: ideaInput.trim() ? '#000' : 'var(--tx-3)' }} /> Generate draft</>
                }
              </button>

              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 11.5, color: 'var(--tx-3)', marginBottom: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  Or try a rewrite tool
                </div>
                {[
                  { label: 'Rewrite article → cheatsheet', icon: 'list' },
                  { label: 'Expand outline into full post', icon: 'book' },
                  { label: 'Simplify for beginners', icon: 'zap' },
                ].map((tool, i) => (
                  <button key={i} style={{
                    width: '100%', textAlign: 'left',
                    padding: '8px 10px', borderRadius: 6, marginBottom: 6,
                    background: 'var(--bg-2)', border: '1px solid var(--bd-default)',
                    color: 'var(--tx-2)', cursor: 'pointer', fontSize: 13,
                    display: 'flex', alignItems: 'center', gap: 8,
                    transition: 'all .15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--bd-strong)'; e.currentTarget.style.color = 'var(--tx-1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bd-default)'; e.currentTarget.style.color = 'var(--tx-2)'; }}
                  >
                    <Icon name={tool.icon} size={13} /> {tool.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Iterate tab */}
          {activeTab === 'iterate' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

              {/* Suggestions */}
              {content && (
                <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--bd-subtle)', flexShrink: 0 }}>
                  <div style={{ fontSize: 11.5, color: 'var(--tx-3)', marginBottom: 8, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Suggestions</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {AI_SUGGESTIONS.map((s, i) => (
                      <button key={i} onClick={() => applySuggestion(s)} style={{
                        padding: '4px 9px', borderRadius: 20,
                        background: 'var(--bg-2)', border: '1px solid var(--bd-default)',
                        color: 'var(--tx-2)', cursor: 'pointer', fontSize: 12,
                        display: 'flex', alignItems: 'center', gap: 5,
                        transition: 'all .15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--teal-bd)'; e.currentTarget.style.color = 'var(--teal)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bd-default)'; e.currentTarget.style.color = 'var(--tx-2)'; }}
                      >
                        <Icon name={s.icon} size={11} /> {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {aiMessages.length === 0 && (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--tx-3)' }}>
                    <Icon name="chat" size={24} style={{ display: 'block', margin: '0 auto 10px', opacity: .25 }} />
                    <p style={{ fontSize: 13 }}>Ask AI to improve, expand, or restructure any part of your draft.</p>
                  </div>
                )}
                {aiMessages.map((msg, i) => (
                  <div key={i}>
                    <div style={{
                      fontSize: 11, color: msg.role === 'user' ? 'var(--amber)' : 'var(--teal)',
                      fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                      letterSpacing: '.05em', marginBottom: 4,
                    }}>
                      {msg.role === 'user' ? 'You' : 'AI'}
                    </div>
                    <div style={{
                      background: msg.role === 'user' ? 'var(--bg-3)' : 'var(--teal-bg)',
                      border: `1px solid ${msg.role === 'user' ? 'var(--bd-default)' : 'var(--teal-bd)'}`,
                      borderRadius: 8, padding: '9px 11px',
                      fontSize: 13.5, color: 'var(--tx-1)', lineHeight: 1.6,
                    }}>
                      {msg.content}
                      {msg.bullets && (
                        <ul style={{ margin: '8px 0 0 16px', padding: 0, fontSize: 13, color: 'var(--tx-2)' }}>
                          {msg.bullets.map((b, bi) => <li key={bi} style={{ marginBottom: 4 }}>{b}</li>)}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
                {aiTyping && (
                  <div style={{ background: 'var(--teal-bg)', border: '1px solid var(--teal-bd)', borderRadius: 8, padding: '10px 12px', display: 'flex', gap: 4 }}>
                    {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)', opacity: .6, animation: `pulse 1.2s ${i*0.2}s infinite` }} />)}
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* AI input */}
              <div style={{ padding: '10px 12px', borderTop: '1px solid var(--bd-default)', flexShrink: 0 }}>
                <div style={{
                  display: 'flex', gap: 7, alignItems: 'flex-end',
                  background: 'var(--bg-0)', border: '1px solid var(--bd-default)',
                  borderRadius: 8, padding: '7px 10px',
                }}>
                  <textarea
                    value={aiInput}
                    onChange={e => setAiInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAiMessage(); } }}
                    placeholder="Ask AI to improve your draft…"
                    rows={1}
                    style={{
                      flex: 1, background: 'none', border: 'none', outline: 'none',
                      color: 'var(--tx-1)', fontSize: 13.5, fontFamily: 'var(--font-sans)',
                      resize: 'none', lineHeight: 1.5,
                    }}
                  />
                  <button onClick={sendAiMessage} style={{
                    background: aiInput.trim() ? 'var(--teal)' : 'var(--bg-3)',
                    border: 'none', cursor: aiInput.trim() ? 'pointer' : 'default',
                    borderRadius: 5, padding: '5px 7px', display: 'flex', alignItems: 'center',
                    transition: 'background .15s', flexShrink: 0,
                  }}>
                    <Icon name="send" size={13} style={{ color: aiInput.trim() ? '#000' : 'var(--tx-3)' }} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { EditorScreen });

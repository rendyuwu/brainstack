
const { useState, useRef } = React;

/* ══════════════════════════════════════════════════════════
   CHEATSHEET SCREEN
══════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════
   NEW CHEATSHEET MODAL
══════════════════════════════════════════════════════════ */
const ARTICLE_OPTIONS = [
  { id: 'docker-net',    label: 'Docker Networking Deep Dive',        topic: 'docker'   },
  { id: 'docker-vol',    label: 'Docker Volumes & Persistent Storage', topic: 'docker'   },
  { id: 'k8s-rbac',     label: 'Kubernetes RBAC for Production',       topic: 'k8s'      },
  { id: 'nginx-proxy',  label: 'Nginx as a Reverse Proxy',             topic: 'nginx'    },
  { id: 'pg-query',     label: 'PostgreSQL Query Optimization',        topic: 'postgres' },
  { id: 'git-rebase',   label: 'Git Rebase vs Merge',                  topic: 'git'      },
  { id: 'linux-systemd',label: 'Linux Systemd Service Units',          topic: 'linux'    },
];

const NewCheatsheetModal = ({ onClose, setScreen }) => {
  const [step, setStep]       = useState('choose');   // 'choose' | 'from-article' | 'manual' | 'generating' | 'done'
  const [selected, setSelected] = useState('');

  const generate = () => {
    if (!selected) return;
    setStep('generating');
    setTimeout(() => setStep('done'), 2000);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)',
      zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)', padding: 20,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 520,
        background: 'var(--bg-2)', border: '1px solid var(--bd-strong)',
        borderRadius: 14, overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
        animation: 'fadeIn .18s ease',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--bd-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--tx-1)' }}>
              {step === 'choose'        ? 'New Cheatsheet'            :
               step === 'from-article' ? 'Generate from Article'     :
               step === 'generating'   ? 'Generating…'               :
               step === 'done'         ? 'Cheatsheet Ready'          : 'Build Manually'}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--tx-3)', marginTop: 2 }}>
              {step === 'choose'        ? 'How would you like to create it?'                          :
               step === 'from-article' ? 'AI will condense the article into a scannable reference.'  :
               step === 'generating'   ? 'Extracting key commands and concepts…'                     :
               step === 'done'         ? 'Review and publish when ready.'                            : 'Add sections and rows manually.'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx-3)', padding: 4 }}>
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px' }}>

          {/* Step 1: Choose path */}
          {step === 'choose' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                {
                  id: 'from-article',
                  icon: 'sparkles',
                  iconColor: 'var(--teal)',
                  iconBg: 'var(--teal-bg)',
                  iconBd: 'var(--teal-bd)',
                  title: 'Generate from article',
                  desc: 'AI reads an existing article and creates a condensed cheatsheet. Fastest path, great quality.',
                  badge: 'Recommended',
                },
                {
                  id: 'manual',
                  icon: 'list',
                  iconColor: 'var(--tx-2)',
                  iconBg: 'var(--bg-3)',
                  iconBd: 'var(--bd-default)',
                  title: 'Build manually',
                  desc: 'Open the editor and write your cheatsheet row by row. Full control over structure and content.',
                  badge: null,
                },
              ].map(opt => (
                <div key={opt.id} onClick={() => step === 'choose' && setStep(opt.id)}
                  style={{
                    padding: '16px', borderRadius: 10, cursor: 'pointer',
                    border: '1px solid var(--bd-default)',
                    background: 'var(--bg-1)', transition: 'all .15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--bd-strong)'; e.currentTarget.style.background = 'var(--bg-3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bd-default)'; e.currentTarget.style.background = 'var(--bg-1)'; }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: opt.iconBg, border: `1px solid ${opt.iconBd}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 12,
                  }}>
                    <Icon name={opt.icon} size={16} style={{ color: opt.iconColor }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx-1)' }}>{opt.title}</span>
                    {opt.badge && (
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: 'var(--teal-bg)', border: '1px solid var(--teal-bd)', color: 'var(--teal)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12.5, color: 'var(--tx-2)', margin: 0, lineHeight: 1.5 }}>{opt.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* Step 2a: Select article */}
          {step === 'from-article' && (
            <div>
              <div style={{ fontSize: 13, color: 'var(--tx-2)', marginBottom: 12 }}>Select an article to condense:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                {ARTICLE_OPTIONS.map(a => (
                  <div key={a.id} onClick={() => setSelected(a.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                      border: `1px solid ${selected === a.id ? 'var(--amber)' : 'var(--bd-default)'}`,
                      background: selected === a.id ? 'var(--amber-bg)' : 'var(--bg-1)',
                      transition: 'all .15s',
                    }}
                    onMouseEnter={e => { if (selected !== a.id) e.currentTarget.style.background = 'var(--bg-3)'; }}
                    onMouseLeave={e => { if (selected !== a.id) e.currentTarget.style.background = 'var(--bg-1)'; }}
                  >
                    <Tag label={a.topic === 'k8s' ? 'k8s' : a.topic} color={a.topic} small />
                    <span style={{ flex: 1, fontSize: 13.5, color: 'var(--tx-1)' }}>{a.label}</span>
                    {selected === a.id && <Icon name="check" size={13} style={{ color: 'var(--amber)' }} />}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep('choose')} style={{ padding: '8px 14px', borderRadius: 7, background: 'var(--bg-3)', border: '1px solid var(--bd-default)', color: 'var(--tx-2)', cursor: 'pointer', fontSize: 13 }}>Back</button>
                <button onClick={generate} disabled={!selected} style={{
                  flex: 1, padding: '8px', borderRadius: 7,
                  background: selected ? 'var(--teal)' : 'var(--bg-3)',
                  border: 'none', color: selected ? '#000' : 'var(--tx-3)',
                  cursor: selected ? 'pointer' : 'default',
                  fontSize: 14, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all .15s',
                }}>
                  <Icon name="sparkles" size={14} style={{ color: selected ? '#000' : 'var(--tx-3)' }} />
                  Generate Cheatsheet
                </button>
              </div>
            </div>
          )}

          {/* Step 2b: Manual — redirect to editor */}
          {step === 'manual' && (
            <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
              <div style={{
                width: 56, height: 56, borderRadius: 12,
                background: 'var(--bg-3)', border: '1px solid var(--bd-default)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px',
              }}>
                <Icon name="list" size={22} style={{ color: 'var(--tx-2)' }} />
              </div>
              <p style={{ fontSize: 14, color: 'var(--tx-1)', marginBottom: 6, fontWeight: 500 }}>Opens the editor in cheatsheet mode</p>
              <p style={{ fontSize: 13, color: 'var(--tx-2)', marginBottom: 20, lineHeight: 1.55 }}>
                Add a title, pick a stack, then write commands and descriptions in a structured table. Use <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--bg-0)', padding: '1px 5px', borderRadius: 3 }}>/section</code> to create groups.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep('choose')} style={{ padding: '8px 14px', borderRadius: 7, background: 'var(--bg-3)', border: '1px solid var(--bd-default)', color: 'var(--tx-2)', cursor: 'pointer', fontSize: 13 }}>Back</button>
                <button onClick={() => { setScreen('editor'); onClose(); }} style={{
                  flex: 1, padding: '8px', borderRadius: 7,
                  background: 'var(--amber)', border: 'none',
                  color: '#000', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  Open Editor <Icon name="arrowRight" size={14} style={{ color: '#000' }} />
                </button>
              </div>
            </div>
          )}

          {/* Generating */}
          {step === 'generating' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ display: 'flex', gap: 7, justifyContent: 'center', marginBottom: 16 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--teal)', animation: `pulse 1.2s ${i*0.2}s infinite` }} />
                ))}
              </div>
              <div style={{ fontSize: 14, color: 'var(--tx-1)', marginBottom: 6 }}>Analyzing article…</div>
              <div style={{ fontSize: 13, color: 'var(--tx-3)' }}>Extracting commands, flags, and key concepts</div>
            </div>
          )}

          {/* Done */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'rgba(63,185,80,.1)', border: '1px solid rgba(63,185,80,.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px',
              }}>
                <Icon name="check" size={22} style={{ color: 'var(--green)' }} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--tx-1)', marginBottom: 6 }}>Cheatsheet generated</p>
              <p style={{ fontSize: 13, color: 'var(--tx-2)', marginBottom: 20, lineHeight: 1.55 }}>
                {ARTICLE_OPTIONS.find(a => a.id === selected)?.label} was condensed into {Math.floor(Math.random()*10)+18} entries across {Math.floor(Math.random()*3)+3} sections.
              </p>
              <button onClick={() => { setScreen('cheatsheet'); onClose(); }} style={{
                width: '100%', padding: '9px', borderRadius: 7,
                background: 'var(--amber)', border: 'none',
                color: '#000', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>
                View Cheatsheet →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


const GIT_SECTIONS = [
  {
    title: 'Setup & Init',
    items: [
      { cmd: 'git init', desc: 'Initialize a new local repository' },
      { cmd: 'git clone <url>', desc: 'Clone a remote repository' },
      { cmd: 'git config --global user.name "Name"', desc: 'Set commit author name' },
      { cmd: 'git config --global user.email "e@mail"', desc: 'Set commit author email' },
    ],
  },
  {
    title: 'Stage & Snapshot',
    items: [
      { cmd: 'git status', desc: 'Show working tree status' },
      { cmd: 'git add <file>', desc: 'Stage a file for commit' },
      { cmd: 'git add .', desc: 'Stage all changes' },
      { cmd: 'git commit -m "msg"', desc: 'Commit staged changes' },
      { cmd: 'git commit --amend', desc: 'Amend the last commit' },
      { cmd: 'git diff', desc: 'Show unstaged changes' },
      { cmd: 'git diff --staged', desc: 'Show staged changes vs last commit' },
    ],
  },
  {
    title: 'Branch & Merge',
    items: [
      { cmd: 'git branch', desc: 'List all local branches' },
      { cmd: 'git branch <name>', desc: 'Create a new branch' },
      { cmd: 'git switch <name>', desc: 'Switch to a branch' },
      { cmd: 'git switch -c <name>', desc: 'Create and switch to new branch' },
      { cmd: 'git merge <branch>', desc: 'Merge a branch into current' },
      { cmd: 'git branch -d <name>', desc: 'Delete a merged branch' },
      { cmd: 'git branch -D <name>', desc: 'Force-delete a branch' },
    ],
  },
  {
    title: 'Rebase & History',
    items: [
      { cmd: 'git rebase <branch>', desc: 'Rebase current branch onto another' },
      { cmd: 'git rebase -i HEAD~3', desc: 'Interactive rebase last 3 commits' },
      { cmd: 'git log --oneline --graph', desc: 'Compact branch graph' },
      { cmd: 'git reflog', desc: 'History of HEAD movements' },
      { cmd: 'git cherry-pick <sha>', desc: 'Apply a specific commit' },
    ],
  },
  {
    title: 'Remote',
    items: [
      { cmd: 'git remote -v', desc: 'List remotes with URLs' },
      { cmd: 'git fetch origin', desc: 'Fetch remote without merging' },
      { cmd: 'git pull --rebase', desc: 'Pull and rebase local commits on top' },
      { cmd: 'git push -u origin <branch>', desc: 'Push and set upstream' },
      { cmd: 'git push --force-with-lease', desc: 'Safe force push (checks remote state)' },
    ],
  },
  {
    title: 'Undo',
    items: [
      { cmd: 'git restore <file>', desc: 'Discard working tree changes' },
      { cmd: 'git restore --staged <file>', desc: 'Unstage a file' },
      { cmd: 'git reset --soft HEAD~1', desc: 'Undo last commit, keep staged' },
      { cmd: 'git reset --hard HEAD~1', desc: 'Undo last commit, discard changes' },
      { cmd: 'git revert <sha>', desc: 'Create a new commit that undoes another' },
      { cmd: 'git stash', desc: 'Stash dirty working tree' },
      { cmd: 'git stash pop', desc: 'Apply and drop most recent stash' },
    ],
  },
];

const CheatsheetScreen = ({ setScreen }) => {
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(null);
  const [newModalOpen, setNewModalOpen] = useState(false);

  const copy = (cmd, idx) => {
    navigator.clipboard?.writeText(cmd).catch(() => {});
    setCopied(idx);
    setTimeout(() => setCopied(null), 1500);
  };

  const filtered = GIT_SECTIONS.map(s => ({
    ...s,
    items: s.items.filter(i =>
      !search || i.cmd.toLowerCase().includes(search.toLowerCase()) || i.desc.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(s => s.items.length > 0);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <Breadcrumb items={[{ label: 'Git', onClick: () => {} }, { label: 'Git Command Reference' }]} />
        <div style={{ marginTop: 20, marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Tag label="Git" color="git" />
              <span style={{
                padding: '3px 8px', borderRadius: 4,
                background: 'var(--bg-3)', border: '1px solid var(--bd-default)',
                fontSize: 11, color: 'var(--tx-2)', fontFamily: 'var(--font-mono)',
              }}>cheatsheet</span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--tx-1)', margin: '0 0 6px', letterSpacing: '-.03em' }}>
              Git Command Reference
            </h1>
            <p style={{ fontSize: 13.5, color: 'var(--tx-2)', margin: 0 }}>42 commands · 6 sections · Updated Apr 2026</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setScreen('article')} style={{
              padding: '7px 12px', borderRadius: 6,
              background: 'var(--bg-2)', border: '1px solid var(--bd-default)',
              color: 'var(--tx-2)', cursor: 'pointer', fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <Icon name="book" size={13} /> Full Article
            </button>
            <button style={{
              padding: '7px 12px', borderRadius: 6,
              background: 'var(--bg-2)', border: '1px solid var(--bd-default)',
              color: 'var(--tx-2)', cursor: 'pointer', fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <Icon name="wand" size={13} /> Rewrite with AI
            </button>
            <button onClick={() => setNewModalOpen(true)} style={{
              padding: '7px 12px', borderRadius: 6,
              background: 'var(--amber)', border: 'none',
              color: '#000', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <Icon name="plus" size={13} style={{ color: '#000' }} /> New Cheatsheet
            </button>
          </div>
          {newModalOpen && <NewCheatsheetModal onClose={() => setNewModalOpen(false)} setScreen={setScreen} />}
        </div>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--bg-0)', border: '1px solid var(--bd-default)',
          borderRadius: 7, padding: '8px 12px', marginBottom: 28,
        }}>
          <Icon name="search" size={14} style={{ color: 'var(--tx-3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Filter commands…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--tx-1)', fontSize: 14, fontFamily: 'var(--font-sans)',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx-3)', padding: 2 }}>
              <Icon name="close" size={13} />
            </button>
          )}
        </div>

        {/* Sections grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 }}>
          {filtered.map(section => (
            <div key={section.title} style={{
              background: 'var(--bg-2)', border: '1px solid var(--bd-default)',
              borderRadius: 10, overflow: 'hidden',
            }}>
              <div style={{
                padding: '10px 14px', borderBottom: '1px solid var(--bd-default)',
                background: 'var(--bg-1)',
                fontSize: 12, fontWeight: 600, color: 'var(--tx-2)',
                fontFamily: 'var(--font-mono)', letterSpacing: '.04em', textTransform: 'uppercase',
              }}>
                {section.title}
              </div>
              {section.items.map((item, idx) => {
                const key = `${section.title}-${idx}`;
                return (
                  <div key={idx}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 14px',
                      borderBottom: idx < section.items.length - 1 ? '1px solid var(--bd-subtle)' : 'none',
                      transition: 'background .1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <code style={{
                      flex: '0 0 auto', maxWidth: '52%',
                      fontFamily: 'var(--font-mono)', fontSize: 12.5,
                      color: 'var(--syn-keyword)', whiteSpace: 'pre',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{item.cmd}</code>
                    <span style={{ flex: 1, fontSize: 12.5, color: 'var(--tx-2)', lineHeight: 1.4 }}>{item.desc}</span>
                    <button onClick={() => copy(item.cmd, key)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: copied === key ? 'var(--green)' : 'var(--tx-3)',
                      padding: '2px 4px', flexShrink: 0,
                      transition: 'color .2s',
                    }}>
                      <Icon name={copied === key ? 'check' : 'copy'} size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--tx-3)' }}>
            <Icon name="search" size={32} style={{ opacity: .3, display: 'block', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 15 }}>No commands match "<strong style={{ color: 'var(--tx-2)' }}>{search}</strong>"</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   AI CHAT SCREEN
══════════════════════════════════════════════════════════ */
const KB_MESSAGES = [
  {
    role: 'assistant',
    content: 'Ask me anything about Docker, Kubernetes, Git, Linux, Nginx, or PostgreSQL. I\'ll cite the exact articles and sections I draw from.',
    isIntro: true,
  },
  {
    role: 'user',
    content: 'How do I set up TLS termination in Nginx and forward to a Docker container?',
  },
  {
    role: 'assistant',
    content: 'TLS termination in Nginx means Nginx handles the SSL handshake and forwards plain HTTP traffic to upstream containers. Here\'s the typical setup:',
    code: `# /etc/nginx/sites-available/myapp
server {
    listen 443 ssl;
    server_name myapp.example.com;

    ssl_certificate     /etc/letsencrypt/live/myapp/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/myapp/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    location / {
        proxy_pass         http://127.0.0.1:8080;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}`,
    citations: [
      { num: 1, label: 'Nginx · Reverse Proxy Setup › SSL/TLS Config' },
      { num: 2, label: 'Docker · Bridge Networks › Port Mapping' },
    ],
    extra: 'Your Docker container listens on port 8080 on the host (via `-p 8080:80`), and Nginx proxies to `127.0.0.1:8080`. Set `X-Forwarded-Proto` so your app knows the original request was HTTPS.',
  },
];

const AIChatScreen = () => {
  const [messages, setMessages] = useState(KB_MESSAGES);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const inputRef = useRef();

  const send = () => {
    if (!input.trim()) return;
    setMessages(m => [...m, { role: 'user', content: input }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setMessages(m => [...m, {
        role: 'assistant',
        content: 'Based on the PostgreSQL docs in this knowledge base, `EXPLAIN ANALYZE` runs the query and shows actual execution times alongside estimated costs.',
        citations: [{ num: 3, label: 'PostgreSQL · Query Optimization › EXPLAIN ANALYZE' }],
      }]);
      setTyping(false);
    }, 1400);
  };

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

      {/* Main chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Chat header */}
        <div style={{
          padding: '14px 24px', borderBottom: '1px solid var(--bd-default)',
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--bg-1)',
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7,
            background: 'var(--teal-bg)', border: '1px solid var(--teal-bd)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="sparkles" size={15} style={{ color: 'var(--teal)' }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx-1)' }}>Ask the Knowledge Base</div>
            <div style={{ fontSize: 12, color: 'var(--tx-3)' }}>Grounded in all articles, tutorials, and docs · 6 topic stacks</div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{
            padding: '4px 10px', borderRadius: 20,
            background: 'var(--teal-bg)', border: '1px solid var(--teal-bd)',
            fontSize: 11.5, color: 'var(--teal)', fontFamily: 'var(--font-mono)',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)' }} />
            147 documents indexed
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 780, width: '100%', margin: '0 auto' }}>
          {messages.map((msg, i) => (
            <div key={i}>
              {msg.isIntro ? (
                <div style={{
                  background: 'var(--teal-bg)', border: '1px solid var(--teal-bd)',
                  borderRadius: 10, padding: '14px 16px',
                  fontSize: 14, color: 'var(--tx-2)', lineHeight: 1.6,
                  display: 'flex', gap: 10,
                }}>
                  <Icon name="info" size={15} style={{ color: 'var(--teal)', flexShrink: 0, marginTop: 2 }} />
                  {msg.content}
                </div>
              ) : msg.role === 'user' ? (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{
                    background: 'var(--bg-3)', border: '1px solid var(--bd-default)',
                    borderRadius: '10px 10px 2px 10px', padding: '10px 14px',
                    maxWidth: '75%', fontSize: 14.5, color: 'var(--tx-1)', lineHeight: 1.55,
                  }}>
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                    background: 'var(--teal-bg)', border: '1px solid var(--teal-bd)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginTop: 2,
                  }}>
                    <Icon name="sparkles" size={13} style={{ color: 'var(--teal)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      background: 'var(--bg-2)', border: '1px solid var(--bd-default)',
                      borderRadius: '2px 10px 10px 10px', padding: '12px 14px',
                      fontSize: 14.5, color: 'var(--tx-1)', lineHeight: 1.65,
                    }}>
                      <p style={{ margin: '0 0 12px' }}>{msg.content}</p>
                      {msg.code && (
                        <CodeBlock lang="nginx" title="nginx.conf" code={msg.code} />
                      )}
                      {msg.extra && (
                        <p style={{ margin: '10px 0 0', color: 'var(--tx-2)', fontSize: 14 }}>{msg.extra}</p>
                      )}
                    </div>
                    {msg.citations && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                        <span style={{ fontSize: 11.5, color: 'var(--tx-3)', fontFamily: 'var(--font-mono)', alignSelf: 'center' }}>Sources:</span>
                        {msg.citations.map((c, ci) => (
                          <span key={ci} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '3px 8px', borderRadius: 5,
                            background: 'var(--teal-bg)', border: '1px solid var(--teal-bd)',
                            color: 'var(--teal)', fontSize: 11.5, cursor: 'pointer',
                          }}>
                            <Icon name="link" size={10} />
                            {c.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {typing && (
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--teal-bg)', border: '1px solid var(--teal-bd)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="sparkles" size={13} style={{ color: 'var(--teal)' }} />
              </div>
              <div style={{ background: 'var(--bg-2)', border: '1px solid var(--bd-default)', borderRadius: '2px 10px 10px 10px', padding: '14px 16px', display: 'flex', gap: 5, alignItems: 'center' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)', opacity: .6, animation: `pulse 1.2s ${i*0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--bd-default)', maxWidth: 780, width: '100%', margin: '0 auto', boxSizing: 'border-box', alignSelf: 'center' }}>
          {/* Prompt chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {['How does Docker DNS work?', 'Kubernetes pod scheduling strategies', 'PostgreSQL vs MySQL for time-series'].map(q => (
              <button key={q} onClick={() => setInput(q)} style={{
                padding: '4px 10px', borderRadius: 20,
                background: 'var(--bg-2)', border: '1px solid var(--bd-default)',
                color: 'var(--tx-2)', cursor: 'pointer', fontSize: 12,
                transition: 'all .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--bd-strong)'; e.currentTarget.style.color = 'var(--tx-1)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bd-default)'; e.currentTarget.style.color = 'var(--tx-2)'; }}
              >
                {q}
              </button>
            ))}
          </div>

          <div style={{
            background: 'var(--bg-0)', border: '1px solid var(--bd-default)',
            borderRadius: 10, padding: '10px 14px',
          }}>
            <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask anything in the knowledge base…"
              rows={2}
              style={{
                width: '100%', background: 'none', border: 'none', outline: 'none',
                color: 'var(--tx-1)', fontSize: 15, fontFamily: 'var(--font-sans)',
                resize: 'none', lineHeight: 1.5, boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setUploadOpen(o => !o)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--tx-3)', display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 12.5, padding: '3px 6px', borderRadius: 4,
                }}>
                  <Icon name="image" size={13} /> Attach screenshot
                </button>
              </div>
              <button onClick={send} style={{
                background: input.trim() ? 'var(--amber)' : 'var(--bg-3)',
                border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                borderRadius: 6, padding: '6px 14px',
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 13, fontWeight: 600, color: input.trim() ? '#000' : 'var(--tx-3)',
                transition: 'all .15s',
              }}>
                <Icon name="send" size={13} style={{ color: input.trim() ? '#000' : 'var(--tx-3)' }} /> Send
              </button>
            </div>
          </div>

          {/* Upload area */}
          {uploadOpen && (
            <div style={{
              marginTop: 10,
              border: '1.5px dashed var(--bd-strong)',
              borderRadius: 8, padding: '20px',
              textAlign: 'center', color: 'var(--tx-3)',
              background: 'var(--bg-0)',
            }}>
              <Icon name="upload" size={22} style={{ display: 'block', margin: '0 auto 8px', opacity: .4 }} />
              <div style={{ fontSize: 13.5, marginBottom: 4 }}>Drop a screenshot or diagram here</div>
              <div style={{ fontSize: 12, color: 'var(--tx-3)' }}>PNG, JPG, WebP · AI will analyze and ground its answer</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   SETTINGS SCREEN
══════════════════════════════════════════════════════════ */
const SettingsScreen = ({ theme, setTheme }) => {
  const [provider,   setProvider]   = useState('openai');
  const [baseUrl,    setBaseUrl]    = useState('https://api.openai.com/v1');
  const [apiKey,     setApiKey]     = useState('sk-••••••••••••••••••••••••••••••');
  const [genModel,   setGenModel]   = useState('gpt-4o');
  const [embedModel, setEmbedModel] = useState('text-embedding-3-small');
  const [label,      setLabel]      = useState('OpenAI');
  const [testState,  setTestState]  = useState(null);
  const [activeTab,  setActiveTab]  = useState('ai');
  const [appearance, setAppearance] = useState(() => {
    try { return { ...DEFAULT_APPEARANCE, ...JSON.parse(localStorage.getItem('bs-appearance') || '{}') }; }
    catch { return DEFAULT_APPEARANCE; }
  });

  const updateAppearance = (key, val) => {
    const next = { ...appearance, [key]: val };
    setAppearance(next);
    localStorage.setItem('bs-appearance', JSON.stringify(next));
    applyAppearanceCss(next);
  };

  const test = () => {
    setTestState('testing');
    setTimeout(() => setTestState('ok'), 1800);
  };

  const TABS = [
    { id: 'ai', label: 'AI Provider', icon: 'sparkles' },
    { id: 'editor', label: 'Editor', icon: 'file' },
    { id: 'appearance', label: 'Appearance', icon: 'sun' },
  ];

  const PROVIDERS = [
    { id: 'openai', label: 'OpenAI', url: 'https://api.openai.com/v1' },
    { id: 'azure', label: 'Azure OpenAI', url: 'https://<resource>.openai.azure.com' },
    { id: 'ollama', label: 'Ollama (local)', url: 'http://localhost:11434/v1' },
    { id: 'custom', label: 'Custom / Self-hosted', url: '' },
  ];

  const MODEL_CAPS = {
    'gpt-4o':                  ['vision', 'function-calling', '128k ctx'],
    'gpt-4o-mini':             ['vision', 'function-calling', '128k ctx'],
    'gpt-3.5-turbo':           ['function-calling', '16k ctx'],
    'claude-3-5-sonnet-20241022': ['vision', 'function-calling', '200k ctx'],
    'mistral-large-latest':    ['function-calling', '32k ctx'],
  };

  const genCaps = MODEL_CAPS[genModel] || [];

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--tx-1)', margin: '0 0 4px', letterSpacing: '-.02em' }}>Settings</h1>
        <p style={{ fontSize: 14, color: 'var(--tx-2)', margin: '0 0 28px' }}>Configure AI providers, editor preferences, and appearance.</p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--bd-default)', marginBottom: 32 }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer',
              color: activeTab === tab.id ? 'var(--tx-1)' : 'var(--tx-2)',
              fontSize: 14, fontWeight: activeTab === tab.id ? 500 : 400,
              borderBottom: `2px solid ${activeTab === tab.id ? 'var(--amber)' : 'transparent'}`,
              marginBottom: -1, display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all .15s',
            }}>
              <Icon name={tab.icon} size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'ai' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Provider select */}
            <FormSection title="Provider" desc="Select a preconfigured provider or use a custom OpenAI-compatible endpoint.">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {PROVIDERS.map(p => (
                  <div key={p.id} onClick={() => { setProvider(p.id); if (p.url) setBaseUrl(p.url); setLabel(p.label); }}
                    style={{
                      padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                      border: `1px solid ${provider === p.id ? 'var(--amber)' : 'var(--bd-default)'}`,
                      background: provider === p.id ? 'var(--amber-bg)' : 'var(--bg-2)',
                      display: 'flex', alignItems: 'center', gap: 8,
                      transition: 'all .15s',
                    }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: provider === p.id ? 'var(--amber)' : 'var(--bd-strong)',
                      flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 13.5, color: provider === p.id ? 'var(--tx-1)' : 'var(--tx-2)', fontWeight: provider === p.id ? 500 : 400 }}>
                      {p.label}
                    </span>
                  </div>
                ))}
              </div>
            </FormSection>

            {/* Connection */}
            <FormSection title="Connection" desc="Base URL must be OpenAI-compatible (/v1 prefix expected).">
              <Field label="Provider label">
                <input value={label} onChange={e => setLabel(e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Base URL">
                <input value={baseUrl} onChange={e => setBaseUrl(e.target.value)} style={inputStyle} spellCheck={false} />
              </Field>
              <Field label="API Key">
                <input value={apiKey} onChange={e => setApiKey(e.target.value)} type="password" style={inputStyle} spellCheck={false} />
              </Field>

              {/* Test connection */}
              <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={test} style={{
                  padding: '7px 16px', borderRadius: 6,
                  background: 'var(--bg-3)', border: '1px solid var(--bd-default)',
                  color: 'var(--tx-1)', cursor: 'pointer', fontSize: 13.5,
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all .15s',
                }}>
                  {testState === 'testing'
                    ? <><Icon name="refresh" size={13} style={{ animation: 'spin 1s linear infinite' }} /> Testing…</>
                    : <><Icon name="zap" size={13} /> Test Connection</>}
                </button>
                {testState === 'ok' && (
                  <span style={{ fontSize: 13, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Icon name="check" size={13} /> Connection successful
                  </span>
                )}
                {testState === 'fail' && (
                  <span style={{ fontSize: 13, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Icon name="alertCircle" size={13} /> Could not connect
                  </span>
                )}
              </div>
            </FormSection>

            {/* Models */}
            <FormSection title="Models" desc="Configure which models are used for generation and embedding.">
              <Field label="Generation model">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <select value={genModel} onChange={e => setGenModel(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                    {Object.keys(MODEL_CAPS).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {genCaps.map(cap => (
                      <span key={cap} style={{
                        padding: '3px 8px', borderRadius: 4,
                        background: 'var(--bg-3)', border: '1px solid var(--bd-default)',
                        fontSize: 11, color: 'var(--tx-2)', fontFamily: 'var(--font-mono)',
                        whiteSpace: 'nowrap',
                      }}>{cap}</span>
                    ))}
                  </div>
                </div>
              </Field>
              <Field label="Embedding model">
                <select value={embedModel} onChange={e => setEmbedModel(e.target.value)} style={inputStyle}>
                  {['text-embedding-3-small','text-embedding-3-large','text-embedding-ada-002'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
            </FormSection>

            {/* Save */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{
                padding: '8px 20px', borderRadius: 7,
                background: 'var(--amber)', border: 'none', cursor: 'pointer',
                color: '#000', fontSize: 14, fontWeight: 600,
              }}>
                Save Settings
              </button>
              <button style={{
                padding: '8px 16px', borderRadius: 7,
                background: 'var(--bg-2)', border: '1px solid var(--bd-default)', cursor: 'pointer',
                color: 'var(--tx-2)', fontSize: 14,
              }}>
                Reset to defaults
              </button>
            </div>
          </div>
        )}

        {activeTab === 'editor' && (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--tx-3)' }}>
            <Icon name="file" size={32} style={{ display: 'block', margin: '0 auto 12px', opacity: .25 }} />
            <p style={{ fontSize: 15 }}>Editor settings coming soon.</p>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Theme */}
            <FormSection title="Theme" desc="Switch between dark and light mode. System follows your OS preference.">
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { id: 'dark',  label: 'Dark',   bg: '#0d1117', fg: '#e6edf3' },
                  { id: 'light', label: 'Light',  bg: '#ffffff', fg: '#1f2328' },
                  { id: 'system',label: 'System', bg: 'linear-gradient(135deg,#0d1117 50%,#fff 50%)', fg: null },
                ].map(t => (
                  <div key={t.id} onClick={() => t.id !== 'system' && setTheme(t.id)}
                    style={{
                      flex: 1, borderRadius: 10, overflow: 'hidden', cursor: t.id !== 'system' ? 'pointer' : 'default',
                      border: `2px solid ${theme === t.id ? 'var(--amber)' : 'var(--bd-default)'}`,
                      transition: 'border-color .15s',
                    }}>
                    <div style={{ height: 56, background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 60 }}>
                        <div style={{ height: 5, borderRadius: 2, background: t.fg || '#888', opacity: .8 }} />
                        <div style={{ height: 5, borderRadius: 2, background: t.fg || '#888', opacity: .4, width: '70%' }} />
                        <div style={{ height: 5, borderRadius: 2, background: t.fg || '#888', opacity: .2, width: '50%' }} />
                      </div>
                    </div>
                    <div style={{ padding: '8px', textAlign: 'center', fontSize: 12.5, color: theme === t.id ? 'var(--amber)' : 'var(--tx-2)', fontWeight: theme === t.id ? 600 : 400, background: 'var(--bg-1)' }}>
                      {t.label}
                    </div>
                  </div>
                ))}
              </div>
            </FormSection>

            {/* Code syntax theme */}
            <FormSection title="Code Syntax Theme" desc="Applies to all code blocks across articles and cheatsheets.">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {Object.entries(CODE_PALETTES).map(([id, palette]) => (
                  <div key={id} onClick={() => updateAppearance('codeTheme', id)}
                    style={{
                      borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                      border: `2px solid ${appearance.codeTheme === id ? 'var(--amber)' : 'var(--bd-default)'}`,
                      transition: 'border-color .15s',
                    }}>
                    {/* Mini code preview */}
                    <div style={{ background: '#090d12', padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: 1.7 }}>
                      <span style={{ color: palette.keyword }}>const </span>
                      <span style={{ color: palette.fn }}>run </span>
                      <span style={{ color: '#e6edf3' }}>= (</span>
                      <span style={{ color: palette.type }}>cmd</span>
                      <span style={{ color: '#e6edf3' }}>) </span>
                      <span style={{ color: palette.keyword }}>=&gt;</span>
                      <br/>
                      <span style={{ color: palette.comment }}>&nbsp;&nbsp;// exec</span>
                      <br/>
                      <span style={{ color: palette.string }}>&nbsp;&nbsp;`{'{cmd}'}`</span>
                    </div>
                    <div style={{ padding: '6px 10px', background: 'var(--bg-1)', fontSize: 12, color: appearance.codeTheme === id ? 'var(--amber)' : 'var(--tx-2)', fontWeight: appearance.codeTheme === id ? 600 : 400, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {palette.label}
                      {appearance.codeTheme === id && <Icon name="check" size={12} style={{ color: 'var(--amber)' }} />}
                    </div>
                  </div>
                ))}
              </div>
            </FormSection>

            {/* Font size */}
            <FormSection title="Interface Font Size" desc="Adjusts base reading size for articles and documentation.">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 12, color: 'var(--tx-3)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>A</span>
                <input type="range" min="13" max="18" step="1"
                  value={appearance.fontSize}
                  onChange={e => updateAppearance('fontSize', Number(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--amber)' }}
                />
                <span style={{ fontSize: 16, color: 'var(--tx-3)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>A</span>
                <span style={{ fontSize: 13, color: 'var(--tx-2)', fontFamily: 'var(--font-mono)', width: 36, textAlign: 'right', flexShrink: 0 }}>{appearance.fontSize}px</span>
              </div>
            </FormSection>

            {/* Reading width */}
            <FormSection title="Reading Width" desc="Controls the maximum width of article content.">
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { id: 'narrow',      label: 'Narrow',      sub: '620px' },
                  { id: 'comfortable', label: 'Comfortable',  sub: '760px' },
                  { id: 'wide',        label: 'Wide',         sub: '920px' },
                ].map(w => (
                  <div key={w.id} onClick={() => updateAppearance('readingWidth', w.id)}
                    style={{
                      flex: 1, padding: '12px 10px', borderRadius: 8, textAlign: 'center',
                      cursor: 'pointer',
                      border: `1px solid ${appearance.readingWidth === w.id ? 'var(--amber)' : 'var(--bd-default)'}`,
                      background: appearance.readingWidth === w.id ? 'var(--amber-bg)' : 'var(--bg-1)',
                      transition: 'all .15s',
                    }}>
                    {/* Width visual */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginBottom: 8 }}>
                      {Array.from({ length: w.id === 'narrow' ? 4 : w.id === 'comfortable' ? 6 : 8 }).map((_, i) => (
                        <div key={i} style={{ width: 4, height: 14, borderRadius: 1, background: appearance.readingWidth === w.id ? 'var(--amber)' : 'var(--tx-3)', opacity: i === 0 ? 1 : i < 2 ? .7 : .4 }} />
                      ))}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: appearance.readingWidth === w.id ? 'var(--amber)' : 'var(--tx-1)' }}>{w.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--tx-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{w.sub}</div>
                  </div>
                ))}
              </div>
            </FormSection>

          </div>
        )}
      </div>
    </div>
  );
};

/* ── Appearance CSS helper ─ called from SettingsScreen ── */
const CODE_PALETTES = {
  'github-dark': { label: 'GitHub Dark',  keyword:'#ff7b72', string:'#a5d6ff', comment:'#484f58', number:'#f2cc60', type:'#ffa657', flag:'#79c0ff', fn:'#d2a8ff' },
  'dracula':     { label: 'Dracula',      keyword:'#ff79c6', string:'#f1fa8c', comment:'#6272a4', number:'#bd93f9', type:'#ffb86c', flag:'#8be9fd', fn:'#50fa7b' },
  'one-dark':    { label: 'One Dark Pro', keyword:'#c678dd', string:'#98c379', comment:'#5c6370', number:'#d19a66', type:'#e5c07b', flag:'#61afef', fn:'#56b6c2' },
  'solarized':   { label: 'Solarized',    keyword:'#859900', string:'#2aa198', comment:'#93a1a1', number:'#d33682', type:'#cb4b16', flag:'#268bd2', fn:'#268bd2' },
};

const applyAppearanceCss = (s) => {
  const root = document.documentElement;
  if (s.fontSize)     root.style.setProperty('--prose-size', s.fontSize + 'px');
  if (s.readingWidth) root.style.setProperty('--reading-width', ({narrow:'620px',comfortable:'760px',wide:'920px'})[s.readingWidth]);
  if (s.codeTheme) {
    const p = CODE_PALETTES[s.codeTheme];
    if (p) {
      root.style.setProperty('--syn-keyword',  p.keyword);
      root.style.setProperty('--syn-string',   p.string);
      root.style.setProperty('--syn-comment',  p.comment);
      root.style.setProperty('--syn-number',   p.number);
      root.style.setProperty('--syn-type',     p.type);
      root.style.setProperty('--syn-flag',     p.flag);
      root.style.setProperty('--syn-function', p.fn);
    }
  }
};

const DEFAULT_APPEARANCE = { fontSize: 15, readingWidth: 'comfortable', codeTheme: 'github-dark' };

const FormSection = ({ title, desc, children }) => (
  <div>
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--tx-1)', marginBottom: 3 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--tx-3)' }}>{desc}</div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--bg-2)', border: '1px solid var(--bd-default)', borderRadius: 10, padding: '16px' }}>
      {children}
    </div>
  </div>
);

const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 13, color: 'var(--tx-2)', fontWeight: 500 }}>{label}</label>
    {children}
  </div>
);

const inputStyle = {
  background: 'var(--bg-0)', border: '1px solid var(--bd-default)',
  borderRadius: 6, padding: '8px 10px',
  color: 'var(--tx-1)', fontSize: 13.5,
  fontFamily: 'var(--font-mono)', outline: 'none',
  width: '100%', boxSizing: 'border-box',
};

/* ══════════════════════════════════════════════════════════
   DISCOVER SCREEN — full article list with filters
══════════════════════════════════════════════════════════ */
const ALL_ARTICLES = [
  { title: 'Docker Networking Deep Dive',             topic: 'docker',   color: 'docker',   mins: 12, date: 'Apr 18', tags: ['networking','bridge','overlay'], screen: 'article' },
  { title: 'Docker Volumes & Persistent Storage',    topic: 'docker',   color: 'docker',   mins: 9,  date: 'Apr 17', tags: ['volumes','storage'], screen: 'article' },
  { title: 'Multi-stage Docker Builds',              topic: 'docker',   color: 'docker',   mins: 7,  date: 'Apr 5',  tags: ['builds','optimization'], screen: 'article' },
  { title: 'Docker Compose Patterns',                topic: 'docker',   color: 'docker',   mins: 11, date: 'Mar 28', tags: ['compose','services'], screen: 'article' },
  { title: 'Kubernetes RBAC for Production',         topic: 'k8s',      color: 'k8s',      mins: 9,  date: 'Apr 16', tags: ['rbac','security'], screen: 'article' },
  { title: 'Pod Scheduling & Affinity Rules',        topic: 'k8s',      color: 'k8s',      mins: 14, date: 'Apr 8',  tags: ['scheduling','affinity'], screen: 'article' },
  { title: 'Ingress Controllers Compared',           topic: 'k8s',      color: 'k8s',      mins: 10, date: 'Mar 22', tags: ['ingress','nginx','traefik'], screen: 'article' },
  { title: 'Helm Chart Best Practices',              topic: 'k8s',      color: 'k8s',      mins: 8,  date: 'Mar 15', tags: ['helm','packaging'], screen: 'article' },
  { title: 'Nginx as a Reverse Proxy',               topic: 'nginx',    color: 'nginx',    mins: 11, date: 'Apr 14', tags: ['proxy','upstream'], screen: 'article' },
  { title: 'Nginx SSL/TLS Configuration',            topic: 'nginx',    color: 'nginx',    mins: 8,  date: 'Apr 2',  tags: ['tls','ssl','certificates'], screen: 'article' },
  { title: 'Nginx Rate Limiting',                    topic: 'nginx',    color: 'nginx',    mins: 6,  date: 'Mar 18', tags: ['rate-limiting','security'], screen: 'article' },
  { title: 'PostgreSQL Query Optimization',          topic: 'postgres', color: 'postgres', mins: 15, date: 'Apr 12', tags: ['performance','explain','indexes'], screen: 'article' },
  { title: 'PostgreSQL Indexing Strategies',         topic: 'postgres', color: 'postgres', mins: 12, date: 'Apr 1',  tags: ['indexes','b-tree','gin'], screen: 'article' },
  { title: 'Streaming Replication Setup',            topic: 'postgres', color: 'postgres', mins: 10, date: 'Mar 20', tags: ['replication','ha'], screen: 'article' },
  { title: 'Git Rebase vs Merge',                    topic: 'git',      color: 'git',      mins: 7,  date: 'Apr 10', tags: ['branching','history'], screen: 'article' },
  { title: 'Git Hooks for CI Workflows',             topic: 'git',      color: 'git',      mins: 6,  date: 'Mar 30', tags: ['hooks','automation'], screen: 'article' },
  { title: 'Linux Systemd Service Units',            topic: 'linux',    color: 'linux',    mins: 8,  date: 'Apr 9',  tags: ['systemd','services'], screen: 'article' },
  { title: 'Linux File Permissions Deep Dive',       topic: 'linux',    color: 'linux',    mins: 10, date: 'Mar 25', tags: ['permissions','chmod','acl'], screen: 'article' },
  { title: 'Bash Scripting Patterns',                topic: 'linux',    color: 'linux',    mins: 13, date: 'Mar 10', tags: ['bash','scripting'], screen: 'article' },
];

const TOPIC_FILTERS = [
  { id: 'all',      label: 'All' },
  { id: 'docker',   label: 'Docker' },
  { id: 'k8s',      label: 'Kubernetes' },
  { id: 'linux',    label: 'Linux' },
  { id: 'git',      label: 'Git' },
  { id: 'nginx',    label: 'Nginx' },
  { id: 'postgres', label: 'PostgreSQL' },
];

const DiscoverScreen = ({ setScreen }) => {
  const [query,       setQuery]       = useState('');
  const [topicFilter, setTopicFilter] = useState('all');
  const [sort,        setSort]        = useState('recent');
  const [viewMode,    setViewMode]    = useState('list'); // 'list' | 'grid'

  const filtered = ALL_ARTICLES
    .filter(a => topicFilter === 'all' || a.topic === topicFilter)
    .filter(a => !query ||
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.tags.some(t => t.includes(query.toLowerCase()))
    )
    .sort((a, b) => sort === 'mins-asc' ? a.mins - b.mins : sort === 'mins-desc' ? b.mins - a.mins : 0);

  return (
    <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 32px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--tx-1)', margin: '0 0 4px', letterSpacing: '-.02em' }}>
            All Posts
          </h1>
          <p style={{ fontSize: 14, color: 'var(--tx-2)', margin: 0 }}>
            {ALL_ARTICLES.length} articles across {TOPIC_FILTERS.length - 1} topic stacks
          </p>
        </div>

        {/* Search + controls row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{
            flex: 1, minWidth: 200,
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--bg-0)', border: '1px solid var(--bd-default)',
            borderRadius: 7, padding: '8px 12px',
          }}>
            <Icon name="search" size={14} style={{ color: 'var(--tx-3)', flexShrink: 0 }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Filter by title or tag…"
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                color: 'var(--tx-1)', fontSize: 14, fontFamily: 'var(--font-sans)',
              }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx-3)', padding: 2 }}>
                <Icon name="close" size={13} />
              </button>
            )}
          </div>

          {/* Sort */}
          <select value={sort} onChange={e => setSort(e.target.value)} style={{
            background: 'var(--bg-0)', border: '1px solid var(--bd-default)',
            borderRadius: 7, padding: '8px 12px', color: 'var(--tx-2)',
            fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', cursor: 'pointer',
          }}>
            <option value="recent">Most recent</option>
            <option value="mins-asc">Shortest first</option>
            <option value="mins-desc">Longest first</option>
          </select>

          {/* View mode */}
          <div style={{ display: 'flex', border: '1px solid var(--bd-default)', borderRadius: 7, overflow: 'hidden' }}>
            {[['list','list'],['grid','layers']].map(([mode, icon]) => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{
                padding: '8px 10px', background: viewMode === mode ? 'var(--bg-3)' : 'var(--bg-0)',
                border: 'none', cursor: 'pointer', color: viewMode === mode ? 'var(--tx-1)' : 'var(--tx-3)',
                transition: 'all .1s',
              }}>
                <Icon name={icon} size={14} />
              </button>
            ))}
          </div>
        </div>

        {/* Topic filter pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
          {TOPIC_FILTERS.map(f => (
            <button key={f.id} onClick={() => setTopicFilter(f.id)} style={{
              padding: '5px 13px', borderRadius: 20, cursor: 'pointer',
              background: topicFilter === f.id ? 'var(--amber)' : 'var(--bg-2)',
              border: `1px solid ${topicFilter === f.id ? 'var(--amber)' : 'var(--bd-default)'}`,
              color: topicFilter === f.id ? '#000' : 'var(--tx-2)',
              fontSize: 13, fontWeight: topicFilter === f.id ? 600 : 400,
              transition: 'all .15s',
            }}
            onMouseEnter={e => { if (topicFilter !== f.id) { e.currentTarget.style.borderColor = 'var(--bd-strong)'; e.currentTarget.style.color = 'var(--tx-1)'; } }}
            onMouseLeave={e => { if (topicFilter !== f.id) { e.currentTarget.style.borderColor = 'var(--bd-default)'; e.currentTarget.style.color = 'var(--tx-2)'; } }}
            >
              {f.label}
              <span style={{ marginLeft: 6, fontSize: 11, fontFamily: 'var(--font-mono)', opacity: .7 }}>
                {f.id === 'all' ? ALL_ARTICLES.length : ALL_ARTICLES.filter(a => a.topic === f.id).length}
              </span>
            </button>
          ))}
        </div>

        {/* Results count */}
        <div style={{ fontSize: 12.5, color: 'var(--tx-3)', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>
          {filtered.length === 0
            ? 'No results'
            : `${filtered.length} article${filtered.length !== 1 ? 's' : ''}${query ? ` matching "${query}"` : ''}${topicFilter !== 'all' ? ` in ${TOPIC_FILTERS.find(f=>f.id===topicFilter)?.label}` : ''}`
          }
        </div>

        {/* Article list */}
        {viewMode === 'list' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filtered.map((a, i) => (
              <div key={i} onClick={() => setScreen(a.screen)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '13px 16px', borderRadius: 8, cursor: 'pointer',
                  border: '1px solid transparent', transition: 'all .1s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.borderColor = 'var(--bd-default)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
              >
                <Tag label={a.topic === 'k8s' ? 'Kubernetes' : a.topic.charAt(0).toUpperCase() + a.topic.slice(1)} color={a.color} small />
                <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: 'var(--tx-1)', letterSpacing: '-.01em' }}>
                  {a.title}
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'flex-end', maxWidth: 220 }}>
                  {a.tags.slice(0, 2).map(t => (
                    <span key={t} style={{
                      fontSize: 11, padding: '2px 6px', borderRadius: 3,
                      background: 'var(--bg-3)', color: 'var(--tx-3)',
                      fontFamily: 'var(--font-mono)',
                    }}>{t}</span>
                  ))}
                </div>
                <span style={{ fontSize: 12, color: 'var(--tx-3)', fontFamily: 'var(--font-mono)', flexShrink: 0, width: 48, textAlign: 'right' }}>
                  {a.mins} min
                </span>
                <span style={{ fontSize: 12, color: 'var(--tx-3)', flexShrink: 0, width: 52, textAlign: 'right' }}>
                  {a.date}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {filtered.map((a, i) => (
              <div key={i} onClick={() => setScreen(a.screen)}
                style={{
                  padding: '16px', borderRadius: 10, cursor: 'pointer',
                  background: 'var(--bg-2)', border: '1px solid var(--bd-default)',
                  transition: 'all .1s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--bd-strong)'; e.currentTarget.style.background = 'var(--bg-3)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bd-default)'; e.currentTarget.style.background = 'var(--bg-2)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Tag label={a.topic === 'k8s' ? 'Kubernetes' : a.topic.charAt(0).toUpperCase() + a.topic.slice(1)} color={a.color} small />
                  <span style={{ fontSize: 11, color: 'var(--tx-3)', fontFamily: 'var(--font-mono)' }}>{a.mins} min</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--tx-1)', lineHeight: 1.4, marginBottom: 10, letterSpacing: '-.01em' }}>
                  {a.title}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {a.tags.map(t => (
                    <span key={t} style={{
                      fontSize: 11, padding: '2px 6px', borderRadius: 3,
                      background: 'var(--bg-4)', color: 'var(--tx-3)', fontFamily: 'var(--font-mono)',
                    }}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--tx-3)' }}>
            <Icon name="search" size={32} style={{ display: 'block', margin: '0 auto 12px', opacity: .2 }} />
            <p style={{ fontSize: 15, marginBottom: 6 }}>No articles match your filters.</p>
            <button onClick={() => { setQuery(''); setTopicFilter('all'); }} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--amber)', fontSize: 13,
            }}>Clear filters</button>
          </div>
        )}
      </div>
    </div>
  );
};

Object.assign(window, { CheatsheetScreen, AIChatScreen, SettingsScreen, DiscoverScreen, applyAppearanceCss });

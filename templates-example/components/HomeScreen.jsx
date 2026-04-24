
const { useState } = React;

const RECENT = [
  { title: 'Docker Networking Deep Dive', topic: 'Docker', color: 'docker', mins: 12, date: 'Apr 18', excerpt: 'Bridge, host, overlay, and macvlan networks explained with real examples. Understand how containers communicate across hosts.', screen: 'article' },
  { title: 'Kubernetes RBAC Patterns for Production', topic: 'Kubernetes', color: 'k8s', mins: 9, date: 'Apr 16', excerpt: 'Service accounts, cluster roles, and binding strategies that keep your k8s cluster secure without blocking your team.', screen: 'article' },
  { title: 'Nginx as a Reverse Proxy: The Complete Guide', topic: 'Nginx', color: 'nginx', mins: 11, date: 'Apr 14', excerpt: 'Upstream blocks, proxy_pass, headers, caching, and health checks — everything you need for a production proxy setup.', screen: 'article' },
  { title: 'PostgreSQL Query Optimization', topic: 'PostgreSQL', color: 'postgres', mins: 15, date: 'Apr 12', excerpt: 'EXPLAIN ANALYZE, index types, partial indexes, and statistics. Stop guessing why your queries are slow.', screen: 'article' },
  { title: 'Git Rebase vs Merge: When to Use Each', topic: 'Git', color: 'git', mins: 7, date: 'Apr 10', excerpt: 'A practical guide to keeping a clean commit history without rewriting shared history or confusing your team.', screen: 'article' },
  { title: 'Linux Systemd Service Units', topic: 'Linux', color: 'linux', mins: 8, date: 'Apr 9', excerpt: 'Write, enable, and troubleshoot systemd service files. Covers dependencies, restart policies, and environment files.', screen: 'article' },
];

const CHEATSHEETS = [
  { title: 'Git Command Reference', topic: 'Git', color: 'git', items: 42 },
  { title: 'Docker CLI Quick Ref', topic: 'Docker', color: 'docker', items: 38 },
  { title: 'kubectl Cheatsheet', topic: 'Kubernetes', color: 'k8s', items: 55 },
  { title: 'Linux Permissions', topic: 'Linux', color: 'linux', items: 24 },
];

const HomeScreen = ({ setScreen }) => {
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 32px' }}>

      {/* Page header */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: 'var(--tx-1)', margin: '0 0 6px', letterSpacing: '-.03em' }}>
          Knowledge Base
        </h1>
        <p style={{ fontSize: 15, color: 'var(--tx-2)', margin: 0 }}>
          Tutorials, docs, and cheatsheets for developers and ops engineers.
        </p>
      </div>

      {/* Topic stack pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 40 }}>
        {TOPICS.map(t => (
          <button key={t.id} onClick={() => setScreen('article')} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '7px 14px', borderRadius: 8,
            background: 'var(--bg-2)', border: '1px solid var(--bd-default)',
            cursor: 'pointer', color: 'var(--tx-2)',
            fontSize: 13.5, fontWeight: 500,
            transition: 'all .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--bd-strong)'; e.currentTarget.style.color = 'var(--tx-1)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bd-default)'; e.currentTarget.style.color = 'var(--tx-2)'; }}
          >
            <Icon name={t.icon} size={14} />
            {t.label}
            <span style={{ fontSize: 11, color: 'var(--tx-3)', fontFamily: 'var(--font-mono)' }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 40, alignItems: 'start' }}>

        {/* Recent articles */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx-2)', margin: 0, textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: 'var(--font-mono)' }}>
              Recent Posts
            </h2>
            <button onClick={() => setScreen('discover')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--amber)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <Icon name="arrowRight" size={13} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {RECENT.map((a, i) => (
              <div key={i}
                onClick={() => setScreen(a.screen)}
                onMouseEnter={() => setHoveredCard(i)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  padding: '16px 18px', borderRadius: 8, cursor: 'pointer',
                  background: hoveredCard === i ? 'var(--bg-2)' : 'transparent',
                  border: '1px solid transparent',
                  borderColor: hoveredCard === i ? 'var(--bd-default)' : 'transparent',
                  transition: 'all .15s',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Tag label={a.topic} color={a.color} small />
                  <span style={{ fontSize: 12, color: 'var(--tx-3)', fontFamily: 'var(--font-mono)' }}>{a.date}</span>
                  <span style={{ fontSize: 12, color: 'var(--tx-3)', fontFamily: 'var(--font-mono)' }}>· {a.mins} min</span>
                </div>
                <div style={{ fontSize: 15.5, fontWeight: 500, color: 'var(--tx-1)', marginBottom: 5, lineHeight: 1.4, letterSpacing: '-.01em' }}>
                  {a.title}
                </div>
                <div style={{ fontSize: 13.5, color: 'var(--tx-2)', lineHeight: 1.55 }}>
                  {a.excerpt}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* Cheatsheets */}
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx-2)', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: 'var(--font-mono)' }}>
              Cheatsheets
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {CHEATSHEETS.map((cs, i) => (
                <div key={i} onClick={() => setScreen('cheatsheet')} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 7,
                  background: 'var(--bg-2)', border: '1px solid var(--bd-default)',
                  cursor: 'pointer', transition: 'border-color .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--bd-strong)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--bd-default)'}
                >
                  <Icon name="list" size={14} style={{ color: 'var(--tx-3)' }} />
                  <span style={{ flex: 1, fontSize: 13.5, color: 'var(--tx-1)', fontWeight: 500 }}>{cs.title}</span>
                  <span style={{ fontSize: 11, color: 'var(--tx-3)', fontFamily: 'var(--font-mono)' }}>{cs.items}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ask AI CTA */}
          <div style={{
            background: 'var(--teal-bg)', border: '1px solid var(--teal-bd)',
            borderRadius: 10, padding: '18px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Icon name="sparkles" size={15} style={{ color: 'var(--teal)' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--teal)' }}>Ask the Knowledge Base</span>
            </div>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--tx-2)', lineHeight: 1.55 }}>
              Ask questions grounded in all articles, tutorials, and docs. Answers include citations to exact sections.
            </p>
            <button onClick={() => setScreen('ai-chat')} style={{
              background: 'var(--teal)', border: 'none', cursor: 'pointer',
              color: '#000', padding: '7px 14px', borderRadius: 6,
              fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5,
            }}>
              Open AI Chat <Icon name="arrowRight" size={13} style={{ color: '#000' }} />
            </button>
          </div>

          {/* Recent tags */}
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx-2)', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: 'var(--font-mono)' }}>
              Tags
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['networking','containers','systemd','rbac','tls','bash','volumes','compose','ingress','replication','hooks','cgroups'].map(tag => (
                <Tag key={tag} label={tag} small />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

Object.assign(window, { HomeScreen });

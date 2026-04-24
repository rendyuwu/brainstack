
const { useState, useEffect, useRef } = React;

const TOC = [
  { id: 'overview', label: 'Overview', depth: 1 },
  { id: 'network-types', label: 'Network Driver Types', depth: 1 },
  { id: 'bridge', label: 'Bridge Networks', depth: 2 },
  { id: 'host', label: 'Host Networking', depth: 2 },
  { id: 'overlay', label: 'Overlay Networks', depth: 2 },
  { id: 'macvlan', label: 'Macvlan & IPvlan', depth: 2 },
  { id: 'dns', label: 'Container DNS Resolution', depth: 1 },
  { id: 'ports', label: 'Port Mapping', depth: 1 },
  { id: 'compose', label: 'Networks in Compose', depth: 1 },
  { id: 'troubleshoot', label: 'Troubleshooting', depth: 1 },
];

const AI_MESSAGES = [
  {
    role: 'user',
    content: 'What is the difference between bridge and overlay networks?',
  },
  {
    role: 'assistant',
    content: `**Bridge networks** are single-host only — containers on the same bridge can communicate directly, but they can't reach containers on a different Docker host without port mapping.`,
    citations: [
      { num: 1, section: 'Bridge Networks', id: 'bridge' },
      { num: 2, section: 'Overlay Networks', id: 'overlay' },
    ],
    extra: `**Overlay networks** span multiple Docker hosts and are required for Docker Swarm or any multi-host container communication. They use VXLAN encapsulation under the hood to tunnel traffic between daemons.`,
  },
];

const ArticleScreen = ({ setScreen }) => {
  const [aiOpen, setAiOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [aiInput, setAiInput] = useState('');
  const [messages, setMessages] = useState(AI_MESSAGES);
  const [typing, setTyping] = useState(false);
  const [viewMode, setViewMode] = useState('article'); // 'article' | 'cheatsheet'
  const chatEndRef = useRef();
  const articleScrollRef = useRef();

  const scrollToSection = (id) => {
    setActiveSection(id);
    const container = articleScrollRef.current;
    if (!container) return;
    const el = container.querySelector('#' + id);
    if (el) {
      container.scrollTop = el.offsetTop - 32;
    }
  };

  const sendMessage = () => {
    if (!aiInput.trim()) return;
    const userMsg = { role: 'user', content: aiInput };
    setMessages(m => [...m, userMsg]);
    setAiInput('');
    setTyping(true);
    setTimeout(() => {
      setMessages(m => [...m, {
        role: 'assistant',
        content: 'Based on this article, port mapping uses the `-p` flag with the format `HOST_PORT:CONTAINER_PORT`.',
        citations: [{ num: 3, section: 'Port Mapping', id: 'ports' }],
      }]);
      setTyping(false);
    }, 1200);
  };

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: '100%' }}>

      {/* TOC sidebar */}
      <div style={{
        width: 200, flexShrink: 0, borderRight: '1px solid var(--bd-subtle)',
        padding: '24px 0', overflowY: 'auto', background: 'var(--bg-1)',
      }} className="toc-sidebar">
        <div style={{ padding: '0 16px 10px', fontSize: 11, color: 'var(--tx-3)', fontFamily: 'var(--font-mono)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
          Contents
        </div>
        {TOC.map(item => (
          <div key={item.id}
            onClick={() => scrollToSection(item.id)}
            style={{
              padding: `5px ${item.depth === 2 ? '16px 5px 24px' : '16px'}`,
              fontSize: item.depth === 2 ? 12.5 : 13,
              color: activeSection === item.id ? 'var(--amber)' : 'var(--tx-2)',
              cursor: 'pointer', lineHeight: 1.4,
              borderLeft: activeSection === item.id ? '2px solid var(--amber)' : '2px solid transparent',
              transition: 'all .1s',
            }}
            onMouseEnter={e => { if (activeSection !== item.id) e.currentTarget.style.color = 'var(--tx-1)'; }}
            onMouseLeave={e => { if (activeSection !== item.id) e.currentTarget.style.color = 'var(--tx-2)'; }}
          >
            {item.label}
          </div>
        ))}
      </div>

      {/* Article content */}
      <div ref={articleScrollRef} style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '32px 48px 80px', maxWidth: aiOpen ? 640 : 760, minWidth: 0 }}>

        {/* Breadcrumb + meta */}
        <Breadcrumb items={[
          { label: 'Docker', onClick: () => {} },
          { label: 'Networking Deep Dive' }
        ]} />

        <div style={{ marginTop: 24, marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Tag label="Docker" color="docker" />
            <Tag label="networking" small />
            <Tag label="containers" small />
          </div>
          <h1 style={{
            fontSize: 28, fontWeight: 600, color: 'var(--tx-1)',
            margin: '0 0 12px', lineHeight: 1.25, letterSpacing: '-.03em',
          }}>
            Docker Networking Deep Dive
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: 'var(--tx-3)' }}>
            <span>Apr 18, 2026</span>
            <span>12 min read</span>
            <span>Updated 2 days ago</span>
          </div>

          {/* View mode toggle */}
          <div style={{ display: 'flex', gap: 6, marginTop: 20 }}>
            {['article','cheatsheet'].map(mode => (
              <button key={mode} onClick={() => mode === 'cheatsheet' ? setScreen('cheatsheet') : setViewMode(mode)} style={{
                padding: '5px 12px', borderRadius: 6,
                background: viewMode === mode ? 'var(--bg-3)' : 'var(--bg-2)',
                border: `1px solid ${viewMode === mode ? 'var(--bd-strong)' : 'var(--bd-default)'}`,
                color: viewMode === mode ? 'var(--tx-1)' : 'var(--tx-2)',
                cursor: 'pointer', fontSize: 12.5, fontWeight: viewMode === mode ? 500 : 400,
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <Icon name={mode === 'article' ? 'book' : 'list'} size={12} />
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
            <button onClick={() => setAiOpen(o => !o)} style={{
              marginLeft: 'auto',
              padding: '5px 12px', borderRadius: 6,
              background: aiOpen ? 'var(--teal-bg)' : 'var(--bg-2)',
              border: `1px solid ${aiOpen ? 'var(--teal-bd)' : 'var(--bd-default)'}`,
              color: aiOpen ? 'var(--teal)' : 'var(--tx-2)',
              cursor: 'pointer', fontSize: 12.5,
              display: 'flex', alignItems: 'center', gap: 5,
              fontWeight: 500,
            }}>
              <Icon name="sparkles" size={12} />
              Ask this post
            </button>
          </div>
        </div>

        {/* Article body */}
        <div style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--tx-1)' }}>

          <h2 id="overview" style={h2Style}>Overview</h2>
          <p>Docker's networking subsystem uses pluggable drivers. When you run a container, Docker connects it to a network automatically. Understanding which driver to use — and when — is fundamental to architecting reliable containerized systems.</p>
          <p>By default, every container gets a virtual Ethernet interface (veth) connected to a Linux bridge (<code style={inlineCode}>docker0</code>). From there, traffic flows through iptables NAT rules to reach the outside world.</p>

          <Callout type="info" title="Prerequisites">
            This guide assumes familiarity with basic Docker commands and Linux networking concepts (IP routing, NAT, DNS).
          </Callout>

          <h2 id="network-types" style={h2Style}>Network Driver Types</h2>
          <p>Docker ships with several built-in network drivers. The right choice depends on whether containers are on a single host or distributed, and how much performance isolation you need.</p>

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Driver</th>
                <th style={thStyle}>Scope</th>
                <th style={thStyle}>Use case</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['bridge', 'Single host', 'Default; isolated container groups'],
                ['host', 'Single host', 'Max performance; no network isolation'],
                ['overlay', 'Multi-host', 'Swarm, cross-daemon communication'],
                ['macvlan', 'Single host', 'Container needs a real MAC address'],
                ['none', 'Single host', 'Disable all networking'],
              ].map(([d,s,u]) => (
                <tr key={d}>
                  <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--syn-keyword)' }}>{d}</td>
                  <td style={tdStyle}>{s}</td>
                  <td style={{ ...tdStyle, color: 'var(--tx-2)' }}>{u}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 id="bridge" style={h2Style}>Bridge Networks</h2>
          <p>The bridge driver is the default. Docker creates a virtual bridge (<code style={inlineCode}>docker0</code>) and assigns a subnet to it. New containers join this bridge unless you specify otherwise.</p>

          <CodeBlock lang="bash" title="bridge · create and inspect"
            code={`# Create a user-defined bridge
docker network create --driver bridge my-net

# Run containers on it
docker run -d --name api --network my-net myimage
docker run -d --name db  --network my-net postgres:16

# Containers resolve each other by name
docker exec api ping db

# Inspect
docker network inspect my-net`} />

          <Callout type="warning" title="Default bridge vs user-defined">
            The default <code style={inlineCode}>docker0</code> bridge does not support automatic DNS resolution between containers. <strong>Always create a user-defined bridge</strong> so containers can reach each other by name.
          </Callout>

          <h2 id="host" style={h2Style}>Host Networking</h2>
          <p>With <code style={inlineCode}>--network host</code>, the container shares the host's network stack directly. There's no NAT, no port mapping — the container binds to host ports as if it were a regular process.</p>

          <CodeBlock lang="bash" title="host · run with host networking"
            code={`docker run --rm --network host nginx
# nginx now binds to 0.0.0.0:80 on the host directly
# No -p flag needed or supported`} />

          <h2 id="overlay" style={h2Style}>Overlay Networks</h2>
          <p>Overlay networks enable containers on different Docker hosts to communicate as if they were on the same LAN. They use VXLAN to encapsulate traffic over UDP (default port 4789).</p>

          <CodeBlock lang="bash" title="overlay · swarm setup"
            code={`# Initialize Swarm on manager node
docker swarm init --advertise-addr 192.168.1.10

# Create an attachable overlay network
docker network create \
  --driver overlay \
  --attachable \
  --subnet 10.10.0.0/16 \
  prod-net

# Deploy a service across nodes
docker service create \
  --name api \
  --network prod-net \
  --replicas 3 \
  myimage:latest`} />

          <h2 id="dns" style={h2Style}>Container DNS Resolution</h2>
          <p>Docker runs an embedded DNS server at <code style={inlineCode}>127.0.0.11</code> for user-defined networks. Containers can resolve each other by service name or container name.</p>

          <CodeBlock lang="bash" title="dns · verify resolution"
            code={`# Check DNS from inside a container
docker exec -it api cat /etc/resolv.conf
# nameserver 127.0.0.11
# options ndots:0

# nslookup another container
docker exec -it api nslookup db
# Server:    127.0.0.11
# Address 1: 127.0.0.11
# Name:      db
# Address 1: 172.18.0.3`} />

          <h2 id="ports" style={h2Style}>Port Mapping</h2>
          <p>The <code style={inlineCode}>-p</code> flag maps a host port to a container port via iptables DNAT rules.</p>

          <CodeBlock lang="bash" title="ports · mapping examples"
            code={`# Map host 8080 → container 80
docker run -p 8080:80 nginx

# Bind only to localhost
docker run -p 127.0.0.1:8080:80 nginx

# Let Docker pick an ephemeral host port
docker run -p 80 nginx
docker port <container_id>  # see what was assigned`} />

          <h2 id="troubleshoot" style={h2Style}>Troubleshooting</h2>

          <CodeBlock lang="bash" title="troubleshoot · network diagnostics"
            code={`# List all networks
docker network ls

# Which containers are on a network?
docker network inspect my-net --format '{{range .Containers}}{{.Name}} {{end}}'

# View iptables rules Docker created
sudo iptables -t nat -L DOCKER -n -v

# Trace route from inside container
docker exec -it mycontainer traceroute 8.8.8.8

# Check bridge interfaces on host
ip link show type bridge
bridge link show`} />

          <Callout type="tip" title="Use nsenter for low-level debugging">
            <code style={inlineCode}>nsenter -t $(docker inspect -f '&#123;&#123;.State.Pid&#125;&#125;' container) -n ip addr</code> enters the container's network namespace from the host — useful when the container has no shell.
          </Callout>

        </div>
      </div>

      {/* AI Side Panel */}
      {aiOpen && (
        <div style={{
          width: 360, flexShrink: 0,
          borderLeft: '1px solid var(--bd-default)',
          background: 'var(--bg-1)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Panel header */}
          <div style={{
            padding: '14px 16px', borderBottom: '1px solid var(--bd-default)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: 6,
              background: 'var(--teal-bg)', border: '1px solid var(--teal-bd)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="sparkles" size={13} style={{ color: 'var(--teal)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--tx-1)' }}>Ask this post</div>
              <div style={{ fontSize: 11, color: 'var(--tx-3)' }}>Answers grounded in this article</div>
            </div>
            <button onClick={() => setAiOpen(false)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--tx-3)', padding: 4,
            }}>
              <Icon name="close" size={14} />
            </button>
          </div>

          {/* Disclaimer */}
          <div style={{
            padding: '8px 14px',
            background: 'var(--amber-bg)', borderBottom: '1px solid var(--amber-bd)',
            fontSize: 11.5, color: 'var(--tx-2)', lineHeight: 1.5,
            display: 'flex', gap: 7, alignItems: 'flex-start',
          }}>
            <Icon name="info" size={12} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 1 }} />
            AI answers are grounded in this article only. Citations link to exact sections.
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Prompt chips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 11.5, color: 'var(--tx-3)', marginBottom: 4 }}>Suggested questions</div>
              {[
                'When should I use overlay vs bridge?',
                'How does Docker DNS work?',
                'How do I expose a container port?',
              ].map(q => (
                <button key={q} onClick={() => setAiInput(q)} style={{
                  textAlign: 'left', padding: '7px 10px', borderRadius: 6,
                  background: 'var(--bg-2)', border: '1px solid var(--bd-default)',
                  color: 'var(--tx-2)', cursor: 'pointer', fontSize: 12.5,
                  transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--bd-strong)'; e.currentTarget.style.color = 'var(--tx-1)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bd-default)'; e.currentTarget.style.color = 'var(--tx-2)'; }}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Chat messages */}
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{
                  fontSize: 11, color: msg.role === 'user' ? 'var(--amber)' : 'var(--teal)',
                  fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.05em',
                }}>
                  {msg.role === 'user' ? 'You' : 'AI'}
                </div>
                <div style={{
                  background: msg.role === 'user' ? 'var(--bg-3)' : 'var(--teal-bg)',
                  border: `1px solid ${msg.role === 'user' ? 'var(--bd-default)' : 'var(--teal-bd)'}`,
                  borderRadius: 8, padding: '10px 12px',
                  fontSize: 13.5, color: 'var(--tx-1)', lineHeight: 1.6,
                }}>
                  <div dangerouslySetInnerHTML={{ __html: msg.content
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/`(.*?)`/g, `<code style="font-family:var(--font-mono);font-size:12px;background:var(--bg-0);padding:1px 5px;border-radius:3px">$1</code>`)
                  }} />
                  {msg.citations && (
                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {msg.citations.map(c => (
                        <CitationPill key={c.num} num={c.num} label={c.section} onClick={() => setActiveSection(c.id)} />
                      ))}
                    </div>
                  )}
                  {msg.extra && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--teal-bd)' }}
                      dangerouslySetInnerHTML={{ __html: msg.extra
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      }}
                    />
                  )}
                </div>
              </div>
            ))}

            {typing && (
              <div style={{
                background: 'var(--teal-bg)', border: '1px solid var(--teal-bd)',
                borderRadius: 8, padding: '10px 12px',
              }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: 'var(--teal)', opacity: 0.6,
                      animation: `pulse 1.2s ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--bd-default)' }}>
            <div style={{
              display: 'flex', gap: 8, alignItems: 'flex-end',
              background: 'var(--bg-0)', border: '1px solid var(--bd-default)',
              borderRadius: 8, padding: '8px 10px',
            }}>
              <textarea
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Ask about this article…"
                rows={1}
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  color: 'var(--tx-1)', fontSize: 13.5, fontFamily: 'var(--font-sans)',
                  resize: 'none', lineHeight: 1.5,
                }}
              />
              <button onClick={sendMessage} style={{
                background: aiInput.trim() ? 'var(--teal)' : 'var(--bg-3)',
                border: 'none', cursor: aiInput.trim() ? 'pointer' : 'default',
                borderRadius: 5, padding: '5px 7px',
                display: 'flex', alignItems: 'center',
                transition: 'background .15s',
              }}>
                <Icon name="send" size={14} style={{ color: aiInput.trim() ? '#000' : 'var(--tx-3)' }} />
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--tx-3)', marginTop: 5, fontFamily: 'var(--font-mono)' }}>
              ↵ send · shift+↵ newline
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const h2Style = {
  fontSize: 20, fontWeight: 600, color: 'var(--tx-1)',
  margin: '36px 0 14px', letterSpacing: '-.02em',
  paddingBottom: 8, borderBottom: '1px solid var(--bd-subtle)',
};
const inlineCode = {
  fontFamily: 'var(--font-mono)', fontSize: '0.88em',
  background: 'var(--bg-2)', padding: '1px 5px',
  borderRadius: 3, border: '1px solid var(--bd-default)',
};
const tableStyle = {
  width: '100%', borderCollapse: 'collapse',
  margin: '20px 0', fontSize: 14,
};
const thStyle = {
  textAlign: 'left', padding: '8px 12px',
  background: 'var(--bg-2)', borderBottom: '1px solid var(--bd-default)',
  color: 'var(--tx-2)', fontWeight: 500, fontSize: 12.5,
  fontFamily: 'var(--font-mono)',
};
const tdStyle = {
  padding: '9px 12px', borderBottom: '1px solid var(--bd-subtle)',
  color: 'var(--tx-1)', verticalAlign: 'top',
};

Object.assign(window, { ArticleScreen });

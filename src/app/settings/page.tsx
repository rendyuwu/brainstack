'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons';
import { useTheme } from '@/components/theme-provider';

interface Model {
  id: string;
  providerId: string;
  modelId: string;
  displayName: string | null;
  supportsChat: boolean;
  supportsResponses: boolean;
  supportsEmbeddings: boolean;
  supportsVision: boolean;
  contextLength: number | null;
}

interface Provider {
  id: string;
  label: string;
  kind: string;
  baseUrl: string;
  enabled: boolean;
  models: Model[];
}

interface AppearanceSettings {
  fontSize: number;
  readingWidth: 'narrow' | 'comfortable' | 'wide';
  codeTheme: string;
}

const CODE_PALETTES: Record<string, { label: string; keyword: string; string: string; comment: string; number: string; type: string; flag: string; fn: string }> = {
  'github-dark': { label: 'GitHub Dark',  keyword: '#ff7b72', string: '#a5d6ff', comment: '#484f58', number: '#f2cc60', type: '#ffa657', flag: '#79c0ff', fn: '#d2a8ff' },
  'dracula':     { label: 'Dracula',      keyword: '#ff79c6', string: '#f1fa8c', comment: '#6272a4', number: '#bd93f9', type: '#ffb86c', flag: '#8be9fd', fn: '#50fa7b' },
  'one-dark':    { label: 'One Dark Pro',  keyword: '#c678dd', string: '#98c379', comment: '#5c6370', number: '#d19a66', type: '#e5c07b', flag: '#61afef', fn: '#56b6c2' },
  'solarized':   { label: 'Solarized',    keyword: '#859900', string: '#2aa198', comment: '#93a1a1', number: '#d33682', type: '#cb4b16', flag: '#268bd2', fn: '#268bd2' },
};

const DEFAULT_APPEARANCE: AppearanceSettings = { fontSize: 15, readingWidth: 'comfortable', codeTheme: 'github-dark' };

const READING_WIDTHS: Record<string, string> = { narrow: '620px', comfortable: '760px', wide: '920px' };

function applyAppearanceCss(s: AppearanceSettings) {
  const root = document.documentElement;
  root.style.setProperty('--prose-size', s.fontSize + 'px');
  root.style.setProperty('--reading-width', READING_WIDTHS[s.readingWidth] ?? '760px');
  const p = CODE_PALETTES[s.codeTheme];
  if (p) {
    root.style.setProperty('--syn-keyword', p.keyword);
    root.style.setProperty('--syn-string', p.string);
    root.style.setProperty('--syn-comment', p.comment);
    root.style.setProperty('--syn-number', p.number);
    root.style.setProperty('--syn-type', p.type);
    root.style.setProperty('--syn-flag', p.flag);
    root.style.setProperty('--syn-function', p.fn);
  }
}

function FormSection({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
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
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, color: 'var(--tx-2)', fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-0)',
  border: '1px solid var(--bd-default)',
  borderRadius: 6,
  padding: '8px 10px',
  color: 'var(--tx-1)',
  fontSize: 13.5,
  fontFamily: 'var(--font-mono)',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box' as const,
};

const TABS = [
  { id: 'ai', label: 'AI Provider', icon: 'sparkles' },
  { id: 'editor', label: 'Editor', icon: 'file' },
  { id: 'appearance', label: 'Appearance', icon: 'sun' },
  { id: 'account', label: 'Account', icon: 'key' },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('ai');

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [providerError, setProviderError] = useState(false);
  const [genModel, setGenModel] = useState('');
  const [embedModel, setEmbedModel] = useState('');

  const [appearance, setAppearance] = useState<AppearanceSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_APPEARANCE;
    try {
      return { ...DEFAULT_APPEARANCE, ...JSON.parse(localStorage.getItem('bs-appearance') || '{}') };
    } catch {
      return DEFAULT_APPEARANCE;
    }
  });

  // Account / password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);

    if (newPassword.length < 8) {
      setPwError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch('/api/account/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPwError(data.error || 'Password change failed');
      } else {
        setPwSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      setPwError('Password change failed');
    } finally {
      setPwLoading(false);
    }
  };

  useEffect(() => {
    applyAppearanceCss(appearance);
  }, []);

  useEffect(() => {
    const savedGen = localStorage.getItem('bs-gen-model');
    const savedEmbed = localStorage.getItem('bs-embed-model');
    if (savedGen) setGenModel(savedGen);
    if (savedEmbed) setEmbedModel(savedEmbed);

    fetch('/api/admin/providers')
      .then(res => {
        if (!res.ok) throw new Error('unauthorized');
        return res.json();
      })
      .then((data: Provider[]) => {
        setProviders(data.filter(p => p.enabled));
        setLoadingProviders(false);
      })
      .catch(() => {
        setProviderError(true);
        setLoadingProviders(false);
      });
  }, []);

  const updateAppearance = (key: keyof AppearanceSettings, val: string | number) => {
    const next = { ...appearance, [key]: val } as AppearanceSettings;
    setAppearance(next);
    localStorage.setItem('bs-appearance', JSON.stringify(next));
    applyAppearanceCss(next);
  };

  const chatModels = providers.flatMap(p =>
    p.models.filter(m => m.supportsChat).map(m => ({ ...m, providerLabel: p.label }))
  );
  const embeddingModels = providers.flatMap(p =>
    p.models.filter(m => m.supportsEmbeddings).map(m => ({ ...m, providerLabel: p.label }))
  );

  const saveGenModel = (modelId: string) => {
    setGenModel(modelId);
    localStorage.setItem('bs-gen-model', modelId);
  };

  const saveEmbedModel = (modelId: string) => {
    setEmbedModel(modelId);
    localStorage.setItem('bs-embed-model', modelId);
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <Link
            href="/"
            style={{
              color: 'var(--tx-3)',
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
            }}
          >
            <Icon name="chevronLeft" size={16} />
          </Link>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--tx-1)', margin: 0, letterSpacing: '-.02em' }}>Settings</h1>
        </div>
        <p style={{ fontSize: 14, color: 'var(--tx-2)', margin: '0 0 28px', paddingLeft: 28 }}>Configure AI providers, editor preferences, and appearance.</p>

        <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--bd-default)', marginBottom: 32 }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer',
              color: activeTab === tab.id ? 'var(--tx-1)' : 'var(--tx-2)',
              fontSize: 14, fontWeight: activeTab === tab.id ? 500 : 400,
              borderBottom: `2px solid ${activeTab === tab.id ? 'var(--amber)' : 'transparent'}`,
              marginBottom: -1, display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all .15s', fontFamily: 'var(--font-sans)',
            }}>
              <Icon name={tab.icon} size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'ai' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {loadingProviders ? (
              <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--tx-3)' }}>
                <Icon name="refresh" size={24} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.4, animation: 'spin 1s linear infinite' }} />
                <p style={{ fontSize: 14 }}>Loading providers...</p>
              </div>
            ) : providerError ? (
              <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--tx-3)' }}>
                <Icon name="shield" size={24} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.25 }} />
                <p style={{ fontSize: 15, marginBottom: 4 }}>Admin access required</p>
                <p style={{ fontSize: 13 }}>Sign in as admin to configure AI providers and models.</p>
              </div>
            ) : (
              <>
                <FormSection title="Generation Model" desc="Model used for drafting, rewriting, and chat responses.">
                  <Field label="Model">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <select
                        value={genModel}
                        onChange={e => saveGenModel(e.target.value)}
                        style={{ ...inputStyle, flex: 1 }}
                      >
                        <option value="">Select a model...</option>
                        {chatModels.map(m => (
                          <option key={m.id} value={m.modelId}>
                            {m.modelId} ({m.providerLabel})
                          </option>
                        ))}
                      </select>
                      {genModel && (() => {
                        const model = chatModels.find(m => m.modelId === genModel);
                        if (!model) return null;
                        const caps: string[] = [];
                        if (model.supportsVision) caps.push('vision');
                        if (model.supportsResponses) caps.push('responses');
                        if (model.contextLength) caps.push(`${Math.round(model.contextLength / 1000)}k ctx`);
                        return (
                          <div style={{ display: 'flex', gap: 5 }}>
                            {caps.map(cap => (
                              <span key={cap} style={{
                                padding: '3px 8px', borderRadius: 4,
                                background: 'var(--bg-3)', border: '1px solid var(--bd-default)',
                                fontSize: 11, color: 'var(--tx-2)', fontFamily: 'var(--font-mono)',
                                whiteSpace: 'nowrap',
                              }}>{cap}</span>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </Field>
                </FormSection>

                <FormSection title="Embedding Model" desc="Model used for generating vector embeddings when publishing content.">
                  <Field label="Model">
                    <select
                      value={embedModel}
                      onChange={e => saveEmbedModel(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="">Select a model...</option>
                      {embeddingModels.map(m => (
                        <option key={m.id} value={m.modelId}>
                          {m.modelId} ({m.providerLabel})
                        </option>
                      ))}
                    </select>
                  </Field>
                </FormSection>

                {chatModels.length === 0 && embeddingModels.length === 0 && (
                  <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--tx-3)', fontSize: 13 }}>
                    No models discovered yet.{' '}
                    <Link href="/admin/ai/providers" style={{ color: 'var(--amber)' }}>
                      Discover models
                    </Link>{' '}
                    from your configured providers.
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'editor' && (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--tx-3)' }}>
            <Icon name="file" size={32} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.25 }} />
            <p style={{ fontSize: 15 }}>Editor settings coming soon.</p>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <FormSection title="Theme" desc="Switch between dark and light mode.">
              <div style={{ display: 'flex', gap: 10 }}>
                {([
                  { id: 'dark' as const, label: 'Dark', bg: '#0d1117', fg: '#e6edf3' },
                  { id: 'light' as const, label: 'Light', bg: '#ffffff', fg: '#1f2328' },
                ]).map(t => (
                  <div key={t.id} onClick={() => setTheme(t.id)}
                    style={{
                      flex: 1, borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
                      border: `2px solid ${theme === t.id ? 'var(--amber)' : 'var(--bd-default)'}`,
                      transition: 'border-color .15s',
                    }}>
                    <div style={{ height: 56, background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 60 }}>
                        <div style={{ height: 5, borderRadius: 2, background: t.fg, opacity: 0.8 }} />
                        <div style={{ height: 5, borderRadius: 2, background: t.fg, opacity: 0.4, width: '70%' }} />
                        <div style={{ height: 5, borderRadius: 2, background: t.fg, opacity: 0.2, width: '50%' }} />
                      </div>
                    </div>
                    <div style={{ padding: '8px', textAlign: 'center', fontSize: 12.5, color: theme === t.id ? 'var(--amber)' : 'var(--tx-2)', fontWeight: theme === t.id ? 600 : 400, background: 'var(--bg-1)' }}>
                      {t.label}
                    </div>
                  </div>
                ))}
              </div>
            </FormSection>

            <FormSection title="Code Syntax Theme" desc="Applies to all code blocks across articles and cheatsheets.">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {Object.entries(CODE_PALETTES).map(([id, palette]) => (
                  <div key={id} onClick={() => updateAppearance('codeTheme', id)}
                    style={{
                      borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                      border: `2px solid ${appearance.codeTheme === id ? 'var(--amber)' : 'var(--bd-default)'}`,
                      transition: 'border-color .15s',
                    }}>
                    <div style={{ background: '#090d12', padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: 1.7 }}>
                      <span style={{ color: palette.keyword }}>const </span>
                      <span style={{ color: palette.fn }}>run </span>
                      <span style={{ color: '#e6edf3' }}>= (</span>
                      <span style={{ color: palette.type }}>cmd</span>
                      <span style={{ color: '#e6edf3' }}>) </span>
                      <span style={{ color: palette.keyword }}>=&gt;</span>
                      <br/>
                      <span style={{ color: palette.comment }}>&nbsp;&nbsp;{'// exec'}</span>
                      <br/>
                      <span style={{ color: palette.string }}>&nbsp;&nbsp;{`\`{cmd}\``}</span>
                    </div>
                    <div style={{ padding: '6px 10px', background: 'var(--bg-1)', fontSize: 12, color: appearance.codeTheme === id ? 'var(--amber)' : 'var(--tx-2)', fontWeight: appearance.codeTheme === id ? 600 : 400, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {palette.label}
                      {appearance.codeTheme === id && <Icon name="check" size={12} style={{ color: 'var(--amber)' }} />}
                    </div>
                  </div>
                ))}
              </div>
            </FormSection>

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

            <FormSection title="Reading Width" desc="Controls the maximum width of article content.">
              <div style={{ display: 'flex', gap: 8 }}>
                {([
                  { id: 'narrow' as const, label: 'Narrow', sub: '620px', bars: 4 },
                  { id: 'comfortable' as const, label: 'Comfortable', sub: '760px', bars: 6 },
                  { id: 'wide' as const, label: 'Wide', sub: '920px', bars: 8 },
                ]).map(w => (
                  <div key={w.id} onClick={() => updateAppearance('readingWidth', w.id)}
                    style={{
                      flex: 1, padding: '12px 10px', borderRadius: 8, textAlign: 'center',
                      cursor: 'pointer',
                      border: `1px solid ${appearance.readingWidth === w.id ? 'var(--amber)' : 'var(--bd-default)'}`,
                      background: appearance.readingWidth === w.id ? 'var(--amber-bg)' : 'var(--bg-1)',
                      transition: 'all .15s',
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginBottom: 8 }}>
                      {Array.from({ length: w.bars }).map((_, i) => (
                        <div key={i} style={{ width: 4, height: 14, borderRadius: 1, background: appearance.readingWidth === w.id ? 'var(--amber)' : 'var(--tx-3)', opacity: i === 0 ? 1 : i < 2 ? 0.7 : 0.4 }} />
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

        {activeTab === 'account' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <FormSection title="Change Password" desc="Update your account password. You must verify your current password first.">
              <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Field label="Current Password">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={e => { setCurrentPassword(e.target.value); setPwError(''); setPwSuccess(false); }}
                    placeholder="Enter current password"
                    required
                    style={inputStyle}
                    autoComplete="current-password"
                  />
                </Field>
                <Field label="New Password">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => { setNewPassword(e.target.value); setPwError(''); setPwSuccess(false); }}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    maxLength={200}
                    style={inputStyle}
                    autoComplete="new-password"
                  />
                </Field>
                <Field label="Confirm New Password">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setPwError(''); setPwSuccess(false); }}
                    placeholder="Re-enter new password"
                    required
                    style={inputStyle}
                    autoComplete="new-password"
                  />
                </Field>

                {pwError && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 8,
                    background: 'rgba(248, 81, 73, 0.1)', border: '1px solid rgba(248, 81, 73, 0.3)',
                    color: '#f85149', fontSize: 13,
                  }}>
                    {pwError}
                  </div>
                )}

                {pwSuccess && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 8,
                    background: 'rgba(63, 185, 80, 0.1)', border: '1px solid rgba(63, 185, 80, 0.3)',
                    color: '#3fb950', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <Icon name="check" size={14} />
                    Password changed successfully
                  </div>
                )}

                <button
                  type="submit"
                  disabled={pwLoading || !currentPassword || !newPassword || !confirmPassword}
                  style={{
                    padding: '10px 20px', borderRadius: 8, border: 'none',
                    background: pwLoading ? 'var(--bg-3)' : 'var(--amber)',
                    color: '#000', fontSize: 14, fontWeight: 600,
                    cursor: pwLoading ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-sans)',
                    alignSelf: 'flex-start',
                    opacity: (!currentPassword || !newPassword || !confirmPassword) ? 0.5 : 1,
                    transition: 'opacity .15s',
                  }}
                >
                  {pwLoading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </FormSection>
          </div>
        )}
      </div>
    </div>
  );
}

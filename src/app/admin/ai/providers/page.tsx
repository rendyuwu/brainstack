'use client';

import { useState, useEffect, useCallback } from 'react';

/* ── Types ─────────────────────────────────────────────── */

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
  apiKeySecretRef: string | null;
  defaultHeaders: Record<string, string> | null;
  discoveryMode: string;
  enabled: boolean;
  models: Model[];
}

type ProviderKind = 'openai_compatible' | 'openrouter' | 'litellm_proxy';
type DiscoveryMode = 'v1-models' | 'openrouter-models' | 'litellm-model-info' | 'static';

interface FormData {
  label: string;
  kind: ProviderKind;
  baseUrl: string;
  apiKeySecretRef: string;
  defaultHeaders: string;
  discoveryMode: DiscoveryMode;
  enabled: boolean;
}

const EMPTY_FORM: FormData = {
  label: '',
  kind: 'openai_compatible',
  baseUrl: '',
  apiKeySecretRef: '',
  defaultHeaders: '',
  discoveryMode: 'v1-models',
  enabled: true,
};

const KIND_OPTIONS: { value: ProviderKind; label: string }[] = [
  { value: 'openai_compatible', label: 'OpenAI Compatible' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'litellm_proxy', label: 'LiteLLM Proxy' },
];

const DISCOVERY_OPTIONS: { value: DiscoveryMode; label: string }[] = [
  { value: 'v1-models', label: '/v1/models' },
  { value: 'openrouter-models', label: 'OpenRouter Models' },
  { value: 'litellm-model-info', label: 'LiteLLM Model Info' },
  { value: 'static', label: 'Static (manual)' },
];

/* ── Styles ────────────────────────────────────────────── */

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

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
};

const btnPrimary: React.CSSProperties = {
  padding: '8px 20px',
  borderRadius: 7,
  background: 'var(--amber)',
  border: 'none',
  cursor: 'pointer',
  color: '#000',
  fontSize: 14,
  fontWeight: 600,
};

const btnSecondary: React.CSSProperties = {
  padding: '7px 14px',
  borderRadius: 6,
  background: 'var(--bg-3)',
  border: '1px solid var(--bd-default)',
  color: 'var(--tx-2)',
  cursor: 'pointer',
  fontSize: 13,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-2)',
  border: '1px solid var(--bd-default)',
  borderRadius: 10,
  overflow: 'hidden',
};

/* ── Badge component ───────────────────────────────────── */

function CapBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      style={{
        padding: '2px 7px',
        borderRadius: 4,
        fontSize: 11,
        fontFamily: 'var(--font-mono)',
        fontWeight: 500,
        background: active ? 'var(--teal-bg)' : 'var(--bg-3)',
        border: `1px solid ${active ? 'var(--teal-bd)' : 'var(--bd-default)'}`,
        color: active ? 'var(--teal)' : 'var(--tx-3)',
      }}
    >
      {label}
    </span>
  );
}

/* ── Spinner ───────────────────────────────────────────── */

function Spinner({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: 'spin 1s linear infinite' }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="31.42"
        strokeDashoffset="10"
      />
    </svg>
  );
}

/* ── Main Page ─────────────────────────────────────────── */

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Per-provider action states
  const [testStates, setTestStates] = useState<
    Record<string, { status: 'idle' | 'testing' | 'ok' | 'fail'; message?: string; count?: number }>
  >({});
  const [discoverStates, setDiscoverStates] = useState<
    Record<string, { status: 'idle' | 'discovering' | 'done' | 'fail'; message?: string; count?: number }>
  >({});

  // ---------- Fetch ----------

  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/providers');
      if (!res.ok) throw new Error('Failed to fetch providers');
      const data = await res.json();
      setProviders(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load providers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  // ---------- Form actions ----------

  function openAddForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError('');
    setFormOpen(true);
  }

  function openEditForm(provider: Provider) {
    setForm({
      label: provider.label,
      kind: provider.kind as ProviderKind,
      baseUrl: provider.baseUrl,
      apiKeySecretRef: provider.apiKeySecretRef ?? '',
      defaultHeaders: provider.defaultHeaders
        ? JSON.stringify(provider.defaultHeaders, null, 2)
        : '',
      discoveryMode: provider.discoveryMode as DiscoveryMode,
      enabled: provider.enabled,
    });
    setEditingId(provider.id);
    setFormError('');
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setFormError('');
  }

  async function handleSave() {
    if (!form.label.trim() || !form.baseUrl.trim()) {
      setFormError('Label and Base URL are required');
      return;
    }

    let headers: Record<string, string> | null = null;
    if (form.defaultHeaders.trim()) {
      try {
        headers = JSON.parse(form.defaultHeaders);
      } catch {
        setFormError('Default headers must be valid JSON');
        return;
      }
    }

    setSaving(true);
    setFormError('');

    try {
      const payload = {
        label: form.label.trim(),
        kind: form.kind,
        baseUrl: form.baseUrl.trim(),
        apiKeySecretRef: form.apiKeySecretRef || null,
        defaultHeaders: headers,
        discoveryMode: form.discoveryMode,
        enabled: form.enabled,
      };

      const url = editingId
        ? `/api/admin/providers/${editingId}`
        : '/api/admin/providers';

      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }

      closeForm();
      fetchProviders();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this provider and all its models?')) return;

    try {
      const res = await fetch(`/api/admin/providers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      fetchProviders();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  // ---------- Test / Discover ----------

  async function handleTest(id: string) {
    setTestStates((s) => ({ ...s, [id]: { status: 'testing' } }));

    try {
      const res = await fetch(`/api/admin/providers/${id}/test`, { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setTestStates((s) => ({
          ...s,
          [id]: { status: 'ok', count: data.modelCount },
        }));
      } else {
        setTestStates((s) => ({
          ...s,
          [id]: { status: 'fail', message: data.error },
        }));
      }
    } catch (err) {
      setTestStates((s) => ({
        ...s,
        [id]: {
          status: 'fail',
          message: err instanceof Error ? err.message : 'Network error',
        },
      }));
    }
  }

  async function handleDiscover(id: string) {
    setDiscoverStates((s) => ({ ...s, [id]: { status: 'discovering' } }));

    try {
      const res = await fetch(`/api/admin/providers/${id}/discover`, {
        method: 'POST',
      });
      const data = await res.json();

      if (data.success) {
        setDiscoverStates((s) => ({
          ...s,
          [id]: { status: 'done', count: data.models?.length ?? 0 },
        }));
        fetchProviders();
      } else {
        setDiscoverStates((s) => ({
          ...s,
          [id]: { status: 'fail', message: data.error },
        }));
      }
    } catch (err) {
      setDiscoverStates((s) => ({
        ...s,
        [id]: {
          status: 'fail',
          message: err instanceof Error ? err.message : 'Network error',
        },
      }));
    }
  }

  // ---------- Render ----------

  if (loading) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 60,
          color: 'var(--tx-3)',
        }}
      >
        <Spinner size={20} />
        <span style={{ marginLeft: 10, fontSize: 14 }}>Loading providers...</span>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 28,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: 'var(--tx-1)',
                margin: '0 0 4px',
                letterSpacing: '-.02em',
              }}
            >
              AI Providers
            </h1>
            <p style={{ fontSize: 14, color: 'var(--tx-2)', margin: 0 }}>
              Manage OpenAI-compatible providers and their available models.
            </p>
          </div>
          <button onClick={openAddForm} style={btnPrimary}>
            + Add Provider
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              marginBottom: 20,
              background: 'rgba(248,81,73,.1)',
              border: '1px solid rgba(248,81,73,.3)',
              borderRadius: 8,
              color: 'var(--red)',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {/* Provider form modal */}
        {formOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,.65)',
              zIndex: 400,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
              padding: 20,
            }}
            onClick={closeForm}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: 520,
                background: 'var(--bg-2)',
                border: '1px solid var(--bd-strong)',
                borderRadius: 14,
                overflow: 'hidden',
                boxShadow: 'var(--shadow-lg)',
                animation: 'fadeIn .18s ease',
              }}
            >
              {/* Modal header */}
              <div
                style={{
                  padding: '18px 20px 14px',
                  borderBottom: '1px solid var(--bd-default)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: 'var(--tx-1)',
                    }}
                  >
                    {editingId ? 'Edit Provider' : 'Add Provider'}
                  </div>
                  <div
                    style={{ fontSize: 12.5, color: 'var(--tx-3)', marginTop: 2 }}
                  >
                    {editingId
                      ? 'Update provider configuration'
                      : 'Connect a new AI provider endpoint'}
                  </div>
                </div>
                <button
                  onClick={closeForm}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--tx-3)',
                    padding: 4,
                    fontSize: 18,
                    lineHeight: 1,
                  }}
                >
                  &times;
                </button>
              </div>

              {/* Modal body */}
              <div
                style={{
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  maxHeight: '70vh',
                  overflowY: 'auto',
                }}
              >
                {formError && (
                  <div
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(248,81,73,.1)',
                      border: '1px solid rgba(248,81,73,.3)',
                      borderRadius: 6,
                      color: 'var(--red)',
                      fontSize: 12.5,
                    }}
                  >
                    {formError}
                  </div>
                )}

                {/* Label */}
                <div>
                  <label
                    style={{
                      fontSize: 13,
                      color: 'var(--tx-2)',
                      fontWeight: 500,
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    Provider Label
                  </label>
                  <input
                    value={form.label}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, label: e.target.value }))
                    }
                    placeholder="e.g. OpenAI Production"
                    style={inputStyle}
                  />
                </div>

                {/* Kind */}
                <div>
                  <label
                    style={{
                      fontSize: 13,
                      color: 'var(--tx-2)',
                      fontWeight: 500,
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    Provider Kind
                  </label>
                  <select
                    value={form.kind}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        kind: e.target.value as ProviderKind,
                      }))
                    }
                    style={selectStyle}
                  >
                    {KIND_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Base URL */}
                <div>
                  <label
                    style={{
                      fontSize: 13,
                      color: 'var(--tx-2)',
                      fontWeight: 500,
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    Base URL
                  </label>
                  <input
                    value={form.baseUrl}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, baseUrl: e.target.value }))
                    }
                    placeholder="https://api.openai.com/v1"
                    spellCheck={false}
                    style={inputStyle}
                  />
                </div>

                {/* API Key */}
                <div>
                  <label
                    style={{
                      fontSize: 13,
                      color: 'var(--tx-2)',
                      fontWeight: 500,
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    API Key
                  </label>
                  <input
                    value={form.apiKeySecretRef}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        apiKeySecretRef: e.target.value,
                      }))
                    }
                    type="password"
                    placeholder="sk-..."
                    spellCheck={false}
                    style={inputStyle}
                  />
                </div>

                {/* Default Headers */}
                <div>
                  <label
                    style={{
                      fontSize: 13,
                      color: 'var(--tx-2)',
                      fontWeight: 500,
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    Default Headers{' '}
                    <span style={{ color: 'var(--tx-3)', fontWeight: 400 }}>
                      (optional JSON)
                    </span>
                  </label>
                  <textarea
                    value={form.defaultHeaders}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        defaultHeaders: e.target.value,
                      }))
                    }
                    rows={3}
                    placeholder='{"X-Custom-Header": "value"}'
                    spellCheck={false}
                    style={{
                      ...inputStyle,
                      resize: 'vertical',
                      minHeight: 60,
                    }}
                  />
                </div>

                {/* Discovery Mode */}
                <div>
                  <label
                    style={{
                      fontSize: 13,
                      color: 'var(--tx-2)',
                      fontWeight: 500,
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    Discovery Mode
                  </label>
                  <select
                    value={form.discoveryMode}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        discoveryMode: e.target.value as DiscoveryMode,
                      }))
                    }
                    style={selectStyle}
                  >
                    {DISCOVERY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Enabled Toggle */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, enabled: !f.enabled }))
                    }
                    style={{
                      width: 40,
                      height: 22,
                      borderRadius: 11,
                      border: 'none',
                      cursor: 'pointer',
                      background: form.enabled
                        ? 'var(--green)'
                        : 'var(--bg-4)',
                      position: 'relative',
                      transition: 'background .2s',
                    }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: '#fff',
                        position: 'absolute',
                        top: 3,
                        left: form.enabled ? 21 : 3,
                        transition: 'left .2s',
                      }}
                    />
                  </button>
                  <span
                    style={{
                      fontSize: 13,
                      color: 'var(--tx-2)',
                    }}
                  >
                    Enabled
                  </span>
                </div>
              </div>

              {/* Modal footer */}
              <div
                style={{
                  padding: '14px 20px',
                  borderTop: '1px solid var(--bd-default)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 8,
                }}
              >
                <button onClick={closeForm} style={btnSecondary}>
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    ...btnPrimary,
                    opacity: saving ? 0.7 : 1,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {saving && <Spinner size={13} />}
                  {editingId ? 'Update' : 'Create'} Provider
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Provider list */}
        {providers.length === 0 && !error ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 0',
              color: 'var(--tx-3)',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: 'var(--teal-bg)',
                border: '1px solid var(--teal-bd)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: 24,
              }}
            >
              &loz;
            </div>
            <p style={{ fontSize: 15, marginBottom: 6, color: 'var(--tx-2)' }}>
              No AI providers configured yet.
            </p>
            <p style={{ fontSize: 13, color: 'var(--tx-3)', marginBottom: 20 }}>
              Add an OpenAI-compatible endpoint to get started.
            </p>
            <button onClick={openAddForm} style={btnPrimary}>
              + Add First Provider
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {providers.map((provider) => {
              const ts = testStates[provider.id] ?? { status: 'idle' };
              const ds = discoverStates[provider.id] ?? { status: 'idle' };

              return (
                <div key={provider.id} style={cardStyle}>
                  {/* Provider header */}
                  <div
                    style={{
                      padding: '16px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      borderBottom: '1px solid var(--bd-default)',
                    }}
                  >
                    {/* Status dot */}
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: provider.enabled
                          ? 'var(--green)'
                          : 'var(--tx-3)',
                        flexShrink: 0,
                      }}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 2,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 15,
                            fontWeight: 600,
                            color: 'var(--tx-1)',
                          }}
                        >
                          {provider.label}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            padding: '2px 7px',
                            borderRadius: 4,
                            background: 'var(--teal-bg)',
                            border: '1px solid var(--teal-bd)',
                            color: 'var(--teal)',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 500,
                          }}
                        >
                          {provider.kind}
                        </span>
                        {!provider.enabled && (
                          <span
                            style={{
                              fontSize: 11,
                              padding: '2px 7px',
                              borderRadius: 4,
                              background: 'var(--bg-3)',
                              color: 'var(--tx-3)',
                              fontFamily: 'var(--font-mono)',
                            }}
                          >
                            disabled
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 12.5,
                          color: 'var(--tx-3)',
                          fontFamily: 'var(--font-mono)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {provider.baseUrl}
                      </div>
                    </div>

                    {/* Actions */}
                    <div
                      style={{ display: 'flex', gap: 6, flexShrink: 0 }}
                    >
                      <button
                        onClick={() => handleTest(provider.id)}
                        disabled={ts.status === 'testing'}
                        style={{
                          ...btnSecondary,
                          opacity: ts.status === 'testing' ? 0.7 : 1,
                        }}
                      >
                        {ts.status === 'testing' ? (
                          <>
                            <Spinner size={13} /> Testing...
                          </>
                        ) : (
                          'Test Connection'
                        )}
                      </button>
                      <button
                        onClick={() => handleDiscover(provider.id)}
                        disabled={ds.status === 'discovering'}
                        style={{
                          ...btnSecondary,
                          opacity: ds.status === 'discovering' ? 0.7 : 1,
                        }}
                      >
                        {ds.status === 'discovering' ? (
                          <>
                            <Spinner size={13} /> Discovering...
                          </>
                        ) : (
                          'Discover Models'
                        )}
                      </button>
                      <button
                        onClick={() => openEditForm(provider)}
                        style={btnSecondary}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(provider.id)}
                        style={{
                          ...btnSecondary,
                          color: 'var(--red)',
                          borderColor: 'rgba(248,81,73,.3)',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Test / Discover result banners */}
                  {ts.status === 'ok' && (
                    <div
                      style={{
                        padding: '8px 18px',
                        background: 'rgba(63,185,80,.08)',
                        borderBottom: '1px solid rgba(63,185,80,.2)',
                        fontSize: 13,
                        color: 'var(--green)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>Connected</span>
                      <span style={{ color: 'var(--tx-3)' }}>
                        {ts.count} model{ts.count !== 1 ? 's' : ''} available
                      </span>
                    </div>
                  )}
                  {ts.status === 'fail' && (
                    <div
                      style={{
                        padding: '8px 18px',
                        background: 'rgba(248,81,73,.08)',
                        borderBottom: '1px solid rgba(248,81,73,.2)',
                        fontSize: 13,
                        color: 'var(--red)',
                      }}
                    >
                      Connection failed: {ts.message}
                    </div>
                  )}
                  {ds.status === 'done' && (
                    <div
                      style={{
                        padding: '8px 18px',
                        background: 'var(--teal-bg)',
                        borderBottom: '1px solid var(--teal-bd)',
                        fontSize: 13,
                        color: 'var(--teal)',
                      }}
                    >
                      Discovered {ds.count} model{ds.count !== 1 ? 's' : ''}
                    </div>
                  )}
                  {ds.status === 'fail' && (
                    <div
                      style={{
                        padding: '8px 18px',
                        background: 'rgba(248,81,73,.08)',
                        borderBottom: '1px solid rgba(248,81,73,.2)',
                        fontSize: 13,
                        color: 'var(--red)',
                      }}
                    >
                      Discovery failed: {ds.message}
                    </div>
                  )}

                  {/* Models list */}
                  {provider.models.length > 0 ? (
                    <div>
                      <div
                        style={{
                          padding: '8px 18px',
                          background: 'var(--bg-1)',
                          borderBottom: '1px solid var(--bd-default)',
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'var(--tx-3)',
                          fontFamily: 'var(--font-mono)',
                          letterSpacing: '.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Models ({provider.models.length})
                      </div>
                      {provider.models.map((model, idx) => (
                        <div
                          key={model.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 18px',
                            borderBottom:
                              idx < provider.models.length - 1
                                ? '1px solid var(--bd-subtle)'
                                : 'none',
                          }}
                        >
                          <span
                            style={{
                              flex: 1,
                              fontSize: 13,
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--tx-1)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {model.modelId}
                          </span>
                          <div
                            style={{
                              display: 'flex',
                              gap: 5,
                              flexShrink: 0,
                            }}
                          >
                            <CapBadge
                              label="chat"
                              active={model.supportsChat}
                            />
                            <CapBadge
                              label="responses"
                              active={model.supportsResponses}
                            />
                            <CapBadge
                              label="embeddings"
                              active={model.supportsEmbeddings}
                            />
                            <CapBadge
                              label="vision"
                              active={model.supportsVision}
                            />
                            {model.contextLength && (
                              <span
                                style={{
                                  padding: '2px 7px',
                                  borderRadius: 4,
                                  fontSize: 11,
                                  fontFamily: 'var(--font-mono)',
                                  fontWeight: 500,
                                  background: 'var(--bg-3)',
                                  border: '1px solid var(--bd-default)',
                                  color: 'var(--tx-2)',
                                }}
                              >
                                {Math.round(model.contextLength / 1000)}k ctx
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '20px 18px',
                        textAlign: 'center',
                        color: 'var(--tx-3)',
                        fontSize: 13,
                      }}
                    >
                      No models discovered yet. Click &quot;Discover Models&quot;
                      to fetch available models.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

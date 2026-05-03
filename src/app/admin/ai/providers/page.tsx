'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './page.module.css';

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

  // Add model form state
  const [addModelOpen, setAddModelOpen] = useState<Record<string, boolean>>({});
  const [addModelForm, setAddModelForm] = useState<Record<string, {
    modelId: string;
    supportsChat: boolean;
    supportsEmbeddings: boolean;
    supportsVision: boolean;
    supportsResponses: boolean;
  }>>({});
  const [addModelStates, setAddModelStates] = useState<
    Record<string, { status: 'idle' | 'saving' | 'testing' | 'ok' | 'fail'; message?: string }>
  >({});

  // Embedding sync state
  const [embeddingStats, setEmbeddingStats] = useState<{
    totalChunks: number;
    embeddedChunks: number;
    loading: boolean;
  }>({ totalChunks: 0, embeddedChunks: 0, loading: true });
  const [syncState, setSyncState] = useState<{
    status: 'idle' | 'syncing' | 'resetting' | 'done' | 'fail';
    processed: number;
    total: number;
    errors: number;
    message?: string;
  }>({ status: 'idle', processed: 0, total: 0, errors: 0 });

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
    fetchEmbeddingStats();
  }, [fetchProviders]);

  // ---------- Embedding stats ----------

  async function fetchEmbeddingStats() {
    try {
      setEmbeddingStats(s => ({ ...s, loading: true }));
      const res = await fetch('/api/admin/embeddings/stats');
      if (res.ok) {
        const data = await res.json();
        setEmbeddingStats({ totalChunks: data.totalChunks, embeddedChunks: data.embeddedChunks, loading: false });
      } else {
        setEmbeddingStats(s => ({ ...s, loading: false }));
      }
    } catch {
      setEmbeddingStats(s => ({ ...s, loading: false }));
    }
  }

  async function handleEmbeddingAction(action: 'sync' | 'reset') {
    const statusKey = action === 'sync' ? 'syncing' : 'resetting';
    setSyncState({ status: statusKey, processed: 0, total: 0, errors: 0 });

    try {
      const res = await fetch(`/api/admin/embeddings/${action}`, { method: 'POST' });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        setSyncState({ status: 'fail', processed: 0, total: 0, errors: 0, message: err.error });
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setSyncState({ status: 'fail', processed: 0, total: 0, errors: 0, message: 'No response body' });
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const progress = JSON.parse(line);
            setSyncState({
              status: progress.done ? 'done' : statusKey,
              processed: progress.processed,
              total: progress.total,
              errors: progress.errors,
            });
          } catch {}
        }
      }

      fetchEmbeddingStats();
    } catch (err) {
      setSyncState({
        status: 'fail',
        processed: 0,
        total: 0,
        errors: 0,
        message: err instanceof Error ? err.message : 'Network error',
      });
    }
  }

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

  function openAddModel(providerId: string) {
    setAddModelOpen(s => ({ ...s, [providerId]: true }));
    setAddModelForm(s => ({
      ...s,
      [providerId]: { modelId: '', supportsChat: true, supportsEmbeddings: false, supportsVision: false, supportsResponses: false },
    }));
    setAddModelStates(s => ({ ...s, [providerId]: { status: 'idle' } }));
  }

  function closeAddModel(providerId: string) {
    setAddModelOpen(s => ({ ...s, [providerId]: false }));
    setAddModelStates(s => ({ ...s, [providerId]: { status: 'idle' } }));
  }

  function updateAddModelForm(providerId: string, field: string, value: string | boolean) {
    setAddModelForm(s => ({
      ...s,
      [providerId]: { ...s[providerId], [field]: value },
    }));
  }

  async function handleAddModel(providerId: string, test: boolean) {
    const formData = addModelForm[providerId];
    if (!formData?.modelId.trim()) return;

    setAddModelStates(s => ({ ...s, [providerId]: { status: test ? 'testing' : 'saving' } }));

    try {
      const res = await fetch(`/api/admin/providers/${providerId}/models`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, test }),
      });
      const data = await res.json();

      if (data.success) {
        setAddModelStates(s => ({ ...s, [providerId]: { status: 'ok', message: `Model "${formData.modelId}" added` } }));
        setAddModelForm(s => ({
          ...s,
          [providerId]: { modelId: '', supportsChat: true, supportsEmbeddings: false, supportsVision: false, supportsResponses: false },
        }));
        fetchProviders();
      } else {
        setAddModelStates(s => ({ ...s, [providerId]: { status: 'fail', message: data.error } }));
      }
    } catch (err) {
      setAddModelStates(s => ({
        ...s,
        [providerId]: { status: 'fail', message: err instanceof Error ? err.message : 'Network error' },
      }));
    }
  }

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
    <div className={styles.pageContent}>
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
                    <div className={styles.providerActions}>
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
                        onClick={() => addModelOpen[provider.id] ? closeAddModel(provider.id) : openAddModel(provider.id)}
                        style={btnSecondary}
                      >
                        + Add Model
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

                  {/* Add Model inline form */}
                  {addModelOpen[provider.id] && (() => {
                    const mf = addModelForm[provider.id];
                    const ms = addModelStates[provider.id] ?? { status: 'idle' };
                    if (!mf) return null;
                    return (
                      <div
                        ref={el => el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })}
                        style={{
                          padding: '14px 18px',
                          borderBottom: '1px solid var(--bd-default)',
                          background: 'var(--bg-1)',
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx-2)', marginBottom: 10 }}>
                          Add Model Manually
                        </div>

                        {ms.status === 'ok' && (
                          <div style={{
                            padding: '6px 12px', marginBottom: 10, borderRadius: 6,
                            background: 'rgba(63,185,80,.08)', border: '1px solid rgba(63,185,80,.2)',
                            fontSize: 12.5, color: 'var(--green)',
                          }}>
                            {ms.message}
                          </div>
                        )}
                        {ms.status === 'fail' && (
                          <div style={{
                            padding: '6px 12px', marginBottom: 10, borderRadius: 6,
                            background: 'rgba(248,81,73,.08)', border: '1px solid rgba(248,81,73,.2)',
                            fontSize: 12.5, color: 'var(--red)',
                          }}>
                            {ms.message}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                          <input
                            value={mf.modelId}
                            onChange={e => updateAddModelForm(provider.id, 'modelId', e.target.value)}
                            placeholder="e.g. gpt-4o-mini, claude-3-5-sonnet"
                            spellCheck={false}
                            style={{ ...inputStyle, flex: 1 }}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                          {([
                            { key: 'supportsChat', label: 'Chat' },
                            { key: 'supportsEmbeddings', label: 'Embeddings' },
                            { key: 'supportsVision', label: 'Vision' },
                            { key: 'supportsResponses', label: 'Responses' },
                          ] as const).map(cap => (
                            <label key={cap.key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--tx-2)', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={mf[cap.key]}
                                onChange={e => updateAddModelForm(provider.id, cap.key, e.target.checked)}
                                style={{ accentColor: 'var(--teal)' }}
                              />
                              {cap.label}
                            </label>
                          ))}
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => handleAddModel(provider.id, true)}
                            disabled={!mf.modelId.trim() || ms.status === 'testing' || ms.status === 'saving'}
                            style={{
                              ...btnPrimary,
                              fontSize: 13,
                              padding: '7px 14px',
                              opacity: !mf.modelId.trim() || ms.status === 'testing' || ms.status === 'saving' ? 0.6 : 1,
                              cursor: !mf.modelId.trim() || ms.status === 'testing' || ms.status === 'saving' ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            {ms.status === 'testing' && <Spinner size={12} />}
                            Test &amp; Add
                          </button>
                          <button
                            onClick={() => handleAddModel(provider.id, false)}
                            disabled={!mf.modelId.trim() || ms.status === 'testing' || ms.status === 'saving'}
                            style={{
                              ...btnSecondary,
                              opacity: !mf.modelId.trim() || ms.status === 'testing' || ms.status === 'saving' ? 0.6 : 1,
                              cursor: !mf.modelId.trim() || ms.status === 'testing' || ms.status === 'saving' ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {ms.status === 'saving' && <Spinner size={12} />}
                            Add Without Test
                          </button>
                          <button
                            onClick={() => closeAddModel(provider.id)}
                            style={{ ...btnSecondary, marginLeft: 'auto' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    );
                  })()}

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
                      to fetch available models, or &quot;Add Model&quot; to enter one manually.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Embedding Sync Section */}
        <div style={{ marginTop: 36 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: 'var(--tx-1)',
                  margin: '0 0 4px',
                  letterSpacing: '-.02em',
                }}
              >
                Embeddings
              </h2>
              <p style={{ fontSize: 13, color: 'var(--tx-3)', margin: 0 }}>
                Vector embeddings for RAG search. Sync missing or reset all.
              </p>
            </div>
          </div>

          <div style={cardStyle}>
            {/* Stats */}
            <div
              style={{
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                borderBottom: '1px solid var(--bd-default)',
              }}
            >
              {embeddingStats.loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--tx-3)', fontSize: 13 }}>
                  <Spinner size={14} /> Loading stats...
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: 'var(--tx-2)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--tx-1)', fontSize: 20 }}>
                      {embeddingStats.totalChunks}
                    </span>{' '}
                    chunks
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--tx-2)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--green)', fontSize: 20 }}>
                      {embeddingStats.embeddedChunks}
                    </span>{' '}
                    embedded
                  </div>
                  {embeddingStats.totalChunks - embeddingStats.embeddedChunks > 0 && (
                    <div style={{ fontSize: 13, color: 'var(--tx-2)' }}>
                      <span style={{ fontWeight: 600, color: 'var(--amber)', fontSize: 20 }}>
                        {embeddingStats.totalChunks - embeddingStats.embeddedChunks}
                      </span>{' '}
                      missing
                    </div>
                  )}
                </>
              )}

              <div style={{ flex: 1 }} />

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleEmbeddingAction('sync')}
                  disabled={syncState.status === 'syncing' || syncState.status === 'resetting'}
                  style={{
                    ...btnPrimary,
                    fontSize: 13,
                    padding: '7px 14px',
                    opacity: syncState.status === 'syncing' || syncState.status === 'resetting' ? 0.6 : 1,
                    cursor: syncState.status === 'syncing' || syncState.status === 'resetting' ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {syncState.status === 'syncing' && <Spinner size={13} />}
                  Sync Missing
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete all embeddings and re-embed? This may take a while.')) {
                      handleEmbeddingAction('reset');
                    }
                  }}
                  disabled={syncState.status === 'syncing' || syncState.status === 'resetting'}
                  style={{
                    ...btnSecondary,
                    opacity: syncState.status === 'syncing' || syncState.status === 'resetting' ? 0.6 : 1,
                    cursor: syncState.status === 'syncing' || syncState.status === 'resetting' ? 'not-allowed' : 'pointer',
                  }}
                >
                  {syncState.status === 'resetting' && <Spinner size={13} />}
                  Reset &amp; Re-embed
                </button>
              </div>
            </div>

            {/* Progress */}
            {(syncState.status === 'syncing' || syncState.status === 'resetting' || syncState.status === 'done') && (
              <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--bd-default)' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 8,
                    fontSize: 13,
                    color: syncState.status === 'done' ? 'var(--green)' : 'var(--tx-2)',
                  }}
                >
                  {syncState.status !== 'done' && <Spinner size={13} />}
                  <span style={{ fontWeight: 500 }}>
                    {syncState.status === 'done'
                      ? `Done — ${syncState.processed} embedded`
                      : `Embedding ${syncState.processed} / ${syncState.total}...`}
                  </span>
                  {syncState.errors > 0 && (
                    <span style={{ color: 'var(--red)' }}>
                      ({syncState.errors} error{syncState.errors !== 1 ? 's' : ''})
                    </span>
                  )}
                </div>
                {syncState.total > 0 && (
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      background: 'var(--bg-3)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        borderRadius: 3,
                        background: syncState.errors > 0 ? 'var(--amber)' : 'var(--green)',
                        width: `${Math.round((syncState.processed / syncState.total) * 100)}%`,
                        transition: 'width .3s ease',
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {syncState.status === 'fail' && (
              <div
                style={{
                  padding: '10px 18px',
                  background: 'rgba(248,81,73,.08)',
                  borderBottom: '1px solid rgba(248,81,73,.2)',
                  fontSize: 13,
                  color: 'var(--red)',
                }}
              >
                Failed: {syncState.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

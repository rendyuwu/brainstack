import { db } from '@/db';
import { aiUsageLogs, aiProviders } from '@/db/schema';
import { desc, sql, eq } from 'drizzle-orm';
import styles from './page.module.css';

interface UsageRow {
  id: string;
  providerId: string | null;
  modelId: string | null;
  endpoint: string;
  inputTokens: number | null;
  outputTokens: number | null;
  durationMs: number | null;
  userId: string | null;
  createdAt: string;
  providerLabel: string | null;
}

interface EndpointStat {
  endpoint: string;
  count: number;
  totalInput: number;
  totalOutput: number;
}

interface ProviderStat {
  providerLabel: string;
  count: number;
  totalInput: number;
  totalOutput: number;
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-2)',
  border: '1px solid var(--bd-default)',
  borderRadius: 10,
  overflow: 'hidden',
};

const thStyle: React.CSSProperties = {
  padding: '8px 14px',
  textAlign: 'left' as const,
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--tx-3)',
  fontFamily: 'var(--font-mono)',
  letterSpacing: '.04em',
  textTransform: 'uppercase' as const,
  borderBottom: '1px solid var(--bd-default)',
  background: 'var(--bg-1)',
};

const tdStyle: React.CSSProperties = {
  padding: '8px 14px',
  fontSize: 13,
  fontFamily: 'var(--font-mono)',
  color: 'var(--tx-1)',
  borderBottom: '1px solid var(--bd-subtle)',
};

export default async function UsagePage() {
  const recentLogs = await db
    .select({
      id: aiUsageLogs.id,
      providerId: aiUsageLogs.providerId,
      modelId: aiUsageLogs.modelId,
      endpoint: aiUsageLogs.endpoint,
      inputTokens: aiUsageLogs.inputTokens,
      outputTokens: aiUsageLogs.outputTokens,
      durationMs: aiUsageLogs.durationMs,
      userId: aiUsageLogs.userId,
      createdAt: aiUsageLogs.createdAt,
      providerLabel: aiProviders.label,
    })
    .from(aiUsageLogs)
    .leftJoin(aiProviders, eq(aiUsageLogs.providerId, aiProviders.id))
    .orderBy(desc(aiUsageLogs.createdAt))
    .limit(100) as UsageRow[];

  const endpointStats = await db
    .select({
      endpoint: aiUsageLogs.endpoint,
      count: sql<number>`count(*)::int`,
      totalInput: sql<number>`coalesce(sum(${aiUsageLogs.inputTokens}), 0)::int`,
      totalOutput: sql<number>`coalesce(sum(${aiUsageLogs.outputTokens}), 0)::int`,
    })
    .from(aiUsageLogs)
    .groupBy(aiUsageLogs.endpoint) as EndpointStat[];

  const providerStats = await db
    .select({
      providerLabel: sql<string>`coalesce(${aiProviders.label}, 'unknown')`,
      count: sql<number>`count(*)::int`,
      totalInput: sql<number>`coalesce(sum(${aiUsageLogs.inputTokens}), 0)::int`,
      totalOutput: sql<number>`coalesce(sum(${aiUsageLogs.outputTokens}), 0)::int`,
    })
    .from(aiUsageLogs)
    .leftJoin(aiProviders, eq(aiUsageLogs.providerId, aiProviders.id))
    .groupBy(aiProviders.label) as ProviderStat[];

  const totalCalls = endpointStats.reduce((s, e) => s + e.count, 0);
  const totalInput = endpointStats.reduce((s, e) => s + e.totalInput, 0);
  const totalOutput = endpointStats.reduce((s, e) => s + e.totalOutput, 0);

  return (
    <div className={styles.pageContent}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: 'var(--tx-1)',
              margin: '0 0 4px',
              letterSpacing: '-.02em',
            }}
          >
            AI Usage
          </h1>
          <p style={{ fontSize: 14, color: 'var(--tx-2)', margin: 0 }}>
            Token usage and cost tracking across all AI endpoints.
          </p>
        </div>

        {/* Summary stats */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
          <div className={styles.statCard}>
            <div style={{ fontSize: 12, color: 'var(--tx-3)', fontWeight: 500, marginBottom: 4 }}>
              Total Calls
            </div>
            <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>
              {totalCalls.toLocaleString()}
            </div>
          </div>
          <div className={styles.statCard}>
            <div style={{ fontSize: 12, color: 'var(--tx-3)', fontWeight: 500, marginBottom: 4 }}>
              Input Tokens
            </div>
            <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--teal)', fontFamily: 'var(--font-mono)' }}>
              {totalInput.toLocaleString()}
            </div>
          </div>
          <div className={styles.statCard}>
            <div style={{ fontSize: 12, color: 'var(--tx-3)', fontWeight: 500, marginBottom: 4 }}>
              Output Tokens
            </div>
            <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--teal)', fontFamily: 'var(--font-mono)' }}>
              {totalOutput.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Breakdown tables */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
          {/* By endpoint */}
          <div className={styles.breakdownCard}>
            <div
              style={{
                padding: '12px 18px',
                borderBottom: '1px solid var(--bd-default)',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--tx-1)',
              }}
            >
              By Endpoint
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Endpoint</th>
                  <th style={thStyle}>Calls</th>
                  <th style={thStyle}>In Tokens</th>
                  <th style={thStyle}>Out Tokens</th>
                </tr>
              </thead>
              <tbody>
                {endpointStats.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: 'var(--tx-3)' }}>
                      No usage data yet
                    </td>
                  </tr>
                ) : (
                  endpointStats.map((row) => (
                    <tr key={row.endpoint}>
                      <td style={tdStyle}>
                        <span
                          style={{
                            padding: '2px 7px',
                            borderRadius: 4,
                            fontSize: 11,
                            background: 'var(--teal-bg)',
                            border: '1px solid var(--teal-bd)',
                            color: 'var(--teal)',
                            fontWeight: 500,
                          }}
                        >
                          {row.endpoint}
                        </span>
                      </td>
                      <td style={tdStyle}>{row.count.toLocaleString()}</td>
                      <td style={tdStyle}>{row.totalInput.toLocaleString()}</td>
                      <td style={tdStyle}>{row.totalOutput.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* By provider */}
          <div className={styles.breakdownCard}>
            <div
              style={{
                padding: '12px 18px',
                borderBottom: '1px solid var(--bd-default)',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--tx-1)',
              }}
            >
              By Provider
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Provider</th>
                  <th style={thStyle}>Calls</th>
                  <th style={thStyle}>In Tokens</th>
                  <th style={thStyle}>Out Tokens</th>
                </tr>
              </thead>
              <tbody>
                {providerStats.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: 'var(--tx-3)' }}>
                      No usage data yet
                    </td>
                  </tr>
                ) : (
                  providerStats.map((row) => (
                    <tr key={row.providerLabel}>
                      <td style={tdStyle}>{row.providerLabel}</td>
                      <td style={tdStyle}>{row.count.toLocaleString()}</td>
                      <td style={tdStyle}>{row.totalInput.toLocaleString()}</td>
                      <td style={tdStyle}>{row.totalOutput.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent logs table */}
        <div style={cardStyle}>
          <div
            style={{
              padding: '12px 18px',
              borderBottom: '1px solid var(--bd-default)',
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--tx-1)',
            }}
          >
            Recent Logs (last 100)
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Time</th>
                  <th style={thStyle}>Endpoint</th>
                  <th style={thStyle}>Provider</th>
                  <th style={thStyle}>Model</th>
                  <th style={thStyle}>In</th>
                  <th style={thStyle}>Out</th>
                  <th style={thStyle}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: 'var(--tx-3)', padding: 30 }}>
                      No AI usage logged yet. Logs appear here as AI endpoints are called.
                    </td>
                  </tr>
                ) : (
                  recentLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ ...tdStyle, fontSize: 12, whiteSpace: 'nowrap' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            padding: '2px 7px',
                            borderRadius: 4,
                            fontSize: 11,
                            background: 'var(--teal-bg)',
                            border: '1px solid var(--teal-bd)',
                            color: 'var(--teal)',
                            fontWeight: 500,
                          }}
                        >
                          {log.endpoint}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: 'var(--tx-2)' }}>
                        {log.providerLabel ?? '—'}
                      </td>
                      <td style={{ ...tdStyle, fontSize: 12 }}>
                        {log.modelId ?? '—'}
                      </td>
                      <td style={tdStyle}>
                        {log.inputTokens != null ? log.inputTokens.toLocaleString() : '—'}
                      </td>
                      <td style={tdStyle}>
                        {log.outputTokens != null ? log.outputTokens.toLocaleString() : '—'}
                      </td>
                      <td style={{ ...tdStyle, color: 'var(--tx-2)' }}>
                        {log.durationMs != null ? `${log.durationMs}ms` : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

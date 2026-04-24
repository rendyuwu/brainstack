import type { Metadata } from 'next';
import { Icon } from '@/components/icons';
import { AskPageClient } from './ask-client';

export const metadata: Metadata = {
  title: 'Ask the Knowledge Base — BrainStack',
  description: 'Chat with Noa, the AI assistant, about anything in the BrainStack knowledge base.',
};

const SUGGESTED_QUESTIONS = [
  'How do I set up a Docker multi-stage build?',
  'What are the best practices for Kubernetes secrets?',
  'Explain nginx reverse proxy configuration',
  'How to configure PostgreSQL replication?',
  'What is a Git rebase vs merge?',
  'How do I monitor containers with Prometheus?',
];

export default function AskPage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'hidden',
        height: '100%',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '24px 32px 0',
          borderBottom: '1px solid var(--bd-subtle)',
          background: 'var(--bg-1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 6,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--teal-bg)',
              border: '1px solid var(--teal-bd)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="sparkles" size={18} style={{ color: 'var(--teal)' }} />
          </div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: 'var(--tx-1)',
              margin: 0,
              letterSpacing: '-.02em',
            }}
          >
            Ask the Knowledge Base
          </h1>
        </div>
        <p
          style={{
            fontSize: 13,
            color: 'var(--tx-3)',
            margin: '0 0 16px',
            paddingLeft: 42,
          }}
        >
          Chat with Noa about DevOps, cloud, and infrastructure topics across all articles.
        </p>
      </div>

      {/* Chat area */}
      <AskPageClient suggestedQuestions={SUGGESTED_QUESTIONS} />
    </div>
  );
}

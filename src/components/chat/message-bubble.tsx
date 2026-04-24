'use client';

import { Icon } from '@/components/icons';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

function renderContent(text: string) {
  // Simple markdown-like rendering for assistant messages
  // Handle **bold**, `code`, and ```code blocks```
  const parts: React.ReactNode[] = [];
  const lines = text.split('\n');
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  lines.forEach((line, lineIdx) => {
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        parts.push(
          <pre
            key={`code-${lineIdx}`}
            style={{
              background: 'var(--bg-3)',
              border: '1px solid var(--bd-default)',
              borderRadius: 6,
              padding: '12px 16px',
              margin: '8px 0',
              overflow: 'auto',
              fontSize: 13,
              fontFamily: 'var(--font-mono)',
              lineHeight: 1.5,
            }}
          >
            <code>{codeBlockContent.join('\n')}</code>
          </pre>
        );
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }

    // Process inline formatting
    const processedLine = processInlineFormatting(line, lineIdx);
    parts.push(
      <div key={`line-${lineIdx}`} style={{ minHeight: line.trim() ? undefined : '0.75em' }}>
        {processedLine}
      </div>
    );
  });

  return parts;
}

function processInlineFormatting(line: string, lineIdx: number): React.ReactNode {
  // Handle **bold** and `inline code`
  const regex = /(\*\*(.+?)\*\*|`([^`]+)`)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(line)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(line.slice(lastIndex, match.index));
    }

    if (match[2]) {
      // Bold
      parts.push(
        <strong key={`bold-${lineIdx}-${match.index}`}>{match[2]}</strong>
      );
    } else if (match[3]) {
      // Inline code
      parts.push(
        <code
          key={`code-${lineIdx}-${match.index}`}
          style={{
            background: 'var(--bg-3)',
            padding: '1px 5px',
            borderRadius: 3,
            fontSize: '0.9em',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {match[3]}
        </code>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex));
  }

  return parts.length > 0 ? parts : line;
}

function TypingIndicator() {
  return (
    <span style={{ display: 'inline-flex', gap: 4, padding: '4px 0' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--teal)',
            animation: `pulse 1.4s infinite ${i * 0.2}s`,
          }}
        />
      ))}
    </span>
  );
}

export function MessageBubble({
  role,
  content,
  isStreaming,
}: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        gap: 10,
        marginBottom: 16,
        animation: 'fadeIn .2s ease',
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'var(--teal-bg)',
            border: '1px solid var(--teal-bd)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          <Icon name="sparkles" size={14} style={{ color: 'var(--teal)' }} />
        </div>
      )}

      <div
        style={{
          maxWidth: '80%',
          padding: '10px 14px',
          borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
          background: isUser ? 'var(--bg-3)' : 'var(--bg-2)',
          border: `1px solid ${isUser ? 'var(--bd-strong)' : 'var(--bd-default)'}`,
          fontSize: 14,
          lineHeight: 1.6,
          color: 'var(--tx-1)',
        }}
      >
        {isUser ? (
          content
        ) : content ? (
          renderContent(content)
        ) : isStreaming ? (
          <TypingIndicator />
        ) : null}
      </div>
    </div>
  );
}

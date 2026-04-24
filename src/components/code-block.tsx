'use client';

import { useState } from 'react';
import { Icon } from './icons';

interface CodeBlockProps {
  code: string;
  lang?: string;
  title?: string;
  collapsed?: boolean;
}

function highlight(src: string): string {
  return src
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/(#[^\n]*)/g, '<span class="syn-comment">$1</span>')
    .replace(
      /\b(docker|kubectl|nginx|git|sudo|apt|yum|systemctl|curl|wget|echo|export|cd|ls|mkdir|rm|cp|mv|cat|grep|awk|sed|ps|top|kill|ssh|scp|tar|chmod|chown)\b/g,
      '<span class="syn-keyword">$1</span>'
    )
    .replace(/(["'`])([^"'`]*)\1/g, '<span class="syn-string">$1$2$1</span>')
    .replace(/\b(\d+(\.\d+)*)\b/g, '<span class="syn-number">$1</span>')
    .replace(/(\$\w+|--[\w-]+|-[\w])/g, '<span class="syn-flag">$1</span>')
    .replace(
      /\b(FROM|RUN|CMD|EXPOSE|ENV|ADD|COPY|ENTRYPOINT|VOLUME|WORKDIR|ARG|LABEL|USER|ONBUILD)\b/g,
      '<span class="syn-type">$1</span>'
    );
}

export function CodeBlock({ code, lang = 'bash', title, collapsed: initCollapsed = false }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(initCollapsed);

  const copy = () => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        background: 'var(--bg-0)',
        border: '1px solid var(--bd-default)',
        borderRadius: '8px',
        overflow: 'hidden',
        margin: '20px 0',
        fontSize: '13.5px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          borderBottom: '1px solid var(--bd-subtle)',
          background: 'var(--bg-1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="terminal" size={13} style={{ color: 'var(--tx-3)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--tx-2)' }}>
            {title || lang}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setCollapsed((c) => !c)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--tx-3)',
              padding: '2px 6px',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
            }}
          >
            <Icon name="collapse" size={12} />
          </button>
          <button
            onClick={copy}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: copied ? 'var(--green)' : 'var(--tx-3)',
              padding: '2px 6px',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              transition: 'color .2s',
            }}
          >
            <Icon name={copied ? 'check' : 'copy'} size={12} />
            <span style={{ fontFamily: 'var(--font-mono)' }}>{copied ? 'copied' : 'copy'}</span>
          </button>
        </div>
      </div>
      {!collapsed && (
        <pre
          style={{
            margin: 0,
            padding: '16px 18px',
            overflowX: 'auto',
            fontFamily: 'var(--font-mono)',
            lineHeight: 1.65,
            color: 'var(--tx-1)',
            fontSize: '13px',
          }}
        >
          <code dangerouslySetInnerHTML={{ __html: highlight(code) }} />
        </pre>
      )}
      {collapsed && (
        <div
          onClick={() => setCollapsed(false)}
          style={{
            padding: '8px 18px',
            color: 'var(--tx-3)',
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Icon name="chevronRight" size={12} /> {code.split('\n').length} lines hidden — click to expand
        </div>
      )}
    </div>
  );
}

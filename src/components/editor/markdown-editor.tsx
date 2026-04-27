'use client';

import { useRef, useCallback, useEffect } from 'react';
import PreviewPane from './preview-pane';

interface MarkdownEditorProps {
  title: string;
  onTitleChange: (title: string) => void;
  content: string;
  onContentChange: (content: string) => void;
  preview: boolean;
  onPreviewToggle: () => void;
}

export default function MarkdownEditor({
  title,
  onTitleChange,
  content,
  onContentChange,
  preview,
  onPreviewToggle,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize title textarea
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
    }
  }, [title]);

  // Auto-resize content textarea
  useEffect(() => {
    if (textareaRef.current && !preview) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content, preview]);

  const insertFormatting = useCallback(
    (before: string, after: string = '') => {
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const sel = content.slice(start, end) || 'text';
      const newContent =
        content.slice(0, start) + before + sel + after + content.slice(end);
      onContentChange(newContent);
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(
          start + before.length,
          start + before.length + sel.length
        );
      }, 0);
    },
    [content, onContentChange]
  );

  const toolbarButtons = [
    { label: 'H2', action: () => insertFormatting('## ') },
    { label: 'H3', action: () => insertFormatting('### ') },
    {
      label: 'B',
      action: () => insertFormatting('**', '**'),
      bold: true,
    },
    {
      label: 'I',
      action: () => insertFormatting('_', '_'),
      italic: true,
    },
    {
      label: '`',
      action: () => insertFormatting('`', '`'),
      mono: true,
    },
    {
      label: '```',
      action: () => insertFormatting('\n```bash\n', '\n```\n'),
      mono: true,
    },
    { label: '—', action: () => insertFormatting('\n---\n') },
  ];

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minWidth: 0,
      }}
    >
      {/* Formatting toolbar */}
      <div
        style={{
          padding: '6px 32px',
          borderBottom: '1px solid var(--bd-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexShrink: 0,
          background: 'var(--bg-1)',
        }}
      >
        {!preview &&
          toolbarButtons.map((btn, i) => (
            <button
              key={i}
              onClick={btn.action}
              style={{
                padding: '3px 8px',
                borderRadius: 4,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--tx-2)',
                fontSize: btn.mono ? 12 : 13,
                fontFamily: btn.mono
                  ? 'var(--font-mono)'
                  : 'var(--font-sans)',
                fontWeight: btn.bold ? 700 : btn.italic ? 400 : 500,
                fontStyle: btn.italic ? 'italic' : 'normal',
                transition: 'background .1s',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = 'var(--bg-3)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = 'none')
              }
              title={btn.label}
            >
              {btn.label}
            </button>
          ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={onPreviewToggle}
          style={{
            padding: '4px 10px',
            borderRadius: 5,
            background: preview ? 'var(--bg-3)' : 'none',
            border: `1px solid ${preview ? 'var(--bd-strong)' : 'transparent'}`,
            color: preview ? 'var(--tx-1)' : 'var(--tx-3)',
            cursor: 'pointer',
            fontSize: 12.5,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            transition: 'all .15s',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {preview ? 'Edit' : 'Preview'}
        </button>
      </div>

      {/* Title + content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 32px 80px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <textarea
            ref={titleRef}
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Post title..."
            rows={1}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--tx-1)',
              fontSize: 28,
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              resize: 'none',
              lineHeight: 1.25,
              letterSpacing: '-.03em',
              marginBottom: 8,
              borderBottom: title
                ? 'none'
                : '1px dashed var(--bd-default)',
              paddingBottom: 8,
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
            }}
          />

          {!content && !preview && (
            <div
              style={{
                padding: '40px 0',
                textAlign: 'center',
                color: 'var(--tx-3)',
                borderTop: '1px dashed var(--bd-subtle)',
              }}
            >
              <p style={{ fontSize: 15, marginBottom: 6 }}>
                Start writing, or use the AI panel to draft from an idea.
              </p>
              <p style={{ fontSize: 13 }}>
                Type{' '}
                <kbd
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    padding: '2px 5px',
                    background: 'var(--bg-2)',
                    border: '1px solid var(--bd-default)',
                    borderRadius: 3,
                  }}
                >
                  /
                </kbd>{' '}
                for slash commands
              </p>
            </div>
          )}

          {!preview && (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                outline: 'none',
                color: 'var(--tx-1)',
                fontSize: 15,
                lineHeight: 1.75,
                fontFamily: 'var(--font-mono)',
                resize: 'none',
                minHeight: 400,
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
          )}

          {preview && <PreviewPane content={content} />}
        </div>
      </div>
    </div>
  );
}

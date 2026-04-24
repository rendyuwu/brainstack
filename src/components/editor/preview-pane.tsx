'use client';

export function renderMarkdown(md: string): string {
  return md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Code blocks
    .replace(
      /```[\w]*\n([\s\S]*?)```/g,
      '<pre style="background:var(--bg-0);border:1px solid var(--bd-default);border-radius:8px;padding:14px 16px;overflow-x:auto;margin:16px 0;font-family:var(--font-mono);font-size:13px;line-height:1.65">$1</pre>'
    )
    // Inline code
    .replace(
      /`([^`]+)`/g,
      '<code style="font-family:var(--font-mono);font-size:.88em;background:var(--bg-2);padding:1px 5px;border-radius:3px;border:1px solid var(--bd-default)">$1</code>'
    )
    // Headings
    .replace(
      /^## (.+)$/gm,
      '<h2 style="font-size:20px;font-weight:600;color:var(--tx-1);margin:32px 0 12px;padding-bottom:8px;border-bottom:1px solid var(--bd-subtle);letter-spacing:-.02em">$1</h2>'
    )
    .replace(
      /^### (.+)$/gm,
      '<h3 style="font-size:17px;font-weight:600;color:var(--tx-1);margin:24px 0 8px;letter-spacing:-.01em">$1</h3>'
    )
    // Bold / italic
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    // HR
    .replace(
      /^---$/gm,
      '<hr style="border:none;border-top:1px solid var(--bd-default);margin:24px 0">'
    )
    // Lists
    .replace(/^- (.+)$/gm, '<li style="margin-bottom:4px">$1</li>')
    .replace(
      /(<li.*<\/li>\n?)+/g,
      '<ul style="padding-left:20px;margin:12px 0;color:var(--tx-1)">$&</ul>'
    )
    // Paragraphs
    .replace(
      /^(?!<[a-z]).+$/gm,
      '<p style="margin:0 0 14px;color:var(--tx-1)">$&</p>'
    );
}

interface PreviewPaneProps {
  content: string;
}

export default function PreviewPane({ content }: PreviewPaneProps) {
  if (!content) {
    return (
      <div
        style={{
          padding: '40px 0',
          textAlign: 'center',
          color: 'var(--tx-3)',
        }}
      >
        <p style={{ fontSize: 15 }}>Nothing to preview yet.</p>
      </div>
    );
  }

  return (
    <div
      style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--tx-1)' }}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
}

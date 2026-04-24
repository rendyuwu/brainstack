import type { MDXComponents } from 'mdx/types';
import { CodeBlock } from './code-block';
import { Callout } from './callout';

function makeHeading(level: number) {
  const sizes: Record<number, React.CSSProperties> = {
    1: { fontSize: 28, fontWeight: 600, margin: '0 0 16px', letterSpacing: '-.03em' },
    2: {
      fontSize: 20,
      fontWeight: 600,
      margin: '36px 0 14px',
      letterSpacing: '-.02em',
      paddingBottom: 8,
      borderBottom: '1px solid var(--bd-subtle)',
    },
    3: { fontSize: 17, fontWeight: 600, margin: '28px 0 10px' },
    4: { fontSize: 15, fontWeight: 600, margin: '24px 0 8px' },
    5: { fontSize: 14, fontWeight: 600, margin: '20px 0 6px' },
    6: { fontSize: 13, fontWeight: 600, margin: '16px 0 6px', textTransform: 'uppercase' as const },
  };

  return function Heading({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    const text = typeof children === 'string' ? children : '';
    const id =
      props.id ??
      text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const style: React.CSSProperties = {
      color: 'var(--tx-1)',
      lineHeight: 1.3,
      ...sizes[level],
    };

    switch (level) {
      case 1: return <h1 id={id} style={style} {...props}>{children}</h1>;
      case 2: return <h2 id={id} style={style} {...props}>{children}</h2>;
      case 3: return <h3 id={id} style={style} {...props}>{children}</h3>;
      case 4: return <h4 id={id} style={style} {...props}>{children}</h4>;
      case 5: return <h5 id={id} style={style} {...props}>{children}</h5>;
      default: return <h6 id={id} style={style} {...props}>{children}</h6>;
    }
  };
}

const inlineCodeStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.88em',
  background: 'var(--bg-2)',
  padding: '1px 5px',
  borderRadius: 3,
  border: '1px solid var(--bd-default)',
};

export const mdxComponents: MDXComponents = {
  h1: makeHeading(1),
  h2: makeHeading(2),
  h3: makeHeading(3),
  h4: makeHeading(4),
  h5: makeHeading(5),
  h6: makeHeading(6),
  p: ({ children, ...props }) => (
    <p style={{ margin: '12px 0', lineHeight: 1.75, color: 'var(--tx-1)' }} {...props}>
      {children}
    </p>
  ),
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      style={{ color: 'var(--blue)', textDecoration: 'underline', textUnderlineOffset: 3 }}
      {...props}
    >
      {children}
    </a>
  ),
  ul: ({ children, ...props }) => (
    <ul style={{ margin: '12px 0', paddingLeft: 24 }} {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol style={{ margin: '12px 0', paddingLeft: 24 }} {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li style={{ margin: '4px 0', lineHeight: 1.65 }} {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      style={{
        margin: '16px 0',
        padding: '8px 16px',
        borderLeft: '3px solid var(--amber)',
        background: 'var(--amber-bg)',
        color: 'var(--tx-2)',
      }}
      {...props}
    >
      {children}
    </blockquote>
  ),
  code: ({ children, className, ...props }) => {
    const lang = className?.replace('language-', '') ?? '';
    const content = typeof children === 'string' ? children : '';

    // Multi-line code gets a CodeBlock
    if (lang || content.includes('\n')) {
      return <CodeBlock code={content.replace(/\n$/, '')} lang={lang || 'bash'} />;
    }

    // Inline code
    return (
      <code style={inlineCodeStyle} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => {
    // pre wrapping code blocks — pass through since code component handles it
    return <>{children}</>;
  },
  table: ({ children, ...props }) => (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        margin: '20px 0',
        fontSize: 14,
      }}
      {...props}
    >
      {children}
    </table>
  ),
  th: ({ children, ...props }) => (
    <th
      style={{
        textAlign: 'left',
        padding: '8px 12px',
        background: 'var(--bg-2)',
        borderBottom: '1px solid var(--bd-default)',
        color: 'var(--tx-2)',
        fontWeight: 500,
        fontSize: 12.5,
        fontFamily: 'var(--font-mono)',
      }}
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td
      style={{
        padding: '9px 12px',
        borderBottom: '1px solid var(--bd-subtle)',
        color: 'var(--tx-1)',
        verticalAlign: 'top',
      }}
      {...props}
    >
      {children}
    </td>
  ),
  hr: () => (
    <hr
      style={{
        border: 'none',
        borderTop: '1px solid var(--bd-default)',
        margin: '32px 0',
      }}
    />
  ),
  strong: ({ children, ...props }) => (
    <strong style={{ fontWeight: 600, color: 'var(--tx-1)' }} {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em style={{ fontStyle: 'italic' }} {...props}>
      {children}
    </em>
  ),
  img: ({ src, alt, ...props }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt ?? ''}
      style={{
        maxWidth: '100%',
        borderRadius: 8,
        border: '1px solid var(--bd-default)',
        margin: '16px 0',
      }}
      {...props}
    />
  ),
  // Custom components that can be used in MDX
  Callout,
  CodeBlock,
};

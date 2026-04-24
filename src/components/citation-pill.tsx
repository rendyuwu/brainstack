interface CitationPillProps {
  num: number;
  label: string;
  onClick?: () => void;
}

export function CitationPill({ num, label, onClick }: CitationPillProps) {
  return (
    <span
      onClick={onClick}
      title={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        padding: '1px 6px',
        borderRadius: 4,
        background: 'var(--teal-bg)',
        border: '1px solid var(--teal-bd)',
        color: 'var(--teal)',
        fontSize: 11,
        fontFamily: 'var(--font-mono)',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'background .15s',
        verticalAlign: 'middle',
        marginLeft: 2,
      }}
    >
      [{num}]
    </span>
  );
}

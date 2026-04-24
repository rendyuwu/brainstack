import Link from 'next/link';
import { Icon } from './icons';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--tx-3)' }}>
      {items.map((item, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {i > 0 && <Icon name="chevronRight" size={12} style={{ opacity: 0.4 }} />}
          {item.href ? (
            <Link
              href={item.href}
              style={{ color: 'var(--tx-2)', cursor: 'pointer', textDecoration: 'none' }}
            >
              {item.label}
            </Link>
          ) : (
            <span
              style={{
                color: i === items.length - 1 ? 'var(--tx-2)' : 'var(--tx-3)',
              }}
            >
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

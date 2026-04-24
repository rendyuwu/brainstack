'use client';

import { useState } from 'react';

interface Heading {
  id: string;
  label: string;
  depth: number;
}

export function ArticleTOC({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState(headings[0]?.id ?? '');

  const scrollToSection = (id: string) => {
    setActive(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div>
      {headings.map((item) => (
        <div
          key={item.id}
          onClick={() => scrollToSection(item.id)}
          style={{
            padding: item.depth >= 2 ? '5px 16px 5px 24px' : '5px 16px',
            fontSize: item.depth >= 2 ? 12.5 : 13,
            color: active === item.id ? 'var(--amber)' : 'var(--tx-2)',
            cursor: 'pointer',
            lineHeight: 1.4,
            borderLeft:
              active === item.id
                ? '2px solid var(--amber)'
                : '2px solid transparent',
            transition: 'all .1s',
          }}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}

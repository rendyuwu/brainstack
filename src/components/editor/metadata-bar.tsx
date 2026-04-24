'use client';

import { useState, useEffect, useRef } from 'react';

interface Collection {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
}

interface MetadataBarProps {
  collectionId: string;
  onCollectionChange: (id: string) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  pageType: string;
  onPageTypeChange: (type: string) => void;
}

const PAGE_TYPES = [
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'tip', label: 'Tip' },
  { value: 'cheatsheet', label: 'Cheatsheet' },
  { value: 'note', label: 'Note' },
];

export default function MetadataBar({
  collectionId,
  onCollectionChange,
  tags,
  onTagsChange,
  pageType,
  onPageTypeChange,
}: MetadataBarProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [typeOpen, setTypeOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/collections')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCollections(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
      if (typeRef.current && !typeRef.current.contains(e.target as Node)) {
        setTypeOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = collections.find((c) => c.id === collectionId);
  const selectedType = PAGE_TYPES.find((t) => t.value === pageType);

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/,$/g, '');
      if (newTag && !tags.includes(newTag)) {
        onTagsChange([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    onTagsChange(tags.filter((t) => t !== tag));
  };

  return (
    <div
      style={{
        padding: '12px 32px',
        borderBottom: '1px solid var(--bd-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexShrink: 0,
        background: 'var(--bg-1)',
        flexWrap: 'wrap',
      }}
    >
      {/* Stack / Collection Picker */}
      <div ref={pickerRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setPickerOpen((o) => !o)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '5px 10px',
            borderRadius: 6,
            background: 'var(--bg-0)',
            border: `1px solid ${pickerOpen ? 'var(--bd-strong)' : 'var(--bd-default)'}`,
            color: selected ? 'var(--tx-1)' : 'var(--tx-3)',
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all .15s',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {selected ? selected.name : 'Select stack...'}
          <span
            style={{
              fontSize: 10,
              color: 'var(--tx-3)',
              marginLeft: 2,
            }}
          >
            &#9662;
          </span>
        </button>

        {pickerOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              zIndex: 300,
              background: 'var(--bg-2)',
              border: '1px solid var(--bd-strong)',
              borderRadius: 10,
              overflow: 'hidden',
              minWidth: 210,
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <div
              style={{
                padding: '6px 8px',
                borderBottom: '1px solid var(--bd-subtle)',
                fontSize: 11,
                color: 'var(--tx-3)',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '.06em',
                textTransform: 'uppercase',
              }}
            >
              Topic Stack
            </div>
            {/* None option */}
            <div
              onClick={() => {
                onCollectionChange('');
                setPickerOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '8px 12px',
                cursor: 'pointer',
                background: !collectionId ? 'var(--bg-3)' : 'transparent',
                transition: 'background .1s',
                fontSize: 13.5,
                color: 'var(--tx-2)',
                fontStyle: 'italic',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = 'var(--bg-3)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background =
                  !collectionId ? 'var(--bg-3)' : 'transparent')
              }
            >
              None
            </div>
            {collections.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  onCollectionChange(c.id);
                  setPickerOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '8px 12px',
                  cursor: 'pointer',
                  background:
                    collectionId === c.id ? 'var(--bg-3)' : 'transparent',
                  transition: 'background .1s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'var(--bg-3)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    collectionId === c.id ? 'var(--bg-3)' : 'transparent')
                }
              >
                <span
                  style={{ flex: 1, fontSize: 13.5, color: 'var(--tx-1)' }}
                >
                  {c.name}
                </span>
                {collectionId === c.id && (
                  <span style={{ color: 'var(--amber)', fontSize: 14 }}>
                    &#10003;
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Page type selector */}
      <div ref={typeRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setTypeOpen((o) => !o)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '5px 10px',
            borderRadius: 6,
            background: 'var(--bg-0)',
            border: `1px solid ${typeOpen ? 'var(--bd-strong)' : 'var(--bd-default)'}`,
            color: 'var(--tx-2)',
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all .15s',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {selectedType?.label || 'Type'}
          <span style={{ fontSize: 10, color: 'var(--tx-3)', marginLeft: 2 }}>
            &#9662;
          </span>
        </button>

        {typeOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              zIndex: 300,
              background: 'var(--bg-2)',
              border: '1px solid var(--bd-strong)',
              borderRadius: 10,
              overflow: 'hidden',
              minWidth: 150,
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {PAGE_TYPES.map((t) => (
              <div
                key={t.value}
                onClick={() => {
                  onPageTypeChange(t.value);
                  setTypeOpen(false);
                }}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: 13.5,
                  color: 'var(--tx-1)',
                  background:
                    pageType === t.value ? 'var(--bg-3)' : 'transparent',
                  transition: 'background .1s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'var(--bg-3)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    pageType === t.value ? 'var(--bg-3)' : 'transparent')
                }
              >
                {t.label}
                {pageType === t.value && (
                  <span
                    style={{
                      color: 'var(--amber)',
                      marginLeft: 8,
                      fontSize: 14,
                    }}
                  >
                    &#10003;
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tags */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flex: 1,
          flexWrap: 'wrap',
        }}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 8px',
              borderRadius: 4,
              background: 'var(--bg-3)',
              border: '1px solid var(--bd-default)',
              fontSize: 12,
              color: 'var(--tx-2)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {tag}
            <span
              onClick={() => removeTag(tag)}
              style={{ cursor: 'pointer', color: 'var(--tx-3)', lineHeight: 1 }}
            >
              x
            </span>
          </span>
        ))}
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={addTag}
          placeholder="Add tag..."
          style={{
            background: 'none',
            border: 'none',
            outline: 'none',
            color: 'var(--tx-1)',
            fontSize: 13,
            fontFamily: 'var(--font-mono)',
            width: 90,
            minWidth: 60,
          }}
        />
      </div>
    </div>
  );
}

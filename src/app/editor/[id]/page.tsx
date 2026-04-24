'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import MarkdownEditor from '@/components/editor/markdown-editor';
import MetadataBar from '@/components/editor/metadata-bar';
import AIAssistPanel from '@/components/editor/ai-assist-panel';

interface PageData {
  id: string;
  title: string;
  mdxSource: string | null;
  summary: string | null;
  type: string;
  collectionId: string | null;
  status: string;
  tags: string[];
}

export default function EditEditorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [pageType, setPageType] = useState('tutorial');
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [loading, setLoading] = useState(true);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  // Load page data
  useEffect(() => {
    async function loadPage() {
      try {
        const res = await fetch(`/api/pages/${id}`);
        if (!res.ok) {
          router.push('/');
          return;
        }
        const data: PageData = await res.json();
        setTitle(data.title || '');
        setContent(data.mdxSource || '');
        setCollectionId(data.collectionId || '');
        setTags(data.tags || []);
        setPageType(data.type || 'tutorial');
      } catch {
        router.push('/');
      } finally {
        setLoading(false);
      }
    }
    loadPage();
  }, [id, router]);

  const saveDraft = useCallback(async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/pages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          mdx_source: content,
          summary: '',
          type: pageType,
          collection_id: collectionId || null,
        }),
      });
      await fetch(`/api/pages/${id}/tags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  }, [title, content, pageType, collectionId, tags, id]);

  const publish = useCallback(async () => {
    if (!title.trim()) return;
    setPublishing(true);
    try {
      // Update first
      await fetch(`/api/pages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          mdx_source: content,
          summary: '',
          type: pageType,
          collection_id: collectionId || null,
        }),
      });
      await fetch(`/api/pages/${id}/tags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags }),
      });
      // Publish
      await fetch(`/api/pages/${id}/publish`, { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Publish error:', error);
    } finally {
      setPublishing(false);
    }
  }, [title, content, pageType, collectionId, tags, id, router]);

  if (loading) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--tx-3)',
          fontSize: 14,
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      {/* Editor top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 20px',
          borderBottom: '1px solid var(--bd-default)',
          background: 'var(--bg-1)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--tx-3)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 13,
            fontFamily: 'var(--font-sans)',
          }}
        >
          &#8592; Back
        </button>
        <div style={{ flex: 1 }} />
        <span
          style={{
            fontSize: 12,
            color: 'var(--tx-3)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {wordCount > 0 ? `${wordCount} words` : 'No content'}
        </span>
        <button
          onClick={saveDraft}
          disabled={saving || !title.trim()}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            background: 'var(--bg-3)',
            border: '1px solid var(--bd-default)',
            color: saved ? 'var(--green)' : 'var(--tx-2)',
            cursor: saving || !title.trim() ? 'default' : 'pointer',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            transition: 'color .2s',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {saved ? 'Saved' : saving ? 'Saving...' : 'Save draft'}
        </button>
        <button
          onClick={publish}
          disabled={publishing || !title.trim() || !content.trim()}
          style={{
            padding: '6px 16px',
            borderRadius: 6,
            background:
              title.trim() && content.trim()
                ? 'var(--amber)'
                : 'var(--bg-3)',
            border: 'none',
            cursor:
              title.trim() && content.trim() && !publishing
                ? 'pointer'
                : 'default',
            color:
              title.trim() && content.trim() ? '#000' : 'var(--tx-3)',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            transition: 'all .15s',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {publishing ? 'Publishing...' : 'Publish'} &#8594;
        </button>
      </div>

      {/* Main split */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {/* Left: Editor */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minWidth: 0,
          }}
        >
          <MetadataBar
            collectionId={collectionId}
            onCollectionChange={setCollectionId}
            tags={tags}
            onTagsChange={setTags}
            pageType={pageType}
            onPageTypeChange={setPageType}
          />
          <MarkdownEditor
            title={title}
            onTitleChange={setTitle}
            content={content}
            onContentChange={setContent}
            preview={preview}
            onPreviewToggle={() => setPreview((p) => !p)}
          />
        </div>

        {/* Right: AI Assist Panel */}
        <AIAssistPanel
          content={content}
          onContentGenerated={(text) => setContent(text)}
        />
      </div>
    </div>
  );
}

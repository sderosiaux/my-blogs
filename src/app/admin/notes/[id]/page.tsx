'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface Note {
  slug: string;
  frontmatter: {
    title?: string;
    status: 'idea' | 'draft' | 'ready' | 'scheduled' | 'published' | 'archived';
    tags: string[];
    slug: string;
    heroImage?: string;
    scheduledAt?: string;
    publishedAt?: string;
    createdAt: string;
    updatedAt: string;
  };
  content: string;
  sha: string;
}

function NoteEditor({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<Note['frontmatter']['status']>('idea');
  const [heroImage, setHeroImage] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  useEffect(() => {
    fetchNote();
  }, [id]);

  const fetchNote = async () => {
    try {
      const response = await fetch(`/api/admin/notes/${id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch note');
      }

      const data = await response.json();
      const fetchedNote = data.note;
      setNote(fetchedNote);
      setTitle(fetchedNote.frontmatter.title || '');
      setContent(fetchedNote.content);
      setTags(fetchedNote.frontmatter.tags.join(', '));
      setStatus(fetchedNote.frontmatter.status);
      setHeroImage(fetchedNote.frontmatter.heroImage || '');
      setScheduledAt(fetchedNote.frontmatter.scheduledAt || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load note');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || undefined,
          content,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          status,
          heroImage: heroImage || undefined,
          scheduledAt: scheduledAt || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update note');
      }

      const data = await response.json();
      setNote(data.note);
      setSuccess('Note saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/notes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      router.push(token ? `/admin?token=${token}` : '/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
      setDeleting(false);
    }
  };

  const handleGenerateDraft = async () => {
    setGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/generate/${id}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate draft');
      }

      const data = await response.json();
      setContent(data.generated);
      setStatus('draft');
      setNote(data.note);
      setSuccess('Draft generated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate draft');
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/publish/${id}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to publish note');
      }

      const data = await response.json();
      setSuccess(`Note published successfully! Slug: ${data.slug}`);
      await fetchNote();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish note');
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    setPublishing(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/unpublish/${id}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to unpublish note');
      }

      setSuccess('Note unpublished successfully!');
      await fetchNote();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unpublish note');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading note...</p>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-600">Note not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant={status as any}>{status}</Badge>
          <h1 className="text-xl font-bold">Edit Note</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleGenerateDraft} disabled={generating || saving}>
            {generating ? 'Generating...' : 'Generate Draft'}
          </Button>
          {status === 'published' ? (
            <Button variant="outline" onClick={handleUnpublish} disabled={publishing || saving}>
              {publishing ? 'Unpublishing...' : 'Unpublish'}
            </Button>
          ) : (
            <Button variant="outline" onClick={handlePublish} disabled={publishing || saving || status === 'idea'}>
              {publishing ? 'Publishing...' : 'Publish'}
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button variant="outline" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 border border-green-200 p-4">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-[1fr,300px] gap-6">
        {/* Editor */}
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-12 rounded-md border border-border bg-background px-4 text-lg font-medium"
          />
          <textarea
            placeholder="Start writing..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-[calc(100vh-350px)] rounded-md border border-border bg-background p-4 font-mono text-sm resize-none"
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Note['frontmatter']['status'])}
              className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="idea">Idea</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <input
              type="text"
              placeholder="ai, tech, tutorial"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
            />
            <p className="text-xs text-muted-foreground">Comma-separated</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Hero Image ID</label>
            <input
              type="text"
              placeholder="UUID of uploaded image"
              value={heroImage}
              onChange={(e) => setHeroImage(e.target.value)}
              className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Scheduled Date</label>
            <input
              type="datetime-local"
              value={scheduledAt ? new Date(scheduledAt).toISOString().slice(0, 16) : ''}
              onChange={(e) => setScheduledAt(e.target.value ? new Date(e.target.value).toISOString() : '')}
              className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
            />
          </div>

          <div className="pt-4 border-t border-border space-y-2 text-xs text-muted-foreground">
            <p>Created: {new Date(note.frontmatter.createdAt).toLocaleString()}</p>
            <p>Updated: {new Date(note.frontmatter.updatedAt).toLocaleString()}</p>
            {note.frontmatter.publishedAt && (
              <p>Published: {new Date(note.frontmatter.publishedAt).toLocaleString()}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NoteEditorPage({ params }: PageProps) {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    params.then(p => setId(p.id));
  }, [params]);

  if (!id) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return <NoteEditor id={id} />;
}

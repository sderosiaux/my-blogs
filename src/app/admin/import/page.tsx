'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function ImportPage() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [cleaned, setCleaned] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleClean = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to clean content');
      }

      const data = await response.json();
      setCleaned(data.cleaned);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clean content');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: cleaned,
          status: 'idea',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create note');
      }

      const data = await response.json();
      setSuccess('Note created successfully!');

      // Redirect to the note editor after a short delay
      setTimeout(() => {
        router.push(`/admin/notes/${data.note.slug}`);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create note');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import Content</h1>
        <p className="text-muted-foreground">Paste content from Medium, Substack, or other sources</p>
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

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Paste your content</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-96 rounded-md border border-border bg-background p-4 font-mono text-sm resize-none"
            placeholder="Paste your markdown or HTML content here..."
          />
          <Button onClick={handleClean} disabled={!input || isProcessing}>
            {isProcessing ? 'Processing...' : 'Clean & Preview'}
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Cleaned output</label>
          <textarea
            value={cleaned}
            onChange={(e) => setCleaned(e.target.value)}
            className="w-full h-96 rounded-md border border-border bg-background p-4 font-mono text-sm resize-none"
            placeholder="Cleaned content will appear here..."
          />
          <Button onClick={handleSave} disabled={!cleaned || isSaving}>
            {isSaving ? 'Saving...' : 'Save as Note'}
          </Button>
        </div>
      </div>
    </div>
  );
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { createMockRequest, parseResponse, createMockParams } from '@/test/api-helpers';
import * as githubNotes from '@/lib/github/notes';
import * as anthropic from '@/lib/ai/anthropic';
import { mockNote } from '@/test/mocks/github';
import { mockGeneratedDraft } from '@/test/mocks/ai';

vi.mock('@/lib/github/notes', () => ({
  getNote: vi.fn(),
  updateNote: vi.fn(),
}));

vi.mock('@/lib/ai/anthropic', () => ({
  generateDraft: vi.fn(),
}));

describe('/api/admin/generate/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('generates draft for a note successfully', async () => {
      vi.mocked(githubNotes.getNote).mockResolvedValue(mockNote);
      vi.mocked(anthropic.generateDraft).mockResolvedValue(mockGeneratedDraft);

      const updatedNote = {
        ...mockNote,
        content: mockGeneratedDraft,
        frontmatter: { ...mockNote.frontmatter, status: 'draft' },
      };
      vi.mocked(githubNotes.updateNote).mockResolvedValue(updatedNote);

      const request = createMockRequest(
        'http://localhost:3000/api/admin/generate/test-note',
        { method: 'POST' }
      );
      const params = createMockParams({ id: 'test-note' });

      const response = await POST(request, params);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(body.note).toEqual(updatedNote);
      expect(body.generated).toBe(mockGeneratedDraft);

      expect(githubNotes.getNote).toHaveBeenCalledWith('test-note');
      expect(anthropic.generateDraft).toHaveBeenCalledWith({
        content: mockNote.content,
        urls: [],
      });
      expect(githubNotes.updateNote).toHaveBeenCalledWith('test-note', {
        content: mockGeneratedDraft,
        status: 'draft',
      });
    });

    it('returns 404 when note not found', async () => {
      vi.mocked(githubNotes.getNote).mockResolvedValue(null);

      const request = createMockRequest(
        'http://localhost:3000/api/admin/generate/nonexistent',
        { method: 'POST' }
      );
      const params = createMockParams({ id: 'nonexistent' });

      const response = await POST(request, params);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(404);
      expect(body.error).toBe('Note not found');
      expect(anthropic.generateDraft).not.toHaveBeenCalled();
    });

    it('returns 500 when AI generation fails', async () => {
      vi.mocked(githubNotes.getNote).mockResolvedValue(mockNote);
      vi.mocked(anthropic.generateDraft).mockRejectedValue(
        new Error('Anthropic API error')
      );

      const request = createMockRequest(
        'http://localhost:3000/api/admin/generate/test-note',
        { method: 'POST' }
      );
      const params = createMockParams({ id: 'test-note' });

      const response = await POST(request, params);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(500);
      expect(body.error).toBe('Generation failed');
    });

    it('returns 500 when note update fails', async () => {
      vi.mocked(githubNotes.getNote).mockResolvedValue(mockNote);
      vi.mocked(anthropic.generateDraft).mockResolvedValue(mockGeneratedDraft);
      vi.mocked(githubNotes.updateNote).mockRejectedValue(
        new Error('GitHub API error')
      );

      const request = createMockRequest(
        'http://localhost:3000/api/admin/generate/test-note',
        { method: 'POST' }
      );
      const params = createMockParams({ id: 'test-note' });

      const response = await POST(request, params);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(500);
      expect(body.error).toBe('Generation failed');
    });

    it('passes note content to AI generation', async () => {
      const noteWithCustomContent = {
        ...mockNote,
        content: 'Custom idea content for generation',
      };
      vi.mocked(githubNotes.getNote).mockResolvedValue(noteWithCustomContent);
      vi.mocked(anthropic.generateDraft).mockResolvedValue(mockGeneratedDraft);
      vi.mocked(githubNotes.updateNote).mockResolvedValue(noteWithCustomContent);

      const request = createMockRequest(
        'http://localhost:3000/api/admin/generate/test-note',
        { method: 'POST' }
      );
      const params = createMockParams({ id: 'test-note' });

      await POST(request, params);

      expect(anthropic.generateDraft).toHaveBeenCalledWith({
        content: 'Custom idea content for generation',
        urls: [],
      });
    });

    it('updates note status to draft after generation', async () => {
      const ideaNote = {
        ...mockNote,
        frontmatter: { ...mockNote.frontmatter, status: 'idea' },
      };
      vi.mocked(githubNotes.getNote).mockResolvedValue(ideaNote);
      vi.mocked(anthropic.generateDraft).mockResolvedValue(mockGeneratedDraft);
      vi.mocked(githubNotes.updateNote).mockResolvedValue(ideaNote);

      const request = createMockRequest(
        'http://localhost:3000/api/admin/generate/idea-note',
        { method: 'POST' }
      );
      const params = createMockParams({ id: 'idea-note' });

      await POST(request, params);

      expect(githubNotes.updateNote).toHaveBeenCalledWith('idea-note', {
        content: mockGeneratedDraft,
        status: 'draft',
      });
    });
  });
});

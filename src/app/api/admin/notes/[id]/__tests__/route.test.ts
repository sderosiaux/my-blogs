import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH, DELETE } from '../route';
import { createMockRequest, parseResponse, createMockParams } from '@/test/api-helpers';
import * as githubNotes from '@/lib/github/notes';
import { mockNote } from '@/test/mocks/github';

vi.mock('@/lib/github/notes', () => ({
  getNote: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
}));

describe('/api/admin/notes/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns a note by id', async () => {
      vi.mocked(githubNotes.getNote).mockResolvedValue(mockNote);

      const request = createMockRequest(
        'http://localhost:3000/api/admin/notes/test-note'
      );
      const params = createMockParams({ id: 'test-note' });

      const response = await GET(request, params);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(body.note).toEqual(mockNote);
      expect(githubNotes.getNote).toHaveBeenCalledWith('test-note');
    });

    it('returns 404 when note not found', async () => {
      vi.mocked(githubNotes.getNote).mockResolvedValue(null);

      const request = createMockRequest(
        'http://localhost:3000/api/admin/notes/nonexistent'
      );
      const params = createMockParams({ id: 'nonexistent' });

      const response = await GET(request, params);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(404);
      expect(body.error).toBe('Note not found');
    });

    it('returns 500 on unexpected error', async () => {
      vi.mocked(githubNotes.getNote).mockRejectedValue(
        new Error('GitHub API error')
      );

      const request = createMockRequest(
        'http://localhost:3000/api/admin/notes/test-note'
      );
      const params = createMockParams({ id: 'test-note' });

      const response = await GET(request, params);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(500);
      expect(body.error).toBe('Internal server error');
    });
  });

  describe('PATCH', () => {
    it('updates a note with valid input', async () => {
      const updatedNote = {
        ...mockNote,
        frontmatter: { ...mockNote.frontmatter, title: 'Updated Title' },
      };
      vi.mocked(githubNotes.updateNote).mockResolvedValue(updatedNote);

      const request = createMockRequest(
        'http://localhost:3000/api/admin/notes/test-note',
        {
          method: 'PATCH',
          body: {
            title: 'Updated Title',
          },
        }
      );
      const params = createMockParams({ id: 'test-note' });

      const response = await PATCH(request, params);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(body.note).toEqual(updatedNote);
      expect(githubNotes.updateNote).toHaveBeenCalledWith('test-note', {
        title: 'Updated Title',
      });
    });

    it('updates note content', async () => {
      const updatedNote = {
        ...mockNote,
        content: 'Updated content',
      };
      vi.mocked(githubNotes.updateNote).mockResolvedValue(updatedNote);

      const request = createMockRequest(
        'http://localhost:3000/api/admin/notes/test-note',
        {
          method: 'PATCH',
          body: {
            content: 'Updated content',
          },
        }
      );
      const params = createMockParams({ id: 'test-note' });

      const response = await PATCH(request, params);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(body.note.content).toBe('Updated content');
    });

    it('updates note tags', async () => {
      const updatedNote = {
        ...mockNote,
        frontmatter: { ...mockNote.frontmatter, tags: ['new', 'tags'] },
      };
      vi.mocked(githubNotes.updateNote).mockResolvedValue(updatedNote);

      const request = createMockRequest(
        'http://localhost:3000/api/admin/notes/test-note',
        {
          method: 'PATCH',
          body: {
            tags: ['new', 'tags'],
          },
        }
      );
      const params = createMockParams({ id: 'test-note' });

      const response = await PATCH(request, params);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(githubNotes.updateNote).toHaveBeenCalledWith('test-note', {
        tags: ['new', 'tags'],
      });
    });

    it('updates note status', async () => {
      const updatedNote = {
        ...mockNote,
        frontmatter: { ...mockNote.frontmatter, status: 'ready' },
      };
      vi.mocked(githubNotes.updateNote).mockResolvedValue(updatedNote);

      const request = createMockRequest(
        'http://localhost:3000/api/admin/notes/test-note',
        {
          method: 'PATCH',
          body: {
            status: 'ready',
          },
        }
      );
      const params = createMockParams({ id: 'test-note' });

      const response = await PATCH(request, params);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(githubNotes.updateNote).toHaveBeenCalledWith('test-note', {
        status: 'ready',
      });
    });

    it('updates scheduledAt with null value', async () => {
      const updatedNote = {
        ...mockNote,
        frontmatter: { ...mockNote.frontmatter, scheduledAt: null },
      };
      vi.mocked(githubNotes.updateNote).mockResolvedValue(updatedNote);

      const request = createMockRequest(
        'http://localhost:3000/api/admin/notes/test-note',
        {
          method: 'PATCH',
          body: {
            scheduledAt: null,
          },
        }
      );
      const params = createMockParams({ id: 'test-note' });

      const response = await PATCH(request, params);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(githubNotes.updateNote).toHaveBeenCalledWith('test-note', {
        scheduledAt: null,
      });
    });

    it('updates scheduledAt with datetime string', async () => {
      const scheduledTime = '2024-12-25T12:00:00Z';
      const updatedNote = {
        ...mockNote,
        frontmatter: { ...mockNote.frontmatter, scheduledAt: scheduledTime },
      };
      vi.mocked(githubNotes.updateNote).mockResolvedValue(updatedNote);

      const request = createMockRequest(
        'http://localhost:3000/api/admin/notes/test-note',
        {
          method: 'PATCH',
          body: {
            scheduledAt: scheduledTime,
          },
        }
      );
      const params = createMockParams({ id: 'test-note' });

      const response = await PATCH(request, params);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(githubNotes.updateNote).toHaveBeenCalledWith('test-note', {
        scheduledAt: scheduledTime,
      });
    });

    it('updates heroImageId', async () => {
      const imageId = '550e8400-e29b-41d4-a716-446655440000';
      const updatedNote = {
        ...mockNote,
        frontmatter: { ...mockNote.frontmatter, heroImageId: imageId },
      };
      vi.mocked(githubNotes.updateNote).mockResolvedValue(updatedNote);

      const request = createMockRequest(
        'http://localhost:3000/api/admin/notes/test-note',
        {
          method: 'PATCH',
          body: {
            heroImageId: imageId,
          },
        }
      );
      const params = createMockParams({ id: 'test-note' });

      const response = await PATCH(request, params);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(githubNotes.updateNote).toHaveBeenCalledWith('test-note', {
        heroImageId: imageId,
      });
    });

    it('returns 404 when note not found', async () => {
      vi.mocked(githubNotes.updateNote).mockResolvedValue(null);

      const request = createMockRequest(
        'http://localhost:3000/api/admin/notes/nonexistent',
        {
          method: 'PATCH',
          body: {
            title: 'Updated Title',
          },
        }
      );
      const params = createMockParams({ id: 'nonexistent' });

      const response = await PATCH(request, params);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(404);
      expect(body.error).toBe('Note not found');
    });

    it('returns 400 for invalid status', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/admin/notes/test-note',
        {
          method: 'PATCH',
          body: {
            status: 'invalid',
          },
        }
      );
      const params = createMockParams({ id: 'test-note' });

      const response = await PATCH(request, params);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(400);
      expect(body.error).toBe('Invalid request body');
    });

    it('returns 400 for invalid tags type', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/admin/notes/test-note',
        {
          method: 'PATCH',
          body: {
            tags: 'not-an-array',
          },
        }
      );
      const params = createMockParams({ id: 'test-note' });

      const response = await PATCH(request, params);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(400);
      expect(body.error).toBe('Invalid request body');
    });

    it('returns 400 for invalid datetime format', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/admin/notes/test-note',
        {
          method: 'PATCH',
          body: {
            scheduledAt: 'invalid-date',
          },
        }
      );
      const params = createMockParams({ id: 'test-note' });

      const response = await PATCH(request, params);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(400);
      expect(body.error).toBe('Invalid request body');
    });

    it('returns 400 for invalid UUID format for heroImageId', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/admin/notes/test-note',
        {
          method: 'PATCH',
          body: {
            heroImageId: 'not-a-uuid',
          },
        }
      );
      const params = createMockParams({ id: 'test-note' });

      const response = await PATCH(request, params);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(400);
      expect(body.error).toBe('Invalid request body');
    });

    it('returns 400 for invalid status transition', async () => {
      vi.mocked(githubNotes.updateNote).mockRejectedValue(
        new Error('Invalid status transition from draft to published')
      );

      const request = createMockRequest(
        'http://localhost:3000/api/admin/notes/test-note',
        {
          method: 'PATCH',
          body: {
            status: 'published',
          },
        }
      );
      const params = createMockParams({ id: 'test-note' });

      const response = await PATCH(request, params);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(400);
      expect(body.error).toContain('Invalid status transition');
    });

    it('returns 500 on unexpected error', async () => {
      vi.mocked(githubNotes.updateNote).mockRejectedValue(
        new Error('GitHub API error')
      );

      const request = createMockRequest(
        'http://localhost:3000/api/admin/notes/test-note',
        {
          method: 'PATCH',
          body: {
            title: 'Updated Title',
          },
        }
      );
      const params = createMockParams({ id: 'test-note' });

      const response = await PATCH(request, params);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(500);
      expect(body.error).toBe('Internal server error');
    });
  });

  describe('DELETE', () => {
    it('deletes a note successfully', async () => {
      vi.mocked(githubNotes.deleteNote).mockResolvedValue(true);

      const request = createMockRequest(
        'http://localhost:3000/api/admin/notes/test-note',
        { method: 'DELETE' }
      );
      const params = createMockParams({ id: 'test-note' });

      const response = await DELETE(request, params);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(githubNotes.deleteNote).toHaveBeenCalledWith('test-note');
    });

    it('returns 404 when note not found', async () => {
      vi.mocked(githubNotes.deleteNote).mockResolvedValue(false);

      const request = createMockRequest(
        'http://localhost:3000/api/admin/notes/nonexistent',
        { method: 'DELETE' }
      );
      const params = createMockParams({ id: 'nonexistent' });

      const response = await DELETE(request, params);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(404);
      expect(body.error).toBe('Note not found');
    });

    it('returns 500 on unexpected error', async () => {
      vi.mocked(githubNotes.deleteNote).mockRejectedValue(
        new Error('GitHub API error')
      );

      const request = createMockRequest(
        'http://localhost:3000/api/admin/notes/test-note',
        { method: 'DELETE' }
      );
      const params = createMockParams({ id: 'test-note' });

      const response = await DELETE(request, params);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(500);
      expect(body.error).toBe('Internal server error');
    });
  });
});

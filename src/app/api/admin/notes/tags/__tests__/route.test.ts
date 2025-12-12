import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { createMockRequest, parseResponse } from '@/test/api-helpers';
import * as githubNotes from '@/lib/github/notes';

vi.mock('@/lib/github/notes', () => ({
  getAllTags: vi.fn(),
}));

describe('/api/admin/notes/tags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns all tags', async () => {
      const mockTags = ['typescript', 'react', 'nextjs', 'testing'];
      vi.mocked(githubNotes.getAllTags).mockResolvedValue(mockTags);

      const request = createMockRequest(
        'http://localhost:3000/api/admin/notes/tags'
      );
      const response = await GET();
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(body.tags).toEqual(mockTags);
      expect(githubNotes.getAllTags).toHaveBeenCalledOnce();
    });

    it('returns empty array when no tags exist', async () => {
      vi.mocked(githubNotes.getAllTags).mockResolvedValue([]);

      const request = createMockRequest(
        'http://localhost:3000/api/admin/notes/tags'
      );
      const response = await GET();
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(body.tags).toEqual([]);
    });

    it('returns 500 on unexpected error', async () => {
      vi.mocked(githubNotes.getAllTags).mockRejectedValue(
        new Error('GitHub API error')
      );

      const request = createMockRequest(
        'http://localhost:3000/api/admin/notes/tags'
      );
      const response = await GET();
      const { status, body } = await parseResponse(response);

      expect(status).toBe(500);
      expect(body.error).toBe('Internal server error');
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { createMockRequest, parseResponse, createMockParams } from '@/test/api-helpers';
import * as publishService from '@/lib/publish/service';

vi.mock('@/lib/publish/service', () => ({
  unpublishNote: vi.fn(),
}));

describe('/api/admin/unpublish/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('unpublishes a note successfully', async () => {
      vi.mocked(publishService.unpublishNote).mockResolvedValue({
        success: true,
        slug: 'test-note',
      });

      const request = createMockRequest(
        'http://localhost:3000/api/admin/unpublish/test-note',
        { method: 'POST' }
      );
      const params = createMockParams({ id: 'test-note' });

      const response = await POST(request, params);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Note unpublished successfully');
      expect(publishService.unpublishNote).toHaveBeenCalledWith('test-note');
    });

    it('returns 400 when note not found', async () => {
      vi.mocked(publishService.unpublishNote).mockResolvedValue({
        success: false,
        error: 'Note not found',
      });

      const request = createMockRequest(
        'http://localhost:3000/api/admin/unpublish/nonexistent',
        { method: 'POST' }
      );
      const params = createMockParams({ id: 'nonexistent' });

      const response = await POST(request, params);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(400);
      expect(body.error).toBe('Note not found');
    });

    it('returns 400 when note is not published', async () => {
      vi.mocked(publishService.unpublishNote).mockResolvedValue({
        success: false,
        error: 'Note is not published',
      });

      const request = createMockRequest(
        'http://localhost:3000/api/admin/unpublish/draft-note',
        { method: 'POST' }
      );
      const params = createMockParams({ id: 'draft-note' });

      const response = await POST(request, params);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(400);
      expect(body.error).toBe('Note is not published');
    });

    it('returns 400 when note has draft status', async () => {
      vi.mocked(publishService.unpublishNote).mockResolvedValue({
        success: false,
        error: 'Note is not published',
      });

      const request = createMockRequest(
        'http://localhost:3000/api/admin/unpublish/draft-note',
        { method: 'POST' }
      );
      const params = createMockParams({ id: 'draft-note' });

      const response = await POST(request, params);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(400);
      expect(body.error).toBe('Note is not published');
    });

    it('returns 500 on unexpected error', async () => {
      vi.mocked(publishService.unpublishNote).mockRejectedValue(
        new Error('GitHub API error')
      );

      const request = createMockRequest(
        'http://localhost:3000/api/admin/unpublish/test-note',
        { method: 'POST' }
      );
      const params = createMockParams({ id: 'test-note' });

      const response = await POST(request, params);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(500);
      expect(body.error).toBe('Failed to unpublish');
    });

    it('handles unpublish service returning generic error', async () => {
      vi.mocked(publishService.unpublishNote).mockResolvedValue({
        success: false,
        error: 'Failed to update note status',
      });

      const request = createMockRequest(
        'http://localhost:3000/api/admin/unpublish/test-note',
        { method: 'POST' }
      );
      const params = createMockParams({ id: 'test-note' });

      const response = await POST(request, params);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(400);
      expect(body.error).toBe('Failed to update note status');
    });
  });
});

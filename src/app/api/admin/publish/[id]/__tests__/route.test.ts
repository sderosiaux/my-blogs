import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { createMockRequest, parseResponse, createMockParams } from '@/test/api-helpers';
import * as publishService from '@/lib/publish/service';

vi.mock('@/lib/publish/service', () => ({
  publishNote: vi.fn(),
}));

describe('/api/admin/publish/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('publishes a note successfully', async () => {
      vi.mocked(publishService.publishNote).mockResolvedValue({
        success: true,
        slug: 'test-note',
      });

      const request = createMockRequest(
        'http://localhost:3000/api/admin/publish/test-note',
        { method: 'POST' }
      );
      const params = createMockParams({ id: 'test-note' });

      const response = await POST(request, params);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.slug).toBe('test-note');
      expect(body.message).toBe('Note published successfully');
      expect(publishService.publishNote).toHaveBeenCalledWith('test-note');
    });

    it('returns 400 when note not found', async () => {
      vi.mocked(publishService.publishNote).mockResolvedValue({
        success: false,
        error: 'Note not found',
      });

      const request = createMockRequest(
        'http://localhost:3000/api/admin/publish/nonexistent',
        { method: 'POST' }
      );
      const params = createMockParams({ id: 'nonexistent' });

      const response = await POST(request, params);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(400);
      expect(body.error).toBe('Note not found');
    });

    it('returns 400 when note has invalid status', async () => {
      vi.mocked(publishService.publishNote).mockResolvedValue({
        success: false,
        error: 'Cannot publish note with status "draft"',
      });

      const request = createMockRequest(
        'http://localhost:3000/api/admin/publish/draft-note',
        { method: 'POST' }
      );
      const params = createMockParams({ id: 'draft-note' });

      const response = await POST(request, params);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(400);
      expect(body.error).toBe('Cannot publish note with status "draft"');
    });

    it('returns 400 for note with idea status', async () => {
      vi.mocked(publishService.publishNote).mockResolvedValue({
        success: false,
        error: 'Cannot publish note with status "idea"',
      });

      const request = createMockRequest(
        'http://localhost:3000/api/admin/publish/idea-note',
        { method: 'POST' }
      );
      const params = createMockParams({ id: 'idea-note' });

      const response = await POST(request, params);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(400);
      expect(body.error).toContain('Cannot publish');
    });

    it('returns 500 on unexpected error', async () => {
      vi.mocked(publishService.publishNote).mockRejectedValue(
        new Error('GitHub API error')
      );

      const request = createMockRequest(
        'http://localhost:3000/api/admin/publish/test-note',
        { method: 'POST' }
      );
      const params = createMockParams({ id: 'test-note' });

      const response = await POST(request, params);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(500);
      expect(body.error).toBe('Failed to publish');
    });

    it('handles publish service returning generic error', async () => {
      vi.mocked(publishService.publishNote).mockResolvedValue({
        success: false,
        error: 'Failed to update note status',
      });

      const request = createMockRequest(
        'http://localhost:3000/api/admin/publish/test-note',
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

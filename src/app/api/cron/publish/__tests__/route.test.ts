import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { createMockRequest, parseResponse } from '@/test/api-helpers';
import * as githubNotes from '@/lib/github/notes';
import * as publishService from '@/lib/publish/service';
import { mockNote } from '@/test/mocks/github';

vi.mock('@/lib/github/notes', () => ({
  getScheduledNotes: vi.fn(),
  getNote: vi.fn(),
}));

vi.mock('@/lib/publish/service', () => ({
  publishNote: vi.fn(),
}));

describe('/api/cron/publish', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('GET', () => {
    it('publishes scheduled notes successfully', async () => {
      const scheduledNotes = [
        {
          slug: 'scheduled-note-1',
          frontmatter: {
            title: 'Scheduled Note 1',
            status: 'scheduled',
            scheduledAt: new Date(Date.now() - 1000).toISOString(),
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
          sha: 'abc123',
        },
        {
          slug: 'scheduled-note-2',
          frontmatter: {
            title: 'Scheduled Note 2',
            status: 'scheduled',
            scheduledAt: new Date(Date.now() - 2000).toISOString(),
            createdAt: '2024-01-02T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z',
          },
          sha: 'def456',
        },
      ];

      vi.mocked(githubNotes.getScheduledNotes).mockResolvedValue(scheduledNotes);
      vi.mocked(githubNotes.getNote).mockResolvedValue(mockNote);
      vi.mocked(publishService.publishNote).mockResolvedValue({
        success: true,
        slug: 'scheduled-note-1',
      });

      const request = createMockRequest(
        'http://localhost:3000/api/cron/publish',
        {
          headers: {
            authorization: 'Bearer test-cron-secret',
          },
        }
      );

      // Set cron secret for auth
      process.env.CRON_SECRET = 'test-cron-secret';

      const response = await GET(request);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(body.processed).toBe(2);
      expect(body.results).toHaveLength(2);
      expect(githubNotes.getScheduledNotes).toHaveBeenCalledOnce();
      expect(publishService.publishNote).toHaveBeenCalledTimes(2);
    });

    it('returns 401 when authorization header is missing', async () => {
      process.env.CRON_SECRET = 'test-cron-secret';

      const request = createMockRequest('http://localhost:3000/api/cron/publish');

      const response = await GET(request);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(githubNotes.getScheduledNotes).not.toHaveBeenCalled();
    });

    it('returns 401 when authorization header is invalid', async () => {
      process.env.CRON_SECRET = 'test-cron-secret';

      const request = createMockRequest(
        'http://localhost:3000/api/cron/publish',
        {
          headers: {
            authorization: 'Bearer wrong-secret',
          },
        }
      );

      const response = await GET(request);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });

    it('skips authorization when CRON_SECRET is not set', async () => {
      delete process.env.CRON_SECRET;

      vi.mocked(githubNotes.getScheduledNotes).mockResolvedValue([]);

      const request = createMockRequest('http://localhost:3000/api/cron/publish');

      const response = await GET(request);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(body.processed).toBe(0);
      expect(body.results).toEqual([]);
    });

    it('handles no scheduled notes', async () => {
      vi.mocked(githubNotes.getScheduledNotes).mockResolvedValue([]);

      const request = createMockRequest(
        'http://localhost:3000/api/cron/publish',
        {
          headers: {
            authorization: 'Bearer test-cron-secret',
          },
        }
      );

      process.env.CRON_SECRET = 'test-cron-secret';

      const response = await GET(request);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(body.processed).toBe(0);
      expect(body.results).toEqual([]);
    });

    it('continues processing when a note is not found', async () => {
      const scheduledNotes = [
        {
          slug: 'existing-note',
          frontmatter: {
            title: 'Existing Note',
            status: 'scheduled',
            scheduledAt: new Date(Date.now() - 1000).toISOString(),
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
          sha: 'abc123',
        },
        {
          slug: 'missing-note',
          frontmatter: {
            title: 'Missing Note',
            status: 'scheduled',
            scheduledAt: new Date(Date.now() - 2000).toISOString(),
            createdAt: '2024-01-02T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z',
          },
          sha: 'def456',
        },
      ];

      vi.mocked(githubNotes.getScheduledNotes).mockResolvedValue(scheduledNotes);
      vi.mocked(githubNotes.getNote)
        .mockResolvedValueOnce(mockNote)
        .mockResolvedValueOnce(null);
      vi.mocked(publishService.publishNote).mockResolvedValue({
        success: true,
        slug: 'existing-note',
      });

      const request = createMockRequest(
        'http://localhost:3000/api/cron/publish',
        {
          headers: {
            authorization: 'Bearer test-cron-secret',
          },
        }
      );

      process.env.CRON_SECRET = 'test-cron-secret';

      const response = await GET(request);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(body.processed).toBe(2);
      expect(body.results).toHaveLength(1);
      expect(publishService.publishNote).toHaveBeenCalledOnce();
    });

    it('includes publish result details in response', async () => {
      const scheduledNote = {
        slug: 'test-note',
        frontmatter: {
          title: 'Test Note',
          status: 'scheduled',
          scheduledAt: new Date(Date.now() - 1000).toISOString(),
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        sha: 'abc123',
      };

      vi.mocked(githubNotes.getScheduledNotes).mockResolvedValue([scheduledNote]);
      vi.mocked(githubNotes.getNote).mockResolvedValue(mockNote);
      vi.mocked(publishService.publishNote).mockResolvedValue({
        success: true,
        slug: 'test-note',
      });

      const request = createMockRequest(
        'http://localhost:3000/api/cron/publish',
        {
          headers: {
            authorization: 'Bearer test-cron-secret',
          },
        }
      );

      process.env.CRON_SECRET = 'test-cron-secret';

      const response = await GET(request);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(body.results[0]).toMatchObject({
        slug: 'test-note',
        title: 'Test Note',
        success: true,
      });
    });

    it('includes failed publish results', async () => {
      const scheduledNote = {
        slug: 'test-note',
        frontmatter: {
          title: 'Test Note',
          status: 'scheduled',
          scheduledAt: new Date(Date.now() - 1000).toISOString(),
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        sha: 'abc123',
      };

      vi.mocked(githubNotes.getScheduledNotes).mockResolvedValue([scheduledNote]);
      vi.mocked(githubNotes.getNote).mockResolvedValue(mockNote);
      vi.mocked(publishService.publishNote).mockResolvedValue({
        success: false,
        error: 'Publish failed',
      });

      const request = createMockRequest(
        'http://localhost:3000/api/cron/publish',
        {
          headers: {
            authorization: 'Bearer test-cron-secret',
          },
        }
      );

      process.env.CRON_SECRET = 'test-cron-secret';

      const response = await GET(request);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(body.results[0]).toMatchObject({
        slug: 'test-note',
        title: 'Test Note',
        success: false,
        error: 'Publish failed',
      });
    });

    it('returns 500 on unexpected error', async () => {
      vi.mocked(githubNotes.getScheduledNotes).mockRejectedValue(
        new Error('GitHub API error')
      );

      const request = createMockRequest(
        'http://localhost:3000/api/cron/publish',
        {
          headers: {
            authorization: 'Bearer test-cron-secret',
          },
        }
      );

      process.env.CRON_SECRET = 'test-cron-secret';

      const response = await GET(request);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(500);
      expect(body.error).toBe('Cron job failed');
    });
  });
});

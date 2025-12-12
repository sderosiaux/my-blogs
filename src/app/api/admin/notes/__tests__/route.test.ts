import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { createMockRequest, parseResponse } from '@/test/api-helpers';
import * as githubNotes from '@/lib/github/notes';
import { mockNotes, mockNote } from '@/test/mocks/github';

vi.mock('@/lib/github/notes', () => ({
  listNotes: vi.fn(),
  createNote: vi.fn(),
}));

describe('/api/admin/notes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns list of notes', async () => {
      vi.mocked(githubNotes.listNotes).mockResolvedValue(mockNotes);

      const request = createMockRequest('http://localhost:3000/api/admin/notes');
      const response = await GET(request);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(body).toEqual({ notes: mockNotes });
      expect(githubNotes.listNotes).toHaveBeenCalledWith({
        status: undefined,
        tags: undefined,
        search: undefined,
        limit: 50,
        offset: 0,
      });
    });

    it('filters by status query parameter', async () => {
      vi.mocked(githubNotes.listNotes).mockResolvedValue([mockNotes[1]]);

      const request = createMockRequest(
        'http://localhost:3000/api/admin/notes?status=ready'
      );
      const response = await GET(request);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(githubNotes.listNotes).toHaveBeenCalledWith({
        status: 'ready',
        tags: undefined,
        search: undefined,
        limit: 50,
        offset: 0,
      });
    });

    it('filters by tags query parameter', async () => {
      vi.mocked(githubNotes.listNotes).mockResolvedValue(mockNotes);

      const request = createMockRequest(
        'http://localhost:3000/api/admin/notes?tags=test,mock'
      );
      const response = await GET(request);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(githubNotes.listNotes).toHaveBeenCalledWith({
        status: undefined,
        tags: ['test', 'mock'],
        search: undefined,
        limit: 50,
        offset: 0,
      });
    });

    it('filters by search query parameter', async () => {
      vi.mocked(githubNotes.listNotes).mockResolvedValue([mockNotes[0]]);

      const request = createMockRequest(
        'http://localhost:3000/api/admin/notes?search=test'
      );
      const response = await GET(request);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(githubNotes.listNotes).toHaveBeenCalledWith({
        status: undefined,
        tags: undefined,
        search: 'test',
        limit: 50,
        offset: 0,
      });
    });

    it('supports pagination with limit and offset', async () => {
      vi.mocked(githubNotes.listNotes).mockResolvedValue([mockNotes[1]]);

      const request = createMockRequest(
        'http://localhost:3000/api/admin/notes?limit=10&offset=5'
      );
      const response = await GET(request);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(githubNotes.listNotes).toHaveBeenCalledWith({
        status: undefined,
        tags: undefined,
        search: undefined,
        limit: 10,
        offset: 5,
      });
    });

    it('returns 400 for invalid status', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/admin/notes?status=invalid'
      );
      const response = await GET(request);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(400);
      expect(body.error).toBe('Invalid query parameters');
      expect(body.details).toBeDefined();
    });

    it('returns 400 for invalid limit', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/admin/notes?limit=0'
      );
      const response = await GET(request);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(400);
      expect(body.error).toBe('Invalid query parameters');
    });

    it('returns 400 for limit exceeding maximum', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/admin/notes?limit=200'
      );
      const response = await GET(request);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(400);
      expect(body.error).toBe('Invalid query parameters');
    });

    it('returns 500 on unexpected error', async () => {
      vi.mocked(githubNotes.listNotes).mockRejectedValue(
        new Error('GitHub API error')
      );

      const request = createMockRequest('http://localhost:3000/api/admin/notes');
      const response = await GET(request);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(500);
      expect(body.error).toBe('Internal server error');
    });
  });

  describe('POST', () => {
    it('creates a note with valid input', async () => {
      vi.mocked(githubNotes.createNote).mockResolvedValue(mockNote);

      const request = createMockRequest('http://localhost:3000/api/admin/notes', {
        method: 'POST',
        body: {
          title: 'Test Note',
          content: 'Test content',
          tags: ['test'],
          status: 'draft',
        },
      });

      const response = await POST(request);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(201);
      expect(body.note).toEqual(mockNote);
      expect(githubNotes.createNote).toHaveBeenCalledWith({
        title: 'Test Note',
        content: 'Test content',
        tags: ['test'],
        status: 'draft',
      });
    });

    it('creates a note with minimal input (content only)', async () => {
      vi.mocked(githubNotes.createNote).mockResolvedValue(mockNote);

      const request = createMockRequest('http://localhost:3000/api/admin/notes', {
        method: 'POST',
        body: {
          content: 'Minimal content',
        },
      });

      const response = await POST(request);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(201);
      expect(body.note).toEqual(mockNote);
      expect(githubNotes.createNote).toHaveBeenCalledWith({
        content: 'Minimal content',
      });
    });

    it('returns 400 when content is missing', async () => {
      const request = createMockRequest('http://localhost:3000/api/admin/notes', {
        method: 'POST',
        body: {
          title: 'Test Note',
        },
      });

      const response = await POST(request);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(400);
      expect(body.error).toBe('Invalid request body');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when content is empty', async () => {
      const request = createMockRequest('http://localhost:3000/api/admin/notes', {
        method: 'POST',
        body: {
          content: '',
        },
      });

      const response = await POST(request);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(400);
      expect(body.error).toBe('Invalid request body');
    });

    it('returns 400 for invalid status', async () => {
      const request = createMockRequest('http://localhost:3000/api/admin/notes', {
        method: 'POST',
        body: {
          content: 'Test content',
          status: 'invalid',
        },
      });

      const response = await POST(request);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(400);
      expect(body.error).toBe('Invalid request body');
    });

    it('returns 400 for invalid tags type', async () => {
      const request = createMockRequest('http://localhost:3000/api/admin/notes', {
        method: 'POST',
        body: {
          content: 'Test content',
          tags: 'not-an-array',
        },
      });

      const response = await POST(request);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(400);
      expect(body.error).toBe('Invalid request body');
    });

    it('returns 500 on unexpected error', async () => {
      vi.mocked(githubNotes.createNote).mockRejectedValue(
        new Error('GitHub API error')
      );

      const request = createMockRequest('http://localhost:3000/api/admin/notes', {
        method: 'POST',
        body: {
          content: 'Test content',
        },
      });

      const response = await POST(request);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(500);
      expect(body.error).toBe('Internal server error');
    });
  });
});

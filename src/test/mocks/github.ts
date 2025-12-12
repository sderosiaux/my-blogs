import { vi } from 'vitest';
import type { Note, NoteMeta } from '@/lib/github/types';

export const mockNote: Note = {
  slug: 'test-note',
  frontmatter: {
    title: 'Test Note',
    status: 'draft',
    slug: 'test-note',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    tags: ['test', 'mock'],
  },
  content: 'This is test content',
  sha: 'abc123',
};

export const mockNoteMeta: NoteMeta = {
  slug: mockNote.slug,
  frontmatter: mockNote.frontmatter,
  sha: mockNote.sha,
};

export const mockNotes: NoteMeta[] = [
  mockNoteMeta,
  {
    slug: 'another-note',
    frontmatter: {
      title: 'Another Note',
      status: 'ready',
      slug: 'another-note',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
      tags: ['test'],
    },
    sha: 'def456',
  },
];

export function createMockGitHubService() {
  return {
    listNotes: vi.fn().mockResolvedValue(mockNotes),
    getNote: vi.fn().mockResolvedValue(mockNote),
    createNote: vi.fn().mockResolvedValue(mockNote),
    updateNote: vi.fn().mockResolvedValue(mockNote),
    deleteNote: vi.fn().mockResolvedValue(true),
    getAllTags: vi.fn().mockResolvedValue(['test', 'mock', 'tag1', 'tag2']),
    getScheduledNotes: vi.fn().mockResolvedValue([]),
  };
}

import matter from 'gray-matter';
import { getOctokit, getRepoConfig } from './client';
import {
  type Note,
  type NoteMeta,
  type NoteFrontmatter,
  type CreateNoteInput,
  type UpdateNoteInput,
  type ListNotesOptions,
  isValidTransition,
} from './types';
import { generateSlug } from '@/lib/utils/slug';

const NOTES_PATH = 'content/notes';

interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  type: 'file' | 'dir';
}

interface GitHubFileContent {
  content: string;
  sha: string;
}

function serializeNote(frontmatter: NoteFrontmatter, content: string): string {
  const yaml = Object.entries(frontmatter)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length === 0) return `${key}: []`;
        return `${key}:\n${value.map(v => `  - "${v}"`).join('\n')}`;
      }
      if (typeof value === 'string' && (value.includes(':') || value.includes('"'))) {
        return `${key}: "${value}"`;
      }
      return `${key}: ${value}`;
    })
    .join('\n');

  return `---\n${yaml}\n---\n\n${content}`;
}

function parseNote(fileContent: string, sha: string, slug: string): Note {
  const { data, content } = matter(fileContent);
  return {
    slug,
    frontmatter: data as NoteFrontmatter,
    content: content.trim(),
    sha,
  };
}

export async function listNotes(options: ListNotesOptions = {}): Promise<NoteMeta[]> {
  const { status, tags, search, limit = 50, offset = 0 } = options;
  const octokit = getOctokit();
  const { owner, repo } = getRepoConfig();

  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: NOTES_PATH,
    });

    if (!Array.isArray(data)) {
      return [];
    }

    const files = (data as GitHubFile[]).filter(f => f.type === 'file' && f.name.endsWith('.md'));

    // Fetch all notes in parallel
    const notes = await Promise.all(
      files.map(async (file): Promise<NoteMeta | null> => {
        try {
          const note = await getNote(file.name.replace('.md', ''));
          if (!note) return null;
          return {
            slug: note.slug,
            frontmatter: note.frontmatter,
            sha: note.sha,
          };
        } catch {
          return null;
        }
      })
    );

    let filtered = notes.filter((n): n is NoteMeta => n !== null);

    // Apply filters
    if (status) {
      filtered = filtered.filter(n => n.frontmatter.status === status);
    }

    if (tags && tags.length > 0) {
      filtered = filtered.filter(n =>
        tags.some(tag => n.frontmatter.tags?.includes(tag))
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(n =>
        n.frontmatter.title?.toLowerCase().includes(searchLower) ||
        n.slug.toLowerCase().includes(searchLower)
      );
    }

    // Sort by updatedAt descending
    filtered.sort((a, b) =>
      new Date(b.frontmatter.updatedAt).getTime() - new Date(a.frontmatter.updatedAt).getTime()
    );

    // Apply pagination
    return filtered.slice(offset, offset + limit);
  } catch (error) {
    // Directory doesn't exist yet
    if ((error as { status?: number }).status === 404) {
      return [];
    }
    throw error;
  }
}

export async function getNote(slug: string): Promise<Note | null> {
  const octokit = getOctokit();
  const { owner, repo } = getRepoConfig();
  const path = `${NOTES_PATH}/${slug}.md`;

  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
    });

    if (Array.isArray(data) || data.type !== 'file') {
      return null;
    }

    const content = Buffer.from((data as GitHubFileContent).content, 'base64').toString('utf-8');
    return parseNote(content, data.sha, slug);
  } catch (error) {
    if ((error as { status?: number }).status === 404) {
      return null;
    }
    throw error;
  }
}

export async function createNote(input: CreateNoteInput): Promise<Note> {
  const octokit = getOctokit();
  const { owner, repo, branch } = getRepoConfig();

  const now = new Date().toISOString();
  const slug = generateSlug(input.title || input.content.slice(0, 50));
  const path = `${NOTES_PATH}/${slug}.md`;

  const frontmatter: NoteFrontmatter = {
    title: input.title,
    status: input.status || 'idea',
    tags: input.tags || [],
    slug,
    createdAt: now,
    updatedAt: now,
  };

  const fileContent = serializeNote(frontmatter, input.content);

  const { data } = await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message: `Create note: ${slug}`,
    content: Buffer.from(fileContent).toString('base64'),
    branch,
  });

  return {
    slug,
    frontmatter,
    content: input.content,
    sha: data.content?.sha ?? '',
  };
}

export async function updateNote(slug: string, input: UpdateNoteInput): Promise<Note | null> {
  const existing = await getNote(slug);
  if (!existing) return null;

  const octokit = getOctokit();
  const { owner, repo, branch } = getRepoConfig();

  // Validate status transition
  if (input.status && input.status !== existing.frontmatter.status) {
    if (!isValidTransition(existing.frontmatter.status, input.status)) {
      throw new Error(`Invalid status transition from ${existing.frontmatter.status} to ${input.status}`);
    }
  }

  const now = new Date().toISOString();
  const newStatus = input.status || existing.frontmatter.status;

  const frontmatter: NoteFrontmatter = {
    ...existing.frontmatter,
    title: input.title ?? existing.frontmatter.title,
    status: newStatus,
    tags: input.tags ?? existing.frontmatter.tags,
    heroImage: input.heroImage ?? existing.frontmatter.heroImage,
    scheduledAt: input.scheduledAt === null ? undefined : (input.scheduledAt ?? existing.frontmatter.scheduledAt),
    publishedAt: newStatus === 'published' && existing.frontmatter.status !== 'published'
      ? now
      : existing.frontmatter.publishedAt,
    updatedAt: now,
  };

  const content = input.content ?? existing.content;
  const fileContent = serializeNote(frontmatter, content);
  const path = `${NOTES_PATH}/${slug}.md`;

  const { data } = await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message: `Update note: ${slug}`,
    content: Buffer.from(fileContent).toString('base64'),
    sha: existing.sha,
    branch,
  });

  return {
    slug,
    frontmatter,
    content,
    sha: data.content?.sha ?? '',
  };
}

export async function deleteNote(slug: string): Promise<boolean> {
  const existing = await getNote(slug);
  if (!existing) return false;

  const octokit = getOctokit();
  const { owner, repo, branch } = getRepoConfig();
  const path = `${NOTES_PATH}/${slug}.md`;

  await octokit.rest.repos.deleteFile({
    owner,
    repo,
    path,
    message: `Delete note: ${slug}`,
    sha: existing.sha,
    branch,
  });

  return true;
}

export async function getPublishedNotes(): Promise<NoteMeta[]> {
  return listNotes({ status: 'published' });
}

export async function getScheduledNotes(): Promise<NoteMeta[]> {
  const notes = await listNotes({ status: 'scheduled' });
  const now = new Date();

  return notes.filter(n => {
    if (!n.frontmatter.scheduledAt) return false;
    return new Date(n.frontmatter.scheduledAt) <= now;
  });
}

export async function getAllTags(): Promise<string[]> {
  const notes = await listNotes();
  const allTags = notes.flatMap(n => n.frontmatter.tags || []);
  return [...new Set(allTags)].sort();
}

// Re-export types
export * from './types';

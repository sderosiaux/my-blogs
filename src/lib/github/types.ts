export type NoteStatus = 'idea' | 'draft' | 'ready' | 'scheduled' | 'published' | 'archived';

export interface NoteFrontmatter {
  title?: string;
  status: NoteStatus;
  tags: string[];
  slug: string;
  heroImage?: string;
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  slug: string;
  frontmatter: NoteFrontmatter;
  content: string;
  sha: string; // GitHub file SHA for updates
}

export interface NoteMeta {
  slug: string;
  frontmatter: NoteFrontmatter;
  sha: string;
}

export interface CreateNoteInput {
  title?: string;
  content: string;
  tags?: string[];
  status?: NoteStatus;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  tags?: string[];
  status?: NoteStatus;
  heroImage?: string;
  scheduledAt?: string | null;
}

export interface ListNotesOptions {
  status?: NoteStatus;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
}

// Valid status transitions
export const VALID_TRANSITIONS: Record<NoteStatus, NoteStatus[]> = {
  idea: ['draft', 'archived'],
  draft: ['ready', 'archived', 'idea'],
  ready: ['scheduled', 'published', 'draft', 'archived'],
  scheduled: ['published', 'ready', 'archived'],
  published: ['archived', 'draft'],
  archived: ['idea', 'draft'],
};

export function isValidTransition(from: NoteStatus, to: NoteStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

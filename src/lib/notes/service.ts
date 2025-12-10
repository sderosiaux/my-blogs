import { db, notes, type Note, type NewNote } from '@/lib/db';
import { eq, desc, ilike, or, inArray, and, sql, isNotNull } from 'drizzle-orm';
import { generateSlug, generateUniqueSlug } from '@/lib/utils/slug';
import { extractUrls } from '@/lib/utils/url';

export type NoteStatus = 'idea' | 'draft' | 'ready' | 'scheduled' | 'published' | 'archived';

export interface ListNotesOptions {
  status?: NoteStatus;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
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
  slug?: string;
  scheduledAt?: Date | null;
  heroImageId?: string | null;
}

// Valid status transitions
const VALID_TRANSITIONS: Record<NoteStatus, NoteStatus[]> = {
  idea: ['draft', 'archived'],
  draft: ['ready', 'archived', 'idea'],
  ready: ['scheduled', 'published', 'draft', 'archived'],
  scheduled: ['published', 'ready', 'archived'],
  published: ['archived', 'draft'], // draft = create revision
  archived: ['idea', 'draft'], // allow revival
};

export function isValidTransition(from: NoteStatus, to: NoteStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export async function createNote(input: CreateNoteInput): Promise<Note> {
  const urls = extractUrls(input.content);

  const [note] = await db.insert(notes).values({
    title: input.title,
    content: input.content,
    tags: input.tags ?? [],
    status: input.status ?? 'idea',
    urls,
  }).returning();

  return note;
}

export async function getNote(id: string): Promise<Note | null> {
  const [note] = await db.select().from(notes).where(eq(notes.id, id));
  return note ?? null;
}

export async function updateNote(id: string, input: UpdateNoteInput): Promise<Note | null> {
  const existing = await getNote(id);
  if (!existing) return null;

  // Validate status transition if changing status
  if (input.status && input.status !== existing.status) {
    if (!isValidTransition(existing.status as NoteStatus, input.status)) {
      throw new Error(`Invalid status transition from ${existing.status} to ${input.status}`);
    }
  }

  // Re-extract URLs if content changed
  const urls = input.content ? extractUrls(input.content) : undefined;

  // Generate slug if transitioning to ready/scheduled/published and no slug
  let slug = input.slug;
  if (
    input.status &&
    ['ready', 'scheduled', 'published'].includes(input.status) &&
    !existing.slug &&
    !slug
  ) {
    const title = input.title ?? existing.title ?? input.content?.slice(0, 50) ?? 'untitled';
    const existingSlugs = await getExistingSlugs();
    slug = generateUniqueSlug(title, existingSlugs);
  }

  const [updated] = await db
    .update(notes)
    .set({
      ...input,
      urls: urls ?? existing.urls,
      slug: slug ?? existing.slug,
      updatedAt: new Date(),
      publishedAt: input.status === 'published' ? new Date() : existing.publishedAt,
    })
    .where(eq(notes.id, id))
    .returning();

  return updated ?? null;
}

export async function deleteNote(id: string): Promise<boolean> {
  const result = await db.delete(notes).where(eq(notes.id, id)).returning({ id: notes.id });
  return result.length > 0;
}

export async function listNotes(options: ListNotesOptions = {}): Promise<Note[]> {
  const { status, tags, search, limit = 50, offset = 0 } = options;

  const conditions = [];

  if (status) {
    conditions.push(eq(notes.status, status));
  }

  if (tags && tags.length > 0) {
    // Use SQL array overlap operator for Postgres
    const tagsArray = `{${tags.join(',')}}`;
    conditions.push(sql`${notes.tags} && ${tagsArray}::text[]`);
  }

  if (search) {
    conditions.push(
      or(
        ilike(notes.title ?? '', `%${search}%`),
        ilike(notes.content, `%${search}%`)
      )
    );
  }

  const query = db
    .select()
    .from(notes)
    .orderBy(desc(notes.updatedAt))
    .limit(limit)
    .offset(offset);

  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }

  return query;
}

export async function getNoteBySlug(slug: string): Promise<Note | null> {
  const [note] = await db.select().from(notes).where(eq(notes.slug, slug));
  return note ?? null;
}

export async function getScheduledNotes(): Promise<Note[]> {
  const now = new Date();
  return db
    .select()
    .from(notes)
    .where(
      and(
        eq(notes.status, 'scheduled'),
        // scheduledAt <= now (note: need to handle null)
      )
    );
}

async function getExistingSlugs(): Promise<string[]> {
  const result = await db
    .select({ slug: notes.slug })
    .from(notes)
    .where(isNotNull(notes.slug));
  return result.map(r => r.slug).filter((s): s is string => s !== null);
}

export async function getAllTags(): Promise<string[]> {
  const result = await db.select({ tags: notes.tags }).from(notes);
  const allTags = result.flatMap(r => r.tags ?? []);
  return [...new Set(allTags)].sort();
}

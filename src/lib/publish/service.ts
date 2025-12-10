import fs from 'fs';
import path from 'path';
import { getNote, updateNote } from '@/lib/notes/service';
import { db, images, type Note } from '@/lib/db';
import { eq } from 'drizzle-orm';

const CONTENT_DIR = path.join(process.cwd(), 'content', 'posts');

export interface PublishResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

function generateFrontmatter(note: Note, heroImageUrl?: string): string {
  const readingTime = Math.ceil((note.content?.split(/\s+/).length || 0) / 200);

  const frontmatter: Record<string, any> = {
    title: note.title || 'Untitled',
    date: new Date().toISOString().split('T')[0],
    tags: note.tags || [],
    readingTime,
  };

  if (heroImageUrl) {
    frontmatter.heroImage = heroImageUrl;
  }

  const yaml = Object.entries(frontmatter)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: [${value.map(v => `"${v}"`).join(', ')}]`;
      }
      if (typeof value === 'string') {
        return `${key}: "${value}"`;
      }
      return `${key}: ${value}`;
    })
    .join('\n');

  return `---\n${yaml}\n---`;
}

export async function publishNote(noteId: string): Promise<PublishResult> {
  try {
    const note = await getNote(noteId);

    if (!note) {
      return { success: false, error: 'Note not found' };
    }

    if (!['ready', 'scheduled'].includes(note.status)) {
      return { success: false, error: `Cannot publish note with status "${note.status}"` };
    }

    if (!note.slug) {
      return { success: false, error: 'Note must have a slug to publish' };
    }

    // Get hero image if set
    let heroImageUrl: string | undefined;
    if (note.heroImageId) {
      const [heroImage] = await db
        .select()
        .from(images)
        .where(eq(images.id, note.heroImageId));
      heroImageUrl = heroImage?.url;
    }

    // Build file path: content/posts/YYYY/MM/slug.md
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const dir = path.join(CONTENT_DIR, year, month);
    const filePath = path.join(dir, `${note.slug}.md`);

    // Ensure directory exists
    fs.mkdirSync(dir, { recursive: true });

    // Generate file content
    const frontmatter = generateFrontmatter(note, heroImageUrl);
    const fileContent = `${frontmatter}\n\n${note.content}`;

    // Write file
    fs.writeFileSync(filePath, fileContent, 'utf-8');

    // Update note status
    await updateNote(noteId, {
      status: 'published',
    });

    // Trigger Vercel deploy hook if configured
    await triggerDeploy();

    return {
      success: true,
      filePath: `${year}/${month}/${note.slug}.md`
    };
  } catch (error) {
    console.error('Publish error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function unpublishNote(noteId: string): Promise<PublishResult> {
  try {
    const note = await getNote(noteId);

    if (!note) {
      return { success: false, error: 'Note not found' };
    }

    if (note.status !== 'published') {
      return { success: false, error: 'Note is not published' };
    }

    if (!note.slug || !note.publishedAt) {
      return { success: false, error: 'Note missing publish information' };
    }

    // Find and delete the file
    const publishDate = new Date(note.publishedAt);
    const year = publishDate.getFullYear().toString();
    const month = String(publishDate.getMonth() + 1).padStart(2, '0');
    const filePath = path.join(CONTENT_DIR, year, month, `${note.slug}.md`);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Update note status to archived
    await updateNote(noteId, {
      status: 'archived',
    });

    // Trigger rebuild
    await triggerDeploy();

    return { success: true };
  } catch (error) {
    console.error('Unpublish error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function triggerDeploy(): Promise<void> {
  const deployHook = process.env.VERCEL_DEPLOY_HOOK;

  if (!deployHook) {
    console.log('No deploy hook configured, skipping rebuild trigger');
    return;
  }

  try {
    const response = await fetch(deployHook, { method: 'POST' });
    if (!response.ok) {
      console.error('Deploy hook failed:', response.status);
    }
  } catch (error) {
    console.error('Failed to trigger deploy:', error);
  }
}

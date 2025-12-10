import { getNote, updateNote } from '@/lib/github/notes';

export interface PublishResult {
  success: boolean;
  slug?: string;
  error?: string;
}

export async function publishNote(slug: string): Promise<PublishResult> {
  try {
    const note = await getNote(slug);

    if (!note) {
      return { success: false, error: 'Note not found' };
    }

    if (!['ready', 'scheduled'].includes(note.frontmatter.status)) {
      return { success: false, error: `Cannot publish note with status "${note.frontmatter.status}"` };
    }

    await updateNote(slug, { status: 'published' });

    // Trigger Vercel deploy hook if configured
    await triggerDeploy();

    return { success: true, slug };
  } catch (error) {
    console.error('Publish error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function unpublishNote(slug: string): Promise<PublishResult> {
  try {
    const note = await getNote(slug);

    if (!note) {
      return { success: false, error: 'Note not found' };
    }

    if (note.frontmatter.status !== 'published') {
      return { success: false, error: 'Note is not published' };
    }

    await updateNote(slug, { status: 'archived' });

    // Trigger rebuild
    await triggerDeploy();

    return { success: true, slug };
  } catch (error) {
    console.error('Unpublish error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
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

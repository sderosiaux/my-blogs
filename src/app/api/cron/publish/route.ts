import { NextRequest, NextResponse } from 'next/server';
import { db, notes } from '@/lib/db';
import { eq, and, lte } from 'drizzle-orm';
import { publishNote } from '@/lib/publish/service';

export async function GET(request: NextRequest) {
  // Verify cron secret in production
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();

    // Find scheduled notes that should be published
    const scheduledNotes = await db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.status, 'scheduled'),
          lte(notes.scheduledAt, now)
        )
      );

    const results = [];

    for (const note of scheduledNotes) {
      const result = await publishNote(note.id);
      results.push({
        noteId: note.id,
        title: note.title,
        ...result,
      });
    }

    return NextResponse.json({
      processed: scheduledNotes.length,
      results,
    });
  } catch (error) {
    console.error('Cron publish error:', error);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}

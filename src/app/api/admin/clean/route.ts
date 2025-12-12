import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const cleanBodySchema = z.object({
  content: z.string().min(1),
});

function cleanMarkdown(content: string): string {
  let cleaned = content;

  // Remove HTML comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

  // Clean up Medium-specific artifacts
  cleaned = cleaned.replace(/\[https?:\/\/medium\.com[^\]]*\]\([^)]*\)/g, '');

  // Remove empty links
  cleaned = cleaned.replace(/\[\s*\]\([^)]*\)/g, '');

  // Clean up excessive newlines (more than 3 in a row)
  cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n');

  // Remove trailing whitespace from lines
  cleaned = cleaned.split('\n').map(line => line.trimEnd()).join('\n');

  // Remove metadata blocks (often at the top of exported content)
  cleaned = cleaned.replace(/^---\n[\s\S]*?\n---\n/, '');

  // Clean up Substack-specific artifacts
  cleaned = cleaned.replace(/\[Subscribe now\]\([^)]*\)/g, '');
  cleaned = cleaned.replace(/\[Share\]\([^)]*\)/g, '');

  // Normalize heading styles (ensure space after #)
  cleaned = cleaned.replace(/^(#{1,6})([^\s#])/gm, '$1 $2');

  // Remove zero-width characters and other invisible unicode
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, '');

  // Trim
  cleaned = cleaned.trim();

  return cleaned;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = cleanBodySchema.parse(body);

    const cleaned = cleanMarkdown(input.content);

    return NextResponse.json({ cleaned });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request body', details: error.issues }, { status: 400 });
    }
    console.error('Failed to clean content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

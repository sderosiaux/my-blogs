import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface GenerateDraftOptions {
  content: string;
  context?: string;
  urls?: string[];
}

export async function generateDraft(options: GenerateDraftOptions): Promise<string> {
  const { content, context, urls } = options;

  const systemPrompt = `You are a writing assistant that creates high-quality blog posts.

Writing guidelines:
- Conversational but authoritative tone
- Short paragraphs (2-4 sentences)
- Liberal subheadings
- Concrete, descriptive section titles (not clever/abstract)
- Bold key phrases for skimmers
- Reference real companies/projects when relevant
- Include [VISUAL: description] placeholders where diagrams would help

Avoid:
- Marketing speak, buzzwords, excessive hedging
- Em dashes (use commas, colons, or parentheses)
- Overly long intros, clickbait, decoration visuals
- "Ultimate Guide to..." or "X is Dead" clichés`;

  const userPrompt = `Create a blog post draft from these notes:

${content}

${context ? `Additional context:\n${context}` : ''}
${urls?.length ? `Related URLs:\n${urls.join('\n')}` : ''}

Generate a complete, publication-ready draft with:
1. A compelling title
2. Clear sections with descriptive headings
3. [VISUAL: description] placeholders for images
4. A strong conclusion`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      { role: 'user', content: userPrompt }
    ],
    system: systemPrompt,
  });

  const textContent = message.content.find(block => block.type === 'text');
  return textContent?.text ?? '';
}

export async function generateTitles(content: string, count: number = 5): Promise<string[]> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Generate ${count} title options for this blog post. Titles should be concrete and specific, not clever or clickbaity. Return only the titles, one per line.

Content:
${content.slice(0, 2000)}`,
      },
    ],
  });

  const textContent = message.content.find(block => block.type === 'text');
  return textContent?.text?.split('\n').filter(Boolean) ?? [];
}

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;

export function extractUrls(content: string): string[] {
  const matches = content.match(URL_REGEX);
  return [...new Set(matches ?? [])];
}

export type UrlType = 'hn_thread' | 'reddit_thread' | 'article' | 'other';

export function classifyUrl(url: string): UrlType {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    if (hostname === 'news.ycombinator.com' && parsed.pathname.includes('item')) {
      return 'hn_thread';
    }

    if (hostname.includes('reddit.com') && parsed.pathname.includes('/comments/')) {
      return 'reddit_thread';
    }

    // Common article patterns
    if (
      parsed.pathname.includes('/blog/') ||
      parsed.pathname.includes('/post/') ||
      parsed.pathname.includes('/article/') ||
      hostname.includes('medium.com') ||
      hostname.includes('substack.com')
    ) {
      return 'article';
    }

    return 'other';
  } catch {
    return 'other';
  }
}

export function extractHNId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'news.ycombinator.com') {
      return parsed.searchParams.get('id');
    }
    return null;
  } catch {
    return null;
  }
}

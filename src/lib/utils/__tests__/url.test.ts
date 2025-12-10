import { describe, it, expect } from 'vitest';
import { extractUrls, classifyUrl, extractHNId } from '../url';

describe('extractUrls', () => {
  it('extracts single URL', () => {
    const content = 'Check out https://example.com for more';
    expect(extractUrls(content)).toEqual(['https://example.com']);
  });

  it('extracts multiple URLs', () => {
    const content = 'See https://a.com and https://b.com/path';
    expect(extractUrls(content)).toEqual(['https://a.com', 'https://b.com/path']);
  });

  it('deduplicates URLs', () => {
    const content = 'https://example.com and https://example.com again';
    expect(extractUrls(content)).toEqual(['https://example.com']);
  });

  it('returns empty array for no URLs', () => {
    expect(extractUrls('just plain text')).toEqual([]);
  });
});

describe('classifyUrl', () => {
  it('identifies HN threads', () => {
    expect(classifyUrl('https://news.ycombinator.com/item?id=12345')).toBe('hn_thread');
  });

  it('identifies Reddit threads', () => {
    expect(classifyUrl('https://reddit.com/r/programming/comments/abc123/title')).toBe('reddit_thread');
    expect(classifyUrl('https://www.reddit.com/r/MachineLearning/comments/xyz/post')).toBe('reddit_thread');
  });

  it('identifies articles', () => {
    expect(classifyUrl('https://example.com/blog/my-post')).toBe('article');
    expect(classifyUrl('https://medium.com/@user/article')).toBe('article');
  });

  it('returns other for unknown URLs', () => {
    expect(classifyUrl('https://example.com')).toBe('other');
  });
});

describe('extractHNId', () => {
  it('extracts HN item ID', () => {
    expect(extractHNId('https://news.ycombinator.com/item?id=12345')).toBe('12345');
  });

  it('returns null for non-HN URLs', () => {
    expect(extractHNId('https://example.com')).toBeNull();
  });
});

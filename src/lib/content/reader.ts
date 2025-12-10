import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const NOTES_DIR = path.join(process.cwd(), 'content', 'notes');

export interface PostFrontmatter {
  title: string;
  subtitle?: string;
  date: string;
  tags: string[];
  heroImage?: string;
  readingTime?: number;
  status?: string;
  publishedAt?: string;
}

export interface Post {
  slug: string;
  year: string;
  month: string;
  frontmatter: PostFrontmatter;
  content: string;
}

export interface PostMeta {
  slug: string;
  year: string;
  month: string;
  frontmatter: PostFrontmatter;
}

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

function getYearMonth(dateStr: string): { year: string; month: string } {
  const date = new Date(dateStr);
  return {
    year: date.getFullYear().toString(),
    month: String(date.getMonth() + 1).padStart(2, '0'),
  };
}

export async function getAllPosts(): Promise<PostMeta[]> {
  const posts: PostMeta[] = [];

  if (!fs.existsSync(NOTES_DIR)) {
    return posts;
  }

  const files = fs.readdirSync(NOTES_DIR).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const filePath = path.join(NOTES_DIR, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(fileContent);

    // Only include published notes
    if (data.status !== 'published') {
      continue;
    }

    const slug = file.replace(/\.md$/, '');
    const dateStr = data.publishedAt || data.createdAt || new Date().toISOString();
    const { year, month } = getYearMonth(dateStr);

    posts.push({
      slug,
      year,
      month,
      frontmatter: {
        title: data.title || 'Untitled',
        subtitle: data.subtitle,
        date: dateStr,
        tags: data.tags || [],
        heroImage: data.heroImage,
        status: data.status,
        publishedAt: data.publishedAt,
      },
    });
  }

  // Sort by date descending
  return posts.sort((a, b) =>
    new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime()
  );
}

export async function getPost(year: string, month: string, slug: string): Promise<Post | null> {
  const filePath = path.join(NOTES_DIR, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);

  // Only return published notes
  if (data.status !== 'published') {
    return null;
  }

  const dateStr = data.publishedAt || data.createdAt || new Date().toISOString();
  const { year: noteYear, month: noteMonth } = getYearMonth(dateStr);

  // Verify year/month match (for URL consistency)
  if (noteYear !== year || noteMonth !== month) {
    return null;
  }

  const frontmatter: PostFrontmatter = {
    title: data.title || 'Untitled',
    subtitle: data.subtitle,
    date: dateStr,
    tags: data.tags || [],
    heroImage: data.heroImage,
    readingTime: calculateReadingTime(content),
    status: data.status,
    publishedAt: data.publishedAt,
  };

  return {
    slug,
    year,
    month,
    frontmatter,
    content,
  };
}

export async function getPostsByTag(tag: string): Promise<PostMeta[]> {
  const allPosts = await getAllPosts();
  return allPosts.filter(post =>
    post.frontmatter.tags?.includes(tag)
  );
}

export async function getAllTags(): Promise<{ tag: string; count: number }[]> {
  const allPosts = await getAllPosts();
  const tagCounts: Record<string, number> = {};

  for (const post of allPosts) {
    for (const tag of post.frontmatter.tags || []) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }

  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

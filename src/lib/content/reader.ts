import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const CONTENT_DIR = path.join(process.cwd(), 'content', 'posts');

export interface PostFrontmatter {
  title: string;
  subtitle?: string;
  date: string;
  tags: string[];
  heroImage?: string;
  readingTime?: number;
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

export async function getAllPosts(): Promise<PostMeta[]> {
  const posts: PostMeta[] = [];

  if (!fs.existsSync(CONTENT_DIR)) {
    return posts;
  }

  // Walk through year/month directories
  const years = fs.readdirSync(CONTENT_DIR).filter(f =>
    fs.statSync(path.join(CONTENT_DIR, f)).isDirectory()
  );

  for (const year of years) {
    const yearPath = path.join(CONTENT_DIR, year);
    const months = fs.readdirSync(yearPath).filter(f =>
      fs.statSync(path.join(yearPath, f)).isDirectory()
    );

    for (const month of months) {
      const monthPath = path.join(yearPath, month);
      const files = fs.readdirSync(monthPath).filter(f => f.endsWith('.md'));

      for (const file of files) {
        const slug = file.replace(/\.md$/, '');
        const filePath = path.join(monthPath, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const { data } = matter(fileContent);

        posts.push({
          slug,
          year,
          month,
          frontmatter: data as PostFrontmatter,
        });
      }
    }
  }

  // Sort by date descending
  return posts.sort((a, b) =>
    new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime()
  );
}

export async function getPost(year: string, month: string, slug: string): Promise<Post | null> {
  const filePath = path.join(CONTENT_DIR, year, month, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);

  const frontmatter = data as PostFrontmatter;
  frontmatter.readingTime = frontmatter.readingTime || calculateReadingTime(content);

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

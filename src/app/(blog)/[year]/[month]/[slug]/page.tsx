import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPost, getAllPosts } from '@/lib/content/reader';
import { remark } from 'remark';
import html from 'remark-html';

interface PageProps {
  params: Promise<{ year: string; month: string; slug: string }>;
}

async function markdownToHtml(markdown: string): Promise<string> {
  const result = await remark().use(html).process(markdown);
  return result.toString();
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map(post => ({
    year: post.year,
    month: post.month,
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { year, month, slug } = await params;
  const post = await getPost(year, month, slug);

  if (!post) {
    return { title: 'Not Found' };
  }

  return {
    title: post.frontmatter.title,
    description: post.frontmatter.subtitle,
    openGraph: {
      title: post.frontmatter.title,
      description: post.frontmatter.subtitle,
      type: 'article',
      publishedTime: post.frontmatter.date,
      images: post.frontmatter.heroImage ? [post.frontmatter.heroImage] : [],
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { year, month, slug } = await params;
  const post = await getPost(year, month, slug);

  if (!post) {
    notFound();
  }

  const contentHtml = await markdownToHtml(post.content);

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      {post.frontmatter.heroImage && (
        <img
          src={post.frontmatter.heroImage}
          alt={post.frontmatter.title}
          className="w-full h-80 object-cover rounded-2xl mb-8"
        />
      )}

      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{post.frontmatter.title}</h1>
        {post.frontmatter.subtitle && (
          <p className="text-xl text-muted-foreground mb-4">{post.frontmatter.subtitle}</p>
        )}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <time>{new Date(post.frontmatter.date).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
          })}</time>
          {post.frontmatter.readingTime && (
            <span>{post.frontmatter.readingTime} min read</span>
          )}
        </div>
      </header>

      <div
        className="prose prose-lg max-w-none prose-headings:font-bold prose-a:text-foreground prose-a:underline-offset-4"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />

      <footer className="mt-12 pt-8 border-t border-border">
        <div className="flex flex-wrap gap-2 mb-6">
          {post.frontmatter.tags?.map(tag => (
            <Link
              key={tag}
              href={`/tags/${tag}`}
              className="px-3 py-1 bg-muted rounded-full text-sm hover:bg-muted/80 transition-colors"
            >
              #{tag}
            </Link>
          ))}
        </div>
        <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
          ← Back to all posts
        </Link>
      </footer>
    </article>
  );
}

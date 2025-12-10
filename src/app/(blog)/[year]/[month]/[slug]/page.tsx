import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
    <div className="min-h-screen bg-white">
      <article className="max-w-2xl mx-auto px-6 py-16">
        {post.frontmatter.heroImage && (
          <Image
            src={post.frontmatter.heroImage}
            alt={post.frontmatter.title}
            width={800}
            height={320}
            className="w-full h-64 object-cover rounded-lg mb-8"
            priority
          />
        )}

        <header className="mb-10">
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Back
          </Link>
          <h1 className="text-3xl font-semibold text-gray-900 mt-4 mb-2">
            {post.frontmatter.title}
          </h1>
          {post.frontmatter.subtitle && (
            <p className="text-lg text-gray-500 mb-4">{post.frontmatter.subtitle}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <time>
              {new Date(post.frontmatter.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            {post.frontmatter.readingTime && (
              <span>{post.frontmatter.readingTime} min read</span>
            )}
          </div>
        </header>

        <div
          className="prose prose-gray max-w-none
            prose-headings:font-semibold prose-headings:text-gray-900
            prose-p:text-gray-600 prose-p:leading-relaxed
            prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-gray-900
            prose-code:text-gray-800 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-gray-900 prose-pre:text-gray-100
            prose-blockquote:border-gray-200 prose-blockquote:text-gray-500
            prose-li:text-gray-600"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />

        <footer className="mt-12 pt-8 border-t border-gray-100">
          {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.frontmatter.tags.map(tag => (
                <Link
                  key={tag}
                  href={`/tags/${tag}`}
                  className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded hover:bg-gray-200 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </footer>
      </article>
    </div>
  );
}

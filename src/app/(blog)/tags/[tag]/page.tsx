import Link from 'next/link';
import { getPostsByTag, getAllTags } from '@/lib/content/reader';

interface PageProps {
  params: Promise<{ tag: string }>;
}

export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.map(({ tag }) => ({ tag }));
}

export async function generateMetadata({ params }: PageProps) {
  const { tag } = await params;
  return {
    title: `Posts tagged "${tag}"`,
  };
}

export default async function TagPage({ params }: PageProps) {
  const { tag } = await params;
  const posts = await getPostsByTag(tag);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <header className="mb-10">
          <Link
            href="/tags"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← All tags
          </Link>
          <h1 className="text-3xl font-semibold text-gray-900 mt-4">{tag}</h1>
          <p className="text-gray-500 mt-1">{posts.length} post{posts.length !== 1 ? 's' : ''}</p>
        </header>

        <div className="space-y-8">
          {posts.map(post => {
            const url = `/${post.year}/${post.month}/${post.slug}`;
            return (
              <article key={url}>
                <Link href={url} className="group block">
                  <time className="text-sm text-gray-400">
                    {new Date(post.frontmatter.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                  <h2 className="text-xl font-medium text-gray-900 mt-1 group-hover:text-blue-600 transition-colors">
                    {post.frontmatter.title}
                  </h2>
                  {post.frontmatter.subtitle && (
                    <p className="text-gray-500 mt-1">{post.frontmatter.subtitle}</p>
                  )}
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

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
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">#{tag}</h1>
      <p className="text-muted-foreground mb-8">{posts.length} posts</p>

      <div className="grid gap-4">
        {posts.map(post => {
          const url = `/${post.year}/${post.month}/${post.slug}`;
          return (
            <article key={url} className="p-6 rounded-lg border border-border">
              <time className="text-sm text-muted-foreground">
                {new Date(post.frontmatter.date).toLocaleDateString()}
              </time>
              <Link href={url}>
                <h2 className="text-xl font-semibold mt-1 hover:text-muted-foreground transition-colors">
                  {post.frontmatter.title}
                </h2>
              </Link>
            </article>
          );
        })}
      </div>

      <Link href="/tags" className="inline-block mt-8 text-muted-foreground hover:text-foreground">
        ← All tags
      </Link>
    </div>
  );
}

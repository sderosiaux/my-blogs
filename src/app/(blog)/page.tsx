import Link from 'next/link';
import Image from 'next/image';
import { getAllPosts, type PostMeta } from '@/lib/content/reader';

function FeaturedPost({ post }: { post: PostMeta }) {
  const url = `/${post.year}/${post.month}/${post.slug}`;

  return (
    <article className="relative overflow-hidden rounded-2xl bg-muted/50 border border-border">
      {post.frontmatter.heroImage && (
        <Image
          src={post.frontmatter.heroImage}
          alt={post.frontmatter.title}
          width={800}
          height={256}
          className="w-full h-64 object-cover"
          priority
        />
      )}
      <div className="p-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <time>{new Date(post.frontmatter.date).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
          })}</time>
          {post.frontmatter.readingTime && (
            <>
              <span>·</span>
              <span>{post.frontmatter.readingTime} min read</span>
            </>
          )}
        </div>
        <Link href={url}>
          <h2 className="text-3xl font-bold mb-2 hover:text-muted-foreground transition-colors">
            {post.frontmatter.title}
          </h2>
        </Link>
        {post.frontmatter.subtitle && (
          <p className="text-lg text-muted-foreground">{post.frontmatter.subtitle}</p>
        )}
        <div className="flex gap-2 mt-4">
          {post.frontmatter.tags?.map(tag => (
            <Link
              key={tag}
              href={`/tags/${tag}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              #{tag}
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}

function PostCard({ post }: { post: PostMeta }) {
  const url = `/${post.year}/${post.month}/${post.slug}`;

  return (
    <article className="p-6 rounded-lg border border-border hover:border-foreground/20 transition-colors">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <time>{new Date(post.frontmatter.date).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric'
        })}</time>
        {post.frontmatter.readingTime && (
          <>
            <span>·</span>
            <span>{post.frontmatter.readingTime} min</span>
          </>
        )}
      </div>
      <Link href={url}>
        <h3 className="text-xl font-semibold mb-1 hover:text-muted-foreground transition-colors">
          {post.frontmatter.title}
        </h3>
      </Link>
      {post.frontmatter.subtitle && (
        <p className="text-muted-foreground line-clamp-2">{post.frontmatter.subtitle}</p>
      )}
      <div className="flex gap-2 mt-3">
        {post.frontmatter.tags?.slice(0, 3).map(tag => (
          <span key={tag} className="text-xs text-muted-foreground">#{tag}</span>
        ))}
      </div>
    </article>
  );
}

export default async function HomePage() {
  const posts = await getAllPosts();
  const [featured, ...rest] = posts;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-2">Publishing Engine</h1>
        <p className="text-lg text-muted-foreground">Thoughts on engineering, AI, and building things</p>
      </header>

      {featured && (
        <section className="mb-12">
          <FeaturedPost post={featured} />
        </section>
      )}

      {rest.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-6">Recent Posts</h2>
          <div className="grid gap-4">
            {rest.map(post => (
              <PostCard key={`${post.year}/${post.month}/${post.slug}`} post={post} />
            ))}
          </div>
        </section>
      )}

      {posts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No posts yet. Start writing!</p>
        </div>
      )}
    </div>
  );
}

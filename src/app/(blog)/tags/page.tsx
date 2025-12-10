import Link from 'next/link';
import { getAllTags } from '@/lib/content/reader';

export default async function TagsPage() {
  const tags = await getAllTags();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Tags</h1>

      <div className="flex flex-wrap gap-3">
        {tags.map(({ tag, count }) => (
          <Link
            key={tag}
            href={`/tags/${tag}`}
            className="px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
          >
            <span className="font-medium">#{tag}</span>
            <span className="ml-2 text-muted-foreground">({count})</span>
          </Link>
        ))}
      </div>

      {tags.length === 0 && (
        <p className="text-muted-foreground">No tags yet.</p>
      )}
    </div>
  );
}

import Link from 'next/link';
import { getAllTags } from '@/lib/content/reader';

export default async function TagsPage() {
  const tags = await getAllTags();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <header className="mb-10">
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Back
          </Link>
          <h1 className="text-3xl font-semibold text-gray-900 mt-4">Tags</h1>
        </header>

        <div className="flex flex-wrap gap-3">
          {tags.map(({ tag, count }) => (
            <Link
              key={tag}
              href={`/tags/${tag}`}
              className="px-3 py-1.5 bg-gray-100 rounded text-sm hover:bg-gray-200 transition-colors"
            >
              <span className="text-gray-700">{tag}</span>
              <span className="ml-1.5 text-gray-400">({count})</span>
            </Link>
          ))}
        </div>

        {tags.length === 0 && (
          <p className="text-gray-500">No tags yet.</p>
        )}
      </div>
    </div>
  );
}

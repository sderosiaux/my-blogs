---
title: "Using GitHub as Your Database"
subtitle: "Why a git repo might be all you need"
status: published
tags:
  - "architecture"
  - "github"
  - "simplicity"
slug: github-as-database
publishedAt: "2024-12-10T12:00:00.000Z"
createdAt: "2024-12-10T12:00:00.000Z"
updatedAt: "2024-12-10T12:00:00.000Z"
---

For many projects, a traditional database is overkill. If your data is:

- **Mostly static** (blog posts, docs, configs)
- **Version controlled** (you want history)
- **Developer-edited** (not user-generated)

Then GitHub might be your database.

## How It Works

Instead of SQL queries, you use the GitHub API:

```typescript
// Read a file
const { data } = await octokit.rest.repos.getContent({
  owner: 'you',
  repo: 'my-blog',
  path: 'content/notes/my-post.md'
});

// Update a file
await octokit.rest.repos.createOrUpdateFileContents({
  owner: 'you',
  repo: 'my-blog',
  path: 'content/notes/my-post.md',
  message: 'Update post',
  content: Buffer.from(newContent).toString('base64'),
  sha: existingSha
});
```

## Benefits

1. **Free hosting** - GitHub stores your data
2. **Built-in versioning** - Every change is a commit
3. **No infrastructure** - No DB to manage
4. **Works offline** - Clone and edit locally
5. **Portable** - It's just files

## Trade-offs

- Not for high-write workloads
- API rate limits apply
- No complex queries
- Slower than a real DB

## When to Use

Perfect for:
- Personal blogs
- Documentation sites
- Config management
- Small content sites

Skip it for:
- User-generated content
- Real-time apps
- High-traffic writes

Sometimes the simplest solution is the best one.

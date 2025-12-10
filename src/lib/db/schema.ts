import { pgTable, uuid, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

export const notes = pgTable('notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title'),
  content: text('content').notNull(),
  urls: text('urls').array().default([]),
  tags: text('tags').array().default([]),
  status: text('status').notNull().default('idea'), // idea | draft | ready | scheduled | published | archived
  slug: text('slug'),
  heroImageId: uuid('hero_image_id'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const images = pgTable('images', {
  id: uuid('id').defaultRandom().primaryKey(),
  noteId: uuid('note_id').references(() => notes.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  prompt: text('prompt').notNull(),
  style: text('style'),
  provider: text('provider').notNull(), // gemini | manual
  isHero: boolean('is_hero').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const jobRuns = pgTable('job_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  jobName: text('job_name').notNull(),
  status: text('status').notNull(), // running | completed | failed
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  result: jsonb('result'),
  error: text('error'),
});

// Type exports
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;
export type JobRun = typeof jobRuns.$inferSelect;

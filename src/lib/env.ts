import { z } from 'zod';

const envSchema = z.object({
  // GitHub (content storage)
  GITHUB_TOKEN: z.string(),
  GITHUB_OWNER: z.string(),
  GITHUB_REPO: z.string(),
  GITHUB_BRANCH: z.string().default('main'),

  // Auth
  ADMIN_TOKEN: z.string().min(32),

  // R2 Storage (optional)
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().url().optional(),

  // AI Services (optional)
  ANTHROPIC_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),

  // Vercel (optional)
  VERCEL_DEPLOY_HOOK: z.string().url().optional(),

  // Runtime
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

function getEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

export const env = getEnv();

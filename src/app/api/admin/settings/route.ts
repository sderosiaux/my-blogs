import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from 'octokit';
import { z } from 'zod';

const settingsSchema = z.object({
  enabled: z.boolean(),
  schedule: z.string(),
  hnEnabled: z.boolean(),
  hnMinScore: z.number(),
  redditEnabled: z.boolean(),
  subreddits: z.array(z.string()),
  topics: z.array(z.string()),
  relevanceThreshold: z.number().min(0).max(1),
});

type Settings = z.infer<typeof settingsSchema>;

const SETTINGS_PATH = 'automation-settings.json';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const owner = process.env.GITHUB_OWNER!;
const repo = process.env.GITHUB_REPO!;
const branch = process.env.GITHUB_BRANCH || 'main';

async function getSettings(): Promise<{ settings: Settings; sha: string | null }> {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: SETTINGS_PATH,
      ref: branch,
    });

    if ('content' in data) {
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      const settings = JSON.parse(content);
      return { settings, sha: data.sha };
    }
  } catch (error: any) {
    // File doesn't exist yet, return defaults
    if (error.status === 404) {
      return {
        settings: {
          enabled: false,
          schedule: '0 2 * * *',
          hnEnabled: true,
          hnMinScore: 100,
          redditEnabled: true,
          subreddits: ['programming', 'MachineLearning', 'LocalLLaMA', 'ExperiencedDevs'],
          topics: ['AI', 'LLM', 'distributed systems', 'Kafka', 'Flink', 'data engineering'],
          relevanceThreshold: 0.7,
        },
        sha: null,
      };
    }
    throw error;
  }

  throw new Error('Invalid settings file format');
}

async function saveSettings(settings: Settings, sha: string | null): Promise<void> {
  const content = Buffer.from(JSON.stringify(settings, null, 2)).toString('base64');

  await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: SETTINGS_PATH,
    message: 'Update automation settings',
    content,
    branch,
    sha: sha || undefined,
  });
}

export async function GET(request: NextRequest) {
  try {
    const { settings } = await getSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Failed to get settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const settings = settingsSchema.parse(body);

    const { sha } = await getSettings();
    await saveSettings(settings, sha);

    return NextResponse.json({ settings, success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid settings', details: error.issues }, { status: 400 });
    }
    console.error('Failed to save settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

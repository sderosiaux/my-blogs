import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables
vi.stubEnv('GITHUB_TOKEN', 'test-github-token');
vi.stubEnv('GITHUB_OWNER', 'test-owner');
vi.stubEnv('GITHUB_REPO', 'test-repo');
vi.stubEnv('GITHUB_BRANCH', 'main');
vi.stubEnv('ADMIN_TOKEN', 'test-token-1234567890123456789012345678901234567890');
vi.stubEnv('R2_ACCOUNT_ID', 'test-account');
vi.stubEnv('R2_ACCESS_KEY_ID', 'test-key');
vi.stubEnv('R2_SECRET_ACCESS_KEY', 'test-secret');
vi.stubEnv('R2_BUCKET_NAME', 'test-bucket');
vi.stubEnv('R2_PUBLIC_URL', 'https://test.r2.dev');
vi.stubEnv('ANTHROPIC_API_KEY', 'test-anthropic-key');
vi.stubEnv('GEMINI_API_KEY', 'test-gemini-key');

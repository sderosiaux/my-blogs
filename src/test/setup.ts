import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables
vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test');
vi.stubEnv('ADMIN_TOKEN', 'test-token-12345');
vi.stubEnv('R2_ACCOUNT_ID', 'test-account');
vi.stubEnv('R2_ACCESS_KEY_ID', 'test-key');
vi.stubEnv('R2_SECRET_ACCESS_KEY', 'test-secret');
vi.stubEnv('R2_BUCKET_NAME', 'test-bucket');
vi.stubEnv('R2_PUBLIC_URL', 'https://test.r2.dev');
vi.stubEnv('ANTHROPIC_API_KEY', 'test-anthropic-key');
vi.stubEnv('GEMINI_API_KEY', 'test-gemini-key');

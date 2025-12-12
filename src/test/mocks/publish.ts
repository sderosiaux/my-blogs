import { vi } from 'vitest';
import type { PublishResult } from '@/lib/publish/service';

export const mockPublishSuccess: PublishResult = {
  success: true,
  slug: 'test-note',
};

export const mockPublishError: PublishResult = {
  success: false,
  error: 'Mock error',
};

export function createMockPublishService() {
  return {
    publishNote: vi.fn().mockResolvedValue(mockPublishSuccess),
    unpublishNote: vi.fn().mockResolvedValue(mockPublishSuccess),
  };
}

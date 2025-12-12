import { vi } from 'vitest';

export const mockGeneratedDraft = `# Generated Draft

This is AI-generated content based on the input.

## Key Points
- Point 1
- Point 2
- Point 3

## Conclusion
This concludes the draft.`;

export function createMockAIService() {
  return {
    generateDraft: vi.fn().mockResolvedValue(mockGeneratedDraft),
  };
}

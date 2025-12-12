import { NextRequest, NextResponse } from 'next/server';
import { vi } from 'vitest';

/**
 * Creates a mock NextRequest for testing
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = 'GET', body, headers = {} } = options;

  const request = new NextRequest(url, {
    method,
    headers: new Headers(headers),
    body: body ? JSON.stringify(body) : undefined,
  });

  return request;
}

/**
 * Parses NextResponse to get JSON body and status
 */
export async function parseResponse(response: NextResponse) {
  const status = response.status;
  const body = await response.json();
  return { status, body };
}

/**
 * Creates mock params for dynamic route segments
 */
export function createMockParams<T extends Record<string, string>>(
  params: T
): { params: Promise<T> } {
  return { params: Promise.resolve(params) };
}

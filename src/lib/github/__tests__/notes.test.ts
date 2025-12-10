import { describe, it, expect } from 'vitest';
import { isValidTransition } from '../types';

describe('isValidTransition', () => {
  it('allows idea → draft', () => {
    expect(isValidTransition('idea', 'draft')).toBe(true);
  });

  it('allows draft → ready', () => {
    expect(isValidTransition('draft', 'ready')).toBe(true);
  });

  it('allows ready → published', () => {
    expect(isValidTransition('ready', 'published')).toBe(true);
  });

  it('allows ready → scheduled', () => {
    expect(isValidTransition('ready', 'scheduled')).toBe(true);
  });

  it('disallows idea → published directly', () => {
    expect(isValidTransition('idea', 'published')).toBe(false);
  });

  it('allows any state → archived', () => {
    expect(isValidTransition('idea', 'archived')).toBe(true);
    expect(isValidTransition('draft', 'archived')).toBe(true);
    expect(isValidTransition('ready', 'archived')).toBe(true);
    expect(isValidTransition('published', 'archived')).toBe(true);
  });

  it('allows published → draft for revision', () => {
    expect(isValidTransition('published', 'draft')).toBe(true);
  });

  it('allows archived → idea or draft for revival', () => {
    expect(isValidTransition('archived', 'idea')).toBe(true);
    expect(isValidTransition('archived', 'draft')).toBe(true);
  });

  it('disallows draft → published directly', () => {
    expect(isValidTransition('draft', 'published')).toBe(false);
  });
});

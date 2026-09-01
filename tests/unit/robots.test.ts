import { describe, expect, it } from 'vitest';

import { robotsAllows } from '@/lib/robots';

describe('robots policy', () => {
  it('allows the root when no matching rule exists', () => {
    expect(robotsAllows('User-agent: *\nDisallow: /private', '/')).toBe(true);
  });

  it('honors a root exclusion', () => {
    expect(robotsAllows('User-agent: *\nDisallow: /', '/')).toBe(false);
  });

  it('prefers a specific group and the longest matching rule', () => {
    const source = [
      'User-agent: *',
      'Disallow: /',
      'User-agent: iswebmcp-research',
      'Disallow: /',
      'Allow: /public',
    ].join('\n');
    expect(robotsAllows(source, '/public')).toBe(true);
    expect(robotsAllows(source, '/')).toBe(false);
  });

  it('treats an empty disallow as permission', () => {
    expect(robotsAllows('User-agent: *\nDisallow:', '/')).toBe(true);
  });
});

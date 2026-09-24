import { describe, expect, it } from 'vitest';
import { isAuthorised } from './cronAuth';

describe('isAuthorised', () => {
  it('accepts only the exact bearer secret', () => {
    expect(isAuthorised('Bearer s3cret-value', 's3cret-value')).toBe(true);
    expect(isAuthorised('Bearer wrong', 's3cret-value')).toBe(false);
    expect(isAuthorised('s3cret-value', 's3cret-value')).toBe(false);
    expect(isAuthorised(null, 's3cret-value')).toBe(false);
  });
  it('always refuses when no secret is configured', () => {
    expect(isAuthorised('Bearer ', '')).toBe(false);
    expect(isAuthorised('Bearer undefined', undefined)).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import config from '../../../app.config';

describe('mobile authentication configuration', () => {
  it('registers the stable callback scheme and secure Clerk plugins', () => {
    expect(config.scheme).toBe('fitforge');
    expect(config.plugins).toEqual(expect.arrayContaining(['expo-secure-store', '@clerk/expo']));
  });

  it('keeps native identifiers aligned for Clerk callbacks', () => {
    expect(config.ios?.bundleIdentifier).toBe('com.devanshudesai.fitforge');
    expect(config.android?.package).toBe('com.devanshudesai.fitforge');
  });
});

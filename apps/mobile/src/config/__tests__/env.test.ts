import { describe, expect, it } from 'vitest';
import { parseMobileEnv } from '../env';

const valid = {
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_example',
  EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
  EXPO_PUBLIC_API_BASE_URL: 'https://fitforge.example.com',
};

describe('parseMobileEnv', () => {
  it('returns validated public configuration', () => {
    expect(parseMobileEnv(valid)).toEqual(valid);
  });

  it('rejects missing configuration', () => {
    expect(() => parseMobileEnv({})).toThrow('Missing mobile environment variables');
  });

  it('rejects a service-role key', () => {
    expect(() =>
      parseMobileEnv({
        ...valid,
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'service_role_secret',
      }),
    ).toThrow('privileged Supabase key');
  });
});

import { useSession } from '@clerk/clerk-react';
import { createClient } from '@supabase/supabase-js';
import { useMemo } from 'react';

export function useSupabase() {
  const { session } = useSession();

  return useMemo(() => {
    return createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      {
        global: {
          // Instruct Supabase to always attach the Clerk Auth JWT instead of the default Anon JWT
          fetch: async (url, options = {}) => {
            if (session) {
              const clerkToken = await session.getToken({
                template: 'supabase',
              });

              // Construct the headers object from options, then apply our token!
              const headers = new Headers(options?.headers);
              headers.set('Authorization', `Bearer ${clerkToken}`);

              return fetch(url, {
                ...options,
                headers,
              });
            } else {
              // Non-authenticated fallback (queries will only hit tables with Public Select RLS)
              return fetch(url, options);
            }
          },
        },
      }
    );
  }, [session]);
}

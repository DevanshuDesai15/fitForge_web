import { useSession } from '@clerk/clerk-react';
import { useEffect } from 'react';
import {
  getSupabaseClient,
  setSupabaseTokenProvider,
} from '../services/supabaseClient';

export function useSupabase() {
  const { session } = useSession();

  useEffect(() => {
    if (!session) {
      return setSupabaseTokenProvider(null);
    }

    return setSupabaseTokenProvider(() => session.getToken());
  }, [session]);

  return getSupabaseClient();
}

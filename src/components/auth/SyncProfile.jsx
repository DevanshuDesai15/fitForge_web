import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSupabase } from '../../hooks/useSupabase';
import { buildProfileSyncPayload } from './profileSync';

export default function SyncProfile() {
    const { user, isLoaded } = useUser();
    const supabase = useSupabase();

    useEffect(() => {
        async function syncUserToSupabase() {
            if (!isLoaded || !user) return;

            try {
                const { data: existingProfile, error: profileLookupError } = await supabase
                    .from('profiles')
                    .select('display_name')
                    .eq('id', user.id)
                    .maybeSingle();

                if (profileLookupError) {
                    throw profileLookupError;
                }

                const payload = buildProfileSyncPayload({
                    user,
                    existingProfile,
                });

                const { error } = await supabase
                    .from('profiles')
                    .upsert(payload, { onConflict: 'id' });

                if (error) {
                    console.error('Failed to sync Clerk profile to Supabase:', error);
                }
            } catch (err) {
                console.error('Network or unhandled error during sync:', err);
            }
        }

        syncUserToSupabase();
    }, [user, isLoaded, supabase]);

    // This component renders nothing; it acts purely as a lifecycle hook wrapper
    return null;
}

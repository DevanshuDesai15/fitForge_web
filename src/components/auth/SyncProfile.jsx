import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSupabase } from '../../hooks/useSupabase';

export default function SyncProfile() {
    const { user, isLoaded } = useUser();
    const supabase = useSupabase();

    useEffect(() => {
        async function syncUserToSupabase() {
            if (!isLoaded || !user) return;

            // Blind upsert: ensure Clerk user exists in Supabase profiles
            // We only map standard basic details on auth state changes
            try {
                const { error } = await supabase
                    .from('profiles')
                    .upsert({
                        id: user.id,
                        email: user.primaryEmailAddress?.emailAddress || null,
                        display_name: user.fullName || user.firstName || 'New Lifter'
                    }, { onConflict: 'id' });

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

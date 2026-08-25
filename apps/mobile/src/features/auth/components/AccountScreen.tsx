import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useAuth } from '@clerk/expo';
import { Alert, Button, Card, Chip, colors, fontSizes, fontWeights, spacing } from '@/design-system';
import { Screen } from '@/features/app-shell/Screen';
import { useAuthBootstrap } from '../providers/AuthBootstrapProvider';
import { performSignOut } from '../model/sign-out-policy';
import { partitionStore } from '../services/partition-store';
import { pendingWorkInspector } from '../services/pending-work';
import { SignOutDialog } from './SignOutDialog';

export function AccountScreen() {
  const { signOut } = useAuth();
  const { profile } = useAuthBootstrap();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const askToSignOut = async () => { setError(null); setPendingCount(await pendingWorkInspector.countForActiveUser()); setDialogOpen(true); };
  const confirm = async () => {
    setBusy(true); setError(null);
    try {
      await performSignOut({ pendingCount, acknowledged: true, signOut, clearPartition: partitionStore.clear });
      setDialogOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to sign out. Please try again.');
    } finally { setBusy(false); }
  };
  return <Screen eyebrow="ACCOUNT" title="Profile">
    {error ? <Alert tone="error">{error}</Alert> : null}
    <Card tone="accent"><Chip label="SUPABASE PROFILE" tone="accent" /><Text style={styles.name}>{profile?.display_name || 'FitForge athlete'}</Text><Text style={styles.email}>{profile?.email || 'Email managed by your sign-in account'}</Text></Card>
    <Card tone="quiet" style={styles.card}><Text style={styles.heading}>Account access</Text><Text style={styles.copy}>Your authenticated profile is connected. Full profile editing arrives in its dedicated phase.</Text><Button variant="outline" onPress={askToSignOut}>Sign out</Button></Card>
    <SignOutDialog open={dialogOpen} pendingCount={pendingCount} busy={busy} onCancel={() => setDialogOpen(false)} onConfirm={confirm} />
  </Screen>;
}
const styles = StyleSheet.create({ card: { marginTop: spacing[4], gap: spacing[4] }, name: { color: colors.text.primary, fontFamily: fontWeights.heavy, fontSize: fontSizes.h2, marginTop: spacing[4] }, email: { color: colors.text.muted, fontFamily: fontWeights.regular, fontSize: fontSizes.base, marginTop: spacing[1] }, heading: { color: colors.text.primary, fontFamily: fontWeights.bold, fontSize: fontSizes.xl }, copy: { color: colors.text.muted, fontFamily: fontWeights.regular, fontSize: fontSizes.base, lineHeight: 21 } });

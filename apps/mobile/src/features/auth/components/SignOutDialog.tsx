import { StyleSheet, Text } from 'react-native';
import { Button, Dialog, colors, fontSizes, fontWeights } from '@/design-system';

export function SignOutDialog({ open, pendingCount, busy, onCancel, onConfirm }: { open: boolean; pendingCount: number; busy?: boolean; onCancel: () => void; onConfirm: () => void }) {
  const hasPending = pendingCount > 0;
  return <Dialog open={open} onClose={busy ? undefined : onCancel} title="Sign out of FitForge?" subtitle={hasPending ? `${pendingCount} local ${pendingCount === 1 ? 'change has' : 'changes have'} not synced yet.` : 'Your cloud-synced data remains in your account.'} footer={<><Button variant="ghost" disabled={busy} onPress={onCancel}>Cancel</Button><Button variant={hasPending ? 'danger' : 'primary'} loading={busy} onPress={onConfirm}>{hasPending ? 'Sign out anyway' : 'Sign out'}</Button></>}>
    <Text style={styles.copy}>{hasPending ? 'Signing out may make those local changes unavailable until you return to this account. Supabase data remains the source of truth.' : 'You can sign back in on this device at any time.'}</Text>
  </Dialog>;
}

const styles = StyleSheet.create({ copy: { color: colors.text.muted, fontFamily: fontWeights.regular, fontSize: fontSizes.base, lineHeight: 21 } });

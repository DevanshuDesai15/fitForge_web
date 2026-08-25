import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Alert, Button, Input, Tabs, colors, fontSizes, fontWeights, spacing } from '@/design-system';
import { routes } from '@/navigation/routes';
import { clerkError } from '../model/auth-errors';
import { useEmailSignIn } from '../hooks/useEmailSignIn';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { usePendingVerification } from '../store/pending-verification';
import { AuthHeadline, AuthShell } from './AuthShell';
import { GoogleButton } from './GoogleButton';

export function SignInScreen() {
  const router = useRouter(); const { controller, fetchStatus } = useEmailSignIn(); const google = useGoogleAuth(); const { setPending } = usePendingVerification();
  const [mode, setMode] = useState('password'); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const submit = async () => { if (!controller) return; setBusy(true); setError(null); try { if (mode === 'code') { await controller.sendCode(email); setPending({ kind: 'sign-in-code', email: email.trim().toLowerCase() }); router.push(routes.verification); } else { const result = await controller.password(email, password); if (result === 'device-trust') { setPending({ kind: 'device-trust', email: email.trim().toLowerCase() }); router.push(routes.verification); } } } catch (value) { setError(clerkError(value).message); } finally { setBusy(false); } };
  const googleSubmit = async () => { setBusy(true); setError(null); try { const result = await google(); if (result === 'incomplete') setError('Google needs another verification step. Return to sign in and try your email instead.'); } catch (value) { setError(clerkError(value).message); } finally { setBusy(false); } };
  const loading = busy || fetchStatus === 'fetching';
  return <AuthShell onBack={() => router.back()} footer={<View style={styles.stack}><Button fullWidth size="lg" loading={loading} onPress={submit}>{mode === 'code' ? 'Email me a code' : 'Sign in'}</Button><Button fullWidth variant="ghost" onPress={() => router.replace(routes.signUp)}>New here? Create an account</Button></View>}><AuthHeadline title="Back under the bar." subtitle="Your history, programs, and progress are waiting." />{error ? <Alert tone="error">{error}</Alert> : null}<View style={styles.stack}><GoogleButton onPress={googleSubmit} disabled={loading} loading={busy} /><View style={styles.rule}><View style={styles.line} /><Text style={styles.or}>OR</Text><View style={styles.line} /></View><Tabs variant="segmented" value={mode} onChange={setMode} tabs={[{ id: 'password', label: 'Password', icon: 'lock' }, { id: 'code', label: 'Email code', icon: 'mail' }]} /><Input label="Email" accessibilityLabel="Email" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" value={email} onChangeText={setEmail} />{mode === 'password' ? <Input label="Password" accessibilityLabel="Password" secureTextEntry value={password} onChangeText={setPassword} /> : <Text style={styles.hint}>Clerk will send a one-time code to this address.</Text>}</View></AuthShell>;
}
const styles = StyleSheet.create({ stack: { gap: spacing[4] }, rule: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] }, line: { flex: 1, height: 1, backgroundColor: colors.border.main }, or: { color: colors.text.faint, fontFamily: fontWeights.bold, fontSize: fontSizes.xs }, hint: { color: colors.text.muted, fontFamily: fontWeights.regular, fontSize: fontSizes.sm } });

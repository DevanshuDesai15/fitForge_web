import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Alert, Button, Input, colors, fontSizes, fontWeights, spacing } from '@/design-system';
import { routes } from '@/navigation/routes';
import { clerkError } from '../model/auth-errors';
import { useEmailSignUp } from '../hooks/useEmailSignUp';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { usePendingVerification } from '../store/pending-verification';
import { AuthHeadline, AuthShell } from './AuthShell';
import { GoogleButton } from './GoogleButton';

export function SignUpScreen() {
  const router = useRouter(); const { controller, fetchStatus } = useEmailSignUp(); const google = useGoogleAuth(); const { setPending } = usePendingVerification();
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const submit = async () => { if (!controller) return; const [firstName = '', ...rest] = name.trim().split(/\s+/); setBusy(true); setError(null); try { await controller.start({ email, password, firstName, lastName: rest.join(' ') }); setPending({ kind: 'sign-up', email: email.trim().toLowerCase() }); router.push(routes.verification); } catch (value) { setError(clerkError(value).message); } finally { setBusy(false); } };
  const googleSubmit = async () => { setBusy(true); setError(null); try { const result = await google(); if (result === 'incomplete') setError('Google needs more account information. Sign up with email to continue.'); } catch (value) { setError(clerkError(value).message); } finally { setBusy(false); } };
  const loading = busy || fetchStatus === 'fetching';
  return <AuthShell onBack={() => router.back()} footer={<View style={styles.stack}><Button fullWidth size="lg" loading={loading} onPress={submit}>Create account</Button><Button fullWidth variant="ghost" onPress={() => router.replace(routes.signIn)}>Already training here? Sign in</Button></View>}><AuthHeadline title="Start forging." subtitle="Two minutes now. Every session after this gets easier." />{error ? <Alert tone="error">{error}</Alert> : null}<View style={styles.stack}><GoogleButton label="Sign up with Google" onPress={googleSubmit} disabled={loading} loading={busy} /><View style={styles.rule}><View style={styles.line} /><Text style={styles.or}>OR</Text><View style={styles.line} /></View><Input label="Name" accessibilityLabel="Name" autoCapitalize="words" value={name} onChangeText={setName} /><Input label="Email" accessibilityLabel="Email" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" value={email} onChangeText={setEmail} /><Input label="Password" accessibilityLabel="Password" secureTextEntry value={password} onChangeText={setPassword} hint="Clerk applies your account's password requirements." /><Text style={styles.terms}>Creating an account accepts the Terms and Privacy Policy. Your training data remains yours.</Text></View></AuthShell>;
}
const styles = StyleSheet.create({ stack: { gap: spacing[4] }, rule: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] }, line: { flex: 1, height: 1, backgroundColor: colors.border.main }, or: { color: colors.text.faint, fontFamily: fontWeights.bold, fontSize: fontSizes.xs }, terms: { color: colors.text.faint, fontFamily: fontWeights.regular, fontSize: fontSizes.sm, lineHeight: 19 } });

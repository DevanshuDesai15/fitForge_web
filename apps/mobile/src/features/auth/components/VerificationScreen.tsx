import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Alert, Button, CodeInput, colors, fontSizes, fontWeights, spacing } from '@/design-system';
import { routes } from '@/navigation/routes';
import { clerkError } from '../model/auth-errors';
import { useEmailSignIn } from '../hooks/useEmailSignIn';
import { useEmailSignUp } from '../hooks/useEmailSignUp';
import { usePendingVerification } from '../store/pending-verification';
import { AuthHeadline, AuthShell } from './AuthShell';

export function VerificationScreen() {
  const router = useRouter(); const { pending, setPending } = usePendingVerification(); const signIn = useEmailSignIn(); const signUp = useEmailSignUp();
  const [code, setCode] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null); const [sent, setSent] = useState(false);
  if (!pending) return <AuthShell><AuthHeadline title="No code pending." subtitle="Start again and we will send a fresh code." /><Button onPress={() => router.replace(routes.signIn)}>Return to sign in</Button></AuthShell>;
  const verify = async () => { setBusy(true); setError(null); try { if (pending.kind === 'sign-up') await signUp.controller?.verifyCode(code); else if (pending.kind === 'device-trust') await signIn.controller?.verifyDeviceTrust(code); else await signIn.controller?.verifyCode(code); setPending(null); } catch (value) { setError(clerkError(value).message); } finally { setBusy(false); } };
  const resend = async () => { setBusy(true); setError(null); setSent(false); try { if (pending.kind === 'sign-up') await signUp.controller?.resendCode(); else await signIn.controller?.resendCode(pending.kind === 'device-trust' ? 'device-trust' : 'email-code', pending.email); setSent(true); } catch (value) { setError(clerkError(value).message); } finally { setBusy(false); } };
  return <AuthShell onBack={() => { setPending(null); router.back(); }} footer={<View style={styles.stack}><Button fullWidth size="lg" loading={busy} disabled={code.length !== 6} onPress={verify}>Verify and continue</Button><Button fullWidth variant="ghost" disabled={busy} onPress={resend}>Send another code</Button></View>}><AuthHeadline title={pending.kind === 'device-trust' ? 'Trust this device.' : 'Check your email.'} subtitle={`Clerk sent a six-digit code to ${pending.email}.`} />{error ? <Alert tone="error">{error}</Alert> : null}{sent ? <Alert tone="success">A fresh code is on the way.</Alert> : null}<View style={styles.code}><CodeInput length={6} value={code} onChange={setCode} onComplete={() => undefined} autoFocus /><Text style={styles.hint}>The code and resend limits are controlled by Clerk.</Text></View></AuthShell>;
}
const styles = StyleSheet.create({ stack: { gap: spacing[3] }, code: { gap: spacing[4] }, hint: { color: colors.text.faint, fontFamily: fontWeights.regular, fontSize: fontSizes.sm, textAlign: 'center' } });

import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AISuggestionCard, Button, Card, Heatmap, ProgressBar, colors, fontSizes, fontWeights, spacing } from '@/design-system';
import { routes } from '@/navigation/routes';

const slides = [
  { eyebrow: 'LOG IT LIVE', title: 'Every set. On the record.', body: 'Weight and reps go in the moment the bar comes down—not from memory later.', visual: 'sets' },
  { eyebrow: 'AI PROGRESSION', title: 'The plateau has nowhere to hide.', body: 'Your coach spots stalled lifts and brings the next load.', visual: 'ai' },
  { eyebrow: 'RECEIPTS', title: 'Proof, not vibes.', body: 'Streaks, volume, and PRs kept honest, one session at a time.', visual: 'history' },
] as const;

export function WelcomeScreen() {
  const [index, setIndex] = useState(0); const router = useRouter(); const slide = slides[index];
  return <View style={styles.root}><View style={styles.header}><Text style={styles.brand}>FITFORGE</Text><Button variant="ghost" size="sm" onPress={() => router.push(routes.signIn)}>Skip</Button></View><View style={styles.visual}>{slide.visual === 'sets' ? <Card><Text style={styles.cardTitle}>Bench Press</Text><ProgressBar value={3} max={4} label="SET 3 / 4" valueLabel="82.5 kg × 8" /></Card> : slide.visual === 'ai' ? <AISuggestionCard title="Increase weight" description="Bench Press—go to 82.5 kg for 8." priority="high" confidence={0.87} /> : <Card><Heatmap values={Array.from({ length: 35 }, (_, value) => value % 4 === 0 ? 1 : 0)} year={2026} totalWorkouts={12} workoutDays={9} /></Card>}</View><View style={styles.copy}><Text style={styles.eyebrow}>{String(index + 1).padStart(2, '0')} / 03 · {slide.eyebrow}</Text><Text accessibilityRole="header" style={styles.title}>{slide.title}</Text><Text style={styles.body}>{slide.body}</Text></View><View style={styles.dots}>{slides.map((item, itemIndex) => <Button key={item.eyebrow} accessibilityLabel={`Welcome card ${itemIndex + 1}`} variant={itemIndex === index ? 'primary' : 'ghost'} size="sm" onPress={() => setIndex(itemIndex)}>{itemIndex + 1}</Button>)}</View><Button fullWidth size="lg" onPress={() => router.push(routes.signUp)}>Create your account</Button><Button fullWidth variant="ghost" onPress={() => router.push(routes.signIn)}>Already training here? Sign in</Button></View>;
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.surface.canvas, padding: spacing[5], paddingBottom: spacing[8] }, header: { minHeight: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, brand: { color: colors.accent, fontFamily: fontWeights.heavy, fontSize: fontSizes.xl }, visual: { flex: 1, justifyContent: 'center' }, cardTitle: { color: colors.text.primary, fontFamily: fontWeights.bold, fontSize: fontSizes.xl, marginBottom: spacing[5] }, copy: { marginBottom: spacing[5] }, eyebrow: { color: colors.accent, fontFamily: fontWeights.monoBold, fontSize: fontSizes.xs }, title: { color: colors.text.primary, fontFamily: fontWeights.heavy, fontSize: 36, lineHeight: 38, marginVertical: spacing[3] }, body: { color: colors.text.secondary, fontFamily: fontWeights.regular, fontSize: fontSizes.xl, lineHeight: 27 }, dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing[2], marginBottom: spacing[4] } });

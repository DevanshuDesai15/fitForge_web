import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AISuggestionCard, Button, Card, Chip, Heatmap, SetRow, colors, fontSizes, fontWeights, radii, spacing } from '@/design-system';
import { routes } from '@/navigation/routes';
import { slideIndexFromOffset } from '../model/welcome-carousel';
import { FitForgeLogo } from './FitForgeLogo';

const buildYear = (seed = 7) => {
  const values: (number | null)[] = [];
  let randomSeed = seed;
  const random = () => (randomSeed = (randomSeed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let index = 0; index < 53 * 7; index += 1) values.push(index < 3 || index > 368 ? null : random() > 0.62 ? Math.ceil(random() * 2) : 0);
  return values;
};

const MONTH_WEEK_INDEXES = [0, 4, 9, 13, 18, 22, 26, 31, 35, 39, 44, 48];
const YEAR_MONTHS = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].map((label, index) => ({ label, weekIndex: MONTH_WEEK_INDEXES[index] ?? 0 }));
type Slide = { eyebrow: string; title: string; body: string; visual: ReactNode };

export function WelcomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const innerWidth = Math.max(1, width - spacing[10]);
  const activity = useMemo(() => buildYear(5), []);
  const slides: Slide[] = [
    { eyebrow: 'Log it live', title: 'Every set. On the record.', body: 'Weight and reps go in the moment the bar comes down — not from memory on the drive home.', visual: <Card padding="sm"><View style={styles.liftHead}><Text style={styles.liftName}>Bench Press</Text><Text style={styles.liftCount}>SET 3 / 4</Text></View><View style={styles.chipRow}><Chip label="Chest" /><Chip label="80 kg last time" tone="accent" icon="history" /></View><View style={styles.sets}><SetRow index={1} weight="80" reps="10" completed /><SetRow index={2} weight="80" reps="9" completed /><SetRow index={3} weight="82.5" reps="8" /></View></Card> },
    { eyebrow: 'AI progression', title: 'The plateau has nowhere to hide.', body: 'Six sessions stuck at 80 kg? Your coach says it out loud, with the next load already picked.', visual: <View style={styles.suggestions}><AISuggestionCard icon="trending-up" title="Increase Weight" priority="high" confidence={0.87} description="Bench Press — go to 82.5 kg for 8. You cleared 10 at 80 last session." /><AISuggestionCard icon="clock" title="Deload Week" priority="low" confidence={0.54} description="Barbell Row has flattened for three weeks. Drop to 55 kg and rebuild." /></View> },
    { eyebrow: 'Receipts', title: 'Proof, not vibes.', body: 'Streaks, volume and PRs, kept honest. The year fills in one session at a time.', visual: <Card padding="sm"><Heatmap year={2026} values={activity} months={YEAR_MONTHS} totalWorkouts={activity.filter(Boolean).length} workoutDays={365} todayIndex={368} dotSize={7} gap={3} fluid /></Card> },
  ];
  const settle = (event: NativeSyntheticEvent<NativeScrollEvent>) => setPage(slideIndexFromOffset(event.nativeEvent.contentOffset.x, innerWidth, slides.length));

  return <SafeAreaView edges={['top', 'bottom']} style={styles.safe}><View style={styles.root}>
    <View style={styles.header}><FitForgeLogo /><Pressable accessibilityRole="button" hitSlop={10} onPress={() => router.push(routes.signIn)}><Text style={styles.skip}>Skip</Text></Pressable></View>
    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={settle} style={styles.carousel} contentContainerStyle={styles.carouselContent}>
      {slides.map((slide, index) => <View key={slide.eyebrow} style={[styles.slide, { width: innerWidth }]}><View style={styles.visual}>{slide.visual}</View><View style={styles.copy}><Text style={styles.counter}>{`0${index + 1} / 0${slides.length} · ${slide.eyebrow}`}</Text><Text accessibilityRole="header" style={styles.hero}>{slide.title}</Text><Text style={styles.body}>{slide.body}</Text></View></View>)}
    </ScrollView>
    <View accessibilityRole="tablist" style={styles.dots}>{slides.map((slide, index) => <View key={slide.eyebrow} accessible accessibilityRole="tab" accessibilityLabel={`Welcome slide ${index + 1}`} accessibilityState={{ selected: index === page }} style={[styles.dot, index === page && styles.dotOn]} />)}</View>
    <View style={styles.actions}><Button fullWidth size="lg" onPress={() => router.push(routes.signUp)}>Create your account</Button><Button fullWidth variant="ghost" onPress={() => router.push(routes.signIn)}>Already training here? Sign in</Button></View>
  </View></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.canvas }, root: { flex: 1, paddingHorizontal: spacing[5], paddingBottom: spacing[6] },
  header: { minHeight: 40, marginBottom: spacing[2], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, skip: { paddingVertical: 10, color: colors.text.secondary, fontFamily: fontWeights.semibold, fontSize: fontSizes.lg },
  carousel: { flex: 1 }, carouselContent: { alignItems: 'center' }, slide: { justifyContent: 'center' }, visual: { minHeight: 300, justifyContent: 'center' }, copy: { marginTop: 28 },
  counter: { color: colors.accent, fontFamily: fontWeights.monoBold, fontSize: fontSizes.xs, letterSpacing: 1.5, textTransform: 'uppercase' }, hero: { marginTop: spacing[3], marginBottom: 10, color: colors.text.primary, fontFamily: fontWeights.heavy, fontSize: 36, lineHeight: 37, letterSpacing: -0.7 }, body: { color: colors.text.muted, fontFamily: fontWeights.regular, fontSize: fontSizes.xl, lineHeight: 26 },
  liftHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[3] }, liftName: { color: colors.text.primary, fontFamily: fontWeights.bold, fontSize: fontSizes.xl }, liftCount: { color: colors.text.secondary, fontFamily: fontWeights.monoBold, fontSize: fontSizes.xs }, chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[3] }, sets: { gap: spacing[2] }, suggestions: { gap: spacing[3] },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 7, marginTop: 26, marginBottom: spacing[5] }, dot: { width: 7, height: 7, borderRadius: radii.pill, backgroundColor: colors.border.strong }, dotOn: { width: 26, backgroundColor: colors.accent }, actions: { gap: spacing[2] },
});

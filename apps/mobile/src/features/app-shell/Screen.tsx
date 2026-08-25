import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSizes, fontWeights, spacing } from '@/design-system';

export function Screen({ title, eyebrow, action, children, scroll = true }: { title?: ReactNode; eyebrow?: string; action?: ReactNode; children: ReactNode; scroll?: boolean }) {
  const content = <View style={styles.content}>{eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}{title ? <View style={styles.header}><Text accessibilityRole="header" style={styles.title}>{title}</Text>{action}</View> : null}{children}</View>;
  return <SafeAreaView edges={['top']} style={styles.safe}>{scroll ? <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">{content}</ScrollView> : content}</SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.surface.canvas }, scroll: { flexGrow: 1 }, content: { flex: 1, padding: spacing[4], paddingBottom: spacing[20] }, eyebrow: { color: colors.accent, fontFamily: fontWeights.bold, fontSize: fontSizes.xs, letterSpacing: 1.4, marginBottom: spacing[2] }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[4], marginBottom: spacing[6] }, title: { flex: 1, color: colors.text.primary, fontFamily: fontWeights.heavy, fontSize: fontSizes.h1, letterSpacing: -0.6 } });

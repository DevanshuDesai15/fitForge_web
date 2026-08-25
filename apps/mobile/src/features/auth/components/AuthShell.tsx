import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { IconButton, colors, fontSizes, fontWeights, spacing } from '@/design-system';

export function AuthShell({ children, footer, onBack, step }: { children: ReactNode; footer?: ReactNode; onBack?: () => void; step?: string }) {
  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}><View style={styles.header}>{onBack ? <IconButton icon="arrow-left" label="Back" onPress={onBack} /> : null}<Text style={styles.brand}>FITFORGE</Text>{step ? <Text style={styles.step}>{step}</Text> : null}</View><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">{children}</ScrollView>{footer ? <View style={styles.footer}>{footer}</View> : null}</KeyboardAvoidingView>;
}

export function AuthHeadline({ title, subtitle }: { title: string; subtitle?: string }) { return <View style={styles.headline}><Text accessibilityRole="header" style={styles.title}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View>; }

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.surface.canvas, paddingHorizontal: spacing[5] }, header: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: spacing[3] }, brand: { color: colors.accent, fontFamily: fontWeights.heavy, fontSize: fontSizes.xl, letterSpacing: -0.5 }, step: { marginLeft: 'auto', color: colors.text.faint, fontFamily: fontWeights.mono, fontSize: fontSizes.xs }, content: { flexGrow: 1, paddingBottom: spacing[6] }, footer: { paddingBottom: spacing[6], paddingTop: spacing[3] }, headline: { marginTop: spacing[4], marginBottom: spacing[6] }, title: { color: colors.text.primary, fontFamily: fontWeights.heavy, fontSize: 34, lineHeight: 37 }, subtitle: { color: colors.text.secondary, fontFamily: fontWeights.regular, fontSize: fontSizes.lg, lineHeight: 24, marginTop: spacing[3] } });

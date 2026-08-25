import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconButton, colors, fontSizes, fontWeights, spacing } from '@/design-system';
import { FitForgeLogo } from './FitForgeLogo';

export function AuthShell({ children, footer, onBack, step }: { children: ReactNode; footer?: ReactNode; onBack?: () => void; step?: string }) {
  return <SafeAreaView edges={['top', 'bottom']} style={styles.safe}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}><View style={styles.header}>{onBack ? <IconButton icon="arrow-left" label="Back" onPress={onBack} /> : null}<FitForgeLogo size={32} variant="mark" />{step ? <Text style={styles.step}>{step}</Text> : null}</View><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">{children}</ScrollView>{footer ? <View style={styles.footer}>{footer}</View> : null}</KeyboardAvoidingView></SafeAreaView>;
}

export function AuthHeadline({ title, subtitle }: { title: string; subtitle?: string }) { return <View style={styles.headline}><Text accessibilityRole="header" style={styles.title}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View>; }

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.surface.canvas }, root: { flex: 1, paddingHorizontal: spacing[5] }, header: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: spacing[3] }, step: { marginLeft: 'auto', color: colors.text.faint, fontFamily: fontWeights.mono, fontSize: fontSizes.xs }, content: { flexGrow: 1, paddingBottom: spacing[6] }, footer: { paddingBottom: spacing[6], paddingTop: spacing[3] }, headline: { marginTop: spacing[4], marginBottom: spacing[6] }, title: { color: colors.text.primary, fontFamily: fontWeights.heavy, fontSize: 34, lineHeight: 37 }, subtitle: { color: colors.text.secondary, fontFamily: fontWeights.regular, fontSize: fontSizes.lg, lineHeight: 24, marginTop: spacing[3] } });

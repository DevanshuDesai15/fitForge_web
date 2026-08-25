import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type PressableProps, type ViewProps } from 'react-native';
import { Icon, type IconProps } from '../icon/Icon';
import { colors, effects, fontSizes, fontWeights, radii, sizes, spacing } from '../tokens';

type IconValue = IconProps['name'] | ReactNode;
const renderIcon = (value: IconValue | undefined, color: string, size = 18) =>
  typeof value === 'string' ? <Icon name={value} color={color} size={size} /> : value;

export type ButtonProps = PressableProps & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'; size?: 'sm' | 'md' | 'lg';
  icon?: IconValue; iconRight?: IconValue; pill?: boolean; fullWidth?: boolean; loading?: boolean; children: ReactNode;
};
export function Button({ variant = 'primary', size = 'md', icon, iconRight, pill, fullWidth, loading, disabled, children, style, accessibilityLabel, ...props }: ButtonProps) {
  const palette = buttonPalettes[variant];
  const inactive = Boolean(disabled || loading);
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? (typeof children === 'string' ? children : undefined)} accessibilityState={{ disabled: inactive, busy: loading }} disabled={inactive} {...props} style={(state) => [styles.button, buttonSizes[size], { backgroundColor: palette.background, borderColor: palette.border, opacity: inactive ? 0.48 : state.pressed ? 0.78 : 1, borderRadius: pill ? radii.pill : radii.xs }, fullWidth && styles.fullWidth, typeof style === 'function' ? style(state) : style]}>
    {loading ? <ActivityIndicator accessibilityLabel="Loading" color={palette.ink} /> : <>{renderIcon(icon, palette.ink)}<Text style={[styles.buttonText, { color: palette.ink }]}>{children}</Text>{renderIcon(iconRight, palette.ink)}</>}
  </Pressable>;
}
const buttonPalettes = {
  primary: { background: colors.accent, border: colors.accent, ink: colors.accentInk },
  secondary: { background: colors.surface.active, border: colors.border.main, ink: colors.text.primary },
  outline: { background: 'transparent', border: colors.border.accentStrong, ink: colors.accent },
  ghost: { background: 'transparent', border: 'transparent', ink: colors.text.primary },
  danger: { background: colors.status.errorWash, border: colors.status.error, ink: colors.status.errorInk },
};
const buttonSizes = { sm: { minHeight: sizes.tapMin, paddingHorizontal: spacing[3] }, md: { minHeight: sizes.tapMin, paddingHorizontal: spacing[4] }, lg: { minHeight: 52, paddingHorizontal: spacing[6] } };

export type IconButtonProps = Omit<PressableProps, 'children'> & { icon: IconValue; label: string; size?: 'sm' | 'md' | 'lg'; variant?: 'quiet' | 'accent' };
export function IconButton({ icon, label, size = 'md', variant = 'quiet', disabled, style, ...props }: IconButtonProps) {
  const box = size === 'sm' ? 36 : size === 'lg' ? 44 : 40;
  const ink = variant === 'accent' ? colors.accent : colors.text.primary;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: Boolean(disabled) }} disabled={Boolean(disabled)} {...props} style={(state) => [{ width: Math.max(box, sizes.tapMin), height: Math.max(box, sizes.tapMin), alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill, backgroundColor: variant === 'accent' ? colors.accentWash : colors.surface.hover, opacity: disabled ? 0.4 : state.pressed ? 0.7 : 1 }, typeof style === 'function' ? style(state) : style]}>{renderIcon(icon, ink, size === 'lg' ? 22 : 18)}</Pressable>;
}

export type CardProps = ViewProps & { tone?: 'default' | 'quiet' | 'accent' | 'success' | 'inset'; padding?: 'none' | 'sm' | 'md' | 'lg'; radius?: 'xs' | 'sm' | 'md' | 'lg'; interactive?: boolean; onPress?: () => void };
export function Card({ tone = 'default', padding = 'md', radius = 'md', interactive, onPress, style, ...props }: CardProps) {
  const baseStyle = [styles.card, effects.shadow.card, { backgroundColor: cardTones[tone], padding: cardPadding[padding], borderRadius: radii[radius], borderColor: tone === 'accent' ? colors.border.accent : colors.border.main }, style];
  if (interactive || onPress) return <Pressable accessibilityRole="button" onPress={onPress} {...props} style={({ pressed }) => [baseStyle, { opacity: pressed ? 0.82 : 1 }]} />;
  return <View {...props} style={baseStyle} />;
}
const cardTones = { default: colors.surface.card, quiet: colors.surface.quiet, accent: colors.accentWash, success: colors.status.successWash, inset: colors.surface.inset };
const cardPadding = { none: 0, sm: spacing[4], md: spacing[6], lg: spacing[8] };

export function Badge({ count, dot = false }: { count?: number | string; dot?: boolean }) { return dot ? <View accessibilityLabel="Active" style={styles.badgeDot} /> : <View style={styles.badge}><Text style={styles.badgeText}>{count}</Text></View>; }
export function Chip({ label, tone = 'neutral', icon, selected }: { label: ReactNode; tone?: 'neutral' | 'accent' | 'outline' | 'high' | 'medium' | 'low' | 'success'; icon?: IconValue; selected?: boolean }) {
  const selectedTone = selected ? 'accent' : tone; const palette = chipTones[selectedTone];
  return <View style={[styles.chip, { backgroundColor: palette.background, borderColor: palette.border }]}>{renderIcon(icon, palette.ink, 14)}<Text style={[styles.chipText, { color: palette.ink }]}>{label}</Text></View>;
}
const chipTones = {
  neutral: { background: colors.surface.hover, border: colors.border.main, ink: colors.text.muted }, accent: { background: colors.accentWashStrong, border: colors.border.accent, ink: colors.accent },
  outline: { background: 'transparent', border: colors.border.strong, ink: colors.text.muted }, high: { background: colors.status.errorWash, border: colors.status.errorWash, ink: colors.status.errorInk },
  medium: { background: colors.status.warningWash, border: colors.status.warningWash, ink: colors.status.warningInk }, low: { background: colors.status.infoWash, border: colors.status.infoWash, ink: colors.status.info },
  success: { background: colors.accentWashStrong, border: colors.border.accent, ink: colors.accent },
};

export function SelectableRow({ title, sub, meta, selected, disabled, onPress }: { title: ReactNode; sub?: ReactNode; meta?: ReactNode; selected?: boolean; disabled?: boolean; onPress?: () => void }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected, disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.selectable, selected && styles.selectableOn, { opacity: disabled ? 0.45 : pressed ? 0.76 : 1 }]}><View style={styles.grow}><Text style={styles.rowTitle}>{title}</Text>{sub ? <Text style={styles.rowSub}>{sub}</Text> : null}</View>{meta ? <Text style={styles.rowMeta}>{meta}</Text> : <View style={[styles.check, selected && styles.checkOn]}>{selected ? <Icon name="check" size={14} color={colors.accentInk} /> : null}</View>}</Pressable>;
}
export function AddRow({ label, icon = 'plus', disabled, onPress }: { label: ReactNode; icon?: IconValue; disabled?: boolean; onPress?: () => void }) { return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.addRow, { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 }]}>{renderIcon(icon, colors.accent)}<Text style={styles.addText}>{label}</Text></Pressable>; }
export function StatCard({ icon, iconColor = colors.data.cool, meta, value, label }: { icon?: IconValue; iconColor?: string; meta?: ReactNode; value: ReactNode; label: ReactNode }) { return <Card padding="sm" style={styles.stat}><View style={styles.row}>{renderIcon(icon, iconColor)}<Text style={[styles.rowMeta, { color: iconColor }]}>{meta}</Text></View><Text style={styles.statValue}>{value}</Text><Text style={styles.rowSub}>{label}</Text></Card>; }

const styles = StyleSheet.create({
  button: { flexDirection: 'row', gap: spacing[2], alignItems: 'center', justifyContent: 'center', borderWidth: 1 }, fullWidth: { alignSelf: 'stretch' }, buttonText: { fontFamily: fontWeights.bold, fontSize: fontSizes.base },
  card: { borderWidth: 1 }, badge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent }, badgeText: { color: colors.accentInk, fontFamily: fontWeights.monoBold, fontSize: fontSizes.xs }, badgeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  chip: { minHeight: 28, borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: spacing[3], flexDirection: 'row', gap: spacing[1], alignItems: 'center', alignSelf: 'flex-start' }, chipText: { fontFamily: fontWeights.semibold, fontSize: fontSizes.xs },
  selectable: { minHeight: 64, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.border.main, backgroundColor: colors.surface.quiet, padding: spacing[4], flexDirection: 'row', alignItems: 'center', gap: spacing[3] }, selectableOn: { borderColor: colors.border.accentStrong, backgroundColor: colors.accentWash }, grow: { flex: 1 }, rowTitle: { color: colors.text.primary, fontFamily: fontWeights.semibold, fontSize: fontSizes.md }, rowSub: { color: colors.text.muted, fontFamily: fontWeights.regular, fontSize: fontSizes.sm, marginTop: 3 }, rowMeta: { color: colors.text.muted, fontFamily: fontWeights.mono, fontSize: fontSizes.sm }, check: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: colors.border.strong, alignItems: 'center', justifyContent: 'center' }, checkOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  addRow: { minHeight: sizes.tapMin, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border.accentStrong, borderRadius: radii.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], padding: spacing[3] }, addText: { color: colors.accent, fontFamily: fontWeights.semibold }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, stat: { minWidth: 128 }, statValue: { color: colors.text.primary, fontFamily: fontWeights.monoBold, fontSize: fontSizes.h3, marginTop: spacing[4] },
});

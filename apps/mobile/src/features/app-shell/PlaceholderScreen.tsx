import { Text, StyleSheet } from 'react-native';
import { Card, Chip, colors, fontSizes, fontWeights, spacing } from '@/design-system';
import { Screen } from './Screen';

export function PlaceholderScreen({ title, description, phase }: { title: string; description: string; phase: string }) { return <Screen eyebrow="FITFORGE MOBILE" title={title}><Card tone="accent"><Chip label={phase} tone="accent" /><Text style={styles.copy}>{description}</Text><Text style={styles.note}>Navigation and native presentation are ready. Product data is added in its dedicated phase.</Text></Card></Screen>; }
const styles = StyleSheet.create({ copy: { color: colors.text.primary, fontFamily: fontWeights.semibold, fontSize: fontSizes.xl, lineHeight: 25, marginTop: spacing[5] }, note: { color: colors.text.muted, fontFamily: fontWeights.regular, fontSize: fontSizes.base, lineHeight: 21, marginTop: spacing[3] } });

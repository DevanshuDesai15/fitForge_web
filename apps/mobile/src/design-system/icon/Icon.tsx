import type { ComponentProps } from 'react';
import { colors } from '../tokens';
import { fallbackIcon, iconRegistry, type FitForgeIconName } from './icons';

export type IconProps = {
  name: FitForgeIconName | (string & {});
  size?: number;
  color?: string;
  strokeWidth?: number;
} & Omit<ComponentProps<typeof fallbackIcon>, 'size' | 'color' | 'strokeWidth'>;

export function Icon({ name, size = 20, color = colors.text.primary, strokeWidth = 2, ...props }: IconProps) {
  const Glyph = iconRegistry[name as FitForgeIconName] ?? fallbackIcon;
  return <Glyph accessibilityElementsHidden importantForAccessibility="no-hide-descendants" size={size} color={color} strokeWidth={strokeWidth} {...props} />;
}

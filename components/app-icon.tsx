import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

type AppIconProps = {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
  /** Shown if glyph missing (should not happen for mapped names). */
  fallback?: string;
};

/**
 * MaterialIcons with safe fallback so missing glyphs don't render blank squares.
 * Font is loaded in root layout via expo-font.
 */
export function AppIcon({ name, size = 24, color = '#737373', style, fallback = '•' }: AppIconProps) {
  const glyphMap = (MaterialIcons as unknown as { glyphMap?: Record<string, number> }).glyphMap;
  if (glyphMap && glyphMap[name as string] == null) {
    return (
      <Text style={[{ fontSize: size * 0.75, color, lineHeight: size }, style]}>{fallback}</Text>
    );
  }
  return <MaterialIcons name={name} size={size} color={color} style={style} />;
}

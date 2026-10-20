import { useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Image, type ImageContentFit, type ImageStyle } from 'expo-image';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Brand } from '@/constants/theme';

type AppImageProps = {
  /** Remote URL, data URL, or local file URI. Empty → placeholder. */
  uri?: string | null;
  width?: number | `${number}%`;
  height?: number | `${number}%`;
  borderRadius?: number;
  contentFit?: ImageContentFit;
  style?: StyleProp<ViewStyle>;
  className?: string;
  /** Fill parent (needs parent with explicit size). */
  fill?: boolean;
  recyclingKey?: string;
  accessibilityLabel?: string;
};

/**
 * Reliable image for Expo Go:
 * - expo-image (better data-URL / cache than RN Image)
 * - explicit width/height (NativeWind className often leaves Image at 0×0)
 * - placeholder when uri missing or load fails
 */
export function AppImage({
  uri,
  width = 64,
  height = 64,
  borderRadius = 8,
  contentFit = 'cover',
  style,
  className,
  fill,
  recyclingKey,
  accessibilityLabel,
}: AppImageProps) {
  const [failed, setFailed] = useState(false);
  const src = (uri || '').trim();
  const show = Boolean(src) && !failed;

  const imageStyle: StyleProp<ImageStyle> = fill
    ? {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        width: '100%',
        height: '100%',
        borderRadius,
        overflow: 'hidden',
        backgroundColor: '#f1f5f9',
      }
    : {
        width,
        height,
        borderRadius,
        overflow: 'hidden',
        backgroundColor: '#f1f5f9',
      };

  const iconSize = typeof width === 'number' ? Math.min(28, width * 0.4) : 24;

  if (!show) {
    return (
      <View
        className={className}
        style={[imageStyle as ViewStyle, style, { alignItems: 'center', justifyContent: 'center' }]}
        accessibilityLabel={accessibilityLabel || 'Tidak ada foto'}>
        <MaterialIcons name="image" size={iconSize} color={Brand.muted} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: src }}
      style={[imageStyle, style as StyleProp<ImageStyle>]}
      className={className}
      contentFit={contentFit}
      recyclingKey={recyclingKey || src.slice(0, 64)}
      cachePolicy="memory-disk"
      transition={120}
      onError={() => setFailed(true)}
      accessibilityLabel={accessibilityLabel}
      allowDownscaling
    />
  );
}

/** Avatar / circular photo */
export function AppAvatar({
  uri,
  size = 44,
  style,
}: {
  uri?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <AppImage
      uri={uri}
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
      accessibilityLabel="Foto profil"
    />
  );
}

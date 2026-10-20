import { Pressable, View, type ViewProps } from 'react-native';

type Props = ViewProps & {
  className?: string;
  onPress?: () => void;
};

/** Card E-KOMPAK: putih, rounded-2xl, border emerald/gray, shadow-sm */
export function UiCard({ className, onPress, children, ...rest }: Props) {
  /** border-emerald-100 shadow-sm — Card referensi */
  const base = `overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm ${className ?? ''}`;
  if (onPress) {
    return (
      <Pressable onPress={onPress} className={`${base} active:opacity-90`}>
        <View {...rest}>{children}</View>
      </Pressable>
    );
  }
  return (
    <View className={base} {...rest}>
      {children}
    </View>
  );
}


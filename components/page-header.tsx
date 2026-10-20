import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type PageHeaderProps = {
  title: string;
  showBack?: boolean;
  /** white sticky (default) | emerald | slate (admin) */
  variant?: 'white' | 'emerald' | 'slate';
  right?: ReactNode;
};

export function PageHeader({
  title,
  showBack = false,
  variant = 'white',
  right,
}: PageHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const isDark = variant === 'emerald' || variant === 'slate';
  const bg =
    variant === 'emerald' ? 'bg-brand' : variant === 'slate' ? 'bg-admin' : 'bg-white';
  const border =
    variant === 'white' ? 'border-b border-gray-200' : 'border-b border-transparent';
  const titleColor = isDark ? 'text-white' : 'text-gray-900';
  const iconColor = isDark ? '#ecfdf5' : '#6b7280';

  return (
    <View
      className={`${bg} ${border} px-5 pb-4 shadow-sm`}
      style={{ paddingTop: insets.top + 12 }}>
      <View className="min-h-8 flex-row items-center justify-between gap-2">
        <View className="min-h-8 flex-1 flex-row items-center gap-1">
          {showBack ? (
            <Pressable
              onPress={() => router.back()}
              className="rounded-md p-1 active:opacity-70"
              hitSlop={8}>
              <MaterialIcons name="arrow-back" size={20} color={iconColor} />
            </Pressable>
          ) : null}
          <Text className={`text-xl font-bold ${titleColor}`}>{title}</Text>
        </View>
        {right}
      </View>
    </View>
  );
}

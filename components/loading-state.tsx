import { ActivityIndicator, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Brand } from '@/constants/theme';

export function LoadingState({ label = 'Memuat...' }: { label?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-surface p-6">
      <ActivityIndicator size="large" color={Brand.green} />
      <Text className="text-sm text-muted">{label}</Text>
    </View>
  );
}

export function EmptyState({
  title,
  subtitle,
  icon = 'inbox',
}: {
  title: string;
  subtitle?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
}) {
  return (
    <View className="items-center rounded-2xl border border-dashed border-gray-200 bg-white py-8">
      <View className="mb-3 size-12 items-center justify-center rounded-full bg-gray-50">
        <MaterialIcons name={icon} size={24} color="#9ca3af" />
      </View>
      <Text className="text-sm font-medium text-gray-800">{title}</Text>
      {subtitle ? (
        <Text className="mt-1 px-6 text-center text-xs text-gray-500">{subtitle}</Text>
      ) : null}
    </View>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <View className="flex-row items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3">
      <MaterialIcons name="error-outline" size={16} color="#dc2626" style={{ marginTop: 2 }} />
      <Text className="flex-1 text-sm text-red-600">{message}</Text>
    </View>
  );
}

/** Badge pill E-KOMPAK */
export function Badge({
  children,
  variant = 'default',
}: {
  children: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'emerald' | 'info';
}) {
  const map: Record<string, { bg: string; text: string }> = {
    default: { bg: 'bg-gray-100', text: 'text-gray-700' },
    success: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    warning: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    danger: { bg: 'bg-red-100', text: 'text-red-700' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    info: { bg: 'bg-blue-100', text: 'text-blue-700' },
  };
  const s = map[variant] ?? map.default;
  return (
    <View className={`rounded-full px-2.5 py-0.5 ${s.bg}`}>
      <Text className={`text-xs font-semibold ${s.text}`}>{children}</Text>
    </View>
  );
}


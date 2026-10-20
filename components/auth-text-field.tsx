import { useState } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Brand } from '@/constants/theme';

type AuthTextFieldProps = TextInputProps & {
  label?: string;
  error?: string;
  className?: string;
  /** Leading icon name (MaterialIcons) */
  icon?: keyof typeof MaterialIcons.glyphMap;
  /** Show eye toggle for password fields. */
  showPasswordToggle?: boolean;
};

export function AuthTextField({
  label,
  error,
  className,
  style,
  secureTextEntry,
  showPasswordToggle,
  icon,
  ...rest
}: AuthTextFieldProps) {
  const [visible, setVisible] = useState(false);
  const isPassword = Boolean(secureTextEntry || showPasswordToggle);
  const hide = isPassword && !visible;

  return (
    <View className="mb-1 gap-1.5">
      {label ? <Text className="text-sm font-medium text-gray-700">{label}</Text> : null}
      <View className="relative">
        {icon ? (
          <View className="absolute bottom-0 left-0 top-0 z-10 items-center justify-center pl-3">
            <MaterialIcons name={icon} size={18} color="#9ca3af" />
          </View>
        ) : null}
        <TextInput
          placeholderTextColor="#9ca3af"
          secureTextEntry={hide}
          className={`rounded-xl border bg-input px-4 py-2.5 text-sm text-gray-900 ${
            icon ? 'pl-10' : ''
          } ${isPassword ? 'pr-12' : ''} ${
            error ? 'border-red-300' : 'border-gray-200'
          } ${className ?? ''}`}
          style={style}
          {...rest}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            className="absolute bottom-0 right-0 top-0 z-10 items-center justify-center px-3.5 active:opacity-70">
            <MaterialIcons
              name={visible ? 'visibility-off' : 'visibility'}
              size={20}
              color={Brand.muted}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text className="text-xs text-red-500">{error}</Text> : null}
    </View>
  );
}

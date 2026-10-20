import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Brand } from '@/constants/theme';

type SelectFieldProps = {
  label: string;
  value: string;
  options: readonly string[];
  placeholder?: string;
  error?: string;
  onChange: (value: string) => void;
};

/** Dropdown E-KOMPAK — modal list, cocok Expo Go (tanpa native Picker). */
export function SelectField({
  label,
  value,
  options,
  placeholder = 'Pilih opsi...',
  error,
  onChange,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <View className="mb-1 gap-1.5">
      <Text className="text-sm font-medium text-gray-700">{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        className={`flex-row items-center justify-between rounded-xl border bg-input px-4 py-2.5 active:opacity-90 ${
          error ? 'border-red-300' : 'border-gray-200'
        }`}>
        <Text className={`text-sm ${value ? 'text-gray-900' : 'text-gray-400'}`}>
          {value || placeholder}
        </Text>
        <MaterialIcons name="keyboard-arrow-down" size={22} color={Brand.muted} />
      </Pressable>
      {error ? <Text className="text-xs text-red-500">{error}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setOpen(false)}>
          <Pressable
            className="max-h-[70%] rounded-t-3xl bg-white"
            onPress={(e) => e.stopPropagation()}>
            <View className="flex-row items-center justify-between border-b border-gray-100 px-5 py-4">
              <Text className="text-base font-bold text-gray-900">{label}</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={8} className="p-1">
                <MaterialIcons name="close" size={22} color={Brand.muted} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerClassName="pb-8"
              showsVerticalScrollIndicator={false}
              bounces={false}>
              {options.map((opt) => {
                const active = value === opt;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                    className={`flex-row items-center justify-between border-b border-gray-50 px-5 py-3.5 active:bg-gray-50 ${
                      active ? 'bg-emerald-50' : ''
                    }`}>
                    <Text
                      className={`text-sm ${
                        active ? 'font-semibold text-brand-text' : 'text-gray-800'
                      }`}>
                      {opt}
                    </Text>
                    {active ? (
                      <MaterialIcons name="check" size={20} color={Brand.green} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}


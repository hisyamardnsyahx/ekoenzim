import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { fetchChat, sendChat } from '@/lib/api';
import type { ChatMessageDb } from '@/lib/supabase';

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const toast = useToast();
  const uid = user?.id ?? profile?.id ?? '';
  const [messages, setMessages] = useState<ChatMessageDb[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const flatListRef = useRef<FlatList<ChatMessageDb>>(null);

  const load = useCallback(async () => {
    if (!uid) return;
    const rows = await fetchChat(uid);
    setMessages(rows);
  }, [uid]);

  useFocusEffect(
    useCallback(() => {
      load();
      const t = setInterval(load, 8000);
      return () => clearInterval(t);
    }, [load]),
  );

  const kirim = async () => {
    const body = text.trim();
    if (!body || !uid || busy) return;
    setBusy(true);
    setText('');
    try {
      await sendChat(uid, body, 'user');
      await load();
      toast.success('Pesan terkirim');
    } catch (e) {
      setText(body);
      toast.error('Gagal mengirim', e instanceof Error ? e.message : 'Coba lagi');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-surface">
      {/* Header emerald — referensi CS */}
      <View className="bg-brand px-4 pb-4 shadow-sm" style={{ paddingTop: insets.top + 8 }}>
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="-ml-2 p-2 active:opacity-70"
            hitSlop={8}>
            <MaterialIcons name="arrow-back" size={20} color="#d1fae5" />
          </Pressable>
          <View className="ml-2 flex-row items-center gap-3">
            <View className="size-10 items-center justify-center rounded-full bg-white/20">
              <MaterialIcons name="eco" size={20} color="#fff" />
            </View>
            <View>
              <Text className="text-base font-bold leading-tight text-white">Admin E-KOMPAK</Text>
              <View className="flex-row items-center gap-1">
                <View className="size-1.5 rounded-full bg-emerald-300" />
                <Text className="text-xs text-emerald-200">Online</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 56 : 0}>
        <FlatList
          ref={flatListRef}
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-4 p-4 pb-4"
          ListEmptyComponent={
            <View className="items-center gap-2 py-16">
              <View className="size-14 items-center justify-center rounded-full bg-emerald-50">
                <MaterialIcons name="support-agent" size={28} color={Brand.green} />
              </View>
              <Text className="text-sm font-medium text-gray-900">Chat dengan Admin</Text>
              <Text className="px-8 text-center text-xs text-muted">
                Tanyakan seputar program, jadwal, atau kondisi pengolahan sampah Anda.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const mine = item.sender_role === 'user';
            const time = new Date(item.created_at).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            });
            return (
              <View className={`flex-row ${mine ? 'justify-end' : 'justify-start'}`}>
                <View
                  className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${
                    mine
                      ? 'rounded-tr-sm bg-brand'
                      : 'rounded-tl-sm border border-gray-100 bg-white'
                  }`}>
                  <Text className={`text-sm ${mine ? 'text-white' : 'text-gray-800'}`}>
                    {item.body}
                  </Text>
                  <Text
                    className={`mt-1.5 text-[10px] ${
                      mine ? 'text-right text-emerald-200' : 'text-gray-400'
                    }`}>
                    {time}
                  </Text>
                </View>
              </View>
            );
          }}
        />
        <View
          className="border-t border-gray-200 bg-white p-3"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
          <View className="flex-row items-center gap-2">
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Ketik pesan Anda di sini..."
              placeholderTextColor="#9ca3af"
              multiline
              className="max-h-28 flex-1 rounded-full border border-transparent bg-gray-100 px-4 py-2.5 text-sm text-gray-900"
            />
            <Pressable
              onPress={kirim}
              disabled={busy || !text.trim()}
              className="size-10 items-center justify-center rounded-full bg-brand shadow-sm active:opacity-90 disabled:opacity-50">
              {busy ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <MaterialIcons name="send" size={16} color="#fff" />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

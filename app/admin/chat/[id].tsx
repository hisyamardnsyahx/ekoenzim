import { useCallback, useState, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Brand } from "@/constants/theme";
import { useToast } from "@/context/toast-context";
import { fetchChat, sendChat, markChatAsRead } from "@/lib/api";
import type { ChatMessageDb } from "@/lib/supabase";

export default function AdminChatDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const userId = Array.isArray(id) ? id[0] : id;
  const insets = useSafeAreaInsets();
  const toast = useToast();
  
  const [messages, setMessages] = useState<ChatMessageDb[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const flatListRef = useRef<FlatList<ChatMessageDb>>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const rows = await fetchChat(userId);
      setMessages(rows);
      await markChatAsRead(userId);
    } catch (err) {
      console.error(err);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
      const t = setInterval(load, 5000); // Polling lebih cepat untuk admin
      return () => clearInterval(t);
    }, [load])
  );

  const kirim = async () => {
    const body = text.trim();
    if (!body || !userId || busy) return;

    setBusy(true);
    try {
      const msg = await sendChat(userId, body, "admin");
      setMessages((prev) => [...prev, msg]);
      setText("");
    } catch (err: any) {
      toast.show(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-surface">
      <View className="bg-white" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center border-b border-gray-100 px-2 pb-4 pt-2">
          <Pressable
            onPress={() => router.back()}
            className="p-2 mr-2 rounded-full active:bg-gray-100">
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </Pressable>
          <View>
            <Text className="text-lg font-bold text-gray-800">Balas Pesan</Text>
            <Text className="text-xs text-gray-500">ID: {userId.substring(0, 8)}...</Text>
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
          keyExtractor={(m) => m.id}
          className="px-4"
          contentContainerClassName="py-6"
          showsVerticalScrollIndicator={false}
          renderItem={({ item: m }) => {
            const isAdmin = m.sender_role === "admin";
            return (
              <View className={`mb-4 max-w-[80%] rounded-2xl px-4 py-3 ${isAdmin ? "self-end rounded-tr-sm bg-brand" : "self-start rounded-tl-sm bg-white shadow-sm"}`}>
                <Text className={`text-base ${isAdmin ? "text-white" : "text-gray-800"}`}>
                  {m.body}
                </Text>
                <View className="mt-1 flex-row items-center justify-end gap-1">
                  <Text className={`text-[10px] ${isAdmin ? "text-white/70" : "text-gray-400"}`}>
                    {new Date(m.created_at).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  {isAdmin && (
                    <MaterialIcons
                      name="done-all"
                      size={14}
                      color={m.is_read ? '#67e8f9' : '#a7f3d0'}
                    />
                  )}
                </View>
              </View>
            );
          }}
        />

        <View
          className="border-t border-gray-200 bg-white px-4 py-3"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
          <View className="flex-row items-center gap-2">
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Tulis balasan..."
              className="flex-1 rounded-full bg-gray-100 px-4 py-2.5 text-base text-gray-800"
              multiline
              maxLength={500}
              editable={!busy}
            />
            <Pressable
              onPress={kirim}
              disabled={busy || !text.trim()}
              className={`size-12 items-center justify-center rounded-full ${!text.trim() ? "bg-gray-200" : "bg-brand active:opacity-80"}`}>
              {busy ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialIcons name="send" size={20} color={!text.trim() ? "#9ca3af" : "#fff"} />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

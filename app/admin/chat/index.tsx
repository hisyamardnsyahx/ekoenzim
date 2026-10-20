import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { LoadingState } from '@/components/loading-state';
import { Brand } from "@/constants/theme";
import { useAuth } from "@/context/auth-context";
import { fetchAllUsersWithChats } from "@/lib/api";
import type { Profile } from "@/lib/supabase";

type ChatUser = Profile & { last_message?: string; last_message_time?: string; unread_count: number };

export default function AdminChats() {
  const router = useRouter();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchAllUsersWithChats();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const renderItem = ({ item }: { item: ChatUser }) => {
    const time = item.last_message_time 
      ? new Date(item.last_message_time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) 
      : "";

    return (
      <Pressable
        onPress={() => router.push(`/admin/chat/${item.id}` as any)}
        className="flex-row items-center gap-4 bg-white p-4 border-b border-gray-100 active:bg-gray-50">
        <View className="size-12 items-center justify-center rounded-full bg-brand/10">
          <Text className="text-lg font-bold text-brand">{(item.nama_lengkap || "U").split(" ").map(n=>n[0]).join("").substring(0, 2).toUpperCase()}</Text>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="font-bold text-gray-800">{item.nama_lengkap || "Tanpa Nama"}</Text>
            <Text className="text-xs text-gray-500">{time}</Text>
          </View>
          <View className="flex-row items-center justify-between mt-1">
            <Text className="text-sm text-gray-600 flex-1 mr-2" numberOfLines={1}>
              {item.last_message}
            </Text>
            {item.unread_count > 0 && (
              <View className="bg-emerald-600 rounded-full h-5 px-1.5 items-center justify-center min-w-[20px]">
                <Text className="text-[10px] font-bold text-white">{item.unread_count}</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView edges={["top"]} className="bg-white">
        <View className="flex-row items-center justify-between border-b border-gray-100 px-5 pb-4 pt-2">
          <Text className="text-xl font-bold text-gray-800">Pesan Masuk</Text>
        </View>
      </SafeAreaView>

      {loading ? (
        <LoadingState label="Memuat obrolan..." />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerClassName={users.length === 0 ? "flex-1" : "pb-6"}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center p-8">
              <MaterialIcons name="chat-bubble-outline" size={48} color="#cbd5e1" />
              <Text className="mt-4 text-center text-gray-500">Belum ada obrolan dengan pengguna.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}




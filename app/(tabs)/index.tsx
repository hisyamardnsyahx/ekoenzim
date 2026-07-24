import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';

import { AppImage } from '@/components/app-image';
import { LoadingState } from '@/components/loading-state';
import { SimpleBarChart } from '@/components/simple-bar-chart';
import { UiCard } from '@/components/ui-card';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import {
  fetchChat,
  fetchProgramMeta,
  getUserMonthlySummary,
  getUserProduksiChart,
} from '@/lib/api';
import type { ProduksiBulanan } from '@/lib/domain';
import type { ChatMessageDb, ProgramMeta } from '@/lib/supabase';

const DEFAULT_BANNER =
  'https://images.unsplash.com/photo-1595804369255-b77826a79854?auto=format&fit=crop&q=80&w=200';

function fmt(n: number, unit: string) {
  const v = Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
  return ${v} ;
}

export default function WargaDashboard() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const uid = user?.id ?? profile?.id ?? '';

  const [program, setProgram] = useState<ProgramMeta | null>(null);
  const [summary, setSummary] = useState<ProduksiBulanan | null>(null);
  const [chartRows, setChartRows] = useState<ProduksiBulanan[]>([]);
  const [chats, setChats] = useState<ChatMessageDb[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!uid) return;
    try {
      const [p, sum, ch, cData] = await Promise.all([
        fetchProgramMeta(),
        getUserMonthlySummary(uid),
        fetchChat(uid),
        getUserProduksiChart(uid),
      ]);
      setProgram(p);
      setSummary(sum);
      setChats(ch);
      setChartRows(cData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [uid]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const hasUnread = useMemo(() => {
    if (chats.length === 0) return false;
    const last = chats[chats.length - 1];
    return last.sender_role === 'admin';
  }, [chats]);

  const cards = useMemo(
    () => [
      {
        id: '1',
        title: 'Eko Enzim',
        value: summary ? fmt(summary.ekoEnzim, 'L') : '0 L',
        icon: 'science' as const,
        color: Brand.blue.text,
        bg: 'bg-blue-50',
      },
      {
        id: '2',
        title: 'Ember Tumpuk',
        value: summary ? fmt(summary.emberTumpuk, 'Kg') : '0 Kg',
        icon: 'compost' as const,
        color: Brand.green,
        bg: 'bg-emerald-50',
      },
      {
        id: '3',
        title: 'Kompos',
        value: summary ? fmt(summary.kompos, 'Kg') : '0 Kg',
        icon: 'eco' as const,
        color: Brand.slate,
        bg: 'bg-slate-100',
      },
      {
        id: '4',
        title: 'Pakan',
        value: summary ? fmt(summary.pakan, 'Kg') : '0 Kg',
        icon: 'pets' as const,
        color: Brand.amber.text,
        bg: 'bg-amber-50',
      },
    ],
    [summary],
  );

  if (loading) return <LoadingState label="Memuat dashboard..." />;

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView edges={['top']} className="bg-brand">
        <View className="flex-row items-center justify-between px-5 pb-6 pt-2">
          <View>
            <Text className="text-sm text-emerald-100">Selamat Datang,</Text>
            <Text className="text-xl font-bold text-white">
              {profile?.nama_lengkap || 'Warga'}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => signOut()}
              className="size-10 items-center justify-center rounded-full bg-white/20 active:opacity-80">
              <MaterialIcons name="logout" size={18} color="#fff" />
            </Pressable>
            <View className="size-12 items-center justify-center rounded-full bg-white/20">
              <MaterialIcons name="person" size={24} color="#fff" />
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* rounded bottom of header */}
      <View className="-mt-1 h-6 rounded-b-3xl bg-brand z-10" />

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-6 px-5 pb-28 pt-2"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* Banner program */}
        <UiCard className="flex-row items-center gap-4 border-0 p-4 shadow-md">
          <View className="size-16 overflow-hidden rounded-xl bg-gray-100">
            <AppImage
              uri={program?.banner_url || DEFAULT_BANNER}
              width={64}
              height={64}
              borderRadius={12}
              contentFit="cover"
              accessibilityLabel="Banner program"
            />
          </View>
          <View className="flex-1">
            <Text className="font-bold leading-tight text-gray-800">
              {program?.nama || 'Program E-KOMPAK'}
            </Text>
            <View className="mt-1 flex-row items-center gap-1">
              <MaterialIcons name="place" size={12} color={Brand.muted} />
              <Text className="text-xs font-medium text-gray-500">
                {profile?.alamat || 'Lokasi Mitra'}
              </Text>
            </View>
          </View>
        </UiCard>

        {/* Quick Actions */}
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => router.push('/tutorial')}
            className="flex-1 flex-row items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm active:border-emerald-200">
            <View className="rounded-xl bg-emerald-50 p-2.5">
              <MaterialIcons name="menu-book" size={20} color={Brand.green} />
            </View>
            <Text className="text-sm font-semibold text-gray-700">Pedoman</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/chat' as never)}
            className="flex-1 flex-row items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm active:border-blue-200">
            <View className="rounded-xl bg-blue-50 p-2.5">
              <MaterialIcons name="chat" size={20} color={Brand.blue.text} />
            </View>
            <Text className="text-sm font-semibold text-gray-700">Bantuan</Text>
          </Pressable>
        </View>

        {/* Ringkasan & Grafik */}
        <View>
          <Text className="mb-3 px-1 text-sm font-semibold text-gray-800">
            Ringkasan Bulan Ini
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {cards.map((c) => (
              <UiCard key={c.id} className="min-w-[46%] flex-1 items-center border-0 p-3 shadow-sm">
                <View className={mb-2 rounded-full p-2 }>
                  <MaterialIcons name={c.icon} size={18} color={c.color} />
                </View>
                <Text className="text-xl font-bold text-gray-800">{c.value}</Text>
                <Text className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  {c.title}
                </Text>
              </UiCard>
            ))}
          </View>
        </View>

        <UiCard className="border-0 p-5 shadow-sm">
          <Text className="mb-4 text-sm font-semibold text-gray-800">Tren Pengolahan Sampah</Text>
          {chartRows.length > 0 ? (
            <SimpleBarChart
              data={chartRows}
              seriesKeys={['ekoEnzim', 'emberTumpuk', 'kompos', 'pakan']}
              height={180}
            />
          ) : (
            <View className="h-44 items-center justify-center">
              <MaterialIcons name="bar-chart" size={40} color="#e5e7eb" />
              <Text className="mt-2 text-sm text-gray-400">Belum ada data grafik</Text>
            </View>
          )}

          <Pressable
            onPress={() => router.push('/grafik' as never)}
            className="mt-3 items-center active:opacity-70">
            <Text className="text-xs font-semibold text-brand">Lihat detail grafik →</Text>
          </Pressable>
        </UiCard>
      </ScrollView>

      {/* Floating CS */}
      <Pressable
        onPress={() => router.push('/chat' as never)}
        accessibilityRole="button"
        accessibilityLabel="Chat CS Admin"
        className="absolute bottom-6 right-5 z-20 size-14 items-center justify-center rounded-full border-2 border-white bg-brand shadow-xl active:opacity-90"
        style={{
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
        }}>
        <MaterialIcons name="chat-bubble" size={24} color="#fff" />
        {hasUnread ? (
          <View className="absolute -right-0.5 -top-0.5 size-4 rounded-full border-2 border-white bg-red-500" />
        ) : null}
      </Pressable>
    </View>
  );
}

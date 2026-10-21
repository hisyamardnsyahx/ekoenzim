import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Feather from '@expo/vector-icons/Feather';
import Svg, { Circle } from 'react-native-svg';
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

const fraunces = { fontFamily: 'serif' };

const DEFAULT_BANNER =
  'https://images.unsplash.com/photo-1595804369255-b77826a79854?auto=format&fit=crop&q=80&w=200';

function fmt(n: number, unit: string) {
  const v = Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
  return v + ' ' + unit;
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
    return chats.some((c) => c.sender_role === 'admin' && !c.is_read);
  }, [chats]);

  const currentSummaryHasData = summary
    ? summary.ekoEnzim + summary.emberTumpuk + summary.kompos + summary.pakan > 0
    : false;
  const latestChartRow = chartRows[chartRows.length - 1] ?? null;
  const displaySummary = currentSummaryHasData || !latestChartRow ? summary : latestChartRow;
  const summaryTitle =
    currentSummaryHasData || !latestChartRow
      ? 'Ringkasan Bulan Ini'
      : `Ringkasan Bulan Terakhir (${latestChartRow.bulan})`;

  const cards = useMemo(
    () => [
      {
        id: '1',
        title: 'Eko Enzim',
        value: displaySummary ? fmt(displaySummary.ekoEnzim, 'L') : '0 L',
        icon: 'science' as const,
        color: Brand.blue.text,
        bg: 'bg-blue-50',
      },
      {
        id: '2',
        title: 'Ember Tumpuk',
        value: displaySummary ? fmt(displaySummary.emberTumpuk, 'Kg') : '0 Kg',
        icon: 'compost' as const,
        color: Brand.green,
        bg: 'bg-emerald-50',
      },
      {
        id: '4',
        title: 'Pakan',
        value: displaySummary ? fmt(displaySummary.pakan, 'Kg') : '0 Kg',
        icon: 'pets' as const,
        color: Brand.amber.text,
        bg: 'bg-amber-50',
      },
    ],
    [displaySummary],
  );

  if (loading) return <LoadingState label="Memuat dashboard..." />;

  const previousMonthRows = chartRows.slice(-5, -1);
  const currentMonthRow = chartRows[chartRows.length - 1];
  const compareEkoenzim = previousMonthRows.length > 0 && currentMonthRow && previousMonthRows[previousMonthRows.length-1].ekoEnzim ? ((currentMonthRow.ekoEnzim - previousMonthRows[previousMonthRows.length-1].ekoEnzim) / previousMonthRows[previousMonthRows.length-1].ekoEnzim * 100).toFixed(0) : 0;
  
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
              <Text className="text-xl font-bold text-emerald-100">{profile?.nama_lengkap ? profile.nama_lengkap.split(" ").map((n: string)=>n[0]).join("").substring(0, 2).toUpperCase() : "U"}</Text>
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
        <View className="relative rounded-2xl overflow-hidden bg-primary p-5 shadow-md shadow-primary/20">
          <View className="absolute inset-0 opacity-10">
            <Svg viewBox="0 0 200 80" className="w-full h-full">
              <Circle cx="170" cy="-10" r="70" fill="white" />
              <Circle cx="10" cy="90" r="50" fill="white" />
            </Svg>
          </View>
          <View className="relative">
            <Text className="text-primary-foreground/70 text-sm font-medium">Selamat datang kembali,</Text>
            <Text className="text-2xl font-bold mt-0.5 text-primary-foreground" style={fraunces}>
              {(profile?.nama_lengkap || 'Warga').split(" ")[0]}
            </Text>
            <View className="mt-3 flex flex-row flex-wrap gap-x-4 gap-y-1">
              <View className="flex flex-row items-center gap-1">
                <Feather name="award" size={12} color="#ffffff" style={{ opacity: 0.8 }} />
                <Text className="text-xs text-primary-foreground/80">{program?.nama || 'Program E-KOMPAK'}</Text>
              </View>
              <View className="flex flex-row items-center gap-1">
                <Feather name="map-pin" size={12} color="#ffffff" style={{ opacity: 0.8 }} />
                <Text className="text-xs text-primary-foreground/80">{profile?.alamat || 'Lokasi'}</Text>
              </View>
            </View>
            <View className="mt-1 flex flex-row items-center gap-1">
              <Feather name="users" size={12} color="#ffffff" style={{ opacity: 0.7 }} />
              <Text className="text-xs text-primary-foreground/70">Mitra: {program?.mitra || 'Mitra'}</Text>
            </View>
          </View>
        </View>

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
            {summaryTitle}
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {cards.map((c) => (
              <UiCard key={c.id} className="min-w-[46%] flex-1 items-center border-0 p-3 shadow-sm">
                <View className={"mb-2 rounded-full p-2 " + c.bg}>
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
          <View className="flex-row items-center gap-2 mb-6">
            <MaterialIcons name="assessment" size={20} color={Brand.greenDark} />
            <Text className="text-sm font-bold text-gray-800">Produksi Bulanan</Text>
          </View>
          {chartRows.length > 0 ? (
            <View>
              <SimpleBarChart
                data={chartRows.slice(-4)}
                seriesKeys={['ekoEnzim', 'emberTumpuk', 'pakan']}
                height={220}
              />
              <View className="flex-row items-center border-t border-gray-100 pt-6 mt-6 px-2">
                <View className="items-center flex-1">
                  <Text className="text-xl font-bold text-gray-900 mb-1">
                    {chartRows[chartRows.length - 1]?.ekoEnzim?.toFixed(1) || '0.0'} L
                  </Text>
                  <Text className="text-xs text-gray-500">
                    Ekoenzim ({chartRows[chartRows.length - 1]?.bulan || 'Bulan ini'})
                  </Text>
                </View>
                <View className="w-px h-8 bg-gray-200" />
                <View className="items-center flex-1">
                  <Text className="text-xl font-bold text-gray-900 mb-1">
                    {chartRows[chartRows.length - 1]?.emberTumpuk?.toFixed(1) || '0.0'} Kg
                  </Text>
                  <Text className="text-xs text-gray-500">
                    Ember Tumpuk ({chartRows[chartRows.length - 1]?.bulan || 'Bulan ini'})
                  </Text>
                </View>
                <View className="w-px h-8 bg-gray-200" />
                <View className="items-center flex-1">
                  <Text className="text-xl font-bold text-green-700 mb-1">
                    {Number(compareEkoenzim) > 0 ? '+' : ''}{compareEkoenzim}%
                  </Text>
                  <Text className="text-xs text-gray-500">
                    vs. {previousMonthRows[previousMonthRows.length-1]?.bulan || 'Bulan lalu'}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View className="h-44 items-center justify-center">
              <MaterialIcons name="bar-chart" size={40} color="#e5e7eb" />
              <Text className="mt-2 text-sm text-gray-400">Belum ada data grafik</Text>
            </View>
          )}

          <Pressable
            onPress={() => router.push('/grafik' as never)}
            className="mt-6 items-center active:opacity-70">
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

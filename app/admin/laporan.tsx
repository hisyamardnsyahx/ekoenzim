import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';

import { AppImage } from '@/components/app-image';
import { Badge, EmptyState, ErrorBanner, LoadingState } from '@/components/loading-state';
import { UiCard } from '@/components/ui-card';
import { MonitoringComments } from '@/components/monitoring/monitoring-comments';
import { type KondisiStatus, type MonitoringEntri } from '@/constants/mock-data';
import { Brand } from '@/constants/theme';
import { useToast } from '@/context/toast-context';
import { fetchAllMonitoring, updateMonitoringAdminKomentar } from '@/lib/api';
import {
  ADMIN_FILTERS,
  filterMonitoringByStatus,
  formatTanggalId,
  searchMonitoring,
} from '@/lib/domain';

const PHOTO_W = Math.min(Dimensions.get('window').width - 32, 360);
const PHOTO_H = Math.round(PHOTO_W * 1.25);

function badgeVariant(status: string): 'success' | 'warning' | 'default' | 'info' {
  if (status === 'Matang' || status === 'Siap Panen' || status === 'Baik') return 'success';
  if (status === 'Perhatian') return 'warning';
  if (status === 'Proses') return 'info';
  return 'default';
}

function getStatusColor(status: string): string {
  if (status === 'Matang' || status === 'Siap Panen' || status === 'Baik') return 'text-emerald-700 bg-emerald-50 border-emerald-100';
  if (status === 'Perhatian') return 'text-rose-700 bg-rose-50 border-rose-100';
  if (status === 'Proses') return 'text-blue-700 bg-blue-50 border-blue-100';
  return 'text-slate-600 bg-slate-100 border-slate-200';
}

export default function AdminLaporanScreen() {
  const toast = useToast();
  const [rows, setRows] = useState<MonitoringEntri[]>([]);
  const [filter, setFilter] = useState<(typeof ADMIN_FILTERS)[number]>('Semua');
  const [query, setQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [openCommentId, setOpenCommentId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await fetchAllMonitoring();
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const filtered = useMemo(() => {
    let result = filterMonitoringByStatus(
      rows,
      filter === 'Semua' ? 'Semua' : (filter as KondisiStatus),
    );
    if (startDate.trim()) {
      result = result.filter(m => m.tanggal >= startDate.trim());
    }
    if (endDate.trim()) {
      result = result.filter(m => m.tanggal <= endDate.trim());
    }
    return searchMonitoring(result, query);
  }, [rows, filter, query, startDate, endDate]);

  const openComment = (m: MonitoringEntri) => {
    setOpenCommentId((prev) => (prev === m.id ? null : m.id));
    setCommentDrafts((prev) => ({
      ...prev,
      [m.id]: prev[m.id] ?? m.adminKomentar ?? '',
    }));
  };

  const saveComment = async (m: MonitoringEntri) => {
    const body = (commentDrafts[m.id] ?? '').trim();
    setSavingId(m.id);
    try {
      const updated = await updateMonitoringAdminKomentar(m.id, body);
      setRows((prev) => prev.map((r) => (r.id === m.id ? updated : r)));
      setCommentDrafts((prev) => ({ ...prev, [m.id]: updated.adminKomentar ?? '' }));
      setOpenCommentId(null);
      toast.success(body ? 'Komentar terkirim' : 'Komentar dihapus', m.namaUser || 'Monitoring');
    } catch (e) {
      toast.error('Gagal menyimpan komentar', e instanceof Error ? e.message : 'Coba lagi');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <LoadingState label="Memuat laporan..." />;

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      {/* Title Header */}
      <View className="border-b border-slate-100 bg-white px-5 py-4 flex-row items-center justify-between z-10">
        <View>
          <Text className="text-xl font-bold text-slate-800">Laporan Monitoring</Text>
          <Text className="text-[11px] font-semibold text-slate-400 mt-0.5">Pantau kondisi dekomposisi warga</Text>
        </View>
        <View className="size-10 bg-slate-100 rounded-full items-center justify-center">
          <MaterialIcons name="assessment" size={20} color={Brand.slate} />
        </View>
      </View>

      {/* Filter Horizontal Scroll */}
      <View className="bg-white border-b border-slate-100 z-10">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 px-5 py-3">
          {ADMIN_FILTERS.map((f) => {
            const active = filter === f;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                className={`rounded-full px-4 py-1.5 border ${
                  active
                    ? 'bg-slate-900 border-slate-900 shadow-sm'
                    : 'border-slate-200 bg-white'
                }`}>
                <Text
                  className={`text-xs font-bold ${
                    active ? 'text-white' : 'text-slate-600'
                  }`}>
                  {f}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Search Bar */}
      <View className="px-4 pt-4 z-10">
        <View className="flex-row items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <MaterialIcons name="search" size={18} color="#94a3b8" />
          <TextInput
            placeholder="Cari nama warga, status, deskripsi..."
            placeholderTextColor="#94a3b8"
            value={query}
            onChangeText={setQuery}
            className="flex-1 text-sm text-slate-800 p-0"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <MaterialIcons name="close" size={16} color="#94a3b8" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Date Range Filter */}
      <View className="flex-row gap-2 px-4 pt-3 z-10">
        <View className="flex-1 flex-row items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5">
          <MaterialIcons name="date-range" size={14} color="#94a3b8" />
          <TextInput
            placeholder="Mulai: YYYY-MM-DD"
            placeholderTextColor="#cbd5e1"
            value={startDate}
            onChangeText={setStartDate}
            className="flex-1 text-xs text-slate-800 p-0"
            maxLength={10}
          />
          {startDate.length > 0 && (
            <Pressable onPress={() => setStartDate('')}>
              <MaterialIcons name="close" size={12} color="#94a3b8" />
            </Pressable>
          )}
        </View>
        <View className="flex-1 flex-row items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5">
          <MaterialIcons name="date-range" size={14} color="#94a3b8" />
          <TextInput
            placeholder="Akhir: YYYY-MM-DD"
            placeholderTextColor="#cbd5e1"
            value={endDate}
            onChangeText={setEndDate}
            className="flex-1 text-xs text-slate-800 p-0"
            maxLength={10}
          />
          {endDate.length > 0 && (
            <Pressable onPress={() => setEndDate('')}>
              <MaterialIcons name="close" size={12} color="#94a3b8" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Report List */}
      <ScrollView contentContainerClassName="gap-4 p-4 pb-12" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <ErrorBanner message={error} />

        {filtered.length === 0 ? (
          <EmptyState
            title="Tidak ada laporan"
            subtitle={query ? 'Coba ubah kata kunci pencarian Anda.' : 'Laporan dari warga akan muncul di sini.'}
          />
        ) : (
          filtered.map((m) => {
            const hasComment = Boolean(m.adminKomentar?.trim());
            const editing = openCommentId === m.id;
            const saving = savingId === m.id;

            // Generate initial avatar character
            const initial = (m.namaUser || 'W').charAt(0).toUpperCase();

            return (
              <UiCard key={m.id} className="border-slate-200/60 bg-white shadow-sm overflow-hidden">
                {/* Header Mitra Info */}
                <View className="p-4 border-b border-slate-100 flex-row gap-3 items-center">
                  <View className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center border border-slate-200">
                    <Text className="text-slate-700 font-bold text-sm">{initial}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-800">{m.namaUser || 'Mitra'}</Text>
                    <Text className="text-[10px] text-slate-400 mt-0.5">{formatTanggalId(m.tanggal)}</Text>
                  </View>
                  <View className={`border rounded-full px-2 py-0.5 ${getStatusColor(m.status)}`}>
                    <Text className="text-[9px] font-bold uppercase tracking-wider">{m.status}</Text>
                  </View>
                </View>

                {/* Content & Photo */}
                <View className="p-4 gap-3">
                  {/* Volume Info */}
                  <View className="flex-row items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg self-start">
                    <MaterialIcons name="scale" size={14} color="#64748b" />
                    <Text className="text-xs font-bold text-slate-600">
                      Volume: {m.volumeTerolah} kg
                    </Text>
                  </View>

                  <Text className="text-sm text-slate-700 leading-relaxed font-medium">
                    {m.deskripsi}
                  </Text>

                  {/* Photo Thumbnail */}
                  {m.fotoUrl ? (
                    <Pressable
                      onPress={() => setPhotoUri(m.fotoUrl)}
                      className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                      style={{ width: 100, height: 100 }}
                      >
                      <AppImage
                        uri={m.fotoUrl}
                        width={100}
                        height={100}
                        borderRadius={0}
                        recyclingKey={m.fotoUrl}
                      />
                      <View className="absolute inset-0 bg-black/20 items-center justify-center">
                        <MaterialIcons name="zoom-in" size={20} color="#fff" />
                      </View>
                    </Pressable>
                  ) : (
                    <View className="flex-row items-center gap-1.5 bg-slate-100/50 border border-slate-200/50 px-3 py-2 rounded-xl self-start">
                      <MaterialIcons name="image-not-supported" size={14} color="#94a3b8" />
                      <Text className="text-[11px] text-slate-500 font-semibold">Tanpa foto</Text>
                    </View>
                  )}

                  {/* Comment & Reply Box */}
                  <View className="mt-2 border-t border-slate-100 pt-3">
                    {hasComment && !editing && (
                      <View className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 mb-2">
                        <View className="flex-row items-center gap-1 mb-1">
                          <MaterialIcons name="reply" size={12} color="#047857" />
                          <Text className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                            Balasan Admin:
                          </Text>
                        </View>
                        <Text className="text-xs text-emerald-900 leading-relaxed font-medium">
                          {m.adminKomentar}
                        </Text>
                      </View>
                    )}

                    {editing ? (
                      <View className="flex-row items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <TextInput
                          value={commentDrafts[m.id] ?? ''}
                          onChangeText={(t) =>
                            setCommentDrafts((prev) => ({ ...prev, [m.id]: t }))
                          }
                          placeholder="Tulis saran/evaluasi..."
                          placeholderTextColor="#94a3b8"
                          className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white rounded-lg border border-slate-200"
                          multiline
                        />
                        <Pressable
                          onPress={() => saveComment(m)}
                          disabled={saving}
                          className="rounded-lg bg-emerald-600 p-2 shadow-sm active:bg-emerald-700">
                          {saving ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <MaterialIcons name="send" size={14} color="#fff" />
                          )}
                        </Pressable>
                        <Pressable
                          onPress={() => setOpenCommentId(null)}
                          className="rounded-lg bg-slate-200 p-2 active:bg-slate-300">
                          <MaterialIcons name="close" size={14} color="#475569" />
                        </Pressable>
                      </View>
                    ) : !hasComment ? (
                      <Pressable
                        onPress={() => openComment(m)}
                        className="flex-row items-center gap-1.5 py-2 px-3 bg-slate-100 rounded-lg self-start active:bg-slate-200">
                        <MaterialIcons name="chat-bubble-outline" size={13} color="#4b5563" />
                        <Text className="text-[11px] font-bold text-gray-700">
                          Beri Masukan / Evaluasi
                        </Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={() => openComment(m)}
                        className="flex-row items-center gap-1 py-1 active:opacity-75">
                        <MaterialIcons name="edit" size={12} color="#4b5563" />
                        <Text className="text-[11px] font-bold text-gray-500 ml-0.5">
                          Ubah Balasan
                        </Text>
                      </Pressable>
                    )}
                  </View>
                  <MonitoringComments monitoringId={m.id} />
                </View>
              </UiCard>
            );
          })
        )}
      </ScrollView>

      {/* Photo Overlay Modal */}
      <Modal
        visible={Boolean(photoUri)}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoUri(null)}>
        <View className="flex-1 items-center justify-center bg-black/85 p-4">
          <Pressable
            onPress={() => setPhotoUri(null)}
            className="absolute right-4 top-12 z-10 rounded-full bg-white/90 p-2">
            <MaterialIcons name="close" size={22} color="#111" />
          </Pressable>
          {photoUri ? (
            <AppImage
              uri={photoUri}
              width={PHOTO_W}
              height={PHOTO_H}
              borderRadius={12}
              recyclingKey={photoUri}
              accessibilityLabel="Foto kondisi laporan"
            />
          ) : null}
          <Pressable
            onPress={() => setPhotoUri(null)}
            className="mt-6 rounded-full bg-white px-6 py-2.5 active:opacity-70 shadow-md">
            <Text className="text-sm font-bold text-slate-900">Tutup Tampilan</Text>
          </Pressable>
        </View>
      </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

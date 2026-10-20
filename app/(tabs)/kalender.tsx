import { useCallback, useState } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';

import { PageHeader } from '@/components/page-header';
import { UiCard } from '@/components/ui-card';
import { LoadingState } from '@/components/loading-state';
import { type JadwalItem } from '@/constants/mock-data';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { fetchEntries, fetchJadwal, setJadwalAktif } from '@/lib/api';
import { REMINDER_HOUR, REMINDER_MINUTE, syncReminderNotifications } from '@/lib/reminders';

export default function KalenderScreen() {
  const { user, profile } = useAuth();
  const toast = useToast();
  const uid = user?.id ?? profile?.id ?? '';
  const [jadwal, setJadwal] = useState<JadwalItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!uid) return;
    try {
      const [j, e] = await Promise.all([
        fetchJadwal(uid),
        fetchEntries(uid),
      ]);
      setJadwal(j);
      void syncReminderNotifications(j, e);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const toggle = async (id: string) => {
    const next = jadwal.map((j) => (j.id === id ? { ...j, aktif: !j.aktif } : j));
    setJadwal(next);
    const item = next.find((j) => j.id === id);
    if (item && uid) {
      try {
        await setJadwalAktif(uid, id, item.aktif);
      } catch (e) {
        setJadwal(jadwal);
        toast.error('Gagal mengubah pengingat', e instanceof Error ? e.message : 'Coba lagi');
        return;
      }
    }
    
    try {
      const e = await fetchEntries(uid);
      const ok = await syncReminderNotifications(next, e);
      if (!ok && item?.aktif) {
        const reverted = next.map((j) => (j.id === id ? { ...j, aktif: false } : j));
        setJadwal(reverted);
        if (uid) await setJadwalAktif(uid, id, false).catch(() => undefined);
        toast.error(
          'Izin notifikasi ditolak',
          'Izinkan notifikasi di pengaturan agar pengingat muncul.',
        );
        return;
      }
    } catch (err) {
      console.warn('Gagal reschedule notifikasi saat toggle', err);
    }

    if (item) {
      toast.success(item.aktif ? 'Pengingat diaktifkan' : 'Pengingat dimatikan', item.judul);
    }
  };

  if (loading) return <LoadingState label="Memuat pengingat..." />;

  return (
    <View className="flex-1 bg-surface">
      <PageHeader title="Jadwal & Pengingat" />
      <ScrollView
        contentContainerClassName="gap-4 p-5 pb-10"
        showsVerticalScrollIndicator={false}>
        
        {/* Info Box */}
        <View className="flex-row gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <MaterialIcons name="info-outline" size={20} color="#1d4ed8" style={{ marginTop: 2 }} />
          <Text className="flex-1 text-sm leading-5 text-blue-700">
            Aktifkan pengingat untuk mendapatkan notifikasi pada jam{' '}
            {String(REMINDER_HOUR).padStart(2, '0')}:
            {String(REMINDER_MINUTE).padStart(2, '0')} sesuai jadwal yang ditentukan.
          </Text>
        </View>

        {/* Switches */}
        <UiCard className="overflow-hidden p-0">
          {jadwal.map((j, idx) => (
            <View
              key={j.id}
              className={'flex-row items-center justify-between px-4 py-4 ' + (idx < jadwal.length - 1 ? 'border-b border-gray-100' : '')}>
              <View className="mr-3 flex-1 pr-2">
                <Text className="text-sm font-medium text-gray-900">{j.judul}</Text>
                <Text className="mt-1 text-xs text-gray-500">{j.frekuensi}</Text>
              </View>
              <Switch
                value={j.aktif}
                onValueChange={() => toggle(j.id)}
                trackColor={{ false: '#e5e7eb', true: Brand.greenMid }}
                thumbColor={j.aktif ? Brand.green : '#ffffff'}
              />
            </View>
          ))}
        </UiCard>

      </ScrollView>
    </View>
  );
}

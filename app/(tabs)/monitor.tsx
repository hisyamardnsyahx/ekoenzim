import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { AppImage } from '@/components/app-image';
import { AuthTextField } from '@/components/auth-text-field';
import { MonitoringComments } from '@/components/monitoring/monitoring-comments';
import { Badge, EmptyState } from '@/components/loading-state';
import { PageHeader } from '@/components/page-header';
import { UiCard } from '@/components/ui-card';
import { type KondisiStatus, type MonitoringEntri } from '@/constants/mock-data';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { createMonitoring, fetchMonitoringForUser } from '@/lib/api';
import { USER_STATUS_OPTIONS } from '@/lib/domain';
import { uriToDataUrl } from '@/lib/photo';

async function pickPhotoFromLibrary(): Promise<string | null> {
  try {
    const ImagePicker = await import('expo-image-picker');
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Izin', 'Izinkan akses galeri untuk upload foto.');
      return null;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });
    if (res.canceled || !res.assets?.[0]) return null;
    const asset = res.assets[0];
    
    // Compress & resize to 640px width with 0.3 quality using ImageManipulator
    const ImageManipulator = await import('expo-image-manipulator');
    const manipulated = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: 640 } }],
      { compress: 0.3, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
    
    if (manipulated.base64) {
      return `data:image/jpeg;base64,${manipulated.base64}`;
    }
    return null;
  } catch (e) {
    Alert.alert(
      'Foto',
      e instanceof Error
        ? `Image picker tidak tersedia: ${e.message}`
        : 'Image picker tidak tersedia di perangkat ini.',
    );
    return null;
  }
}

function badgeVariant(status: KondisiStatus): 'success' | 'warning' | 'default' | 'info' {
  if (status === 'Matang' || status === 'Siap Panen' || status === 'Baik') return 'success';
  if (status === 'Perhatian') return 'warning';
  if (status === 'Proses') return 'info';
  return 'default';
}

function chipStyle(s: KondisiStatus, active: boolean) {
  if (!active) return { box: 'border-gray-200 bg-white', text: 'text-gray-500' };
  if (s === 'Proses' || s === 'Baru Mulai')
    return { box: 'border-blue-500 bg-blue-50', text: 'text-blue-700' };
  if (s === 'Matang' || s === 'Siap Panen' || s === 'Baik')
    return { box: 'border-emerald-500 bg-emerald-50', text: 'text-emerald-700' };
  if (s === 'Perhatian')
    return { box: 'border-orange-500 bg-orange-50', text: 'text-orange-700' };
  return { box: 'border-brand bg-emerald-50', text: 'text-brand-text' };
}

export default function MonitorScreen() {
  const { user, profile } = useAuth();
  const toast = useToast();
  const [deskripsi, setDeskripsi] = useState('');
  const [status, setStatus] = useState<KondisiStatus>('Proses');
  const [volume, setVolume] = useState('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [list, setList] = useState<MonitoringEntri[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const uid = user?.id ?? profile?.id ?? '';
  const nama = profile?.nama_lengkap || 'Pengguna';

  const load = useCallback(async () => {
    if (!uid) return;
    const rows = await fetchMonitoringForUser(uid);
    setList(rows);
    setLoading(false);
  }, [uid]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const pickImage = async () => {
    const uri = await pickPhotoFromLibrary();
    if (uri) setFotoUri(uri);
  };

  const simpan = async () => {
    if (!deskripsi.trim()) {
      toast.error('Validasi', 'Deskripsi kondisi wajib diisi.');
      return;
    }
    if (!uid) {
      toast.error('Sesi', 'Silakan login ulang.');
      return;
    }
    setBusy(true);
    try {
      let fotoUrl = fotoUri || '';
      if (fotoUrl && !fotoUrl.startsWith('data:') && !fotoUrl.startsWith('http')) {
        fotoUrl = await uriToDataUrl(fotoUrl);
      }
      const volumeTerolah = parseFloat(volume) || 0;
      const row = await createMonitoring(uid, nama, {
        deskripsi: deskripsi.trim(),
        status,
        fotoUrl,
        volumeTerolah,
      });
      setList((prev) => [row, ...prev]);
      setDeskripsi('');
      setStatus('Proses');
      setVolume('');
      setFotoUri(null);
      toast.success('Laporan terkirim', `Status: ${row.status}`);
    } catch (e) {
      toast.error('Gagal menyimpan', e instanceof Error ? e.message : 'Coba lagi');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface"
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      <PageHeader title="Monitoring Kondisi" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-4 p-5 pb-10"
        showsVerticalScrollIndicator={false}>
        <UiCard className="gap-4 p-5">
          <View className="gap-1.5">
            <Text className="text-sm font-medium text-gray-700">Foto Kondisi</Text>
            <Pressable
              onPress={pickImage}
              className={`h-32 items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed active:opacity-80 ${
                fotoUri
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-300 bg-gray-50'
              }`}>
              {fotoUri ? (
                <View className="h-full w-full">
                  <AppImage uri={fotoUri} fill borderRadius={12} contentFit="cover" />
                </View>
              ) : (
                <>
                  <MaterialIcons name="photo-camera" size={24} color={Brand.muted} />
                  <Text className="text-sm text-gray-500">Ketuk untuk Ambil/Pilih Foto</Text>
                </>
              )}
            </Pressable>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-gray-700">Status Kondisi</Text>
            <View className="flex-row flex-wrap gap-2">
              {USER_STATUS_OPTIONS.map((s) => {
                const active = status === s;
                const st = chipStyle(s, active);
                return (
                  <Pressable
                    key={s}
                    onPress={() => setStatus(s)}
                    className={`rounded-full border px-3 py-2 ${st.box}`}>
                    <Text className={`text-xs font-semibold ${st.text}`}>{s}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <AuthTextField
            label="Deskripsi / Catatan"
            value={deskripsi}
            onChangeText={setDeskripsi}
            placeholder="Contoh: Bau agak asam, warna mulai kecoklatan..."
            multiline
            numberOfLines={3}
            className="min-h-20 pt-3"
            textAlignVertical="top"
          />

          <AuthTextField
            label="Volume Sampah Terolah (kg)"
            value={volume}
            onChangeText={setVolume}
            placeholder="0"
            keyboardType="decimal-pad"
          />

          <Pressable
            onPress={simpan}
            disabled={busy || !deskripsi.trim()}
            className="flex-row items-center justify-center gap-1.5 rounded-xl bg-brand py-3.5 shadow-sm active:opacity-90 disabled:opacity-50">
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <MaterialIcons name="send" size={18} color="#fff" />
            )}
            <Text className="text-[15px] font-medium text-white">Kirim Laporan</Text>
          </Pressable>
        </UiCard>

        <Text className="px-1 text-sm font-semibold text-gray-800">Laporan Anda</Text>
        {loading ? (
          <Text className="text-sm text-muted">Memuat...</Text>
        ) : list.length === 0 ? (
          <EmptyState
            title="Belum ada laporan monitoring"
            subtitle="Upload foto kondisimu secara rutin di sini."
            icon="inbox"
          />
        ) : (
          list.map((m) => {
            const komentar = m.adminKomentar?.trim();
            return (
              <UiCard key={m.id} className="flex-row gap-4 p-4">
                <View className="size-16 overflow-hidden rounded-lg bg-gray-100">
                  {m.fotoUrl ? (
                    <AppImage
                      uri={m.fotoUrl}
                      width={64}
                      height={64}
                      borderRadius={8}
                      recyclingKey={m.id}
                    />
                  ) : (
                    <View className="h-full w-full items-center justify-center">
                      <MaterialIcons name="image" size={20} color="#9ca3af" />
                    </View>
                  )}
                </View>
                <View className="min-w-0 flex-1 justify-between">
                  <View className="mb-1 flex-row items-start justify-between">
                    <Badge variant={badgeVariant(m.status)}>{m.status}</Badge>
                    <Text className="text-[10px] font-medium text-gray-400">{m.tanggal}</Text>
                  </View>
                  <Text className="text-sm font-medium text-gray-700" numberOfLines={2}>
                    {m.deskripsi}
                  </Text>
                  {komentar ? (
                    <View className="mt-2 flex-row items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-2">
                      <MaterialIcons
                        name="chat-bubble-outline"
                        size={14}
                        color={Brand.green}
                        style={{ marginTop: 2 }}
                      />
                      <View className="flex-1">
                        <Text className="mb-0.5 text-xs font-bold text-emerald-800">
                          Balasan Admin:
                        </Text>
                        <Text className="text-xs text-emerald-700">{komentar}</Text>
                      </View>
                    </View>
                  ) : null}

                  <MonitoringComments monitoringId={m.id} />
                </View>
              </UiCard>
            );
          })
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}



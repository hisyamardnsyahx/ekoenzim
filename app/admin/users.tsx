import { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { AuthTextField } from '@/components/auth-text-field';
import { Badge, EmptyState, ErrorBanner, LoadingState } from '@/components/loading-state';
import { UiCard } from '@/components/ui-card';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import {
  adminCreateUser,
  adminDeleteUser,
  adminUpdateUser,
  fetchAllUsers,
  setUserAktif,
} from '@/lib/api';
import type { Profile } from '@/lib/supabase';

type FormState = {
  emailOrPhone: string;
  password: string;
  namaLengkap: string;
  alamat: string;
  umur: string;
  role: 'user' | 'admin';
  aktif: boolean;
};

const emptyForm = (): FormState => ({
  emailOrPhone: '',
  password: '',
  namaLengkap: '',
  alamat: '',
  umur: '',
  role: 'user',
  aktif: true,
});

export default function AdminUsersScreen() {
  const { profile: me } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const rows = await fetchAllUsers();
      setUsers(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat user');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (u: Profile) => {
    setEditing(u);
    setForm({
      emailOrPhone: u.email || u.hp || '',
      password: '',
      namaLengkap: u.nama_lengkap || '',
      alamat: u.alamat || '',
      umur: u.umur != null ? String(u.umur) : '',
      role: u.role,
      aktif: u.aktif,
    });
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setFormError('');
  };

  const save = async () => {
    setFormError('');
    if (!form.namaLengkap.trim()) {
      setFormError('Nama lengkap wajib diisi.');
      return;
    }
    if (!editing && !form.emailOrPhone.trim()) {
      setFormError('No. Handphone / Email wajib diisi.');
      return;
    }
    if (!editing && form.password.length < 6) {
      setFormError('Kata sandi minimal 6 karakter.');
      return;
    }
    if (editing && form.password && form.password.length < 6) {
      setFormError('Kata sandi baru minimal 6 karakter (atau kosongkan).');
      return;
    }

    const umurNum = form.umur.trim() ? Number(form.umur) : null;
    if (form.umur.trim() && (Number.isNaN(umurNum) || (umurNum ?? 0) < 0)) {
      setFormError('Umur tidak valid.');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await adminUpdateUser(editing.id, {
          emailOrPhone: form.emailOrPhone.trim() || undefined,
          password: form.password || undefined,
          namaLengkap: form.namaLengkap,
          alamat: form.alamat,
          umur: umurNum,
          role: form.role,
          aktif: form.aktif,
        });
      } else {
        await adminCreateUser({
          emailOrPhone: form.emailOrPhone.trim(),
          password: form.password,
          namaLengkap: form.namaLengkap,
          alamat: form.alamat,
          umur: umurNum,
          role: form.role,
          aktif: form.aktif,
        });
      }
      setModalOpen(false);
      setEditing(null);
      await load();
      toast.success(editing ? 'Mitra diperbarui' : 'Mitra ditambahkan', form.namaLengkap || form.emailOrPhone);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal menyimpan';
      setFormError(msg);
      toast.error('Gagal menyimpan mitra', msg);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (u: Profile) => {
    if (me?.id === u.id) {
      toast.error('Tidak diizinkan', 'Tidak bisa menonaktifkan akun sendiri.');
      return;
    }
    const next = !u.aktif;
    const prev = users;
    setUsers((p) => p.map((x) => (x.id === u.id ? { ...x, aktif: next } : x)));
    try {
      await setUserAktif(u.id, next);
      toast.success(next ? 'Mitra diaktifkan' : 'Mitra dinonaktifkan', u.nama_lengkap);
    } catch (e) {
      setUsers(prev);
      toast.error('Gagal mengubah status', e instanceof Error ? e.message : 'Coba lagi');
    }
  };

  const confirmDelete = (u: Profile) => {
    if (me?.id === u.id) {
      toast.error('Tidak diizinkan', 'Tidak bisa menghapus akun sendiri.');
      return;
    }
    Alert.alert(
      'Hapus Mitra?',
      `Apakah Anda yakin ingin menghapus akun "${u.nama_lengkap}"? Data entry dan laporan monitoring terkait juga akan ikut terhapus secara permanen.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminDeleteUser(u.id);
              toast.success('Akun berhasil dihapus', u.nama_lengkap);
              load();
            } catch (e) {
              toast.error('Gagal menghapus', e instanceof Error ? e.message : 'Coba lagi');
            }
          },
        },
      ],
    );
  };

  const mitra = users.filter((u) => u.role !== 'admin');

  if (loading) return <LoadingState label="Memuat data mitra..." />;

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Title Header with Add Button */}
      <View className="border-b border-slate-100 bg-white px-5 py-4 flex-row items-center justify-between z-10">
        <View>
          <Text className="text-xl font-bold text-slate-800">Manajemen Mitra</Text>
          <Text className="text-[11px] font-semibold text-slate-400 mt-0.5">
            Daftar & buat akun warga pengolah sampah
          </Text>
        </View>
        <Pressable
          onPress={openCreate}
          className="flex-row items-center gap-1 bg-slate-900 px-3.5 py-2 rounded-xl shadow-sm active:bg-slate-800">
          <MaterialIcons name="add" size={16} color="#fff" />
          <Text className="text-xs font-bold text-white">Tambah</Text>
        </Pressable>
      </View>

      {/* Mitra List */}
      <ScrollView contentContainerClassName="gap-4 p-4 pb-12" showsVerticalScrollIndicator={false}>
        <ErrorBanner message={error} />

        {mitra.length === 0 ? (
          <EmptyState
            title="Belum ada mitra"
            subtitle="Tekan tombol Tambah di pojok kanan atas untuk mendaftarkan mitra baru."
          />
        ) : (
          mitra.map((u) => (
            <UiCard key={u.id} className="border-slate-200/60 bg-white shadow-sm p-4 gap-3">
              {/* Profile Card Header */}
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center border border-slate-200">
                  <Text className="text-slate-700 font-bold text-sm">
                    {(u.nama_lengkap || 'W').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-800">{u.nama_lengkap}</Text>
                  <Text className="text-[10px] text-slate-400 mt-0.5">ID: {u.id.substring(0, 8)}...</Text>
                </View>
                <View
                  className={`px-2.5 py-0.5 rounded-full border ${
                    u.aktif
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                      : 'text-slate-400 bg-slate-100 border-slate-200'
                  }`}>
                  <Text className="text-[9px] font-bold uppercase tracking-wider">
                    {u.aktif ? 'Aktif' : 'Nonaktif'}
                  </Text>
                </View>
              </View>

              {/* Detail Info Grid */}
              <View className="bg-slate-50/70 border border-slate-200/60 rounded-xl p-3 gap-2.5">
                <View className="flex-row items-center">
                  <MaterialIcons name="phone" size={14} color="#64748b" className="mr-2" />
                  <Text className="text-xs text-slate-600 flex-1">
                    <Text className="font-bold text-slate-700">Kontak:</Text> {u.hp || u.email || '-'}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <MaterialIcons name="place" size={14} color="#64748b" className="mr-2" />
                  <Text className="text-xs text-slate-600 flex-1">
                    <Text className="font-bold text-slate-700">Alamat:</Text> {u.alamat || '-'}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <MaterialIcons name="cake" size={14} color="#64748b" className="mr-2" />
                  <Text className="text-xs text-slate-600 flex-1">
                    <Text className="font-bold text-slate-700">Umur:</Text> {u.umur != null ? `${u.umur} tahun` : '-'}
                  </Text>
                </View>
              </View>

              {/* Action Buttons Tray */}
              <View className="flex-row items-center justify-between border-t border-slate-100 pt-3 mt-1">
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => openEdit(u)}
                    className="flex-row items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 active:bg-slate-50">
                    <MaterialIcons name="edit" size={14} color="#475569" />
                    <Text className="text-xs font-bold text-slate-700">Edit</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => confirmDelete(u)}
                    className="flex-row items-center gap-1 rounded-lg border border-rose-200 bg-rose-50/40 px-3 py-1.5 active:bg-rose-50">
                    <MaterialIcons name="delete-outline" size={14} color={Brand.danger} />
                    <Text className="text-xs font-bold text-rose-700">Hapus</Text>
                  </Pressable>
                </View>
                <Pressable
                  onPress={() => toggle(u)}
                  className={`rounded-lg px-3.5 py-1.5 border ${
                    u.aktif
                      ? 'border-slate-200 bg-white'
                      : 'border-emerald-600 bg-emerald-600'
                  }`}
                  style={u.aktif ? {} : { backgroundColor: Brand.green }}>
                  <Text
                    className={`text-xs font-bold ${
                      u.aktif ? 'text-slate-700' : 'text-white'
                    }`}>
                    {u.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                  </Text>
                </Pressable>
              </View>
            </UiCard>
          ))
        )}
      </ScrollView>

      {/* Edit/Create User Modal Dialog */}
      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={closeModal}>
        <View className="flex-1 items-center justify-end bg-slate-900/60">
          <View className="w-full max-h-[90%] bg-white rounded-t-3xl shadow-xl overflow-hidden">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
              <Text className="font-bold text-slate-800 text-base">
                {editing ? 'Edit Data Mitra' : 'Tambah Mitra Baru'}
              </Text>
              <Pressable onPress={closeModal} hitSlop={8} className="p-1 rounded-full active:bg-slate-200">
                <MaterialIcons name="close" size={20} color="#64748b" />
              </Pressable>
            </View>

            {/* Modal Scroll Form */}
            <ScrollView
              contentContainerClassName="gap-4 p-5 pb-12"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <ErrorBanner message={formError} />

              <AuthTextField
                label="Nama Lengkap"
                value={form.namaLengkap}
                onChangeText={(t) => setForm((f) => ({ ...f, namaLengkap: t }))}
                placeholder="Contoh: Budi Santoso"
              />
              <AuthTextField
                label="No. Handphone / Email"
                icon="phone"
                value={form.emailOrPhone}
                onChangeText={(t) => setForm((f) => ({ ...f, emailOrPhone: t }))}
                placeholder="Contoh: 081234567890"
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <AuthTextField
                label={editing ? 'Kata Sandi Baru (opsional)' : 'Kata Sandi'}
                icon="lock"
                value={form.password}
                onChangeText={(t) => setForm((f) => ({ ...f, password: t }))}
                placeholder={editing ? 'Kosongkan jika tidak diganti' : 'Minimal 6 karakter'}
                secureTextEntry
                showPasswordToggle
              />
              <AuthTextField
                label="Alamat / RT RW"
                icon="place"
                value={form.alamat}
                onChangeText={(t) => setForm((f) => ({ ...f, alamat: t }))}
                placeholder="Contoh: RT 02 / RW 04"
              />
              <AuthTextField
                label="Umur"
                value={form.umur}
                onChangeText={(t) => setForm((f) => ({ ...f, umur: t }))}
                placeholder="Contoh: 35"
                keyboardType="number-pad"
              />

              <View className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-3 mt-1">
                <View>
                  <Text className="text-sm font-bold text-slate-800">Status Akun</Text>
                  <Text className="text-[10px] text-slate-400 mt-0.5">Mengatur akses masuk mitra ke aplikasi</Text>
                </View>
                <Switch
                  value={form.aktif}
                  onValueChange={(v) => setForm((f) => ({ ...f, aktif: v }))}
                  trackColor={{ false: '#cbd5e1', true: '#a7f3d0' }}
                  thumbColor={form.aktif ? '#059669' : '#f1f5f9'}
                />
              </View>

              <Pressable
                onPress={save}
                disabled={saving}
                className={`mt-4 items-center rounded-xl bg-slate-900 py-3.5 shadow-sm active:bg-slate-800 ${
                  saving ? 'opacity-60' : ''
                }`}>
                <Text className="text-base font-bold text-white">
                  {saving ? 'Menyimpan...' : editing ? 'Perbarui Data' : 'Simpan Mitra'}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

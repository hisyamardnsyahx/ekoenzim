import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';

import { AuthTextField } from '@/components/auth-text-field';
import { Badge, EmptyState } from '@/components/loading-state';
import { PageHeader } from '@/components/page-header';
import { SelectField } from '@/components/select-field';
import { UiCard } from '@/components/ui-card';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { createEntry, fetchEntries, fetchJadwal } from '@/lib/api';
import { syncReminderNotifications } from '@/lib/reminders';
import {
  hitungBeratAkhir,
  PENGGUNAAN_OPTIONS,
  resolvePenggunaan,
  type EntriRow,
  type PenggunaanOption,
} from '@/lib/domain';

type FieldErrors = {
  jenis?: string;
  custom?: string;
  beratAwal?: string;
  beratPenggunaan?: string;
};

function parseKg(raw: string): number | null {
  const t = raw.trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return n;
}

function validateEntryForm(input: {
  jenis: string;
  custom: string;
  beratAwal: string;
  beratPenggunaan: string;
}): { ok: true; beratAwal: number; beratPenggunaan: number; penggunaan: string } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};

  const resolved = resolvePenggunaan(input.jenis, input.custom);
  if (!resolved.ok) {
    if (!input.jenis.trim()) errors.jenis = 'Pilih jenis olahan / penggunaan.';
    else if (input.jenis === 'Lainnya') errors.custom = resolved.error;
    else errors.jenis = resolved.error;
  }

  const awal = parseKg(input.beratAwal);
  if (input.beratAwal.trim() === '') {
    errors.beratAwal = 'Berat awal wajib diisi.';
  } else if (awal === null) {
    errors.beratAwal = 'Berat awal harus angka valid.';
  } else if (awal <= 0) {
    errors.beratAwal = 'Berat awal harus lebih dari 0.';
  }

  const pakaiRaw = input.beratPenggunaan.trim();
  let pakai = 0;
  if (pakaiRaw !== '') {
    const p = parseKg(input.beratPenggunaan);
    if (p === null) {
      errors.beratPenggunaan = 'Berat penggunaan harus angka valid.';
    } else if (p < 0) {
      errors.beratPenggunaan = 'Berat penggunaan tidak boleh negatif.';
    } else {
      pakai = p;
    }
  }

  if (awal !== null && awal > 0 && pakai > awal && !errors.beratPenggunaan) {
    errors.beratPenggunaan = 'Penggunaan tidak boleh melebihi berat awal.';
  }

  if (Object.keys(errors).length > 0 || !resolved.ok || awal === null || awal <= 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    beratAwal: awal,
    beratPenggunaan: pakai,
    penggunaan: resolved.value,
  };
}

export default function EntryScreen() {
  const { user, profile } = useAuth();
  const toast = useToast();
  const [entries, setEntries] = useState<EntriRow[]>([]);
  const [beratAwal, setBeratAwal] = useState('');
  const [penggunaanOption, setPenggunaanOption] = useState<PenggunaanOption | ''>('');
  const [penggunaanCustom, setPenggunaanCustom] = useState('');
  const [beratPenggunaan, setBeratPenggunaan] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const uid = user?.id ?? profile?.id ?? '';
  const showCustom = penggunaanOption === 'Lainnya';

  const load = useCallback(async () => {
    if (!uid) return;
    const rows = await fetchEntries(uid);
    setEntries(rows);
    setLoading(false);
  }, [uid]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const awalNum = parseKg(beratAwal) ?? 0;
  const pakaiNum = parseKg(beratPenggunaan) ?? 0;
  const sisaRaw = awalNum - pakaiNum;
  const beratAkhir = useMemo(
    () => hitungBeratAkhir(awalNum, pakaiNum),
    [awalNum, pakaiNum],
  );

  const sisaStyle = (() => {
    if (!beratAwal.trim() && !beratPenggunaan.trim()) {
      return { box: 'bg-gray-50 border-gray-200', text: 'text-gray-500' };
    }
    if (sisaRaw < 0) {
      return { box: 'bg-red-50 border-red-200', text: 'text-red-600' };
    }
    if (sisaRaw === 0 && beratAwal.trim()) {
      return { box: 'bg-blue-50 border-blue-200', text: 'text-blue-600' };
    }
    return { box: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' };
  })();

  const clearFieldError = (key: keyof FieldErrors) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const simpan = async () => {
    const result = validateEntryForm({
      jenis: penggunaanOption,
      custom: penggunaanCustom,
      beratAwal,
      beratPenggunaan,
    });

    if (!result.ok) {
      setErrors(result.errors);
      const first =
        result.errors.jenis ||
        result.errors.custom ||
        result.errors.beratAwal ||
        result.errors.beratPenggunaan ||
        'Periksa form.';
      toast.error('Validasi', first);
      return;
    }

    if (!uid) {
      toast.error('Sesi', 'Silakan login ulang.');
      return;
    }

    setErrors({});
    setBusy(true);
    try {
      const row = await createEntry(uid, {
        beratAwal: result.beratAwal,
        penggunaan: result.penggunaan,
        beratPenggunaan: result.beratPenggunaan,
      });
      setEntries((prev) => [row, ...prev]);
      setBeratAwal('');
      setPenggunaanOption('');
      setPenggunaanCustom('');
      setBeratPenggunaan('');
      setErrors({});
      toast.success('Data berhasil disimpan', `${result.penggunaan} · ${row.beratPenggunaan} kg`);
      
      // Sinkronkan notifikasi push secara dinamis setelah entri baru
      try {
        const j = await fetchJadwal(uid);
        const updatedEntries = [row, ...entries];
        await syncReminderNotifications(j, updatedEntries);
      } catch (err) {
        console.warn('Gagal sinkronisasi notifikasi', err);
      }
    } catch (e) {
      toast.error('Gagal menyimpan', e instanceof Error ? e.message : 'Coba lagi');
    } finally {
      setBusy(false);
    }
  };

  const displayedEntries = showAllHistory ? entries : entries.slice(0, 3);
  const formBlocked = busy;

  return (
    <View className="flex-1 bg-surface">
      <PageHeader title="Entri Data Harian" />
      <ScrollView
        contentContainerClassName="gap-4 p-5 pb-10"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <UiCard className="gap-4 p-5">
          <SelectField
            label="Jenis Olahan / Penggunaan"
            value={penggunaanOption}
            options={PENGGUNAAN_OPTIONS}
            placeholder="Pilih jenis olahan..."
            error={errors.jenis}
            onChange={(v) => {
              setPenggunaanOption(v as PenggunaanOption);
              clearFieldError('jenis');
              if (v !== 'Lainnya') {
                setPenggunaanCustom('');
                clearFieldError('custom');
              }
            }}
          />

          {showCustom ? (
            <AuthTextField
              label="Tulis penggunaan custom"
              value={penggunaanCustom}
              onChangeText={(t) => {
                setPenggunaanCustom(t);
                clearFieldError('custom');
              }}
              placeholder="mis. Pupuk cair / lainnya..."
              error={errors.custom}
            />
          ) : null}

          <View className="flex-row gap-4">
            <View className="flex-1">
              <AuthTextField
                label="Berat Awal (kg)"
                value={beratAwal}
                onChangeText={(t) => {
                  setBeratAwal(t);
                  clearFieldError('beratAwal');
                  clearFieldError('beratPenggunaan');
                }}
                placeholder="0.0"
                keyboardType="decimal-pad"
                error={errors.beratAwal}
              />
            </View>
            <View className="flex-1">
              <AuthTextField
                label="Penggunaan (kg)"
                value={beratPenggunaan}
                onChangeText={(t) => {
                  setBeratPenggunaan(t);
                  clearFieldError('beratPenggunaan');
                }}
                placeholder="0.0"
                keyboardType="decimal-pad"
                error={errors.beratPenggunaan}
              />
            </View>
          </View>

          <View
            className={`flex-row items-center justify-between rounded-xl border px-4 py-4 ${sisaStyle.box}`}>
            <Text className={`text-sm font-medium opacity-80 ${sisaStyle.text}`}>
              Sisa / Berat Akhir:
            </Text>
            <Text className={`text-xl font-bold ${sisaStyle.text}`}>
              {beratAkhir.toFixed(1)} kg
            </Text>
          </View>

          {sisaRaw < 0 ? (
            <Text className="text-xs font-medium text-red-500">
              Nilai penggunaan tidak boleh melebihi berat awal.
            </Text>
          ) : null}

          <Pressable
            onPress={simpan}
            disabled={formBlocked}
            className="flex-row items-center justify-center gap-1.5 rounded-xl bg-brand py-3.5 shadow-sm active:opacity-90 disabled:opacity-50">
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <MaterialIcons name="save" size={18} color="#fff" />
            )}
            <Text className="text-[15px] font-medium text-white">Simpan Data</Text>
          </Pressable>
        </UiCard>

        <View className="flex-row items-center justify-between px-1">
          <Text className="text-sm font-semibold text-gray-800">Riwayat Terakhir</Text>
          {entries.length > 3 && (
            <Pressable
              onPress={() => setShowAllHistory(!showAllHistory)}
              className="flex-row items-center gap-0.5 active:opacity-70">
              <Text className="text-xs font-bold text-brand">
                {showAllHistory ? 'Sembunyikan' : 'Lihat Selengkapnya'}
              </Text>
              <MaterialIcons
                name={showAllHistory ? 'expand-less' : 'expand-more'}
                size={14}
                color={Brand.green}
              />
            </Pressable>
          )}
        </View>
        {loading ? (
          <Text className="text-sm text-muted">Memuat...</Text>
        ) : displayedEntries.length === 0 ? (
          <EmptyState
            title="Belum ada riwayat entri"
            subtitle="Mulai catat pengolahan pertamamu hari ini."
            icon="inbox"
          />
        ) : (
          displayedEntries.map((e) => (
            <UiCard key={e.id} className="flex-row items-center justify-between p-4">
              <View>
                <Text className="text-sm font-bold text-gray-800">{e.penggunaan}</Text>
                <View className="mt-1 flex-row items-center gap-1">
                  <MaterialIcons name="schedule" size={12} color={Brand.muted} />
                  <Text className="text-xs font-medium text-gray-500">{e.tanggal}</Text>
                </View>
              </View>
              <View className="items-end gap-1">
                <Text className="mb-1 text-sm font-bold text-gray-900">{e.beratAwal} kg</Text>
                <Badge variant={e.beratAkhir > 0 ? 'emerald' : 'default'}>
                  {"Sisa " + e.beratAkhir + " kg"}
                </Badge>
              </View>
            </UiCard>
          ))
        )}
      </ScrollView>
    </View>
  );
}

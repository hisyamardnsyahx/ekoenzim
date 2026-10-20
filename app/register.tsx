import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthTextField } from '@/components/auth-text-field';
import { ErrorBanner } from '@/components/loading-state';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const toast = useToast();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!emailOrPhone.trim() || !password || !fullName.trim() || !age.trim()) {
      setError('Mohon lengkapi semua data wajib.');
      toast.error('Validasi', 'Mohon lengkapi semua data wajib.');
      return;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      toast.error('Validasi', 'Password minimal 6 karakter.');
      return;
    }
    const n = Number(age);
    if (!Number.isInteger(n) || n <= 0) {
      setError('Umur harus angka lebih dari 0.');
      toast.error('Validasi', 'Umur harus angka lebih dari 0.');
      return;
    }
    setBusy(true);
    setError('');
    const res = await signUp({
      emailOrPhone,
      password,
      namaLengkap: fullName.trim(),
      alamat: address.trim(),
      umur: n,
    });
    setBusy(false);
    if (res.error) {
      setError(res.error);
      toast.error('Daftar gagal', res.error);
      return;
    }
    toast.success('Akun berhasil dibuat', fullName.trim());
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom', 'top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <View className="flex-row items-center px-4 py-4">
          <Pressable
            onPress={() => router.back()}
            className="-ml-2 p-2 active:opacity-70"
            hitSlop={8}>
            <MaterialIcons name="arrow-back" size={20} color={Brand.muted} />
          </Pressable>
          <Text className="ml-2 text-lg font-bold text-gray-900">Daftar Akun</Text>
        </View>

        <ScrollView
          contentContainerClassName="px-6 pb-12 pt-2"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View className="gap-4">
            <AuthTextField
              label="Nama Lengkap"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Masukkan nama Anda"
              autoCapitalize="words"
            />
            <AuthTextField
              label="No. Handphone / Email"
              icon="phone"
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
              placeholder="0812..."
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <AuthTextField
              label="Kata Sandi"
              icon="lock"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              showPasswordToggle
            />
            <AuthTextField
              label="Alamat / RT RW"
              icon="place"
              value={address}
              onChangeText={setAddress}
              placeholder="Contoh: RT 01 / RW 02"
            />
            <AuthTextField
              label="Umur (Tahun)"
              value={age}
              onChangeText={setAge}
              placeholder="Contoh: 35"
              keyboardType="number-pad"
              maxLength={3}
            />

            <ErrorBanner message={error} />

            <Pressable
              onPress={onSubmit}
              disabled={busy}
              className="mt-4 flex-row items-center justify-center gap-2 rounded-xl bg-brand py-3.5 shadow-sm active:opacity-90 disabled:opacity-50">
              {busy ? <ActivityIndicator color="#fff" /> : null}
              <Text className="text-base font-medium text-white">Daftar Sekarang</Text>
            </Pressable>
          </View>

          <Text className="mt-8 text-center text-sm text-gray-500">
            Sudah punya akun?{' '}
            <Link href="/login" className="font-semibold text-brand">
              Masuk
            </Link>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

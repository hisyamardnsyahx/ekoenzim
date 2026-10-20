import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthTextField } from '@/components/auth-text-field';
import { ErrorBanner } from '@/components/loading-state';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { captchaMatches, randomCaptcha } from '@/lib/domain';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const toast = useToast();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaCode, setCaptchaCode] = useState(randomCaptcha);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const refreshCaptcha = useCallback(() => {
    setCaptchaCode(randomCaptcha());
    setCaptchaInput('');
  }, []);

  const onSubmit = async () => {
    if (!emailOrPhone.trim() || !password) {
      setError('Masukkan email/HP dan kata sandi.');
      return;
    }
    if (!captchaMatches(captchaInput, captchaCode)) {
      setError('Kode keamanan (Captcha) salah. Silakan coba lagi.');
      refreshCaptcha();
      return;
    }
    setBusy(true);
    setError('');
    const res = await signIn(emailOrPhone, password);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      toast.error('Login gagal', res.error);
      refreshCaptcha();
      return;
    }
    toast.success('Berhasil masuk', res.profile?.nama_lengkap || 'Selamat datang');
    if (res.profile?.role === 'admin') {
      router.replace('/admin' as never);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom', 'top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <ScrollView
          contentContainerClassName="flex-grow px-6 pt-8 pb-12"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View className="mb-8 items-center">
            <Image source={require("@/assets/images/icon.png")} style={{ width: 120, height: 120 }} className="mb-4" resizeMode="contain" />
            <Text className="text-2xl font-bold text-gray-900">E-KOMPAK</Text>
            <Text className="mt-1 text-sm text-gray-500">
              Sistem Pengolahan Sampah Organik
            </Text>
          </View>

          <View className="gap-4">
            <AuthTextField
              label="No. Handphone / Email"
              icon="phone"
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
              placeholder="Contoh: 0812..."
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

            <View className="gap-1.5 pt-1">
              <Text className="text-sm font-medium text-gray-700">Verifikasi Keamanan</Text>
              <View className="flex-row items-center gap-2">
                <View className="relative h-12 flex-1 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                  <Text
                    className="text-xl font-bold tracking-[0.3em] text-gray-700"
                    style={{ fontStyle: 'italic', transform: [{ skewX: '-10deg' }] }}>
                    {captchaCode}
                  </Text>
                </View>
                <Pressable
                  onPress={refreshCaptcha}
                  className="size-12 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 active:opacity-70">
                  <MaterialIcons name="refresh" size={18} color={Brand.muted} />
                </Pressable>
                <TextInput
                  value={captchaInput}
                  onChangeText={setCaptchaInput}
                  maxLength={4}
                  keyboardType="number-pad"
                  placeholder="Ketik"
                  placeholderTextColor="#9ca3af"
                  className="h-12 w-24 rounded-xl border border-gray-200 bg-input text-center text-base font-mono text-gray-900"
                />
              </View>
            </View>

            <ErrorBanner message={error} />

            <Pressable
              onPress={onSubmit}
              disabled={busy}
              className="mt-2 flex-row items-center justify-center gap-2 rounded-xl bg-brand py-3.5 shadow-sm active:opacity-90 disabled:opacity-50">
              {busy ? <ActivityIndicator color="#fff" /> : null}
              <Text className="text-base font-medium text-white">Masuk</Text>
            </Pressable>
          </View>

          <View className="mt-8 items-center gap-4">
            <Text className="text-center text-sm text-gray-500">
              Belum punya akun?{' '}
              <Link href="/register" className="font-semibold text-brand">
                Daftar sekarang
              </Link>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}






import 'react-native-gesture-handler';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '../global.css';

import { LoadingState } from '@/components/loading-state';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { ToastProvider } from '@/context/toast-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { configureNotificationHandler, showLocalNotification } from '@/lib/reminders';
import { fetchUnreadChatMessages } from '@/lib/api';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Local notification banners when app is open
void configureNotificationHandler();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!session || profile?.role !== 'admin') return;

    const notifiedIds = new Set();

    const checkNewMessages = async () => {
      try {
        const unread = await fetchUnreadChatMessages();
        if (!unread || unread.length === 0) return;

        for (const msg of unread) {
          if (!notifiedIds.has(msg.id)) {
            notifiedIds.add(msg.id);
            const name = msg.profiles?.nama_lengkap || 'Warga';
            await showLocalNotification(
              "Pesan dari " + name,
              msg.body,
              { type: 'chat', userId: msg.user_id }
            );
          }
        }
      } catch (err) {
        console.warn('Failed to check unread messages:', err);
      }
    };

    checkNewMessages();
    const interval = setInterval(checkNewMessages, 10000);

    return () => clearInterval(interval);
  }, [session, profile]);

  useEffect(() => {
    if (loading) return;
    // Wait for profile when session exists so admin isn't sent to user tabs
    if (session && !profile) return;

    const root = String(segments[0] ?? '');
    const inAuth = root === 'login' || root === 'register';
    const inAdmin = root === 'admin';
    const isAdmin = profile?.role === 'admin';

    if (!session) {
      if (!inAuth) router.replace('/login');
      return;
    }

    // After login/register
    if (inAuth) {
      if (isAdmin) router.replace('/admin' as never);
      else router.replace('/(tabs)');
      return;
    }

    // Admin only on /admin/* — never user tabs
    if (isAdmin && !inAdmin) {
      router.replace('/admin' as never);
      return;
    }

    // Non-admin cannot open admin
    if (!isAdmin && inAdmin) {
      router.replace('/(tabs)');
    }
  }, [session, profile, loading, segments, router]);

  if (loading || (session && !profile)) {
    return <LoadingState label="Menyiapkan sesi..." />;
  }
  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  // Ensure MaterialIcons font is ready in Expo Go (blank icons otherwise)
  const [fontsLoaded] = useFonts({
    ...MaterialIcons.font,
  });

  if (!fontsLoaded) {
    return <LoadingState label="Memuat ikon..." />;
  }

  return (
    <AuthProvider>
      <ToastProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AuthGate>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="register" options={{ headerShown: false }} />
              <Stack.Screen name="tutorial" options={{ headerShown: false }} />
              <Stack.Screen name="chat" options={{ headerShown: false }} />
              <Stack.Screen name="grafik" options={{ headerShown: false }} />
              <Stack.Screen name="admin" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
          </AuthGate>
          <StatusBar style="auto" />
        </ThemeProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

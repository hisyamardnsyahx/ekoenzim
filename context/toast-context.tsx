import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastKind = 'success' | 'error' | 'info';

type ToastItem = {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
};

type ToastApi = {
  show: (kind: ToastKind, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const DURATION_MS = 2800;

const kindStyle: Record<
  ToastKind,
  { bg: string; border: string; icon: keyof typeof MaterialIcons.glyphMap; iconColor: string }
> = {
  success: {
    bg: '#ffffff',
    border: '#d1fae5', 
    icon: 'check-circle',
    iconColor: '#10b981', 
  },
  error: {
    bg: '#ffffff',
    border: '#fee2e2',
    icon: 'error',
    iconColor: '#ef4444',
  },
  info: {
    bg: '#ffffff',
    border: '#dbeafe',
    icon: 'info',
    iconColor: '#3b82f6',
  },
};

function ToastBanner({
  item,
  top,
  onDismiss,
}: {
  item: ToastItem;
  top: number;
  onDismiss: (id: number) => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current; // Start from bottom
  const style = kindStyle[item.kind];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 50, friction: 6, useNativeDriver: true }),
    ]).start();

    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 20, duration: 200, useNativeDriver: true }),
      ]).start(() => onDismiss(item.id));
    }, DURATION_MS);

    return () => clearTimeout(t);
  }, [item.id, onDismiss, opacity, translateY]);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        bottom: top,
        left: 16,
        right: 16,
        zIndex: 9999,
        opacity,
        transform: [{ translateY }],
      }}>
      <Pressable
        onPress={() => onDismiss(item.id)}
        className="flex-row items-start gap-2.5 rounded-xl border px-3.5 py-3 shadow-md"
        style={{
          backgroundColor: style.bg,
          borderColor: style.border,
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.12,
          shadowRadius: 4,
        }}>
        <MaterialIcons name={style.icon} size={22} color={style.iconColor} />
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-semibold text-neutral-900">{item.title}</Text>
          {item.message ? (
            <Text className="mt-0.5 text-xs leading-4 text-neutral-600">{item.message}</Text>
          ) : null}
        </View>
        <MaterialIcons name="close" size={18} color="#64748b" />
      </Pressable>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [queue, setQueue] = useState<ToastItem[]>([]);
  const idRef = useRef(1);

  const dismiss = useCallback((id: number) => {
    setQueue((q) => q.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((kind: ToastKind, title: string, message?: string) => {
    const id = idRef.current++;
    setQueue((q) => [...q.slice(-2), { id, kind, title, message }]);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (title, message) => show('success', title, message),
      error: (title, message) => show('error', title, message),
      info: (title, message) => show('info', title, message),
    }),
    [show],
  );

  const current = queue[queue.length - 1] ?? null;

  return (
    <ToastContext.Provider value={api}>
      {children}
      {current ? (
        <ToastBanner
          key={current.id}
          item={current}
          top={Math.max(insets.bottom, 8) + 90}
          onDismiss={dismiss}
        />
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Safe fallback if used outside provider
    return {
      show: () => undefined,
      success: () => undefined,
      error: () => undefined,
      info: () => undefined,
    };
  }
  return ctx;
}








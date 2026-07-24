/**
 * Tema E-KOMPAK — palet persis reference/referensi.txt (Tailwind emerald + slate)
 *
 * Primary btn/header: emerald-600
 * Chart bar / switch ON: emerald-500
 * Soft surfaces: emerald-50 / emerald-100
 * Text accent: emerald-700
 * Page: gray-50
 * Admin: slate-800 / slate-50
 */

import { Platform } from 'react-native';

/** Hex Tailwind v3 — samakan dengan class referensi */
export const Emerald = {
  50: '#ecfdf5',
  100: '#d1fae5',
  200: '#a7f3d0',
  300: '#6ee7b7',
  400: '#34d399',
  500: '#10b981',
  600: '#059669',
  700: '#047857',
  800: '#065f46',
  900: '#064e3b',
} as const;

export const Slate = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
} as const;

export const Gray = {
  50: '#f9fafb',
  100: '#f3f4f6',
  200: '#e5e7eb',
  300: '#d1d5db',
  400: '#9ca3af',
  500: '#6b7280',
  600: '#4b5563',
  700: '#374151',
  800: '#1f2937',
  900: '#111827',
} as const;

export const Brand = {
  /** emerald-600 — primary button, header user, FAB */
  green: Emerald[600],
  /** emerald-700 — hover / text accent */
  greenDark: Emerald[700],
  /** emerald-50 — soft bg */
  greenLight: Emerald[50],
  /** emerald-700 — text on soft */
  greenText: Emerald[700],
  /** emerald-100 — soft fill / badge */
  greenSoft: Emerald[100],
  /** emerald-500 — chart bar, switch track */
  greenMid: Emerald[500],
  /** emerald-200 — outline border */
  greenBorder: Emerald[200],
  muted: Gray[500],
  border: Gray[200],
  inputBg: Gray[50],
  card: '#ffffff',
  surface: Gray[50],
  danger: '#dc2626',
  dangerSoft: '#fef2f2',
  /** admin slate-800 */
  slate: Slate[800],
  slateMuted: Slate[500],
  slateSoft: Slate[50],
  cyan: { text: '#3b82f6', bg: '#eff6ff' },
  amber: { text: '#d97706', bg: '#fffbeb' },
  rose: { text: '#e11d48', bg: '#fff1f2' },
  purple: { text: '#8b5cf6', bg: '#f5f3ff' },
  blue: { text: '#2563eb', bg: '#eff6ff' },
};

const tintColorLight = Brand.green;
const tintColorDark = Emerald[400];

export const Colors = {
  light: {
    text: Gray[900],
    background: Brand.surface,
    tint: tintColorLight,
    icon: Gray[500],
    tabIconDefault: Gray[400],
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});


/** @type {import('tailwindcss').Config} */
/** Palet = Tailwind emerald/slate/gray (sama referensi EkoCycle) */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}', './context/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#059669',
        'primary-foreground': '#ffffff',
        brand: {
          DEFAULT: '#059669', // emerald-600
          dark: '#047857', // emerald-700
          mid: '#10b981', // emerald-500 chart/switch
          light: '#ecfdf5', // emerald-50
          soft: '#d1fae5', // emerald-100
          text: '#047857', // emerald-700
          border: '#a7f3d0', // emerald-200
        },
        muted: '#6b7280', // gray-500
        input: '#f9fafb', // gray-50
        surface: '#f9fafb', // gray-50
        admin: {
          DEFAULT: '#1e293b', // slate-800
          muted: '#64748b', // slate-500
          soft: '#f8fafc', // slate-50
          border: '#e2e8f0', // slate-200
        },
      },
      borderRadius: {
        '2xl': 16,
        '3xl': 24,
      },
    },
  },
  plugins: [],
};

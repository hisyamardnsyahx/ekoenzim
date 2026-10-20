import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import {
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
} from '@/constants/config';
import { authStorage } from '@/lib/storage';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/** Service-role client for admin user CRUD (Auth Admin API). No session persistence. */
export const supabaseAdmin: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  },
);

export type Profile = {
  id: string;
  email: string | null;
  hp: string | null;
  nama_lengkap: string;
  alamat: string | null;
  umur: number | null;
  role: 'user' | 'admin';
  aktif: boolean;
  foto_url: string | null;
  created_at?: string;
};

export type EntryRowDb = {
  id: string;
  user_id: string;
  tanggal: string;
  berat_awal: number;
  penggunaan: string;
  berat_penggunaan: number;
  berat_akhir: number;
  created_at?: string;
};

export type MonitoringCommentDb = {
  id: string;
  monitoring_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

export type MonitoringRowDb = {
  id: string;
  user_id: string;
  tanggal: string;
  foto_url: string | null;
  deskripsi: string;
  status: string;
  volume_terolah: number;
  admin_komentar?: string | null;
  admin_komentar_at?: string | null;
  created_at?: string;
  profiles?: { nama_lengkap: string } | null;
};

export type ChatMessageDb = {
  id: string;
  user_id: string;
  sender_role: 'user' | 'admin';
  body: string;
  created_at: string;
};

export type ProgramMeta = {
  id: number;
  nama: string;
  mitra: string;
  lokasi: string;
  banner_url: string | null;
};

export type JadwalPrefDb = {
  id: string;
  user_id: string;
  jadwal_key: string;
  judul: string;
  frekuensi: string;
  aktif: boolean;
};


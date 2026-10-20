export type KondisiStatus =
  | 'Baru Mulai'
  | 'Proses'
  | 'Perhatian'
  | 'Baik'
  | 'Matang'
  | 'Siap Panen';

export interface AppUser {
  id: string;
  nama: string;
  email: string;
  hp: string;
  alamat: string;
  umur: number;
  aktif: boolean;
  fotoUrl?: string;
}

export interface EntriSampah {
  id: string;
  tanggal: string;
  beratAwal: number;
  penggunaan: string;
  beratPenggunaan: number;
  beratAkhir: number;
}

export interface MonitoringEntri {
  id: string;
  userId: string;
  namaUser: string;
  tanggal: string;
  fotoUrl: string;
  deskripsi: string;
  status: KondisiStatus;
  volumeTerolah: number;
  /** Komentar/balasan CS admin pada entri ini */
  adminKomentar?: string;
  adminKomentarAt?: string;
}

export interface ProduksiBulanan {
  bulan: string;
  ekoEnzim: number;
  emberTumpuk: number;
  kompos: number;
  pakan: number;
}

export interface JadwalItem {
  id: string;
  judul: string;
  frekuensi: string;
  aktif: boolean;
}

/** Warna status — emerald/blue/yellow seperti badge referensi */
export const statusColor: Record<
  KondisiStatus,
  { bg: string; text: string; border: string }
> = {
  'Baru Mulai': { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' }, // gray
  Proses: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' }, // blue
  Perhatian: { bg: '#fef3c7', text: '#b45309', border: '#fde68a' }, // yellow/warning
  Baik: { bg: '#d1fae5', text: '#047857', border: '#a7f3d0' }, // emerald-100/700
  Matang: { bg: '#d1fae5', text: '#047857', border: '#6ee7b7' }, // success emerald
  'Siap Panen': { bg: '#059669', text: '#ffffff', border: '#047857' }, // emerald-600
};

export const currentUser: AppUser = {
  id: 'u1',
  nama: 'Siti Aminah',
  email: 'siti@example.com',
  hp: '081234567890',
  alamat: 'Jl. Melati No. 12, RT 03, Bandung',
  umur: 38,
  aktif: true,
  fotoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80',
};

export const programInfo = {
  nama: 'Program Kompos Warga Sejahtera',
  mitra: 'PKM PM UGM E-KOMPAK',
  lokasi: 'Kelurahan Sukamaju, Bandung',
  bannerUrl: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=800&q=80',
};

export const jadwalDefault: JadwalItem[] = [
  { id: 'j1', judul: 'Pengiat (pemantik)', frekuensi: 'Setiap 3 bulan', aktif: true },
  { id: 'j2', judul: 'Pengambilan lindi air', frekuensi: 'Setiap 3 hari', aktif: true },
  { id: 'j3', judul: 'Monitoring kondisi', frekuensi: 'Setiap minggu (1x)', aktif: true },
  { id: 'j4', judul: 'Penimbangan sampah', frekuensi: 'Setiap hari', aktif: true },
];

export const entriSampahAwal: EntriSampah[] = [
  {
    id: 'e1',
    tanggal: '2026-07-18',
    beratAwal: 5,
    penggunaan: 'Eko enzim',
    beratPenggunaan: 2,
    beratAkhir: 3,
  },
  {
    id: 'e2',
    tanggal: '2026-07-19',
    beratAwal: 6,
    penggunaan: 'Kompos ember',
    beratPenggunaan: 3.5,
    beratAkhir: 2.5,
  },
  {
    id: 'e3',
    tanggal: '2026-07-20',
    beratAwal: 4.5,
    penggunaan: 'Pakan ternak',
    beratPenggunaan: 2,
    beratAkhir: 2.5,
  },
];

export const produksiBulanan: ProduksiBulanan[] = [
  { bulan: 'Feb', ekoEnzim: 12, emberTumpuk: 20, kompos: 15, pakan: 8 },
  { bulan: 'Mar', ekoEnzim: 18, emberTumpuk: 24, kompos: 19, pakan: 10 },
  { bulan: 'Apr', ekoEnzim: 22, emberTumpuk: 28, kompos: 21, pakan: 12 },
  { bulan: 'Mei', ekoEnzim: 26, emberTumpuk: 30, kompos: 25, pakan: 14 },
  { bulan: 'Jun', ekoEnzim: 30, emberTumpuk: 35, kompos: 28, pakan: 16 },
  { bulan: 'Jul', ekoEnzim: 34, emberTumpuk: 40, kompos: 32, pakan: 18 },
];

export const monitoringData: MonitoringEntri[] = [
  {
    id: 'm1',
    userId: 'u1',
    namaUser: 'Siti Aminah',
    tanggal: '2026-07-20',
    fotoUrl: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=400&q=80',
    deskripsi: 'Kompos mulai menghitam, bau tanah, kelembapan cukup.',
    status: 'Proses',
    volumeTerolah: 12,
  },
  {
    id: 'm2',
    userId: 'u1',
    namaUser: 'Siti Aminah',
    tanggal: '2026-07-16',
    fotoUrl: 'https://images.unsplash.com/photo-1592419044706-39796d40f98c?w=400&q=80',
    deskripsi: 'Proses dekomposisi berjalan baik, suhu hangat.',
    status: 'Baik',
    volumeTerolah: 15,
  },
];

export const userStatusOptions: KondisiStatus[] = ['Baik', 'Proses', 'Perhatian'];

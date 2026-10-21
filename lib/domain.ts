/**
 * Pure domain helpers — no React / no network.
 * Used by screens and unit tests.
 */

export type KondisiStatus =
  | 'Baru Mulai'
  | 'Proses'
  | 'Perhatian'
  | 'Baik'
  | 'Matang'
  | 'Siap Panen';

export type PenggunaanLabel = 'eko_enzim' | 'ember_tumpuk' | 'kompos' | 'pakan' | 'lainnya';

/** Preset options for Entry "Penggunaan" dropdown (+ Lainnya = custom text). */
export const PENGGUNAAN_OPTIONS = [
  'Eko enzim',
  'Ember tumpuk',
  'Pakan',
  'Lainnya',
] as const;

export type PenggunaanOption = (typeof PENGGUNAAN_OPTIONS)[number];

/**
 * Resolve final penggunaan string from dropdown + optional custom text.
 * Lainnya requires custom; other presets use the option label (custom ignored).
 */
export function resolvePenggunaan(
  option: string,
  custom: string,
): { ok: true; value: string } | { ok: false; error: string } {
  const opt = (option || '').trim();
  const customTrim = (custom || '').trim();
  if (!opt) return { ok: false, error: 'Pilih penggunaan.' };
  if (opt === 'Lainnya') {
    if (!customTrim) return { ok: false, error: 'Isi penggunaan custom.' };
    return { ok: true, value: customTrim };
  }
  return { ok: true, value: opt };
}

export interface EntriRow {
  id: string;
  tanggal: string;
  beratAwal: number;
  penggunaan: string;
  beratPenggunaan: number;
  beratAkhir: number;
}

export interface ProduksiBulanan {
  bulan: string;
  ekoEnzim: number;
  emberTumpuk: number;
  kompos: number;
  pakan: number;
}

/** Captcha: exact string match after trim. */
export function captchaMatches(input: string, code: string): boolean {
  return input.trim() === String(code).trim();
}

/** Generate 4-digit numeric captcha. */
export function randomCaptcha(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/** Berat akhir = max(0, awal − penggunaan). */
export function hitungBeratAkhir(beratAwal: number, beratPenggunaan: number): number {
  const a = Number(beratAwal) || 0;
  const p = Number(beratPenggunaan) || 0;
  return Math.max(0, a - p);
}

/** Normalize free-text penggunaan label into production bucket. */
export function normalizePenggunaan(label: string): PenggunaanLabel {
  const s = (label || '').toLowerCase().trim();
  if (!s) return 'lainnya';
  if (s.includes('eko') || s.includes('enzim') || s.includes('enzyme')) return 'eko_enzim';
  // kompos before ember — "kompos ember" is kompos, not ember tumpuk
  if (s.includes('kompos') || s.includes('compost')) return 'kompos';
  if (s.includes('ember') || s.includes('tumpuk')) return 'ember_tumpuk';
  if (s.includes('pakan') || s.includes('ternak') || s.includes('feed')) return 'pakan';
  return 'lainnya';
}

/** Filter monitoring rows by status (exact match). Empty filter = all. */
export function filterMonitoringByStatus<T extends { status: KondisiStatus }>(
  rows: T[],
  status: KondisiStatus | 'Semua' | null | undefined,
): T[] {
  if (!status || status === 'Semua') return rows;
  return rows.filter((r) => r.status === status);
}

const BULAN_SINGKAT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/**
 * Aggregate entry rows into monthly production buckets by usage label.
 * Uses beratPenggunaan as kg produced for that category.
 */
export type ProduksiHarian = {
  tanggal: string;
  tanggalFormat: string;
  ekoEnzim: number;
  emberTumpuk: number;
  kompos: number;
  pakan: number;
};

export function aggregateProduksiHarian(entries: EntriRow[], year: number, month: number): ProduksiHarian[] {
  const map = new Map<string, ProduksiHarian>();
  
  for (const e of entries) {
    const d = e.tanggal ? new Date(e.tanggal + (e.tanggal.length === 10 ? 'T00:00:00' : '')) : null;
    if (!d || Number.isNaN(d.getTime())) continue;
    if (d.getFullYear() !== year || d.getMonth() !== month) continue;

    const dateKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const dateLabel = String(d.getDate()); // Hanya angka tanggal untuk label chart

    let row = map.get(dateKey);
    if (!row) {
      row = { tanggal: dateKey, tanggalFormat: dateLabel, ekoEnzim: 0, emberTumpuk: 0, kompos: 0, pakan: 0 };
      map.set(dateKey, row);
    }
    const kg = Number(e.beratPenggunaan) || 0;
    const bucket = normalizePenggunaan(e.penggunaan);
    if (bucket === 'eko_enzim') row.ekoEnzim += kg;
    else if (bucket === 'ember_tumpuk') row.emberTumpuk += kg;
    else if (bucket === 'kompos') row.kompos += kg;
    else if (bucket === 'pakan') row.pakan += kg;
  }

  return Array.from(map.values()).sort((a, b) => a.tanggal.localeCompare(b.tanggal));
}

export function aggregateProduksiBulanan(entries: EntriRow[]): ProduksiBulanan[] {
  const map = new Map<string, ProduksiBulanan>();

  for (const e of entries) {
    const d = e.tanggal ? new Date(e.tanggal + (e.tanggal.length === 10 ? 'T00:00:00' : '')) : null;
    if (!d || Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = BULAN_SINGKAT[d.getMonth()];
    let row = map.get(key);
    if (!row) {
      row = { bulan: label, ekoEnzim: 0, emberTumpuk: 0, kompos: 0, pakan: 0 };
      map.set(key, row);
    }
    const kg = Number(e.beratPenggunaan) || 0;
    const bucket = normalizePenggunaan(e.penggunaan);
    if (bucket === 'eko_enzim') row.ekoEnzim += kg;
    else if (bucket === 'ember_tumpuk') row.emberTumpuk += kg;
    else if (bucket === 'kompos') row.kompos += kg;
    else if (bucket === 'pakan') row.pakan += kg;
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);
}

/** Sum organic waste processed (kg) from entries — uses beratPenggunaan. */
export function totalSampahTerolah(entries: EntriRow[]): number {
  return entries.reduce((sum, e) => sum + (Number(e.beratPenggunaan) || 0), 0);
}

/** Monthly summary for current calendar month from entries. */
export function ringkasanBulanIni(entries: EntriRow[], now = new Date()): ProduksiBulanan {
  const y = now.getFullYear();
  const m = now.getMonth();
  const monthEntries = entries.filter((e) => {
    const d = new Date(e.tanggal + (e.tanggal.length === 10 ? 'T00:00:00' : ''));
    return d.getFullYear() === y && d.getMonth() === m;
  });
  const agg = aggregateProduksiBulanan(monthEntries);
  if (agg.length === 0) {
    return {
      bulan: BULAN_SINGKAT[m],
      ekoEnzim: 0,
      emberTumpuk: 0,
      kompos: 0,
      pakan: 0,
    };
  }
  return agg[agg.length - 1];
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Auth identity: email as-is, phone → synthetic email for Supabase. */
export function toAuthEmail(emailOrPhone: string): string {
  const v = emailOrPhone.trim();
  if (isEmail(v)) return v.toLowerCase();
  const digits = v.replace(/\D/g, '');
  return `${digits}@phone.ekompak.local`;
}

/** Filter chip admin laporan — selaras referensi E-KOMPAK */
export const ADMIN_FILTERS: Array<KondisiStatus | 'Semua'> = [
  'Semua',
  'Matang',
  'Proses',
  'Perhatian',
];

/** Chip status di form user — selaras referensi E-KOMPAK */
export const USER_STATUS_OPTIONS: KondisiStatus[] = ['Proses', 'Matang', 'Perhatian'];

/** % growth current vs base. base=0 & current>0 → 100; both 0 → 0. */
export function percentGrowth(current: number, base: number): number {
  const c = Number(current) || 0;
  const b = Number(base) || 0;
  if (b === 0) return c > 0 ? 100 : 0;
  return Math.round(((c - b) / b) * 100);
}

export type GrowthVsBase = {
  ekoEnzim: number;
  kompos: number;
  baseBulan: string;
  currentBulan: string;
};

/**
 * Compare last month in series vs base month (prefer label "Apr", else first row).
 * Empty produksi → zeros and empty labels.
 */
export function growthVsBaseMonth(
  produksi: ProduksiBulanan[],
  baseLabel = 'Apr',
): GrowthVsBase {
  if (!produksi.length) {
    return { ekoEnzim: 0, kompos: 0, baseBulan: '', currentBulan: '' };
  }
  const base = produksi.find((p) => p.bulan === baseLabel) ?? produksi[0];
  const current = produksi[produksi.length - 1];
  return {
    ekoEnzim: percentGrowth(current.ekoEnzim, base.ekoEnzim),
    kompos: percentGrowth(current.kompos, base.kompos),
    baseBulan: base.bulan,
    currentBulan: current.bulan,
  };
}

/** Case-insensitive search on nama, status, deskripsi. Empty query → all. */
export function searchMonitoring<
  T extends { namaUser: string; status: string; deskripsi: string },
>(rows: T[], query: string): T[] {
  const q = (query || '').trim().toLowerCase();
  if (!q) return rows;
  return rows.filter(
    (r) =>
      (r.namaUser || '').toLowerCase().includes(q) ||
      (r.status || '').toLowerCase().includes(q) ||
      (r.deskripsi || '').toLowerCase().includes(q),
  );
}

const BULAN_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/** ISO date `YYYY-MM-DD` (or datetime) → `15 Jul 2026`. Invalid → original string. */
export function formatTanggalId(isoDate: string): string {
  const raw = (isoDate || '').trim();
  if (!raw) return '';
  const d = new Date(raw.length === 10 ? `${raw}T00:00:00` : raw);
  if (Number.isNaN(d.getTime())) return raw;
  return `${d.getDate()} ${BULAN_ID[d.getMonth()]} ${d.getFullYear()}`;
}

const CHART_MONTH_ORDER = ['Apr', 'Mei', 'Jun', 'Jul'];

/**
 * Prefer Apr–Jul slice when those labels exist; else full series.
 * Keeps chronological order from input (already sorted by aggregate).
 */
export function filterProduksiForChart(produksi: ProduksiBulanan[]): ProduksiBulanan[] {
  if (!produksi.length) return [];
  const wanted = new Set(CHART_MONTH_ORDER);
  const slice = produksi.filter((p) => wanted.has(p.bulan));
  return slice.length ? slice : produksi;
}

/** Format signed growth for UI, e.g. +29% or -5%. */
export function formatGrowthPercent(pct: number): string {
  if (pct > 0) return `+${pct}%`;
  if (pct < 0) return `${pct}%`;
  return '0%';
}


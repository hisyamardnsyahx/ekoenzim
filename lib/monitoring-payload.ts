import type { KondisiStatus } from '@/lib/domain';

export type MonitoringInput = {
  deskripsi: string;
  status: KondisiStatus;
  fotoUrl?: string;
  volumeTerolah?: number;
};

export type MonitoringPayload = {
  deskripsi: string;
  status: KondisiStatus;
  /** Empty string when no photo — never a stock placeholder URL. */
  fotoUrl: string;
  volumeTerolah: number;
};

/**
 * Normalize monitoring form input for persistence.
 * - volume defaults to 0 only when missing/invalid, otherwise keeps user kg
 * - foto is trimmed; empty if omitted (no Unsplash substitute)
 */
export function buildMonitoringPayload(input: MonitoringInput): MonitoringPayload {
  const volumeRaw = input.volumeTerolah;
  const volumeTerolah =
    volumeRaw === undefined || volumeRaw === null || Number.isNaN(Number(volumeRaw))
      ? 0
      : Number(volumeRaw);

  return {
    deskripsi: (input.deskripsi || '').trim(),
    status: input.status,
    fotoUrl: (input.fotoUrl || '').trim(),
    volumeTerolah,
  };
}

/** True if URL is a durable photo ref (data URL or http(s)), not a device-only file URI. */
export function isDurablePhotoRef(url: string): boolean {
  const s = (url || '').trim();
  if (!s) return false;
  return s.startsWith('data:') || s.startsWith('http://') || s.startsWith('https://');
}

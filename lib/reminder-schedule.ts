/**
 * Pure schedule specs for Kalender pengingat (no native deps — unit-testable).
 */

export const REMINDER_HOUR = 8;
export const REMINDER_MINUTE = 0;

export type ReminderScheduleSpec =
  | { id: string; kind: 'daily'; hour: number; minute: number }
  | { id: string; kind: 'weekly'; weekday: number; hour: number; minute: number }
  | { id: string; kind: 'interval'; seconds: number }
  | { id: string; kind: 'yearly'; month: number; day: number; hour: number; minute: number };

const BODIES: Record<string, { title: string; body: string }> = {
  j1: {
    title: 'Pengingat Pengiat',
    body: 'Saatnya menambahkan pengiat (pemantik) ekoenzim — cek setiap 3 bulan.',
  },
  j2: {
    title: 'Pengingat Lindi',
    body: 'Ambil lindi air / air lindi dari wadah olahan Anda.',
  },
  j3: {
    title: 'Pengingat Monitoring',
    body: 'Catat kondisi monitoring olahan di tab Monitoring.',
  },
  j4: {
    title: 'Pengingat Penimbangan',
    body: 'Timbang sampah harian dan catat di Entry Data.',
  },
};

/** Pure: schedule specs for a jadwal key. */
export function getReminderSpecs(
  jadwalId: string,
  hour = REMINDER_HOUR,
  minute = REMINDER_MINUTE,
): ReminderScheduleSpec[] {
  switch (jadwalId) {
    case 'j4':
      return [{ id: 'reminder-j4', kind: 'daily', hour, minute }];
    case 'j3':
      // WEEKLY: 1 = Sunday (match kalender isSunday)
      return [{ id: 'reminder-j3', kind: 'weekly', weekday: 1, hour, minute }];
    case 'j2':
      return [{ id: 'reminder-j2', kind: 'interval', seconds: 3 * 24 * 60 * 60 }];
    case 'j1':
      // 1st of Jan / Apr / Jul / Oct (quarter months, month 0-based)
      return [0, 3, 6, 9].map((month) => ({
        id: `reminder-j1-m${month}`,
        kind: 'yearly' as const,
        month,
        day: 1,
        hour,
        minute,
      }));
    default:
      return [];
  }
}

export function reminderContent(jadwalId: string): { title: string; body: string } {
  return (
    BODIES[jadwalId] ?? {
      title: 'Pengingat Ekoenzim',
      body: 'Ada kegiatan pengolahan sampah untuk Anda.',
    }
  );
}

export function allReminderIdentifiers(): string[] {
  return ['j1', 'j2', 'j3', 'j4'].flatMap((id) => getReminderSpecs(id).map((s) => s.id));
}

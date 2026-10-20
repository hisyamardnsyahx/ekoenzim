/**
 * Local scheduled notifications for Kalender pengingat.
 * Works in Expo Go (local). Remote push needs dev build + Expo Push.
 */
import { Platform } from 'react-native';
import type { JadwalItem } from '@/constants/mock-data';
import type { EntriRow } from '@/lib/domain';
import {
  allReminderIdentifiers,
  reminderContent,
  REMINDER_HOUR,
  REMINDER_MINUTE,
} from '@/lib/reminder-schedule';

export {
  allReminderIdentifiers,
  getReminderSpecs,
  REMINDER_HOUR,
  REMINDER_MINUTE,
  reminderContent,
} from '@/lib/reminder-schedule';

export const REMINDER_CHANNEL_ID = 'pengingat';

async function getNotifications() {
  return import('expo-notifications');
}

/** Show banner when app is foreground. */
export async function configureNotificationHandler(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const Notifications = await getNotifications();
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    // expo-notifications unavailable
  }
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const Notifications = await getNotifications();

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
        name: 'Pengingat Ekoenzim',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#059669',
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

async function cancelKnownReminders(): Promise<void> {
  const Notifications = await getNotifications();
  const list = [
    ...allReminderIdentifiers(),
    'reminder-j1',
    'reminder-j2',
    'reminder-j3',
    'reminder-j4'
  ];
  await Promise.all(
    list.map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined),
    ),
  );
}

/**
 * Reschedule all local notifications to match jadwal aktif flags.
 * Uses lastEntry date to calculate dynamically.
 * Returns false if permission denied (caller may revert UI).
 */
export async function syncReminderNotifications(
  jadwal: JadwalItem[],
  entries: EntriRow[]
): Promise<boolean> {
  if (Platform.OS === 'web') return true;

  try {
    const Notifications = await getNotifications();
    await cancelKnownReminders();

    const aktif = jadwal.filter((j) => j.aktif);
    if (!aktif.length) return true;

    const ok = await ensureNotificationPermission();
    if (!ok) return false;

    // Get last entry date (fallback to today)
    let lastDate = new Date();
    if (entries && entries.length > 0) {
      const sorted = [...entries].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
      const latest = sorted[0];
      if (latest && latest.tanggal) {
        lastDate = new Date(latest.tanggal + 'T00:00:00');
      }
    }

    const channel = Platform.OS === 'android' ? REMINDER_CHANNEL_ID : undefined;

    for (const item of aktif) {
      const content = reminderContent(item.id);

      if (item.id === 'j4') {
        await Notifications.scheduleNotificationAsync({
          identifier: 'reminder-j4',
          content: {
            title: content.title,
            body: content.body,
            data: { jadwalId: item.id, url: '/kalender' },
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: REMINDER_HOUR,
            minute: REMINDER_MINUTE,
            channelId: channel,
          } as any,
        });
      } else {
        let nextDate = new Date(lastDate.getTime());
        nextDate.setHours(REMINDER_HOUR, REMINDER_MINUTE, 0, 0);

        if (item.id === 'j2') {
          nextDate.setDate(nextDate.getDate() + 3);
          while (nextDate.getTime() <= Date.now()) {
            nextDate.setDate(nextDate.getDate() + 3);
          }
        } else if (item.id === 'j3') {
          nextDate.setDate(nextDate.getDate() + 7);
          while (nextDate.getTime() <= Date.now()) {
            nextDate.setDate(nextDate.getDate() + 7);
          }
        } else if (item.id === 'j1') {
          nextDate.setMonth(nextDate.getMonth() + 3);
          while (nextDate.getTime() <= Date.now()) {
            nextDate.setMonth(nextDate.getMonth() + 3);
          }
        }

        await Notifications.scheduleNotificationAsync({
          identifier: 'reminder-' + item.id,
          content: {
            title: content.title,
            body: content.body,
            data: { jadwalId: item.id, url: '/kalender' },
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: nextDate,
            channelId: channel,
          } as any,
        });
      }
    }
    return true;
  } catch (e) {
    console.warn('syncReminderNotifications failed', e);
    return false;
  }
}


export async function showLocalNotification(title: string, body: string, data?: Record<string, any>) {
  if (Platform.OS === 'web') return;
  try {
    const Notifications = await getNotifications();
    const ok = await ensureNotificationPermission();
    if (!ok) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data,
      },
      trigger: null,
    });
  } catch (e) {
    console.warn('showLocalNotification failed', e);
  }
}

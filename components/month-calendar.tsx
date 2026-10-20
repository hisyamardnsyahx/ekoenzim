import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Brand } from '@/constants/theme';

const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

function toKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

type MonthCalendarProps = {
  month: Date;
  selected: Date;
  markedDates?: string[];
  onChangeMonth: (next: Date) => void;
  onSelectDate: (date: Date) => void;
};

export function MonthCalendar({
  month,
  selected,
  markedDates = [],
  onChangeMonth,
  onSelectDate,
}: MonthCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const marked = useMemo(() => new Set(markedDates), [markedDates]);

  const cells = useMemo(() => {
    const year = month.getFullYear();
    const m = month.getMonth();
    const first = new Date(year, m, 1);
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const startPad = first.getDay();
    const total = Math.ceil((startPad + daysInMonth) / 7) * 7;
    const list: (Date | null)[] = [];

    for (let i = 0; i < total; i++) {
      const dayNum = i - startPad + 1;
      if (dayNum < 1 || dayNum > daysInMonth) {
        list.push(null);
      } else {
        list.push(new Date(year, m, dayNum));
      }
    }
    return list;
  }, [month]);

  const prevMonth = () => {
    onChangeMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    onChangeMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
  };

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <View className="overflow-hidden rounded-xl border border-black/10 bg-white">
      <View className="flex-row items-center justify-between border-b border-black/5 px-2 py-3">
        <Pressable
          onPress={prevMonth}
          hitSlop={8}
          className="size-9 items-center justify-center rounded-lg active:bg-slate-100">
          <MaterialIcons name="chevron-left" size={24} color={Brand.green} />
        </Pressable>
        <Text className="text-base font-semibold text-brand-text">
          {BULAN[month.getMonth()]} {month.getFullYear()}
        </Text>
        <Pressable
          onPress={nextMonth}
          hitSlop={8}
          className="size-9 items-center justify-center rounded-lg active:bg-slate-100">
          <MaterialIcons name="chevron-right" size={24} color={Brand.green} />
        </Pressable>
      </View>

      <View className="flex-row px-1 pt-2">
        {HARI.map((h) => (
          <View key={h} style={styles.cell} className="items-center py-1">
            <Text className="text-[11px] font-medium text-muted">{h}</Text>
          </View>
        ))}
      </View>

      <View className="px-1 pb-2">
        {weeks.map((week, wi) => (
          <View key={`w-${wi}`} className="flex-row">
            {week.map((date, di) => {
              if (!date) {
                return <View key={`e-${wi}-${di}`} style={styles.dayCell} />;
              }

              const isSelected = sameDay(date, selected);
              const isToday = sameDay(date, today);
              const hasMark = marked.has(toKey(date));

              return (
                <Pressable
                  key={toKey(date)}
                  onPress={() => onSelectDate(date)}
                  style={styles.dayCell}
                  className="items-center justify-center">
                  <View
                    className={`size-9 items-center justify-center rounded-full ${
                      isSelected ? 'bg-brand' : isToday ? 'bg-brand-light' : ''
                    }`}>
                    <Text
                      className={`text-sm ${
                        isSelected
                          ? 'font-semibold text-white'
                          : isToday
                            ? 'font-semibold text-brand-text'
                            : 'text-neutral-900'
                      }`}>
                      {date.getDate()}
                    </Text>
                  </View>
                  {hasMark ? (
                    <View
                      style={styles.dot}
                      className={`rounded-full ${isSelected ? 'bg-white' : 'bg-brand'}`}
                    />
                  ) : (
                    <View style={styles.dotSpacer} />
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
  },
  dayCell: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    marginTop: 2,
  },
  dotSpacer: {
    width: 5,
    height: 5,
    marginTop: 2,
  },
});

export { toKey, BULAN, HARI };

import { Text, View } from 'react-native';

import type { ProduksiBulanan } from '@/lib/domain';
import { Brand } from '@/constants/theme';

type SeriesKey = 'ekoEnzim' | 'emberTumpuk' | 'kompos' | 'pakan' | 'total';

type ChartRow = ProduksiBulanan & { total?: number };

type Props = {
  data: ChartRow[];
  height?: number;
  /** Default: all four series. Admin/home can pass subset or ['total']. */
  seriesKeys?: SeriesKey[];
  /** Single-bar fill (reference totalSampah). */
  singleColor?: string;
};

const ALL_SERIES: Array<{ key: SeriesKey; label: string; color: string }> = [
  { key: 'ekoEnzim', label: 'Ekoenzim', color: Brand.greenDark },
  { key: 'emberTumpuk', label: 'Ember', color: Brand.amber.text },
  { key: 'kompos', label: 'Kompos', color: '#795548' },
  { key: 'pakan', label: 'Pakan', color: Brand.purple.text },
  /** referensi: fill="#10B981" */
  { key: 'total', label: 'Sampah (Kg)', color: Brand.greenMid },
];

function valueOf(d: ChartRow, key: SeriesKey): number {
  if (key === 'total') {
    if (typeof d.total === 'number') return d.total;
    return (
      (Number(d.ekoEnzim) || 0) +
      (Number(d.emberTumpuk) || 0) +
      (Number(d.kompos) || 0) +
      (Number(d.pakan) || 0)
    );
  }
  return Number(d[key]) || 0;
}

export function SimpleBarChart({
  data,
  height = 180,
  seriesKeys,
  singleColor,
}: Props) {
  const series = seriesKeys?.length
    ? ALL_SERIES.filter((s) => seriesKeys.includes(s.key)).map((s) =>
        s.key === 'total' && singleColor ? { ...s, color: singleColor } : s,
      )
    : ALL_SERIES.filter((s) => s.key !== 'total');

  if (!data.length) {
    return (
      <View className="items-center justify-center rounded-xl bg-gray-50 py-10">
        <Text className="text-sm text-muted">Belum ada data produksi</Text>
      </View>
    );
  }

  const rawMax = Math.max(0.1, ...data.flatMap((d) => series.map((s) => valueOf(d, s.key))));
  // Calculate a nice max value, divisible by 4.
  // If rawMax is small, set niceMax to 4 so steps are 1.0.
  let niceMax = Math.ceil(rawMax);
  if (niceMax <= 4) {
    niceMax = 4;
  } else {
    niceMax = Math.ceil(niceMax / 4) * 4;
  }

  const isSingle = series.length === 1;
  const chartHeight = height - 30; // Leave space for x-axis labels

  const ticks = [niceMax, niceMax * 0.75, niceMax * 0.5, niceMax * 0.25, 0];

  return (
    <View className="gap-2 w-full">
      <View className="flex-row w-full" style={{ height }}>
        
        {/* Y-Axis Labels */}
        <View className="w-8 mr-2 relative" style={{ height: chartHeight }}>
          {ticks.map((t, i) => {
            const percentage = (i / 4) * 100;
            return (
              <Text 
                key={i} 
                style={{ 
                  position: 'absolute', 
                  top: percentage + '%', 
                  transform: [{ translateY: -7 }], 
                  width: '100%', 
                  textAlign: 'right', 
                  fontSize: 10, 
                  color: '#9ca3af' 
                }}
              >
                {t.toFixed(1)}
              </Text>
            );
          })}
        </View>

        {/* Chart Area */}
        <View className="flex-1 relative">
          
          {/* Grid Lines */}
          <View className="absolute inset-0 z-0 pointer-events-none" style={{ height: chartHeight }}>
            {ticks.map((t, i) => {
              const percentage = (i / 4) * 100;
              return (
                <View 
                  key={i} 
                  style={{ 
                    position: 'absolute', 
                    top: percentage + '%', 
                    width: '100%', 
                    borderBottomWidth: 1, 
                    borderBottomColor: '#e5e7eb', 
                    borderStyle: 'dashed' 
                  }} 
                />
              );
            })}
          </View>

          {/* Bars & X-Axis */}
          <View className="absolute inset-0 flex-row items-end justify-between z-10 w-full h-full">
            {data.map((d, index) => (
              <View key={index} className="flex-1 items-center gap-1">
                
                {/* Bars Container */}
                <View
                  className="w-full flex-row items-end justify-center gap-1"
                  style={{ height: chartHeight }}
                >
                  {series.map((s) => {
                    const val = valueOf(d, s.key);
                    // Prevent completely invisible bars by giving minimum height 0, 
                    // but visual min height 4 if value > 0 for aesthetics.
                    let h = (val / niceMax) * chartHeight;
                    if (val > 0 && h < 4) h = 4;
                    const barWidth = isSingle ? 24 : 16;
                    
                    return (
                      <View key={s.key} className="items-center justify-end" style={{ height: h, width: barWidth, position: 'relative' }}>
                        {val > 0 && (
                          <Text 
                            style={{ 
                              position: 'absolute',
                              bottom: h + 2,
                              width: 40,
                              left: (barWidth - 40) / 2,
                              textAlign: 'center',
                              color: '#4b5563', 
                              fontSize: 8, 
                              fontWeight: 'bold' 
                            }}
                            numberOfLines={1}
                          >
                            {val.toFixed(1)}
                          </Text>
                        )}
                        <View
                          style={{
                            height: h,
                            backgroundColor: s.color,
                            width: barWidth,
                            borderTopLeftRadius: 4,
                            borderTopRightRadius: 4,
                          }}
                        />
                      </View>
                    );
                  })}
                </View>
                
                {/* X-Axis Label */}
                <Text className="text-xs font-medium text-gray-500 mt-2">{d.bulan}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Legend */}
      {!isSingle ? (
        <View className="flex-row flex-wrap justify-center gap-4 mt-2">
          {series.map((s) => (
            <View key={s.key} className="flex-row items-center gap-2">
              <View className="w-3 h-3 rounded-sm" style={{ backgroundColor: s.color }} />
              <Text className="text-sm text-gray-600">{s.label} {s.key === 'ekoEnzim' ? '(L)' : '(Kg)'}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

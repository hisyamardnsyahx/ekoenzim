import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { LoadingState } from '@/components/loading-state';
import { PageHeader } from '@/components/page-header';
import { UiCard } from '@/components/ui-card';
import { SimpleBarChart } from '@/components/simple-bar-chart';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { getUserProduksiChart } from '@/lib/api';
import type { ProduksiBulanan } from '@/lib/domain';

const fraunces = { fontFamily: 'serif' };
const jakarta = { fontFamily: 'System' };

// ----------------------------------------------------
// CUSTOM PIE CHART COMPONENT (React Native SVG)
// ----------------------------------------------------
function CustomPieChart({
  totalEko,
  totalEmberTumpuk,
  totalPakan,
}: {
  totalEko: number;
  totalEmberTumpuk: number;
  totalPakan: number;
}) {
  const total = totalEko + totalEmberTumpuk + totalPakan;

  const series = [
    { label: 'Eco Enzyme', value: totalEko, color: Brand.greenDark },
    { label: 'Ember Tumpuk', value: totalEmberTumpuk, color: Brand.green },
    { label: 'Pakan', value: totalPakan, color: Brand.purple.text },
  ];

  if (total <= 0) {
    return (
      <View className="h-40 items-center justify-center">
        <MaterialIcons name="pie-chart" size={40} color="#e5e7eb" />
        <Text className="mt-2 text-sm text-gray-400">Belum ada data produksi</Text>
      </View>
    );
  }

  let startAngle = 0;
  const radius = 60;
  const cx = 80;
  const cy = 80;

  const slices = series
    .filter((s) => s.value > 0)
    .map((s) => {
      const percentage = s.value / total;
      const angle = percentage * 360;
      const endAngle = startAngle + angle;

      const radStart = ((startAngle - 90) * Math.PI) / 180;
      const radEnd = ((endAngle - 90) * Math.PI) / 180;

      const x1 = cx + radius * Math.cos(radStart);
      const y1 = cy + radius * Math.sin(radStart);
      const x2 = cx + radius * Math.cos(radEnd);
      const y2 = cy + radius * Math.sin(radEnd);

      const largeArcFlag = angle > 180 ? 1 : 0;
      const pathData = 'M ' + cx + ' ' + cy + ' L ' + x1 + ' ' + y1 + ' A ' + radius + ' ' + radius + ' 0 ' + largeArcFlag + ' 1 ' + x2 + ' ' + y2 + ' Z';

      const midAngle = startAngle + angle / 2;
      const radMid = ((midAngle - 90) * Math.PI) / 180;
      const labelX = cx + (radius * 0.65) * Math.cos(radMid);
      const labelY = cy + (radius * 0.65) * Math.sin(radMid);

      const result = {
        path: pathData,
        color: s.color,
        label: s.label,
        percentage: (percentage * 100).toFixed(0) + '%',
        labelX,
        labelY,
        value: s.value,
      };

      startAngle = endAngle;
      return result;
    });

  return (
    <View className="flex-row items-center justify-between py-2">
      {/* Pie Chart SVG */}
      <View className="size-40 items-center justify-center">
        <Svg width={160} height={160}>
          {slices.map((slice, idx) => (
            <Svg key={idx}>
              <Path d={slice.path} fill={slice.color} stroke="#ffffff" strokeWidth={1.5} />
              {slice.value > 0.05 * total && (
                <Text
                  style={{
                    position: 'absolute',
                    left: slice.labelX - 12,
                    top: slice.labelY - 6,
                    fontSize: 9,
                    fontWeight: 'bold',
                    color: '#ffffff',
                    width: 24,
                    textAlign: 'center',
                  }}
                >
                  {slice.percentage}
                </Text>
              )}
            </Svg>
          ))}
        </Svg>
      </View>

      {/* Legend & Details */}
      <View className="flex-1 ml-6 gap-2">
        {series.map((s, idx) => {
          const pct = total > 0 ? ((s.value / total) * 100).toFixed(1) : '0';
          const unit = s.label === 'Eco Enzyme' ? 'L' : 'kg';
          return (
            <View key={idx} className="flex-row items-start gap-2">
              <View className="w-3 h-3 rounded-sm mt-0.5" style={{ backgroundColor: s.color }} />
              <View className="flex-1">
                <Text className="text-xs font-semibold text-gray-800">{s.label}</Text>
                <Text className="text-[10px] text-gray-500 mt-0.5">
                  {s.value.toFixed(1)} {unit} ({pct}%)
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ----------------------------------------------------
// CUSTOM AREA CHART COMPONENT (React Native SVG)
// ----------------------------------------------------
function CustomAreaChart({ data }: { data: ProduksiBulanan[] }) {
  const width = 300;
  const height = 150;
  const paddingLeft = 30;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.map((d) => d.ekoEnzim), 4);
  const niceMax = Math.ceil(maxVal / 4) * 4;

  const ticks = [niceMax, niceMax * 0.75, niceMax * 0.5, niceMax * 0.25, 0];

  const points = data.map((d, index) => {
    const x = paddingLeft + (index / Math.max(1, data.length - 1)) * chartWidth;
    const y = paddingTop + (1 - d.ekoEnzim / niceMax) * chartHeight;
    return { x, y, label: d.bulan };
  });

  let linePath = '';
  let areaPath = '';

  if (points.length > 0) {
    linePath = 'M ' + points[0].x + ' ' + points[0].y;
    for (let i = 1; i < points.length; i++) {
      linePath += ' L ' + points[i].x + ' ' + points[i].y;
    }

    areaPath = linePath;
    areaPath += ' L ' + points[points.length - 1].x + ' ' + (height - paddingBottom);
    areaPath += ' L ' + points[0].x + ' ' + (height - paddingBottom);
    areaPath += ' Z';
  }

  return (
    <View className="items-center w-full">
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="ekoGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="5%" stopColor={Brand.greenDark} stopOpacity={0.25} />
            <Stop offset="95%" stopColor={Brand.greenDark} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {/* Grid Lines */}
        {ticks.map((t, i) => {
          const y = paddingTop + (i / (ticks.length - 1)) * chartHeight;
          return (
            <Svg key={i}>
              <Path
                d={'M ' + paddingLeft + ' ' + y + ' L ' + (width - paddingRight) + ' ' + y}
                stroke="rgba(26,43,34,0.08)"
                strokeDasharray="3 3"
              />
              <Text
                style={{
                  position: 'absolute',
                  left: 0,
                  top: y - 6,
                  fontSize: 10,
                  color: '#6A7564',
                  width: paddingLeft - 5,
                  textAlign: 'right',
                }}
              >
                {t.toFixed(0)}
              </Text>
            </Svg>
          );
        })}

        {/* Area fill */}
        {areaPath ? <Path d={areaPath} fill="url(#ekoGrad)" /> : null}

        {/* Stroke Line */}
        {linePath ? (
          <Path d={linePath} stroke={Brand.greenDark} strokeWidth={2} fill="none" />
        ) : null}

        {/* X Axis Labels & Dots */}
        {points.map((p, index) => (
          <Svg key={index}>
            <Text
              style={{
                position: 'absolute',
                left: p.x - 20,
                top: height - paddingBottom + 4,
                fontSize: 10,
                color: '#6A7564',
                width: 40,
                textAlign: 'center',
              }}
            >
              {p.label}
            </Text>
            <Circle cx={p.x} cy={p.y} r={3.5} fill={Brand.greenDark} stroke="#ffffff" strokeWidth={1} />
          </Svg>
        ))}
      </Svg>
    </View>
  );
}

export default function GrafikScreen() {
  const { user, profile } = useAuth();
  const uid = user?.id ?? profile?.id ?? '';
  const [data, setData] = useState<ProduksiBulanan[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const rows = await getUserProduksiChart(uid);
      setData(rows);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  if (loading) return <LoadingState label="Memuat grafik..." />;

  // Hitung total akumulatif
  const totalEko = data.reduce((sum, r) => sum + (r.ekoEnzim || 0), 0);
  const totalEmberTumpuk = data.reduce((sum, r) => sum + (r.emberTumpuk || 0), 0);
  const totalPakan = data.reduce((sum, r) => sum + (r.pakan || 0), 0);

  // Batasi data 4 bulan terakhir untuk visualisasi yang rapi
  const chartRows = data.slice(-4);

  // Bulan aktif saat ini
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const currentMonthName = monthNames[new Date().getMonth()];
  const currentMonthData = data.find((d) => d.bulan === currentMonthName);
  const activeMonthData = currentMonthData ??
    data[data.length - 1] ?? {
      bulan: currentMonthName,
      ekoEnzim: 0,
      emberTumpuk: 0,
      kompos: 0,
      pakan: 0,
    };
  const activeMonthLabel = currentMonthData || data.length === 0 ? 'Bulan Ini' : 'Bulan Terakhir';

  return (
    <View className="flex-1 bg-surface">
      <PageHeader title="Grafik Produksi" showBack />

      <ScrollView contentContainerClassName="gap-5 p-5 pb-10" showsVerticalScrollIndicator={false} style={jakarta}>
        {/* Card Chart Bar Bulan Aktif Saat Ini */}
        <UiCard className="p-4 border-emerald-100 bg-white">
          <Text className="text-sm font-semibold text-gray-800 mb-4">
            Produksi {activeMonthLabel} ({activeMonthData.bulan})
          </Text>
          <SimpleBarChart
            data={[activeMonthData]}
            seriesKeys={['ekoEnzim', 'emberTumpuk', 'pakan']}
            height={150}
          />
        </UiCard>

        {/* Ringkasan Grid */}
        <View className="flex-row gap-2">
          {[
            { label: "Total Eco Enzyme", val: totalEko.toFixed(1) + ' L', color: "text-emerald-700 bg-emerald-50 border-emerald-100" },
            { label: "Total Ember Tumpuk", val: totalEmberTumpuk.toFixed(1) + ' kg', color: "text-emerald-700 bg-emerald-50 border-emerald-100" },
            { label: "Total Pakan", val: totalPakan.toFixed(1) + ' kg', color: "text-purple-700 bg-purple-50/70 border-purple-100" },
          ].map(s => (
            <View key={s.label} className={'flex-1 rounded-xl p-3 items-center justify-center border ' + s.color}>
              <Text className="text-sm font-bold" style={fraunces}>{s.val}</Text>
              <Text className="text-[9px] mt-0.5 opacity-80 text-center">{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Proporsi Hasil Produksi */}
        <UiCard className="p-4 border-emerald-100">
          <Text className="text-sm font-semibold text-gray-800 mb-4">Proporsi Hasil Produksi</Text>
          <CustomPieChart totalEko={totalEko} totalEmberTumpuk={totalEmberTumpuk} totalPakan={totalPakan} />
        </UiCard>

        {/* Tren Eco Enzyme */}
        <UiCard className="p-4 border-emerald-100">
          <Text className="text-sm font-semibold text-gray-800 mb-4">Tren Eco Enzyme (L)</Text>
          {chartRows.length > 0 ? (
            <CustomAreaChart data={chartRows} />
          ) : (
            <View className="h-40 items-center justify-center">
              <MaterialIcons name="show-chart" size={40} color="#e5e7eb" />
              <Text className="mt-2 text-sm text-gray-400">Belum ada data grafik</Text>
            </View>
          )}
        </UiCard>
      </ScrollView>
    </View>
  );
}

import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';

import { EmptyState, ErrorBanner, LoadingState } from '@/components/loading-state';
import { SimpleBarChart } from '@/components/simple-bar-chart';
import { UiCard } from '@/components/ui-card';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { getAdminStats } from '@/lib/api';
import {
  filterProduksiForChart,
  formatGrowthPercent,
  growthVsBaseMonth,
  type ProduksiBulanan,
} from '@/lib/domain';

const fraunces = { fontFamily: 'serif' };
const jakarta = { fontFamily: 'System' };

function fmtNum(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return String(Math.round(n * 10) / 10);
}

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

export default function AdminDashboard() {
  const { signOut, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalPengguna: 0,
    totalEkoenzim: 0,
    totalEmberTumpuk: 0,
    totalKompos: 0,
    totalPakan: 0,
    totalSampah: 0,
    produksi: [] as ProduksiBulanan[],
  });

  const load = useCallback(async () => {
    try {
      setError('');
      const s = await getAdminStats();
      setStats({
        totalPengguna: s.totalPengguna,
        totalEkoenzim: s.totalEkoenzim,
        totalEmberTumpuk: s.totalEmberTumpuk || 0,
        totalKompos: s.totalKompos,
        totalPakan: s.totalPakan || 0,
        totalSampah: s.totalSampah,
        produksi: s.produksi,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat statistik');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const chartData = useMemo(() => filterProduksiForChart(stats.produksi), [stats.produksi]);
  const growth = useMemo(
    () => growthVsBaseMonth(chartData.length ? chartData : stats.produksi),
    [chartData, stats.produksi],
  );

  const chartRows = useMemo(
    () =>
      (chartData.length ? chartData : stats.produksi).map((d) => ({
        ...d,
        total:
          (Number(d.ekoEnzim) || 0) +
          (Number(d.emberTumpuk) || 0) +
          (Number(d.kompos) || 0) +
          (Number(d.pakan) || 0),
      })),
    [chartData, stats.produksi],
  );

  if (loading) return <LoadingState label="Memuat statistik..." />;

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header Panel */}
      <SafeAreaView edges={['top']} className="bg-slate-900 shadow-md z-10">
        <View className="flex-row items-center justify-between px-5 pb-6 pt-3">
          <View>
            <View className="flex-row items-center gap-2">
              <Text className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-900">
                Admin Panel
              </Text>
            </View>
            <Text className="text-xl font-bold text-white mt-1">
              {profile?.nama_lengkap || 'Admin E-KOMPAK'}
            </Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => signOut()}
              className="size-10 items-center justify-center rounded-full bg-white/10 active:bg-white/20"
              hitSlop={8}>
              <MaterialIcons name="logout" size={20} color="#fff" />
            </Pressable>
            <View className="size-10 items-center justify-center rounded-full bg-emerald-500 shadow-sm shadow-emerald-400/30">
              <MaterialIcons name="dashboard" size={20} color="#fff" />
            </View>
          </View>
        </View>
      </SafeAreaView>
      <View className="-mt-3 h-6 rounded-b-3xl bg-slate-900 z-10" />

      <ScrollView
        className="-mt-2 flex-1"
        contentContainerClassName="gap-5 px-4 pb-12 pt-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }>
        <ErrorBanner message={error} />

        {/* Welcome message card */}
        <UiCard className="p-4 border-slate-200/80 bg-white">
          <View className="flex-row items-center gap-3">
            <View className="size-10 rounded-xl bg-emerald-50 items-center justify-center">
              <MaterialIcons name="info" size={20} color={Brand.green} />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-slate-500">Program Kemitraan</Text>
              <Text className="text-sm font-bold text-slate-800">PKM PM UGM E-KOMPAK</Text>
            </View>
          </View>
        </UiCard>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap gap-3">
          {/* Card 1: Mitra Aktif */}
          <UiCard className="min-w-[46%] flex-1 border-slate-200/60 p-4 bg-white">
            <View className="flex-row items-center justify-between mb-2">
              <View className="rounded-xl bg-blue-50 p-2">
                <MaterialIcons name="people" size={20} color={Brand.blue.text} />
              </View>
              <Text className="text-xs font-bold text-slate-400">Mitra</Text>
            </View>
            <Text className="text-2xl font-black text-slate-800">{stats.totalPengguna}</Text>
            <Text className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
              Total Mitra Aktif
            </Text>
          </UiCard>

          {/* Card 2: Sampah Terolah */}
          <UiCard className="min-w-[46%] flex-1 border-slate-200/60 p-4 bg-white">
            <View className="flex-row items-center justify-between mb-2">
              <View className="rounded-xl bg-emerald-50 p-2">
                <Image source={require("@/assets/images/icon.png")} style={{ width: 20, height: 20 }} resizeMode="contain" />
              </View>
              <Text className="text-xs font-bold text-slate-400">Sampah</Text>
            </View>
            <Text className="text-2xl font-black text-slate-800">
              {fmtNum(stats.totalSampah)} <Text className="text-xs font-bold text-slate-500">Kg</Text>
            </Text>
            <Text className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
              Total Terolah
            </Text>
          </UiCard>

          {/* Card 3: Ekoenzim */}
          <UiCard className="min-w-[46%] flex-1 border-slate-200/60 p-4 bg-white">
            <View className="flex-row items-center justify-between mb-2">
              <View className="rounded-xl bg-cyan-50 p-2">
                <MaterialIcons name="water-drop" size={20} color="#0891b2" />
              </View>
              <Text className="text-xs font-bold text-slate-400">Eko Enzim</Text>
            </View>
            <Text className="text-2xl font-black text-slate-800">
              {fmtNum(stats.totalEkoenzim)} <Text className="text-xs font-bold text-slate-500">L</Text>
            </Text>
            <Text className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
              Hasil Ekoenzim
            </Text>
          </UiCard>

          {/* Card 4: Ember Tumpuk */}
          <UiCard className="min-w-[46%] flex-1 border-slate-200/60 p-4 bg-white">
            <View className="flex-row items-center justify-between mb-2">
              <View className="rounded-xl bg-emerald-50 p-2">
                <MaterialIcons name="compost" size={20} color={Brand.green} />
              </View>
              <Text className="text-xs font-bold text-slate-400">Ember Tumpuk</Text>
            </View>
            <Text className="text-2xl font-black text-slate-800">
              {fmtNum(stats.totalEmberTumpuk)} <Text className="text-xs font-bold text-slate-500">Kg</Text>
            </Text>
            <Text className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
              Hasil Ember Tumpuk
            </Text>
          </UiCard>
        </View>

        {/* Growth Info */}
        {growth.baseBulan ? (
          <UiCard className="p-3 border-slate-100 bg-slate-50/50 flex-row items-center justify-between">
            <View className="flex-row gap-2">
              <View className="rounded-full bg-cyan-100/70 border border-cyan-200 px-2 py-0.5">
                <Text className="text-[10px] font-bold text-cyan-800">
                  Eko Enzim: {formatGrowthPercent(growth.ekoEnzim)}
                </Text>
              </View>
              <View className="rounded-full bg-emerald-100/70 border border-emerald-200 px-2 py-0.5">
                <Text className="text-[10px] font-bold text-emerald-800">
                  Kompos: {formatGrowthPercent(growth.kompos)}
                </Text>
              </View>
            </View>
            <Text className="text-[10px] font-semibold text-slate-400">
              vs {growth.baseBulan}
              {growth.currentBulan && growth.currentBulan !== growth.baseBulan
                ? ` → ${growth.currentBulan}`
                : ''}
            </Text>
          </UiCard>
        ) : null}

        {/* Grafik 1: Total Sampah Terolah (Bar) */}
        <UiCard className="border-slate-200/60 p-4 bg-white shadow-sm">
          <View className="flex-row items-center gap-2 mb-4">
            <MaterialIcons name="insert-chart" size={18} color={Brand.slate} />
            <Text className="text-sm font-bold text-slate-800">
              Grafik Total Sampah Terolah (Kg)
            </Text>
          </View>
          {chartRows.length ? (
            <SimpleBarChart
              data={chartRows}
              seriesKeys={['total']}
              singleColor={Brand.slate}
              height={180}
            />
          ) : (
            <EmptyState title="Belum ada data produksi" subtitle="Data diambil dari entry user." />
          )}
        </UiCard>

        {/* Grafik 2: Proporsi Hasil Produksi (Pie) */}
        <UiCard className="border-slate-200/60 p-4 bg-white shadow-sm">
          <View className="flex-row items-center gap-2 mb-4">
            <MaterialIcons name="pie-chart" size={18} color={Brand.slate} />
            <Text className="text-sm font-bold text-slate-800">
              Proporsi Hasil Produksi
            </Text>
          </View>
          <CustomPieChart
            totalEko={stats.totalEkoenzim}
            totalEmberTumpuk={stats.totalEmberTumpuk}
            totalPakan={stats.totalPakan}
          />
        </UiCard>

        {/* Grafik 3: Tren Eco Enzyme (Area) */}
        <UiCard className="border-slate-200/60 p-4 bg-white shadow-sm">
          <View className="flex-row items-center gap-2 mb-4">
            <MaterialIcons name="show-chart" size={18} color={Brand.slate} />
            <Text className="text-sm font-bold text-slate-800">
              Tren Eco Enzyme (L)
            </Text>
          </View>
          {chartData.length > 0 ? (
            <CustomAreaChart data={chartData} />
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

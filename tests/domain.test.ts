/**
 * Unit tests for shipped pure helpers in lib/domain.ts
 * Run: npx tsx tests/domain.test.ts
 */
import assert from 'node:assert/strict';
import {
  aggregateProduksiBulanan,
  aggregateProduksiHarian,
  captchaMatches,
  filterMonitoringByStatus,
  filterProduksiForChart,
  formatGrowthPercent,
  formatTanggalId,
  growthVsBaseMonth,
  hitungBeratAkhir,
  normalizePenggunaan,
  percentGrowth,
  resolvePenggunaan,
  ringkasanBulanIni,
  searchMonitoring,
  toAuthEmail,
  totalSampahTerolah,
  type EntriRow,
  type KondisiStatus,
  type ProduksiBulanan,
} from '../lib/domain';

let passed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`ok - ${name}`);
  } catch (e) {
    console.error(`FAIL - ${name}`);
    console.error(e);
    process.exitCode = 1;
  }
}

test('captcha match exact', () => {
  assert.equal(captchaMatches('1234', '1234'), true);
  assert.equal(captchaMatches(' 1234 ', '1234'), true);
});

test('captcha mismatch', () => {
  assert.equal(captchaMatches('1235', '1234'), false);
  assert.equal(captchaMatches('', '1234'), false);
});

test('beratAkhir normal', () => {
  assert.equal(hitungBeratAkhir(10, 3), 7);
  assert.equal(hitungBeratAkhir(5.5, 2.5), 3);
});

test('beratAkhir clamps at 0 when usage > awal', () => {
  assert.equal(hitungBeratAkhir(2, 5), 0);
  assert.equal(hitungBeratAkhir(0, 1), 0);
});

test('normalize penggunaan labels', () => {
  assert.equal(normalizePenggunaan('Eko enzim'), 'eko_enzim');
  assert.equal(normalizePenggunaan('sampah ember tumpuk'), 'ember_tumpuk');
  assert.equal(normalizePenggunaan('Kompos ember'), 'kompos');
  assert.equal(normalizePenggunaan('Pakan ternak'), 'pakan');
});

test('resolvePenggunaan preset and custom', () => {
  assert.deepEqual(resolvePenggunaan('Eko enzim', ''), { ok: true, value: 'Eko enzim' });
  assert.deepEqual(resolvePenggunaan('Lainnya', 'Pupuk cair'), {
    ok: true,
    value: 'Pupuk cair',
  });
  assert.equal(resolvePenggunaan('', '').ok, false);
  assert.equal(resolvePenggunaan('Lainnya', '  ').ok, false);
});

test('filter monitoring by status', () => {
  const rows = [
    { id: '1', status: 'Baik' as KondisiStatus },
    { id: '2', status: 'Proses' as KondisiStatus },
    { id: '3', status: 'Perhatian' as KondisiStatus },
    { id: '4', status: 'Baik' as KondisiStatus },
  ];
  assert.equal(filterMonitoringByStatus(rows, 'Baik').length, 2);
  assert.equal(filterMonitoringByStatus(rows, 'Siap Panen').length, 0);
  assert.equal(filterMonitoringByStatus(rows, 'Semua').length, 4);
});

test('aggregate produksi groups by usage', () => {
  const entries: EntriRow[] = [
    {
      id: '1',
      tanggal: '2026-07-01',
      beratAwal: 10,
      penggunaan: 'Eko enzim',
      beratPenggunaan: 4,
      beratAkhir: 6,
    },
    {
      id: '2',
      tanggal: '2026-07-02',
      beratAwal: 8,
      penggunaan: 'Kompos',
      beratPenggunaan: 3,
      beratAkhir: 5,
    },
    {
      id: '3',
      tanggal: '2026-07-03',
      beratAwal: 6,
      penggunaan: 'Pakan',
      beratPenggunaan: 2,
      beratAkhir: 4,
    },
    {
      id: '4',
      tanggal: '2026-07-04',
      beratAwal: 5,
      penggunaan: 'Ember tumpuk',
      beratPenggunaan: 1.5,
      beratAkhir: 3.5,
    },
  ];
  const agg = aggregateProduksiBulanan(entries);
  assert.equal(agg.length, 1);
  assert.equal(agg[0].bulan, 'Jul');
  assert.equal(agg[0].ekoEnzim, 4);
  assert.equal(agg[0].kompos, 3);
  assert.equal(agg[0].pakan, 2);
  assert.equal(agg[0].emberTumpuk, 1.5);
  assert.equal(totalSampahTerolah(entries), 10.5);
});

test('aggregate produksi harian uses usage amount', () => {
  const entries: EntriRow[] = [
    {
      id: '1',
      tanggal: '2026-07-10',
      beratAwal: 0.7,
      penggunaan: 'Eko enzim',
      beratPenggunaan: 0.7,
      beratAkhir: 0,
    },
  ];
  const rows = aggregateProduksiHarian(entries, 2026, 6);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].ekoEnzim, 0.7);
});

test('ringkasan bulan ini filters month', () => {
  const entries: EntriRow[] = [
    {
      id: '1',
      tanggal: '2026-06-01',
      beratAwal: 10,
      penggunaan: 'Kompos',
      beratPenggunaan: 9,
      beratAkhir: 1,
    },
    {
      id: '2',
      tanggal: '2026-07-10',
      beratAwal: 5,
      penggunaan: 'Eko enzim',
      beratPenggunaan: 2,
      beratAkhir: 3,
    },
  ];
  const r = ringkasanBulanIni(entries, new Date('2026-07-15'));
  assert.equal(r.ekoEnzim, 2);
  assert.equal(r.kompos, 0);
});

test('toAuthEmail phone and email', () => {
  assert.equal(toAuthEmail('User@Example.com'), 'user@example.com');
  assert.equal(toAuthEmail('0812-3456-7890'), '081234567890@phone.ekompak.local');
});

test('percentGrowth basic and edge', () => {
  assert.equal(percentGrowth(129, 100), 29);
  assert.equal(percentGrowth(148, 100), 48);
  assert.equal(percentGrowth(5, 0), 100);
  assert.equal(percentGrowth(0, 0), 0);
  assert.equal(percentGrowth(50, 100), -50);
});

test('growthVsBaseMonth prefers Apr base', () => {
  const prod: ProduksiBulanan[] = [
    { bulan: 'Mar', ekoEnzim: 10, emberTumpuk: 0, kompos: 10, pakan: 0 },
    { bulan: 'Apr', ekoEnzim: 22, emberTumpuk: 0, kompos: 21, pakan: 0 },
    { bulan: 'Mei', ekoEnzim: 26, emberTumpuk: 0, kompos: 25, pakan: 0 },
    { bulan: 'Jul', ekoEnzim: 28.4, emberTumpuk: 0, kompos: 31.1, pakan: 0 },
  ];
  const g = growthVsBaseMonth(prod);
  assert.equal(g.baseBulan, 'Apr');
  assert.equal(g.currentBulan, 'Jul');
  assert.equal(g.ekoEnzim, 29);
  assert.equal(g.kompos, 48);
});

test('searchMonitoring matches name status description', () => {
  const rows = [
    {
      namaUser: 'Ibu Sari Dewi',
      status: 'Siap Panen',
      deskripsi: 'diaduk dan ditambah molase',
    },
    {
      namaUser: 'Siti Aminah',
      status: 'Perhatian',
      deskripsi: 'tumbuh jamur tidak wajar',
    },
  ];
  assert.equal(searchMonitoring(rows, 'sari').length, 1);
  assert.equal(searchMonitoring(rows, 'perhatian').length, 1);
  assert.equal(searchMonitoring(rows, 'molase').length, 1);
  assert.equal(searchMonitoring(rows, '').length, 2);
  assert.equal(searchMonitoring(rows, 'xyz').length, 0);
});

test('formatTanggalId id locale short', () => {
  assert.equal(formatTanggalId('2026-07-15'), '15 Jul 2026');
  assert.equal(formatTanggalId('2026-04-01'), '1 Apr 2026');
  assert.equal(formatTanggalId(''), '');
});

test('filterProduksiForChart prefers Apr-Jul', () => {
  const prod: ProduksiBulanan[] = [
    { bulan: 'Feb', ekoEnzim: 1, emberTumpuk: 0, kompos: 1, pakan: 0 },
    { bulan: 'Apr', ekoEnzim: 2, emberTumpuk: 0, kompos: 2, pakan: 0 },
    { bulan: 'Mei', ekoEnzim: 3, emberTumpuk: 0, kompos: 3, pakan: 0 },
    { bulan: 'Jun', ekoEnzim: 4, emberTumpuk: 0, kompos: 4, pakan: 0 },
    { bulan: 'Jul', ekoEnzim: 5, emberTumpuk: 0, kompos: 5, pakan: 0 },
  ];
  const f = filterProduksiForChart(prod);
  assert.deepEqual(
    f.map((p) => p.bulan),
    ['Apr', 'Mei', 'Jun', 'Jul'],
  );
});

test('formatGrowthPercent sign', () => {
  assert.equal(formatGrowthPercent(29), '+29%');
  assert.equal(formatGrowthPercent(-5), '-5%');
  assert.equal(formatGrowthPercent(0), '0%');
});

console.log(`\n${passed} tests passed`);

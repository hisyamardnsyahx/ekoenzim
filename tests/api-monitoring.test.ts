/**
 * Tests shipped pure helpers used by monitoring save + chart paths.
 * Run: npx tsx tests/api-monitoring.test.ts
 */
import assert from 'node:assert/strict';

import { aggregateProduksiBulanan, type EntriRow } from '../lib/domain';
import {
  buildMonitoringPayload,
  isDurablePhotoRef,
} from '../lib/monitoring-payload';
import { uriToDataUrl } from '../lib/photo';

let passed = 0;
function test(name: string, fn: () => void | Promise<void>) {
  return (async () => {
    try {
      await fn();
      passed++;
      console.log(`ok - ${name}`);
    } catch (e) {
      console.error(`FAIL - ${name}`);
      console.error(e);
      process.exitCode = 1;
    }
  })();
}

async function main() {
  await test('buildMonitoringPayload keeps volume kg from form', () => {
    const p = buildMonitoringPayload({
      deskripsi: '  Kondisi baik  ',
      status: 'Baik',
      volumeTerolah: 12.5,
      fotoUrl: '',
    });
    assert.equal(p.volumeTerolah, 12.5);
    assert.equal(p.deskripsi, 'Kondisi baik');
    assert.equal(p.fotoUrl, '');
  });

  await test('buildMonitoringPayload does not substitute Unsplash for empty foto', () => {
    const p = buildMonitoringPayload({
      deskripsi: 'Tanpa foto',
      status: 'Perhatian',
      volumeTerolah: 1,
    });
    assert.equal(p.fotoUrl, '');
    assert.ok(!p.fotoUrl.includes('unsplash'));
  });

  await test('buildMonitoringPayload persists data URL foto as-is', () => {
    const dataUrl =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const p = buildMonitoringPayload({
      deskripsi: 'Dengan foto',
      status: 'Proses',
      volumeTerolah: 3,
      fotoUrl: dataUrl,
    });
    assert.equal(p.fotoUrl, dataUrl);
    assert.ok(isDurablePhotoRef(p.fotoUrl));
    assert.ok(!p.fotoUrl.includes('unsplash.com'));
  });

  await test('aggregateProduksiBulanan empty entries returns [] not mock months', () => {
    const empty = aggregateProduksiBulanan([]);
    assert.deepEqual(empty, []);
    assert.equal(empty.length, 0);
  });

  await test('aggregateProduksiBulanan only uses real entry rows', () => {
    const entries: EntriRow[] = [
      {
        id: '1',
        tanggal: '2026-07-10',
        beratAwal: 10,
        penggunaan: 'Eko enzim',
        beratPenggunaan: 4,
        beratAkhir: 6,
      },
    ];
    const chart = aggregateProduksiBulanan(entries);
    assert.equal(chart.length, 1);
    assert.equal(chart[0].bulan, 'Jul');
    assert.equal(chart[0].ekoEnzim, 4);
    assert.equal(chart[0].kompos, 0);
    // Must not invent Feb–Jun mock series
    assert.equal(chart.some((r) => r.bulan === 'Feb'), false);
  });

  await test('aggregateProduksiBulanan uses beratPenggunaan when beratAkhir is zero (seeder rows)', () => {
    const entries: EntriRow[] = [
      {
        id: 'seeder-1',
        tanggal: '2026-07-27',
        beratAwal: 0.7,
        penggunaan: 'Eko enzim',
        beratPenggunaan: 0.7,
        beratAkhir: 0,
      },
    ];
    const chart = aggregateProduksiBulanan(entries);
    assert.equal(chart.length, 1);
    assert.equal(chart[0].ekoEnzim, 0.7);
  });

  await test('uriToDataUrl passes through data: and https', async () => {
    const d = 'data:image/png;base64,abc';
    assert.equal(await uriToDataUrl(d), d);
    const h = 'https://example.com/a.jpg';
    assert.equal(await uriToDataUrl(h), h);
    assert.equal(await uriToDataUrl(''), '');
  });

  await test('isDurablePhotoRef rejects file URIs', () => {
    assert.equal(isDurablePhotoRef('file:///tmp/x.jpg'), false);
    assert.equal(isDurablePhotoRef('content://media/1'), false);
    assert.equal(isDurablePhotoRef('data:image/jpeg;base64,xx'), true);
  });

  console.log(`\n${passed} api-monitoring tests passed`);
}

main();

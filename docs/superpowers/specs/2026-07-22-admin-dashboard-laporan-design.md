# Admin Dashboard & Laporan Monitoring — Design

**Date:** 2026-07-22  
**Scope:** Enhance existing admin (`app/admin/index.tsx`, `app/admin/laporan.tsx`) to match product spec.  
**Out of scope:** User management tab, schema changes, user-facing monitoring form.

## Goals

1. **Overview** — Total partisipasi (Kepala Keluarga), total Ekoenzim (L), total Kompos (Kg).
2. **Analytics** — Bar chart Ekoenzim vs Kompos per bulan; growth rate vs bulan acuan (default April / first month with data).
3. **Monitoring reports** — Search (nama, status, deskripsi) + status filter chips (Perhatian highlighted red).
4. **Report cards** — Nama, tanggal ID, status badge, deskripsi, volume, tombol **Lihat** foto (modal).

## Approach

Domain helpers in `lib/domain.ts` + UI polish. No Supabase schema change. Display unit: ekoenzim number labeled **L**, kompos **Kg** (no conversion).

## Domain helpers

| Function | Behavior |
|----------|----------|
| `percentGrowth(current, base)` | `((current - base) / base) * 100` when base > 0; if base=0 and current>0 → 100; both 0 → 0. Round nearest int. |
| `growthVsBaseMonth(produksi, baseLabel?)` | Compare last month vs base (default first `Apr` in series, else first row). Returns `{ ekoEnzim, kompos, baseBulan, currentBulan }`. |
| `searchMonitoring(rows, query)` | Case-insensitive match on `namaUser`, `status`, `deskripsi`. Empty query → all. |
| `formatTanggalId(isoDate)` | `2026-07-15` → `15 Jul 2026`. |
| `filterProduksiForChart(produksi)` | Prefer Apr–Jul of latest year present; else full series. |

## UI

### Dashboard (`admin/index`)

- Cards: Kepala Keluarga | Total Ekoenzim (L) | Total Kompos (Kg). Drop Pakan from overview cards.
- Growth badges under chart: e.g. `Ekoenzim +29% · Kompos +48% vs April`.
- `SimpleBarChart` with series limited to `ekoEnzim` + `kompos`.

### Laporan (`admin/laporan`)

- Search bar above chips.
- Chips: existing `ADMIN_FILTERS`; active Perhatian / inactive Perhatian use red accent.
- Card: name + formatted date; status top-right; deskripsi; volume with unit (default Kg); button **Lihat** opens full-screen modal of `fotoUrl` (disabled/empty state if no photo).

### Chart component

- Optional `seriesKeys` prop; default remains all four series for user screens; admin passes `['ekoEnzim','kompos']`.

## Testing

Unit tests in `tests/domain.test.ts` for growth, search, formatTanggalId, filter chart range.

## Assumptions

- 1 unit ekoenzim displayed as Liter without kg→L conversion.
- Growth base month prefers label `Apr`; falls back to first month in sorted produksi.
- Volume on report cards remains numeric from API; label `kg` unless future field adds unit.

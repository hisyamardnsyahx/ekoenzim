# E-KOMPAK

Aplikasi Expo (SDK 54) untuk program pengolahan sampah / eko enzim warga.

## Syarat

- Node.js 20+ (disarankan 20 LTS atau 22)
- [pnpm](https://pnpm.io/) atau npm
- HP dengan **Expo Go** yang mendukung **SDK 54**
  - Android: unduh Expo Go terbaru dari Play Store
  - iOS: unduh Expo Go terbaru dari App Store

## Install

```bash
pnpm install
```

Proyek memakai `.npmrc` dengan `node-linker=hoisted` agar Metro/Expo Go resolve dependency dengan stabil.

## Jalankan di Expo Go

Error umum **“failed to update remote update”** / gagal scan QR = HP **tidak bisa** jangkau Metro (sering IP salah karena ZeroTier/VPN).

1. Pastikan HP dan PC **satu Wi‑Fi**.
2. **Matikan VPN / ZeroTier** di HP (dan idealnya di PC saat dev).
3. Di folder proyek:

```bash
pnpm start
```

`pnpm start` otomatis pilih IP Wi‑Fi `192.168.x.x` (skip ZeroTier `10.x`). Cek log:

```text
[start-lan] REACT_NATIVE_PACKAGER_HOSTNAME=192.168.100.158
```

4. QR / URL harus `exp://192.168.…:8081` — **bukan** `exp://10.…`.
5. Scan QR dengan Expo Go (Android) atau Camera (iOS).

Paksa IP manual (PowerShell), ganti sesuai `ipconfig`:

```powershell
$env:REACT_NATIVE_PACKAGER_HOSTNAME="192.168.100.158"
pnpm start:clear
```

### Jika QR / “failed to update remote update” / “Could not connect”

Coba berurutan:

```bash
# 1. Cache bersih + IP LAN yang benar
pnpm start:clear

# 2. Tunnel (HP beda jaringan / firewall / ZeroTier tetap nyala)
pnpm start:tunnel
```

Tunnel butuh akun Expo (sekali: `npx expo login`).

### Jika port 8081 sudah dipakai

Tutup proses Expo lama, lalu:

```bash
pnpm start:clear
```

### Catatan Windows (path berisi spasi)

Folder `D:\project pkm\e-kompak` aman, tetapi **hindari spasi** di path bila masih bermasalah (pindah ke `D:\project\e-kompak`).

## Script

| Script | Fungsi |
| --- | --- |
| `pnpm start` | LAN + auto IP Wi‑Fi (bukan ZeroTier) |
| `pnpm start:clear` | Sama + clear cache Metro |
| `pnpm start:lan` | Alias `pnpm start` |
| `pnpm start:tunnel` | Tunnel Expo (lintas jaringan) |
| `pnpm start:offline` | LAN tanpa cek update Expo remote |
| `pnpm android` / `pnpm ios` / `pnpm web` | Buka platform terkait |
| `pnpm lint` | ESLint |

## Seeder data ibu ekompak (CSV)

Mengisi database dari `ibu ekompak - Sheet1.csv` (239 baris harian, 27 Jul – 14 Sep 2026)
sekaligus membuat 10 akun untuk tiap nama di CSV:

```bash
SSH_PASSWORD=xxx python3 run_seeder_ibu_ekompak.py
python3 run_seeder_ibu_ekompak.py --dry-run   # lihat SQL tanpa menjalankan
```

- Akun: email `<username>@ibu.ekompak.local` (mis. `suparni@ibu.ekompak.local`),
  password seragam `Ekompak123`. Ibu-ibu login dengan email + password tersebut.
  Profil dibuat otomatis oleh trigger `handle_new_user`; akun yang sudah ada dilewati.
- `entries`: tiap sel terisi (Pakan / Ekoenzim / Ember Tumpuk) → 1 baris
  (`berat_awal` = `berat_penggunaan` = nilai, `berat_akhir` = 0).
- `monitoring`: 1 baris per baris CSV, `volume_terolah` = total volume, status `Baik`.
- Idempotent: `entries`/`monitoring`/`monitoring_comments` dihapus lalu diisi ulang
  dalam satu transaksi; akun tidak dihapus.

## Struktur

- `app/` — rute expo-router (tabs: Beranda, Kalender, Entry, Monitor)
- `components/` — UI bersama (kalender, header, card)
- `constants/` — tema & mock data

#!/usr/bin/env python3
"""
Seeder E-KOMPAK dari CSV "ibu ekompak - Sheet1.csv" (data harian ibu-ibu).

Dibaca dari CSV -> SQL -> dijalankan di database Supabase self-hosted lewat SSH,
mengikuti pola run_seeder*.py yang sudah ada (paramiko -> /tmp -> psql di
container `supabase-db`).

Mapping data:
- 10 nama unik di CSV -> 10 akun di auth.users
    email    : <username>@ibu.ekompak.local   (mis. suparni@ibu.ekompak.local)
    password : Ekompak123  (sama untuk semua, ganti setelah dibagikan)
  Profil dibuat otomatis oleh trigger public.handle_new_user();
  nama_lengkap / role / aktif ditegaskan ulang setelah insert.
  Pembuatan akun idempotent: email yang sudah ada dilewati.
- public.entries: tiap SEL TERISI (Pakan / Ekoenzim / Ember Tumpuk) -> 1 baris
    berat_awal = berat_penggunaan = nilai sel (kg),
    penggunaan = 'Pakan' | 'Eko enzim' | 'Ember tumpuk',
    berat_akhir = 0  (seluruh sampah hari itu dialokasikan ke jalur tersebut)
- public.monitoring: 1 baris per baris CSV
    volume_terolah = Total volume sampah yang dimasukkan,
    status = 'Baik',
    deskripsi = ringkasan kategori, diawali "[Seeder CSV]".

Idempotent: entries/monitoring/monitoring_comments dihapus dulu lalu diisi
ulang dari CSV dalam satu transaksi. Akun TIDAK dihapus (seperti
reset_seeder_data.py).

Cara pakai:
    SSH_PASSWORD=xxx python3 run_seeder_ibu_ekompak.py
    python3 run_seeder_ibu_ekompak.py --dry-run   # cetak SQL saja, tanpa SSH
Env (seperti skrip lain): SSH_HOST (default 103.253.213.250),
SSH_USER (default root), SSH_PASSWORD.
"""
import csv
import os
import re
import sys
from pathlib import Path

PASSWORD = "Ekompak123"
EMAIL_DOMAIN = "ibu.ekompak.local"
CSV_PATH = Path(__file__).parent / "ibu ekompak - Sheet1.csv"

CATEGORIES = [
    ("Pakan", "pakan"),
    ("Eko enzim", "ekoenzim"),
    ("Ember tumpuk", "ember_tumpuk"),
]


def username_of(nama: str) -> str:
    return re.sub(r"[^a-z0-9]", "", nama.lower())


def parse_csv(path: Path):
    rows = []
    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        header = next(reader)  # dibuang, kolom diasumsikan sesuai urutan
        current_date = None
        for raw in reader:
            cells = (raw + [""] * 6)[:6]
            date_s, nama, pakan, ekoenzim, ember, total = (c.strip() for c in cells)
            if date_s:
                current_date = date_s
            nama = " ".join(nama.split())
            if not nama or not current_date:
                continue
            d, m, y = current_date.split("/")
            tanggal = f"{y}-{m}-{d}"

            def num(x):
                x = x.strip().strip('"')
                return None if x == "" else float(x.replace(",", "."))

            rows.append(
                {
                    "tanggal": tanggal,
                    "nama": nama,
                    "username": username_of(nama),
                    "pakan": num(pakan),
                    "ekoenzim": num(ekoenzim),
                    "ember_tumpuk": num(ember),
                    "total": num(total),
                }
            )
    return rows


def sql_str(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


def build_sql(rows):
    users = []
    seen = set()
    for r in rows:
        if r["username"] not in seen:
            seen.add(r["username"])
            users.append((r["nama"], r["username"]))

    out = []
    out.append("-- Seeder ibu ekompak dari CSV")
    out.append(f"-- {len(rows)} baris CSV, {len(users)} akun, dibuat oleh run_seeder_ibu_ekompak.py")
    out.append("")
    out.append("-- ============ 1. AKUN (auth.users) ============")
    for nama, uname in users:
        email = f"{uname}@{EMAIL_DOMAIN}"
        # NOTE: meta di-escape manual untuk JSON sederhana (nama tanpa karakter aneh)
        meta = '{"nama_lengkap": "%s", "role": "user"}' % nama.replace('"', '\\"')
        out.append(
            "INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,"
            " email_confirmed_at, confirmation_sent_at, raw_user_meta_data, created_at, updated_at)"
            f" SELECT (SELECT id FROM auth.instances LIMIT 1), gen_random_uuid(), 'authenticated',"
            f" 'authenticated', {sql_str(email)}, crypt({sql_str(PASSWORD)}, gen_salt('bf')),"
            f" now(), now(), {sql_str(meta)}::jsonb, now(), now()"
            f" WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.email = {sql_str(email)});"
        )
    out.append("")
    out.append("-- Tegaskan profil (trigger handle_new_user sudah membuat barisnya)")
    for nama, uname in users:
        email = f"{uname}@{EMAIL_DOMAIN}"
        out.append(
            "UPDATE public.profiles p"
            f" SET nama_lengkap = {sql_str(nama)}, email = {sql_str(email)},"
            " role = 'user', aktif = true"
            f" FROM auth.users u WHERE u.email = {sql_str(email)} AND p.id = u.id;"
        )
    out.append("")
    out.append("-- ============ 2. DATA CSV (entries + monitoring) ============")
    out.append("BEGIN;")
    out.append("DELETE FROM public.monitoring_comments;")
    out.append("DELETE FROM public.entries;")
    out.append("DELETE FROM public.monitoring;")
    out.append("")

    n_entries = 0
    for r in rows:
        email = f"{r['username']}@{EMAIL_DOMAIN}"
        for label, key in CATEGORIES:
            v = r[key]
            if v is None:
                continue
            out.append(
                "INSERT INTO public.entries (user_id, tanggal, berat_awal, penggunaan,"
                " berat_penggunaan, berat_akhir)"
                f" SELECT u.id, '{r['tanggal']}', {v}, {sql_str(label)}, {v}, 0"
                f" FROM auth.users u WHERE u.email = {sql_str(email)};"
            )
            n_entries += 1

    n_monitoring = 0
    for r in rows:
        email = f"{r['username']}@{EMAIL_DOMAIN}"
        parts = []
        for label, key in CATEGORIES:
            if r[key] is not None:
                parts.append(f"{label} {r[key]} kg")
        total = r["total"] if r["total"] is not None else 0
        deskripsi = "[Seeder CSV] " + " · ".join(parts) + f" — total {total} kg"
        out.append(
            "INSERT INTO public.monitoring (user_id, tanggal, deskripsi, status, volume_terolah)"
            f" SELECT u.id, '{r['tanggal']}', {sql_str(deskripsi)}, 'Baik', {total}"
            f" FROM auth.users u WHERE u.email = {sql_str(email)};"
        )
        n_monitoring += 1

    out.append("")
    out.append("COMMIT;")
    out.append("")
    out.append(
        f"-- Ringkasan: {len(users)} akun, {n_entries} entries, {n_monitoring} monitoring"
    )
    return "\n".join(out) + "\n", users, n_entries, n_monitoring


def run_remote(sql: str):
    import paramiko

    host = os.environ.get("SSH_HOST", "103.253.213.250")
    user = os.environ.get("SSH_USER", "root")
    password = os.environ.get("SSH_PASSWORD", "")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, port=22, username=user, password=password, timeout=10)

    sftp = client.open_sftp()
    with sftp.file("/tmp/seeder_ibu_ekompak.sql", "w") as f:
        f.write(sql)
    sftp.close()

    cmd = "docker exec -i supabase-db psql -U postgres -d postgres < /tmp/seeder_ibu_ekompak.sql"
    stdin, stdout, stderr = client.exec_command(cmd)
    print(stdout.read().decode())
    err = stderr.read().decode()
    if err:
        print("STDERR:", err)
    client.close()


def main():
    if not CSV_PATH.exists():
        sys.exit(f"CSV tidak ditemukan: {CSV_PATH}")
    rows = parse_csv(CSV_PATH)
    sql, users, n_entries, n_monitoring = build_sql(rows)

    if "--dry-run" in sys.argv:
        print(sql)
        return

    print(f"Baris CSV  : {len(rows)}")
    print(f"Akun       : {len(users)}")
    print(f"Entries    : {n_entries}")
    print(f"Monitoring : {n_monitoring}")
    print()
    run_remote(sql)
    print()
    print("Selesai. Kredensial akun (password sama untuk semua):")
    print(f"  password : {PASSWORD}")
    for nama, uname in users:
        print(f"  {nama:<12} {uname}@{EMAIL_DOMAIN}")


if __name__ == "__main__":
    main()

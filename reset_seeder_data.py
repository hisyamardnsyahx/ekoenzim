import paramiko
import os

host = os.environ.get('SSH_HOST', '103.253.213.250')
user = os.environ.get('SSH_USER', 'root')
password = os.environ.get('SSH_PASSWORD', '')

sql_content = '''
-- Reset semua data hasil seeder, KECUALI akun (auth.users + profiles) dan program_meta
BEGIN;

-- Hapus monitoring_comments dulu (FK ke monitoring)
DELETE FROM public.monitoring_comments;

-- Hapus data utama hasil seeder
DELETE FROM public.entries;
DELETE FROM public.monitoring;
DELETE FROM public.chat_messages;
DELETE FROM public.jadwal_prefs;

COMMIT;

-- Tampilkan sisa data untuk verifikasi
SELECT 'profiles' AS tabel, count(*) FROM public.profiles
UNION ALL
SELECT 'entries', count(*) FROM public.entries
UNION ALL
SELECT 'monitoring', count(*) FROM public.monitoring
UNION ALL
SELECT 'chat_messages', count(*) FROM public.chat_messages
UNION ALL
SELECT 'jadwal_prefs', count(*) FROM public.jadwal_prefs;
'''

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, port=22, username=user, password=password, timeout=10)

sftp = client.open_sftp()
with sftp.file('/tmp/reset_data.sql', 'w') as f:
    f.write(sql_content)
sftp.close()

stdin, stdout, stderr = client.exec_command('docker exec -i supabase-db psql -U postgres -d postgres < /tmp/reset_data.sql')
print(stdout.read().decode())
err = stderr.read().decode()
if err: print('STDERR:', err)

client.close()
print('Done! Akun tetap aman, data seeder sudah dihapus.')

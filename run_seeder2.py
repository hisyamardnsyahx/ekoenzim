import paramiko
import os

host = os.environ.get('SSH_HOST', '103.253.213.250')
user = os.environ.get('SSH_USER', 'root')
password = os.environ.get('SSH_PASSWORD', '')

sql_content = '''
DO '
DECLARE
    u_rec RECORD;
    cat TEXT;
    i INT;
    j INT;
    d_date DATE;
    start_date DATE := CURRENT_DATE - INTERVAL ''150 days'';
    penggunaan_arr TEXT[] := ARRAY[''Eko-Enzim'', ''Ember Tumpuk (Kompos)'', ''Pakan Maggot/Ternak'', ''Lainnya''];
    p_weight NUMERIC;
BEGIN
    DELETE FROM public.entries;
    DELETE FROM public.monitoring;
    
    FOR u_rec IN SELECT id FROM public.profiles WHERE role = ''user'' LOOP
        FOR i IN 0..150 LOOP
            d_date := start_date + i;
            
            FOR j IN 1..(floor(random() * 4 + 1)) LOOP
                cat := penggunaan_arr[floor(random() * array_length(penggunaan_arr, 1) + 1)];
                p_weight := round((random() * 5 + 0.5)::numeric, 2);
                
                INSERT INTO public.entries (user_id, tanggal, berat_awal, penggunaan, berat_penggunaan, berat_akhir)
                VALUES (
                    u_rec.id, 
                    d_date, 
                    p_weight + 0.2, 
                    cat, 
                    p_weight, 
                    0.2
                );
            END LOOP;
            
            IF mod(i, 7) = 0 THEN
                INSERT INTO public.monitoring (user_id, tanggal, deskripsi, status, volume_terolah, admin_komentar, admin_komentar_at)
                VALUES (
                    u_rec.id,
                    d_date,
                    ''Laporan mingguan kondisi baik, tidak ada belatung. Proses fermentasi berjalan.'',
                    ''Baik'',
                    round((random() * 10 + 5)::numeric, 2),
                    CASE WHEN random() > 0.5 THEN ''Terima kasih laporan rutinnya, terus tingkatkan ya!'' ELSE NULL END,
                    CASE WHEN random() > 0.5 THEN now() ELSE NULL END
                );
            END IF;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE ''Seeder lengkap untuk semua user berhasil dieksekusi.'';
END ';
'''

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, port=22, username=user, password=password, timeout=10)

sftp = client.open_sftp()
with sftp.file('/tmp/seeder3.sql', 'w') as f:
    f.write(sql_content)
sftp.close()

stdin, stdout, stderr = client.exec_command('docker exec -i supabase-db psql -U postgres -d postgres < /tmp/seeder3.sql')
print(stdout.read().decode())
err = stderr.read().decode()
if err: print('ERROR:', err)

client.close()

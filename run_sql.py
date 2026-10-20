import paramiko
import os
import sys

host = os.environ.get('SSH_HOST', '103.253.213.250')
user = os.environ.get('SSH_USER', 'root')
password = os.environ.get('SSH_PASSWORD', '')

sql_content = '''
CREATE TABLE IF NOT EXISTS public.monitoring_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monitoring_id UUID NOT NULL REFERENCES public.monitoring(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS monitoring_comments_monitoring_id_idx ON public.monitoring_comments(monitoring_id);

ALTER TABLE public.monitoring_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS comments_select ON public.monitoring_comments;
CREATE POLICY comments_select ON public.monitoring_comments FOR SELECT
    USING (
        is_admin() OR 
        monitoring_id IN (SELECT id FROM public.monitoring WHERE user_id = auth.uid()) OR
        user_id = auth.uid()
    );

DROP POLICY IF EXISTS comments_insert ON public.monitoring_comments;
CREATE POLICY comments_insert ON public.monitoring_comments FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND (
            is_admin() OR 
            monitoring_id IN (SELECT id FROM public.monitoring WHERE user_id = auth.uid())
        )
    );
'''

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, port=22, username=user, password=password, timeout=10)

sftp = client.open_sftp()
with sftp.file('/tmp/migrate.sql', 'w') as f:
    f.write(sql_content)
sftp.close()

stdin, stdout, stderr = client.exec_command('docker exec -i supabase-db psql -U postgres -d postgres < /tmp/migrate.sql')
print(stdout.read().decode())
err = stderr.read().decode()
if err: print('ERROR:', err)

client.close()

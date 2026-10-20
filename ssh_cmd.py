
import paramiko
import os
import sys

host = os.environ.get('SSH_HOST', '103.253.213.250')
user = os.environ.get('SSH_USER', 'root')
password = os.environ.get('SSH_PASSWORD', '')
cmd = sys.argv[1]

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, port=22, username=user, password=password, timeout=10)
    
    stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
    out = stdout.read().decode()
    err = stderr.read().decode()
    
    if out:
        print(out)
    if err:
        print('STDERR:', err)
        
    client.close()
except Exception as e:
    print('Error:', e)


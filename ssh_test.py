
import paramiko
import os
import sys
import time

host = os.environ.get('SSH_HOST', '103.253.213.250')
user = os.environ.get('SSH_USER', 'root')
password = os.environ.get('SSH_PASSWORD', '')

try:
    print('Connecting...')
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, port=22, username=user, password=password, timeout=10)
    print('Connected successfully!')
    
    stdin, stdout, stderr = client.exec_command('uname -a', timeout=10)
    print('Output:')
    print(stdout.read().decode())
    
    client.close()
except Exception as e:
    print('Error:', e)


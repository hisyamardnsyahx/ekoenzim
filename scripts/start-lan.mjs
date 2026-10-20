/**
 * Start Expo on LAN using a real Wi‑Fi/LAN IPv4 (skip ZeroTier/VPN 10.x).
 * Fixes Expo Go: "failed to update remote update" when Metro advertises the wrong NIC.
 */
import { networkInterfaces } from 'node:os';
import { spawn } from 'node:child_process';

const SKIP_PREFIXES = [
  '10.', // ZeroTier / many VPN pools
  '127.',
  '169.254.', // link-local
  '172.16.',
  '172.17.',
  '172.18.',
  '172.19.',
  '172.20.',
  '172.21.',
  '172.22.',
  '172.23.',
  '172.24.',
  '172.25.',
  '172.26.',
  '172.27.',
  '172.28.',
  '172.29.',
  '172.30.',
  '172.31.',
];

function isLikelyLan(ip) {
  if (!ip || ip.includes(':')) return false; // skip IPv6
  if (SKIP_PREFIXES.some((p) => ip.startsWith(p))) return false;
  // Prefer private home/office ranges
  return ip.startsWith('192.168.') || ip.startsWith('100.');
}

function pickLanIp() {
  if (process.env.REACT_NATIVE_PACKAGER_HOSTNAME) {
    return process.env.REACT_NATIVE_PACKAGER_HOSTNAME;
  }

  const nets = networkInterfaces();
  const candidates = [];

  for (const [name, addrs] of Object.entries(nets)) {
    if (!addrs) continue;
    const lower = name.toLowerCase();
    // Prefer Wi‑Fi / Ethernet names; deprioritize virtual adapters
    const isVirtual =
      lower.includes('zerotier') ||
      lower.includes('vmware') ||
      lower.includes('virtual') ||
      lower.includes('vethernet') ||
      lower.includes('hyper-v') ||
      lower.includes('docker') ||
      lower.includes('wsl') ||
      lower.includes('loopback');

    for (const a of addrs) {
      if (a.family !== 'IPv4' && a.family !== 4) continue;
      if (a.internal) continue;
      if (!isLikelyLan(a.address)) continue;
      candidates.push({
        ip: a.address,
        name,
        score: isVirtual ? 0 : lower.includes('wi-fi') || lower.includes('wifi') || lower.includes('wlan') ? 3 : 2,
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.ip ?? null;
}

const host = pickLanIp();
const extraArgs = process.argv.slice(2);

if (host) {
  process.env.REACT_NATIVE_PACKAGER_HOSTNAME = host;
  console.log(`[start-lan] REACT_NATIVE_PACKAGER_HOSTNAME=${host}`);
  console.log('[start-lan] HP harus satu Wi‑Fi. Matikan VPN/ZeroTier di HP bila masih gagal.');
} else {
  console.warn(
    '[start-lan] Tidak menemukan IP 192.168.x. Set manual:\n' +
      '  $env:REACT_NATIVE_PACKAGER_HOSTNAME="192.168.x.x"\n' +
      '  atau pakai: pnpm start:tunnel',
  );
}

const child = spawn(
  'npx',
  ['expo', 'start', '--lan', ...extraArgs],
  {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  },
);

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});

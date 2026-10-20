import {
  hitungBeratAkhir,
  type EntriRow,
  type KondisiStatus,
  type ProduksiBulanan,
  aggregateProduksiBulanan,
  ringkasanBulanIni,
  totalSampahTerolah,
} from '@/lib/domain';
import { buildMonitoringPayload } from '@/lib/monitoring-payload';
import { toAuthEmail, aggregateProduksiHarian } from '@/lib/domain';
import {
  supabase,
  supabaseAdmin,
  type ChatMessageDb,
  type EntryRowDb,
  type MonitoringRowDb,
  type Profile,
  type ProgramMeta,
  type JadwalPrefDb,
} from '@/lib/supabase';
import { jadwalDefault, type JadwalItem, type MonitoringEntri } from '@/constants/mock-data';

function throwApi(error: { message: string } | null | undefined, fallback: string): never {
  throw new Error(error?.message || fallback);
}

function mapEntry(row: EntryRowDb): EntriRow {
  return {
    id: row.id,
    tanggal: row.tanggal,
    beratAwal: Number(row.berat_awal),
    penggunaan: row.penggunaan,
    beratPenggunaan: Number(row.berat_penggunaan),
    beratAkhir: Number(row.berat_akhir),
  };
}

function mapMonitoring(row: MonitoringRowDb, namaFallback = ''): MonitoringEntri {
  return {
    id: row.id,
    userId: row.user_id,
    namaUser: row.profiles?.nama_lengkap || namaFallback,
    tanggal: row.tanggal,
    fotoUrl: row.foto_url || '',
    deskripsi: row.deskripsi,
    status: row.status as KondisiStatus,
    volumeTerolah: Number(row.volume_terolah) || 0,
    adminKomentar: row.admin_komentar?.trim() || undefined,
    adminKomentarAt: row.admin_komentar_at || undefined,
  };
}

export async function probeSupabase(): Promise<{ ok: boolean; detail: string }> {
  try {
    const { error } = await supabase.from('program_meta').select('id').limit(1);
    if (error) return { ok: false, detail: error.message };
    return { ok: true, detail: 'program_meta reachable' };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : String(e) };
  }
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throwApi(error, 'Gagal memuat profil');
  return data as Profile | null;
}

export async function fetchProgramMeta(): Promise<ProgramMeta> {
  const { data, error } = await supabase.from('program_meta').select('*').eq('id', 1).maybeSingle();
  if (error) throwApi(error, 'Gagal memuat data program');
  if (!data) {
    return {
      id: 1,
      nama: 'Program Kompos',
      mitra: 'PKM PM UGM E-KOMPAK',
      lokasi: '-',
      banner_url: null,
    };
  }
  return data as ProgramMeta;
}

export async function fetchEntries(userId: string): Promise<EntriRow[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .order('tanggal', { ascending: false });
  if (error) throwApi(error, 'Gagal memuat entry');
  return ((data as EntryRowDb[]) ?? []).map(mapEntry);
}

export async function createEntry(
  userId: string,
  input: { beratAwal: number; penggunaan: string; beratPenggunaan: number },
): Promise<EntriRow> {
  const beratAkhir = hitungBeratAkhir(input.beratAwal, input.beratPenggunaan);
  const tanggal = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('entries')
    .insert({
      user_id: userId,
      tanggal,
      berat_awal: input.beratAwal,
      penggunaan: input.penggunaan || '-',
      berat_penggunaan: input.beratPenggunaan,
      berat_akhir: beratAkhir,
    })
    .select('*')
    .single();
  if (error) throwApi(error, 'Gagal menyimpan entry');
  return mapEntry(data as EntryRowDb);
}

export async function fetchMonitoringComments(monitoringId: string) {
  const { data, error } = await supabase
    .from('monitoring_comments')
    .select('*, profiles(nama_lengkap, role)')
    .eq('monitoring_id', monitoringId)
    .order('created_at', { ascending: true });
  if (error) throwApi(error, 'Gagal memuat komentar');
  return data || [];
}

export async function addMonitoringComment(monitoringId: string, userId: string, body: string) {
  const { data, error } = await supabase
    .from('monitoring_comments')
    .insert({ monitoring_id: monitoringId, user_id: userId, body })
    .select('*, profiles(nama_lengkap, role)')
    .single();
  if (error) throwApi(error, 'Gagal mengirim komentar');
  return data;
}

export async function fetchMonitoringForUser(userId: string): Promise<MonitoringEntri[]> {
  const { data, error } = await supabase
    .from('monitoring')
    .select('*, profiles(nama_lengkap)')
    .eq('user_id', userId)
    .order('tanggal', { ascending: false });
  if (error) throwApi(error, 'Gagal memuat monitoring');
  return ((data as MonitoringRowDb[]) ?? []).map((r) => mapMonitoring(r));
}

export async function createMonitoring(
  userId: string,
  namaUser: string,
  input: {
    deskripsi: string;
    status: KondisiStatus;
    fotoUrl?: string;
    volumeTerolah?: number;
  },
): Promise<MonitoringEntri> {
  const payload = buildMonitoringPayload(input);
  const tanggal = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('monitoring')
    .insert({
      user_id: userId,
      tanggal,
      foto_url: payload.fotoUrl || null,
      deskripsi: payload.deskripsi,
      status: payload.status,
      volume_terolah: payload.volumeTerolah,
    })
    .select('*, profiles(nama_lengkap)')
    .single();
  if (error) throwApi(error, 'Gagal menyimpan monitoring');
  return mapMonitoring(data as MonitoringRowDb, namaUser);
}

export async function fetchAllMonitoring(): Promise<MonitoringEntri[]> {
  const { data, error } = await supabase
    .from('monitoring')
    .select('*, profiles(nama_lengkap)')
    .order('tanggal', { ascending: false });
  if (error) throwApi(error, 'Gagal memuat laporan monitoring');
  return ((data as MonitoringRowDb[]) ?? []).map((r) => mapMonitoring(r));
}

/** Admin: simpan / hapus (string kosong) komentar pada entri monitoring. */
export async function updateMonitoringAdminKomentar(
  monitoringId: string,
  komentar: string,
): Promise<MonitoringEntri> {
  const body = komentar.trim();
  const { data, error } = await supabase
    .from('monitoring')
    .update({
      admin_komentar: body || null,
      admin_komentar_at: body ? new Date().toISOString() : null,
    })
    .eq('id', monitoringId)
    .select('*, profiles(nama_lengkap)')
    .single();
  if (error) throwApi(error, 'Gagal menyimpan komentar admin');
  return mapMonitoring(data as MonitoringRowDb);
}

export async function fetchJadwal(userId: string): Promise<JadwalItem[]> {
  const { data, error } = await supabase.from('jadwal_prefs').select('*').eq('user_id', userId);
  if (error) throwApi(error, 'Gagal memuat jadwal');
  const rows = (data as JadwalPrefDb[]) ?? [];
  if (!rows.length) {
    const seeds = jadwalDefault.map((j) => ({
      user_id: userId,
      jadwal_key: j.id,
      judul: j.judul,
      frekuensi: j.frekuensi,
      aktif: j.aktif,
    }));
    const { error: insErr } = await supabase.from('jadwal_prefs').insert(seeds);
    if (insErr) throwApi(insErr, 'Gagal membuat jadwal default');
    return [...jadwalDefault];
  }
  return rows.map((r) => ({
    id: r.jadwal_key,
    judul: r.judul,
    frekuensi: r.frekuensi,
    aktif: r.aktif,
  }));
}

export async function setJadwalAktif(
  userId: string,
  jadwalKey: string,
  aktif: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('jadwal_prefs')
    .update({ aktif })
    .eq('user_id', userId)
    .eq('jadwal_key', jadwalKey);
  if (error) throwApi(error, 'Gagal mengubah pengingat');
}

export async function fetchChat(userId: string): Promise<ChatMessageDb[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throwApi(error, 'Gagal memuat chat');
  return (data as ChatMessageDb[]) ?? [];
}

export async function sendChat(
  userId: string,
  body: string,
  senderRole: 'user' | 'admin' = 'user',
): Promise<ChatMessageDb> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ user_id: userId, sender_role: senderRole, body })
    .select('*')
    .single();
  if (error) throwApi(error, 'Gagal mengirim pesan');
  return data as ChatMessageDb;
}

export async function fetchAllUsersWithChats(): Promise<(Profile & { last_message?: string, last_message_time?: string, unread_count: number })[]> {
  const users = await fetchAllUsers();
  const { data: chats, error } = await supabase
    .from('chat_messages')
    .select('user_id, body, sender_role, is_read, created_at')
    .order('created_at', { ascending: false });
  if (error) throwApi(error, 'Gagal memuat daftar chat');
  const userChatMap = new Map();
  const unreadCountMap = new Map();
  if (chats) {
    for (const chat of chats) {
      if (!userChatMap.has(chat.user_id)) {
        userChatMap.set(chat.user_id, chat);
      }
      if (chat.sender_role === 'user' && !chat.is_read) {
        unreadCountMap.set(chat.user_id, (unreadCountMap.get(chat.user_id) || 0) + 1);
      }
    }
  }
  return users.map(u => ({
    ...u,
    last_message: userChatMap.get(u.id)?.body,
    last_message_time: userChatMap.get(u.id)?.created_at,
    unread_count: unreadCountMap.get(u.id) || 0
  })).filter(u => u.last_message);
}

export async function fetchAllUsers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throwApi(error, 'Gagal memuat daftar user');
  return (data as Profile[]) ?? [];
}

export async function setUserAktif(userId: string, aktif: boolean): Promise<void> {
  const { error } = await supabase.from('profiles').update({ aktif }).eq('id', userId);
  if (error) throwApi(error, 'Gagal mengubah status user');
}

export type AdminUserInput = {
  emailOrPhone: string;
  password?: string;
  namaLengkap: string;
  alamat?: string;
  umur?: number | null;
  role?: 'user' | 'admin';
  aktif?: boolean;
};

/** Create auth user + profile (admin). Password required. */
export async function adminCreateUser(input: AdminUserInput): Promise<Profile> {
  if (!input.password || input.password.length < 6) {
    throw new Error('Kata sandi minimal 6 karakter.');
  }
  if (!input.namaLengkap.trim()) throw new Error('Nama lengkap wajib diisi.');
  const email = toAuthEmail(input.emailOrPhone);
  const isPhone = !input.emailOrPhone.includes('@');
  const hp = isPhone ? input.emailOrPhone.trim() : null;
  const role = input.role ?? 'user';

  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      nama_lengkap: input.namaLengkap.trim(),
      alamat: input.alamat?.trim() || null,
      umur: input.umur != null ? String(input.umur) : null,
      hp,
      role,
    },
  });
  if (authErr) throwApi(authErr, 'Gagal membuat akun auth');
  if (!authData.user) throw new Error('Gagal membuat user.');

  const row = {
    id: authData.user.id,
    email,
    hp,
    nama_lengkap: input.namaLengkap.trim(),
    alamat: input.alamat?.trim() || null,
    umur: input.umur ?? null,
    role,
    aktif: input.aktif !== false,
  };
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .upsert(row)
    .select('*')
    .single();
  if (error) throwApi(error, 'Gagal menyimpan profil');
  return data as Profile;
}

/** Update profile fields; optional password reset. */
export async function adminUpdateUser(
  userId: string,
  input: Partial<AdminUserInput> & { password?: string },
): Promise<Profile> {
  const patch: Record<string, unknown> = {};
  if (input.namaLengkap != null) patch.nama_lengkap = input.namaLengkap.trim();
  if (input.alamat !== undefined) patch.alamat = input.alamat?.trim() || null;
  if (input.umur !== undefined) patch.umur = input.umur;
  if (input.role != null) patch.role = input.role;
  if (input.aktif != null) patch.aktif = input.aktif;
  if (input.emailOrPhone != null && input.emailOrPhone.trim()) {
    const email = toAuthEmail(input.emailOrPhone);
    const isPhone = !input.emailOrPhone.includes('@');
    patch.email = email;
    patch.hp = isPhone ? input.emailOrPhone.trim() : null;
    const { error: authEmailErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email,
      user_metadata: {
        nama_lengkap: (patch.nama_lengkap as string) || undefined,
        alamat: (patch.alamat as string) || null,
        hp: patch.hp,
        role: patch.role,
      },
    });
    if (authEmailErr) throwApi(authEmailErr, 'Gagal update email auth');
  }
  if (input.password && input.password.length >= 6) {
    const { error: pwErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: input.password,
    });
    if (pwErr) throwApi(pwErr, 'Gagal ganti kata sandi');
  }

  if (Object.keys(patch).length) {
    const { data, error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', userId)
      .select('*')
      .single();
    if (error) throwApi(error, 'Gagal update profil');
    return data as Profile;
  }

  const p = await fetchProfile(userId);
  if (!p) throw new Error('User tidak ditemukan');
  return p;
}

/** Delete auth user (cascade profiles via FK). */
export async function adminDeleteUser(userId: string): Promise<void> {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) throwApi(error, 'Gagal menghapus user');
}

export async function fetchAllEntries(): Promise<EntriRow[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .order('tanggal', { ascending: false });
  if (error) throwApi(error, 'Gagal memuat data entry');
  return ((data as EntryRowDb[]) ?? []).map(mapEntry);
}

export async function getAdminStats() {
  const [users, entries] = await Promise.all([fetchAllUsers(), fetchAllEntries()]);
  const prod = aggregateProduksiBulanan(entries);
  const totals = prod.reduce(
    (acc, p) => {
      acc.ekoEnzim += p.ekoEnzim;
      acc.emberTumpuk += p.emberTumpuk;
      acc.kompos += p.kompos;
      acc.pakan += p.pakan;
      return acc;
    },
    { ekoEnzim: 0, emberTumpuk: 0, kompos: 0, pakan: 0 },
  );
  return {
    totalPengguna: users.filter((u) => u.role === 'user').length,
    totalEkoenzim: totals.ekoEnzim,
    totalEmberTumpuk: totals.emberTumpuk,
    totalKompos: totals.kompos,
    totalPakan: totals.pakan,
    totalSampah: totalSampahTerolah(entries),
    produksi: prod,
    users,
  };
}

export async function getUserMonthlySummary(userId: string): Promise<ProduksiBulanan> {
  const entries = await fetchEntries(userId);
  return ringkasanBulanIni(entries);
}

export async function getUserProduksiHarian(userId: string, year: number, month: number) {
  const entries = await fetchEntries(userId);
  return aggregateProduksiHarian(entries, year, month);
}

export async function getUserProduksiChart(userId: string): Promise<ProduksiBulanan[]> {
  const entries = await fetchEntries(userId);
  return aggregateProduksiBulanan(entries);
}




export async function markChatAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_messages')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('sender_role', 'user')
    .eq('is_read', false);
  if (error) throwApi(error, 'Gagal menandai pesan terbaca');
}

export async function fetchUnreadChatMessages(): Promise<(ChatMessageDb & { profiles?: { nama_lengkap: string } })[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*, profiles(nama_lengkap)')
    .eq('sender_role', 'user')
    .eq('is_read', false)
    .order('created_at', { ascending: false });
  if (error) throwApi(error, 'Gagal memuat pesan belum terbaca');
  return (data as any) || [];
}


export async function markAdminChatAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_messages')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('sender_role', 'admin')
    .eq('is_read', false);
  if (error) throwApi(error, 'Gagal menandai pesan terbaca');
}

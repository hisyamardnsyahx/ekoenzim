import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { toAuthEmail } from '@/lib/domain';
import { fetchProfile } from '@/lib/api';
import { supabase, type Profile } from '@/lib/supabase';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (
    emailOrPhone: string,
    password: string,
  ) => Promise<{ error?: string; profile?: Profile | null }>;
  signUp: (input: {
    emailOrPhone: string;
    password: string;
    namaLengkap: string;
    alamat: string;
    umur: number;
  }) => Promise<{ error?: string; profile?: Profile | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const p = await fetchProfile(userId);
      setProfile(p);
      return p;
    } catch {
      setProfile(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(data.session);
        if (data.session?.user) await loadProfile(data.session.user.id);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      if (s?.user) await loadProfile(s.user.id);
      else setProfile(null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (emailOrPhone: string, password: string) => {
    const email = toAuthEmail(emailOrPhone);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message || 'Email/HP atau kata sandi salah.' };
    }
    if (!data.user) return { error: 'Login gagal.' };

    const p = await loadProfile(data.user.id);
    if (p && !p.aktif) {
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
      return { error: 'Akun dinonaktifkan. Hubungi admin.' };
    }
    return { profile: p };
  }, [loadProfile]);

  const signUp = useCallback(
    async (input: {
      emailOrPhone: string;
      password: string;
      namaLengkap: string;
      alamat: string;
      umur: number;
    }) => {
      const email = toAuthEmail(input.emailOrPhone);
      const isPhone = !input.emailOrPhone.includes('@');
      const hp = isPhone ? input.emailOrPhone.trim() : null;

      const { data, error } = await supabase.auth.signUp({
        email,
        password: input.password,
        options: {
          data: {
            nama_lengkap: input.namaLengkap,
            alamat: input.alamat,
            umur: String(input.umur),
            hp,
            role: 'user',
          },
        },
      });
      if (error) return { error: error.message };

      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email,
          hp,
          nama_lengkap: input.namaLengkap,
          alamat: input.alamat,
          umur: input.umur,
          role: 'user',
          aktif: true,
        });
        const p = await loadProfile(data.user.id);
        return { profile: p };
      }
      return {};
    },
    [loadProfile],
  );

  const signOut = useCallback(async () => {
    setProfile(null);
    setSession(null);
    await supabase.auth.signOut();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) await loadProfile(session.user.id);
  }, [session, loadProfile]);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [session, profile, loading, signIn, signUp, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

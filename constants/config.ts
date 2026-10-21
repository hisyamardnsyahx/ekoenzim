/**
 * Supabase connection — override via EXPO_PUBLIC_* env when available.
 * Host: self-hosted stack at https://ekoenzim.gamblingsweep.tech
 */
export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://ekoenzim.gamblingsweep.tech';

// Default keys from self-hosted Supabase JWT at https://ekoenzim.gamblingsweep.tech
export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzkyNTY4MjcxLCJleHAiOjE5NTAyNDgyNzF9.b4tE2aObjgqh2dm7DCB4vW2Bisiufmc7_SDcwLfFt_s';

export const SUPABASE_SERVICE_ROLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ??
  'dummy-service-role-key';

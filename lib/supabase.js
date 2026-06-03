import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL  || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = (url && key)
  ? createClient(url, key, {
      auth: {
        flowType: 'pkce',           // secure auth flow for OAuth
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export const isConfigured = Boolean(url && key);

export const TEAM_DOMAIN = process.env.NEXT_PUBLIC_TEAM_EMAIL_DOMAIN || 'leadwithtribe.com';

export function isAllowedEmail(email) {
  return email?.toLowerCase().endsWith('@' + TEAM_DOMAIN);
}

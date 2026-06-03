import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase, isAllowedEmail, TEAM_DOMAIN } from '../../lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('Signing you in…');

  useEffect(() => {
    if (!router.isReady) return;

    async function handleCallback() {
      const code = router.query.code;
      if (!code) {
        router.replace('/?error=missing_code');
        return;
      }

      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;

        const email = data.session?.user?.email;
        if (!isAllowedEmail(email)) {
          setStatus('Access denied — not a @' + TEAM_DOMAIN + ' account');
          await supabase.auth.signOut();
          setTimeout(() => router.replace('/?error=wrong_domain'), 2000);
          return;
        }

        setStatus('Welcome, ' + (data.session.user.user_metadata?.full_name || email) + '!');
        setTimeout(() => router.replace('/'), 800);
      } catch (err) {
        console.error('[auth callback]', err);
        router.replace('/?error=auth_failed');
      }
    }

    handleCallback();
  }, [router.isReady]);

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', fontFamily: 'var(--font-sans)', flexDirection: 'column', gap: 16,
    }}>
      <div style={{
        width: 40, height: 40, background: 'var(--accent)', borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontWeight: 600, fontSize: 20,
      }}>C</div>
      <p style={{ color: 'var(--text-2)', fontSize: 14 }}>{status}</p>
    </div>
  );
}

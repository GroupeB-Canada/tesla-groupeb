'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff } from 'lucide-react';

function LoginForm() {
  const router      = useRouter();
  const params      = useSearchParams();
  const from        = params.get('from') ?? '/live';

  const [password, setPassword] = useState('');
  const [show,     setShow]     = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, from }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? 'Erreur de connexion');
        setLoading(false);
        return;
      }

      router.push(json.redirect ?? '/live');
    } catch {
      setError('Erreur réseau');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ width: '56px', height: '56px', background: 'var(--red)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Lock size={24} color="white" />
          </div>
          <div style={{ fontWeight: 800, fontSize: '22px', letterSpacing: '-0.02em' }}>tesla.groupeb.ca</div>
          <div style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '6px' }}>Accès sécurisé au portail</div>
        </div>

        {/* Card */}
        <div className="card glow-red">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>
                MOT DE PASSE
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Entrez le mot de passe"
                  autoFocus
                  required
                  style={{
                    width: '100%', padding: '14px 44px 14px 14px',
                    borderRadius: '10px', background: 'var(--surface2)',
                    border: error ? '1px solid var(--red)' : '1px solid var(--border)',
                    color: 'white', fontSize: '15px', outline: 'none',
                    letterSpacing: show ? 'normal' : '0.12em',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '4px' }}
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {error && (
                <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--red)' }}>
                  {error}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              style={{
                width: '100%', background: !password ? '#333' : 'var(--red)',
                color: 'white', border: 'none', padding: '14px',
                borderRadius: '10px', fontWeight: 700, fontSize: '15px',
                cursor: !password ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {loading ? 'Vérification…' : 'Accéder au portail'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '12px', marginTop: '24px' }}>
          Accès réservé aux utilisateurs autorisés par{' '}
          <a href="https://groupeb.ca" style={{ color: 'var(--red)', textDecoration: 'none' }}>GroupeB.ca</a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

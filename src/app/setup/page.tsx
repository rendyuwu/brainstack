'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/setup')
      .then((r) => r.json())
      .then((data) => {
        if (!data.needsSetup) router.replace('/login');
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [router]);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Setup failed');
      } else {
        router.push('/login');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (checking) return null;

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    color: 'var(--tx-2)',
    marginBottom: 6,
    fontFamily: 'var(--font-mono)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    marginBottom: 16,
    background: 'var(--bg-3)',
    border: '1px solid var(--bd-default)',
    borderRadius: 8,
    color: 'var(--tx-1)',
    fontSize: 14,
    fontFamily: 'var(--font-sans)',
    outline: 'none',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-0)',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: 380,
          padding: 32,
          background: 'var(--bg-2)',
          border: '1px solid var(--bd-default)',
          borderRadius: 12,
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: 'var(--tx-1)',
            marginBottom: 4,
            fontFamily: 'var(--font-sans)',
          }}
        >
          BrainStack Setup
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'var(--tx-2)',
            marginBottom: 28,
            fontFamily: 'var(--font-sans)',
          }}
        >
          Create your admin account
        </p>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              marginBottom: 16,
              background: 'rgba(248,81,73,.1)',
              border: '1px solid rgba(248,81,73,.3)',
              borderRadius: 8,
              color: 'var(--red)',
              fontSize: 13,
              fontFamily: 'var(--font-sans)',
            }}
          >
            {error}
          </div>
        )}

        <label style={labelStyle}>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={inputStyle}
          placeholder="Your name"
        />

        <label style={labelStyle}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
          placeholder="admin@example.com"
        />

        <label style={labelStyle}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          style={inputStyle}
          placeholder="Min 8 characters"
        />

        <label style={labelStyle}>Confirm Password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          style={{ ...inputStyle, marginBottom: 24 }}
          placeholder="Repeat password"
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px 16px',
            background: 'var(--amber)',
            color: '#000',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            fontFamily: 'var(--font-sans)',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'opacity .15s',
          }}
        >
          {loading ? 'Creating account...' : 'Create Admin Account'}
        </button>
      </form>
    </div>
  );
}

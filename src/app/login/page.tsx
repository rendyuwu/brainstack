'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

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
          BrainStack
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'var(--tx-2)',
            marginBottom: 28,
            fontFamily: 'var(--font-sans)',
          }}
        >
          Sign in to continue
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

        <label
          style={{
            display: 'block',
            fontSize: 13,
            color: 'var(--tx-2)',
            marginBottom: 6,
            fontFamily: 'var(--font-mono)',
          }}
        >
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
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
          }}
          placeholder="admin@brainstack.dev"
        />

        <label
          style={{
            display: 'block',
            fontSize: 13,
            color: 'var(--tx-2)',
            marginBottom: 6,
            fontFamily: 'var(--font-mono)',
          }}
        >
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '10px 12px',
            marginBottom: 24,
            background: 'var(--bg-3)',
            border: '1px solid var(--bd-default)',
            borderRadius: 8,
            color: 'var(--tx-1)',
            fontSize: 14,
            fontFamily: 'var(--font-sans)',
            outline: 'none',
          }}
          placeholder="Enter your password"
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
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

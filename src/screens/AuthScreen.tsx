import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

type AuthMode = 'signin' | 'signup' | 'magic-link';

export const AuthScreen: React.FC = () => {
  const { signIn, signUp, signInWithMagicLink } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'magic-link') {
        const { error } = await signInWithMagicLink(email);
        if (error) {
          setError(error.message);
        } else {
          setMagicLinkSent(true);
        }
      } else if (mode === 'signup') {
        const { error } = await signUp(email, password);
        if (error) {
          setError(error.message);
        } else {
          setError(null);
          // Show success message - Supabase sends confirmation email by default
          setMagicLinkSent(true);
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (magicLinkSent) {
    return (
      <div className="auth-screen">
        <div className="auth-container">
          <div className="auth-header">
            <h1>Check your email</h1>
            <p>
              We sent a {mode === 'magic-link' ? 'login link' : 'confirmation link'} to{' '}
              <strong>{email}</strong>
            </p>
          </div>
          <button
            type="button"
            className="auth-button secondary"
            onClick={() => {
              setMagicLinkSent(false);
              setEmail('');
              setPassword('');
            }}
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Daily Progress</h1>
          <p>
            {mode === 'signin' && 'Welcome back'}
            {mode === 'signup' && 'Create your account'}
            {mode === 'magic-link' && 'Sign in with email link'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          {mode !== 'magic-link' && (
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
                minLength={6}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-button primary" disabled={loading}>
            {loading ? 'Loading...' : (
              <>
                {mode === 'signin' && 'Sign in'}
                {mode === 'signup' && 'Create account'}
                {mode === 'magic-link' && 'Send magic link'}
              </>
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="auth-alternatives">
          {mode === 'signin' && (
            <>
              <button
                type="button"
                className="auth-button secondary"
                onClick={() => setMode('magic-link')}
              >
                Sign in with magic link
              </button>
              <p className="auth-switch">
                Don't have an account?{' '}
                <button type="button" onClick={() => setMode('signup')}>
                  Sign up
                </button>
              </p>
            </>
          )}

          {mode === 'signup' && (
            <p className="auth-switch">
              Already have an account?{' '}
              <button type="button" onClick={() => setMode('signin')}>
                Sign in
              </button>
            </p>
          )}

          {mode === 'magic-link' && (
            <p className="auth-switch">
              <button type="button" onClick={() => setMode('signin')}>
                Back to sign in with password
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

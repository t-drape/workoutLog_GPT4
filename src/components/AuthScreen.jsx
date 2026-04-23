import { useState } from 'react';
import { Dumbbell, LogIn, UserPlus } from 'lucide-react';
import { signIn, signUp } from '../services/auth';

export default function AuthScreen() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
        setMessage('Account created. If email confirmation is enabled in Supabase, confirm your email before logging in.');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card card">
        <div className="brand">
          <div className="brand-icon"><Dumbbell size={24} /></div>
          <div>
            <h1>LiftLog</h1>
            <p>Production-ready workout tracking with Supabase</p>
          </div>
        </div>

        <div className="toggle-row">
          <button
            className={mode === 'signin' ? 'btn btn-primary' : 'btn btn-ghost'}
            onClick={() => setMode('signin')}
            type="button"
          >
            <LogIn size={16} /> Sign In
          </button>
          <button
            className={mode === 'signup' ? 'btn btn-primary' : 'btn btn-ghost'}
            onClick={() => setMode('signup')}
            type="button"
          >
            <UserPlus size={16} /> Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="stack-lg">
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </label>

          <button className="btn btn-primary btn-block" disabled={loading} type="submit">
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {message ? <div className="notice success">{message}</div> : null}
        {error ? <div className="notice error">{error}</div> : null}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: 'admin@forge.dev', password: 'Admin@123' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not sign in');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-950 text-paper-50">
      <div className="absolute inset-0 grain opacity-50" />
      <div className="absolute -left-24 top-16 hidden rotate-[-12deg] font-display text-[22vw] leading-none text-ink-700/80 lg:block">
        FORGE
      </div>
      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-6 py-12 lg:grid-cols-2">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-copper-500/40 bg-copper-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-copper-400">
            <Flame size={14} /> Project OS
          </div>
          <h1 className="font-display text-6xl leading-[0.95] md:text-7xl">
            Heat the work.
            <br />
            <span className="italic text-brass">Ship the shape.</span>
          </h1>
          <p className="mt-6 max-w-md text-paper-200/70">
            Tasks, bugs, hours and attendance — one workshop for the studio. Not another generic board.
          </p>
        </div>

        <form onSubmit={submit} className="panel shadow-stamp p-7">
          <p className="text-xs uppercase tracking-[0.25em] text-paper-200/50">Enter the shop</p>
          <h2 className="mt-2 font-display text-3xl">Sign in</h2>
          <label className="label mt-6">Email</label>
          <input className="field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <label className="label mt-4">Password</label>
          <input
            type="password"
            className="field"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {error && <p className="mt-3 text-sm text-ember">{error}</p>}
          <button disabled={busy} className="btn-copper mt-6 w-full py-3">
            {busy ? 'Opening…' : 'Open the floor'}
          </button>
          <div className="mt-5 space-y-1 text-xs text-paper-200/50">
            <p>admin@forge.dev / Admin@123</p>
            <p>manager@forge.dev / Manager@123</p>
            <p>riya@forge.dev / Employee@123</p>
          </div>
        </form>
      </div>
    </div>
  );
}

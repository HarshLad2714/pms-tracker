import { useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    department: user?.department || '',
    designation: user?.designation || '',
    currentPassword: '',
    password: '',
  });
  const [msg, setMsg] = useState('');

  async function save(e) {
    e.preventDefault();
    setMsg('');
    const { data } = await api.patch('/users/me', form);
    setUser(data.user);
    setForm((f) => ({ ...f, currentPassword: '', password: '' }));
    setMsg('Profile saved');
  }

  async function uploadAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('files', file);
    const { data } = await api.post('/uploads', fd);
    const url = data.files[0]?.url;
    if (!url) return;
    const res = await api.patch('/users/me', { avatar: url });
    setUser(res.data.user);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-copper-400">Account</p>
        <h1 className="font-display text-4xl">Profile</h1>
      </div>
      <form onSubmit={save} className="panel space-y-4 p-6">
        <div className="flex items-center gap-4">
          <Avatar user={user} size="lg" />
          <label className="btn-ghost cursor-pointer">
            Change avatar
            <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
          </label>
        </div>
        <input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <p className="text-sm text-paper-200/50">{user?.email} · {user?.role}</p>
        <div className="grid gap-3 md:grid-cols-2">
          <input className="field" placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          <input className="field" placeholder="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
        </div>
        <label className="label">Change password</label>
        <input type="password" className="field" placeholder="Current password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
        <input type="password" className="field" placeholder="New password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {msg && <p className="text-sm text-moss">{msg}</p>}
        <button className="btn-copper">Save profile</button>
      </form>
    </div>
  );
}

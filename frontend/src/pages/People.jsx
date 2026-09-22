import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import api from '../api/client';
import Avatar from '../components/Avatar';
import Modal from '../components/Modal';
import DataTable from '../components/DataTable';

export default function People() {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [role, setRole] = useState('');
  const [active, setActive] = useState('');

  async function load() {
    const { data } = await api.get('/users');
    setUsers(data.users);
  }

  useEffect(() => {
    load();
  }, []);

  const rows = useMemo(
    () =>
      users.filter((u) => {
        if (role && u.role !== role) return false;
        if (active === 'active' && !u.isActive) return false;
        if (active === 'off' && u.isActive) return false;
        return true;
      }),
    [users, role, active]
  );

  const columns = [
    {
      key: 'name',
      header: 'Person',
      exportValue: (u) => u.name,
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar user={u} />
          <div>
            <p>{u.name}</p>
            <p className="text-xs text-paper-200/50">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'email', header: 'Email', render: (u) => u.email },
    { key: 'role', header: 'Role', render: (u) => <span className="uppercase tracking-wider text-brass">{u.role}</span> },
    { key: 'department', header: 'Department' },
    { key: 'designation', header: 'Designation' },
    {
      key: 'isActive',
      header: 'Status',
      exportValue: (u) => (u.isActive ? 'active' : 'off'),
      render: (u) => <span className={u.isActive ? 'text-moss' : 'text-ember'}>{u.isActive ? 'active' : 'off'}</span>,
    },
    {
      key: 'joiningDate',
      header: 'Joined',
      exportValue: (u) => (u.joiningDate ? format(new Date(u.joiningDate), 'yyyy-MM-dd') : ''),
      render: (u) => (u.joiningDate ? format(new Date(u.joiningDate), 'dd MMM yyyy') : '—'),
    },
    {
      key: 'actions',
      header: '',
      exportValue: () => '',
      render: (u) => (
        <button className="btn-ghost" onClick={() => setEdit(u)}>
          Edit
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-copper-400">Crew</p>
          <h1 className="font-display text-4xl">People</h1>
        </div>
        <button className="btn-copper" onClick={() => setOpen(true)}>
          Add person
        </button>
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        searchKeys={['name', 'email', 'department', 'designation']}
        searchPlaceholder="Search name, email, team…"
        filename="people"
        filters={
          <>
            <select className="field w-36" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">All roles</option>
              <option value="admin">admin</option>
              <option value="manager">manager</option>
              <option value="employee">employee</option>
            </select>
            <select className="field w-36" value={active} onChange={(e) => setActive(e.target.value)}>
              <option value="">All status</option>
              <option value="active">active</option>
              <option value="off">off</option>
            </select>
          </>
        }
      />
      {(open || edit) && (
        <PersonForm
          initial={edit}
          onClose={() => {
            setOpen(false);
            setEdit(null);
          }}
          onSaved={() => {
            setOpen(false);
            setEdit(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function PersonForm({ initial, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    email: initial?.email || '',
    password: '',
    role: initial?.role || 'employee',
    department: initial?.department || '',
    designation: initial?.designation || '',
    joiningDate: initial?.joiningDate?.slice(0, 10) || '',
    isActive: initial?.isActive ?? true,
  });
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    try {
      if (initial) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await api.patch(`/users/${initial._id}`, payload);
      } else {
        await api.post('/users', form);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save person');
    }
  }

  return (
    <Modal title={initial ? 'Update person' : 'Invite to the shop'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <input className="field" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="field" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="field" type="password" placeholder={initial ? 'New password (optional)' : 'Password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <select className="field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="admin">admin</option>
            <option value="manager">manager</option>
            <option value="employee">employee</option>
          </select>
          <input className="field" placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
        </div>
        <input className="field" placeholder="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
        <input type="date" className="field" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} />
        {initial && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Active
          </label>
        )}
        {error && <p className="text-sm text-ember">{error}</p>}
        <button className="btn-copper w-full">Save</button>
      </form>
    </Modal>
  );
}

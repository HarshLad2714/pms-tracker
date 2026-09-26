import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { pretty, PROJECT_STATUS } from '../lib/labels';
import Avatar from '../components/Avatar';
import Modal from '../components/Modal';
import DataTable from '../components/DataTable';
import SearchSelect, { peopleOptions } from '../components/SearchSelect';

export default function Projects() {
  const { isLead } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');

  async function load() {
    const q = status ? `?status=${status}` : '';
    const [{ data: p }, { data: u }] = await Promise.all([api.get(`/projects${q}`), api.get('/users?active=true')]);
    setProjects(p.projects);
    setUsers(u.users);
  }

  useEffect(() => {
    load();
  }, [status]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-copper-400">Yards</p>
          <h1 className="font-display text-4xl">Projects</h1>
        </div>
        {isLead && (
          <button className="btn-copper" onClick={() => setOpen(true)}>
            New project
          </button>
        )}
      </div>

      <DataTable
        columns={[
          {
            key: 'name',
            header: 'Project',
            render: (p) => (
              <Link to={`/projects/${p._id}`} className="hover:text-brass">
                {p.name}
              </Link>
            ),
          },
          { key: 'description', header: 'Brief', render: (p) => <span className="line-clamp-1 max-w-xs">{p.description || '—'}</span> },
          { key: 'status', header: 'Status', exportValue: (p) => pretty(p.status), render: (p) => pretty(p.status) },
          {
            key: 'members',
            header: 'Crew',
            exportValue: (p) => (p.members || []).map((m) => m.name).join('; '),
            render: (p) => (
              <div className="flex -space-x-2">
                {p.members.slice(0, 5).map((m) => (
                  <Avatar key={m._id} user={m} size="sm" />
                ))}
              </div>
            ),
          },
          {
            key: 'deadline',
            header: 'Deadline',
            exportValue: (p) => (p.deadline ? format(new Date(p.deadline), 'yyyy-MM-dd') : ''),
            render: (p) => (p.deadline ? format(new Date(p.deadline), 'dd MMM yyyy') : 'Open'),
          },
        ]}
        rows={projects}
        searchKeys={['name', 'description', (p) => pretty(p.status), (p) => (p.members || []).map((m) => m.name).join(' ')]}
        searchPlaceholder="Search projects or people…"
        filename="projects"
        empty="No yards yet."
        filters={
          <select className="field w-40" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All states</option>
            {PROJECT_STATUS.map((s) => (
              <option key={s} value={s}>
                {pretty(s)}
              </option>
            ))}
          </select>
        }
      />

      {open && (
        <ProjectForm
          users={users}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}

export function ProjectForm({ users, onClose, onSaved, initial }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    startDate: initial?.startDate?.slice(0, 10) || '',
    deadline: initial?.deadline?.slice(0, 10) || '',
    status: initial?.status || 'active',
    members: initial?.members?.map((m) => m._id || m) || [],
  });
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    try {
      if (initial?._id) await api.patch(`/projects/${initial._id}`, form);
      else await api.post('/projects', form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save project');
    }
  }

  return (
    <Modal title={initial ? 'Temper the project' : 'Open a new yard'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <input className="field" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <textarea className="field min-h-24" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <input type="date" className="field" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          <input type="date" className="field" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
        </div>
        <select className="field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          {PROJECT_STATUS.map((s) => (
            <option key={s} value={s}>
              {pretty(s)}
            </option>
          ))}
        </select>
        <SearchSelect
          options={peopleOptions(users)}
          value={form.members}
          onChange={(members) => setForm({ ...form, members })}
          placeholder="Add members"
          searchPlaceholder="Search members…"
        />
        {error && <p className="text-sm text-ember">{error}</p>}
        <button className="btn-copper w-full">Save</button>
      </form>
    </Modal>
  );
}

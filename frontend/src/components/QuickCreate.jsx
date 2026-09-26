import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import Modal from './Modal';
import RichEditor from './RichEditor';
import SearchSelect, { peopleOptions } from './SearchSelect';
import { PRIORITY, TYPES } from '../lib/labels';

export default function QuickCreate({ onClose }) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    type: 'task',
    project: '',
    title: '',
    description: '',
    priority: 'medium',
    startDate: '',
    dueDate: '',
    tags: '',
    assignees: [],
    estimatedMinutes: 120,
  });

  useEffect(() => {
    Promise.all([api.get('/projects'), api.get('/users?active=true')]).then(([{ data: p }, { data: u }]) => {
      setProjects(p.projects);
      setUsers(u.users);
      setForm((f) => ({ ...f, project: f.project || p.projects[0]?._id || '' }));
    });
  }, []);

  async function submit(e) {
    e.preventDefault();
    try {
      const { data } = await api.post('/tasks', {
        ...form,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      onClose();
      navigate(`/tasks/${data.task._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create');
    }
  }

  return (
    <Modal title="Create issue" onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid gap-3 md:grid-cols-3">
          <select className="field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {Object.keys(TYPES).map((t) => (
              <option key={t} value={t}>
                {TYPES[t].label}
              </option>
            ))}
          </select>
          <select className="field" value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })}>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
          <select className="field" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            {Object.keys(PRIORITY).map((p) => (
              <option key={p} value={p}>
                {PRIORITY[p].label}
              </option>
            ))}
          </select>
        </div>
        <input className="field" placeholder="Summary" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <RichEditor value={form.description} onChange={(description) => setForm({ ...form, description })} minHeight="10rem" />
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="label">Start</label>
            <input type="date" className="field" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </div>
          <div>
            <label className="label">Due</label>
            <input type="date" className="field" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </div>
        </div>
        <input className="field" placeholder="Labels, comma separated" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
        <SearchSelect
          options={peopleOptions(users)}
          value={form.assignees}
          onChange={(assignees) => setForm({ ...form, assignees })}
          placeholder="Assignees"
        />
        {error && <p className="text-sm text-ember">{error}</p>}
        <button className="btn-copper w-full">Create</button>
      </form>
    </Modal>
  );
}

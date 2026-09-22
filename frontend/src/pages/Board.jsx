import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DndContext, PointerSensor, closestCorners, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import api from '../api/client';
import { PRIORITY, STATUS, pretty } from '../lib/labels';
import Avatar from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import DataTable from '../components/DataTable';

export default function Board() {
  const { isLead } = useAuth();
  const [params, setParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [view, setView] = useState(params.get('view') || 'board');
  const [formOpen, setFormOpen] = useState(false);
  const filters = {
    project: params.get('project') || '',
    assignee: params.get('assignee') || '',
    priority: params.get('priority') || '',
    tag: params.get('tag') || '',
    mine: params.get('mine') || '',
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function load() {
    const q = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && q.set(k, v));
    const [{ data: t }, { data: p }, { data: u }] = await Promise.all([
      api.get(`/tasks?${q.toString()}`),
      api.get('/projects'),
      api.get('/users?active=true'),
    ]);
    setTasks(t.tasks);
    setProjects(p.projects);
    setUsers(u.users);
  }

  useEffect(() => {
    load();
  }, [params.toString()]);

  function setFilter(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }

  const grouped = useMemo(() => {
    const map = Object.fromEntries(STATUS.map((s) => [s.id, []]));
    tasks.forEach((t) => {
      if (map[t.status]) map[t.status].push(t);
    });
    return map;
  }, [tasks]);

  async function onDragEnd(event) {
    const { active, over } = event;
    if (!over) return;
    const overStatus = over.data.current?.status || over.id;
    const task = tasks.find((t) => t._id === active.id);
    if (!task || task.status === overStatus) return;
    setTasks((prev) => prev.map((t) => (t._id === task._id ? { ...t, status: overStatus } : t)));
    await api.patch(`/tasks/${task._id}/move`, { status: overStatus });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-copper-400">Flow</p>
          <h1 className="font-display text-4xl">The board</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {['board', 'list'].map((v) => (
            <button key={v} onClick={() => setView(v)} className={view === v ? 'btn-copper' : 'btn-ghost'}>
              {v}
            </button>
          ))}
          {isLead && (
            <button className="btn-copper" onClick={() => setFormOpen(true)}>
              New task
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <select className="field" value={filters.project} onChange={(e) => setFilter('project', e.target.value)}>
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
        <select className="field" value={filters.assignee} onChange={(e) => setFilter('assignee', e.target.value)}>
          <option value="">All people</option>
          {users.map((u) => (
            <option key={u._id} value={u._id}>
              {u.name}
            </option>
          ))}
        </select>
        <select className="field" value={filters.priority} onChange={(e) => setFilter('priority', e.target.value)}>
          <option value="">All heat</option>
          {Object.keys(PRIORITY).map((p) => (
            <option key={p} value={p}>
              {PRIORITY[p].label}
            </option>
          ))}
        </select>
        <input className="field" placeholder="Tag" value={filters.tag} onChange={(e) => setFilter('tag', e.target.value)} />
        <button className={filters.mine ? 'btn-copper' : 'btn-ghost'} onClick={() => setFilter('mine', filters.mine ? '' : 'true')}>
          My tasks
        </button>
      </div>

      {view === 'list' ? (
        <DataTable
          columns={[
            {
              key: 'title',
              header: 'Task',
              render: (t) => (
                <Link to={`/tasks/${t._id}`} className="hover:text-brass">
                  {t.title}
                </Link>
              ),
            },
            { key: 'project', header: 'Project', exportValue: (t) => t.project?.name, render: (t) => t.project?.name || '—' },
            {
              key: 'priority',
              header: 'Priority',
              render: (t) => <span className={`chip ${PRIORITY[t.priority]?.className}`}>{t.priority}</span>,
            },
            { key: 'status', header: 'Status', exportValue: (t) => pretty(t.status), render: (t) => pretty(t.status) },
            {
              key: 'assignees',
              header: 'Assignees',
              exportValue: (t) => (t.assignees || []).map((a) => a.name).join('; '),
              render: (t) => (
                <div className="flex -space-x-2">
                  {t.assignees?.slice(0, 3).map((u) => (
                    <Avatar key={u._id} user={u} size="sm" />
                  ))}
                </div>
              ),
            },
            {
              key: 'dueDate',
              header: 'Due',
              exportValue: (t) => (t.dueDate ? format(new Date(t.dueDate), 'yyyy-MM-dd') : ''),
              render: (t) => (t.dueDate ? format(new Date(t.dueDate), 'dd MMM') : '—'),
            },
            {
              key: 'bugs',
              header: 'Bugs',
              exportValue: (t) => t.openBugCount || 0,
              render: (t) => t.openBugCount || 0,
            },
          ]}
          rows={tasks}
          searchKeys={['title', 'priority', (t) => t.project?.name, (t) => pretty(t.status), (t) => (t.assignees || []).map((a) => a.name).join(' ')]}
          searchPlaceholder="Search tasks…"
          filename="board-tasks"
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
          <div className="grid gap-4 xl:grid-cols-5 lg:grid-cols-3 md:grid-cols-2">
            {STATUS.map((col) => (
              <Column key={col.id} col={col} tasks={grouped[col.id]} />
            ))}
          </div>
        </DndContext>
      )}

      {formOpen && (
        <TaskForm
          projects={projects}
          users={users}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function Column({ col, tasks }) {
  const { setNodeRef } = useDroppable({ id: col.id, data: { status: col.id } });
  return (
    <div ref={setNodeRef} className="min-h-[420px] rounded-2xl border border-ink-600 bg-ink-950/40 p-3">
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <p className="font-display text-xs text-brass">{col.mark}</p>
          <h3 className="text-sm uppercase tracking-[0.16em]">{col.label}</h3>
        </div>
        <span className="text-xs text-paper-200/40">{tasks.length}</span>
      </div>
      <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task._id} task={task} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

function Card({ task }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task._id, data: { status: task.status } });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className="rounded-xl border border-ink-600 bg-ink-800 p-3 shadow-card">
      <button type="button" className="mb-2 text-[10px] uppercase tracking-[0.18em] text-paper-200/30" {...attributes} {...listeners}>
        drag
      </button>
      <Link to={`/tasks/${task._id}`} className="block">
        <div className="mb-2 flex items-center justify-between">
          <span className={`chip ${PRIORITY[task.priority]?.className}`}>{task.priority}</span>
          {task.openBugCount > 0 && <span className="chip bg-ember/20 text-ember">{task.openBugCount} bugs</span>}
        </div>
        <p className="font-medium leading-snug">{task.title}</p>
        <p className="mt-1 text-xs text-paper-200/40">{task.project?.name}</p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex -space-x-2">
            {task.assignees?.slice(0, 3).map((u) => (
              <Avatar key={u._id} user={u} size="sm" />
            ))}
          </div>
          <span className="text-[11px] text-paper-200/40">{task.dueDate ? format(new Date(task.dueDate), 'dd MMM') : ''}</span>
        </div>
      </Link>
    </div>
  );
}

function TaskForm({ projects, users, onClose, onSaved }) {
  const [form, setForm] = useState({
    project: projects[0]?._id || '',
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    tags: '',
    assignees: [],
    estimatedMinutes: 120,
  });
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    try {
      await api.post('/tasks', {
        ...form,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create task');
    }
  }

  return (
    <Modal title="Strike a new task" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <select className="field" value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })}>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
        <input className="field" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <textarea className="field min-h-24" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <select className="field" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            {Object.keys(PRIORITY).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <input type="date" className="field" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
        </div>
        <input className="field" placeholder="Tags, comma separated" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
        <select
          multiple
          className="field h-28"
          value={form.assignees}
          onChange={(e) => setForm({ ...form, assignees: [...e.target.selectedOptions].map((o) => o.value) })}
        >
          {users.map((u) => (
            <option key={u._id} value={u._id}>
              {u.name}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-ember">{error}</p>}
        <button className="btn-copper w-full">Create</button>
      </form>
    </Modal>
  );
}

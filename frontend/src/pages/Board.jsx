import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DndContext, DragOverlay, PointerSensor, TouchSensor, closestCorners, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { addDays, endOfMonth, format, startOfMonth, startOfWeek } from 'date-fns';
import api from '../api/client';
import { PRIORITY, STATUS, TYPES, hours, pretty } from '../lib/labels';
import Avatar from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import DataTable from '../components/DataTable';
import TypeBadge from '../components/TypeBadge';
import RichEditor from '../components/RichEditor';
import SearchSelect, { peopleOptions } from '../components/SearchSelect';

export default function Board() {
  const { isLead } = useAuth();
  const [params, setParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [view, setView] = useState(params.get('view') || 'board');

  useEffect(() => {
    const next = params.get('view') || 'board';
    setView(next);
  }, [params]);
  const [formOpen, setFormOpen] = useState(false);
  const filters = {
    project: params.get('project') || '',
    assignee: params.get('assignee') || '',
    priority: params.get('priority') || '',
    tag: params.get('tag') || '',
    mine: params.get('mine') || '',
    type: params.get('type') || '',
  };

  const [activeId, setActiveId] = useState(null);
  const [moveError, setMoveError] = useState('');
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } })
  );
  const statusIds = STATUS.map((s) => s.id);

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

  function resolveStatus(over) {
    const fromData = over?.data?.current?.status;
    if (statusIds.includes(fromData)) return fromData;
    if (statusIds.includes(over?.id)) return over.id;
    return null;
  }

  async function onDragEnd(event) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const overStatus = resolveStatus(over);
    const task = tasks.find((t) => t._id === active.id);
    if (!task || !overStatus || task.status === overStatus) return;
    const snapshot = tasks;
    setMoveError('');
    setTasks((prev) => prev.map((t) => (t._id === task._id ? { ...t, status: overStatus } : t)));
    try {
      await api.patch(`/tasks/${task._id}/move`, { status: overStatus });
    } catch (err) {
      setTasks(snapshot);
      setMoveError(err.response?.data?.message || 'Could not move task');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-copper-400">Flow</p>
          <h1 className="font-display text-4xl">The board</h1>
          {view === 'board' && (
            <p className="mt-1 text-sm text-paper-200/50">Drag a card into another column to change its status.</p>
          )}
          {moveError && <p className="mt-1 text-sm text-ember">{moveError}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {['board', 'list', 'calendar'].map((v) => (
            <button
              key={v}
              onClick={() => {
                setView(v);
                const next = new URLSearchParams(params);
                if (v === 'board') next.delete('view');
                else next.set('view', v);
                setParams(next);
              }}
              className={view === v ? 'btn-copper' : 'btn-ghost'}
            >
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
        <select className="field" value={filters.type} onChange={(e) => setFilter('type', e.target.value)}>
          <option value="">All types</option>
          {Object.keys(TYPES).map((t) => (
            <option key={t} value={t}>
              {TYPES[t].label}
            </option>
          ))}
        </select>
        <input className="field" placeholder="Label" value={filters.tag} onChange={(e) => setFilter('tag', e.target.value)} />
        <button className={filters.mine ? 'btn-copper' : 'btn-ghost'} onClick={() => setFilter('mine', filters.mine ? '' : 'true')}>
          My work
        </button>
      </div>

      {view === 'calendar' ? (
        <CalendarGrid tasks={tasks} />
      ) : view === 'list' ? (
        <DataTable
          columns={[
            { key: 'key', header: 'Key', render: (t) => <span className="text-brass">{t.key || '—'}</span> },
            { key: 'type', header: 'Type', render: (t) => <TypeBadge type={t.type} /> },
            {
              key: 'title',
              header: 'Summary',
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={({ active }) => setActiveId(active.id)}
          onDragCancel={() => setActiveId(null)}
          onDragEnd={onDragEnd}
        >
          <div className="grid gap-4 xl:grid-cols-5 lg:grid-cols-3 md:grid-cols-2">
            {STATUS.map((col) => (
              <Column key={col.id} col={col} tasks={grouped[col.id]} />
            ))}
          </div>
          <DragOverlay dropAnimation={null}>
            {activeId ? <CardBody task={tasks.find((t) => t._id === activeId)} overlay /> : null}
          </DragOverlay>
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
  const { setNodeRef, isOver } = useDroppable({ id: col.id, data: { status: col.id } });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[420px] rounded-2xl border p-3 transition ${
        isOver ? 'border-copper-500 bg-copper-500/10' : 'border-ink-600 bg-ink-950/40'
      }`}
    >
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <p className="font-display text-xs text-brass">{col.mark}</p>
          <h3 className="text-sm uppercase tracking-[0.16em]">{col.label}</h3>
        </div>
        <span className="text-xs text-paper-200/40">{tasks.length}</span>
      </div>
      <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
        <div className="min-h-[320px] space-y-3">
          {tasks.map((task) => (
            <Card key={task._id} task={task} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

function CardBody({ task, overlay }) {
  if (!task) return null;
  return (
    <div className={`rounded-xl border border-ink-600 bg-ink-800 p-3 shadow-card ${overlay ? 'w-72 rotate-1 shadow-stamp' : ''}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] text-brass">{task.key || 'FRG'}</span>
        <TypeBadge type={task.type} />
      </div>
      <p className="font-medium leading-snug">{task.title}</p>
      <p className="mt-1 text-xs text-paper-200/40">{task.project?.name}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        <span className={`chip ${PRIORITY[task.priority]?.className}`}>{task.priority}</span>
        {task.openBugCount > 0 && <span className="chip bg-ember/20 text-ember">{task.openBugCount}</span>}
        {task.loggedMinutes > 0 && <span className="chip bg-ink-700">{hours(task.loggedMinutes)}</span>}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex -space-x-2">
          {task.assignees?.slice(0, 3).map((u) => (
            <Avatar key={u._id} user={u} size="sm" />
          ))}
        </div>
        <span className="text-[11px] text-paper-200/40">{task.dueDate ? format(new Date(task.dueDate), 'dd MMM') : ''}</span>
      </div>
    </div>
  );
}

function Card({ task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task._id,
    data: { status: task.status },
  });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.35 : 1 };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="cursor-grab touch-none active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <Link
        to={`/tasks/${task._id}`}
        className="block"
        onClick={(e) => {
          if (isDragging) e.preventDefault();
        }}
      >
        <CardBody task={task} />
      </Link>
    </div>
  );
}

function TaskForm({ projects, users, onClose, onSaved }) {
  const [form, setForm] = useState({
    project: projects[0]?._id || '',
    title: '',
    description: '',
    type: 'task',
    priority: 'medium',
    startDate: '',
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
        <RichEditor value={form.description} onChange={(description) => setForm({ ...form, description })} minHeight="8rem" />
        <div className="grid grid-cols-2 gap-3">
          <select className="field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {Object.keys(TYPES).map((t) => (
              <option key={t} value={t}>{TYPES[t].label}</option>
            ))}
          </select>
          <input type="date" className="field" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        </div>
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

function CalendarGrid({ tasks }) {
  const start = startOfWeek(startOfMonth(new Date()), { weekStartsOn: 1 });
  const end = endOfMonth(new Date());
  const days = [];
  for (let d = start; d <= addDays(end, 6 - ((end.getDay() + 6) % 7)); d = addDays(d, 1)) days.push(d);
  return (
    <div className="grid grid-cols-7 gap-2">
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
        <p key={d} className="text-center text-[11px] uppercase tracking-wider text-paper-200/40">{d}</p>
      ))}
      {days.map((day) => {
        const key = format(day, 'yyyy-MM-dd');
        const items = tasks.filter((t) => t.dueDate && format(new Date(t.dueDate), 'yyyy-MM-dd') === key);
        return (
          <div key={key} className="min-h-28 rounded-xl border border-ink-600 bg-ink-950/40 p-2">
            <p className="text-xs text-paper-200/40">{format(day, 'd')}</p>
            {items.map((t) => (
              <Link key={t._id} to={`/tasks/${t._id}`} className="mt-1 block truncate rounded bg-ink-800 px-1.5 py-1 text-[11px] hover:bg-ink-700">
                <span className="text-brass">{t.key}</span> {t.title}
              </Link>
            ))}
          </div>
        );
      })}
    </div>
  );
}

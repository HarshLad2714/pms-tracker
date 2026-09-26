import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Play, Square } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { BUG_STATUS, PRIORITY, SEVERITY, STATUS, TYPES, hours, pretty } from '../lib/labels';
import Avatar from '../components/Avatar';
import Modal from '../components/Modal';
import TypeBadge from '../components/TypeBadge';
import RichEditor, { isEmptyHtml } from '../components/RichEditor';
import SearchSelect, { peopleOptions } from '../components/SearchSelect';

export default function TaskDetail() {
  const { id } = useParams();
  const { user, isLead } = useAuth();
  const [pack, setPack] = useState(null);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('comments');
  const [comment, setComment] = useState('');
  const [bugOpen, setBugOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [running, setRunning] = useState(null);
  const [subTitle, setSubTitle] = useState('');
  const descSave = useRef();
  const descRef = useRef('');

  async function load() {
    const [{ data }, { data: run }, { data: u }] = await Promise.all([
      api.get(`/tasks/${id}`),
      api.get('/time/running'),
      api.get('/users?active=true'),
    ]);
    setPack(data);
    setRunning(run.entry);
    setUsers(u.users);
  }

  useEffect(() => {
    load();
  }, [id]);

  if (!pack) return <p className="text-paper-200/50">Loading issue…</p>;
  const { task, bugs, comments, activities, timeEntries, loggedMinutes, subtasks = [] } = pack;
  descRef.current = task.description || '';
  const assigned = task.assignees.some((a) => a._id === user._id);
  const mineRunning = running?.task?._id === task._id || running?.task === task._id;

  async function patch(body) {
    await api.patch(`/tasks/${task._id}`, body);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm text-paper-200/50">
        <Link to={`/projects/${task.project?._id}`} className="hover:text-brass">
          {task.project?.name}
        </Link>
        <span>/</span>
        <span className="text-brass">{task.key || 'FRG'}</span>
        {task.parent && (
          <>
            <span>/</span>
            <Link to={`/tasks/${task.parent._id}`} className="hover:text-brass">
              Parent {task.parent.key}
            </Link>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <TypeBadge type={task.type} />
            <span className={`chip ${PRIORITY[task.priority]?.className}`}>{task.priority}</span>
          </div>
          <input
            className="w-full bg-transparent font-display text-4xl outline-none"
            defaultValue={task.title}
            key={task.title}
            onBlur={(e) => e.target.value !== task.title && patch({ title: e.target.value })}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(assigned || isLead) && (
            <button className={mineRunning ? 'btn-ghost' : 'btn-copper'} onClick={async () => {
              if (mineRunning) await api.post('/time/stop');
              else await api.post('/time/start', { taskId: task._id });
              load();
            }}>
              {mineRunning ? <Square size={14} /> : <Play size={14} />}
              {mineRunning ? 'Stop' : 'Log time'}
            </button>
          )}
          {(assigned || isLead) && (
            <button className="btn-ghost" onClick={() => setManualOpen(true)}>
              Manual
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <section className="panel p-5">
            <p className="label">Description</p>
            <RichEditor
              key={task._id}
              value={task.description}
              onChange={(html) => {
                clearTimeout(descSave.current);
                descSave.current = setTimeout(() => {
                  const next = isEmptyHtml(html) ? '' : html;
                  if (next !== descRef.current) patch({ description: next });
                }, 700);
              }}
              onBlur={(html) => {
                clearTimeout(descSave.current);
                const next = isEmptyHtml(html) ? '' : html;
                if (next !== descRef.current) patch({ description: next });
              }}
            />
          </section>

          <div className="flex flex-wrap gap-2">
            {['comments', 'bugs', 'subtasks', 'activity'].map((t) => (
              <button key={t} className={tab === t ? 'btn-copper' : 'btn-ghost'} onClick={() => setTab(t)}>
                {t}
                {t === 'bugs' && bugs.length ? ` ${bugs.length}` : ''}
                {t === 'subtasks' && subtasks.length ? ` ${subtasks.length}` : ''}
              </button>
            ))}
          </div>

          {tab === 'comments' && (
            <section className="panel p-5">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!comment.trim()) return;
                  await api.post(`/tasks/${task._id}/comments`, { body: comment });
                  setComment('');
                  load();
                }}
                className="mb-4 flex gap-2"
              >
                <input className="field" placeholder="Add a comment…" value={comment} onChange={(e) => setComment(e.target.value)} />
                <button className="btn-copper">Comment</button>
              </form>
              <div className="space-y-4">
                {comments.map((c) => (
                  <div key={c._id} className="flex gap-3">
                    <Avatar user={c.user} />
                    <div>
                      <p className="text-sm">
                        {c.user?.name} <span className="text-paper-200/40">{format(new Date(c.createdAt), 'dd MMM HH:mm')}</span>
                      </p>
                      <p>{c.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {tab === 'bugs' && (
            <section className="space-y-3">
              <button className="btn-copper" onClick={() => setBugOpen(true)}>
                Log a bug
              </button>
              {bugs.map((b) => (
                <BugCard key={b._id} bug={b} onChange={load} />
              ))}
            </section>
          )}

          {tab === 'subtasks' && (
            <section className="panel p-5 space-y-3">
              <form
                className="flex gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!subTitle.trim()) return;
                  await api.post('/tasks', {
                    project: task.project?._id || task.project,
                    title: subTitle,
                    parent: task._id,
                    type: 'task',
                    assignees: task.assignees.map((a) => a._id),
                  });
                  setSubTitle('');
                  load();
                }}
              >
                <input className="field" placeholder="Add a subtask" value={subTitle} onChange={(e) => setSubTitle(e.target.value)} />
                <button className="btn-copper">Add</button>
              </form>
              {subtasks.map((s) => (
                <Link key={s._id} to={`/tasks/${s._id}`} className="flex items-center justify-between rounded-xl bg-ink-900 px-3 py-2 hover:bg-ink-700">
                  <span>
                    <span className="mr-2 text-xs text-brass">{s.key}</span>
                    {s.title}
                  </span>
                  <span className="text-xs text-paper-200/50">{pretty(s.status)}</span>
                </Link>
              ))}
            </section>
          )}

          {tab === 'activity' && (
            <section className="panel space-y-3 p-5">
              {activities.map((a) => (
                <p key={a._id} className="text-sm text-paper-200/70">
                  <span className="text-paper-50">{a.user?.name}</span> {a.message}
                  <span className="ml-2 text-xs text-paper-200/40">{format(new Date(a.createdAt), 'dd MMM HH:mm')}</span>
                </p>
              ))}
            </section>
          )}
        </div>

        <aside className="space-y-3">
          <div className="panel space-y-3 p-4">
            <Field label="Status">
              <select className="field" value={task.status} onChange={(e) => api.patch(`/tasks/${task._id}/move`, { status: e.target.value }).then(load)}>
                {STATUS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Type">
              <select className="field" value={task.type || 'task'} onChange={(e) => patch({ type: e.target.value })}>
                {Object.keys(TYPES).map((t) => (
                  <option key={t} value={t}>
                    {TYPES[t].label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Priority">
              <select className="field" value={task.priority} onChange={(e) => patch({ priority: e.target.value })}>
                {Object.keys(PRIORITY).map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY[p].label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Assignee">
              <SearchSelect
                options={peopleOptions(users)}
                value={task.assignees.map((a) => a._id)}
                onChange={(assignees) => patch({ assignees })}
                placeholder="Select assignees"
              />
            </Field>
            <Field label="Start">
              <input type="date" className="field" value={task.startDate ? task.startDate.slice(0, 10) : ''} onChange={(e) => patch({ startDate: e.target.value })} />
            </Field>
            <Field label="Due">
              <input type="date" className="field" value={task.dueDate ? task.dueDate.slice(0, 10) : ''} onChange={(e) => patch({ dueDate: e.target.value })} />
            </Field>
            <Field label="Labels">
              <input
                key={`${task._id}-tags`}
                className="field"
                defaultValue={(task.tags || []).join(', ')}
                onBlur={(e) => patch({ tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })}
              />
            </Field>
            <Field label="Estimate (min)">
              <input
                key={`${task._id}-estimate`}
                type="number"
                className="field"
                defaultValue={task.estimatedMinutes}
                onBlur={(e) => patch({ estimatedMinutes: Number(e.target.value) })}
              />
            </Field>
            <Field label="Watchers">
              <SearchSelect
                options={peopleOptions(users)}
                value={(task.watchers || []).map((w) => w._id || w)}
                onChange={(watchers) => patch({ watchers })}
                placeholder="Add watchers"
              />
              <button
                type="button"
                className="mt-2 text-xs text-brass"
                onClick={() => {
                  const ids = (task.watchers || []).map((w) => w._id || w);
                  const mine = user._id;
                  patch({ watchers: ids.includes(mine) ? ids.filter((id) => id !== mine) : [...ids, mine] });
                }}
              >
                {(task.watchers || []).some((w) => (w._id || w) === user._id) ? 'Unwatch' : 'Watch'}
              </button>
            </Field>
            <p className="text-xs text-paper-200/50">Reporter {task.createdBy?.name}</p>
          </div>
          <div className="panel p-4">
            <p className="label">Time tracked</p>
            <p className="font-display text-3xl">{hours(loggedMinutes)}</p>
            {task.estimatedMinutes > 0 && <p className="mt-1 text-xs text-paper-200/50">vs estimate {hours(task.estimatedMinutes)}</p>}
          </div>
          <div className="panel p-4">
            <p className="label">Attachments</p>
            <input
              type="file"
              multiple
              className="mt-2 text-xs"
              onChange={async (e) => {
                const files = [...(e.target.files || [])];
                if (!files.length) return;
                const fd = new FormData();
                files.forEach((f) => fd.append('files', f));
                const { data } = await api.post('/uploads', fd);
                await patch({ attachments: [...(task.attachments || []), ...data.files] });
              }}
            />
            {(task.attachments || []).map((f) => (
              <a key={f.filename} href={f.url} target="_blank" rel="noreferrer" className="mt-2 block text-sm text-brass">
                {f.originalName}
              </a>
            ))}
          </div>
          <div className="panel p-4">
            <p className="label">Work log</p>
            {timeEntries.map((e) => (
              <div key={e._id} className="flex justify-between text-sm text-paper-200/70">
                <span>{e.user?.name}</span>
                <span>{e.isRunning ? 'live' : hours(e.durationMinutes)}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {bugOpen && <BugForm taskId={task._id} assignees={task.assignees} onClose={() => setBugOpen(false)} onSaved={() => { setBugOpen(false); load(); }} />}
      {manualOpen && <ManualTime taskId={task._id} onClose={() => setManualOpen(false)} onSaved={() => { setManualOpen(false); load(); }} />}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p className="label">{label}</p>
      {children}
    </div>
  );
}

function BugCard({ bug, onChange }) {
  const [thread, setThread] = useState(false);
  const [body, setBody] = useState('');
  const [comments, setComments] = useState([]);

  async function open() {
    const { data } = await api.get(`/bugs/${bug._id}`);
    setComments(data.comments);
    setThread(true);
  }

  return (
    <div className="panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs uppercase tracking-wider ${SEVERITY[bug.severity]?.className}`}>{bug.severity}</p>
          <h3 className="mt-1 text-lg">{bug.title}</h3>
          <p className="text-sm text-paper-200/60">{bug.description}</p>
        </div>
        <select className="field w-36" value={bug.status} onChange={async (e) => { await api.patch(`/bugs/${bug._id}`, { status: e.target.value }); onChange(); }}>
          {BUG_STATUS.map((s) => (
            <option key={s} value={s}>{pretty(s)}</option>
          ))}
        </select>
      </div>
      {(bug.screenshots || []).map((s) => (
        <a key={s.filename} href={s.url} target="_blank" rel="noreferrer" className="mt-2 block text-xs text-brass">
          {s.originalName}
        </a>
      ))}
      <button className="mt-3 text-xs text-brass" onClick={open}>Thread</button>
      {thread && (
        <div className="mt-3 space-y-2">
          {comments.map((c) => (
            <p key={c._id} className="text-sm"><span className="text-paper-200/50">{c.user?.name}: </span>{c.body}</p>
          ))}
          <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); await api.post(`/bugs/${bug._id}/comments`, { body }); setBody(''); open(); }}>
            <input className="field" value={body} onChange={(e) => setBody(e.target.value)} />
            <button className="btn-ghost">Add</button>
          </form>
        </div>
      )}
    </div>
  );
}

function BugForm({ taskId, assignees, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    severity: 'medium',
    stepsToReproduce: '',
    assignedTo: assignees[0]?._id || '',
    screenshots: [],
  });

  async function submit(e) {
    e.preventDefault();
    await api.post(`/tasks/${taskId}/bugs`, form);
    onSaved();
  }

  return (
    <Modal title="Log a defect" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <input className="field" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <textarea className="field min-h-20" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <textarea className="field min-h-20" placeholder="Steps to reproduce" value={form.stepsToReproduce} onChange={(e) => setForm({ ...form, stepsToReproduce: e.target.value })} />
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={async (e) => {
            const files = [...(e.target.files || [])];
            if (!files.length) return;
            const fd = new FormData();
            files.forEach((f) => fd.append('files', f));
            const { data } = await api.post('/uploads', fd);
            setForm((f) => ({ ...f, screenshots: data.files }));
          }}
        />
        <div className="grid grid-cols-2 gap-3">
          <select className="field" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
            {Object.keys(SEVERITY).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="field" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
            {assignees.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
          </select>
        </div>
        <button className="btn-copper w-full">Log bug</button>
      </form>
    </Modal>
  );
}

function ManualTime({ taskId, onClose, onSaved }) {
  const [minutes, setMinutes] = useState(60);
  const [note, setNote] = useState('');
  return (
    <Modal title="Manual time" onClose={onClose}>
      <form onSubmit={async (e) => { e.preventDefault(); await api.post('/time/manual', { taskId, durationMinutes: Number(minutes), note }); onSaved(); }} className="space-y-3">
        <input type="number" className="field" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        <input className="field" placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} />
        <button className="btn-copper w-full">Save time</button>
      </form>
    </Modal>
  );
}

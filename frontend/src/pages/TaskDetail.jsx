import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Play, Square } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { BUG_STATUS, PRIORITY, SEVERITY, STATUS, hours, pretty } from '../lib/labels';
import Avatar from '../components/Avatar';
import Modal from '../components/Modal';

export default function TaskDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [pack, setPack] = useState(null);
  const [tab, setTab] = useState('work');
  const [comment, setComment] = useState('');
  const [bugOpen, setBugOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [running, setRunning] = useState(null);

  async function load() {
    const [{ data }, { data: run }] = await Promise.all([api.get(`/tasks/${id}`), api.get('/time/running')]);
    setPack(data);
    setRunning(run.entry);
  }

  useEffect(() => {
    load();
  }, [id]);

  if (!pack) return null;
  const { task, bugs, comments, activities, timeEntries, loggedMinutes } = pack;
  const assigned = task.assignees.some((a) => a._id === user._id);
  const mineRunning = running?.task?._id === task._id || running?.task === task._id;

  async function changeStatus(status) {
    await api.patch(`/tasks/${id}/move`, { status });
    load();
  }

  async function addComment(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    await api.post(`/tasks/${id}/comments`, { body: comment });
    setComment('');
    load();
  }

  async function toggleTimer() {
    if (mineRunning) await api.post('/time/stop');
    else await api.post('/time/start', { taskId: id });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to={`/projects/${task.project?._id}`} className="text-xs uppercase tracking-[0.25em] text-copper-400">
            {task.project?.name}
          </Link>
          <h1 className="font-display text-4xl">{task.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`chip ${PRIORITY[task.priority]?.className}`}>{task.priority}</span>
            {task.tags.map((t) => (
              <span key={t} className="chip bg-ink-700 text-paper-200">
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {assigned && (
            <button className={mineRunning ? 'btn-ghost' : 'btn-copper'} onClick={toggleTimer}>
              {mineRunning ? <Square size={14} /> : <Play size={14} />}
              {mineRunning ? 'Stop timer' : 'Start timer'}
            </button>
          )}
          {assigned && (
            <button className="btn-ghost" onClick={() => setManualOpen(true)}>
              Manual time
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="panel p-5">
            <p className="whitespace-pre-wrap text-paper-200/80">{task.description || 'No brief yet.'}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {STATUS.map((s) => (
                <button key={s.id} onClick={() => changeStatus(s.id)} className={task.status === s.id ? 'btn-copper' : 'btn-ghost'}>
                  {s.label}
                </button>
              ))}
            </div>
          </section>

          <div className="flex gap-2">
            {['work', 'bugs', 'activity'].map((t) => (
              <button key={t} className={tab === t ? 'btn-copper' : 'btn-ghost'} onClick={() => setTab(t)}>
                {t}
              </button>
            ))}
          </div>

          {tab === 'work' && (
            <section className="panel p-5">
              <form onSubmit={addComment} className="mb-4 flex gap-2">
                <input className="field" placeholder="Leave a mark on this task" value={comment} onChange={(e) => setComment(e.target.value)} />
                <button className="btn-copper">Post</button>
              </form>
              <div className="space-y-4">
                {comments.map((c) => (
                  <div key={c._id} className="flex gap-3">
                    <Avatar user={c.user} />
                    <div>
                      <p className="text-sm">
                        {c.user?.name} <span className="text-paper-200/40">{format(new Date(c.createdAt), 'dd MMM HH:mm')}</span>
                      </p>
                      <p className="text-paper-100">{c.body}</p>
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

          {tab === 'activity' && (
            <section className="panel p-5 space-y-3">
              {activities.map((a) => (
                <p key={a._id} className="text-sm text-paper-200/70">
                  <span className="text-paper-50">{a.user?.name}</span> {a.message}
                  <span className="ml-2 text-xs text-paper-200/40">{format(new Date(a.createdAt), 'dd MMM HH:mm')}</span>
                </p>
              ))}
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="panel p-4">
            <p className="label">Time on this piece</p>
            <p className="font-display text-3xl">{hours(loggedMinutes)}</p>
            {task.estimatedMinutes > 0 && (
              <p className="mt-1 text-xs text-paper-200/50">Estimate {hours(task.estimatedMinutes)}</p>
            )}
          </div>
          <div className="panel p-4">
            <p className="label">Assignees</p>
            <div className="space-y-2">
              {task.assignees.map((a) => (
                <div key={a._id} className="flex items-center gap-2">
                  <Avatar user={a} size="sm" />
                  <span>{a.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="panel p-4">
            <p className="label">Due</p>
            <p>{task.dueDate ? format(new Date(task.dueDate), 'dd MMM yyyy') : 'Open'}</p>
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
                await api.patch(`/tasks/${id}`, { attachments: [...(task.attachments || []), ...data.files] });
                load();
              }}
            />
            <div className="mt-3 space-y-2">
              {(task.attachments || []).map((f) => (
                <a key={f.filename} href={f.url} target="_blank" rel="noreferrer" className="block text-sm text-brass">
                  {f.originalName}
                </a>
              ))}
            </div>
          </div>
          <div className="panel p-4">
            <p className="label">Sessions</p>
            <div className="space-y-2 text-sm">
              {timeEntries.map((e) => (
                <div key={e._id} className="flex justify-between text-paper-200/70">
                  <span>{e.user?.name}</span>
                  <span>{e.isRunning ? 'live' : hours(e.durationMinutes)}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {bugOpen && <BugForm taskId={id} assignees={task.assignees} onClose={() => setBugOpen(false)} onSaved={() => { setBugOpen(false); load(); }} />}
      {manualOpen && <ManualTime taskId={id} onClose={() => setManualOpen(false)} onSaved={() => { setManualOpen(false); load(); }} />}
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
        <select
          className="field w-36"
          value={bug.status}
          onChange={async (e) => {
            await api.patch(`/bugs/${bug._id}`, { status: e.target.value });
            onChange();
          }}
        >
          {BUG_STATUS.map((s) => (
            <option key={s} value={s}>
              {pretty(s)}
            </option>
          ))}
        </select>
      </div>
      <button className="mt-3 text-xs text-brass" onClick={open}>
        Thread
      </button>
      {thread && (
        <div className="mt-3 space-y-2">
          {comments.map((c) => (
            <p key={c._id} className="text-sm">
              <span className="text-paper-200/50">{c.user?.name}: </span>
              {c.body}
            </p>
          ))}
          <form
            className="flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              await api.post(`/bugs/${bug._id}/comments`, { body });
              setBody('');
              open();
            }}
          >
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
  });

  async function submit(e) {
    e.preventDefault();
    await api.post(`/tasks/${taskId}/bugs`, form);
    onSaved();
  }

  return (
    <Modal title="Log a defect" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <input className="field" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <textarea className="field min-h-20" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <textarea className="field min-h-20" placeholder="Steps to reproduce" value={form.stepsToReproduce} onChange={(e) => setForm({ ...form, stepsToReproduce: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <select className="field" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
            {Object.keys(SEVERITY).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select className="field" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
            {assignees.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
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
  async function submit(e) {
    e.preventDefault();
    await api.post('/time/manual', { taskId, durationMinutes: Number(minutes), note });
    onSaved();
  }
  return (
    <Modal title="Manual heat" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <input type="number" className="field" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        <input className="field" placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} />
        <button className="btn-copper w-full">Save time</button>
      </form>
    </Modal>
  );
}

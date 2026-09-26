import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format } from 'date-fns';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { hours, pretty } from '../lib/labels';
import Avatar from '../components/Avatar';

export default function Dashboard() {
  const { user, isLead } = useAuth();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data: payload } = await api.get('/dashboard');
    setData(payload);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleClock() {
    setBusy(true);
    try {
      if (data?.me?.attendance?.clockIn && !data.me.attendance.clockOut) {
        await api.post('/attendance/clock-out');
      } else if (!data?.me?.attendance) {
        await api.post('/attendance/clock-in');
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <p className="text-paper-200/60">Heating the floor…</p>;

  const clocked = data.me.attendance?.clockIn && !data.me.attendance.clockOut;
  const statusData = (data.lead?.tasksByStatus || []).map((r) => ({ name: pretty(r._id), count: r.count }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-copper-400">Your work</p>
          <h1 className="font-display text-4xl md:text-5xl">Good forge, {user.name.split(' ')[0]}.</h1>
        </div>
        <button disabled={busy || data.me.attendance?.clockOut} className={clocked ? 'btn-ghost' : 'btn-copper'} onClick={toggleClock}>
          {data.me.attendance?.clockOut ? 'Day sealed' : clocked ? 'Clock out' : 'Clock in'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Today on the clock" value={hours(data.me.todayMinutes)} hint={clocked ? 'Live session' : 'Logged'} />
        <Stat label="Open tasks" value={data.me.tasks.length} hint="Assigned to you" />
        <Stat label="Open bugs" value={data.me.bugs.length} hint="Waiting on you" />
        <Stat
          label="Running timer"
          value={data.me.running ? 'Live' : 'Idle'}
          hint={data.me.running?.task?.title || 'No heat'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="panel p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl">Your bench</h2>
            <Link to="/board?mine=1" className="text-sm text-brass">
              My tasks
            </Link>
          </div>
          <div className="space-y-3">
            {data.me.tasks.map((t) => (
              <Link key={t._id} to={`/tasks/${t._id}`} className="flex items-center justify-between rounded-xl bg-ink-900/70 px-3 py-3 hover:bg-ink-700">
                <div>
                  <p>{t.title}</p>
                  <p className="text-xs text-paper-200/50">{t.project?.name} · {pretty(t.status)}</p>
                </div>
                <span className="text-xs text-copper-400">{t.dueDate ? format(new Date(t.dueDate), 'dd MMM') : '—'}</span>
              </Link>
            ))}
            {data.me.tasks.length === 0 && <p className="text-sm text-paper-200/50">Nothing on the anvil.</p>}
          </div>
        </section>

        <section className="panel p-5 lg:col-span-2">
          <h2 className="mb-4 font-display text-2xl">Bugs on you</h2>
          <div className="space-y-3">
            {data.me.bugs.map((b) => (
              <Link key={b._id} to={`/tasks/${b.task?._id || ''}`} className="block rounded-xl bg-ink-900/70 px-3 py-3">
                <p>{b.title}</p>
                <p className="text-xs uppercase tracking-wider text-ember">{b.severity}</p>
              </Link>
            ))}
            {data.me.bugs.length === 0 && <p className="text-sm text-paper-200/50">No open defects.</p>}
          </div>
        </section>
      </div>

      {isLead && data.lead && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="panel p-5">
            <h2 className="mb-4 font-display text-2xl">Flow across the shop</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <XAxis dataKey="name" stroke="#c9b89a" fontSize={11} />
                  <YAxis stroke="#c9b89a" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#1c1812', border: '1px solid #3d3428' }} />
                  <Bar dataKey="count" fill="#d46a2f" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl">Who is in</h2>
              <p className="text-sm text-paper-200/50">
                {data.lead.clockedIn}/{data.lead.totalToday} on floor
              </p>
            </div>
            <div className="space-y-2">
              {data.lead.attendanceToday.map((a) => (
                <div key={a._id} className="flex items-center justify-between rounded-xl bg-ink-900/70 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Avatar user={a.user} size="sm" />
                    <span>{a.user?.name}</span>
                  </div>
                  <span className="text-xs text-brass">{a.clockOut ? 'Out' : 'In'}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="panel p-5 lg:col-span-2">
            <h2 className="mb-4 font-display text-2xl">Hours with the most heat</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {data.lead.topTasks.map((row) => (
                <div key={row.task?._id || Math.random()} className="rounded-xl bg-ink-900/70 p-3">
                  <p>{row.task?.title || 'Removed task'}</p>
                  <p className="text-xs text-paper-200/50">{row.task?.project?.name}</p>
                  <p className="mt-2 text-copper-400">{hours(row.minutes)}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="panel p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-paper-200/50">{label}</p>
      <p className="mt-2 font-display text-3xl">{value}</p>
      <p className="mt-1 text-xs text-paper-200/50">{hint}</p>
    </div>
  );
}

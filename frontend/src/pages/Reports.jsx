import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import api from '../api/client';
import { hours, pretty } from '../lib/labels';
import DataTable from '../components/DataTable';

export default function Reports() {
  const [tab, setTab] = useState('attendance');
  const [range, setRange] = useState('weekly');
  const [attendance, setAttendance] = useState([]);
  const [timeRows, setTimeRows] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [lateOnly, setLateOnly] = useState(false);
  const [taskStatus, setTaskStatus] = useState('');

  async function load() {
    if (tab === 'attendance') {
      const { data } = await api.get(`/reports/attendance?range=${range}`);
      setAttendance(data.records);
    } else if (tab === 'time') {
      const { data } = await api.get(`/reports/time?range=${range}&group=task`);
      setTimeRows(data.rows);
    } else {
      const { data } = await api.get('/reports/tasks');
      setTasks(data.tasks);
    }
  }

  useEffect(() => {
    load();
  }, [tab, range]);

  const attendanceRows = useMemo(
    () => (lateOnly ? attendance.filter((r) => r.isLate) : attendance),
    [attendance, lateOnly]
  );
  const taskRows = useMemo(
    () => (taskStatus ? tasks.filter((t) => t.status === taskStatus) : tasks),
    [tasks, taskStatus]
  );

  const attendanceCols = [
    { key: 'name', header: 'Name', exportValue: (r) => r.user?.name, render: (r) => r.user?.name || '—' },
    { key: 'email', header: 'Email', exportValue: (r) => r.user?.email, render: (r) => r.user?.email || '—' },
    { key: 'date', header: 'Date' },
    { key: 'hours', header: 'Hours', exportValue: (r) => hours(r.totalMinutes), render: (r) => hours(r.totalMinutes) },
    { key: 'late', header: 'Late', exportValue: (r) => (r.isLate ? 'yes' : 'no'), render: (r) => (r.isLate ? 'yes' : 'no') },
  ];

  const timeCols = [
    { key: 'id', header: 'Group', exportValue: (r) => String(r._id), render: (r) => String(r._id).slice(-8) },
    { key: 'minutes', header: 'Time', exportValue: (r) => hours(r.minutes), render: (r) => hours(r.minutes) },
    { key: 'sessions', header: 'Sessions' },
  ];

  const taskCols = [
    { key: 'title', header: 'Task' },
    { key: 'project', header: 'Project', exportValue: (t) => t.project?.name, render: (t) => t.project?.name || '—' },
    { key: 'status', header: 'Status', exportValue: (t) => pretty(t.status), render: (t) => pretty(t.status) },
    { key: 'priority', header: 'Priority' },
    {
      key: 'dueDate',
      header: 'Due',
      exportValue: (t) => (t.dueDate ? format(new Date(t.dueDate), 'yyyy-MM-dd') : ''),
      render: (t) => (t.dueDate ? format(new Date(t.dueDate), 'dd MMM yyyy') : 'open'),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-copper-400">Ledger</p>
        <h1 className="font-display text-4xl">Reports</h1>
      </div>
      <div className="flex flex-wrap gap-2">
        {['attendance', 'time', 'tasks'].map((t) => (
          <button key={t} className={tab === t ? 'btn-copper' : 'btn-ghost'} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'attendance' && (
        <DataTable
          columns={attendanceCols}
          rows={attendanceRows}
          searchKeys={['date', (r) => r.user?.name, (r) => r.user?.email]}
          searchPlaceholder="Search name or date…"
          filename={`attendance-${range}`}
          filters={
            <>
              <select className="field w-36" value={range} onChange={(e) => setRange(e.target.value)}>
                <option value="daily">daily</option>
                <option value="weekly">weekly</option>
                <option value="monthly">monthly</option>
              </select>
              <button type="button" className={lateOnly ? 'btn-copper' : 'btn-ghost'} onClick={() => setLateOnly((v) => !v)}>
                Late only
              </button>
            </>
          }
        />
      )}

      {tab === 'time' && (
        <DataTable
          columns={timeCols}
          rows={timeRows}
          searchKeys={[(r) => String(r._id), (r) => String(r.minutes), (r) => String(r.sessions)]}
          searchPlaceholder="Search group or hours…"
          filename={`time-${range}`}
          filters={
            <>
              <select className="field w-36" value={range} onChange={(e) => setRange(e.target.value)}>
                <option value="daily">daily</option>
                <option value="weekly">weekly</option>
                <option value="monthly">monthly</option>
              </select>
              <select
                className="field w-36"
                defaultValue="task"
                onChange={async (e) => {
                  const { data } = await api.get(`/reports/time?range=${range}&group=${e.target.value}`);
                  setTimeRows(data.rows);
                }}
              >
                <option value="task">by task</option>
                <option value="user">by person</option>
                <option value="project">by project</option>
              </select>
            </>
          }
        />
      )}

      {tab === 'tasks' && (
        <DataTable
          columns={taskCols}
          rows={taskRows}
          searchKeys={['title', 'priority', (t) => t.project?.name, (t) => pretty(t.status)]}
          searchPlaceholder="Search task or project…"
          filename="tasks"
          filters={
            <select className="field w-40" value={taskStatus} onChange={(e) => setTaskStatus(e.target.value)}>
              <option value="">All status</option>
              <option value="todo">to do</option>
              <option value="in_progress">in progress</option>
              <option value="in_review">in review</option>
              <option value="qa">qa</option>
              <option value="done">done</option>
            </select>
          }
        />
      )}
    </div>
  );
}
